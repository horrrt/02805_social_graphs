"""Week 4: the filings' entities in one bipartite network, one dot per entity.  Owner: Gyula.

Every worker in the 2025 filings (each position a certified H-1B filing asks for,
and each certified PERM case) and every company that files them becomes a dot,
coloured by its Louvain community. Only the course's tools build and read the
network, the way the Week 4 brief treats the philosophers: a network from the
data, Louvain against a degree-preserving null, NMI between seeds and NMI
against labels ("which label does the partition know more about?").

The network is bipartite, as the staffing network in section 3 and the company x
city and company x occupation networks in sections 1 and 2:
- workers: one node per profile, the workers who share an occupation, a metro,
  a wage level and a sector (a 40-position filing is one profile with 40
  workers). Each profile links to four attribute nodes, its occupation, its
  metro, its level and its sector, with weight = its workers. Two workers are
  connected only through something they share; nothing is inferred.
- companies: one node per employer, linked to every occupation, metro, level and
  sector its workers have, with weight = those workers.
Louvain runs on this network; each worker or company takes its node's community.
The employer and whether the worker is placed at a client never enter the
network, so their NMI with the communities answers whether workers group by job
and pay or by who files for them.

Checks, all from the course:
- Louvain, RUNS seeds, best Q kept; NMI between seeds; NULLS degree-preserving
  bipartite rewirings with the weights dealt back out (week04_staffing.rewire,
  the page's own null); each attribute left out in turn, and the weights left
  out, compared with the main partition by NMI.
- NMI (and AMI where a label has under 1,000 values) against each label,
  weighted by workers, against shuffled labels; the shuffled mean is the chance
  level, since a label with more values scores higher by chance.
- Weeks 1 to 4 on the network and on its projection onto the attribute nodes
  (two attributes linked by the workers, or companies, they share, as
  week04_jobs.projection builds the occupation network): degree distributions;
  path length and clustering against a random graph of the same size and the
  rewired networks' projections; the friendship paradox; degree, closeness,
  betweenness, eigenvector and PageRank centrality; degree assortativity and
  mixing by attribute type; cores; greedy merging and Infomap against Louvain;
  weighted against unweighted; strength against degree; the disparity-filter
  backbone and its k-clique communities.

Output: analysis/week04_entities.json (every number) and one page file per
entity, docs/weeks/week04/data/entities_<name>.json.

    python analysis/week04_entities.py                  # every entity
    python analysis/week04_entities.py --entity workers
"""

import argparse
import itertools
import json
import os
import random
import time
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

import igraph as ig
import networkx as nx
import numpy as np
import pandas as pd
from scipy import sparse
from scipy.stats import spearmanr
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_names as names
import week04_where as where
from week04_data import load
from week04_jobs import MAJOR_GROUPS, filtered, recode_soc
from week04_lawfirms import naics2 as sector_of_code
from week04_perm import perm_certified
from week04_schemas import check
from week04_skills import read as onet_read
from week04_staffing import (SEED, giant_of, graph as staffing_graph, intermediaries, louvain as nx_louvain,
                             placements, resolver, rewire, span, tracked)

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
PAGE = ROOT / "docs/weeks/week04/data"
YEAR = 2025
RUNS = 100
NULLS = 20  # the brief's own count of shuffles
SHUFFLES = 100  # label shuffles per NMI test
TOP = 12  # communities with their own colour
ALPHA = 0.2  # the disparity filter's cut, as section 1 and exercise 4.11
MAX_CLIQUES = 20000  # maximal cliques above which k-clique percolation is skipped: networkx compares cliques pairwise
AMI_MAX_VALUES = 1000
WORKERS = max(1, (os.cpu_count() or 4) - 1)
LEVELS = {"I": 0, "II": 1, "III": 2, "IV": 3}
KINDS = ["occupation", "place", "level", "sector"]  # the attribute nodes, by kind
KIND_NAMES = {"occupation": "occupation", "place": "metro", "level": "wage level", "sector": "sector"}
SECTOR_NAMES = {
    "11": "Agriculture", "21": "Mining and energy", "22": "Utilities", "23": "Construction",
    "31-33": "Manufacturing", "42": "Wholesale", "44-45": "Retail", "48-49": "Transport",
    "51": "Information and telecoms", "52": "Finance and insurance", "53": "Real estate",
    "54": "Professional services", "55": "Holding companies", "56": "Business support",
    "61": "Education", "62": "Health care", "71": "Arts and recreation", "72": "Hospitality",
    "81": "Other services", "92": "Government",
}
UNKNOWN = "unknown"


def stamp(label, started):
    print(f"{label}: {span(time.time() - started)}", flush=True)


# --- Entities -----------------------------------------------------------------

@dataclass
class Entities:
    """One entity type, ready for the shared pipeline.

    profiles: one row per node on the entity side, with its describing fields
      (occupation, place, level, sector: the most common for a company) and its
      counts (workers, h1b, perm).
    links: the bipartite links, one row per (profile, attribute node) with its
      weight in workers; an attribute node is "<kind>:<code>".
    project_by: the weight a profile adds to a link of the projection onto the
      attributes: "workers" (its workers) or "one" (a company counts once, as
      week04_jobs.projection counts companies).
    items: one row per counted thing (a filing, a case, a company) with its
      profile, its weight in workers and its test labels; a label left empty
      does not take part in that label's test.
    labels: the item columns tested against the communities.
    dots: "workers" draws one dot per worker of a profile; "items" draws one
      dot per item, sized by its workers.
    """
    name: str
    unit: str
    profiles: pd.DataFrame
    links: pd.DataFrame
    project_by: str
    items: pd.DataFrame
    labels: list
    describe: list
    dots: str
    lookups: dict = field(default_factory=dict)
    notes: dict = field(default_factory=dict)


def metro_table():
    lookup, town_lookup, gaz = where.metros()
    return lookup, town_lookup, gaz["NAME"].to_dict()


def place_names(codes, gaz_names):
    """Display names: the CBSA title, or "Outside metro areas, Texas"."""
    out = {}
    for c in codes:
        if c.startswith("N-"):
            out[c] = f"Outside metro areas, {where.STATE_NAMES.get(c[2:], c[2:])}"
        elif c == UNKNOWN:
            out[c] = "Place unknown"
        else:
            out[c] = gaz_names.get(c, c).removesuffix(" Metro Area").removesuffix(" Micro Area")
    return out


