"""Week 4, section 2 support: how alike are two occupations' jobs?

A second measure of closeness between occupations: O*NET's ratings of what
each job involves. It never looks at which companies file for an occupation,
so it stays independent of section 2's co-hiring links; it only uses how many
filings name each detailed O*NET occupation.

Method
- O*NET 31.0 ratings on the Importance scale (1 to 5) for 35 skills (the 10
  essential and 25 transferable ones), 33 knowledge areas and 41 generalised
  work activities: 109 descriptors per detailed occupation (15-1299.08).
- Ratings O*NET flags "Recommend Suppress" (too few or too varied answers) are
  dropped; a descriptor missing after that takes the mean over occupations.
- O*NET 31.0 has no ratings for 13-2051 (financial and investment analysts)
  or 13-2054 (financial risk specialists). They come from O*NET 25.0, the last
  release on the 2010 taxonomy, through O*NET's 2010-to-2019 crosswalk:
  Financial Analysts (13-2051.00, rated 2016) and Risk Management Specialists
  (13-2099.02, rated 2018). 25.0 and 31.0 use the same 109 descriptor IDs, and
  ratings with the same date are identical in both releases.
- Each descriptor is z-scored across every rated detailed occupation (not only
  the H-1B ones, so the scale does not move with the filing mix). Without
  that, all-positive rating vectors put nearly every pair near 1 (the spread
  is in the JSON as similarity_uncentred).
- Profile similarity is the cosine of two centred profiles, from -1 to 1.
- The filings use 2018 SOC codes (15-1299), and most also name the detailed
  O*NET occupation (15-1299.08). A code's similarity to another is the
  expected similarity of a random filing in each: W S W^T, where S is the
  profile similarity and W holds each code's share of filings per profile.
  A filing on a rated detailed code of its own SOC code counts there; the
  rest (".00" of an "All Other" code, bare or malformed codes, 2010 codes)
  go to the code's own ".00" profile when O*NET rates it, else to its rated
  children in proportion to their filings. Codes without filings weight their
  ".00" profile, or their children equally. residual_share says how much of a
  code's weight was placed that way.
- Smoke test: O*NET's own "Primary-Short" related occupations, and how many of
  them land in each occupation's ten nearest. O*NET builds that list partly
  from the same descriptors, so this checks the pipeline, not the measure.

Coverage is reported as a share of certified FY2024 and FY2025 filings, the
years section 2 uses. Codes O*NET does not list, and listed codes without any
rated profile, are named with their filings.

Deep-dive box (public/weeks/week04/data/skills.json)
- Reuses section 2's own network, public/weeks/week04/data/jobs.json: its 60
  shown occupations, their direct co-hiring ties (edges) and their Louvain
  clusters, already checked there against degree-preserving rewirings.
- Q1: among those 60 occupations, is the O*NET similarity of a pair with a
  direct co-hiring tie higher than a random pair from the same 60 (all
  pairs)? This is a within-population comparison, not against every rated
  occupation, so a large, popular field (which tends to co-hire more and,
  separately, to have a less extreme O*NET profile) does not by itself
  inflate the answer.
- Q2: does that also hold one level up, between whole clusters that need not
  share a single direct hire: same-cluster pairs (excluding the direct ties
  Q1 already counts) against different-cluster pairs, both again within the
  60.

Outputs
- build/week04/skills_similarity.csv.gz: every pair of codes with a profile.
- analysis/week04_skills.json: coverage, the mixed codes and their weights,
  the similarity spread, the smoke test and each large H-1B occupation's
  nearest neighbours.
- public/weeks/week04/data/skills.json: the deep-dive box's two questions.
"""

import json
import zipfile
from collections import Counter
from itertools import combinations

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from week04_data import OUT as BUILD, RAW, ROOT
from week04_jobs import filtered
from week04_schemas import check

ONET_DIR = RAW / "onet"
ARCHIVE = ONET_DIR / "db_25_0_text.zip"
PAIRS = BUILD / "skills_similarity.csv.gz"
OUT = ROOT / "analysis" / "week04_skills.json"
JOBS_PAGE = ROOT / "public" / "weeks" / "week04" / "data" / "jobs.json"
PAGE = ROOT / "public" / "weeks" / "week04" / "data" / "skills.json"
YEARS = (2024, 2025)
DOMAINS = ["essential_skills", "transferable_skills", "knowledge", "work_activities"]
ARCHIVE_DOMAINS = ["Skills", "Knowledge", "Work Activities"]
# 2019 O*NET-SOC code -> its rated 2010 predecessor in O*NET 25.0 (O*NET's
# 2010-to-2019 crosswalk; 13-2099.03 Investment Underwriters also feeds
# 13-2051.00 but was never rated).
ARCHIVED = {"13-2051.00": "13-2051.00", "13-2054.00": "13-2099.02"}
SCALE = "IM"  # Importance, 1 to 5
NEAREST = 10
SHOWN = 30  # occupations with the most filings listed with their neighbours
PARTNERS = 5
DETAILED = r"^\d{2}-\d{4}\.\d{2}$"


