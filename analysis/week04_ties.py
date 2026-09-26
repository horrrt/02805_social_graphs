"""Week 4, section 7 of the course brief: Weights, strong ties and weak ties.

Reuses the outsourcing firm -> client network from section 3
(week04_staffing.py): one edge per (case, client), weight = filings. Section 3
already found that the heaviest links there tend to cross communities
(main.modularity.weights_check); this script asks the brief's own questions of
that network, plus one about a second network (H-1B filings and PERM green-card
filings, per employer).

Questions
- Is a PERM filing a strong tie? Employers who sponsor more H-1Bs file more
  green cards too, but placing firms (>=50% of their H-1B filings put a worker
  at a client) sponsor far fewer green cards per H-1B than direct employers do.
- In the staffing network, does a node's strength (filings) track its degree
  (partners), or do a few heavy links inflate strength without adding reach?
- The weak-ties hypothesis (Granovetter 1973, tested by Onnela et al. 2007
  on a phone-call network): do heavy links sit inside dense neighbourhoods
  and light links bridge them? Here, "dense neighbourhood" is a bipartite
  overlap: the share of a link's other possible 4-cycles that are actually
  wired.
- Does a firm's or a client's pay level explain which community it lands in?

Checks
- PERM join: the share of certified PERM filings whose (name, FEIN) key lands
  on a known H-1B employer, and on one with 20 or more certified H-1B filings
  that year. A silent join miss would sink the Spearman without an error.
- The kind split (placing vs direct) and the >=20-filing employer set are
  exactly uscis_outcomes()'s in week04_staffing.py, so the same firms mean the
  same thing in both scripts.
- The bipartite overlap formula (q = links between N(c)\\{f} and N(f)\\{c},
  O = q / ((k_f-1)(k_c-1))) is checked two ways: brute force with neighbour
  sets on a toy graph (K3,3, where O = 1 on every link, plus a separate
  isolated pair, an undefined link), and brute force against the sparse-matrix
  formula on 200 random real links.
- The weight-shuffle null keeps the wiring (and so every overlap value) fixed
  and only reshuffles which link got which filing count, so its Spearman
  distribution isolates chance association from a real one.
- Communities are the best of 100 weighted Louvain runs (seeds SEED+i, as in
  week04_staffing.py); the modularity spread is reported here for this year's
  giant component, but the score against a rewired null is week04_staffing's
  and is not repeated.
- Eta squared for wage level against community is checked against 1000
  shuffles of the community label among only the scored (non-missing-wage)
  nodes, which keeps community sizes fixed.

Caveat: a weight-shuffle null breaks the link between weight and degree too.
Heavy links tend to sit on high-degree firms, and a high degree makes the
overlap denominator (k_f-1)(k_c-1) large, so part of any negative
weight-overlap correlation could be a degree effect rather than a Granovetter
effect; this script does not try to separate the two.

Main year FY2025; section 1 (PERM) and section 3 (weak ties) repeat on FY2024,
shorter. Section 2 (strength vs degree) and section 4 (wage) are FY2025 only.

Output: analysis/week04_ties.json
"""

import json
import random
import time
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from scipy import stats
from scipy.sparse import csr_matrix

from week04_data import load
from week04_staffing import (
    MIN_FILINGS, SEED, certified, giant_of, graph, louvain, placements,
    resolver, span, tracked,
)

OUT = Path(__file__).with_suffix(".json")
MAIN = 2025
SECOND = 2024
RUNS = 100
NULL_RUNS = 100
LARGE_FILINGS = 100      # "large employer" for the ratio exceptions
NEAR_ZERO_RATIO = 0.5    # PERM per 100 H-1B filings, for the near-zero exceptions
WAGE_LEVEL = {"I": 1, "II": 2, "III": 3, "IV": 4}


# --- Section 1: PERM as the strong tie ----------------------------------

