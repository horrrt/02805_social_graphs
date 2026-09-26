"""Week 4, section 7: an H-1B filing is a weak tie, a green card a strong one.  Owner: Gyula.

Network: an H-1B labour condition application (LCA) is a weak tie between an
employer and a worker, renewed every few years and easy to end. A PERM labour
certification, the first step of a green card, is a strong one: the
employer is committing to keep the worker for good. The brief (week 4 section
7) asks to compare degree with strength and name the exceptions; here degree
is how many H-1B filings an employer runs, strength is how many of its workers
it turns into strong ties.

Questions
- Which employers turn H-1B filings into green-card sponsorships, and at what
  rate?
- Do outsourcing firms that place workers at clients (week04_staffing.py,
  week04_lottery.py's "placing" firms) convert less than firms that hire
  directly?
- Does converting more depend on filing more, or are the biggest H-1B filers
  and the best green-card sponsors different companies?
- In the firm-client staffing network, do firms with many clients sponsor
  fewer green cards, consistent with a staffing firm's business being
  placement, not permanence?
- Do clients lean on vendors for H-1B labour while sponsoring green cards for
  their own staff?

Employers are keyed exactly as in week04_staffing.py: resolver().employer(name,
fein) for the LCA side; PERM's EMP_BUSINESS_NAME and EMP_FEIN keyed the same
way. Only employers with MIN_FILINGS (20) or more certified LCA filings that
year are scored on a PERM ratio: a company with three LCAs and one PERM
looks like a perfect sponsor for the wrong reason.

Checks
- PERM's CASE_STATUS spells "Certified-Expired" without a space in FY2024 and
  "Certified - Expired" with one in FY2025; both count as certified, matched
  after collapsing the spacing.
- The share of PERM filings whose employer key matches an LCA employer that
  year, so a low match rate would flag a keying problem rather than a
  business finding. Checked two ways: by resolver key, and by raw tax number
  (fein_of on both sides), since a keying bug and a genuine absence of H-1B
  filings behind a green card would otherwise look the same.
- The placing/direct gap: pooled PERM-per-100-LCA ratio for each kind
  (week04_lottery.kinds), and a label-permutation test (1,000 shuffles,
  random.Random(SEED)) of whether the pooled gap is bigger than reassigning
  "placing" and "direct" to the same employers at random.
- Spearman's rho between LCA filings and PERM filings over the scored
  employers, plus the brief-style named exceptions: among employers with 500
  or more LCA filings, the 8 with the lowest and the 8 with the highest PERM
  ratio, each beside its top PERM occupation (PWD_SOC_TITLE), since PERM
  counts include workers who were never on H-1B (an EB-3 nurse, say) and
  CLASS_OF_ADMISSION is blocked as a personal column.
- Spearman's rho between a firm's client count in the FY2025 staffing network
  and its PERM ratio.
- The 15 clients receiving the most placed filings: how many filings vendors
  place there, against the client's own certified LCA and PERM filings under
  its own name.

Output: analysis/week04_perm.json
"""

import json
import random
import time
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import spearmanr

from week04_data import load
from week04_lottery import kinds
from week04_names import fein_of
from week04_staffing import MIN_FILINGS, SEED, certified, graph, placements, resolver

OUT = Path(__file__).with_suffix(".json")
YEARS = [2024, 2025]
MAIN = 2025
PERMUTATIONS = 1000
TOP_CLIENTS = {2025: 15, 2024: 5}
TOP_EXCEPTIONS = {2025: 8, 2024: 4}
BIG_LCA_FILINGS = 500  # the threshold for "among employers with >= 500 LCA filings"


def perm_certified(year):
    """Certified PERM filings, keyed like certified() keys LCAs. "Certified" and
    "Certified-Expired" both count; the form spells the second one with a space
    in some years and without in others."""
    perm = load(f"perm_fy{year}")
    status = perm["CASE_STATUS"].str.upper().str.replace(r"\s*-\s*", "-", regex=True)
    cert = perm[status.isin({"CERTIFIED", "CERTIFIED-EXPIRED"})].copy()
    fein = perm["EMP_FEIN"] if "EMP_FEIN" in perm else pd.Series("", index=perm.index)
    cert["employer"] = [resolver().employer(n, f) for n, f in
                         zip(cert["EMP_BUSINESS_NAME"], fein[cert.index])]
    return cert


