"""Pictures for the toolbox's items, hotlinked from where they live (nothing is copied into the repo).

  games       each game's Wikipedia lead image (prop=pageimages), else its own page's preview image (Steam,
              official site), saved into project/games/games.json as `img`
  gameplay    a gameplay shot per game, saved as `play`: the first screenshot on its Steam store page (Steam ID
              from Wikidata P1733), else an in-game screenshot from its Wikipedia article (a file whose name says
              gameplay, screenshot, in-game and the like)
  materials   each page's preview image (og:image or twitter:image; YouTube's own thumbnail for videos)
  examples    each library example's gallery thumbnail: the gallery's own image path where it has one
              (ECharts, three.js, Vega, Vega-Lite, deck.gl, Cytoscape.js), Observable's thumbnail for D3,
              else the page's preview image

Materials and examples go to project/toolbox/images.json ({url: image url}); scripts/toolbox_data.py attaches
them. Screenshots of our own components, and of pages with no picture, are scripts/toolbox_shots.mjs. Every lookup is cached in that file, so a
rerun only fetches what is new.

    python scripts/toolbox_images.py   # about 10 minutes the first time
"""

import json
import re
import sys
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from html import unescape
from pathlib import Path
import requests
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "analysis"))
import fetch as web  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
GAMES = ROOT / "project/games/games.json"
LIBS = ROOT / "project/toolbox/libraries.json"
OUT = ROOT / "project/toolbox/images.json"
UA = "LogLogLegends/1.0 (DTU 02805 course project; https://github.com/horrrt/02805_social_graphs)"


SESSION = web.session(UA, headers={"Accept": "text/html,application/json,*/*"}, tries=3)


def fetch(url, timeout=20, method="GET", limit=None):
    """Status and body; `limit` caps the bytes read (web pages need only their head, API answers need all of it).
    A dead page is status 0 or its error status, with no body: it just has no picture."""
    try:
        r = SESSION.request(method, url, timeout=timeout, stream=True)
    except requests.RequestException:
        return 0, b""
    with r:
        if method != "GET" or r.status_code >= 400:
            return r.status_code, b""
        body = b""
        try:
            for chunk in r.iter_content(1 << 16):
                body += chunk
                if limit and len(body) >= limit:
                    break
        except requests.RequestException:
            return 0, b""
        return r.status_code, body[:limit] if limit else body


def og_image(url):
    """A page's preview image, or None."""
    m = re.search(r"(?:youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})", url)
    if m:
        return f"https://img.youtube.com/vi/{m.group(1)}/hqdefault.jpg"
    status, body = fetch(url, limit=400_000)
    if status != 200 or not body:
        return None
    html = body.decode("utf-8", "replace")
    for prop in ("og:image", "og:image:url", "twitter:image", "twitter:image:src"):
        for pat in (rf'<meta[^>]+(?:property|name)=["\']{prop}["\'][^>]*content=["\']([^"\']+)', rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']{prop}["\']'):
            m = re.search(pat, html, re.I)
            if m:
                return urllib.parse.urljoin(url, unescape(m.group(1)).strip())
    return None


def exists(url):
    status, _ = fetch(url, method="HEAD")
    return status == 200


def example_image(slug, url):
    """A library example's thumbnail from the gallery's own image path, checked; else the page's preview image."""
    candidates = []
    if slug == "echarts" and (m := re.search(r"[?&]c=([^&#]+)", url)):
        candidates.append(f"https://echarts.apache.org/examples/data/thumb/{m.group(1)}.webp")
    elif slug == "threejs" and "#" in url:
        candidates.append(f"https://threejs.org/examples/screenshots/{url.split('#', 1)[1]}.jpg")
    elif slug == "vega" and (m := re.search(r"vega-lite/examples/([^/]+?)\.html", url)):
        candidates.append(f"https://vega.github.io/vega-lite/examples/{m.group(1)}.png")
    elif slug == "vega" and (m := re.search(r"/vega/examples/([^/]+)/?$", url)):
        candidates.append(f"https://vega.github.io/vega/examples/img/{m.group(1)}.png")
    elif slug == "deckgl" and (m := re.search(r"/examples/([^/#?]+)", url)):
        candidates.append(f"https://deck.gl/images/examples/{m.group(1)}.jpg")
    elif slug == "cytoscape" and (m := re.search(r"/demos/([^/]+)/?", url)):
        candidates.append(f"https://js.cytoscape.org/img/demos/{m.group(1)}.png")
    elif slug == "d3" and (m := re.search(r"observablehq\.com/(@[^/]+/[^/?#]+)", url)):
        status, body = fetch(f"https://api.observablehq.com/document/{m.group(1)}")
        if status == 200:
            thumb = json.loads(body).get("thumbnail")
            if thumb:
                return f"https://static.observableusercontent.com/thumbnail/{thumb}.jpg"
    for c in candidates:
        if exists(c):
            return c
    return og_image(url)