def perm_employers(year):
    """Certified PERM filings, keyed by the same resolver as the H-1B side.
    FY2024 spells the status "Certified-Expired"; FY2025 "Certified - Expired".
    Both count: a job that already got its green card is not a weaker tie."""
    perm = load(f"perm_fy{year}")
    counts = perm["CASE_STATUS"].value_counts().to_dict()
    norm = perm["CASE_STATUS"].str.replace(" ", "", regex=False).str.upper()
    used = norm.isin({"CERTIFIED", "CERTIFIED-EXPIRED"})
    perm = perm[used].copy()
    fein = perm["EMP_FEIN"] if "EMP_FEIN" in perm else pd.Series("", index=perm.index)
    perm["employer"] = [resolver().employer(n, f) for n, f in zip(perm["EMP_BUSINESS_NAME"], fein)]
    return perm, counts


def h1b_employers(lca):
    """One row per employer: certified H-1B filings, the placed share, and its
    kind (placing/direct) -- the same rule as week04_staffing.uscis_outcomes()."""
    placed = lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
    firms = lca.assign(placed=placed).groupby("employer").agg(filings=("placed", "size"), placed=("placed", "sum"))
    firms["kind"] = np.where(firms["placed"] / firms["filings"] >= 0.5, "placing", "direct")
    firms["label"] = [resolver().label(k) for k in firms.index]
    return firms


def pooled_ratio(frame):
    return 100 * frame["perm"].sum() / frame["filings"].sum()


def kind_permutation_test(frame, rng, times=1000):
    """Shuffle the placing/direct label across employers, filings and PERM
    counts fixed; the share of shuffles whose pooled-ratio gap matches or
    beats the real one."""
    observed = pooled_ratio(frame[frame["kind"] == "placing"]) - pooled_ratio(frame[frame["kind"] == "direct"])
    kind = frame["kind"].to_numpy().copy()
    filings = frame["filings"].to_numpy()
    perm = frame["perm"].to_numpy()
    beats = 0
    for _ in range(times):
        rng.shuffle(kind)
        placing = kind == "placing"
        gap = (100 * perm[placing].sum() / filings[placing].sum()
               - 100 * perm[~placing].sum() / filings[~placing].sum())
        beats += abs(gap) >= abs(observed)
    return float(observed), (beats + 1) / (times + 1)


