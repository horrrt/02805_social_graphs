"""Week 4, pose-question follow-up: which firms drive the section 4 footprint
result, and does it hold up a year earlier?

week04_footprint.py found that dropping the 10 largest filers from the metro
network (Amazon, Cognizant, Google, Microsoft, EY, Meta, Apple, TCS, Deloitte,
Infosys; 18.8% of filings) lifts the Louvain modal partition's AMI against
Census region from 0.06 (full network) to 0.16 -- a random volume-matched
drop of the same size gives 0.00 +/- 0.02. This script asks three follow-up
questions about that result, on the same metro network (the 40 metros with
most FY2025 filings, weighted projection of employer x metro filings, fixed
throughout):

- Step 3, leave one firm out: does any SINGLE one of the 10 do most of the
  work, or does it take the group?
- Step 4, a rank sweep k = 0..20: at what k does the regional signal become
  reliably distinguishable from a volume-matched random cut, and which single
  firm's removal causes the biggest jump?
- Step 5, FY2024: rebuilt on the same 40 metros, does the same turn toward
  Census regions show up a year earlier, with FY2024's own top 10 filers and
  with FY2025's list?

Reuses week04_footprint.py's machinery (import, not copy): project_sparse,
modal_partition, seed_for, matched_draws_deterministic, shuffled_ami, the
forked process pool pattern, and week04_where.py's metro setup
(worksite_metros, the top-40-by-filings ranking, Census region lookup).
Nothing in week04_footprint.py is modified; every seed here is hashed under
its own part name ("rank" for the FY2025 steps, "rank_fy2024" for FY2024), so
no task anywhere in this script or in week04_footprint.py can share a seed by
accident.

Unlike week04_footprint.py's named variants, no modularity null (no rewiring)
is computed here -- steps 3-5 only ask for the modal partition's AMI against
Census region, its NMI against the full network's own modal partition, and
volume-matched controls of those two numbers; the (expensive) degree-
preserving rewiring nulls that score Q are not part of the question. That
keeps each of the roughly 1,100 variant/control tasks down to one sparse
projection plus 100 seeded Louvain runs, run in an 8-worker forked pool as
week04_footprint.py's own nulls and draws are.

Outputs: analysis/week04_footprint_rank.json (every number) and
docs/weeks/week04/data/footprint_rank.json (the shape the page's two new
figures draw).
"""

import json
import multiprocessing as mp
import time
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.metrics import adjusted_mutual_info_score as ami_score
from sklearn.metrics import normalized_mutual_info_score as nmi_score

import week04_footprint as fp
import week04_where as where
from week04_schemas import check
from week04_staffing import resolver

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
PAGE = ROOT / "docs/weeks/week04/data/footprint_rank.json"
YEAR = 2025
OTHER_YEAR = 2024
PART = "rank"           # this script's own seed_for namespace, distinct from footprint.py's "metro"/"jobs"
PART_FY24 = "rank_fy2024"
TOP10 = fp.TOP10         # 10, the same count week04_footprint.py drops
SWEEP_K = 20             # the rank sweep runs k = 0..20
RANK_POOL = 20           # employers ranked for the sweep (>= SWEEP_K)
SINGLE_DRAWS = 50
SWEEP_DRAWS = 20
FY24_DRAWS = 50
RUNS = fp.RUNS
WORKERS = fp.WORKERS

# --- shared state a forked worker inherits at Pool-creation time -----------
_G = {}


def _set_globals(**kwargs):
    global _G
    _G = kwargs


def _variant_task(payload):
    """One drop variant (a named drop or one control draw): project the metro
    network with `dropped` removed, find the modal partition over RUNS seeded
    Louvain runs (as week04_footprint.modal_partition does), and score it
    against Census region and against the full network's own modal partition.
    `need_p` switches on the 1,000-shuffle p-value against region (named
    drops only -- a control draw only needs the plain AMI, since its mean and
    sd over 20-50 peers is what stands in for a null here)."""
    part, variant_key, dropped_list, achieved, need_p = payload
    dropped = set(dropped_list)
    pairs, keep, regions = _G["pairs"], _G["keep"], _G["regions"]
    full_member = _G["full_member"]
    pv = pairs[~pairs["employer"].isin(dropped)] if dropped else pairs
    g = fp.project_sparse(pv, keep)
    seeds_run = [fp.seed_for(part, variant_key, None, "louvain_run", r) for r in range(RUNS)]
    best, member, _, parts_list = fp.modal_partition(g, seeds_run, RUNS)
    found = Counter(frozenset(frozenset(c) for c in p) for p in parts_list)
    modal_key = frozenset(frozenset(c) for c in best)
    nodes = sorted(keep)
    comm = [member[n] for n in nodes]
    region_labels = [regions[n] for n in nodes]
    if need_p:
        region_seed = fp.seed_for(part, variant_key, None, "region_shuffle")
        ami_val, p = fp.shuffled_ami(comm, region_labels, region_seed)
    else:
        ami_val, p = float(ami_score(comm, region_labels)), None
    nmi_full = float(nmi_score([full_member[n] for n in nodes], comm))
    return {
        "variant_key": variant_key,
        "ami_region": round(float(ami_val), 4),
        "p_region": round(p, 4) if p is not None else None,
        "nmi_vs_full": round(nmi_full, 4),
        "communities": len(best),
        "modal_runs": found[modal_key],
        "partitions_found": len(found),
        "achieved": achieved,
    }


