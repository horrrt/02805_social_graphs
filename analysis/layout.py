"""Node positions for the network views (networkView() in docs/assets/js/graph.js).

A view takes x from 0 to 1 and y from 0 to its ratio, so a layout keeps its
shape. Every layout here is seeded and built on subgraphs in sorted order, so a
rerun gives the same picture under any hash seed.

    from layout import layout, spread
    pos, ratio = spread(g)   # the giant component, the small components, the isolates
"""

import math

import networkx as nx

SEED = 2805


def fit(pos):
    """Positions scaled so x runs from 0 to 1 and y keeps the same scale, with the
    longer side across; returns (positions, height over width)."""
    xs, ys = [p[0] for p in pos.values()], [p[1] for p in pos.values()]
    if max(ys) - min(ys) > max(xs) - min(xs):
        pos = {n: (y, x) for n, (x, y) in pos.items()}
        xs, ys = ys, xs
    span = (max(xs) - min(xs)) or 1
    out = {n: (round(float((x - min(xs)) / span), 4), round(float((y - min(ys)) / span), 4)) for n, (x, y) in pos.items()}
    return out, round(float((max(ys) - min(ys)) / span), 4)


def layout(g):
    return fit(nx.forceatlas2_layout(g, seed=SEED, max_iter=400, weight="weight", scaling_ratio=2.0, gravity=1.0))


def edges(g):
    """(a, b, data) with a < b, sorted: networkx gives an edge's ends in no fixed order."""
    return sorted((min(a, b), max(a, b), d) for a, b, d in g.edges(data=True))


def ordered(g, keep):
    """The subgraph on `keep` with nodes and edges in sorted order. A networkx
    subgraph of a set lists its nodes in hash order, and the layout depends on it."""
    sub = nx.Graph()
    sub.add_nodes_from(sorted(keep))
    sub.add_edges_from((a, b, d) for a, b, d in edges(g) if a in sub and b in sub)
    return sub


def spread(g):
    """The giant component laid out to fill a disc of radius 1, each other
    component in a small disc below it, and the isolates on a ring just outside."""
    parts = sorted(nx.connected_components(g), key=lambda c: (-len(c), min(c)))
    giant, rest = parts[0], [c for c in parts[1:] if len(c) > 1]
    lone = sorted(n for c in parts[1:] if len(c) == 1 for n in c)

    def disc(nodes, cx, cy, radius):
        sub = ordered(g, nodes)
        # LinLog pulls communities apart (Noack 2007), which is what these views show.
        raw = nx.forceatlas2_layout(sub, seed=SEED, max_iter=600, weight="weight", scaling_ratio=2.0, gravity=1.0, linlog=True)
        xs = [p[0] for p in raw.values()]
        ys = [p[1] for p in raw.values()]
        mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
        far = sorted(math.hypot(x - mx, y - my) for x, y in raw.values())[int(0.97 * (len(raw) - 1))] or 1
        return {n: (cx + radius * (x - mx) / far, cy + radius * (y - my) / far) for n, (x, y) in raw.items()}

    pos = disc(giant, 0.0, 0.0, 1.0)
    for i, c in enumerate(rest):
        pos |= disc(c, 0.95 + 0.3 * i, 0.95, 0.18)
    for i, n in enumerate(lone):
        a = 2 * math.pi * (i + 0.5) / len(lone)
        pos[n] = (1.22 * math.cos(a), 1.22 * math.sin(a))
    return fit(pos)
