"""Week 4, section 2 extension: do outsourcers and direct hirers hire different
job mixes, and which jobs sit in two clusters at once?

Network: the same companies x occupations projection as week04_jobs.py (two
occupations link when the same companies file for both, weight = number of
such companies), split by company into placing firms and direct hirers for Q1,
and left whole for Q2.

Questions
- Q1: do outsourcers and direct hirers hire different job mixes?
- Q2: which jobs sit in two clusters at once (Ahn, Bagrow and Lehmann 2010)?

Method, Q1
- A company is a placing firm two ways: "any" (at least one filing with
  SECONDARY_ENTITY starting "Y") and the headline "min20"
  (week04_staffing.MIN_FILINGS = 20 or more placed filings, the same rule
  week04_staffing.intermediaries uses for subcontracting chains). Everything
  else is a direct hirer. The headline split is min20: a single placed filing
  says little about a company's job mix, and "any" makes 8,282 of 59,230
  companies "placing firms" on one filing each.
- Each group keeps every filing of its companies (placed and direct alike):
  the split is by company, not by row, so a placing firm's directly-hired
  occupations count in its own group's projection.
- week04_jobs.projection on each group's frame, week04_jobs.communities (100
  Louvain seeds, best modularity kept) on each. Compared with NMI and AMI on
  occupations present in both projections and in a cluster of two or more in
  both (own group's labels).
- Null: 20 random splits of every company into two groups of the same size as
  the headline groups (818 and 58,412), same procedure. Company-count matching
  badly mismatches filing volume here (818 companies chosen at random hold a
  tiny share of filings; the real 818 placing firms hold about a fifth), so a
  second null instead samples companies until each random group's filing total
  matches the real group's. Neither null matches both at once, so a third
  null stratifies every company into log2 filing-count bins (1, 2-3, 4-7, ...)
  and, for each of 20 draws, samples from each bin exactly as many companies
  (without replacement, excluding nothing) as the real placing group has in
  that bin; this matches both the placing group's company count and its
  filing share by construction. The headline verdict on "different job mixes"
  still comes from the count- and filing-matched nulls; this size-matched
  null instead gives a z-score and a plain "different"/"no difference" call
  against the observed NMI, reported alongside. Louvain uses 10 seeds per
  projection (best Q, not the full 100-seed week04_jobs.communities, to keep
  20 nulls affordable).
- Occupations shown only in one group's projection (never filed by any company
  in the other group), and each group's 15 most-filed occupations with their
  share of the group's filings.
- Each group's modularity, and NMI/AMI with SOC major group (week04_jobs.agreement).

Method, Q2
- No cdlib. Ahn's link similarity: Jaccard of the inclusive neighbourhoods
  (self plus neighbours) of the two endpoints that are not the shared node,
  for every pair of links (edges of the projection) sharing a node.
  Single-linkage clustering is a union-find over link pairs sorted by
  similarity descending, merging whichever two link-clusters a pair belongs to
  when they differ; partition density D (Ahn et al.'s equation 3) is tracked
  incrementally after every merge and the cut is the merge with the highest D.
- Time-box: the pairs sharing a node (sum_i k_i(k_i-1)/2) are counted first.
  Under about 30 million, the full projection runs (this year: about 5.7
  million, so it does). Over that, the disparity-filter backbone at
  week04_where.DEFAULT_ALPHA runs instead, same construction as
  week04_jobs.backbone_check, with the brief's caveat against detecting
  communities on a backbone recorded alongside. If even the backbone does not
  finish in about 15 minutes, Q2 stops and says so; Q1 still runs.
- Link communities of three or more links; per occupation, its links (degree),
  the number of distinct link communities (of any size, including singleton
  links) touching it, and communities per link. Spearman correlation between
  communities and degree shows how much of the raw count is just degree.
- Top 15 occupations by communities per link among occupations with at least
  10 links, compared with week04_jobs.py's lift-based bridge list (all 7,
  recomputed here with the same seed and rule since none of the 7 are among
  the 60 occupations jobs.json shows on the page).

Checks
- Q1 null: observed NMI far below both nulls' distribution says "yes, the
  mixes differ"; observed within the null range says "no".
- Q1 unique-occupation lists and top-15-by-filings lists are read off the
  groups' own projections, not modelled.
- Q2: partition density D is bounded in [0, 1] (asserted at every merge, and
  by check_partition_density's toy graph, two triangles sharing a node, where
  the right cut gives exactly D = 1); a near-complete projection graph (median
  degree 94 of 500 possible) can still give a lopsided cut at the best D (one
  giant cluster, many small ones), and that lopsidedness is itself worth
  reporting, not smoothed over.

Seed: week04_jobs.SEED (204).

Outputs: analysis/week04_jobs_split.json (every number), and
docs/weeks/week04/data/jobs_split.json (the page's numbers).
"""

