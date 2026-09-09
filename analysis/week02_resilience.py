"""Week 2: remove one article, then compare with a degree-preserving null.

Run: python analysis/week02_resilience.py
The website's main results, examples, and downloadable draws come from this file.
"""
import csv
import hashlib
import json
import platform
import statistics
import sys
from collections import Counter
from pathlib import Path

import networkx as nx

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/assets/data"
SEED = 2026090900
N_DRAWS = 1000
CASES = ["Spider-Man", "Hulk", "Black_Widow_(Natasha_Romanova)", "Doctor_Strange"]
LABELS = ["Spider-Man", "Hulk", "Black Widow", "Doctor Strange"]


def load_graph():
    with (ROOT / "data/week1_nodes.tsv").open() as f:
        roster = list(csv.DictReader((l for l in f if not l.startswith("#")), delimiter="\t"))
    directed = nx.DiGraph()
    directed.add_nodes_from(r["node_id"] for r in roster)
    with (ROOT / "data/week1_edges.tsv").open() as f:
        directed.add_edges_from(csv.reader((l for l in f if not l.startswith("#")), delimiter="\t"))
    undirected = directed.to_undirected()
    giant = max(nx.connected_components(undirected), key=len)
    graph = undirected.subgraph(sorted(giant)).copy()
    assert (len(directed), directed.number_of_edges(), undirected.number_of_edges()) == (303, 1784, 1434)
    assert (len(graph), graph.number_of_edges()) == (277, 1421)
    assert nx.number_of_selfloops(graph) == 0 and nx.is_connected(graph)
    return graph, {r["node_id"]: r for r in roster}


def outcome(graph, removed):
    after = graph.copy()
    after.remove_node(removed)
    components = sorted(nx.connected_components(after), key=lambda c: (-len(c), sorted(c)))
    stranded = sorted(set(after) - components[0])
    return {"stranded": stranded, "count": len(stranded), "largest": len(components[0]),
            "groups": [sorted(c) for c in components[1:]]}


def summarize(values, actual):
    ordered = sorted(values)
    # Nearest-rank empirical central interval; a range of simulated outcomes,
    # not a confidence interval for their mean.
    interval = [ordered[int(.025 * (len(values) - 1))], ordered[int(.975 * (len(values) - 1))]]
    exceed = sum(v >= actual for v in values)
    return {"mean": round(statistics.mean(values), 4), "median": statistics.median(values),
            "sd": round(statistics.stdev(values), 4), "interval95": interval,
            "min": min(values), "max": max(values), "atLeastReal": exceed,
            "upperTailEstimate": (1 + exceed) / (1 + len(values)),
            "histogram": [{"value": v, "count": c} for v, c in sorted(Counter(values).items())]}


def export_removal_scan(graph, roster):
    """Save the exploratory scan, including every unselected article."""
    articulation_points = set(nx.articulation_points(graph))
    scan = []
    for node in graph:
        result = outcome(graph, node)
        # An independent graph algorithm checks which removals disconnect it.
        assert (result["count"] > 0) == (node in articulation_points)
        assert result["count"] + result["largest"] + 1 == len(graph)
        scan.append({"node_id": node, "name": roster[node]["name"], "degree": graph.degree(node),
                     "stranded": result["count"], "largest_remaining_group": result["largest"]})
    scan.sort(key=lambda r: (-r["stranded"], -r["degree"], r["node_id"]))
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / "week02_all_removals.csv").open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(scan[0]), lineterminator="\n")
        writer.writeheader(); writer.writerows(scan)
    print(f"Verified all {len(scan)} removals against the articulation-point algorithm; {len(articulation_points)} fragment the graph.", flush=True)


