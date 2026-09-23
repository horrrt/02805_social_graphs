"""Week 4, section 1: Where does the hiring happen?  Owner: Àngela.

Network: companies x metro areas, projected onto metros. Two metros are
linked when the same companies file in both; the link weighs, summed over
those companies, the smaller of the company's filing counts in the two metros.
Filings, not positions, weigh the links: one staffing firm asks for 40
therapists on every filing, which would make positions measure its paperwork.

Questions
- Which cities hire the most?
- Once the small links go, what is left of the map?
- Is it one national job market or several regional ones?
- Do the same employers tie distant cities together?

Inputs: certified H-1B filings of FY2025 (load("lca_fy2025")) and every
worksite of each (load("worksites_fy2025")); Census county -> metro
(cbsa_2023.xlsx) and metro centres (cbsa_gazetteer_2023.zip), both from
python analysis/week04_data.py --refs. Companies are keyed by
week04_names.Resolver (tax number first), the same keys as section 3.

Checks
- Louvain, 50 runs, against 50 degree-preserving rewirings of the
  company x metro graph, re-projected (each company and each metro keeps its
  number of partners).
- NMI of the communities with Census regions and divisions, against 1,000
  shuffles of the labels.
- The disparity filter (Serrano, Boguna and Vespignani 2009) at five alphas.
  netbone implements it but pins networkx 2.8 and numpy 1.26, so the ten-line
  formula lives here and check_disparity() tests it on the course's own
  worked example.

Outputs: analysis/week04_where.json (every number, with the checks) and
docs/assets/data/week04_place.json (the shape week04-place.js draws).
"""

import json
import math
import random
import re
from itertools import combinations
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_names as names
from week04_data import RAW, load
from week04_staffing import resolver, rewire, tracked

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
PAGE = ROOT / "docs/assets/data/week04_place.json"
YEAR = 2025
TOP = 40  # metros on the page, by filings
ALPHAS = [0.05, 0.1, 0.2, 0.3, 0.5]
DEFAULT_ALPHA = 0.2
RUNS = 50
SHORTLIST = 5  # largest placing firms, as in section 3
LONG_KM = 1500
SEED = 2805

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois",
    "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
    "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon",
    "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
    "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia",
    "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}
# Census regions and divisions by state.
CENSUS = {
    "Northeast": {
        "New England": ["CT", "ME", "MA", "NH", "RI", "VT"],
        "Middle Atlantic": ["NJ", "NY", "PA"],
    },
    "Midwest": {
        "East North Central": ["IL", "IN", "MI", "OH", "WI"],
        "West North Central": ["IA", "KS", "MN", "MO", "NE", "ND", "SD"],
    },
    "South": {
        "South Atlantic": ["DE", "DC", "FL", "GA", "MD", "NC", "SC", "VA", "WV"],
        "East South Central": ["AL", "KY", "MS", "TN"],
        "West South Central": ["AR", "LA", "OK", "TX"],
    },
    "West": {
        "Mountain": ["AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY"],
        "Pacific": ["AK", "CA", "HI", "OR", "WA"],
    },
}
REGION = {s: r for r, divs in CENSUS.items() for states in divs.values() for s in states}
DIVISION = {s: d for divs in CENSUS.values() for d, states in divs.items() for s in states}
COLOURS = ["#f2820c", "#1f8fd6", "#6b4fbb", "#2a9d8f", "#c45c26", "#d4a017", "#7a8fac", "#9b3d6e"]
CENSUS_COLOURS = {"Northeast": "#f2820c", "Midwest": "#c45c26", "South": "#6b4fbb", "West": "#1f8fd6"}


def county_key(name):
    s = re.sub(r"[^A-Z ]", " ", name.upper().replace("SAINT ", "ST "))
    s = re.sub(r"\b(COUNTY|PARISH|BOROUGH|CENSUS AREA|MUNICIPALITY|CITY AND)\b", " ", s)
    return " ".join(s.split())


def metros():
    """(state name, county key) -> CBSA code, and one row per metro with its centre."""
    table = pd.read_excel(RAW / "cbsa_2023.xlsx", engine="calamine", header=2, dtype=str).dropna(
        subset=["CBSA Code", "County/County Equivalent"])
    lookup = {(r["State Name"].upper(), county_key(r["County/County Equivalent"])): r["CBSA Code"]
              for _, r in table.iterrows()}
    gaz = pd.read_csv(RAW / "cbsa_gazetteer_2023.zip", sep="\t", dtype=str)
    gaz.columns = [c.strip() for c in gaz.columns]
    return lookup, gaz.set_index("GEOID")


