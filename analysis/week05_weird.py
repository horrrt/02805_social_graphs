"""Week 5 · Who has the weirdest Wikipedia page?.

Question: Which Marvel page is the weirdest, and is it really?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#weird
Output: docs/weeks/week05/data/weird.json, every number the section quotes.
Validate it with check(path, data) from check_pages.py before writing, after
adding its model to week05_schemas.py.

Steps, following the course's suggestion (exercise 5.9):
1. Define 'weird' using only this week's tools (hapax share, type-token ratio, unusual n-grams, distance from the corpus word distribution, ...).
2. Rank the 303 pages by that metric.
3. Inspect the top pages: did the metric find something real, or formatting and boilerplate?
4. Control for page length, since most of these measures move with it.

The section shows: the ranking, the top pages read by hand, and what the metric actually picked up.

Read the corpus and the network only through week05_text (pages, graph,
weighted, nodes). State the tokenisation and preprocessing in the JSON, and
read the text underneath each claim before the page makes it.

    python analysis/week05_weird.py
"""

import json
import math
import re
import statistics
import sys
from collections import Counter
from pathlib import Path

from check_pages import check
from week05_text import graph, pages, nodes

OUT = Path(__file__).with_suffix(".json")
PAGE_OUT = Path(__file__).resolve().parents[1] / "docs/weeks/week05/data/weird.json"
TOKEN = re.compile(r"[A-Za-z]+(?:['-][A-Za-z]+)*")


def words(text):
    return TOKEN.findall(text.lower())


def first_sentence(text):
    cleaned = " ".join(text.split())
    match = re.search(r".+?[.!?](?:\s|$)", cleaned)
    return (match.group(0) if match else cleaned[:300]).strip()


def residuals(values, lengths):
    xs = [math.log(length) for length in lengths]
    mean_x, mean_y = statistics.mean(xs), statistics.mean(values)
    slope = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, values)) / sum((x - mean_x) ** 2 for x in xs)
    intercept = mean_y - slope * mean_x
    return [value - (intercept + slope * x) for value, x in zip(values, xs)], slope, intercept


def main():
    text = pages()
    names = nodes().set_index("node_id")["name"].to_dict()
    token_map = {node: words(value) for node, value in text.items()}
    lengths = [len(token_map[node]) for node in text]
    diversity = []
    for node in text:
        counts = Counter(token_map[node])
        diversity.append(len(counts) / len(token_map[node]))
    adjusted, slope, intercept = residuals(diversity, lengths)
    rows = []
    for node, score in zip(text, adjusted):
        counts = Counter(token_map[node])
        rows.append({
            "node": node,
            "name": names[node],
            "tokens": len(token_map[node]),
            "types": len(counts),
            "type_token_ratio": len(counts) / len(token_map[node]),
            "hapax_share": sum(value == 1 for value in counts.values()) / len(counts),
            "length_adjusted_score": score,
            "excerpt": first_sentence(text[node]),
        })
    rows.sort(key=lambda row: (-row["length_adjusted_score"], row["node"]))
    payload = {
        "corpus": {
            "pages": len(text),
            "token_rule": "lowercase ASCII words, allowing internal apostrophes and hyphens",
        },
        "definition": {
            "score": "type-token ratio residual after a linear fit against log(token_count)",
            "fit_slope": slope,
            "fit_intercept": intercept,
            "interpretation": "positive values have more distinct word types than pages of similar length",
        },
        "top": rows[:10],
        "bottom": sorted(rows, key=lambda row: (row["length_adjusted_score"], row["node"]))[:10],
    }
    check(OUT, payload)
    encoded = json.dumps(payload, indent=2) + "\n"
    OUT.write_text(encoded, encoding="utf-8")
    PAGE_OUT.parent.mkdir(parents=True, exist_ok=True)
    PAGE_OUT.write_text(encoded, encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