def compute_full(pairs, keep, regions, part, variant_key="full"):
    """The full network's own modal partition: the reference every named
    drop and control draw in the same (pairs, keep, part) is compared to.
    Returns (result dict, member dict) -- `member` becomes `full_member` for
    every later _variant_task call on this network."""
    g = fp.project_sparse(pairs, keep)
    seeds_run = [fp.seed_for(part, variant_key, None, "louvain_run", r) for r in range(RUNS)]
    best, member, _, parts_list = fp.modal_partition(g, seeds_run, RUNS)
    found = Counter(frozenset(frozenset(c) for c in p) for p in parts_list)
    modal_key = frozenset(frozenset(c) for c in best)
    nodes = sorted(keep)
    comm = [member[n] for n in nodes]
    region_labels = [regions[n] for n in nodes]
    region_seed = fp.seed_for(part, variant_key, None, "region_shuffle")
    ami_val, p = fp.shuffled_ami(comm, region_labels, region_seed)
    result = {
        "ami_region": round(float(ami_val), 4), "p_region": round(p, 4),
        "nmi_vs_full": 1.0, "communities": len(best),
        "modal_runs": found[modal_key], "partitions_found": len(found),
    }
    return result, member


def run_variants_parallel(pairs, keep, regions, full_member, payloads, label_text):
    _set_globals(pairs=pairs, keep=keep, regions=regions, full_member=full_member)
    started = time.time()
    total = len(payloads)
    results = {}
    with mp.get_context("fork").Pool(processes=WORKERS) as pool:
        for done, res in enumerate(pool.imap_unordered(_variant_task, payloads), 1):
            results[res["variant_key"]] = res
            fp.progress(label_text, done, total, started)
    return results


def summarize(rows, key):
    vals = np.array([r[key] for r in rows], dtype=float)
    return round(float(vals.mean()), 4), round(float(vals.std()), 4)


# --- step 3: leave one firm out ---------------------------------------------

def single_payloads(pairs, keep, by_employer, top10):
    named = [(PART, f"single:{e}", [e], int(by_employer[e]), True) for e in top10]
    controls = []
    for e in top10:
        draws = fp.matched_draws_deterministic(
            pairs, keep, {e}, int(by_employer[e]), SINGLE_DRAWS, PART, f"single_control:{e}")
        controls += [(PART, f"single_control:{e}:{i}", sorted(dropped), achieved, False)
                     for i, (dropped, achieved) in enumerate(draws)]
    return named, controls


def build_single(pairs, keep, regions, by_employer, total_in_top, top10, full_member):
    named, controls = single_payloads(pairs, keep, by_employer, top10)
    results = run_variants_parallel(pairs, keep, regions, full_member, named + controls,
                                     "single-firm drops")
    rows = []
    for e in top10:
        n = results[f"single:{e}"]
        ctrl = [results[f"single_control:{e}:{i}"] for i in range(SINGLE_DRAWS)]
        control_ami_mean, control_ami_sd = summarize(ctrl, "ami_region")
        control_nmi_mean, control_nmi_sd = summarize(ctrl, "nmi_vs_full")
        rows.append({
            "firm": resolver().label(e),
            "filings_removed_share": round(n["achieved"] / total_in_top, 4),
            "ami_region": n["ami_region"], "p_region": n["p_region"],
            "nmi_vs_full": n["nmi_vs_full"], "communities": n["communities"],
            "modal_runs": n["modal_runs"], "partitions_found": n["partitions_found"],
            "control_ami_mean": control_ami_mean, "control_ami_sd": control_ami_sd,
            "control_nmi_mean": control_nmi_mean, "control_nmi_sd": control_nmi_sd,
            "ami_vs_control_sd": fp.vs_control_sd(n["ami_region"], control_ami_mean, control_ami_sd),
        })
    return rows


