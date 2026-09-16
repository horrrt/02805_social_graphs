"""Stage 1: walk the English Wikipedia category tree and collect candidates.

Breadth-first from `scope.SEED_CATEGORIES`. Every article in a visited category
becomes a candidate; a subcategory is visited when it survives `OFF_TOPIC` and
then matches either `ON_TOPIC` or `ORG_WORD`. Nothing is judged to be an
organisation here - that is stage 3's job.

    python scripts/migration/crawl_categories.py [--depth N] [--out DIR]
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
from collections import deque

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import scope
from wikiclients import WIKIPEDIA_API, api_paged


def members(category, namespace):
    return api_paged(
        WIKIPEDIA_API,
        "categorymembers",
        action="query",
        list="categorymembers",
        cmtitle=category,
        cmnamespace=namespace,
        cmlimit=500,
        cmprop="title|type",
    )


def crawl(max_depth):
    visited = {}
    candidates = {}
    queue = deque((seed, 0, "seed") for seed in scope.SEED_CATEGORIES)
    while queue:
        category, depth, parent = queue.popleft()
        if category in visited:
            continue
        visited[category] = {"depth": depth, "parent": parent}
        print(f"[{len(visited):5d}] d{depth} {category}", flush=True)

        for page in members(category, 0):
            candidates.setdefault(page["title"], []).append(category)

        if depth >= max_depth:
            continue
        for sub in members(category, 14):
            title = sub["title"]
            if title in visited:
                continue
            name = title.split(":", 1)[1]
            if scope.OFF_TOPIC.search(name):
                continue
            if not (scope.ON_TOPIC.search(name) or scope.ORG_WORD.search(name)):
                continue
            queue.append((title, depth + 1, category))
    return visited, candidates


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--depth", type=int, default=scope.MAX_DEPTH)
    parser.add_argument("--out", default="build/migration")
    args = parser.parse_args()

    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    visited, candidates = crawl(args.depth)
    (out / "categories.json").write_text(json.dumps(visited, indent=1, sort_keys=True))
    (out / "candidates.json").write_text(json.dumps(candidates, indent=1, sort_keys=True))
    print(f"\ncategories visited: {len(visited)}")
    print(f"candidate articles: {len(candidates)}")


if __name__ == "__main__":
    main()