def read(name):
    path = ONET_DIR / f"{name}.csv"
    if not path.exists():
        raise SystemExit(f"{path.relative_to(ROOT)} is missing: run python analysis/week04_data.py --refs --no-tables")
    return pd.read_csv(path, dtype=str)


def rated(table):
    table = table[(table["Scale ID"] == SCALE) & (table["Recommend Suppress"] != "Y")]
    return table[["O*NET-SOC Code", "Element ID", "Data Value", "Date"]]


def archived_ratings():
    """The ARCHIVED predecessors' ratings from O*NET 25.0, under their 2019 codes."""
    if not ARCHIVE.exists():
        raise SystemExit(f"{ARCHIVE.relative_to(ROOT)} is missing: run python analysis/week04_data.py --refs --no-tables")
    with zipfile.ZipFile(ARCHIVE) as z:
        frames = [pd.read_csv(z.open(f"db_25_0_text/{name}.txt"), sep="\t", dtype=str) for name in ARCHIVE_DOMAINS]
    long = rated(pd.concat(frames))
    walk = read("onet_2010_to_2019_crosswalk")
    walk = set(zip(walk["O*NET-SOC 2019 Code"], walk["O*NET-SOC 2010 Code"]))
    if not set(ARCHIVED.items()) <= walk:
        raise SystemExit("ARCHIVED is not in O*NET's 2010-to-2019 crosswalk")
    back = {old: new for new, old in ARCHIVED.items()}
    long = long[long["O*NET-SOC Code"].isin(back)].copy()
    long["O*NET-SOC Code"] = long["O*NET-SOC Code"].map(back)
    return long


def detailed_profiles():
    """Detailed O*NET-SOC code x descriptor, Importance, suppressed ratings dropped."""
    long = pd.concat([rated(read(name)) for name in DOMAINS])
    old = archived_ratings()
    old = old[~old["O*NET-SOC Code"].isin(set(long["O*NET-SOC Code"]))]
    ids = set(long["Element ID"])
    if set(old["Element ID"]) != ids:
        raise SystemExit("O*NET 25.0 and 31.0 descriptors differ")
    archived = {code: {"from": ARCHIVED[code], "rated": sorted(set(g["Date"]))}
                for code, g in old.groupby("O*NET-SOC Code")}
    long = pd.concat([long, old])
    long["Data Value"] = long["Data Value"].astype(float)
    wide = long.pivot_table(index="O*NET-SOC Code", columns="Element ID", values="Data Value")
    missing = int(wide.isna().sum().sum())
    return wide.fillna(wide.mean()), archived, missing


def weights(profiles, frame):
    """Code x profile shares of filings (rows sum to 1), and each code's residual share."""
    soc = pd.Series(profiles, index=profiles).str[:7]
    by_code = {c: list(p) for c, p in soc.groupby(soc).groups.items()}
    detailed = frame["SOC_CODE"].str.strip()
    own = detailed.str.match(DETAILED) & detailed.isin(set(profiles)) & (detailed.str[:7] == frame["occupation"])
    direct = Counter(zip(frame.loc[own, "occupation"], detailed[own]))
    residual = Counter(frame.loc[~own, "occupation"])
    rows, shares = {}, {}
    for code, children in by_code.items():
        counts = {p: direct.get((code, p), 0) for p in children}
        base = f"{code}.00"
        if base in children:
            fallback = {base: 1.0}
        elif sum(counts.values()):
            fallback = {p: n / sum(counts.values()) for p, n in counts.items()}
        else:
            fallback = {p: 1 / len(children) for p in children}
        total = sum(counts.values()) + residual[code]
        if total:
            row = {p: (counts[p] + residual[code] * fallback.get(p, 0)) / total for p in children}
            shares[code] = residual[code] / total
        else:
            row = fallback
        rows[code] = row
    codes = sorted(rows)
    index = {p: i for i, p in enumerate(profiles)}
    w = np.zeros((len(codes), len(profiles)))
    for r, code in enumerate(codes):
        for p, share in rows[code].items():
            w[r, index[p]] = share
    return codes, w, rows, shares


