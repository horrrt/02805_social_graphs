# Week 5 · The Marvel network gets language

The plan for the Week 5 post (NLP I, "From language to numbers"), set up 30 September 2026. The post goes
in [docs/weeks/week05/index.html](../docs/weeks/week05/index.html); every number comes from a script in
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

The six parts say what each section must contain, not what must be open on load. Each card is a Week 4
card: the question and answer, what we did beside "What to notice", the figure, and drawers holding the
method with the limitation, more numbers and the passages we read (POST_GUIDE.md, "Keep the card short").

The brief says one good question with one convincing figure beats five methods thrown together. We did
all seven openers; the hero asks whether a character's place in the link network shows in the words of its
page, and answers with section 6's scatter of page length against in-degree. A findings strip under the
hero gives each section's answer against its baseline, in Week 4's form.

## Sections

| # | Section | Anchor | Owner | Script | Uses |
| --- | --- | --- | --- | --- | --- |
| 1 | Turn links into relationships | `#relations` | Gyula | `analysis/week05_relations.py` | pages, graph, weighted (communities) |
| 2 | Catch Wikipedia copying itself | `#copying` | Gyula | `analysis/week05_copying.py` | pages |
| 3 | A Marvel search engine in 20 lines | `#search` | Àngela | `analysis/week05_search.py` | pages |
| 4 | Community autocomplete | `#autocomplete` | Àngela | `analysis/week05_autocomplete.py` | pages, weighted (communities) |
| 5 | Heaps' law of the Marvel universe | `#heaps` | Niklas | `analysis/week05_heaps.py` | pages, graph (in-degree) |
| 6 | Does network fame buy you more words? | `#fame` | Niklas | `analysis/week05_fame.py` | pages, graph |
| 7 | Who has the weirdest Wikipedia page? | `#weird` | Niklas | `analysis/week05_weird.py` | pages |
| | Hero, findings, opening, closing, AI-use note | `#top`, `#findings`, `#opening`, `#closing` | Gyula | the section JSON files | `docs/assets/js/week05-frame.js` |

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
python analysis/week05_heaps.py                  # vocabulary growth by network order
```

Read the data only through `analysis/week05_text.py`: `pages()`, `graph()`, `weighted()` and `nodes()`.
It checks the files against the course snapshot and fails if the pages and nodes disagree.

## Components

Each section has its own page script, `docs/assets/js/week05-<section>.js`, already loaded by the page, and
its page data goes in `docs/weeks/week05/data/<section>.json` (only `docs/` is published). Import what you
need from `docs/assets/js/kit.js`:

```js
import { slot, figure, echart, stripChart, concordance, passage, table, loadData } from "./kit.js?v=1";
```

`slot("heaps", "figure")` is where section 5's figure goes; the parts are `asked`, `did`, `figure`,
`surprise`, `checked` and `limit`. `docs/assets/js/README.md` lists every component with an example, and
`/styleguide/kit.html` draws each one with toy data. Use `stripChart` for any result against a null,
`concordance` or `passage` for the text you checked.

To make a section look like a Week 4 card, add `card w4-card w5-card` to its slots container:
`<div class="w5-slots card w4-card w5-card">`. The six slots then take Week 4's layout: the question and
answer across the top, what we did, what surprised us and the limitation in the text column, the figure
beside them, and the checked passages across the bottom. Sections 1 and 2 use it; copy their markup (a
`p.w5-question` and a `p.w4-answer` in the asked slot, a `div.notice` in the surprise slot, `rx-drawers`
under what we did). Nothing else changes: the slot IDs, `slot()` and the kit test stay as they are.

## Shared decisions

- One word rule, `WORD_RULE` and `words()` in `analysis/week05_text.py`, for sections 4 to 7: 713,617
  tokens of 27,754 types. Sections 2 and 3 keep digits and split at hyphens (about 740,000 tokens) and state
  their rule in their JSON; the opening says why the totals differ.
- One name rule, `candidates()` and `name_table()` in `analysis/week05_relations.py`: section 1 finds the
  sentence behind a link with it and section 6 counts mentions with it. Section 4 masks those names plus
  every capitalised part of a description's brackets, so a one-word real name ("Logan") is hidden too.
- One rule for pages about several characters who share a name, `shared_name()` in
  `analysis/week05_text.py`, read from the first sentence: 46 pages. Section 6 calls them hub pages and
  section 7 counts them among the most repetitive pages. Two rules had given 35 and 27 pages that shared
  only 19.
- One map: `analysis/week05_network.py` writes `network.json`, the Marvel network laid out once
  (`analysis/layout.py`, seeded) and coloured by section 4's consensus groups, and `week05-map.js` draws it
  with `networkView()`. Section 1 shows where fight and family links run on it; section 4 shows its groups
  beside the quiz. Hovering any page names it (Gyula's call, 30 September, while guesses were still
  open); the eight hubs, the quiz's options, also carry a pill on the map. The data files go further:
  `communities.json` lists every page's group and `autocomplete.json` holds each fake's answer and unmasked
  text, so a guesser who opens them can look everything up.
- Communities: `analysis/week05_communities.py` writes the consensus of 100 Louvain runs that section 4
  reads. Section 1 averages its crossing shares over its own 100 runs on the same weighted network; its
  median of 26 communities is the same 8 groups, the Morituri group and the 17 isolates.
- The hero and the findings strip lead with section 6 (see above).

## Data traps

- `data/marvel_pages.zip` filenames are URL-encoded node_ids: `Mark_Hazzard%3A_Merc` is
  `Mark_Hazzard:_Merc`. `pages()` unquotes them.
- 17 characters have no links. Building a graph from the edge list alone gives 286 nodes. `graph()` and
  `weighted()` add all 303 first.
- 58 pages have zero in-degree and 17 have no link at all; the exercise note's 17 counts only the isolates.
  Both numbers are right, so say which one you mean. The opening states both.
- Louvain on this network rarely repeats itself: 100 runs found 89 different partitions, the most common one
  in only 4. Report the consensus and the NMI between runs, never one run's partition.
- The node table's `name` is not always the page title: five pages are named after one holder or one
  version (`Doctor_Spectrum` is "Alice Nugent", `NFL_SuperPro` is "Phil Grayfield", `Anne_Weying` is
  "She-Venom (Patricia Robertson)", `Phoenix_Force` and `Red_Raven_(Marvel_Comics)` likewise). Sections 6
  and 7 show the page title. Section 1's `candidates()` still starts from `name`, so it looks for "Alice
  Nugent" on other pages rather than "Doctor Spectrum"; fixing that moves section 1's numbers.
- `words()` lowercases before it matches, and "İ" lowercases to two characters, so "İzmir" splits in two on
  the one page that has it. Section 4 asserts its tokens equal `words()` everywhere else.
- `data/week4_edges_weighted.tsv` has no header row after its `#` comments. Read it with explicit column
  names or the first edge becomes the header.
- Page lengths run from 1,244 to 87,256 characters, a 70× spread (course data page). Normalise by length
  before comparing pages.
- The text is rendered prose: templates and infoboxes are gone, section headings and Wikipedia house
  phrasing remain.
- Page text is English Wikipedia, CC BY-SA 4.0. The page footer credits it.

## Page

`docs/weeks/week05/index.html` holds the hero, the findings strip, the opening, seven Week 4 cards and
the closing. `tests/week05-frame.test.mjs` pins the frame's numbers to the section JSON files, and each
section has its own test. The page is live since 30 September 2026: week 5 is `live` in
`docs/assets/js/weeks.js` with the cabinet "Marvel in Words", and the home page links it.
