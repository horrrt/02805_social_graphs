"""Week 4 data: five years of US H-1B and green-card filings, trimmed to the columns we use.

Downloads the Department of Labor disclosure files for FY2022 to FY2026 (the
last up to June 2026), keeps only the columns on the allow-lists below, and
writes one gzipped CSV per table and year to build/week04/ (gitignored). Every
week 4 script reads those CSVs through load(); nobody opens the workbooks.

A US fiscal year runs from 1 October to 30 September: FY2025 is October 2024
to September 2025.

    lca_fy2022 ... lca_fy2026         H-1B applications (LCA). DOL publishes one
                                      file per quarter; a year is its four files.
                                      FY2026 is one file covering Q1 to Q3.
    worksites_fy2022 ... _fy2026      one row per worksite of an application
    perm_fy2022 ... perm_fy2026       green-card labour certifications. FY2022 to
                                      FY2024 use the old form; their columns are
                                      renamed to the new form's names.

The raw files carry names, emails and phone numbers of employer contacts,
lawyers and preparers, the worker's country of citizenship, and worksite
street addresses that are sometimes a worker's home. None of those columns is
on an allow-list, and check_columns() refuses to read one if it ever is. Never
commit anything under build/.

    python analysis/week04_data.py                    # download and trim everything
    python analysis/week04_data.py --years 2025       # one fiscal year
    python analysis/week04_data.py --local DIR [DIR]  # use workbooks already in these folders
    python analysis/week04_data.py --refs             # also the Census, USCIS and BLS reference files
    python analysis/week04_data.py --hub --no-tables  # USCIS approvals per employer, FY2022 to FY2026
    python analysis/week04_data.py --lottery --no-tables  # H-1B lottery registrations, FY2022 to FY2024

Two more tables come from outside DOL:

    uscis_hub_fy2022 ... _fy2026      USCIS approvals and denials per employer, by
                                      the fiscal year of the decision, exported from
                                      the Tableau view behind the Employer Data Hub.
                                      FY2026 stops at June 2026.
    lottery_fy2022 ... _fy2024        every H-1B lottery registration and the petition
                                      that followed a win: USCIS data obtained by
                                      Bloomberg News under FOIA. Workers' country,
                                      birth year, gender and education, and agents'
                                      names and addresses, are not on its allow-list.

Sources (public domain, US government):
https://www.dol.gov/agencies/eta/foreign-labor/performance
https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub
https://github.com/BloombergGraphics/2024-h1b-immigration-data (Apache 2.0)
"""

import argparse
import io
import os
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

import pandas as pd
import polars as pl

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "build" / "raw" / "week04"
OUT = ROOT / "build" / "week04"

DOL = "https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/"
YEARS = [2022, 2023, 2024, 2025, 2026]

