"""Week 5 · A Marvel search engine in 20 lines.

Question: Can bag-of-words find the right Marvel page from a description?

Owner: Àngela
Page section: docs/weeks/week05/index.html#search
Output: docs/weeks/week05/data/search.json
         docs/weeks/week05/data/search_live.json

Treat each query as a tiny document, vectorise it with the same vocabulary as
the 303 pages, and rank by cosine similarity. Failures are explained from the
words behind the match; TF-IDF (next week) will fix some of them.

    python analysis/week05_search.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from week05_text import nodes, pages

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "weeks" / "week05" / "data" / "search.json"
LIVE_OUT = ROOT / "docs" / "weeks" / "week05" / "data" / "search_live.json"

STOP = set(ENGLISH_STOP_WORDS)

# Expected node_ids must exist in Category:Marvel Comics superheroes (the
# course snapshot). Several household names — Thor, Loki, Iron Man, Captain
# America, Magneto — are absent from that category, so probes use pages that
# are actually in the zip.
QUERIES = [
    {
        "id": "thunder",
        "query": "Norse god of thunder",
        "expected": "Thor_Girl",
        "why_expected": (
            "The course's own example. Thor himself is not in this category snapshot, "
            "so the closest in-roster page is Thor Girl."
        ),
    },
    {
        "id": "bill",
        "query": "alien champion who wields Mjolnir",
        "expected": "Beta_Ray_Bill",
        "why_expected": "Beta Ray Bill is the Korbinite who lifts Thor's hammer.",
    },
    {
        "id": "wolverine",
        "query": "Canadian mutant with adamantium claws",
        "expected": "Wolverine_(character)",
        "why_expected": "Claws and adamantium are Wolverine's signature words.",
    },
    {
        "id": "spider",
        "query": "bitten by a radioactive spider",
        "expected": "Spider-Man",
        "why_expected": "The origin sentence almost every reader knows.",
    },
    {
        "id": "strange",
        "query": "sorcerer supreme of Earth",
        "expected": "Doctor_Strange",
        "why_expected": "The title Sorcerer Supreme points at Doctor Strange.",
    },
    {
        "id": "deadpool",
        "query": "mercenary who breaks the fourth wall",
        "expected": "Deadpool",
        "why_expected": "Fourth-wall humour is Deadpool's trademark.",
    },
    {
        "id": "blackpanther",
        "query": "king of Wakanda",
        "expected": "Black_Panther_(character)",
        "why_expected": "Wakanda and its king are Black Panther.",
    },
    {
        "id": "hulk",
        "query": "scientist who turns into a green giant when angry",
        "expected": "Hulk",
        "why_expected": "Bruce Banner / Hulk: green, giant, anger.",
    },
    {
        "id": "storm",
        "query": "weather-controlling mutant from Kenya",
        "expected": "Storm_(Marvel_Comics)",
        "why_expected": "Storm controls weather; her page mentions her Kenyan origin.",
    },
    {
        "id": "witch",
        "query": "chaos magic reality warping mutant twin",
        "expected": "Scarlet_Witch",
        "why_expected": "Chaos magic and reality warping are Scarlet Witch's brief.",
    },
    {
        "id": "venom",
        "query": "alien symbiote that bonds with Eddie Brock",
        "expected": "Venom_(character)",
        "why_expected": "Symbiote + Eddie Brock = Venom.",
    },
    {
        "id": "moon",
        "query": "mercenary who becomes a moon-themed vigilante",
        "expected": "Moon_Knight",
        "why_expected": "Moon Knight is the moon-themed vigilante.",
    },
]


TOKEN_RE = re.compile(r"[a-z0-9]+(?:'[a-z]+)?", re.I)


def tokenize(text: str) -> list[str]:
    """Lowercase alphanumeric tokens; keeps contractions as one piece."""
    return TOKEN_RE.findall(text.lower())


def display_name(node_id: str, names: dict[str, str]) -> str:
    return names.get(node_id, node_id.replace("_", " "))


def make_vectorizer(*, stop_words=None, min_df: int = 1) -> CountVectorizer:
    return CountVectorizer(
        tokenizer=tokenize,
        preprocessor=None,
        token_pattern=None,
        lowercase=False,
        stop_words=stop_words,
        min_df=min_df,
    )


def top_overlap_terms(query_vec, page_vec, vocab: list[str], k: int = 8) -> list[dict]:
    """Words that contribute most to the dot product (shared raw counts)."""
    q = query_vec.toarray().ravel()
    p = page_vec.toarray().ravel()
    contrib = q * p
    idxs = np.argsort(-contrib)
    out = []
    for i in idxs:
        if contrib[i] <= 0:
            break
        term = vocab[i]
        out.append(
            {
                "term": term,
                "query": int(q[i]),
                "page": int(p[i]),
                "product": int(contrib[i]),
                "is_stop": term in STOP,
            }
        )
        if len(out) >= k:
            break
    return out


def rank_query(q_vec, matrix, node_ids, vocab, names, k=5):
    sims = cosine_similarity(q_vec, matrix).ravel()
    order = np.argsort(-sims)
    rank_of = {node_ids[i]: int(r + 1) for r, i in enumerate(order)}
    top = []
    for i in order[:k]:
        nid = node_ids[i]
        top.append(
            {
                "node_id": nid,
                "name": display_name(nid, names),
                "cosine": round(float(sims[i]), 4),
                "overlap_terms": top_overlap_terms(q_vec, matrix.getrow(i), vocab),
            }
        )
    return sims, rank_of, top


def explain_failure(query: str, expected: str, top: dict, expected_overlap: list[dict], rank: int) -> str:
    """One short reason the right page lost, grounded in shared words."""
    overlap = top["overlap_terms"]
    stop_hits = [o["term"] for o in overlap if o["is_stop"]]
    content_hits = [o["term"] for o in overlap if not o["is_stop"]]
    expected_content = [o["term"] for o in expected_overlap if not o["is_stop"]]

    if stop_hits and (not content_hits or overlap[0]["is_stop"]):
        return (
            f"The strongest shared tokens with the top hit are stopwords "
            f"[{', '.join(stop_hits[:3])}]. Cosine on raw counts lets of/with/a "
            f"steer the ranking; the expected page still shares content words "
            f"[{', '.join(expected_content[:3]) or 'none'}] but sits at rank {rank}. "
            f"Dropping stopwords — or next week's TF-IDF — fixes many of these."
        )
    if content_hits and expected_content:
        return (
            f"A near-miss: the top hit shares [{', '.join(content_hits[:4])}], while "
            f"{display_name(expected, {expected: expected})} shares "
            f"[{', '.join(expected_content[:4])}] and lands at rank {rank}. "
            f"Raw BoW cannot tell which content word matters more; TF-IDF will."
        )
    return (
        f"BoW only matches exact tokens. Query {query!r} barely overlaps the expected "
        f"page's distinctive words, so a different page wins on whatever scraps match."
    )


def pick_quote(page: str, terms: list[str], window: int = 180) -> str:
    """First window that contains one of the terms, else the lead."""
    lower = page.lower()
    for term in terms:
        i = lower.find(term.lower())
        if i >= 0:
            start = max(0, i - 40)
            end = min(len(page), i + window)
            chunk = page[start:end].replace("\n", " ").strip()
            if start > 0:
                chunk = "…" + chunk
            if end < len(page):
                chunk = chunk + "…"
            return chunk
    lead = page[:window].replace("\n", " ").strip()
    return lead + ("…" if len(page) > window else "")


def build_live_bundle(node_ids: list[str], names: dict[str, str]) -> dict:
    """Compact sparse vectors for the in-browser search box."""
    texts = pages()
    docs = [texts[n] for n in node_ids]
    live = make_vectorizer(stop_words=list(ENGLISH_STOP_WORDS), min_df=2)
    live_matrix = live.fit_transform(docs)
    vocab = list(live.get_feature_names_out())
    pages_sparse = []
    for i, node_id in enumerate(node_ids):
        row = live_matrix.getrow(i)
        # CSR rows are usually sorted; sort explicitly so the browser can
        # merge-walk query and page indices.
        pairs = sorted(zip(row.indices.tolist(), row.data.astype(int).tolist()))
        pages_sparse.append(
            {
                "id": node_id,
                "name": names[node_id],
                "idx": [p[0] for p in pairs],
                "val": [p[1] for p in pairs],
            }
        )
    return {
        "generated_by": "analysis/week05_search.py",
        "mode": "bag_of_words_counts_stopwords_removed_min_df_2",
        "vocab": vocab,
        "pages": pages_sparse,
        "n_pages": len(pages_sparse),
        "n_terms": len(vocab),
    }


def main() -> int:
    text = pages()
    table = nodes()
    names = dict(zip(table.node_id, table.name))
    node_ids = sorted(text)
    docs = [text[n] for n in node_ids]

    raw = make_vectorizer()
    matrix = raw.fit_transform(docs)
    vocab = list(raw.get_feature_names_out())

    nostop = make_vectorizer(stop_words=list(ENGLISH_STOP_WORDS))
    matrix_ns = nostop.fit_transform(docs)
    vocab_ns = list(nostop.get_feature_names_out())

    results = []
    hits_at_1 = hits_at_5 = 0
    hits_ns_1 = hits_ns_5 = 0

    for item in QUERIES:
        expected = item["expected"]
        if expected not in text:
            raise SystemExit(f"expected page missing from corpus: {expected}")

        q_raw = raw.transform([item["query"]])
        sims, rank_of, top5 = rank_query(q_raw, matrix, node_ids, vocab, names)
        rank = rank_of[expected]
        expected_idx = node_ids.index(expected)
        expected_overlap = top_overlap_terms(q_raw, matrix.getrow(expected_idx), vocab)

        q_ns = nostop.transform([item["query"]])
        _, rank_ns_of, top5_ns = rank_query(q_ns, matrix_ns, node_ids, vocab_ns, names)
        rank_ns = rank_ns_of[expected]

        ok = rank == 1
        ok5 = rank <= 5
        hits_at_1 += int(ok)
        hits_at_5 += int(ok5)
        hits_ns_1 += int(rank_ns == 1)
        hits_ns_5 += int(rank_ns <= 5)

        failure_reason = None if ok else explain_failure(
            item["query"], expected, top5[0], expected_overlap, rank
        )

        page_for_quote = expected if ok else top5[0]["node_id"]
        quote_terms = [
            t["term"]
            for t in (expected_overlap if ok else top5[0]["overlap_terms"])
            if not t["is_stop"]
        ][:3] or tokenize(item["query"])[:3]
        quote = pick_quote(text[page_for_quote], quote_terms)

        results.append(
            {
                "id": item["id"],
                "query": item["query"],
                "expected": expected,
                "expected_name": display_name(expected, names),
                "why_expected": item["why_expected"],
                "rank": rank,
                "rank_nostop": rank_ns,
                "cosine_expected": round(float(sims[expected_idx]), 4),
                "hit_at_1": ok,
                "hit_at_5": ok5,
                "hit_at_1_nostop": rank_ns == 1,
                "hit_at_5_nostop": rank_ns <= 5,
                "top5": top5,
                "top5_nostop": top5_ns,
                "expected_overlap": expected_overlap,
                "failure_reason": failure_reason,
                "quote": {
                    "node_id": page_for_quote,
                    "name": display_name(page_for_quote, names),
                    "text": quote,
                },
            }
        )

    failures = [r for r in results if not r["hit_at_1"]]
    payload = {
        "generated_by": "analysis/week05_search.py",
        "owner": "Àngela",
        "tokenisation": {
            "method": "regex [a-z0-9]+(?:'[a-z]+)?, lowercased",
            "vectorizer": "sklearn.feature_extraction.text.CountVectorizer",
            "similarity": "cosine on raw term counts (Bag of Words)",
            "stopwords": "kept for the main ranking; a stopword-free rerun is reported beside it",
            "n_pages": len(node_ids),
            "n_terms": len(vocab),
            "n_terms_nostop": len(vocab_ns),
            "sparsity": round(1.0 - (matrix.nnz / (matrix.shape[0] * matrix.shape[1])), 4),
        },
        "summary": {
            "n_queries": len(results),
            "hits_at_1": hits_at_1,
            "hits_at_5": hits_at_5,
            "hit_rate_at_1": round(hits_at_1 / len(results), 4),
            "hit_rate_at_5": round(hits_at_5 / len(results), 4),
            "hits_at_1_nostop": hits_ns_1,
            "hits_at_5_nostop": hits_ns_5,
            "hit_rate_at_1_nostop": round(hits_ns_1 / len(results), 4),
            "hit_rate_at_5_nostop": round(hits_ns_5 / len(results), 4),
            "chance_at_1": round(1 / len(node_ids), 4),
            "n_failures": len(failures),
        },
        "queries": results,
        "baseline": (
            f"Uniform chance of picking the right page among {len(node_ids)} is "
            f"{100 / len(node_ids):.2f}%."
        ),
        "corpus_note": (
            "Category:Marvel Comics superheroes (303 pages) omits several household names "
            "such as Thor, Loki, Iron Man and Captain America; probes use in-roster pages."
        ),
    }

    live = build_live_bundle(node_ids, names)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    try:
        from check_pages import check

        check(OUT, payload)
        check(LIVE_OUT, live)
    except SystemExit as err:
        if "has no model" not in str(err):
            raise

    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    LIVE_OUT.write_text(json.dumps(live, separators=(",", ":")), encoding="utf-8")
    print(
        f"wrote {OUT.relative_to(ROOT)}: "
        f"raw {hits_at_1}/{len(results)} @1, {hits_at_5}/{len(results)} @5; "
        f"nostop {hits_ns_1}/{len(results)} @1, {hits_ns_5}/{len(results)} @5; "
        f"live vocab {live['n_terms']} terms"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
