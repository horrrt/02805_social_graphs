"""Week 2: shuffle-test ten quantities against two different null models.

Run: python analysis/week02_nullmodels.py
Unlike week02_resilience.py, which works on the connected 277-article core, this
runs on the whole 303-article undirected snapshot and does not condition on
connectedness -- that is what lets the number of islands vary under the null.
Every quantity is measured on the real network and on 1,000 draws from each of
two nulls, and reported as a z-score and an empirical p-value.
"""
import csv
import hashlib
import json
import platform
import statistics
import time
from pathlib import Path

import networkx as nx

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/assets/data"
SEED = 2026091200
N_DRAWS = 1000
SWAP_FACTOR = 20

# label, how the site formats it, and whether a high real value is the claim
QUANTITIES = [
    ("avg_clustering", "Average clustering C", 3),
    ("transitivity", "Transitivity", 3),
    ("triangles", "Triangles", 0),
    ("assortativity", "Degree assortativity", 3),
    ("neighbour_degree_edge", "Mean degree at the end of a random link", 2),
    ("neighbour_degree_node", "Mean degree of a random character's random friend", 2),
    ("friend_at_least", "Chance your random friend is at least as linked as you", 3),
    ("unbeaten", "Characters no friend out-links", 0),
    ("components", "Connected components (islands)", 0),
    ("giant_size", "Largest component", 0),
    ("hub_share", "Biggest hub's share of all link ends", 4),
    ("avg_path_giant", "Average distance inside the largest component", 3),
]


def load_graph():
    """The week-1 snapshot, undirected, with all 303 nodes added before any edge."""
    with (ROOT / "data/week1_nodes.tsv").open() as f:
        roster = list(csv.DictReader((l for l in f if not l.startswith("#")), delimiter="\t"))
    directed = nx.DiGraph()
    directed.add_nodes_from(r["node_id"] for r in roster)
    with (ROOT / "data/week1_edges.tsv").open() as f:
        directed.add_edges_from(csv.reader((l for l in f if not l.startswith("#")), delimiter="\t"))
    graph = directed.to_undirected()
    assert (len(directed), directed.number_of_edges()) == (303, 1784)
    assert (len(graph), graph.number_of_edges()) == (303, 1434)
    assert nx.number_of_selfloops(graph) == 0
    return graph, {r["node_id"]: r for r in roster}


def paradox_context(graph, roster):
    """Who the paradox names: the characters no friend out-links, and the averages."""
    degree = dict(graph.degree())
    linked = [u for u in graph if degree[u]]
    unbeaten = [u for u in linked if all(degree[v] <= degree[u] for v in graph[u])]
    return {
        "meanDegreeAll": round(statistics.fmean(degree.values()), 3),
        "meanDegreeLinked": round(statistics.fmean(degree[u] for u in linked), 3),
        "linked": len(linked),
        "unbeaten": [{"id": u, "name": roster[u]["name"], "degree": degree[u],
                      "friends": sorted(graph[u], key=lambda v: -degree[v])[:3]}
                     for u in sorted(unbeaten, key=lambda u: -degree[u])],
        "popularFriends": [
            {"id": u, "name": roster[u]["name"], "degree": degree[u],
             # How many characters have this article as one of their friends?
             "namedAsFriend": degree[u],
             "shareOfPairs": round(degree[u] / (2 * graph.number_of_edges()), 4)}
            for u in sorted(degree, key=lambda u: -degree[u])[:8]],
    }


def measure(graph):
    """The quantities under test. Every one is a single number per network."""
    degree = dict(graph.degree())
    degrees = list(degree.values())
    mean_k = statistics.fmean(degrees)
    mean_k2 = statistics.fmean(d * d for d in degrees)
    sizes = sorted((len(c) for c in nx.connected_components(graph)), reverse=True)
    giant = graph.subgraph(max(nx.connected_components(graph), key=len))
    # The friendship paradox, sampled the way the course states it: pick a
    # character uniformly at random, then one of their friends uniformly. Only
    # characters with at least one friend can take part.
    linked = [u for u in graph if degree[u]]
    return {
        "avg_clustering": nx.average_clustering(graph),
        "transitivity": nx.transitivity(graph),
        "triangles": sum(nx.triangles(graph).values()) // 3,
        "assortativity": nx.degree_assortativity_coefficient(graph),
        # <k^2>/<k>: a function of the degree sequence alone, so the swap null
        # cannot move it by even one decimal. That is the finding, not a bug.
        "neighbour_degree_edge": mean_k2 / mean_k,
        "neighbour_degree_node": statistics.fmean(
            statistics.fmean(degree[v] for v in graph[u]) for u in linked),
        "friend_at_least": statistics.fmean(
            sum(degree[v] >= degree[u] for v in graph[u]) / degree[u] for u in linked),
        "unbeaten": sum(all(degree[v] <= degree[u] for v in graph[u]) for u in linked),
        "components": len(sizes),
        "giant_size": sizes[0],
        "hub_share": max(degrees) / (2 * graph.number_of_edges()),
        "avg_path_giant": nx.average_shortest_path_length(giant),
    }


def swap_null(graph, seed):
    """Degree-preserving edge swaps: rewire A-B and C-D into A-D and C-B."""
    shuffled = graph.copy()
    edges = graph.number_of_edges()
    nx.double_edge_swap(shuffled, nswap=SWAP_FACTOR * edges,
                        max_tries=SWAP_FACTOR * edges * 20, seed=seed)
    assert dict(shuffled.degree()) == dict(graph.degree())
    assert shuffled.number_of_edges() == edges
    assert nx.number_of_selfloops(shuffled) == 0
    return shuffled