def main_places(lca, lookup, town_lookup):
    """Each H-1B case's place: the metro with most of its workers, else
    "N-<state>" outside any metro, else unknown; and the usual county of each
    city, for the PERM worksites."""
    sites = load(f"worksites_fy{YEAR}")
    sites = sites[sites["CASE_NUMBER"].isin(lca["CASE_NUMBER"])].copy()
    sites["workers"] = pd.to_numeric(sites["WORKSITE_WORKERS"], errors="coerce").fillna(1)
    stats = where.locate(sites, lookup, town_lookup)
    abbr = {n.upper(): a for a, n in where.STATE_NAMES.items()}
    st = sites["state"].map(abbr)
    sites["place"] = sites["metro"].where(sites["metro"].notna(), ("N-" + st).where(st.notna(), UNKNOWN))
    top = (sites.groupby(["CASE_NUMBER", "place"])["workers"].sum().reset_index()
           .sort_values(["CASE_NUMBER", "workers", "place"], ascending=[True, False, True])
           .drop_duplicates("CASE_NUMBER").set_index("CASE_NUMBER")["place"])
    return top, where.usual_counties(sites), stats


def perm_places(perm, lookup, town_lookup, usual):
    frame = pd.DataFrame({
        "WORKSITE_STATE": perm["PRIMARY_WORKSITE_STATE"].str.strip().str.upper().map(
            {a: n.upper() for a, n in where.STATE_NAMES.items()}).fillna(""),
        "WORKSITE_COUNTY": perm["PRIMARY_WORKSITE_COUNTY"].fillna(""),
        "WORKSITE_CITY": perm["PRIMARY_WORKSITE_CITY"].fillna(""),
    }, index=perm.index)
    stats = where.locate(frame, lookup, town_lookup, usual)
    st = perm["PRIMARY_WORKSITE_STATE"].str.strip().str.upper()
    st = st.where(st.isin(where.STATE_NAMES))
    place = frame["metro"].where(frame["metro"].notna(), ("N-" + st).where(st.notna(), UNKNOWN))
    return place, stats


def occupation_titles(items):
    """Each code's O*NET title; a code O*NET does not list (15-1295, say) takes
    the title its filings give most often."""
    titles = onet_read("occupation_data").set_index("O*NET-SOC Code")["Title"]
    first = titles.groupby(titles.index.str[:7]).first()
    filed = (items.groupby(["occupation", "SOC_TITLE"])["weight"].sum().reset_index()
             .sort_values(["occupation", "weight", "SOC_TITLE"], ascending=[True, False, True])
             .drop_duplicates("occupation").set_index("occupation")["SOC_TITLE"].str.strip().str.title())
    return {c: titles.get(f"{c}.00", first.get(c, filed.get(c, c))) for c in sorted(set(items["occupation"]))}


@dataclass
class Filings:
    """The 2025 workers as items, shared by the worker and company entities."""
    items: pd.DataFrame
    titles: dict
    places: dict
    notes: dict


_FILINGS = None


def filings():
    """Certified 2025 H-1B filings (one item per filing, weight = positions) and
    certified PERM cases (weight 1), each with occupation, place, level, sector,
    employer and the test labels."""
    global _FILINGS
    if _FILINGS is not None:
        return _FILINGS
    started = time.time()
    lookup, town_lookup, gaz_names = metro_table()
    lca = filtered(YEAR)
    place, usual, site_stats = main_places(lca, lookup, town_lookup)
    positions = pd.to_numeric(lca["TOTAL_WORKER_POSITIONS"], errors="coerce").fillna(1).astype(int)
    abbr = {n.upper(): a for a, n in where.STATE_NAMES.items()}
    # A case missing from the worksite file keeps its main row's state.
    fallback = lca["WORKSITE_STATE"].str.upper().str.strip().map(abbr)
    h1b_place = lca["CASE_NUMBER"].map(place)
    h1b_place = h1b_place.where(h1b_place.notna(), ("N-" + fallback).where(fallback.notna(), UNKNOWN))
    h1b = pd.DataFrame({
        "visa": "H-1B",
        "occupation": lca["occupation"].values,
        "SOC_TITLE": lca["SOC_TITLE"].values,
        "place": h1b_place.values,
        "level": lca["PW_WAGE_LEVEL"].str.strip().map(LEVELS).values,
        "sector": lca["NAICS_CODE"].map(sector_of_code).values,
        "employer": lca["employer"].values,
        "hq_state": lca["EMPLOYER_STATE"].str.strip().str.upper().values,
        "placed": np.where(lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y").fillna(False),
                           "placed at a client", "direct"),
        "weight": positions.values,
    })
    placing = intermediaries(lca)

    perm = perm_certified(YEAR).rename(columns={"PWD_SOC_CODE": "SOC_CODE", "PWD_SOC_TITLE": "SOC_TITLE"})
    perm = perm[perm["SOC_CODE"].str.match(r"^\d{2}-\d{4}", na=False)]
    perm = recode_soc(perm)
    dropped_perm = int((~perm["soc_valid"]).sum())
    perm = perm[perm["soc_valid"]]
    p_place, perm_stats = perm_places(perm, lookup, town_lookup, usual)
    level_col = perm["PW_WAGE_LEVEL"] if "PW_WAGE_LEVEL" in perm else pd.Series(np.nan, index=perm.index)
    pm = pd.DataFrame({
        "visa": "PERM",
        "occupation": perm["occupation"].values,
        "SOC_TITLE": perm["SOC_TITLE"].values,
        "place": p_place.values,
        "level": level_col.astype(str).str.strip().str.upper().map(LEVELS).values,
        "sector": perm["EMP_NAICS"].map(sector_of_code).values,
        "employer": perm["employer"].values,
        "hq_state": perm["EMP_STATE"].str.strip().str.upper().values,
        "placed": None,  # PERM has no placement field
        "weight": 1,
    })
    items = pd.concat([h1b, pm], ignore_index=True)
    # A missing sector borrows the company's reviewed sector (week04_names), else "unknown".
    items["sector"] = items["sector"].where(items["sector"].isin(SECTOR_NAMES))
    borrowed = items["sector"].isna()
    items.loc[borrowed, "sector"] = items.loc[borrowed, "employer"].map(lambda e: names.naics2(e) or None)
    items["sector"] = items["sector"].where(items["sector"].isin(SECTOR_NAMES), UNKNOWN)
    # Wage level: H-1B filings state it; the 2025 PERM form does not. Missing
    # levels take the most common H-1B level of the same occupation and place,
    # else of the occupation, else level II.
    known = items[items["level"].notna() & (items["visa"] == "H-1B")]
    by_both = (known.groupby(["occupation", "place", "level"])["weight"].sum().reset_index()
               .sort_values(["occupation", "place", "weight", "level"], ascending=[True, True, False, True])
               .drop_duplicates(["occupation", "place"]).set_index(["occupation", "place"])["level"])
    by_occ = (known.groupby(["occupation", "level"])["weight"].sum().reset_index()
              .sort_values(["occupation", "weight", "level"], ascending=[True, False, True])
              .drop_duplicates("occupation").set_index("occupation")["level"])
    missing = items["level"].isna()
    guess = pd.Series([by_both.get((o, p)) for o, p in zip(items.loc[missing, "occupation"], items.loc[missing, "place"])],
                      index=items.index[missing])
    guess = guess.fillna(items.loc[missing, "occupation"].map(by_occ)).fillna(LEVELS["II"])
    items["level_imputed"] = missing
    items.loc[missing, "level"] = guess
    items["level"] = items["level"].astype(int)
    items["major_group"] = items["occupation"].str[:2].map(MAJOR_GROUPS).fillna(UNKNOWN)
    items["placing_firm"] = np.where(items["employer"].isin(placing), "placing firm", "direct employer")

    titles = occupation_titles(items)
    places = place_names(sorted(set(items["place"])), gaz_names)
    notes = {
        "h1b_filings": int(len(h1b)), "h1b_positions": int(h1b["weight"].sum()),
        "perm_cases": int(len(pm)), "perm_dropped_unreadable_soc": dropped_perm,
        "workers": int(items["weight"].sum()),
        "worksites": site_stats, "perm_worksites": perm_stats,
        "workers_outside_metros": int(items.loc[items["place"].str.startswith("N-"), "weight"].sum()),
        "workers_place_unknown": int(items.loc[items["place"] == UNKNOWN, "weight"].sum()),
        "workers_level_imputed": int(items.loc[items["level_imputed"], "weight"].sum()),
        "perm_level_imputed_share": round(float(items.loc[items["visa"] == "PERM", "level_imputed"].mean()), 4),
        "workers_sector_unknown": int(items.loc[items["sector"] == UNKNOWN, "weight"].sum()),
    }
    stamp("filings", started)
    _FILINGS = Filings(items, titles, places, notes)
    return _FILINGS


