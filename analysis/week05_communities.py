"""Shared Marvel communities for week 5 sections that need a partition.

Week 4's post was about H-1B filings, so the Marvel roster has no saved
communities yet. Sections 1 (relations) and 4 (autocomplete) both read this
file. Louvain runs on the undirected weighted link network from
week05_text.weighted(), many times with seeds SEED + i.

    python analysis/week05_communities.py

Output: docs/weeks/week05/data/communities.json
"""

from __future__ import annotations

import json
import random
import sys
from collections import Counter
from pathlib import Path

import igraph as ig
import networkx as nx
import numpy as np

from week05_text import nodes, weighted

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "weeks" / "week05" / "data" / "communities.json"
SEED = 2805
RUNS = 100
NULL_RUNS = 50


def giant_of(g: nx.Graph) -> nx.Graph:
    """Largest connected component, nodes and edges in g's own order."""
    comp = max(nx.connected_components(g), key=len)
    h = nx.Graph()
    h.add_nodes_from((n, g.nodes[n]) for n in g if n in comp)
    h.add_edges_from((u, v, d) for u, v, d in g.edges(data=True) if u in comp)
    return h


def to_igraph(g: nx.Graph):
    node_list = list(g)
    index = {n: i for i, n in enumerate(node_list)}
    h = ig.Graph(n=len(node_list), edges=[(index[u], index[v]) for u, v in g.edges()])
    weights = [d.get("weight", 1) for *_, d in g.edges(data=True)]
    return node_list, h, weights


def louvain(g: nx.Graph, seed: int):
    node_list, h, weights = to_igraph(g)
    ig.set_random_number_generator(random.Random(seed))
    part = h.community_multilevel(weights=weights)
    return [{node_list[i] for i in c} for c in part], h.modularity(part, weights=weights)


def rewire_onemode(g: nx.Graph, rng: random.Random) -> nx.Graph:
    """Degree-preserving rewiring; original weights shuffled onto the new edges."""
    h = g.copy()
    weights = [d["weight"] for *_, d in g.edges(data=True)]
    m = h.number_of_edges()
    try:
        nx.double_edge_swap(h, nswap=10 * m, max_tries=100 * m, seed=rng)
    except nx.NetworkXAlgorithmError:
        pass
    shuffled = weights.copy()
    rng.shuffle(shuffled)
    for (u, v), w in zip(h.edges(), shuffled):
        h[u][v]["weight"] = w
    return h


def partition_key(parts: list[set]) -> tuple[tuple[str, ...], ...]:
    """Canonical key so two Louvain runs that find the same groups compare equal."""
    return tuple(sorted(tuple(sorted(p)) for p in parts))


def name_map() -> dict[str, str]:
    table = nodes()
    return dict(zip(table.node_id, table.name))


def label_community(members: set[str], g: nx.Graph, names: dict[str, str]) -> dict:
    """Name a community after its highest-strength member; list a few hubs."""
    ranked = sorted(
        members,
        key=lambda n: (-g.degree(n, weight="weight"), n),
    )
    hubs = [
        {"node_id": n, "name": names[n], "strength": int(g.degree(n, weight="weight"))}
        for n in ranked[:5]
    ]
    return {
        "label": names[ranked[0]],
        "size": len(members),
        "hubs": hubs,
        "members": sorted(members),
    }


def main() -> int:
    g_full = weighted()
    giant = giant_of(g_full)
    names = name_map()
    rng = random.Random(SEED)

    runs = [louvain(giant, SEED + i) for i in range(RUNS)]
    keys = [partition_key(parts) for parts, _ in runs]
    counts = Counter(keys)
    mode_key, mode_count = counts.most_common(1)[0]
    mode_idx = keys.index(mode_key)
    mode_parts, mode_q = runs[mode_idx]
    qs = np.array([q for _, q in runs], dtype=float)

    null_qs = []
    for i in range(NULL_RUNS):
        h = rewire_onemode(giant, random.Random(SEED + 10_000 + i))
        _, q = louvain(h, SEED + i)
        null_qs.append(q)
    null_qs = np.array(null_qs, dtype=float)
    z = float((mode_q - null_qs.mean()) / null_qs.std()) if null_qs.std() > 0 else float("nan")

    # Isolates and smaller components sit outside Louvain's giant; keep them
    # as singleton communities so every page has a home for autocomplete.
    giant_nodes = set(giant)
    leftovers = sorted(n for n in g_full if n not in giant_nodes)
    communities = [
        label_community(p, giant, names)
        for p in sorted(mode_parts, key=lambda p: (-len(p), min(p)))
    ]
    for node_id in leftovers:
        communities.append(
            {
                "label": names[node_id],
                "size": 1,
                "hubs": [{"node_id": node_id, "name": names[node_id], "strength": 0}],
                "members": [node_id],
                "outside_giant": True,
            }
        )

    # Keep communities large enough to train a trigram model; tiny ones still
    # appear in the partition but the autocomplete section filters them.
    membership = {}
    for i, comm in enumerate(communities):
        for node_id in comm["members"]:
            membership[node_id] = i

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
            "outside_giant": len(leftovers),
        },
        "louvain": {
            "modularity": round(float(mode_q), 4),
            "modularity_mean": round(float(qs.mean()), 4),
            "modularity_sd": round(float(qs.std()), 4),
            "communities_in_giant": len(mode_parts),
            "communities_total": len(communities),
            "mode_count": int(mode_count),
            "mode_share": round(mode_count / RUNS, 4),
            "distinct_partitions": len(counts),
            "sizes": [c["size"] for c in communities if not c.get("outside_giant")],
        },
        "null": {
            "modularity_mean": round(float(null_qs.mean()), 4),
            "modularity_sd": round(float(null_qs.std()), 4),
            "z": round(z, 2),
            "null_runs_at_or_above_real": int((null_qs >= mode_q).sum()),
        },
        "communities": communities,
        "membership": membership,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    # Schema check is registered once week05_schemas knows this path.
    try:
        from check_pages import check

        check(OUT, payload)
    except SystemExit as err:
        # Allow a first write before the schema is registered.
        if "has no model" not in str(err):
            raise
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {OUT.relative_to(ROOT)}: "
        f"{len(mode_parts)} giant communities, Q={mode_q:.3f}, "
        f"mode {mode_count}/{RUNS}, null z={z:.1f}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
