"""Cold Read's character portraits, downloaded once and served from the repo, one folder per source.

Owner: Gyula. The game used to load each portrait from Wikipedia on every visit. This script fetches
each source's images once, crops each to a square from the top (faces sit high in comic art), shrinks
it to 160 px and stores it as WebP under public/play/cold-read/portraits/<source>/<slug>.webp.
src/features/cold-read/portraits.ts sets the order the game tries the sources in; a page no source
covers shows initials.

Sources:
  wikipedia  each page's lead image (prop=pageimages), from analysis/week06_cold_read_images.json:
             242 of the 303 pages.
  marveldb   the character's entry on the Marvel Database (marvel.fandom.com), from
             analysis/week06_portrait_sources.json: 170 pages. 119 entries come from Wikidata's link
             (P6262) and are exact. The rest fill the pages Wikipedia lacks: found by the real name in
             the page's infobox, by a search whose hit must carry a name the page gives, or picked by
             hand; each was checked by eye. Silencer has no entry, so she gets the art of the cover she
             first appeared on, a group shot.
Both are mostly copyrighted comic art. Storing copies in a public repo is redistribution, a weaker
footing than linking; the group chose it anyway.

The Marvel Database's image server refuses requests that don't come from its own site, so downloads
send its address as the referrer, through curl (Python's urllib still gets 403 there).

Writes the images and src/features/cold-read/portraits.generated.ts (which pages each source has).
Skips images already on disk, so a rerun only fetches what is new.

    python analysis/week06_portraits.py              # every source, about 3 minutes
    python analysis/week06_portraits.py marveldb     # one source
"""

import io
import json
import re
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

from PIL import Image
import tables

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/play/cold-read/portraits"
INDEX = ROOT / "src/features/cold-read/portraits.generated.ts"
SIZE, QUALITY, PAUSE = 160, 82, 0.2
UA = "LogLogLegends/1.0 (DTU 02805 course project; https://github.com/horrrt/02805_social_graphs)"
MARVELDB = "https://marvel.fandom.com/api.php?"


def titles():
    """Each page's title as the game's data names it; five differ from the page id
    (Anne_Weying is "She-Venom (Patricia Robertson)")."""
    return {row["node_id"]: row["name"] for row in tables.rows(ROOT / "data/week1_nodes.parquet")}


TITLES = titles()


def slug(node_id):
    """A page's file name, from its title: Ghost Rider (Danny Ketch) -> ghost-rider-danny-ketch.
    portraits.ts derives the same name from the title."""
    return re.sub(r"[^a-z0-9]+", "-", TITLES[node_id].lower()).strip("-")


def curl(url, referer=None):
    cmd = ["curl", "-sSfL", "--retry", "4", "--retry-delay", "3", "-A", UA]
    if referer:
        cmd += ["-H", f"Referer: {referer}"]
    return subprocess.run(cmd + [url], capture_output=True, check=True).stdout


def wikipedia():
    images = json.loads((ROOT / "analysis/week06_cold_read_images.json").read_text())
    return {i: {"url": v["thumb"].split("?")[0]} for i, v in images.items()}


def marveldb():
    """Each entry's lead image as a 480 px thumbnail, from the Marvel Database's API."""
    sources = json.loads((ROOT / "analysis/week06_portrait_sources.json").read_text())
    pages = {i: s["page"] for i, s in sources.items() if "page" in s}
    titles = sorted(set(pages.values()))
    found = {}
    for k in range(0, len(titles), 40):
        q = json.loads(curl(MARVELDB + urllib.parse.urlencode({
            "action": "query", "format": "json", "formatversion": 2, "prop": "pageimages", "piprop": "thumbnail",
            "pithumbsize": 480, "redirects": 1, "titles": "|".join(titles[k:k + 40])})))["query"]
        back = {n["to"]: n["from"] for n in q.get("normalized", [])}
        for n in q.get("redirects", []):
            back[n["to"]] = back.get(n["from"], n["from"])
        for p in q["pages"]:
            if "thumbnail" in p:
                found[back.get(p["title"], p["title"])] = p["thumbnail"]["source"]
        time.sleep(PAUSE)
    out = {i: {"url": found[t]} for i, t in pages.items() if t in found}
    for i, s in sources.items():
        if "file" in s:
            q = json.loads(curl(MARVELDB + urllib.parse.urlencode({
                "action": "query", "format": "json", "formatversion": 2, "prop": "imageinfo", "iiprop": "url",
                "iiurlwidth": 480, "titles": "File:" + s["file"]})))["query"]
            out[i] = {"url": q["pages"][0]["imageinfo"][0]["thumburl"], "crop": s.get("crop")}
    missing = sorted(set(pages) - set(out))
    if missing:
        print(f"  marveldb: no image for {', '.join(missing)}")
    return out


SOURCES = {
    "wikipedia": (wikipedia, None),
    "marveldb": (marveldb, "https://marvel.fandom.com/"),
}


def square(data, crop=None):
    """Crop to a square, shrink to SIZE, return WebP bytes. Portraits crop from the top; a cover
    ("art") skips its masthead, the top quarter."""
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGBA") if img.mode in ("P", "LA", "RGBA") else img.convert("RGB")
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = min(int(h * 0.27), h - side) if crop == "art" else 0
    img = img.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=QUALITY, method=6)
    return buf.getvalue()


def build(name):
    fetch_list, referer = SOURCES[name]
    images = fetch_list()
    folder = OUT / name
    folder.mkdir(parents=True, exist_ok=True)
    have, failed = [], []
    for k, (node_id, img) in enumerate(sorted(images.items()), 1):
        path = folder / f"{slug(node_id)}.webp"
        if not path.exists():
            try:
                path.write_bytes(square(curl(img["url"], referer), img.get("crop")))
                time.sleep(PAUSE)
            except Exception as e:  # noqa: BLE001 - one bad image must not stop the rest
                failed.append((node_id, str(e)[:80]))
                continue
        have.append(node_id)
        if k % 40 == 0:
            print(f"  {name}: {k} of {len(images)}, {k / len(images):.0%}", flush=True)
    kb = sum(p.stat().st_size for p in folder.glob("*.webp")) / 1024
    print(f"{name}: {len(have)} portraits, {kb:.0f} KB on disk, {len(failed)} failed")
    for node_id, err in failed:
        print(f"  failed {node_id}: {err}")
    return have


def write_index(found):
    lines = [
        "// Written by analysis/week06_portraits.py: the pages each portrait source has, by title.",
        "// Edit the script, not this file.",
        "export const PORTRAIT_SOURCES = {",
    ]
    for name, ids in found.items():
        lines.append(f"  {name}: {json.dumps(sorted(TITLES[i] for i in ids), ensure_ascii=False)},")
    lines += ["} as const;", ""]
    INDEX.write_text("\n".join(lines))


def main():
    names = sys.argv[1:] or list(SOURCES)
    found = {}
    for name in SOURCES:
        folder = OUT / name
        if name in names:
            found[name] = build(name)
        elif folder.exists():
            # Keep a source that isn't being rebuilt in the index, as far as it is on disk.
            on_disk = {p.stem for p in folder.glob("*.webp")}
            found[name] = [i for i in SOURCES[name][0]() if slug(i) in on_disk]
    write_index(found)
    print(f"wrote {INDEX.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
