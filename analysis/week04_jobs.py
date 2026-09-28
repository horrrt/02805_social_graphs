"""Week 4, section 2: Which jobs go together?  Owner: Niklas.

Network: companies x occupations (SOC code), projected onto occupations. Two
occupations are linked when the same companies file for both; the weight is
the number of such companies.

Questions
- Which jobs are hired together?
- Which jobs belong to two clusters at once?
- Do the clusters follow the official job groups?

Method
- Certified H-1B filings (week04_staffing.certified), companies keyed by
  week04_staffing.resolver(): a tax number, or a family in the alias table.
- Occupations are 2018 SOC codes. The few filings still on 2010 codes are moved
  to their 2018 successors by recode_soc, in two steps: the full 8-digit
  O*NET-SOC code goes through every row of O*NET's 2010-to-2019 crosswalk with
  exactly one 2019 target (so 15-1199.08 lands on 15-2051, Data Scientists,
  and 15-1199.01 on 15-1253, QA testers), and codes without such a row fall
  back to LEGACY's 7-character map. week04_roles.py uses the same function.
  Each code takes its title from its base ".00" rows, not from an O*NET
  sub-title.
- Louvain (igraph's multilevel) on the full projection, 100 seeds, the best
  modularity run kept; the median NMI over all pairs of the 100 runs says how
  stable the split is.
- Modularity against NULLS degree-preserving rewirings of the company x
  occupation network (week04_staffing.rewire: each company keeps its number of
  occupations, each occupation its number of companies), re-projected. The
  projection has isolated occupations and small pieces, so real and rewired
  networks are both scored on their giant component; the real score is the
  mean of 100 seeds there, each null one run.
- A second cluster: the other cluster an occupation's employer ties exceed most
  over what the cluster's size predicts (lift: observed weight over
  k_i * S_c / 2m, the expectation modularity uses). Lift above 1 happens by
  chance, so the rule is tested on the same rewired networks with the real
  cluster labels held fixed: an occupation counts as a bridge only when its
  best lift beats its own best lift in every rewired network (p < 1/(NULLS+1)).
- The disparity-filter backbone of the projection (week04_where.disparity, at
  section 1's alpha), and whether Louvain on it finds the same clusters.
- NMI and adjusted mutual information (AMI) between clusters and SOC major
  groups, over occupations in clusters of two or more, against 100 shuffles
  of the major-group labels. The same partition for FY2024, compared on the
  occupations both years share.
- Infomap on the same projection, compared with Louvain and the SOC groups.
- A few filings a year carry a mistyped code whose first two digits are no
  2018 SOC major group (12, 14, 20, 24, 40). recode_soc gives each the code
  that most filings with the same title carry; one with a title no correctly
  coded filing carries is dropped.

The page shows the 60 occupations with the most filings, each with its three
strongest links to the others: a display filter, not the backbone. Each shown
occupation has a fixed position (layout): Kamada-Kawai on the largest piece of
the drawn network, link length from 1 + log(weight), its core spread out, and each smaller piece as
a ring in the bottom-right corner, in a 700 x 580 frame scaled to 0-1.

Output: docs/weeks/week04/data/jobs.json (every number the section quotes).
"""

import itertools
import json
import random
import sys
from collections import Counter, defaultdict
from functools import lru_cache
from pathlib import Path

import networkx as nx
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

import numpy as np
import pandas as pd

from week04_data import RAW
from week04_schemas import check
from week04_staffing import certified, infomap, louvain, rewire, tracked
from week04_where import DEFAULT_ALPHA, disparity

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "weeks" / "week04" / "data" / "jobs.json"
CROSSWALK = RAW / "onet" / "onet_2010_to_2019_crosswalk.csv"
SHOWN = 60
LINKS_PER_NODE = 3
PARTNERS = 5
SEED = 204
# The network's drawing frame (px): the page scales x and y (0-1) to its own.
FRAME_W, FRAME_H = 700, 580
FRAME_LEFT, FRAME_RIGHT, FRAME_TOP, FRAME_BOTTOM = 20, 20, 40, 74
RING_RADIUS, RING_STEP = 34, 110
CORE_SPREAD = 0.55
NULLS = 20  # rewirings; the brief's own count (one takes about 3 s)

