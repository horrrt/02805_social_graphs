"""Week 4, go deeper: do green-card countries cluster by world region?  Owner: Gyula.

Network: country -- country, projected from a bipartite country--employer graph
of certified PERM (green-card) filings. An edge joins two countries for every
employer that hired workers of both, weighted by the smaller of the two
countries' filing counts at that employer (the hiring volume the two countries
could actually have overlapped there, not just a shared name: an employer with
9,000 US-born filings and 10 Indian ones would otherwise look as connected to
India as one split evenly between them).

Questions
- Do PERM countries group by UN world region, by Week 3's migrant-stock
  communities (analysis/week03_communities.json), or by neither? The finding
  could go either way: a shared visa system and shared occupations (IT
  outsourcing, in particular) could pull countries together regardless of
  geography, or geography could still dominate hiring networks the way it
  dominates migration itself.
- How concentrated is green-card hiring by country, in PERM and (separately)
  in the H-1B lottery?
- Do the ten largest PERM employers hire from a narrow or a wide set of
  countries, and how much of that is India?

PRIVACY (hard rule): a worker's country of citizenship is personal data. Every
function that opens a PERM workbook or a lottery archive collapses it to counts
per (country, employer key) in the same function that reads it, and drops
every cell under MIN_CELL filings before anything else -- sorting, printing,
ranking, or writing JSON -- touches it. No row-level frame is returned,
printed, or written anywhere (not build/, not this script's JSON, not stdout);
an employer name appears in the output only beside a count that is itself
>= MIN_CELL. This script does not use analysis/week04_data.py's PERM loader,
because that loader's allow-list deliberately excludes citizenship; it reads
the raw workbooks (and the lottery's raw zips) itself, for this one column.

Companies are keyed by week04_staffing.resolver(), the same identity used for
the staffing network, so an employer here is the same company there. Country
names are PERM's own uppercase English spellings, matched to ISO 3166 alpha-3
codes and UN M49 regions (build/raw/iso3166_m49.csv) case-insensitively, then
by an explicit dict for the spellings the table misses (COTE D'IVOIRE vs its
UN name, RUSSIA vs "Russian Federation", SOUTH KOREA vs "Korea, Republic of",
and so on); genuinely unmatched names (mostly defunct states -- SOVIET UNION,
SERBIA AND MONTENEGRO -- with a handful of filings each) are reported, not
guessed at.

Checks
- Modularity of 100 weighted Louvain runs (week04_staffing.louvain) on the
  country projection's giant component, against 100 degree-preserving
  one-mode rewirings: nx.double_edge_swap on a copy of the giant component,
  filing weights dealt back onto the new edges at random, each null scored on
  its own giant component (a rewiring can split the graph). Q mean/sd vs
  null, z-score; communities' median size; NMI between Louvain seeds
  (week04_staffing.shuffled_nmi's null, and the plain NMI between two seeds).
- NMI (with a shuffled-label p-value) and AMI (chance-corrected) of the best
  partition against UN region and sub-region, and against Week 3's migrant-
  stock communities on the countries the two networks share.
- The largest countries in each of the best partition's largest communities,
  and the share of India's projection weight that stays inside India's own
  community.
- The effective number of countries (exp of Shannon entropy over each
  employer's suppressed cells) and India's share of that weight, for PERM's
  ten largest employers.

Output: analysis/week04_countries.json
"""

import io
import json
import random
import time
import zipfile
from collections import defaultdict
from pathlib import Path

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

from week04_staffing import RUNS, SEED, giant_of, louvain, resolver, shuffled_nmi, tracked
from week04_staffing import labels as louvain_labels

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
M49 = ROOT / "build" / "raw" / "iso3166_m49.csv"
WEEK3 = Path(__file__).with_name("week03_communities.json")

MIN_CELL = 10  # a (country, employer) cell must reach this many filings to be used at all
CERTIFIED = {"Certified", "Certified-Expired"}

PERM_DIR = Path("/Users/gyula/Documents/Projects/5y-planning-data/shared/data/visa")
PERM_YEARS = [2022, 2023, 2024]  # old-form workbooks only; the new form drops COUNTRY_OF_CITIZENSHIP
MAIN_YEAR = 2023
SECOND_YEAR = 2022

