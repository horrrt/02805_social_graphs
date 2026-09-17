"""Monthly asylum applications: the highest-frequency bilateral series there is.

Eurostat's migr_asyappctzm is one row per reporting country, citizenship,
month, sex and age. Filtered to first-time applicants of all ages and sexes it
is a weighted directed origin -> destination network observed every month
since 2013, which is the finest grain any bilateral migration series reaches.
DESA, the spine of this page, is eight five-year snapshots and cannot see a
month, a war or a policy change.

Writes docs/assets/data/week03_asylum.json: per origin, the Europe-wide
monthly series and its main destinations, plus the month totals.

    python analysis/week03_asylum.py [--from 2013] [--min 3000] [--force]

Three things the numbers are not:

  Applications, not arrivals. Somebody who applies in Hungary and again in
  Germany is two applications, and Dublin transfers put the same person in
  several national counts.
  First-time only, so the repeat applications in Eurostat's TOTAL are left
  out. That keeps the 2015 and 2022 peaks from being inflated by resubmission.
  Europe only: 34 reporting countries, EU27 plus EFTA and candidates. A
  corridor that ends anywhere else is invisible here.

Suppression matters on a grid. Eurostat withholds small cells, so a month with
no reported figure is not a month with no applications. Months where no
destination reported anything are written as null and drawn as "no figure",
never as zero.
"""

from __future__ import annotations

import argparse
import collections
import json
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "build" / "raw"
OUT = ROOT / "docs" / "assets" / "data"

API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/migr_asyappctzm"
QUERY = "format=JSON&lang=EN&sex=T&age=TOTAL&unit=PER&applicant=FRST"
USER_AGENT = "02805-social-graphs course project (DTU), contact via the repository"

# Both dimensions mix aggregates in with the countries, and both would be
# double-counted by a plain sum: EU27_2020 contains twenty-seven of the
# reporting countries, and TOTAL contains every citizenship.
GEO_AGGREGATES = {"EU27_2020", "EU28", "EU27_2007", "EA19", "EA20", "TOTAL", "EFTA"}
CITIZEN_AGGREGATES = {"TOTAL", "EU27_2020", "EXT_EU27_2020", "EFTA", "NEU", "RNC"}


