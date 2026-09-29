"""Week 4: the brief's concepts the post does not yet show, computed on our own
networks so the design canvas can draw them with real numbers.

Networks
- Metros: the full weighted 40-metro projection from week04_explore.py
  (docs/weeks/week04/data/explore.json, 780 links), with the page's three
  Louvain groups and each metro's Census region from week04_place.json.
- Jobs: the occupation backbone PageRank already runs on
  (week04_pagerank.backbone(), alpha 0.05, 289 occupations).

Questions
- Modularity by hand: what does each of the three metro groups add to Q, and
  does a partition that is "right" by metadata (Census regions) score higher?
- Greedy merging (Newman 2004, Clauset-Newman-Moore): where does the
  bottom-up dendrogram peak, and does it agree with Louvain?
- Weighted paths: with a link's length set to 1/weight, how often is the
  direct link between two metros not their shortest route, and which metros
  do the strong-tie routes run through?
- Eigenvector centrality against PageRank, degree and strength on the jobs
  network: who gains when a link from a node with few partners counts more?
- Resolution: how does Louvain's split change with the resolution gamma?
- Leiden: does it reproduce Louvain's three groups?

Method
- Q per community: sum over c of [w_in(c)/W - (s_c/2W)^2], W the total link
  weight, w_in the weight inside c, s_c the summed strength of c. Checked
  against igraph's modularity to 1e-9.
- Greedy: igraph community_fastgreedy with weights; Q at every cut level.
- Paths: networkx Dijkstra with length 1/weight on all 780 pairs; betweenness
  with the same lengths.
- Eigenvector: networkx eigenvector_centrality_numpy, weighted; PageRank at
  0.85, weighted, as week04_pagerank.py.
- Resolution and Leiden: igraph community_multilevel / community_leiden with
  the modularity objective, 100 seeds each.
- Colour check: the page's three group colours through the Machado et al.
  (2009) deuteranopia and protanopia matrices at severity 1, with WCAG
  relative luminance for the lightness gap.

Stochastic block models need graph-tool, which is not installable with pip;
this script does not fit one.
"""

import json
import random
import statistics
import time
from pathlib import Path

import igraph as ig
import networkx as nx
import numpy as np
from scipy.stats import spearmanr
from sklearn.metrics import normalized_mutual_info_score as nmi

ROOT = Path(__file__).resolve().parents[1]
EXPLORE = ROOT / "docs/weeks/week04/data/explore.json"
PLACE = ROOT / "docs/assets/data/week04_place.json"
OUT = Path(__file__).with_suffix(".json")
GROUP_HEX = {0: "#6d4fd6", 1: "#15896a", 2: "#7a8fac"}  # week04.css --w4-group-0/1/2
SEEDS = 100


def metro_graph():
    ex = json.loads(EXPLORE.read_text())
    place = json.loads(PLACE.read_text())
    names = {m["id"]: m["name"] for m in ex["metros"]}
    page = {m["id"]: m["community"] for m in ex["metros"]}
    census = {c["id"]: c["census"] for c in place["cities"]}
    labels = {c["id"]: c["label"] for c in place["communities"]}
    g = nx.Graph()
    g.add_nodes_from(names)
    for a, b, w in ex["full"]["edges"]:
        g.add_edge(a, b, weight=float(w))
    return g, names, page, census, labels, ex


def to_igraph(g):
    order = list(g.nodes)
    idx = {n: i for i, n in enumerate(order)}
    h = ig.Graph(n=len(order), edges=[(idx[a], idx[b]) for a, b in g.edges])
    h.es["weight"] = [g[a][b]["weight"] for a, b in g.edges]
    h.vs["name"] = order
    return h, order


def q_table(g, part, labels):
    W = g.size(weight="weight")
    rows = []
    for c in sorted(set(part.values())):
        members = {n for n in g if part[n] == c}
        w_in = sum(d["weight"] for a, b, d in g.edges(data=True) if a in members and b in members)
        s_c = sum(dict(g.degree(members, weight="weight")).values())
        rows.append({
            "community": c, "label": labels.get(c, str(c)), "metros": len(members),
            "w_in": w_in, "strength": s_c,
            "inside_share": round(w_in / W, 4), "expected_share": round((s_c / (2 * W)) ** 2, 4),
            "contribution": round(w_in / W - (s_c / (2 * W)) ** 2, 4),
        })
    return W, rows, sum(r["w_in"] / W - (r["strength"] / (2 * W)) ** 2 for r in rows)


def modularity_of(h, order, part):
    return h.modularity(as_codes(part, order), weights="weight")


def as_codes(part, order):
    keys = {v: i for i, v in enumerate(sorted(set(part[n] for n in order), key=str))}
    return [keys[part[n]] for n in order]


