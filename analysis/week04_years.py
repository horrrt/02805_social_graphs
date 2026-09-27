"""Week 4 redesign, the "Five years of filings, FY2022 to FY2026" deep-dive box.

This script computes nothing new. It copies the exact fields the box's chart
grid reads out of three scripts already run for other sections, so the page
never carries a hand-typed number:

- analysis/week04_staffing.json: "years" (certified filings, placed share,
  client and firm counts, and each year's top firms by filings, per fiscal
  year FY2022-FY2026) and "uscis_series" (USCIS hub denial rates for placing
  firms against direct employers, FY2022-FY2026).
- analysis/week04_shift.json: "oct_jun" (the October-to-June totals for
  FY2024-FY2026, the fair way to set FY2026's nine months beside a full year)
  and "monthly" (certified and placed filings per month, October to June,
  for the same three fiscal years).
- analysis/week04_countries.json: "lottery" (registrations per draw for the
  FY2022-FY2024 caps).
- analysis/week04_lottery.json: "lotteries" (registrations per approval for
  the March 2022 and March 2023 draws, the two years USCIS's data covers).

The only arithmetic here is the two changes the box's lead sentence and its
notice state: FY2022 to FY2023's certified-filings change (rounds to the "14%"
the lead names) and FY2025 to FY2026's change in the same October-to-June
window (already computed by week04_shift.py; copied through, not recomputed).

Checks: the schema (Years in week04_schemas.py) enforces that the placed
share falls every year from FY2023, that HCL is missing from FY2026's top
firms, that each monthly series covers nine months in order, and that
uscis_series runs FY2022 to FY2026 in order; those are exactly the facts the
box's lead, notice and captions state. check() runs before the file is
written, so a rerun that breaks one of them stops here instead of on the page.

Output: docs/weeks/week04/data/years.json.
"""

import json
from pathlib import Path

from week04_schemas import check

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs/weeks/week04/data/years.json"

YEARS = ["2022", "2023", "2024", "2025", "2026"]


def load(rel):
    return json.loads((ROOT / rel).read_text())


def main():
    staffing = load("analysis/week04_staffing.json")
    shift = load("analysis/week04_shift.json")
    countries = load("analysis/week04_countries.json")
    lottery = load("analysis/week04_lottery.json")

    ys = staffing["years"]
    years = {
        y: {
            "certified_filings": ys[y]["certified_filings"],
            "placed_share": ys[y]["placed_share"],
            "clients": ys[y]["clients"],
            "firms": ys[y]["firms"],
            "top_firms_by_filings": ys[y]["top_firms_by_filings"],
        }
        for y in YEARS
    }

    oj = shift["oct_jun"]["totals"]
    oct_jun = {
        "totals": {fy: {"certified_filings": oj[fy]["certified_filings"]} for fy in ("FY2024", "FY2025", "FY2026")},
        "certified_filings_change_fy25_fy26_percent":
            shift["oct_jun"]["totals_change"]["fy25_to_fy26"]["certified_filings"]["percent"],
    }

    monthly = {
        fy: [
            {"month": m["month"], "certified_filings": m["certified_filings"], "placed_filings": m["placed_filings"]}
            for m in shift["monthly"][fy]
        ]
        for fy in ("FY2024", "FY2025", "FY2026")
    }

    uscis_series = [
        {
            "year": row["year"],
            "placing_initial_denial_rate": row["placing"]["initial_denial_rate"],
            "direct_initial_denial_rate": row["direct"]["initial_denial_rate"],
        }
        for row in staffing["uscis_series"]
    ]

    lr = countries["lottery"]
    lottery_draws = {y: {"registrations": lr[y]["registrations"]} for y in ("2022", "2023", "2024")}
    lots = lottery["lotteries"]
    lottery_funnels = {
        y: {"registrations_per_approval": lots[y]["funnel"]["registrations_per_approval"]}
        for y in ("2023", "2024")
    }

    fy22_to_fy23_percent = round(100 * (ys["2023"]["certified_filings"] / ys["2022"]["certified_filings"] - 1))
    assert fy22_to_fy23_percent == -14, f"the lead says FY2023 fell 14%, computed {fy22_to_fy23_percent}%"

    finding = {
        "fy2025_certified_filings": ys["2025"]["certified_filings"],
        "fy22_to_fy23_certified_change_percent": fy22_to_fy23_percent,
        "fy25_to_fy26_certified_change_percent": oct_jun["certified_filings_change_fy25_fy26_percent"],
        "oct_2025_certified_filings": shift["monthly"]["FY2026"][0]["certified_filings"],
        "oct_2024_certified_filings": shift["monthly"]["FY2025"][0]["certified_filings"],
    }
    assert shift["monthly"]["FY2026"][0]["month"] == "2025-10"
    assert shift["monthly"]["FY2025"][0]["month"] == "2024-10"
    assert finding["fy25_to_fy26_certified_change_percent"] < 0
    assert oct_jun["totals"]["FY2026"]["certified_filings"] < oct_jun["totals"]["FY2025"]["certified_filings"]

    page = {
        "generated_by": "analysis/week04_years.py",
        "years": years,
        "oct_jun": oct_jun,
        "monthly": monthly,
        "uscis_series": uscis_series,
        "lottery_draws": lottery_draws,
        "lottery_funnels": lottery_funnels,
        "finding": finding,
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {PAGE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