def year_slice(year: int, force: bool) -> dict:
    """One calendar year of the cube, cached on disk.

    The whole series in one request times out, and a request per origin is two
    hundred of them. A year at a time is about 780 KB and fifteen seconds.
    """
    RAW.mkdir(parents=True, exist_ok=True)
    cache = RAW / f"eurostat_asylum_{year}.json"
    if cache.exists() and cache.stat().st_size > 0 and not force:
        return json.loads(cache.read_text(encoding="utf-8"))
    url = f"{API}?{QUERY}&sinceTimePeriod={year}-01&untilTimePeriod={year}-12"
    print(f"  fetch   {year} … ", end="", flush=True)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    started = time.time()
    with urllib.request.urlopen(request, timeout=600) as response:
        body = response.read()
    cache.write_bytes(body)
    print(f"{len(body) // 1024} KB in {time.time() - started:.0f}s")
    return json.loads(body)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from", dest="first", type=int, default=2013)
    parser.add_argument("--to", dest="last", type=int, default=2026)
    parser.add_argument("--min", dest="floor", type=int, default=3000,
                        help="drop an origin whose whole series is below this")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    months = []
    # origin -> month -> applications, and origin -> destination -> total.
    series = collections.defaultdict(dict)
    pairs = collections.defaultdict(collections.Counter)
    names = {}
    destinations = {}

    for year in range(args.first, args.last + 1):
        try:
            cube = year_slice(year, args.force)
        except urllib.error.HTTPError as error:
            print(f"  {year}: {error.code}, stopping here")
            break
        index = cube["dimension"]
        citizens = index["citizen"]["category"]
        geos = index["geo"]["category"]
        times = index["time"]["category"]
        names.update(citizens["label"])
        destinations.update(geos["label"])
        by_citizen = {v: k for k, v in citizens["index"].items()}
        by_geo = {v: k for k, v in geos["index"].items()}
        by_time = {v: k for k, v in times["index"].items()}
        n_geo, n_time = len(by_geo), len(by_time)
        months.extend(sorted(times["index"], key=lambda m: times["index"][m]))

        for key, value in cube["value"].items():
            key = int(key)
            month = by_time[key % n_time]
            geo = by_geo[(key // n_time) % n_geo]
            # The reporting dimension carries EU27_2020 alongside its own
            # members. Summing over it counts most of Europe twice.
            if geo in GEO_AGGREGATES:
                continue
            citizen = by_citizen[key // (n_time * n_geo)]
            series[citizen][month] = series[citizen].get(month, 0) + value
            pairs[citizen][geo] += value

    months = sorted(set(months))
    if not months:
        raise SystemExit("no months came back; the API shape may have changed")

    # The rest of the page is keyed by ISO 3166-1 alpha-3, so the origins are
    # mapped over through the node table and can be selected like any country.
    corridors = json.loads((OUT / "week03_corridors.json").read_text())
    iso3_by_iso2 = {
        node["iso2"]: iso3
        for iso3, node in corridors["nodes"].items()
        if node.get("iso2")
    }
    # Eurostat's own spellings for two places the node table codes differently.
    iso3_by_iso2.setdefault("XK", "XKX")
    iso3_by_iso2.setdefault("PS", "PSE")

    origins = {}
    dropped = []
    for citizen, by_month in series.items():
        total = sum(by_month.values())
        if citizen in CITIZEN_AGGREGATES or total < args.floor:
            if citizen in CITIZEN_AGGREGATES:
                dropped.append(citizen)
            continue
        # A month nobody reported is not a month with nobody applying, so it
        # stays null and the chart draws it as a hole.
        origins[citizen] = {
            "iso3": iso3_by_iso2.get(citizen),
            "name": names.get(citizen, citizen),
            "total": round(total),
            "months": [round(by_month[m]) if m in by_month else None for m in months],
            "top": [
                {"iso2": geo, "name": destinations.get(geo, geo), "people": round(value)}
                for geo, value in pairs[citizen].most_common(5)
            ],
        }

    # The month totals are summed over the origins that survive the filters,
    # not taken from Eurostat's own TOTAL row, so the grid and the line agree.
    totals = [
        round(sum(
            series[citizen].get(month, 0)
            for citizen in origins
        ))
        for month in months
    ]
    payload = {
        "generated": "analysis/week03_asylum.py",
        "source": {
            "name": "Eurostat migr_asyappctzm",
            "url": "https://ec.europa.eu/eurostat/databrowser/view/migr_asyappctzm",
            "licence": "Reuse with attribution",
            "filter": "first-time applicants, all ages, both sexes",
            "note": "Applications, not arrivals, and Europe only. One person who "
                    "applies in two countries is two applications.",
        },
        "months": months,
        "reporting": len(destinations),
        "dropped_aggregates": sorted(dropped),
        "origins": origins,
        "totals": totals,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "week03_asylum.json"
    path.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"\nwrote {path.relative_to(ROOT)} "
          f"({len(origins)} origins over {args.floor:,}, {len(months)} months, "
          f"{months[0]} to {months[-1]}, {path.stat().st_size // 1024} KB)")
    biggest = sorted(origins.items(), key=lambda kv: -kv[1]["total"])[:6]
    for iso2, origin in biggest:
        peak = max(
            ((value, months[i]) for i, value in enumerate(origin["months"]) if value),
            default=(0, "—"),
        )
        print(f"  {origin['name'][:28]:<28} {origin['total']:>9,}  peak {peak[1]} ({peak[0]:,})")


if __name__ == "__main__":
    main()
