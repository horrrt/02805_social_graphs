"""Week 4, beyond the three sections: three questions FY2025 alone can answer
that no section's own network reaches. Owner: Gyula.

Networks
- Q1: employer x law firm, bipartite, weight = filings. Employers are
  restricted to the "F" side of section 3's FY2025 staffing giant component
  (week04_staffing.graph/giant_of on placements(2025, certified(2025))), so the
  comparison is firm to firm on the same set of companies.
- Q2: no network; PERM FY2025 green-card filings against certified H-1B
  filings, per employer, compared across section 3's staffing communities.
- Q3: no network; certified H-1B filings FY2025, stratified by SOC_CODE[:7],
  compared with statsmodels' Cochran-Mantel-Haenszel and Breslow-Day tests.

Questions
- Q1 "Do immigration law firms split the market the way the vendors do?"
- Q2 "Does a firm's staffing community predict whether it sponsors green
  cards?"
- Q3 "Do firms that place workers at clients pay a lower wage level for the
  same job?"

Method
- Q0 first rebuilds section 3's FY2025 partition exactly as
  week04_staffing.main() does: placements(2025, certified(2025)) -> graph(rows)
  -> giant_of -> best of 100 weighted Louvain runs, seeds SEED + i. Every
  question below reads that partition; none refits it.
- Q1: LAWFIRM_NAME_BUSINESS_NAME, normalised with week04_names.normalize
  (company-family rules do not apply to law firms: no alias table, no tax
  number). Bipartite employer -> law firm, weight = filings, restricted to
  employers on the staffing giant's "F" side; 100 Louvain runs on its giant
  component; NMI and AMI of the best partition against the staffing partition,
  on firms present in both; a 1,000-shuffle p for each; a 50-rewiring
  degree-preserving null of the same law-firm graph, Louvain once per
  rewiring, AMI against the staffing partition each time (mean, sd), and Q
  (mean of 100 real runs) against the null Qs (z).
- Q2: PERM FY2025, CASE_STATUS in ("Certified", "Certified - Expired"),
  employer key via resolver().employer(EMP_BUSINESS_NAME, EMP_FEIN). Per
  employer: PERM filings / certified H-1B filings (FY2025), pooled and median,
  bootstrapped (1,000 resamples of employers) for placing firms (20+ placed
  filings, week04_staffing.intermediaries) against direct hirers (20+ H-1B
  filings, not an intermediary). Across the 6 largest staffing communities by
  filings: pooled ratio per community, and a 1,000-shuffle permutation test on
  the variance of the per-community pooled ratios.
- Q3: PW_WAGE_LEVEL in (I, II, III, IV); outcome = I or II; placed =
  SECONDARY_ENTITY startswith "Y". Strata = SOC_CODE[:7] with 20+ filings on
  each side; statsmodels.stats.contingency_tables.StratifiedTable over the
  kept strata's 2x2 tables gives the pooled Mantel-Haenszel odds ratio, its
  95% CI, the CMH test, and the Breslow-Day homogeneity test. A secondary
  check compares WAGE_RATE_OF_PAY_FROM / PREVAILING_WAGE (rows where
  WAGE_UNIT_OF_PAY == PW_UNIT_OF_PAY only) for the 5 largest kept strata.

Checks
- Q1 is "yes" (same split) only if the observed AMI clears both nulls: above
  the rewired-null mean by at least 3 sd, and the 1,000-shuffle p below 0.01.
  A high NMI with a near-zero AMI would mean the match is mostly the number
  and size of the groups, not which firms sit together.
- Q2 is "yes" only if the between-community permutation p is below 0.05. The
  20-plus-placed-filings rule for "placing" is an absolute count (the
  docstring of week04_staffing.intermediaries names Citigroup and Google as
  filing some applications that way too), and PERM match rates differ between
  placing and direct firms (checked below): a gap in ratios that tracks the
  match-rate gap is a matching artefact, not a sponsorship difference, and is
  reported as a caveat rather than folded into the verdict.
- Q3 is "yes" (lower level) only if the pooled odds ratio's 95% CI sits above
  1 (placed filings have higher odds of level I/II, the two lower wage
  levels, than direct filings, table rows placed/direct and columns
  I-or-II/III-or-IV), and the Breslow-Day test is reported plainly rather than
  treated as a null this script expects to fail: at this many filings even a
  small true difference clears Breslow-Day's homogeneity bar.
- The Q2 bootstrap resamples employers (with replacement) within a fixed
  group; the Q1 and Q2 permutation tests reshuffle labels over a fixed set of
  firms. Neither resamples or reshuffles individual filings.

Outputs: analysis/week04_beyond.json (every number, with nulls, n's and
coverage) and docs/weeks/week04/data/beyond.json (the numbers a page figure
would need), checked against week04_schemas.Beyond before it is written.
"""

