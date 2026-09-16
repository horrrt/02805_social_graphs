"""Week 3 on the migration network: who matters, and why.

Runs the week's toolkit — paths, the four centralities, mixing, cliques — over
the harvested organisation graph, and compares every number to a
degree-preserving null so a result is not just a restatement of the degree
sequence. Writes analysis/week03_facts.json; nothing on the site quotes a
number this script did not produce.

    python analysis/week03_migration_centrality.py [--shuffles 200]
"""

from __future__ import annotations

import argparse
import collections
import csv
import json
import pathlib
import random
import statistics

import networkx as nx

ROOT = pathlib.Path(__file__).resolve().parent.parent
NODES = ROOT / "data" / "migration_nodes.tsv"
EDGES = ROOT / "data" / "migration_edges.tsv"
FACTS = ROOT / "analysis" / "week03_facts.json"


def read_tsv(path):
    with path.open(encoding="utf-8") as fh:
        rows = [line for line in fh if not line.startswith("#")]
    return list(csv.DictReader(rows, delimiter="\t"))


def load():
    nodes = read_tsv(NODES)
    directed = nx.DiGraph()
    for row in nodes:
        directed.add_node(row["node_id"], **row)
    with EDGES.open(encoding="utf-8") as fh:
        for line in fh:
            if line.startswith("#"):
                continue
            source, target = line.rstrip("\n").split("\t")
            if source in directed and target in directed:
                directed.add_edge(source, target)
    return nodes, directed


def top(scores, graph, k=15):
    ranked = sorted(scores.items(), key=lambda kv: -kv[1])[:k]
    return [
        {
            "node": node,
            "name": graph.nodes[node].get("name", node),
            "country": graph.nodes[node].get("country", ""),
            "org_type": graph.nodes[node].get("org_type", ""),
            "score": round(value, 6),
        }
        for node, value in ranked
    ]


def null_scores(graph, shuffles, seed, measures):
    """Degree-preserving double-edge swaps; returns per-node samples."""
    samples = {name: collections.defaultdict(list) for name in measures}
    rng = random.Random(seed)
    for run in range(shuffles):
        shuffled = graph.copy()
        nx.double_edge_swap(
            shuffled,
            nswap=10 * shuffled.number_of_edges(),
            max_tries=200 * shuffled.number_of_edges(),
            seed=rng.randint(0, 2 ** 31),
        )
        for name, function in measures.items():
            for node, value in function(shuffled).items():
                samples[name][node].append(value)
        if (run + 1) % 25 == 0:
            print(f"  shuffle {run + 1}/{shuffles}", flush=True)
    return samples