def dendrogram_layout(n, merges, names, order):
    """x positions for the leaves and one row per merge, bottom-up."""
    children = {}
    for i, (a, b) in enumerate(merges):
        children[n + i] = (a, b)
    root = n + len(merges) - 1
    leaves = []

    def walk(v):
        if v < n:
            leaves.append(v)
        else:
            walk(children[v][0])
            walk(children[v][1])

    walk(root)
    x = {v: i for i, v in enumerate(leaves)}
    merges_out = []
    for i, (a, b) in enumerate(merges):
        x[n + i] = (x[a] + x[b]) / 2
        merges_out.append({"a": a, "b": b, "node": n + i, "step": i + 1, "x": x[n + i]})
    return {"leaves": [{"id": order[v], "name": names[order[v]], "x": x[v]} for v in leaves],
            "merges": merges_out}


def greedy(g, h, order, names, page):
    d = h.community_fastgreedy(weights="weight")
    n = h.vcount()
    qs = []
    for k in range(n, 0, -1):
        memb = d.as_clustering(k).membership
        qs.append({"groups": k, "Q": round(h.modularity(memb, weights="weight"), 5)})
    best = max(qs, key=lambda r: r["Q"])
    memb = d.as_clustering(best["groups"]).membership
    return {
        "merges": len(d.merges),
        "q_by_groups": qs,
        "best": best,
        "best_partition": {order[i]: memb[i] for i in range(n)},
        "nmi_with_page": round(nmi(as_codes(page, order), memb), 3),
        "layout": dendrogram_layout(n, d.merges, names, order),
    }


def backbone_greedy(ex, names, page):
    """Greedy merging on the same unweighted alpha 0.2 backbone Girvan-Newman runs on,
    so the bottom-up and top-down trees compare like for like. The backbone's
    edges are exactly the links Girvan-Newman cuts."""
    b = nx.Graph()
    b.add_nodes_from(names)
    b.add_edges_from(tuple(c["edge"]) for c in ex["girvan_newman"]["cuts"])
    assert b.number_of_edges() == len(ex["girvan_newman"]["cuts"]) == 180
    order = list(b.nodes)
    idx = {n: i for i, n in enumerate(order)}
    h = ig.Graph(n=len(order), edges=[(idx[a], idx[c]) for a, c in b.edges])
    d = h.community_fastgreedy()
    qs = [{"groups": k, "Q": round(h.modularity(d.as_clustering(k).membership), 5)}
          for k in range(len(order), 0, -1)]
    best = max(qs, key=lambda r: r["Q"])
    memb = d.as_clustering(best["groups"]).membership
    return {"graph": "backbone alpha 0.2, unweighted", "edges": 180, "q_by_groups": qs, "best": best,
            "best_partition": {order[i]: memb[i] for i in range(len(order))},
            "nmi_with_page": round(nmi(as_codes(page, order), memb), 3),
            "layout": dendrogram_layout(len(order), d.merges, names, order)}


def girvan_newman_tree(ex, names):
    """Top-down: the level at which each metro splits off, from the page's own GN run."""
    levels = ex["girvan_newman"]["levels"]
    return [{"step": lv["step"], "components": lv["components"], "Q": lv["Q"],
             "sizes": sorted([list(lv["partition"].values()).count(c) for c in set(lv["partition"].values())],
                             reverse=True)[:3]} for lv in levels]


def weighted_paths(g, names, page):
    for a, b, d in g.edges(data=True):
        d["length"] = 1.0 / d["weight"]
    paths = dict(nx.all_pairs_dijkstra_path(g, weight="length"))
    nodes = sorted(g)
    detour, hops, via = 0, [], {}
    examples = []
    for i, a in enumerate(nodes):
        for b in nodes[i + 1:]:
            p = paths[a][b]
            hops.append(len(p) - 1)
            if len(p) > 2:
                detour += 1
                for m in p[1:-1]:
                    via[m] = via.get(m, 0) + 1
                examples.append({
                    "from": names[a], "to": names[b], "route": [names[x] for x in p],
                    "direct_weight": g[a][b]["weight"],
                    "route_weights": [g[p[k]][p[k + 1]]["weight"] for k in range(len(p) - 1)],
                })
    pairs = len(hops)
    bt = nx.betweenness_centrality(g, weight="length", normalized=False)
    strength = dict(g.degree(weight="weight"))
    top_bt = sorted(bt, key=bt.get, reverse=True)[:8]
    examples.sort(key=lambda e: (-len(e["route"]), e["direct_weight"]))
    return {
        "pairs": pairs, "detour_pairs": detour, "detour_share": round(detour / pairs, 4),
        "hop_counts": {str(k): hops.count(k) for k in sorted(set(hops))},
        "via": sorted(({"metro": names[m], "routes": c, "group": page[m]} for m, c in via.items()),
                      key=lambda r: -r["routes"])[:10],
        "betweenness_top": [{"metro": names[m], "betweenness": round(bt[m], 1),
                             "strength_rank": sorted(strength, key=strength.get, reverse=True).index(m) + 1}
                            for m in top_bt],
        "examples": examples[:6],
        "unweighted_hops_all_pairs": 1,
    }