# 2010 computer occupations and the 2018 codes that replaced them (BLS SOC
# 2010-to-2018 crosswalk; a code that split goes to its main successor).
LEGACY = {
    "15-1111": "15-1221", "15-1121": "15-1211", "15-1122": "15-1212", "15-1131": "15-1251",
    "15-1132": "15-1252", "15-1133": "15-1252", "15-1134": "15-1254", "15-1141": "15-1242",
    "15-1142": "15-1244", "15-1143": "15-1241", "15-1151": "15-1232", "15-1152": "15-1231",
    "15-1199": "15-1299",
}

MAJOR_GROUPS = {
    "11": "Management", "13": "Business and financial", "15": "Computer and mathematical",
    "17": "Architecture and engineering", "19": "Life, physical and social science",
    "21": "Community and social service", "23": "Legal", "25": "Education and library",
    "27": "Arts, design, media", "29": "Healthcare practitioners", "31": "Healthcare support",
    "33": "Protective service", "35": "Food preparation", "37": "Building and grounds",
    "39": "Personal care", "41": "Sales", "43": "Office and administrative", "45": "Farming",
    "47": "Construction", "49": "Installation and repair", "51": "Production",
    "53": "Transportation", "55": "Military",
}


@lru_cache
def single_targets(path=CROSSWALK):
    """{2010 O*NET-SOC code: its 2019 6-digit SOC code}, from every crosswalk
    row whose 2010 code has exactly one 2019 target."""
    if not path.exists():
        raise SystemExit(f"{path} is missing: run python analysis/week04_data.py --refs --no-tables")
    walk = pd.read_csv(path, dtype=str)
    targets = walk.groupby("O*NET-SOC 2010 Code")["O*NET-SOC 2019 Code"].agg(set)
    return {old: next(iter(new))[:7] for old, new in targets.items() if len(new) == 1}


def plain_title(titles):
    """Titles compared case-blind, with spaces collapsed and a final "s" cut
    ("Sales Engineer" filed once for "Sales Engineers")."""
    return titles.astype(str).str.casefold().str.split().str.join(" ").str.removesuffix("s")


def recode_soc(lca, crosswalk=None):
    """Adds the recoded 6-digit occupation, whether the recode moved the row
    off a 2010 code, whether the crosswalk (not LEGACY) did, whether the code
    was mistyped, the 8-digit O*NET-SOC code, and whether its SOC code parsed
    at all. The crosswalk defaults to single_targets().

    Mistyped codes: a handful of filings a year (2 to 9 in 2022-2026) carry a
    code whose first two digits are no 2018 SOC major group (12, 14, 20, 24,
    40), such as 12-1252 "Software Developers" or 40-9031 "Sales Engineers".
    Each one's title names a real occupation, and the digits alone cannot
    (12-5021 "Data Scientists" is 15-2051), so such a row takes the code
    that most filings with the same title (plain_title) carry in the same
    frame. A row whose title no correctly coded filing carries is dropped:
    its occupation is left empty and soc_valid is False."""
    crosswalk = single_targets() if crosswalk is None else crosswalk
    raw = lca["SOC_CODE"].astype(str).str.strip()
    code = raw.str[:7]
    valid = code.str.match(r"^\d{2}-\d{4}$", na=False)
    full = raw.str[:10].where(raw.str[:10].str.match(r"^\d{2}-\d{4}\.\d{2}$", na=False))
    walked = full.map(crosswalk)
    occupation = walked.where(valid).fillna(code.where(valid).replace(LEGACY))
    mistyped = valid & ~code.str[:2].isin(MAJOR_GROUPS)
    if mistyped.any():
        title = plain_title(lca["SOC_TITLE"]) if "SOC_TITLE" in lca else pd.Series("", index=lca.index)
        good = pd.DataFrame({"title": title, "occupation": occupation})[valid & ~mistyped]
        by_title = (good.groupby(["title", "occupation"]).size().reset_index(name="n")
                    .sort_values(["title", "n", "occupation"], ascending=[True, False, True])
                    .drop_duplicates("title").set_index("title")["occupation"])
        occupation = occupation.where(~mistyped, title.map(by_title))
        valid = valid & occupation.notna()
    legacy = valid & ~mistyped & (occupation != code)
    by_crosswalk = valid & walked.notna() & (walked != code)
    return lca.assign(occupation=occupation, legacy=legacy, by_crosswalk=by_crosswalk,
                      mistyped=mistyped, onet_code=full, soc_valid=valid)


