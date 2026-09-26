"""Week 4, section 3 extra: who files through which immigration law firm?

Network: law firm -- law firm, projected from the bipartite employer x law
firm graph. Two firms are linked when the same employer filed certified H-1B
cases through both in the year; the link weighs, summed over those shared
employers, the smaller of the firm's filing count with that employer (the
same rule as week04_where.project, reused here rather than copied). Filings,
not positions, weigh the links, for the reason every week 4 script gives:
positions measure a firm's paperwork habits, not its reach.

Every H-1B filing names the law firm that filed it
(LAWFIRM_NAME_BUSINESS_NAME). It is a giant-hub case: one law firm
(Fragomen) files far more than anyone else, one filing in four names no
firm at all, and a client can itself be a subcontracting chain, so the
disparity filter (Serrano, Boguna and Vespignani 2009) is checked here
against a plain global weight threshold, in the course brief's style.

Questions
- How concentrated is the market for immigration counsel?
- Which firms does the disparity filter keep that a flat threshold would
  cut, and what does each one look like (a "Moses of Narbonne" case: a tie
  that is everything to the small firm, nothing to the hub)?
- Do law firms cluster by the employers' region or industry, or by nothing
  more than shared clients?
- Do employers that place workers at a client behave differently from
  direct hirers, in how they buy legal counsel?
- Does any of this hold from FY2024 to FY2025?

Companies are keyed by week04_staffing.resolver(), the same resolver every
other section uses; law firms are keyed the same way, through
resolver().client(), which normalizes business names and returns None for
a placeholder. Checked on a sample: it correctly collapses every spelling of
"Fragomen, Del Rey, Bernsen & Loewy" into one key (a bridge through the tax
number the firm itself uses when it files as an employer for its own staff).
It does not fold "EY Law LLP" into the "EY" family: the alias table has no
such row, so a law-firm node and a same-named client node only coincide when
the alias table already says so. Blank/placeholder law firms are dropped
(counted below); so are rows where the law-firm key equals the employer key
(in-house counsel filing for itself, not outside counsel).

Checks
- check_projection(): a toy employer x law-firm graph with a hand-worked
  weight, since week04_where.project is imported, not copied, but the
  column rename that feeds it (law firm as "metro") is this script's own.
- Backbone: the disparity filter against a global weight threshold picking
  the same number of links, at five alphas. At one alpha, the firms the
  filter keeps that the threshold drops, split into isolated pairs (both
  ends degree 1, a link the filter always keeps and the threshold may not,
  but not a hub case) and the rest; among the rest, degree-2-or-more firms
  whose kept tie goes to a hub (degree >= HUB_DEGREE), ranked by how much of
  the small firm's own strength that tie carries, skipping any pair whose
  two names look like one firm under two spellings (rapidfuzz
  token_sort_ratio >= DUP_RATIO) — those are counted and listed separately,
  as merge candidates for week04_name_merges.csv, not applied here.
- Communities: Louvain on the giant component (100 runs) against 100
  degree-preserving rewirings of the employer x law-firm bipartite graph,
  re-projected and scored on each rewiring's own giant component. NMI and
  AMI of the best partition against employer region and sector, each
  against 1,000 shuffled-label runs.
- Outsourcers vs direct hirers: a permutation test (1,000 shuffles) on the
  gap in law-firm concentration between the two groups.
- FY2024 repeated (fewer outputs), and the year-to-year NMI on shared law
  firms beside two FY2025 seeds on the same firms.

Output: analysis/week04_lawfirms.json
"""

import json
import random
import time
from collections import Counter
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from rapidfuzz import fuzz
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

from week04_staffing import (MIN_FILINGS, certified, giant_of, labels, louvain,
                              resolver, rewire, shuffled_nmi, span, tracked)
from week04_where import REGION, disparity, project

OUT = Path(__file__).with_suffix(".json")
YEARS = [2024, 2025]
MAIN = 2025
OTHER = 2024
RUNS = 100
SEED = 2805
ALPHAS = [0.05, 0.1, 0.2, 0.3, 0.5]
DEFAULT_ALPHA = 0.2
TOP_N = 10       # firms shown by filings and by employers served
SHORTLIST = 5    # largest firms by filings, the concentration shortlist
EXAMPLES = 5     # firms shown in the filter-vs-threshold example
HUB_DEGREE = 20  # a partner this connected counts as a hub, not a peer
DUP_RATIO = 85   # rapidfuzz token_sort_ratio at or above this: probably one firm, two spellings


