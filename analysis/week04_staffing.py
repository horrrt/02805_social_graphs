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
client). Companies are keyed by week04_names.Resolver: an employer by its tax
number (FY2022 and FY2023 borrow it by name), grouped into families only by the
reviewed alias table; a client by name, taking an employer's tax number when
the names match. week04_names_check.py tests the rules against tax numbers.

Checks
- Modularity of 100 Louvain runs against 100 degree-preserving bipartite
  rewirings (each firm and each client keeps its number of partners; filing
  counts are dealt back out at random, as in Week 3). Two more nulls separate
  the wiring from the weights: unweighted real against unweighted rewired, and
  the real wiring with its filing counts shuffled. Louvain runs on the giant
  component of the real network, and a rewiring splits that component into
  hundreds of pieces, each a free community; so each rewired network is scored
  on its own giant component too (the like-for-like null), with the score over
  all its pieces kept beside it.
- Why shuffled filing counts score higher: modularity split into its two terms
  (the share of filings inside communities, and the penalty for large
  communities), for the real counts and for the shuffled ones.
- NMI and AMI (chance-corrected) of communities with client industry and with
  the client's main vendor, each against shuffled labels, over clients with
  two or more vendors. A client's main vendor is its heaviest neighbour in the
  very network Louvain splits, so the vendor label has a head start.
- Weighted against unweighted: NMI between the Louvain partitions with and
  without filing counts, beside the NMI between two seeds of the same kind, so
  a low number can be told apart from Louvain's own run-to-run noise.
- The same analysis for FY2022 to FY2025, compared on shared clients, beside
  two seeds of the same year on the same clients.
- Infomap (the map equation) on the same network, compared with Louvain and
  with the same industry and vendor labels.
- USCIS approvals and denials, placing firms against direct employers: FY2022
  from the hub's old CSV (the number the page first quoted), and FY2022 to
  FY2026 Q3 from the hub's Tableau export, one source for the whole series.

