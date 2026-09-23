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

Inputs: certified H-1B filings of FY2025 (load("lca_fy2025"), status exactly
"Certified", so withdrawn ones are out) and every worksite of each
(load("worksites_fy2025")); from python analysis/week04_data.py --refs: Census
county -> metro (cbsa_2023.xlsx), towns -> county (cousub_gazetteer_2023.zip;
New England filings name a town where other states name a county, and
Connecticut's counties are 2023 planning regions) and city centres
(place_gazetteer_2023.zip; a metro sits at its first-named city). Companies are
keyed by week04_names.Resolver (tax number first), the same keys as section 3.
A filing counts at most its own requested positions in each metro, however
many addresses there it lists.

Checks
- Louvain, 50 runs. The page shows the partition found most often and
  reports how often; its modularity is compared with 50 degree-preserving
  rewirings of the company x metro graph, re-projected (each company and each
  metro keeps its number of partners; filing counts are dealt back out at
  random), one Louvain run each.
- NMI of the communities with Census regions and divisions, against 1,000
  shuffles of the labels.
- Infomap on the same projection, compared with Louvain and Census regions.
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
from collections import Counter
from itertools import combinations
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.metrics import normalized_mutual_info_score as nmi

import week04_names as names
from week04_schemas import check
from week04_data import RAW, load
from week04_staffing import infomap, louvain, resolver, rewire, tracked

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
# Census colours share no hue with the community colours above.
CENSUS_COLOURS = {"Northeast": "#2a9d8f", "Midwest": "#9b3d6e", "South": "#d4a017", "West": "#4a5a78"}
NEW_ENGLAND = {"CT", "MA", "ME", "NH", "RI", "VT"}
ARC_EMPLOYERS = 6  # companies on the one-employer map: those leading the most backbone links


def county_key(name):
    s = re.sub(r"[^A-Z ]", " ", name.upper().replace("SAINT ", "ST "))
    s = re.sub(r"\b(COUNTY|PARISH|BOROUGH|CENSUS AREA|MUNICIPALITY|CITY AND)\b", " ", s)
    return " ".join(s.split())


def town_key(name):
    """A New England town without its type: "BOSTON CITY", "Natick town" and
    "Barnstable Town city" become BOSTON, NATICK and BARNSTABLE."""
    s = re.sub(r"[^A-Z ]", " ", name.upper())
    words = s.split()
    while words[:2] in (["CITY", "OF"], ["TOWN", "OF"]):
        words = words[2:]
    while words and words[-1] in {"CITY", "TOWN", "TOWNSHIP", "PLANTATION", "GORE", "GRANT", "LOCATION",
                                  "PURCHASE", "VILLAGE"}:
        words.pop()
    return " ".join(words)


def gazetteer(name):
    gaz = pd.read_csv(RAW / name, sep="\t", dtype=str)
    gaz.columns = [c.strip() for c in gaz.columns]
    return gaz


def metros():
    """(state name, county key) -> CBSA code, (state, town) -> CBSA code for New
    England, and one row per metro."""
    table = pd.read_excel(RAW / "cbsa_2023.xlsx", engine="calamine", header=2, dtype=str).dropna(
        subset=["CBSA Code", "County/County Equivalent"])
    lookup = {(r["State Name"].upper(), county_key(r["County/County Equivalent"])): r["CBSA Code"]
              for _, r in table.iterrows()}
    by_fips = dict(zip(table["FIPS State Code"] + table["FIPS County Code"], table["CBSA Code"]))
    towns = gazetteer("cousub_gazetteer_2023.zip")
    towns = towns[towns["USPS"].isin(NEW_ENGLAND)].assign(key=lambda t: t["NAME"].map(town_key))
    # A town name used twice in one state could be either: left out.
    towns = towns[~towns.duplicated(["USPS", "key"], keep=False)]
    town_lookup = {(st, k): by_fips.get(g[:5]) for st, k, g in zip(towns["USPS"], towns["key"], towns["GEOID"])}
    return lookup, {k: v for k, v in town_lookup.items() if v}, gazetteer("cbsa_gazetteer_2023.zip").set_index("GEOID")


def first_state(title):
    """ "Dallas-Fort Worth-Arlington, TX Metro Area" -> TX; "…, DC-VA-MD-WV Metro Area" -> DC."""
    return title.split(", ")[1].split()[0].split("-")[0]


def first_city(title, places):
    """(lat, lon) of a metro's first-named city: "San Jose-Sunnyvale-Santa Clara, CA"
    is San Jose, California. None if the place list has no such city."""
    city, state = title.split(",")[0].split("-")[0].strip(), first_state(title)
    mine = places[(places["USPS"] == state) & places["NAME"].str.match(re.escape(city) + r"(?:[ \-(/]|$)")]
    if mine.empty:
        return None
    best = mine.loc[pd.to_numeric(mine["ALAND"]).idxmax()]
    return float(best["INTPTLAT"]), float(best["INTPTLONG"])


def worksite_metros(lookup, town_lookup):
    """One row per worksite of FY2025's certified H-1B filings, with its metro and employer."""
    lca = load(f"lca_fy{YEAR}")
    lca = lca[(lca["CASE_STATUS"] == "Certified") & (lca["VISA_CLASS"] == "H-1B")]
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
    # New England filings often name a town as the county: look the town up,
    # from the county field first, then the city.
    # The worksite file spells the state out ("MASSACHUSETTS"); the town list uses "MA".
    abbr = {n.upper(): a for a, n in STATE_NAMES.items()}
    town = sites["metro"].isna() & sites["state"].map(abbr).isin(NEW_ENGLAND)
    sites.loc[town, "metro"] = [
        town_lookup.get((st, town_key(c))) or town_lookup.get((st, town_key(ci)))
        for st, c, ci in zip(sites.loc[town, "state"].map(abbr), sites.loc[town, "WORKSITE_COUNTY"].fillna(""),
                             sites.loc[town, "WORKSITE_CITY"].fillna(""))]
    stats = {
        "worksite_rows": len(sites),
        "blank_county_rows": int(blank.sum()),
        "blank_county_resolved": int((blank & (sites["county"] != "")).sum()),
        "new_england_rows_by_town": int((town & sites["metro"].notna()).sum()),
        "rows_in_a_metro": int(sites["metro"].notna().sum()),
    }
    lca = lca.assign(total=pd.to_numeric(lca["TOTAL_WORKER_POSITIONS"], errors="coerce").fillna(1))
    sites = sites.merge(lca[["CASE_NUMBER", "employer", "total"]], on="CASE_NUMBER")
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
    lookup, town_lookup, gaz = metros()
    places = gazetteer("place_gazetteer_2023.zip")
    sites, lca, stats = worksite_metros(lookup, town_lookup)

    # A · rankings. One filing counts once per metro it names.
    per_case = sites.drop_duplicates(["CASE_NUMBER", "metro"])
    pairs = per_case.groupby(["employer", "metro"]).size().rename("filings").reset_index()
    filings = per_case.groupby("metro").size().sort_values(ascending=False)
    # A filing that lists three addresses for its 100 positions asks for 100, not 300.
    per_case_metro = sites.groupby(["CASE_NUMBER", "metro"]).agg(workers=("workers", "sum"), total=("total", "first"))
    positions = per_case_metro["workers"].clip(upper=per_case_metro["total"]).groupby("metro").sum()
    stats["positions_capped_share"] = round(float(1 - positions.sum() / sites["workers"].sum()), 4)
    employers = pairs.groupby("metro")["employer"].nunique()
    top = list(filings.head(TOP).index)
    stats |= {"metros": int(filings.size), "top_metros": TOP,
              "filings": int(per_case["CASE_NUMBER"].nunique()),
              "top_metros_filing_share": round(float(filings.head(TOP).sum() / filings.sum()), 4)}

    placed = lca[lca["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
    shortlist = list(placed["employer"].value_counts().head(SHORTLIST).index)

    cities, unplaced = [], []
    for m in top:
        mine = pairs[pairs["metro"] == m].sort_values("filings", ascending=False)
        title = gaz.loc[m, "NAME"]
        # The metro's first-named state and city: Washington, DC is DC, not Virginia.
        st = first_state(title)
        point = first_city(title, places)
        if point is None:
            unplaced.append(title)
            point = float(gaz.loc[m, "INTPTLAT"]), float(gaz.loc[m, "INTPTLONG"])
        cities.append({
            "id": m,
            "name": title.split(",")[0].split("-")[0],
            "state": st,
            "lon": round(point[1], 3),
            "lat": round(point[0], 3),
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
    stats["metros_at_cbsa_centre"] = unplaced  # no first-named city in the place list

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
    runs = [louvain(g, SEED + r)[0] for r in range(RUNS)]
    qs = np.array([nx.community.modularity(g, c, weight="weight") for c in runs])
    # Louvain does not always find the same partition on a graph this dense. The
    # page shows the one found most often (ties: the higher modularity), and every
    # number below is computed on that partition.
    found = Counter(frozenset(frozenset(c) for c in part) for part in runs)
    q_of = {k: nx.community.modularity(g, [set(c) for c in k], weight="weight") for k in found}
    modal = max(found, key=lambda k: (found[k], q_of[k]))
    best = [set(c) for c in sorted(modal, key=lambda c: (-len(c), min(c)))]
    member = {m: i for i, part in enumerate(best) for m in part}
    run_labels = [{m: i for i, part in enumerate(c) for m in part} for c in runs]
    seeds_nmi = [nmi([a[m] for m in top], [b[m] for m in top]) for a, b in combinations(run_labels, 2)]
    bip = nx.Graph()
    for e, m, f in pairs[pairs["metro"].isin(top)].itertuples(index=False):
        bip.add_edge(("F", e), ("C", m), weight=int(f))
    null_q = []
    for r in tracked("Rewired nulls", RUNS):
        h = rewire(bip, rng)
        rows = [(u[1], v[1], d["weight"]) if u[0] == "F" else (v[1], u[1], d["weight"])
                for u, v, d in h.edges(data=True)]
        hp = project(pd.DataFrame(rows, columns=["employer", "metro", "filings"]), top)
        null_q.append(louvain(hp, SEED + r)[1])
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

    # Infomap, the flow-based alternative: does a random walk split the metros at all?
    modules, codelength = infomap(g, SEED, trials=20)
    info_member = {m: i for i, part in enumerate(modules) for m in part}
    info = [info_member[m] for m in top]
    infomap_check = {
        "modules": len(modules), "sizes": sorted((len(x) for x in modules), reverse=True),
        "codelength_bits": round(float(codelength), 3),
        "nmi_with_louvain": round(float(nmi(comm, info)), 3),
        "nmi_census_region": round(float(nmi(info, [by_id[m]["census"] for m in top])), 3),
    }

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
        "long_leaders": Counter(e["top_employer"] for e in long).most_common(6),
        "long_median_top_share": round(float(np.median([e["top_share"] for e in long])), 3) if long else None,
        "long_links_one_company_half": [f'{by_id[e["a"]]["name"]}–{by_id[e["b"]]["name"]} ({e["top_employer"]})'
                                        for e in long if e["top_share"] >= 0.5],
    }
    # The one-employer map: the companies that lead the most backbone links, each
    # with the links it leads.
    leaders = [name for name, _ in Counter(e["top_employer"] for e in edges).most_common(ARC_EMPLOYERS)]
    arcs = {name: [[e["a"], e["b"]] for e in edges if e["top_employer"] == name] for name in leaders}

    q_modal = q_of[modal]
    null_model = {
        "Q": round(float(q_modal), 3), "Q_runs_mean": round(float(qs.mean()), 3),
        "partitions_found": len(found), "modal_runs": found[modal],
        "Q_null_mean": round(float(null_q.mean()), 3), "Q_null_std": round(float(null_q.std()), 4),
        "z": round(float((q_modal - null_q.mean()) / null_q.std()), 2),
        "nmi_seeds": round(float(np.median(seeds_nmi)), 3), "nmi_seeds_min": round(float(min(seeds_nmi)), 3),
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
        "infomap": infomap_check,
        "longhaul": {"staffing": [label(e) for e in shortlist], "edges": edges, "employer_arcs": arcs,
                     "arc_employers": leaders},
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")
    summary = {
        "generated_by": "analysis/week04_where.py", "year": YEAR, "coverage": stats,
        "ranking": rank_check,
        "backbone": {k: v for k, v in page["backbone"].items() if k != "graphs"},
        "null_model": null_model, "infomap": infomap_check, "communities": communities,
        "longhaul": longhaul_check,
        "shortlist": [label(e) for e in shortlist],
    }
    OUT.write_text(json.dumps(summary, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({k: summary[k] for k in ("coverage", "ranking", "null_model", "longhaul", "shortlist")},
                     indent=1, ensure_ascii=False))
    print("gc", gc_size, "edges", edges_kept, [(c["label"], c["metros"], c["regions"]) for c in communities])


if __name__ == "__main__":
    main()
