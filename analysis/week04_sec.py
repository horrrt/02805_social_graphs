"""Industry for listed companies in the week 4 networks, from the SEC.

The SEC lists every company that files with it (company_tickers.json: CIK,
ticker, name) and gives each its SIC industry code (the submissions API). This
script matches those names to our clients and filing firms with the same name
rules as everything else (week04_names: normalize, then the family table),
fetches the SIC code of each match, and converts it to a NAICS sector with
sector_of_sic(). A company in the reviewed alias table keeps its reviewed
sector; the SEC fills in the rest.

Only exact matches after normalization count, so "Alphabet" does not become
Google and "Capital Group" does not become Capital One; names the SEC spells
differently stay unlabelled rather than guessed.

    python analysis/week04_sec.py

Needs the week 4 tables (python analysis/week04_data.py) and, for the ticker
list, CONTACT_EMAIL=you@student.dtu.dk. Caches the SEC files in
build/raw/week04/sec/; the SEC asks for at most ten requests a second.

Output: analysis/week04_sec_sectors.csv (company key, CIK, ticker, SEC name,
SIC, SIC description, NAICS sector), read by week04_names.naics2().
"""

import csv
import json
import os
import time
import urllib.request
from pathlib import Path

import pandas as pd

import week04_names as names
from week04_data import RAW
from week04_staffing import certified, placements, resolver

OUT = Path(__file__).with_name("week04_sec_sectors.csv")
CACHE = RAW / "sec"
# www.sec.gov refuses a User-Agent without a contact address; data.sec.gov
# accepts the project's name. Set CONTACT_EMAIL to fetch the ticker list.
AGENT = "02805-student-research/0.1 (DTU course project)"
CONTACT = os.environ.get("CONTACT_EMAIL")
MIN_FILINGS = 5


def fetch(url, dest):
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        agent = f"Mozilla/5.0 (research; {CONTACT})" if CONTACT and "www.sec.gov" in url else AGENT
        req = urllib.request.Request(url, headers={"User-Agent": agent})
        with urllib.request.urlopen(req, timeout=60) as r:
            dest.write_bytes(r.read())
        time.sleep(0.12)
    return json.loads(dest.read_text())


def sector_of_sic(sic):
    """The NAICS 2022 sector of a SIC code, by SIC division; approximate where the
    two systems cut industries differently (software publishers are Information,
    other computer services Professional services)."""
    s = int(sic)
    table = [
        (100, 999, "11"), (1000, 1499, "21"), (1500, 1799, "23"), (2000, 3999, "31-33"),
        (4000, 4799, "48-49"), (4800, 4899, "51"), (4900, 4999, "22"), (5000, 5199, "42"),
        (5800, 5899, "72"), (5200, 5999, "44-45"), (6500, 6599, "53"), (6000, 6799, "52"),
        (7000, 7099, "72"), (7372, 7372, "51"), (7370, 7379, "54"), (7200, 7299, "81"),
        (7300, 7399, "56"), (7500, 7699, "81"), (7810, 7819, "51"), (7800, 7999, "71"),
        (8000, 8099, "62"), (8100, 8199, "54"), (8200, 8299, "61"), (8300, 8399, "62"),
        (8600, 8699, "81"), (8700, 8799, "54"), (9100, 9999, "92"),
    ]
    for low, high, sector in table:
        if low <= s <= high:
            return sector
    return ""


def our_companies():
    """Every client and filing firm with MIN_FILINGS or more filings, FY2022 to FY2026."""
    counts = pd.Series(dtype=float)
    for year in (2022, 2023, 2024, 2025, 2026):
        lca = certified(year)
        rows, _, _ = placements(year, lca)
        counts = counts.add(lca["employer"].value_counts(), fill_value=0)
        counts = counts.add(rows["client"].value_counts(), fill_value=0)
    return counts[counts >= MIN_FILINGS]


def main():
    tickers = fetch("https://www.sec.gov/files/company_tickers.json", CACHE / "company_tickers.json")
    ours = our_companies()
    r = resolver()
    # One SEC company per key: the first listing of a name (share classes repeat it).
    by_key = {}
    for entry in tickers.values():
        key = r.client(entry["title"])
        if key and key in ours.index and key not in by_key:
            by_key[key] = entry
    rows = []
    for key, entry in sorted(by_key.items(), key=lambda kv: -ours[kv[0]]):
        cik = f"{entry['cik_str']:010d}"
        sub = fetch(f"https://data.sec.gov/submissions/CIK{cik}.json", CACHE / f"CIK{cik}.json")
        sic = sub.get("sic") or ""
        rows.append({
            "key": key, "cik": cik, "ticker": entry["ticker"], "sec_name": entry["title"],
            "sic": sic, "sic_description": sub.get("sicDescription", ""),
            "naics2": sector_of_sic(sic) if sic else "",
            "filings": int(ours[key]),
        })
    with open(OUT, "w", newline="", encoding="utf-8") as fh:
        fh.write("# Listed companies matched to week 4 clients and filing firms by exact normalized name; "
                 "SIC from the SEC submissions API, NAICS sector by week04_sec.sector_of_sic().\n")
        writer = csv.DictWriter(fh, list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    labelled = sum(1 for row in rows if row["naics2"])
    print(f"{len(ours):,} companies with {MIN_FILINGS}+ filings; {len(rows)} matched to the SEC, "
          f"{labelled} with a sector -> {OUT.name}")


if __name__ == "__main__":
    main()
