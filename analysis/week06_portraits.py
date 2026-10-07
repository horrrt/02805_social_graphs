"""Cold Read's character portraits, downloaded once and kept in the repo, one folder per source.

Owner: Gyula. The game used to load each portrait from Wikipedia on every visit. This script fetches
every source's images once, crops each to a square from the top (faces sit high in comic art),
shrinks it to 160 px and stores it as WebP under public/play/cold-read/portraits/<source>/<slug>.webp,
so the site serves them itself. src/features/cold-read/portraits.ts picks the source the game shows;
a page a source lacks falls back to the next source, then to initials.

Sources (add one by writing a function that returns {node_id: image URL}):
  wikipedia  each page's lead image (prop=pageimages), from analysis/week06_cold_read_images.json.
             Mostly copyrighted comic art that Wikipedia uses under fair use; storing copies in a
             public repo is redistribution, a weaker footing than linking. The group chose it anyway.

Writes the images and src/features/cold-read/portraits.generated.ts (which pages each source has).
Skips images already on disk, so a rerun only fetches what is new.

    python analysis/week06_portraits.py              # every source
    python analysis/week06_portraits.py wikipedia    # one source
"""

import io
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/play/cold-read/portraits"
INDEX = ROOT / "src/features/cold-read/portraits.generated.ts"
SIZE, QUALITY, PAUSE = 160, 82, 0.15
UA = "LogLogLegends/1.0 (DTU 02805 course project; https://github.com/horrrt/02805_social_graphs)"


def slug(node_id):
    """A file name from a page id: Ghost_Rider_(Danny_Ketch) -> ghost-rider-danny-ketch."""
    return re.sub(r"[^a-z0-9]+", "-", node_id.lower()).strip("-")


def wikipedia():
    images = json.loads((ROOT / "analysis/week06_cold_read_images.json").read_text())
    return {i: v["thumb"].split("?")[0] for i, v in images.items()}


SOURCES = {
    "wikipedia": (wikipedia, "Each page's lead image on English Wikipedia; mostly comic art used there under fair use."),
}


def square(data):
    """Crop to a square from the top, shrink to SIZE, return WebP bytes."""
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGBA") if img.mode in ("P", "LA") else img.convert("RGB") if img.mode not in ("RGB", "RGBA") else img
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    img = img.crop((left, 0, left + side, side)).resize((SIZE, SIZE), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=QUALITY, method=6)
    return buf.getvalue()


def fetch(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30) as r:
                return r.read()
        except Exception:  # noqa: BLE001 - retried, then reported by the caller
            if i == tries - 1:
                raise
            time.sleep(2 ** (i + 1))
    return b""


def build(name):
    urls = SOURCES[name][0]()
    folder = OUT / name
    folder.mkdir(parents=True, exist_ok=True)
    have, failed = [], []
    for k, (node_id, url) in enumerate(sorted(urls.items()), 1):
        path = folder / f"{slug(node_id)}.webp"
        if not path.exists():
            try:
                path.write_bytes(square(fetch(url)))
                time.sleep(PAUSE)
            except Exception as e:  # noqa: BLE001 - one bad image must not stop the rest
                failed.append((node_id, str(e)[:80]))
                continue
        have.append(node_id)
        if k % 40 == 0:
            print(f"  {name}: {k} of {len(urls)}", flush=True)
    kb = sum(p.stat().st_size for p in folder.glob("*.webp")) / 1024
    print(f"{name}: {len(have)} portraits, {kb:.0f} KB on disk, {len(failed)} failed")
    for node_id, err in failed[:5]:
        print(f"  failed {node_id}: {err}")
    return have


def write_index(found):
    lines = [
        "// Written by analysis/week06_portraits.py: which pages each portrait source has.",
        "// Edit the script, not this file.",
        "export const PORTRAIT_SOURCES = {",
    ]
    for name, ids in found.items():
        lines.append(f"  {json.dumps(name)}: {{")
        lines.append(f"    credit: {json.dumps(SOURCES[name][1])},")
        lines.append(f"    pages: {json.dumps(sorted(ids))},")
        lines.append("  },")
    lines.append("} as const;")
    lines.append("")
    INDEX.write_text("\n".join(lines))


def main():
    names = sys.argv[1:] or list(SOURCES)
    found = {}
    # Keep sources already on disk in the index when only some are rebuilt.
    for name in SOURCES:
        folder = OUT / name
        if name in names:
            found[name] = build(name)
        elif folder.exists():
            urls = SOURCES[name][0]()
            found[name] = [i for i in urls if (folder / f"{slug(i)}.webp").exists()]
    write_index(found)
    print(f"wrote {INDEX.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