import itertools
import json
import math
import random
import sys
import time
from collections import Counter
from pathlib import Path

import numpy as np
from scipy.stats import spearmanr
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_jobs as jobs
import week04_where as where
from week04_schemas import check
from week04_staffing import MIN_FILINGS, intermediaries, louvain, tracked

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "analysis" / "week04_jobs_split.json"
PAGE = ROOT / "docs" / "weeks" / "week04" / "data" / "jobs_split.json"
YEAR = 2025
SEED = jobs.SEED  # 204, the same seed section 2 uses
NULLS = 20  # random splits per null kind
NULL_SEEDS = 10  # Louvain seeds per null projection, best Q kept
TOP_OCC = 15
TOP_UNIQUE = 10
LINK_PAIR_BUDGET = 30_000_000  # switch to the backbone above this
TIME_BUDGET_Q2 = 15 * 60  # seconds


def placement_groups(frame):
    """Company keys split two ways: "any" (a company with at least one placed
    filing) and "min20" (week04_staffing.MIN_FILINGS or more placed filings,
    the headline)."""
    placed = frame[frame["SECONDARY_ENTITY"].str.upper().str.startswith("Y", na=False)]
    any_placing = set(placed["company"].unique())
    counts = placed["company"].value_counts()
    min20_placing = set(counts[counts >= MIN_FILINGS].index)
    companies = set(frame["company"].unique())
    return {
        "any": (any_placing, companies - any_placing),
        "min20": (min20_placing, companies - min20_placing),
    }


def group_frame(frame, companies):
    return frame[frame["company"].isin(companies)]


def top_occupations(frame_group, titles, n=TOP_OCC):
    filings = Counter(frame_group["occupation"])
    total = sum(filings.values())
    top = sorted(filings, key=lambda o: (-filings[o], o))[:n]
    return [{"id": o, "title": titles.get(o, o), "filings": filings[o],
             "share": round(filings[o] / total, 4)} for o in top]


def unique_to_group(graph_a, graph_b, filings_a, n=TOP_UNIQUE):
    """Occupations in graph_a's node set but not graph_b's (never filed by any
    company in the other group), the n most-filed first."""
    only = sorted(set(graph_a) - set(graph_b), key=lambda o: (-filings_a[o], o))
    return {"count": len(only), "top": [{"id": o, "filings": filings_a[o]} for o in only[:n]]}


def shared_qualifying(graph_a, labels_a, graph_b, labels_b):
    """Occupations present in both projections and in a cluster of 2+ in each
    group's own labels."""
    common = set(graph_a) & set(graph_b)
    size_a, size_b = Counter(labels_a.values()), Counter(labels_b.values())
    return sorted(n for n in common if size_a[labels_a[n]] > 1 and size_b[labels_b[n]] > 1)


def compare_partitions(graph_a, labels_a, graph_b, labels_b):
    nodes = shared_qualifying(graph_a, labels_a, graph_b, labels_b)
    if len(nodes) < 2:
        return {"n": len(nodes), "nmi": None, "ami": None}
    a, b = [labels_a[n] for n in nodes], [labels_b[n] for n in nodes]
    return {"n": len(nodes), "nmi": float(nmi(a, b)), "ami": float(ami(a, b))}


def random_split_by_count(companies, n_a, rng):
    # sorted(), not list(): a set's iteration order depends on the process's
    # hash seed, so shuffling list(companies) would not reproduce with a
    # fixed rng seed across reruns.
    pool = sorted(companies)
    rng.shuffle(pool)
    return set(pool[:n_a]), set(pool[n_a:])


