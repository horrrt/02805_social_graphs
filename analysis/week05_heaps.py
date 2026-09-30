"""Week 5 · Heaps' law of the Marvel universe.

Question: Do minor characters bring new words, or repeat the famous ones?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#heaps
Output: analysis/week05_heaps.json, every number the section quotes.

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

import sys

from week05_text import graph, pages, weighted  # noqa: F401


def main():
    raise SystemExit("week05_heaps.py is not written yet")


if __name__ == "__main__":
    sys.exit(main())
