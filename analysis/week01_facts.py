"""Week 1: every number the site quotes, computed once and printed."""
import json
import numpy as np
import pandas as pd
import networkx as nx

DATA = "data"

nodes = pd.read_csv(f"{DATA}/week1_nodes.tsv", sep="\t", comment="#")
edges = pd.read_csv(f"{DATA}/week1_edges.tsv", sep="\t", comment="#",
                    names=["source", "target"])

D = nx.DiGraph()
D.add_nodes_from(nodes.node_id)          # isolates survive because of this line
D.add_edges_from(edges.itertuples(index=False, name=None))

name = dict(zip(nodes.node_id, nodes.name))
url = dict(zip(nodes.node_id, nodes.url))
blurb = dict(zip(nodes.node_id, nodes.description))
N = D.number_of_nodes()
U = D.to_undirected()

kin = dict(D.in_degree())
kout = dict(D.out_degree())

f = {}
f["n_nodes"] = N
f["n_arcs"] = D.number_of_edges()
f["n_undirected"] = U.number_of_edges()
f["mean_degree"] = round(2 * U.number_of_edges() / N, 3)
f["isolates"] = sorted(nx.isolates(D))
f["n_isolates"] = len(f["isolates"])
f["mutual_pairs"] = sum(1 for u, v in D.edges() if D.has_edge(v, u)) // 2
f["reciprocity"] = round(nx.reciprocity(D), 4)
f["density"] = round(nx.density(D), 5)

# --- components -------------------------------------------------------------
wcc = sorted(nx.weakly_connected_components(D), key=len, reverse=True)
f["n_wcc"] = len(wcc)
f["wcc_sizes"] = [len(c) for c in wcc]
giant = wcc[0]
f["giant_size"] = len(giant)
f["giant_share"] = round(100 * len(giant) / N, 1)
f["islands"] = [sorted(c) for c in wcc[1:] if len(c) > 1]
f["n_island_members"] = sum(len(c) for c in f["islands"])

scc = sorted(nx.strongly_connected_components(D), key=len, reverse=True)
f["n_scc"] = len(scc)
f["largest_scc"] = len(scc[0])
f["scc_size_hist"] = dict(sorted(pd.Series([len(c) for c in scc]).value_counts().items()))

Gg = D.subgraph(giant).to_undirected()
f["giant_diameter"] = nx.diameter(Gg)
f["giant_avg_path"] = round(nx.average_shortest_path_length(Gg), 3)
f["avg_clustering"] = round(nx.average_clustering(U), 4)

# --- leaderboards -----------------------------------------------------------
def top(dv, n=10):
    return [{"id": k, "name": name[k], "k": v, "kin": kin[k], "kout": kout[k]}
            for k, v in sorted(dv.items(), key=lambda kv: (-kv[1], name[kv[0]]))[:n]]

f["top_in"] = top(kin)
f["top_out"] = top(kout)
f["spiderman_share"] = round(100 * kin["Spider-Man"] / (N - 1), 1)

# overlap between the two top-10s
f["top10_overlap"] = sorted({r["id"] for r in f["top_in"][:10]} &
                            {r["id"] for r in f["top_out"][:10]})

# --- in vs out --------------------------------------------------------------
a = np.array([kin[n_] for n_ in D])
b = np.array([kout[n_] for n_ in D])
f["pearson_in_out"] = round(float(np.corrcoef(a, b)[0, 1]), 3)
live = (a + b) > 0
f["pearson_in_out_nonisolate"] = round(float(np.corrcoef(a[live], b[live])[0, 1]), 3)
f["spearman_in_out"] = round(float(pd.Series(a).corr(pd.Series(b), method="spearman")), 3)
f["max_in"], f["max_out"] = int(a.max()), int(b.max())
f["zero_in"], f["zero_out"] = int((a == 0).sum()), int((b == 0).sum())

# most lopsided characters, by ratio, among the reasonably connected
ratio = []
for n_ in D:
    if kin[n_] + kout[n_] >= 12:
        ratio.append((n_, kin[n_] - kout[n_], kin[n_], kout[n_]))
ratio.sort(key=lambda r: r[1])
f["most_outward"] = [{"name": name[r[0]], "kin": r[2], "kout": r[3]} for r in ratio[:6]]
f["most_inward"] = [{"name": name[r[0]], "kin": r[2], "kout": r[3]} for r in ratio[::-1][:6]]

# --- write ------------------------------------------------------------------
def jsonable(o):
    if isinstance(o, (np.integer,)): return int(o)
    if isinstance(o, (np.floating,)): return float(o)
    raise TypeError(o)

with open("analysis/week01_facts.json", "w") as fh:
    json.dump(f, fh, indent=1, default=jsonable)

for k, v in f.items():
    s = str(v)
    print(f"{k:26} {s[:150]}")
