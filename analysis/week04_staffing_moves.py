"""Week 4, section 3 extension: staffing moves.  Owner: Gyula.

Network: the same bipartite outsourcing firm ("F", key) -> client ("C", key)
graph as week04_staffing.py, weight = placed filings, built by
placements(year, certified(year)) and graph(rows). One Louvain partition
(igraph multilevel, 100 runs, best-Q kept) per year's giant component; the
FY2025 giant component is reproduced and checked against
week04_staffing.json's main.giant before anything else runs.

Questions
- Q1: when a client switches its main vendor, does it stay inside its community?
- Q2: weighted against unweighted -- which clients move?
- Q3: which clients sit in two staffing communities?

Method
- Q1: a client's main vendor in a year is the firm with the most placed
  filings to it that year; a tie (two firms level) drops the client for that
  year. Clients need 5+ placed filings in both years of a pair (3 and 10 are
  reported too, as a sensitivity check). A switch is a main-vendor change
  between year t and t+1; it only counts if both the old and the new vendor
  are nodes of year t's giant component, since only those nodes carry a
  community label. Observed = share of switches whose new vendor sits in the
  same year-t community as the client. The null redraws, per switching
  client, a new vendor from year t's giant-component firms (excluding the old
  one) with probability proportional to that firm's year-t placed filings,
  1,000 times; this keeps the firms' overall size but throws away who a
  client actually already knew. A second, stricter null narrows the draw to
  firms that already had some filings with that client in year t (so the
  switch was "promotion" of an existing vendor, not a cold pick); it only
  runs when at least 30% of the real switches went to such a firm, otherwise
  the comparison is not meaningful.
- Q2: FY2025's best weighted partition against its best unweighted partition,
  matched by a Hungarian assignment (scipy.optimize.linear_sum_assignment) on
  their contingency table, maximising overlap; a community on either side
  that the assignment leaves unmatched keeps a label of its own, so it never
  accidentally lines up with something it does not overlap. A client "moves"
  when its aligned weighted label differs from its aligned unweighted label.
  The same alignment, applied between two Louvain seeds of one kind, gives
  the noise floor: how much of the apparent movement is just Louvain being
  Louvain.
- Q3: for a client with 2+ vendors, its filings split across its vendors'
  communities (in the best weighted partition); "outside its own community"
  is the share sitting with vendors that are not in the client's own
  community. A "two-community client" has vendors in 2+ communities and a
  second community carrying at least 20% of its filings. The null reruns
  Louvain once on each of 100 degree-preserving bipartite rewirings that keep
  each client's own weight profile intact -- only the firm endpoints of two
  edges are swapped, so a client's filings stay split the same way across
  its (now different) vendors, and each firm keeps its degree -- scored on
  the rewiring's own giant component, and counts the same thing there. (An
  earlier version of this null, week04_staffing.rewire(), also dealt every
  filing weight out at random across the whole network; that loses each
  client's own weight concentration along with the wiring, so its z score
  was measuring the loss of that concentration, not of community structure.)
  A second, simpler control checks the counting method itself: real wiring,
  real partition, only a client's own weights reshuffled among its own
  vendors -- if that barely changes the count, the metric doesn't hinge on
  which of a client's vendors happens to hold which weight.

Checks
- FY2025 giant component node and edge counts against
  analysis/week04_staffing.json main.giant (must match exactly; this is not
  a null, it is a reproduction check).
- Q1's null: a random redraw of the new vendor should land in the client's
  old community only by chance (proportional to firm size); if the observed
  same-community share is not clearly above that, the switch carries no
  information about market structure, and the answer is "no".
- Q2's noise floor: if the weighted-vs-unweighted "move" share is no bigger
  than the seed-to-seed noise floor of either kind, moving is not a real
  effect of the weights, just Louvain's own instability.
- Q3's null: with each client's own weight concentration held fixed, a z
  outside +/-2 says whether real clients split their loyalty across
  communities more, or less, than a random rewiring of that same weight
  profile would produce -- not an artifact of weight concentration, since
  the null already carries it.

Outputs: analysis/week04_staffing_moves.json (every number, with the checks)
and docs/weeks/week04/data/staffing_moves.json (the small page figure).
"""