def worksite_metros(lookup):
    """One row per worksite of FY2025's certified H-1B filings, with its metro and employer."""
    lca = load(f"lca_fy{YEAR}")
    lca = lca[lca["CASE_STATUS"].str.startswith("Certified") & (lca["VISA_CLASS"] == "H-1B")]
    lca = lca.assign(employer=[resolver().employer(n, f) for n, f in zip(lca["EMPLOYER_NAME"], lca["EMPLOYER_FEIN"])])
    sites = load(f"worksites_fy{YEAR}")
    sites = sites[sites["CASE_NUMBER"].isin(lca["CASE_NUMBER"])].copy()
    sites["workers"] = pd.to_numeric(sites["WORKSITE_WORKERS"], errors="coerce").fillna(1)
    sites["state"] = sites["WORKSITE_STATE"].str.upper().str.strip()
    sites["county"] = sites["WORKSITE_COUNTY"].map(county_key)
    # A blank county borrows the county most often recorded for the same city.
    known = sites[sites["county"] != ""]
    usual = known.groupby([known["WORKSITE_CITY"].str.upper(), "state"])["county"].agg(
        lambda s: s.value_counts().index[0])
    blank = sites["county"] == ""
    sites.loc[blank, "county"] = [usual.get((c.upper(), s), "") for c, s in
                                  zip(sites.loc[blank, "WORKSITE_CITY"], sites.loc[blank, "state"])]
    sites["metro"] = [lookup.get(k) for k in zip(sites["state"], sites["county"])]
    stats = {
        "worksite_rows": len(sites),
        "blank_county_rows": int(blank.sum()),
        "blank_county_resolved": int((blank & (sites["county"] != "")).sum()),
        "rows_in_a_metro": int(sites["metro"].notna().sum()),
    }
    sites = sites.merge(lca[["CASE_NUMBER", "employer"]], on="CASE_NUMBER")
    return sites.dropna(subset=["metro"]), lca, stats


def project(pairs, keep):
    """Metro -- metro graph: for each company in both, the smaller filing count."""
    g = nx.Graph()
    g.add_nodes_from(keep)
    for _, grp in pairs[pairs["metro"].isin(keep)].groupby("employer"):
        counts = dict(zip(grp["metro"], grp["filings"]))
        for a, b in combinations(sorted(counts), 2):
            w = min(counts[a], counts[b])
            if g.has_edge(a, b):
                g[a][b]["weight"] += w
            else:
                g.add_edge(a, b, weight=w)
    return g


def disparity(g):
    """p-value of every edge under the disparity filter: the smaller of the two
    endpoints' (1 - w/s)^(k-1). An endpoint with one link cannot judge it."""
    strength = dict(g.degree(weight="weight"))
    p = {}
    for u, v, w in g.edges(data="weight"):
        tests = [(1 - w / strength[n]) ** (g.degree(n) - 1) for n in (u, v) if g.degree(n) > 1]
        p[(u, v)] = min(tests) if tests else 0.0
    return p


def check_disparity():
    """The course page's example: a weight-2 link, strength 11 over ten links, p = 0.16."""
    g = nx.star_graph(10)
    for i, (u, v) in enumerate(g.edges()):
        g[u][v]["weight"] = 2 if i == 0 else 1
    p = disparity(g)
    assert abs(p[(0, 1)] - (1 - 2 / 11) ** 9) < 1e-12 and round(p[(0, 1)], 2) == 0.16


def haversine(a, b):
    (la1, lo1), (la2, lo2) = [(math.radians(x), math.radians(y)) for x, y in (a, b)]
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def shuffled_nmi(a, b, rng, times=1000):
    observed = nmi(a, b)
    b = list(b)
    beats = 0
    for _ in range(times):
        rng.shuffle(b)
        beats += nmi(a, b) >= observed
    return observed, (beats + 1) / (times + 1)


def label(key):
    """A company's display name, from the same resolver as section 3."""
    return resolver().label(key)