LOTTERY_RAW = ROOT / "build" / "raw" / "week04"
LOTTERY_ZIPS = {
    2022: ["TRK_13139_FY2022.zip"],
    2023: ["TRK_13139_FY2023.zip.001", "TRK_13139_FY2023.zip.002", "TRK_13139_FY2023.zip.003"],
    2024: ["TRK_13139_FY2024_single_reg.zip", "TRK_13139_FY2024_multi_reg.zip"],
}

# PERM's English spellings that build/raw/iso3166_m49.csv's own names miss,
# found by matching every certified PERM country name against the table
# case-insensitively and listing the misses (36 names, of which the two below
# are genuinely unmatched: defunct states with a handful of filings each).
EXPLICIT_ISO3 = {
    "BOLIVIA": "BOL",
    "BRUNEI": "BRN",
    "BURMA (MYANMAR)": "MMR",
    "CAPE VERDE": "CPV",
    "COTE D'IVOIRE": "CIV",
    "IVORY COAST": "CIV",
    "CURACAO": "CUW",
    "CZECH REPUBLIC": "CZE",
    "DEMOCRATIC REPUBLIC OF CONGO": "COD",
    "REPUBLIC OF CONGO": "COG",
    "IRAN": "IRN",
    "KOSOVO": "XKX",  # not in ISO 3166; the World Bank / EU's usual placeholder code
    "LAOS": "LAO",
    "MACAU": "MAC",
    "MACEDONIA": "MKD",
    "MICRONESIA": "FSM",
    "MOLDOVA": "MDA",
    "NETHERLANDS": "NLD",
    "PALESTINE": "PSE",
    "PALESTINIAN TERRITORIES": "PSE",
    "RUSSIA": "RUS",
    "SINT MAARTEN": "SXM",
    "SOUTH KOREA": "KOR",
    "ST KITTS AND NEVIS": "KNA",
    "ST LUCIA": "LCA",
    "ST VINCENT": "VCT",
    "SWAZILAND": "SWZ",
    "SYRIA": "SYR",
    "TAIWAN": "TWN",
    "TANZANIA": "TZA",
    "TURKEY": "TUR",
    "UNITED KINGDOM": "GBR",
    "VENEZUELA": "VEN",
    "VIETNAM": "VNM",
    # Left unmatched on purpose (reported, not guessed): SOVIET UNION,
    # SERBIA AND MONTENEGRO -- dissolved states with 1-5 filings across all
    # three years, no current ISO 3166 code.
}
# build/raw/iso3166_m49.csv leaves Kosovo out entirely and Taiwan's region
# blank (neither has UN M49 membership); both sit in the obvious place.
MANUAL_REGION = {
    "XKX": ("Europe", "Southern Europe"),
    "TWN": ("Asia", "Eastern Asia"),
}


def m49_tables():
    """(name.upper() -> alpha-3, alpha-3 -> (region, sub-region, readable name))."""
    df = pd.read_csv(M49, dtype=str)
    by_name = dict(zip(df["name"].str.upper(), df["alpha-3"]))
    region = {a3: (r or None, sr or None, name) for a3, r, sr, name in
              zip(df["alpha-3"], df["region"], df["sub-region"], df["name"])}
    for a3, (r, sr) in MANUAL_REGION.items():
        name = region.get(a3, (None, None, a3))[2]
        region[a3] = (r, sr, name)
    return by_name, region


def iso3_of(name, by_name):
    key = name.strip().upper()
    return by_name.get(key) or EXPLICIT_ISO3.get(key)


def perm_cells(year):
    """Certified PERM filings for one fiscal year, collapsed in this function to
    counts per (country of citizenship, employer key); cells under MIN_CELL are
    dropped before the row-level frame is discarded. Nothing this function
    returns lets a count under MIN_CELL be read out beside a country or an
    employer name."""
    path = PERM_DIR / f"PERM_Disclosure_Data_FY{year}_Q4.xlsx"
    header = pd.read_excel(path, engine="calamine", nrows=0).columns
    cols = ["CASE_STATUS", "EMPLOYER_NAME", "COUNTRY_OF_CITIZENSHIP"]
    has_fein = "EMPLOYER_FEIN" in header
    if has_fein:
        cols.append("EMPLOYER_FEIN")
    df = pd.read_excel(path, engine="calamine", usecols=cols, dtype=str)
    statuses = df["CASE_STATUS"].value_counts().to_dict()
    cert = df[df["CASE_STATUS"].isin(CERTIFIED)].copy()
    fein = cert["EMPLOYER_FEIN"].fillna("") if has_fein else pd.Series("", index=cert.index)
    name = cert["EMPLOYER_NAME"].fillna("")
    cert["employer"] = [resolver().employer(n, f) for n, f in zip(name, fein)]
    cert["country"] = cert["COUNTRY_OF_CITIZENSHIP"].fillna("").str.strip()
    total = len(cert)
    # Country alone (not crossed with an employer) is the ordinary published
    # breakdown of a filing population, not a re-identification risk; only the
    # (country, employer) cross-tabulation gets the MIN_CELL rule.
    country_totals = cert.groupby("country").size()
    cell_counts = cert.groupby(["country", "employer"]).size()
    kept = cell_counts[cell_counts >= MIN_CELL]
    result = {
        "statuses": statuses,
        "total_filings": total,
        "country_totals": country_totals,
        "cells": kept,
        "cells_before_suppression": int(len(cell_counts)),
        "cells_dropped": int(len(cell_counts) - len(kept)),
        "filings_dropped": int(cell_counts.sum() - kept.sum()),
    }
    del df, cert, cell_counts  # the row-level frame ends here
    return result