# --- step 4: rank sweep ------------------------------------------------------

def sweep_payloads(pairs, keep, by_employer, ranked):
    named, controls = [], []
    for k in range(SWEEP_K + 1):
        dropped = ranked[:k]
        achieved = int(by_employer[by_employer.index.isin(dropped)].sum()) if dropped else 0
        named.append((PART, f"sweep:k{k}", dropped, achieved, True))
        draws = fp.matched_draws_deterministic(
            pairs, keep, set(dropped), achieved, SWEEP_DRAWS, PART, f"sweep_control:k{k}")
        controls += [(PART, f"sweep_control:k{k}:{i}", sorted(d), a, False)
                     for i, (d, a) in enumerate(draws)]
    return named, controls


def build_sweep(pairs, keep, regions, by_employer, total_in_top, ranked, full_member):
    named, controls = sweep_payloads(pairs, keep, by_employer, ranked)
    results = run_variants_parallel(pairs, keep, regions, full_member, named + controls,
                                     "rank sweep")
    rows = []
    for k in range(SWEEP_K + 1):
        n = results[f"sweep:k{k}"]
        ctrl = [results[f"sweep_control:k{k}:{i}"] for i in range(SWEEP_DRAWS)]
        control_ami_mean, control_ami_sd = summarize(ctrl, "ami_region")
        rows.append({
            "k": k, "added": [resolver().label(ranked[k - 1])] if k else [],
            "filings_removed_share": round(n["achieved"] / total_in_top, 4),
            "ami_region": n["ami_region"], "p_region": n["p_region"],
            "nmi_vs_full": n["nmi_vs_full"], "communities": n["communities"],
            "modal_runs": n["modal_runs"], "partitions_found": n["partitions_found"],
            "control_ami_mean": control_ami_mean, "control_ami_sd": control_ami_sd,
            "ami_vs_control_sd": fp.vs_control_sd(n["ami_region"], control_ami_mean, control_ami_sd),
        })
    return rows


# --- step 5: FY2024 ----------------------------------------------------------

def build_fy2024(lookup, town_lookup, keep, regions, top10_2025):
    sites, _, _ = where.worksite_metros(lookup, town_lookup, OTHER_YEAR)
    per_case = sites.drop_duplicates(["CASE_NUMBER", "metro"])
    pairs = per_case.groupby(["employer", "metro"]).size().rename("filings").reset_index()
    pairs_top = pairs[pairs["metro"].isin(keep)]
    by_employer = pairs_top.groupby("employer")["filings"].sum()
    total_in_top = int(pairs_top["filings"].sum())
    top10_own = list(by_employer.sort_values(ascending=False).head(TOP10).index)

    missing = [e for e in top10_2025 if e not in by_employer.index]
    present_2025_list = [e for e in top10_2025 if e in by_employer.index]
    if missing:
        print(f"FY2024: {len(missing)} of FY2025's top 10 filers are absent from the FY2024 metro "
              f"pairs: {[resolver().label(e) for e in missing]}", flush=True)

    full_res, full_member = compute_full(pairs, keep, regions, PART_FY24, "fy2024_full")

    variants = [
        ("full", "Full network (FY2024)", [], full_res),
        ("drop_fy2024_top10", "Without FY2024's own 10 largest filers", top10_own, None),
        ("drop_fy2025_top10", "Without FY2025's 10 largest filers", present_2025_list, None),
    ]
    named, controls = [], []
    for vid, _, dropped, precomputed in variants:
        if precomputed is not None:
            continue
        achieved = int(by_employer[by_employer.index.isin(dropped)].sum())
        named.append((PART_FY24, vid, dropped, achieved, True))
        draws = fp.matched_draws_deterministic(pairs, keep, set(dropped), achieved, FY24_DRAWS, PART_FY24, vid)
        controls += [(PART_FY24, f"{vid}:ctrl:{i}", sorted(d), a, False) for i, (d, a) in enumerate(draws)]

    results = run_variants_parallel(pairs, keep, regions, full_member, named + controls, "FY2024 drops")

    rows = []
    for vid, label, dropped, precomputed in variants:
        if precomputed is not None:
            rows.append({
                "id": vid, "label": label, "filings_removed_share": 0.0,
                "ami_region": precomputed["ami_region"], "p_region": precomputed["p_region"],
                "nmi_vs_full": precomputed["nmi_vs_full"], "communities": precomputed["communities"],
                "modal_runs": precomputed["modal_runs"], "partitions_found": precomputed["partitions_found"],
                "control_ami_mean": None, "control_ami_sd": None, "ami_vs_control_sd": None,
            })
            continue
        n = results[vid]
        ctrl = [results[f"{vid}:ctrl:{i}"] for i in range(FY24_DRAWS)]
        control_ami_mean, control_ami_sd = summarize(ctrl, "ami_region")
        rows.append({
            "id": vid, "label": label,
            "filings_removed_share": round(n["achieved"] / total_in_top, 4),
            "ami_region": n["ami_region"], "p_region": n["p_region"],
            "nmi_vs_full": n["nmi_vs_full"], "communities": n["communities"],
            "modal_runs": n["modal_runs"], "partitions_found": n["partitions_found"],
            "control_ami_mean": control_ami_mean, "control_ami_sd": control_ami_sd,
            "ami_vs_control_sd": fp.vs_control_sd(n["ami_region"], control_ami_mean, control_ami_sd),
        })
    return rows, {
        "year": OTHER_YEAR, "filings": total_in_top, "top10_own": [resolver().label(e) for e in top10_own],
        "top10_2025_missing": [resolver().label(e) for e in missing],
    }


