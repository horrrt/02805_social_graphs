"""Week 4 redesign, the "Who filed for which roles" deep-dive box.

Three ways to split the same five fiscal years of certified H-1B filings that
week04_years.py already totals (FY2022 to FY2026, FY2026 covering October
2025 to June 2026 only):

- occupations: the detailed (6-digit SOC) occupations that rank in a fiscal
  year's top 10 by certified filings, in any of the five years, each its own
  series; every other filing, and every filing whose SOC code does not parse,
  falls into "All other occupations".
- groups: the same, one level up, by SOC major group (the code's first two
  digits), top 7 per year, the rest into "Other groups".
- employer: the same, by the filing's employer (week04_names.Resolver's
  company key, the same one section 3 uses), top 10 per year, the rest into
  "All other employers".

A fourth split needs no ranking: placement, certified filings placed at a
client against filed by a direct employer (SECONDARY_ENTITY starts with "Y"),
the same flag week04_staffing.py counts for placed_share.

Occupations are 2018 SOC. Filings still on 2010 codes (FY2022 until July
2022) are moved to their 2018 successors before ranking, in two steps. First
the full 8-digit O*NET-SOC code goes through every row of O*NET's 2010-to-2019
crosswalk that has exactly one 2019 target, keeping that target's 6-digit SOC
code, so 15-1199.08 lands on 15-2051 (Data Scientists) and 15-1199.01 on
15-1253 (QA testers) rather than on 15-1299. No 2010 code the crosswalk moves
is also a 2019 code, so every year's rows go through it. Codes without a
single-target row fall back to week04_jobs.LEGACY, 13 old 7-character codes
mapped onto 12 new ones (the same map week04_jobs.py uses for its own
network). meta carries legacy_codes and legacy_targets (LEGACY's size and its
distinct targets) and crosswalk_codes: the distinct 8-digit codes in the
filings that the crosswalk moved to a different 6-digit code. A row counts in
legacy_recoded when either step changed its 6-digit code. occupations/groups
below drop nothing: they route unparseable SOC codes into "All other
occupations" / "Other groups" and count how many.

top_in on a named series lists the fiscal years it ranked in that split's top
N, so the page can say when a role entered or left. The finding on each split
is the named series whose share of filings moved most from FY2022 to FY2025;
the page's notice only formats it, it does not compute it.

Checks: each split's series counts sum to years.json's certified total, every
year; placement's placed series matches years.json's placed_filings; a named
series's top_in years are exactly the years its count sits in that split's top
N; oct_jun (FY2022 to FY2026, October to June by DECISION_DATE, week04_shift's
own window) matches years.json's oct_jun totals for FY2024 to FY2026. check()
runs before the file is written, so a rerun that breaks one of these stops
here instead of on the page.

Output: docs/weeks/week04/data/roles.json.
"""

import json
from pathlib import Path

import pandas as pd

import week04_staffing as staffing
from week04_data import RAW
from week04_jobs import LEGACY, titles_of
from week04_schemas import check
from week04_shift import bounds as oct_jun_bounds

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs/weeks/week04/data/roles.json"
CROSSWALK = RAW / "onet" / "onet_2010_to_2019_crosswalk.csv"
YEARS = ["2022", "2023", "2024", "2025", "2026"]
FY = {y: f"FY{y}" for y in YEARS}
TOP_N = {"occupations": 10, "groups": 7, "employer": 10}
OTHER_NAME = {
    "occupations": "All other occupations",
    "groups": "Other groups",
    "employer": "All other employers",
}
# 2018 SOC major group titles (bls.gov/soc/2018/major_groups.htm), official wording.
MAJOR_GROUP_TITLES = {
    "11": "Management Occupations",
    "13": "Business and Financial Operations Occupations",
    "15": "Computer and Mathematical Occupations",
    "17": "Architecture and Engineering Occupations",
    "19": "Life, Physical, and Social Science Occupations",
    "21": "Community and Social Service Occupations",
    "23": "Legal Occupations",
    "25": "Educational Instruction and Library Occupations",
    "27": "Arts, Design, Entertainment, Sports, and Media Occupations",
    "29": "Healthcare Practitioners and Technical Occupations",
    "31": "Healthcare Support Occupations",
    "33": "Protective Service Occupations",
    "35": "Food Preparation and Serving Related Occupations",
    "37": "Building and Grounds Cleaning and Maintenance Occupations",
    "39": "Personal Care and Service Occupations",
    "41": "Sales and Related Occupations",
    "43": "Office and Administrative Support Occupations",
    "45": "Farming, Fishing, and Forestry Occupations",
    "47": "Construction and Extraction Occupations",
    "49": "Installation, Maintenance, and Repair Occupations",
    "51": "Production Occupations",
    "53": "Transportation and Material Moving Occupations",
    "55": "Military Specific Occupations",
}


