"""Week 4, denominators for section 1: jobs behind the filings.

Section 1 (analysis/week04_where.py, owner Àngela) ranks metro areas by
certified H-1B filings. A big metro wins on raw counts because it has more
jobs of every kind, not because it leans on visa-sponsored hiring more than a
smaller one does. This script divides the same filing counts by the jobs BLS
counts in each metro, from the Occupational Employment and Wage Statistics
(OEWS) survey, so Àngela's page can show filings per 1,000 jobs beside the
raw ranking.

Source: BLS OEWS, metropolitan area file. May 2025 (oesm25ma.zip) is used
in preference to the May 2024 file the brief named, because May 2025 is
published and pairs with FY2025, the section's main year; May 2024
(oesm24ma.zip) was checked and is also live but is one year further from
FY2025. `python analysis/week04_data.py --refs` fetches it (needs
CONTACT_EMAIL: bls.gov 403s a request with no contact address).

Method
- The numerator is section 1's own pipeline: `week04_where.metros()` and
  `week04_where.worksite_metros()`, so a metro's filing count here is the
  same number the page ranks it by. main() asserts that FY2025's top 10 by
  filings match the page's cities list (docs/assets/data/week04_place.json).
- The denominator is OEWS's OCC_CODE "00-0000" (All Occupations) TOT_EMP for
  AREA_TYPE 4 (metropolitan), matched to a filing's metro by CBSA code: the
  OEWS AREA code and the Census CBSA code are the same number. OEWS's
  metropolitan-area file has no row for a micropolitan area (CBSA_TYPE 2 in
  the Census gazetteer), so those stay unmatched; they carry only 1.5% of
  FY2025 filings (check_match() reports the split).
- The occupation layer repeats the same per-1,000 rate at one SOC code
  instead of the whole metro, for the ten SOC codes with the most certified
  filings nationally (first 7 characters of SOC_CODE, "15-1252" style, since
  OEWS drops the ".00" LCA appends). A location quotient tells whether a
  metro files more or less densely in that occupation than the country does,
  relative to how many jobs of that occupation it has: Dallas's LQ of 2.71 at
  15-1252 (Software Developers) means its H-1B filings run 2.71 times as
  dense per software-developer job as the national rate for that occupation,
  not that Dallas has 2.71 times the software developers. OEWS suppresses a
  small area's employment as "**"; those rows are dropped, not zeroed, and an
  occupation missing from a metro's OEWS rows is the same. Both counted as
  missing data, reported per occupation.

Checks
- check_lq(): the location-quotient formula on a one-metro, one-occupation
  toy rate with a hand-computed answer.
- check_match(): every one of section 1's ranking metros (the 40 on the
  page) is in OEWS; reports the CBSA-type split among the unmatched ones.

Output: analysis/week04_oews.json. No page reads this; docs/ is untouched.
"""

import json
import time
import zipfile
from io import BytesIO
from pathlib import Path

import pandas as pd
from scipy.stats import spearmanr

import week04_where as where
from week04_data import RAW

OUT = Path(__file__).with_suffix(".json")
OEWS_ZIP = RAW / "oesm25ma.zip"
OEWS_MEMBER = "oesm25ma/MSA_M2025_dl.xlsx"
OEWS_RELEASE = "May 2025"
YEAR = 2025          # section 1's main year
OTHER_YEAR = 2024     # section 1's second year
TOP_N = 15            # metros shown by count and by intensity
JOBS_FLOOR = 100_000  # a metro needs this many jobs to rank by intensity
OCC_JOBS_FLOOR = 1_000  # and this many, in one occupation, to rank in it
TOP_SOC = 10          # occupations covered in the occupation layer
TOP_SOC_METROS = 5    # metros shown per occupation