# --- verdict -----------------------------------------------------------------

def finding(full_ami, single_rows, sweep_rows, fy2024_rows):
    movers = [r for r in single_rows if r["ami_vs_control_sd"] is not None and abs(r["ami_vs_control_sd"]) > 2]
    all10_ami = sweep_rows[TOP10]["ami_region"]  # sweep's k=10 row: the same drop as footprint.py's drop_top10_filings
    span = all10_ami - full_ami
    single_answer = {
        "movers": [{"firm": r["firm"], "ami_region": r["ami_region"], "ami_vs_control_sd": r["ami_vs_control_sd"],
                    "share_of_the_0.16_gap": round((r["ami_region"] - full_ami) / span, 3) if span else None}
                   for r in movers],
        "any_single_firm_beyond_2sd": bool(movers),
        "all10_ami_region": all10_ami,
    }

    z = [r["ami_vs_control_sd"] for r in sweep_rows]
    stable_k = None
    for k in range(SWEEP_K + 1):
        if all(z[kp] is not None and z[kp] > 2 for kp in range(k, SWEEP_K + 1)):
            stable_k = k
            break
    jumps = [(k, sweep_rows[k]["ami_region"] - sweep_rows[k - 1]["ami_region"]) for k in range(1, SWEEP_K + 1)]
    jump_k, jump_delta = max(jumps, key=lambda kd: kd[1])
    sweep_answer = {
        "stable_k": stable_k,
        "stable_k_note": ("never exceeds its control by 2 sd and stays above through k=20"
                           if stable_k is None else
                           f"z > 2 sd from k={stable_k} through k={SWEEP_K} (not tested beyond k={SWEEP_K})"),
        "largest_jump_k": jump_k, "largest_jump_firm": sweep_rows[jump_k]["added"][0],
        "largest_jump_delta_ami": round(jump_delta, 4),
    }

    fy = {r["id"]: r for r in fy2024_rows}
    holds = any(r["id"] != "full" and r["ami_vs_control_sd"] is not None and r["ami_vs_control_sd"] > 2
                for r in fy2024_rows)
    fy2024_answer = {
        "full_ami_region": fy["full"]["ami_region"],
        "drop_fy2024_top10_ami_region": fy["drop_fy2024_top10"]["ami_region"],
        "drop_fy2024_top10_z": fy["drop_fy2024_top10"]["ami_vs_control_sd"],
        "drop_fy2025_top10_ami_region": fy["drop_fy2025_top10"]["ami_region"],
        "drop_fy2025_top10_z": fy["drop_fy2025_top10"]["ami_vs_control_sd"],
        "regional_turn_holds_in_fy2024": holds,
    }

    return {
        "full_ami_region": full_ami,
        "q_single_firm": single_answer,
        "q_rank_sweep": sweep_answer,
        "q_fy2024": fy2024_answer,
    }


# --- page shaping --------------------------------------------------------

def page_single(r):
    keep = ["firm", "filings_removed_share", "ami_region", "p_region", "nmi_vs_full",
            "communities", "control_ami_mean", "control_ami_sd", "ami_vs_control_sd"]
    return {k: r[k] for k in keep}


