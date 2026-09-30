"""Week 5 · Catch Wikipedia copying itself.

Question: Which Marvel pages copy text from each other?

Owner: Gyula

Page section: docs/weeks/week05/index.html#copying
Output: docs/weeks/week05/data/copying.json, every number the section quotes.

Method
- Tokens: runs of letters and digits in the rendered page text, apostrophes kept
  inside a word ("jean's"), lowercased; punctuation and line breaks dropped.
  Each token keeps its character span, so every shared passage can be quoted
  from the page itself.
- n-grams of N = 8 tokens (and N_ALT = 12 as the brief's second length).
- House phrasing is not copying. "appearing in American comic books published
  by Marvel Comics" is on 282 of the 303 pages. An n-gram on more than
  TEMPLATE_PAGES pages counts as template and is set aside; the rest are rare
  n-grams, shared by a few pages at most.
- Overlapping rare n-grams merge into passages: one copied 30-token passage
  holds 23 overlapping 8-grams, and it counts once, by the tokens it covers.
- A pair copies when it shares a passage of at least MIN_PASSAGE tokens. Pairs
  that share only shorter runs share a phrase ("appears as an assist character
  in Marvel vs Capcom"), and are kept apart as the comparison group.
- The copying network links pages that copy, weighted by the tokens their
  passages cover on the first page of the pair (alphabetical), and its
  connected pieces are the clusters.
- Each passage is labelled with the section heading above it on each page
  (Publication history, Powers and abilities...), read from the heading lines
  the rendered text keeps; the section shares count both pages of a pair.
- What ties each cluster's characters (a mantle, a team or a family) is read
  by hand and kept in analysis/week05_copying_ties.csv; the script stops on a
  cluster with no row.
- Check: are copying pairs linked in the link network (either direction) more
  often than any two pages are, and more often than pairs that share only a
  phrase? Binomial test against the share of all 45,753 page pairs.
- What 12-grams add: pairs that copy at N_ALT but not at N, with their
  passage. A site-wide phrase inside a templated paragraph splits it into
  pieces shorter than MIN_PASSAGE at 8 tokens; 12-grams bridge it.
- Sensitivity: pairs, pages, clusters and linked share for N in (8, 12),
  template cutoffs 3 to 50 pages and minimum passages of 20 to 50 tokens.

Read the corpus and the network only through week05_text.

    python analysis/week05_copying.py
"""

import csv
import itertools
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import networkx as nx
from scipy.stats import binomtest

from check_pages import check
from week05_text import graph, nodes, pages

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs/weeks/week05/data/copying.json"
# What ties each cluster's characters, read by hand from their pages: they share
# a mantle (one codename, several bearers), a team, or a family.
TIES = Path(__file__).with_name("week05_copying_ties.csv")
N = 8
N_ALT = 12
TEMPLATE_PAGES = 10   # an n-gram on more pages than this is house phrasing
MIN_PASSAGE = 30      # tokens a shared passage needs to count as copying
QUOTE_TOKENS = 60     # tokens of each passage the page quotes
SWEEP_TEMPLATE = [3, 5, 10, 20, 50]
SWEEP_PASSAGE = [20, 30, 50]
TOKEN = re.compile(r"[^\W_]+(?:['’][^\W_]+)*")
# Top-level section headings of the rendered pages, the ones a passage is labelled with.
HEADINGS = ["Publication history", "Fictional character biography", "Powers and abilities", "Other versions",
            "In other media", "Reception", "Collected editions", "Bibliography", "Creation", "Characterization",
            "Supporting characters", "Equipment", "References", "External links", "Notes", "See also"]


def tokenize(text):
    """[(token, start, end)] with the token lowercased and its span in `text`."""
    return [(m.group().lower(), m.start(), m.end()) for m in TOKEN.finditer(text)]


def section_starts(text):
    """[(char offset, heading)] for each heading line, in page order."""
    out, at = [], 0
    for line in text.split("\n"):
        if line.strip() in HEADINGS:
            out.append((at, line.strip()))
        at += len(line) + 1
    return out


def section_at(starts, offset):
    name = "Lead"
    for at, heading in starts:
        if at > offset:
            break
        name = heading
    return name


def gram_index(toks, n):
    """{n-gram: {page: [token positions]}} over every page."""
    index = defaultdict(lambda: defaultdict(list))
    for page in sorted(toks):
        words = [w for w, _, _ in toks[page]]
        for i in range(len(words) - n + 1):
            index[tuple(words[i:i + n])][page].append(i)
    return index


def runs(starts, n):
    """Merge n-gram start positions into [start, end) token passages: two
    n-grams belong to one passage when they overlap, so a template n-gram
    missing from the middle of a copied paragraph does not split it."""
    out = []
    starts = sorted(set(starts))
    first = prev = starts[0]
    for p in starts[1:]:
        if p >= prev + n:
            out.append((first, prev + n))
            first = p
        prev = p
    out.append((first, prev + n))
    return out


