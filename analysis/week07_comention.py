"""Week 7: can the page text rebuild the Marvel link network? Owner: Gyula.

Brief 7.13's opener "Can text build a useful network?": build an entity
co-occurrence network from the 303 Marvel pages, compare it with the
hyperlink network, and read the edges that exist in only one of them.

Steps, each written to analysis/week07_comention.json and the page file
public/weeks/week07/data/comention.json:

1. Parse. spaCy's en_core_web_sm, the brief's model, splits each whole page
   into sentences and tags entity spans. The parse is cached in build/; the
   brief's Spider-Man figures (445 sentences, 635 PERSON spans, 179 distinct,
   a 146-node, 293-edge network) are recomputed from it for
   course_reference.py.
2. Resolve. A mention counts only when it is one of the 303 characters. Each
   character is named by its page title (a generic qualifier such as
   "(character)" dropped, a name qualifier such as "(Danny Ketch)" kept as a
   name of its own), its Wikidata label, and its Wikidata aliases of two words
   or more (analysis/week07_wikidata_names.parquet). One-word aliases come in
   only when analysis/week07_alias_decisions.parquet keeps them; that table
   also rejects aliases that mostly name someone else and blocks phrases
   (series titles, organisations) so the names inside them do not count. A
   name several pages share goes to the page titled with it, bare or with a
   generic qualifier, then to the one page whose Wikidata label it is, and is
   otherwise dropped. Matching is case-sensitive, longest name first. The full
   table is written to analysis/week07_aliases.parquet.
3. Connect. Two characters are tied when one sentence names both, and again
   for one paragraph and one page: three networks. The weight is the number
   of units that name both.
4. Compare. Each network against the 1,434 undirected link pairs: the share
   of text ties that are links, and the share of links the text finds. The
   null rewires each text network RUNS times keeping every character's number
   of partners (igraph's degree-preserving rewire, seeds SEED + i), so a hub
   that is named with everyone does not count as agreement.
5. Read. Links the sentences miss are sorted by rule: one page names the
   other, but never in a sentence that also names itself (the page says "he"
   or "she"); or neither page names the other by any of our names. The
   strongest text ties that are not links, and a random sample of sentences
   for the instrument check, are read by hand (analysis/week07_pairs_read.parquet,
   analysis/week07_sentences_read.parquet). The script stops when a drawn item
   has no verdict, when its text changed since the reading, or when a verdict's
   item is no longer drawn. --sample prints what still needs reading.

    python analysis/week07_comention.py            # about 2 minutes, most of it spaCy on the first run
    python analysis/week07_comention.py --sample   # the drawn items that have no verdict yet
"""

import hashlib
import json
import random
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import igraph as ig
import pandas as pd

import tables

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402
from check_pages import check  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
HERE = Path(__file__).parent
OUT = Path(__file__).with_suffix(".json")
PAGE = ROOT / "public/weeks/week07/data/comention.json"
CACHE = ROOT / "build/week07_parsed.json"
NAMES = HERE / "week07_wikidata_names.parquet"
DECISIONS = HERE / "week07_alias_decisions.parquet"
ALIASES = HERE / "week07_aliases.parquet"
PAIRS_READ = HERE / "week07_pairs_read.parquet"
SENTENCES_READ = HERE / "week07_sentences_read.parquet"

SEED = 7
RUNS = 1000
UNITS = ("sentence", "paragraph", "page")
GENERIC = {"character", "characters", "comics", "Marvel Comics", "Marvel"}
# Weight bins for the sentence network: how many sentences name both characters.
BINS = [(1, 1, "1"), (2, 2, "2"), (3, 4, "3–4"), (5, 9, "5–9"), (10, 10**9, "10+")]
N_PAIRS_READ = 25      # strongest sentence ties that are not links
N_LINK_ONLY_READ = 20  # links no sentence finds, a random draw
N_SENTENCES_READ = 80  # random sentences for the instrument check
PAIR_BUCKETS = ("story", "title", "passing", "wrong name")
LINK_BUCKETS = ("pronoun", "other name", "no mention")
# spaCy labels a character's name could carry, for the NER instrument.
NER_LABELS = {"PERSON", "ORG", "NORP", "GPE", "WORK_OF_ART", "PRODUCT", "FAC", "LOC", "EVENT"}