def single_targets():
    """{2010 O*NET-SOC code: its 2019 6-digit SOC code}, from every crosswalk
    row whose 2010 code has exactly one 2019 target."""
    if not CROSSWALK.exists():
        raise SystemExit(f"{CROSSWALK.relative_to(ROOT)} is missing: run python analysis/week04_data.py --refs --no-tables")
    walk = pd.read_csv(CROSSWALK, dtype=str)
    targets = walk.groupby("O*NET-SOC 2010 Code")["O*NET-SOC 2019 Code"].agg(set)
    return {old: next(iter(new))[:7] for old, new in targets.items() if len(new) == 1}


def recoded(lca, crosswalk):
    """Adds the recoded 6-digit occupation, its major group, whether the
    recode moved the row off a 2010 code, whether the crosswalk (not LEGACY)
    did, and whether its SOC code parsed at all."""
    raw = lca["SOC_CODE"].astype(str).str.strip()
    code = raw.str[:7]
    valid = code.str.match(r"^\d{2}-\d{4}$", na=False)
    full = raw.str[:10].where(raw.str[:10].str.match(r"^\d{2}-\d{4}\.\d{2}$", na=False))
    walked = full.map(crosswalk)
    occupation = walked.where(valid).fillna(code.where(valid).replace(LEGACY))
    legacy = valid & (occupation != code)
    by_crosswalk = valid & walked.notna() & (walked != code)
    group = occupation.str[:2]
    return lca.assign(occupation=occupation, group=group, legacy=legacy, by_crosswalk=by_crosswalk,
                      onet_code=full, soc_valid=valid)


def load_years():
    crosswalk = single_targets()
    out = {}
    for i, y in enumerate(YEARS, 1):
        out[y] = recoded(staffing.certified(int(y)), crosswalk)
        print(f"loaded FY{y} ({i}/{len(YEARS)})", flush=True)
    return out


def oct_jun_frames(frames):
    """Each year's rows with DECISION_DATE in the October-to-June window
    week04_shift.py uses (week04_shift.bounds), so FY2022 and FY2023 get the
    same like-for-like window FY2024 to FY2026 already have."""
    out = {}
    for y in YEARS:
        f = frames[y]
        decided = pd.to_datetime(f["DECISION_DATE"], errors="coerce")
        start, end = oct_jun_bounds(int(y), "oct_jun")
        out[y] = f[decided.between(start, end)]
    return out


def occupation_titles(frames):
    """One title per recoded occupation code, from titles_of (week04_jobs.py),
    over every year's valid rows so a code keeps one title across years."""
    parts = [f.loc[f["soc_valid"], ["occupation", "legacy", "SOC_CODE", "SOC_TITLE"]] for f in frames.values()]
    return titles_of(pd.concat(parts, ignore_index=True))


def valid_rows(frame, key_col):
    return frame[frame["soc_valid"]] if key_col in ("occupation", "group") else frame


