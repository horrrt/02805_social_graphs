"""Week 5 · Heaps' law of the Marvel universe.

Question: Do minor characters bring new words, or repeat the famous ones?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#heaps
Output: docs/weeks/week05/data/heaps.json, every number the section quotes.
Validate it with check(path, data) from check_pages.py before writing, after
adding its model to week05_schemas.py.

Steps, following the course's suggestion (exercise 5.9):
1. Order the pages by in-degree in graph(), most-linked first, and add them one at a time.
2. Plot types seen against tokens seen (Heaps' curve).
3. Repeat in the opposite order and in random orders (many seeds) for a baseline.
4. Read the words the late pages add: new vocabulary or names and noise?

The section shows: vocabulary growth in fame order, reverse order and the random-order band.

Read the corpus and the network only through week05_text (pages, graph,
weighted, nodes). State the tokenisation and preprocessing in the JSON, and
read the text underneath each claim before the page makes it.

    python analysis/week05_heaps.py
"""

import json
import random
import re
import statistics
import sys
from pathlib import Path

from check_pages import check
from week05_text import graph, pages

OUT = Path(__file__).with_suffix(".json")
PAGE_OUT = Path(__file__).resolve().parents[1] / "docs/weeks/week05/data/heaps.json"
TOKEN = re.compile(r"[A-Za-z]+(?:['-][A-Za-z]+)*")
SEED = 505
RUNS = 200
CHECKPOINTS = [10, 50, 100, 200, 303]


def words(text):
    return TOKEN.findall(text.lower())


def curve(order, token_map):
    seen = set()
    total = 0
    rows = []
    for index, node in enumerate(order, 1):
        page_words = token_map[node]
        total += len(page_words)
        seen.update(page_words)
        if index in CHECKPOINTS:
            rows.append({"pages": index, "tokens": total, "types": len(seen)})
    return rows


def main():
    text = pages()
    network = graph()
    token_map = {node: words(value) for node, value in text.items()}
    fame_order = sorted(text, key=lambda node: (-network.in_degree(node), node))
    reverse_order = sorted(text, key=lambda node: (network.in_degree(node), node))

    rng = random.Random(SEED)
    random_curves = {point: [] for point in CHECKPOINTS}
    for _ in range(RUNS):
        order = list(text)
        rng.shuffle(order)
        for row in curve(order, token_map):
            random_curves[row["pages"]].append(row["types"])

    payload = {
        "corpus": {
            "pages": len(text),
            "arcs": network.number_of_edges(),
            "zero_indegree_pages": sum(network.in_degree(node) == 0 for node in text),
            "token_rule": "lowercase ASCII words, allowing internal apostrophes and hyphens",
        },
        "text_checks": [
            {
                "node": "Helix_(Marvel_Comics)",
                "quote": "The Jackal experiments on Rafael, mutating him further.",
            },
            {
                "node": "Spider-Man",
                "quote": "Spider-Man is a superhero appearing in American comic books published by Marvel Comics.",
            },
        ],
        "orders": {
            "most_linked_first": curve(fame_order, token_map),
            "least_linked_first": curve(reverse_order, token_map),
        },
        "random_baseline": {
            "seed": SEED,
            "runs": RUNS,
            "vocabulary": [
                {
                    "pages": point,
                    "mean": statistics.mean(values),
                    "sd": statistics.stdev(values),
                    "min": min(values),
                    "max": max(values),
                }
                for point, values in random_curves.items()
            ],
        },
    }
    check(OUT, payload)
    encoded = json.dumps(payload, indent=2) + "\n"
    OUT.write_text(encoded, encoding="utf-8")
    PAGE_OUT.parent.mkdir(parents=True, exist_ok=True)
    PAGE_OUT.write_text(encoded, encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