def lookups(f):
    return {"occupation": f.titles, "place": f.places,
            "sector": {**SECTOR_NAMES, UNKNOWN: "Sector unknown"},
            "level": {v: f"Level {k}" for k, v in LEVELS.items()}}


def workers():
    f = filings()
    items = f.items
    counted = items.assign(h1b=items["weight"].where(items["visa"] == "H-1B", 0),
                           perm=items["weight"].where(items["visa"] == "PERM", 0))
    profiles = (counted.groupby(KINDS)
                .agg(workers=("weight", "sum"), h1b=("h1b", "sum"), perm=("perm", "sum"))
                .reset_index())
    profiles = profiles.sort_values(KINDS, kind="stable").reset_index(drop=True)
    index = {k: i for i, k in enumerate(map(tuple, profiles[KINDS].values))}
    items = items.assign(profile=[index[k] for k in map(tuple, items[KINDS].values)])
    # Each profile links to its four attribute nodes, weighted by its workers.
    links = pd.concat([pd.DataFrame({"profile": profiles.index, "attribute": kind + ":" + profiles[kind].astype(str),
                                     "weight": profiles["workers"].values}) for kind in KINDS], ignore_index=True)
    return Entities(
        name="workers", unit="worker", profiles=profiles, links=links, project_by="workers", items=items,
        labels=["major_group", "place", "level", "sector", "employer", "placed", "visa"],
        describe=KINDS, dots="workers", lookups=lookups(f), notes=f.notes)


def companies():
    f = filings()
    items = f.items

    def modal(col):
        return (items.groupby(["employer", col])["weight"].sum().reset_index()
                .sort_values(["employer", "weight", col], ascending=[True, False, True])
                .drop_duplicates("employer").set_index("employer")[col])

    table = pd.DataFrame({"workers": items.groupby("employer")["weight"].sum()}).sort_index()
    for col in KINDS + ["hq_state"]:
        table[col] = modal(col).reindex(table.index)
    table["hq_state"] = table["hq_state"].fillna(UNKNOWN)
    by_visa = items.groupby(["employer", "visa"])["weight"].sum().unstack(fill_value=0).reindex(table.index, fill_value=0)
    table["h1b"] = by_visa.get("H-1B", 0).astype(int)
    table["perm"] = by_visa.get("PERM", 0).astype(int)
    index = {e: i for i, e in enumerate(table.index)}
    # Each company links to every occupation, metro, level and sector of its
    # workers, weighted by those workers.
    parts = []
    for kind in KINDS:
        g = items.groupby(["employer", kind])["weight"].sum().reset_index()
        parts.append(pd.DataFrame({"profile": g["employer"].map(index).values,
                                   "attribute": kind + ":" + g[kind].astype(str).values, "weight": g["weight"].values}))
    links = pd.concat(parts, ignore_index=True)
    profiles = table[KINDS + ["workers", "h1b", "perm"]].reset_index(drop=True)
    profiles["level"] = profiles["level"].astype(int)
    staffing = staffing_communities()
    placing = set(items.loc[items["placing_firm"] == "placing firm", "employer"])
    company_items = pd.DataFrame({
        "employer": table.index, "label": [resolver().label(e) for e in table.index],
        "profile": np.arange(len(table)), "weight": table["workers"].values,
        "sector": table["sector"].values, "hq_state": table["hq_state"].values,
        "placing_firm": np.where(table.index.isin(placing), "placing firm", "direct employer"),
        "staffing_community": [staffing.get(e) for e in table.index],
    })
    return Entities(
        name="companies", unit="company", profiles=profiles, links=links, project_by="one", items=company_items,
        labels=["sector", "placing_firm", "staffing_community", "hq_state"],
        describe=KINDS, dots="items", lookups=lookups(f), notes={"companies": int(len(table))})


