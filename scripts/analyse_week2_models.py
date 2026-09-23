"""Week 2 models and null model, rebuilt from the frozen snapshot.

Writes docs/assets/data/week02_screentest.json, which is the only source the
Screen Test prototype reads. Nothing here is hand-entered: the three candidate
models, their layouts, the CCDFs and the whole null distribution are computed
from docs/assets/data/arcade_graph.json every run.

    python scripts/analyse_week2_models.py

One fixed seed per model, so each candidate is one reproducible draw rather
than an average over many. The null model applies degree-preserving
double-edge swaps; connectivity is not enforced, so a shuffled network may
break apart and path length is then measured on its largest piece.
"""
import json
import math
import random
import statistics as st
import sys
from pathlib import Path

import networkx as nx
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "analysis"))
from week04_staffing import tracked  # noqa: E402

DATA = ROOT / "docs/assets/data"
SEED = 20260914
SAMPLES = 400


def core_graph(raw):
    """The connected core, collapsed to simple undirected links."""
    core = {n["id"] for n in raw["nodes"] if n.get("component") == "core"}
    nodes = [n for n in raw["nodes"] if n["id"] in core]
    index = {n["id"]: i for i, n in enumerate(nodes)}
    seen, edges = set(), []
    for a, b in raw["links"]:
        if a in core and b in core and a != b:
            key = tuple(sorted((a, b)))
            if key not in seen:
                seen.add(key)
                edges.append([index[key[0]], index[key[1]]])
    g = nx.Graph()
    g.add_nodes_from(range(len(nodes)))
    g.add_edges_from(edges)
    return nodes, edges, g


def measure(g):
    """Metrics used on the scorecard, taken on the largest component."""
    if not nx.is_connected(g):
        g = g.subgraph(max(nx.connected_components(g), key=len)).copy()
    degree = dict(g.degree())
    paradox = sum(
        1
        for v in g
        if g[v] and sum(degree[u] for u in g[v]) / len(g[v]) > degree[v]
    )
    return {
        "n": g.number_of_nodes(),
        "m": g.number_of_edges(),
        "path": nx.average_shortest_path_length(g),
        "clus": nx.average_clustering(g),
        "trans": nx.transitivity(g),
        "kmax": max(degree.values()),
        "kvar": float(np.var(list(degree.values()))),
        "paradox": paradox / sum(1 for v in g if g[v]),
    }


def layout(g, seed=7):
    pos = nx.spring_layout(
        g, k=2.6 / math.sqrt(g.number_of_nodes()), iterations=400, seed=seed
    )
    p = np.array([pos[i] for i in sorted(g.nodes())])
    p -= p.min(0)
    p /= p.max(0).clip(1e-9)
    return [[round(float(x), 4), round(float(y), 4)] for x, y in p]


def ccdf(degrees):
    total = len(degrees)
    return [
        [k, round(sum(1 for d in degrees if d >= k) / total, 6)]
        for k in sorted(set(degrees))
        if k > 0
    ]


def pack(g):
    g = nx.convert_node_labels_to_integers(g, ordering="sorted")
    degrees = [d for _, d in sorted(g.degree())]
    return {
        "edges": [[a, b] for a, b in g.edges()],
        "pos": layout(g),
        "deg": degrees,
        "ccdf": ccdf(degrees),
    }


def main():
    raw = json.loads((DATA / "arcade_graph.json").read_text())
    nodes, edges, marvel = core_graph(raw)
    n, m = marvel.number_of_nodes(), marvel.number_of_edges()
    kbar = 2 * m / n
    ws_k = round(kbar / 2) * 2
    ba_m = max(1, round(kbar / 2))

    models = {
        "marvel": measure(marvel),
        "er": measure(nx.gnm_random_graph(n, m, seed=SEED)),
        "ws": measure(nx.watts_strogatz_graph(n, ws_k, 0.2, seed=SEED)),
        "ba": measure(nx.barabasi_albert_graph(n, ba_m, seed=SEED)),
    }
    nets = {
        "marvel": pack(marvel),
        "er": pack(nx.gnm_random_graph(n, m, seed=SEED)),
        "ws": pack(nx.watts_strogatz_graph(n, ws_k, 0.2, seed=SEED)),
        "ba": pack(nx.barabasi_albert_graph(n, ba_m, seed=SEED)),
    }

    swaps = 10 * m
    rng = random.Random(SEED)
    null = {k: [] for k in ("clus", "trans", "paradox", "path", "kmax")}
    for _ in tracked("null shuffles", SAMPLES):
        shuffled = marvel.copy()
        nx.double_edge_swap(
            shuffled, nswap=swaps, max_tries=40 * swaps, seed=rng.randint(0, 10**9)
        )
        sample = measure(shuffled)
        for key in null:
            null[key].append(sample[key])

    rows = []
    for key, label in [
        ("clus", "Average clustering"),
        ("trans", "Transitivity"),
        ("paradox", "Friendship paradox rate"),
        ("path", "Mean path length"),
    ]:
        real, draws = models["marvel"][key], null[key]
        mu, sd = st.mean(draws), st.pstdev(draws)
        z = (real - mu) / sd if sd else float("nan")
        extreme = sum(1 for d in draws if (d >= real if z >= 0 else d <= real))
        rows.append(
            {
                "key": key,
                "label": label,
                "real": real,
                "mu": mu,
                "sd": sd,
                "z": z,
                "p": (extreme + 1) / (len(draws) + 1),
                "direction": "above" if z >= 0 else "below",
            }
        )
        print(f"{label:26} real={real:9.4f} null={mu:9.4f} +/- {sd:.4f} z={z:+7.2f}")

    degree = dict(marvel.degree())
    chars = [
        [
            node["name"].replace(" (character)", "").replace(" (Marvel_Comics)", ""),
            degree[i],
            round(sum(degree[u] for u in marvel[i]) / len(marvel[i]), 2)
            if marvel[i]
            else 0,
            node["url"],
            (node.get("text") or "").split(". ")[0][:150],
        ]
        for i, node in enumerate(nodes)
    ]

    payload = {
        "meta": {
            "n": n,
            "m": m,
            "kbar": round(kbar, 2),
            "snapshot": raw["snapshot"],
            "seed": SEED,
            "ws_k": ws_k,
            "ba_m": ba_m,
            "samples": SAMPLES,
            "swaps": swaps,
        },
        "models": models,
        "rows": rows,
        "null": {k: [round(x, 6) for x in v] for k, v in null.items() if k != "kmax"},
        "control": {
            "label": "Largest hub",
            "real": models["marvel"]["kmax"],
            "nullMean": st.mean(null["kmax"]),
            "nullSd": st.pstdev(null["kmax"]),
        },
        "nets": nets,
        "chars": chars,
        "adj": [sorted(marvel[i]) for i in range(n)],
    }
    out = DATA / "week02_screentest.json"
    out.write_text(json.dumps(payload, separators=(",", ":"), allow_nan=False))
    print(f"\nwrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
