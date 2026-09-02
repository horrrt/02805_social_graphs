"""Stretch: re-derive one article's out-links from the live Wikipedia API and
diff them against the frozen snapshot."""
import json, re, time, urllib.parse, urllib.request
import pandas as pd, networkx as nx

UA = "02805-LogLogLegends/1.0 (DTU course project; contact via GitHub horrrt)"
API = "https://en.wikipedia.org/w/api.php"

def wikitext(title):
    q = {"action": "query", "prop": "revisions", "rvprop": "content",
         "rvslots": "main", "format": "json", "formatversion": "2", "titles": title}
    req = urllib.request.Request(f"{API}?{urllib.parse.urlencode(q)}",
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        page = json.load(r)["query"]["pages"][0]
    return page["revisions"][0]["slots"]["main"]["content"]

LINK = re.compile(r"\[\[([^\[\]|#]+)(?:\|[^\[\]]*)?\]\]")

def outlinks(text):
    """Every [[Page name]] in the wiki-source, as underscore ids."""
    return {m.group(1).strip().replace(" ", "_") for m in LINK.finditer(text)}

nodes = pd.read_csv("data/week1_nodes.tsv", sep="\t", comment="#")
edges = pd.read_csv("data/week1_edges.tsv", sep="\t", comment="#",
                    names=["source", "target"])
D = nx.DiGraph(); D.add_nodes_from(nodes.node_id)
D.add_edges_from(edges.itertuples(index=False, name=None))
roster = set(nodes.node_id)

report = []
for title in ["Betsy_Braddock", "Radian_(Morituri)", "Baymax"]:
    live = outlinks(wikitext(title)) & roster
    live.discard(title)
    snap = set(D.successors(title))
    report.append({"article": title, "live": len(live), "snapshot": len(snap),
                   "agree": len(live & snap),
                   "only_live": sorted(live - snap), "only_snapshot": sorted(snap - live)})
    time.sleep(0.4)

for r in report:
    print(f"\n{r['article']}")
    print(f"  live wiki-source -> roster : {r['live']:>3}")
    print(f"  frozen snapshot            : {r['snapshot']:>3}")
    print(f"  agree on                   : {r['agree']:>3}")
    print(f"  only live     : {r['only_live']}")
    print(f"  only snapshot : {r['only_snapshot']}")

json.dump(report, open("analysis/week01_api_check.json", "w"), indent=1)