def lottery_country_totals(year):
    """H-1B lottery country-of-birth counts for one fiscal year (descriptive
    only, no employer join): rows whose status_type is FOIA-redacted ("(b)...")
    are dropped, then the frame is collapsed to counts per country before it is
    discarded."""
    parts = [LOTTERY_RAW / n for n in LOTTERY_ZIPS[year]]
    if parts[0].name.endswith(".001"):
        data = b"".join(p.read_bytes() for p in parts)
        archives = [zipfile.ZipFile(io.BytesIO(data))]
    else:
        archives = [zipfile.ZipFile(p) for p in parts]
    frames = []
    for archive in archives:
        (member,) = [m for m in archive.namelist() if m.lower().endswith(".csv")]
        with archive.open(member) as fh:
            frames.append(pd.read_csv(fh, dtype=str, usecols=["country_of_birth", "status_type"]))
    df = pd.concat(frames, ignore_index=True)
    redacted = df["status_type"].str.contains(r"\(b\)", regex=True, na=False)
    kept = df[~redacted]
    total = len(kept)
    country_totals = kept["country_of_birth"].str.strip().value_counts()
    del df, kept
    return total, int(redacted.sum()), country_totals


def top_shares(totals, n=10):
    total = int(totals.sum())
    top = totals.sort_values(ascending=False).head(n)
    return {"total": total, "countries": int((totals > 0).sum()),
            "top": [{"country": c, "filings": int(v), "share": round(float(v / total), 4)}
                    for c, v in top.items()]}


def bipartite_graph(cells):
    g = nx.Graph()
    for (country, employer), w in cells.items():
        g.add_edge(("K", country), ("E", employer), weight=int(w))
    return g


def project_countries(cells):
    """Countries sharing an employer, weighted by shared hiring volume: for
    each employer, every pair of countries with a suppressed cell there adds
    min(count_a, count_b) to their edge (see the module docstring)."""
    by_employer = defaultdict(list)
    for (country, employer), w in cells.items():
        by_employer[employer].append((country, int(w)))
    g = nx.Graph()
    g.add_nodes_from(country for lst in by_employer.values() for country, _ in lst)
    for lst in by_employer.values():
        for i in range(len(lst)):
            c1, w1 = lst[i]
            for c2, w2 in lst[i + 1:]:
                weight = min(w1, w2)
                if g.has_edge(c1, c2):
                    g[c1][c2]["weight"] += weight
                else:
                    g.add_edge(c1, c2, weight=weight)
    return g


def rewire_onemode(g, rng):
    """Degree-preserving one-mode rewiring: nx.double_edge_swap on a copy, then
    the real filing weights dealt back onto the new edges at random."""
    h = g.copy()
    weights = [d["weight"] for *_, d in g.edges(data=True)]
    m = h.number_of_edges()
    try:
        nx.double_edge_swap(h, nswap=10 * m, max_tries=100 * m, seed=rng)
    except nx.NetworkXAlgorithmError:
        pass  # ran out of tries partway through; keep the swaps that succeeded
    shuffled = weights.copy()
    rng.shuffle(shuffled)
    for (u, v), w in zip(h.edges(), shuffled):
        h[u][v]["weight"] = w
    return h


def compare(real, null):
    return {"real": round(float(real.mean()), 4), "real_sd": round(float(real.std()), 4),
            "null": round(float(null.mean()), 4), "null_sd": round(float(null.std()), 4),
            "z": round(float((real.mean() - null.mean()) / null.std()), 2),
            "null_runs_at_or_above_real": int((null >= real.mean()).sum())}


