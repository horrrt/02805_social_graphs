"""Week 4, section 3: Who really employs them?  Owner: Gyula.

Network: outsourcing firm -> client company, one edge weight unit per H-1B
filing that places workers at that client. Positions (the slots a filing
requests) are reported beside filings but not used as weights: one firm files
every application for exactly 40 therapists, which would make positions
measure its paperwork rather than its reach.

Questions
- How many workers sit at a client instead of their own employer?
- Do clients group by industry or by the firm that staffs them?
- Who relies on a single vendor?
- Does it hold from year to year?

Edges come from the worksites file (every client of a case, not only the one
on the main row), restricted to certified H-1B cases, one edge per (case,
client). Employers and clients are both keyed by company family
(week04_names), so a firm has the same key in every year and on both sides.

Checks
- Modularity of 100 Louvain runs against 100 degree-preserving bipartite
  rewirings (each firm and each client keeps its number of partners; filing
  counts are dealt back out at random, as in Week 3). Two more nulls separate
  the wiring from the weights: unweighted real against unweighted rewired, and
  the real wiring with its filing counts shuffled.
- NMI of communities with client industry and with the client's main vendor,
  each against shuffled labels, over clients with two or more vendors.
- The same analysis for FY2022 to FY2025, compared on shared clients.

Output: analysis/week04_staffing.json
"""

import json
import random
import time
from collections import Counter
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_names as names
from week04_data import load

OUT = Path(__file__).with_suffix(".json")
YEARS = [2022, 2023, 2024, 2025]
MAIN = 2025
RUNS = 100
SEED = 2805
MIN_FILINGS = 20  # clients this large or larger get a concentration score


def certified(year):
    lca = load(f"lca_fy{year}")
    lca = lca[lca["CASE_STATUS"].str.startswith("Certified") & (lca["VISA_CLASS"] == "H-1B")].copy()
    lca["positions"] = pd.to_numeric(lca["TOTAL_WORKER_POSITIONS"], errors="coerce").fillna(1)
    # Keyed by company family, not tax number: a firm keeps one key in every
    # year (FY2022 and FY2023 have no tax number) and its subsidiaries join it.
    lca["employer"] = lca["EMPLOYER_NAME"].map(names.employer)
    return lca


def intermediaries(lca):
    """Families that themselves place workers at clients (MIN_FILINGS or more
    placed filings in the year). A client in this set is a subcontracting chain:
    one outsourcer placing workers with another. An industry code does not do:
    Citigroup and Google file some applications as IT-services firms too."""
    placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    counts = placed["employer"].value_counts()
    return set(counts[counts >= MIN_FILINGS].index)


def employer_labels(lca):
    """A readable name per employer key: its most frequent spelling."""
    return lca.groupby("employer")["EMPLOYER_NAME"].agg(lambda s: s.value_counts().index[0]).to_dict()


