"""The data behind the hidden toolbox page (/toolbox/): games, teaching materials, our own components and the
chart libraries' examples, all tagged with one list of course concepts so the page can filter by week or concept.

Reads
  project/games/games.json          the game catalogue (scripts/game_catalogue.py)
  project/materials/NN-*.md         up to 20 essential materials per course topic
  project/toolbox/components.json   our kit components, week charts, games and the course's explorables
  project/toolbox/libraries.json    ECharts, Recharts, D3, globe.gl and the rest, with their gallery examples
Writes
  public/toolbox/data/toolbox.json

    python scripts/toolbox_data.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/toolbox/data/toolbox.json"

# One concept list for everything on the page, grouped as the course is.
CONCEPTS = [
    ("degree-hubs", "Degree and hubs", "networks"),
    ("network-visualization", "Network visualization", "networks"),
    ("directed-graphs", "Directed graphs, trees, DAGs", "networks"),
    ("bipartite", "Bipartite networks, projection", "networks"),
    ("random-graphs", "Random graphs", "networks"),
    ("null-models", "Null models, shuffling", "networks"),
    ("small-worlds", "Small worlds", "networks"),
    ("clustering", "Clustering, triangles", "networks"),
    ("preferential-attachment", "Preferential attachment", "networks"),
    ("paths", "Paths, shortest paths, BFS", "networks"),
    ("centrality", "Centrality, betweenness", "networks"),
    ("random-walks", "Random walks, PageRank", "networks"),
    ("homophily", "Homophily, assortativity", "networks"),
    ("communities", "Communities, modularity", "networks"),
    ("weak-ties", "Weak ties, weights, backbones", "networks"),
    ("robustness", "Robustness, attacks", "networks"),
    ("flows", "Flows on networks", "networks"),
    ("spreading", "Spreading, contagion", "networks"),
    ("word-frequency", "Tokens, word frequency, Zipf", "text"),
    ("search-tfidf", "TF-IDF, search, cosine", "text"),
    ("comparing-groups", "Comparing groups", "text"),
    ("topic-models", "Topic models", "text"),
    ("word-context", "Word context, PMI", "text"),
    ("embeddings", "Word embeddings", "text"),
    ("sentiment", "Sentiment, transformers", "text"),
    ("deduction", "Deduction, information gain", "general"),
    ("probability", "Probability, estimation", "general"),
]
WEEKS = [
    (1, "Networks", ["degree-hubs", "network-visualization", "directed-graphs", "bipartite"]),
    (2, "Models and null models", ["random-graphs", "null-models", "small-worlds", "clustering", "preferential-attachment", "degree-hubs"]),
    (3, "Who matters, and why", ["paths", "centrality", "random-walks", "homophily", "clustering"]),
    (4, "Communities", ["communities", "weak-ties", "robustness", "flows"]),
    (5, "From language to numbers", ["word-frequency", "search-tfidf"]),
    (6, "From counts to meaning", ["search-tfidf", "comparing-groups", "topic-models", "word-context", "embeddings"]),
    (7, "NLP III: sentiment and context", ["sentiment", "embeddings", "topic-models"]),
    (8, "Networks and language", ["spreading", "communities", "bipartite", "embeddings"]),
]
# Each materials topic file, its week and its concepts.
TOPICS = {
    "01": (1, ["degree-hubs", "bipartite", "directed-graphs"]),
    "02": (1, ["degree-hubs", "preferential-attachment"]),
    "03": (1, ["network-visualization"]),
    "04": (2, ["random-graphs"]),
    "05": (2, ["small-worlds", "clustering", "paths"]),
    "06": (2, ["preferential-attachment", "degree-hubs"]),
    "07": (2, ["null-models", "random-graphs"]),
    "08": (3, ["paths", "centrality"]),
    "09": (3, ["centrality", "random-walks"]),
    "10": (3, ["homophily", "clustering"]),
    "11": (4, ["communities"]),
    "12": (4, ["weak-ties", "flows"]),
    "13": (5, ["word-frequency"]),
    "14": (6, ["search-tfidf"]),
    "15": (6, ["comparing-groups", "topic-models"]),
    "16": (6, ["word-context", "embeddings"]),
    "17": (7, ["sentiment", "embeddings"]),
    "18": (8, ["spreading", "communities", "embeddings"]),
}
# Suggested concepts for a library example, from words in its title and gallery section.
EXAMPLE_RULES = [
    ("network-visualization", r"\bgraphs?\b|network|force|\bnodes?\b|\bedges?\b|sigma|cytoscape|cosmograph"),
    ("directed-graphs", r"\btree|hierarch|dendrogram|\bdag\b|directed"),
    ("communities", r"cluster|bundl|communit|\bpack\b|partition|louvain"),
    ("flows", r"sankey|\bflow|\barcs?\b|flight|trip|migration|chord"),
    ("paths", r"\bpath|route|shortest"),
    ("degree-hubs", r"histogram|distribution|\blog\b|logarithm|density|\bcdf\b|power"),
    ("comparing-groups", r"scatter|bubble|parallel|beeswarm|dot ?plot|slope|diverg"),
    ("embeddings", r"scatter|projection|umap|t-?sne|embedding|point ?cloud|points?\b"),
    ("topic-models", r"treemap|sunburst|stream|stacked|mosaic|icicle"),
    ("word-frequency", r"\bwords?\b|\btext|wordcloud|zipf"),
    ("word-context", r"heat ?map|matrix|adjacency"),
    ("spreading", r"spread|diffus|epidemic|contagion"),
]
CONCEPT_IDS = {c for c, _, _ in CONCEPTS}


def read_json(path, default):
    return json.loads(path.read_text()) if path.exists() else default


def cells(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def link_of(cell):
    m = re.search(r"\]\((.*?)\)", cell)
    return m.group(1) if m else cell


def materials():
    topics, rows = [], []
    for path in sorted((ROOT / "project/materials").glob("[0-9][0-9]-*.md")):
        key = path.name[:2]
        week, concepts = TOPICS[key]
        text = path.read_text().splitlines()
        title = text[0].lstrip("# ").strip()
        note = next(l for l in text[1:] if l.strip() and not l.startswith("|"))
        slug = path.stem
        topics.append({"slug": slug, "title": title, "note": note, "week": week, "c": concepts})
        for l in text:
            if re.match(r"\|\s*\d+\s*\|", l):
                n, name, kind, by, why, free, link = cells(l)[:7]
                rows.append({"topic": slug, "rank": int(n), "name": name, "type": kind, "by": by, "why": why, "free": free, "url": link_of(link), "c": concepts})
    return topics, rows


def games():
    data = read_json(ROOT / "project/games/games.json", {"lists": []})
    out = []
    for lst in data["lists"]:
        for g in lst["games"]:
            out.append({
                "name": g["name"], "list": lst["label"], "rank": g["rank"], "year": g["year"], "loop": g["loop"],
                "build": g["build"], "teach": g["teach"], "star": g["star"], "c": [c for c in g["concepts"] if c in CONCEPT_IDS],
                "wiki": g.get("wikipedia") or None, "link": g.get("link"),
            })
    return out


def libraries():
    data = read_json(ROOT / "project/toolbox/libraries.json", {"libraries": []})
    out = []
    for lib in data["libraries"]:
        examples = []
        for e in lib.get("examples", []):
            text = f"{e.get('title', '')} {e.get('category', '')}".lower()
            examples.append({"title": e.get("title", ""), "cat": e.get("category") or "", "url": e.get("url", ""),
                             "c": [c for c, rx in EXAMPLE_RULES if re.search(rx, text)]})
        out.append({k: lib.get(k) for k in ("name", "slug", "site", "gallery", "version_in_repo", "what_for", "note")} | {"examples": examples})
    return out


def components():
    data = read_json(ROOT / "project/toolbox/components.json", {"items": []})
    return [i | {"concepts": [c for c in i.get("concepts", []) if c in CONCEPT_IDS]} for i in data["items"]]


def main():
    topics, mats = materials()
    out = {
        "concepts": [{"id": c, "label": l, "group": g} for c, l, g in CONCEPTS],
        "weeks": [{"n": n, "title": t, "c": c} for n, t, c in WEEKS],
        "games": games(),
        "topics": topics,
        "materials": mats,
        "components": components(),
        "libraries": libraries(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    examples = sum(len(l["examples"]) for l in out["libraries"])
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB): {len(out['games'])} games, {len(mats)} materials in "
          f"{len(topics)} topics, {len(out['components'])} components, {len(out['libraries'])} libraries with {examples} examples")


if __name__ == "__main__":
    main()