import json
import random
import statistics
import time
from collections import Counter
from pathlib import Path

import networkx as nx
import numpy as np
from scipy.optimize import linear_sum_assignment
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_names as names
import week04_staffing as st
from week04_schemas import check

OUT = Path(__file__).with_suffix(".json")
PAGE = Path(__file__).resolve().parents[1] / "docs/weeks/week04/data/staffing_moves.json"
YEARS = [2022, 2023, 2024, 2025]
MAIN = 2025
RUNS = 100
SEED = 2805
DRAWS = 1000
THRESHOLDS = (3, 5, 10)
MAIN_THRESHOLD = 5
LINKED_SHARE_GATE = 0.30  # need this share of real switches already-linked before the stricter null means anything


def year_data(year):
    """Everything one year needs for all three questions: the giant component,
    its best-Q weighted partition, and per-client/per-firm filing totals."""
    lca = st.certified(year)
    rows, _, _ = st.placements(year, lca)
    g = st.graph(rows)
    giant = st.giant_of(g)
    runs = [st.louvain(giant, SEED + i) for i in st.tracked(f"FY{year} Louvain weighted", RUNS)]
    best_parts, best_q = max(runs, key=lambda r: r[1])
    member = st.labels(best_parts)

    per_cf = rows.groupby(["client", "employer"]).size().rename("filings").reset_index()
    client_totals = per_cf.groupby("client")["filings"].sum().to_dict()
    firm_totals = per_cf.groupby("employer")["filings"].sum().to_dict()
    vendors_per_client = per_cf.groupby("client")["employer"].nunique().to_dict()
    client_firms = per_cf.groupby("client")["employer"].apply(list).to_dict()

    # A client's main vendor: its heaviest firm that year, dropped on a tie.
    maxvals = per_cf.groupby("client")["filings"].transform("max")
    at_max = per_cf[per_cf["filings"] == maxvals]
    tie_counts = at_max.groupby("client").size()
    unique_clients = set(tie_counts[tie_counts == 1].index)
    main_vendor = {r.client: r.employer for r in at_max.itertuples() if r.client in unique_clients}

    return {
        "year": year, "giant": giant, "member": member, "runs": runs, "best_q": best_q,
        "client_totals": client_totals, "firm_totals": firm_totals,
        "vendors_per_client": vendors_per_client, "client_firms": client_firms,
        "main_vendor": main_vendor,
    }


def null_summary(observed, null_draw):
    """Mean, sd and a p-value (share of null draws at or above observed) for a
    share statistic; the +1 smoothing matches week04_staffing.shuffled_nmi."""
    mean, sd = float(null_draw.mean()), float(null_draw.std())
    return {
        "mean": round(mean, 4), "sd": round(sd, 4),
        "z": round((observed - mean) / sd, 2) if sd > 0 else None,
        "p": round(float((np.sum(null_draw >= observed) + 1) / (len(null_draw) + 1)), 4),
    }


def lift(observed, summary):
    """observed / null mean: how many times more likely than chance the
    switch landed in the same community. None when there is no null mean to
    divide by."""
    if observed is None or summary is None or not summary.get("mean"):
        return None
    return round(observed / summary["mean"], 2)


def verdict(observed, summary):
    """"yes, communities are real markets" needs the observed share clearly
    above the null (z >= 2 and p <= 0.05); anything landing at the null rate
    is "no"."""
    if observed is None or summary is None or summary["z"] is None:
        return "no data"
    return "yes" if summary["z"] >= 2 and summary["p"] <= 0.05 else "no"