# 1 · Parse -----------------------------------------------------------------------------------------------

def source_hash(pages):
    h = hashlib.sha256()
    for nid in sorted(pages):
        h.update(nid.encode() + b"\0" + pages[nid].encode() + b"\0")
    return h.hexdigest()


def parse(pages):
    """Sentences of every page, with spaCy's entity spans; cached in build/ against the pages' hash."""
    digest = source_hash(pages)
    if CACHE.exists():
        cached = json.loads(CACHE.read_text())
        if cached["source"] == digest:
            return cached["sentences"]
    import spacy
    nlp = spacy.load("en_core_web_sm")
    ids = sorted(pages)
    rows = []
    for nid, doc in zip(ids, nlp.pipe((pages[i] for i in ids), batch_size=8, n_process=4)):
        text = pages[nid]
        for k, s in enumerate(doc.sents):
            rows.append({"page": nid, "i": k, "para": text.count("\n", 0, s.start_char),
                         "start": s.start_char, "end": s.end_char,
                         "ents": [[e.start_char - s.start_char, e.end_char - s.start_char, e.label_] for e in s.ents]})
    CACHE.parent.mkdir(exist_ok=True)
    CACHE.write_text(json.dumps({"source": digest, "model": f"en_core_web_sm {nlp.meta['version']}",
                                 "sentences": rows}))
    return rows


def course_spider_man(pages, sents):
    """The brief's Spider-Man example: sentence co-mention of PERSON span texts, no resolution."""
    text = pages["Spider-Man"]
    mine = [s for s in sents if s["page"] == "Spider-Man"]
    spans = [text[s["start"] + a:s["start"] + b] for s in mine for a, b, lab in s["ents"] if lab == "PERSON"]
    pairs = Counter()
    for s in mine:
        people = sorted({text[s["start"] + a:s["start"] + b] for a, b, lab in s["ents"] if lab == "PERSON"})
        for i in range(len(people)):
            for j in range(i + 1, len(people)):
                pairs[(people[i], people[j])] += 1
    nodes = {x for p in pairs for x in p}
    return {"sentences": len(mine), "person_spans": len(spans), "distinct": len(set(spans)),
            "nodes": len(nodes), "edges": len(pairs),
            "top": [[a, b, w] for (a, b), w in sorted(pairs.items(), key=lambda kv: (-kv[1], kv[0]))[:4]]}


# 2 · Resolve ---------------------------------------------------------------------------------------------

def aliases(nodes):
    """name -> node_id ('' for a blocked phrase), and the rows of the inspectable alias table."""
    decisions = {r["name"]: (r["decision"], r["reason"]) for r in tables.rows(DECISIONS)}
    cand = defaultdict(dict)  # name -> {node_id: set of sources}

    def add(name, nid, source):
        cand[name].setdefault(nid, set()).add(source)

    for r in nodes.itertuples():
        m = re.match(r"^(.*?)(?: \((.*)\))?$", r.name)
        base, qual = m.group(1), m.group(2)
        add(base, r.node_id, "title" if not qual else "title-generic" if qual in GENERIC else "title-variant")
        if qual and qual not in GENERIC and re.fullmatch(r"[A-Z][\w'.-]*(?: [A-Z][\w'.-]*)+", qual):
            add(qual, r.node_id, "title-qualifier")
    for r in tables.rows(NAMES):
        add(r["name"], r["node_id"], f"wikidata-{r['kind']}")

    rows, table = [], {}
    for name in sorted(cand):
        owners = cand[name]
        decision = decisions.get(name, ("", ""))
        kept, why = None, ""
        if decision[0] == "reject":
            why = "rejected: " + decision[1]
        elif len(name) < 3 or not re.search(r"[A-Z]", name):
            why = "too short or no capital"
        else:
            # A one-word Wikidata alias is too often an ordinary word ("Her", "Frank") unless kept by hand.
            usable = {n: s for n, s in owners.items()
                      if s - {"wikidata-alias"} or " " in name or "-" in name or decision[0] == "keep"}
            if not usable:
                why = "one-word Wikidata alias"
            elif len(usable) == 1:
                kept = next(iter(usable))
            else:
                for rule in ({"title"}, {"title-generic"}, {"wikidata-label"}):
                    hit = sorted(n for n, s in usable.items() if s & rule)
                    if len(hit) == 1:
                        kept, why = hit[0], f"shared; goes to the {sorted(rule)[0]}"
                        break
                    if len(hit) > 1:
                        break
                if kept is None:
                    why = "shared by " + ", ".join(sorted(usable))
        if kept:
            table[name] = kept
        for nid in sorted(owners):
            rows.append((name, nid, "|".join(sorted(owners[nid])), "yes" if kept == nid else "no",
                         why if kept != nid or why else ("kept by hand" if decision[0] == "keep" else "")))
    for name, (decision, reason) in sorted(decisions.items()):
        if decision == "block":
            table[name] = ""
            rows.append((name, "", "decision", "blocked", reason))
    return table, rows