def resolution_sweep(h, order, page, census):
    rows = []
    for gamma in (0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0):
        counts, nmis_page, nmis_census, qs = [], [], [], []
        for s in range(SEEDS):
            random.seed(s)
            ig.set_random_number_generator(random)
            memb = h.community_multilevel(weights="weight", resolution=gamma).membership
            counts.append(len(set(memb)))
            nmis_page.append(nmi(as_codes(page, order), memb))
            nmis_census.append(nmi(as_codes(census, order), memb))
            qs.append(h.modularity(memb, weights="weight"))
        rows.append({"gamma": gamma, "groups_median": statistics.median(counts),
                     "groups_min": min(counts), "groups_max": max(counts),
                     "nmi_page": round(statistics.median(nmis_page), 3),
                     "nmi_census": round(statistics.median(nmis_census), 3),
                     "Q_gamma1": round(statistics.median(qs), 4)})
    return rows


def leiden(h, order, page):
    target = {frozenset(n for n in order if page[n] == c) for c in set(page.values())}
    same, counts, qs, nmis = 0, [], [], []
    for s in range(SEEDS):
        random.seed(s)
        ig.set_random_number_generator(random)
        cl = h.community_leiden(objective_function="modularity", weights="weight", n_iterations=-1)
        memb = cl.membership
        found = {frozenset(order[i] for i in range(len(order)) if memb[i] == c) for c in set(memb)}
        same += found == target
        counts.append(len(set(memb)))
        qs.append(h.modularity(memb, weights="weight"))
        nmis.append(nmi(as_codes(page, order), memb))
    # Louvain on the same seeds, for the like-for-like comparison.
    lv_same, lv_q = 0, []
    for s in range(SEEDS):
        random.seed(s)
        ig.set_random_number_generator(random)
        memb = h.community_multilevel(weights="weight").membership
        found = {frozenset(order[i] for i in range(len(order)) if memb[i] == c) for c in set(memb)}
        lv_same += found == target
        lv_q.append(h.modularity(memb, weights="weight"))
    return {"runs": SEEDS, "leiden_matches_page": same, "leiden_groups_median": statistics.median(counts),
            "leiden_Q_median": round(statistics.median(qs), 4), "leiden_Q_max": round(max(qs), 4),
            "leiden_nmi_page_median": round(statistics.median(nmis), 3),
            "louvain_matches_page": lv_same, "louvain_Q_median": round(statistics.median(lv_q), 4),
            "note": "the full metro network is complete (780 = C(40,2) links), so no community can be disconnected"}


def eigen_vs_pagerank():
    import week04_pagerank as pr
    g, _full, filings, titles = pr.backbone()
    ev = nx.eigenvector_centrality_numpy(g, weight="weight")
    p = nx.pagerank(g, alpha=0.85, weight="weight")
    deg = dict(g.degree())
    st = dict(g.degree(weight="weight"))
    nodes = list(g)

    def ranks(d):
        s = sorted(nodes, key=lambda n: -d[n])
        return {n: i + 1 for i, n in enumerate(s)}

    r_ev, r_pr, r_deg, r_st = ranks(ev), ranks(p), ranks(deg), ranks(st)
    col = lambda d: [d[n] for n in nodes]
    top = sorted(nodes, key=lambda n: r_ev[n])[:15]
    # Who PageRank lifts most among the top 40 by either score, and who it drops.
    pool = [n for n in nodes if r_ev[n] <= 40 or r_pr[n] <= 40]
    gains = sorted(pool, key=lambda n: r_pr[n] - r_ev[n])
    row = lambda n: {"code": n, "title": titles.get(n, n), "eigen_rank": r_ev[n], "pagerank_rank": r_pr[n],
                     "degree": deg[n], "degree_rank": r_deg[n], "strength_rank": r_st[n],
                     "eigen": round(ev[n], 4), "pagerank": round(p[n], 5)}
    return {
        "network": "jobs backbone, alpha 0.05 (as week04_pagerank.py)", "nodes": g.number_of_nodes(),
        "edges": g.number_of_edges(),
        "spearman": {
            "eigen_pagerank": round(spearmanr(col(ev), col(p)).statistic, 3),
            "eigen_degree": round(spearmanr(col(ev), col(deg)).statistic, 3),
            "eigen_strength": round(spearmanr(col(ev), col(st)).statistic, 3),
            "pagerank_degree": round(spearmanr(col(p), col(deg)).statistic, 3),
            "pagerank_strength": round(spearmanr(col(p), col(st)).statistic, 3),
        },
        "top15_overlap_eigen_pagerank": len(set(top) & set(sorted(nodes, key=lambda n: r_pr[n])[:15])),
        "top15_eigen": [row(n) for n in top],
        "pagerank_lifts": [row(n) for n in gains[:5]],
        "pagerank_drops": [row(n) for n in gains[::-1][:5]],
    }


