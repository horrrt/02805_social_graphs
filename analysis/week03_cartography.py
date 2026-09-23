"""What role does a country play inside its own community?

The page used to answer this with six labels from a cascade of rank tests, and
that typology had three problems. It compared a 2020 migration ranking against
a flight snapshot last refreshed around 2014, so 30 of 228 labels mixed two
vintages. It could only ever be computed for one year, because the flight side
does not move. And 141 of 228 countries came out "mixed", which is to say the
largest group on the chart was the one where no test fired.

All three came from the flight axis, and there is no fixing it with better
flight data: no free, dated, global country-pair air network exists. ICAO sells
one, Sabre licenses one, Eurostat publishes a real dated one that only Europe
reports into, and OpenSky is free and dated but its coverage follows the ADS-B
receivers, which are in Europe and North America. Every option trades the
vintage problem for a coverage problem.

So this drops the flight axis and asks a question the migration network can
answer on its own, in any year: given the communities the network splits into,
what role does each country play in them? That is Guimerà and Amaral's role
cartography (Nature 433, 2005), and it gives every country two coordinates
instead of one bucket:

    z  within-community strength, as a z-score against the other members of
       its own community. How big it is where it lives.
    P  participation coefficient, 1 - sum over communities of (share of this
       country's people that go to that community)^2. How spread it is. Zero
       means every corridor stays inside one community; near one means the
       corridor weight is split evenly across all of them.

    python analysis/week03_cartography.py [--year-all] [--seeds 100]

Writes docs/assets/data/week03_cartography.json.

The graph is the one section 5 already shows: undirected, weighted by people
moving both ways, corridors under 10,000 people dropped. Same floor, so the
communities a reader sees there are the communities these roles are measured
inside. 196 countries clear that floor in 1990 and 208 in 2024; the rest have
no role, and the page says so rather than inventing one.

Why an ensemble. Louvain is stochastic, and on this graph that is not a detail:
two seeds at 2020 disagree about 28 of 207 roles, which is the same size as the
change between one five-year snapshot and the next. A single run would have
produced an animation of its own random seed. So every year is partitioned
`--seeds` times, each run votes for a role, and a country carries its modal
role plus the share of runs that agreed. Only countries confident in both years
count as having changed. z and P themselves are far steadier than the role is:
the United States sits at z 5.20 with a standard deviation of 0.08 across 100
runs, and the wobble is concentrated at the threshold crossings.

What this cannot tell you. The thresholds are Guimerà and Amaral's, calibrated
on metabolic and air-transport networks that are much sparser than this one, so
they are not tuned to it and "peripheral" stays a large group. They are kept
unchanged anyway: thresholds fitted to make our own chart look balanced would
be six arbitrary numbers again, which is the thing this replaces.
"""

from __future__ import annotations

import argparse
import collections
import json
import pathlib
import statistics

import networkx as nx

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "docs" / "assets" / "data"

# Guimerà and Amaral (2005), table 1. A hub is z >= 2.5; the participation
# coefficient then splits hubs three ways and non-hubs four.
HUB_Z = 2.5
ROLES = {
    "ultra-peripheral": "Almost all of its people move inside one community.",
    "peripheral": "Mostly one community, with a few corridors outside it.",
    "connector": "A middling country whose corridors are spread across several communities.",
    "kinless": "Its corridors are spread so evenly that it belongs to no one community.",
    "provincial hub": "Large inside its own community and barely present outside it.",
    "connector hub": "Large inside its own community and well spread across the others.",
    "kinless hub": "Large, and spread across communities rather than anchored in one.",
}


def role_of(z: float, p: float) -> str:
    if z >= HUB_Z:
        if p <= 0.30:
            return "provincial hub"
        return "connector hub" if p <= 0.75 else "kinless hub"
    if p <= 0.05:
        return "ultra-peripheral"
    if p <= 0.62:
        return "peripheral"
    return "connector" if p <= 0.80 else "kinless"


def build(edges, year: int, threshold: int) -> nx.Graph:
    """Section 11's graph: undirected, both directions summed, small links cut."""
    countries = edges["countries"]
    yi = edges["years"].index(year)
    graph = nx.Graph()
    for oi, di, stocks, *_rest in edges["edges"]:
        people = stocks[yi]
        if not people:
            continue
        a, b = countries[oi], countries[di]
        if a == b:
            continue
        if graph.has_edge(a, b):
            graph[a][b]["weight"] += people
        else:
            graph.add_edge(a, b, weight=people)
    graph.remove_edges_from(
        [(a, b) for a, b, w in graph.edges(data="weight") if w < threshold]
    )
    graph.remove_nodes_from(list(nx.isolates(graph)))
    return graph


