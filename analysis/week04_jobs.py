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
- Occupations are 2018 SOC codes. The few filings still on 2010 computer codes
  are moved to their 2018 successors (LEGACY). Each code takes its title from
  its base ".00" rows, not from an O*NET sub-title.
- Louvain (igraph's multilevel) on the full projection, 100 seeds, the best
  modularity run kept.
- A second cluster: an occupation also belongs to another cluster when its
  employer ties to that cluster exceed what the cluster's size predicts
  (observed weight over k_i * S_c / 2m, the expectation modularity uses).
- NMI and adjusted mutual information (AMI) between clusters and SOC major
  groups, over occupations in clusters of two or more, against 100 shuffles
  of the major-group labels. The same partition for FY2024, compared on the
  occupations both years share.
- Infomap on the same projection, compared with Louvain and the SOC groups.

The page shows the 60 occupations with the most filings, each with its three
strongest links to the others.

Output: docs/weeks/week04/data/jobs.json (every number the section quotes).
"""

import itertools
import json
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path

import networkx as nx
from sklearn.metrics import adjusted_mutual_info_score as ami
from sklearn.metrics import normalized_mutual_info_score as nmi

from week04_schemas import check
from week04_staffing import certified, infomap, louvain

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "weeks" / "week04" / "data" / "jobs.json"
SHOWN = 60
LINKS_PER_NODE = 3
PARTNERS = 5
SEED = 204

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


def filtered(year):
    frame = certified(year)
    frame = frame[frame["SOC_CODE"].str.match(r"^\d{2}-\d{4}", na=False)].copy()
    code = frame["SOC_CODE"].str.strip().str[:7]
    frame["legacy"] = code.isin(LEGACY)
    frame["occupation"] = code.replace(LEGACY)
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


def communities(graph):
    found = [louvain(graph, seed) for seed in range(100)]
    runs, scores = [r for r, _ in found], [q for _, q in found]
    best = runs[scores.index(max(scores))]
    # Clusters numbered by size, largest first, so labels read 1, 2, 3.
    best = sorted(best, key=lambda g: (-len(g), min(g)))
    labels = {node: i for i, group in enumerate(best) for node in group}
    return labels, {"runs": len(runs), "modularity_mean": sum(scores) / len(scores),
                    "modularity_best": max(scores), "clusters": len(best),
                    "clusters_of_two_or_more": sum(len(g) > 1 for g in best)}


def second_clusters(graph, labels):
    """An occupation's clusters: its own, plus the other cluster its employer ties
    exceed most over what that cluster's size predicts (lift above 1), if any."""
    strength = dict(graph.degree(weight="weight"))
    total = sum(strength.values())  # 2m
    cluster_strength = Counter()
    for node, c in labels.items():
        cluster_strength[c] += strength[node]
    membership = {}
    for node in graph:
        ties = Counter()
        for other, edge in graph[node].items():
            ties[labels[other]] += edge["weight"]
        own = labels[node]
        lift = {c: w / (strength[node] * cluster_strength[c] / total)
                for c, w in ties.items() if c != own and strength[node]}
        best = max(lift, key=lift.get, default=None)
        membership[node] = [own] + ([best] if best is not None and lift[best] > 1 else [])
    return membership


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


def build(year):
    frame = filtered(year)
    titles = titles_of(frame)
    graph, filings = projection(frame)
    labels, louvain_stats = communities(graph)
    membership = second_clusters(graph, labels)
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

    nodes = []
    for node in shown:
        partners = sorted(graph[node].items(), key=lambda kv: (-kv[1]["weight"], kv[0]))[:PARTNERS]
        nodes.append({
            "id": node, "title": titles[node], "major": node[:2], "filings": filings[node],
            "cluster": labels[node], "clusters": membership[node],
            "bridge": len(membership[node]) > 1,
            "partners": [[o, titles[o], e["weight"]] for o, e in partners],
        })
    shown_clusters = sorted({labels[n] for n in shown})
    size = Counter(labels.values())
    clusters = []
    for c in shown_clusters:
        members = sorted((n for n in graph if labels[n] == c), key=lambda n: (-filings[n], n))
        clusters.append({"id": c, "label": titles[members[0]], "occupations": size[c],
                         "top": members[:12]})
    return {
        "meta": {"year": year, "filings": len(frame), "occupations": graph.number_of_nodes(),
                 "legacy_filings_recoded": int(frame["legacy"].sum()),
                 "companies": int(frame["company"].nunique()),
                 "scope": "Certified H-1B filings; a link counts the companies filing for both",
                 "script": "analysis/week04_jobs.py"},
        "majors": {m: MAJOR_GROUPS.get(m, m) for m in sorted({n[:2] for n in shown})},
        "nodes": nodes,
        "edges": edges,
        "pairs": pairs,
        "clusters": clusters,
        "bridges": {"shown": sum(n["bridge"] for n in nodes),
                    "all_occupations": sum(len(m) > 1 for m in membership.values())},
        "quality": {"louvain": louvain_stats, **agreement(labels, graph), "infomap": infomap_check},
        "_labels": labels,
    }


def main():
    current = build(2025)
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
          f"{current['meta']['legacy_filings_recoded']:,} on 2010 codes recoded")
    print(f"{len(current['edges'])} links shown, {q['louvain']['clusters']} clusters "
          f"({q['louvain']['clusters_of_two_or_more']} of two or more) -> {OUT.relative_to(ROOT)}")
    print(f"NMI {q['nmi']:.3f}, AMI {q['ami']:.3f} over {q['occupations']} occupations; "
          f"shuffled mean {q['nmi_shuffled']['mean']:.3f}, max {q['nmi_shuffled']['max']:.3f}")
    print(f"bridges: {current['bridges']}; FY2024 vs FY2025 NMI "
          f"{current['comparison']['nmi_between_years']:.3f} on {len(shared)} occupations")


if __name__ == "__main__":
    sys.exit(main())