def shared_passages(index, n, template):
    """{(a, b): (passages on a, passages on b)} for every pair sharing a rare n-gram, a < b."""
    on_a, on_b = defaultdict(list), defaultdict(list)
    for where in index.values():
        if 2 <= len(where) <= template:
            for a, b in itertools.combinations(sorted(where), 2):
                # Every occurrence: a passage copied twice on a page counts twice.
                on_a[(a, b)].extend(where[a])
                on_b[(a, b)].extend(where[b])
    return {pair: (runs(on_a[pair], n), runs(on_b[pair], n)) for pair in on_a}


def linked(g, a, b):
    return g.has_edge(a, b) or g.has_edge(b, a)


def summary(pairs, min_passage, g):
    """Pairs that copy (a passage of min_passage tokens or more), and the network they form."""
    copy = {k: v for k, v in pairs.items() if max(e - s for s, e in v[0]) >= min_passage}
    net = nx.Graph(list(copy))
    clusters = sorted(nx.connected_components(net), key=lambda c: (-len(c), sorted(c)))
    return copy, {"pairs": len(copy), "pages": net.number_of_nodes(), "clusters": len(clusters),
                  "largest": len(clusters[0]) if clusters else 0,
                  "linked_share": round(sum(linked(g, a, b) for a, b in copy) / len(copy), 4) if copy else None}


def layout(net):
    """Fixed positions in a square 0-1 frame, for a figure beside the text:
    clusters of three or more stacked in the middle (Kamada-Kawai each,
    unweighted, in a box sized by its page count), their names to the left; the
    pairs down the right edge, one row each, named once to the left of the pair."""
    clusters = sorted(nx.connected_components(net), key=lambda c: (-len(c), sorted(c)))
    big = [c for c in clusters if len(c) > 2]
    pairs = [sorted(c) for c in clusters if len(c) == 2]
    pos, top, pages = {}, 0.0, sum(len(c) for c in big)
    for c in big:
        # A subgraph view can iterate its node set in hash order, and Kamada-Kawai
        # starts from that order: build the cluster with its nodes and links sorted.
        sub = nx.Graph()
        sub.add_nodes_from(sorted(c))
        sub.add_weighted_edges_from(sorted((min(u, v), max(u, v), w) for u, v, w in net.edges(c, data="weight")))
        # Unweighted: Kamada-Kawai reads a weight as a distance, which would push
        # the pages that share the most words furthest apart.
        local = nx.kamada_kawai_layout(sub, weight=None)
        box = len(c) / pages
        xs = [p[0] for p in local.values()]
        ys = [p[1] for p in local.values()]
        span = max(max(xs) - min(xs), max(ys) - min(ys)) or 1
        side = min(0.26, box - 0.08)
        for n, (px, py) in local.items():
            pos[n] = (0.37 + side * (px - min(xs)) / span, top + 0.04 + side * (py - min(ys)) / span)
        top += box
    for i, (a, b) in enumerate(pairs):
        y = 0.03 + 0.94 * i / max(1, len(pairs) - 1)
        pos[a], pos[b] = (0.90, y), (0.96, y)
    return {n: (round(px, 4), round(py, 4)) for n, (px, py) in pos.items()}


def quote(text, toks, s, e, limit=QUOTE_TOKENS):
    """The passage's own text on the page, cut to `limit` tokens."""
    end = min(e, s + limit)
    return " ".join(text[toks[s][1]:toks[end - 1][2]].split()) + (" …" if end < e else "")