def placements(year, lca):
    """(case, employer, client) rows, and how many raw client rows were placeholders."""
    sites = load(f"worksites_fy{year}")
    sites = sites[sites["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    sites = sites[sites["CASE_NUMBER"].isin(lca["CASE_NUMBER"])]
    sites = sites.assign(client=sites["SECONDARY_ENTITY_BUSINESS_NAME"].map(names.client))
    placeholder = int(sites["client"].isna().sum())
    rows = sites.dropna(subset=["client"]).drop_duplicates(["CASE_NUMBER", "client"])
    rows = rows.merge(lca[["CASE_NUMBER", "employer"]], on="CASE_NUMBER")
    return rows[["CASE_NUMBER", "employer", "client"]], placeholder, len(sites)


def graph(rows):
    """Bipartite weighted graph: ('F', employer) -- ('C', client), weight = filings."""
    g = nx.Graph()
    for (e, c), w in rows.groupby(["employer", "client"]).size().items():
        g.add_edge(("F", e), ("C", c), weight=int(w))
    return g


def rewire(g, rng):
    """Degree-preserving bipartite rewiring; filing counts dealt back out at random."""
    edges = [(u, v) if u[0] == "F" else (v, u) for u, v in g.edges()]
    present = set(edges)
    weights = [g[u][v]["weight"] for u, v in edges]
    for _ in range(10 * len(edges)):
        i, j = rng.randrange(len(edges)), rng.randrange(len(edges))
        (f1, c1), (f2, c2) = edges[i], edges[j]
        if f1 == f2 or c1 == c2 or (f1, c2) in present or (f2, c1) in present:
            continue
        present -= {(f1, c1), (f2, c2)}
        present |= {(f1, c2), (f2, c1)}
        edges[i], edges[j] = (f1, c2), (f2, c1)
    rng.shuffle(weights)
    h = nx.Graph()
    h.add_weighted_edges_from((u, v, w) for (u, v), w in zip(edges, weights))
    return h


def check_rewire(g, h):
    """The null keeps every node's number of partners and never links two firms or two clients."""
    assert dict(g.degree()) == dict(h.degree()), "rewiring changed a degree"
    assert all(u[0] != v[0] for u, v in h.edges()), "rewiring linked two nodes of one side"
    assert sorted(d["weight"] for *_, d in g.edges(data=True)) == sorted(
        d["weight"] for *_, d in h.edges(data=True)), "rewiring changed the weights"


def unweighted(g):
    h = nx.Graph()
    h.add_edges_from(g.edges())
    return h


def shuffle_weights(g, rng):
    """The same wiring, with the filing counts dealt out at random."""
    h = g.copy()
    weights = [d["weight"] for *_, d in h.edges(data=True)]
    rng.shuffle(weights)
    for (u, v), w in zip(list(h.edges()), weights):
        h[u][v]["weight"] = w
    return h


def louvain(g, seed):
    parts = nx.community.louvain_communities(g, weight="weight", seed=seed)
    return parts, nx.community.modularity(g, parts, weight="weight")


def labels(parts):
    return {node: i for i, part in enumerate(parts) for node in part}


def shuffled_nmi(a, b, rng, times=1000):
    """Observed NMI, and the share of label shuffles that match or beat it."""
    observed = nmi(a, b)
    b = list(b)
    beats = 0
    for _ in range(times):
        rng.shuffle(b)
        beats += nmi(a, b) >= observed
    return observed, (beats + 1) / (times + 1)


def main():
    started = time.time()
    rng = random.Random(SEED)
    out = {"generated_by": "analysis/week04_staffing.py", "weight": "filings", "runs": RUNS, "years": {}}
    graphs, firm_names = {}, {}

    # Q1 · how many workers sit at a client, every year.
    for year in YEARS + [2026]:
        lca = certified(year)
        placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
        rows, placeholder, site_rows = placements(year, lca)
        grandison = lca[lca["EMPLOYER_NAME"].str.upper().str.contains("GRANDISON")]
        by_filings = placed.groupby("employer").size().sort_values(ascending=False)
        by_positions = placed.groupby("employer")["positions"].sum().sort_values(ascending=False)
        firm_names.update(employer_labels(lca))
        chain = rows["client"].isin(intermediaries(lca))
        fein = lca["EMPLOYER_FEIN"] if "EMPLOYER_FEIN" in lca else None
        out["years"][year] = {
            "months": 9 if year == 2026 else 12,
            "certified_filings": len(lca),
            "placed_filings": len(placed),
            "placed_share": round(len(placed) / len(lca), 4),
            "positions": int(lca["positions"].sum()),
            "placed_positions": int(placed["positions"].sum()),
            "placed_positions_share": round(placed["positions"].sum() / lca["positions"].sum(), 4),
            "client_rows": site_rows,
            "placeholder_client_rows": placeholder,
            "placeholder_share": round(placeholder / site_rows, 4),
            "edges": int(rows.groupby(["employer", "client"]).ngroups),
            "employer_keys": int(lca["employer"].nunique()),
            "employer_tax_numbers": int(fein.nunique()) if fein is not None else None,
            "placements_to_intermediaries": int(chain.sum()),
            "intermediary_share": round(float(chain.mean()), 4),
            "top_intermediary_clients": rows[chain]["client"].value_counts().head(6).to_dict(),
            "firms": int(rows["employer"].nunique()),
            "clients": int(rows["client"].nunique()),
            "top_firms_by_filings": [[firm_names[k], int(v)] for k, v in by_filings.head(8).items()],
            "top_firms_by_positions": [[firm_names[k], int(v)] for k, v in by_positions.head(8).items()],
            "grandison": {
                "filings": len(grandison),
                "positions": int(grandison["positions"].sum()),
                "positions_per_filing": float(grandison["positions"].median()) if len(grandison) else 0,
                "clients": int(grandison["SECONDARY_ENTITY_BUSINESS_NAME"].nunique()),
                "occupations": grandison["SOC_TITLE"].value_counts().head(3).to_dict(),
            },
        }
        if year in YEARS:
            graphs[year] = (graph(rows), rows)
        print(f"FY{year}: {len(placed):,} of {len(lca):,} filings placed; "
              f"{out['years'][year]['clients']:,} clients", flush=True)

    g, rows = graphs[MAIN]
    result = out["main"] = {"year": MAIN}

    # Q3 · single-vendor dependence.
    per_client = rows.groupby(["client", "employer"]).size().rename("filings").reset_index()
    totals = per_client.groupby("client")["filings"].sum()
    vendors = per_client.groupby("client")["employer"].nunique()
    top_share = per_client.groupby("client")["filings"].max() / totals
    main_vendor = per_client.sort_values("filings").groupby("client").tail(1).set_index("client")["employer"]
    big = totals[totals >= MIN_FILINGS].index
    multi = vendors[vendors >= 2].index
    result["clients"] = int(len(totals))
    result["single_vendor_clients"] = int((vendors == 1).sum())
    result["single_vendor_filing_share"] = round(float(totals[vendors == 1].sum() / totals.sum()), 4)
    result["big_clients"] = int(len(big))
    result["big_clients_over_90pct_one_vendor"] = int((top_share[big] >= 0.9).sum())
    result["big_clients_median_top_vendor_share"] = round(float(top_share[big].median()), 4)
    result["largest_clients"] = [
        {"client": c, "filings": int(totals[c]), "vendors": int(vendors[c]),
         "top_vendor": firm_names.get(main_vendor[c], main_vendor[c]),
         "top_vendor_share": round(float(top_share[c]), 3), "sector": names.naics2(c)}
        for c in totals.sort_values(ascending=False).head(25).index
    ]

    # Q2 · communities, against degree-preserving rewirings.
    giant = g.subgraph(max(nx.connected_components(g), key=len)).copy()
    runs = [louvain(giant, SEED + i) for i in range(RUNS)]
    qs = np.array([q for _, q in runs])
    # Three nulls, so the wiring and the weights can be told apart: rewired
    # wiring with shuffled weights; rewired wiring, unweighted, against the real
    # wiring unweighted; and the real wiring with its weights shuffled.
    plain = unweighted(giant)
    qs_plain = np.array([louvain(plain, SEED + i)[1] for i in range(RUNS)])
    null_qs, null_plain, null_weights, pieces = [], [], [], []
    for i in range(RUNS):
        h = rewire(giant, rng)
        if i == 0:
            check_rewire(giant, h)
        pieces.append(nx.number_connected_components(h))
        null_qs.append(louvain(h, SEED + i)[1])
        null_plain.append(louvain(unweighted(h), SEED + i)[1])
        null_weights.append(louvain(shuffle_weights(giant, rng), SEED + i)[1])
    null_qs, null_plain, null_weights = map(np.array, (null_qs, null_plain, null_weights))
    best_parts = max(runs, key=lambda r: r[1])[0]
    member = labels(best_parts)
    nodes = list(giant)
    run_labels = [labels(p) for p, _ in runs[:20]]
    pairs = [nmi([run_labels[i][n] for n in nodes], [run_labels[i + 1][n] for n in nodes])
             for i in range(0, len(run_labels) - 1, 2)]
    result["giant"] = {"nodes": giant.number_of_nodes(), "edges": giant.number_of_edges(),
                     "share_of_filings": round(giant.size("weight") / g.size("weight"), 4)}
    def compare(real, null):
        return {"real": round(float(real.mean()), 4), "real_sd": round(float(real.std()), 4),
                "null": round(float(null.mean()), 4), "null_sd": round(float(null.std()), 4),
                "z": round(float((real.mean() - null.mean()) / null.std()), 2),
                "null_runs_at_or_above_real": int((null >= real.mean()).sum())}

    result["modularity"] = {
        "communities_median": int(np.median([len(p) for p, _ in runs])),
        "nmi_between_seeds_median": round(float(np.median(pairs)), 3),
        "rewired_components_median": int(np.median(pieces)),
        "weighted_vs_rewired": compare(qs, null_qs),
        "wiring_only": compare(qs_plain, null_plain),
        "weights_only": compare(qs, null_weights),
    }

    # Industry or vendor? Only clients with two or more vendors can say.
    test = [c for c in multi if ("C", c) in member]
    sector_clients = [c for c in test if names.naics2(c)]
    comm = [member[("C", c)] for c in sector_clients]
    ind_obs, ind_p = shuffled_nmi(comm, [names.naics2(c) for c in sector_clients], rng)
    comm_all = [member[("C", c)] for c in test]
    ven_obs, ven_p = shuffled_nmi(comm_all, [main_vendor[c] for c in test], rng)
    # The same comparison on the labelled clients alone, so both NMIs see the same clients.
    ven_same, ven_same_p = shuffled_nmi(comm, [main_vendor[c] for c in sector_clients], rng)
    result["industry_or_vendor"] = {
        "clients_with_2plus_vendors": len(test),
        "their_filing_share": round(float(totals[test].sum() / totals.sum()), 4),
        "with_sector_label": len(sector_clients),
        "nmi_community_industry": round(ind_obs, 3), "p_industry": round(ind_p, 4),
        "nmi_community_main_vendor": round(ven_obs, 3), "p_vendor": round(ven_p, 4),
        "nmi_community_main_vendor_same_clients": round(ven_same, 3),
        "p_vendor_same_clients": round(ven_same_p, 4),
    }

    # The largest communities, named by their biggest firms and clients.
    strength = dict(giant.degree(weight="weight"))
    described = []
    for part in sorted(best_parts, key=lambda p: -sum(strength[n] for n in p))[:6]:
        firms = sorted((n for n in part if n[0] == "F"), key=lambda n: -strength[n])
        clients = sorted((n for n in part if n[0] == "C"), key=lambda n: -strength[n])
        sectors = Counter(names.naics2(n[1]) for n in clients if names.naics2(n[1]))
        described.append({
            "filings": int(sum(strength[n] for n in firms)),
            "firms": len(firms), "clients": len(clients),
            "top_firms": [firm_names.get(n[1], n[1]) for n in firms[:4]],
            "top_clients": [n[1] for n in clients[:6]],
            "sectors": dict(sectors.most_common(4)),
        })
    result["largest_communities"] = described

    # Q4 · does it hold from year to year?
    yearly = {}
    for year in YEARS:
        gy = graphs[year][0]
        gy = gy.subgraph(max(nx.connected_components(gy), key=len)).copy()
        yearly[year] = labels(louvain(gy, SEED)[0])
    stability = []
    for a, b in zip(YEARS, YEARS[1:]):
        shared = [n for n in yearly[a] if n in yearly[b] and n[0] == "C"]
        stability.append({"from": a, "to": b, "shared_clients": len(shared),
                          "nmi": round(nmi([yearly[a][n] for n in shared], [yearly[b][n] for n in shared]), 3)})
    out["stability"] = stability

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")
    print(json.dumps({k: v for k, v in result.items() if k != "largest_clients"}, indent=1, default=str))
    print(json.dumps(stability))


if __name__ == "__main__":
    main()