def employer_table(lca, perm, min_filings=MIN_FILINGS):
    """One row per employer with min_filings or more certified LCA filings that
    year: its LCA filings, PERM filings, and green cards per 100 H-1B filings."""
    lca_counts = lca.groupby("employer").size()
    firms = lca_counts[lca_counts >= min_filings]
    perm_counts = perm.groupby("employer").size()
    frame = pd.DataFrame({"lca_filings": firms})
    frame["perm_filings"] = perm_counts.reindex(frame.index).fillna(0).astype(int)
    frame["ratio"] = 100 * frame["perm_filings"] / frame["lca_filings"]
    return frame


def pooled_ratio(frame, mask):
    return 100 * frame.loc[mask, "perm_filings"].sum() / frame.loc[mask, "lca_filings"].sum()


def kind_gap_test(frame, rng, times=PERMUTATIONS):
    """Pooled PERM-per-100-filings for placing vs direct employers, and the share
    of label permutations (kind reassigned across the same employers) whose
    pooled gap matches or beats the observed one."""
    placing = (frame["kind"] == "placing").to_numpy()
    observed_placing = pooled_ratio(frame, placing)
    observed_direct = pooled_ratio(frame, ~placing)
    observed_gap = observed_direct - observed_placing
    idx = list(range(len(placing)))
    beats = 0
    for _ in range(times):
        rng.shuffle(idx)
        shuffled = placing[idx]
        gap = pooled_ratio(frame, ~shuffled) - pooled_ratio(frame, shuffled)
        beats += gap >= observed_gap
    return {
        "placing_pooled_ratio": round(float(observed_placing), 2),
        "direct_pooled_ratio": round(float(observed_direct), 2),
        "observed_gap": round(float(observed_gap), 2),
        "placing_median_ratio": round(float(frame.loc[placing, "ratio"].median()), 2),
        "direct_median_ratio": round(float(frame.loc[~placing, "ratio"].median()), 2),
        "permutations": times,
        "permutations_at_or_above_observed": int(beats),
        "p_gap": round(beats / times, 4),
    }


def top_occupation(perm, key):
    """The PERM occupation title filed most often for one employer, if any."""
    titles = perm.loc[perm["employer"] == key, "PWD_SOC_TITLE"]
    return titles.value_counts().index[0] if len(titles) else None


def first_word(label):
    return next((w for w in label.upper().split() if len(w) >= 4), label.upper())


def by_name(perm, label):
    """Certified PERM filings whose employer name contains the label's first word
    (four letters or more), whatever key they got. A key can miss a green card
    filed by a sister company under another name or tax number ("VERIZON
    COMMUNICATIONS INC AND ALL ITS SUBSIDIARIES"); only an employer whose name
    check is also near zero may be quoted as sponsoring none."""
    return int(perm["EMP_BUSINESS_NAME"].str.upper().str.contains(first_word(label), regex=False).sum())


def named(frame, keys, perm, lca):
    """The same name check on the H-1B side: a high ratio could come from an
    employer whose H-1B filings are split over tax numbers the key missed."""
    lca_names = lca["EMPLOYER_NAME"].str.upper()
    return [{"employer": resolver().label(k), "lca_filings": int(frame.at[k, "lca_filings"]),
             "perm_filings": int(frame.at[k, "perm_filings"]), "ratio": round(float(frame.at[k, "ratio"]), 2),
             "perm_filings_by_name": by_name(perm, resolver().label(k)),
             "lca_filings_by_name": int(lca_names.str.contains(first_word(resolver().label(k)), regex=False).sum()),
             "top_perm_occupation": top_occupation(perm, k)}
            for k in keys]


def fein_check(lca, perm):
    """Employer keys can mismatch for two reasons: a real absence of matching
    H-1B filings, or a keying bug. Checked a second way, by raw tax number
    alone, so the two can be told apart."""
    lca_feins = set(lca["EMPLOYER_FEIN"].map(fein_of)) - {""}
    perm_fein = perm["EMP_FEIN"].map(fein_of)
    return {
        "perm_fein_parse_rate": round(float((perm_fein != "").mean()), 4),
        "sample_raw_perm_feins": perm["EMP_FEIN"].head(5).tolist(),
        "perm_fein_in_lca_feins_share": round(float(perm_fein.isin(lca_feins).mean()), 4),
    }


