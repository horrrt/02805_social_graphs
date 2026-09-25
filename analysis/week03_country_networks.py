"""Two networks over the same countries: who moves, and who flees.

Builds the 2024 migrant stock network from UN DESA and the 2024 refugee network
from UNHCR, then reports the week 3 measures for both and the overlap between
their rankings. Also sweeps a weight threshold, because betweenness on the raw
matrix turns out to rank statistical reporting systems rather than countries.

Writes analysis/week03_country_facts.json. Every number the migration pages
quote about these two networks comes from here.

Also runs a degree-preserving null (100 double-edge-swap shuffles of the same
undirected, unweighted core) for the four structural measures that had no
baseline on the page: assortativity, clustering, average shortest path and
diameter. Plus the largest clique in that same core, real and (budget
permitting) null.

    python analysis/week03_country_networks.py
"""

from __future__ import annotations

import csv
import json
import pathlib
import random
import statistics
import time

import networkx as nx

from week04_staffing import tracked

ROOT = pathlib.Path(__file__).resolve().parent.parent
FACTS = ROOT / "analysis" / "week03_country_facts.json"
THRESHOLDS = [0, 1_000, 10_000, 50_000, 100_000]
TOP = 15
NULL_DRAWS = 100
NULL_SEED = 20260917
CLIQUE_BUDGET = 60.0  # seconds, for the real graph's find_cliques
NULL_CLIQUE_BUDGET = 30.0  # seconds, per null draw


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


def largest_clique(graph, budget):
    """Biggest clique in graph, or (None, None, True) if the budget runs out.

    find_cliques enumerates maximal cliques in roughly output-polynomial
    time, which is fine on this network's density but not guaranteed, so a
    hard wall-clock budget stops it rather than let a bad draw hang. A
    partial maximum is never returned as the answer: reaching the budget
    means "unknown", not "this size".

    The size is usually not unique: several country sets can share the
    largest clique. find_cliques's visiting order depends on Python's
    per-process hash seed for its internal sets, so two runs of an otherwise
    identical graph can report different (equally valid) largest cliques.
    That breaks the "reruns reproducibly" requirement, so among ties for the
    largest size this keeps the lexicographically smallest sorted member
    list, which is the same regardless of enumeration order.
    """
    started = time.time()
    best_size = 0
    best = None
    for clique in nx.find_cliques(graph):
        candidate = tuple(sorted(clique))
        if len(candidate) > best_size:
            best_size, best = len(candidate), candidate
        elif len(candidate) == best_size and candidate < best:
            best = candidate
        if time.time() - started > budget:
            return None, None, True
    return best_size, list(best) if best else [], False


def topology_null(core, draws=NULL_DRAWS, seed=NULL_SEED):
    """100 degree-preserving double-edge-swap shuffles of the undirected,
    unweighted core: same measures describe() reports, plus clique number,
    so those four rows on the page get a baseline instead of standing alone.
    """
    edges = core.number_of_edges()
    samples = {"assortativity": [], "clustering": [], "mean_path": [],
               "diameter": [], "clique_number": []}
    rng = random.Random(seed)
    swap_shortfalls = 0
    disconnected_draws = 0
    clique_timed_out = False
    for _ in tracked("  null shuffle", draws):
        shuffled = core.copy()
        try:
            nx.double_edge_swap(
                shuffled,
                nswap=10 * edges,
                max_tries=1000 * edges,
                seed=rng.randint(0, 2 ** 31),
            )
        except nx.NetworkXAlgorithmError:
            # max_tries ran out before nswap swaps landed. The shuffle still
            # runs on whatever topology resulted, which is not fatal, but it
            # should be counted rather than silently swallowed.
            swap_shortfalls += 1
        samples["assortativity"].append(nx.degree_assortativity_coefficient(shuffled))
        samples["clustering"].append(nx.average_clustering(shuffled))
        components = list(nx.connected_components(shuffled))
        if len(components) > 1:
            disconnected_draws += 1
        giant = shuffled.subgraph(max(components, key=len))
        samples["mean_path"].append(nx.average_shortest_path_length(giant))
        samples["diameter"].append(nx.diameter(giant))
        if not clique_timed_out:
            size, _, timed_out = largest_clique(shuffled, NULL_CLIQUE_BUDGET)
            if timed_out:
                clique_timed_out = True
            else:
                samples["clique_number"].append(size)

    summary = {}
    for key, values in samples.items():
        if not values:
            continue
        summary[key] = {
            "mean": round(statistics.mean(values), 4),
            "sd": round(statistics.pstdev(values), 4),
            "n": len(values),
        }
    return summary, {
        "draws": draws,
        "swap_shortfalls": swap_shortfalls,
        "disconnected_draws": disconnected_draws,
        "clique_timed_out": clique_timed_out,
    }


def zscore(real, null):
    """None when the null has no spread to compare against (sd == 0), which
    json.dumps would otherwise have to write as an Infinity that no JSON
    parser downstream accepts."""
    if null is None or null["sd"] == 0:
        return None
    return round((real - null["mean"]) / null["sd"], 3)


def core_of(graph):
    undirected = graph.to_undirected()
    giant = max(nx.connected_components(undirected), key=len)
    return nx.Graph(undirected.subgraph(giant))


def topology_extras(graph, real):
    """Null baselines and largest clique for the undirected, unweighted core
    already summarised in `real` (describe()'s output)."""
    core = core_of(graph)
    null_summary, null_meta = topology_null(core)
    extras = {
        "null": {
            key: {**null_summary[key],
                  "z": zscore(real[real_key], null_summary[key])}
            for key, real_key in (
                ("assortativity", "degree_assortativity"),
                ("clustering", "clustering"),
                ("mean_path", "mean_path"),
                ("diameter", "diameter"),
            )
            if key in null_summary
        },
        "null_meta": null_meta,
    }
    real_size, real_members, real_timed_out = largest_clique(core, CLIQUE_BUDGET)
    if real_timed_out:
        extras["largest_clique"] = {"timed_out": True}
    else:
        extras["largest_clique"] = {"size": real_size, "members": real_members}
        if "clique_number" in null_summary:
            extras["largest_clique"]["null"] = {
                **null_summary["clique_number"],
                "z": zscore(real_size, null_summary["clique_number"]),
            }
    return extras


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

    print("\nnull model and largest clique, migrant stock:")
    facts["stock"]["topology"] = topology_extras(stock, facts["stock"])
    print("\nnull model and largest clique, refugees:")
    facts["refugees"]["topology"] = topology_extras(refugees, facts["refugees"])

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
    print("\ntopology null and largest clique:")
    for name in ("stock", "refugees"):
        topo = facts[name]["topology"]
        clique = topo["largest_clique"]
        clique_str = ("timed out" if clique.get("timed_out")
                      else f"{clique['size']} ({', '.join(clique['members'])})")
        print(f"  {name}: clique {clique_str}")
        for key, row in topo["null"].items():
            print(f"    {key}: null mean {row['mean']} sd {row['sd']} z {row['z']}")


if __name__ == "__main__":
    main()