def top_per_year(frames, key_col, n):
    """The n largest keys by filings, each year (ties broken by key, so the
    choice is deterministic); the union across years, in first-seen order."""
    per_year, union, seen = {}, [], set()
    for y in YEARS:
        counts = valid_rows(frames[y], key_col).groupby(key_col).size()
        ranked = counts.sort_values(ascending=False).reset_index(name="n")
        ranked = ranked.sort_values(["n", key_col], ascending=[False, True])
        top = list(ranked[key_col].head(n))
        per_year[y] = top
        for k in top:
            if k not in seen:
                seen.add(k)
                union.append(k)
    return union, per_year


def counts_by(frames, key_col):
    """{key: [count per year in YEARS order]}, over valid rows only for the
    occupation and group columns; every certified row has an employer key."""
    out = {}
    for i, y in enumerate(YEARS):
        counts = valid_rows(frames[y], key_col).groupby(key_col).size()
        for k, v in counts.items():
            out.setdefault(k, [0] * 5)[i] = int(v)
    return out


def biggest_mover(series, totals):
    """The named series (code is not None) whose share of filings moved most,
    by percentage points, from FY2022 to FY2025."""
    named = [s for s in series if s["code"] is not None]
    if not named:
        return None
    share = lambda s, i: s["counts"][i] / totals[YEARS[i]] if totals[YEARS[i]] else 0.0
    scored = [(s, share(s, 0), share(s, 3)) for s in named]
    s, s22, s25 = max(scored, key=lambda t: abs(t[2] - t[1]))
    # change_pp from the shares as rounded, so the notice's three numbers agree.
    r22, r25 = round(s22 * 100, 1), round(s25 * 100, 1)
    return {
        "name": s["name"], "code": s["code"],
        "share_fy2022_percent": r22, "share_fy2025_percent": r25,
        "change_pp": round(r25 - r22, 1), "direction": "grew" if s25 > s22 else "shrank",
        "entered_top": "FY2022" not in s["top_in"] and "FY2025" in s["top_in"],
        "left_top": "FY2022" in s["top_in"] and "FY2025" not in s["top_in"],
    }


def build_split(name, frames, oj_frames, key_col, totals, oj_totals, label_of):
    n = TOP_N[name]
    union, per_year_top = top_per_year(frames, key_col, n)
    full_counts, oj_counts = counts_by(frames, key_col), counts_by(oj_frames, key_col)
    series = []
    for k in union:
        counts = full_counts.get(k, [0] * 5)
        series.append({
            "name": label_of(k), "code": k,
            "top_in": [FY[y] for y in YEARS if k in per_year_top[y]],
            "counts": counts, "oct_jun": oj_counts.get(k, [0] * 5),
        })
    named_labels = [s["name"] for s in series]
    assert len(named_labels) == len(set(named_labels)), f"{name}: two series share a label"
    other_full = [totals[y] - sum(s["counts"][i] for s in series) for i, y in enumerate(YEARS)]
    other_oj = [oj_totals[y] - sum(s["oct_jun"][i] for s in series) for i, y in enumerate(YEARS)]
    series.append({"name": OTHER_NAME[name], "code": None, "top_in": [], "counts": other_full, "oct_jun": other_oj})
    series.sort(key=lambda s: -sum(s["counts"]))
    for i, y in enumerate(YEARS):
        assert sum(s["counts"][i] for s in series) == totals[y], f"{name} {y}: series do not sum to the total"
        named_this_year = sum(1 for s in series if FY[y] in s["top_in"])
        assert named_this_year == n, f"{name} {y}: expected {n} series in the top, found {named_this_year}"
    return {"top_n": n, "other_name": OTHER_NAME[name], "series": series, "finding": biggest_mover(series, totals)}