def filtered(year):
    frame = certified(year)
    frame = recode_soc(frame[frame["SOC_CODE"].str.match(r"^\d{2}-\d{4}", na=False)])
    unresolved = int((~frame["soc_valid"]).sum())
    if unresolved:
        print(f"{year}: dropped {unresolved} filings with a mistyped code no title resolves", flush=True)
    frame = frame[frame["soc_valid"]].copy()
    frame["company"] = frame["employer"]
    return frame


def titles_of(frame):
    """Each code's title from its base ".00" rows; the most common title otherwise."""
    base = frame[frame["SOC_CODE"].str.strip().str.endswith(".00") & ~frame["legacy"]]
    titles = base.groupby("occupation")["SOC_TITLE"].agg(lambda s: s.str.strip().mode().iloc[0]).to_dict()
    rest = frame[~frame["occupation"].isin(titles)]
    titles |= rest.groupby("occupation")["SOC_TITLE"].agg(lambda s: s.str.strip().mode().iloc[0]).to_dict()
    return titles


def projection(frame):
    company_jobs = frame.groupby("company")["occupation"].agg(set)
    filings = Counter(frame["occupation"])
    graph = nx.Graph()
    graph.add_nodes_from(filings)
    for jobs in company_jobs:
        for left, right in itertools.combinations(sorted(jobs), 2):
            if graph.has_edge(left, right):
                graph[left][right]["weight"] += 1
            else:
                graph.add_edge(left, right, weight=1)
    return graph, filings


def as_labels(groups):
    return {node: i for i, group in enumerate(groups) for node in group}


def communities(graph):
    found = [louvain(graph, seed) for seed in range(100)]
    runs, scores = [r for r, _ in found], [q for _, q in found]
    best = runs[scores.index(max(scores))]
    # Clusters numbered by size, largest first, so labels read 1, 2, 3.
    best = sorted(best, key=lambda g: (-len(g), min(g)))
    labels = as_labels(best)
    # Run-to-run stability: NMI over every pair of the 100 runs, on all occupations.
    nodes = sorted(graph)
    run_labels = [as_labels(r) for r in runs]
    vectors = [[lab[n] for n in nodes] for lab in run_labels]
    pairs = [nmi(a, b) for a, b in itertools.combinations(vectors, 2)]
    return labels, {"runs": len(runs), "modularity_mean": sum(scores) / len(scores),
                    "modularity_best": max(scores), "clusters": len(best),
                    "clusters_of_two_or_more": sum(len(g) > 1 for g in best),
                    "nmi_between_runs_median": float(np.median(pairs)),
                    "nmi_between_runs_min": float(min(pairs)), "run_pairs": len(pairs)}, run_labels


def best_other_lift(graph, labels):
    """Each occupation's other cluster with the highest lift (employer ties over
    k_i * S_c / 2m, the expectation modularity uses), as (cluster, lift)."""
    strength = dict(graph.degree(weight="weight"))
    total = sum(strength.values())  # 2m
    cluster_strength = Counter()
    for node, c in labels.items():
        cluster_strength[c] += strength.get(node, 0)
    out = {}
    for node in graph:
        ties = Counter()
        for other, edge in graph[node].items():
            ties[labels[other]] += edge["weight"]
        own = labels[node]
        lift = {c: w / (strength[node] * cluster_strength[c] / total)
                for c, w in ties.items() if c != own and strength[node]}
        best = max(lift, key=lift.get, default=None)
        out[node] = (best, lift[best] if best is not None else 0.0)
    return out


def second_clusters(graph, labels, null_lifts=None):
    """An occupation's clusters: its own, plus its best other cluster when the
    lift there is above 1 (no null given) or beats the node's best lift in every
    rewired network (null_lifts: one {node: lift} per rewiring)."""
    real = best_other_lift(graph, labels)
    membership = {}
    for node, (best, lift) in real.items():
        if null_lifts is None:
            passes = best is not None and lift > 1
        else:
            passes = best is not None and all(lift > null.get(node, 0.0) for null in null_lifts)
        membership[node] = [labels[node]] + ([best] if passes else [])
    return membership, real