def z_scores(observed, samples):
    out = {}
    for node, value in observed.items():
        draws = samples.get(node, [])
        if len(draws) < 2:
            continue
        spread = statistics.pstdev(draws)
        mean = statistics.fmean(draws)
        out[node] = {
            "observed": value,
            "null_mean": mean,
            "null_sd": spread,
            "z": (value - mean) / spread if spread > 0 else 0.0,
        }
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shuffles", type=int, default=100)
    parser.add_argument("--betweenness-sample", type=int, default=0,
                        help="approximate betweenness from this many pivots (0 = exact)")
    parser.add_argument("--seed", type=int, default=20260916)
    args = parser.parse_args()

    nodes, directed = load()
    undirected = directed.to_undirected()
    print(f"{directed.number_of_nodes()} organisations, "
          f"{directed.number_of_edges()} arcs, "
          f"{undirected.number_of_edges()} undirected links")

    facts = {
        "nodes": directed.number_of_nodes(),
        "arcs": directed.number_of_edges(),
        "undirected_links": undirected.number_of_edges(),
        "mutual_pairs": sum(1 for a, b in directed.edges() if directed.has_edge(b, a)) // 2,
        "isolates": sum(1 for n in undirected if undirected.degree(n) == 0),
        "density": round(nx.density(directed), 6),
        "by_country": collections.Counter(
            n["country"] or "unplaced" for n in nodes).most_common(30),
        "by_type": collections.Counter(n["org_type"] for n in nodes).most_common(),
        "by_continent": collections.Counter(
            n["continent"] or "unplaced" for n in nodes).most_common(),
    }

    components = sorted(nx.connected_components(undirected), key=len, reverse=True)
    core = undirected.subgraph(components[0]).copy()
    facts["components"] = len(components)
    facts["component_sizes"] = [len(c) for c in components[:10]]
    facts["giant"] = core.number_of_nodes()
    facts["giant_links"] = core.number_of_edges()

    strong = max(nx.strongly_connected_components(directed), key=len)
    facts["largest_scc"] = len(strong)

    # 2 - paths
    lengths = collections.Counter()
    eccentricity = {}
    for source, distances in nx.all_pairs_shortest_path_length(core):
        reach = [d for target, d in distances.items() if target != source]
        lengths.update(reach)
        eccentricity[source] = max(reach) if reach else 0
    total_pairs = sum(lengths.values())
    facts["mean_distance"] = round(
        sum(d * n for d, n in lengths.items()) / total_pairs, 4)
    facts["diameter"] = max(eccentricity.values())
    facts["radius"] = min(eccentricity.values())
    facts["center"] = [
        core.nodes[n].get("name", n)
        for n, e in eccentricity.items() if e == facts["radius"]
    ][:10]
    facts["distance_distribution"] = {
        str(d): round(n / total_pairs, 5) for d, n in sorted(lengths.items())
    }

    # 3-5 - the four answers
    betweenness_kwargs = {"normalized": True}
    if args.betweenness_sample:
        betweenness_kwargs["k"] = min(args.betweenness_sample, core.number_of_nodes())
        betweenness_kwargs["seed"] = args.seed
    measures = {
        "degree": lambda g: dict(g.degree()),
        "closeness": nx.closeness_centrality,
        "harmonic": lambda g: nx.harmonic_centrality(g),
        "betweenness": lambda g: nx.betweenness_centrality(g, **betweenness_kwargs),
        "eigenvector": lambda g: nx.eigenvector_centrality_numpy(g),
    }
    observed = {}
    for name, function in measures.items():
        print(f"computing {name}", flush=True)
        observed[name] = function(core)
        facts[f"top_{name}"] = top(observed[name], core)

    facts["top_in_degree"] = top(dict(directed.in_degree()), directed)
    facts["top_out_degree"] = top(dict(directed.out_degree()), directed)
    facts["top_pagerank"] = top(nx.pagerank(directed, alpha=0.85), directed)

    tens = {name: {row["node"] for row in facts[f"top_{name}"][:10]}
            for name in ("degree", "closeness", "betweenness", "eigenvector")}
    facts["in_all_four_top_tens"] = sorted(
        core.nodes[n].get("name", n) for n in set.intersection(*tens.values()))

    # 6 - compared to what
    print(f"running {args.shuffles} degree-preserving shuffles", flush=True)
    null = null_scores(core, args.shuffles, args.seed,
                       {"betweenness": measures["betweenness"],
                        "closeness": measures["closeness"]})
    surprises = z_scores(observed["betweenness"], null["betweenness"])
    ranked = sorted(surprises.items(), key=lambda kv: -kv[1]["z"])
    facts["betweenness_surprises"] = [
        {
            "node": node,
            "name": core.nodes[node].get("name", node),
            "country": core.nodes[node].get("country", ""),
            "degree": core.degree(node),
            **{k: round(v, 6) for k, v in stats.items()},
        }
        for node, stats in ranked[:20]
    ]
    facts["betweenness_sheltered"] = [
        {
            "node": node,
            "name": core.nodes[node].get("name", node),
            "degree": core.degree(node),
            **{k: round(v, 6) for k, v in stats.items()},
        }
        for node, stats in ranked[-10:]
    ]

    # 7 - mixing
    facts["degree_assortativity"] = round(
        nx.degree_assortativity_coefficient(core), 4)
    for attribute in ("country", "continent", "org_type"):
        placed = [n for n in core if core.nodes[n].get(attribute)]
        subgraph = core.subgraph(placed)
        try:
            facts[f"assortativity_{attribute}"] = round(
                nx.attribute_assortativity_coefficient(subgraph, attribute), 4)
            facts[f"assortativity_{attribute}_nodes"] = subgraph.number_of_nodes()
        except (ValueError, ZeroDivisionError):
            facts[f"assortativity_{attribute}"] = None

    # The right null for homophily shuffles the labels, not the links.
    rng = random.Random(args.seed)
    for attribute in ("country", "continent", "org_type"):
        placed = [n for n in core if core.nodes[n].get(attribute)]
        subgraph = core.subgraph(placed).copy()
        values = [subgraph.nodes[n][attribute] for n in placed]
        draws = []
        for _ in range(min(args.shuffles, 200)):
            rng.shuffle(values)
            nx.set_node_attributes(
                subgraph, dict(zip(placed, values)), "_shuffled")
            draws.append(nx.attribute_assortativity_coefficient(subgraph, "_shuffled"))
        mean, spread = statistics.fmean(draws), statistics.pstdev(draws)
        real = facts[f"assortativity_{attribute}"]
        facts[f"assortativity_{attribute}_null"] = {
            "mean": round(mean, 4),
            "sd": round(spread, 4),
            "z": round((real - mean) / spread, 2) if spread and real is not None else None,
        }

    knn = nx.average_degree_connectivity(core)
    facts["average_neighbour_degree"] = {str(k): round(v, 3)
                                         for k, v in sorted(knn.items())}

    # 8 - cliques
    cliques = list(nx.find_cliques(core))
    sizes = collections.Counter(len(c) for c in cliques)
    facts["clique_number"] = max(sizes)
    facts["maximal_cliques"] = len(cliques)
    facts["clique_size_counts"] = dict(sorted(sizes.items()))
    facts["triangles"] = sum(nx.triangles(core).values()) // 3
    facts["average_clustering"] = round(nx.average_clustering(core), 4)
    biggest = [c for c in cliques if len(c) == facts["clique_number"]]
    facts["largest_cliques"] = [
        sorted(core.nodes[n].get("name", n) for n in clique) for clique in biggest[:5]
    ]

    FACTS.write_text(json.dumps(facts, indent=1, default=str))
    print(f"\nwrote {FACTS}")
    for key in ("nodes", "arcs", "giant", "mean_distance", "diameter",
                "degree_assortativity", "assortativity_country",
                "clique_number", "average_clustering"):
        print(f"  {key}: {facts.get(key)}")


if __name__ == "__main__":
    main()
