"""Week 4, go-deeper: the giant hub hides the structure.  Owner: Gyula.

Network: law firm -- law firm, projected from the employer -- law firm
bipartite graph of who filed an H-1B application through whom
(LAWFIRM_NAME_BUSINESS_NAME). Two firms are linked when at least one employer
filed through both in the year; weight = the number of such shared employers
(not filings: an employer that moves 200 filings through one firm should not
outweigh ten employers that each use two firms).

Questions
- How much of the market does the largest law firm hold, and does that hide
  once the field of employers it never touches is counted?
- A global weight threshold keeps hubs talking to hubs (course brief S8): does
  it draw the same map as the disparity filter (Serrano, Boguna and
  Vespignani 2009), which keeps a link that matters to either endpoint even if
  it is thin on both sides?
- Which law firms does the disparity filter keep that a same-size threshold
  would cut, and are they two-employer specialists the threshold cannot see?
- Do the communities the backbone splits into follow a firm's clients
  (placing vs. direct employers, from week04_lottery.kinds) or its home state?

Law firm keys: legal_name() strips punctuation and legal suffixes but does not
merge two spellings of one firm unless they normalize to the very same
letters. Two extra passes close what the reviewed alias table
(week04_client_aliases.csv) does for companies but does not cover law firms:
- compact-collapse: spellings that agree once spaces are removed ("MUSILLO
  UNKENHOLT" / "MUSILLOUNKENHOLT") fold to whichever spelling has more
  filings, the same rule family() uses for "WELLSFARGO".
- LAW_FIRM_ALIASES: a short, reviewed list of confirmed typos and office names
  of the largest firms (Fragomen's satellite offices, Ogletree's short form,
  Wolfsdorf's old "WR Immigration" tag), found by inspecting the 40 largest
  keys by hand. Nothing is merged by similarity at run time.

Checks
- The disparity filter against a global weight threshold sized to keep as
  many links, at alpha in (0.05, 0.1, 0.2, 0.3, 0.5): links kept, firms with a
  link, giant component, and how concentrated the kept links are among the 5
  largest firms. At alpha 0.2, the firms the filter keeps that the threshold
  drops, with their strongest weight elsewhere in the network.
- Louvain (100 runs) on the giant component of the alpha 0.2 disparity
  backbone, against 100 degree-preserving rewirings of that one-mode graph
  (nx.double_edge_swap, weights dealt back out at random), scored on each
  rewiring's own giant component, as in week04_staffing.
- NMI and AMI of the best partition against a firm's client kind (placing vs.
  direct, from week04_lottery.kinds; firms with no labelled filings are left
  out) and against its majority EMPLOYER_STATE, each against shuffled labels.
- The same headline numbers for FY2024.

Output: analysis/week04_lawfirms.json
"""

import json
import random
import time
from itertools import combinations
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_names as names
from week04_lottery import kinds
from week04_staffing import SEED, certified, giant_of, labels, louvain, shuffled_nmi, span, tracked
from week04_where import check_disparity, disparity

OUT = Path(__file__).with_suffix(".json")
YEARS = [2024, 2025]
MAIN = 2025
RUNS = 100
ALPHAS = [0.05, 0.1, 0.2, 0.3, 0.5]
MAIN_ALPHA = 0.2

