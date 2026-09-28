"""Week 4 deep dive, "More networks": the figures for the five text-only boxes.

Copies the numbers the boxes already quote out of five existing analysis files
(week04_perm.json, week04_countries.json, week04_oews.json, week04_ties.json,
week04_lottery.json) into one page file the new figures read. It computes
nothing; every value here is already checked and printed by the script that
produced it.

Output: docs/weeks/week04/data/more.json (every number the five figures draw).
"""

import json
from pathlib import Path

from week04_schemas import check

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs/weeks/week04/data/more.json"

PERM = ROOT / "analysis/week04_perm.json"
COUNTRIES = ROOT / "analysis/week04_countries.json"
OEWS = ROOT / "analysis/week04_oews.json"
TIES = ROOT / "analysis/week04_ties.json"
LOTTERY = ROOT / "analysis/week04_lottery.json"

# The employers named in the deeper-perm box's prose, in the order it names
# them; "highlight" marks the two the box calls out as splitting the pack.
PERM_EMPLOYERS = [
    ("Oracle America", "Oracle", "high"),
    ("Uber Technologies", "Uber", "high"),
    ("Salesforce", "Salesforce", "high"),
    ("Amazon", "Amazon", "low"),
    ("Cognizant", "Cognizant", "low"),
    ("Google", "Google", "low"),
]

# The three health-care clients the deeper-strength box names, plus the one it
# does not (Northwestern Mutual Life is not health care).
STRENGTH_HEALTH_CARE = {"Ultimate Therapy", "Sigma Rehab", "Post Rehab Services", "Grady Memorial Hospital"}


def load(path):
    return json.loads(path.read_text())


def perm_section():
    year = load(PERM)["years"]["2025"]
    hi = {e["employer"]: e for e in year["highest_ratio_among_big_filers"]}
    lo = {e["employer"]: e for e in year["lowest_ratio_among_big_filers"]}
    rows = []
    for key, label, kind in PERM_EMPLOYERS:
        e = (hi if kind == "high" else lo)[key]
        rows.append({"label": label, "lca_filings": e["lca_filings"], "ratio": e["ratio"]})
    return {"median_ratio": year["scored_median_ratio"], "rows": rows}


def countries_section():
    data = load(COUNTRIES)
    top = data["perm"]["2023"]["descriptive"]["top"][:8]
    rows = [{"country": c["country"].title(), "share": c["share"]} for c in top]
    mo = data["modularity"]
    return {
        "top": rows,
        "modularity": {
            "unweighted": mo["wiring_only"],
            "weighted": mo["weighted_vs_rewired"],
        },
    }


def density_section():
    mr = load(OEWS)["metro_rates"]
    top = mr["top_by_intensity"][:10]
    ny = next(m for m in mr["top_by_count"] if m["metro"] == "35620")
    rows = [{"metro": m["metro"], "name": m["name"], "rate": m["rate"]} for m in top]
    return {
        "national_rate": mr["national_rate_per_1000"],
        "rows": rows,
        "new_york": {"metro": ny["metro"], "name": ny["name"], "rate": ny["rate"]},
    }


def strength_section():
    hs = load(TIES)["strength_vs_degree"]["clients"]["high_strength_low_degree"][:5]
    rows = [{"label": c["label"], "strength": c["strength"], "health_care": c["label"] in STRENGTH_HEALTH_CARE} for c in hs]
    return {"rows": rows}


def lottery_section():
    lot = load(LOTTERY)["lotteries"]
    a23, a24 = lot["2023"], lot["2024"]

    def pair(get):
        return [get(a23), get(a24)]

    series = [
        {"label": "All employers", "values": pair(lambda a: a["funnel"]["registrations_per_approval"])},
        {"label": "Placing firms", "values": pair(lambda a: a["by_kind"]["placing"]["registrations_per_approval"])},
        {"label": "Direct employers", "values": pair(lambda a: a["by_kind"]["direct"]["registrations_per_approval"])},
    ]
    return {"draws": ["March 2022", "March 2023"], "series": series}


def main():
    page = {
        "generated_by": "analysis/week04_more_page.py",
        "perm": perm_section(),
        "countries": countries_section(),
        "density": density_section(),
        "strength": strength_section(),
        "lottery": lottery_section(),
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps(page, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
