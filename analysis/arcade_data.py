"""Frozen data and exact statistics shared by every Arcade experience."""
import csv
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

import networkx as nx

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/assets/data"


def load():
    with (ROOT / "data/week1_nodes.tsv").open() as f:
        rows = list(csv.DictReader((l for l in f if not l.startswith("#")), delimiter="\t"))
    graph = nx.DiGraph()
    graph.add_nodes_from(r["node_id"] for r in rows)
    with (ROOT / "data/week1_edges.tsv").open() as f:
        graph.add_edges_from(csv.reader((l for l in f if not l.startswith("#")), delimiter="\t"))
    facts = json.loads((ROOT / "analysis/week01_facts.json").read_text())
    assert (len(graph), graph.number_of_edges()) == (facts["n_nodes"], facts["n_arcs"]) == (303, 1784)
    assert len(list(nx.isolates(graph))) == facts["n_isolates"] == 17
    assert nx.number_of_selfloops(graph) == 0
    return rows, graph, facts


def write(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n")


def build():
    rows, graph, facts = load()
    undirected = graph.to_undirected()
    components = sorted(nx.connected_components(undirected), key=lambda c: (-len(c), min(c)))
    assert [len(c) for c in components] == [277, 9] + [1] * 17
    community_sets = sorted(nx.community.louvain_communities(undirected, seed=7), key=lambda c: (-len(c), min(c)))
    community = {n: i for i, group in enumerate(community_sets) for n in group}
    betweenness = nx.betweenness_centrality(undirected, normalized=True)
    clustering = nx.clustering(undirected)
    positions = {n["id"]: (n["x"], n["y"]) for n in json.loads((OUT / "marvel_story.json").read_text())["nodes"]}
    cards = []
    for r in rows:
        n = r["node_id"]
        cards.append({"id": n, "name": r["name"], "url": r["url"], "text": r["description"],
                      "kin": graph.in_degree(n), "kout": graph.out_degree(n), "degree": undirected.degree(n),
                      "betweenness": round(betweenness[n], 10), "clustering": round(clustering[n], 10),
                      "community": community[n], "component": "core" if n in components[0] else "island" if n in components[1] else "isolate",
                      "x": positions[n][0], "y": positions[n][1]})
    # A deterministic greedy benchmark, not a claim of optimal coverage.
    draft, covered = [], set()
    for _ in range(5):
        best = max((n for n in graph if n not in draft), key=lambda n: (len(({n} | set(undirected[n])) - covered), n))
        draft.append(best)
        covered |= {best} | set(undirected[best])
    triangles = sum(nx.triangles(undirected.subgraph(components[0])).values()) // 3
    fixtures = []
    for a, b in [("Baymax", "Spider-Man"), ("Spider-Man", "Hulk"), ("Betsy_Braddock", "Wolverine_(character)"), ("Blackthorn_(character)", "Vyking")]:
        for directed in [True, False]:
            g = graph if directed else undirected
            try:
                length = nx.shortest_path_length(g, a, b)
            except nx.NetworkXNoPath:
                length = None
            fixtures.append({"from": a, "to": b, "directed": directed, "distance": length})
    payload = {"snapshot": "2026-08-26", "nodes": cards, "links": [list(e) for e in graph.edges()],
               "facts": facts, "communities": [{"id": i, "size": len(c), "members": sorted(c)} for i, c in enumerate(community_sets)],
               "communityMethod": {"algorithm": "Louvain", "graph": "303-node simple undirected collapse", "seed": 7, "resolution": 1, "networkx": nx.__version__, "status": "Exploratory preview; partitions depend on algorithm, seed and resolution."},
               "metricMethod": "In/out-degree: directed snapshot. Betweenness: normalized, undirected, all 303 nodes. Clustering: undirected local clustering, zero below degree two.",
               "textMethod": "303 short article descriptions supplied in the frozen course roster; not complete Wikipedia pages. TF-IDF is an exploratory preview over these descriptions.",
               "greedyDraft": {"cards": draft, "covered": len(covered), "denominator": 303, "optimal": False},
               "coreTriangles": triangles, "fixtures": fixtures,
               "hashes": {f: hashlib.sha256((ROOT / "data" / f).read_bytes()).hexdigest() for f in ["week1_nodes.tsv", "week1_edges.tsv"]}}
    write("arcade_graph.json", payload)
    print(f"Arcade: {len(cards)} cards, {len(community_sets)} exploratory communities, greedy five-card coverage {len(covered)}/303.")
    return payload


if __name__ == "__main__":
    build()
