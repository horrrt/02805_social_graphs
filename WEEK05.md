# Week 5 · The Marvel network gets language

The plan for the Week 5 post (NLP I, "From language to numbers"), set up 30 September 2026. The post goes
in [docs/weeks/week05/index.html](docs/weeks/week05/index.html); every number comes from a script in
`analysis/`. We use the course's Marvel data and follow the seven openers in exercise 5.9 as the brief
words them.

Brief: <https://sunelehmann.com/socialgraphs2026-web/weeks/week5.html>, exercise 5.9, read 30 September
2026. Data: <https://sunelehmann.com/socialgraphs2026-web/data/>.

## What the brief asks of the post

Hand-in: one free-form post on the group site, the link in this week's Teams channel by Monday evening,
and friendly criticism for at least one other group.

Every section carries the same six parts, in this order:

1. What we asked (the question, answerable after reading).
2. What we did.
3. One strong figure or table.
4. What surprised us.
5. What we checked in the underlying text: quote the passage.
6. One limitation.

The brief says one good question with one convincing figure beats five methods thrown together. We are
doing all seven openers, so pick one for the top of the page once the results are in.

## Sections

| # | Section | Anchor | Owner | Script | Uses |
| --- | --- | --- | --- | --- | --- |
| 1 | Turn links into relationships | `#relations` | | `analysis/week05_relations.py` | pages, graph, weighted (communities) |
| 2 | Catch Wikipedia copying itself | `#copying` | | `analysis/week05_copying.py` | pages |
| 3 | A Marvel search engine in 20 lines | `#search` | | `analysis/week05_search.py` | pages |
| 4 | Community autocomplete | `#autocomplete` | | `analysis/week05_autocomplete.py` | pages, weighted (communities) |
| 5 | Heaps' law of the Marvel universe | `#heaps` | | `analysis/week05_heaps.py` | pages, graph (in-degree) |
| 6 | Does network fame buy you more words? | `#fame` | | `analysis/week05_fame.py` | pages, graph |
| 7 | Who has the weirdest Wikipedia page? | `#weird` | | `analysis/week05_weird.py` | pages |
| | Opening, closing, AI-use note | `#opening`, `#closing` | | | |

Put your name in the Owner column and in your script's docstring. Each script's docstring lists the steps
the brief suggests for its section.

### 1 · Turn links into relationships

- For every link A → B, which sentence on A's page mentions B?
- Label each edge from a small word list: enemy, ally, married, teammate, killed.
- Do enemies sit in different communities from allies?

### 2 · Catch Wikipedia copying itself

- Which page pairs share n-grams of eight tokens or more?
- Draw the copying as its own network. What are the biggest clusters?
- Copied plot summary or templated paragraph?

### 3 · A Marvel search engine in 20 lines

- Rank the 303 pages by cosine similarity to a query such as "Norse god of thunder".
- Which queries fail, and why?

### 4 · Community autocomplete

- One trigram generator per community; one fake page per community.
- Can other groups guess the community? Report their hit rate against chance, and only from real answers.

### 5 · Heaps' law of the Marvel universe

- Add pages most-linked first. How does the vocabulary grow?
- Do minor characters bring new words? What changes in the opposite order?

### 6 · Does network fame buy you more words?

- Page length against in-degree.
- Who sits far above and below the relationship, and why?

### 7 · Who has the weirdest Wikipedia page?

- Define weird with this week's tools only, rank, inspect the winners.
- Real finding, or formatting and boilerplate?

## Start here

```bash
python -m pip install -r requirements-lock.txt   # adds spaCy, NLTK, tiktoken and en_core_web_sm
export NLTK_DATA=build/nltk_data TIKTOKEN_CACHE_DIR=build/tiktoken
python analysis/week05_text.py                   # 303 pages, 1784 arcs, 1434 weighted edges
python analysis/week05_heaps.py                  # each section script; all stubs for now
```

Read the data only through `analysis/week05_text.py`: `pages()`, `graph()`, `weighted()` and `nodes()`.
It checks the files against the course snapshot and fails if the pages and nodes disagree.

## Shared decisions still open

- One tokeniser and preprocessing rule for the whole post, or one per section stated in its JSON.
- Communities for sections 1 and 4. Our Week 4 post used H-1B filings, so no Marvel partition exists yet.
  Compute one from `weighted()` with `louvain()` from `analysis/week04_staffing.py` over seeds `SEED + i`,
  report the most frequent partition, how often it recurs and modularity against `rewire()`. Write it once
  and have both sections read it.
- Which section leads the page.

## Data traps

- `data/marvel_pages.zip` filenames are URL-encoded node_ids: `Mark_Hazzard%3A_Merc` is
  `Mark_Hazzard:_Merc`. `pages()` unquotes them.
- 17 characters have no links. Building a graph from the edge list alone gives 286 nodes. `graph()` and
  `weighted()` add all 303 first.
- `data/week4_edges_weighted.tsv` has no header row after its `#` comments. Read it with explicit column
  names or the first edge becomes the header.
- Page lengths run from 1,244 to 87,256 characters, a 70× spread (course data page). Normalise by length
  before comparing pages.
- The text is rendered prose: templates and infoboxes are gone, section headings and Wikipedia house
  phrasing remain.
- Page text is English Wikipedia, CC BY-SA 4.0. The page footer credits it.

## Page

`docs/weeks/week05/index.html` is a blank frame with one section per opener and the six parts in each.
It is `noindex` and unlinked: week 5 stays `coming` in `docs/assets/js/weeks.js`. To publish it, set week 5
to `live` with a cabinet, add its lobby card, and change the "exactly weeks 1 to 4 are live" assertion in
`tests/site.test.mjs`.
