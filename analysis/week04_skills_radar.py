"""Week 4, section 3 support: every occupation's own O*NET skill profile.

week04_skills.py compresses each occupation's 109 O*NET ratings into a single
similarity number against every other occupation. This script keeps the raw
1-to-5 Importance ratings themselves, per occupation, so the deep-dive box
can put one to five occupations on a radar and let a reader compare them
descriptor by descriptor.

Method
- Reuses week04_skills.py's detailed_profiles() (O*NET 31.0 Importance
  ratings, 25.0 for the two archived profiles, suppressed ratings dropped
  then filled with the cross-occupation mean) and weights() (each SOC code's
  share of filings across its rated O*NET profiles, from the same certified
  FY2024 and FY2025 filings week04_skills.py and section 2 use).
- A code's rating on a descriptor is the W-weighted mean of its profiles'
  raw ratings on that descriptor: the same weights week04_skills.py uses for
  similarity, applied to the ratings directly instead of to their cosine.
- The 109 descriptors split into three groups a reader can switch between:
  skills (the 10 essential + 25 transferable skills, 35), knowledge areas
  (33) and generalised work activities (41). Each group is ordered as
  content_model_reference.csv orders it, O*NET's own hierarchy: a plain
  sort of the Element IDs misplaces "2.C.10" (Sales and Marketing) right
  after "2.C.1.f", because "1" sorts before ".".

Deep-dive box (docs/weeks/week04/data/skills_radar.json)
- occupations: every SOC code with a rated profile and at least one
  certified FY2024 or FY2025 filing (the same population week04_skills.py
  reports as "covered"). in_network flags section 2's 60 shown occupations
  (docs/weeks/week04/data/jobs.json); cluster is that node's Louvain
  cluster, or null for a code outside the 60.
- default: two codes the page opens with, chosen without hand-picking: the
  most-filed occupation (this script's own FY2024+FY2025 count) in each of
  the two largest of the 60's four clusters, sized by how many of the 60
  they hold (39 and 16), not by each cluster's full membership beyond the 60.

Output: docs/weeks/week04/data/skills_radar.json, kept compact (no indent)
because a reader's browser downloads it on every page load.
"""

import json
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

from week04_data import ROOT
from week04_jobs import filtered
from week04_schemas import check
from week04_skills import JOBS_PAGE, YEARS, detailed_profiles, read, weights

PAGE = ROOT / "docs" / "weeks" / "week04" / "data" / "skills_radar.json"
GROUP_DOMAINS = {
    "skills": ["essential_skills", "transferable_skills"],
    "knowledge": ["knowledge"],
    "work_activities": ["work_activities"],
}
GROUP_LABELS = {
    "skills": "Skills",
    "knowledge": "Knowledge areas",
    "work_activities": "Work activities",
}


def content_model_order():
    """Element ID -> its row position in content_model_reference.csv, O*NET's
    own hierarchical order (a plain string sort misplaces ids like 2.C.10)."""
    table = read("content_model_reference")
    return {element_id: i for i, element_id in enumerate(table["Element ID"])}


def descriptor_groups(columns):
    """The three descriptor groups, each in O*NET's own order, restricted to
    the descriptor ids detailed_profiles() actually rated (columns)."""
    rank = content_model_order()
    available = set(columns)
    groups = {}
    for group, domains in GROUP_DOMAINS.items():
        long = pd.concat([read(name)[["Element ID", "Element Name"]] for name in domains])
        pairs = long.drop_duplicates("Element ID").set_index("Element ID")["Element Name"]
        ids = sorted((i for i in pairs.index if i in available), key=lambda e: rank[e])
        groups[group] = {"label": GROUP_LABELS[group], "ids": ids, "names": [pairs[i] for i in ids]}
    return groups


def main():
    wide, _archived, _missing = detailed_profiles()
    groups = descriptor_groups(wide.columns)
    order = groups["skills"]["ids"] + groups["knowledge"]["ids"] + groups["work_activities"]["ids"]
    if sorted(order) != sorted(wide.columns):
        raise SystemExit("the three descriptor groups do not cover exactly detailed_profiles()'s columns")
    wide = wide[order]

    frame = pd.concat([filtered(year) for year in YEARS])
    filings = Counter(frame["occupation"])
    codes, w, _rows, _residual = weights(list(wide.index), frame)
    ratings = pd.DataFrame(w @ wide.values, index=codes, columns=order)

    names = read("occupation_data").set_index("O*NET-SOC Code")["Title"]
    first = names.groupby(names.index.str[:7]).first()
    title_of = {c: names.get(f"{c}.00", first.get(c, "")) for c in set(codes) | set(filings)}

    if not JOBS_PAGE.exists():
        raise SystemExit(f"{JOBS_PAGE.relative_to(ROOT)} is missing: run python analysis/week04_jobs.py first")
    jobs = json.loads(JOBS_PAGE.read_text())
    cluster_of = {n["id"]: n["cluster"] for n in jobs["nodes"]}
    in_network = set(cluster_of)

    covered = sorted(c for c in filings if c in ratings.index)
    occupations = [
        {
            "code": code,
            "title": title_of[code],
            "filings": filings[code],
            "in_network": code in in_network,
            "cluster": cluster_of.get(code),
            "ratings": [round(float(v), 2) for v in ratings.loc[code]],
        }
        for code in covered
    ]

    # default: the most-filed occupation (this script's own filings) in each
    # of the two clusters holding the most of the 60, not hand-picked.
    cluster_size = Counter(cluster_of.values())
    top_clusters = [cluster for cluster, _n in sorted(cluster_size.items(), key=lambda kv: -kv[1])[:2]]
    by_code = {o["code"]: o for o in occupations}
    default = []
    for cluster in top_clusters:
        members = [o["code"] for o in occupations if o["cluster"] == cluster]
        if members:
            default.append(max(members, key=lambda c: by_code[c]["filings"]))

    page = {
        "meta": {
            "generated_by": "analysis/week04_skills_radar.py",
            "source": "O*NET 31.0 Database, U.S. Department of Labor, CC BY 4.0; O*NET 25.0 for the archived profiles",
            "scale": "Importance, 1 to 5",
            "years": list(YEARS),
            "groups": groups,
        },
        "occupations": occupations,
        "default": default,
    }
    check(PAGE, page)
    PAGE.write_text(json.dumps(page, ensure_ascii=False, separators=(",", ":")) + "\n")

    print(json.dumps({
        "occupations": len(occupations),
        "in_network": sum(o["in_network"] for o in occupations),
        "default": [{"code": c, "title": title_of[c]} for c in default],
        "descriptors": {g: len(v["ids"]) for g, v in groups.items()},
        "bytes": PAGE.stat().st_size,
    }, indent=1))


if __name__ == "__main__":
    main()