def random_split_by_filings(companies, filing_of, target, rng):
    pool = sorted(companies)
    rng.shuffle(pool)
    a, total = set(), 0
    for c in pool:
        if total >= target:
            break
        a.add(c)
        total += filing_of.get(c, 0)
    return a, companies - a, total


def filing_bin(n):
    """log2 bin label for a filing count: 1, 2-3, 4-7, 8-15, ..."""
    k = 0 if n <= 1 else int(math.floor(math.log2(n)))
    lo, hi = 1 << k, (1 << (k + 1)) - 1
    return str(lo) if lo == hi else f"{lo}-{hi}"


def random_split_matched_bins(companies, filing_of, placing_companies, rng):
    """Stratify every company by its log2 filing-count bin, then from each bin
    draw (without replacement, excluding nothing) exactly as many companies as
    the real placing group holds in that bin. The rest form the direct group.
    Bin membership and draw order both come from sorted() lists, so the draws
    are reproducible across processes regardless of set/dict hash order."""
    bins_all = {}
    for c in sorted(companies):
        bins_all.setdefault(filing_bin(filing_of.get(c, 0)), []).append(c)
    bins_needed = Counter(filing_bin(filing_of.get(c, 0)) for c in sorted(placing_companies))
    a = set()
    for label, need in bins_needed.items():
        pool = sorted(bins_all[label])
        if need > len(pool):
            raise ValueError(f"filing bin {label} has only {len(pool)} companies, need {need}")
        rng.shuffle(pool)
        a.update(pool[:need])
    return a, companies - a


def null_partition(frame_group):
    """The best of NULL_SEEDS Louvain seeds on a group's projection."""
    graph, _ = jobs.projection(frame_group)
    best = max((louvain(graph, s) for s in range(NULL_SEEDS)), key=lambda r: r[1])
    return graph, jobs.as_labels(best[0]), best[1]


def q1_null(frame, companies, n_placing, filing_of, target_filings, kind, label,
            placing_companies=None):
    """NULLS random splits of every company (matched by company count when
    kind == "count", by filing total when kind == "filings", by filing-count
    bin when kind == "matched_bins"), rebuilt projections, best-of-NULL_SEEDS
    Louvain, compared like the real groups."""
    rng = random.Random(SEED)
    results, filing_shares = [], []
    for i in tracked(label, NULLS):
        if kind == "count":
            a, b = random_split_by_count(companies, n_placing, rng)
        elif kind == "matched_bins":
            a, b = random_split_matched_bins(companies, filing_of, placing_companies, rng)
        else:
            a, b, _ = random_split_by_filings(companies, filing_of, target_filings, rng)
        fa, fb = group_frame(frame, a), group_frame(frame, b)
        ga, la, qa = null_partition(fa)
        gb, lb, qb = null_partition(fb)
        results.append(compare_partitions(ga, la, gb, lb))
        filing_shares.append(fa["occupation"].size / (fa["occupation"].size + fb["occupation"].size))
    nmis = [r["nmi"] for r in results if r["nmi"] is not None]
    amis = [r["ami"] for r in results if r["ami"] is not None]
    return {
        "runs": NULLS, "matched_on": kind,
        "n_shared_qualifying_median": int(np.median([r["n"] for r in results])),
        "nmi_mean": float(np.mean(nmis)) if nmis else None,
        "nmi_sd": float(np.std(nmis)) if nmis else None,
        "nmi_min": float(np.min(nmis)) if nmis else None,
        "ami_mean": float(np.mean(amis)) if amis else None,
        "filing_share_of_group_a_mean": round(float(np.mean(filing_shares)), 4),
        "filing_share_of_group_a_sd": round(float(np.std(filing_shares)), 4),
    }