def game_images():
    data = json.loads(GAMES.read_text())
    rows = [g for lst in data["lists"] for g in lst["games"] if g.get("wikipedia") and not g.get("img")]
    titles = sorted({urllib.parse.unquote(g["wikipedia"].rsplit("/wiki/", 1)[1]).replace("_", " ") for g in rows})
    print(f"games: {len(titles)} articles to look up")
    found = {}
    for i in range(0, len(titles), 50):
        batch = titles[i:i + 50]
        q = urllib.parse.urlencode({"action": "query", "format": "json", "formatversion": 2, "prop": "pageimages", "piprop": "thumbnail",
                                    "pithumbsize": 240, "pilicense": "any", "redirects": 1, "titles": "|".join(batch)})
        status, body = fetch("https://en.wikipedia.org/w/api.php?" + q)
        if status != 200:
            continue
        d = json.loads(body)["query"]
        back = {n["to"]: n["from"] for n in d.get("normalized", []) + d.get("redirects", [])}
        for p in d["pages"]:
            if "thumbnail" in p:
                t = p["title"]
                found[back.get(t, t)] = p["thumbnail"]["source"].split("?")[0]
                found[t] = found[back.get(t, t)]
        time.sleep(1)
    for g in rows:
        g["img"] = found.get(urllib.parse.unquote(g["wikipedia"].rsplit("/wiki/", 1)[1]).replace("_", " "))
    # No lead image on Wikipedia: try the game's own page (Steam, official site, BoardGameGeek) for its preview image.
    missing = [g for lst in data["lists"] for g in lst["games"] if not g.get("img") and g.get("link") and not g.get("img_tried")]
    print(f"games: {len(missing)} without a Wikipedia picture; trying their own pages")
    with ThreadPoolExecutor(8) as pool:
        for g, img in zip(missing, pool.map(lambda g: og_image(g["link"]["url"]), missing)):
            g["img"] = img
            g["img_tried"] = True
    GAMES.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    total = sum(1 for lst in data["lists"] for g in lst["games"])
    have = sum(bool(g.get("img")) for lst in data["lists"] for g in lst["games"])
    print(f"games: {have}/{total} have a picture")


PLAY_WORDS = re.compile(r"gameplay|screenshot|screen ?shot|in[-_ ]?game|ingame|playing|game[-_ ]in[-_ ]progress|level|stage|battle|combat|board[-_ ]setup|setup|play", re.I)
NOT_PLAY = re.compile(r"logo|cover|box|boxart|icon|flag|map of|portrait|signature|\.svg$", re.I)


