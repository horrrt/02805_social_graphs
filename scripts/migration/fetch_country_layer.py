"""The country layer: who moves where, and what the destinations look like.

Three sources, none of which needs a key:

  UN DESA International Migrant Stock 2024, Table 1 — the bilateral matrix.
      People living in country B who were born in country A, every five years
      from 1990 and again in 2024. This is the weighted directed network.
  UNHCR Refugee Data Finder — the forced-displacement slice of the same
      origin/asylum pairs: refugees, asylum seekers, stateless people, IDPs.
  World Bank indicators — per-country context: population, net migration,
      remittances in and out, GDP per capita, refugee counts.

Countries are keyed by ISO 3166-1 alpha-3 throughout; UN M49 codes from the
DESA workbook are mapped over through a pinned ISO 3166-1/M49 code table (see
ISO3166_M49_URL). Rows whose code is a regional or income-group aggregate
(World, Europe, "Least developed countries", M49 >= 900) are dropped, and the
aggregates that DESA ships are not re-derived here. Any other unmapped code is
a bug, not a silent drop: desa_flows() raises unless the code is on
UNMAPPED_ALLOWLIST. See test_m49_mapping.py.

    python scripts/migration/fetch_country_layer.py [--year 2024] [--data DIR]
"""

from __future__ import annotations

import argparse
import collections
import csv
import json
import pathlib
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from wikiclients import _request

DESA_URL = (
    "https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd"
    "/files/undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx"
)
DESA_YEARS = [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024]

# UN M49 numeric code -> ISO 3166-1 alpha-3, pinned to a commit so the mapping
# does not move under us. Wikidata's P298/P2082 pairing used to do this job,
# but it only carries an iso3 for items that also hold a *current* m49 claim,
# and it drops five real DESA units: the Netherlands (M49 528 is on the
# Kingdom-of-the-Netherlands item, ISO3 NLD is on a separate "Netherlands
# (country)" item), Palestine (275), Taiwan (158), Bonaire/Sint Eustatius/Saba
# (535), and Channel Islands (830, see below). Between them these accounted
# for about 9.6M migrants uncounted in 2024, Netherlands alone ~2.96M. A
# direct numeric-code table has no such gap for real ISO3166 entities.
ISO3166_M49_URL = (
    "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes"
    "/145f1ad3caff212ed25f42b0ee2c8b92a75af895/all/all.csv"
)

# M49 830, Channel Islands, is DESA's own aggregate of Jersey and Guernsey,
# which are two separate ISO 3166-1 entities (JEY, GGY) with no combined code.
# The workbook does not split the row between them, so there is no correct
# single ISO3 to assign it; it is dropped on purpose, not silently, as an
# unmapped code below 900 that this allowlist says is fine to skip.
UNMAPPED_ALLOWLIST = {"830": "Channel Islands: no single ISO 3166-1 entity (Jersey and Guernsey are separate)"}
UNHCR_API = "https://api.unhcr.org/population/v1/population/"

WORLD_BANK_INDICATORS = {
    "SP.POP.TOTL": "population",
    "SM.POP.NETM": "net_migration",
    "SM.POP.TOTL": "migrant_stock",
    "SM.POP.TOTL.ZS": "migrant_stock_pct",
    "BX.TRF.PWKR.CD.DT": "remittances_received_usd",
    "BM.TRF.PWKR.CD.DT": "remittances_sent_usd",
    "BX.TRF.PWKR.DT.GD.ZS": "remittances_received_pct_gdp",
    "NY.GDP.PCAP.CD": "gdp_per_capita_usd",
    "NY.GDP.MKTP.KD.ZG": "gdp_growth_pct",
    "SP.URB.TOTL.IN.ZS": "urban_population_pct",
    "SL.UEM.TOTL.ZS": "unemployment_pct",
}  # the World Bank refugee series (SM.POP.REFG) is archived; UNHCR covers it