def q1(frame, titles):
    groups = placement_groups(frame)
    filing_of = frame.groupby("company").size().to_dict()
    total_filings = len(frame)
    out = {"variants": {}}
    headline_stats = None
    for kind in ("min20", "any"):
        placing, direct = groups[kind]
        f_placing, f_direct = group_frame(frame, placing), group_frame(frame, direct)
        g_placing, filings_placing = jobs.projection(f_placing)
        g_direct, filings_direct = jobs.projection(f_direct)
        lab_placing, stats_placing, _ = jobs.communities(g_placing)
        lab_direct, stats_direct, _ = jobs.communities(g_direct)
        observed = compare_partitions(g_placing, lab_placing, g_direct, lab_direct)
        agree_placing = jobs.agreement(lab_placing, g_placing)
        agree_direct = jobs.agreement(lab_direct, g_direct)
        variant = {
            "placing_companies": len(placing), "direct_companies": len(direct),
            "placing_filings": len(f_placing), "direct_filings": len(f_direct),
            "placing_filing_share": round(len(f_placing) / total_filings, 4),
            "placing_occupations": g_placing.number_of_nodes(),
            "direct_occupations": g_direct.number_of_nodes(),
            "observed": observed,
            "placing_modularity": stats_placing["modularity_best"],
            "direct_modularity": stats_direct["modularity_best"],
            "placing_clusters": stats_placing["clusters"],
            "direct_clusters": stats_direct["clusters"],
            "placing_soc_agreement": {k: agree_placing[k] for k in ("nmi", "ami", "occupations")},
            "direct_soc_agreement": {k: agree_direct[k] for k in ("nmi", "ami", "occupations")},
            "placing_top_occupations": top_occupations(f_placing, titles),
            "direct_top_occupations": top_occupations(f_direct, titles),
            "only_in_placing": unique_to_group(g_placing, g_direct, filings_placing),
            "only_in_direct": unique_to_group(g_direct, g_placing, filings_direct),
        }
        out["variants"][kind] = variant
        if kind == "min20":
            headline_stats = (placing, direct, len(f_placing), len(f_direct))
    # Nulls run only for the headline (min20) split.
    placing, direct, placing_filings, direct_filings = headline_stats
    companies = placing | direct
    null_count = q1_null(frame, companies, len(placing), filing_of, placing_filings,
                          "count", "Q1 null, company-count matched")
    null_filings = q1_null(frame, companies, len(placing), filing_of, placing_filings,
                            "filings", "Q1 null, filing-total matched")
    null_matched = q1_null(frame, companies, len(placing), filing_of, placing_filings,
                            "matched_bins", "Q1 null, filing-count bin matched",
                            placing_companies=placing)
    observed = out["variants"]["min20"]["observed"]
    verdict = "no result: too few qualifying occupations to compare"
    if observed["nmi"] is not None and null_count["nmi_mean"] is not None:
        below_count = observed["nmi"] < null_count["nmi_mean"] - 2 * (null_count["nmi_sd"] or 0)
        below_filings = null_filings["nmi_mean"] is None or observed["nmi"] < (
            null_filings["nmi_mean"] - 2 * (null_filings["nmi_sd"] or 0))
        verdict = "yes, different job mixes" if below_count and below_filings else "no, consistent with the null"
    matched_z, matched_verdict = None, "no result: too few qualifying occupations to compare"
    if observed["nmi"] is not None and null_matched["nmi_mean"] is not None and null_matched["nmi_sd"]:
        matched_z = (observed["nmi"] - null_matched["nmi_mean"]) / null_matched["nmi_sd"]
        matched_verdict = "no difference" if abs(matched_z) < 2 else "different"
    out["null"] = {
        "company_count_matched": null_count, "filing_total_matched": null_filings,
        "size_matched": null_matched,
    }
    out["headline"] = {
        "variant": "min20", "observed_nmi": out["variants"]["min20"]["observed"]["nmi"],
        "observed_ami": out["variants"]["min20"]["observed"]["ami"],
        "observed_n": out["variants"]["min20"]["observed"]["n"],
        "verdict": verdict,
        "null_matched_nmi_mean": null_matched["nmi_mean"],
        "null_matched_nmi_sd": null_matched["nmi_sd"],
        "null_matched_filing_share": null_matched["filing_share_of_group_a_mean"],
        "matched_z": matched_z,
        "matched_verdict": matched_verdict,
    }
    return out


