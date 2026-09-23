"""Is a route a good proxy for the people on it?

The flight network on this page counts routes. Two countries joined by one
weekly turboprop and two countries joined by six daily widebodies are the
same edge, and the post says so in its methods and then goes on using the
measure anyway, because a free global passenger matrix does not exist.

It does exist for one country. US BTS T-100 publishes passengers on every
international segment with a US airport at one end, monthly since 1990,
public domain. That is not a replacement for the world network — it is one
country's spokes — but it is enough to answer the question the proxy raises:
across the routes we can check, how well does counting routes stand in for
counting people?

    python analysis/week03_passengers.py [--year 2019] [--force]

Writes analysis/week03_passengers.json.

Why 2019 by default. It is the last complete year before the pandemic, and
the OpenFlights snapshot the route network is built from was last
substantially refreshed around 2014, so a pre-2020 comparison is the closest
in time the two sources get. 2020 onward would measure the pandemic, not the
proxy.

The join. Foreign airports are mapped to countries through the same
OpenFlights airports table the route network itself is built from, so a
route and its passengers are keyed the same way. Any error in that table
hits both sides equally, which is what a fair comparison needs.
"""

from __future__ import annotations

import argparse
import collections
import csv
import json
import math
import pathlib
import urllib.parse
import urllib.request

from scipy import stats

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "build" / "raw"
DATA = ROOT / "docs" / "assets" / "data"
OUT = ROOT / "analysis"

SODA = "https://datahub.transportation.gov/resource/xgub-n9bw.json"
USER_AGENT = "02805-social-graphs course project (DTU), contact via the repository"


def soda(params: dict) -> list[dict]:
    url = f"{SODA}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.loads(response.read())


def airport_countries() -> dict[str, str]:
    """IATA code -> country name, from the OpenFlights table already on disk."""
    path = RAW / "airports.dat"
    if not path.exists():
        raise SystemExit(
            "build/raw/airports.dat is missing; run scripts/rebuild_week03.py first"
        )
    out = {}
    with path.open(encoding="utf-8") as fh:
        for row in csv.reader(fh):
            if len(row) > 4 and row[4] and row[4] != "\\N":
                out[row[4]] = row[3]
    return out


def route_counts() -> collections.Counter:
    """Routes between each country and the United States, the page's measure."""
    path = RAW / "routes.dat"
    countries = airport_countries()
    pairs = set()
    with path.open(encoding="utf-8") as fh:
        for row in csv.reader(fh):
            if len(row) < 5:
                continue
            a, b = countries.get(row[2]), countries.get(row[4])
            if not a or not b or a == b:
                continue
            if "United States" not in (a, b):
                continue
            other = b if a == "United States" else a
            # A distinct airport pair, which is exactly what the page counts.
            pairs.add((other, row[2], row[4]))
    counted = collections.Counter()
    for other, _, _ in pairs:
        counted[other] += 1
    return counted