def er_null(graph, seed):
    """Erdos-Renyi G(n, m): the same node and link count, nothing else kept."""
    random = nx.gnm_random_graph(len(graph), graph.number_of_edges(), seed=seed)
    assert (len(random), random.number_of_edges()) == (len(graph), graph.number_of_edges())
    return random


def ensemble(graph, build, draws, seed_base, name):
    """Measure every quantity on `draws` networks from one null."""
    started = time.perf_counter()
    samples = {key: [] for key, *_ in QUANTITIES}
    for i in range(draws):
        for key, value in measure(build(graph, seed_base + i)).items():
            samples[key].append(value)
        if (i + 1) % 250 == 0:
            print(f"{name}: {i + 1}/{draws} draws ({time.perf_counter() - started:.0f}s)", flush=True)
    return samples


def compare(real, values, digits):
    """A shuffle test: z-score, and both empirical tails with the +1 correction."""
    spread = statistics.stdev(values)
    ordered = sorted(values)
    return {
        "mean": round(statistics.fmean(values), digits + 3),
        "sd": round(spread, digits + 3),
        # Undefined when the null cannot move the quantity at all.
        "z": None if spread == 0 else round((real - statistics.fmean(values)) / spread, 1),
        "pHigh": round((1 + sum(v >= real for v in values)) / (1 + len(values)), 5),
        "pLow": round((1 + sum(v <= real for v in values)) / (1 + len(values)), 5),
        "min": round(ordered[0], digits + 3),
        "max": round(ordered[-1], digits + 3),
        "fixed": spread == 0,
    }


def main():
    graph, roster = load_graph()
    real = measure(graph)
    context = paradox_context(graph, roster)
    # Cross-checks against analysis/week01_facts.json and the course page.
    assert (real["components"], real["giant_size"], real["triangles"]) == (19, 277, 1839)
    assert round(real["avg_clustering"], 4) == 0.3075 and round(real["transitivity"], 4) == 0.1825
    # The course page quotes ~10 links per character, ~25 for a random friend,
    # and "three out of four". Our numbers have to land on those.
    assert round(context["meanDegreeLinked"]) == 10 and round(real["neighbour_degree_node"]) == 24
    assert 0.74 < real["friend_at_least"] < 0.76

    nulls, draws = {}, []
    for name, build, base in [("swap", swap_null, SEED), ("er", er_null, SEED + 500000)]:
        samples = ensemble(graph, build, N_DRAWS, base, name)
        nulls[name] = {key: compare(real[key], samples[key], digits)
                       for key, _, digits in QUANTITIES}
        draws += [{"null": name, "seed": base + i,
                   **{key: samples[key][i] for key, *_ in QUANTITIES}}
                  for i in range(N_DRAWS)]

    payload = {
        "snapshot": "2026-08-26", "analysisDate": "2026-09-12",
        "population": {"nodes": 303, "arcs": 1784, "edges": 1434, "isolates": 17},
        "protocol": {
            "draws": N_DRAWS, "swapFactor": SWAP_FACTOR, "firstSeed": SEED,
            "python": platform.python_version(), "networkx": nx.__version__,
            "graph": "The whole 303-article snapshot, collapsed to simple undirected links.",
            "nulls": {
                "swap": "Degree-preserving double edge swaps, 20 successful swaps per link. "
                        "Keeps every article's degree exactly; scrambles who links to whom. "
                        "Not conditioned on connectedness, so the island count is free to move.",
                "er": "Erdos-Renyi G(n, m) with n = 303 and m = 1,434. Keeps only the node "
                      "and link counts; every degree is redrawn by chance.",
            },
            "statistics": "z = (real - null mean) / null sd. Empirical tails use "
                          "(1 + draws at least as extreme) / (1 + draws), so 1,000 draws "
                          "can never report p = 0. Tails are one-sided and unadjusted "
                          "across the ten quantities; read the histograms before quoting a z.",
            "limitations": "A finite swap chain approximates the null ensemble rather than "
                           "sampling it uniformly. Quantities fixed by a null's construction "
                           "have no z-score, which is the point, not a failure.",
            "hashes": {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                       for p in [ROOT / "data/week1_nodes.tsv", ROOT / "data/week1_edges.tsv"]},
        },
        "paradox": context,
        "quantities": [
            {"key": key, "label": label, "digits": digits,
             "real": round(real[key], digits + 3),
             "swap": nulls["swap"][key], "er": nulls["er"][key]}
            for key, label, digits in QUANTITIES
        ],
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "week02_nullmodels.json").write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    (ROOT / "analysis/week02_nullmodels_facts.json").write_text(json.dumps(payload, indent=2) + "\n")
    # Every draw, so the figures can bin the raw values and readers can re-check them.
    with (OUT / "week02_nullmodels_draws.csv").open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(draws[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(draws)

    width = max(len(label) for _, label, _ in QUANTITIES)
    print(f"\n{'quantity':<{width}}  {'real':>10}  {'swap mean':>10} {'z':>7}  {'ER mean':>10} {'z':>7}")
    for q in payload["quantities"]:
        swap, er = q["swap"], q["er"]
        z = lambda n: "fixed" if n["fixed"] else f"{n['z']:+.1f}"
        print(f"{q['label']:<{width}}  {q['real']:>10}  {swap['mean']:>10} {z(swap):>7}  {er['mean']:>10} {z(er):>7}")


if __name__ == "__main__":
    main()
