"""Week 5 · Catch Wikipedia copying itself.

Question: Which Marvel pages copy text from each other?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#copying
Output: analysis/week05_copying.json, every number the section quotes.

Steps, following the course's suggestion (exercise 5.9):
1. Tokenise every page with one stated rule and collect all 8-grams (try 8 and one other length).
2. Find page pairs sharing at least one long n-gram; count shared n-grams per pair.
3. Build the copying network (page -- page, weight = shared n-grams) and read its biggest clusters.
4. Open the shared passages: copied plot summary, templated paragraph, or just a common phrase?

The section shows: the copying network and its largest clusters, with the shared passage shown for each.

Read the corpus and the network only through week05_text (pages, graph,
weighted, nodes). State the tokenisation and preprocessing in the JSON, and
read the text underneath each claim before the page makes it.

    python analysis/week05_copying.py
"""

import sys

from week05_text import graph, pages, weighted  # noqa: F401


def main():
    raise SystemExit("week05_copying.py is not written yet")


if __name__ == "__main__":
    sys.exit(main())
