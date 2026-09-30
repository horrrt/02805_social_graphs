"""Week 5 · Does network fame buy you more words?.

Question: Do more-linked characters get longer pages?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#fame
Output: docs/weeks/week05/data/fame.json, every number the section quotes.
Validate it with check(path, data) from check_pages.py before writing, after
adding its model to week05_schemas.py.

Steps, following the course's suggestion (exercise 5.9):
1. Compute page length (tokens) and in-degree (or another network measure) for all 303 nodes, isolates included.
2. Plot length against in-degree on sensible axes and fit or rank-correlate the relationship.
3. List the characters far above and far below it.
4. Read those pages and explain why each is unusual.

The section shows: length against in-degree with the outliers named and explained.

Read the corpus and the network only through week05_text (pages, graph,
weighted, nodes). State the tokenisation and preprocessing in the JSON, and
read the text underneath each claim before the page makes it.

    python analysis/week05_fame.py
"""

import json
import math
import re
import statistics
import sys
from pathlib import Path

from check_pages import check
from week05_text import graph, nodes, pages

OUT = Path(__file__).with_suffix(".json")
PAGE_OUT = Path(__file__).resolve().parents[1] / "docs/weeks/week05/data/fame.json"
TOKEN = re.compile(r"[A-Za-z]+(?:['-][A-Za-z]+)*")


def words(text):
    return TOKEN.findall(text.lower())


def first_sentence(text):
    cleaned = " ".join(text.split())
    match = re.search(r".+?[.!?](?:\s|$)", cleaned)
    return (match.group(0) if match else cleaned[:300]).strip()


def pearson(xs, ys):
    mean_x, mean_y = statistics.mean(xs), statistics.mean(ys)
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    denominator = math.sqrt(sum((x - mean_x) ** 2 for x in xs) * sum((y - mean_y) ** 2 for y in ys))
    return numerator / denominator


def main():
    text = pages()
    network = graph()
    names = nodes().set_index("node_id")["name"].to_dict()
    token_map = {node: words(value) for node, value in text.items()}
    lengths = {node: len(value) for node, value in token_map.items()}
    indegrees = dict(network.in_degree())
    xs = [math.log1p(indegrees[node]) for node in text]
    ys = [math.log(lengths[node]) for node in text]
    mean_x, mean_y = statistics.mean(xs), statistics.mean(ys)
    slope = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys)) / sum((x - mean_x) ** 2 for x in xs)
    intercept = mean_y - slope * mean_x

    rows = []
    residuals = {}
    for index, node in enumerate(text):
        residual = ys[index] - (intercept + slope * xs[index])
        residuals[node] = residual
        rows.append({
            "node": node,
            "name": names[node],
            "in_degree": indegrees[node],
            "tokens": lengths[node],
            "log_length_residual": residual,
            "excerpt": first_sentence(text[node]),
        })
    rows.sort(key=lambda row: (-row["log_length_residual"], row["node"]))
    payload = {
        "corpus": {
            "pages": len(text),
            "arcs": network.number_of_edges(),
            "zero_indegree_pages": sum(value == 0 for value in indegrees.values()),
            "token_rule": "lowercase ASCII words, allowing internal apostrophes and hyphens",
        },
        "relationship": {
            "x": "log1p(in_degree)",
            "y": "log(token_count)",
            "pearson_r": pearson(xs, ys),
            "slope": slope,
            "intercept": intercept,
        },
        "above": rows[:5],
        "below": sorted(rows, key=lambda row: (row["log_length_residual"], row["node"]))[:5],
    }
    check(OUT, payload)
    encoded = json.dumps(payload, indent=2) + "\n"
    OUT.write_text(encoded, encoding="utf-8")
    PAGE_OUT.parent.mkdir(parents=True, exist_ok=True)
    PAGE_OUT.write_text(encoded, encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