def m49_to_iso3(cache):
    path = download(ISO3166_M49_URL, cache / "iso3166_m49.csv")
    # This table's own "country-code" column is UN M49, zero-padded ("036");
    # the DESA workbook writes it unpadded ("36").
    iso_by_m49, name_by_iso = {}, {}
    with path.open(encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            m49, iso3 = row["country-code"].lstrip("0"), row["alpha-3"]
            if m49 and iso3:
                iso_by_m49[m49] = iso3
                name_by_iso.setdefault(iso3, row["name"])
    return iso_by_m49, name_by_iso


def download(url, path):
    if path.exists() and path.stat().st_size > 0:
        print(f"  cached {path}")
        return path
    print(f"  downloading {url}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(_request(url, timeout=600))
    return path


def desa_flows(path, iso_by_m49):
    # The project venv carries pandas + python-calamine, not openpyxl (see
    # analysis/week04_where.py and analysis/week04_data.py for the same
    # engine choice); data rows start at worksheet row 12, so skiprows=11.
    import pandas as pd

    sheet = pd.read_excel(path, sheet_name="Table 1", header=None, skiprows=11,
                          engine="calamine")
    rows = []
    aggregate = 0
    unmapped = collections.Counter()
    for row in sheet.itertuples(index=False, name=None):
        if pd.isna(row[0]):
            continue
        dest_code = str(int(row[4])).strip()
        origin_code = str(int(row[6])).strip()
        problem = False
        for code in (dest_code, origin_code):
            if code in iso_by_m49 or code in UNMAPPED_ALLOWLIST:
                continue
            if int(code) >= 900:
                continue  # regional/income aggregate, counted below
            unmapped[code] += 1
            problem = True
        if problem:
            continue
        dest, origin = iso_by_m49.get(dest_code), iso_by_m49.get(origin_code)
        if not dest or not origin or dest == origin:
            aggregate += 1
            continue
        stocks = []
        for offset in range(len(DESA_YEARS)):
            value = row[7 + offset]
            stocks.append(int(value) if isinstance(value, (int, float)) and not pd.isna(value)
                          else "")
        if not any(isinstance(s, int) and s > 0 for s in stocks):
            continue
        female = row[23 + len(DESA_YEARS) - 1]
        rows.append({
            "origin": origin,
            "destination": dest,
            "origin_name": str(row[5]).strip(),
            "destination_name": str(row[1]).strip(),
            "stocks": stocks,
            "female_2024": int(female) if isinstance(female, (int, float)) and not pd.isna(female)
                           else "",
        })
    if unmapped:
        listed = ", ".join(f"{code} ({count}x)" for code, count in sorted(unmapped.items()))
        raise SystemExit(
            f"DESA Table 1 has M49 codes below 900 that are neither in the ISO "
            f"3166-1 code table nor on UNMAPPED_ALLOWLIST: {listed}. Add each one "
            f"to UNMAPPED_ALLOWLIST with a reason, or fix the mapping table.")
    print(f"  bilateral pairs with a stock: {len(rows)} "
          f"(skipped {aggregate} aggregate/regional rows)")
    return rows


def unhcr_year(year):
    items = []
    page = 1
    while True:
        params = urllib.parse.urlencode({
            "year": year, "coo_all": "true", "coa_all": "true",
            "limit": 10000, "page": page,
        })
        payload = json.loads(_request(UNHCR_API + "?" + params, timeout=180))
        items.extend(payload.get("items", []))
        print(f"  UNHCR {year} page {page}/{payload.get('maxPages')}: {len(items)} rows",
              flush=True)
        if page >= int(payload.get("maxPages") or 1):
            return items
        page += 1


def world_bank(indicator, year):
    out = {}
    page = 1
    while True:
        url = (f"https://api.worldbank.org/v2/country/all/indicator/{indicator}"
               f"?date={year}&format=json&per_page=400&page={page}")
        payload = json.loads(_request(url, timeout=120))
        if not isinstance(payload, list) or len(payload) < 2:
            return out
        meta, rows = payload[0], payload[1]
        for row in rows or []:
            iso3 = row.get("countryiso3code")
            if iso3 and row.get("value") is not None:
                out[iso3] = row["value"]
        if page >= meta.get("pages", 1):
            return out
        page += 1


def number(value):
    if value in ("", None, "-"):
        return ""
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return ""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--data", default="data")
    parser.add_argument("--cache", default="build/raw")
    parser.add_argument("--only", choices=("all", "worldbank"), default="all",
                        help="worldbank re-fetches only the indicator table, "
                             "which is the cheap half of this script")
    args = parser.parse_args()
    data = pathlib.Path(args.data)
    data.mkdir(parents=True, exist_ok=True)
    cache = pathlib.Path(args.cache)

    print("mapping UN M49 codes to ISO 3166-1 alpha-3")
    iso_by_m49, name_by_iso = m49_to_iso3(cache)
    print(f"  {len(iso_by_m49)} countries")

    if args.only == "all":
        print("UN DESA international migrant stock")
        path = download(DESA_URL, cache / "undesa_stock_2024.xlsx")
        flows = desa_flows(path, iso_by_m49)
        with (data / "migration_flows.tsv").open("w", encoding="utf-8") as fh:
            fh.write("# UN DESA International Migrant Stock 2024, Table 1 "
                     "(POP/DB/MIG/Stock/Rev.2024).\n")
            fh.write("# One row per origin -> destination pair: people living in the "
                     "destination who were born in the origin.\n")
            fh.write("# Aggregates (World, regions, income groups) are dropped; "
                     "same-country rows are dropped.\n")
            fh.write("origin\tdestination\torigin_name\tdestination_name\t"
                     + "\t".join(f"stock_{y}" for y in DESA_YEARS)
                     + "\tfemale_2024\n")
            for row in sorted(flows, key=lambda r: (r["origin"], r["destination"])):
                fh.write("\t".join(str(x) for x in [
                    row["origin"], row["destination"],
                    row["origin_name"], row["destination_name"],
                    *row["stocks"], row["female_2024"],
                ]) + "\n")

        print(f"UNHCR displacement, {args.year}")
        items = unhcr_year(args.year)
        with (data / "migration_displacement.tsv").open("w", encoding="utf-8") as fh:
            fh.write(f"# UNHCR Refugee Data Finder, {args.year} "
                     f"(api.unhcr.org/population/v1/population).\n")
            fh.write("# origin = country of origin, asylum = country of asylum. "
                     "IDPs and returns sit on the origin==asylum rows.\n")
            fh.write("origin\tasylum\torigin_name\tasylum_name\trefugees\tasylum_seekers"
                     "\treturned_refugees\tidps\treturned_idps\tstateless\tother_of_concern"
                     "\thost_community\n")
            for item in sorted(items, key=lambda i: (i["coo_iso"] or "", i["coa_iso"] or "")):
                values = [number(item.get(k)) for k in
                          ("refugees", "asylum_seekers", "returned_refugees", "idps",
                           "returned_idps", "stateless", "ooc", "hst")]
                if not any(isinstance(v, int) and v > 0 for v in values):
                    continue
                fh.write("\t".join(str(x) for x in [
                    item.get("coo_iso") or "", item.get("coa_iso") or "",
                    item.get("coo_name") or "", item.get("coa_name") or "", *values,
                ]) + "\n")

    print("World Bank indicators")
    indicators = {}
    for code, name in WORLD_BANK_INDICATORS.items():
        # Latest year with broad coverage lags; step back until something lands.
        for year in range(args.year, args.year - 6, -1):
            values = world_bank(code, year)
            if len(values) > 50:
                indicators[name] = (year, values)
                print(f"  {name}: {len(values)} countries ({year})")
                break
        else:
            indicators[name] = (None, {})
            print(f"  {name}: no data")

    iso_codes = sorted(set(name_by_iso)
                       | {v for _, values in indicators.values() for v in values})
    with (data / "migration_country_indicators.tsv").open("w", encoding="utf-8") as fh:
        fh.write("# World Bank open data, one row per country. The year each "
                 "indicator came from is in the column name.\n")
        columns = [f"{name}_{year}" if year else name
                   for name, (year, _) in indicators.items()]
        fh.write("iso3\tname\t" + "\t".join(columns) + "\n")
        for iso3 in iso_codes:
            if iso3 not in name_by_iso:
                continue  # World Bank aggregates such as EUU, WLD
            cells = [indicators[name][1].get(iso3, "")
                     for name in WORLD_BANK_INDICATORS.values()]
            fh.write("\t".join(str(x) for x in [iso3, name_by_iso[iso3], *cells]) + "\n")

    print("done")


if __name__ == "__main__":
    main()