def perm_ties(year, lca, rng, full=True):
    perm, status_counts = perm_employers(year)
    firms = h1b_employers(lca)
    perm_counts = perm.groupby("employer").size()
    firms = firms.assign(perm=perm_counts.reindex(firms.index, fill_value=0).astype(int))

    landed_h1b = perm["employer"].isin(lca["employer"].unique())
    landed_min20 = perm["employer"].isin(firms[firms["filings"] >= MIN_FILINGS].index)

    big = firms[firms["filings"] >= MIN_FILINGS]
    rho, p = stats.spearmanr(big["filings"], big["perm"])

    diff, perm_p = kind_permutation_test(big, rng)
    out = {
        "year": year,
        "case_status_counts": {str(k): int(v) for k, v in status_counts.items()},
        "certified_statuses_used": ["Certified", "Certified-Expired (either spacing)"],
        "certified_perm_filings": int(len(perm)),
        "perm_join_landed_on_h1b_employer_share": round(float(landed_h1b.mean()), 4),
        "perm_join_landed_on_min20_employer_share": round(float(landed_min20.mean()), 4),
        "h1b_employers_min20_filings": int(len(big)),
        "spearman_h1b_vs_perm_filings": {"rho": round(float(rho), 3), "p": round(float(p), 4), "n": int(len(big))},
        "placing": {"employers": int((big["kind"] == "placing").sum()),
                    "h1b_filings": int(big.loc[big["kind"] == "placing", "filings"].sum()),
                    "perm_filings": int(big.loc[big["kind"] == "placing", "perm"].sum()),
                    "perm_per_100_h1b": round(float(pooled_ratio(big[big["kind"] == "placing"])), 3)},
        "direct": {"employers": int((big["kind"] == "direct").sum()),
                   "h1b_filings": int(big.loc[big["kind"] == "direct", "filings"].sum()),
                   "perm_filings": int(big.loc[big["kind"] == "direct", "perm"].sum()),
                   "perm_per_100_h1b": round(float(pooled_ratio(big[big["kind"] == "direct"])), 3)},
        "kind_permutation_test": {"observed_gap_per_100": round(diff, 3), "shuffles": 1000, "p": round(perm_p, 4)},
    }
    if not full:
        return out

    big = big.assign(perm_per_100=100 * big["perm"] / big["filings"])
    top = lambda kind: [
        {"employer": r["label"], "h1b_filings": int(r["filings"]), "perm_filings": int(r["perm"]),
         "perm_per_100_h1b": round(float(r["perm_per_100"]), 2)}
        for _, r in big[big["kind"] == kind].sort_values("filings", ascending=False).head(15).iterrows()]
    out["top_placing_by_h1b"] = top("placing")
    out["top_direct_by_h1b"] = top("direct")

    ranked = big.sort_values("filings", ascending=False)
    near_zero = ranked[ranked["perm_per_100"] < NEAR_ZERO_RATIO].head(5)
    large = big[big["filings"] >= LARGE_FILINGS].sort_values("perm_per_100", ascending=False).head(5)
    out["exceptions"] = {
        "large_filings_threshold": LARGE_FILINGS, "near_zero_ratio_threshold": NEAR_ZERO_RATIO,
        "big_h1b_near_zero_perm": [
            {"employer": r["label"], "h1b_filings": int(r["filings"]), "perm_filings": int(r["perm"])}
            for _, r in near_zero.iterrows()],
        "highest_ratio_large_employers": [
            {"employer": r["label"], "h1b_filings": int(r["filings"]), "perm_filings": int(r["perm"]),
             "perm_per_100_h1b": round(float(r["perm_per_100"]), 2)}
            for _, r in large.iterrows()],
    }
    return out


# --- Section 2: strength vs degree in the staffing network --------------

def strength_vs_degree(giant):
    firms = [n for n in giant if n[0] == "F"]
    clients = [n for n in giant if n[0] == "C"]

    def side(nodes):
        degree = np.array([giant.degree(n) for n in nodes])
        strength = np.array([giant.degree(n, weight="weight") for n in nodes])
        rho, p = stats.spearmanr(degree, strength)
        # Average ranks (ties are heavy: most clients have degree 1); rank 1 = largest.
        degree_rank = stats.rankdata(-degree, method="average")
        strength_rank = stats.rankdata(-strength, method="average")
        gap = degree_rank - strength_rank  # positive: strength ranks better than degree
        label = lambda n: resolver().label(n[1])
        order = sorted(range(len(nodes)), key=lambda i: (-gap[i], label(nodes[i])))

        def pick(idxs):
            return [{"label": label(nodes[i]), "degree": int(degree[i]), "strength": int(strength[i]),
                     "degree_rank": int(degree_rank[i]), "strength_rank": int(strength_rank[i])}
                    for i in idxs]
        return {
            "n": len(nodes), "spearman": {"rho": round(float(rho), 3), "p": round(float(p), 4)},
            "high_strength_low_degree": pick(order[:5]),
            "high_degree_low_strength": pick(order[-5:][::-1]),
        }

    return {"firms": side(firms), "clients": side(clients)}


# --- Section 3: the weak-ties test (Onnela et al. 2007, bipartite) ------

def biadjacency(giant):
    """(firm list, client list, sparse binary firm x client matrix, edge arrays)."""
    firms = sorted(n for n in giant if n[0] == "F")
    clients = sorted(n for n in giant if n[0] == "C")
    fi = {n: i for i, n in enumerate(firms)}
    ci = {n: i for i, n in enumerate(clients)}
    rows, cols, weights = [], [], []
    for u, v, w in giant.edges(data="weight"):
        f, c = (u, v) if u[0] == "F" else (v, u)
        rows.append(fi[f]); cols.append(ci[c]); weights.append(w)
    rows, cols, weights = map(np.array, (rows, cols, weights))
    B = csr_matrix((np.ones(len(rows), dtype=np.int64), (rows, cols)), shape=(len(firms), len(clients)))
    return firms, clients, B, rows, cols, weights