def layout(nodes, edges):
    """{occupation: (x, y)} in 0-1 for the drawn network: Kamada-Kawai on its
    largest piece with link length from 1 + log(weight), its dense core spread
    (distance from the centre r becomes r ** CORE_SPREAD), each smaller piece a
    ring in the frame's bottom-right corner. Deterministic: networkx starts
    Kamada-Kawai from a circle in node order."""
    graph = nx.Graph()
    graph.add_nodes_from(nodes)
    graph.add_weighted_edges_from((e["source"], e["target"], 1 + np.log(e["weight"])) for e in edges)
    pieces = sorted(nx.connected_components(graph), key=lambda c: (-len(c), min(c)))
    main = graph.subgraph(pieces[0]).copy()
    pos = nx.kamada_kawai_layout(main)
    # Spread the dense core: each node's distance from the centre becomes r ** CORE_SPREAD.
    cx, cy = np.mean([p[0] for p in pos.values()]), np.mean([p[1] for p in pos.values()])
    for k, (x, y) in list(pos.items()):
        r = np.hypot(x - cx, y - cy)
        if r > 0:
            pos[k] = (cx + (x - cx) * r ** CORE_SPREAD / r, cy + (y - cy) * r ** CORE_SPREAD / r)
    xs, ys = [p[0] for p in pos.values()], [p[1] for p in pos.values()]
    width = FRAME_W - FRAME_LEFT - FRAME_RIGHT - 150
    height = FRAME_H - FRAME_TOP - FRAME_BOTTOM
    px = {k: (FRAME_LEFT + 75 + width * (x - min(xs)) / (max(xs) - min(xs)),
              FRAME_TOP + height * (y - min(ys)) / (max(ys) - min(ys))) for k, (x, y) in pos.items()}
    ox, oy = FRAME_W - 60, FRAME_H - FRAME_BOTTOM - 60
    for piece in pieces[1:]:
        ring = [n for n in nodes if n in piece]
        for i, node in enumerate(ring):
            angle = 2 * np.pi * i / len(ring)
            px[node] = (ox + RING_RADIUS * np.cos(angle), oy + RING_RADIUS * np.sin(angle))
        ox -= RING_STEP
    return {k: (round(float(x) / FRAME_W, 4), round(float(y) / FRAME_H, 4)) for k, (x, y) in px.items()}


def giant_of(graph):
    return graph.subgraph(max(nx.connected_components(graph), key=len)).copy()


def reproject(bipartite, occupations):
    """A rewired company x occupation graph back onto occupations."""
    jobs_of = {}
    for u, v in bipartite.edges():
        company, job = (u, v) if u[0] == "F" else (v, u)
        jobs_of.setdefault(company, set()).add(job[1])
    graph = nx.Graph()
    graph.add_nodes_from(occupations)
    for jobs in jobs_of.values():
        for left, right in itertools.combinations(sorted(jobs), 2):
            if graph.has_edge(left, right):
                graph[left][right]["weight"] += 1
            else:
                graph.add_edge(left, right, weight=1)
    return graph


def null_check(frame, graph, labels):
    """Modularity against rewired networks, each scored on its giant component
    like the real one, and each occupation's best other-cluster lift in each
    rewired network with the real labels held fixed."""
    bipartite = nx.Graph()
    for company, job in frame[["company", "occupation"]].drop_duplicates().itertuples(index=False):
        bipartite.add_edge(("F", company), ("C", job), weight=1)
    giant = giant_of(graph)
    real = np.array([louvain(giant, seed)[1] for seed in range(100)])
    rng = random.Random(SEED)
    null_q, null_lifts, null_sizes = [], [], []
    for i in tracked("Jobs nulls", NULLS):
        h = reproject(rewire(bipartite, rng), list(graph))
        hg = giant_of(h)
        null_sizes.append(hg.number_of_nodes())
        null_q.append(louvain(hg, SEED + i)[1])
        null_lifts.append({n: lift for n, (_, lift) in best_other_lift(h, labels).items()})
    null_q = np.array(null_q)
    stats = {"runs": NULLS, "scored_on": "the giant component of each network",
             "real_giant_occupations": giant.number_of_nodes(),
             "null_giant_occupations_median": int(np.median(null_sizes)),
             "real": float(real.mean()), "real_sd": float(real.std()),
             "null": float(null_q.mean()), "null_sd": float(null_q.std()),
             "z": float((real.mean() - null_q.mean()) / null_q.std()),
             "null_runs_at_or_above_real": int((null_q >= real.mean()).sum())}
    return stats, null_lifts