LCA_COLUMNS = [
    "CASE_NUMBER",
    "CASE_STATUS",
    "VISA_CLASS",
    "RECEIVED_DATE",
    "DECISION_DATE",
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
    "RECEIVED_DATE",
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
# The old PERM form (FY2022 to FY2024) names the same fields differently.
PERM_OLD_NAMES = {
    "EMPLOYER_NAME": "EMP_BUSINESS_NAME",
    "EMPLOYER_FEIN": "EMP_FEIN",
    "EMPLOYER_STATE_PROVINCE": "EMP_STATE",
    "NAICS_CODE": "EMP_NAICS",
    "EMPLOYER_NUM_EMPLOYEES": "EMP_NUM_PAYROLL",
    "EMP_YEAR_COMMENCED_BUSINESS": "EMP_YEAR_COMMENCED",
    "AGENT_ATTORNEY_FIRM_NAME": "ATTY_AG_LAW_FIRM_NAME",
    "PW_SOC_CODE": "PWD_SOC_CODE",
    "PW_SOC_TITLE": "PWD_SOC_TITLE",
    "WAGE_OFFER_FROM": "JOB_OPP_WAGE_FROM",
    "WAGE_OFFER_UNIT_OF_PAY": "JOB_OPP_WAGE_PER",
    "WORKSITE_CITY": "PRIMARY_WORKSITE_CITY",
    "WORKSITE_STATE": "PRIMARY_WORKSITE_STATE",
}
KINDS = {
    "lca": (LCA_COLUMNS, {}),
    "worksites": (WORKSITE_COLUMNS, {}),
    "perm": (PERM_COLUMNS, PERM_OLD_NAMES),
}


def _files(kind, year):
    """(saved file name, url) for every workbook that makes up one table."""
    if year == 2026:
        # FY2026 so far: one file per kind covering Q1 to Q3, at other paths.
        return {
            "lca": [("LCA_Disclosure_Data_FY2026_Q3.xlsx",
                     "https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q3.xlsx")],
            "worksites": [("LCA_Worksites_FY2026_Q3.xlsx",
                           DOL + "FY26Q3/LCA_Worksites_FY_2026_Q3.xlsx")],
            "perm": [("PERM_Disclosure_Data_FY2026_Q3.xlsx",
                      "https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx")],
        }[kind]
    if kind == "lca":
        names = [f"LCA_Disclosure_Data_FY{year}_Q{q}.xlsx" for q in (1, 2, 3, 4)]
    elif kind == "worksites":
        names = [f"LCA_Worksites_FY{year}_Q4.xlsx"]
    else:
        names = [f"PERM_Disclosure_Data_FY{year}_Q4.xlsx"]
        if year == 2024:
            # FY2024 switched forms mid-year and was published as two files.
            names.append("PERM_Disclosure_Data_New_Form_FY2024_Q4.xlsx")
    return [(n, DOL + n) for n in names]


TABLES = {f"{kind}_fy{year}": (kind, year) for kind in KINDS for year in YEARS}

# Reference tables for the metro and occupation sections.
REFS = {
    # Census CBSA delineation, July 2023: county -> metro area.
    "cbsa_2023.xlsx": "https://www2.census.gov/programs-surveys/metro-micro/"
    "geographies/reference-files/2023/delineation-files/list1_2023.xlsx",
    # Census 2023 gazetteer: one row per metro area with its centre point.
    "cbsa_gazetteer_2023.zip": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/"
    "2023_Gazetteer/2023_Gaz_cbsa_national.zip",
    # Census 2023 gazetteer, county subdivisions: New England towns -> county
    # (Connecticut's 2023 planning regions), for worksites filed under a town.
    "cousub_gazetteer_2023.zip": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/"
    "2023_Gazetteer/2023_Gaz_cousubs_national.zip",
    # Census 2023 gazetteer, places: where each metro's first-named city lies.
    "place_gazetteer_2023.zip": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/"
    "2023_Gazetteer/2023_Gaz_place_national.zip",
    # USCIS H-1B Employer Data Hub: petitions approved and denied per employer,
    # by the fiscal year of the decision. Published to FY2023 as files.
    "uscis_fy2022.csv": "https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2022.csv",
    "uscis_fy2023.csv": "https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2023.csv",
    # BLS 2018 SOC structure: occupation code -> major and minor group.
    "soc_structure_2018.xlsx": "https://www.bls.gov/soc/2018/soc_structure_2018.xlsx",
}

# The hub's static CSV exports stop at FY2023; the Tableau view behind the hub
# page covers FY2009 to FY2026 Q3 and exports any year as CSV.
HUB_VIEW = "https://bigdataanalyticspub-sb.uscis.dhs.gov/views/H1BEmployerDataHub-Final/H1BPublic.csv"
HUB_YEARS = [2022, 2023, 2024, 2025, 2026]
# The view reports six petition types, each approved or denied. The old CSVs
# had four columns; Initial is new employment plus new concurrent employment,
# Continuing is the other four (checked against the old FY2022 file).
HUB_INITIAL = ["NEW_EMPLOYMENT", "NEW_CONCURRENT"]
HUB_CONTINUING = ["CONTINUATION", "CHANGE_WITH_SAME_EMPLOYER", "CHANGE_OF_EMPLOYER", "AMENDED"]

# H-1B lottery registrations, by the fiscal year the visa starts (the FY2024
# lottery ran in March 2023). Bloomberg split FY2023 into three zip parts and
# FY2024 into single and multiple registrations.
LOTTERY = "https://github.com/BloombergGraphics/2024-h1b-immigration-data/raw/main/"
LOTTERY_FILES = {
    2022: ["TRK_13139_FY2022.zip"],
    2023: ["TRK_13139_FY2023.zip.001", "TRK_13139_FY2023.zip.002", "TRK_13139_FY2023.zip.003"],
    2024: ["TRK_13139_FY2024_single_reg.zip", "TRK_13139_FY2024_multi_reg.zip"],
}
# Registrations per year in the release's own data dictionary.
LOTTERY_ROWS = {2022: 301_447, 2023: 474_421, 2024: 758_994}
LOTTERY_COLUMNS = [
    "lottery_year",
    "status_type",          # SELECTED, or ELIGIBLE/CREATED when the draw passed it over
    "ben_multi_reg_ind",    # 1: the worker was registered by more than one employer
    "FEIN",
    "employer_name",
    "RECEIPT_NUMBER",       # the petition filed after a win
    "FIRST_DECISION",
    "BASIS_FOR_CLASSIFICATION",
    "DOL_ETA_CASE_NUMBER",  # the LCA behind the petition
    "S1Q1A",                # H-1B dependent employer
    "S4Q1",                 # the worker will be assigned to an off-site location
]

PERSONAL = re.compile(
    r"POC|CONTACT|ATTORNEY|ATTY|PREPARER|EMAIL|PHONE|ADDRESS|ADDR|POSTAL|PROVINCE"
    r"|CITIZENSHIP|BIRTH|CLASS_OF_ADMISSION"
)
# Business names that contain a flagged word but name a firm, not a person.
FIRM_COLUMNS = {"ATTY_AG_LAW_FIRM_NAME", "AGENT_ATTORNEY_FIRM_NAME", "EMPLOYER_STATE_PROVINCE"}


def check_columns(columns):
    """Refuse any column that names, locates or describes a person."""
    bad = [c for c in columns if PERSONAL.search(c) and c not in FIRM_COLUMNS]
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


def find(name, url, local, user_agent=None):
    """A workbook from the first local folder that has it, else downloaded to build/raw/week04/."""
    for folder in local:
        if (folder / name).exists():
            return folder / name
    return download(url, RAW / name, user_agent)


def read(source, kind):
    """The allowed columns of one workbook, renamed to the table's names."""
    columns, old_names = KINDS[kind]
    header = pd.read_excel(source, engine="calamine", nrows=0).columns
    wanted = {c: c for c in header if c in columns}
    wanted |= {c: old_names[c] for c in header if c in old_names and old_names[c] not in wanted.values()}
    check_columns(wanted)
    frame = pd.read_excel(source, engine="calamine", usecols=list(wanted), dtype=str)
    return frame.rename(columns=wanted)


def build(name, local):
    kind, year = TABLES[name]
    columns, _ = KINDS[kind]
    parts = []
    for file_name, url in _files(kind, year):
        frame = read(find(file_name, url, local), kind)
        frame["SOURCE_FILE"] = file_name.removesuffix(".xlsx")
        parts.append(frame)
    table = pd.concat(parts, ignore_index=True)
    missing = [c for c in columns if c not in table]
    if missing:
        print(f"{name}: not in this year's layout: {missing}")
    table = table[[c for c in columns if c in table] + ["SOURCE_FILE"]]
    if kind != "worksites":
        # A case decided again in a later quarter keeps its latest row.
        before = len(table)
        table = table.drop_duplicates("CASE_NUMBER", keep="last")
        if len(table) < before:
            print(f"{name}: dropped {before - len(table):,} repeated cases")
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{name}.csv.gz"
    table.to_csv(target, index=False)
    print(f"{name}: {len(table):,} rows from {len(parts)} file(s) -> {target.relative_to(ROOT)}", flush=True)


def uscis(year, local=()):
    """The USCIS Employer Data Hub for one fiscal year, as build/week04/uscis_fy<year>.csv.gz.
    Its "Tax ID" holds only the last four digits of the employer's tax number."""
    name = f"uscis_fy{year}.csv"
    source = find(f"h1b_datahubexport-{year}.csv", REFS[name], [*local, *(Path(d) / "uscis-hub" for d in local)])
    frame = pd.read_csv(source, dtype=str, keep_default_na=False)
    frame.columns = [c.strip().upper().replace(" ", "_") for c in frame.columns]
    OUT.mkdir(parents=True, exist_ok=True)
    frame.to_csv(OUT / f"{name}.gz", index=False)
    print(f"uscis_fy{year}: {len(frame):,} employers -> build/week04/{name}.gz")


def uscis_hub(year, local=()):
    """The Employer Data Hub for one fiscal year from its Tableau view, as
    build/week04/uscis_hub_fy<year>.csv.gz: one row per employer line, one column
    per petition type and outcome, plus the old files' four totals. Its "Tax ID"
    holds only the last four digits of the employer's tax number."""
    # The filter is the column's header, three trailing spaces included. Without
    # them the view ignores the filter and quietly returns the latest year.
    url = HUB_VIEW + "?" + urllib.parse.urlencode({"Fiscal Year   ": year})
    # The view's server answers 403 to Python's default User-Agent, and to no other.
    source = find(f"uscis_hub_fy{year}.csv", url, local, user_agent="02805 week04_data.py")
    frame = pd.read_csv(source, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    frame.columns = [c.strip() for c in frame.columns]
    if set(frame["Fiscal Year"]) != {str(year)}:
        raise SystemExit(f"{source.name}: asked for FY{year}, got {sorted(set(frame['Fiscal Year']))}")
    frame["value"] = pd.to_numeric(frame["Measure Values"].str.replace(",", ""), errors="coerce").fillna(0)
    frame["measure"] = frame["Measure Names"].str.upper().str.replace(" ", "_")
    ids = {"Line by line": "LINE", "Employer (Petitioner) Name": "EMPLOYER", "Tax ID": "TAX_ID",
           "Industry (NAICS) Code": "NAICS", "Petitioner State": "STATE", "Petitioner City": "CITY"}
    wide = frame.pivot_table(index=list(ids), columns="measure", values="value", aggfunc="sum",
                             fill_value=0).reset_index().rename(columns=ids)
    wide.columns.name = None
    for outcome in ("APPROVAL", "DENIAL"):
        wide[f"INITIAL_{outcome}"] = wide[[f"{t}_{outcome}" for t in HUB_INITIAL]].sum(axis=1)
        wide[f"CONTINUING_{outcome}"] = wide[[f"{t}_{outcome}" for t in HUB_CONTINUING]].sum(axis=1)
    wide.insert(0, "FISCAL_YEAR", year)
    OUT.mkdir(parents=True, exist_ok=True)
    wide.drop(columns="LINE").to_csv(OUT / f"uscis_hub_fy{year}.csv.gz", index=False)
    print(f"uscis_hub_fy{year}: {len(wide):,} employer lines, "
          f"{int(wide['INITIAL_APPROVAL'].sum()):,} initial approvals -> build/week04/uscis_hub_fy{year}.csv.gz")


def lottery(year, local=()):
    """H-1B lottery registrations for one fiscal year, as build/week04/lottery_fy<year>.csv.gz,
    with only the LOTTERY_COLUMNS: who registered, whether the draw picked the
    registration, and the petition and LCA that followed."""
    check_columns(LOTTERY_COLUMNS)
    parts = [find(n, LOTTERY + n, local) for n in LOTTERY_FILES[year]]
    frames = []
    if parts[0].name.endswith(".001"):
        # One archive cut into pieces: join the bytes, then unzip.
        archives = [zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts)))]
    else:
        archives = [zipfile.ZipFile(p) for p in parts]
    for archive in archives:
        (member,) = [m for m in archive.namelist() if m.lower().endswith(".csv")]
        with archive.open(member) as fh:
            frame = pd.read_csv(fh, dtype=str, keep_default_na=False, usecols=lambda c: c in LOTTERY_COLUMNS)
        missing = [c for c in LOTTERY_COLUMNS if c not in frame]
        if missing:
            raise SystemExit(f"{member}: missing {missing}")
        frame["SOURCE_FILE"] = member.removesuffix(".csv")
        frames.append(frame)
    table = pd.concat(frames, ignore_index=True)
    if len(table) != LOTTERY_ROWS[year]:
        raise SystemExit(f"lottery_fy{year}: {len(table):,} rows, the dictionary says {LOTTERY_ROWS[year]:,}")
    # Keep a tax number's leading zero if a spreadsheet ever dropped it.
    digits = table["FEIN"].str.fullmatch(r"\d{8}")
    table.loc[digits, "FEIN"] = table.loc[digits, "FEIN"].str.zfill(9)
    OUT.mkdir(parents=True, exist_ok=True)
    table.to_csv(OUT / f"lottery_fy{year}.csv.gz", index=False)
    print(f"lottery_fy{year}: {len(table):,} registrations -> build/week04/lottery_fy{year}.csv.gz")