def overlaps(B, rows, cols):
    """O = q / ((k_f-1)(k_c-1)) at every (row, col) edge; None where k_f or
    k_c is 1. q[f,c] = (B B^T B)[f,c] - k_f - k_c + 1, computed only at the
    edges (single-vendor clients, k_c=1, are undefined and excluded, which is
    most of the network, so this stays small)."""
    kf = np.asarray(B.sum(axis=1)).ravel()
    kc = np.asarray(B.sum(axis=0)).ravel()
    defined = (kf[rows] > 1) & (kc[cols] > 1)
    M = (B @ B.T).tocsr()  # firms x firms: shared-client counts
    Bt = B.T.tocsr()
    r, c = rows[defined], cols[defined]
    # Row-wise dot of M's rows at r with B's columns at c, vectorised (no python loop).
    q = np.asarray(M[r].multiply(Bt[c]).sum(axis=1)).ravel() - kf[r] - kc[c] + 1
    o = np.full(len(rows), np.nan)
    o[defined] = q / ((kf[r] - 1) * (kc[c] - 1))
    return o, defined, kf, kc


def brute_overlap(g, f, c):
    """The same quantity by neighbour sets, no matrix in sight."""
    kf, kc = g.degree(f), g.degree(c)
    if kf <= 1 or kc <= 1:
        return None
    nf = set(g[f]); nf.discard(c)
    nc = set(g[c]); nc.discard(f)
    q = sum(1 for cc in nf for ff in nc if g.has_edge(ff, cc))
    return q / ((kf - 1) * (kc - 1))


def check_overlap(giant, rng):
    """Toy graph (K3,3, every link's O = 1, plus a separate pendant pair not
    touching those nodes, so one link is undefined) by neighbour sets; then
    200 random real links, matrix against neighbour sets."""
    g = nx.Graph()
    for i in range(3):
        for j in range(3):
            g.add_edge(("F", i), ("C", j), weight=1)
    g.add_edge(("F", 99), ("C", 99), weight=1)  # isolated pair: k_f = k_c = 1, undefined
    for i in range(3):
        for j in range(3):
            assert abs(brute_overlap(g, ("F", i), ("C", j)) - 1.0) < 1e-12
    assert brute_overlap(g, ("F", 99), ("C", 99)) is None

    firms, clients, B, rows, cols, weights = biadjacency(giant)
    o, defined, *_ = overlaps(B, rows, cols)
    edges = list(zip(rows, cols))
    sample = rng.sample(range(len(edges)), min(200, len(edges)))
    for i in sample:
        f, c = firms[rows[i]], clients[cols[i]]
        bf = brute_overlap(giant, f, c)
        if bf is None:
            assert not defined[i]
        else:
            assert abs(bf - o[i]) < 1e-9
    return len(sample)


def overlap_by_bucket(weights, o):
    edges = ["1", "2", "3", "4-5", "6-10", "11-20", "21+"]
    bounds = [(1, 1), (2, 2), (3, 3), (4, 5), (6, 10), (11, 20), (21, None)]
    out = {}
    for label, (lo, hi) in zip(edges, bounds):
        mask = (weights >= lo) & (weights <= hi) if hi else (weights >= lo)
        if mask.sum():
            out[label] = {"n": int(mask.sum()), "mean_overlap": round(float(np.nanmean(o[mask])), 4)}
    return out


