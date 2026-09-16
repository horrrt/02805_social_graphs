"""Run the whole migration harvest, stage by stage.

    python scripts/migration/run_all.py              # everything
    python scripts/migration/run_all.py --from links # resume part way

Each stage writes its output under build/migration/ and reads the previous
stage's file, so a stage can be re-run on its own after a change without
re-crawling Wikipedia.
"""

from __future__ import annotations

import argparse
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
STAGES = [
    ("categories", "crawl_categories.py"),
    ("wikidata", "fetch_wikidata.py"),
    ("classify", "classify.py"),
    ("links", "fetch_links.py"),
    ("emit", "emit.py"),
    ("countries", "fetch_country_layer.py"),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from", dest="start", default="categories",
                        choices=[name for name, _ in STAGES])
    parser.add_argument("--only", action="append", default=[],
                        choices=[name for name, _ in STAGES])
    args = parser.parse_args()

    names = [name for name, _ in STAGES]
    wanted = args.only or names[names.index(args.start):]
    for name, script in STAGES:
        if name not in wanted:
            continue
        print(f"\n=== {name} ===", flush=True)
        result = subprocess.run([sys.executable, str(HERE / script)])
        if result.returncode != 0:
            sys.exit(f"stage {name} failed with {result.returncode}")


if __name__ == "__main__":
    main()
