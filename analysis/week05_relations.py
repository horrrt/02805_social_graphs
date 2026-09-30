"""Week 5 · Turn links into relationships.

Question: Who are the friends, foes and family in the Marvel network?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#relations
Output: analysis/week05_relations.json, every number the section quotes.

Steps, following the course's suggestion (exercise 5.9):
1. For every arc A -> B in graph(), pull the sentence on A's page that mentions B: a concordance with one line per edge.
2. Design a small word list (enemy, ally, married, teammate, killed, ...) and label each edge with it. Keep an 'unlabelled' class.
3. Read a sample of labelled sentences per label and report how many the word list got right.
4. Compare labels with communities of weighted(): do enemies sit in different communities from allies? Run Louvain many times with seeds SEED + i (louvain() in week04_staffing.py) and test against rewired or shuffled-label baselines.

The section shows: the share of edges per label, and enemy vs ally edges that cross communities against a null.

Read the corpus and the network only through week05_text (pages, graph,
weighted, nodes). State the tokenisation and preprocessing in the JSON, and
read the text underneath each claim before the page makes it.

    python analysis/week05_relations.py
"""

import sys

from week05_text import graph, pages, weighted  # noqa: F401


def main():
    raise SystemExit("week05_relations.py is not written yet")


if __name__ == "__main__":
    sys.exit(main())