def naics2(code):
    """LCA's raw 2-digit NAICS code, with the three split sectors rejoined."""
    c = str(code)[:2]
    return {"31": "31-33", "32": "31-33", "33": "31-33",
            "44": "44-45", "45": "44-45",
            "48": "48-49", "49": "48-49"}.get(c, c)


def with_lawfirm(lca):
    """certified(year), plus the resolved law-firm key (None for blank/placeholder)."""
    lca = lca.copy()
    lca["lawfirm"] = lca["LAWFIRM_NAME_BUSINESS_NAME"].map(resolver().client)
    return lca


def named_filings(lca):
    """lca restricted to a real, outside law firm: not blank/placeholder, not
    in-house counsel (law-firm key == employer key). Returns (named, blank
    count, in-house count)."""
    blank = int(lca["lawfirm"].isna().sum())
    with_firm = lca.dropna(subset=["lawfirm"])
    inhouse = with_firm["lawfirm"] == with_firm["employer"]
    return with_firm[~inhouse].copy(), blank, int(inhouse.sum())


def concentration(lca, named):
    """Q1: how concentrated is the market for outside counsel."""
    by_filings = named["lawfirm"].value_counts()
    by_employers = named.groupby("lawfirm")["employer"].nunique().sort_values(ascending=False)
    top5 = set(by_filings.head(SHORTLIST).index)
    epf = named.groupby("lawfirm")["employer"].nunique()  # employers per firm
    return {
        "certified_filings": int(len(lca)),
        "named_filings": int(len(named)),
        "named_share": round(len(named) / len(lca), 4),
        "law_firms": int(named["lawfirm"].nunique()),
        "top5_share_of_named": round(float(named["lawfirm"].isin(top5).mean()), 4),
        "employers_per_firm_median": float(epf.median()),
        "employers_per_firm_max": int(epf.max()),
        "top_firms_by_filings": [[resolver().label(k), int(v)] for k, v in by_filings.head(TOP_N).items()],
        "top_firms_by_employers": [[resolver().label(k), int(v)] for k, v in by_employers.head(TOP_N).items()],
    }, top5


def check_projection():
    """A toy employer x law-firm graph, weight = sum over shared employers of
    min(filings via A, filings via B): E1 ties A(5)-B(3) -> 3, E2 ties
    A(2)-B(4) -> 2, E3 uses only A. A-B should weigh 5, no other edge."""
    toy = pd.DataFrame([
        ("E1", "A", 5), ("E1", "B", 3),
        ("E2", "A", 2), ("E2", "B", 4),
        ("E3", "A", 1),
    ], columns=["employer", "metro", "filings"])
    g = project(toy, ["A", "B"])
    assert g.number_of_edges() == 1 and g["A"]["B"]["weight"] == 5, "toy projection weight is wrong"


def build_graph(named):
    """The employer x law-firm pairs (one row per pair, filings = count), the
    law-firm x law-firm projection, and every law firm with a named filing."""
    pairs = named.groupby(["employer", "lawfirm"]).size().rename("filings").reset_index()
    keep = sorted(pairs["lawfirm"].unique())
    g = project(pairs.rename(columns={"lawfirm": "metro"}), keep)
    return g, pairs, keep


def threshold_for(weights, target):
    """The global cutoff w >= t whose kept-edge count is closest to target."""
    best_t, best_diff = None, None
    for t in sorted(set(weights), reverse=True):
        count = sum(1 for w in weights if w >= t)
        diff = abs(count - target)
        if best_diff is None or diff < best_diff:
            best_t, best_diff = t, diff
    return best_t


def backbone_at(edges):
    """(the kept-edge graph, giant component size) for a fixed edge list."""
    h = nx.Graph()
    h.add_weighted_edges_from(edges)
    giant = max(nx.connected_components(h), key=len) if h.number_of_edges() else set()
    return h, len(giant)


def compare(real, null):
    return {"real": round(float(real.mean()), 4), "real_sd": round(float(real.std()), 4),
            "null": round(float(null.mean()), 4), "null_sd": round(float(null.std()), 4),
            "z": round(float((real.mean() - null.mean()) / null.std()), 2) if null.std() else None,
            "null_runs_at_or_above_real": int((null >= real.mean()).sum())}


