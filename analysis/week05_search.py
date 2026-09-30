"""Week 5 · A Marvel search engine in 20 lines.

Question: Can bag-of-words find the right Marvel page from a description?

Owner: (unassigned, put your name here and in WEEK05.md)

Page section: docs/weeks/week05/index.html#search
Output: docs/weeks/week05/data/search.json, every number the section quotes.
Validate it with check(path, data) from check_pages.py before writing, after
adding its model to week05_schemas.py.

Steps, following the course's suggestion (exercise 5.9):
1. Build a CountVectorizer document-term matrix over the 303 pages.
2. Turn a query ('Norse god of thunder') into a vector with the same vocabulary and rank pages by cosine similarity.
3. Write a fixed list of queries with the page each should find, and record the rank of the right page.
4. Collect the failures and explain each one from the words behind the match (TF-IDF comes next week).

The section shows: a table of queries, the expected page, its rank, and why each failure fails.

Read the corpus and the network only through week05_text (pages, graph,
weighted, nodes). State the tokenisation and preprocessing in the JSON, and
read the text underneath each claim before the page makes it.

    python analysis/week05_search.py
"""

import sys

from week05_text import graph, pages, weighted  # noqa: F401


def main():
    raise SystemExit("week05_search.py is not written yet")


if __name__ == "__main__":
    sys.exit(main())