def matcher(table):
    names = sorted(table, key=lambda x: (-len(x), x))
    pattern = re.compile(r"(?<![\w-])(?:" + "|".join(re.escape(x) for x in names) + r")(?![\w-])")

    def find(text):
        return [(m.start(), m.end(), table[m.group(0)]) for m in pattern.finditer(text) if table[m.group(0)]]
    return find


def ner_find(text, ents, table):
    """spaCy's entity spans resolved through the same names: the instrument the brief runs."""
    out = []
    for a, b, lab in ents:
        if lab not in NER_LABELS:
            continue
        span = re.sub(r"(?:'s|’s)$", "", text[a:b])
        span = re.sub(r"^[Tt]he ", "", span) if span not in table else span
        if table.get(span):
            out.append((a, b, table[span]))
    return out


# 3 · Connect ---------------------------------------------------------------------------------------------

def unit_key(s, unit):
    return (s["page"], s["i"]) if unit == "sentence" else (s["page"], s["para"]) if unit == "paragraph" else s["page"]


def networks(sents, found):
    """unit -> Counter of character pairs (sorted tuples) over the units that name both."""
    members = {u: defaultdict(set) for u in UNITS}
    for s, hits in zip(sents, found):
        for u in UNITS:
            members[u][unit_key(s, u)].update(n for *_, n in hits)
    out = {}
    for u in UNITS:
        c = Counter()
        for group in members[u].values():
            g = sorted(group)
            for i in range(len(g)):
                for j in range(i + 1, len(g)):
                    c[(g[i], g[j])] += 1
        out[u] = c
    return out


# 4 · Compare ---------------------------------------------------------------------------------------------

def rewired_shares(pairs, links, seed0, runs=RUNS):
    """Share of pairs that are links after degree-preserving rewiring, over seeds SEED + i."""
    nodes = sorted({x for p in pairs for x in p})
    index = {n: i for i, n in enumerate(nodes)}
    edges = [(index[a], index[b]) for a, b in sorted(pairs)]
    shares = []
    for i in range(runs):
        g = ig.Graph(n=len(nodes), edges=edges)
        ig.set_random_number_generator(random.Random(seed0 + i))
        g.rewire(n=10 * len(edges), allowed_edge_types="simple")
        assert g.degree() == ig.Graph(n=len(nodes), edges=edges).degree()
        hit = sum(tuple(sorted((nodes[a], nodes[b]))) in links for a, b in g.get_edgelist())
        shares.append(hit / len(edges))
    mean = sum(shares) / runs
    sd = (sum((x - mean) ** 2 for x in shares) / (runs - 1)) ** 0.5
    return mean, sd


def compare(pairs, links):
    e = set(pairs)
    hit = len(e & links)
    mean, sd = rewired_shares(e, links, SEED)
    share = hit / len(e)
    return {"characters": len({x for p in e for x in p}), "ties": len(e), "linked": hit,
            "share_linked": share, "share_links_found": hit / len(links),
            "null_mean": mean, "null_sd": sd, "z": (share - mean) / sd if sd else None}


