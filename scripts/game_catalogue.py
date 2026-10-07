"""The game catalogue in project/games/: one JSON file as the source, Markdown lists rendered from it.

project/games/games.json holds every list (arcade, strategy, ... flash), its sources, and every game with its
core loop, build size, the course ideas it could teach (free text plus fixed concept tags, so games can be
filtered by concept later), the sources that list it, and two links: its Wikipedia article and the game itself
(official site, else its Steam, BoardGameGeek or MobyGames page, from Wikidata).

    python scripts/game_catalogue.py import   # read the Markdown lists into games.json (first run only)
    python scripts/game_catalogue.py links    # look up missing links (Wikipedia search, then Wikidata), cached
    python scripts/game_catalogue.py render   # write the Markdown lists, README.md and course-fits.md from games.json

Edit games.json, never the Markdown: render overwrites it.
"""

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "project/games"
DATA = DIR / "games.json"
CACHE = DIR / ".wiki-cache.json"  # search results by "slug|name", so a rerun or a crash loses no lookups
UA = "LogLogLegends/1.0 (DTU 02805 course project; https://github.com/horrrt/02805_social_graphs)"

ORDER = ["arcade", "strategy", "platform", "shoot-em-up", "survival", "rhythm", "survival-horror", "adventure", "puzzle",
         "logic", "tower-defense", "turn-based-strategy", "board-games", "nintendo", "2d", "retro", "flash"]
LABEL = {"arcade": "Arcade", "strategy": "Strategy", "platform": "Platform", "shoot-em-up": "Shoot 'em up",
         "survival": "Survival", "rhythm": "Rhythm", "survival-horror": "Survival horror", "adventure": "Adventure",
         "puzzle": "Puzzle", "logic": "Logic", "tower-defense": "Tower defense", "turn-based-strategy": "Turn-based strategy",
         "board-games": "Board games", "nintendo": "Nintendo", "2d": "2D (2000 on)", "retro": "Retro (1972 to 1999)", "flash": "Flash"}
# What to add to a Wikipedia search so the game, not a namesake, comes first.
HINT = {"board-games": "board game", "logic": "puzzle"}

# The fixed concept tags. A game's free-text "could teach" maps onto these by keyword, so a future question
# ("which games could carry centrality?") is a filter on one field.
CONCEPTS = {
    "degree-hubs": ("Degree and hubs", ["degree", "hub"]),
    "paths": ("Paths, shortest paths, BFS", ["shortest path", "paths", "path", "bfs"]),
    "small-worlds": ("Small worlds", ["small world", "small-world"]),
    "random-graphs": ("Random graphs and null models", ["random graph", "null model"]),
    "robustness": ("Robustness, targeted attacks", ["robustness", "targeted attack"]),
    "communities": ("Communities, modularity", ["communit", "modularity"]),
    "centrality": ("Centrality: betweenness, PageRank", ["centrality", "betweenness", "pagerank", "chokepoint"]),
    "clustering": ("Clustering, triangles", ["cluster", "triangle"]),
    "preferential-attachment": ("Preferential attachment, rich-get-richer growth", ["preferential", "rich-get-richer", "rich get richer"]),
    "bipartite": ("Bipartite networks and projection", ["bipartite", "projection"]),
    "homophily": ("Homophily", ["homophily"]),
    "spreading": ("Spreading and contagion", ["spread", "contagion", "epidemic"]),
    "random-walks": ("Random walks", ["random walk"]),
    "directed-graphs": ("Directed graphs, trees, DAGs", ["directed", "tree", "dag"]),
    "flows": ("Flows on networks", ["flow"]),
    "search-tfidf": ("Search engines, TF-IDF", ["search engine", "tf-idf", "tfidf"]),
    "word-frequency": ("Word frequency, Zipf's law", ["zipf", "word frequency"]),
    "topic-models": ("Topic models", ["topic model"]),
    "word-context": ("Word context, PMI", ["pmi", "word context"]),
    "embeddings": ("Word embeddings, cosine similarity", ["embedding", "cosine"]),
    "comparing-groups": ("Comparing groups", ["comparing groups"]),
    "deduction": ("Deduction by elimination, information gain", ["deduction", "elimination", "information gain"]),
    "probability": ("Probability, estimation", ["probability", "estimation", "expected value"]),
}

# Wikidata properties for the game link, best first; each URL comes from the property's own formatter URL.
LINK_PROPS = [("P856", "Official site"), ("P1733", "Steam"), ("P2339", "BoardGameGeek"), ("P1933", "MobyGames")]


def concepts_of(text):
    t = text.lower()
    if t.strip() in ("not a fit", ""):
        return []
    return [k for k, (_, words) in CONCEPTS.items() if any(w in t for w in words)]


