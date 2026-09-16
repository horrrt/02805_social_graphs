"""Corridor Control: two country networks over the same world.

Migration comes from the UN DESA bilateral migrant stock, one weighted directed
network per five-year point from 1990 to 2024. Flights come from OpenFlights,
aggregated from airport pairs to country pairs. The flight network is a single
undated snapshot, so it is the same graph in every year of the page and is
labelled that way everywhere it appears.

Betweenness is computed on the weighted graph with distance = 1 / stock, so a
heavy corridor is a short step. That matters: on the unweighted matrix the top
brokers come out as Australia, Norway and Denmark, which ranks statistical
reporting systems rather than countries (see week03_country_networks.py). The
z-score against a degree-preserving null is what makes any of it interpretable.

Writes docs/assets/data/week03_corridors.json and week03_edges.json.

    python analysis/week03_corridor_control.py [--shuffles 100] [--null-year 2020]
"""

from __future__ import annotations

import argparse
import collections
import csv
import json
import math
import pathlib
import random
import statistics
import sys
import time

import networkx as nx

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "migration"))

RAW = ROOT / "build" / "raw"
OUT = ROOT / "docs" / "assets" / "data"
YEARS = [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024]
FOCUS = "DNK"


def read_json(path, attempts=5):
    """Read a JSON file, retrying a short read.

    This repository lives on a Google Drive mount, which occasionally hands
    back a truncated stream at a 64 KiB boundary and raises JSONDecodeError on
    a file that is perfectly fine on disk. Reading again has always worked.
    """
    for attempt in range(attempts):
        try:
            return json.loads(path.read_bytes().decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            if attempt == attempts - 1:
                raise
            time.sleep(0.4)
    raise AssertionError("unreachable")


def read_tsv(path):
    with (ROOT / path).open(encoding="utf-8") as fh:
        body = [line for line in fh if not line.startswith("#")]
    return list(csv.DictReader(body, delimiter="\t"))


# --------------------------------------------------------------------- flights

def flight_network(iso3_by_iso2):
    """OpenFlights airport routes, aggregated to country pairs.

    An edge weight is the number of distinct airport-pair routes between the two
    countries, which is a proxy for how much air access exists. It is not seats,
    not flights per week and not passengers.
    """
    country_by_name = {}
    with (RAW / "countries.dat").open(encoding="utf-8") as fh:
        for name, iso2, _ in csv.reader(fh):
            iso3 = iso3_by_iso2.get(iso2)
            if iso3:
                country_by_name[name] = iso3

    country_by_airport = {}
    airports = {}
    with (RAW / "airports.dat").open(encoding="utf-8") as fh:
        for row in csv.reader(fh):
            if len(row) < 8:
                continue
            code, country, iata = row[0], row[3], row[4]
            iso3 = country_by_name.get(country)
            if not iso3:
                continue
            country_by_airport[code] = iso3
            if iata and iata != "\\N":
                country_by_airport[iata] = iso3
            try:
                airports[code] = (float(row[6]), float(row[7]))
            except ValueError:
                pass

    pairs = collections.defaultdict(set)
    unresolved = 0
    with (RAW / "routes.dat").open(encoding="utf-8") as fh:
        for row in csv.reader(fh):
            if len(row) < 6:
                continue
            src, dst = row[2], row[4]
            a, b = country_by_airport.get(src), country_by_airport.get(dst)
            if not a or not b:
                unresolved += 1
                continue
            if a == b:
                continue  # domestic routes are not international access
            pairs[(a, b)].add((src, dst))

    graph = nx.DiGraph()
    for (a, b), routes in pairs.items():
        graph.add_edge(a, b, weight=len(routes))
    print(f"  flights: {graph.number_of_nodes()} countries, "
          f"{graph.number_of_edges()} country pairs, "
          f"{unresolved} routes with an unresolved endpoint")
    return graph


# ------------------------------------------------------------------- migration

def migration_networks():
    graphs = {}
    rows = read_tsv("data/migration_flows.tsv")
    for year in YEARS:
        graph = nx.DiGraph()
        for row in rows:
            value = int(row[f"stock_{year}"] or 0)
            if value > 0:
                graph.add_edge(row["origin"], row["destination"], weight=value)
        graphs[year] = graph
        print(f"  migration {year}: {graph.number_of_nodes()} countries, "
              f"{graph.number_of_edges()} corridors")
    return graphs, rows


def weighted_betweenness(graph):
    """Distance = 1 / stock, so a heavy corridor is a short step."""
    lengths = {(a, b): 1.0 / w for a, b, w in graph.edges(data="weight")}
    nx.set_edge_attributes(graph, lengths, "distance")
    return nx.betweenness_centrality(graph, weight="distance", normalized=True)


def degree_preserving_null(graph, shuffles, seed):
    """Keep every country's in- and out-degree, break the topology-weight link.

    Double-edge swaps preserve the degree sequence; the observed weights are then
    dealt back out at random. So a high z-score means a country brokers more than
    its number of partners and the world's weight distribution can explain.
    """
    samples = collections.defaultdict(list)
    rng = random.Random(seed)
    weights = [w for _, _, w in graph.edges(data="weight")]
    for run in range(shuffles):
        shuffled = graph.copy()
        try:
            nx.directed_edge_swap(
                shuffled,
                nswap=3 * shuffled.number_of_edges(),
                max_tries=100 * shuffled.number_of_edges(),
                seed=rng.randint(0, 2 ** 31),
            )
        except nx.NetworkXAlgorithmError:
            pass
        drawn = weights[:]
        rng.shuffle(drawn)
        nx.set_edge_attributes(
            shuffled,
            {edge: value for edge, value in zip(shuffled.edges(), drawn)},
            "weight",
        )
        for node, value in weighted_betweenness(shuffled).items():
            samples[node].append(value)
        if (run + 1) % 10 == 0:
            print(f"    shuffle {run + 1}/{shuffles}", flush=True)
    return samples


def typology(node, year_metrics, flight_rank, country_count):
    """Five buckets, defined on ranks so the labels survive a change of year.

    A leaf has to be small on every axis. Testing degree alone put Singapore and
    Jordan in the periphery, which is nonsense: both receive enormous numbers of
    people through a modest number of corridors.
    """
    m = year_metrics[node]
    top = country_count * 0.1
    half = country_count * 0.5
    strong_in = m["in_strength_rank"] <= top
    high_between = m["betweenness_rank"] <= top
    surprising = (m.get("z") or 0) >= 2
    many_flights = flight_rank.get(node, country_count) <= top

    if strong_in and many_flights:
        return "both"
    if strong_in:
        return "destination-hub"
    if high_between and surprising:
        return "human-bridge"
    if many_flights:
        return "system-airport"
    if (
        m["in_degree_rank"] > half
        and m["in_strength_rank"] > half
        and m["betweenness_rank"] > half
    ):
        return "leaf"
    return "mixed"


def ranked(values, reverse=True):
    order = sorted(values, key=lambda k: -values[k] if reverse else values[k])
    return {node: i + 1 for i, node in enumerate(order)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shuffles", type=int, default=100)
    parser.add_argument("--null-year", type=int, default=2020)
    parser.add_argument(
        "--reuse-null",
        action="store_true",
        help="take the z-scores from the existing JSON instead of reshuffling; "
             "for changing a label or a rank without waiting for the null again",
    )
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    from wikiclients import sparql
    print("country metadata from Wikidata")
    meta_rows = sparql(
        "SELECT ?iso3 ?iso2 ?label ?coord WHERE { ?c wdt:P298 ?iso3 . "
        "OPTIONAL { ?c wdt:P297 ?iso2 } OPTIONAL { ?c wdt:P625 ?coord } "
        "?c rdfs:label ?label FILTER(lang(?label) = 'en') }"
    )
    names, coords, iso3_by_iso2, iso2_by_iso3 = {}, {}, {}, {}
    for row in meta_rows:
        iso3 = row["iso3"]
        names.setdefault(iso3, row["label"])
        if row.get("iso2"):
            iso3_by_iso2.setdefault(row["iso2"], iso3)
            iso2_by_iso3.setdefault(iso3, row["iso2"])
        point = row.get("coord", "")
        if point.startswith("Point(") and iso3 not in coords:
            lon, lat = point[6:-1].split()
            coords[iso3] = [round(float(lat), 3), round(float(lon), 3)]
    print(f"  {len(names)} countries, {len(coords)} with coordinates")

    print("building networks")
    flights = flight_network(iso3_by_iso2)
    migration, edge_rows = migration_networks()

    countries = sorted(set().union(*(set(g) for g in migration.values())) | set(flights))
    index = {iso3: i for i, iso3 in enumerate(countries)}

    flight_in = dict(flights.in_degree())
    flight_out = dict(flights.out_degree())
    flight_strength = dict(flights.in_degree(weight="weight"))
    flight_rank = ranked(flight_strength)
    # Same definition as the migration side: distance = 1 / routes, so a pair of
    # countries with many routes between them is one short step apart.
    print("  flight betweenness", flush=True)
    flight_between = weighted_betweenness(flights)
    flight_between_rank = ranked(flight_between)

    per_year = {}
    for year in YEARS:
        graph = migration[year]
        print(f"  betweenness {year}", flush=True)
        between = weighted_betweenness(graph)
        metrics = {}
        in_strength = dict(graph.in_degree(weight="weight"))
        out_strength = dict(graph.out_degree(weight="weight"))
        in_degree, out_degree = dict(graph.in_degree()), dict(graph.out_degree())
        ranks = {
            "in_strength_rank": ranked(in_strength),
            "out_strength_rank": ranked(out_strength),
            "in_degree_rank": ranked(in_degree),
            "out_degree_rank": ranked(out_degree),
            "betweenness_rank": ranked(between),
        }
        for node in graph:
            metrics[node] = {
                "in_strength": in_strength[node],
                "out_strength": out_strength[node],
                "in_degree": in_degree[node],
                "out_degree": out_degree[node],
                "betweenness": round(between[node], 8),
                **{k: v[node] for k, v in ranks.items()},
            }
        per_year[year] = metrics

    cached = OUT / "week03_corridors.json"
    if args.reuse_null and cached.exists():
        previous = read_json(cached)
        null_summary = previous["null_summary"]
        args.shuffles = previous["shuffles"]
        print(f"reusing the null from {cached.name} ({args.shuffles} shuffles)")
        for node, stats in null_summary.items():
            if node in per_year[args.null_year]:
                per_year[args.null_year][node]["z"] = stats["z"]
    else:
        print(f"null model on {args.null_year}, {args.shuffles} shuffles")
        samples = degree_preserving_null(migration[args.null_year], args.shuffles, 20260916)
        null_summary = {}
        for node, metrics in per_year[args.null_year].items():
            draws = samples.get(node, [])
            if len(draws) < 2:
                continue
            mean, spread = statistics.fmean(draws), statistics.pstdev(draws)
            z = (metrics["betweenness"] - mean) / spread if spread > 0 else 0.0
            metrics["z"] = round(z, 3)
            null_summary[node] = {
                "null_mean": round(mean, 8), "null_sd": round(spread, 8), "z": round(z, 3),
            }

    count = len(per_year[args.null_year])
    for node in per_year[args.null_year]:
        per_year[args.null_year][node]["typology"] = typology(
            node, per_year[args.null_year], flight_rank, count)

    def corridors(graph, node, direction, limit=5):
        if node not in graph:
            return []
        edges = (graph.out_edges(node, data="weight") if direction == "out"
                 else graph.in_edges(node, data="weight"))
        ordered = sorted(edges, key=lambda e: -e[2])[:limit]
        return [{"other": (b if direction == "out" else a), "weight": w}
                for a, b, w in ordered]

    nodes = {}
    for iso3 in countries:
        record = {
            "iso3": iso3,
            "iso2": iso2_by_iso3.get(iso3, ""),
            "name": names.get(iso3, iso3),
            "coord": coords.get(iso3),
            "flight_degree": flight_in.get(iso3, 0) + flight_out.get(iso3, 0),
            "flight_in_degree": flight_in.get(iso3, 0),
            "flight_strength": flight_strength.get(iso3, 0),
            "flight_rank": flight_rank.get(iso3),
            "flight_betweenness": round(flight_between.get(iso3, 0.0), 8),
            "flight_betweenness_rank": flight_between_rank.get(iso3),
            "years": {},
        }
        for year in YEARS:
            if iso3 in per_year[year]:
                record["years"][str(year)] = per_year[year][iso3]
        record["top_in"] = corridors(migration[args.null_year], iso3, "in")
        record["top_out"] = corridors(migration[args.null_year], iso3, "out")
        nodes[iso3] = record

    # Section 8 analyses one country, and the reader picks which. The page
    # builds its series and its peer group from the per-country records above,
    # so all this has to carry is where it starts.
    focus = {"iso3": FOCUS, "name": names.get(FOCUS, FOCUS)}

    graph = migration[args.null_year]
    all_weights = sorted((w for _, _, w in graph.edges(data="weight")), reverse=True)
    payload = {
        "generated": "analysis/week03_corridor_control.py",
        "years": YEARS,
        "null_year": args.null_year,
        "shuffles": args.shuffles,
        "countries": countries,
        "nodes": nodes,
        "focus": focus,
        "flight_snapshot": {
            "source": "OpenFlights routes.dat",
            "dated": False,
            "note": "One undated snapshot, last substantially refreshed around 2014. "
                    "It does not vary by year and is drawn identically at every "
                    "point on the year slider.",
            "country_pairs": flights.number_of_edges(),
            "countries": flights.number_of_nodes(),
        },
        "totals": {
            year: {
                "corridors": migration[year].number_of_edges(),
                "countries": migration[year].number_of_nodes(),
                "people": sum(w for _, _, w in migration[year].edges(data="weight")),
            }
            for year in YEARS
        },
        "corridor_count": len(all_weights),
        "null_summary": null_summary,
    }

    # Country context for the questions section: wealth and size, so a corridor
    # can be set against how rich and how large its two ends are.
    indicators = {}
    try:
        for row in read_tsv("data/migration_country_indicators.tsv"):
            iso3 = row["iso3"]
            def number(key):
                value = row.get(key, "")
                try:
                    return float(value)
                except (TypeError, ValueError):
                    return None
            indicators[iso3] = {
                "gdp": number("gdp_per_capita_usd_2024"),
                "growth": number("gdp_growth_pct_2024"),
                "pop": number("population_2024"),
                "net": number("net_migration_2024"),
                "remit_in": number("remittances_received_usd_2024"),
            }
        print(f"  country indicators: {len(indicators)}")
    except FileNotFoundError:
        print("  no country indicators; run scripts/migration/fetch_country_layer.py")

    payload["indicators"] = {
        iso3: values for iso3, values in indicators.items()
        if iso3 in nodes and any(v is not None for v in values.values())
    }
    (OUT / "week03_corridors.json").write_text(json.dumps(payload, separators=(",", ":")))

    # Edge file: one row per corridor, weights for every year, flight routes.
    flight_weight = {(a, b): w for a, b, w in flights.edges(data="weight")}

    def great_circle(a, b):
        """Kilometres between two country points, for the distance question."""
        p, q = coords.get(a), coords.get(b)
        if not p or not q:
            return 0
        lat1, lon1, lat2, lon2 = map(math.radians, (p[0], p[1], q[0], q[1]))
        h = (math.sin((lat2 - lat1) / 2) ** 2
             + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2)
        return round(2 * 6371 * math.asin(min(1, math.sqrt(h))))

    edges = []
    for row in edge_rows:
        a, b = row["origin"], row["destination"]
        series = [int(row[f"stock_{y}"] or 0) for y in YEARS]
        if not any(series):
            continue
        female = row.get("female_2024", "")
        edges.append([
            index[a], index[b], series,
            flight_weight.get((a, b), 0),
            great_circle(a, b),
            int(female) if str(female).isdigit() else -1,
        ])
    (OUT / "week03_edges.json").write_text(json.dumps(
        {
            "countries": countries,
            "years": YEARS,
            # [origin, destination, stock per year, flight routes, km, women in 2024]
            "fields": ["origin", "destination", "stocks", "routes", "km", "female"],
            "edges": edges,
        },
        separators=(",", ":")))

    print(f"\nwrote {(OUT / 'week03_corridors.json').relative_to(ROOT)}")
    print(f"wrote {(OUT / 'week03_edges.json').relative_to(ROOT)} ({len(edges)} corridors)")
    top = sorted(per_year[args.null_year].items(),
                 key=lambda kv: kv[1]["betweenness_rank"])[:8]
    print(f"\ntop betweenness {args.null_year}: " +
          ", ".join(f"{k} (z={v.get('z')})" for k, v in top))


if __name__ == "__main__":
    main()