def ensemble(graph, draws, factor, seed_base, keep_examples=False):
    expected_degrees = dict(graph.degree())
    records, examples = [], []
    attempts = rejected = 0
    while len(records) < draws:
        seed = seed_base + attempts
        attempts += 1
        shuffled = graph.copy()
        nx.double_edge_swap(shuffled, nswap=factor * graph.number_of_edges(),
                            max_tries=factor * graph.number_of_edges() * 20, seed=seed)
        assert dict(shuffled.degree()) == expected_degrees
        assert shuffled.number_of_edges() == graph.number_of_edges()
        assert nx.number_of_selfloops(shuffled) == 0 and not shuffled.is_multigraph()
        # Condition the null on the same connected starting state as the real
        # giant. Reject the whole draw, never silently repair its links.
        if not nx.is_connected(shuffled):
            rejected += 1
            continue
        results = {node: outcome(shuffled, node) for node in CASES}
        records.append({"seed": seed, **{n: v["count"] for n, v in results.items()}})
        if keep_examples and len(examples) < 4:
            examples.append({"seed": seed, "links": [list(e) for e in shuffled.edges()], "outcomes": results})
        if len(records) % 200 == 0:
            print(f"{factor}m swaps: {len(records)}/{draws} accepted ({rejected} disconnected draws rejected)", flush=True)
    return records, examples, rejected


def main():
    graph, roster = load_graph()
    export_removal_scan(graph, roster)
    if "--scan-only" in sys.argv:
        return
    actual = {n: outcome(graph, n) for n in CASES}
    # These outcomes are also checked in the browser with a separate traversal.
    assert [actual[n]["count"] for n in CASES] == [5, 0, 3, 2]
    assert graph.degree("Spider-Man") == max(dict(graph.degree()).values())
    draws, examples, rejected = ensemble(graph, N_DRAWS, 20, SEED, True)
    sensitivity, _, sensitivity_rejected = ensemble(graph, 200, 50, SEED + 100000)
    positions = {n["id"]: n for n in json.loads((OUT / "marvel_story.json").read_text())["nodes"]}
    cases = [{"id": node, "label": label, "degree": graph.degree(node),
              "real": actual[node], "null": summarize([r[node] for r in draws], actual[node]["count"]),
              "sensitivity": summarize([r[node] for r in sensitivity], actual[node]["count"])}
             for node, label in zip(CASES, LABELS)]
    payload = {
        "snapshot": "2026-08-26", "analysisDate": "2026-09-09",
        "population": {"roster": 303, "nodes": 277, "edges": 1421, "excluded": 26},
        "protocol": {"draws": N_DRAWS, "swapFactor": 20, "successfulSwaps": 20 * graph.number_of_edges(),
                     "firstSeed": SEED, "rejectedDisconnected": rejected,
                     "sensitivityDraws": 200, "sensitivitySwapFactor": 50,
                     "sensitivityRejectedDisconnected": sensitivity_rejected,
                     "python": platform.python_version(), "networkx": nx.__version__,
                     "null": "Simple undirected degree-preserving edge swaps, conditioned on connected output.",
                     "metric": "Remaining articles outside the largest component after removing one named article and all its incident edges.",
                     "selection": "Exploratory: Spider-Man is the highest-degree article. Hulk contrasts a large hub; Black Widow was chosen after inspecting all single-node removals; Doctor Strange is a second large hub with stranded neighbors.",
                     "limitations": "Finite edge-swap chains approximate a null ensemble; longer-run sensitivity is a diagnostic, not proof of uniform sampling. Tail estimates are descriptive, unadjusted across the four displayed cases. Links are article links, not friendships, readership or resilience of a fictional universe.",
                     "hashes": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT / "data/week1_nodes.tsv", ROOT / "data/week1_edges.tsv"]}},
        "nodes": [{"id": n, "name": roster[n]["name"], "url": roster[n]["url"], "degree": graph.degree(n),
                   "x": round((positions[n]["x"] - 55) / 605 * 780 + 45, 2),
                   "y": round((positions[n]["y"] - 60) / 520 * 510 + 45, 2)} for n in graph],
        "links": [list(e) for e in graph.edges()], "cases": cases, "examples": examples,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "week02_resilience.json").write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    for name, records in [("week02_null_draws.csv", draws), ("week02_sensitivity_draws.csv", sensitivity)]:
        with (OUT / name).open("w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["seed", *CASES], lineterminator="\n")
            writer.writeheader(); writer.writerows(records)
    facts = {k: v for k, v in payload.items() if k not in ["nodes", "links", "examples"]}
    (ROOT / "analysis/week02_facts.json").write_text(json.dumps(facts, indent=2) + "\n")
    print(json.dumps({c["label"]: {"degree": c["degree"], "real": c["real"]["count"],
                      "null": c["null"], "sensitivityMean": c["sensitivity"]["mean"]} for c in cases}, indent=2))


if __name__ == "__main__":
    main()