def entropy_stats(counts):
    """Effective number of countries (exp of Shannon entropy) and India's share,
    over one employer's suppressed cells."""
    total = counts.sum()
    p = counts / total
    h = float(-(p * np.log(p)).sum())
    india = float(counts.get("INDIA", 0) / total)
    return {"countries": int(len(counts)), "filings": int(total),
            "effective_countries": round(float(np.exp(h)), 2), "india_share": round(india, 4)}


def main():
    started = time.time()
    rng = random.Random(SEED)
    by_name, region_of = m49_tables()
    out = {"generated_by": "analysis/week04_countries.py", "min_cell": MIN_CELL,
           "runs": RUNS, "seed": SEED, "main_year": MAIN_YEAR, "second_year": SECOND_YEAR}

    # Section 1 -- descriptive: PERM per year, and the lottery's country shares.
    perm = {y: perm_cells(y) for y in PERM_YEARS}
    out["perm"] = {}
    unmatched = defaultdict(int)
    blank_citizenship = 0
    for y, p in perm.items():
        for country, count in p["country_totals"].items():
            if country == "":
                blank_citizenship += int(count)
            elif not iso3_of(country, by_name):
                unmatched[country] += int(count)
        out["perm"][y] = {
            "case_statuses": p["statuses"],
            "certified_filings": p["total_filings"],
            "descriptive": top_shares(p["country_totals"]),
            "cells_before_suppression": p["cells_before_suppression"],
            "cells_dropped_under_min": p["cells_dropped"],
            "cells_dropped_share": round(p["cells_dropped"] / p["cells_before_suppression"], 4),
            "filings_dropped_share": round(p["filings_dropped"] / p["total_filings"], 4),
        }
        print(f"PERM FY{y}: {p['total_filings']:,} certified, "
              f"{out['perm'][y]['descriptive']['countries']} countries, "
              f"{p['cells_dropped']:,}/{p['cells_before_suppression']:,} cells dropped under {MIN_CELL}",
              flush=True)
    out["unmatched_country_names"] = dict(sorted(unmatched.items(), key=lambda kv: -kv[1]))
    out["blank_citizenship_filings"] = blank_citizenship

    out["lottery"] = {}
    for y in LOTTERY_ZIPS:
        total, redacted, totals = lottery_country_totals(y)
        out["lottery"][y] = {"registrations": total, "redacted_rows_dropped": redacted,
                              "descriptive": top_shares(totals)}
        print(f"Lottery FY{y}: {total:,} registrations, top country "
              f"{out['lottery'][y]['descriptive']['top'][0]['country']} "
              f"({out['lottery'][y]['descriptive']['top'][0]['share']:.0%})", flush=True)

    # Section 2 -- network, from the suppressed cells only.
    graphs = {y: project_countries(perm[y]["cells"]) for y in (MAIN_YEAR, SECOND_YEAR)}
    out["network"] = {}
    for y, g in graphs.items():
        bp = bipartite_graph(perm[y]["cells"])
        out["network"][y] = {
            "bipartite_nodes": bp.number_of_nodes(), "bipartite_edges": bp.number_of_edges(),
            "country_nodes": g.number_of_nodes(), "country_edges": g.number_of_edges(),
        }

    # Section 3 -- Louvain on the main year's giant component, against the null.
    g = graphs[MAIN_YEAR]
    giant = giant_of(g)
    out["network"][MAIN_YEAR]["giant_nodes"] = giant.number_of_nodes()
    out["network"][MAIN_YEAR]["giant_edges"] = giant.number_of_edges()
    out["network"][MAIN_YEAR]["giant_weight_share"] = round(giant.size("weight") / g.size("weight"), 4)

    runs = [louvain(giant, SEED + i) for i in tracked("Louvain, country projection", RUNS)]
    qs = np.array([q for _, q in runs])
    best_parts = max(runs, key=lambda r: r[1])[0]
    member = louvain_labels(best_parts)
    run_labels = [louvain_labels(p) for p, _ in runs[:20]]
    nodes = list(giant)
    over = lambda a, b: nmi([a[n] for n in nodes], [b[n] for n in nodes])
    seed_pairs = [over(run_labels[i], run_labels[i + 1]) for i in range(0, len(run_labels) - 1, 2)]

    null_qs, pieces, null_share = [], [], []
    for i in tracked("Nulls, one-mode rewiring", RUNS):
        h = rewire_onemode(giant, rng)
        pieces.append(nx.number_connected_components(h))
        hg = giant_of(h)
        null_share.append(hg.number_of_nodes() / h.number_of_nodes())
        null_qs.append(louvain(hg, SEED + i)[1])
    null_qs = np.array(null_qs)

    out["modularity"] = {
        "communities_median": int(np.median([len(p) for p, _ in runs])),
        "nmi_between_seeds_median": round(float(np.median(seed_pairs)), 3),
        "rewired_components_median": int(np.median(pieces)),
        "rewired_giant_node_share_median": round(float(np.median(null_share)), 4),
        "weighted_vs_rewired": compare(qs, null_qs),
    }

    # Section 4 -- labels: UN region/sub-region, and Week 3's migrant communities.
    labelled = {n: iso3_of(n, by_name) for n in giant if iso3_of(n, by_name)}
    coded = [n for n in giant if n in labelled]
    region = [region_of.get(labelled[n], (None, None, None))[0] for n in coded]
    subregion = [region_of.get(labelled[n], (None, None, None))[1] for n in coded]
    comm = [member[n] for n in coded]
    have_region = [i for i, r in enumerate(region) if r]
    reg_obs, reg_p = shuffled_nmi([comm[i] for i in have_region], [region[i] for i in have_region], rng)
    sub_obs, sub_p = shuffled_nmi([comm[i] for i in have_region], [subregion[i] for i in have_region], rng)

    week3 = json.loads(WEEK3.read_text())
    migrant_of = {code: i for i, c in enumerate(week3["communities"]) for code in c["members"]}
    shared = [n for n in coded if labelled[n] in migrant_of]
    mig_obs, mig_p = shuffled_nmi([member[n] for n in shared], [migrant_of[labelled[n]] for n in shared], rng)

    india_node = next((n for n in giant if n == "INDIA"), None)
    india_share = None
    if india_node is not None:
        india_total = sum(w for *_, w in giant.edges(india_node, data="weight"))
        india_inside = sum(w for u, v, w in giant.edges(india_node, data="weight") if member[u] == member[v])
        india_share = round(float(india_inside / india_total), 4) if india_total else None

    strength = dict(giant.degree(weight="weight"))
    communities = []
    for part in sorted(best_parts, key=lambda p: -sum(strength[n] for n in p))[:6]:
        ranked = sorted(part, key=lambda n: (-strength[n], n))
        names = [region_of.get(labelled.get(n), (None, None, n))[2] if n in labelled else n.title()
                 for n in ranked[:8]]
        communities.append({"countries": len(part),
                             "weight": int(sum(strength[n] for n in part)),
                             "top_countries": names})

    out["labels"] = {
        "countries_matched_to_a_region": len(coded),
        "countries_with_region": len(have_region),
        "nmi_region": round(reg_obs, 3), "p_region": round(reg_p, 4),
        "nmi_subregion": round(sub_obs, 3), "p_subregion": round(sub_p, 4),
        "ami_region": round(float(ami([comm[i] for i in have_region], [region[i] for i in have_region])), 3),
        "ami_subregion": round(float(ami([comm[i] for i in have_region], [subregion[i] for i in have_region])), 3),
        "week3_shared_countries": len(shared),
        "nmi_week3_migrant_communities": round(mig_obs, 3), "p_week3": round(mig_p, 4),
        "ami_week3_migrant_communities": round(float(
            ami([member[n] for n in shared], [migrant_of[labelled[n]] for n in shared])), 3),
        "india_share_of_weight_inside_its_community": india_share,
        "largest_communities": communities,
    }

    # Section 5 -- diversity of the ten largest PERM employers.
    cells = perm[MAIN_YEAR]["cells"]
    by_employer_total = cells.groupby(level="employer").sum().sort_values(ascending=False)
    top10 = []
    for employer in by_employer_total.head(10).index:
        counts = cells.xs(employer, level="employer")
        stats = entropy_stats(counts)
        stats["employer"] = resolver().label(employer)
        top10.append(stats)
    out["diversity"] = {"top_employers": top10}

    out["seconds"] = round(time.time() - started)
    OUT.write_text(json.dumps(out, indent=1, default=str) + "\n")
    print(json.dumps({k: v for k, v in out.items() if k not in ("perm", "lottery")}, indent=1, default=str))


if __name__ == "__main__":
    main()