def cells(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def import_md():
    lists = []
    for slug in ORDER:
        text = (DIR / f"{slug}.md").read_text()
        lines = text.splitlines()
        title = lines[0].lstrip("# ").strip()
        note = next(l for l in lines[1:] if l.strip() and not l.startswith("|"))
        sources = [{"key": k, "title": t, "url": u}
                   for k, t, u in re.findall(r"^- \*\*([A-Z]{1,2})\*\*:?\s*\[(.*?)\]\((.*?)\)", text, re.M)]
        games = []
        for l in lines:
            if not re.match(r"\|\s*\d+\s*\|", l):
                continue
            n, name, year, loop, build, teach, src = cells(l)[:7]
            games.append({
                "rank": int(n), "name": name, "year": int(year) if year.isdigit() else None, "loop": loop,
                "build": build, "teach": teach.replace("★", "").strip(), "star": "★" in teach,
                "concepts": concepts_of(teach), "sources": [s.strip() for s in src.split(",") if s.strip()],
                "wikipedia": None, "link": None,
            })
        lists.append({"slug": slug, "label": LABEL[slug], "title": title, "note": note, "sources": sources, "games": games})
    DATA.write_text(json.dumps({"concepts": {k: v[0] for k, v in CONCEPTS.items()}, "lists": lists}, indent=1, ensure_ascii=False) + "\n")
    print(f"imported {sum(len(l['games']) for l in lists)} games in {len(lists)} lists into {DATA.relative_to(ROOT)}")


def get(url, params, tries=6):
    full = url + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(full, headers={"User-Agent": UA}), timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or i == tries - 1:
                raise
        except urllib.error.URLError:
            if i == tries - 1:
                raise
        time.sleep(2 ** (i + 1))
    raise RuntimeError("unreachable")


def search_name(name):
    """The name to search: before any bracket or slash, as the lists write extras in brackets."""
    return re.split(r"\s*[(/]", name)[0].strip()


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


# Names Wikipedia search gets wrong, pinned by hand: the article's title, or "" when Wikipedia has none for that
# game (better no link than a namesake's). Checked against the API when applied; a missing title counts as "".
OVERRIDES = {
    "Rain World": "Rain World", "DoDonPachi Daifukkatsu": "DoDonPachi Resurrection", "Ragnarock": "", "Kami": "",
    "Nim": "Nim", "Sprouts": "Sprouts (game)", "Sim": "Sim (pencil game)", "Chomp": "Chomp", "Tango": "", "Zip": "", "Pips": "",
    "Queens": "", "Flood": "", "Anomaly 2": "Anomaly 2", "Element TD 2": "", "Dead of Winter": "Dead of Winter: A Crossroads Game",
    "Concordia": "Concordia (board game)", "Star Wars: Imperial Assault": "Star Wars: Imperial Assault", "Underwater Cities": "",
    "Wii Sports": "Wii Sports", "Wii Play": "Wii Play", "Patrician III": "", "Portal: The Flash Version": "", "Super Mario 63": "",
    "Meat Boy": "", "The Last Stand: Union City": "", "Motherload": "", "Pandemic 2": "", "Territory War": "",
    # Right article, but its title differs from the list's name.
    "Dragonshard": "Dungeons & Dragons: Dragonshard", "Touhou: The Embodiment of Scarlet Devil": "The Embodiment of Scarlet Devil",
    "DrumMania": "GuitarFreaks and DrumMania", "Logic maze": "Logic maze", "Goishi Hiroi": "Goishi Hiroi", "Pentomino tiling": "Pentomino",
    "X-COM: UFO Defense": "UFO: Enemy Unknown", "Battle for Wesnoth": "The Battle for Wesnoth", "Fallen Enchantress": "Elemental: Fallen Enchantress",
    "Tigris & Euphrates": "Tigris and Euphrates", "Clank!": "Clank!: A Deck-Building Adventure",
    "Through the Ages: A New Story of Civilization": "Through the Ages: A Story of Civilization", "Xiangqi (Chinese chess)": "Xiangqi",
}


def exact_page(title):
    """The page for an exact title, with description and Wikidata item, or None when it does not exist."""
    if not title:
        return None
    d = get("https://en.wikipedia.org/w/api.php", {"action": "query", "format": "json", "formatversion": 2, "titles": title,
                                                   "prop": "description|pageprops", "ppprop": "wikibase_item", "redirects": 1})
    page = d["query"]["pages"][0]
    return None if page.get("missing") or page.get("invalid") else page


GAMEISH = re.compile(r"game|puzzle|series|franchise|board|card|video|arcade|shooter|platform|software|title|interactive fiction", re.I)


def wiki_lookup(name, slug):
    """The Wikipedia article for a game: the first search hit whose title is the name (or starts with it, or is
    a prefix of at least five letters of it) and whose description or title says it is a game. None when nothing
    fits: no link beats a namesake's link."""
    if name in OVERRIDES:
        return exact_page(OVERRIDES[name])
    q = search_name(name)
    hint = HINT.get(slug, "video game")
    d = get("https://en.wikipedia.org/w/api.php", {
        "action": "query", "format": "json", "formatversion": 2, "generator": "search", "gsrsearch": f"{q} {hint}",
        "gsrlimit": 6, "prop": "description|pageprops", "ppprop": "wikibase_item", "redirects": 1,
    })
    pages = sorted(d.get("query", {}).get("pages", []), key=lambda p: p.get("index", 99))
    key = norm(q)

    def fits(p):
        return GAMEISH.search(p.get("description", "")) or re.search(r"\((?:[^)]*game|puzzle)\)", p["title"], re.I)

    for p in pages:
        t = norm(re.sub(r"\s*\(.*\)$", "", p["title"]))
        if (t == key or t.startswith(key) or (key.startswith(t) and len(t) >= 5)) and fits(p):
            return p
    return None


def links():
    data = json.loads(DATA.read_text())
    todo = {}
    for lst in data["lists"]:
        for g in lst["games"]:
            if g["wikipedia"] is None:
                todo.setdefault((g["name"], lst["slug"]), []).append(g)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    found = {item: cache[f"{item[1]}|{item[0]}"] for item in todo if f"{item[1]}|{item[0]}" in cache}
    print(f"{len(todo)} names to look up, {len(found)} already cached")

    def work(item):
        (name, slug) = item
        try:
            return item, wiki_lookup(name, slug)
        except Exception as e:  # noqa: BLE001 - one failed lookup must not stop the rest
            print(f"  lookup failed for {name}: {e}", file=sys.stderr)
            return item, None

    done = 0
    with ThreadPoolExecutor(4) as pool:
        for item, page in pool.map(work, [i for i in todo if i not in found]):
            found[item] = page
            cache[f"{item[1]}|{item[0]}"] = page
            done += 1
            if done % 100 == 0:
                print(f"  {done} looked up")
                CACHE.write_text(json.dumps(cache, ensure_ascii=False))
    CACHE.write_text(json.dumps(cache, ensure_ascii=False))

    # The game link from Wikidata, 50 items a request, each property's URL from its formatter (P1630).
    formatter = {}
    # P856 (official website) holds a full URL; the others hold IDs that their formatter URL turns into links.
    ids = [p for p, _ in LINK_PROPS if p != "P856"]
    props = get("https://www.wikidata.org/w/api.php", {"action": "wbgetentities", "format": "json", "ids": "|".join(ids), "props": "claims"})
    for p, ent in props["entities"].items():
        formatter[p] = ent["claims"]["P1630"][0]["mainsnak"]["datavalue"]["value"]
    qids = sorted({p["pageprops"]["wikibase_item"] for p in found.values() if p and "wikibase_item" in p.get("pageprops", {})})
    claims = {}
    for i in range(0, len(qids), 50):
        d = get("https://www.wikidata.org/w/api.php", {"action": "wbgetentities", "format": "json", "ids": "|".join(qids[i:i + 50]), "props": "claims"})
        for q, ent in d["entities"].items():
            claims[q] = ent.get("claims", {})

    def game_link(q):
        for p, label in LINK_PROPS:
            for c in claims.get(q, {}).get(p, []):
                v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
                if isinstance(v, str) and c.get("rank") != "deprecated":
                    url = v if p == "P856" else formatter[p].replace("$1", urllib.parse.quote(v, safe="/"))
                    return {"label": label, "url": url}
        return None

    hit = 0
    for item, page in found.items():
        for g in todo[item]:
            if page:
                hit += 1
                g["wikipedia"] = "https://en.wikipedia.org/wiki/" + urllib.parse.quote(page["title"].replace(" ", "_"), safe="_()',!:")
                g["wikidata"] = page.get("pageprops", {}).get("wikibase_item")
                g["link"] = game_link(g["wikidata"]) if g["wikidata"] else None
            else:
                g["wikipedia"] = ""  # looked up, nothing fits; links() skips it next time
    DATA.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    total = sum(len(l["games"]) for l in data["lists"])
    wiki = sum(bool(g["wikipedia"]) for l in data["lists"] for g in l["games"])
    game = sum(bool(g.get("link")) for l in data["lists"] for g in l["games"])
    print(f"{hit} rows linked this run; {wiki}/{total} have Wikipedia, {game}/{total} a game link")


def link_cell(g):
    parts = []
    if g["wikipedia"]:
        parts.append(f"[Wikipedia]({g['wikipedia']})")
    if g.get("link"):
        parts.append(f"[{g['link']['label']}]({g['link']['url']})")
    return " · ".join(parts)


def render():
    data = json.loads(DATA.read_text())
    concepts = data["concepts"]
    for lst in data["lists"]:
        out = [f"# {lst['title']}", "", lst["note"], "",
               "| # | Game | Year | Core loop | Build | Could teach | Links | Sources |",
               "| --- | --- | --- | --- | --- | --- | --- | --- |"]
        for g in lst["games"]:
            teach = ("★ " if g["star"] else "") + g["teach"]
            out.append(f"| {g['rank']} | {g['name']} | {g['year'] or ''} | {g['loop']} | {g['build']} | {teach} | {link_cell(g)} | {', '.join(g['sources'])} |")
        out += ["", "## Sources", ""] + [f"- **{s['key']}**: [{s['title']}]({s['url']})" for s in lst["sources"]]
        (DIR / f"{lst['slug']}.md").write_text("\n".join(out) + "\n")

    games = [(lst, g) for lst in data["lists"] for g in lst["games"]]
    distinct = len({norm(g["name"]) for _, g in games})
    by_concept = {k: [(l, g) for l, g in games if k in g["concepts"]] for k in concepts}
    readme = [
        "# Game lists by category", "",
        f"{len(games):,} games in {len(data['lists'])} lists ({distinct:,} distinct titles; some games sit in more than one list). "
        "Research agents built each list from at least five authoritative sources: Wikipedia's genre and best-seller lists, Metacritic, "
        "publisher sales figures, the World Video Game Hall of Fame, Steam rankings, BoardGameGeek, award winners and major outlets' "
        "best-of lists. Games are ranked by how many sources include them; each list says how it broke ties and links its sources.", "",
        "Every row links the game's Wikipedia article and the game itself (official site, else Steam, BoardGameGeek or MobyGames, from "
        "Wikidata), and gives the core loop, a build size (S: one session in a browser; M: a few sessions; L: only a stripped-down "
        "version is realistic) and the course idea the mechanic could teach. ★ marks games where winning requires that idea.", "",
        "**Source of truth:** [games.json](games.json). Edit it, then run `python scripts/game_catalogue.py render`; the Markdown is "
        "generated. Each game carries `concepts`, fixed tags mapped from its free-text idea, so finding games for a concept is a filter:", "",
        "```bash",
        "jq -r '.lists[] | .label as $l | .games[] | select(.concepts | index(\"centrality\")) | \"\\($l) #\\(.rank) \\(.name)\"' project/games/games.json",
        "```", "",
        "| List | Games | Sources | Top three | ★ | Links | Notes |", "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for lst in data["lists"]:
        top = ", ".join(g["name"] for g in lst["games"][:3])
        wiki = sum(bool(g["wikipedia"]) for g in lst["games"])
        game = sum(bool(g.get("link")) for g in lst["games"])
        readme.append(f"| [{lst['label']}]({lst['slug']}.md) | {len(lst['games'])} | {len(lst['sources'])} | {top} | {sum(g['star'] for g in lst['games'])} "
                      f"| {wiki} Wikipedia, {game} game | {lst.get('caveat', '')} |")
    readme += ["", "## Games per concept", "", "| Concept | Tag | Games | ★ |", "| --- | --- | --- | --- |"]
    for k, label in concepts.items():
        rows = by_concept[k]
        readme.append(f"| {label} | `{k}` | {len(rows)} | {sum(g['star'] for _, g in rows)} |")
    (DIR / "README.md").write_text("\n".join(readme) + "\n")

    fits = sorted(((l, g) for l, g in games if g["star"]), key=lambda x: ("SML".find(x[1]["build"][:1]), x[0]["label"], x[1]["rank"]))
    cf = ["# Course fits", "",
          f"All {len(fits)} games marked ★ across the lists: the ones where winning requires a course idea, quickest builds first. "
          "The idea is the research agents' call; check it before building.", "",
          "| Game | List | Build | Course idea | Tags | Links |", "| --- | --- | --- | --- | --- | --- |"]
    for l, g in fits:
        cf.append(f"| {g['name']} | [{l['label']} #{g['rank']}]({l['slug']}.md) | {g['build']} | {g['teach']} | {', '.join(f'`{c}`' for c in g['concepts'])} | {link_cell(g)} |")
    (DIR / "course-fits.md").write_text("\n".join(cf) + "\n")
    print(f"rendered {len(data['lists'])} lists, README.md and course-fits.md")


if __name__ == "__main__":
    {"import": import_md, "links": links, "render": render}[sys.argv[1]]()