def page_sweep(r):
    keep = ["k", "added", "filings_removed_share", "ami_region", "p_region", "nmi_vs_full",
            "communities", "control_ami_mean", "control_ami_sd", "ami_vs_control_sd"]
    return {k: r[k] for k in keep}


def page_fy2024(r):
    keep = ["id", "label", "filings_removed_share", "ami_region", "p_region", "nmi_vs_full",
            "communities", "control_ami_mean", "control_ami_sd", "ami_vs_control_sd"]
    return {k: r[k] for k in keep}


def main():
    started = time.time()
    lookup, town_lookup, gaz = where.metros()
    sites, lca, _ = where.worksite_metros(lookup, town_lookup, YEAR)
    per_case = sites.drop_duplicates(["CASE_NUMBER", "metro"])
    pairs = per_case.groupby(["employer", "metro"]).size().rename("filings").reset_index()
    filings = per_case.groupby("metro").size().sort_values(ascending=False)
    keep = list(filings.head(where.TOP).index)  # the same 40 metros week04_footprint.py fixes on
    regions = {m: where.REGION[where.first_state(gaz.loc[m, "NAME"])] for m in keep}

    pairs_top = pairs[pairs["metro"].isin(keep)]
    by_employer = pairs_top.groupby("employer")["filings"].sum()
    total_in_top = int(pairs_top["filings"].sum())
    ranked = list(by_employer.sort_values(ascending=False).head(RANK_POOL).index)
    top10 = ranked[:TOP10]  # same list, same order as week04_footprint.py's drop_top10_filings

    # A timed pilot (one full projection plus 100 seeded Louvain runs, the unit
    # cost every one of the ~1,100 variant/control tasks below pays) before
    # committing to the run, per the brief's "print expected runtime first".
    pilot_started = time.time()
    full_res, full_member = compute_full(pairs, keep, regions, PART, "full")
    unit = time.time() - pilot_started
    n_tasks = ((TOP10 + TOP10 * SINGLE_DRAWS) + ((SWEEP_K + 1) + (SWEEP_K + 1) * SWEEP_DRAWS)
               + (2 + 2 * FY24_DRAWS))  # named + controls, steps 3-5 (fy2024's "full" reuses its own pilot, no task)
    print(f"pilot: one projection + {RUNS} Louvain runs took {unit:.2f}s; about {n_tasks} tasks "
          f"remain, {WORKERS} workers -> roughly {fp.span(n_tasks * unit / WORKERS)}.", flush=True)

    print(f"top10 (same order as week04_footprint.json's drop_top10_filings): "
          f"{[resolver().label(e) for e in top10]}", flush=True)
    if [resolver().label(e) for e in top10] != ['Amazon', 'Cognizant', 'Google', 'Microsoft', 'EY',
                                                  'Meta', 'Apple', 'Tata Consultancy Services', 'Deloitte', 'Infosys']:
        print("warning: top10 ranking differs from week04_footprint.json's drop_top10_filings -- "
              "check the data hasn't moved.", flush=True)

    single_rows = build_single(pairs, keep, regions, by_employer, total_in_top, top10, full_member)
    sweep_rows = build_sweep(pairs, keep, regions, by_employer, total_in_top, ranked, full_member)
    fy2024_rows, fy2024_meta = build_fy2024(lookup, town_lookup, keep, regions, top10)

    verdict = finding(full_res["ami_region"], single_rows, sweep_rows, fy2024_rows)

    seconds = round(time.time() - started)
    out = {
        "generated_by": "analysis/week04_footprint_rank.py", "year": YEAR, "seconds": seconds,
        "top_metros": where.TOP, "total_filings_in_top_metros": total_in_top,
        "ranked_pool": [resolver().label(e) for e in ranked],
        "full": full_res,
        "single": single_rows, "sweep": sweep_rows,
        "fy2024": fy2024_rows, "fy2024_meta": fy2024_meta,
        "finding": verdict,
    }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False, default=str) + "\n")

    page = {
        "generated_by": "analysis/week04_footprint_rank.py", "year": YEAR,
        "single": [page_single(r) for r in single_rows],
        "sweep": [page_sweep(r) for r in sweep_rows],
        "fy2024": [page_fy2024(r) for r in fy2024_rows],
        "finding": verdict,
    }
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")

    print(f"done in {seconds}s", flush=True)
    print(json.dumps(verdict, indent=1), flush=True)


if __name__ == "__main__":
    main()
