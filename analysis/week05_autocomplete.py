"""Week 5 · Community autocomplete.

Question: Does each Marvel community write in its own voice?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#autocomplete
Output: docs/weeks/week05/data/autocomplete.json, every number the section quotes.
Validate it with check(path, data) from check_pages.py before writing, after
adding its model to week05_schemas.py.

Steps, following the course's suggestion (exercise 5.9):
1. Find communities of weighted() with Louvain over many seeds (the same partition the relations section uses).
2. Train one trigram generator per community from its pages.
3. Generate one fake page for a new character per community.
4. Ask other groups to guess the community of each page and report how often they are right against chance. Leave the result empty until real answers are in.

The section shows: the fake pages and the guessing hit rate against the 1-in-k chance rate.

Read the corpus and the network only through week05_text (pages, graph,
weighted, nodes). State the tokenisation and preprocessing in the JSON, and
read the text underneath each claim before the page makes it.

    python analysis/week05_autocomplete.py
"""

import sys

from week05_text import graph, pages, weighted  # noqa: F401


def main():
    raise SystemExit("week05_autocomplete.py is not written yet")


if __name__ == "__main__":
    sys.exit(main())