def base_null(dt, switches, rng_np):
    """1,000 draws of a new vendor per switching (client, old, new) triple,
    drawn from year t's giant-component firms (excluding the old vendor) with
    probability proportional to the firm's year-t placed filings. Firms
    sharing an old vendor are drawn together in one vectorised call."""
    firms = np.array(sorted({n[1] for n in dt["member"] if n[0] == "F"}))
    idx_of = {f: i for i, f in enumerate(firms)}
    weights = np.array([dt["firm_totals"].get(f, 0.0) for f in firms])
    comm_of_firm = np.array([dt["member"][("F", f)] for f in firms])

    matches_per_draw = np.zeros(DRAWS)
    by_old = {}
    for c, ov, nv in switches:
        by_old.setdefault(ov, []).append(c)
    for ov, clients in by_old.items():
        w = weights.copy()
        if ov in idx_of:
            w[idx_of[ov]] = 0
        probs = w / w.sum()
        draws = rng_np.choice(len(firms), size=(DRAWS, len(clients)), p=probs)
        drawn_comm = comm_of_firm[draws]
        client_comm = np.array([dt["member"][("C", c)] for c in clients])
        matches_per_draw += (drawn_comm == client_comm[None, :]).sum(axis=1)
    return matches_per_draw


def stricter_null(dt, switches, rng_np):
    """The same draw, narrowed to firms that already had some filings with
    that client in year t (excluding the old vendor). Only defined for
    switches where such a firm exists and carries some year-t filings."""
    eligible = []
    for c, ov, nv in switches:
        candidates = [f for f in dt["client_firms"].get(c, []) if f != ov and ("F", f) in dt["member"]]
        weights = np.array([dt["firm_totals"].get(f, 0.0) for f in candidates])
        if not len(candidates) or weights.sum() <= 0:
            continue
        probs = weights / weights.sum()
        draws = rng_np.choice(len(candidates), size=DRAWS, p=probs)
        comm_arr = np.array([dt["member"][("F", f)] for f in candidates])
        client_comm = dt["member"][("C", c)]
        matches = (comm_arr[draws] == client_comm).astype(int)
        observed_match = int(dt["member"][("F", nv)] == client_comm)
        eligible.append((matches, observed_match))
    if not eligible:
        return None, None, 0
    matches_per_draw = np.array([m for m, _ in eligible]).sum(axis=0)
    n = len(eligible)
    observed = sum(o for _, o in eligible) / n
    return observed, matches_per_draw / n, n


