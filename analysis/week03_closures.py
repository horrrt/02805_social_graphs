"""The day the borders shut, and the two years it took to open them again.

The flight network on this page is one undated snapshot, and the migrant stock
is eight five-year points. Neither can see 2020 at all: DESA's 2020 and 2024
observations straddle the whole pandemic. The Oxford Covid-19 Government
Response Tracker can, because it codes one number per country per day.

C8, international travel controls, is an ordinal for policy toward foreign
travellers:

    0  no restrictions
    1  screening arrivals
    2  quarantine arrivals from some or all regions
    3  ban arrivals from some regions
    4  ban on all regions, or a total border closure

This bins it into one row per day: how many countries reported, and how many
of them sat at each level. Writes docs/assets/data/week03_closures.json.

    python analysis/week03_closures.py [--force]

The denominator moves. Countries enter and leave the panel, so a share is only
honest against the countries reporting that day, and every number here ships
with the count it was taken over.
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

SOURCE = (
    "https://raw.githubusercontent.com/OxCGRT/covid-policy-dataset/main/data"
    "/OxCGRT_compact_national_v1.csv"
)
USER_AGENT = "02805-social-graphs course project (DTU), contact via the repository"
CACHE = RAW / "oxcgrt_national.csv"
FIELD = "C8EV_International travel controls"
LEVELS = [
    "no restrictions",
    "screening arrivals",
    "quarantine from some or all regions",
    "ban on arrivals from some regions",
    "ban on all regions, or total closure",
]


def fetch(force: bool) -> str:
    if CACHE.exists() and CACHE.stat().st_size > 0 and not force:
        print(f"  cached  {CACHE.name} ({CACHE.stat().st_size // 1024 // 1024} MB)")
        return CACHE.read_text(encoding="utf-8")
    print(f"  fetch   {CACHE.name} … ", end="", flush=True)
    request = urllib.request.Request(SOURCE, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=600) as response:
        body = response.read().decode("utf-8", "replace")
    RAW.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(body, encoding="utf-8")
    print(f"{len(body) // 1024 // 1024} MB")
    return body


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="re-download")
    args = parser.parse_args()

    rows = csv.DictReader(io.StringIO(fetch(args.force)))
    days = collections.defaultdict(lambda: [0, 0, 0, 0, 0])
    shut = collections.defaultdict(list)
    countries = set()
    for row in rows:
        # National totals only. The file also carries US states and UK nations,
        # and counting those as countries would weight two countries heavily.
        if row.get("Jurisdiction") != "NAT_TOTAL":
            continue
        raw = row.get(FIELD, "")
        if raw == "":
            continue
        try:
            level = int(float(raw))
        except ValueError:
            continue
        if not 0 <= level <= 4:
            continue
        stamp = row["Date"]
        date = f"{stamp[:4]}-{stamp[4:6]}-{stamp[6:8]}"
        days[date][level] += 1
        countries.add(row["CountryCode"])
        if level == 4:
            shut[date].append(row["CountryCode"])

    dates = sorted(days)
    payload = {
        "generated": "analysis/week03_closures.py",
        "source": {
            "name": "Oxford Covid-19 Government Response Tracker",
            "url": "https://github.com/OxCGRT/covid-policy-dataset",
            "licence": "CC BY 4.0",
            "field": FIELD,
            "note": "Policy toward foreign travellers, coded per country per day. "
                    "An ordinal, not a count of anybody: level 4 means the border "
                    "was closed on paper, not that nobody crossed it.",
        },
        "levels": LEVELS,
        "first": dates[0],
        "last": dates[-1],
        "countries": len(countries),
        # [countries at level 0, 1, 2, 3, 4]. The denominator is their sum, and
        # it moves as countries enter and leave the panel.
        "fields": ["level0", "level1", "level2", "level3", "level4"],
        "days": {date: days[date] for date in dates},
    }

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "week03_closures.json"
    path.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"\nwrote {path.relative_to(ROOT)} "
          f"({len(dates)} days, {len(countries)} countries, "
          f"{dates[0]} to {dates[-1]}, {path.stat().st_size // 1024} KB)")
    peak = max(dates, key=lambda d: days[d][4])
    print(f"  most closed: {peak}, {days[peak][4]} of {sum(days[peak])} reporting")
    print(f"  last day:    {dates[-1]}, {days[dates[-1]][4]} of {sum(days[dates[-1]])}")


if __name__ == "__main__":
    main()
