"""Character networks from movie screenplays on IMSDb.

A screenplay names whoever speaks on a line of its own, in capitals, above
what they say, and starts each scene with a heading (INT. or EXT.). This
script downloads a film's script from IMSDb (imsdb.com, about 1,300 scripts),
splits it into scenes, finds who speaks in each, and links two characters for
every scene they both speak in. A node carries its lines and scenes; an edge
weight is the number of shared scenes.

    python analysis/movies.py --list                  # every title IMSDb lists
    python analysis/movies.py "Pulp Fiction" "Godfather"
    python analysis/movies.py --all                   # every listed script

Raw scripts are cached under build/movies/ and never committed: they are
copyrighted. The networks go to analysis/movies_networks.json, which holds
character names and counts only. A title is matched against IMSDb's listing,
which writes a leading article last ("Godfather", "Dark Knight, The").

Traps, all handled below:
- A script URL does not always follow the title; the listing page links it.
- Some listings say a script exists but serve an empty page, or a page with
  no scene headings (a transcript). Those films are kept with an "issue" and
  no network instead of a network of one scene.
- Speaker cues carry extensions, "VINCENT (V.O.)" or "JULES (CONT'D)", that
  are stripped, and transitions ("CUT TO:") sit in capitals too.
- Indentation is tabs in some scripts and spaces in others, so cue lines are
  found by their indent relative to the script's own most common cue indent.
"""

import argparse
import json
import re
import sys
from collections import Counter
from itertools import combinations
from pathlib import Path
from urllib.parse import quote

from bs4 import BeautifulSoup

import fetch

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "build" / "movies"
OUT = ROOT / "analysis" / "movies_networks.json"
BASE = "https://imsdb.com"
MIN_LINES = 3      # a character needs this many lines to be a node
MIN_SCENES = 5     # fewer scene headings than this means no usable scene split

HEADING = re.compile(r"^\s*(\d+[A-Z]?\s+)?(INT\.?|EXT\.?|INT\./EXT\.?|EXT\./INT\.?|I/E\.?)[\s./-]")
EXTENSION = re.compile(r"\s*\((?:[^)]*)\)\s*")
NOT_SPEAKERS = {
    "CONTINUED", "CONT'D", "CONTD", "MORE", "THE END", "END", "FADE IN", "FADE OUT", "FADE TO BLACK",
    "CUT TO", "DISSOLVE TO", "SMASH CUT", "MATCH CUT", "INTERCUT", "BACK TO SCENE", "TITLE", "SUPER",
    "BLACK", "CREDITS", "OMITTED", "LATER", "MONTAGE", "END MONTAGE", "FLASHBACK", "END FLASHBACK",
    "CLOSE ON", "ANGLE ON", "POV", "INSERT", "BEAT", "SILENCE", "NIGHT", "DAY", "MOMENTS LATER",
}


def session():
    return fetch.session(fetch.agent(), min_interval=1.0)


def listing(s):
    """Every (title, listing URL) IMSDb lists, sorted by title."""
    html = fetch.get(s, f"{BASE}/all-scripts.html").text
    soup = BeautifulSoup(html, "html.parser")
    rows = set()
    for a in soup.select('a[href^="/Movie Scripts/"]'):
        title = a.get_text(strip=True)
        if title:
            rows.add((title, BASE + quote(a["href"])))
    return sorted(rows)


def find(rows, wanted):
    """The listed title matching wanted: exact (ignoring case and a moved
    article), else the only title containing it."""
    def norm(t):
        t = t.lower().strip()
        m = re.match(r"^(.*), (the|a|an)( \(\d{4}\))?$", t)
        if m:
            t = f"{m.group(2)} {m.group(1)}{m.group(3) or ''}"
        return re.sub(r"[^a-z0-9]+", " ", t).strip()
    key = norm(wanted)
    exact = [r for r in rows if norm(r[0]) == key or norm(r[0]) == norm(f"the {wanted}")]
    if exact:
        return exact[0]
    partial = [r for r in rows if key in norm(r[0])]
    if len(partial) == 1:
        return partial[0]
    hint = "; ".join(t for t, _ in partial[:8]) or "none"
    raise SystemExit(f"{wanted!r}: {len(partial)} listed titles match ({hint}). Use the exact listed title.")


def slug(title):
    return re.sub(r"[^A-Za-z0-9]+", "-", title).strip("-")