def upper(values):
    return values[np.triu_indices(len(values), k=1)]


def spread(values):
    q = np.quantile(values, [0.05, 0.25, 0.5, 0.75, 0.95])
    return {"pairs": int(len(values)), "mean": round(float(values.mean()), 3),
            **{f"q{int(p * 100):02d}": round(float(v), 3) for p, v in zip([0.05, 0.25, 0.5, 0.75, 0.95], q)}}


def related_pairs(codes):
    """O*NET's Primary-Short related occupations as 2018 SOC pairs, both with profiles."""
    table = read("related_occupations")
    table = table[table["Relatedness Tier"] == "Primary-Short"]
    pairs = {(a[:7], b[:7]) for a, b in zip(table["O*NET-SOC Code"], table["Related O*NET-SOC Code"])}
    return {(a, b) for a, b in pairs if a != b and a in codes and b in codes}


def smoke_test(sim, focus, pairs):
    related = {}
    for a, b in pairs:
        related.setdefault(a, set()).add(b)
    hits = total = 0
    for code in focus:
        if code not in related:
            continue
        nearest = set(sim.loc[code].drop(code).nlargest(NEAREST).index)
        hits += len(related[code] & nearest)
        total += len(related[code])
    values = np.array([sim.at[a, b] for a, b in pairs])
    return {"occupations": sum(c in related for c in focus), "related_links": total,
            "share_in_nearest": round(hits / total, 3),
            "share_by_chance": round(NEAREST / (len(sim) - 1), 3),
            "related_similarity_median": round(float(np.median(values)), 3)}


def group_stats(pairs, sim, titles, extreme=3):
    """Mean, sd and n of sim over a list of (code, code) pairs, plus the most and
    least similar pairs so the reveal can name one instead of only a mean."""
    if not pairs:
        return {"n": 0, "mean": None, "sd": None, "examples": []}
    values = np.array([sim.at[a, b] for a, b in pairs])
    order = np.argsort(-values)
    shown = [pairs[i] for i in order[:extreme]] + ([pairs[i] for i in order[-extreme:]] if len(pairs) > extreme else [])
    examples = [{"a": a, "a_title": titles.get(a, a), "b": b, "b_title": titles.get(b, b),
                 "similarity": round(float(sim.at[a, b]), 3)} for a, b in shown]
    return {"n": int(len(values)), "mean": round(float(values.mean()), 3),
            "sd": round(float(values.std(ddof=0)), 3), "examples": examples}


def cohiring_view(sim, titles):
    """Section 2's own 60-occupation network (public/weeks/week04/data/jobs.json):
    do occupations with a direct co-hiring tie need more alike skills than a
    random pair from the same 60, and does that hold at the cluster level too?
    Every comparison stays inside this 60-occupation population, so a large,
    popular field cannot inflate the answer merely by being large."""
    if not JOBS_PAGE.exists():
        raise SystemExit(f"{JOBS_PAGE.relative_to(ROOT)} is missing: run python analysis/week04_jobs.py first")
    jobs = json.loads(JOBS_PAGE.read_text())
    nodes = [n["id"] for n in jobs["nodes"] if n["id"] in sim.index]
    dropped = [n["id"] for n in jobs["nodes"] if n["id"] not in sim.index]
    cluster_of = {n["id"]: n["cluster"] for n in jobs["nodes"] if n["id"] in sim.index}
    covered = set(nodes)

    edge_pairs = sorted({tuple(sorted((e["source"], e["target"])))
                          for e in jobs["edges"] if e["source"] in covered and e["target"] in covered})
    all_pairs = list(combinations(sorted(nodes), 2))
    edge_set = set(edge_pairs)
    # Excludes direct ties from both groups (a handful of edges cross clusters,
    # i.e. bridges), so direct_ties, same_cluster_other_pairs and
    # different_cluster_pairs are disjoint and sum to all_pairs exactly.
    same_cluster = [(a, b) for a, b in all_pairs
                     if (a, b) not in edge_set and cluster_of[a] == cluster_of[b]]
    diff_cluster = [(a, b) for a, b in all_pairs
                     if (a, b) not in edge_set and cluster_of[a] != cluster_of[b]]

    return {
        "source": {"page": "public/weeks/week04/data/jobs.json", "year": jobs["meta"]["year"]},
        "occupations": len(nodes), "occupations_without_a_profile": len(dropped),
        "direct_ties": group_stats(edge_pairs, sim, titles),
        "same_cluster_other_pairs": group_stats(same_cluster, sim, titles),
        "different_cluster_pairs": group_stats(diff_cluster, sim, titles),
        "all_pairs": group_stats(all_pairs, sim, titles),
    }


