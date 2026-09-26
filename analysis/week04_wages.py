"""Week 4, section 3, wages: does a placed worker sit at a lower wage level?  Owner: Gyula.

Network: none of its own; this script reads the wage level DOL assigns every
certified H-1B filing (PW_WAGE_LEVEL, I to IV, set by the prevailing-wage
survey behind the filing, I lowest) and asks whether it tracks a firm's kind
(placing / direct / small, as in week04_lottery.kinds) or its community in the
FY2025 and FY2023 staffing networks from week04_staffing.

A raw first look, matching employer names by substring (not trustworthy: it
does not use the resolver, and mixes any firm whose name contains "TCS" or
"Cognizant"), found FY2025 Level I 21.5%, Level IV 15.9% against FY2026
(October to June) Level I 19.0%, Level IV 20.1%, alongside TCS filings falling
6,490 -> 2,881 and Cognizant 8,620 -> 5,796 over the same window while
Infosys rose 4,165 -> 4,767 and Amazon/Google held flat. This script redoes it
on resolver-keyed firms and their actual wage-level column.

Questions
- Does wage-level mix differ by firm kind (placing firms file more Level I,
  entry-level, work than direct employers do), and did it shift from FY2025 to
  FY2026 (October-June, like for like; FY2026 has no Q4 yet)?
- Same question for the individual firms that dominate each kind.
- Do the wage levels of a client's placed workers line up with the staffing
  communities Q2 of week04_staffing.py finds, better than chance?

A firm's kind is computed fresh from each year's own certified filings
(week04_lottery.kinds), so FY2025 and FY2026 firms are classified on their own
year's filings, as week04_staffing.uscis_outcomes already does.

Checks
- Wage-level shares (of all filings, including the ~5-8% with no level
  recorded) for placing / direct / small firms and for placed vs. not-placed
  filings, FY2022-FY2025 full years and FY2025 vs. FY2026 October-June.
- The same October-June comparison for the 8 largest placing firms and 5
  largest direct employers by FY2025 filings.
- A client community test on the FY2025 (and, for a second year, FY2023)
  staffing network: clients with 2 or more vendors and 5 or more placed
  filings, labelled by the majority wage level of the filings placed there.
  NMI against 1,000 shuffled labels, AMI over 100 Louvain runs (weighted and
  unweighted), set beside week04_staffing.json's industry and vendor AMIs for
  FY2025. A continuous version too: mean wage level (I=1..IV=4) per client,
  eta-squared (the share of its variance that sits between communities) for
  the best partition against 1,000 shuffles.

Output: analysis/week04_wages.json
"""

import json
import random
import time
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import adjusted_mutual_info_score as ami

from week04_lottery import kinds
from week04_staffing import (MIN_FILINGS, RUNS, SEED, certified, giant_of, graph, labels, louvain,
                              placements, resolver, shuffled_nmi, span, tracked, unweighted)

OUT = Path(__file__).with_suffix(".json")
LEVELS = ["I", "II", "III", "IV"]
LEVEL_NUM = {"I": 1, "II": 2, "III": 3, "IV": 4}
OCT_JUN = {10, 11, 12, 1, 2, 3, 4, 5, 6}  # months a fiscal year's Oct-Jun span falls in
FULL_YEARS = [2022, 2023, 2024, 2025]
COMMUNITY_YEARS = [2025, 2023]
MIN_CLIENT_VENDORS = 2
MIN_CLIENT_PLACED = 5


def classify(year):
    """(lca, kind per filing) for a year: placing / direct / small, and placed
    (SECONDARY_ENTITY starts with Y), all keyed as in week04_staffing/week04_lottery."""
    lca = certified(year)
    lca["level"] = lca["PW_WAGE_LEVEL"].str.strip()
    lca["kind"] = lca["employer"].map(kinds(year)).fillna("small")
    lca["placed"] = lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
    return lca


def mix(frame):
    """Wage-level shares of a set of filings, out of every filing including
    the ones with no level recorded."""
    total = len(frame)
    counts = frame["level"].value_counts()
    missing = int(total - counts.reindex(LEVELS, fill_value=0).sum())
    return {
        "filings": int(total),
        "missing_level": missing,
        "missing_level_share": round(missing / total, 4) if total else None,
        "shares": {lvl: (round(float(counts.get(lvl, 0) / total), 4) if total else None) for lvl in LEVELS},
        # Out of the filings that record a level: the missing share rose from
        # 7.7% to 10.4% between the two October-June windows, which would
        # shrink every level in "shares" without any change in the mix.
        "shares_of_known": {lvl: (round(float(counts.get(lvl, 0) / (total - missing)), 4)
                                  if total > missing else None) for lvl in LEVELS},
    }