def backbone_sweep(g):
    """Q2: disparity filter vs global threshold, at every alpha in ALPHAS."""
    p = disparity(g)
    weights = [w for *_, w in g.edges(data="weight")]
    table = []
    filter_edges, threshold_edges = {}, {}
    for alpha in ALPHAS:
        kept = [(u, v, g[u][v]["weight"]) for (u, v), pv in p.items() if pv < alpha]
        h, gc = backbone_at(kept)
        t = threshold_for(weights, len(kept))
        kept_t = [(u, v, w) for u, v, w in g.edges(data="weight") if w >= t]
        h_t, gc_t = backbone_at(kept_t)
        filter_edges[alpha], threshold_edges[alpha] = h, h_t
        table.append({
            "alpha": alpha, "links_kept": len(kept), "firms_with_a_link": h.number_of_nodes(),
            "giant_component": gc, "threshold_t": t, "threshold_links": len(kept_t),
            "threshold_firms_with_a_link": h_t.number_of_nodes(), "threshold_giant_component": gc_t,
        })
    return table, filter_edges, threshold_edges, p


def isolated_pairs(g):
    """Firms whose only neighbour also has degree 1: an isolated dyad. The
    disparity filter always keeps such a link (neither end has a second link
    to judge it against), so it says nothing about a hub hiding a small firm
    and must be told apart from the real "Moses" cases."""
    return {n for n in g if g.degree(n) == 1 and g.degree(next(iter(g[n]))) == 1}


def split_isolated(nodes, isolated):
    """(isolated-pair members, the rest) among a set of nodes."""
    iso = sum(1 for n in nodes if n in isolated)
    return iso, len(nodes) - iso


def duplicate_pairs(g):
    """Projection links between two names that are probably one firm under
    two spellings (rapidfuzz token_sort_ratio on the display label >= DUP_RATIO),
    sorted by filings: candidates for week04_name_merges.csv, not applied here."""
    dups = []
    for u, v, w in g.edges(data="weight"):
        lu, lv = resolver().label(u), resolver().label(v)
        if fuzz.token_sort_ratio(lu, lv) >= DUP_RATIO:
            dups.append({"a": u, "a_label": lu, "b": v, "b_label": lv, "filings": int(w)})
    dups.sort(key=lambda d: -d["filings"])
    return dups


def hub_examples(g, h_filter, filter_only, dups):
    """Filter-only firms with a real second link (degree >= 2, so not an
    isolated pair) whose backbone tie goes to a hub (full-graph degree >=
    HUB_DEGREE): the "Moses of Narbonne" case, a tie that is everything to the
    small firm and nothing to the hub. Sorted by how much of the small firm's
    own strength that one tie carries. A pair that looks like one firm under
    two spellings (in dups) is skipped, not counted as a genuine example."""
    strength = dict(g.degree(weight="weight"))
    probable_dup = {(d["a"], d["b"]) for d in dups} | {(d["b"], d["a"]) for d in dups}
    scored = []
    for f in filter_only:
        if g.degree(f) < 2:
            continue
        hub_ties = [(v, h_filter[f][v]["weight"]) for v in h_filter[f] if g.degree(v) >= HUB_DEGREE]
        if not hub_ties:
            continue
        hub, w = max(hub_ties, key=lambda kv: kv[1])
        if (f, hub) in probable_dup:
            continue
        scored.append((f, hub, w))
    scored.sort(key=lambda t: -(t[2] / strength[t[0]]))
    return [{
        "firm": resolver().label(f), "degree": int(g.degree(f)), "strength": int(strength[f]),
        "tie_weight": int(w), "tie_share_of_firm_strength": round(w / strength[f], 4),
        "hub": resolver().label(hub), "hub_strength": int(strength[hub]),
        "tie_share_of_hub_strength": round(w / strength[hub], 4),
    } for f, hub, w in scored[:EXAMPLES]]


def giant_nodes(h):
    return max(nx.connected_components(h), key=len) if h.number_of_edges() else set()


def firms_serving(named, firms, employers):
    """How many of firms named a client among employers, at least once."""
    sub = named[named["lawfirm"].isin(firms) & named["employer"].isin(employers)]
    return int(sub["lawfirm"].nunique())


