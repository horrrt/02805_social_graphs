"""Wikidata's English label and aliases for the 303 Marvel characters, fetched once and committed.

Week 7 builds a network from who is named with whom in the page text. To turn
a mention ("Peter Parker", "Spidey") into one of the 303 characters, the
co-mention script needs each character's other names from a source outside
the pages themselves. This script reads the English label and aliases of each
node's wikidata_id (data/week1_nodes.parquet) and writes
analysis/week07_wikidata_names.parquet, one row per name.

The live answer changes as Wikidata is edited, so week07_comention.py reads the
committed table and never the API. Rerun this only to refresh the names:

    python analysis/week07_wikidata_names.py
"""

import sys
import time
from datetime import date
from pathlib import Path

import pandas as pd

import tables

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402
import fetch as web

OUT = Path(__file__).with_suffix(".parquet")
API = "https://www.wikidata.org/w/api.php"
UA = "02805-social-graphs course project (research; github.com/horrrt/02805_social_graphs)"


def fetch(s, qids):
    params = {"action": "wbgetentities", "ids": "|".join(qids), "props": "labels|aliases",
              "languages": "en", "format": "json"}
    return web.json(s, API, params=params, timeout=60)["entities"]


def main():
    nodes = t.nodes().sort_values("node_id")
    s = web.session(UA)
    qids = list(nodes.wikidata_id)
    entities = {}
    for i in range(0, len(qids), 50):
        entities.update(fetch(s, qids[i:i + 50]))
        time.sleep(1)
    rows = []
    for node_id, qid in zip(nodes.node_id, nodes.wikidata_id):
        e = entities[qid]
        label = e.get("labels", {}).get("en", {}).get("value")
        if label:
            rows.append((node_id, qid, "label", label))
        for a in sorted({a["value"] for a in e.get("aliases", {}).get("en", [])}):
            rows.append((node_id, qid, "alias", a))
    tables.write(OUT, pd.DataFrame(rows, columns=["node_id", "wikidata_id", "kind", "name"]),
                 notes=[f"Wikidata English label and aliases per node, fetched {date.today()} by week07_wikidata_names.py"])
    print(f"{len(rows)} names for {len({r[0] for r in rows})} of {len(nodes)} nodes")


if __name__ == "__main__":
    main()