def main():
    text = pages()
    g = graph()
    names = dict(zip(nodes().node_id, nodes().name))
    toks = {p: tokenize(t) for p, t in text.items()}
    heads = {p: section_starts(t) for p, t in text.items()}
    all_pairs = len(text) * (len(text) - 1) // 2
    linked_pairs = nx.Graph(g.to_undirected()).number_of_edges()
    base_share = linked_pairs / all_pairs

    index = gram_index(toks, N)
    df = Counter({gram: len(where) for gram, where in index.items()})
    template_top = [{"ngram": " ".join(gram), "pages": c} for gram, c in df.most_common(6)]
    pairs = shared_passages(index, N, TEMPLATE_PAGES)
    copy, head = summary(pairs, MIN_PASSAGE, g)
    phrase = {k: v for k, v in pairs.items() if k not in copy}
    copy_linked = sum(linked(g, a, b) for a, b in copy)
    phrase_linked = sum(linked(g, a, b) for a, b in phrase)
    test = binomtest(copy_linked, len(copy), base_share, alternative="greater")

    # The copying network: every pair that copies, its passages quoted and labelled.
    links, by_section = [], Counter()
    for (a, b), (pa, pb) in sorted(copy.items()):
        covered = sum(e - s for s, e in pa)
        longest = max(range(len(pa)), key=lambda i: pa[i][1] - pa[i][0])
        (sa, ea), (sb, eb) = pa[longest], max(pb, key=lambda r: r[1] - r[0])
        # Sections on both pages of the pair: the same passage can sit under
        # Publication history on one and Fictional character biography on the other.
        for page, spans in ((a, pa), (b, pb)):
            for s, e in spans:
                by_section[section_at(heads[page], toks[page][s][1])] += e - s
        links.append({
            "a": a, "b": b, "tokens": covered, "passages": len(pa), "linked": linked(g, a, b),
            "longest": ea - sa,
            "section_a": section_at(heads[a], toks[a][sa][1]), "section_b": section_at(heads[b], toks[b][sb][1]),
            "quote": quote(text[a], toks[a], sa, ea),
        })
    links.sort(key=lambda r: (-r["tokens"], r["a"], r["b"]))
    net = nx.Graph()
    net.add_weighted_edges_from((r["a"], r["b"], r["tokens"]) for r in links)
    pos = layout(net)
    clusters = sorted(nx.connected_components(net), key=lambda c: (-len(c), sorted(c)))
    cluster_of = {p: i for i, c in enumerate(clusters) for p in c}
    page_nodes = [{"id": p, "name": names[p], "cluster": cluster_of[p], "x": pos[p][0], "y": pos[p][1],
                   "copied_tokens": int(net.degree(p, weight="weight"))} for p in sorted(net)]
    ties = {}
    with TIES.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            ties[frozenset(row["pages"].split(";"))] = row
    cluster_rows = []
    for i, c in enumerate(clusters):
        inside = [r for r in links if r["a"] in c]
        top = inside[0]
        tie = ties.get(frozenset(c))
        if tie is None:
            raise SystemExit(f"{TIES.name} has no row for the cluster {sorted(c)}; read its pages and add one")
        cluster_rows.append({"id": i, "pages": sorted(c), "names": [names[p] for p in sorted(c)],
                             "tokens": sum(r["tokens"] for r in inside), "pairs": len(inside),
                             "top_pair": [top["a"], top["b"]], "top_section": top["section_a"],
                             "tie": tie["tie"], "tie_note": tie["note"]})

    # What the longer n-gram adds: passages that 8-grams split, because a
    # site-wide phrase inside them counts as template, but 12-grams bridge.
    index_alt = gram_index(toks, N_ALT)
    copy_alt, _ = summary(shared_passages(index_alt, N_ALT, TEMPLATE_PAGES), MIN_PASSAGE, g)
    extra = sorted(set(copy_alt) - set(copy))
    extra_net = nx.Graph(extra)
    extra_rows = []
    for c in sorted(nx.connected_components(extra_net), key=lambda c: (-len(c), sorted(c))):
        a, b = min(p for p in extra if p[0] in c)
        s, e = max(copy_alt[(a, b)][0], key=lambda r: r[1] - r[0])
        extra_rows.append({"pages": sorted(c), "names": [names[p] for p in sorted(c)],
                           "pairs": sum(1 for p in extra if p[0] in c),
                           "linked": sum(linked(g, *p) for p in extra if p[0] in c),
                           "section": section_at(heads[a], toks[a][s][1]), "example": [a, b],
                           "quote": quote(text[a], toks[a], s, e)})

    # Sensitivity: the same counts under every cutoff, for both n-gram lengths.
    sweep = []
    for n in (N, N_ALT):
        idx = index if n == N else index_alt
        for template in SWEEP_TEMPLATE:
            shared = shared_passages(idx, n, template)
            for min_passage in SWEEP_PASSAGE:
                sweep.append({"n": n, "template_pages": template, "min_passage": min_passage,
                              **summary(shared, min_passage, g)[1]})

    out = {
        "meta": {
            "script": "analysis/week05_copying.py", "owner": "Gyula",
            "tokeniser": "letters and digits, apostrophes inside a word kept, lowercased; punctuation dropped",
            "n": N, "n_alt": N_ALT, "template_pages": TEMPLATE_PAGES, "min_passage": MIN_PASSAGE,
            "pages": len(text), "tokens": sum(len(t) for t in toks.values()),
        },
        "template": {"top": template_top, "ngrams_over_cutoff": sum(1 for c in df.values() if c > TEMPLATE_PAGES)},
        "headline": {**head, "phrase_pairs": len(phrase),
                     "phrase_linked_share": round(phrase_linked / len(phrase), 4),
                     "copy_linked": copy_linked,
                     "all_pairs": all_pairs, "all_linked": linked_pairs, "all_linked_share": round(base_share, 4),
                     "binomial_p": float(f"{test.pvalue:.3g}"),
                     "copied_tokens": sum(r["tokens"] for r in links),
                     "section_tokens": sum(by_section.values())},
        "sections": [{"section": s, "tokens": t} for s, t in by_section.most_common()],
        "nodes": page_nodes, "links": links, "clusters": cluster_rows,
        "alt_extra": {"n": N_ALT, "pairs": len(extra), "groups": extra_rows},
        "sweep": sweep,
    }
    check(PAGE, out)
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({k: out[k] for k in ("headline", "sections")}, indent=1))
    print([(c["names"], c["tokens"]) for c in cluster_rows])


if __name__ == "__main__":
    sys.exit(main())