def link_similarities(graph):
    """(edges, sims array parallel to a (ei, ej) index array): Jaccard of the
    inclusive neighbourhoods of the two non-shared endpoints, for every pair
    of edges sharing a node."""
    nodes = sorted(graph)
    idx = {n: i for i, n in enumerate(nodes)}
    incl = [0] * len(nodes)
    for n in nodes:
        mask = 1 << idx[n]
        for nb in graph[n]:
            mask |= 1 << idx[nb]
        incl[idx[n]] = mask
    edges = list(graph.edges())
    incident = [[] for _ in nodes]
    for ei, (u, v) in enumerate(edges):
        incident[idx[u]].append(ei)
        incident[idx[v]].append(ei)
    pairs_i, pairs_j, sims = [], [], []
    for node_idx, elist in enumerate(incident):
        for a in range(len(elist)):
            ei = elist[a]
            u, v = edges[ei]
            other_a = idx[u] if idx[v] == node_idx else idx[v]
            na = incl[other_a]
            for b in range(a + 1, len(elist)):
                ej = elist[b]
                u2, v2 = edges[ej]
                other_b = idx[u2] if idx[v2] == node_idx else idx[v2]
                nb = incl[other_b]
                inter = bin(na & nb).count("1")
                union = bin(na | nb).count("1")
                pairs_i.append(ei)
                pairs_j.append(ej)
                sims.append(inter / union if union else 0.0)
    return nodes, idx, edges, np.array(pairs_i), np.array(pairs_j), np.array(sims, dtype=np.float32)


def partition_density_cut(idx, edges, pairs_i, pairs_j, sims, started):
    """Single-linkage union-find over links, merging in similarity order;
    partition density (Ahn, Bagrow and Lehmann 2010, eq. 3) tracked
    incrementally, the cut is the merge with the highest D.

    D = (2/M) * sum_c m_c * (m_c - (n_c - 1)) / ((n_c - 2)(n_c - 1)), 0 for a
    cluster of n_c <= 2 nodes (a single link; the paper defines this case as 0
    to dodge 0/0). D_c alone (the per-cluster term before the m_c weight) is 0
    for a tree and 1 for a clique; D itself is bounded in [0, 1], checked by
    check_partition_density() below and asserted at every merge here."""
    m = len(edges)
    parent = list(range(m))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    m_c = [1] * m
    node_mask = [(1 << idx[u]) | (1 << idx[v]) for u, v in edges]

    def contrib(mc, nc):
        if nc <= 2:
            return 0.0
        return mc * (mc - (nc - 1)) / ((nc - 2) * (nc - 1))

    order = np.argsort(-sims, kind="stable")
    total, best_total, best_step, merges = 0.0, 0.0, 0, 0
    best_sim = 1.0
    for k in order:
        if time.time() - started > TIME_BUDGET_Q2:
            return None
        ei, ej = int(pairs_i[k]), int(pairs_j[k])
        ra, rb = find(ei), find(ej)
        if ra == rb:
            continue
        if m_c[ra] < m_c[rb]:
            ra, rb = rb, ra
        total -= contrib(m_c[ra], bin(node_mask[ra]).count("1"))
        total -= contrib(m_c[rb], bin(node_mask[rb]).count("1"))
        parent[rb] = ra
        m_c[ra] += m_c[rb]
        node_mask[ra] |= node_mask[rb]
        total += contrib(m_c[ra], bin(node_mask[ra]).count("1"))
        merges += 1
        d = 2 * total / m
        assert -1e-9 <= d <= 1 + 1e-9, f"partition density out of [0,1]: {d} at merge {merges}"
        if d > best_total:
            best_total, best_step, best_sim = d, merges, float(sims[k])
    # Replay merges up to the cut to get the final link-cluster labels.
    parent2 = list(range(m))

    def find2(x):
        while parent2[x] != x:
            parent2[x] = parent2[parent2[x]]
            x = parent2[x]
        return x

    done = 0
    for k in order:
        if done >= best_step:
            break
        ei, ej = int(pairs_i[k]), int(pairs_j[k])
        ra, rb = find2(ei), find2(ej)
        if ra == rb:
            continue
        parent2[rb] = ra
        done += 1
    link_cluster = [find2(e) for e in range(m)]
    return {"D": best_total, "cut_similarity": best_sim, "merges": best_step,
            "merges_possible": m - 1, "link_cluster": link_cluster}


def check_partition_density():
    """Two triangles sharing one node (A-B-C-A, A-D-E-A): each triangle is a
    perfect clique (D_c = 1), so the right cut (both triangles kept apart,
    never merged into one 5-node blob) should give partition density D = 1."""
    import networkx as nx
    g = nx.Graph()
    g.add_edges_from([("A", "B"), ("B", "C"), ("C", "A"), ("A", "D"), ("D", "E"), ("E", "A")])
    nodes, idx, edges, pi, pj, sims = link_similarities(g)
    cut = partition_density_cut(idx, edges, pi, pj, sims, time.time())
    assert cut is not None and abs(cut["D"] - 1.0) < 1e-9, f"expected D=1 on two triangles, got {cut}"