def staffing_communities():
    """Section 3's staffing partition, 2025: firm key -> community, best Q of
    RUNS Louvain runs on the giant component (week04_staffing.main does the same)."""
    started = time.time()
    lca = filtered(YEAR)
    rows, _, _ = placements(YEAR, lca)
    giant = giant_of(staffing_graph(rows))
    runs = [nx_louvain(giant, SEED + i) for i in tracked("Staffing Louvain", RUNS)]
    best = max(runs, key=lambda r: r[1])[0]
    stamp("staffing communities", started)
    return {node[1]: str(i) for i, part in enumerate(best) for node in part if node[0] == "F"}


REGISTRY = {"workers": workers, "companies": companies}


# --- The network ----------------------------------------------------------------

def bipartite(ent, kinds=KINDS):
    """The igraph network: profiles 0..P-1, then one node per attribute value of
    the kinds kept; weights in workers. Returns (graph, attribute names)."""
    links = ent.links[ent.links["attribute"].str.split(":").str[0].isin(kinds)]
    attributes = sorted(set(links["attribute"]))
    at = {a: len(ent.profiles) + i for i, a in enumerate(attributes)}
    g = ig.Graph(n=len(ent.profiles) + len(attributes),
                 edges=list(zip(links["profile"].astype(int), links["attribute"].map(at))))
    g.es["weight"] = links["weight"].astype(float).tolist()
    return g, attributes


def projection(g, profiles, per_profile):
    """The projection onto the attribute nodes: two attributes linked with the
    summed per_profile weight of the profiles that link to both (week04_jobs
    counts companies the same way). A sparse product, B^T diag(w) B."""
    n_attr = g.vcount() - profiles
    e = np.sort(np.array(g.get_edgelist()), axis=1)  # (profile, attribute)
    rows, cols = e[:, 0], e[:, 1] - profiles
    b = sparse.csr_matrix((np.ones(len(rows)), (rows, cols)), shape=(profiles, n_attr))
    b.data[:] = 1
    m = (b.T @ sparse.diags(per_profile) @ b).tocoo()
    keep = m.row < m.col
    h = ig.Graph(n=n_attr, edges=list(zip(m.row[keep].tolist(), m.col[keep].tolist())))
    h.es["weight"] = m.data[keep].astype(float).tolist()
    return h


_G = None
_PROFILES = 0
_PER_PROFILE = None


def _init(n, edges, weights, profiles, per_profile):
    global _G, _PROFILES, _PER_PROFILE
    _G = ig.Graph(n=n, edges=edges)
    _G.es["weight"] = weights
    _PROFILES, _PER_PROFILE = profiles, per_profile


def _louvain(seed):
    ig.set_random_number_generator(random.Random(seed))
    part = _G.community_multilevel(weights="weight")
    return part.membership, part.modularity


def _louvain_plain(seed):
    """Louvain without the weights; scored by unweighted modularity."""
    ig.set_random_number_generator(random.Random(seed))
    part = _G.community_multilevel()
    return part.membership, part.modularity


def _null(seed):
    """One degree-preserving bipartite rewiring with the filing counts dealt back
    out (week04_staffing.rewire, section 3's null), scored by Louvain; and its
    projection's clustering and degree mixing, for the week 2 and 3 baselines."""
    tag = lambda v: ("F", v) if v < _PROFILES else ("C", v)
    g = nx.Graph()
    g.add_weighted_edges_from((tag(u), tag(v), w) for (u, v), w in zip(_G.get_edgelist(), _G.es["weight"]))
    h = rewire(g, random.Random(seed))
    edges = [(u[1], v[1]) if u[0] == "F" else (v[1], u[1]) for u, v in h.edges()]
    r = ig.Graph(n=_G.vcount(), edges=edges)
    r.es["weight"] = [h[u][v]["weight"] for u, v in h.edges()]
    ig.set_random_number_generator(random.Random(seed))
    part = r.community_multilevel(weights="weight")
    # The wiring alone: the same rewiring without its weights (section 3's wiring_only null).
    ig.set_random_number_generator(random.Random(seed))
    plain = r.community_multilevel()
    p = projection(r, _PROFILES, _PER_PROFILE)
    return part.modularity, p.transitivity_undirected(), p.assortativity_degree(directed=False), plain.modularity


def pool(g, profiles, per_profile):
    return ProcessPoolExecutor(WORKERS, initializer=_init,
                               initargs=(g.vcount(), g.get_edgelist(), g.es["weight"], profiles, per_profile))


