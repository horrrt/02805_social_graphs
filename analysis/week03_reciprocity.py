"""Is migration more reciprocal than chance, once each country's number of
partners is held fixed, or only more reciprocal than an equally dense random
graph would be?

The post already compares the two networks' reciprocity (the share of arcs
whose reverse also exists) against the density-only baseline every directed
Erdos-Renyi graph gives for free: reciprocity = density there, so a ratio
above one says something. But every neighbouring structural claim on the
page (clustering, assortativity, mean path, diameter, largest clique, in
week03_country_networks.py) instead holds each country's own number of
partners fixed and shuffles the rest, because a density-only null lets a
single high-degree hub inflate reciprocity for reasons that have nothing to
do with whether ties are mutual. This adds that like-for-like baseline for
reciprocity too, without touching week03_country_networks.py's own 16-minute
run and its own random stream.

The null: 100 directed, degree-preserving rewirings
(networkx.directed_edge_swap, which moves three edges per swap so every
state with the same in- and out-degree sequence is reachable) of the same
directed graph week03_country_networks.py builds and describes. Every
country's in-degree and out-degree is asserted unchanged after each draw, and
the graph's own reciprocity and density are asserted equal to what
week03_country_facts.json already reports, so this is provably the same two
networks, not a lookalike.

    python analysis/week03_reciprocity.py [--shuffles 100] [--seed 20260917]

Writes analysis/week03_reciprocity.json.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import statistics

import networkx as nx

from week03_country_networks import describe, refugee_network, stock_network
from week04_staffing import tracked

ROOT = pathlib.Path(__file__).resolve().parent.parent
FACTS = ROOT / "analysis" / "week03_country_facts.json"
OUT = ROOT / "analysis" / "week03_reciprocity.json"
SEED = 20260917
DRAWS = 100


def zscore(real, mean, sd):
    """None when the null has no spread to compare against, matching
    week03_country_networks.py's own zscore()."""
    if sd == 0:
        return None
    return round((real - mean) / sd, 3)


def reciprocity_null(graph, label, draws=DRAWS, seed=SEED):
    """`draws` directed degree-preserving rewires of `graph`, one seed per
    draw (seed + i so the sequence is reproducible draw by draw), each
    checked to hold every node's in- and out-degree exactly fixed before its
    reciprocity is measured."""
    edges = graph.number_of_edges()
    in_degree = dict(graph.in_degree())
    out_degree = dict(graph.out_degree())
    values = []
    swap_shortfalls = 0
    for i in tracked(label, draws):
        shuffled = graph.copy()
        try:
            nx.directed_edge_swap(
                shuffled, nswap=10 * edges, max_tries=1000 * edges, seed=seed + i,
            )
        except nx.NetworkXAlgorithmError:
            # max_tries ran out before nswap swaps landed, same shortfall
            # week03_country_networks.py's topology_null already counts
            # rather than swallows.
            swap_shortfalls += 1
        assert dict(shuffled.in_degree()) == in_degree, "a rewire changed a country's in-degree"
        assert dict(shuffled.out_degree()) == out_degree, "a rewire changed a country's out-degree"
        values.append(nx.reciprocity(shuffled))
    return {
        "mean": round(statistics.mean(values), 4),
        "sd": round(statistics.pstdev(values), 4),
        "n": len(values),
        "swap_shortfalls": swap_shortfalls,
    }


def network_result(name, graph, real, draws, seed):
    """The density baseline the page already has, plus the degree-preserving
    one this script adds, for one network."""
    rebuilt_reciprocity = round(nx.reciprocity(graph), 4)
    rebuilt_density = round(nx.density(graph), 4)
    assert rebuilt_reciprocity == real["reciprocity"], (
        f"{name}: rebuilt graph's reciprocity {rebuilt_reciprocity} does not match "
        f"week03_country_facts.json's {real['reciprocity']} — not the same network"
    )
    assert rebuilt_density == real["density"], (
        f"{name}: rebuilt graph's density {rebuilt_density} does not match "
        f"week03_country_facts.json's {real['density']} — not the same network"
    )
    null = reciprocity_null(graph, f"  {name} reciprocity null", draws, seed)
    return {
        "reciprocity": real["reciprocity"],
        "density": real["density"],
        "vs_density": round(real["reciprocity"] / real["density"], 3),
        "null": {**null, "z": zscore(real["reciprocity"], null["mean"], null["sd"])},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shuffles", type=int, default=DRAWS)
    parser.add_argument("--seed", type=int, default=SEED)
    args = parser.parse_args()

    facts = json.loads(FACTS.read_text())
    stock, refugees = stock_network(), refugee_network()

    report = {
        "generated": "analysis/week03_reciprocity.py",
        "year": facts["year"],
        "shuffles": args.shuffles,
        "seed": args.seed,
        "note": "vs_density is reciprocity / density, the ratio the page already "
                "quotes: 1.0 is what a directed Erdos-Renyi graph at the same "
                "density gives for free. null is 100 directed, degree-preserving "
                "rewirings of the same graph (three-edge swaps; every country's in- and "
                "out-degree held fixed) and z is how many of the null's own "
                "standard deviations the real reciprocity sits above its mean, "
                "the same kind of baseline week03_country_networks.py already "
                "reports for clustering, assortativity, mean path and diameter.",
        "stock": network_result("stock", stock, facts["stock"], args.shuffles, args.seed),
        "refugees": network_result("refugees", refugees, facts["refugees"], args.shuffles, args.seed),
    }

    OUT.write_text(json.dumps(report, indent=2))
    print(f"\nwrote {OUT.relative_to(ROOT)}")
    for name in ("stock", "refugees"):
        r = report[name]
        null = r["null"]
        print(f"  {name:>9}: reciprocity {r['reciprocity']} vs density {r['density']} "
              f"({r['vs_density']}x) — degree-preserving null mean {null['mean']} "
              f"sd {null['sd']} z {null['z']}")


if __name__ == "__main__":
    main()