def q2(frame, titles):
    started = time.time()
    graph, filings = jobs.projection(frame)
    degrees = dict(graph.degree())
    pairs = sum(k * (k - 1) // 2 for k in degrees.values())
    result = {"occupations": graph.number_of_nodes(), "links": graph.number_of_edges(),
              "link_pairs_sharing_a_node": pairs, "budget": LINK_PAIR_BUDGET}
    on = "full projection"
    working = graph
    if pairs > LINK_PAIR_BUDGET:
        p = where.disparity(graph)
        kept = [(u, v, graph[u][v]["weight"]) for (u, v), pv in p.items() if pv < where.DEFAULT_ALPHA]
        import networkx as nx
        bone = nx.Graph()
        bone.add_weighted_edges_from(kept)
        working = bone
        degrees = dict(bone.degree())
        pairs2 = sum(k * (k - 1) // 2 for k in degrees.values())
        on = f"backbone at alpha {where.DEFAULT_ALPHA}"
        result["backbone_pairs_sharing_a_node"] = pairs2
        result["caveat"] = ("Community detection on a disparity-filter backbone is what the course "
                             "brief warns against; used here only because the full projection's link "
                             "pairs exceeded the budget.")
        if pairs2 > LINK_PAIR_BUDGET * 3:
            result["status"] = "did not finish"
            result["reason"] = f"{pairs2:,} link pairs remain even on the backbone"
            return result
    result["on"] = on
    nodes, idx, edges, pairs_i, pairs_j, sims = link_similarities(working)
    cut = partition_density_cut(idx, edges, pairs_i, pairs_j, sims, started)
    if cut is None:
        result["status"] = "did not finish"
        result["reason"] = f"single-linkage clustering did not finish within {TIME_BUDGET_Q2}s"
        return result
    link_cluster = cut["link_cluster"]
    cluster_size = Counter(link_cluster)
    big = {c for c, n in cluster_size.items() if n >= 3}
    incident = {n: [] for n in nodes}
    for ei, (u, v) in enumerate(edges):
        incident[u].append(ei)
        incident[v].append(ei)
    per_occ = {}
    for n in nodes:
        elist = incident[n]
        clusters = {link_cluster[e] for e in elist}
        per_occ[n] = {"links": len(elist), "communities": len(clusters),
                      "communities_per_link": round(len(clusters) / len(elist), 3) if elist else 0.0}
    with_links = [n for n in nodes if per_occ[n]["links"] >= 1]
    rho, rho_p = spearmanr([per_occ[n]["communities"] for n in with_links],
                           [per_occ[n]["links"] for n in with_links])
    eligible = [n for n in nodes if per_occ[n]["links"] >= 10]
    top15 = sorted(eligible, key=lambda n: (-per_occ[n]["communities_per_link"], -per_occ[n]["links"], n))[:15]
    result.update({
        "D_at_cut": cut["D"], "cut_similarity": cut["cut_similarity"],
        "merges": cut["merges"], "merges_possible": cut["merges_possible"],
        "link_clusters": len(cluster_size), "link_clusters_of_3_or_more": len(big),
        "spearman_communities_vs_degree": {"rho": float(rho), "p": float(rho_p), "n": len(with_links)},
        "top15_by_communities_per_link": [
            {"id": n, "title": titles.get(n, n), "links": per_occ[n]["links"],
             "communities": per_occ[n]["communities"],
             "communities_per_link": per_occ[n]["communities_per_link"]} for n in top15],
    })
    # The seven lift-based bridges from section 2 (recomputed: none of the 60
    # occupations jobs.json shows on the page are bridges, bridges.shown == 0).
    labels, _, _ = jobs.communities(graph)
    null_stats, null_lifts = jobs.null_check(frame, graph, labels)
    membership, _ = jobs.second_clusters(graph, labels, null_lifts)
    bridges = sorted(n for n, m in membership.items() if len(m) > 1)
    top15_ids = {n["id"] for n in result["top15_by_communities_per_link"]}
    result["bridges"] = {
        "all_occupations": [{"id": n, "title": titles.get(n, n), "links": per_occ.get(n, {}).get("links", 0)}
                            for n in bridges],
        "count": len(bridges), "in_top15": sorted(top15_ids & set(bridges)),
        "in_top15_count": len(top15_ids & set(bridges)),
    }
    return result


def main():
    check_partition_density()
    started = time.time()
    frame = jobs.filtered(YEAR)
    titles = jobs.titles_of(frame)
    q1_result = q1(frame, titles)
    q2_result = q2(frame, titles)
    seconds = round(time.time() - started)
    out = {
        "generated_by": "analysis/week04_jobs_split.py", "year": YEAR, "seed": SEED,
        "meta": {"filings": len(frame), "companies": int(frame["company"].nunique()),
                 "occupations": int(frame["occupation"].nunique())},
        "q1": q1_result, "q2": q2_result, "seconds": seconds,
    }
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")

    headline = q1_result["headline"]
    variant = q1_result["variants"]["min20"]
    page = {
        "generated_by": "analysis/week04_jobs_split.py", "year": YEAR,
        "finding": {
            "q1_verdict": headline["verdict"],
            "q1_observed_nmi": headline["observed_nmi"], "q1_observed_ami": headline["observed_ami"],
            "q1_observed_n": headline["observed_n"],
            "q1_null_count_matched_nmi_mean": q1_result["null"]["company_count_matched"]["nmi_mean"],
            "q1_null_count_matched_nmi_sd": q1_result["null"]["company_count_matched"]["nmi_sd"],
            "q1_null_filings_matched_nmi_mean": q1_result["null"]["filing_total_matched"]["nmi_mean"],
            "q1_null_filings_matched_nmi_sd": q1_result["null"]["filing_total_matched"]["nmi_sd"],
            "q1_null_matched_nmi_mean": headline["null_matched_nmi_mean"],
            "q1_null_matched_nmi_sd": headline["null_matched_nmi_sd"],
            "q1_null_matched_filing_share": headline["null_matched_filing_share"],
            "q1_matched_z": headline["matched_z"],
            "q1_matched_verdict": headline["matched_verdict"],
            "q1_placing_companies": variant["placing_companies"], "q1_direct_companies": variant["direct_companies"],
            "q1_placing_filing_share": variant["placing_filing_share"],
            "q1_placing_modularity": variant["placing_modularity"], "q1_direct_modularity": variant["direct_modularity"],
            "q2_status": q2_result.get("status", "ok"),
            "q2_on": q2_result.get("on"), "q2_D_at_cut": q2_result.get("D_at_cut"),
            "q2_link_clusters_of_3_or_more": q2_result.get("link_clusters_of_3_or_more"),
            "q2_spearman_communities_vs_degree": q2_result.get("spearman_communities_vs_degree", {}).get("rho"),
            "q2_bridges_count": q2_result.get("bridges", {}).get("count"),
            "q2_bridges_in_top15_count": q2_result.get("bridges", {}).get("in_top15_count"),
        },
        "q1": {
            "placing_top_occupations": variant["placing_top_occupations"][:15],
            "direct_top_occupations": variant["direct_top_occupations"][:15],
            "only_in_placing": variant["only_in_placing"],
            "only_in_direct": variant["only_in_direct"],
        },
        "q2": {
            "top15_by_communities_per_link": q2_result.get("top15_by_communities_per_link", []),
            "bridges": q2_result.get("bridges", {}),
        },
    }
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1) + "\n")

    print(f"{seconds}s total")
    print("Q1 headline (min20):", headline)
    print("Q1 null, company-count matched:", q1_result["null"]["company_count_matched"])
    print("Q1 null, filing-total matched:", q1_result["null"]["filing_total_matched"])
    print("Q1 null, filing-count bin matched:", q1_result["null"]["size_matched"])
    print("Q1 matched z, verdict:", headline["matched_z"], headline["matched_verdict"])
    print("Q2:", {k: v for k, v in q2_result.items() if k not in
                  ("top15_by_communities_per_link", "bridges")})
    print("Q2 bridges:", q2_result.get("bridges"))
    print(f"-> {OUT.relative_to(ROOT)}, {PAGE.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