def oews_msa():
    """OEWS's metropolitan-area file: one row per (CBSA code, SOC code)."""
    with zipfile.ZipFile(OEWS_ZIP) as z, z.open(OEWS_MEMBER) as f:
        table = pd.read_excel(BytesIO(f.read()), engine="calamine", dtype=str)
    table["TOT_EMP"] = pd.to_numeric(table["TOT_EMP"], errors="coerce")  # "**" -> NaN
    return table


def metro_filings(lookup, town_lookup, year):
    """Filings per metro, exactly section 1's numerator (one row per
    (CASE_NUMBER, metro)), plus the same case's occupation."""
    sites, lca, _ = where.worksite_metros(lookup, town_lookup, year)
    per_case = sites.drop_duplicates(["CASE_NUMBER", "metro"])
    filings = per_case.groupby("metro").size().rename("filings")
    lca = lca.assign(soc7=lca["SOC_CODE"].str[:7])
    by_occ = per_case.merge(lca[["CASE_NUMBER", "soc7"]], on="CASE_NUMBER")
    occ_filings = by_occ.groupby(["metro", "soc7"]).size().rename("filings")
    return filings, occ_filings, lca


def location_quotient(metro_rate, national_rate):
    return metro_rate / national_rate if national_rate else None


def check_lq():
    """Toy table: metro A has 4 filings at 2,000 occupation jobs (rate 2.0
    per 1,000); the country has 10 filings at 10,000 jobs (rate 1.0). A
    should show LQ 2.0: twice the national filing density for that job."""
    rate_a = 4 / (2_000 / 1_000)
    rate_us = 10 / (10_000 / 1_000)
    assert rate_a == 2.0 and rate_us == 1.0
    assert location_quotient(rate_a, rate_us) == 2.0
    assert location_quotient(rate_a, 0) is None


def check_match(filings, oews_areas, gaz, top_ids):
    """Which metros with a filing have no OEWS row, and why: OEWS's
    metropolitan file has no micropolitan areas."""
    cbsa_type = filings.index.map(lambda m: gaz["CBSA_TYPE"].get(m, "?"))
    metro_type = filings[cbsa_type == "1"]     # Metropolitan Statistical Area
    micro_type = filings[cbsa_type == "2"]     # Micropolitan Statistical Area
    unmatched_metro = metro_type[~metro_type.index.isin(oews_areas)]
    assert unmatched_metro.empty, f"metropolitan CBSAs missing from OEWS: {list(unmatched_metro.index)}"
    missing_top = [m for m in top_ids if m not in oews_areas]
    assert not missing_top, f"section 1's own metros missing from OEWS: {missing_top}"
    return {
        "metros_with_filings": int(len(filings)),
        "metropolitan_metros": int(len(metro_type)),
        "metropolitan_matched": int(len(metro_type)),
        "micropolitan_metros": int(len(micro_type)),
        "micropolitan_filings": int(micro_type.sum()),
        "micropolitan_filings_share": round(float(micro_type.sum() / filings.sum()), 4),
        "reason": "OEWS's metropolitan-area file carries only CBSAs the Census "
                  "gazetteer marks Metropolitan (CBSA_TYPE 1); a Micropolitan CBSA "
                  "(CBSA_TYPE 2) has no row there, whatever its filing count.",
        "top40_matched": len(top_ids) - len(missing_top),
        "top40_total": len(top_ids),
    }


def metro_table(filings, jobs):
    """One row per metro with a filing and an OEWS job count: filings, jobs,
    filings per 1,000 jobs."""
    t = pd.DataFrame({"filings": filings}).join(jobs.rename("jobs"), how="inner")
    t["rate"] = t["filings"] / (t["jobs"] / 1000)
    return t


def metro_name(gaz, m):
    """"Fayetteville, AR": a metro's short name with its first-named state,
    since several metros share a short name (Fayetteville is also NC)."""
    title = gaz["NAME"].get(m, m)
    if title == m:
        return m
    return f"{title.split(',')[0].split('-')[0]}, {where.first_state(title)}"


