"""Shared Marvel communities for week 5 sections that need a partition.

Week 4's post was about H-1B filings, so the Marvel roster has no saved
communities yet. Section 4 (autocomplete) reads this file; section 1
(relations) runs its own Louvain. Louvain runs on the giant component of the
undirected weighted link network from week05_text.weighted(), 100 times with
seeds SEED + i, through louvain() from week04_staffing.

The 100 runs disagree: the most frequent partition recurs in only a few runs.
So the groups written here are a consensus: two pages share a group when at
least half the runs put them together, and Louvain (seeded) splits that
co-assignment graph. Components outside the giant stay whole, one group each.

Modularity is held to a strength-preserving null: degree-preserving double
edge swaps between two edges of equal weight, so every page keeps both its
number of partners and its total link weight.

    python analysis/week05_communities.py

Output: public/weeks/week05/data/communities.json
"""

from __future__ import annotations

import json
import random
import re
import sys
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path

import networkx as nx
import numpy as np
from sklearn.metrics import normalized_mutual_info_score as nmi

from week04_staffing import giant_of, louvain, tracked
from week05_text import nodes, weighted

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "weeks" / "week05" / "data" / "communities.json"
SEED = 2805
RUNS = 100
NULL_RUNS = 100
CONSENSUS = 0.5  # share of runs two pages must share a group in
# Swaps attempted per edge. The null's mean Q settles by 10 (50 null runs on
# the giant: 0.3479 ± 0.0045 at 10, 0.3465 ± 0.0041 at 50, 0.3472 ± 0.0045 at
# 100 swaps per edge), so 50 mixes with room to spare. The three edges of
# weight 12, 14 and 16 are alone in their weight class and never move.
SWAPS_PER_EDGE = 50


def rewire_strength(g: nx.Graph, rng: random.Random) -> nx.Graph:
    """Degree- and strength-preserving null: swap (a,b,w),(c,d,w) to
    (a,d,w),(c,b,w) for two edges of equal weight, rejecting self-loops and
    edges that already exist. Every node keeps its degree and its strength."""
    edges = [(u, v, d["weight"]) for u, v, d in g.edges(data=True)]
    present = {frozenset((u, v)) for u, v, _ in edges}
    by_weight = defaultdict(list)
    for i, (*_, w) in enumerate(edges):
        by_weight[w].append(i)
    classes = {w: ix for w, ix in sorted(by_weight.items()) if len(ix) > 1}
    movable = [i for ix in classes.values() for i in ix]
    for _ in range(SWAPS_PER_EDGE * len(edges)):
        i = movable[rng.randrange(len(movable))]
        a, b, w = edges[i]
        same = classes[w]
        j = same[rng.randrange(len(same))]
        c, d, _ = edges[j]
        if rng.random() < 0.5:
            c, d = d, c
        if len({a, b, c, d}) < 4 or frozenset((a, d)) in present or frozenset((c, b)) in present:
            continue
        present -= {frozenset((a, b)), frozenset((c, d))}
        present |= {frozenset((a, d)), frozenset((c, b))}
        edges[i], edges[j] = (a, d, w), (c, b, w)
    h = nx.Graph()
    h.add_nodes_from(g)
    h.add_weighted_edges_from(edges)
    return h


def check_null(g: nx.Graph, h: nx.Graph) -> None:
    assert dict(g.degree()) == dict(h.degree()), "the null changed a degree"
    assert dict(g.degree(weight="weight")) == dict(h.degree(weight="weight")), "the null changed a strength"
    assert nx.number_of_selfloops(h) == 0


def partition_key(parts: list[set]) -> tuple[tuple[str, ...], ...]:
    """Canonical key so two Louvain runs that find the same groups compare equal."""
    return tuple(sorted(tuple(sorted(p)) for p in parts))


def label_array(parts: list[set], order: list[str]) -> np.ndarray:
    member = {n: k for k, p in enumerate(parts) for n in p}
    return np.array([member[n] for n in order])


def consensus_graph(order: list[str], labels: list[np.ndarray]) -> nx.Graph:
    """Pages joined when at least CONSENSUS of the runs put them in one group,
    weighted by that share."""
    together = np.zeros((len(order), len(order)))
    for lab in labels:
        together += lab[:, None] == lab[None, :]
    together /= len(labels)
    h = nx.Graph()
    h.add_nodes_from(order)
    for i, j in zip(*np.nonzero(np.triu(together, k=1) >= CONSENSUS)):
        h.add_edge(order[i], order[j], weight=float(together[i, j]))
    return h


def modularity(g: nx.Graph, parts: list[set]) -> float:
    return nx.community.modularity(g, parts, weight="weight")


def name_map() -> dict[str, str]:
    table = nodes()
    return dict(zip(table.node_id, table.name))


def label_community(members: set[str], g: nx.Graph, names: dict[str, str], where: str) -> dict:
    """Name a community after its highest-strength member; list a few hubs."""
    ranked = sorted(members, key=lambda n: (-g.degree(n, weight="weight"), n))
    hubs = [
        {"node_id": n, "name": names[n], "strength": int(g.degree(n, weight="weight"))}
        for n in ranked[:5]
    ]
    return {
        # "Wolverine (character)" reads as Wolverine; other brackets stay.
        "label": re.sub(r" \((?:character|Marvel Comics)\)$", "", names[ranked[0]]),
        "size": len(members),
        "where": where,
        "hubs": hubs,
        "members": sorted(members),
    }