def q1_switching(data, rng_np):
    """One entry per consecutive year pair, plus the pooled result."""
    pairs = []
    pooled_n, pooled_matches = 0, 0
    pooled_null = np.zeros(DRAWS)
    pooled_linked_n, pooled_linked_yes = 0, 0
    pooled_strict_n, pooled_strict_matches = 0, 0
    pooled_strict_null = np.zeros(DRAWS)

    for t, t1 in zip(YEARS, YEARS[1:]):
        dt, dt1 = data[t], data[t1]
        common = sorted(set(dt["client_totals"]) & set(dt1["client_totals"]))
        n_at = {th: sum(1 for c in common if dt["client_totals"][c] >= th and dt1["client_totals"][c] >= th)
                for th in THRESHOLDS}
        kept = [c for c in common if dt["client_totals"][c] >= MAIN_THRESHOLD
                and dt1["client_totals"][c] >= MAIN_THRESHOLD
                and c in dt["main_vendor"] and c in dt1["main_vendor"]]
        switched = [(c, dt["main_vendor"][c], dt1["main_vendor"][c]) for c in kept
                    if dt["main_vendor"][c] != dt1["main_vendor"][c]]
        valid = [(c, ov, nv) for c, ov, nv in switched
                 if ("F", ov) in dt["member"] and ("F", nv) in dt["member"] and ("C", c) in dt["member"]]
        dropped = len(switched) - len(valid)

        n = len(valid)
        observed = sum(dt["member"][("C", c)] == dt["member"][("F", nv)] for c, ov, nv in valid) / n if n else None
        null_draw = base_null(dt, valid, rng_np) / n if n else np.zeros(DRAWS)
        summary = null_summary(observed, null_draw) if n else None

        linked_flags = [nv in dt["client_firms"].get(c, []) for c, ov, nv in valid]
        share_linked = sum(linked_flags) / n if n else None
        strict_obs, strict_null_draw, n_elig = stricter_null(dt, valid, rng_np) if n else (None, None, 0)
        strict_summary = None
        if share_linked is not None and share_linked >= LINKED_SHARE_GATE and strict_null_draw is not None:
            s = null_summary(strict_obs, strict_null_draw)
            strict_summary = {"n_eligible": n_elig, "observed_share": round(strict_obs, 4),
                               **s, "lift": lift(strict_obs, s)}

        pairs.append({
            "from": t, "to": t1,
            "clients_in_both_years": len(common),
            "n_at_threshold": {str(th): n_at[th] for th in THRESHOLDS},
            "clients_kept_at_5": len(kept),
            "switches_raw": len(switched),
            "switches_scored": n,
            "switches_dropped_vendor_outside_giant": dropped,
            "observed_share_same_community": round(observed, 4) if observed is not None else None,
            "null": summary,
            "lift": lift(observed, summary),
            "share_new_vendor_already_linked": round(share_linked, 4) if share_linked is not None else None,
            "stricter_null": strict_summary,
            "answer": verdict(observed, summary),
        })

        if n:
            pooled_n += n
            pooled_matches += observed * n
            pooled_null += null_draw * n
            pooled_linked_n += n
            pooled_linked_yes += share_linked * n
        if n_elig:
            pooled_strict_n += n_elig
            pooled_strict_matches += strict_obs * n_elig
            pooled_strict_null += strict_null_draw * n_elig

    pooled_observed = pooled_matches / pooled_n if pooled_n else None
    pooled_null_draw = pooled_null / pooled_n if pooled_n else np.zeros(DRAWS)
    pooled_summary = null_summary(pooled_observed, pooled_null_draw) if pooled_n else None
    pooled_share_linked = pooled_linked_yes / pooled_linked_n if pooled_linked_n else None

    # Pooled stricter null: same gate as each pair (need enough real switches
    # to already-linked vendors for the comparison to mean anything), applied
    # to the pooled share rather than per pair.
    pooled_strict_observed = pooled_strict_matches / pooled_strict_n if pooled_strict_n else None
    pooled_strict_null_draw = pooled_strict_null / pooled_strict_n if pooled_strict_n else np.zeros(DRAWS)
    pooled_strict_summary = None
    if pooled_share_linked is not None and pooled_share_linked >= LINKED_SHARE_GATE and pooled_strict_n:
        s = null_summary(pooled_strict_observed, pooled_strict_null_draw)
        pooled_strict_summary = {"n_eligible": pooled_strict_n, "observed_share": round(pooled_strict_observed, 4),
                                  **s, "lift": lift(pooled_strict_observed, s)}

    pooled = {
        "switches_scored": pooled_n,
        "observed_share_same_community": round(pooled_observed, 4) if pooled_observed is not None else None,
        "null": pooled_summary,
        "lift": lift(pooled_observed, pooled_summary),
        "share_new_vendor_already_linked": round(pooled_share_linked, 4) if pooled_share_linked is not None else None,
        "stricter_null": pooled_strict_summary,
        "answer": verdict(pooled_observed, pooled_summary),
    }
    return pairs, pooled


def align(member_a, member_b, nodes):
    """Hungarian-matched labels: a community on either side keeps a label
    shared with its best-overlap partner on the other side, or a label of its
    own when the assignment leaves it unmatched (more communities on one side
    than the other)."""
    a_ids = sorted({member_a[n] for n in nodes})
    b_ids = sorted({member_b[n] for n in nodes})
    a_idx = {v: i for i, v in enumerate(a_ids)}
    b_idx = {v: i for i, v in enumerate(b_ids)}
    contingency = np.zeros((len(a_ids), len(b_ids)))
    for n in nodes:
        contingency[a_idx[member_a[n]], b_idx[member_b[n]]] += 1
    row_ind, col_ind = linear_sum_assignment(-contingency)
    a_label = {v: f"a{v}" for v in a_ids}
    b_label = {v: f"b{v}" for v in b_ids}
    for r, c in zip(row_ind, col_ind):
        shared = f"m{r}-{c}"
        a_label[a_ids[r]] = shared
        b_label[b_ids[c]] = shared
    return {n: a_label[member_a[n]] for n in nodes}, {n: b_label[member_b[n]] for n in nodes}