# Confirmed typos and office names of the largest firms, found by inspecting
# the 40 largest legal_name() keys by hand (see build_law_keys()'s docstring).
# Left-hand keys are already legal_name()'d and compact-collapsed.
LAW_FIRM_ALIASES = {
    "FRAGOMEN DEL REY BERNSEN AND LOWEY": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN DEL RAY BERNSEN AND LOEWY": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN DEL REY BERSEN AND LOEWY": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN DEL REY BERNSEN LOEWY": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN DEL REY BERNSEN AND LEOWY": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN DEL REY BERNSEN AND LOEW": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN SAN DIEGO": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN WORLDWIDE": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN CANADA": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN CHICAGO": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "FRAGOMEN": "FRAGOMEN DEL REY BERNSEN AND LOEWY",
    "OGLETREE DEAKINS": "OGLETREE DEAKINS NASH SMOAK AND STEWART PC",
    "OGLETREE DEAKINS NASH SMOAK AND STEWART": "OGLETREE DEAKINS NASH SMOAK AND STEWART PC",
    "OGLETREE DEAKINS LAW FIRM": "OGLETREE DEAKINS NASH SMOAK AND STEWART PC",
    "OGLETREE DEAKIN NASH SMOAK AND STEWART PC": "OGLETREE DEAKINS NASH SMOAK AND STEWART PC",
    "OGLETREE DEAKINS NASH SMOAK STEWART PC": "OGLETREE DEAKINS NASH SMOAK AND STEWART PC",
    "OGLETREE DEAKINS NASH SMOAK AND STEWARD PC": "OGLETREE DEAKINS NASH SMOAK AND STEWART PC",
    "KLASKO IMMIGRATION LAW PARNTERS": "KLASKO IMMIGRATION LAW PARTNERS",
    "WOLFSDORF ROSENTHAL LLP WR IMMIGRATION": "WOLFSDORF ROSENTHAL",
    "MORGAN LEWIS BOCKIUS": "MORGAN LEWIS AND BOCKIUS",
    "MORGAN LEWIS AND BOCIKUS": "MORGAN LEWIS AND BOCKIUS",
    "MORGAN LEWIS AND BOCKIS": "MORGAN LEWIS AND BOCKIUS",
    "MORGAN LEWIS AND BOKIUS": "MORGAN LEWIS AND BOCKIUS",
    "CORPORATE IMMIGRATION PARTNERS": "CORPORATE IMMIGRATION PARTNERS PC",
    "CORPORATE IMMIGRATION PARTNER PC": "CORPORATE IMMIGRATION PARTNERS PC",
    "CORPORATE IMMIGRATION PARTNERS PA": "CORPORATE IMMIGRATION PARTNERS PC",
    # Renamed mid-flight from PwC's immigration practice; the same firm.
    "VIALTO PARTNERS LLP FORMERLY PWC LAW": "VIALTO PARTNERS",
    "VIALTO LAW US PLLC": "VIALTO PARTNERS",
    "VIALTO LAW": "VIALTO PARTNERS",
    "VIALTO US LAW PLLC": "VIALTO PARTNERS",
    "CO VIALTO PARTNERS": "VIALTO PARTNERS",
}


def build_law_keys(raw_names):
    """raw LAWFIRM_NAME_BUSINESS_NAME -> law firm key, for one year's column.

    legal_name() (week04_names) gives a spelling-free key but leaves two
    spellings of the same firm apart unless they are letter-for-letter the
    same once normalized. Two passes close that gap: compact-collapse folds
    spellings that agree with spaces removed to whichever has more filings;
    LAW_FIRM_ALIASES folds in the confirmed typos and office names found by
    inspecting the largest keys. A blank name maps to NaN (no firm)."""
    raw = pd.Series(sorted(set(n for n in raw_names if n.strip())))
    keys = raw.map(names.legal_name)
    counts = keys.value_counts()
    compact_best = {}
    for k in counts.index:
        c = names.compact(k)
        if c not in compact_best or counts[k] > counts[compact_best[c]]:
            compact_best[c] = k
    collapsed = keys.map(lambda k: compact_best[names.compact(k)])
    final = collapsed.map(lambda k: LAW_FIRM_ALIASES.get(k, k))
    return dict(zip(raw, final))


def law_label(key):
    return names.tidy(key)


def with_law_firm(year):
    """Certified filings with a law firm key, and the full certified frame."""
    lca = certified(year)
    lca = lca.assign(law_key=lca["LAWFIRM_NAME_BUSINESS_NAME"].map(build_law_keys(lca["LAWFIRM_NAME_BUSINESS_NAME"])))
    return lca, lca[lca["law_key"].notna()]


def coverage(lca, sub):
    """Q1 · how much of the market the largest firms hold."""
    firms = sub["law_key"].value_counts()
    top10 = firms.head(10)
    return {
        "filings": len(lca),
        "filings_with_a_law_firm": len(sub),
        "share_with_a_law_firm": round(len(sub) / len(lca), 4),
        "law_firms": int(firms.shape[0]),
        "top_10_law_firms": [
            {"firm": law_label(k), "filings": int(v), "share_of_filings_with_a_firm": round(float(v / len(sub)), 4)}
            for k, v in top10.items()],
        "top_5_share_of_filings_with_a_firm": round(float(firms.head(5).sum() / len(sub)), 4),
    }


def project_firms(sub):
    """Law firm -- law firm graph: weight = employers that filed through both."""
    pairs = sub[["employer", "law_key"]].drop_duplicates()
    g = nx.Graph()
    g.add_nodes_from(pairs["law_key"].unique())
    per_employer = pairs.groupby("employer")["law_key"].apply(lambda s: sorted(set(s)))
    for firms in per_employer:
        for a, b in combinations(firms, 2):
            if g.has_edge(a, b):
                g[a][b]["weight"] += 1
            else:
                g.add_edge(a, b, weight=1)
    return g, pairs, per_employer