def main() -> int:
    g_full = weighted()
    giant = giant_of(g_full)
    order = list(giant)
    names = name_map()

    runs = [louvain(giant, SEED + i) for i in tracked("louvain", RUNS)]
    keys = [partition_key(parts) for parts, _ in runs]
    counts = Counter(keys)
    _, mode_count = counts.most_common(1)[0]
    qs = np.array([q for _, q in runs], dtype=float)
    sizes = Counter(len(parts) for parts, _ in runs)
    common_k, common_k_runs = min(sizes.items(), key=lambda kv: (-kv[1], kv[0]))
    labels = [label_array(parts, order) for parts, _ in runs]
    pair_nmi = np.array([nmi(labels[i], labels[j]) for i, j in combinations(range(RUNS), 2)])

    # Consensus: Louvain on the co-assignment graph, every seed; keep seed SEED's.
    together = consensus_graph(order, labels)
    consensus_runs = [louvain(together, SEED + i)[0] for i in range(RUNS)]
    consensus = consensus_runs[0]
    consensus_agree = sum(partition_key(p) == partition_key(consensus) for p in consensus_runs)
    consensus_labels = label_array(consensus, order)
    nmi_to_runs = np.array([nmi(consensus_labels, lab) for lab in labels])

    null_qs = []
    for i in tracked("null", NULL_RUNS):
        h = rewire_strength(giant, random.Random(SEED + 10_000 + i))
        check_null(giant, h)
        null_qs.append(louvain(h, SEED + i)[1])
    null_qs = np.array(null_qs, dtype=float)
    z = float((qs.mean() - null_qs.mean()) / null_qs.std())

    # Groups: the consensus inside the giant, then every other component whole
    # (the 9 Strikeforce: Morituri pages, and the 17 pages with no links).
    communities = [
        label_community(p, giant, names, "giant")
        for p in sorted(consensus, key=lambda p: (-len(p), min(p)))
    ]
    others = sorted(
        (c for c in nx.connected_components(g_full) if not c & set(order)),
        key=lambda c: (-len(c), min(c)),
    )
    for comp in others:
        communities.append(
            label_community(comp, g_full, names, "component" if len(comp) > 1 else "isolate")
        )
    membership = {n: i for i, c in enumerate(communities) for n in c["members"]}
    assert len(membership) == g_full.number_of_nodes()

    payload = {
        "generated_by": "analysis/week05_communities.py",
        "seed": SEED,
        "runs": RUNS,
        "null_runs": NULL_RUNS,
        "network": {
            "nodes": g_full.number_of_nodes(),
            "edges": g_full.number_of_edges(),
            "giant_nodes": giant.number_of_nodes(),
            "giant_edges": giant.number_of_edges(),
            "other_components": sum(len(c) > 1 for c in others),
            "other_component_nodes": sum(len(c) for c in others if len(c) > 1),
            "isolates": sum(len(c) == 1 for c in others),
        },
        "louvain": {
            "modularity_mean": round(float(qs.mean()), 4),
            "modularity_sd": round(float(qs.std()), 4),
            "mode_count": int(mode_count),
            "distinct_partitions": len(counts),
            "communities_per_run": {str(k): v for k, v in sorted(sizes.items())},
            "common_k": int(common_k),
            "common_k_runs": int(common_k_runs),
            "nmi_median": round(float(np.median(pair_nmi)), 4),
            "nmi_p05": round(float(np.percentile(pair_nmi, 5)), 4),
            "nmi_p95": round(float(np.percentile(pair_nmi, 95)), 4),
        },
        "consensus": {
            "rule": f"two pages share a group when at least {CONSENSUS:.0%} of the {RUNS} runs put them together; "
                    "Louvain on that co-assignment graph, weighted by the share",
            "threshold": CONSENSUS,
            "communities": len(consensus),
            "sizes": sorted((len(p) for p in consensus), reverse=True),
            "modularity": round(float(modularity(giant, consensus)), 4),
            "seeds_agreeing": int(consensus_agree),
            "nmi_to_runs_median": round(float(np.median(nmi_to_runs)), 4),
        },
        "null": {
            "method": "degree- and strength-preserving: double edge swaps between edges of equal weight",
            "swaps_per_edge": SWAPS_PER_EDGE,
            "modularity_mean": round(float(null_qs.mean()), 4),
            "modularity_sd": round(float(null_qs.std()), 4),
            "z": round(z, 1),
            "null_runs_at_or_above_real": int((null_qs >= qs.mean()).sum()),
        },
        "communities": communities,
        "membership": membership,
    }

    from check_pages import check

    check(OUT, payload)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"wrote {OUT.relative_to(ROOT)}: consensus {len(consensus)} groups in the giant "
        f"({consensus_agree}/{RUNS} seeds agree), mean Q={qs.mean():.3f} against null "
        f"{null_qs.mean():.3f} ± {null_qs.std():.3f} (z={z:.1f}); mode {mode_count}/{RUNS}, "
        f"{len(counts)} distinct; median NMI {np.median(pair_nmi):.3f}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