import json
import random
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi
from statsmodels.stats.contingency_tables import StratifiedTable

import week04_names as names
from week04_data import load
from week04_schemas import check
from week04_staffing import (
    SEED, MIN_FILINGS, certified, check_rewire, giant_of, graph, intermediaries,
    labels, louvain, placements, resolver, rewire, tracked,
)

OUT = Path(__file__).with_suffix(".json")
PAGE = Path(__file__).resolve().parents[1] / "docs/weeks/week04/data/beyond.json"
YEAR = 2025
RUNS = 100
NULLS = 50
SHUFFLES = 1000


def clean(x):
    """Plain Python numbers, NaN as None, for JSON that a page's JSON.parse can read."""
    if isinstance(x, dict):
        return {k: clean(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [clean(v) for v in x]
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, (np.floating, float)):
        f = float(x)
        return None if np.isnan(f) else f
    return x


def shuffled_stat(a, b, metric, rng, times=1000, label="shuffle"):
    """Observed metric(a, b), and the share of label shuffles of b that match or beat it."""
    observed = metric(a, b)
    b = list(b)
    beats = 0
    for _ in tracked(label, times):
        rng.shuffle(b)
        beats += metric(a, b) >= observed
    return float(observed), (beats + 1) / (times + 1)


def bootstrap_ci(values, weights, stat, rng, times=1000):
    """A 95% bootstrap CI for stat(values, weights) over resamples of the rows (with replacement)."""
    values, weights = np.asarray(values, float), np.asarray(weights, float)
    n = len(values)
    draws = np.empty(times)
    idx = np.arange(n)
    for i in range(times):
        pick = rng.choices(idx, k=n)
        draws[i] = stat(values[pick], weights[pick])
    return float(np.percentile(draws, 2.5)), float(np.percentile(draws, 97.5))


def pooled(perm_counts, h1b_counts):
    return float(perm_counts.sum() / h1b_counts.sum())


def median_ratio(perm_counts, h1b_counts):
    return float(np.median(perm_counts / h1b_counts))


def question1(rng, lca, staffing_giant, staffing_member, out):
    """Do immigration law firms split the market the way the vendors do?"""
    started = time.time()
    staffing_firms = {k for side, k in staffing_giant.nodes() if side == "F"}

    has_lawfirm = lca["LAWFIRM_NAME_BUSINESS_NAME"].str.strip() != ""
    coverage = float(has_lawfirm.mean())
    raw = lca.loc[has_lawfirm, "LAWFIRM_NAME_BUSINESS_NAME"]
    key = raw.map(names.normalize)
    empty_after_normalize = int((key == "").sum())
    valid = key != ""
    distinct_raw = int(raw[valid].nunique())
    distinct_law_firms = int(key[valid].nunique())

    df = lca.loc[has_lawfirm, ["employer"]].copy()
    df["lawfirm"] = key
    df = df[df["lawfirm"] != ""]
    all_law_employers = df["employer"].nunique()
    df = df[df["employer"].isin(staffing_firms)]

    rows_law = df.rename(columns={"lawfirm": "client"})[["employer", "client"]]
    g = graph(rows_law)
    giant = giant_of(g)
    law_firms = {k for side, k in giant.nodes() if side == "F"}

    runs = [louvain(giant, SEED + i) for i in tracked("Q1: Louvain, law firms", RUNS)]
    qs = np.array([q for _, q in runs])
    best_parts, best_q = max(runs, key=lambda r: r[1])
    member = labels(best_parts)

    common = sorted(e for e in staffing_firms if ("F", e) in member and ("F", e) in staffing_member)
    a = [member[("F", e)] for e in common]
    b = [staffing_member[("F", e)] for e in common]

    nmi_obs, nmi_p = shuffled_stat(a, b, nmi, rng, SHUFFLES, "Q1: NMI shuffle")
    ami_obs, ami_p = shuffled_stat(a, b, ami, rng, SHUFFLES, "Q1: AMI shuffle")

    null_ami, null_giant_qs, null_node_share = [], [], []
    for i in tracked("Q1: rewired null", NULLS):
        h = rewire(giant, rng)
        if i == 0:
            check_rewire(giant, h)
        # Louvain on the whole rewiring (not only its giant component), so
        # every common firm keeps a community label, matching the real AMI's
        # firm set exactly.
        parts_h, _ = louvain(h, SEED + i)
        member_h = labels(parts_h)
        common_h = [e for e in common if ("F", e) in member_h]
        if len(common_h) >= 2:
            null_ami.append(ami([member_h[("F", e)] for e in common_h], [staffing_member[("F", e)] for e in common_h]))
        # Q's null is scored on the rewiring's own giant component, as section
        # 3 scores its wiring null: a rewiring of a giant component splits into
        # many free pieces, each an easy community, which can outscore the real
        # (connected) network even when the real split is the more meaningful one.
        hg = giant_of(h)
        null_node_share.append(hg.number_of_nodes() / h.number_of_nodes())
        _, q_hg = louvain(hg, SEED + i)
        null_giant_qs.append(q_hg)
    null_ami = np.array(null_ami)
    null_giant_qs = np.array(null_giant_qs)
    z_q = float((qs.mean() - null_giant_qs.mean()) / null_giant_qs.std())
    z_ami = float((ami_obs - null_ami.mean()) / null_ami.std())

    per_employer = df.groupby("employer")["lawfirm"].nunique()
    totals = df.groupby("employer").size()
    single = per_employer[per_employer == 1].index
    single_firm_share = float(totals.loc[single].sum() / totals.sum())

    by_lawfirm = df.groupby("lawfirm").size().sort_values(ascending=False)
    employers_per_lawfirm = df.groupby("lawfirm")["employer"].nunique()
    top_lawfirms = [
        {"law_firm": names.tidy(k), "filings": int(v), "employers": int(employers_per_lawfirm[k])}
        for k, v in by_lawfirm.head(10).items()
    ]

    same_split = ami_obs > null_ami.mean() + 3 * null_ami.std() and ami_p < 0.01
    finding = (f"Yes, above chance but weak (AMI {ami_obs:.3f}, NMI {nmi_obs:.3f})" if same_split
               else "No, a different split")
    result = {
        "lawfirm_column_coverage": round(coverage, 4),
        "certified_filings": int(len(lca)),
        "distinct_raw_spellings": distinct_raw,
        "distinct_law_firms_after_normalize": distinct_law_firms,
        "spellings_collapsed": distinct_raw - distinct_law_firms,
        "rows_with_no_usable_key_after_normalize": empty_after_normalize,
        "caveat": "normalize() does not strip PC/PLLC/APC suffixes or firm-name "
                  "abbreviations, so the same firm can sit under two keys (e.g. "
                  "'OGLETREE DEAKINS NASH SMOAK AND STEWART PC' beside the short "
                  "form 'OGLETREE DEAKINS'); no further merging was applied.",
        "staffing_giant_firms": len(staffing_firms),
        "employers_naming_a_law_firm": all_law_employers,
        "employers_restricted_to_staffing_firms": int(df["employer"].nunique()),
        "law_graph": {"nodes": giant.number_of_nodes(), "edges": giant.number_of_edges(),
                      "firms": len(law_firms), "law_firms": giant.number_of_nodes() - len(law_firms)},
        "runs": RUNS,
        "modularity_mean": round(float(qs.mean()), 4), "modularity_sd": round(float(qs.std()), 4),
        "modularity_best": round(float(best_q), 4),
        "rewired_null_mean": round(float(null_giant_qs.mean()), 4), "rewired_null_sd": round(float(null_giant_qs.std()), 4),
        "rewired_giant_node_share_median": round(float(np.median(null_node_share)), 4),
        "modularity_z_vs_rewired": round(z_q, 2),
        "modularity_z_caveat": "negative: the rewired giant is nearly as large as the real one "
                               "(rewired_giant_node_share_median above) yet still scores higher. Many "
                               "employers use a single law firm, so the wiring is sparse and close to a "
                               "forest of stars; that shape gives high modularity to both the real network "
                               "and its reshuffled wiring (the trap WEEK04.md's traps list already names for "
                               "section 3's own sparse quarter). Q does not discriminate here; AMI against "
                               "the rewired null does.",
        "firms_compared": len(common),
        "nmi_with_staffing_partition": round(nmi_obs, 3), "nmi_shuffle_p": round(nmi_p, 4),
        "ami_with_staffing_partition": round(ami_obs, 3), "ami_shuffle_p": round(ami_p, 4),
        "ami_rewired_null_mean": round(float(null_ami.mean()), 4), "ami_rewired_null_sd": round(float(null_ami.std()), 4),
        "ami_z_vs_rewired": round(z_ami, 2),
        "single_law_firm_employers": int(len(single)), "single_law_firm_filing_share": round(single_firm_share, 4),
        "top_law_firms": top_lawfirms,
        "same_split_as_vendors": same_split,
        "finding": finding,
        "seconds": round(time.time() - started),
    }
    out["q1"] = result
    print("Q1:", json.dumps(result, indent=1))
    return result


def question2(rng, lca, staffing_giant, staffing_member, out):
    """Does a firm's staffing community predict whether it sponsors green cards?"""
    started = time.time()
    perm = load("perm_fy2025")
    perm = perm[perm["CASE_STATUS"].isin(["Certified", "Certified - Expired"])].copy()
    perm["employer"] = [resolver().employer(n, f) for n, f in zip(perm["EMP_BUSINESS_NAME"], perm["EMP_FEIN"])]

    h1b_counts = lca.groupby("employer").size()
    perm_counts = perm.groupby("employer").size()
    ratio = (perm_counts.reindex(h1b_counts.index, fill_value=0) / h1b_counts).rename("ratio")

    placing = intermediaries(lca)
    big_h1b = set(h1b_counts[h1b_counts >= MIN_FILINGS].index)
    direct = big_h1b - placing
    matched_keys = set(resolver().family_of.values()) | {k for k in h1b_counts.index if k.startswith("FEIN ")}
    perm_fein_unmatched = int((~perm["employer"].isin(matched_keys) & ~perm["employer"].str.startswith("FEIN ")).sum())
    overall_match_rate = round(len(big_h1b & set(perm_counts.index)) / len(big_h1b), 4)

    def group_stats(keys):
        keys = list(keys)
        h = h1b_counts.reindex(keys, fill_value=0)
        p = perm_counts.reindex(keys, fill_value=0)
        matched_keys_here = set(keys) & set(perm_counts.index)
        # match rate by employer count, and by the H-1B filings those employers carry:
        # a handful of large unmatched employers can move the pooled ratio far more
        # than the employer-count rate alone would suggest.
        matched = len(matched_keys_here)
        matched_filings = float(h.loc[list(matched_keys_here)].sum()) if matched_keys_here else 0.0
        pooled_ci = bootstrap_ci(p.values, h.values, pooled, rng, SHUFFLES)
        median_ci = bootstrap_ci(p.values, h.values, median_ratio, rng, SHUFFLES)
        return {
            "employers": len(keys),
            "h1b_filings": int(h.sum()), "perm_filings": int(p.sum()),
            "pooled_ratio": round(pooled(p.values, h.values), 4), "pooled_ci95": [round(x, 4) for x in pooled_ci],
            "median_ratio": round(median_ratio(p.values, h.values), 4), "median_ci95": [round(x, 4) for x in median_ci],
            "perm_match_rate": round(matched / len(keys), 4) if keys else None,
            "perm_match_rate_by_filings": round(matched_filings / h.sum(), 4) if h.sum() else None,
        }

    placing_stats = group_stats(placing & big_h1b)
    direct_stats = group_stats(direct)

    # Sensitivity: the uscis_outcomes rule (share of a firm's own filings that
    # are placed at least half the time), instead of an absolute filing count.
    lca_placed = lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
    by_employer = lca.assign(placed=lca_placed).groupby("employer").agg(filings=("placed", "size"), placed=("placed", "sum"))
    by_employer = by_employer[by_employer["filings"] >= MIN_FILINGS]
    share_placing = set(by_employer[(by_employer["placed"] / by_employer["filings"]) >= 0.5].index)
    share_direct = set(by_employer.index) - share_placing
    sensitivity = {"placing": group_stats(share_placing), "direct": group_stats(share_direct)}

    # Six largest staffing communities by filings (the community's total
    # placement weight, as week04_staffing's largest_communities uses).
    strength = dict(staffing_giant.degree(weight="weight"))
    firm_community = {k: staffing_member[("F", k)] for k in h1b_counts.index if ("F", k) in staffing_member}
    community_filings = pd.Series(0, index=sorted(set(firm_community.values())), dtype=float)
    for node, s in strength.items():
        if node[0] == "F" and node[1] in firm_community:
            community_filings[firm_community[node[1]]] += s
    top6 = community_filings.sort_values(ascending=False).head(6).index.tolist()

    firms6 = [k for k, c in firm_community.items() if c in top6]
    comm_of = pd.Series({k: firm_community[k] for k in firms6})
    h6 = h1b_counts.reindex(firms6, fill_value=0)
    p6 = perm_counts.reindex(firms6, fill_value=0)

    def variance_of_pooled(comm_labels):
        ratios = []
        for c in top6:
            mask = comm_labels == c
            if mask.sum() == 0:
                continue
            ratios.append(pooled(p6.values[mask.values], h6.values[mask.values]))
        return float(np.var(ratios))

    observed_var = variance_of_pooled(comm_of)
    per_community = {}
    for c in top6:
        members = comm_of[comm_of == c].index
        h_c, p_c = h1b_counts.reindex(members, fill_value=0), perm_counts.reindex(members, fill_value=0)
        top_firms = h_c.sort_values(ascending=False).head(3)
        per_community[str(c)] = {
            "firms": int(len(members)),
            "h1b_filings": int(h_c.sum()), "perm_filings": int(p_c.sum()),
            "pooled_ratio": round(pooled(p_c.values, h_c.values), 4),
            "top_firms": [resolver().label(k) for k in top_firms.index],
            "largest_firm_filing_share": round(float(top_firms.iloc[0] / h_c.sum()), 4) if h_c.sum() else None,
        }
    labels_arr = comm_of.values.copy()
    beats = 0
    for _ in tracked("Q2: community permutation", SHUFFLES):
        rng.shuffle(labels_arr)
        shuffled = pd.Series(labels_arr, index=comm_of.index)
        beats += variance_of_pooled(shuffled) >= observed_var
    perm_p = (beats + 1) / (SHUFFLES + 1)

    top10 = [
        {"employer": resolver().label(k), "h1b_filings": int(h1b_counts[k]),
         "perm_filings": int(perm_counts.get(k, 0)), "ratio": round(float(ratio[k]), 4),
         "in_placing": k in placing, "perm_matched": k in perm_counts.index}
        for k in h1b_counts.sort_values(ascending=False).head(10).index
    ]

    same_direction = perm_p < 0.05
    result = {
        "certified_h1b_filings": int(len(lca)), "perm_certified_or_expired_filings": int(len(perm)),
        "min_filings": MIN_FILINGS,
        "perm_match_rate_20plus_h1b_employers": overall_match_rate,
        "perm_fein_note": "PERM carries an employer tax number only from FY2024 onward, so an employer "
                          "without one on the PERM side is matched by resolver().employer()'s name rules "
                          "alone, the same rules FY2022-FY2023 H-1B filings rely on.",
        "placing_firms_20plus_placed": placing_stats,
        "direct_firms_20plus_h1b": direct_stats,
        "perm_match_rate_caveat": "match rates differ between the two groups, by employer count and by the "
                                  "H-1B filings behind them (perm_match_rate / perm_match_rate_by_filings "
                                  "above), though the filing-weighted gap is small (about 2 points). "
                                  f"{perm_fein_unmatched} of {len(perm):,} PERM filings kept a name-only key "
                                  "that never joined an LCA-side FEIN family; many of those belong to "
                                  "employers that file no H-1B at all, so this is an upper bound on join "
                                  "failures, not a count of them. Checked directly for the four largest "
                                  "H-1B employers with perm_filings of 0 (Amazon, Google, Cognizant, Infosys): "
                                  "their FY2025 PERM rows under any spelling of the name are themselves near "
                                  "zero (0 to 3 rows before any key-matching), so these zeros are real, not a "
                                  "resolver join failure; whether that reflects true sponsorship, a filing "
                                  "under a legal-entity name this check did not try, or a certification lag "
                                  "was not investigated further.",
        "top10_zero_perm_employers": [t["employer"] for t in top10 if t["perm_filings"] == 0],
        "sensitivity_share_based_placing_rule": sensitivity,
        "placing_vs_direct_ci_overlap": "the pooled-ratio 95% CIs already touch under the spec rule "
                                        "(placing up to 0.149, direct from 0.141) and overlap more under the "
                                        "share-based sensitivity rule (0.101-0.180 vs 0.132-0.202): the "
                                        "placing/direct gap in pooled ratios is not robust to how 'placing' "
                                        "is defined.",
        "top6_staffing_communities_by_filings": per_community,
        "between_community_variance": round(observed_var, 6),
        "permutation_shuffles": SHUFFLES, "permutation_p": round(perm_p, 4),
        "top10_h1b_employers": top10,
        "between_communities_matters": same_direction,
        "finding": "Yes, community predicts sponsorship" if same_direction else "No, no reliable difference",
        "seconds": round(time.time() - started),
    }
    out["q2"] = result
    print("Q2:", json.dumps(result, indent=1))
    return result


def question3(lca, out):
    """Do firms that place workers at clients pay a lower wage level for the same job?"""
    started = time.time()
    valid_level = lca["PW_WAGE_LEVEL"].isin(["I", "II", "III", "IV"])
    coverage = float(valid_level.mean())
    placed = lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
    blank = ~valid_level
    blank_by_group = {
        "placed": round(float(blank[placed].mean()), 4),
        "direct": round(float(blank[~placed].mean()), 4),
        "share_of_blanks_that_are_placed": round(float(placed[blank].mean()), 4) if blank.sum() else None,
    }

    df = lca.loc[valid_level, ["PW_WAGE_LEVEL", "SOC_CODE"]].copy()
    df["placed"] = placed[valid_level]
    df["low"] = df["PW_WAGE_LEVEL"].isin(["I", "II"])
    df["soc7"] = df["SOC_CODE"].str[:7]

    crude = {
        "placed_low_share": round(float(df.loc[df["placed"], "low"].mean()), 4),
        "direct_low_share": round(float(df.loc[~df["placed"], "low"].mean()), 4),
        "placed_filings": int(df["placed"].sum()), "direct_filings": int((~df["placed"]).sum()),
    }

    tables, kept_strata = [], []
    for soc, g in df.groupby("soc7"):
        p, d = g[g["placed"]], g[~g["placed"]]
        if len(p) < MIN_FILINGS or len(d) < MIN_FILINGS:
            continue
        table = [[int((p["low"]).sum()), int((~p["low"]).sum())],
                 [int((d["low"]).sum()), int((~d["low"]).sum())]]
        tables.append(table)
        kept_strata.append({"soc7": soc, "filings": len(g), "table": table})
    zero_cell_strata = sum(1 for t in tables if any(c == 0 for row in t for c in row))
    kept_filing_share = round(sum(s["filings"] for s in kept_strata) / len(df), 4)

    def stratum_or(t, shift=0.5):
        (a, b), (c, d) = t
        if b * c == 0:
            a, b, c, d = a + shift, b + shift, c + shift, d + shift
        return (a * d) / (b * c)

    strata_ors = [stratum_or(t) for t in tables]
    strata_or_above_1 = sum(o > 1 for o in strata_ors)

    st = StratifiedTable(tables)
    or_pooled = float(st.oddsratio_pooled)
    or_ci = tuple(float(x) for x in st.oddsratio_pooled_confint())
    cmh = st.test_null_odds(correction=True)
    bd = st.test_equal_odds()

    # Each soc7's title, from its base ".00" rows when present, the most
    # common SOC_TITLE otherwise (week04_jobs.titles_of does the same thing
    # off a differently-shaped frame, so this is redone here rather than
    # imported).
    titles_frame = pd.DataFrame({
        "soc7": df["soc7"],
        "SOC_TITLE": lca.loc[df.index, "SOC_TITLE"],
        "is_base": lca.loc[df.index, "SOC_CODE"].str.strip().str.endswith(".00"),
    })
    mode_title = lambda s: s.str.strip().mode().iloc[0]  # noqa: E731
    soc_titles = titles_frame[titles_frame["is_base"]].groupby("soc7")["SOC_TITLE"].agg(mode_title).to_dict()
    rest = titles_frame[~titles_frame["soc7"].isin(soc_titles)]
    soc_titles |= rest.groupby("soc7")["SOC_TITLE"].agg(mode_title).to_dict()

    kept_strata.sort(key=lambda s: -s["filings"])
    top5 = kept_strata[:5]
    top5_shares = []
    for s in top5:
        g = df[df["soc7"] == s["soc7"]]
        top5_shares.append({
            "soc7": s["soc7"], "title": soc_titles.get(s["soc7"], s["soc7"]), "filings": s["filings"],
            "placed_low_share": round(float(g.loc[g["placed"], "low"].mean()), 4),
            "direct_low_share": round(float(g.loc[~g["placed"], "low"].mean()), 4),
        })

    # Secondary check: offered wage against prevailing wage, same units only.
    same_units = lca["WAGE_UNIT_OF_PAY"] == lca["PW_UNIT_OF_PAY"]
    wage_from = pd.to_numeric(lca["WAGE_RATE_OF_PAY_FROM"], errors="coerce")
    pw = pd.to_numeric(lca["PREVAILING_WAGE"], errors="coerce")
    usable = same_units & wage_from.notna() & pw.notna() & (pw > 0)
    wage_coverage = float(usable.mean())
    wdf = lca.loc[usable, ["SOC_CODE"]].copy()
    wdf["placed"] = placed[usable]
    wdf["ratio"] = (wage_from[usable] / pw[usable])
    wdf["soc7"] = lca.loc[usable, "SOC_CODE"].str[:7]
    top5_wage = []
    for s in top5:
        g = wdf[wdf["soc7"] == s["soc7"]]
        top5_wage.append({
            "soc7": s["soc7"], "filings": len(g),
            "placed_median_ratio": round(float(g.loc[g["placed"], "ratio"].median()), 4) if g["placed"].any() else None,
            "direct_median_ratio": round(float(g.loc[~g["placed"], "ratio"].median()), 4) if (~g["placed"]).any() else None,
        })

    # table rows are (placed, direct), columns are (level I/II, level III/IV): an
    # odds ratio above 1, with a CI clear of 1, means placed filings have higher
    # odds of level I/II (the lower wage levels) than direct filings.
    lower_wage = or_ci[0] > 1
    result = {
        "certified_filings": int(len(lca)),
        "pw_wage_level_coverage": round(coverage, 4),
        "blank_by_group": blank_by_group,
        "crude": crude,
        "strata_total": int(df["soc7"].nunique()), "strata_kept_20plus_each_side": len(tables),
        "strata_kept_filing_share": kept_filing_share,
        "strata_with_a_zero_cell": zero_cell_strata,
        "strata_with_or_above_1": strata_or_above_1,
        "strata_or_above_1_share": round(strata_or_above_1 / len(tables), 4),
        "mantel_haenszel_odds_ratio": round(or_pooled, 4),
        "odds_ratio_ci95": [round(x, 4) for x in or_ci],
        "cmh_statistic": round(float(cmh.statistic), 3), "cmh_p": float(cmh.pvalue),
        "breslow_day_statistic": round(float(bd.statistic), 3) if not np.isnan(bd.statistic) else None,
        "breslow_day_p": float(bd.pvalue) if not np.isnan(bd.pvalue) else None,
        "breslow_day_caveat": "large and significant at this many filings almost by construction; read it as "
                              "'the odds ratio is not exactly uniform across jobs', not as a reason to "
                              "distrust the pooled direction (strata_or_above_1_share above).",
        "top5_soc_by_filings": top5_shares,
        "wage_ratio_coverage": round(wage_coverage, 4),
        "top5_soc_wage_ratio": top5_wage,
        "placed_pays_lower_level": lower_wage,
        "finding": "Yes, a lower wage level" if lower_wage else "No, not a reliable difference",
        "seconds": round(time.time() - started),
    }
    out["q3"] = result
    print("Q3:", json.dumps(result, indent=1))
    return result


def main():
    started = time.time()
    rng = random.Random(SEED)
    out = {"generated_by": "analysis/week04_beyond.py", "year": YEAR, "runs": RUNS, "seed": SEED}

    lca = certified(YEAR)
    rows, _, _ = placements(YEAR, lca)
    staffing_g = graph(rows)
    staffing_giant = giant_of(staffing_g)
    staffing_runs = [louvain(staffing_giant, SEED + i) for i in tracked("Q0: rebuild staffing partition", RUNS)]
    staffing_best_parts, staffing_best_q = max(staffing_runs, key=lambda r: r[1])
    staffing_member = labels(staffing_best_parts)
    out["staffing_rebuild"] = {
        "nodes": staffing_giant.number_of_nodes(), "edges": staffing_giant.number_of_edges(),
        "modularity_best": round(float(staffing_best_q), 4),
        "communities": len({v for k, v in staffing_member.items()}),
    }
    print("Q0:", out["staffing_rebuild"])

    q1 = question1(rng, lca, staffing_giant, staffing_member, out)
    q2 = question2(rng, lca, staffing_giant, staffing_member, out)
    q3 = question3(lca, out)

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(clean(out), indent=1, default=str) + "\n")

    page = {
        "generated_by": "analysis/week04_beyond.py", "year": YEAR,
        "finding": {
            "q1_same_split_as_vendors": q1["same_split_as_vendors"],
            "q1_ami": q1["ami_with_staffing_partition"], "q1_ami_z_vs_rewired": q1["ami_z_vs_rewired"],
            "q1_ami_rewired_mean": q1["ami_rewired_null_mean"], "q1_ami_rewired_sd": q1["ami_rewired_null_sd"],
            "q1_nmi": q1["nmi_with_staffing_partition"],
            "q2_between_communities_matters": q2["between_communities_matters"],
            "q2_permutation_p": q2["permutation_p"],
            "q2_placing_pooled_ratio": q2["placing_firms_20plus_placed"]["pooled_ratio"],
            "q2_direct_pooled_ratio": q2["direct_firms_20plus_h1b"]["pooled_ratio"],
            "q2_perm_match_rate_20plus_h1b_employers": q2["perm_match_rate_20plus_h1b_employers"],
            "q3_placed_pays_lower_level": q3["placed_pays_lower_level"],
            "q3_odds_ratio": q3["mantel_haenszel_odds_ratio"],
            "q3_odds_ratio_ci95": q3["odds_ratio_ci95"],
        },
        "q1": {k: q1[k] for k in (
            "lawfirm_column_coverage", "distinct_raw_spellings", "distinct_law_firms_after_normalize",
            "spellings_collapsed", "modularity_best", "modularity_z_vs_rewired",
            "nmi_with_staffing_partition", "nmi_shuffle_p", "ami_with_staffing_partition", "ami_shuffle_p",
            "ami_z_vs_rewired", "single_law_firm_filing_share")},
        "q1_top_law_firms": q1["top_law_firms"][:10],
        "q2": {k: q2[k] for k in (
            "placing_firms_20plus_placed", "direct_firms_20plus_h1b", "permutation_p",
            "between_community_variance")},
        "q2_top6_communities": q2["top6_staffing_communities_by_filings"],
        "q3": {k: q3[k] for k in (
            "pw_wage_level_coverage", "crude", "strata_kept_20plus_each_side", "strata_or_above_1_share",
            "mantel_haenszel_odds_ratio", "odds_ratio_ci95", "cmh_p", "breslow_day_p", "wage_ratio_coverage")},
        "q3_top5_soc": q3["top5_soc_by_filings"],
    }
    page = clean(page)
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1) + "\n")
    print(f"wrote {OUT} and {PAGE} in {out['seconds']}s")


if __name__ == "__main__":
    main()
