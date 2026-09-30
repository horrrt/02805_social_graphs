"""Data for the network views on docs/styleguide/kit.html.

Four real networks and one toy, each with node positions laid out here so the
page draws the same picture every time:

- karate: Zachary's karate club (Zachary 1977, via networkx), 34 members and 78
  friendships, split into the two clubs it broke into.
- marvel: the course's 303 Marvel pages and their weighted links, coloured by the
  consensus communities of week 5 section 4 (docs/weeks/week05/data/communities.json);
  the Morituri component and the 17 isolates have no colour. One hub per group,
  the page with the most link weight.
- pair: the two Marvel groups joined by the most link weight, with the heaviest
  link between them marked; a link's weight is how often A's page links to B's
  plus how often B's links to A's.
- overlap: a toy example, not data: two groups that share one node (E) and a
  node in no group (K), laid out by hand.

Layouts: ForceAtlas2 (networkx), seed SEED; isolates go on a ring outside.

    python analysis/styleguide_graphs.py
"""

import json
from pathlib import Path

import networkx as nx

from layout import SEED, edges, layout, ordered, spread
from week05_text import nodes, weighted

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/styleguide/data/graphs.json"
COMMUNITIES = ROOT / "docs/weeks/week05/data/communities.json"
GROUPS = 8


def karate():
    g = nx.karate_club_graph()
    pos, ratio = layout(g)
    return {
        "ratio": ratio,
        "source": "Zachary (1977), An information flow model for conflict and fission in small groups; networkx karate_club_graph()",
        "groups": ["Mr. Hi's club", "The officer's club"],
        "nodes": [{"id": str(n), "label": str(n), "x": pos[n][0], "y": pos[n][1],
                   "group": 0 if g.nodes[n]["club"] == "Mr. Hi" else 1} for n in sorted(g)],
        "links": [{"source": str(a), "target": str(b), "weight": int(d["weight"])} for a, b, d in edges(g)],
    }


def marvel():
    g = weighted()
    names = dict(zip(nodes().node_id, nodes().node_id.str.replace("_", " ")))
    comm = json.loads(COMMUNITIES.read_text())
    membership = comm["membership"]
    labels = [c["label"] for c in comm["communities"]]
    group = {n: (k if k < GROUPS and comm["communities"][k]["where"] == "giant" else None) for n, k in membership.items()}
    pos, ratio = spread(g)
    strength = {n: int(w) for n, w in g.degree(weight="weight")}
    hubs = [max((n for n in g if group[n] == k), key=lambda n: (strength[n], n)) for k in range(GROUPS)]
    out_nodes = [{"id": n, "label": names[n], "x": pos[n][0], "y": pos[n][1], "group": group[n],
                  "strength": strength[n]} for n in sorted(g)]
    out_links = [{"source": a, "target": b, "weight": int(d["weight"]),
                  "group": group[a] if group[a] is not None and group[a] == group[b] else None}
                 for a, b, d in edges(g)]
    return {
        "ratio": ratio,
        "source": "Course Marvel snapshot of 26 August 2026 (week05_text.weighted()); groups from week 5 section 4",
        "groups": labels[:GROUPS],
        "hubs": hubs,
        "nodes": out_nodes,
        "links": out_links,
    }, g, group


def pair(g, group, labels):
    between = {}
    for a, b, d in edges(g):
        ga, gb = group[a], group[b]
        if ga is not None and gb is not None and ga != gb:
            key = tuple(sorted((ga, gb)))
            between[key] = between.get(key, 0) + d["weight"]
    (k1, k2), _ = max(between.items(), key=lambda kv: (kv[1], kv[0]))
    keep = sorted(n for n in g if group[n] in (k1, k2))
    sub = ordered(g, keep)
    pos, ratio = layout(sub)
    cross = [(a, b, d["weight"]) for a, b, d in edges(sub) if group[a] != group[b]]
    # The heaviest link between the two groups; ties go to the first pair of ids.
    a, b, w = min(cross, key=lambda e: (-e[2], e[0], e[1]))
    names = dict(zip(nodes().node_id, nodes().node_id.str.replace("_", " ")))
    return {
        "ratio": ratio,
        "groups": [labels[k1], labels[k2]],
        "nodes": [{"id": n, "label": names[n], "x": pos[n][0], "y": pos[n][1], "group": 0 if group[n] == k1 else 1} for n in keep],
        "links": [{"source": s, "target": t, "weight": int(d["weight"])} for s, t, d in edges(sub)],
        "highlight": {"source": a, "target": b, "weight": int(w)},
    }


def overlap():
    """A toy: groups A-D and E-M share E; K hangs off A in no group."""
    at = {"K": (0.0, 0.47), "A": (0.16, 0.3), "B": (0.16, 0.62), "C": (0.3, 0.22), "D": (0.3, 0.7),
          "E": (0.45, 0.47), "F": (0.59, 0.24), "G": (0.72, 0.24), "M": (0.655, 0.0), "H": (0.84, 0.47),
          "J": (1.0, 0.47), "L": (0.59, 0.7), "I": (0.72, 0.7)}
    left = {"A", "B", "C", "D"}
    right = {"F", "G", "H", "I", "J", "L", "M"}
    edges = [("K", "A"), ("A", "B"), ("A", "C"), ("A", "D"), ("B", "C"), ("B", "D"), ("C", "D"), ("C", "E"), ("D", "E"),
             ("M", "F"), ("M", "G"), ("F", "G"), ("F", "H"), ("F", "J"), ("F", "L"), ("F", "I"), ("G", "H"), ("G", "L"),
             ("G", "I"), ("H", "J"), ("H", "L"), ("H", "I"), ("I", "J"), ("L", "I"), ("E", "F"), ("E", "G"), ("E", "H"),
             ("E", "L"), ("E", "I")]

    def groups(n):
        return [0, 1] if n == "E" else [0] if n in left else [1] if n in right else []

    def shared(a, b):
        """The one group both ends are in, else None."""
        both = set(groups(a)) & set(groups(b))
        return both.pop() if len(both) == 1 else None

    return {
        "toy": True,
        "ratio": 0.7,
        "groups": ["Group 1", "Group 2"],
        "nodes": [{"id": n, "label": n, "x": x, "y": y, "groups": groups(n)} for n, (x, y) in sorted(at.items())],
        "links": [{"source": a, "target": b, "group": shared(a, b)} for a, b in edges],
    }


def main():
    m, g, group = marvel()
    payload = {
        "generated_by": "analysis/styleguide_graphs.py",
        "seed": SEED,
        "karate": karate(),
        "marvel": m,
        "pair": pair(g, group, m["groups"]),
        "overlap": overlap(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}: karate {len(payload['karate']['nodes'])} nodes, marvel {len(m['nodes'])}, "
          f"pair {payload['pair']['groups']} {len(payload['pair']['nodes'])} nodes, heaviest cross link {payload['pair']['highlight']}")


if __name__ == "__main__":
    main()
