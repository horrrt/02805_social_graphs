"""Week 1 site figures. White ground, three-colour palette carried over from notebook 01."""
import json
import numpy as np
import pandas as pd
import networkx as nx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from matplotlib.colors import LinearSegmentedColormap

BLUE, ORANGE, GREEN = "#2a78d6", "#eb6834", "#1baf7a"
INK, MUTED, GRID, PAPER = "#1c1c1c", "#7a7a7a", "#e4e4e4", "#ffffff"
plt.rcParams.update({
    "font.family": ["Helvetica Neue", "Helvetica", "Arial", "DejaVu Sans"],
    "figure.facecolor": PAPER, "axes.facecolor": PAPER, "savefig.facecolor": PAPER,
})
OUT = "docs/weeks/week01/figures"

nodes = pd.read_csv("data/week1_nodes.tsv", sep="\t", comment="#")
edges = pd.read_csv("data/week1_edges.tsv", sep="\t", comment="#",
                    names=["source", "target"])
D = nx.DiGraph()
D.add_nodes_from(nodes.node_id)
D.add_edges_from(edges.itertuples(index=False, name=None))
name = dict(zip(nodes.node_id, nodes.name))
url = dict(zip(nodes.node_id, nodes.url))
N = D.number_of_nodes()
kin, kout = dict(D.in_degree()), dict(D.out_degree())

wcc = sorted(nx.weakly_connected_components(D), key=len, reverse=True)
giant, island = wcc[0], wcc[1]
isolates = sorted(nx.isolates(D))

