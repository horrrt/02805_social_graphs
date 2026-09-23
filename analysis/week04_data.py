"""Week 4 data: US H-1B and green-card filings, trimmed to the columns we use.

Downloads the Department of Labor disclosure files, keeps only the columns on
the allow-lists below, and writes gzipped CSVs to build/week04/ (gitignored).
Every week 4 script reads those CSVs through load(); nobody opens the raw
workbooks directly.

The raw files carry names, emails and phone numbers of employer contacts,
lawyers and preparers, and worksite street addresses that are sometimes a
worker's home. None of those columns is on an allow-list, and check_columns()
refuses to write one if it ever is. Never commit anything under build/.

    python analysis/week04_data.py                  # download and trim FY2025, FY2024
    python analysis/week04_data.py --local DIR      # trim copies already in DIR
    python analysis/week04_data.py --refs           # also the Census metro and BLS SOC files

Sources (public domain, US government):
https://www.dol.gov/agencies/eta/foreign-labor/performance
"""

import argparse
import os
import re
import sys
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "build" / "raw" / "week04"
OUT = ROOT / "build" / "week04"

DOL = "https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/"

LCA_COLUMNS = [
    "CASE_NUMBER",
    "CASE_STATUS",
    "VISA_CLASS",
    "RECEIVED_DATE",
    "JOB_TITLE",
    "SOC_CODE",
    "SOC_TITLE",
    "FULL_TIME_POSITION",
    "TOTAL_WORKER_POSITIONS",
    "NEW_EMPLOYMENT",
    "CHANGE_EMPLOYER",
    "EMPLOYER_NAME",
    "EMPLOYER_FEIN",
    "EMPLOYER_STATE",
    "NAICS_CODE",
    "LAWFIRM_NAME_BUSINESS_NAME",
    "WORKSITE_WORKERS",
    "SECONDARY_ENTITY",
    "SECONDARY_ENTITY_BUSINESS_NAME",
    "WORKSITE_CITY",
    "WORKSITE_COUNTY",
    "WORKSITE_STATE",
    "WAGE_RATE_OF_PAY_FROM",
    "WAGE_UNIT_OF_PAY",
    "PREVAILING_WAGE",
    "PW_UNIT_OF_PAY",
    "PW_WAGE_LEVEL",
    "H_1B_DEPENDENT",
]
WORKSITE_COLUMNS = [
    "CASE_NUMBER",
    "WORKSITE_WORKERS",
    "SECONDARY_ENTITY",
    "SECONDARY_ENTITY_BUSINESS_NAME",
    "WORKSITE_CITY",
    "WORKSITE_COUNTY",
    "WORKSITE_STATE",
]
PERM_COLUMNS = [
    "CASE_NUMBER",
    "CASE_STATUS",
    "DECISION_DATE",
    "EMP_BUSINESS_NAME",
    "EMP_FEIN",
    "EMP_STATE",
    "EMP_NAICS",
    "EMP_NUM_PAYROLL",
    "EMP_YEAR_COMMENCED",
    "ATTY_AG_LAW_FIRM_NAME",
    "PWD_SOC_CODE",
    "PWD_SOC_TITLE",
    "JOB_TITLE",
    "JOB_OPP_WAGE_FROM",
    "JOB_OPP_WAGE_PER",
    "PRIMARY_WORKSITE_CITY",
    "PRIMARY_WORKSITE_COUNTY",
    "PRIMARY_WORKSITE_STATE",
]

# name -> (workbook on dol.gov, allow-list)
TABLES = {
    "lca_fy2025": ("LCA_Disclosure_Data_FY2025_Q4.xlsx", LCA_COLUMNS),
    "lca_fy2024": ("LCA_Disclosure_Data_FY2024_Q4.xlsx", LCA_COLUMNS),
    "worksites_fy2025": ("LCA_Worksites_FY2025_Q4.xlsx", WORKSITE_COLUMNS),
    "perm_fy2025": ("PERM_Disclosure_Data_FY2025_Q4.xlsx", PERM_COLUMNS),
}