Output: analysis/week04_staffing.json, and the community numbers the page quotes in
docs/weeks/week04/data/staffing_communities.json
"""

import json
import random
import time
from collections import Counter
from functools import lru_cache
from pathlib import Path

import igraph as ig
import networkx as nx
from rapidfuzz import fuzz
import numpy as np
import pandas as pd
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_names as names
from week04_data import load

OUT = Path(__file__).with_suffix(".json")
# The community numbers the page quotes, for week04-staffing.js.
PAGE = Path(__file__).resolve().parents[1] / "docs/weeks/week04/data/staffing_communities.json"
YEARS = [2022, 2023, 2024, 2025]
MAIN = 2025
RUNS = 100
SEED = 2805
MIN_FILINGS = 20  # clients this large or larger get a concentration score


@lru_cache(maxsize=None)
def resolver():
    """Company keys for every year, learnt from the years that carry tax numbers."""
    rows = [load(f"lca_fy{y}")[["EMPLOYER_NAME", "EMPLOYER_FEIN"]] for y in (2024, 2025, 2026)]
    both = pd.concat(rows)
    return names.Resolver(both["EMPLOYER_NAME"], both["EMPLOYER_FEIN"])


def certified(year):
    lca = load(f"lca_fy{year}")
    lca = lca[(lca["CASE_STATUS"] == "Certified") & (lca["VISA_CLASS"] == "H-1B")].copy()
    lca["positions"] = pd.to_numeric(lca["TOTAL_WORKER_POSITIONS"], errors="coerce").fillna(1)
    # A tax number where there is one; FY2022 and FY2023 names borrow theirs.
    fein = lca["EMPLOYER_FEIN"] if "EMPLOYER_FEIN" in lca else pd.Series("", index=lca.index)
    lca["employer"] = [resolver().employer(n, f) for n, f in zip(lca["EMPLOYER_NAME"], fein)]
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
    """A readable name per employer key."""
    return {k: resolver().label(k) for k in lca["employer"].unique()}


def placements(year, lca):
    """(case, employer, client) rows, and how many raw client rows were placeholders."""
    sites = load(f"worksites_fy{year}")
    sites = sites[sites["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    sites = sites[sites["CASE_NUMBER"].isin(lca["CASE_NUMBER"])]
    # The FY2026 worksites file leaves out about a fifth of the placed filings
    # (FY2022 to FY2025 have every one). Those keep the client on their main row.
    placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    missing = placed[~placed["CASE_NUMBER"].isin(sites["CASE_NUMBER"])]
    sites = pd.concat([sites, missing[["CASE_NUMBER", "SECONDARY_ENTITY", "SECONDARY_ENTITY_BUSINESS_NAME"]]])
    sites = sites.assign(client=sites["SECONDARY_ENTITY_BUSINESS_NAME"].map(resolver().client))
    placeholder = int(sites["client"].isna().sum())
    rows = sites.dropna(subset=["client"]).drop_duplicates(["CASE_NUMBER", "client"])
    rows = rows.merge(lca[["CASE_NUMBER", "employer"]], on="CASE_NUMBER")
    # A firm that names itself as the client (HCL placing at HCL) has placed no
    # one: the worker sits at their own employer. Counted, then dropped.
    own = rows["employer"] == rows["client"]
    rows = rows[~own][["CASE_NUMBER", "employer", "client"]]
    rows.attrs["own_company_rows"] = int(own.sum())
    # Filings with at least one real client company left.
    rows.attrs["client_company_filings"] = int(rows["CASE_NUMBER"].nunique())
    return rows, placeholder, len(sites)


def uscis_outcomes(year=2022, table="uscis"):
    """What happened to the petitions behind the filings: USCIS approvals and
    denials per employer (the Employer Data Hub), set against the employer's
    certified filings that year. An application (LCA) is not a hire; an approved
    petition is as close as public data gets.

    table "uscis" is the hub's old CSV export (FY2022 and FY2023); "uscis_hub" is
    the Tableau export, FY2022 to FY2026 Q3, which also splits out new employment
    (a worker's first H-1B petition). The two disagree by about 5% on FY2022, so a
    series takes every year from one of them.

    USCIS gives only the last four digits of an employer's tax number and
    abbreviates names ("TATA CONSULTANCY SVCS LTD"). Those four digits narrow an
    employer to the dozen or so filers whose tax number ends the same way; the
    closest name among them (rapidfuzz token-sort ratio 85 or more) is the
    match. An employer none of them fits keeps its name-only key when the
    reviewed table knows it, and is otherwise left unmatched."""
    r = resolver()
    hub = load(f"{table}_fy{year}")
    counts = ["INITIAL_APPROVAL", "INITIAL_DENIAL", "CONTINUING_APPROVAL", "CONTINUING_DENIAL"]
    if "NEW_EMPLOYMENT_APPROVAL" in hub:
        counts += ["NEW_EMPLOYMENT_APPROVAL", "NEW_EMPLOYMENT_DENIAL"]
    for col in counts:
        hub[col] = pd.to_numeric(hub[col].str.replace(",", ""), errors="coerce").fillna(0)
    block = {}
    for f in r.major:
        block.setdefault(f[-4:], []).append(f)

    def match(name, tax):
        key = names.legal_name(name)
        best, score = None, 0
        for f in block.get(tax.zfill(4), []):
            s = fuzz.token_sort_ratio(key, r.major[f])
            if s > score:
                best, score = f, s
        if best and score >= 85:
            return r.family_of[best]
        fam = names.family(key)
        return fam if fam in names.canonicals() else ""

    pairs = hub[["EMPLOYER", "TAX_ID"]].drop_duplicates()
    keys = {(n, t): match(n, t) for n, t in pairs.itertuples(index=False) if n.strip()}
    hub["key"] = [keys.get((n, t), "") for n, t in zip(hub["EMPLOYER"], hub["TAX_ID"])]
    hub["matched"] = hub["key"] != ""
    petitions = hub[hub["matched"]].groupby("key")[counts].sum()

    lca = certified(year)
    lca["placed"] = lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
    firms = lca.groupby("employer").agg(filings=("placed", "size"), placed=("placed", "sum"))
    firms = firms[firms["filings"] >= MIN_FILINGS].join(petitions, how="inner")
    firms["kind"] = np.where(firms["placed"] / firms["filings"] >= 0.5, "placing", "direct")

    def summary(frame):
        decided = frame["INITIAL_APPROVAL"] + frame["INITIAL_DENIAL"]
        new = {}
        if "NEW_EMPLOYMENT_APPROVAL" in frame:
            new = {"new_employment_approvals": int(frame["NEW_EMPLOYMENT_APPROVAL"].sum()),
                   "new_employment_denial_rate": round(float(frame["NEW_EMPLOYMENT_DENIAL"].sum() / (
                       frame["NEW_EMPLOYMENT_APPROVAL"] + frame["NEW_EMPLOYMENT_DENIAL"]).sum()), 4),
                   # Rates and shares compare across years; FY2026 counts cover nine months.
                   "new_employment_approvals_per_100_filings": round(float(
                       100 * frame["NEW_EMPLOYMENT_APPROVAL"].sum() / frame["filings"].sum()), 2)}
        return {
            "employers": int(len(frame)),
            "certified_filings": int(frame["filings"].sum()),
            "initial_approvals": int(frame["INITIAL_APPROVAL"].sum()),
            "initial_denial_rate": round(float(frame["INITIAL_DENIAL"].sum() / decided.sum()), 4),
            "continuing_denial_rate": round(float(frame["CONTINUING_DENIAL"].sum() / (
                frame["CONTINUING_APPROVAL"] + frame["CONTINUING_DENIAL"]).sum()), 4),
            "approvals_per_filing": round(float(
                (frame["INITIAL_APPROVAL"] + frame["CONTINUING_APPROVAL"]).sum() / frame["filings"].sum()), 3),
            **new,
        }

    top = firms[firms["kind"] == "placing"].sort_values("placed", ascending=False).head(10)
    return {
        "year": year,
        "source": table,
        "hub_employers": int(len(hub)),
        "hub_initial_approvals": int(hub["INITIAL_APPROVAL"].sum()),
        "matched_share_of_initial_approvals": round(float(
            hub.loc[hub["matched"], "INITIAL_APPROVAL"].sum() / hub["INITIAL_APPROVAL"].sum()), 4),
        "matched_to_a_filer_share_of_initial_approvals": round(float(
            hub.loc[hub["matched"] & hub["key"].isin(lca["employer"]), "INITIAL_APPROVAL"].sum()
            / hub["INITIAL_APPROVAL"].sum()), 4),
        "placing": summary(firms[firms["kind"] == "placing"]),
        "direct": summary(firms[firms["kind"] == "direct"]),
        "top_placing_firms": [
            {"firm": resolver().label(k), "placed_filings": int(r["placed"]), "certified_filings": int(r["filings"]),
             "initial_approvals": int(r["INITIAL_APPROVAL"]), "continuing_approvals": int(r["CONTINUING_APPROVAL"]),
             "initial_denial_rate": round(float(r["INITIAL_DENIAL"] / max(1, r["INITIAL_APPROVAL"] + r["INITIAL_DENIAL"])), 4)}
            for k, r in top.iterrows()],
    }


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


def giant_of(g):
    """The largest component, its nodes and links in g's own order. A subgraph
    view walks its node set instead, whose order changes with Python's string
    hashing from run to run, and Louvain's result depends on node order."""
    comp = max(nx.connected_components(g), key=len)
    h = nx.Graph()
    h.add_nodes_from((n, g.nodes[n]) for n in g if n in comp)
    h.add_edges_from((u, v, d) for u, v, d in g.edges(data=True) if u in comp)
    return h


def q_terms(g, parts):
    """Modularity's two terms for a partition: the share of weight inside
    communities, and the expected share (the sum of squared community strength
    shares). Q is the first minus the second."""
    member = labels(parts)
    total = g.size("weight")
    inside = sum(w for u, v, w in g.edges(data="weight") if member[u] == member[v]) / total
    strength = Counter()
    for n, s in g.degree(weight="weight"):
        strength[member[n]] += s
    penalty = sum((s / (2 * total)) ** 2 for s in strength.values())
    return inside, penalty


def span(seconds):
    """A duration without leading zeros: 45s, 9m32s, 1h5m."""
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h}h{m}m" if h else f"{m}m{s}s" if m else f"{s}s"