def community_top_firm(member, comm_id, strength):
    """The heaviest firm (by weighted degree) in a community; names it."""
    members = [n for n, m in member.items() if m == comm_id and n[0] == "F"]
    if not members:
        return None
    top = max(members, key=lambda n: strength.get(n, 0))
    return st.resolver().label(top[1])


def q2_movers(data):
    dt = data[MAIN]
    giant = dt["giant"]
    nodes = list(giant)
    clients = [n for n in nodes if n[0] == "C"]
    strength = dict(giant.degree(weight="weight"))

    runs_w = dt["runs"]
    member_w = dt["member"]
    runs_u = [st.louvain(st.unweighted(giant), SEED + i) for i in st.tracked("FY2025 Louvain unweighted", RUNS)]
    best_u_parts, best_u_q = max(runs_u, key=lambda r: r[1])
    member_u = st.labels(best_u_parts)

    nmi_best = float(nmi([member_w[n] for n in nodes], [member_u[n] for n in nodes]))

    al_w, al_u = align(member_w, member_u, nodes)
    movers = [c for c in clients if al_w[c] != al_u[c]]
    share_move = len(movers) / len(clients)

    # Noise floor: 10 disjoint seed pairs of the same kind (20 of the 100
    # runs already computed, never reusing a seed across pairs), same
    # alignment method as the weighted-vs-unweighted comparison above. One
    # seed pair is an arbitrary draw; the median (and min/max) across ten
    # says how much of that is just Louvain being Louvain.
    def noise_floor(runs):
        shares = []
        for k in range(10):
            i, j = 2 * k, 2 * k + 1
            m0, m1 = st.labels(runs[i][0]), st.labels(runs[j][0])
            a0, a1 = align(m0, m1, nodes)
            shares.append(sum(1 for c in clients if a0[c] != a1[c]) / len(clients))
        return shares

    noise_weighted_all = noise_floor(runs_w)
    noise_unweighted_all = noise_floor(runs_u)
    noise_weighted = statistics.median(noise_weighted_all)
    noise_unweighted = statistics.median(noise_unweighted_all)

    vendors = {c: dt["vendors_per_client"].get(c[1], 0) for c in clients}
    totals = {c: dt["client_totals"].get(c[1], 0) for c in clients}
    movers_set = set(movers)

    def share_2plus_by_count(subset):
        return sum(1 for c in subset if vendors[c] >= 2) / len(subset) if subset else None

    def share_2plus_by_filings(subset):
        total = sum(totals[c] for c in subset)
        return sum(totals[c] for c in subset if vendors[c] >= 2) / total if total else None

    top_movers = sorted(movers, key=lambda c: -totals[c])[:15]
    top_movers_detail = [{
        "client": st.resolver().label(c[1]), "filings": totals[c], "vendors": vendors[c],
        "main_vendor": st.resolver().label(dt["main_vendor"][c[1]]) if c[1] in dt["main_vendor"] else None,
        "weighted_community_top_firm": community_top_firm(member_w, member_w[c], strength),
        "unweighted_community_top_firm": community_top_firm(member_u, member_u[c], strength),
    } for c in top_movers]

    return {
        "nmi_best_partitions": round(nmi_best, 3),
        "clients": len(clients),
        "movers": len(movers),
        "share_move": round(share_move, 4),
        "noise_floor_weighted_seeds": round(noise_weighted, 4),
        "noise_floor_weighted_seeds_min": round(min(noise_weighted_all), 4),
        "noise_floor_weighted_seeds_max": round(max(noise_weighted_all), 4),
        "noise_floor_unweighted_seeds": round(noise_unweighted, 4),
        "noise_floor_unweighted_seeds_min": round(min(noise_unweighted_all), 4),
        "noise_floor_unweighted_seeds_max": round(max(noise_unweighted_all), 4),
        "movers_2plus_vendor_share": round(share_2plus_by_count(movers), 4) if movers else None,
        "all_clients_2plus_vendor_share": round(share_2plus_by_count(clients), 4),
        "movers_2plus_vendor_filing_share": round(share_2plus_by_filings(movers), 4) if movers else None,
        "all_clients_2plus_vendor_filing_share": round(share_2plus_by_filings(clients), 4),
        "answer": "the movers are the multi-vendor clients" if (
            movers and share_2plus_by_count(movers) > share_2plus_by_count(clients) + 0.1) else "no",
        "top_movers_by_filings": top_movers_detail,
    }, member_u