def by_kind_and_placement(lca):
    return {
        "by_kind": {kind: mix(lca[lca["kind"] == kind]) for kind in ("placing", "direct", "small")},
        "placed": mix(lca[lca["placed"]]),
        "not_placed": mix(lca[~lca["placed"]]),
        "all": mix(lca),
    }


def octjun(lca):
    """A year's certified filings restricted to DECISION_DATE October-June, the
    span FY2026 (Q1-Q3 only) actually covers."""
    months = pd.to_datetime(lca["DECISION_DATE"]).dt.month
    return lca[months.isin(OCT_JUN)]


def top_firms(lca2025, n_placing=8, n_direct=5):
    """The largest placing and direct firms by FY2025 certified filings,
    ranked on the full year so the ranking doesn't move with the October-June
    window it's then measured over."""
    by_firm = lca2025.groupby(["employer", "kind"]).size().rename("filings").reset_index()
    top = {}
    for kind, n in (("placing", n_placing), ("direct", n_direct)):
        top[kind] = by_firm[by_firm["kind"] == kind].sort_values("filings", ascending=False).head(n)
    return top


def firm_octjun_entry(key, oj25, oj26):
    def stats(frame):
        f = frame[frame["employer"] == key]
        m = mix(f)
        return {"filings": m["filings"], "level_i_share": m["shares"]["I"], "level_iv_share": m["shares"]["IV"]}
    return {"firm": resolver().label(key), "octjun_fy2025": stats(oj25), "octjun_fy2026": stats(oj26)}


def eta_squared(values, groups):
    """Share of a continuous value's variance that sits between groups."""
    values = np.asarray(values, dtype=float)
    groups = np.asarray(groups)
    grand = values.mean()
    total = float(((values - grand) ** 2).sum())
    if total <= 0:
        return 0.0
    between = 0.0
    for gname in set(groups):
        vals = values[groups == gname]
        between += len(vals) * (vals.mean() - grand) ** 2
    return between / total


def shuffled_eta(values, groups, rng, times=1000):
    """Observed eta-squared, the share of group-label shuffles that match or beat
    it, and the shuffles' mean: many small groups explain some variance by chance."""
    observed = eta_squared(values, groups)
    groups = list(groups)
    null = []
    for _ in range(times):
        rng.shuffle(groups)
        null.append(eta_squared(values, groups))
    beats = sum(x >= observed for x in null)
    return observed, (beats + 1) / (times + 1), float(np.mean(null))