def year_block(year, rng, main):
    lca = certified(year)
    perm = perm_certified(year)
    match_share = perm["employer"].isin(lca["employer"]).mean()
    fein_diag = fein_check(lca, perm)

    frame = employer_table(lca, perm)
    frame["kind"] = kinds(year).reindex(frame.index)
    scored = frame.dropna(subset=["kind"])

    rho, rho_p = spearmanr(scored["lca_filings"], scored["perm_filings"])
    n_top = TOP_EXCEPTIONS[year]
    big = scored[scored["lca_filings"] >= BIG_LCA_FILINGS]
    # The named exceptions: among the big filers, the lowest and the highest
    # PERM ratio. Ties (many sit at ratio 0) break on more LCA filings, so the
    # "lowest ratio" list is also the "most LCA filings" one the brief asks for.
    lowest_ratio = big.sort_values(["ratio", "lca_filings"], ascending=[True, False]).head(n_top)
    best_ratio = big.sort_values("ratio", ascending=False).head(n_top)

    # Section 5 · clients: who receives the placed filings, and does the client
    # sponsor its own green cards while vendors supply the H-1B workers?
    rows, *_ = placements(year, lca)
    totals = rows.groupby("client").size().sort_values(ascending=False)
    lca_own = lca.groupby("employer").size()
    perm_own = perm.groupby("employer").size()
    top_clients = [
        {"client": resolver().label(c), "placed_filings_from_vendors": int(n),
         "own_certified_lca_filings": int(lca_own.get(c, 0)), "own_perm_filings": int(perm_own.get(c, 0))}
        for c, n in totals.head(TOP_CLIENTS[year]).items()
    ]
    # A client with no LCA filings of its own is either a real vendor-only
    # buyer, or a client whose name keys differently as an employer; checked
    # by name, since the two keys can legitimately differ.
    zero_own = [row["client"] for row in top_clients if row["own_certified_lca_filings"] == 0]
    name_hits = {name: int(lca["EMPLOYER_NAME"].str.contains(name.split()[0], case=False, na=False).sum())
                 for name in zero_own}

    result = {
        "year": year,
        "certified_lca_filings": int(len(lca)),
        "certified_perm_filings": int(len(perm)),
        "perm_employer_key_matches_lca_share": round(float(match_share), 4),
        "fein_check": fein_diag,
        "employers_scored": int(len(scored)),  # >= MIN_FILINGS certified LCA filings, kind known
        "min_filings": MIN_FILINGS,
        "kind_gap": kind_gap_test(scored, rng),
        "lca_vs_perm_filings": {"spearman_rho": round(float(rho), 3), "p": round(float(rho_p), 4)},
        "scored_median_ratio": round(float(scored["ratio"].median()), 2),
        "big_filers": {"threshold": BIG_LCA_FILINGS, "employers": int(len(big))},
        "lowest_ratio_among_big_filers": named(lowest_ratio, lowest_ratio.index, perm, lca),
        "highest_ratio_among_big_filers": named(best_ratio, best_ratio.index, perm, lca),
        "top_clients": top_clients,
        "zero_own_lca_clients_name_check": name_hits,
    }

    if main:
        # Section 4 · network angle: firms with many clients, in the FY2025
        # firm-client staffing network, sponsor fewer green cards?
        g = graph(rows)
        client_degree = pd.Series({k: g.degree(("F", k)) for k in scored.index if ("F", k) in g})
        joined = scored.loc[client_degree.index]
        net_rho, net_p = spearmanr(client_degree, joined["ratio"])
        result["client_degree_vs_ratio"] = {
            "firms_in_network_and_scored": int(len(client_degree)),
            "spearman_rho": round(float(net_rho), 3), "p": round(float(net_p), 4),
        }
    return result


def main():
    started = time.time()
    rng = random.Random(SEED)
    out = {"generated_by": "analysis/week04_perm.py", "main_year": MAIN, "years": {}}
    for year in YEARS:
        block = year_block(year, rng, main=(year == MAIN))
        out["years"][year] = block
        print(f"FY{year}: {block['certified_lca_filings']:,} certified LCAs, "
              f"{block['certified_perm_filings']:,} certified PERMs, "
              f"{block['perm_employer_key_matches_lca_share']:.1%} key match; "
              f"placing {block['kind_gap']['placing_pooled_ratio']} vs direct "
              f"{block['kind_gap']['direct_pooled_ratio']} per 100 (p={block['kind_gap']['p_gap']}); "
              f"rho={block['lca_vs_perm_filings']['spearman_rho']}", flush=True)
    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")
    print(f"done -> {OUT.name}")


if __name__ == "__main__":
    main()