def coordinates(graph, home):
    """z and P for one partition.

    Both are computed on strength rather than degree. A country's corridors run
    from a dozen people to four million, and counting them equally would make
    Tuvalu's link to Fiji weigh what Mexico's link to the United States does.
    """
    inside = {}
    members = collections.defaultdict(list)
    for node in graph.nodes():
        per = collections.Counter()
        total = 0.0
        for other in graph.neighbors(node):
            weight = graph[node][other]["weight"]
            total += weight
            per[home[other]] += weight
        inside[node] = (total, per)
        members[home[node]].append(node)

    z = {}
    for community, group in members.items():
        own = [inside[node][1][community] for node in group]
        mean = statistics.fmean(own)
        # Population standard deviation, and a community of one has none: its
        # only member is exactly average for it, which is z = 0 and not a hub.
        spread = statistics.pstdev(own) if len(own) > 1 else 0.0
        for node in group:
            z[node] = (inside[node][1][community] - mean) / spread if spread else 0.0

    p = {}
    for node in graph.nodes():
        total, per = inside[node]
        p[node] = 1 - sum((w / total) ** 2 for w in per.values()) if total else 0.0
    return z, p


def verify_against_bctpy(graph, home) -> None:
    """Check `coordinates` against the Brain Connectivity Toolbox.

    Both measures are ours rather than a library's, which is worth a second
    opinion: the power-law fitting on this page was also ours until a library
    showed it had been computing a Kolmogorov-Smirnov distance wrong for
    months. bctpy is the reference implementation of both, and on the 2020
    graph the two agree to 2e-16 on participation and 9e-16 on the z-score,
    which is floating-point noise and not a difference.

    It is not a dependency. The version on PyPI is a 2023 snapshot that
    predates numpy 2, and the fixes since then exist only on GitHub master, so
    pinning it would mean pinning an unreleased commit in a project other
    people have to rebuild. Install it when you want to re-run this check:

        pip install git+https://github.com/aestrivex/bctpy
        python analysis/week03_cartography.py --verify
    """
    try:
        import bct
    except ImportError:
        print("  bctpy is not installed; skipping the cross-check. "
              "pip install git+https://github.com/aestrivex/bctpy")
        return
    import networkx as nx_local

    nodes = sorted(graph)
    matrix = nx_local.to_numpy_array(graph, nodelist=nodes, weight="weight")
    # bctpy numbers communities from one.
    labels = [home[n] + 1 for n in nodes]
    z, p = coordinates(graph, home)
    theirs_p = bct.participation_coef(matrix, labels)
    theirs_z = bct.module_degree_zscore(matrix, labels)
    gap_p = max(abs(p[n] - theirs_p[i]) for i, n in enumerate(nodes))
    gap_z = max(abs(z[n] - theirs_z[i]) for i, n in enumerate(nodes))
    print(f"  vs bctpy: participation differs by at most {gap_p:.1e}, "
          f"z-score by at most {gap_z:.1e}")
    assert gap_p < 1e-9 and gap_z < 1e-9, "our coordinates disagree with bctpy"


