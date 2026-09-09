"""Build the presentation's graph from the frozen roster and edge list.

Run from any directory: python analysis/week01_presentation.py
Positions are a deterministic drawing aid; all relationships and counts are data.
"""
import csv
import json
import math
from pathlib import Path

import networkx as nx

ROOT = Path(__file__).resolve().parents[1]


def build():
    with (ROOT / "data/week1_nodes.tsv").open() as file:
        rows = list(csv.DictReader((line for line in file if not line.startswith("#")), delimiter="\t"))
    graph = nx.DiGraph()
    graph.add_nodes_from(row["node_id"] for row in rows)
    with (ROOT / "data/week1_edges.tsv").open() as file:
        graph.add_edges_from(csv.reader((line for line in file if not line.startswith("#")), delimiter="\t"))

    components = sorted(nx.weakly_connected_components(graph), key=len, reverse=True)
    giant, island = components[:2]
    isolates = sorted(nx.isolates(graph))
    assert (len(graph), graph.number_of_edges()) == (303, 1784)
    assert [len(group) for group in components] == [277, 9] + [1] * 17
    assert graph.subgraph(island).number_of_edges() == 22
    layout = nx.spring_layout(graph.subgraph(sorted(giant)).to_undirected(), seed=28, k=0.22, iterations=180)
    xs, ys = [p[0] for p in layout.values()], [p[1] for p in layout.values()]
    positions = {node: (55 + (p[0] - min(xs)) / (max(xs) - min(xs)) * 605,
                        60 + (p[1] - min(ys)) / (max(ys) - min(ys)) * 520)
                 for node, p in layout.items()}
    for index, node in enumerate(sorted(island)):
        angle = index * math.tau / len(island) - math.pi / 2
        positions[node] = (795 + 79 * math.cos(angle), 200 + 79 * math.sin(angle))
    for index, node in enumerate(isolates):
        positions[node] = (720 + index % 5 * 35, 409 + index // 5 * 36)

    payload = {
        "snapshot": "2026-08-26",
        "nodes": [{"id": row["node_id"], "name": row["name"], "url": row["url"],
                   "kin": graph.in_degree(row["node_id"]), "kout": graph.out_degree(row["node_id"]),
                   "grp": "giant" if row["node_id"] in giant else "island" if row["node_id"] in island else "isolate",
                   "x": round(positions[row["node_id"]][0], 2), "y": round(positions[row["node_id"]][1], 2)}
                  for row in rows],
        "links": [{"s": source, "t": target} for source, target in graph.edges()],
    }
    # Counterfactuals are separate from the frozen links; no source edges change.
    assert graph.degree("Baymax") == 0
    payload["signal"] = {}
    for mode, extra in {
        "snapshot": [],
        "out": [("Baymax", "Spider-Man")],
        "in": [("Spider-Man", "Baymax")],
        "both": [("Baymax", "Spider-Man"), ("Spider-Man", "Baymax")],
    }.items():
        imagined = graph.copy()
        imagined.add_edges_from(extra)
        ancestors = nx.ancestors(imagined, "Baymax")
        descendants = nx.descendants(imagined, "Baymax")
        payload["signal"][mode] = {
            "to": len(ancestors), "from": len(descendants),
            "roundTrip": len(ancestors & descendants), "added": len(extra),
        }
    assert payload["signal"]["in"] == {"to": 274, "from": 0, "roundTrip": 0, "added": 1}
    assert payload["signal"]["out"] == {"to": 0, "from": 231, "roundTrip": 0, "added": 1}
    assert payload["signal"]["both"] == {"to": 274, "from": 231, "roundTrip": 229, "added": 2}
    facts = json.loads((ROOT / "analysis/week01_facts.json").read_text())
    for key, actual in [("n_nodes", len(graph)), ("n_arcs", graph.number_of_edges()),
                        ("n_isolates", len(isolates)), ("giant_size", len(giant))]:
        assert facts[key] == actual, (key, facts[key], actual)
    for key, degree in [("top_in", graph.in_degree), ("top_out", graph.out_degree)]:
        for row in facts[key]:
            assert degree(row["id"]) == row["k"]

    output = ROOT / "docs/assets/data/marvel_story.json"
    output.write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    print(f"Verified {len(graph)} characters, {graph.number_of_edges()} links, components 277 / 9 / 17 singletons.")
    print(f"Wrote {output.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
