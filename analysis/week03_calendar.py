"""The calendar: a year of migrant deaths, one cell a day.

Every other chart in Corridor Control counts people who arrived. UN DESA's
stock table has no date in it at all — it is eight five-year snapshots — so
nothing upstream can show a day, a week or a season. This file can, because
IOM's Missing Migrants Project records one row per incident with the date it
was reported, and the thing it counts is the other half of a corridor: the
people who did not arrive.

Reads the HDX mirror of the IOM file, bins the incidents by day, and writes
docs/assets/data/week03_calendar.json with one entry per day that had one.

    python analysis/week03_calendar.py [--from 2019] [--force]

What the numbers are, and are not:

  A count of recorded incidents, not of deaths. IOM says plainly that the
  record is an undercount, and how big an undercount is unknown and varies by
  route. A bright year can mean better reporting rather than more dying.
  Two of the biggest single days in the file are shipwrecks where the number
  missing was estimated from survivor accounts, so a spike can be one boat.
"""

from __future__ import annotations

import argparse
import collections
import csv
import io
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "build" / "raw"
OUT = ROOT / "docs" / "assets" / "data"

# The CKAN resource redirects to a signed S3 object that expires, so the link
# to keep is this one: it is re-signed on every request.
SOURCE = (
    "https://data.humdata.org/dataset/fc59785a-31d2-4018-aac7-6b9f619ae8ec"
    "/resource/99078436-9c4a-473b-a073-428304a9cf8a/download"
    "/iom-missing-migrants-project-data.csv"
)
USER_AGENT = "02805-social-graphs course project (DTU), contact via the repository"
CACHE = RAW / "iom_missing_migrants.csv"


def fetch(force: bool) -> str:
    if CACHE.exists() and CACHE.stat().st_size > 0 and not force:
        print(f"  cached  {CACHE.name} ({CACHE.stat().st_size // 1024} KB)")
        return CACHE.read_text(encoding="utf-8")
    print(f"  fetch   {CACHE.name} … ", end="", flush=True)
    request = urllib.request.Request(SOURCE, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=180) as response:
        body = response.read().decode("utf-8-sig", "replace")
    RAW.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(body, encoding="utf-8")
    print(f"{len(body) // 1024} KB")
    return body


def clip(text: str, limit: int) -> str:
    """The first sentence of a location description, within a length.

    These read like "Off the coast of Pylos, Greece. After departure from
    Tobruk, Libya en route to Italy." The first sentence is the place; cutting
    mid-way through the second one leaves "en route to" hanging.
    """
    text = " ".join(text.split())
    first = text.split(". ")[0]
    if 12 <= len(first) <= limit:
        return first.rstrip(" ,.;:-")
    if len(text) <= limit:
        return text.rstrip(" ,.;:-")
    return text[:limit].rsplit(" ", 1)[0].rstrip(" ,.;:-") + "…"


def number(value) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from", dest="first", type=int, default=2019,
                        help="earliest year to ship; the file starts in 2014")
    parser.add_argument("--force", action="store_true", help="re-download")
    args = parser.parse_args()

    rows = list(csv.DictReader(io.StringIO(fetch(args.force))))
    print(f"  {len(rows)} incidents in the file")

    days = collections.defaultdict(lambda: {"people": 0, "incidents": 0})
    regions = collections.defaultdict(collections.Counter)
    routes = collections.defaultdict(collections.Counter)
    worst = {}
    for row in rows:
        date = (row.get("reported_date") or "")[:10]
        if len(date) != 10 or not date[:4].isdigit():
            continue
        year = int(date[:4])
        if year < args.first:
            continue
        people = number(row.get("total_dead_and_missing"))
        days[date]["people"] += people
        days[date]["incidents"] += 1
        region = (row.get("region") or "Unknown").strip()
        regions[date][region] += people
        route = (row.get("migration_route") or "").strip()
        if route:
            routes[date][route] += people
        # The one-line description of the heaviest incident of the day, so a
        # spike can be read rather than only counted.
        if people and people >= worst.get(date, (0, ""))[0]:
            where = (row.get("location_description") or row.get("country_of_incident") or "").strip()
            worst[date] = (people, clip(where, 90))

    # The last year in the file is partial, and a half-drawn calendar next to
    # full ones reads as a fall in deaths rather than a fall in days elapsed.
    years = sorted({date[:4] for date in days})
    complete = [y for y in years if len({d for d in days if d[:4] == y}) > 300]

    payload = {
        "generated": "analysis/week03_calendar.py",
        "source": {
            "name": "IOM Missing Migrants Project",
            "url": "https://missingmigrants.iom.int/",
            "mirror": SOURCE,
            "licence": "CC BY-IGO",
            "note": "Recorded incidents, which IOM states are an undercount of "
                    "unknown and route-dependent size. A busier year can mean "
                    "better reporting.",
        },
        "years": years,
        "complete_years": complete,
        # [people, incidents, region, route, the heaviest incident's place].
        # An array rather than an object: 2,700 days of named keys is a
        # quarter of a megabyte of the word "incidents".
        "fields": ["people", "incidents", "region", "route", "worst"],
        "days": {
            date: [
                value["people"],
                value["incidents"],
                regions[date].most_common(1)[0][0] if regions[date] else "",
                routes[date].most_common(1)[0][0] if routes[date] else "",
                # Only where a spike needs explaining; on a one-death day the
                # place name is in the region already.
                worst[date][1] if value["people"] >= 10 and date in worst else "",
            ]
            for date, value in sorted(days.items())
        },
    }

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "week03_calendar.json"
    path.write_text(json.dumps(payload, separators=(",", ":")))
    total = sum(v["people"] for v in days.values())
    print(f"\nwrote {path.relative_to(ROOT)} "
          f"({len(days)} days, {total:,} dead and missing, "
          f"{years[0]}–{years[-1]}, {path.stat().st_size // 1024} KB)")
    for year in years:
        people = sum(v["people"] for d, v in days.items() if d[:4] == year)
        print(f"  {year}: {people:>6,} on {len({d for d in days if d[:4] == year}):>3} days")


if __name__ == "__main__":
    main()