def fmt_p(p):
    """A p-value small enough to round to 0.0 at 4 decimals is reported as a
    bound instead, so the number is not mistaken for exactly zero."""
    return round(float(p), 4) if p >= 1e-4 else "<1e-4"


def top_lists(t, gaz):
    """Top N by count, top N by intensity among metros with JOBS_FLOOR+ jobs,
    their Spearman correlation (over the same JOBS_FLOOR+ metros the
    intensity ranking uses, plus the same figure over every matched metro),
    and how many of this year's own top 10 by count stay in the top 10 by
    intensity."""
    by_count = t.sort_values("filings", ascending=False)
    big = t[t["jobs"] >= JOBS_FLOOR]
    by_rate = big.sort_values("rate", ascending=False)
    rho_big, p_big = spearmanr(big["filings"], big["rate"])
    rho_all, p_all = spearmanr(t["filings"], t["rate"])

    def rows(frame):
        return [{"metro": m, "name": metro_name(gaz, m),
                 "filings": int(r["filings"]), "jobs": int(r["jobs"]), "rate": round(float(r["rate"]), 3)}
                for m, r in frame.head(TOP_N).iterrows()]

    top10_count = list(by_count.head(10).index)
    top10_rate = list(by_rate.head(10).index)
    overlap = [m for m in top10_count if m in top10_rate]
    return {
        "top_by_count": rows(by_count),
        "top_by_intensity": rows(by_rate),
        "intensity_jobs_floor": JOBS_FLOOR,
        "metros_at_or_above_floor": int(len(big)),
        "spearman_count_vs_intensity": {"rho": round(float(rho_big), 3), "p": fmt_p(p_big), "n": int(len(big))},
        "spearman_count_vs_intensity_all_matched": {"rho": round(float(rho_all), 3), "p": fmt_p(p_all), "n": int(len(t))},
        "national_rate_per_1000": round(float(t["filings"].sum() / (t["jobs"].sum() / 1000)), 3),
        "top10_by_count": [metro_name(gaz, m) for m in top10_count],
        "top10_by_count_still_top10_by_intensity": {
            "count": len(overlap), "metros": [metro_name(gaz, m) for m in overlap],
        },
    }


def occupation_layer(lca, occ_filings, oews, gaz):
    """For the busiest SOC codes, filings per 1,000 occupation jobs per
    metro and a location quotient against the national rate for that job."""
    occ_jobs = oews.set_index(["OCC_CODE", "AREA"])["TOT_EMP"]
    # BLS's own title for the 7-character code, not the LCA's (an LCA's title
    # is the filing's own detailed job title, so two filings under the same
    # 7-character SOC code can carry two different ones).
    soc_titles = dict(zip(oews["OCC_CODE"], oews["OCC_TITLE"]))
    # The 10 most-filed SOC codes nationally: one row per case (not per metro,
    # which would count a multi-worksite case once per metro it names).
    national_soc = lca["soc7"].value_counts().head(TOP_SOC)
    layer = {}
    for soc, national_filings in national_soc.items():
        fil = occ_filings.xs(soc, level="soc7")
        try:
            jobs_raw = occ_jobs.xs(soc, level="OCC_CODE")  # "**" is NaN, not dropped yet
        except KeyError:
            jobs_raw = pd.Series(dtype=float)
        full = pd.DataFrame({"filings": fil}).join(jobs_raw.rename("jobs"), how="left")
        # A metro with filings in this occupation but no usable OEWS jobs
        # figure: suppressed ("**") or the occupation not published there.
        missing = full[full["jobs"].isna()]
        t = full.dropna(subset=["jobs"])
        t["rate"] = t["filings"] / (t["jobs"] / 1000)
        national_rate = float(t["filings"].sum() / (t["jobs"].sum() / 1000)) if t["jobs"].sum() else None
        eligible = t[t["jobs"] >= OCC_JOBS_FLOOR].sort_values("rate", ascending=False)
        layer[soc] = {
            "title": soc_titles.get(soc, soc),
            "national_filings": int(national_filings),  # distinct cases, section 1's own count
            # The same case counted once per metro it names (section 1's own
            # convention), summed over metros with a usable OEWS jobs figure.
            "metro_row_filings_with_oews_data": int(t["filings"].sum()),
            "metros_with_oews_data": int(len(t)),
            "metros_suppressed_or_unpublished": int(len(missing)),
            "filings_in_suppressed_or_unpublished_metros": int(missing["filings"].sum()),
            "metros_at_or_above_floor": int(len(eligible)),
            "national_rate_per_1000": round(national_rate, 3) if national_rate else None,
            "top_metros": [{
                "metro": m, "name": metro_name(gaz, m),
                "filings": int(r["filings"]), "jobs": int(r["jobs"]), "rate": round(float(r["rate"]), 3),
                "lq": round(location_quotient(r["rate"], national_rate), 2) if national_rate else None,
            } for m, r in eligible.head(TOP_SOC_METROS).iterrows()],
        }
    return layer