def style(ax, xlabel, ylabel, title=None):
    ax.set_xlabel(xlabel, fontsize=9, color=MUTED)
    ax.set_ylabel(ylabel, fontsize=9, color=MUTED)
    ax.tick_params(labelsize=8, colors=MUTED, length=0)
    ax.grid(True, color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    for s in ax.spines.values():
        s.set_visible(False)
    if title:
        ax.set_title(title, fontsize=10.5, color=INK, loc="left", pad=10)

def halo(t):
    t.set_path_effects([pe.withStroke(linewidth=2.6, foreground="white")])

# ---------------------------------------------------------------- 1. the map
def figure_map():
    Gg = D.subgraph(giant).to_undirected()
    pos = nx.spring_layout(Gg, k=0.55, iterations=600, seed=7)
    P = np.array([pos[n] for n in Gg])
    P = P - P.mean(0)
    P = P / np.linalg.norm(P, axis=1).max()
    r = np.linalg.norm(P, axis=1, keepdims=True)          # decongest the core:
    P = P * (r ** 0.62) / np.where(r == 0, 1, r)          # push r -> r^0.62
    pos = {n: p for n, p in zip(Gg, P)}

    Gi = D.subgraph(island).to_undirected()
    ip = nx.spring_layout(Gi, k=1.0, iterations=400, seed=3)
    IP = np.array([ip[n] for n in Gi])
    IP = (IP - IP.mean(0)) / np.abs(IP - IP.mean(0)).max() * 0.30
    pos.update({n: p + np.array([1.60, 0.52]) for n, p in zip(Gi, IP)})

    for i, n in enumerate(isolates):                       # tidy grid, 6 wide
        pos[n] = np.array([1.36 + 0.115 * (i % 6), -0.46 - 0.115 * (i // 6)])

    fig, ax = plt.subplots(figsize=(13.2, 7.6))
    for u, v in D.to_undirected().edges():
        x0, y0 = pos[u]; x1, y1 = pos[v]
        ax.plot([x0, x1], [y0, y1], color="#8fa9c6", linewidth=0.3, alpha=0.30,
                zorder=1, solid_capstyle="round")

    cmap = LinearSegmentedColormap.from_list("b", ["#d3e2f4", "#2a78d6", "#0e2f57"])
    for group, colour in [(giant, None), (island, ORANGE), (set(isolates), GREEN)]:
        ns = list(group)
        xy = np.array([pos[n] for n in ns])
        sz = np.array([22 + 13 * np.sqrt(kin[n] + kout[n]) for n in ns])
        c = cmap(np.array([kin[n] for n in ns]) ** 0.45 / 106 ** 0.45) if colour is None else colour
        ax.scatter(xy[:, 0], xy[:, 1], s=sz, c=c, linewidths=0.7,
                   edgecolors="white", zorder=3)

    # six hubs, labels pushed outward onto a ring with a thin leader line
    hubs = sorted(giant, key=lambda n: -kin[n])[:6]
    hubs.sort(key=lambda n: np.arctan2(*pos[n][::-1]))
    for n in hubs:
        p = pos[n]
        ang = np.arctan2(p[1], p[0])
        anchor = np.array([np.cos(ang), np.sin(ang)]) * 1.14
        ax.plot([p[0], anchor[0]], [p[1], anchor[1]], color="#c8c8c8",
                linewidth=0.7, zorder=2)
        ha = "left" if anchor[0] >= 0 else "right"
        pad = 0.03 if ha == "left" else -0.03
        halo(ax.text(anchor[0] + pad, anchor[1], name[n].split(" (")[0],
                     fontsize=9.4, color=INK, va="center", ha=ha, zorder=5))

    halo(ax.text(1.60, 0.94, "Strikeforce: Morituri", fontsize=10, color=ORANGE,
                 ha="center", weight="bold", zorder=4))
    halo(ax.text(1.60, 0.86, "nine characters, sealed off from the rest",
                 fontsize=8.4, color=MUTED, ha="center", zorder=4))
    halo(ax.text(1.70, -0.26, "The 17 isolates", fontsize=10, color=GREEN,
                 ha="center", weight="bold", zorder=4))
    halo(ax.text(1.70, -0.34, "no link in either direction", fontsize=8.4,
                 color=MUTED, ha="center", zorder=4))
    ax.set_xlim(-1.42, 2.14); ax.set_ylim(-1.05, 1.05)
    ax.axis("off")
    fig.tight_layout(pad=0.1)
    fig.savefig(f"{OUT}/map.png", dpi=210, bbox_inches="tight")
    plt.close(fig)

# ------------------------------------------------------- 2. the distributions
def raw_pk(deg, n):
    u, c = np.unique(np.asarray(deg) + 1, return_counts=True)
    return u, c / n

def figure_dist():
    k_in = [d for _, d in D.in_degree()]
    k_out = [d for _, d in D.out_degree()]
    fig, axes = plt.subplots(2, 2, figsize=(11, 7.6))
    for row, (label, ks, colour) in enumerate([("In-degree", k_in, BLUE),
                                               ("Out-degree", k_out, ORANGE)]):
        u, p = raw_pk(ks, N)
        for col, logscale in enumerate([False, True]):
            ax = axes[row, col]
            ax.plot(u, p, "o", color=colour, markersize=5, markeredgecolor="white",
                    markeredgewidth=0.6)
            if logscale:
                ax.set_xscale("log"); ax.set_yscale("log")
            style(ax, "k + 1", "P(k)",
                  f"{label}, {'log-log' if logscale else 'linear'} axes")
    fig.tight_layout()
    fig.savefig(f"{OUT}/degree_distributions.png", dpi=210, bbox_inches="tight")
    plt.close(fig)

# ------------------------------------------------------------- 3. in vs out
def figure_scatter():
    fig, ax = plt.subplots(figsize=(9.4, 6.4))
    rng = np.random.default_rng(1)
    xs = np.array([kout[n] for n in D], float) + rng.normal(0, .09, N)
    ys = np.array([kin[n] for n in D], float) + rng.normal(0, .09, N)
    ax.plot([0, 30], [0, 30], color=GRID, linewidth=1.2, zorder=1)
    halo(ax.text(27.5, 28.6, "in = out", fontsize=8, color=MUTED, ha="right"))
    ax.scatter(xs, ys, s=30, c=BLUE, alpha=.45, linewidths=.6,
               edgecolors="white", zorder=2)
    picks = ["Spider-Man", "Hulk", "Wolverine_(character)", "Doctor_Strange",
             "Betsy_Braddock", "Adam_Warlock", "Noh-Varr", "U.S._Agent",
             "Cloak_and_Dagger_(characters)", "She-Hulk", "Deadpool",
             "Quasar_(character)"]
    for n in picks:
        c = ORANGE if kout[n] > kin[n] else INK
        halo(ax.text(kout[n] + .55, kin[n] + .7, name[n].split(" (")[0],
                     fontsize=8.4, color=c, zorder=4))
        ax.scatter([kout[n]], [kin[n]], s=42, c=c, zorder=3,
                   linewidths=.8, edgecolors="white")
    style(ax, "out-degree   (links this article writes)",
          "in-degree   (links other articles give it)",
          "Two different populations")
    ax.set_xlim(-1, 35); ax.set_ylim(-3, 114)
    fig.tight_layout()
    fig.savefig(f"{OUT}/in_vs_out.png", dpi=210, bbox_inches="tight")
    plt.close(fig)

# ------------------------------------------------------------- 4. the island
def figure_island():
    fig, ax = plt.subplots(figsize=(9, 6))
    S = D.subgraph(island)
    pos = nx.spring_layout(S.to_undirected(), k=1.1, iterations=500, seed=11)
    for u, v in S.edges():
        x0, y0 = pos[u]; x1, y1 = pos[v]
        both = S.has_edge(v, u)
        ax.annotate("", xy=(x1, y1), xytext=(x0, y0), zorder=1,
                    arrowprops=dict(arrowstyle="-|>", color=ORANGE if both else "#f0b39b",
                                    linewidth=1.1 if both else .9, alpha=.85,
                                    shrinkA=13, shrinkB=15,
                                    connectionstyle="arc3,rad=0.13"))
    for n in S:
        ax.scatter(*pos[n], s=270, c="white", edgecolors=ORANGE,
                   linewidths=1.8, zorder=3)
        halo(ax.text(pos[n][0], pos[n][1] - .155, name[n].split(" (")[0],
                     fontsize=8.6, color=INK, ha="center", zorder=4))
    ax.axis("off")
    ax.set_title("The only island: nine characters from Strikeforce: Morituri (1986)\n"
                 "22 arcs among themselves, zero to the other 294",
                 fontsize=10.5, color=INK, loc="left", pad=14)
    ax.margins(.16)
    fig.tight_layout()
    fig.savefig(f"{OUT}/island.png", dpi=210, bbox_inches="tight")
    plt.close(fig)

# --------------------------------------------------- 5. json for the d3 graph
def export_json():
    comp = {}
    for n in giant: comp[n] = "giant"
    for n in island: comp[n] = "island"
    for n in isolates: comp[n] = "isolate"
    payload = {
        "nodes": [{"id": n, "name": name[n], "url": url[n],
                   "kin": kin[n], "kout": kout[n], "grp": comp[n]} for n in D],
        "links": [{"s": u, "t": v} for u, v in D.edges()],
    }
    with open("docs/assets/data/marvel_week1.json", "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))

for fn in (figure_map, figure_dist, figure_scatter, figure_island, export_json):
    fn(); print("done:", fn.__name__)