def louvain_runs(g, runs, label, weighted=True, profiles=0, per_profile=None):
    started = time.time()
    with pool(g, profiles, per_profile) as ex:
        found = list(ex.map(_louvain if weighted else _louvain_plain, [SEED + i for i in range(runs)],
                            chunksize=max(1, runs // (4 * WORKERS))))
    stamp(f"{label}: {runs} Louvain runs", started)
    return found


def by_size(membership, weight):
    """Community ids renumbered by weight, largest first."""
    totals = pd.Series(weight).groupby(membership).sum().sort_values(ascending=False, kind="stable")
    rank = {c: r for r, c in enumerate(totals.index)}
    return np.array([rank[c] for c in membership])


def weighted_labels(items, community, label):
    mask = items[label].notna().values
    reps = items["weight"].values[mask]
    return np.repeat(community[items["profile"].values[mask]], reps), np.repeat(items[label].astype(str).values[mask], reps)


def _label_test(args):
    a, b, seed, times = args
    observed = nmi(a, b)
    rng = np.random.default_rng(seed)
    shuffled = np.array([nmi(a, rng.permutation(b)) for _ in range(times)])
    beats = int((shuffled >= observed).sum())
    values = len(set(b))
    # A label with more values scores a higher NMI by chance alone: the
    # shuffled mean is that chance level, the baseline each label is read against.
    return {"nmi": round(float(observed), 4), "p": round((beats + 1) / (times + 1), 4), "shuffles": times,
            "nmi_shuffled_mean": round(float(shuffled.mean()), 4), "nmi_shuffled_sd": round(float(shuffled.std()), 4),
            "values": values, "items_weighted": int(len(a)),
            "ami": round(float(ami(a, b)), 4) if values < AMI_MAX_VALUES else None}


def ccdf(values, points=60):
    values = np.asarray(values, dtype=float)
    values = values[values > 0]
    if not len(values):
        return []
    xs = np.unique(np.round(np.geomspace(values.min(), values.max(), points), 6))
    return [[round(float(x), 4), round(float((values >= x).mean()), 6)] for x in xs]


def disparity_p(g):
    """Disparity-filter p-value of every link: the smaller of its endpoints'
    (1 - w/s)^(k-1), an endpoint with one link cannot judge it (as
    week04_where.disparity, vectorised)."""
    w = np.array(g.es["weight"])
    s = np.array(g.strength(weights="weight"))
    k = np.array(g.degree())
    e = np.array(g.get_edgelist())
    out = np.full(len(w), np.inf)
    for side in (0, 1):
        v = e[:, side]
        p = (1 - w / s[v]) ** (k[v] - 1)
        out = np.where(k[v] > 1, np.minimum(out, p), out)
    return np.where(np.isinf(out), 0.0, out)


def check_disparity_p():
    """Same p-values as week04_where.disparity on a small weighted graph."""
    rng = random.Random(SEED)
    g = nx.gnm_random_graph(40, 120, seed=SEED)
    for u, v in g.edges():
        g[u][v]["weight"] = rng.randint(1, 9)
    ref = where.disparity(g)
    h = ig.Graph(n=40, edges=list(g.edges()))
    h.es["weight"] = [g[u][v]["weight"] for u, v in g.edges()]
    mine = disparity_p(h)
    assert all(abs(mine[i] - ref[e]) < 1e-12 for i, e in enumerate(g.edges())), "disparity_p disagrees"


def course_facts(ent, g, attributes, proj, nulls, member_attr):
    """Weeks 1 to 4 of the course. Degree distributions on the bipartite network;
    paths, clustering, centrality and mixing on the projection onto attributes
    (a bipartite network has no triangles, so clustering lives there)."""
    facts, started = {}, time.time()
    p = len(ent.profiles)
    deg = np.array(g.degree())
    strength = np.array(g.strength(weights="weight"))
    kind = np.array([a.split(":")[0] for a in attributes])
    # Week 1 · the network and its degree distributions.
    facts["week1"] = {
        "profiles": p, "attribute_nodes": len(attributes), "links": g.ecount(),
        "attribute_nodes_by_kind": {k: int((kind == k).sum()) for k in KINDS},
        "profile_degree_mean": round(float(deg[:p].mean()), 3),
        "attribute_degree_max": int(deg[p:].max()),
        "attribute_hub": attribute_name(ent, attributes[int(np.argmax(deg[p:]))]),
        "ccdf": {"attribute_degree": ccdf(deg[p:]), "attribute_strength": ccdf(strength[p:]),
                 "profile_strength": ccdf(strength[:p])},
    }
    # Week 2 · the projection against a random graph and the rewired networks.
    n, m = proj.vcount(), proj.ecount()
    ig.set_random_number_generator(random.Random(SEED))
    er = ig.Graph.Erdos_Renyi(n=n, m=m)
    pdeg = np.array(proj.degree())
    knn = np.array(proj.knn()[0])
    finite = lambda d: np.array(d, dtype=float)[np.isfinite(np.array(d, dtype=float)) & (np.array(d, dtype=float) > 0)]
    facts["week2"] = {
        "projection_nodes": n, "projection_links": m, "density": round(2 * m / (n * (n - 1)), 4),
        "mean_path": round(float(finite(proj.distances()).mean()), 3),
        "mean_path_random": round(float(finite(er.distances()).mean()), 3),
        "transitivity": round(proj.transitivity_undirected(), 4),
        "transitivity_random": round(er.transitivity_undirected(), 4),
        "transitivity_rewired": {"mean": round(float(np.mean([n[1] for n in nulls])), 4),
                                 "sd": round(float(np.std([n[1] for n in nulls])), 4)},
        "friendship_paradox": {
            "mean_degree": round(float(pdeg.mean()), 3),
            "mean_neighbour_degree": round(float(np.nanmean(knn)), 3),
            "share_with_better_connected_neighbours": round(float(np.nanmean(knn > pdeg)), 4),
        },
    }
    stamp("week 2 facts", started)
    # Week 3 · centrality and mixing on the projection.
    pw = np.array(proj.strength(weights="weight"))
    measures = {
        "degree": pdeg.astype(float), "strength": pw,
        "closeness": np.array(proj.closeness()), "betweenness": np.array(proj.betweenness()),
        "eigenvector": np.array(proj.eigenvector_centrality(weights="weight", scale=True)),
        "pagerank": np.array(proj.pagerank(weights="weight")),
    }
    corr = {f"{a}~{b}": round(float(spearmanr(measures[a], measures[b])[0]), 3)
            for a, b in itertools.combinations(measures, 2)}
    top = {k: [attribute_name(ent, attributes[i]) for i in np.argsort(-v, kind="stable")[:10]]
           for k, v in measures.items()}
    codes = pd.Series(kind).astype("category").cat.codes.tolist()
    shuffled = [proj.assortativity_nominal(np.random.default_rng(SEED + i).permutation(codes).tolist(), directed=False)
                for i in range(NULLS)]
    null_assort = [n[2] for n in nulls]
    core = np.array(proj.coreness())
    facts["week3"] = {
        "spearman": corr, "top": top,
        "assortativity": {
            "degree": round(proj.assortativity_degree(directed=False), 4),
            "degree_rewired": {"mean": round(float(np.mean(null_assort)), 4), "sd": round(float(np.std(null_assort)), 4)},
            "kind": {"real": round(proj.assortativity_nominal(codes, directed=False), 4),
                     "shuffled_mean": round(float(np.mean(shuffled)), 4),
                     "shuffled_sd": round(float(np.std(shuffled)), 6)},
        },
        "max_core": int(core.max()), "nodes_in_max_core": int((core == core.max()).sum()),
        # Which communities each kind of attribute spreads over: a metro that
        # sits in one community, or a sector that anchors several.
        "attributes_per_community": {k: int(len(set(member_attr[kind == k]))) for k in KINDS},
    }
    stamp("week 3 facts", started)
    return facts


def layout(g, member, member_attr, p, workers, steps=400):
    """Where each community sits. The communities are the nodes of a graph whose
    links carry the worker weight between them (the bipartite links that cross
    two communities); the Fruchterman-Reingold force layout (networkx's
    spring_layout in the course; seeded, weights log-scaled) places them, so
    strongly linked groups sit close. Each community is a disc with area in
    proportion to its workers; discs are pushed apart until none overlap. The
    page fills each disc with its dots. Returns the centres (0 to 1000) and the
    spacing: a disc's radius is spacing * sqrt(workers).

    A force layout of the whole network puts every profile in one ball: the
    four wage-level and 21 sector nodes link to nearly all of them."""
    n = int(member.max()) + 1
    e = np.sort(np.array(g.get_edgelist()), axis=1)
    cu, ca = member[e[:, 0]], member_attr[e[:, 1] - p]
    cross = (ca >= 0) & (cu != ca)
    pairs = pd.DataFrame({"a": np.minimum(cu, ca)[cross], "b": np.maximum(cu, ca)[cross],
                          "w": np.array(g.es["weight"])[cross]}).groupby(["a", "b"])["w"].sum().reset_index()
    q = ig.Graph(n=n, edges=list(zip(pairs["a"], pairs["b"])))
    ig.set_random_number_generator(random.Random(SEED))
    pos = np.array(q.layout_fruchterman_reingold(weights=np.log1p(pairs["w"]).tolist(), niter=2000).coords)
    r = np.sqrt(np.bincount(member, weights=workers, minlength=n))
    # Start at the mean disc size, then push overlapping discs apart.
    span_ = np.ptp(pos, axis=0).max() or 1.0
    pos = (pos - pos.mean(axis=0)) / span_ * r.sum() * 0.6
    gap = 0.04 * r.max()
    for _ in range(steps):
        d = pos[:, None, :] - pos[None, :, :]
        dist = np.sqrt((d ** 2).sum(-1)) + np.eye(n)
        need = r[:, None] + r[None, :] + gap
        overlap = np.clip(need - dist, 0, None) * (1 - np.eye(n))
        if not overlap.any():
            break
        push = (d / dist[..., None]) * (overlap / 2)[..., None]
        pos += push.sum(axis=1)
        # A gentle pull to the middle keeps the picture compact.
        pos -= 0.01 * (pos - pos.mean(axis=0))
    lo = (pos - r[:, None]).min(axis=0)
    hi = (pos + r[:, None]).max(axis=0)
    scale = 1000 / (hi - lo).max()
    return (pos - lo) * scale, float(scale)


def attribute_name(ent, attribute):
    kind, code = attribute.split(":", 1)
    look = ent.lookups[kind]
    value = int(code) if kind == "level" else code
    return f"{look.get(value, code)}"


def week4_facts(g, proj, member, attributes, ent):
    started = time.time()
    out = {}
    greedy = g.community_fastgreedy(weights="weight").as_clustering()
    out["greedy"] = {"communities": len(greedy), "Q": round(greedy.modularity, 4),
                     "nmi_louvain": round(float(nmi(member, greedy.membership)), 4)}
    stamp("greedy modularity", started)
    ig.set_random_number_generator(random.Random(SEED))
    info = g.community_infomap(edge_weights="weight", trials=1)
    out["infomap"] = {"communities": len(info), "codelength": round(info.codelength, 4),
                      "nmi_louvain": round(float(nmi(member, info.membership)), 4)}
    stamp("Infomap", started)
    strength = np.array(proj.strength(weights="weight"))
    out["strength_vs_degree_spearman"] = round(float(spearmanr(strength, proj.degree())[0]), 4)
    weights = proj.es["weight"]
    out["weight_range"] = [int(min(weights)), int(max(weights))]
    # The backbone of the projection: disparity filter at ALPHA (exercise 4.11).
    p = disparity_p(proj)
    kept = np.flatnonzero(p < ALPHA)
    bb = proj.subgraph_edges(kept.tolist(), delete_vertices=False)
    comps = bb.connected_components()
    giant = max(comps, key=len)
    out["backbone"] = {"alpha": ALPHA, "links": int(len(kept)), "link_share": round(len(kept) / proj.ecount(), 4),
                       "nodes_with_a_link": int(sum(1 for d in bb.degree() if d)), "giant_nodes": len(giant),
                       "strongest": [[attribute_name(ent, attributes[u]), attribute_name(ent, attributes[v]),
                                      int(proj.es[i]["weight"])]
                                     for i, (u, v) in sorted(((i, proj.es[i].tuple) for i in kept),
                                                             key=lambda t: -proj.es[t[0]]["weight"])[:8]]}
    # k-clique communities on the backbone (overlapping; networkx, the course's tool).
    bnx = nx.Graph(bb.get_edgelist())
    bnx.remove_nodes_from([v for v, d in list(bnx.degree()) if d == 0])
    # A dense backbone holds more maximal cliques than percolation can take:
    # count them as they come and stop at MAX_CLIQUES.
    maximal = list(itertools.islice(nx.find_cliques(bnx), MAX_CLIQUES + 1)) if bnx.number_of_edges() else []
    too_many = len(maximal) > MAX_CLIQUES
    maximal = [frozenset(c) for c in maximal]
    out["maximal_cliques"] = None if too_many else len(maximal)
    out["largest_clique"] = None if too_many else max((len(c) for c in maximal), default=0)
    cliques = {}
    for k in (3, 4, 5):
        big = [c for c in maximal if len(c) >= k]
        if too_many:
            cliques[str(k)] = {"skipped": f"over {MAX_CLIQUES:,} maximal cliques"}
            continue
        comms = list(nx.algorithms.community.k_clique_communities(bnx, k, cliques=big))
        seen = {}
        for i, c in enumerate(comms):
            for v in c:
                seen.setdefault(v, set()).add(i)
        cliques[str(k)] = {"communities": len(comms), "nodes": len(seen),
                           "nodes_in_two_or_more": sum(1 for s in seen.values() if len(s) > 1),
                           "in_most": [attribute_name(ent, attributes[v]) for v, s in
                                       sorted(seen.items(), key=lambda t: (-len(t[1]), t[0]))[:3] if len(s) > 1],
                           "largest": max((len(c) for c in comms), default=0)}
    out["k_clique"] = cliques
    stamp("backbone and k-cliques", started)
    return out


def name_community(profiles, idx, lookups, describe):
    """A community's name from the most common value of each field, by workers."""
    part = profiles.iloc[idx]
    w = part["workers"].values
    shares = {}
    for col in describe:
        s = pd.Series(w, index=part[col].values).groupby(level=0).sum().sort_values(ascending=False, kind="stable")
        value, share = s.index[0], float(s.iloc[0] / w.sum())
        shares[col] = {"value": str(value), "name": lookups[col].get(value, str(value)), "share": round(share, 3),
                       "top": [[lookups[col].get(v, str(v)), round(float(x / w.sum()), 3)] for v, x in s.head(3).items()]}
    occ, lev, sec, plc = (shares[c] for c in ("occupation", "level", "sector", "place"))
    bits = [f"{lev['name']} {occ['name']}" if lev["share"] >= 0.5 else occ["name"]]
    if sec["share"] >= 0.5:
        bits.append(sec["name"])
    bits.append(plc["name"] if plc["share"] >= 0.5 else "several metros")
    return " · ".join(bits), shares


def run(ent):
    """The shared pipeline for one entity."""
    started = time.time()
    g, attributes = bipartite(ent)
    p = len(ent.profiles)
    per_profile = (ent.profiles["workers"].values if ent.project_by == "workers" else np.ones(p)).astype(float)
    print(f"{ent.name}: {p:,} profiles, {len(attributes):,} attribute nodes, {g.ecount():,} links", flush=True)
    comps = g.connected_components()
    if len(comps) > 1:
        print(f"{ent.name}: {len(comps)} components; Louvain keeps every one", flush=True)
    w_profiles = ent.profiles["workers"].values
    node_weight = np.concatenate([w_profiles, np.zeros(len(attributes))])
    found = louvain_runs(g, RUNS, ent.name, profiles=p, per_profile=per_profile)
    memberships = [np.array(mb) for mb, _ in found]
    qs = np.array([q for _, q in found])
    best = int(np.argmax(qs))
    member_all = by_size(memberships[best], node_weight)
    member = member_all[:p]
    # Renumber so community ids run 0..C-1 over the ones that hold workers.
    held = sorted(set(member), key=lambda c: c)
    remap = {c: i for i, c in enumerate(held)}
    member = np.array([remap[c] for c in member])
    member_attr = np.array([remap.get(c, -1) for c in member_all[p:]])
    seeds_nmi = [nmi(memberships[i][:p], memberships[i + 1][:p]) for i in range(0, min(RUNS, 20) - 1, 2)]
    recur = float(np.mean([nmi(memberships[best][:p], mb[:p]) > 0.999 for mb in memberships]))
    null_started = time.time()
    with pool(g, p, per_profile) as ex:
        nulls = list(ex.map(_null, [SEED + i for i in range(NULLS)]))
    stamp(f"{ent.name}: {NULLS} nulls", null_started)
    null_q = np.array([n[0] for n in nulls])
    null_plain = np.array([n[3] for n in nulls])
    unweighted = louvain_runs(g, 10, f"{ent.name} unweighted", weighted=False, profiles=p, per_profile=per_profile)
    # Each attribute kind left out in turn (best of 10 seeds), against the main partition.
    robust = {}
    for kind in KINDS:
        h, _ = bipartite(ent, [k for k in KINDS if k != kind])
        runs = louvain_runs(h, 10, f"{ent.name} without {kind}", profiles=p, per_profile=per_profile)
        mb = np.array(max(runs, key=lambda r: r[1])[0])[:p]
        robust[f"without {KIND_NAMES[kind]}"] = {"nmi_with_main": round(float(nmi(member, mb)), 4),
                                                  "communities": int(len(set(mb))),
                                                  "Q": round(max(q for _, q in runs), 4)}
    plain = np.array(max(unweighted, key=lambda r: r[1])[0])[:p]
    plain_q = float(max(q for _, q in unweighted))
    robust["without weights"] = {"nmi_with_main": round(float(nmi(member, plain)), 4),
                                 "communities": int(len(set(plain))), "Q": round(max(q for _, q in unweighted), 4)}
    # Label tests, weighted by workers.
    t_started = time.time()
    jobs = []
    for i, label in enumerate(ent.labels):
        a, b = weighted_labels(ent.items, member, label)
        codes, _ = pd.factorize(b, sort=True)
        jobs.append((a.astype(np.int32), codes.astype(np.int32), SEED + i, SHUFFLES))
    with ProcessPoolExecutor(min(WORKERS, len(jobs))) as ex:
        tests = dict(zip(ent.labels, ex.map(_label_test, jobs)))
    stamp(f"{ent.name}: label tests", t_started)
    # The course's toolkit.
    proj = projection(g, p, per_profile)
    facts = course_facts(ent, g, attributes, proj, nulls, member_attr)
    facts["week4"] = week4_facts(g, proj, member_all, attributes, ent)
    # PageRank on the bipartite network, for the map's "colour by" option.
    pagerank = np.array(g.pagerank(weights="weight"))[:p]
    l_started = time.time()
    centres, spacing = layout(g, member, member_attr, p, w_profiles.astype(float))
    stamp(f"{ent.name}: layout", l_started)
    communities = []
    for c in range(int(member.max()) + 1):
        idx = np.flatnonzero(member == c)
        label, shares = name_community(ent.profiles, idx, ent.lookups, ent.describe)
        items = ent.items[np.isin(ent.items["profile"].values, idx)]
        top_employers = items.groupby("employer")["weight"].sum().sort_values(ascending=False, kind="stable").head(3)
        own = [attribute_name(ent, attributes[i]) for i in np.flatnonzero(member_attr == c)]
        communities.append({
            "id": c, "name": label, "profiles": int(len(idx)), "workers": int(w_profiles[idx].sum()),
            "x": round(float(centres[c, 0]), 2), "y": round(float(centres[c, 1]), 2),
            "r": round(float(spacing * np.sqrt(w_profiles[idx].sum())), 2),
            "h1b": int(ent.profiles["h1b"].values[idx].sum()), "perm": int(ent.profiles["perm"].values[idx].sum()),
            "fields": shares, "attribute_nodes": len(own), "attributes": own[:12],
            "top_employers": [[resolver().label(e), int(v)] for e, v in top_employers.items()],
        })
    result = {
        "entity": ent.name, "unit": ent.unit, "year": YEAR, "notes": ent.notes,
        "profiles": p, "attribute_nodes": len(attributes), "links": g.ecount(),
        "workers": int(w_profiles.sum()), "components": len(comps),
        "louvain": {"runs": RUNS, "communities_best": int(member.max() + 1),
                    "communities_median": int(np.median([len(set(mb[:p])) for mb in memberships])),
                    "Q_best": round(float(qs[best]), 4), "Q_mean": round(float(qs.mean()), 4),
                    "Q_sd": round(float(qs.std()), 4),
                    "nmi_between_seeds_median": round(float(np.median(seeds_nmi)), 4),
                    "best_partition_recurs": round(recur, 3)},
        # Two nulls, as section 3: the rewired networks with their filing counts
        # dealt back out, and the wiring alone (unweighted real against
        # unweighted rewired). Heavy links let a rewired network split around
        # them, so the weighted null can score above the real network.
        "null": {"draws": NULLS, "Q_mean": round(float(null_q.mean()), 4), "Q_sd": round(float(null_q.std()), 4),
                 "z": round(float((qs[best] - null_q.mean()) / null_q.std()), 2) if null_q.std() else None,
                 "at_or_above_real": int((null_q >= qs[best]).sum()),
                 "wiring_only": {"real": round(plain_q, 4), "null": round(float(null_plain.mean()), 4),
                                 "null_sd": round(float(null_plain.std()), 4),
                                 "z": round(float((plain_q - null_plain.mean()) / null_plain.std()), 2)
                                 if null_plain.std() else None,
                                 "at_or_above_real": int((null_plain >= plain_q).sum())}},
        "robustness": robust, "labels": tests, "facts": facts, "communities": communities, "spacing": spacing,
        "seconds": round(time.time() - started),
    }
    return result, member, pagerank


def page_file(ent, result, member, pagerank):
    """What the page draws: profile arrays, the lookups, the communities and the facts."""
    prof = ent.profiles
    codes = {col: sorted(set(prof[col].astype(str))) for col in ("occupation", "place", "sector")}
    index = {col: {c: i for i, c in enumerate(v)} for col, v in codes.items()}
    rank = np.argsort(np.argsort(-pagerank, kind="stable"), kind="stable")  # 0 = most central
    data = {
        "generated_by": "analysis/week04_entities.py", "entity": ent.name, "unit": ent.unit, "year": YEAR,
        "dots": ent.dots, "top": TOP, "spacing": round(result["spacing"], 6),
        "lookups": {
            "occupation": [[c, ent.lookups["occupation"].get(c, c)] for c in codes["occupation"]],
            "place": [[c, ent.lookups["place"].get(c, c)] for c in codes["place"]],
            "sector": [[c, ent.lookups["sector"].get(c, c)] for c in codes["sector"]],
            "level": ["Level I", "Level II", "Level III", "Level IV"],
        },
        "profiles": {
            "community": [int(c) for c in member],
            "occupation": [index["occupation"][str(v)] for v in prof["occupation"]],
            "place": [index["place"][str(v)] for v in prof["place"]],
            "sector": [index["sector"][str(v)] for v in prof["sector"]],
            "level": [int(v) for v in prof["level"]],
            "h1b": [int(v) for v in prof["h1b"]], "perm": [int(v) for v in prof["perm"]],
            "pagerank_rank": [int(r) for r in rank],
        },
        "communities": [{k: c[k] for k in ("id", "name", "profiles", "workers", "h1b", "perm", "top_employers", "x", "y", "r")}
                        | {"fields": {f: v["top"] for f, v in c["fields"].items()}} for c in result["communities"]],
        "summary": {k: result[k] for k in ("profiles", "attribute_nodes", "links", "workers", "louvain", "null",
                                           "robustness", "labels")},
        "facts": result["facts"],
        "notes": result["notes"],
    }
    if ent.dots == "items":
        items = ent.items.sort_values("weight", ascending=False, kind="stable")
        data["items"] = {"profile": [int(p) for p in items["profile"]], "workers": [int(w) for w in items["weight"]],
                         "name": [str(n) for n in items["label"]]}
    return data


def cross_check(worker, company):
    """Do a company's workers sit in the company's group? NMI between each
    worker's own community and its employer's community, weighted by workers."""
    items = worker["entity"].items
    emp_profile = dict(zip(company["entity"].items["employer"], company["entity"].items["profile"]))
    own = worker["member"][items["profile"].values]
    theirs = company["member"][items["employer"].map(emp_profile).values]
    reps = items["weight"].values
    a, b = np.repeat(own, reps), np.repeat(theirs, reps)
    return {"nmi": round(float(nmi(a, b)), 4), "ami": round(float(ami(a, b)), 4), "workers": int(len(a))}


def main():
    global RUNS, NULLS, SHUFFLES, OUT, PAGE
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--entity", choices=sorted(REGISTRY), nargs="+", default=list(REGISTRY))
    parser.add_argument("--quick", action="store_true",
                        help="a smoke test: few Louvain runs, nulls and shuffles (needs --out)")
    parser.add_argument("--out", type=Path, help="write the files here instead")
    args = parser.parse_args()
    if args.quick:
        RUNS, NULLS, SHUFFLES = 4, 2, 3
        if not args.out:
            raise SystemExit("--quick needs --out, so a smoke test never overwrites the real files")
    if args.out:
        args.out.mkdir(parents=True, exist_ok=True)
        OUT, PAGE = args.out / OUT.name, args.out
    check_disparity_p()
    started = time.time()
    out = json.loads(OUT.read_text()) if OUT.exists() else {}
    out["generated_by"] = "analysis/week04_entities.py"
    kept = {}
    for name in args.entity:
        ent = REGISTRY[name]()
        result, member, pagerank = run(ent)
        out[name] = result
        data = page_file(ent, result, member, pagerank)
        path = PAGE / f"entities_{name}.json"
        check(ROOT / "docs/weeks/week04/data" / path.name, data)
        path.write_text(json.dumps(data, separators=(",", ":")) + "\n")
        print(f"wrote {path} ({path.stat().st_size / 1e6:.1f} MB)", flush=True)
        kept[name] = {"entity": ent, "member": member}
    if {"workers", "companies"} <= set(kept):
        out["workers_vs_their_company"] = cross_check(kept["workers"], kept["companies"])
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    stamp("week04_entities", started)


if __name__ == "__main__":
    main()