def backbone_check(graph, labels, run_labels):
    """The disparity-filter backbone at section 1's alpha, and whether Louvain on
    it finds the clusters of the full projection."""
    p = disparity(graph)
    kept = [(u, v, graph[u][v]["weight"]) for (u, v), pv in p.items() if pv < DEFAULT_ALPHA]
    bone = nx.Graph()
    bone.add_weighted_edges_from(kept)
    parts = max((louvain(bone, seed) for seed in range(100)), key=lambda r: r[1])[0]
    on_bone = as_labels(parts)
    nodes = sorted(bone)
    # Baseline: two runs on the full projection, compared on the same occupations.
    base = [nmi([a[n] for n in nodes], [b[n] for n in nodes])
            for a, b in zip(run_labels[0::2], run_labels[1::2])]
    return {"alpha": DEFAULT_ALPHA, "links": len(kept), "links_total": graph.number_of_edges(),
            "occupations_linked": bone.number_of_nodes(), "occupations_total": graph.number_of_nodes(),
            "giant": len(max(nx.connected_components(bone), key=len)),
            "clusters_on_backbone": len(parts),
            "nmi_with_full_clusters": nmi([labels[n] for n in nodes], [on_bone[n] for n in nodes]),
            "nmi_between_full_runs_median": float(np.median(base))}


def agreement(labels, graph):
    """NMI and AMI with SOC major groups over occupations in clusters of two or
    more, and the same against 100 shuffles of the major-group labels."""
    size = Counter(labels.values())
    nodes = sorted(n for n in labels if size[labels[n]] > 1)
    clusters = [labels[n] for n in nodes]
    major = [n[:2] for n in nodes]
    rng = random.Random(SEED)
    shuffled = []
    for _ in range(100):
        sample = major[:]
        rng.shuffle(sample)
        shuffled.append(nmi(clusters, sample))
    return {"occupations": len(nodes), "left_out_singletons": len(labels) - len(nodes),
            "nmi": nmi(clusters, major), "ami": ami(clusters, major),
            "nmi_shuffled": {"runs": len(shuffled), "mean": sum(shuffled) / len(shuffled),
                             "max": max(shuffled)}}