def wage_community_test(year, rng, staffing_io):
    """Do a client's placed workers' wage levels line up with the staffing
    communities Q2 of week04_staffing.py finds?"""
    lca = classify(year)
    rows, *_ = placements(year, lca)
    g = giant_of(graph(rows))
    lvl_of_case = lca.set_index("CASE_NUMBER")["level"]
    rows = rows.assign(level=rows["CASE_NUMBER"].map(lvl_of_case))

    per_client = rows.groupby(["client", "employer"]).size().rename("filings").reset_index()
    vendors = per_client.groupby("client")["employer"].nunique()
    placed_filings = rows.groupby("client").size()
    labeled = rows[rows["level"].isin(LEVELS)]
    level_counts = labeled.groupby(["client", "level"]).size().unstack(fill_value=0)
    majority = level_counts.idxmax(axis=1) if len(level_counts) else pd.Series(dtype=object)
    mean_num = labeled.assign(num=labeled["level"].map(LEVEL_NUM)).groupby("client")["num"].mean()

    big_enough = vendors[(vendors >= MIN_CLIENT_VENDORS) & (placed_filings.reindex(vendors.index, fill_value=0) >= MIN_CLIENT_PLACED)]
    eligible = [c for c in big_enough.index if ("C", c) in g and c in majority.index]
    maj = [majority[c] for c in eligible]
    meanv = [mean_num[c] for c in eligible]

    entry = {
        "year": year,
        "clients_2plus_vendors_5plus_placed": int(len(big_enough)),
        "clients_with_wage_label": len(eligible),
        "majority_level_counts": dict(Counter(maj)),
    }
    for kind, h in (("weighted", g), ("unweighted", unweighted(g))):
        runs = [louvain(h, SEED + i) for i in tracked(f"Louvain wages FY{year}, {kind}", RUNS)]
        best_parts = max(runs, key=lambda r: r[1])[0]
        member = labels(best_parts)
        comm = [member[("C", c)] for c in eligible]
        observed, p = shuffled_nmi(comm, maj, rng)
        amis = []
        for parts, _ in runs:
            m = labels(parts)  # once per run, not once per node
            amis.append(float(ami([m[("C", c)] for c in eligible], maj)))
        eta_obs, eta_p, eta_null = shuffled_eta(meanv, comm, rng)
        block = {
            "communities_among_these_clients": len(set(comm)),
            "nmi": round(observed, 4), "p_nmi": round(p, 4),
            "ami_median": round(float(np.median(amis)), 4),
            "ami_min": round(float(np.min(amis)), 4), "ami_max": round(float(np.max(amis)), 4),
            "eta_squared": round(eta_obs, 4), "p_eta_squared": round(eta_p, 4),
            "eta_squared_shuffled": round(eta_null, 4),
        }
        if staffing_io is not None:
            block["staffing_ami_community_industry"] = (
                staffing_io["ami_community_industry"] if kind == "weighted"
                else staffing_io["unweighted"]["ami_community_industry"])
            block["staffing_ami_community_main_vendor"] = (
                staffing_io["ami_community_main_vendor_same_clients"] if kind == "weighted"
                else staffing_io["unweighted"]["ami_community_main_vendor_same_clients"])
        entry[kind] = block
    return entry


def main():
    started = time.time()
    rng = random.Random(SEED)
    out = {"generated_by": "analysis/week04_wages.py", "years": {}}

    # Q1 · wage mix by firm kind and by placement, full years.
    lca_by_year = {}
    for year in FULL_YEARS:
        lca = classify(year)
        lca_by_year[year] = lca
        out["years"][year] = by_kind_and_placement(lca)
        print(f"FY{year} wage mix:", {k: v["shares"] for k, v in out["years"][year]["by_kind"].items()}, flush=True)

    # FY2026 needs its own load (not in FULL_YEARS).
    lca_by_year[2026] = classify(2026)

    # Like-for-like October-June, FY2025 vs. FY2026 (nine months only).
    oj25, oj26 = octjun(lca_by_year[2025]), octjun(lca_by_year[2026])
    out["octjun"] = {
        "note": "FY2026 is October-June only (Q1-Q3); the full-year FY2022-FY2025 entries above are "
                "not like-for-like with it, but this October-June slice of FY2025 is.",
        "fy2025": by_kind_and_placement(oj25),
        "fy2026": by_kind_and_placement(oj26),
    }
    print("Oct-Jun FY2025 vs FY2026:", {k: (out["octjun"]["fy2025"]["by_kind"][k]["shares"],
                                             out["octjun"]["fy2026"]["by_kind"][k]["shares"])
                                         for k in ("placing", "direct", "small")}, flush=True)

    # Q2 · the largest individual firms, same October-June comparison.
    top = top_firms(lca_by_year[2025])
    out["largest_firms_octjun"] = {
        kind: [firm_octjun_entry(row["employer"], oj25, oj26) for _, row in frame.iterrows()]
        for kind, frame in top.items()
    }
    for kind in ("placing", "direct"):
        print(f"Largest {kind} firms, Oct-Jun:",
              [(e["firm"], e["octjun_fy2025"]["filings"], e["octjun_fy2026"]["filings"])
               for e in out["largest_firms_octjun"][kind]], flush=True)

    # Q3/Q4 · client communities against the majority wage level placed there.
    staffing_path = Path(__file__).with_name("week04_staffing.json")
    staffing = json.loads(staffing_path.read_text()) if staffing_path.exists() else None
    out["community_test"] = {}
    for year in COMMUNITY_YEARS:
        io = staffing["main"]["industry_or_vendor"] if (staffing and year == staffing["main"]["year"]) else None
        entry = wage_community_test(year, rng, io)
        out["community_test"][year] = entry
        print(f"FY{year} wage community test:", {k: entry[k] for k in ("weighted", "unweighted")}, flush=True)

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")
    print(f"done in {span(out['seconds'])} -> {OUT.name}")


if __name__ == "__main__":
    main()