def ensemble(graph, seeds: int):
    """Partition `seeds` times and let every run vote."""
    votes = collections.defaultdict(collections.Counter)
    # Coordinates are kept per role, not pooled. A country that came out
    # ultra-peripheral in 90 runs and something else in 10 has a mean
    # participation dragged over the 0.05 line by the ten, so the page would
    # have printed "Ultra-peripheral, P 0.07" against a rule that says 0.05 or
    # less. Averaging only the runs that produced the role a country is shown
    # under makes the two agree by construction. Four countries did this.
    coords = collections.defaultdict(lambda: collections.defaultdict(list))
    sizes = []
    for seed in range(seeds):
        communities = nx.community.louvain_communities(graph, weight="weight", seed=seed)
        sizes.append(len(communities))
        home = {node: i for i, group in enumerate(communities) for node in group}
        z, p = coordinates(graph, home)
        for node in graph.nodes():
            role = role_of(z[node], p[node])
            votes[node][role] += 1
            coords[node][role].append((z[node], p[node]))

    out = {}
    for node, counter in votes.items():
        role, agreed = counter.most_common(1)[0]
        zs = {node: [c[0] for c in coords[node][role]]}
        ps = {node: [c[1] for c in coords[node][role]]}
        out[node] = {
            "role": role,
            "stability": round(agreed / seeds, 3),
            # Four places, not two. The page prints two, but a country whose
            # mean participation rounds to exactly a threshold would then read
            # "Peripheral, P 0.05" against a rule that says 0.05 or less is
            # ultra-peripheral. Nepal in 1990 does exactly that. The extra
            # digits keep the file honest about which side of the line it is.
            "z": round(statistics.fmean(zs[node]), 4),
            "z_sd": round(statistics.pstdev(zs[node]), 4),
            "p": round(statistics.fmean(ps[node]), 4),
            "p_sd": round(statistics.pstdev(ps[node]), 4),
        }
    return out, statistics.fmean(sizes)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seeds", type=int, default=100)
    parser.add_argument("--threshold", type=int, default=10000,
                        help="the floor section 5 uses; keep them the same")
    parser.add_argument("--confident", type=float, default=0.9,
                        help="share of runs that must agree before a role counts")
    parser.add_argument("--verify", action="store_true",
                        help="cross-check the two coordinates against bctpy and stop")
    args = parser.parse_args()

    edges = json.loads((DATA / "week03_edges.json").read_text())
    corridors = json.loads((DATA / "week03_corridors.json").read_text())
    names = {iso3: node["name"] for iso3, node in corridors["nodes"].items()}
    everyone = set(corridors["nodes"])

    if args.verify:
        graph = build(edges, edges["years"][-1], args.threshold)
        partition = nx.community.louvain_communities(graph, weight="weight", seed=0)
        print(f"{graph.number_of_nodes()} countries, {len(partition)} communities")
        verify_against_bctpy(
            graph, {n: i for i, group in enumerate(partition) for n in group}
        )
        return

    years = {}
    for year in edges["years"]:
        graph = build(edges, year, args.threshold)
        rows, mean_communities = ensemble(graph, args.seeds)
        confident = sum(1 for r in rows.values() if r["stability"] >= args.confident)
        counts = collections.Counter(r["role"] for r in rows.values())
        years[str(year)] = rows
        print(f"{year}: {graph.number_of_nodes():>3} countries above the floor, "
              f"{mean_communities:.1f} communities on average, "
              f"{confident} roles agreed by {args.confident:.0%} of runs")
        print("      " + ", ".join(f"{k} {v}" for k, v in counts.most_common()))

    # What moved, over the whole series. A country counts as having changed only
    # where both ends are confident, because an unstable role moving is Louvain
    # moving and not the world.
    first, last = str(edges["years"][0]), str(edges["years"][-1])
    moved = []
    for iso3, row in years[last].items():
        was = years[first].get(iso3)
        if not was or was["role"] == row["role"]:
            continue
        if was["stability"] < args.confident or row["stability"] < args.confident:
            continue
        moved.append({
            "iso3": iso3,
            "name": names.get(iso3, iso3),
            "from": was["role"],
            "to": row["role"],
            # Rank the list by how far up the hierarchy a country climbed, so
            # the crises come first and the small reclassifications last.
            "rise": round(row["z"] - was["z"], 2),
        })
    moved.sort(key=lambda m: -m["rise"])
    print(f"\n{len(moved)} countries changed role between {first} and {last} "
          f"with both ends agreed by {args.confident:.0%} of runs")
    for row in moved[:8]:
        print(f"  {row['name'][:24]:<24} {row['from']:>16} → {row['to']:<16} "
              f"z {row['rise']:+.2f}")

    below = sorted(everyone - set(years[last]))
    payload = {
        "generated": "analysis/week03_cartography.py",
        "method": "Guimerà and Amaral role cartography (Nature 433, 2005), on the "
                  "undirected people-weighted migration graph section 5 partitions.",
        "threshold": args.threshold,
        "seeds": args.seeds,
        "confident": args.confident,
        "hub_z": HUB_Z,
        "roles": ROLES,
        "years": [str(y) for y in edges["years"]],
        "by_year": years,
        "moved": moved,
        "below_floor": len(below),
        "note": "Louvain is stochastic and one run would have animated its own seed, "
                "so each year is partitioned many times and a country carries the "
                "role most runs gave it together with the share that agreed. The "
                "thresholds are Guimerà and Amaral's own and are not tuned to this "
                "network, which is much denser than the ones they were set on.",
    }
    path = DATA / "week03_cartography.json"
    path.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"\nwrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB), "
          f"{len(below)} countries below the floor in {last}")


if __name__ == "__main__":
    main()