def network_stats(g, pairs, per_employer, firms):
    top_firm = firms.index[0]
    return {
        "employers_used": pairs["employer"].nunique(),
        "law_firms_in_graph": g.number_of_nodes(),
        "edges": g.number_of_edges(),
        "employers_with_2plus_firms": int((per_employer.map(len) >= 2).sum()),
        "employers_with_2plus_firms_share": round(float((per_employer.map(len) >= 2).mean()), 4),
        "top_firm": law_label(top_firm),
        "top_firm_degree": int(g.degree(top_firm)) if top_firm in g else 0,
        "top_firm_strength": int(g.degree(top_firm, weight="weight")) if top_firm in g else 0,
    }


def threshold_backbone(g, target_edges):
    """The weight cutoff t (w >= t kept) whose edge count is closest to target_edges."""
    weights = sorted({w for *_, w in g.edges(data="weight")})
    best_t, best_edges, best_diff = weights[0], list(g.edges()), len(g.edges())
    for t in weights:
        edges = [(u, v) for u, v, w in g.edges(data="weight") if w >= t]
        diff = abs(len(edges) - target_edges)
        if diff < best_diff:
            best_t, best_edges, best_diff = t, edges, diff
    return best_t, g.edge_subgraph(best_edges).copy()


def describe_backbone(h, top5):
    if h.number_of_edges() == 0:
        return {"links_kept": 0, "firms_with_a_link": 0, "giant_component": 0, "top_5_share_of_links": 0.0}
    giant = h.subgraph(max(nx.connected_components(h), key=len)).copy()
    touching_top5 = sum(1 for u, v in h.edges() if u in top5 or v in top5)
    return {
        "links_kept": h.number_of_edges(),
        "firms_with_a_link": h.number_of_nodes(),
        "giant_component": giant.number_of_nodes(),
        "top_5_share_of_links": round(touching_top5 / h.number_of_edges(), 4),
    }


def backbones(g, firms):
    """Q2/Q3 · disparity filter against a same-size global threshold, per alpha."""
    top5 = set(firms.head(5).index)
    p = disparity(g)
    by_alpha, disparity_graphs = {}, {}
    for alpha in ALPHAS:
        edges = [e for e, pv in p.items() if pv < alpha]
        h_disp = g.edge_subgraph(edges).copy()
        disparity_graphs[alpha] = h_disp
        t, h_thr = threshold_backbone(g, h_disp.number_of_edges())
        entry = {"disparity": describe_backbone(h_disp, top5),
                  "threshold": {"t": int(t), **describe_backbone(h_thr, top5)}}
        if alpha == MAIN_ALPHA:
            dropped = set(h_disp.nodes()) - set(h_thr.nodes())
            strongest = sorted(((f, max((w for *_, w in g.edges(f, data="weight")), default=0)) for f in dropped),
                                key=lambda x: -x[1])
            entry["kept_by_filter_dropped_by_threshold"] = {
                "firms": len(dropped),
                "examples": [{"firm": law_label(f), "strongest_weight_elsewhere": int(w)}
                             for f, w in strongest[:3]],
            }
        by_alpha[alpha] = entry
    return by_alpha, disparity_graphs[MAIN_ALPHA]


def rewire_onemode(g, rng):
    """Degree-preserving rewiring of a one-mode graph (nx.double_edge_swap),
    with the edge weights dealt back out at random, as week04_staffing.rewire()
    does for the bipartite staffing graph."""
    h = g.copy()
    m = h.number_of_edges()
    nx.double_edge_swap(h, nswap=10 * m, max_tries=100 * m, seed=rng)
    weights = [w for *_, w in g.edges(data="weight")]
    rng.shuffle(weights)
    for (u, v), w in zip(list(h.edges()), weights):
        h[u][v]["weight"] = w
    return h


def communities(giant, rng):
    """Q4 · Louvain on the backbone's giant component, against degree-preserving
    rewirings scored the same way (their own giant component)."""
    runs = [louvain(giant, SEED + i) for i in tracked("Louvain on the alpha 0.2 backbone", RUNS)]
    qs = np.array([q for _, q in runs])
    null_qs = []
    for i in tracked("Null: rewired one-mode graphs", RUNS):
        h = rewire_onemode(giant, rng)
        null_qs.append(louvain(giant_of(h), SEED + i)[1])
    null_qs = np.array(null_qs)
    nodes = list(giant)
    member_runs = [labels(p) for p, _ in runs]
    pairs_nmi = [nmi([member_runs[i][n] for n in nodes], [member_runs[i + 1][n] for n in nodes])
                 for i in range(0, len(runs) - 1, 2)]
    best_parts = max(runs, key=lambda r: r[1])[0]
    return {
        "Q_mean": round(float(qs.mean()), 4), "Q_sd": round(float(qs.std()), 4),
        "null_mean": round(float(null_qs.mean()), 4), "null_sd": round(float(null_qs.std()), 4),
        "z": round(float((qs.mean() - null_qs.mean()) / null_qs.std()), 2),
        "communities_median": int(np.median([len(p) for p, _ in runs])),
        "nmi_between_seeds_median": round(float(np.median(pairs_nmi)), 3),
    }, labels(best_parts)