def top5_link_share(h, top5):
    """Share of a backbone's links that touch one of the top-5 law firms."""
    if h.number_of_edges() == 0:
        return None
    touching = sum(1 for u, v in h.edges() if u in top5 or v in top5)
    return round(touching / h.number_of_edges(), 4)


def region_and_sector(named):
    """Each law firm's filings-weighted majority employer region and NAICS
    sector, and the states REGION does not cover."""
    states = named.groupby(["lawfirm", "EMPLOYER_STATE"]).size().reset_index(name="n")
    majority_state = states.sort_values("n").groupby("lawfirm").tail(1).set_index("lawfirm")["EMPLOYER_STATE"]
    region_of = majority_state.map(REGION)
    unmapped = sorted(set(majority_state[~majority_state.isin(REGION)]) - {""})
    sectors = named.assign(sector2=named["NAICS_CODE"].map(naics2))
    sec = sectors.groupby(["lawfirm", "sector2"]).size().reset_index(name="n")
    majority_sector = sec.sort_values("n").groupby("lawfirm").tail(1).set_index("lawfirm")["sector2"]
    return region_of, majority_sector, unmapped


def null_modularity(pairs, keep, rng):
    """100 degree-preserving rewirings of the employer x law-firm bipartite
    graph, re-projected and scored on each rewiring's own giant component:
    the like-for-like null for the real projection's giant component."""
    bip = nx.Graph()
    for (e, f), w in pairs.set_index(["employer", "lawfirm"])["filings"].items():
        bip.add_edge(("F", e), ("C", f), weight=int(w))
    null_qs = []
    for i in tracked("Nulls, law-firm projection", RUNS):
        h = rewire(bip, rng)
        rows = [(u[1], v[1], d["weight"]) if u[0] == "F" else (v[1], u[1], d["weight"])
                for u, v, d in h.edges(data=True)]
        hp = project(pd.DataFrame(rows, columns=["employer", "metro", "filings"]), keep)
        if hp.number_of_edges() == 0:
            continue
        hg = giant_of(hp)
        null_qs.append(louvain(hg, SEED + i)[1])
    return np.array(null_qs)


def communities(g, named, rng, full=True):
    """Q3: Louvain on the giant component, against the rewired null, and (if
    full) against employer region and sector labels."""
    giant = giant_of(g)
    runs = [louvain(giant, SEED + i) for i in tracked("Louvain, law-firm projection", RUNS)]
    qs = np.array([q for _, q in runs])
    best_parts, best_q = max(runs, key=lambda r: r[1])
    member = labels(best_parts)
    out = {"nodes": giant.number_of_nodes(), "edges": giant.number_of_edges(),
           "communities": len(best_parts), "modularity": round(float(best_q), 4), "qs": qs}
    if not full:
        return out, member, giant, best_parts
    region_of, sector_of, unmapped_states = region_and_sector(named)
    comm_size = Counter(member.values())
    eligible = [n for n in giant if comm_size[member[n]] >= 2]
    region_test = [n for n in eligible if region_of.get(n) and pd.notna(region_of.get(n))]
    sector_test = [n for n in eligible if sector_of.get(n)]
    region_nmi, region_p = shuffled_nmi([member[n] for n in region_test], [region_of[n] for n in region_test], rng)
    sector_nmi, sector_p = shuffled_nmi([member[n] for n in sector_test], [sector_of[n] for n in sector_test], rng)
    out["labels"] = {
        "eligible_communities_of_2plus": len(eligible),
        "with_region": len(region_test), "unmapped_states": unmapped_states,
        "nmi_region": round(region_nmi, 3), "p_region": round(region_p, 4),
        "ami_region": round(float(ami([member[n] for n in region_test], [region_of[n] for n in region_test])), 3),
        "with_sector": len(sector_test),
        "nmi_sector": round(sector_nmi, 3), "p_sector": round(sector_p, 4),
        "ami_sector": round(float(ami([member[n] for n in sector_test], [sector_of[n] for n in sector_test])), 3),
    }
    # The six largest communities: top firms, top employers, dominant region and sector.
    strength = dict(giant.degree(weight="weight"))
    firm_filings = named["lawfirm"].value_counts()
    described = []
    for part in sorted(best_parts, key=lambda p: -sum(strength[n] for n in p))[:6]:
        firms = sorted(part, key=lambda n: (-strength[n], resolver().label(n)))
        by_employer = named[named["lawfirm"].isin(part)].groupby("employer").size().sort_values(ascending=False)
        regions = Counter(region_of[n] for n in firms if region_of.get(n) and pd.notna(region_of.get(n)))
        sectors = Counter(sector_of[n] for n in firms if sector_of.get(n))
        described.append({
            "filings": int(sum(strength[n] for n in firms)), "firms": len(firms),
            "top_firms": [resolver().label(n) for n in firms[:4]],
            "top_employers": [resolver().label(k) for k in by_employer.head(6).index],
            "dominant_region": regions.most_common(1)[0][0] if regions else None,
            "dominant_sector": sectors.most_common(1)[0][0] if sectors else None,
        })
    out["largest_communities"] = described
    return out, member, giant, best_parts


