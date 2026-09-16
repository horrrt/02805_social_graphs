"""Stamp the week 3 post's assets so a deploy cannot be served stale.

GitHub Pages caches assets for about ten minutes. That is long enough for a
reader who visited before a deploy to run the previous version's JavaScript
against the new version's markup, which looks exactly like a bug and wasted
real time diagnosing one. The fix is a content hash in the URL: change the
code, change the URL, and no cache can hand back the old file.

The stamp is the first ten hex characters of a SHA-256 over every script and
stylesheet the post loads, so it moves when any of them moves and stays put
when none do.

    python scripts/stamp_week03.py           # rewrite both editions
    python scripts/stamp_week03.py --check   # exit non-zero if stale
"""

from __future__ import annotations

import argparse
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = [ROOT / "docs/weeks/week03/index.html", ROOT / "docs/v2/weeks/week03/index.html"]
WATCHED = [
    "docs/assets/js/week03-boot.js",
    "docs/assets/js/corridor.js",
    "docs/assets/js/questions.js",
    "docs/assets/js/variants/d3.js",
    "docs/assets/js/variants/echarts.js",
    "docs/assets/js/variants/globe.js",
    "docs/assets/js/variants/atlas.js",
    "docs/assets/js/variants/deck.js",
    "docs/assets/css/corridor.css",
]


def stamp() -> str:
    digest = hashlib.sha256()
    for name in WATCHED:
        digest.update((ROOT / name).read_bytes())
    return digest.hexdigest()[:10]


def rewrite(html: str, value: str) -> str:
    html = re.sub(r'(week03-boot\.js)(\?v=[0-9a-f]+)?"', rf'\1?v={value}"', html)
    html = re.sub(r'(corridor\.css)(\?v=[0-9a-f]+)?"', rf'\1?v={value}"', html)
    return html


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    value = stamp()
    stale = []
    for page in PAGES:
        current = page.read_text(encoding="utf-8")
        wanted = rewrite(current, value)
        if current != wanted:
            stale.append(page.relative_to(ROOT))
            if not args.check:
                page.write_text(wanted, encoding="utf-8")

    if args.check:
        if stale:
            sys.exit(
                f"stale build stamp in {', '.join(str(p) for p in stale)}. "
                "Run: python scripts/stamp_week03.py"
            )
        print(f"build stamp {value} is current")
        return
    print(f"build stamp {value}" + (f", rewrote {len(stale)} page(s)" if stale else ", unchanged"))


if __name__ == "__main__":
    main()
