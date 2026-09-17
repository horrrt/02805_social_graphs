"""Does the migration network have communities, and do they mean anything?

A social graphs course asks this in week 3 and this post never did. It ranks
countries six ways and never once asks whether they fall into groups.

The trap is that any graph will hand you communities. Louvain on a random
graph returns a partition with a positive modularity, so the number alone
says nothing; what matters is whether the real network's modularity is higher
than the same degree sequence would produce by chance. That is the week 2
methodology reused: shuffle while keeping every country's degree, partition
the shuffle, and see where the real value falls.

The second trap is that the answer is boring if you let it be. Free movement
zones, old empires and shared languages will fall out as communities, and
none of that is a finding — it is the map. What is worth reporting is which
countries sit in a community they have no obvious business being in.

    python analysis/week03_communities.py [--threshold 10000] [--shuffles 100]

Writes analysis/week03_communities.json.

Method notes. The graph is undirected and weighted by people in both
directions, because a community is a set of countries that exchange, not a
set that all send one way. Corridors below the threshold are dropped: at zero
the network is 17% dense and every partition is mush. Louvain is seeded, so
the partition is the same on every run — without that the page would show a
different grouping to every reader.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import random

import networkx as nx

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "docs" / "assets" / "data"
OUT = ROOT / "analysis"


def build(year: int, threshold: int):
    """Undirected, weighted by the people moving in both directions."""
    corridors = json.loads((DATA / "week03_corridors.json").read_text())
    edges = json.loads((DATA / "week03_edges.json").read_text())
    countries = edges["countries"]
    yi = edges["years"].index(year)
    graph = nx.Graph()
    for oi, di, stocks, *_rest in edges["edges"]:
        people = stocks[yi]
        if not people:
            continue
        a, b = countries[oi], countries[di]
        if graph.has_edge(a, b):
            graph[a][b]["weight"] += people
        else:
            graph.add_edge(a, b, weight=people)
    graph.remove_edges_from(
        [(a, b) for a, b, w in graph.edges(data="weight") if w < threshold]
    )
    graph.remove_nodes_from(list(nx.isolates(graph)))
    names = {iso3: node["name"] for iso3, node in corridors["nodes"].items()}
    return graph, names


def partition(graph, seed):
    communities = nx.community.louvain_communities(
        graph, weight="weight", seed=seed, resolution=1.0
    )
    return communities, nx.community.modularity(graph, communities, weight="weight")


def null_modularity(graph, shuffles, seed):
    """Modularity of the same degree sequence, rewired at random.

    double_edge_swap keeps every country's number of partners and moves the
    partners around, so what is left is whatever grouping the degree sequence
    alone produces. The weights are dealt back out at random over the rewired
    edges, for the same reason the week 2 null does it.
    """
    rng = random.Random(seed)
    weights = [w for _, _, w in graph.edges(data="weight")]
    values = []
    for i in range(shuffles):
        shuffled = nx.double_edge_swap(
            graph.copy(), nswap=graph.number_of_edges() * 5,
            max_tries=graph.number_of_edges() * 100, seed=rng.randint(0, 2**31),
        )
        dealt = weights[:]
        rng.shuffle(dealt)
        for (a, b), w in zip(shuffled.edges(), dealt):
            shuffled[a][b]["weight"] = w
        _, q = partition(shuffled, seed + i)
        values.append(q)
    return values


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--threshold", type=int, default=10000)
    parser.add_argument("--shuffles", type=int, default=100)
    parser.add_argument("--seed", type=int, default=20260917)
    args = parser.parse_args()

    graph, names = build(args.year, args.threshold)
    print(f"{graph.number_of_nodes()} countries, {graph.number_of_edges()} pairs "
          f"exchanging at least {args.threshold:,} people, {args.year}")

    communities, q = partition(graph, args.seed)
    communities = sorted(communities, key=len, reverse=True)
    print(f"\nLouvain: {len(communities)} communities, modularity {q:.3f}")

    nulls = null_modularity(graph, args.shuffles, args.seed)
    mean = sum(nulls) / len(nulls)
    spread = (sum((v - mean) ** 2 for v in nulls) / len(nulls)) ** 0.5
    z = (q - mean) / spread if spread else float("inf")
    above = sum(1 for v in nulls if v >= q)
    print(f"Null of {args.shuffles} degree-preserving rewirings: "
          f"mean {mean:.3f}, sd {spread:.3f}, z {z:+.1f}, "
          f"{above} of {args.shuffles} at or above the real value")

    # How much of the world's migration stays inside one of these groups.
    # Modularity is a number about the graph; this is a number about people,
    # and it is the one that says whether the partition matters.
    home = {}
    for i, members in enumerate(communities):
        for iso3 in members:
            home[iso3] = i

    # Over the kept graph first, and then over every corridor in the year —
    # including the small ones the threshold dropped, which are the corridors
    # most likely to cross a group boundary. The second is the number a
    # reader will think they are being told, so it is the one to quote.
    inside = total = 0
    for a, b, w in graph.edges(data="weight"):
        total += w
        if home.get(a) == home.get(b):
            inside += w
    share_kept = 100 * inside / total if total else 0

    everything = json.loads((DATA / "week03_edges.json").read_text())
    yi = everything["years"].index(args.year)
    countries = everything["countries"]
    all_inside = all_total = 0
    for oi, di, stocks, *_rest in everything["edges"]:
        people = stocks[yi]
        if not people:
            continue
        all_total += people
        a, b = countries[oi], countries[di]
        if a in home and home.get(a) == home.get(b):
            all_inside += people
    share_inside = 100 * all_inside / all_total if all_total else 0
    print(f"\n{share_kept:.1f}% of the people on the kept corridors moved inside "
          f"one of the {len(communities)} groups")
    print(f"{share_inside:.1f}% of all {all_total:,} migrants in {args.year} did, "
          f"counting the corridors the threshold dropped")

    strength = dict(graph.degree(weight="weight"))
    out = []
    for members in communities:
        ranked = sorted(members, key=lambda iso3: -strength[iso3])
        out.append({
            "size": len(members),
            "people": int(sum(
                w for a, b, w in graph.edges(data="weight")
                if a in members and b in members
            )),
            "members": ranked,
            "names": [names.get(iso3, iso3) for iso3 in ranked],
        })
        print(f"\n  {len(members):>3} countries · "
              f"{', '.join(names.get(i, i) for i in ranked[:8])}"
              f"{' …' if len(ranked) > 8 else ''}")

    payload = {
        "generated": "analysis/week03_communities.py",
        "year": args.year,
        "threshold": args.threshold,
        "seed": args.seed,
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "modularity": round(q, 4),
        "share_inside": round(share_inside, 1),
        "share_inside_kept": round(share_kept, 1),
        "people": int(all_total),
        "people_kept": int(total),
        "null": {
            "shuffles": args.shuffles,
            "mean": round(mean, 4),
            "sd": round(spread, 4),
            "z": round(z, 2),
            "at_or_above": above,
            "note": "Degree-preserving rewirings with the weights dealt back out at "
                    "random. Louvain finds communities in anything, so the modularity "
                    "on its own says nothing; this is what the same degree sequence "
                    "produces by chance.",
        },
        "communities": out,
    }
    path = OUT / "week03_communities.json"
    path.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"\nwrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