def passengers(year: int, force: bool) -> collections.Counter:
    cache = RAW / f"bts_t100_{year}.json"
    if cache.exists() and not force:
        rows = json.loads(cache.read_text())
        print(f"  cached  {cache.name}")
    else:
        print(f"  fetch   BTS T-100 {year} … ", end="", flush=True)
        rows = soda({
            "$select": "fg_apt,sum(total)",
            "$where": f"year='{year}' AND type='Passengers'",
            "$group": "fg_apt",
            "$limit": "50000",
        })
        RAW.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(rows))
        print(f"{len(rows)} foreign airports")
    countries = airport_countries()
    counted = collections.Counter()
    unmapped = 0
    for row in rows:
        country = countries.get(row["fg_apt"])
        total = float(row.get("sum_total") or 0)
        if not country:
            unmapped += total
            continue
        counted[country] += total
    if unmapped:
        print(f"  {unmapped:,.0f} passengers at airports the OpenFlights table "
              f"does not name, dropped")
    return counted


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, default=2019)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    people = passengers(args.year, args.force)
    routes = route_counts()
    shared = sorted(set(people) & set(routes), key=lambda c: -people[c])
    print(f"\n{len(shared)} countries with both a route to the United States "
          f"and passengers on it, {args.year}")

    xs = [routes[c] for c in shared]
    ys = [people[c] for c in shared]
    # scipy rather than our own Pearson and our own tie-aware ranker. The two
    # agreed to six decimals on this data, and scipy brings the intervals with
    # it, which the page wants under every number anyway.
    pearson = stats.pearsonr([math.log(x) for x in xs], [math.log(max(y, 1)) for y in ys])
    spear = stats.spearmanr(xs, ys)
    r, rho = float(pearson.statistic), float(spear.statistic)
    r_ci = pearson.confidence_interval(0.95)
    # Spearman has no closed-form interval in scipy, so it gets the same
    # Fisher transform the rest of the page uses on a rank correlation.
    zr = math.atanh(rho)
    se = 1.06 / math.sqrt(len(shared) - 3)
    rho_ci = (math.tanh(zr - 1.96 * se), math.tanh(zr + 1.96 * se))
    print(f"  log-log correlation {r:.2f} "
          f"(95% {r_ci.low:.2f} to {r_ci.high:.2f}), "
          f"Spearman {rho:.2f} (95% {rho_ci[0]:.2f} to {rho_ci[1]:.2f})")

    # Passengers per route, which is the thing the proxy assumes is constant.
    # A country with one route gives a ratio built on one number, so the
    # headline spread is taken over countries with at least five routes and
    # the full list is kept for the tails.
    per = sorted(((people[c] / routes[c], c) for c in shared), reverse=True)
    solid = [(v, c) for v, c in per if routes[c] >= 5]
    spread = solid[0][0] / solid[-1][0] if solid and solid[-1][0] else float("inf")
    quart = sorted(v for v, _ in solid)
    iqr = (quart[len(quart) // 4], quart[3 * len(quart) // 4])
    print(f"  among the {len(solid)} countries with five routes or more, "
          f"passengers per route runs from {solid[0][0]:,.0f} ({solid[0][1]}) "
          f"to {solid[-1][0]:,.0f} ({solid[-1][1]}) — a factor of {spread:,.0f}")
    print(f"  the middle half of them sit between {iqr[0]:,.0f} and {iqr[1]:,.0f} "
          f"passengers per route, a factor of {iqr[1] / iqr[0]:.1f}")

    # Venezuela sits at the bottom on services the 2019 snapshot still lists
    # as flying, so the headline spread and the middle half are also given
    # with it dropped — the number the prose actually wants to quote.
    solid_ex = [(v, c) for v, c in solid if c != "Venezuela"]
    spread_ex = solid_ex[0][0] / solid_ex[-1][0] if solid_ex and solid_ex[-1][0] else float("inf")
    quart_ex = sorted(v for v, _ in solid_ex)
    iqr_ex = (quart_ex[len(quart_ex) // 4], quart_ex[3 * len(quart_ex) // 4])
    print(f"  excluding Venezuela, {len(solid_ex)} countries, "
          f"a factor of {spread_ex:,.1f} ({solid_ex[0][1]} to {solid_ex[-1][1]}), "
          f"middle half {iqr_ex[0]:,.0f} to {iqr_ex[1]:,.0f}")

    print("\n  Most passengers per route:")
    for value, country in per[:6]:
        print(f"    {country[:26]:<26} {routes[country]:>3} routes  "
              f"{people[country]:>12,.0f} people  {value:>10,.0f} each")
    print("  Fewest:")
    for value, country in per[-6:]:
        print(f"    {country[:26]:<26} {routes[country]:>3} routes  "
              f"{people[country]:>12,.0f} people  {value:>10,.0f} each")

    payload = {
        "generated": "analysis/week03_passengers.py",
        "year": args.year,
        "source": {
            "name": "US BTS T-100 International Segment",
            "url": "https://datahub.transportation.gov/resource/xgub-n9bw",
            "licence": "US federal government work, public domain",
            "scope": "every international segment with a United States airport at "
                     "one end, so this is one country's spokes and not the world.",
        },
        "countries": len(shared),
        "log_correlation": round(r, 3),
        "log_correlation_ci": [round(float(r_ci.low), 3), round(float(r_ci.high), 3)],
        "spearman": round(rho, 3),
        "spearman_ci": [round(rho_ci[0], 3), round(rho_ci[1], 3)],
        "per_route": {
            "highest": [{"country": c, "routes": routes[c], "people": int(people[c]),
                         "per_route": int(v)} for v, c in solid[:10]],
            "lowest": [{"country": c, "routes": routes[c], "people": int(people[c]),
                        "per_route": int(v)} for v, c in solid[-10:]],
            "spread": round(spread, 1),
            "middle_half": [int(iqr[0]), int(iqr[1])],
            "min_routes": 5,
            "countries": len(solid),
            "without_venezuela": {
                "countries": len(solid_ex),
                "spread": round(spread_ex, 1),
                "middle_half": [int(iqr_ex[0]), int(iqr_ex[1])],
                "highest": solid_ex[0][1],
                "lowest": solid_ex[-1][1],
            },
        },
        "note": "Route counts come from the same OpenFlights table the page's flight "
                "network is built from, so both sides of the comparison are keyed "
                "the same way. The OpenFlights snapshot is undated and last "
                "substantially refreshed around 2014, which is the main reason to "
                "compare against 2019 rather than a later year.",
    }
    path = OUT / "week03_passengers.json"
    path.write_text(json.dumps(payload, indent=2))
    print(f"\nwrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