def gameplay_images():
    data = json.loads(GAMES.read_text())
    games = [g for lst in data["lists"] for g in lst["games"] if "play" not in g]
    qids = sorted({g["wikidata"] for g in games if g.get("wikidata")})
    steam = {}
    for i in range(0, len(qids), 50):
        status, body = fetch("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(
            {"action": "wbgetentities", "format": "json", "ids": "|".join(qids[i:i + 50]), "props": "claims"}))
        if status != 200:
            continue
        for q, ent in json.loads(body)["entities"].items():
            for c in ent.get("claims", {}).get("P1733", []):
                v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
                if v and q not in steam:
                    steam[q] = v
    print(f"gameplay: {len(steam)} games have a Steam ID")

    def steam_shot(app):
        status, body = fetch(f"https://store.steampowered.com/api/appdetails?appids={app}&filters=screenshots")
        if status != 200:
            return None
        info = json.loads(body).get(str(app), {})
        shots = (info.get("data") or {}).get("screenshots") or []
        return shots[0]["path_thumbnail"].split("?")[0] if shots else None

    apps = sorted({steam[g["wikidata"]] for g in games if g.get("wikidata") in steam})
    shot = {}
    for n, app in enumerate(apps):  # Steam allows about 200 requests in 5 minutes
        shot[app] = steam_shot(app)
        time.sleep(1.6)
        if n % 50 == 49:
            print(f"  {n + 1}/{len(apps)} Steam pages")
    for g in games:
        g["play"] = shot.get(steam.get(g.get("wikidata")))

    # Wikipedia: an in-game file among the article's images, by name; not the lead image.
    rest = [g for g in games if not g["play"] and g.get("wikipedia")]
    titles = sorted({urllib.parse.unquote(g["wikipedia"].rsplit("/wiki/", 1)[1]).replace("_", " ") for g in rest})
    pick = {}
    for i in range(0, len(titles), 50):
        batch = titles[i:i + 50]
        status, body = fetch("https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(
            {"action": "query", "format": "json", "formatversion": 2, "prop": "images|pageimages", "piprop": "name", "imlimit": "max",
             "redirects": 1, "titles": "|".join(batch)}))
        if status != 200:
            continue
        d = json.loads(body)["query"]
        back = {n["to"]: n["from"] for n in d.get("normalized", []) + d.get("redirects", [])}
        for p in d["pages"]:
            lead = p.get("pageimage", "")
            files = [im["title"] for im in p.get("images", []) if PLAY_WORDS.search(im["title"]) and not NOT_PLAY.search(im["title"])
                     and im["title"].split(":", 1)[-1].replace(" ", "_") != lead]
            if files:
                pick[back.get(p["title"], p["title"])] = files[0]
        time.sleep(1)
    files = sorted(set(pick.values()))
    url = {}
    for i in range(0, len(files), 50):
        status, body = fetch("https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(
            {"action": "query", "format": "json", "formatversion": 2, "prop": "imageinfo", "iiprop": "url", "iiurlwidth": 360,
             "titles": "|".join(files[i:i + 50])}))
        if status != 200:
            continue
        for p in json.loads(body)["query"]["pages"]:
            info = (p.get("imageinfo") or [{}])[0]
            if info.get("thumburl"):
                url[p["title"]] = info["thumburl"].split("?")[0]
        time.sleep(1)
    for g in rest:
        t = urllib.parse.unquote(g["wikipedia"].rsplit("/wiki/", 1)[1]).replace("_", " ")
        g["play"] = url.get(pick.get(t))
    GAMES.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    allg = [g for lst in data["lists"] for g in lst["games"]]
    print(f"gameplay: {sum(bool(g.get('play')) for g in allg)}/{len(allg)} games have a gameplay picture")


def page_images():
    cache = json.loads(OUT.read_text()) if OUT.exists() else {}
    todo = []
    for path in sorted((ROOT / "project/materials").glob("[0-9][0-9]-*.md")):
        for url in re.findall(r"\]\((https?://[^)\s]+)\)\s*\|\s*$", path.read_text(), re.M):
            if url not in cache:
                todo.append(("material", url))
    for lib in json.loads(LIBS.read_text())["libraries"]:
        for e in lib["examples"]:
            if e["url"] and e["url"] not in cache:
                todo.append((lib["slug"], e["url"]))
    todo = list(dict.fromkeys(todo))
    print(f"pages: {len(todo)} to look up, {len(cache)} cached")

    def work(item):
        kind, url = item
        return url, og_image(url) if kind == "material" else example_image(kind, url)

    done = 0
    with ThreadPoolExecutor(8) as pool:
        for url, img in pool.map(work, todo):
            cache[url] = img
            done += 1
            if done % 200 == 0:
                print(f"  {done}/{len(todo)}")
                OUT.write_text(json.dumps(cache, indent=0, ensure_ascii=False))
    OUT.write_text(json.dumps(cache, indent=0, ensure_ascii=False) + "\n")
    print(f"pages: {sum(bool(v) for v in cache.values())}/{len(cache)} have a picture")


if __name__ == "__main__":
    steps = sys.argv[1:] or ["games", "gameplay", "pages"]
    if "games" in steps:
        game_images()
    if "gameplay" in steps:
        gameplay_images()
    if "pages" in steps:
        page_images()
