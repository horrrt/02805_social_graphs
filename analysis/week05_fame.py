"""Week 5 · Does network fame buy you more words?.

Question: Do more-linked characters get longer pages?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#fame
Output: analysis/week05_fame.json, every number the section quotes.

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

import sys

from week05_text import graph, pages, weighted  # noqa: F401


def main():
    raise SystemExit("week05_fame.py is not written yet")


if __name__ == "__main__":
    sys.exit(main())