def main():
    wide, archived, missing = detailed_profiles()
    profiles = list(wide.index)
    z = (wide - wide.mean()) / wide.std(ddof=0)
    profile_sim = cosine_similarity(z.values)

    frame = pd.concat([filtered(year) for year in YEARS])
    filings = Counter(frame["occupation"])
    total = sum(filings.values())
    codes, w, rows, residual = weights(profiles, frame)
    sim = pd.DataFrame(w @ profile_sim @ w.T, index=codes, columns=codes)

    names = read("occupation_data").set_index("O*NET-SOC Code")["Title"]
    first = names.groupby(names.index.str[:7]).first()
    title_of = {c: names.get(f"{c}.00", first.get(c, "")) for c in set(codes) | set(filings)}
    listed = set(names.index.str[:7])
    covered = [c for c in filings if c in sim.index]
    unrated = sorted((c for c in filings if c in listed and c not in sim.index), key=lambda c: -filings[c])
    unlisted = sorted((c for c in filings if c not in listed), key=lambda c: -filings[c])

    mixed = {}
    for code in codes:
        row = {p: s for p, s in rows[code].items() if s > 0}
        if len(row) > 1:
            top = sorted(row.items(), key=lambda kv: -kv[1])
            mixed[code] = {"title": title_of[code], "h1b_filings": filings.get(code, 0),
                           "residual_share": round(residual.get(code, 0.0), 3),
                           "within_similarity": round(float(sim.at[code, code]), 3),
                           "profiles": [{"code": p, "title": names.get(p, ""), "share": round(s, 3)} for p, s in top]}

    h1b = sim.loc[sorted(covered), sorted(covered)]
    shown = sorted(covered, key=lambda c: -filings[c])[:SHOWN]
    neighbours = {}
    for code in shown:
        row = h1b.loc[code].drop(code).nlargest(PARTNERS)
        neighbours[code] = {"title": title_of[code], "filings": filings[code],
                            "nearest": [{"code": c, "title": title_of[c], "similarity": round(float(v), 3)}
                                        for c, v in row.items()]}

    # Every pair once, for section 2 to join onto its projection.
    i, j = np.triu_indices(len(sim), k=1)
    labels = sim.index.to_numpy()
    BUILD.mkdir(parents=True, exist_ok=True)
    pd.DataFrame({"a": labels[i], "b": labels[j], "similarity": sim.values[i, j].round(4)}).to_csv(PAIRS, index=False)

    result = {
        "meta": {"source": "O*NET 31.0 Database, U.S. Department of Labor, CC BY 4.0; "
                           "O*NET 25.0 for the archived profiles",
                 "scale": "Importance", "domains": DOMAINS, "descriptors": int(wide.shape[1]),
                 "years": list(YEARS), "pairs_file": str(PAIRS.relative_to(ROOT))},
        "profiles": len(profiles),
        "codes": len(codes),
        "archived": {c: {**v, "title": names.get(c, "")} for c, v in archived.items()},
        "filled_ratings": missing,
        "coverage": {"h1b_occupations": len(filings), "covered": len(covered), "filings": total,
                     "filing_share_covered": round(sum(filings[c] for c in covered) / total, 4),
                     "unrated": [{"code": c, "title": title_of[c], "filings": filings[c]} for c in unrated],
                     "not_in_onet": [{"code": c, "filings": filings[c]} for c in unlisted]},
        "mixed": mixed,
        "similarity_uncentred": spread(upper(cosine_similarity(wide.values))),
        "similarity_all": spread(upper(sim.values)),
        "similarity_h1b": spread(upper(h1b.values)),
        "smoke_test": smoke_test(sim, covered, related_pairs(set(codes))),
        "neighbours": neighbours,
    }
    OUT.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n")

    cohiring = cohiring_view(sim, title_of)
    page = {"meta": {"generated_by": "analysis/week04_skills.py", **result["meta"]}, "cohiring": cohiring}
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, indent=1, ensure_ascii=False) + "\n")

    brief = {k: result[k] for k in ("profiles", "codes", "archived", "similarity_uncentred",
                                    "similarity_all", "similarity_h1b", "smoke_test")}
    brief["coverage"] = {k: v for k, v in result["coverage"].items() if k not in ("unrated", "not_in_onet")}
    brief["cohiring"] = cohiring
    print(json.dumps(brief, indent=1))


if __name__ == "__main__":
    main()