def two_community_stats(g, member, min_filings=None):
    """For every client with 2+ vendors: does its filings split across 2+
    communities, with the second carrying at least 20%? Returns the count,
    and the count restricted to clients with min_filings+ filings."""
    count, count_min = 0, 0
    for n in g:
        if n[0] != "C":
            continue
        neighbors = list(g.neighbors(n))
        if len(neighbors) < 2:
            continue
        weight = Counter()
        for f in neighbors:
            weight[member[f]] += g[n][f]["weight"]
        total = sum(weight.values())
        top2 = weight.most_common(2)
        if len(top2) < 2:
            continue
        if top2[1][1] / total >= 0.20:
            count += 1
            if min_filings is not None and total >= min_filings:
                count_min += 1
    return count, count_min


def rewire_keep_client_weights(g, rng):
    """Degree-preserving bipartite rewiring in which every edge's weight
    travels with its CLIENT end: only the firm endpoints of two edges are
    swapped. Each client keeps its own multiset of weights (its filing
    concentration across vendors is untouched); each firm keeps its degree
    (how many clients it serves), just not the same ones. This is the null
    week04_staffing.rewire() should have been: that one also shuffles every
    weight across the whole network, so a client's real concentration on one
    or two vendors is destroyed along with the community structure, and the
    resulting null answers a different question (does weight concentration
    in general produce split clients) than the one Q3 asks (do these
    specific communities)."""
    firms, clients, weights = [], [], []
    for u, v in g.edges():
        f, c = (u, v) if u[0] == "F" else (v, u)
        firms.append(f)
        clients.append(c)
        weights.append(g[u][v]["weight"])
    present = set(zip(firms, clients))
    n = len(firms)
    for _ in range(10 * n):
        i, j = rng.randrange(n), rng.randrange(n)
        if i == j:
            continue
        f1, f2 = firms[i], firms[j]
        c1, c2 = clients[i], clients[j]
        if f1 == f2 or c1 == c2 or (f1, c2) in present or (f2, c1) in present:
            continue
        present -= {(f1, c1), (f2, c2)}
        present |= {(f1, c2), (f2, c1)}
        firms[i], firms[j] = f2, f1
    h = nx.Graph()
    h.add_weighted_edges_from(zip(firms, clients, weights))
    return h


def shuffle_weights_within_client(g, rng):
    """Real wiring, real weights, real partition: for every client with 2+
    vendors, its own filing counts are dealt back out at random across its
    own edges only (each vendor still gets one of the client's real weight
    values, just not necessarily the one it actually filed). A sanity check,
    not a null: it asks whether the two-community count depends on which of
    a client's own vendors happens to hold which weight, rather than on the
    community structure itself."""
    h = g.copy()
    for n in h:
        if n[0] != "C":
            continue
        neighbors = list(h.neighbors(n))
        weights = [h[n][f]["weight"] for f in neighbors]
        rng.shuffle(weights)
        for f, w in zip(neighbors, weights):
            h[n][f]["weight"] = w
    return h