def build_placement(frames, oj_frames, totals, oj_totals):
    placed = lambda f: f["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
    placed_full = [int(placed(frames[y]).sum()) for y in YEARS]
    placed_oj = [int(placed(oj_frames[y]).sum()) for y in YEARS]
    direct_full = [totals[y] - p for y, p in zip(YEARS, placed_full)]
    direct_oj = [oj_totals[y] - p for y, p in zip(YEARS, placed_oj)]
    series = [
        {"name": "Placed at a client", "code": None, "top_in": [], "counts": placed_full, "oct_jun": placed_oj},
        {"name": "Direct employer", "code": None, "top_in": [], "counts": direct_full, "oct_jun": direct_oj},
    ]
    series.sort(key=lambda s: -sum(s["counts"]))
    code = {"Placed at a client": "placed", "Direct employer": "direct"}
    return {"top_n": 2, "other_name": "", "series": series,
            "finding": biggest_mover([{**s, "code": code[s["name"]]} for s in series], totals)}


def main():
    years_page = json.loads((ROOT / "docs/weeks/week04/data/years.json").read_text())
    frames = load_years()
    oj = oct_jun_frames(frames)
    totals = {y: len(frames[y]) for y in YEARS}
    oj_totals = {y: len(oj[y]) for y in YEARS}

    for y in YEARS:
        assert totals[y] == years_page["years"][y]["certified_filings"], \
            f"{y}: certified total must match years.json"
    for fy in ("FY2024", "FY2025", "FY2026"):
        y = fy[2:]
        assert oj_totals[y] == years_page["oct_jun"]["totals"][fy]["certified_filings"], \
            f"{fy}: October-to-June total must match years.json"

    titles = occupation_titles(frames)
    occ_label = lambda k: titles[k]
    group_label = lambda k: MAJOR_GROUP_TITLES.get(k, k)
    employer_label = lambda k: staffing.resolver().label(k)

    splits = {
        "occupations": build_split("occupations", frames, oj, "occupation", totals, oj_totals, occ_label),
        "groups": build_split("groups", frames, oj, "group", totals, oj_totals, group_label),
        "employer": build_split("employer", frames, oj, "employer", totals, oj_totals, employer_label),
        "placement": build_placement(frames, oj, totals, oj_totals),
    }

    placement_names = [s["name"] for s in splits["placement"]["series"]]
    placed_series = splits["placement"]["series"][placement_names.index("Placed at a client")]
    placed_check = dict(zip(YEARS, placed_series["counts"]))
    staffing_page = json.loads((ROOT / "analysis/week04_staffing.json").read_text())
    for y in YEARS:
        assert placed_check[y] == staffing_page["years"][y]["placed_filings"], \
            f"{y}: placed filings must match week04_staffing.json"

    page = {
        "generated_by": "analysis/week04_roles.py",
        "years": YEARS,
        "partial": {"year": "2026", "months": 9, "window": "October to June"},
        "totals": totals,
        "oct_jun_totals": oj_totals,
        "splits": splits,
        "legacy_recoded": {y: int(frames[y]["legacy"].sum()) for y in YEARS},
        "meta": {
            "legacy_codes": len(LEGACY),
            "legacy_targets": len(set(LEGACY.values())),
            "crosswalk_codes": int(pd.concat([f.loc[f["by_crosswalk"], "onet_code"] for f in frames.values()]).nunique()),
        },
        "uncoded": {y: int((~frames[y]["soc_valid"]).sum()) for y in YEARS},
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {PAGE.relative_to(ROOT)}")
    for name in ("occupations", "groups", "employer"):
        named = [s["name"] for s in splits[name]["series"] if s["code"] is not None]
        print(f"{name}: {len(named)} named series -> {named}")
    print("placement:", [s["name"] for s in splits["placement"]["series"]])
    for name, split in splits.items():
        if split["finding"]:
            f = split["finding"]
            print(f"{name} biggest mover: {f['name']} {f['direction']} {abs(f['change_pp'])}pp "
                  f"({f['share_fy2022_percent']}% -> {f['share_fy2025_percent']}%)")


if __name__ == "__main__":
    main()
