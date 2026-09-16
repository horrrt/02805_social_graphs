"""Rebuild every file the week 3 post ships, from the original sources.

Nothing large is kept in the repository that this cannot recreate. Raw inputs
(a 6 MB spreadsheet, an 820 KB boundary file, 3.5 MB of libraries, 1.8 MB of
imagery) live in build/raw/, which is gitignored; what gets committed is the
derived output, which is an order of magnitude smaller and is what the browser
actually loads.

    python scripts/rebuild_week03.py            # download what is missing, rebuild all
    python scripts/rebuild_week03.py --check    # report only: what is committed, and its source
    python scripts/rebuild_week03.py --force    # re-download even if cached
    python scripts/rebuild_week03.py --fast     # reuse the cached null model

The null model is 100 degree-preserving shuffles and takes a few minutes; every
other step is seconds once the downloads are cached.
"""

from __future__ import annotations

import argparse
import pathlib
import subprocess
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "build" / "raw"
UA = "02805-social-graphs-course-project/0.1 (gyula.kurthy1@gmail.com)"

# Everything the build needs that is not in the repository.
DOWNLOADS = [
    ("undesa_stock_2024.xlsx",
     "https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd"
     "/files/undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx",
     "UN DESA International Migrant Stock, Rev. 2024"),
    ("routes.dat",
     "https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat",
     "OpenFlights airline routes"),
    ("airports.dat",
     "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat",
     "OpenFlights airports"),
    ("countries.dat",
     "https://raw.githubusercontent.com/jpatokal/openflights/master/data/countries.dat",
     "OpenFlights country codes"),
    ("ne_110m_countries.geojson",
     "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson"
     "/ne_110m_admin_0_countries.geojson",
     "Natural Earth 1:110m admin 0 boundaries, public domain"),
]

# Vendored at their pinned versions. These are committed because GitHub Pages
# serves the repository as it stands: a library that is not in the repo is a
# library the published site cannot load.
VENDOR = [
    ("docs/assets/vendor/d3-7.9.0.min.js",
     "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js", "ISC"),
    ("docs/assets/vendor/echarts-5.5.1.min.js",
     "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js", "Apache-2.0"),
    ("docs/assets/vendor/globe.gl-2.32.0.min.js",
     "https://cdn.jsdelivr.net/npm/globe.gl@2.32.0/dist/globe.gl.min.js", "MIT"),
    ("docs/assets/vendor/deck.gl-9.0.30.min.js",
     "https://cdn.jsdelivr.net/npm/deck.gl@9.0.30/dist.min.js", "MIT"),
]

# Imagery for ?variant=atlas, downscaled on the way in.
TEXTURES = [
    ("earth-blue-marble.jpg",
     "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg",
     "docs/assets/textures/earth-day-2048.jpg", 2048, "72"),
    ("earth-topology.png",
     "https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png",
     "docs/assets/textures/earth-bump-1024.jpg", 1024, "65"),
]

# What the browser loads, and what made it.
COMMITTED = [
    ("docs/assets/data/week03_corridors.json",
     "analysis/week03_corridor_control.py", "UN DESA stock + OpenFlights + Wikidata"),
    ("docs/assets/data/week03_edges.json",
     "analysis/week03_corridor_control.py", "UN DESA stock + OpenFlights"),
    ("docs/assets/data/world_outline.geo.json",
     "scripts/migration/build_world_outline.py", "Natural Earth 1:110m"),
    ("docs/assets/textures/earth-day-2048.jpg", "scripts/rebuild_week03.py", "NASA Blue Marble"),
    ("docs/assets/textures/earth-bump-1024.jpg", "scripts/rebuild_week03.py", "Earth topography"),
    ("docs/assets/vendor/d3-7.9.0.min.js", "scripts/rebuild_week03.py", "jsDelivr, pinned"),
    ("docs/assets/vendor/echarts-5.5.1.min.js", "scripts/rebuild_week03.py", "jsDelivr, pinned"),
    ("docs/assets/vendor/globe.gl-2.32.0.min.js", "scripts/rebuild_week03.py", "jsDelivr, pinned"),
    ("docs/assets/vendor/deck.gl-9.0.30.min.js", "scripts/rebuild_week03.py", "jsDelivr, pinned"),
    ("docs/weeks/week03/index.html", "hand-written", "the post itself"),
    ("docs/v2/weeks/week03/index.html", "scripts/sync_week03_v2.py", "generated from the above"),
]


def size(path: pathlib.Path) -> str:
    if not path.exists():
        return "MISSING"
    kb = path.stat().st_size / 1024
    return f"{kb / 1024:.1f} MB" if kb > 1024 else f"{kb:.0f} KB"


def fetch(url: str, target: pathlib.Path, force: bool) -> None:
    if target.exists() and target.stat().st_size > 0 and not force:
        print(f"  cached  {target.name} ({size(target)})")
        return
    print(f"  fetch   {target.name} … ", end="", flush=True)
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=600) as response:
        target.write_bytes(response.read())
    print(size(target))


def run(*command: str) -> None:
    print(f"  run     {' '.join(command[1:])}", flush=True)
    result = subprocess.run(command, cwd=ROOT)
    if result.returncode != 0:
        sys.exit(f"failed: {' '.join(command)}")


def report() -> None:
    print("\nCommitted, and what rebuilds it:\n")
    width = max(len(path) for path, _, _ in COMMITTED)
    total = 0
    for path, maker, origin in COMMITTED:
        full = ROOT / path
        if full.exists():
            total += full.stat().st_size
        print(f"  {path:<{width}}  {size(full):>8}  {maker}  ({origin})")
    print(f"\n  {'total':<{width}}  {total / 1024 / 1024:>7.1f} MB")
    print("\nNot committed, rebuilt on demand into build/raw/:\n")
    for name, _, what in DOWNLOADS:
        print(f"  {name:<32} {size(RAW / name):>8}  {what}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="report only, build nothing")
    parser.add_argument("--force", action="store_true", help="re-download cached inputs")
    parser.add_argument("--fast", action="store_true", help="reuse the cached null model")
    args = parser.parse_args()

    if args.check:
        report()
        return

    print("1. raw inputs")
    for name, url, _ in DOWNLOADS:
        fetch(url, RAW / name, args.force)

    print("\n2. libraries, pinned by version in the filename")
    for target, url, _ in VENDOR:
        fetch(url, ROOT / target, args.force)

    print("\n3. imagery, downscaled from the originals")
    for name, url, target, edge, quality in TEXTURES:
        fetch(url, RAW / name, args.force)
        out = ROOT / target
        if out.exists() and not args.force:
            print(f"  cached  {out.name} ({size(out)})")
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        # sips ships with macOS; on another platform resize these by hand and
        # keep the same filenames.
        result = subprocess.run(
            ["sips", "-Z", str(edge), "--setProperty", "format", "jpeg",
             "--setProperty", "formatOptions", quality, str(RAW / name), "--out", str(out)],
            capture_output=True,
        )
        if result.returncode != 0:
            print(f"  WARNING could not downscale {name}; sips is macOS only")
        else:
            print(f"  resize  {out.name} ({size(out)})")

    print("\n4. derived data")
    python = sys.executable
    run(python, str(ROOT / "scripts/migration/build_world_outline.py"))
    corridor = [python, str(ROOT / "analysis/week03_corridor_control.py")]
    if args.fast:
        corridor.append("--reuse-null")
    run(*corridor)

    print("\n5. the second edition")
    run(python, str(ROOT / "scripts/sync_week03_v2.py"))

    report()
    print("\nNow run: node --test 'tests/*.test.mjs'")


if __name__ == "__main__":
    main()