def weak_ties(year, giant, rng, full=True):
    firms, clients, B, rows, cols, weights = biadjacency(giant)
    o, defined, kf, kc = overlaps(B, rows, cols)
    total_weight = weights.sum()
    undefined_share = weights[~defined].sum() / total_weight

    rho, p = stats.spearmanr(weights[defined], o[defined])
    null_rhos = []
    for _ in tracked(f"FY{year} weak-ties null", NULL_RUNS):
        shuffled = rng.permutation(weights[defined])
        null_rhos.append(stats.spearmanr(shuffled, o[defined])[0])
    null_rhos = np.array(null_rhos)
    z = (rho - null_rhos.mean()) / null_rhos.std()

    runs = [louvain(giant, SEED + i) for i in tracked(f"FY{year} weighted Louvain", RUNS)]
    qs = np.array([q for _, q in runs])
    best_parts = max(runs, key=lambda r: r[1])[0]
    member = {n: i for i, part in enumerate(best_parts) for n in part}
    inside = np.array([member[firms[f]] == member[clients[c]] for f, c in zip(rows[defined], cols[defined])])
    mean_in, mean_out = float(np.nanmean(o[defined][inside])), float(np.nanmean(o[defined][~inside]))

    out = {
        "year": year, "giant_nodes": giant.number_of_nodes(), "giant_edges": giant.number_of_edges(),
        "undefined_links": int((~defined).sum()), "undefined_links_filing_share": round(float(undefined_share), 4),
        "defined_links": int(defined.sum()),
        "spearman_weight_overlap": {"rho": round(float(rho), 3), "p": round(float(p), 4), "n": int(defined.sum())},
        "weight_shuffle_null": {"runs": NULL_RUNS, "mean_rho": round(float(null_rhos.mean()), 4),
                                 "sd_rho": round(float(null_rhos.std()), 4), "z": round(float(z), 2),
                                 "p_two_sided": round(float((np.abs(null_rhos - null_rhos.mean())
                                                             >= abs(rho - null_rhos.mean())).mean()), 4)},
        "louvain": {"runs": RUNS, "modularity_min": round(float(qs.min()), 4),
                    "modularity_median": round(float(np.median(qs)), 4), "modularity_max": round(float(qs.max()), 4),
                    "communities_median": int(np.median([len(p) for p, _ in runs])),
                    "note": "modularity vs the rewired null is week04_staffing.json's main.modularity"},
        "overlap_inside_vs_across_community": {
            "mean_overlap_inside": round(mean_in, 4), "mean_overlap_across": round(mean_out, 4),
            "n_inside": int(inside.sum()), "n_across": int((~inside).sum()),
            "direction": "higher overlap inside communities" if mean_in > mean_out else "higher overlap across communities"},
        # The weak-ties hypothesis says heavier links should be the more
        # overlapping ones; here rho is negative, so it goes the other way.
        "weight_overlap_direction": "negative: heavier links sit in less overlapping neighbourhoods" if rho < 0
            else "positive: heavier links sit in more overlapping neighbourhoods",
    }
    if full:
        out["overlap_by_weight_bucket"] = overlap_by_bucket(weights[defined], o[defined])
    return out, member if full else None


# --- Section 4: wage level as a node attribute ---------------------------

def wage_scores(lca, rows):
    lca = lca.assign(level=lca["PW_WAGE_LEVEL"].map(WAGE_LEVEL))
    missing_share = round(float(lca["level"].isna().mean()), 4)
    firm_scores = lca.dropna(subset=["level"]).groupby("employer")["level"].mean()

    reached = rows.merge(lca[["CASE_NUMBER", "level"]], on="CASE_NUMBER")
    client_scores = reached.dropna(subset=["level"]).groupby("client")["level"].mean()
    return firm_scores, client_scores, missing_share


def eta_squared(scores, member_of, rng, times=1000):
    """Between-community share of variance in scores, one row per node
    (unweighted); a permutation p-value from shuffling community labels among
    the scored nodes only, so community sizes stay fixed."""
    nodes = [n for n in scores.index if n in member_of]
    values = scores.loc[nodes].to_numpy()
    labels = np.array([member_of[n] for n in nodes])
    total_ss = ((values - values.mean()) ** 2).sum()

    def eta(labels_):
        between = 0.0
        for lab in np.unique(labels_):
            v = values[labels_ == lab]
            between += len(v) * (v.mean() - values.mean()) ** 2
        return between / total_ss if total_ss else 0.0

    observed = eta(labels)
    shuffled = labels.copy()
    beats = 0
    for _ in range(times):
        rng.shuffle(shuffled)
        beats += eta(shuffled) >= observed
    return {"n": len(nodes), "eta_squared": round(float(observed), 4),
            "shuffles": times, "p": round((beats + 1) / (times + 1), 4)}