def build(year, checks=False):
    frame = filtered(year)
    titles = titles_of(frame)
    graph, filings = projection(frame)
    labels, louvain_stats, run_labels = communities(graph)
    null_stats, null_lifts, backbone = None, None, None
    if checks:
        null_stats, null_lifts = null_check(frame, graph, labels)
        backbone = backbone_check(graph, labels, run_labels)
    plain, real_lift = second_clusters(graph, labels)
    membership = second_clusters(graph, labels, null_lifts)[0] if checks else plain
    # Infomap, the flow-based alternative, on the same projection.
    modules, codelength = infomap(graph, SEED)
    info = {n: i for i, m in enumerate(modules) for n in m}
    size = Counter(labels.values())
    scored = sorted(n for n in labels if size[labels[n]] > 1)
    infomap_check = {
        "modules": len(modules), "modules_of_two_or_more": sum(len(m) > 1 for m in modules),
        "codelength_bits": round(float(codelength), 3),
        "nmi_with_louvain": nmi([labels[n] for n in scored], [info[n] for n in scored]),
        "nmi_with_soc": nmi([info[n] for n in scored], [n[:2] for n in scored]),
    }
    shown = sorted(filings, key=lambda n: (-filings[n], n))[:SHOWN]
    keep = set(shown)

    # Each shown occupation keeps its strongest links to the others.
    links = {}
    for node in shown:
        near = sorted(((other, e["weight"]) for other, e in graph[node].items() if other in keep),
                      key=lambda x: (-x[1], x[0]))[:LINKS_PER_NODE]
        for other, w in near:
            links[tuple(sorted((node, other)))] = w
    edges = [{"source": a, "target": b, "weight": w}
             for (a, b), w in sorted(links.items(), key=lambda kv: (-kv[1], kv[0]))]
    pairs = sorted(({"source": a, "target": b, "weight": graph[a][b]["weight"]}
                    for a, b in itertools.combinations(shown, 2) if graph.has_edge(a, b)),
                   key=lambda p: (-p["weight"], p["source"], p["target"]))[:20]

    place = layout(shown, edges)
    nodes = []
    for node in shown:
        partners = sorted(graph[node].items(), key=lambda kv: (-kv[1]["weight"], kv[0]))[:PARTNERS]
        nodes.append({
            "id": node, "title": titles[node], "major": node[:2], "filings": filings[node],
            "x": place[node][0], "y": place[node][1],
            "cluster": labels[node], "clusters": membership[node],
            "bridge": len(membership[node]) > 1,
            "partners": [[o, titles[o], e["weight"]] for o, e in partners],
        })
    shown_clusters = sorted({labels[n] for n in shown})
    size = Counter(labels.values())
    clusters = []
    for c in shown_clusters:
        members = sorted((n for n in graph if labels[n] == c), key=lambda n: (-filings[n], n))
        majors = Counter(n[:2] for n in members)
        clusters.append({"id": c, "label": titles[members[0]], "occupations": size[c],
                         "top": members[:12],
                         "majors": dict(sorted(majors.items(), key=lambda kv: (-kv[1], kv[0])))})
    return {
        "meta": {"year": year, "filings": len(frame), "occupations": graph.number_of_nodes(),
                 "legacy_filings_recoded": int(frame["legacy"].sum()),
                 "mistyped_filings_recoded": int(frame["mistyped"].sum()),
                 "companies": int(frame["company"].nunique()),
                 "scope": "Certified H-1B filings; a link counts the companies filing for both",
                 "script": "analysis/week04_jobs.py"},
        # Every group a shown node or a cluster's composition names; a code outside
        # the 2018 major groups fails here rather than reaching the page.
        "majors": {m: MAJOR_GROUPS[m] for m in sorted({n[:2] for n in shown}
                                                      | {m for c in clusters for m in c["majors"]})},
        "nodes": nodes,
        "edges": edges,
        "pairs": pairs,
        "clusters": clusters,
        "bridges": {"shown": sum(n["bridge"] for n in nodes),
                    "all_occupations": sum(len(m) > 1 for m in membership.values()),
                    "rule": "best other-cluster lift beats the same occupation's in every rewired network"
                    if checks else "best other-cluster lift above 1",
                    **({"tested": sum(best is not None for best, _ in real_lift.values()),
                        "lift_above_1": sum(len(m) > 1 for m in plain.values()),
                        "lift_above_1_by_chance_mean": float(np.mean(
                            [sum(v > 1 for v in null.values()) for null in null_lifts])),
                        "expected_false_positives": sum(best is not None for best, _ in real_lift.values())
                        / (NULLS + 1)} if checks else {})},
        "quality": {"louvain": louvain_stats, **agreement(labels, graph), "infomap": infomap_check,
                    **({"null": null_stats} if checks else {})},
        **({"backbone": backbone} if checks else {}),
        "_labels": labels,
    }


def main():
    current = build(2025, checks=True)
    previous = build(2024)
    now, before = current.pop("_labels"), previous.pop("_labels")
    size_now, size_before = Counter(now.values()), Counter(before.values())
    shared = sorted(n for n in now if n in before and size_now[now[n]] > 1 and size_before[before[n]] > 1)
    current["comparison"] = {
        "year": 2024, "filings": previous["meta"]["filings"],
        "occupations": previous["meta"]["occupations"],
        "nmi_with_soc": previous["quality"]["nmi"],
        "shared_occupations": len(shared),
        "nmi_between_years": nmi([now[n] for n in shared], [before[n] for n in shared]),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    check(OUT, current)
    OUT.write_text(json.dumps(current, separators=(",", ":")), encoding="utf-8")
    q = current["quality"]
    print(f"{current['meta']['filings']:,} filings, {current['meta']['occupations']:,} occupations, "
          f"{current['meta']['legacy_filings_recoded']:,} on 2010 codes recoded, "
          f"{current['meta']['mistyped_filings_recoded']:,} mistyped codes recoded by title")
    print(f"{len(current['edges'])} links shown, {q['louvain']['clusters']} clusters "
          f"({q['louvain']['clusters_of_two_or_more']} of two or more) -> {OUT.relative_to(ROOT)}")
    print(f"NMI {q['nmi']:.3f}, AMI {q['ami']:.3f} over {q['occupations']} occupations; "
          f"shuffled mean {q['nmi_shuffled']['mean']:.3f}, max {q['nmi_shuffled']['max']:.3f}")
    print("null", q["null"], "runs", {k: v for k, v in q["louvain"].items()})
    print("backbone", current["backbone"])
    print(f"bridges: {current['bridges']}; FY2024 vs FY2025 NMI "
          f"{current['comparison']['nmi_between_years']:.3f} on {len(shared)} occupations")


if __name__ == "__main__":
    sys.exit(main())
