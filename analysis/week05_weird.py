"""Week 5 · Who has the weirdest Wikipedia page?.

Question: Which Marvel page is the weirdest, and is it really?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#weird
Output: analysis/week05_weird.json, every number the section quotes.

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

import sys

from week05_text import graph, pages, weighted  # noqa: F401


def main():
    raise SystemExit("week05_weird.py is not written yet")


if __name__ == "__main__":
    sys.exit(main())