def main():
    start = time.time()
    check_lq()
    lookup, town_lookup, gaz = where.metros()  # gaz: GEOID -> NAME, CBSA_TYPE, ...

    oews = oews_msa()
    oews_areas = set(oews.loc[oews["OCC_CODE"] == "00-0000", "AREA"])
    jobs_all = oews.loc[oews["OCC_CODE"] == "00-0000"].set_index("AREA")["TOT_EMP"]

    page = json.loads((Path(__file__).resolve().parents[1]
                        / "docs/assets/data/week04_place.json").read_text())
    top_ids = [c["id"] for c in page["cities"]]  # section 1's 40 ranked metros

    filings, occ_filings, lca = metro_filings(lookup, town_lookup, YEAR)
    # The numerator must be section 1's own numbers: same order, same counts.
    page_filings = {c["id"]: c["filings"] for c in page["cities"]}
    assert [int(filings[m]) for m in top_ids[:10]] == [page_filings[m] for m in top_ids[:10]], \
        "metro_filings() does not reproduce week04_where's ranking"

    coverage = check_match(filings, oews_areas, gaz, top_ids)
    t2025 = metro_table(filings, jobs_all)
    lists_2025 = top_lists(t2025, gaz)

    occupations = occupation_layer(lca, occ_filings, oews, gaz)

    filings_b, _, _ = metro_filings(lookup, town_lookup, OTHER_YEAR)
    t2024 = metro_table(filings_b, jobs_all)
    lists_2024 = top_lists(t2024, gaz)

    result = {
        "generated_by": "analysis/week04_oews.py",
        "source": {
            "release_used": OEWS_RELEASE, "file": OEWS_ZIP.name,
            "note": "May 2025 preferred over the brief's May 2024 file: it is published, and it "
                    "pairs with FY2025, the main year below. May 2024 (oesm24ma.zip) was checked "
                    "and is also live on bls.gov.",
        },
        "coverage": coverage,
        "metro_rates": {"year": YEAR, **lists_2025},
        "metro_rates_other_year": {
            "year": OTHER_YEAR,
            "note": f"Filings from FY{OTHER_YEAR}, divided by the same {OEWS_RELEASE} jobs used above "
                    f"(no separate {OTHER_YEAR}-dated OEWS file was fetched).",
            **lists_2024,
        },
        "occupations": occupations,
        "seconds": round(time.time() - start, 1),
    }
    OUT.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({k: result[k] for k in ("coverage", "source")}, indent=1, ensure_ascii=False))
    print("metro_rates", {k: v for k, v in lists_2025.items() if k not in ("top_by_count", "top_by_intensity")})
    print(f"done in {result['seconds']}s -> {OUT.relative_to(OUT.parents[1])}")


if __name__ == "__main__":
    main()