def q3_two_communities(data, rng):
    dt = data[MAIN]
    giant = dt["giant"]
    member = dt["member"]
    strength = dict(giant.degree(weight="weight"))

    detail = []
    for n in giant:
        if n[0] != "C":
            continue
        neighbors = list(giant.neighbors(n))
        if len(neighbors) < 2:
            continue
        weight = Counter()
        for f in neighbors:
            weight[member[f]] += giant[n][f]["weight"]
        total = sum(weight.values())
        top2 = weight.most_common(2)
        if len(top2) < 2 or top2[1][1] / total < 0.20:
            continue
        detail.append({
            "client": st.resolver().label(n[1]), "sector": names.naics2(n[1]), "filings": total,
            "communities": [community_top_firm(member, cid, strength) for cid, _ in top2],
            "shares": [round(w / total, 3) for _, w in top2],
            "main_vendor": st.resolver().label(dt["main_vendor"][n[1]]) if n[1] in dt["main_vendor"] else None,
        })

    real_count, real_count_min = two_community_stats(giant, member, st.MIN_FILINGS)

    # Sanity check, not a null: same wiring, same partition, each client's own
    # weights dealt back out across its own edges only. If the two-community
    # count barely moves, the metric is not an artifact of which vendor holds
    # which weight.
    control_g = shuffle_weights_within_client(giant, rng)
    control_count, _ = two_community_stats(control_g, member)
    control_identical = control_count == real_count

    # The null: rewire the bipartite skeleton (who is linked to whom) while
    # keeping each client's own weight profile intact, then re-run Louvain on
    # the rewiring's own giant component and count the same thing there.
    null_counts = []
    for i in st.tracked("Rewirings (client-weight-preserving), one Louvain run each", RUNS):
        h = rewire_keep_client_weights(giant, rng)
        hg = st.giant_of(h)
        parts, _ = st.louvain(hg, SEED + i)
        mem = st.labels(parts)
        c, _ = two_community_stats(hg, mem)
        null_counts.append(c)
    null_counts = np.array(null_counts)
    z = (real_count - null_counts.mean()) / null_counts.std() if null_counts.std() > 0 else None
    # This null already holds each client's own weight concentration fixed
    # (only the wiring is rewired), so a z outside +/-2 is not a weight-
    # concentration artifact; it says whether real clients split their
    # loyalty across communities more, or less, than random rewiring of that
    # same weight profile would produce.
    verdict3 = (
        "no data" if z is None else
        "yes, more split loyalty than chance" if z >= 2 else
        "fewer split clients than rewirings that keep each client's filing counts; the groups follow clients' main suppliers" if z <= -2 else
        "no, indistinguishable from chance"
    )

    top15 = sorted(detail, key=lambda d: -d["filings"])[:15]
    return {
        "two_community_clients": real_count,
        "two_community_clients_min_filings": real_count_min,
        "min_filings_cutoff": st.MIN_FILINGS,
        "null_mean": round(float(null_counts.mean()), 2),
        "null_sd": round(float(null_counts.std()), 2),
        "z": round(float(z), 2) if z is not None else None,
        "verdict": verdict3,
        "control_within_client_shuffle": {
            "two_community_clients": control_count,
            "identical_to_observed": control_identical,
        },
        "top_by_filings": top15,
    }


