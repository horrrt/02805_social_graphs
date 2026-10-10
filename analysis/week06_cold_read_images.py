"""Cold Read's portraits: each Marvel page's lead image as Wikipedia serves it (prop=pageimages).

Owner: Gyula. Most lead images are non-free comic art that Wikipedia uses under fair use; the group
chose to show them in the game anyway, hotlinked from upload.wikimedia.org (nothing is copied into the
repository) and each credited by a link to its file page. Pages with no lead image get none.

Writes analysis/week06_cold_read_images.json: {node_id: {"thumb": url, "file": file name}}.
week06_cold_read.py reads it. The API answers 429 when asked too fast, so batches wait and back off.

    python analysis/week06_cold_read_images.py   # about 30 seconds
"""

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
import tables

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
API = "https://en.wikipedia.org/w/api.php"
UA = "LogLogLegends/1.0 (DTU 02805 course project; https://github.com/horrrt/02805_social_graphs)"
SIZE = 320


def get(params, tries=6):
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == tries - 1:
                raise
            time.sleep(2 ** (i + 2))
    raise RuntimeError("unreachable")


def main():
    ids = [row["node_id"] for row in tables.rows(ROOT / "data/week1_nodes.parquet")]
    out = {}
    for i in range(0, len(ids), 50):
        batch = {x.replace("_", " "): x for x in ids[i:i + 50]}
        d = get({"action": "query", "format": "json", "formatversion": 2, "prop": "pageimages", "piprop": "thumbnail|name",
                 "pithumbsize": SIZE, "pilicense": "any", "titles": "|".join(batch)})
        q = d["query"]
        back = {n["to"]: n["from"] for n in q.get("normalized", [])}
        for p in q["pages"]:
            if "thumbnail" in p:
                out[batch[back.get(p["title"], p["title"])]] = {"thumb": p["thumbnail"]["source"], "file": p["pageimage"]}
        time.sleep(3)
    OUT.write_text(json.dumps(dict(sorted(out.items())), indent=1, ensure_ascii=False) + "\n")
    print(f"{len(out)} of {len(ids)} pages have a lead image")


if __name__ == "__main__":
    main()