# Reference tables for the metro and occupation sections.
REFS = {
    # Census CBSA delineation, July 2023: county -> metro area.
    "cbsa_2023.xlsx": "https://www2.census.gov/programs-surveys/metro-micro/"
    "geographies/reference-files/2023/delineation-files/list1_2023.xlsx",
    # BLS 2018 SOC structure: occupation code -> major and minor group.
    "soc_structure_2018.xlsx": "https://www.bls.gov/soc/2018/soc_structure_2018.xlsx",
}

PERSONAL = re.compile(
    r"POC|ATTORNEY|ATTY_AG_(?!LAW_FIRM_NAME)|PREPARER|EMAIL|PHONE|ADDRESS|ADDR|POSTAL|PROVINCE"
)


def check_columns(columns):
    """Refuse any column that names or locates a person."""
    bad = [c for c in columns if PERSONAL.search(c)]
    if bad:
        raise SystemExit(f"refusing personal columns: {bad}")


def download(url, dest, user_agent=None):
    """Fetch url to dest via a .part file; rename only when the size matches."""
    if dest.exists():
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + ".part")
    headers = {"User-Agent": user_agent} if user_agent else {}
    print(f"downloading {url}", flush=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120) as r:
        expected = r.headers.get("Content-Length")
        encoded = r.headers.get("Content-Encoding")
        with open(part, "wb") as fh:
            while chunk := r.read(1 << 20):
                fh.write(chunk)
    # A compressed response reports its size on the wire, not on disk.
    if expected and not encoded and part.stat().st_size != int(expected):
        raise SystemExit(f"{dest.name}: got {part.stat().st_size} bytes, expected {expected}")
    part.rename(dest)
    return dest


def trim(name, source):
    """Read only the allowed columns of one workbook and write build/week04/<name>.csv.gz."""
    _, columns = TABLES[name]
    check_columns(columns)
    header = pd.read_excel(source, engine="calamine", nrows=0).columns
    present = [c for c in columns if c in header]
    missing = sorted(set(columns) - set(present))
    if missing:
        print(f"{name}: not in this year's layout, skipped: {missing}")
    frame = pd.read_excel(source, engine="calamine", usecols=present, dtype=str)
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{name}.csv.gz"
    frame.to_csv(target, index=False)
    print(f"{name}: {len(frame):,} rows, {len(present)} columns -> {target.relative_to(ROOT)}")


def load(name):
    """The trimmed table as strings; convert the columns you use yourself."""
    path = OUT / f"{name}.csv.gz"
    if not path.exists():
        raise SystemExit(f"{path.relative_to(ROOT)} is missing: run python analysis/week04_data.py")
    return pd.read_csv(path, dtype=str, keep_default_na=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--local", type=Path, help="folder that already holds the DOL workbooks")
    parser.add_argument("--refs", action="store_true", help="also fetch the Census and BLS tables")
    parser.add_argument("--only", nargs="*", choices=sorted(TABLES), help="trim just these tables")
    args = parser.parse_args()

    for name in TABLES if args.only is None else args.only:
        workbook, _ = TABLES[name]
        source = args.local / workbook if args.local else download(DOL + workbook, RAW / workbook)
        if not source.exists():
            sys.exit(f"{source} not found")
        trim(name, source)

    if args.refs:
        download(REFS["cbsa_2023.xlsx"], RAW / "cbsa_2023.xlsx")
        # BLS answers 403 unless the User-Agent names a contact.
        contact = os.environ.get("CONTACT_EMAIL")
        if contact:
            download(REFS["soc_structure_2018.xlsx"], RAW / "soc_structure_2018.xlsx",
                     user_agent=f"Mozilla/5.0 (research; {contact})")
        else:
            print("skipped the BLS SOC file: set CONTACT_EMAIL=you@student.dtu.dk and rerun with --refs")


if __name__ == "__main__":
    main()
