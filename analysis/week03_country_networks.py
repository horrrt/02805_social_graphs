"""Two networks over the same countries: who moves, and who flees.

Builds the 2024 migrant stock network from UN DESA and the 2024 refugee network
from UNHCR, then reports the week 3 measures for both and the overlap between
their rankings. Also sweeps a weight threshold, because betweenness on the raw
matrix turns out to rank statistical reporting systems rather than countries.

Writes analysis/week03_country_facts.json. Every number the migration pages
quote about these two networks comes from here.

    python analysis/week03_country_networks.py
"""

from __future__ import annotations

import csv
import json
import pathlib

import networkx as nx

ROOT = pathlib.Path(__file__).resolve().parent.parent
FACTS = ROOT / "analysis" / "week03_country_facts.json"
THRESHOLDS = [0, 1_000, 10_000, 50_000, 100_000]
TOP = 15


def read_tsv(path):
    with (ROOT / path).open(encoding="utf-8") as fh:
        body = [line for line in fh if not line.startswith("#")]
    return list(csv.DictReader(body, delimiter="\t"))


def stock_network(threshold=0):
    """DESA 2024: arc origin -> destination, weight = people."""
    graph = nx.DiGraph()
    for row in read_tsv("data/migration_flows.tsv"):
        value = int(row["stock_2024"] or 0)
        if value > threshold:
            graph.add_edge(row["origin"], row["destination"], weight=value)
    return graph


def refugee_network(threshold=0):
    """UNHCR 2024: arc origin -> country of asylum. Same-country rows are IDPs."""
    graph = nx.DiGraph()
    for row in read_tsv("data/migration_displacement.tsv"):
        origin, asylum = row["origin"], row["asylum"]
        value = int(row["refugees"] or 0)
        if origin and asylum and origin != asylum and value > threshold:
            graph.add_edge(origin, asylum, weight=value)
    return graph


def describe(graph):
    undirected = graph.to_undirected()
    giant = max(nx.connected_components(undirected), key=len)
    core = undirected.subgraph(giant)
    return {
        "nodes": graph.number_of_nodes(),
        "arcs": graph.number_of_edges(),
        "density": round(nx.density(graph), 4),
        "reciprocity": round(nx.reciprocity(graph), 4),
        "giant": core.number_of_nodes(),
        "mean_path": round(nx.average_shortest_path_length(core), 3),
        "diameter": nx.diameter(core),
        "clustering": round(nx.average_clustering(core), 4),
        "degree_assortativity": round(nx.degree_assortativity_coefficient(core), 4),
        "total_people": sum(w for _, _, w in graph.edges(data="weight")),
    }


def rankings(graph):
    undirected = graph.to_undirected()
    core = undirected.subgraph(max(nx.connected_components(undirected), key=len))
    return {
        "weighted_in_degree": [c for c, _ in sorted(
            graph.in_degree(weight="weight"), key=lambda kv: -kv[1])[:TOP]],
        "in_degree": [c for c, _ in sorted(
            graph.in_degree(), key=lambda kv: -kv[1])[:TOP]],
        "out_degree": [c for c, _ in sorted(
            graph.out_degree(), key=lambda kv: -kv[1])[:TOP]],
        "closeness": [c for c, _ in sorted(
            nx.closeness_centrality(core).items(), key=lambda kv: -kv[1])[:TOP]],
        "betweenness": [c for c, _ in sorted(
            nx.betweenness_centrality(core).items(), key=lambda kv: -kv[1])[:TOP]],
        "pagerank": [c for c, _ in sorted(
            nx.pagerank(graph, weight="weight").items(), key=lambda kv: -kv[1])[:TOP]],
    }


def threshold_sweep(builder):
    """Betweenness is unusable until the weak edges go. Show it rather than say it."""
    out = []
    for threshold in THRESHOLDS:
        graph = builder(threshold)
        undirected = graph.to_undirected()
        if undirected.number_of_nodes() < 10:
            continue
        core = undirected.subgraph(max(nx.connected_components(undirected), key=len))
        between = nx.betweenness_centrality(core)
        out.append({
            "threshold": threshold,
            "arcs": graph.number_of_edges(),
            "giant": core.number_of_nodes(),
            "density": round(nx.density(core), 4),
            "mean_path": round(nx.average_shortest_path_length(core), 3),
            "diameter": nx.diameter(core),
            "top_betweenness": [c for c, _ in sorted(
                between.items(), key=lambda kv: -kv[1])[:8]],
        })
    return out


def main():
    stock, refugees = stock_network(), refugee_network()
    facts = {
        "year": 2024,
        "stock": describe(stock),
        "refugees": describe(refugees),
        "stock_rankings": rankings(stock),
        "refugee_rankings": rankings(refugees),
        "stock_threshold_sweep": threshold_sweep(stock_network),
    }

    a = facts["stock_rankings"]["weighted_in_degree"]
    b = facts["refugee_rankings"]["weighted_in_degree"]
    facts["destination_overlap"] = {
        "top_n": TOP,
        "in_both": sorted(set(a) & set(b)),
        "stock_only": sorted(set(a) - set(b)),
        "refugee_only": sorted(set(b) - set(a)),
        "overlap_count": len(set(a) & set(b)),
    }
    facts["shared_countries"] = len(set(stock) & set(refugees))

    FACTS.write_text(json.dumps(facts, indent=1))
    print(f"wrote {FACTS.relative_to(ROOT)}\n")
    for name in ("stock", "refugees"):
        d = facts[name]
        print(f"{name:>9}: {d['nodes']} nodes, {d['arcs']} arcs, "
              f"mean path {d['mean_path']}, diameter {d['diameter']}, "
              f"clustering {d['clustering']}, r {d['degree_assortativity']:+}")
    overlap = facts["destination_overlap"]
    print(f"\ntop-{TOP} destinations shared by both networks: "
          f"{overlap['overlap_count']} ({', '.join(overlap['in_both'])})")
    print("\nbetweenness by threshold:")
    for row in facts["stock_threshold_sweep"]:
        print(f"  >{row['threshold']:>6}: {row['arcs']:>5} arcs, "
              f"path {row['mean_path']:.2f}, "
              f"top {', '.join(row['top_betweenness'][:6])}")


if __name__ == "__main__":
    main()