def tracked(label, total):
    """range(total) that prints a progress line every tenth: done, share, elapsed, time left."""
    started = time.time()
    step = max(1, total // 10)
    for i in range(total):
        yield i
        done = i + 1
        if done % step == 0 or done == total:
            elapsed = time.time() - started
            print(f"{label}: {done}/{total} ({done / total:.0%}), {span(elapsed)} elapsed, "
                  f"about {span(elapsed / done * (total - done))} left", flush=True)


def louvain(g, seed):
    """Louvain on a networkx graph: (list of node sets, modularity). igraph's
    multilevel is the same method as networkx's louvain_communities and runs about
    25 times faster; the seed fixes the order it visits nodes. Weighted by the edges'
    "weight" when they carry one."""
    nodes, h, weights = to_igraph(g)
    ig.set_random_number_generator(random.Random(seed))
    part = h.community_multilevel(weights=weights)
    return [{nodes[i] for i in c} for c in part], h.modularity(part, weights=weights)


def infomap(g, seed, trials=10):
    """Infomap (Rosvall and Bergstrom 2008), the flow-based alternative to
    modularity: (list of node sets, code length in bits). A random walker's path is
    compressed best when modules trap the walk; one module means no split pays."""
    nodes, h, weights = to_igraph(g)
    ig.set_random_number_generator(random.Random(seed))
    part = h.community_infomap(edge_weights=weights, trials=trials)
    return [{nodes[i] for i in c} for c in part], part.codelength


def to_igraph(g):
    """A networkx graph as (node list, igraph graph, edge weights, 1 where absent)."""
    nodes = list(g)
    index = {n: i for i, n in enumerate(nodes)}
    h = ig.Graph(n=len(nodes), edges=[(index[u], index[v]) for u, v in g.edges()])
    return nodes, h, [d.get("weight", 1) for *_, d in g.edges(data=True)]


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
            "own_company_client_rows": rows.attrs["own_company_rows"],
            # The lead's number: placeholders and self-named firms out.
            "client_company_filings": rows.attrs["client_company_filings"],
            "client_company_share": round(rows.attrs["client_company_filings"] / len(lca), 4),
            "client_company_one_in": round(len(lca) / rows.attrs["client_company_filings"]),
            "edges": int(rows.groupby(["employer", "client"]).ngroups),
            "employer_keys": int(lca["employer"].nunique()),
            "employer_tax_numbers": int(fein.nunique()) if fein is not None else None,
            "placements_to_intermediaries": int(chain.sum()),
            "intermediary_share": round(float(chain.mean()), 4),
            "top_intermediary_clients": {resolver().label(k): int(v) for k, v in
                                         rows[chain]["client"].value_counts().head(6).items()},
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

    out["uscis"] = uscis_outcomes(2022)
    print("USCIS FY2022:", {k: out["uscis"][k] for k in ("placing", "direct")}, flush=True)
    # The same comparison every year from the Tableau export alone; FY2026 is October to June.
    out["uscis_series"] = [uscis_outcomes(y, "uscis_hub") for y in YEARS + [2026]]
    for entry in out["uscis_series"]:
        print(f"USCIS FY{entry['year']}:", {k: entry[k]["initial_denial_rate"] for k in ("placing", "direct")}, flush=True)

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
        {"client": resolver().label(c), "filings": int(totals[c]), "vendors": int(vendors[c]),
         "top_vendor": firm_names.get(main_vendor[c], main_vendor[c]),
         "top_vendor_share": round(float(top_share[c]), 3), "sector": names.naics2(c)}
        for c in totals.sort_values(ascending=False).head(25).index
    ]

    # Q2 · communities, against degree-preserving rewirings.
    giant = giant_of(g)
    runs = [louvain(giant, SEED + i) for i in tracked("Louvain, weighted", RUNS)]
    qs = np.array([q for _, q in runs])
    # Three nulls, so the wiring and the weights can be told apart: rewired
    # wiring with shuffled weights; rewired wiring, unweighted, against the real
    # wiring unweighted; and the real wiring with its weights shuffled.
    plain = unweighted(giant)
    runs_plain = [louvain(plain, SEED + i) for i in tracked("Louvain, unweighted", RUNS)]
    qs_plain = np.array([q for _, q in runs_plain])
    null_qs, null_plain, null_weights, pieces = [], [], [], []
    null_all, null_plain_all, null_share, null_weight_share, shuffled_terms = [], [], [], [], []
    for i in tracked("Nulls, five Louvain runs each", RUNS):
        h = rewire(giant, rng)
        if i == 0:
            check_rewire(giant, h)
        pieces.append(nx.number_connected_components(h))
        # Scored like the real network, on its giant component; and over all its pieces.
        hg = giant_of(h)
        null_share.append(hg.number_of_nodes() / h.number_of_nodes())
        null_weight_share.append(hg.size("weight") / h.size("weight"))
        null_qs.append(louvain(hg, SEED + i)[1])
        null_all.append(louvain(h, SEED + i)[1])
        null_plain.append(louvain(unweighted(hg), SEED + i)[1])
        null_plain_all.append(louvain(unweighted(h), SEED + i)[1])
        shuffled = shuffle_weights(giant, rng)
        parts_w, q_w = louvain(shuffled, SEED + i)
        null_weights.append(q_w)
        shuffled_terms.append(q_terms(shuffled, parts_w))
    null_qs, null_plain, null_weights, null_all, null_plain_all = map(
        np.array, (null_qs, null_plain, null_weights, null_all, null_plain_all))
    best_parts = max(runs, key=lambda r: r[1])[0]
    member = labels(best_parts)
    nodes = list(giant)
    run_labels = [labels(p) for p, _ in runs[:20]]
    over = lambda a, b: nmi([a[n] for n in nodes], [b[n] for n in nodes])
    pairs = [over(run_labels[i], run_labels[i + 1]) for i in range(0, len(run_labels) - 1, 2)]
    # Weighted against unweighted, seed for seed, beside the unweighted seed-to-seed noise.
    plain_labels = [labels(p) for p, _ in runs_plain[:20]]
    plain_pairs = [over(plain_labels[i], plain_labels[i + 1]) for i in range(0, len(plain_labels) - 1, 2)]
    cross = [over(run_labels[i], plain_labels[i]) for i in range(len(run_labels))]
    best_plain = max(runs_plain, key=lambda r: r[1])[0]
    member_plain = labels(best_plain)
    result["giant"] = {"nodes": giant.number_of_nodes(), "edges": giant.number_of_edges(),
                     "share_of_filings": round(giant.size("weight") / g.size("weight"), 4)}
    def compare(real, null):
        return {"real": round(float(real.mean()), 4), "real_sd": round(float(real.std()), 4),
                "null": round(float(null.mean()), 4), "null_sd": round(float(null.std()), 4),
                "z": round(float((real.mean() - null.mean()) / null.std()), 2),
                "null_runs_at_or_above_real": int((null >= real.mean()).sum())}

    # Why shuffled filing counts score higher: Q's two terms, real against shuffled.
    real_terms = np.array([q_terms(giant, p) for p, _ in runs])
    shuffled_terms = np.array(shuffled_terms)
    w_sorted = np.sort([w for *_, w in giant.edges(data="weight")])[::-1]
    n_top = max(1, len(w_sorted) // 100)
    client_of = lambda u, v: u if u[0] == "C" else v
    multi_edge = [w for u, v, w in giant.edges(data="weight") if giant.degree(client_of(u, v)) >= 2]
    # In the best weighted partition: do one-firm clients sit with their firm, and
    # which links carry the filings that cross between groups?
    single = [(u, v) for u, v in giant.edges() if giant.degree(client_of(u, v)) == 1]
    crossing = [(w, giant.degree(client_of(u, v)) >= 2) for u, v, w in giant.edges(data="weight")
                if member[u] != member[v]]
    result["modularity"] = {
        "communities_median": int(np.median([len(p) for p, _ in runs])),
        "nmi_between_seeds_median": round(float(np.median(pairs)), 3),
        "rewired_components_median": int(np.median(pieces)),
        "null_scored_on": "the giant component of each rewired network, as the real network is",
        "rewired_giant_node_share_median": round(float(np.median(null_share)), 4),
        "rewired_giant_filing_share_median": round(float(np.median(null_weight_share)), 4),
        "weighted_vs_rewired": compare(qs, null_qs),
        "wiring_only": compare(qs_plain, null_plain),
        "weights_only": compare(qs, null_weights),
        # The earlier null, scored over every piece of the rewired network.
        "all_pieces": {"weighted_vs_rewired": compare(qs, null_all),
                       "wiring_only": compare(qs_plain, null_plain_all)},
        "weights_check": {
            "real_inside_share": round(float(real_terms[:, 0].mean()), 4),
            "real_penalty": round(float(real_terms[:, 1].mean()), 4),
            "shuffled_inside_share": round(float(shuffled_terms[:, 0].mean()), 4),
            "shuffled_penalty": round(float(shuffled_terms[:, 1].mean()), 4),
            "heaviest_1pct_links": int(n_top),
            "heaviest_1pct_filing_share": round(float(w_sorted[:n_top].sum() / w_sorted.sum()), 4),
            "single_vendor_clients_with_their_firm": round(float(np.mean([member[u] == member[v] for u, v in single])), 4),
            "crossing_filings_on_multi_vendor_links_share": round(float(
                sum(w for w, m in crossing if m) / sum(w for w, _ in crossing)), 4),
            "links_to_multi_vendor_clients_share": round(len(multi_edge) / giant.number_of_edges(), 4),
            "filings_to_multi_vendor_clients_share": round(float(sum(multi_edge) / giant.size("weight")), 4),
        },
    }
    result["weighted_vs_unweighted"] = {
        "communities_median_unweighted": int(np.median([len(p) for p, _ in runs_plain])),
        "nmi_median": round(float(np.median(cross)), 3),
        "nmi_best_partitions": round(float(over(member, member_plain)), 3),
        "nmi_between_seeds_weighted": round(float(np.median(pairs)), 3),
        "nmi_between_seeds_unweighted": round(float(np.median(plain_pairs)), 3),
        "runs_compared": len(cross),
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
    comm_plain = [member_plain[("C", c)] for c in sector_clients]
    ind_plain, ind_plain_p = shuffled_nmi(comm_plain, [names.naics2(c) for c in sector_clients], rng)
    ven_plain, ven_plain_p = shuffled_nmi(comm_plain, [main_vendor[c] for c in sector_clients], rng)
    industry = [names.naics2(c) for c in sector_clients]
    vendor = [main_vendor[c] for c in sector_clients]
    gaps = [ami([lab[("C", c)] for c in sector_clients], vendor) - ami([lab[("C", c)] for c in sector_clients], industry)
            for lab in plain_labels]
    # How often a client shares its community with its own main vendor's node.
    with_vendor = lambda m: round(float(np.mean([m[("C", c)] == m.get(("F", main_vendor[c])) for c in sector_clients])), 4)
    result["industry_or_vendor"] = {
        "clients_with_2plus_vendors": len(test),
        "their_filing_share": round(float(totals[test].sum() / totals.sum()), 4),
        "with_sector_label": len(sector_clients),
        "nmi_community_industry": round(ind_obs, 3), "p_industry": round(ind_p, 4),
        "nmi_community_main_vendor": round(ven_obs, 3), "p_vendor": round(ven_p, 4),
        "nmi_community_main_vendor_same_clients": round(ven_same, 3),
        "p_vendor_same_clients": round(ven_same_p, 4),
        "ami_community_industry": round(float(ami(comm, industry)), 3),
        "ami_community_main_vendor_same_clients": round(float(ami(comm, vendor)), 3),
        "industry_labels": len(set(industry)), "vendor_labels": len(set(vendor)),
        "communities_among_these_clients": len(set(comm)),
        "share_with_own_main_vendor": with_vendor(member),
        "unweighted": {"nmi_community_industry": round(ind_plain, 3), "p_industry": round(ind_plain_p, 4),
                       "nmi_community_main_vendor_same_clients": round(ven_plain, 3),
                       "p_vendor_same_clients": round(ven_plain_p, 4),
                       "ami_community_industry": round(float(ami(comm_plain, industry)), 3),
                       "ami_community_main_vendor_same_clients": round(float(ami(comm_plain, vendor)), 3),
                       "communities_among_these_clients": len(set(comm_plain)),
                       # Over 20 unweighted runs, not only the best: vendor AMI minus industry AMI.
                       "ami_gap_over_runs": {k: round(float(f(gaps)), 3) for k, f in
                                             (("median", np.median), ("min", np.min), ("max", np.max))},
                       "share_with_own_main_vendor": with_vendor(member_plain)},
    }

    # Infomap, the flow-based alternative: does a random walk find the same groups?
    modules, codelength = infomap(giant, SEED)
    member_info = labels(modules)
    comm_info = [member_info[("C", c)] for c in sector_clients]
    info_ind, info_ind_p = shuffled_nmi(comm_info, [names.naics2(c) for c in sector_clients], rng)
    info_ven, info_ven_p = shuffled_nmi(comm_info, [main_vendor[c] for c in sector_clients], rng)
    sizes = sorted((len(m) for m in modules), reverse=True)
    result["infomap"] = {
        "modules": len(modules), "modules_of_two_or_more": sum(x > 1 for x in sizes),
        "largest_module_share_of_nodes": round(sizes[0] / giant.number_of_nodes(), 4),
        "codelength_bits": round(float(codelength), 3),
        "nmi_with_louvain": round(float(over(member, member_info)), 3),
        "nmi_community_industry": round(info_ind, 3), "p_industry": round(info_ind_p, 4),
        "nmi_community_main_vendor_same_clients": round(info_ven, 3), "p_vendor_same_clients": round(info_ven_p, 4),
        "ami_community_industry": round(float(ami(comm_info, industry)), 3),
        "ami_community_main_vendor_same_clients": round(float(ami(comm_info, vendor)), 3),
    }

    # The largest communities, named by their biggest firms and clients.
    strength = dict(giant.degree(weight="weight"))
    described = []
    for part in sorted(best_parts, key=lambda p: -sum(strength[n] for n in p))[:6]:
        # Ties in strength break on the name, so a rerun lists the same companies.
        firms = sorted((n for n in part if n[0] == "F"), key=lambda n: (-strength[n], firm_names.get(n[1], n[1])))
        clients = sorted((n for n in part if n[0] == "C"), key=lambda n: (-strength[n], resolver().label(n[1])))
        sectors = Counter(names.naics2(n[1]) for n in clients if names.naics2(n[1]))
        described.append({
            "filings": int(sum(strength[n] for n in firms)),
            "firms": len(firms), "clients": len(clients),
            "top_firms": [firm_names.get(n[1], n[1]) for n in firms[:4]],
            "top_clients": [resolver().label(n[1]) for n in clients[:6]],
            "sectors": dict(sectors.most_common(4)),
        })
    result["largest_communities"] = described

    # Q4 · does it hold from year to year?
    # Two seeds per year, weighted and unweighted, so the year-to-year NMI can be
    # set beside two runs of the same year on the very same shared clients.
    yearly = {}
    for year in YEARS:
        gy = giant_of(graphs[year][0])
        yearly[year] = {kind: [labels(louvain(h, SEED + k)[0]) for k in (0, 1)]
                        for kind, h in (("weighted", gy), ("unweighted", unweighted(gy)))}
    stability = []
    on = lambda a, b, shared: round(nmi([a[n] for n in shared], [b[n] for n in shared]), 3)
    for a, b in zip(YEARS, YEARS[1:]):
        A, B = yearly[a]["weighted"], yearly[b]["weighted"]
        shared = [n for n in A[0] if n in B[0] and n[0] == "C"]
        entry = {"from": a, "to": b, "shared_clients": len(shared)}
        for kind in ("weighted", "unweighted"):
            A, B = yearly[a][kind], yearly[b][kind]
            key = "" if kind == "weighted" else "unweighted_"
            entry[f"{key}nmi"] = on(A[0], B[0], shared)
            entry[f"{key}same_year_nmi"] = on(B[0], B[1], shared)  # two seeds of the later year
        stability.append(entry)
    out["stability"] = stability

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")
    page = {
        "generated_by": "analysis/week04_staffing.py", "year": MAIN, "runs": RUNS,
        **{k: result[k] for k in ("modularity", "weighted_vs_unweighted", "industry_or_vendor", "infomap")},
        "stability": stability,
    }
    from week04_schemas import check  # here, not at the top: week04_schemas has no reason to load at import
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1) + "\n")
    print(json.dumps({k: v for k, v in result.items() if k != "largest_clients"}, indent=1, default=str))
    print(json.dumps(stability))


if __name__ == "__main__":
    main()
