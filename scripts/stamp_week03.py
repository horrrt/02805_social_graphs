"""Stamp the week 3 post's assets so a deploy cannot be served stale.

GitHub Pages caches assets for about ten minutes. That is long enough for a
reader who visited before a deploy to run the previous version's JavaScript
against the new version's markup, which looks exactly like a bug and wasted
real time diagnosing one. The fix is a content hash in the URL: change the
code, change the URL, and no cache can hand back the old file.

Each asset carries a hash of what it actually depends on, rather than one
hash over everything. The stylesheet's stamp moves when the stylesheet moves;
the boot module's moves when any module in its import graph moves, or when
any of the seven data files it fetches does. That matters for the diff more
than for the reader: a stylesheet-only stamp means the style guide, which
loads no JavaScript, stops being rewritten every time a chart changes. Under
one shared hash it was rewritten on every commit.

The code and the data share one stamp rather than taking one each, because a
data file is fetched from inside a module and there is nowhere else to put a
version. The modules pass their own ?v= down to the files they fetch, so one
number has to cover both. It costs a re-download of the other half whenever
either moves, which on a static course site is nothing next to serving a
reader last week's numbers.

    python scripts/stamp_week03.py           # rewrite what is stale
    python scripts/stamp_week03.py --check   # exit non-zero if stale
    python scripts/stamp_week03.py --hook    # run it for me, and stop merge
                                             # conflicts on the generated stamp

The boot module hashes the whole graph rather than only itself because it
passes its own ?v= down to every module it imports, and those modules pass it
down again to every data file they fetch. See week03-boot.js and the dataUrl
helper in corridor.js. One stamp busts the lot.
"""

from __future__ import annotations

import argparse
import hashlib
import pathlib
import re
import stat
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = [
    ROOT / "docs/weeks/week03/index.html",
    ROOT / "docs/styleguide/index.html",
]

# filename in the HTML -> the files whose contents its stamp should follow.
ASSETS = {
    "corridor.css": ["docs/assets/css/corridor.css"],
    "week03-boot.js": [
        "docs/assets/js/week03-boot.js",
        "docs/assets/js/corridor.js",
        "docs/assets/js/questions.js",
        "docs/assets/js/echarts-views.js",
        "docs/assets/js/variants/d3.js",
        "docs/assets/js/variants/echarts.js",
        "docs/assets/js/variants/globe.js",
        "docs/assets/js/variants/atlas.js",
        "docs/assets/js/variants/deck.js",
        # The seven files the page fetches. They belong to this stamp because
        # a data file is fetched at a fixed URL from inside a module, so
        # nothing else can bust it: new URL() drops the query when it resolves
        # a relative path, and a reader would keep the previous deploy's
        # numbers for as long as the cache holds them. That happened during
        # the rank fix, with the browser showing one set of ranks while the
        # server served another.
        "docs/assets/data/week03_corridors.json",
        "docs/assets/data/week03_edges.json",
        "docs/assets/data/week03_cartography.json",
        "docs/assets/data/week03_asylum.json",
        "docs/assets/data/week03_closures.json",
        "docs/assets/data/week03_calendar.json",
        "docs/assets/data/world_outline.geo.json",
    ],
}

HOOK = """#!/bin/sh
# Installed by scripts/stamp_week03.py --hook
python3 scripts/stamp_week03.py >/dev/null || exit 1
git add docs/weeks/week03/index.html docs/styleguide/index.html 2>/dev/null
exit 0
"""


def stamp(paths) -> str:
    digest = hashlib.sha256()
    for name in paths:
        digest.update((ROOT / name).read_bytes())
    return digest.hexdigest()[:10]


def rewrite(html: str, stamps: dict[str, str]) -> str:
    for asset, value in stamps.items():
        # A lambda for the replacement rather than a backreference string:
        # the version has to be followed by the closing quote, and writing
        # that quote into an r-string replacement leaves a literal backslash
        # in the HTML, which then stops the pattern matching on the next run.
        html = re.sub(
            rf"({re.escape(asset)})(\?v=[0-9a-f]+)?\"",
            lambda _m, a=asset, v=value: f'{a}?v={v}"',
            html,
        )
    return html


def install_hook() -> None:
    target = ROOT / ".git" / "hooks" / "pre-commit"
    if not target.parent.exists():
        sys.exit("no .git/hooks here; run this inside the repository")
    target.write_text(HOOK, encoding="utf-8")
    target.chmod(target.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP)
    print(f"installed {target.relative_to(ROOT)} — the stamp now runs before every commit")

    # The merge driver .gitattributes points at. Git only allows a driver to
    # be named in config, never in a committed file, so every clone installs
    # it once — which is what this flag is for.
    import subprocess
    for key, value in (
        ("merge.stamped.name", "build-stamped HTML"),
        ("merge.stamped.driver", "python3 scripts/merge_stamped.py %O %A %B %L"),
    ):
        subprocess.run(["git", "config", key, value], cwd=ROOT, check=True)
    print("configured the merge driver — a rebase no longer stops on the stamp")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--hook", action="store_true", help="install the pre-commit hook")
    args = parser.parse_args()

    if args.hook:
        install_hook()
        return

    stamps = {asset: stamp(paths) for asset, paths in ASSETS.items()}
    stale = []
    for page in PAGES:
        current = page.read_text(encoding="utf-8")
        wanted = rewrite(current, stamps)
        if current != wanted:
            stale.append(page.relative_to(ROOT))
            if not args.check:
                page.write_text(wanted, encoding="utf-8")

    listing = " ".join(f"{asset} {value}" for asset, value in stamps.items())
    if args.check:
        if stale:
            sys.exit(
                f"stale build stamp in {', '.join(str(p) for p in stale)}. "
                "Run: python scripts/stamp_week03.py"
            )
        print(f"build stamps current: {listing}")
        return
    print(f"{listing}" + (f" · rewrote {len(stale)} page(s)" if stale else " · unchanged"))


if __name__ == "__main__":
    main()