def main():
    started = time.time()
    rng = random.Random(SEED)
    rng_np = np.random.default_rng(SEED)

    data = {y: year_data(y) for y in YEARS}

    # Reproduction check: FY2025 giant component against week04_staffing.json.
    checked = json.loads((Path(__file__).with_name("week04_staffing.json")).read_text())["main"]["giant"]
    giant2025 = data[MAIN]["giant"]
    match = (giant2025.number_of_nodes() == checked["nodes"] and giant2025.number_of_edges() == checked["edges"])
    print(f"FY2025 giant: {giant2025.number_of_nodes()} nodes, {giant2025.number_of_edges()} edges "
          f"(week04_staffing.json: {checked['nodes']}/{checked['edges']}) -- {'match' if match else 'MISMATCH'}",
          flush=True)
    if not match:
        raise SystemExit("FY2025 giant component does not reproduce week04_staffing.json's main.giant")

    q1_pairs, q1_pooled = q1_switching(data, rng_np)
    q2, member_u = q2_movers(data)
    q3 = q3_two_communities(data, rng)

    out = {
        "generated_by": "analysis/week04_staffing_moves.py", "runs": RUNS, "draws": DRAWS, "year": MAIN,
        "giant_check": {"nodes": giant2025.number_of_nodes(), "edges": giant2025.number_of_edges(), "match": match},
        "q1_switching": {"pairs": q1_pairs, "pooled": q1_pooled},
        "q2_movers": q2,
        "q3_two_communities": q3,
        "seconds": round(time.time() - started),
    }
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")

    q1_stricter = q1_pooled.get("stricter_null")
    finding = {
        "q1_pooled_observed_share": q1_pooled["observed_share_same_community"],
        "q1_pooled_null_mean": q1_pooled["null"]["mean"] if q1_pooled["null"] else None,
        "q1_pooled_null_sd": q1_pooled["null"]["sd"] if q1_pooled["null"] else None,
        "q1_pooled_p": q1_pooled["null"]["p"] if q1_pooled["null"] else None,
        "q1_pooled_z": q1_pooled["null"]["z"] if q1_pooled["null"] else None,
        "q1_pooled_lift": q1_pooled.get("lift"),
        "q1_answer": q1_pooled["answer"],
        "q1_share_new_vendor_already_linked": q1_pooled["share_new_vendor_already_linked"],
        "q1_pooled_stricter_observed_share": q1_stricter["observed_share"] if q1_stricter else None,
        "q1_pooled_stricter_null_mean": q1_stricter["mean"] if q1_stricter else None,
        "q1_pooled_stricter_null_sd": q1_stricter["sd"] if q1_stricter else None,
        "q1_pooled_stricter_z": q1_stricter["z"] if q1_stricter else None,
        "q1_pooled_stricter_lift": q1_stricter["lift"] if q1_stricter else None,
        "q2_share_move": q2["share_move"],
        "q2_noise_floor_weighted": q2["noise_floor_weighted_seeds"],
        "q2_noise_floor_weighted_min": q2["noise_floor_weighted_seeds_min"],
        "q2_noise_floor_weighted_max": q2["noise_floor_weighted_seeds_max"],
        "q2_noise_floor_unweighted": q2["noise_floor_unweighted_seeds"],
        "q2_noise_floor_unweighted_min": q2["noise_floor_unweighted_seeds_min"],
        "q2_noise_floor_unweighted_max": q2["noise_floor_unweighted_seeds_max"],
        "q2_movers_2plus_vendor_share": q2["movers_2plus_vendor_share"],
        "q2_all_clients_2plus_vendor_share": q2["all_clients_2plus_vendor_share"],
        "q2_answer": q2["answer"],
        "q3_two_community_clients": q3["two_community_clients"],
        "q3_null_mean": q3["null_mean"],
        "q3_null_sd": q3["null_sd"],
        "q3_z": q3["z"],
        "q3_verdict": q3["verdict"],
    }
    if not q3["control_within_client_shuffle"]["identical_to_observed"]:
        # Only worth a spot on the page if it turned out NOT to be a pure
        # sanity check -- see the module docstring's Q3 method note.
        finding["q3_control_within_client_shuffle_count"] = q3["control_within_client_shuffle"]["two_community_clients"]

    page = {
        "generated_by": "analysis/week04_staffing_moves.py", "year": MAIN,
        "finding": finding,
        "q1_pairs": [{k: p[k] for k in ("from", "to", "switches_scored", "observed_share_same_community",
                                        "null", "lift", "answer")} for p in q1_pairs],
        "q2_top_movers": q2["top_movers_by_filings"][:15],
        "q3_top_clients": q3["top_by_filings"][:15],
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1) + "\n")

    print(json.dumps(out["q1_switching"], indent=1, default=str))
    print(json.dumps({k: v for k, v in q2.items() if k != "top_movers_by_filings"}, indent=1, default=str))
    print(json.dumps({k: v for k, v in q3.items() if k != "top_by_filings"}, indent=1, default=str))
    print(f"done in {st.span(time.time() - started)}", flush=True)


if __name__ == "__main__":
    main()