def script_text(s, title, page_url):
    """The script's plain text, from the cache or IMSDb (via its listing page)."""
    path = CACHE / f"{slug(title)}.txt"
    if path.exists():
        return path.read_text(encoding="utf-8")
    soup = BeautifulSoup(fetch.get(s, page_url).text, "html.parser")
    link = soup.select_one('a[href^="/scripts/"]')
    text = ""
    if link:
        page = BeautifulSoup(fetch.get(s, BASE + link["href"]).text, "html.parser")
        pre = page.select_one("td.scrtext pre") or page.select_one("td.scrtext")
        text = pre.get_text("\n") if pre else ""
    CACHE.mkdir(parents=True, exist_ok=True)
    path.with_suffix(".part").write_text(text, encoding="utf-8")
    path.with_suffix(".part").rename(path)
    return text


def cue_name(stripped):
    """The character a cue line names, or None when it names no one."""
    name = EXTENSION.sub(" ", stripped).strip().rstrip(":").strip()
    name = re.sub(r"\s+", " ", name)
    if not name or len(name) > 30 or not re.search(r"[A-Z]", name):
        return None
    if name != name.upper() or stripped.endswith(":") or name in NOT_SPEAKERS:
        return None
    if HEADING.match(name) or re.search(r"\d{2,}|[!?]", name):
        return None
    return name


def parse(text):
    """Scenes of a script, each the list of characters' lines in order:
    [[(name, 1), ...], ...]. Returns (scenes, issue), issue None when fine."""
    lines = text.expandtabs(8).splitlines()
    nonblank = [i for i, ln in enumerate(lines) if ln.strip()]
    nxt = {a: b for a, b in zip(nonblank, nonblank[1:])}

    candidates = []
    for i in nonblank:
        stripped = lines[i].strip()
        name = cue_name(stripped)
        follow = lines[nxt[i]].strip() if i in nxt else ""
        # Dialogue follows a cue: lowercase text or a (parenthetical).
        if name and (re.search(r"[a-z]", follow) or follow.startswith("(")):
            candidates.append((i, name, len(lines[i]) - len(lines[i].lstrip())))
    if not candidates:
        return [], "no speaker cues found"
    indent = Counter(c[2] for c in candidates).most_common(1)[0][0]
    cues = {i: name for i, name, ind in candidates if abs(ind - indent) <= 6}

    headings = [i for i in nonblank if HEADING.match(lines[i])]
    if len(headings) < MIN_SCENES:
        return [], f"only {len(headings)} scene headings"
    starts = set(headings)
    scenes, current = [], []
    for i in nonblank:
        if i in starts:
            if current:
                scenes.append(current)
            current = []
        elif i in cues:
            current.append(cues[i])
    if current:
        scenes.append(current)
    return scenes, None


def network(scenes, min_lines=MIN_LINES):
    """Nodes {name: {lines, scenes}} and weighted edges [[a, b, shared scenes]]."""
    lines = Counter(name for scene in scenes for name in scene)
    keep = {n for n, c in lines.items() if c >= min_lines}
    present = Counter()
    edges = Counter()
    for scene in scenes:
        who = sorted(set(scene) & keep)
        present.update(who)
        edges.update(combinations(who, 2))
    nodes = {n: {"lines": lines[n], "scenes": present[n]} for n in sorted(keep)}
    return nodes, sorted([a, b, w] for (a, b), w in edges.items())


def build(s, title, page_url):
    text = script_text(s, title, page_url)
    scenes, issue = parse(text) if text.strip() else ([], "empty script page")
    row = {"title": title, "source": page_url, "scenes": len(scenes)}
    if issue:
        return {**row, "issue": issue, "nodes": {}, "edges": []}
    nodes, edges = network(scenes)
    return {**row, "issue": None, "nodes": nodes, "edges": edges}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("titles", nargs="*", help="films to build, as IMSDb lists them")
    p.add_argument("--list", action="store_true", help="print every listed title and stop")
    p.add_argument("--all", action="store_true", help="build every listed script (slow: ~1 s a request)")
    args = p.parse_args(argv)

    s = session()
    rows = listing(s)
    if args.list:
        print("\n".join(t for t, _ in rows))
        print(f"{len(rows)} titles", file=sys.stderr)
        return
    picked = rows if args.all else [find(rows, t) for t in args.titles]
    if not picked:
        p.error("name at least one title, or pass --all or --list")

    films = json.loads(OUT.read_text()) if OUT.exists() else {}
    for n, (title, url) in enumerate(picked, 1):
        films[title] = build(s, title, url)
        f = films[title]
        status = f["issue"] or f"{len(f['nodes'])} characters, {len(f['edges'])} links, {f['scenes']} scenes"
        print(f"[{n}/{len(picked)}] {title}: {status}", flush=True)
    OUT.write_text(json.dumps(dict(sorted(films.items())), indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(films)} films)")


if __name__ == "__main__":
    main()