def employer_kind(lca):
    """'placing' (>= 50% of an employer's filings show a client) against
    'direct', among employers with MIN_FILINGS or more certified filings."""
    lca = lca.assign(placed=lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y"))
    totals = lca.groupby("employer").size()
    placed_share = lca.groupby("employer")["placed"].mean()
    big = totals[totals >= MIN_FILINGS].index
    return pd.Series(np.where(placed_share[big] >= 0.5, "placing", "direct"), index=big)


def outsourcing_split(lca, named, top5, rng):
    """Q4: outsourcers (>= 50% of filings placed at a client) against direct
    hirers, both restricted to employers with MIN_FILINGS certified filings,
    on how they buy outside counsel."""
    kind = employer_kind(lca)
    big = kind.index
    totals = lca.groupby("employer").size().reindex(big, fill_value=0)
    named_counts = named.groupby("employer").size().reindex(big, fill_value=0)
    top5_counts = named[named["lawfirm"].isin(top5)].groupby("employer").size().reindex(big, fill_value=0)
    firms_per_employer = named.groupby("employer")["lawfirm"].nunique().reindex(big, fill_value=0)
    table = pd.DataFrame({
        "kind": kind, "total": totals, "named": named_counts,
        "top5": top5_counts, "firms": firms_per_employer,
    })
    table["no_firm_share"] = 1 - table["named"] / table["total"]
    table["top5_share"] = table["top5"] / table["total"]

    def summary(frame):
        # Per-employer median and mean, plus the pooled share (every employer's
        # filings weighed by its size, not each employer weighed the same).
        return {
            "employers": int(len(frame)),
            "no_firm_share_median": round(float(frame["no_firm_share"].median()), 4),
            "no_firm_share_mean": round(float(frame["no_firm_share"].mean()), 4),
            "no_firm_share_pooled": round(float(1 - frame["named"].sum() / frame["total"].sum()), 4),
            "top5_share_median": round(float(frame["top5_share"].median()), 4),
            "top5_share_mean": round(float(frame["top5_share"].mean()), 4),
            "top5_share_pooled": round(float(frame["top5"].sum() / frame["total"].sum()), 4),
            "firms_per_employer_median": float(frame["firms"].median()),
            "firms_per_employer_mean": round(float(frame["firms"].mean()), 3),
        }

    placing, direct = table[table["kind"] == "placing"], table[table["kind"] == "direct"]
    observed = placing["top5_share"].mean() - direct["top5_share"].mean()
    kinds = table["kind"].to_numpy().copy()
    beats = 0
    for _ in range(1000):
        rng.shuffle(kinds)
        is_placing = kinds == "placing"
        diff = table["top5_share"][is_placing].mean() - table["top5_share"][~is_placing].mean()
        beats += abs(diff) >= abs(observed)
    return {
        "employers_min_filings": MIN_FILINGS, "placing": summary(placing), "direct": summary(direct),
        "top5_share_gap": round(float(observed), 4),
        "top5_share_pooled_gap": round(float(
            placing["top5"].sum() / placing["total"].sum() - direct["top5"].sum() / direct["total"].sum()), 4),
        "p_permutation": round((beats + 1) / 1001, 4),
    }


def main():
    started = time.time()
    rng = random.Random(SEED)
    check_projection()

    out = {"generated_by": "analysis/week04_lawfirms.py", "weight": "filings",
           "runs": RUNS, "min_filings": MIN_FILINGS, "years": {}}

    lca_year, named_year, graphs = {}, {}, {}
    for year in YEARS:
        lca = with_lawfirm(certified(year))
        named, blank, inhouse = named_filings(lca)
        lca_year[year], named_year[year] = lca, named
        conc, top5 = concentration(lca, named)
        conc["blank_or_placeholder"] = blank
        conc["blank_or_placeholder_share"] = round(blank / len(lca), 4)
        conc["in_house_counsel_rows"] = inhouse
        g, pairs, keep = build_graph(named)
        graphs[year] = (g, pairs, keep, top5)
        print(f"FY{year}: {conc['named_filings']:,} of {conc['certified_filings']:,} filings named a firm; "
              f"{conc['law_firms']:,} firms", flush=True)
        out["years"][year] = {"concentration": conc}

    # Q2/Q3 in full for the main year, a lighter pass for the other year.
    g, pairs, keep, top5 = graphs[MAIN]
    table, filter_edges, threshold_edges, p = backbone_sweep(g)
    out["years"][MAIN]["backbone"] = table
    h_f, h_t = filter_edges[DEFAULT_ALPHA], threshold_edges[DEFAULT_ALPHA]
    isolated = isolated_pairs(g)
    attached, kept = set(h_f.nodes()), set(h_t.nodes())
    filter_only = attached - kept
    filter_only_iso, filter_only_rest = split_isolated(filter_only, isolated)
    threshold_iso, threshold_rest = split_isolated(kept, isolated)
    dups = duplicate_pairs(g)
    examples = hub_examples(g, h_f, filter_only, dups)
    placing_main = set(employer_kind(lca_year[MAIN])[lambda s: s == "placing"].index)
    filter_giant, threshold_giant = giant_nodes(h_f), giant_nodes(h_t)
    out["years"][MAIN]["backbone_detail"] = {
        "alpha": DEFAULT_ALPHA,
        "attached_by_filter_only": {"total": len(filter_only), "isolated_pairs": filter_only_iso,
                                     "rest": filter_only_rest},
        "threshold_kept_firms": {"total": len(kept), "isolated_pairs": threshold_iso, "rest": threshold_rest},
        "examples": examples,
        "duplicate_name_pairs_in_projection": len(dups), "duplicate_name_pairs_top20": dups[:20],
        "filter_top5_link_share": top5_link_share(h_f, top5),
        "threshold_top5_link_share": top5_link_share(h_t, top5),
        "filter_giant_firms_serving_a_placing_employer": firms_serving(named_year[MAIN], filter_giant, placing_main),
        "threshold_giant_firms_serving_a_placing_employer": firms_serving(
            named_year[MAIN], threshold_giant, placing_main),
    }

    comm, member, giant, best_parts = communities(g, named_year[MAIN], rng, full=True)
    null_qs = null_modularity(pairs, keep, rng)
    comm["vs_null"] = compare(comm.pop("qs"), null_qs)
    out["years"][MAIN]["communities"] = comm

    out["outsourcing"] = outsourcing_split(lca_year[MAIN], named_year[MAIN], top5, rng)

    # FY2024: the same steps, fewer outputs.
    g_o, pairs_o, keep_o, top5_o = graphs[OTHER]
    table_o, _, _, _ = backbone_sweep(g_o)
    out["years"][OTHER]["backbone"] = table_o
    comm_o, member_o, giant_o, _ = communities(g_o, named_year[OTHER], rng, full=False)
    null_qs_o = null_modularity(pairs_o, keep_o, rng)
    comm_o["vs_null"] = compare(comm_o.pop("qs"), null_qs_o)
    out["years"][OTHER]["communities"] = comm_o

    # Year to year: NMI on shared law firms, beside two FY2025 seeds on the same firms.
    shared = [n for n in giant if n in giant_o]
    seed_a, seed_b = louvain(giant, SEED + 90)[0], louvain(giant, SEED + 91)[0]
    member_a, member_b = labels(seed_a), labels(seed_b)
    out["stability"] = {
        "shared_law_firms": len(shared),
        "nmi_fy2024_fy2025": round(float(nmi([member_o[n] for n in shared], [member[n] for n in shared])), 3),
        "nmi_two_fy2025_seeds": round(float(nmi([member_a[n] for n in shared], [member_b[n] for n in shared])), 3),
    }

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")
    print(json.dumps({k: v for k, v in out.items() if k != "years"}, indent=1, default=str))
    print(f"done in {span(out['seconds'])}")


if __name__ == "__main__":
    main()
