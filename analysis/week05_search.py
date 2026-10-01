"""Week 5 · A Marvel search engine in 20 lines.

Question: Can a Bag-of-Words search find the right Marvel page from a description?

Owner: Àngela
Page section: src/app/(week05)/weeks/week05/page.tsx#search
Output: public/weeks/week05/data/search.json (the scored queries)
        public/weeks/week05/data/search_live.json (the same model, for the search box)

Method
- Tokens: runs of letters and digits in any alphabet ("Araña" stays whole), an
  inner apostrophe kept ("t'challa"), lowercased; hyphens split words, so
  "Spider-Man" is "spider" and "man".
- Bag of Words: every page and every query becomes a vector of token counts over
  the corpus vocabulary; the 303 page vectors are the rows of the document-term
  matrix.
- Cosine similarity ranks the pages for a query: the dot product of the two
  count vectors divided by both their lengths. Ties break on the node_id, the
  same rule the page's search box uses.
- Two runs: raw counts, and counts with spaCy's English stoplist removed (326
  words; sklearn's list would drop "bill" from "Beta Ray Bill"). The search box
  on the page runs the second model on the same vocabulary.
- Twelve queries with a target page each, chosen by us. The brief's own example,
  "Norse god of thunder", has no target in this snapshot: the category holds no
  page for Thor, so it is reported but left out of the hit rates.
- Baselines: a random ranking puts the target first with probability 1/303 and
  in the top five with 5/303; a binomial test gives each hit count a p-value.
- Why a query misses, from the data: the target shares no content word with
  the query; or a page much shorter than the target wins, because dividing by
  the vector's length favours short pages; or another page shares the query's
  words as often (a rival).

    python analysis/week05_search.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
from scipy.stats import binomtest
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from spacy.lang.en.stop_words import STOP_WORDS

from check_pages import check
from week05_text import nodes, pages

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "weeks" / "week05" / "data" / "search.json"
LIVE_OUT = ROOT / "public" / "weeks" / "week05" / "data" / "search_live.json"
TOP = 5
LIVE_TOP = 8           # rows the search box lists
SHORT_RATIO = 3        # a top hit this many times shorter than the target is a short-page win

# The queries and the page each one should find. Thor, Loki and the main Iron
# Man page are not in the category snapshot, so the brief's example has none.
QUERIES = [
    {"id": "thunder", "query": "Norse god of thunder", "expected": None,
     "why_expected": "The brief's own example. The snapshot has no page for Thor, so no page is right."},
    {"id": "bill", "query": "alien champion who wields Mjolnir", "expected": "Beta_Ray_Bill",
     "why_expected": "Beta Ray Bill is the alien who lifts Thor's hammer."},
    {"id": "wolverine", "query": "Canadian mutant with adamantium claws", "expected": "Wolverine_(character)",
     "why_expected": "Adamantium claws belong to Wolverine."},
    {"id": "spider", "query": "bitten by a radioactive spider", "expected": "Spider-Man",
     "why_expected": "The origin story most readers know."},
    {"id": "strange", "query": "sorcerer supreme of Earth", "expected": "Doctor_Strange",
     "why_expected": "Sorcerer Supreme is Doctor Strange's title."},
    {"id": "deadpool", "query": "mercenary who breaks the fourth wall", "expected": "Deadpool",
     "why_expected": "Breaking the fourth wall is Deadpool's trademark."},
    {"id": "blackpanther", "query": "king of Wakanda", "expected": "Black_Panther_(character)",
     "why_expected": "Black Panther is the king of Wakanda."},
    {"id": "hulk", "query": "scientist who turns into a green giant when angry", "expected": "Hulk",
     "why_expected": "Bruce Banner turns into the Hulk when angry."},
    {"id": "storm", "query": "weather-controlling mutant from Kenya", "expected": "Storm_(Marvel_Comics)",
     "why_expected": "Storm controls the weather and grew up in Kenya."},
    {"id": "witch", "query": "chaos magic reality warping mutant twin", "expected": "Scarlet_Witch",
     "why_expected": "Chaos magic and reality warping are Scarlet Witch's powers; Quicksilver is her twin."},
    {"id": "venom", "query": "alien symbiote that bonds with Eddie Brock", "expected": "Venom_(character)",
     "why_expected": "Venom is the symbiote that bonds with Eddie Brock."},
    {"id": "moon", "query": "mercenary who becomes a moon-themed vigilante", "expected": "Moon_Knight",
     "why_expected": "Moon Knight is the moon-themed vigilante."},
]

TOKEN_RE = re.compile(r"[^\W_]+(?:['’][^\W_]+)?")
TOKEN_RULE = ("runs of letters and digits in any alphabet, an inner apostrophe kept, lowercased; "
              "hyphens and other punctuation split words")


def tokenize(text: str) -> list[str]:
    return [t.replace("’", "'") for t in TOKEN_RE.findall(text.lower())]


# spaCy's stoplist, keeping the words this tokeniser can produce ("n't" and "'d" cannot).
STOP = frozenset(w for w in (s.lower() for s in STOP_WORDS) if tokenize(w) == [w])


def vectorizer(stop: bool) -> CountVectorizer:
    return CountVectorizer(tokenizer=tokenize, preprocessor=None, token_pattern=None, lowercase=False,
                           stop_words=sorted(STOP) if stop else None)


def ranked(sims: np.ndarray) -> np.ndarray:
    """Page indices, best first; ties (equal cosine) in node_id order."""
    return np.lexsort((np.arange(len(sims)), -sims))


def overlap(q_vec, page_vec, vocab: list[str], k: int = 8) -> list[dict]:
    """The words a query and a page share, largest contribution to the dot product first."""
    q, p = q_vec.toarray().ravel(), page_vec.toarray().ravel()
    contrib = q * p
    out = []
    for i in np.lexsort((np.arange(len(contrib)), -contrib)):
        if contrib[i] <= 0 or len(out) == k:
            break
        out.append({"term": vocab[i], "query": int(q[i]), "page": int(p[i]), "product": int(contrib[i]),
                    "is_stop": vocab[i] in STOP})
    return out


def rank_query(q_vec, matrix, ids, vocab, names, length, k=TOP):
    sims = cosine_similarity(q_vec, matrix).ravel()
    order = ranked(sims)
    rank_of = {ids[i]: int(r + 1) for r, i in enumerate(order)}
    top = [{"node_id": ids[i], "name": names[ids[i]], "cosine": round(float(sims[i]), 4),
            "n_tokens": int(length[ids[i]]), "overlap_terms": overlap(q_vec, matrix.getrow(i), vocab)}
           for i in order[:k]]
    return sims, rank_of, top


def reason(expected, top, expected_overlap, length, names):
    """Why the target lost, from the data: (kind, sentence)."""
    content = [o["term"] for o in expected_overlap if not o["is_stop"]]
    winner = top[0]
    if expected is None:
        return "no_target", (f"No page in the snapshot is right. {winner['name']} wins on "
                             f"{', '.join(o['term'] for o in winner['overlap_terms'][:3])}.")
    if not content:
        return "no_shared_word", (f"{names[expected]}'s page uses none of the query's content words, "
                                  f"so no count-based search can find it.")
    if length[expected] >= SHORT_RATIO * winner["n_tokens"]:
        return "short_page", (f"{winner['name']} ({winner['n_tokens']:,} words) beats {names[expected]} "
                              f"({length[expected]:,} words): cosine divides by the vector's length, so a "
                              f"short page with the same words scores higher.")
    shared = [o["term"] for o in winner["overlap_terms"] if not o["is_stop"]][:3]
    return "rival", (f"{winner['name']} ({winner['n_tokens']:,} words) is not a short page, and it scores "
                     f"higher than {names[expected]} on {', '.join(shared) or 'stopwords alone'}.")


def passage(text: str, terms: list[str], width: int = 260) -> str:
    """A sentence-bounded passage around the first whole-word match of a term."""
    for term in terms:
        m = re.search(rf"(?<![^\W_]){re.escape(term)}(?![^\W_])", text, re.I)
        if m:
            # The sentence around the match: from the last full stop or line break before
            # it to the next one after it.
            stop, line = text.rfind(". ", 0, m.start()), text.rfind("\n", 0, m.start())
            start = max(stop + 2 if stop >= 0 else 0, line + 1 if line >= 0 else 0)
            ends = [i for i in (text.find(". ", m.end()), text.find("\n", m.end())) if i >= 0]
            end = min(ends) + 1 if ends else len(text)
            chunk = " ".join(text[start:min(end, start + width)].split())
            assert chunk and chunk in " ".join(text.split()), "quote must come from the page"
            return chunk + ("" if end <= start + width else " …")
    raise SystemExit(f"no passage for {terms}")


def live_bundle(ids, names, matrix_ns, vocab_ns) -> dict:
    """The stopword-free model, as sparse rows, for the search box."""
    rows = []
    for i, node_id in enumerate(ids):
        row = matrix_ns.getrow(i)
        pairs = sorted(zip(row.indices.tolist(), row.data.astype(int).tolist()))
        rows.append({"id": node_id, "name": names[node_id], "idx": [p[0] for p in pairs], "val": [p[1] for p in pairs]})
    return {"generated_by": "analysis/week05_search.py", "mode": "bag_of_words_counts_spacy_stoplist",
            "token_rule": TOKEN_RULE, "stopwords": sorted(STOP), "top": LIVE_TOP,
            "vocab": vocab_ns, "pages": rows, "n_pages": len(rows), "n_terms": len(vocab_ns)}


def main() -> int:
    text = pages()
    names = dict(zip(nodes().node_id, nodes().name))
    ids = sorted(text)
    docs = [text[n] for n in ids]
    length = {n: len(tokenize(text[n])) for n in ids}
    median_len = float(np.median(list(length.values())))
    rank_len = {n: float((np.array(list(length.values())) < length[n]).mean()) for n in ids}

    raw, ns = vectorizer(False), vectorizer(True)
    matrix, matrix_ns = raw.fit_transform(docs), ns.fit_transform(docs)
    vocab, vocab_ns = list(raw.get_feature_names_out()), list(ns.get_feature_names_out())
    totals = np.asarray(matrix.sum(axis=0)).ravel()
    common = [{"term": vocab[i], "count": int(totals[i]), "share": round(float(totals[i] / totals.sum()), 4)}
              for i in np.lexsort((np.arange(len(totals)), -totals))[:5]]

    results = []
    for item in QUERIES:
        expected = item["expected"]
        if expected is not None and expected not in text:
            raise SystemExit(f"expected page missing from corpus: {expected}")
        q_raw, q_ns = raw.transform([item["query"]]), ns.transform([item["query"]])
        sims, rank_of, top = rank_query(q_raw, matrix, ids, vocab, names, length)
        sims_ns, rank_ns_of, top_ns = rank_query(q_ns, matrix_ns, ids, vocab_ns, names, length)
        row = {"id": item["id"], "query": item["query"], "expected": expected,
               "expected_name": names[expected] if expected else None, "why_expected": item["why_expected"],
               "scored": expected is not None, "top5": top, "top5_nostop": top_ns}
        if expected is None:
            kind, why = reason(None, top, [], length, names)
            row |= {"rank": None, "rank_nostop": None, "hit_at_1": False, "hit_at_5": False,
                    "hit_at_1_nostop": False, "hit_at_5_nostop": False, "expected_overlap": [],
                    "failure_kind": kind, "failure_reason": why}
        else:
            e = ids.index(expected)
            exp_overlap = overlap(q_raw, matrix.getrow(e), vocab)
            no_word_ns = sims_ns[e] == 0
            row |= {"rank": rank_of[expected], "rank_nostop": None if no_word_ns else rank_ns_of[expected],
                    "cosine_expected": round(float(sims[e]), 4), "expected_tokens": length[expected],
                    "expected_length_percentile": round(rank_len[expected], 3),
                    "hit_at_1": rank_of[expected] == 1, "hit_at_5": rank_of[expected] <= TOP,
                    "hit_at_1_nostop": rank_ns_of[expected] == 1 and not no_word_ns,
                    "hit_at_5_nostop": rank_ns_of[expected] <= TOP and not no_word_ns,
                    "expected_overlap": exp_overlap}
            if row["hit_at_1"]:
                row |= {"failure_kind": None, "failure_reason": None}
            else:
                kind, why = reason(expected, top, exp_overlap, length, names)
                row |= {"failure_kind": kind, "failure_reason": why}
            # The same label on the stopword-free model, so a stopword win is not read as a length win.
            row["failure_kind_nostop"] = (None if row["hit_at_1_nostop"] else
                                          reason(expected, top_ns, overlap(q_ns, matrix_ns.getrow(e), vocab_ns),
                                                 length, names)[0])
        results.append(row)

    scored = [r for r in results if r["scored"]]
    n = len(scored)
    count = lambda key: sum(r[key] for r in scored)
    chance1, chance5 = 1 / len(ids), TOP / len(ids)
    p = lambda k, c: float(f"{binomtest(k, n, c, alternative='greater').pvalue:.3g}")
    misses = [r for r in scored if not r["hit_at_1"]]
    kinds = {k: sum(r["failure_kind"] == k for r in misses) for k in ("no_shared_word", "short_page", "rival")}
    misses_ns = [r for r in scored if not r["hit_at_1_nostop"]]
    kinds_ns = {k: sum(r["failure_kind_nostop"] == k for r in misses_ns) for k in ("no_shared_word", "short_page", "rival")}
    shorter = sum(r["top5"][0]["n_tokens"] < median_len for r in misses)
    long_targets = sum(r["expected_length_percentile"] >= 0.8 for r in misses)

    # What we checked: the short-page miss whose winner is shortest, quoted from the winner's page.
    short = sorted((r for r in misses if r["failure_kind"] == "short_page"), key=lambda r: (r["top5"][0]["n_tokens"], r["id"]))
    checked = None
    if short:
        r = short[0]
        win = r["top5"][0]
        terms = [o["term"] for o in win["overlap_terms"] if not o["is_stop"]]
        checked = {"query_id": r["id"], "query": r["query"], "winner": win["node_id"], "winner_name": win["name"],
                   "winner_tokens": win["n_tokens"], "expected": r["expected"], "expected_name": r["expected_name"],
                   "expected_tokens": r["expected_tokens"], "terms": terms[:3],
                   "quote": passage(text[win["node_id"]], terms)}
    for r in results:
        if r["failure_kind"] in ("no_target", "short_page", "rival") or r["hit_at_1"]:
            src = r["top5"][0]
            terms = [o["term"] for o in src["overlap_terms"] if not o["is_stop"]]
            r["quote"] = {"node_id": src["node_id"], "name": src["name"],
                          "text": passage(text[src["node_id"]], terms) if terms else None}
        else:
            r["quote"] = None

    payload = {
        "generated_by": "analysis/week05_search.py", "owner": "Àngela",
        "tokenisation": {"method": TOKEN_RULE, "stoplist": f"spaCy English stop words ({len(STOP)})",
                         "vectorizer": "sklearn CountVectorizer", "similarity": "cosine on raw counts",
                         "n_pages": len(ids), "n_terms": len(vocab), "n_terms_nostop": len(vocab_ns),
                         "n_tokens": int(totals.sum()), "median_page_tokens": median_len,
                         "sparsity": round(1.0 - matrix.nnz / (matrix.shape[0] * matrix.shape[1]), 4),
                         "most_common": common},
        "summary": {"n_queries": len(results), "n_scored": n, "hits_at_1": count("hit_at_1"),
                    "hits_at_5": count("hit_at_5"), "hits_at_1_nostop": count("hit_at_1_nostop"),
                    "hits_at_5_nostop": count("hit_at_5_nostop"),
                    "chance_at_1": round(chance1, 4), "chance_at_5": round(chance5, 4),
                    "p_at_1": p(count("hit_at_1"), chance1), "p_at_5": p(count("hit_at_5"), chance5),
                    "p_at_1_nostop": p(count("hit_at_1_nostop"), chance1),
                    "p_at_5_nostop": p(count("hit_at_5_nostop"), chance5),
                    "n_misses": len(misses), "miss_kinds": kinds,
                    "n_misses_nostop": len(misses_ns), "miss_kinds_nostop": kinds_ns,
                    "misses_won_by_shorter_than_median": shorter, "misses_with_long_target": long_targets,
                    "random_mean_rank": (len(ids) + 1) / 2},
        "checked": checked, "queries": results,
    }
    live = live_bundle(ids, names, matrix_ns, vocab_ns)
    check(OUT, payload)
    check(LIVE_OUT, live)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    LIVE_OUT.write_text(json.dumps(live, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    s = payload["summary"]
    print(f"raw {s['hits_at_1']}/{n} @1 (p {s['p_at_1']}), {s['hits_at_5']}/{n} @5; nostop {s['hits_at_1_nostop']}/{n} @1, "
          f"{s['hits_at_5_nostop']}/{n} @5; misses {kinds}; shorter winners {shorter}/{len(misses)}; "
          f"live {LIVE_OUT.stat().st_size / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