def main():
    check_disparity()
    rng = random.Random(SEED)
    lookup, gaz = metros()
    sites, lca, stats = worksite_metros(lookup)

    # A · rankings. One filing counts once per metro it names.
    per_case = sites.drop_duplicates(["CASE_NUMBER", "metro"])
    pairs = per_case.groupby(["employer", "metro"]).size().rename("filings").reset_index()
    filings = per_case.groupby("metro").size().sort_values(ascending=False)
    positions = sites.groupby("metro")["workers"].sum()
    employers = pairs.groupby("metro")["employer"].nunique()
    top = list(filings.head(TOP).index)
    stats |= {"metros": int(filings.size), "top_metros": TOP,
              "top_metros_filing_share": round(float(filings.head(TOP).sum() / filings.sum()), 4)}

    placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    shortlist = list(placed["employer"].value_counts().head(SHORTLIST).index)

    state_of = per_case.groupby("metro")["state"].agg(lambda s: s.value_counts().index[0])
    abbr = {n.upper(): a for a, n in STATE_NAMES.items()}
    cities = []
    for m in top:
        mine = pairs[pairs["metro"] == m].sort_values("filings", ascending=False)
        st = abbr[state_of[m]]
        title = gaz.loc[m, "NAME"]
        cities.append({
            "id": m,
            "name": title.split(",")[0].split("-")[0],
            "state": st,
            "lon": round(float(gaz.loc[m, "INTPTLONG"]), 3),
            "lat": round(float(gaz.loc[m, "INTPTLAT"]), 3),
            "positions": int(positions[m]),
            "filings": int(filings[m]),
            "employers": int(employers[m]),
            "top_employer": label(mine["employer"].iloc[0]),
            "top_share": round(float(mine["filings"].iloc[0] / filings[m]), 3),
            "census": REGION[st],
            "division": DIVISION[st],
            "metro_title": title,
        })
    by_id = {c["id"]: c for c in cities}

    # The claim in the section's lead: the headcount leader is not the employer-count leader.
    rank_pos = sorted(top, key=lambda m: -positions[m])
    rank_emp = sorted(top, key=lambda m: -employers[m])
    rank_check = {
        "top_by_positions": by_id[rank_pos[0]]["name"],
        "top_by_employers": by_id[rank_emp[0]]["name"],
        "top5_by_positions": [by_id[m]["name"] for m in rank_pos[:5]],
        "top5_by_employers": [by_id[m]["name"] for m in rank_emp[:5]],
    }

    # B · backbone.
    g = project(pairs, top)
    p = disparity(g)
    graphs, gc_size, edges_kept = {}, [], []
    for alpha in ALPHAS:
        kept = [(u, v, g[u][v]["weight"]) for (u, v), pv in p.items() if pv < alpha]
        h = nx.Graph()
        h.add_weighted_edges_from(kept)
        giant = max(nx.connected_components(h), key=len) if h.number_of_edges() else set()
        gc_size.append(len(giant))
        edges_kept.append(len(kept))
        graphs[str(alpha)] = {
            "nodes": sorted(giant, key=lambda m: -filings[m]),
            "edges": [[u, v, int(w)] for u, v, w in kept if u in giant and v in giant],
        }
    drops = [gc_size[i + 1] - gc_size[i] for i in range(len(ALPHAS) - 1)]
    i = int(np.argmax(drops))
    snap = ALPHAS[i]
    snap_note = (f"Below α = {ALPHAS[i + 1]} the giant component drops from {gc_size[i + 1]} "
                 f"metros to {gc_size[i]}; at α = {snap} it keeps {edges_kept[i]} links.")
    # Which metros the snap cuts loose, largest first: the brief asks what breaks.
    lost = sorted(set(graphs[str(ALPHAS[i + 1])]["nodes"]) - set(graphs[str(snap)]["nodes"]),
                  key=lambda m: -filings[m])
    snap_dropped = [by_id[m]["name"] for m in lost]
    if snap_dropped:
        head = snap_dropped[:3]
        more = len(snap_dropped) - len(head)
        snap_note += (f" The largest to fall off: {', '.join(head)}"
                      + (f" and {more} more." if more else "."))

    # C · communities against Census labels, and against re-projected rewirings.
    runs = [nx.community.louvain_communities(g, weight="weight", seed=SEED + r) for r in range(RUNS)]
    qs = np.array([nx.community.modularity(g, c, weight="weight") for c in runs])
    best = runs[int(np.argmax(qs))]
    member = {m: i for i, part in enumerate(best) for m in part}
    run_labels = [{m: i for i, part in enumerate(c) for m in part} for c in runs[:20]]
    seeds_nmi = [nmi([a[m] for m in top], [b[m] for m in top]) for a, b in zip(run_labels, run_labels[1:])]
    bip = nx.Graph()
    for e, m, f in pairs[pairs["metro"].isin(top)].itertuples(index=False):
        bip.add_edge(("F", e), ("C", m), weight=int(f))
    null_q = []
    for r in tracked("Rewired nulls", RUNS):
        h = rewire(bip, rng)
        rows = [(u[1], v[1], d["weight"]) if u[0] == "F" else (v[1], u[1], d["weight"])
                for u, v, d in h.edges(data=True)]
        hp = project(pd.DataFrame(rows, columns=["employer", "metro", "filings"]), top)
        null_q.append(nx.community.modularity(
            hp, nx.community.louvain_communities(hp, weight="weight", seed=SEED + r), weight="weight"))
    null_q = np.array(null_q)
    comm = [member[m] for m in top]
    region_nmi, region_p = shuffled_nmi(comm, [by_id[m]["census"] for m in top], rng)
    division_nmi, division_p = shuffled_nmi(comm, [by_id[m]["division"] for m in top], rng)
    order = sorted(range(len(best)), key=lambda k: -sum(filings[m] for m in best[k]))
    renumber = {old: new for new, old in enumerate(order)}
    communities = []
    for old in order:
        biggest = sorted(best[old], key=lambda m: -filings[m])
        new = renumber[old]
        communities.append({
            "id": new,
            "label": "–".join(by_id[m]["name"] for m in biggest[:2]),
            "colour": COLOURS[new] if new < len(COLOURS) else "#7a8fac",
            "metros": len(biggest),
            "regions": {k: int(v) for k, v in pd.Series([by_id[m]["census"] for m in biggest]).value_counts().items()},
        })
    for c in cities:
        c["community"] = renumber[member[c["id"]]]

    # D · long links on the backbone, and whose they are.
    kept = [(u, v) for (u, v), pv in p.items() if pv < DEFAULT_ALPHA]
    grouped = pairs[pairs["metro"].isin(top)].set_index(["employer", "metro"])["filings"]
    per_employer = {e: grp.droplevel(0).to_dict() for e, grp in grouped.groupby(level=0)}
    edges = []
    for u, v in kept:
        share = {e: min(f[u], f[v]) for e, f in per_employer.items() if u in f and v in f}
        who = max(share, key=share.get)
        edges.append({
            "a": u, "b": v,
            "distance_km": round(haversine((by_id[u]["lat"], by_id[u]["lon"]),
                                           (by_id[v]["lat"], by_id[v]["lon"]))),
            "weight": int(g[u][v]["weight"]),
            "top_employer": label(who),
            "top_share": round(share[who] / g[u][v]["weight"], 3),
            "staffing": who in shortlist,
        })
    long = [e for e in edges if e["distance_km"] >= LONG_KM]
    short = [e for e in edges if e["distance_km"] < LONG_KM]
    longhaul_check = {
        "backbone_links": len(edges), "threshold_km": LONG_KM,
        "long_links": len(long), "long_led_by_shortlist": sum(e["staffing"] for e in long),
        "short_links": len(short), "short_led_by_shortlist": sum(e["staffing"] for e in short),
    }
    arcs = {}
    for e in shortlist:
        f = per_employer.get(e, {})
        both = sorted(combinations(sorted(f), 2), key=lambda ab: -min(f[ab[0]], f[ab[1]]))
        arcs[label(e)] = [list(ab) for ab in both[:6]]

    null_model = {
        "Q": round(float(qs.mean()), 3), "Q_sd": round(float(qs.std()), 4),
        "Q_null_mean": round(float(null_q.mean()), 3), "Q_null_std": round(float(null_q.std()), 4),
        "z": round(float((qs.mean() - null_q.mean()) / null_q.std()), 2),
        "nmi_seeds": round(float(np.median(seeds_nmi)), 3),
        "nmi_census_region": round(region_nmi, 3), "p_region": round(region_p, 4),
        "nmi_census_division": round(division_nmi, 3), "p_division": round(division_p, 4),
        "seeds": RUNS, "communities": len(best),
    }
    page = {
        "meta": {
            "status": "live",
            "note": f"Certified H-1B filings, FY{YEAR}; the {TOP} metro areas with the most filings. "
                    "Metros are linked by the companies that file in both; weights count filings.",
            "scope": f"Certified H-1B · FY{YEAR} · top {TOP} metro areas by filings",
            "script": "analysis/week04_where.py",
        },
        "cities": cities,
        "communities": communities,
        "census_colours": CENSUS_COLOURS,
        "backbone": {"alphas": ALPHAS, "default_alpha": DEFAULT_ALPHA, "gc_size": gc_size,
                     "edges_kept": edges_kept, "snap_alpha": snap, "snap_note": snap_note,
                     "snap_dropped": snap_dropped, "graphs": graphs},
        "null_model": null_model,
        "longhaul": {"staffing": [label(e) for e in shortlist], "edges": edges, "employer_arcs": arcs},
    }
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")
    summary = {
        "generated_by": "analysis/week04_where.py", "year": YEAR, "coverage": stats,
        "ranking": rank_check,
        "backbone": {k: v for k, v in page["backbone"].items() if k != "graphs"},
        "null_model": null_model, "communities": communities, "longhaul": longhaul_check,
        "shortlist": [label(e) for e in shortlist],
    }
    OUT.write_text(json.dumps(summary, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({k: summary[k] for k in ("coverage", "ranking", "null_model", "longhaul", "shortlist")},
                     indent=1, ensure_ascii=False))
    print("gc", gc_size, "edges", edges_kept, [(c["label"], c["metros"], c["regions"]) for c in communities])


if __name__ == "__main__":
    main()