def load(name):
    """The trimmed table as strings; convert the columns you use yourself."""
    path = OUT / f"{name}.csv.gz"
    if not path.exists():
        raise SystemExit(f"{path.relative_to(ROOT)} is missing: run python analysis/week04_data.py")
    # polars reads the gzip about three times faster than pandas; the result is
    # the same pandas table of strings, with empty cells as "".
    return pl.read_csv(path, infer_schema=False, missing_utf8_is_empty_string=True).to_pandas()


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--local", type=Path, nargs="+", default=[],
                        help="folders that already hold DOL workbooks")
    parser.add_argument("--years", type=int, nargs="+", choices=YEARS, default=YEARS)
    parser.add_argument("--kinds", nargs="+", choices=sorted(KINDS), default=sorted(KINDS))
    parser.add_argument("--refs", action="store_true", help="also fetch the Census and BLS tables")
    parser.add_argument("--hub", action="store_true", help="also fetch the USCIS hub for FY2022 to FY2026")
    parser.add_argument("--lottery", action="store_true", help="also fetch the H-1B lottery registrations")
    parser.add_argument("--no-tables", action="store_true", help="skip the DOL tables (with --refs, --hub or --lottery)")
    args = parser.parse_args()

    if not args.no_tables:
        for kind in args.kinds:
            for year in args.years:
                build(f"{kind}_fy{year}", args.local)

    if args.refs:
        download(REFS["cbsa_2023.xlsx"], RAW / "cbsa_2023.xlsx")
        download(REFS["cbsa_gazetteer_2023.zip"], RAW / "cbsa_gazetteer_2023.zip")
        download(REFS["cousub_gazetteer_2023.zip"], RAW / "cousub_gazetteer_2023.zip")
        download(REFS["place_gazetteer_2023.zip"], RAW / "place_gazetteer_2023.zip")
        for year in (2022, 2023):
            uscis(year, args.local)
        # BLS answers 403 unless the User-Agent names a contact.
        contact = os.environ.get("CONTACT_EMAIL")
        if contact:
            download(REFS["soc_structure_2018.xlsx"], RAW / "soc_structure_2018.xlsx",
                     user_agent=f"Mozilla/5.0 (research; {contact})")
        else:
            print("skipped the BLS SOC file: set CONTACT_EMAIL=you@student.dtu.dk and rerun with --refs")

    if args.hub:
        for year in HUB_YEARS:
            uscis_hub(year, args.local)
    if args.lottery:
        for year in LOTTERY_FILES:
            lottery(year, args.local)


if __name__ == "__main__":
    sys.exit(main())
