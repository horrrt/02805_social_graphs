"""Add the UNHCR forced-displacement column to an existing edge file.

week03_corridor_control.py writes this column on a full run, but a full run
reshuffles the degree-preserving null and rewrites every z-score in the post.
This pass adds the column to docs/assets/data/week03_edges.json on its own and
leaves week03_corridors.json alone, so the null story does not move for a
reason that has nothing to do with it.

    python analysis/week03_forced_patch.py
"""

from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "analysis"))

from week03_corridor_control import forced_counts  # noqa: E402

EDGES = ROOT / "docs" / "assets" / "data" / "week03_edges.json"


def main():
    payload = json.loads(EDGES.read_text())
    countries = payload["countries"]
    forced = forced_counts()
    if payload["fields"][-1] != "forced":
        payload["fields"] = [*payload["fields"], "forced"]

    matched = people = 0
    for edge in payload["edges"]:
        value = forced.get((countries[edge[0]], countries[edge[1]]), 0)
        if len(edge) == 7:
            edge[6] = value
        else:
            edge.append(value)
        if value:
            matched += 1
            people += value

    EDGES.write_text(json.dumps(payload, separators=(",", ":")))
    unmatched = len(forced) - matched
    print(f"{matched} corridors carry displacement, {people:,} people")
    print(f"{unmatched} UNHCR pairs have no DESA stock row and are dropped")
    print(f"wrote {EDGES.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