def by_weight(pairs, links):
    rows = []
    for lo, hi, label in BINS:
        e = {p for p, w in pairs.items() if lo <= w <= hi}
        hit = len(e & links)
        mean, sd = rewired_shares(e, links, SEED + 10_000 * lo, runs=RUNS // 5)
        rows.append({"bin": label, "ties": len(e), "linked": hit, "share_linked": hit / len(e),
                     "null_mean": mean, "null_sd": sd})
    return rows


# 5 · Read ------------------------------------------------------------------------------------------------

def link_reasons(links, sents, found, pages_named):
    """Each link no sentence finds, by rule: does either page name the other at all?"""
    together = set()
    for hits in found:
        g = sorted({n for *_, n in hits})
        together.update((g[i], g[j]) for i in range(len(g)) for j in range(i + 1, len(g)))
    missed = sorted(links - together)
    named = [p for p in missed if p[1] in pages_named[p[0]] or p[0] in pages_named[p[1]]]
    return missed, named


def sentence_text(pages, s):
    return pages[s["page"]][s["start"]:s["end"]]


def squeeze(text):
    """Text with its whitespace collapsed: a verdict holds while the words stay the same."""
    return " ".join(text.split())


def guard(path, drawn, key_cols, text_col):
    """Verdicts for the drawn items: stops on a missing verdict, a changed text or a stale verdict."""
    rows = tables.rows(path) if path.exists() else []
    verdicts = {tuple(r[c] for c in key_cols): r for r in rows}
    missing = [k for k in drawn if k not in verdicts]
    changed = [k for k in drawn if k in verdicts and squeeze(verdicts[k][text_col]) != squeeze(drawn[k])]
    extra = sorted(set(verdicts) - set(drawn))
    return verdicts, missing, changed, extra


def main():
    sample_only = "--sample" in sys.argv
    pages = t.pages()
    nodes = t.nodes()
    names = dict(zip(nodes.node_id, nodes.name))
    sents = parse(pages)
    course = course_spider_man(pages, sents)

    table, alias_rows = aliases(nodes)
    tables.write(ALIASES, pd.DataFrame(alias_rows, columns=["name", "node_id", "sources", "used", "why"]),
                 notes=["Every candidate name for the 303 characters and what week07_comention.py did with it.",
                        "used: yes when the name resolves to this node_id; blocked for a phrase that resolves to no one."])
    find = matcher(table)
    texts = [sentence_text(pages, s) for s in sents]
    found = [find(x) for x in texts]
    ner = [ner_find(x, s["ents"], table) for x, s in zip(texts, sents)]

    g = t.graph()
    links = {tuple(sorted((a, b))) for a, b in g.edges() if a != b}
    nets = networks(sents, found)
    ner_nets = networks(sents, ner)

    pages_named = defaultdict(set)
    for s, hits in zip(sents, found):
        pages_named[s["page"]].update(n for *_, n in hits)
    named_any = {n for v in pages_named.values() for n in v}
    raw_person = {texts[i][a:b] for i, s in enumerate(sents) for a, b, lab in s["ents"] if lab == "PERSON"}

    units = {u: compare(nets[u], links) for u in UNITS}
    ner_sentence = compare(ner_nets["sentence"], links)
    weights = by_weight(nets["sentence"], links)
    missed, missed_named = link_reasons(links, sents, found, pages_named)
    arcs_named = sum(b in pages_named[a] for a, b in g.edges() if a != b)

    # Strongest sentence ties that are not links, with the sentences that name both.
    where = defaultdict(list)
    for i, hits in enumerate(found):
        g_ = sorted({n for *_, n in hits})
        for x in range(len(g_)):
            for y in range(x + 1, len(g_)):
                where[(g_[x], g_[y])].append(i)
    unlinked = sorted((p for p in nets["sentence"] if p not in links), key=lambda p: (-nets["sentence"][p], p))
    drawn_pairs = {}
    for a, b in unlinked[:N_PAIRS_READ]:
        first = where[(a, b)][0]
        drawn_pairs[(a, b)] = texts[first]
    rng = random.Random(SEED)
    drawn_links = {}
    for a, b in sorted(rng.sample(missed, N_LINK_ONLY_READ)):
        drawn_links[(a, b)] = "named" if (a, b) in set(missed_named) else "not named"
    rng = random.Random(SEED + 1)
    picks = sorted(rng.sample(range(len(sents)), N_SENTENCES_READ))
    drawn_sents = {(sents[i]["page"], str(sents[i]["i"])): texts[i] for i in picks}

    if sample_only:
        print(json.dumps({"units": units, "ner_sentence": ner_sentence, "weights": weights,
                          "link_only": [len(missed), len(missed_named)], "arcs_named": arcs_named,
                          "course": course, "characters_named": len(named_any)}, indent=1))
        for path, drawn, cols, col in ((PAIRS_READ, drawn_pairs, ("a", "b"), "sentence"),
                                       (SENTENCES_READ, drawn_sents, ("page", "i"), "sentence")):
            _, missing, changed, extra = guard(path, drawn, cols, col)
            print(f"== {path.name}: {len(missing)} unread, {len(changed)} changed, {len(extra)} stale")
            for k in missing + changed:
                print("\t".join(k), "\t", drawn[k].replace("\n", " "))
        _, missing, changed, extra = guard(HERE / "week07_links_read.parquet", drawn_links, ("a", "b"), "rule")
        print(f"== week07_links_read.parquet: {len(missing)} unread, {len(changed)} changed, {len(extra)} stale")
        for k in missing + changed:
            print("\t".join(k), "\t", drawn_links[k])
        return

    # Hand-read verdicts -----------------------------------------------------------------------------------
    problems = []
    pv, *bad = guard(PAIRS_READ, drawn_pairs, ("a", "b"), "sentence")
    problems += [(PAIRS_READ.name, b) for b in bad if b]
    lv, *bad = guard(HERE / "week07_links_read.parquet", drawn_links, ("a", "b"), "rule")
    problems += [("week07_links_read.parquet", b) for b in bad if b]
    sv, *bad = guard(SENTENCES_READ, drawn_sents, ("page", "i"), "sentence")
    problems += [(SENTENCES_READ.name, b) for b in bad if b]
    if problems:
        raise SystemExit("hand-read verdicts out of date (run --sample): "
                         + "; ".join(f"{f}: {b[:3]}" for f, b in problems))

    pair_rows = []
    for (a, b), sentence in drawn_pairs.items():
        v = pv[(a, b)]
        if v["bucket"] not in PAIR_BUCKETS:
            raise SystemExit(f"{PAIRS_READ.name}: unknown bucket {v['bucket']!r}")
        pair_rows.append({"a": names[a], "b": names[b], "a_id": a, "b_id": b, "sentences": nets["sentence"][(a, b)],
                          "bucket": v["bucket"], "note": v["note"], "example": sentence})
    link_rows = []
    for (a, b), rule in drawn_links.items():
        v = lv[(a, b)]
        if v["bucket"] not in LINK_BUCKETS:
            raise SystemExit(f"week07_links_read.parquet: unknown bucket {v['bucket']!r}")
        link_rows.append({"a": names[a], "b": names[b], "a_id": a, "b_id": b, "rule": rule,
                          "bucket": v["bucket"], "note": v["note"]})

    # Instrument check: characters each instrument finds in the sampled sentences, against the reading.
    idx = {(s["page"], str(s["i"])): i for i, s in enumerate(sents)}
    score = {"names": Counter(), "ner": Counter()}
    sentence_rows = []
    for key, text in drawn_sents.items():
        gold = {x for x in sv[key]["characters"].split("|") if x}
        unknown = gold - set(names)
        if unknown:
            raise SystemExit(f"{SENTENCES_READ.name}: {key} names unknown characters {sorted(unknown)}")
        i = idx[key]
        got = {"names": {n for *_, n in found[i]}, "ner": {n for *_, n in ner[i]}}
        for k in got:
            score[k]["tp"] += len(got[k] & gold)
            score[k]["fp"] += len(got[k] - gold)
            score[k]["fn"] += len(gold - got[k])
        sentence_rows.append({"page": names[key[0]], "sentence": text, "read": sorted(names[x] for x in gold),
                              "names": sorted(names[x] for x in got["names"]),
                              "ner": sorted(names[x] for x in got["ner"]), "note": sv[key]["note"]})
    instrument = {}
    for k, c in score.items():
        instrument[k] = {"found": c["tp"] + c["fp"], "right": c["tp"], "missed": c["fn"],
                         "precision": c["tp"] / (c["tp"] + c["fp"]), "recall": c["tp"] / (c["tp"] + c["fn"])}
    instrument["sentences"] = N_SENTENCES_READ
    instrument["mentions"] = score["names"]["tp"] + score["names"]["fn"]

    # The characters with the most unlinked sentence ties: where the names list does most harm.
    partners_all, partners_unlinked = Counter(), Counter()
    for p in nets["sentence"]:
        for x in p:
            partners_all[x] += 1
            partners_unlinked[x] += p not in links
    worst = sorted(partners_unlinked, key=lambda x: (-partners_unlinked[x], names[x]))[:5]
    unlinked_pairs = [p for p in nets["sentence"] if p not in links]
    most_unlinked = {"characters": [{"name": names[x], "ties": partners_all[x], "linked": partners_all[x] - partners_unlinked[x]}
                                    for x in worst],
                     "unlinked": len(unlinked_pairs)}

    used = Counter(r[3] for r in alias_rows)
    decisions = Counter(r["decision"] for r in tables.rows(DECISIONS))
    facts = {
        "pages": len(pages), "sentences": len(sents), "links": len(links),
        "names": {"resolved": sum(1 for v in table.values() if v), "blocked": used["blocked"],
                  "kept_by_hand": decisions["keep"], "rejected_by_hand": decisions["reject"],
                  "candidates": len({r[0] for r in alias_rows if r[3] != "blocked"})},
        "mentions": sum(len(h) for h in found), "characters_named": len(named_any),
        "raw_person_strings": len(raw_person),
        "units": units, "ner_sentence": ner_sentence, "weights": weights,
        "link_only": {"links": len(missed), "page_names_other": len(missed_named),
                      "share_page_names_other": len(missed_named) / len(missed)},
        "arcs": {"arcs": sum(1 for a, b in g.edges() if a != b), "source_names_target": arcs_named},
        "pairs_read": {"n": len(pair_rows), **Counter(r["bucket"] for r in pair_rows)},
        "links_read": {"n": len(link_rows), **Counter(r["bucket"] for r in link_rows)},
        "most_unlinked": most_unlinked,
        "instrument": instrument,
        "course": course,
        "runs": RUNS, "seed": SEED,
    }
    out = {"generated_by": "analysis/week07_comention.py", **facts,
           "pairs": pair_rows, "links_missed": link_rows, "sentences_read": sentence_rows}
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    # The explorer: every sentence tie with the first sentence that names both, its names marked,
    # and every link no sentence finds.
    chars = sorted(names, key=lambda n: names[n])
    at = {n: i for i, n in enumerate(chars)}
    ties = []
    for (a, b), w in sorted(nets["sentence"].items(), key=lambda kv: (at[kv[0][0]], at[kv[0][1]])):
        i = where[(a, b)][0]
        # The first mention of each of the two, so the page can quote the stretch between them.
        spans = sorted(next([s, e] for s, e, n in found[i] if n == x) for x in (a, b))
        ties.append([at[a], at[b], w, int((a, b) in links), texts[i], spans, names[sents[i]["page"]]])
    payload = {"facts": facts, "pairs": pair_rows, "links_missed": link_rows, "sentences_read": sentence_rows,
               "top_unlinked": [{"a": names[a], "b": names[b], "sentences": nets["sentence"][(a, b)]}
                                for a, b in unlinked[:40]],
               "chars": [names[n] for n in chars], "ties": ties,
               "missed": [[at[a], at[b], int((a, b) in set(missed_named))] for a, b in missed]}
    check(PAGE, payload)
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(json.dumps(payload, ensure_ascii=False) + "\n")
    print(json.dumps({k: facts[k] for k in ("units", "ner_sentence", "link_only", "instrument")}, indent=1))


if __name__ == "__main__":
    main()