def colour_check():
    # Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear RGB.
    M = {
        "deuteranopia": np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413],
                                  [-0.011820, 0.042940, 0.968881]]),
        "protanopia": np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216],
                                [-0.003882, -0.048116, 1.051998]]),
    }

    def lin(hexs):
        c = np.array([int(hexs[i:i + 2], 16) / 255 for i in (1, 3, 5)])
        return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

    def to_hex(l):
        l = np.clip(l, 0, 1)
        c = np.where(l <= 0.0031308, 12.92 * l, 1.055 * l ** (1 / 2.4) - 0.055)
        return "#" + "".join(f"{round(v * 255):02x}" for v in c)

    lum = lambda l: float(np.dot([0.2126, 0.7152, 0.0722], np.clip(l, 0, 1)))
    out = {}
    for k, hx in GROUP_HEX.items():
        l = lin(hx)
        out[k] = {"hex": hx, "luminance": round(lum(l), 3),
                  **{v: to_hex(m @ l) for v, m in M.items()}}
    return out


def main():
    t0 = time.time()
    g, names, page, census, labels, ex = metro_graph()
    h, order = to_igraph(g)
    W, rows, q = q_table(g, page, labels)
    assert abs(q - modularity_of(h, order, page)) < 1e-9, (q, modularity_of(h, order, page))
    rng = random.Random(0)
    shuffled = []
    vals = [page[n] for n in order]
    for _ in range(1000):
        rng.shuffle(vals)
        shuffled.append(h.modularity(vals, weights="weight"))
    one = {n: 0 for n in order}
    census_rows = q_table(g, census, {})[1]
    grouped_vs_right = {
        "louvain_groups": round(q, 4),
        "census_regions": round(modularity_of(h, order, census), 4),
        "everything_in_one": round(modularity_of(h, order, one), 4),
        "shuffled_groups_mean": round(statistics.mean(shuffled), 4),
        "shuffled_groups_sd": round(statistics.stdev(shuffled), 4),
        "census_table": census_rows,
    }
    out = {
        "generated_by": "analysis/week04_brief_gaps.py", "year": ex["year"],
        "metros": {"nodes": g.number_of_nodes(), "edges": g.number_of_edges(), "total_weight": W},
        "modularity_by_hand": {"rows": rows, "Q": round(q, 4)},
        "grouped_vs_right": grouped_vs_right,
        "greedy": greedy(g, h, order, names, page),
        "greedy_backbone": backbone_greedy(ex, names, page),
        "girvan_newman_levels": girvan_newman_tree(ex, names),
        "weighted_paths": weighted_paths(g, names, page),
        "resolution": resolution_sweep(h, order, page, census),
        "resolution_limit_sqrt_2W": round((2 * W) ** 0.5, 1),
        "leiden": leiden(h, order, page),
        "eigenvector": eigen_vs_pagerank(),
        "colours": colour_check(),
        "sbm": "not fitted: graph-tool is not pip-installable",
    }
    out["seconds"] = round(time.time() - t0, 1)
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(json.dumps({k: out[k] for k in ("modularity_by_hand", "leiden", "resolution_limit_sqrt_2W")}, indent=1))
    print("grouped_vs_right", {k: v for k, v in grouped_vs_right.items() if k != "census_table"})
    print("greedy backbone", out["greedy_backbone"]["best"], out["greedy_backbone"]["nmi_with_page"])
    print("greedy best", out["greedy"]["best"], "nmi", out["greedy"]["nmi_with_page"])
    wp = out["weighted_paths"]
    print("paths", wp["detour_share"], wp["hop_counts"], wp["via"][:5], wp["examples"][:2])
    print("resolution", out["resolution"])
    ev = out["eigenvector"]
    print("eigen", ev["spearman"], ev["top15_overlap_eigen_pagerank"])
    print("lifts", [(r["title"], r["eigen_rank"], r["pagerank_rank"], r["degree"]) for r in ev["pagerank_lifts"]])
    print("drops", [(r["title"], r["eigen_rank"], r["pagerank_rank"], r["degree"]) for r in ev["pagerank_drops"]])
    print("colours", out["colours"])
    print(f"{out['seconds']} s")


if __name__ == "__main__":
    main()
