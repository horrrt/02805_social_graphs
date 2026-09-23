"""Week 4, section 2: Which jobs go together?  Owner: Niklas.

Network: companies x occupations (SOC code), projected onto occupations. Two
jobs are linked when the same companies hire both; weight = positions.
Week 4 methods: backbone (disparity filter, several alpha), then overlapping
communities (link communities or k-cliques).

Questions
- Which jobs are hired together?
- Which jobs belong to two clusters at once?
- Do the clusters follow the official job groups?

Inputs: load("lca_fy2025") (SOC_CODE, SOC_TITLE, EMPLOYER_NAME), and
load("lca_fy2024") for the stability check. The first two digits of a SOC
code are its major group; the labels are carried by the LCA file.
Identify companies with week04_names.employer(EMPLOYER_NAME).

Checks the post needs
- NMI between clusters and SOC major groups, against shuffled groups.
- 100 Louvain seeds, or the stability of the overlap across runs.
- FY2024 against FY2025.

Output: analysis/week04_jobs.json (every number the section quotes).
"""

import itertools
import json
import math
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path

import networkx as nx

from week04_data import load
from week04_names import employer


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "weeks" / "week04" / "data" / "jobs.json"


def clean(value):
    return str(value).strip()


def filtered(year):
    frame = load(f"lca_fy{year}")
    frame = frame[frame["CASE_STATUS"].str.startswith("Certified")]
    frame = frame[frame["VISA_CLASS"] == "H-1B"]
    frame = frame[frame["SOC_CODE"].str.match(r"^\d{2}-\d{4}", na=False)]
    frame = frame[frame["EMPLOYER_NAME"].str.strip() != ""]
    frame["occupation"] = frame["SOC_CODE"].map(lambda code: clean(code)[:7])
    frame["company"] = frame["EMPLOYER_NAME"].map(employer)
    return frame


def projection(frame):
    titles = {}
    company_jobs = defaultdict(set)
    filings = Counter()
    for row in frame[["company", "occupation", "SOC_TITLE"]].itertuples(index=False):
        company, occupation, title = row
        company_jobs[company].add(occupation)
        filings[occupation] += 1
        titles.setdefault(occupation, clean(title))

    graph = nx.Graph()
    graph.add_nodes_from(filings)
    for jobs in company_jobs.values():
        for left, right in itertools.combinations(sorted(jobs), 2):
            if graph.has_edge(left, right):
                graph[left][right]["weight"] += 1
            else:
                graph.add_edge(left, right, weight=1)
    return graph, titles, filings


def communities(graph):
    runs = [nx.community.louvain_communities(graph, weight="weight", seed=seed)
            for seed in range(100)]
    scores = [nx.community.modularity(graph, groups, weight="weight") for groups in runs]
    best = runs[scores.index(max(scores))]
    labels = {node: i for i, group in enumerate(best) for node in group}
    membership = defaultdict(list)
    for node, cluster in labels.items():
        membership[node].append(cluster)
    for node in graph:
        totals = Counter()
        for neighbor, edge in graph[node].items():
            totals[labels[neighbor]] += edge["weight"]
        ranked = totals.most_common(2)
        if len(ranked) > 1 and ranked[1][1] >= max(2, ranked[0][1] * 0.35):
            membership[node].append(ranked[1][0])
    return labels, membership, {
        "runs": len(runs),
        "modularity_mean": sum(scores) / len(scores),
        "modularity_best": max(scores),
    }


def nmi(left, right):
    total = len(left)
    left_counts = Counter(left)
    right_counts = Counter(right)
    joint = Counter(zip(left, right))
    hx = -sum((count / total) * math.log(count / total) for count in left_counts.values())
    hy = -sum((count / total) * math.log(count / total) for count in right_counts.values())
    mutual = sum(
        (count / total) * math.log((count * total) / (left_counts[a] * right_counts[b]))
        for (a, b), count in joint.items()
    )
    return 2 * mutual / (hx + hy) if hx + hy else 0.0


def nmi_against_soc(labels, graph):
    nodes = list(labels)
    observed = nmi([labels[node] for node in nodes], [node[:2] for node in nodes])
    rng = random.Random(204)
    major = [node[:2] for node in nodes]
    shuffled = []
    for _ in range(100):
        sample = major[:]
        rng.shuffle(sample)
        shuffled.append(nmi([labels[node] for node in nodes], sample))
    return observed, {"runs": len(shuffled), "mean": sum(shuffled) / len(shuffled),
                      "max": max(shuffled)}


def build(year):
    frame = filtered(year)
    graph, titles, filings = projection(frame)
    labels, membership, stability = communities(graph)
    observed_nmi, shuffled_nmi = nmi_against_soc(labels, graph)
    top_nodes = set(sorted(filings, key=filings.get, reverse=True)[:60])
    edges = [
        {"source": left, "target": right, "weight": graph[left][right]["weight"]}
        for left, right in graph.edges
        if left in top_nodes and right in top_nodes and graph[left][right]["weight"] >= 3
    ]
    edges.sort(key=lambda edge: edge["weight"], reverse=True)
    groups = defaultdict(list)
    for node in top_nodes:
        groups[labels[node]].append(node)
    nodes = []
    for node in sorted(top_nodes, key=filings.get, reverse=True):
        bridge = len(membership[node]) > 1
        nodes.append({
            "id": node,
            "title": titles[node],
            "major": node[:2],
            "filings": filings[node],
            "cluster": labels[node],
            "clusters": membership[node],
            "bridge": bridge,
        })
    cluster_rows = [
        {"id": cluster, "occupations": sorted(values, key=filings.get, reverse=True)[:12]}
        for cluster, values in sorted(groups.items(), key=lambda item: len(item[1]), reverse=True)
    ]
    pairs = edges[:20]
    return {
        "meta": {"year": year, "filings": len(frame), "occupations": len(graph),
                 "scope": "Certified H-1B filings; edges count shared employers",
                 "script": "analysis/week04_jobs.py"},
        "nodes": nodes,
        "edges": edges[:120],
        "pairs": pairs,
        "clusters": cluster_rows,
        "quality": {"louvain": stability, "nmi": observed_nmi, "nmi_shuffled": shuffled_nmi},
    }


def main():
    current = build(2025)
    previous = build(2024)
    current["comparison"] = {
        "year": 2024,
        "filings": previous["meta"]["filings"],
        "occupations": previous["meta"]["occupations"],
        "nmi": previous["quality"]["nmi"],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(current, separators=(",", ":")), encoding="utf-8")
    print(f"{current['meta']['filings']:,} filings, {current['meta']['occupations']:,} occupations")
    print(f"{len(current['edges']):,} edges, {len(current['clusters']):,} clusters -> {OUT.relative_to(ROOT)}")
    print(f"NMI {current['quality']['nmi']:.3f}; shuffled mean {current['quality']['nmi_shuffled']['mean']:.3f}")


if __name__ == "__main__":
    sys.exit(main())


def main():
    lca = load("lca_fy2025")
    lca = lca[lca["CASE_STATUS"].str.startswith("Certified") & (lca["VISA_CLASS"] == "H-1B")]
    print(f"{len(lca):,} certified H-1B filings, {lca['SOC_CODE'].nunique():,} occupations")
    # TODO: company (FEIN) x SOC weights; projection onto SOC; disparity
    # filter; overlapping communities; NMI against major groups; write the json.


if __name__ == "__main__":
    main()
