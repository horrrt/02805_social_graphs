"""Wikidata's sex or gender (P21) for the 303 Marvel characters, fetched once and committed.

Week 6 asks whether pages read alike because of pronouns once names are gone.
To test that, each page needs a gender label that does not come from its own
text, so this script reads P21 from Wikidata for each node's wikidata_id
(data/week1_nodes.parquet) and writes analysis/week06_gender.parquet. A page about a
team or about several characters who share a name usually has no P21; it
stays "not recorded" and drops out of the gender comparison.

The live query changes as Wikidata is edited, so week06_lookalikes.py reads
the committed CSV and never the API. Rerun this only to refresh the labels:

    python analysis/week06_gender.py
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
# Q-ids of the P21 values the roster uses, named as Wikidata names them.
LABELS = {"Q6581097": "male", "Q6581072": "female", "Q48270": "non-binary", "Q1052281": "trans woman",
          "Q2449503": "trans man", "Q505371": "agender",
          "Q44148": "male", "Q43445": "female"}  # male and female organism, used for non-humans


def fetch(qids):
    params = {"action": "wbgetentities", "ids": "|".join(qids), "props": "claims", "format": "json"}
    return web.json(web.session(UA), API, params=params, timeout=60)["entities"]


def main():
    nodes = t.nodes().sort_values("node_id")
    rows = []
    qids = list(nodes.wikidata_id)
    entities = {}
    for i in range(0, len(qids), 50):
        entities.update(fetch(qids[i:i + 50]))
        time.sleep(1)
    for node_id, qid in zip(nodes.node_id, nodes.wikidata_id):
        claims = entities[qid].get("claims", {}).get("P21", [])
        values = sorted({c["mainsnak"].get("datavalue", {}).get("value", {}).get("id", "") for c in claims} - {""})
        unknown = [v for v in values if v not in LABELS]
        if unknown:
            raise SystemExit(f"{node_id} ({qid}): P21 value {unknown} has no label in LABELS")
        gender = "|".join(LABELS[v] for v in values) or "not recorded"
        rows.append((node_id, qid, gender))
    tables.write(OUT, pd.DataFrame(rows, columns=["node_id", "wikidata_id", "gender"]),
                 notes=[f"Wikidata P21 (sex or gender) per node, fetched {date.today()} by week06_gender.py"])
    from collections import Counter
    print(Counter(g for *_, g in rows))


if __name__ == "__main__":
    main()
