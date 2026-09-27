"""Week 4, pose question: Is the map just a few companies' footprints?

Question (plain): if you pull the biggest firms out of the network, does the
map (section 1) or the job clusters (section 2) survive, or do they fall
apart because a handful of staffing giants were holding them together?

Network, part 1 (reuses analysis/week04_where.py): companies x metro areas,
projected onto the same 40 metros section 1 uses, fixed from the FULL FY2025
data so every variant is compared on the same nodes. Variants: the full
network; the network with the SHORTLIST (the 5 largest placing firms) taken
out; the network with the top 10 employers by all certified filings in those
metros taken out (this is where Amazon shows up: it barely places workers at
clients, so it never makes the SHORTLIST, but it files enormously); and, for
each of those two drops, 20 volume-matched controls that remove random
employers totalling the same filings, so a real drop can be told apart from
just removing that much network at random.

Network, part 2 (reuses analysis/week04_jobs.py): companies x occupations,
projected onto occupations. Section 2's own projection weights a link by the
NUMBER of companies filing for both occupations, so pulling 5 to 10 companies
out of about 59,000 cannot move a weight by more than 5 or 10; that check is
reported and then set aside. The real test here reprojects with the same
filings-weighted rule section 1 uses (weight = the smaller of each shared
company's filing counts in the two occupations), under the same drops and
matched controls.

Checks
- Louvain, 100 seeded runs per variant. Part 1 reports the modal partition (as
  where.py does); part 2 reports the best-modularity partition (as jobs.py
  does).
- Modularity Q of that partition against a null: degree-preserving rewirings
  of THAT VARIANT's own company x metro (or company x occupation) bipartite
  graph, re-projected with the SAME filings-weighted rule as the observed
  partition (never the company-count projection), one Louvain run per
  rewiring, scored on the same node set the observed partition uses (no
  giant-component restriction unless the observed one has it). 50 nulls for
  the full metro network and its two named drops; 20 for the full job network
  and its two named drops (the job reprojection costs more per null, so the
  count is lower to keep the runtime bounded); 10 nulls per matched-control
  draw, for both metros and jobs; z = (Q - null mean) / null sd.
- Median NMI between the 100 seeds (run-to-run noise), and NMI between the
  variant's partition and the full network's partition (does removing the
  firms relabel the map, or leave it alone).
- Part 1 only: AMI and a shuffle p-value (1,000 shuffles) of the modal
  partition against Census region. Part 2 only: NMI against SOC major group
  over occupations in clusters of two or more.
- A named drop "survives" a check when, for each of its available metrics
  (NMI vs. full, Q's z, and for metros AMI vs. region), the drop's value sits
  within 2 sd of the matched controls' own mean and sd for that metric -- not
  against a fixed tolerance, since the controls' own spread sets what "about
  as well as a random cut of this size" means. A drop with no comparable
  metric available never passes by default. The answer is "no, the map is not
  just their footprint" only when every available metric survives for both
  named drops; "yes" (mixed) otherwise.

Speed: the 40-metro projection re-runs 780 metro pairs per rewiring, done with
a dense employer x metro numpy matrix (project_vectorized) instead of the
per-employer Python loop week04_where.project uses; the two give identical
edge weights (checked once, at startup, with an assertion). The independent
work -- nulls within a named variant, and the 20 draws of a control -- runs in
a forked process pool. Every task's random state is seeded from a stable hash
of (SEED, part, variant id, draw index, purpose, sub-index), never from a
shared generator or from arithmetic offsets on a shared base -- offsets used
to collide (e.g. one control draw's seeds landing exactly on the next draw's),
which the hash keys rule out by construction.

Outputs: analysis/week04_footprint.json (every number) and
docs/weeks/week04/data/footprint.json (the shape a page figure would draw).
A crash while assembling the final summary must not discard the (expensive)
per-variant results, so they are dumped to
analysis/week04_footprint.partial.json as soon as each half finishes, and that
file is removed again once the real outputs are written.
"""

import hashlib
import json
import multiprocessing as mp
import os
import random
import time
from collections import Counter
from itertools import combinations
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_jobs as jobs
import week04_where as where
from week04_schemas import check
from week04_staffing import louvain, resolver, rewire

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
PARTIAL = Path(__file__).resolve().parent / "week04_footprint.partial.json"
PAGE = ROOT / "docs/weeks/week04/data/footprint.json"
YEAR = 2025
SEED = 2805
RUNS = 100
NULLS_MAIN = 50     # nulls for the full metro network and its two named drops
NULLS_JOBS = 20     # nulls for the full job network and its two named drops (pricier per null)
NULLS_CONTROL = 10  # nulls per matched-control draw (metros and jobs alike)
DRAWS = 20          # volume-matched control draws per named drop
TOP10 = 10          # employers dropped for variant c
WORKERS = 8         # forked worker processes (machine has 10 cores)


