"""The Marvel link network as the week 5 page draws it: one map, shared by
sections 1 and 4, so a group colour means the same community everywhere.

Output: docs/weeks/week05/data/network.json, read by week05-relations.js and
week05-autocomplete.js through networkView() (docs/assets/js/graph.js).

- Positions: layout.spread() on the weighted network (week05_text.weighted()),
  seed layout.SEED: ForceAtlas2 in LinLog mode on the giant component, the
  Morituri component beside it and the 17 isolates on a ring. The styleguide's
  Marvel map (analysis/styleguide_graphs.py) is the same layout.
- Groups: section 4's consensus communities (communities.json); the eight in
  the giant component are groups 0 to 7, the Morituri component and the
  isolates have none. One hub per group: its page with the most link weight.
- Links: the 1,434 pairs of pages that link, with their weight (links from
  either page to the other) and the group both ends share, if any.
- Relations: for each of section 1's labels, the pairs of pages whose linking
  sentence carries it (week05_relations.arcs()). A pair whose two arcs carry
  different labels is in both lists.
- Names: every node carries its page title, which the maps show on hover; the
  eight hubs also get a pill on the map.

    python analysis/week05_network.py
"""

import json
from pathlib import Path

from check_pages import check
from layout import SEED, edges, spread
from week05_relations import PRIORITY, arcs
from week05_text import weighted

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/weeks/week05/data/network.json"
COMMUNITIES = ROOT / "docs/weeks/week05/data/communities.json"
RELATIONS = ROOT / "docs/weeks/week05/data/relations.json"
GROUPS = 8


def main():
    g = weighted()
    comm = json.loads(COMMUNITIES.read_text())
    group = {n: (k if k < GROUPS and comm["communities"][k]["where"] == "giant" else None)
             for n, k in comm["membership"].items()}
    pos, ratio = spread(g)
    ids = sorted(g)
    at = {n: i for i, n in enumerate(ids)}
    strength = {n: int(w) for n, w in g.degree(weight="weight")}
    hubs = [max((n for n in ids if group[n] == k), key=lambda n: (strength[n], n)) for k in range(GROUPS)]
    title = {n: comm["communities"][group[n]]["label"] for n in hubs}

    rows = [r for r in arcs() if r.get("found") and r["label"] != "unlabelled"]
    relations = {}
    for label in PRIORITY:
        pairs = sorted({tuple(sorted((at[r["source"]], at[r["target"]]))) for r in rows if r["label"] == label})
        relations[label] = {"arcs": sum(r["label"] == label for r in rows), "pairs": [list(p) for p in pairs]}
    # The same arcs as section 1's chart counts.
    printed = {x["label"]: x["arcs"] for x in json.loads(RELATIONS.read_text())["labels"]}
    for label in PRIORITY:
        if relations[label]["arcs"] != printed[label]:
            raise SystemExit(f"{label}: {relations[label]['arcs']} arcs here, {printed[label]} in relations.json; rerun week05_relations.py")

    payload = {
        "generated_by": "analysis/week05_network.py",
        "seed": SEED,
        "ratio": ratio,
        "groups": [{"label": comm["communities"][k]["label"], "size": sum(group[n] == k for n in ids)} for k in range(GROUPS)],
        "no_group": sum(group[n] is None for n in ids),
        "hubs": [{"node": at[n], "label": title[n], "group": group[n]} for n in hubs],
        "nodes": [{"x": pos[n][0], "y": pos[n][1], "group": group[n], "name": n.replace("_", " ")} for n in ids],
        "links": [[at[a], at[b], int(d["weight"]), group[a] if group[a] is not None and group[a] == group[b] else None]
                  for a, b, d in edges(g)],
        "relations": relations,
    }
    check(OUT, payload)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(ids)} nodes, {len(payload['links'])} links, "
          + ", ".join(f"{k} {v['arcs']} arcs / {len(v['pairs'])} pairs" for k, v in relations.items()))


if __name__ == "__main__":
    main()