def firm_kind_labels(sub, year):
    """A law firm's client kind: placing if half or more of its labelled filings
    (employers with 20+ certified filings, from week04_lottery.kinds) come from
    a placing employer, else direct. A firm with no labelled filings is left out."""
    kind = kinds(year)
    labelled = sub[sub["employer"].isin(kind.index)].assign(kind=lambda d: d["employer"].map(kind))
    share_placing = labelled.groupby("law_key")["kind"].apply(lambda s: (s == "placing").mean())
    return share_placing.map(lambda x: "placing" if x >= 0.5 else "direct")


def firm_state_labels(sub):
    """A law firm's majority EMPLOYER_STATE by filings."""
    return sub.groupby("law_key")["EMPLOYER_STATE"].agg(lambda s: s.value_counts().index[0] if len(s) else "")


def label_test(member, test_firms, label_of, rng):
    firms = [f for f in test_firms if f in label_of.index and label_of[f]]
    comm = [member[f] for f in firms]
    vals = [label_of[f] for f in firms]
    if len(set(vals)) < 2:
        return {"firms_labelled": len(firms), "nmi": None, "p": None, "ami": None}
    observed, p = shuffled_nmi(comm, vals, rng)
    return {"firms_labelled": len(firms), "nmi": round(observed, 3), "p": round(p, 4),
            "ami": round(float(ami(comm, vals)), 3)}


def process_year(year, rng):
    lca, sub = with_law_firm(year)
    cov = coverage(lca, sub)
    firms = sub["law_key"].value_counts()
    g, pairs, per_employer = project_firms(sub)
    net = network_stats(g, pairs, per_employer, firms)
    by_alpha, backbone02 = backbones(g, firms)
    giant02 = giant_of(backbone02)
    comm_result, member = communities(giant02, rng)
    kind_label = firm_kind_labels(sub, year)
    state_label = firm_state_labels(sub)
    labels_result = {
        "client_kind": label_test(member, giant02.nodes(), kind_label, rng),
        "employer_state": label_test(member, giant02.nodes(), state_label, rng),
    }
    return {
        "year": year, "coverage": cov, "network": net, "backbones": by_alpha,
        "giant_of_alpha_0_2": {"nodes": giant02.number_of_nodes(), "edges": giant02.number_of_edges()},
        "communities": comm_result, "labels": labels_result,
    }


def main():
    started = time.time()
    check_disparity()
    rng = random.Random(SEED)
    out = {"generated_by": "analysis/week04_lawfirms.py", "weight": "shared employers",
           "runs": RUNS, "main_alpha": MAIN_ALPHA, "years": {}}
    for year in YEARS:
        result = process_year(year, rng)
        out["years"][year] = result
        print(f"FY{year}: {result['coverage']['filings_with_a_law_firm']:,} of "
              f"{result['coverage']['filings']:,} filings named a law firm "
              f"({result['coverage']['law_firms']:,} firms); "
              f"alpha {MAIN_ALPHA}: {result['backbones'][MAIN_ALPHA]['disparity']} vs "
              f"{result['backbones'][MAIN_ALPHA]['threshold']}", flush=True)
        print(f"FY{year} communities:", result["communities"], flush=True)
        print(f"FY{year} labels:", result["labels"], flush=True)

    which = None
    main_labels = out["years"][MAIN]["labels"]
    kind_ami = main_labels["client_kind"]["ami"] or 0
    state_ami = main_labels["employer_state"]["ami"] or 0
    if main_labels["client_kind"]["p"] and main_labels["client_kind"]["p"] < 0.05 and kind_ami >= state_ami:
        which = "client kind"
    elif main_labels["employer_state"]["p"] and main_labels["employer_state"]["p"] < 0.05 and state_ami > kind_ami:
        which = "employer state"
    else:
        which = "neither"
    out["which_label_communities_follow"] = which

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")
    print(f"done in {span(out['seconds'])} -> {OUT.name}")


if __name__ == "__main__":
    main()