def wage_analysis(lca, rows, giant, member, big_h1b, rng):
    firm_scores, client_scores, missing_share = wage_scores(lca, rows)
    firm_member = {k[1]: v for k, v in member.items() if k[0] == "F"}
    client_member = {k[1]: v for k, v in member.items() if k[0] == "C"}

    dist = {}
    lca_level = lca.assign(level=lca["PW_WAGE_LEVEL"].map(WAGE_LEVEL))
    joined = lca_level.merge(big_h1b[["kind"]], left_on="employer", right_index=True, how="inner")
    for kind in ("placing", "direct"):
        counts = joined.loc[joined["kind"] == kind, "level"].value_counts(normalize=True, dropna=True)
        dist[kind] = {str(int(v)): round(float(counts.get(v, 0.0)), 4) for v in (1, 2, 3, 4)}

    return {
        "wage_level_map": WAGE_LEVEL, "missing_share_filings": missing_share,
        "eta_squared_firms": eta_squared(firm_scores, firm_member, rng),
        "eta_squared_clients": eta_squared(client_scores, client_member, rng),
        "wage_distribution_placing_vs_direct_filings": dist,
    }


def main():
    started = time.time()
    rng = np.random.default_rng(SEED)
    py_rng = random.Random(SEED)

    out = {"generated_by": "analysis/week04_ties.py", "seed": SEED,
           "constants": {"min_filings": MIN_FILINGS, "large_filings": LARGE_FILINGS,
                          "near_zero_ratio": NEAR_ZERO_RATIO, "runs": RUNS, "null_runs": NULL_RUNS}}

    lca_main = certified(MAIN)
    lca_second = certified(SECOND)
    out["perm_ties"] = {
        MAIN: perm_ties(MAIN, lca_main, py_rng, full=True),
        SECOND: perm_ties(SECOND, lca_second, py_rng, full=False),
    }
    print(f"PERM ties FY{MAIN}: rho={out['perm_ties'][MAIN]['spearman_h1b_vs_perm_filings']}", flush=True)

    rows_main, *_ = placements(MAIN, lca_main)
    g_main = graph(rows_main)
    giant_main = giant_of(g_main)
    out["strength_vs_degree"] = strength_vs_degree(giant_main)
    print("strength vs degree:", {k: v["spearman"] for k, v in out["strength_vs_degree"].items()}, flush=True)

    checked = check_overlap(giant_main, py_rng)
    out["overlap_formula_check"] = {"toy_graph": "ok", "real_links_checked": checked}

    weak_main, member_main = weak_ties(MAIN, giant_main, rng, full=True)
    rows_second, *_ = placements(SECOND, lca_second)
    giant_second = giant_of(graph(rows_second))
    weak_second, _ = weak_ties(SECOND, giant_second, rng, full=False)
    out["weak_ties"] = {MAIN: weak_main, SECOND: weak_second}
    print(f"weak ties FY{MAIN}: {weak_main['spearman_weight_overlap']}, {weak_main['weight_overlap_direction']}", flush=True)

    big_h1b = h1b_employers(lca_main)
    big_h1b = big_h1b[big_h1b["filings"] >= MIN_FILINGS]
    out["wage"] = wage_analysis(lca_main, rows_main, giant_main, member_main, big_h1b, rng)
    print("wage eta squared:", {k: out["wage"][k] for k in ("eta_squared_firms", "eta_squared_clients")}, flush=True)

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"done in {span(out['seconds'])} -> {OUT}", flush=True)


if __name__ == "__main__":
    main()
