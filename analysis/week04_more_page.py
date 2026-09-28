"""Week 4 deep dive, "More networks": the figures for the five text-only boxes.

Copies the numbers the boxes already quote out of five existing analysis files
(week04_perm.json, week04_countries.json, week04_oews.json, week04_ties.json,
week04_lottery.json) into one page file the new figures read. It computes
nothing; every value here is already checked and printed by the script that
produced it.

One source is read here directly: the Historical Data table on USCIS's "H-1B
Electronic Registration Process" page (fetched by week04_data.py --refs into
build/raw/week04/uscis_registration.html), for every draw since 2020. USCIS
lists each cap fiscal year; its registrations were drawn in March of the year
before, so cap year 2021 is labelled "March 2020". Selected registrations count
every selection round of that cap year, not only the March one.

Output: docs/weeks/week04/data/more.json (every number the five figures draw).
"""

import json
from html.parser import HTMLParser
from pathlib import Path

from week04_data import RAW
from week04_schemas import check

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs/weeks/week04/data/more.json"

PERM = ROOT / "analysis/week04_perm.json"
COUNTRIES = ROOT / "analysis/week04_countries.json"
OEWS = ROOT / "analysis/week04_oews.json"
TIES = ROOT / "analysis/week04_ties.json"
LOTTERY = ROOT / "analysis/week04_lottery.json"
REGISTRATION = RAW / "uscis_registration.html"
# The table's columns, by the start of their header text.
DRAW_COLUMNS = {"year": "Cap Fiscal Year", "eligible": "Eligible Registrations*",
                "multiple": "Eligible Registrations for Beneficiaries with Multiple",
                "selected": "Selected Registrations"}

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
    lab = data["labels"]
    return {
        "top": rows,
        "modularity": {
            "unweighted": mo["wiring_only"],
            "weighted": mo["weighted_vs_rewired"],
        },
        # How far the Louvain groups match world regions and Week 3's migration
        # communities. The p values come from shuffling the labels against NMI.
        "labels": {
            "ami_region": lab["ami_region"],
            "ami_week3": lab["ami_week3_migrant_communities"],
            "p_region_shuffled_nmi": lab["p_region"],
            "p_week3_shuffled_nmi": lab["p_week3"],
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


class Tables(HTMLParser):
    """Every <table> on a page as a list of rows of cell texts."""

    def __init__(self):
        super().__init__()
        self.tables, self.cell = [], None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.tables.append([])
        elif tag == "tr" and self.tables:
            self.tables[-1].append([])
        elif tag in ("td", "th") and self.tables:
            self.cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.tables[-1][-1].append(" ".join("".join(self.cell).split()))
            self.cell = None

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)


def uscis_draws():
    """Each draw's eligible registrations, those for workers registered more
    than once, and selected registrations, oldest first."""
    if not REGISTRATION.exists():
        raise SystemExit(f"{REGISTRATION} is missing: run python analysis/week04_data.py --refs --no-tables")
    parser = Tables()
    parser.feed(REGISTRATION.read_text(encoding="utf-8"))
    table = next((t for t in parser.tables if t and t[0] and t[0][0] == DRAW_COLUMNS["year"]), None)
    if table is None:
        raise SystemExit(f"{REGISTRATION.name}: no table headed {DRAW_COLUMNS['year']!r}")
    header = table[0]
    at = {key: next(i for i, h in enumerate(header) if h.startswith(start)) for key, start in DRAW_COLUMNS.items()}
    draws = []
    for row in table[1:]:
        cap = int(row[at["year"]])
        number = {key: int(row[at[key]].replace(",", "")) for key in ("eligible", "multiple", "selected")}
        draws.append({"label": f"March {cap - 1}", **number})
    return sorted(draws, key=lambda d: int(d["label"].split()[1]))


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
    # all_draws, not draws: the slopegraph reads draws as its two labels.
    return {"draws": ["March 2022", "March 2023"], "series": series, "all_draws": uscis_draws()}


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