def seed_for(part, variant_id, draw_idx, purpose, i=0):
    """A seed derived from a stable hash of (SEED, part, variant id, draw
    index, purpose, sub-index), so no two tasks anywhere in the script can
    share a seed by accident of arithmetic (as fixed offsets on a shared base
    once did: one control draw's seeds landed exactly on the next draw's)."""
    key = repr((SEED, part, variant_id, draw_idx, purpose, i)).encode()
    digest = hashlib.blake2b(key, digest_size=8).digest()
    return int.from_bytes(digest, "big") % (2 ** 31)

# Module-level state a forked worker inherits at Pool-creation time (copy on
# write: cheap, and nothing needs to be pickled per task beyond a seed and a
# short list of dropped employer keys).
_G = {}


def _set_globals(**kwargs):
    global _G
    _G = kwargs


def span(seconds):
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h}h{m}m" if h else f"{m}m{s}s" if m else f"{s}s"


def progress(label, done, total, started):
    if done % max(1, total // 10) == 0 or done == total:
        elapsed = time.time() - started
        left = elapsed / done * (total - done) if done else 0
        print(f"{label}: {done}/{total} ({done / total:.0%}), {span(elapsed)} elapsed, "
              f"about {span(left)} left", flush=True)


# --- projection ------------------------------------------------------------

def project_vectorized(pairs, keep):
    """The same metro/occupation projection as week04_where.project (weight =
    sum over shared employers of the smaller of the two filing counts), built
    from a dense employer x node matrix instead of a per-employer Python loop.
    Verified equal to week04_where.project once, at startup."""
    keep = list(keep)
    idx = {m: i for i, m in enumerate(keep)}
    sub = pairs[pairs["metro"].isin(keep)]
    g = nx.Graph()
    g.add_nodes_from(keep)
    if sub.empty:
        return g
    emp_codes, _ = pd.factorize(sub["employer"])
    metro_codes = sub["metro"].map(idx).to_numpy()
    n_emp = emp_codes.max() + 1
    M = np.zeros((n_emp, len(keep)), dtype=np.int64)
    M[emp_codes, metro_codes] = sub["filings"].to_numpy()
    for i, j in combinations(range(len(keep)), 2):
        w = int(np.minimum(M[:, i], M[:, j]).sum())
        if w:
            g.add_edge(keep[i], keep[j], weight=w)
    return g


def check_project_vectorized(pairs, keep):
    """project_vectorized must give the identical graph to week04_where.project."""
    g1 = where.project(pairs, keep)
    g2 = project_vectorized(pairs, keep)
    assert set(g1.edges()) == set(g2.edges()), "vectorised projection changed the edge set"
    for u, v in g1.edges():
        assert g1[u][v]["weight"] == g2[u][v]["weight"], f"vectorised projection changed weight({u},{v})"


# --- shared partition/NMI helpers ------------------------------------------

def modal_partition(graph, seeds, runs=RUNS):
    """Louvain runs, the partition found most often (ties: higher Q), as
    where.py picks it. `seeds` is a list of `runs` distinct seeds, one per run."""
    parts_list = [louvain(graph, seeds[r])[0] for r in range(runs)]
    found = Counter(frozenset(frozenset(c) for c in part) for part in parts_list)
    q_of = {k: nx.community.modularity(graph, [set(c) for c in k], weight="weight") for k in found}
    modal = max(found, key=lambda k: (found[k], q_of[k]))
    best = [set(c) for c in sorted(modal, key=lambda c: (-len(c), min(c)))]
    member = {m: i for i, part in enumerate(best) for m in part}
    return best, member, q_of[modal], parts_list


def best_q_partition(graph, seeds, runs=RUNS):
    """Louvain runs, the single best-modularity partition, as jobs.py picks it.
    `seeds` is a list of `runs` distinct seeds, one per run."""
    found = [louvain(graph, seeds[r]) for r in range(runs)]
    parts_list = [p for p, _ in found]
    best_p, best_q = max(found, key=lambda pq: pq[1])
    best = sorted(best_p, key=lambda c: (-len(c), min(c)))
    member = {m: i for i, part in enumerate(best) for m in part}
    return best, member, best_q, parts_list


def seed_nmi(parts_list, nodes):
    labels_list = [{m: i for i, part in enumerate(p) for m in part} for p in parts_list]
    pairs = [nmi([a[n] for n in nodes], [b[n] for n in nodes]) for a, b in combinations(labels_list, 2)]
    return float(np.median(pairs)), labels_list


def cross_nmi_median(labels_a, labels_b, nodes):
    vals = [nmi([a[n] for n in nodes], [b[n] for n in nodes]) for a in labels_a for b in labels_b]
    return float(np.median(vals))


def shuffled_ami(a, b, seed, times=1000):
    rng = random.Random(seed)
    observed = ami(a, b)
    b = list(b)
    beats = 0
    for _ in range(times):
        rng.shuffle(b)
        beats += ami(a, b) >= observed
    return observed, (beats + 1) / (times + 1)


def bipartite_of(pairs, keep):
    g = nx.Graph()
    for e, n, f in pairs[pairs["metro"].isin(keep)].itertuples(index=False):
        g.add_edge(("F", e), ("C", n), weight=int(f))
    return g


def summarise_draws(rows, keys):
    """Mean and sd of each metric over a set of control draws."""
    out = {}
    for k in keys:
        vals = np.array([r[k] for r in rows if r.get(k) is not None], dtype=float)
        if len(vals):
            out[k] = round(float(vals.mean()), 4)
            out[f"{k}_sd"] = round(float(vals.std()), 4)
        else:
            out[k] = None
            out[f"{k}_sd"] = None
    return out


def matched_draws_deterministic(pairs, keep, exclude, target_total, n_draws, part, control_name):
    """n_draws sets of employer keys, each sampled with its OWN hash-derived
    seed (part, control_name, draw index, "compose"), so a draw's composition
    never depends on any other draw, on any other control set, or on
    scheduling order in the process pool."""
    totals = pairs[pairs["metro"].isin(keep)].groupby("employer")["filings"].sum()
    pool = sorted(e for e in totals.index if e not in exclude)  # sorted: set/dict order is per-process
    draws = []
    for i in range(n_draws):
        r = random.Random(seed_for(part, control_name, i, "compose"))
        order = pool[:]
        r.shuffle(order)
        cum, chosen = 0, []
        for e in order:
            if cum >= target_total:
                break
            chosen.append(e)
            cum += int(totals[e])
        draws.append((set(chosen), cum))
    return draws


# --- metro workers (run in forked child processes) -------------------------

def _metro_null_task(seed):
    bip = bipartite_of(_G["pairs"], _G["keep"])
    h = rewire(bip, random.Random(seed))
    rows = [(u[1], v[1], d["weight"]) if u[0] == "F" else (v[1], u[1], d["weight"])
            for u, v, d in h.edges(data=True)]
    hp = project_vectorized(pd.DataFrame(rows, columns=["employer", "metro", "filings"]), _G["keep"])
    return louvain(hp, seed)[1]


def run_metro_nulls_parallel(pairs, keep, seeds, label_text):
    _set_globals(pairs=pairs, keep=keep)
    n_nulls = len(seeds)
    started = time.time()
    qs = []
    with mp.get_context("fork").Pool(processes=WORKERS) as pool:
        for done, q in enumerate(pool.imap_unordered(_metro_null_task, seeds), 1):
            qs.append(q)
            progress(label_text, done, n_nulls, started)
    return np.array(qs)


def _metro_draw_task(payload):
    control_name, draw_idx, dropped_list, achieved = payload
    dropped = set(dropped_list)
    keep = _G["keep"]
    full_member, full_labels, regions = _G["full_member"], _G["full_labels"], _G["regions"]
    total_in_top = _G["total_in_top"]
    pv = _G["pairs"][~_G["pairs"]["employer"].isin(dropped)]
    g = project_vectorized(pv, keep)
    seeds_run = [seed_for("metro", control_name, draw_idx, "louvain_run", r) for r in range(RUNS)]
    best, member, q, parts_list = modal_partition(g, seeds_run, RUNS)
    nodes = sorted(keep)
    nmi_seeds, labels_list = seed_nmi(parts_list, nodes)
    nmi_vs_full = nmi([full_member[n] for n in nodes], [member[n] for n in nodes])
    nmi_vs_full_runs = cross_nmi_median(labels_list, full_labels, nodes)
    comm = [member[n] for n in nodes]
    region_labels = [regions[n] for n in nodes]
    region_seed = seed_for("metro", control_name, draw_idx, "region_shuffle")
    region_ami, region_p = shuffled_ami(comm, region_labels, region_seed)
    region_nmi = nmi(comm, region_labels)

    bip = bipartite_of(pv, keep)
    qs = []
    for i in range(NULLS_CONTROL):
        rewire_seed = seed_for("metro", control_name, draw_idx, "control_rewire", i)
        h = rewire(bip, random.Random(rewire_seed))
        rows = [(u[1], v[1], d["weight"]) if u[0] == "F" else (v[1], u[1], d["weight"])
                for u, v, d in h.edges(data=True)]
        hp = project_vectorized(pd.DataFrame(rows, columns=["employer", "metro", "filings"]), keep)
        louvain_seed = seed_for("metro", control_name, draw_idx, "control_louvain", i)
        qs.append(louvain(hp, louvain_seed)[1])
    qs = np.array(qs)

    return {
        "Q": round(float(q), 4), "communities": len(best),
        "nmi_seeds_median": round(nmi_seeds, 3),
        "nmi_vs_full": round(float(nmi_vs_full), 3),
        "nmi_vs_full_runs_median": round(nmi_vs_full_runs, 3),
        "ami_region": round(float(region_ami), 3), "p_region": round(region_p, 4),
        "nmi_region": round(float(region_nmi), 3),
        "null_mean": round(float(qs.mean()), 4), "null_sd": round(float(qs.std()), 4),
        "z": round(float((q - qs.mean()) / qs.std()), 2), "null_runs": NULLS_CONTROL,
        "filings_removed_share": round(achieved / total_in_top, 4),
    }


def run_metro_draws_parallel(pairs, keep, full_member, full_labels, regions, total_in_top,
                              exclude, target, control_name, n_draws, label_text):
    draws = matched_draws_deterministic(pairs, keep, exclude, target, n_draws, "metro", control_name)
    _set_globals(pairs=pairs, keep=keep, full_member=full_member, full_labels=full_labels,
                 regions=regions, total_in_top=total_in_top)
    payload = [(control_name, i, sorted(dropped), achieved)
               for i, (dropped, achieved) in enumerate(draws)]
    started = time.time()
    rows = []
    with mp.get_context("fork").Pool(processes=WORKERS) as pool:
        for done, res in enumerate(pool.imap(_metro_draw_task, payload), 1):
            rows.append(res)
            print(f"{label_text} draw {done}/{n_draws}: Q={res['Q']}, z={res['z']}", flush=True)
    return rows


# --- job workers (run in forked child processes) ----------------------------

def _jobs_null_task(seed):
    """Rewire the (filings-weighted) company x occupation bipartite graph and
    re-project it with the SAME filings-min rule the observed partition uses
    (where.project, not jobs.reproject's company-count rule), scored on the
    full occupation node set the observed partition uses (no giant-component
    restriction -- the observed one has none either)."""
    occupations = _G["occupations"]
    bip = bipartite_of(_G["pairs"], occupations)
    h = rewire(bip, random.Random(seed))
    rows = [(u[1], v[1], d["weight"]) if u[0] == "F" else (v[1], u[1], d["weight"])
            for u, v, d in h.edges(data=True)]
    hp = where.project(pd.DataFrame(rows, columns=["employer", "metro", "filings"]), occupations)
    return louvain(hp, seed)[1]


def run_jobs_nulls_parallel(pairs, occupations, seeds, label_text):
    _set_globals(pairs=pairs, occupations=occupations)
    n_nulls = len(seeds)
    started = time.time()
    qs = []
    with mp.get_context("fork").Pool(processes=WORKERS) as pool:
        for done, q in enumerate(pool.imap_unordered(_jobs_null_task, seeds), 1):
            qs.append(q)
            progress(label_text, done, n_nulls, started)
    return np.array(qs)


def _jobs_draw_task(payload):
    control_name, draw_idx, dropped_list, achieved = payload
    dropped = set(dropped_list)
    occupations = _G["occupations"]
    major = _G["major"]
    full_member = _G["full_member"]
    total_filings = _G["total_filings"]
    pv = _G["pairs"][~_G["pairs"]["employer"].isin(dropped)]
    g = where.project(pv, occupations)
    seeds_run = [seed_for("jobs", control_name, draw_idx, "louvain_run", r) for r in range(RUNS)]
    best, member, q, parts_list = best_q_partition(g, seeds_run, RUNS)
    nmi_seeds, _ = seed_nmi(parts_list, occupations)
    nmi_vs_full = nmi([full_member[n] for n in occupations], [member[n] for n in occupations])
    clusters2 = [c for c in best if len(c) > 1]
    scored = sorted(n for c in clusters2 for n in c)
    soc_nmi = nmi([member[n] for n in scored], [major[n] for n in scored]) if scored else None

    # Control null: same rewiring-and-reproject rule as the named drops', so a
    # control draw's z is comparable to a named drop's z (bug fix: previously
    # jobs control draws had no null at all, so control z was always missing).
    bip = bipartite_of(pv, occupations)
    qs = []
    for i in range(NULLS_CONTROL):
        rewire_seed = seed_for("jobs", control_name, draw_idx, "control_rewire", i)
        h = rewire(bip, random.Random(rewire_seed))
        rows = [(u[1], v[1], d["weight"]) if u[0] == "F" else (v[1], u[1], d["weight"])
                for u, v, d in h.edges(data=True)]
        hp = where.project(pd.DataFrame(rows, columns=["employer", "metro", "filings"]), occupations)
        louvain_seed = seed_for("jobs", control_name, draw_idx, "control_louvain", i)
        qs.append(louvain(hp, louvain_seed)[1])
    qs = np.array(qs)

    return {
        "Q": round(float(q), 4), "communities": len(clusters2),
        "nmi_seeds_median": round(nmi_seeds, 3),
        "nmi_vs_full": round(float(nmi_vs_full), 3),
        "nmi_soc_major": round(float(soc_nmi), 3) if soc_nmi is not None else None,
        "null_mean": round(float(qs.mean()), 4), "null_sd": round(float(qs.std()), 4),
        "z": round(float((q - qs.mean()) / qs.std()), 2), "null_runs": NULLS_CONTROL,
        "filings_removed_share": round(achieved / total_filings, 4),
    }


def run_jobs_draws_parallel(pairs, occupations, major, full_member, total_filings,
                             by_company, exclude, target, control_name, n_draws, label_text):
    totals = by_company[~by_company.index.isin(exclude)]
    pool_ids = sorted(totals.index)  # sorted: set/dict order is per-process
    draws = []
    for i in range(n_draws):
        r = random.Random(seed_for("jobs", control_name, i, "compose"))
        order = pool_ids[:]
        r.shuffle(order)
        cum, chosen = 0, []
        for e in order:
            if cum >= target:
                break
            chosen.append(e)
            cum += int(totals[e])
        draws.append((set(chosen), cum))
    _set_globals(pairs=pairs, occupations=occupations, major=major, full_member=full_member,
                 total_filings=total_filings)
    payload = [(control_name, i, sorted(dropped), achieved)
               for i, (dropped, achieved) in enumerate(draws)]
    rows = []
    with mp.get_context("fork").Pool(processes=WORKERS) as pool:
        for done, res in enumerate(pool.imap(_jobs_draw_task, payload), 1):
            rows.append(res)
            print(f"{label_text} draw {done}/{n_draws}: Q={res['Q']}, z={res['z']}", flush=True)
    return rows


# --- part 1: metros ----------------------------------------------------------

def named_metro_variant(pairs, keep, variant_id, full_member, full_labels, regions, n_nulls, label_text):
    g = project_vectorized(pairs, keep)
    seeds_run = [seed_for("metro", variant_id, None, "louvain_run", r) for r in range(RUNS)]
    best, member, q, parts_list = modal_partition(g, seeds_run, RUNS)
    nodes = sorted(keep)
    nmi_seeds, labels_list = seed_nmi(parts_list, nodes)
    nmi_vs_full = nmi([full_member[n] for n in nodes], [member[n] for n in nodes]) if full_member else 1.0
    nmi_vs_full_runs = cross_nmi_median(labels_list, full_labels, nodes) if full_labels else nmi_seeds
    comm = [member[n] for n in nodes]
    region_labels = [regions[n] for n in nodes]
    region_seed = seed_for("metro", variant_id, None, "region_shuffle")
    region_ami, region_p = shuffled_ami(comm, region_labels, region_seed)
    region_nmi = nmi(comm, region_labels)
    result = {
        "Q": round(float(q), 4), "communities": len(best),
        "nmi_seeds_median": round(nmi_seeds, 3),
        "nmi_vs_full": round(float(nmi_vs_full), 3),
        "nmi_vs_full_runs_median": round(nmi_vs_full_runs, 3),
        "ami_region": round(float(region_ami), 3), "p_region": round(region_p, 4),
        "nmi_region": round(float(region_nmi), 3),
    }
    null_seeds = [seed_for("metro", variant_id, None, "null", i) for i in range(n_nulls)]
    nulls = run_metro_nulls_parallel(pairs, keep, null_seeds, label_text)
    result |= {"null_mean": round(float(nulls.mean()), 4), "null_sd": round(float(nulls.std()), 4),
               "z": round(float((q - nulls.mean()) / nulls.std()), 2), "null_runs": n_nulls}
    return result, member, labels_list


def run_metros():
    print("part 1: metro network", flush=True)
    lookup, town_lookup, gaz = where.metros()
    sites, lca, stats = where.worksite_metros(lookup, town_lookup, YEAR)
    per_case = sites.drop_duplicates(["CASE_NUMBER", "metro"])
    pairs = per_case.groupby(["employer", "metro"]).size().rename("filings").reset_index()
    filings = per_case.groupby("metro").size().sort_values(ascending=False)
    top = list(filings.head(where.TOP).index)  # the same 40 metros where.py uses, fixed in every variant
    regions = {m: where.REGION[where.first_state(gaz.loc[m, "NAME"])] for m in top}

    check_project_vectorized(pairs, top)
    print("checked: vectorised metro projection matches week04_where.project", flush=True)

    placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    shortlist = list(placed["employer"].value_counts().head(where.SHORTLIST).index)

    pairs_top = pairs[pairs["metro"].isin(top)]
    by_employer = pairs_top.groupby("employer")["filings"].sum()
    total_in_top = int(pairs_top["filings"].sum())
    top10 = list(by_employer.sort_values(ascending=False).head(TOP10).index)

    def dropped_share(dropped):
        return round(float(by_employer[by_employer.index.isin(dropped)].sum() / total_in_top), 4)

    variants = []

    full_res, full_member, full_labels = named_metro_variant(
        pairs, top, "full", None, None, regions, NULLS_MAIN, "metro nulls (full)")
    variants.append({"id": "full", "label": "Full network", "dropped": [], "control": False,
                      "filings_removed_share": 0.0, **full_res})

    pairs_b = pairs[~pairs["employer"].isin(shortlist)]
    res_b, _, _ = named_metro_variant(
        pairs_b, top, "drop_shortlist", full_member, full_labels, regions, NULLS_MAIN, "metro nulls (drop shortlist)")
    variants.append({"id": "drop_shortlist", "label": "Without the 5 largest placing firms",
                      "dropped": [resolver().label(e) for e in shortlist], "control": False,
                      "filings_removed_share": dropped_share(shortlist), **res_b})

    pairs_c = pairs[~pairs["employer"].isin(top10)]
    res_c, _, _ = named_metro_variant(
        pairs_c, top, "drop_top10_filings", full_member, full_labels, regions, NULLS_MAIN, "metro nulls (drop top10)")
    variants.append({"id": "drop_top10_filings", "label": "Without the 10 largest filers",
                      "dropped": [resolver().label(e) for e in top10], "control": False,
                      "filings_removed_share": dropped_share(top10), **res_c})

    target_b = int(by_employer[by_employer.index.isin(shortlist)].sum())
    target_c = int(by_employer[by_employer.index.isin(top10)].sum())
    for name, exclude, target in (
            ("shortlist", set(shortlist), target_b),
            ("top10_filings", set(top10), target_c)):
        rows = run_metro_draws_parallel(
            pairs, top, full_member, full_labels, regions, total_in_top,
            exclude, target, name, DRAWS, f"metro control ({name})")
        keys = ["Q", "communities", "nmi_seeds_median", "nmi_vs_full", "nmi_vs_full_runs_median",
                "ami_region", "p_region", "nmi_region", "null_mean", "null_sd", "z",
                "filings_removed_share"]
        summary = summarise_draws(rows, keys)
        variants.append({"id": f"control_{name}", "label": f"Volume-matched random drop (like {name})",
                          "dropped": [], "control": True, "draws": DRAWS, **summary})

    return {"year": YEAR, "top_metros": where.TOP, "shortlist": [resolver().label(e) for e in shortlist],
            "top10_filings": [resolver().label(e) for e in top10],
            "shortlist_filings_share": dropped_share(shortlist),
            "top10_filings_share": dropped_share(top10),
            "variants": variants}


# --- part 2: jobs ------------------------------------------------------------

def jobs_pairs(frame):
    """(employer, occupation, filings) rows, the same shape week04_where.project
    expects, so it can be reused verbatim for the occupation network."""
    return (frame.groupby(["company", "occupation"]).size().rename("filings").reset_index()
            .rename(columns={"company": "employer", "occupation": "metro"}))


def named_jobs_variant(pairs, occupations, major, variant_id, full_member, n_nulls, label_text):
    g = where.project(pairs, occupations)
    seeds_run = [seed_for("jobs", variant_id, None, "louvain_run", r) for r in range(RUNS)]
    best, member, q, parts_list = best_q_partition(g, seeds_run, RUNS)
    nmi_seeds, labels_list = seed_nmi(parts_list, occupations)
    nmi_vs_full = nmi([full_member[n] for n in occupations], [member[n] for n in occupations]) if full_member else 1.0
    clusters2 = [c for c in best if len(c) > 1]
    scored = sorted(n for c in clusters2 for n in c)
    soc_nmi = nmi([member[n] for n in scored], [major[n] for n in scored]) if scored else None
    result = {
        "Q": round(float(q), 4), "communities": len(clusters2),
        "nmi_seeds_median": round(nmi_seeds, 3),
        "nmi_vs_full": round(float(nmi_vs_full), 3),
        "nmi_soc_major": round(float(soc_nmi), 3) if soc_nmi is not None else None,
    }
    null_seeds = [seed_for("jobs", variant_id, None, "null", i) for i in range(n_nulls)]
    nulls = run_jobs_nulls_parallel(pairs, occupations, null_seeds, label_text)
    result |= {"null_mean": round(float(nulls.mean()), 4), "null_sd": round(float(nulls.std()), 4),
               "z": round(float((q - nulls.mean()) / nulls.std()), 2), "null_runs": n_nulls}
    return result, member, labels_list


def run_jobs():
    print("part 2: job network", flush=True)
    frame = jobs.filtered(YEAR)
    occupations = sorted(set(frame["occupation"]))
    major = {o: o[:2] for o in occupations}

    # The company-count projection (jobs.py's own) cannot be structurally
    # informative here: a link's weight is the number of companies filing for
    # both occupations, so dropping a handful of the ~59,000 companies moves
    # it by at most that many.
    company_graph, _ = jobs.projection(frame)
    uninformative = {
        "structurally_uninformative_on_company_count_weights": True,
        "reason": "a link's weight is the count of companies filing for both occupations; "
                  "dropping n companies can move any single weight by at most n",
        "companies": int(frame["company"].nunique()),
        "occupations": company_graph.number_of_nodes(),
        "max_weight_change_drop5": 5,
        "max_weight_change_drop10": 10,
    }

    placed = frame[frame["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    shortlist = list(placed.groupby("company").size().sort_values(ascending=False).head(where.SHORTLIST).index)
    by_company = frame.groupby("company").size()
    top10 = list(by_company.sort_values(ascending=False).head(TOP10).index)
    total_filings = int(by_company.sum())

    def dropped_share(dropped):
        return round(float(by_company[by_company.index.isin(dropped)].sum() / total_filings), 4)

    pairs = jobs_pairs(frame)

    variants = []
    full_res, full_member, _ = named_jobs_variant(pairs, occupations, major, "full", None, NULLS_JOBS,
                                                    "jobs nulls (full)")
    variants.append({"id": "full", "label": "Full network", "dropped": [], "control": False,
                      "filings_removed_share": 0.0, **full_res})

    pairs_b = pairs[~pairs["employer"].isin(shortlist)]
    res_b, _, _ = named_jobs_variant(pairs_b, occupations, major, "drop_shortlist", full_member, NULLS_JOBS,
                                      "jobs nulls (drop shortlist)")
    variants.append({"id": "drop_shortlist", "label": "Without the 5 largest placing firms",
                      "dropped": [resolver().label(e) for e in shortlist], "control": False,
                      "filings_removed_share": dropped_share(shortlist), **res_b})

    pairs_c = pairs[~pairs["employer"].isin(top10)]
    res_c, _, _ = named_jobs_variant(pairs_c, occupations, major, "drop_top10_filings", full_member, NULLS_JOBS,
                                      "jobs nulls (drop top10)")
    variants.append({"id": "drop_top10_filings", "label": "Without the 10 largest filers",
                      "dropped": [resolver().label(e) for e in top10], "control": False,
                      "filings_removed_share": dropped_share(top10), **res_c})

    target_b = int(by_company[by_company.index.isin(shortlist)].sum())
    target_c = int(by_company[by_company.index.isin(top10)].sum())
    for name, exclude, target in (
            ("shortlist", set(shortlist), target_b),
            ("top10_filings", set(top10), target_c)):
        rows = run_jobs_draws_parallel(pairs, occupations, major, full_member, total_filings,
                                        by_company, exclude, target, name, DRAWS,
                                        f"jobs control ({name})")
        keys = ["Q", "communities", "nmi_seeds_median", "nmi_vs_full", "nmi_soc_major",
                "null_mean", "null_sd", "z", "filings_removed_share"]
        summary = summarise_draws(rows, keys)
        variants.append({"id": f"control_{name}", "label": f"Volume-matched random drop (like {name})",
                          "dropped": [], "control": True, "draws": DRAWS, **summary})

    return {"year": YEAR, "occupations": len(occupations), "companies": int(frame["company"].nunique()),
            "shortlist": [resolver().label(e) for e in shortlist],
            "top10_filings": [resolver().label(e) for e in top10],
            "shortlist_filings_share": dropped_share(shortlist),
            "top10_filings_share": dropped_share(top10),
            "structurally_uninformative_check": uninformative,
            "variants": variants}


# --- verdict and page shaping -------------------------------------------------

def find(variants, vid):
    return next(v for v in variants if v["id"] == vid)


def vs_control_sd(named, control_mean, control_sd):
    """(named - control mean) / control sd; None if any input is missing or
    the control sd is zero (nothing to divide by)."""
    if named is None or control_mean is None or not control_sd:
        return None
    return round(float((named - control_mean) / control_sd), 2)


def drop_vs_control(named, control, region_key=False):
    """z-scores of a named drop's NMI-vs-full and (where available) Q's z and
    (metros only) AMI-vs-region against the matched controls' own mean and sd
    for that metric -- the controls' spread sets what "about as well as a
    random cut this size" means, rather than a fixed tolerance."""
    out = {
        "nmi_vs_control_sd": vs_control_sd(named.get("nmi_vs_full"), control.get("nmi_vs_full"),
                                            control.get("nmi_vs_full_sd")),
        "z_vs_control_sd": vs_control_sd(named.get("z"), control.get("z"), control.get("z_sd")),
    }
    if region_key:
        out["ami_region_vs_control_sd"] = vs_control_sd(named.get("ami_region"), control.get("ami_region"),
                                                          control.get("ami_region_sd"))
    return out


def survives(vs_control):
    """A drop 'survives' when every vs-control z-score available for it is
    within 2 sd of the matched controls' spread. A drop with no comparable
    metric available never passes by default."""
    vals = [v for v in vs_control.values() if v is not None]
    return bool(vals) and all(abs(v) < 2 for v in vals)


def finding(metros, jobs_res):
    m = metros["variants"]
    j = jobs_res["variants"]

    def get(variants, vid, key):
        return find(variants, vid).get(key)

    m_shortlist, m_top10 = find(m, "drop_shortlist"), find(m, "drop_top10_filings")
    m_control_shortlist, m_control_top10 = find(m, "control_shortlist"), find(m, "control_top10_filings")
    m_shortlist_vs = drop_vs_control(m_shortlist, m_control_shortlist, region_key=True)
    m_top10_vs = drop_vs_control(m_top10, m_control_top10, region_key=True)
    metros_answer_no = survives(m_shortlist_vs) and survives(m_top10_vs)

    j_shortlist, j_top10 = find(j, "drop_shortlist"), find(j, "drop_top10_filings")
    j_control_shortlist, j_control_top10 = find(j, "control_shortlist"), find(j, "control_top10_filings")
    j_shortlist_vs = drop_vs_control(j_shortlist, j_control_shortlist)
    j_top10_vs = drop_vs_control(j_top10, j_control_top10)
    jobs_answer_no = survives(j_shortlist_vs) and survives(j_top10_vs)

    return {
        "question": "Is the map just a few companies' footprints?",
        "metros": {
            "full_z": get(m, "full", "z"),
            "drop_shortlist_z": m_shortlist.get("z"), "drop_top10_z": m_top10.get("z"),
            "control_shortlist_z": m_control_shortlist.get("z"), "control_top10_z": m_control_top10.get("z"),
            "drop_shortlist_nmi_vs_full": m_shortlist.get("nmi_vs_full"),
            "drop_top10_nmi_vs_full": m_top10.get("nmi_vs_full"),
            "control_shortlist_nmi_vs_full": m_control_shortlist.get("nmi_vs_full"),
            "control_top10_nmi_vs_full": m_control_top10.get("nmi_vs_full"),
            "drop_shortlist_vs_control": m_shortlist_vs, "drop_top10_vs_control": m_top10_vs,
            "answer_no_not_just_their_footprint": metros_answer_no,
        },
        "jobs": {
            "full_z": get(j, "full", "z"),
            "drop_shortlist_z": j_shortlist.get("z"), "drop_top10_z": j_top10.get("z"),
            "control_shortlist_z": j_control_shortlist.get("z"), "control_top10_z": j_control_top10.get("z"),
            "drop_shortlist_nmi_vs_full": j_shortlist.get("nmi_vs_full"),
            "drop_top10_nmi_vs_full": j_top10.get("nmi_vs_full"),
            "drop_shortlist_vs_control": j_shortlist_vs, "drop_top10_vs_control": j_top10_vs,
            "answer_no_not_just_their_footprint": jobs_answer_no,
            "caveat": "the company-count projection cannot show this at all (see jobs.structurally_"
                      "uninformative_check); this uses the filings-weighted reprojection instead",
        },
        "overall_answer": "no" if (metros_answer_no and jobs_answer_no) else "mixed",
    }


def page_variant(v, region_key=False, soc_key=False):
    keep = ["id", "label", "dropped", "control", "filings_removed_share", "Q", "null_mean", "null_sd", "z",
            "communities", "nmi_vs_full", "nmi_seeds_median"]
    row = {k: v.get(k) for k in keep}
    if region_key:
        row["ami_region"] = v.get("ami_region")
        row["p_region"] = v.get("p_region")
    if soc_key:
        row["nmi_soc_major"] = v.get("nmi_soc_major")
    for extra in ("draws", "Q_sd", "z_sd", "nmi_vs_full_sd", "communities_sd", "ami_region_sd", "p_region_sd",
                  "nmi_soc_major_sd"):
        if extra in v:
            row[extra] = v[extra]
    return row


def main():
    started = time.time()
    print(f"Expected runtime with {WORKERS} parallel workers: about 11-17 minutes "
          f"(metro nulls: {NULLS_MAIN} x 3 named variants + {NULLS_CONTROL} x {DRAWS} x 2 control sets; "
          f"jobs nulls: {NULLS_JOBS} x 3 named variants + {NULLS_CONTROL} x {DRAWS} x 2 control sets "
          f"(new: control draws now get their own null too); "
          f"nulls and draws run in a forked process pool; loading FY2025 data ~20s).",
          flush=True)

    metros_res = run_metros()
    jobs_res = run_jobs()
    # Safety dump before the final assembly step, so a bug there (as bit us once
    # already: a control row with no null has no "z") cannot discard 30+ CPU
    # minutes of Louvain and null runs.
    PARTIAL.write_text(json.dumps({"metros": metros_res, "jobs": jobs_res}, default=str))

    verdict = finding(metros_res, jobs_res)

    seconds = round(time.time() - started)
    out = {
        "generated_by": "analysis/week04_footprint.py", "year": YEAR, "seconds": seconds,
        "metros": metros_res, "jobs": jobs_res, "finding": verdict,
    }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False, default=str) + "\n")

    page = {
        "generated_by": "analysis/week04_footprint.py", "year": YEAR,
        "metros": {"variants": [page_variant(v, region_key=True) for v in metros_res["variants"]]},
        "jobs": {"variants": [page_variant(v, soc_key=True) for v in jobs_res["variants"]],
                 "structurally_uninformative_on_company_count_weights": True,
                 "max_weight_change": jobs_res["structurally_uninformative_check"]["max_weight_change_drop10"]},
        "finding": verdict,
    }
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")
    PARTIAL.unlink(missing_ok=True)  # the real outputs are written; drop the safety copy

    print(f"done in {seconds}s", flush=True)
    print(json.dumps(verdict, indent=1), flush=True)


if __name__ == "__main__":
    main()
