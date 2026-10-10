# Go nuts: every week's brief, and how to solve the next one

To plan a new week, ask for "this week's go nuts": the `go-nuts-week` skill (`.claude/skills/go-nuts-week/`) runs
`scripts/go_nuts_brief.py` and writes `project/WEEK{NN}.md`. This file holds what stays true across weeks; add
each finished week's row to the table below.

Source: the course repo [suneman/socialgraphs2026-web](https://github.com/suneman/socialgraphs2026-web/tree/main/docs),
commit `deaf55f` (published 2026-10-01). Its `docs/weeks/week1-6.html` match the live pages byte for byte,
and its `docs/data/marvel_pages.zip` matches ours. Read on 2026-10-06.

## The standing rules (exercise 1.8, restated every week)

- One free-form post per week on the group site, using that week's tools on the shared dataset.
- Post the link in the week's Teams channel by Monday evening.
- Leave friendly criticism on at least one other group's post: what works, one concrete thing to try.
- A winner is announced at 09:00 the next Wednesday. Every brief ends: "The winner is rarely the group that played it safe."
- It is a 🚀 Builder exercise: "Full agentic mode. Judged on the outcome, the rigor behind it, and whether you can explain and defend every choice."
- Weeks 2-4 allowed a self-crawled Wikipedia category instead of Marvel. Weeks 5-6 drop that option: the corpus is the 303 Marvel pages.
- From week 5 the brief fixes the post's shape: what you asked, what you did (week 6: what representation you chose),
  one strong figure or table, what surprised you, what you checked in the underlying text, one limitation.
- Weeks 5 and 6 both say: "One good question and one convincing figure beats five methods thrown together."
  and "Whatever you claim, inspect the text underneath it before you believe it."

## Week by week

| Week | Topic | Class exercises | Go-nuts openers | Our post |
|---|---|---|---|---|
| 1 | Networks: representation, degree distributions, drawing | 1.1-1.7: read check, calibrate your tool, toolbox shakedown, Marvel degree distributions, pen-and-paper warm-up, distribution as code, reading a drawing | Start the site; degree distributions linear and log-log; in vs out degree; draw it; the islands outside the giant component; stretch: re-derive a corner with the Wikipedia API | *Hero Packs*: isolates, in vs out, the whole roster drawn, islands, card index. Covers all of it |
| 2 | Models and null models: ER, small worlds, clustering, BA, power-law fits, shuffling, friendship paradox | 2.1-2.10 (2.10 = ship an explorable) | Random vs BA vs neither, with a CCDF and a fit; friendship paradox and its "popular friends"; shuffle-test any statistic; grow a BA Marvel at n = 303 | *Marvel Transit Authority*: twelve measurements against two nulls, the friendship paradox among them. The other models link out to the *Screen Test* game |
| 3 | Paths, centrality (degree, closeness, betweenness, PageRank), compared-to-what, mixing, cliques | 3.1-3.11 | Most surprising character against the right null; removal attack curves; in-rank vs out-rank; six degrees of Spider-Man tool; biggest cliques and a homophily vs chance | *Corridor Control* on migration flows, not Marvel: tails, betweenness vs in-degree, PageRank, compared to what |
| 4 | Communities: edge betweenness, modularity, Louvain, k-clique and link communities, weights, backbones | 4.1-4.12 | Louvain vs Infomap on the philosophers with NMI; which tradition is Aristotle in; backbone at three alpha values; weighted vs unweighted communities | *Who hires America's foreign workers?* on H-1B filings, not philosophers |
| 5 | Language I: tokens, Zipf, n-grams, Bag of Words | 5.1-5.8 | Typed edges from a concordance; copying via shared 8-grams; 20-line BoW search engine; per-community trigram autocomplete; Heaps' law by order; page length vs fame; weirdest page | *The Marvel network gets language*: all seven openers, one section each. About twice Week 4's text |
| 6 | Language II: TF-IDF and cosine, Scattertext, LDA topics, PPMI, Word2Vec | 6.1-6.10 | See below | Not started. Due Monday 12 Oct |

Weeks 3 and 4 left the shared dataset; the group decided that is fine ([[dataset-deviation-ok]]), so this file does not
propose redoing them.

## How the course draws things

- Every figure on a week page is an `<iframe>` of a standalone explorable in `docs/explorables/`. The week pages
  load no chart code; they use KaTeX for maths and YouTube embeds for video. 46 explorables are linked from weeks 1-6.
- Network explorables use D3 v7 plus three shared files: `vizkit.js` (SVG chart chrome: hairline solid grid,
  recessive axes, 2px lines, markers of 8px or more with a 2px surface ring, colours read from CSS tokens at draw time),
  `graphlib.js` (graph algorithms) and `community.js`. `marvel.js` loads the TSV snapshots, so the explorables compute
  on the same files students get.
- Charts and small graphs draw in SVG. Force layouts of the full network and animations (BA growth, shuffle test,
  Louvain steps, phase transitions) draw in `<canvas>`.
- The language explorables (weeks 5-6) are mostly plain DOM with no D3: tables, highlighted tokens, word lists.
  The exceptions are the Zipf plots and the universe map.
- Heavy data is precomputed: `week6_fingerprints.json`, `week6_convention_speeches.json`, and `week6_universe_map`
  (80-dimensional vectors for 303 pages and 4,182 words, stored as int8 with one scale per row in a 359 KB `.bin`).
  Each page carries `community`, `gender` and `team` (Wikidata) for colouring.
- The universe map builds an axis as the difference of two word-list centroids (magic vs science, cosmic vs street,
  mind vs body), z-scores every page on it, and shows the words pulling each page each way. The "draw your own map"
  opener asks students to do exactly this and to show one axis that turned out to be noise.

Our site already follows the same split: precomputed JSON from `analysis/`, drawn client-side.

## Week 6 openers, ranked by what we can reuse

| Opener | Method | Reuses from Week 5 | Effort |
|---|---|---|---|
| Textually close, structurally far | TF-IDF cosine vs shortest-path distance | `week05_text.py` tokens and its directed `graph()`; distances still to write. The course's `lookalikes.json` already gives 4.01 linked in 10 TF-IDF neighbours against 0.31 at random | Low |
| Names or meaning? | TF-IDF with and without character names | `week05_copying_ties.parquet` (5 of 12 copying clusters are `mantle` ties: one codename, several bearers), Week 5 search engine | Low to medium |
| How much does the representation change the answer? | One question asked with two methods (BoW vs TF-IDF, or TF-IDF vs Word2Vec) | Week 5 search engine as the baseline | Medium |
| Recognise a community from its language | Scattertext or LDA on two Louvain communities, story tested on held-out pages | `week05_communities.py` | Medium; needs `scattertext` |
| Characters between topics | LDA topic-mixture entropy per page | `week05_text.py` | Medium; LDA is seed-sensitive |
| Words in surprising company | PPMI or Word2Vec neighbours, then concordance lines | `week05_relations.py` concordance | Medium; needs `gensim` |
| Your own map of the universe | Two word-list axes on page vectors, ends checked against pages, one noise axis shown | The course's own universe-map vectors, or ours | Medium |

## How to solve it

1. **Pick one question first.** The brief says it twice, and Week 5 showed what happens otherwise. Either one
   group question with three angles, or three owner sections that each follow the six-part shape.
2. **Install the missing libraries.** `.venv-course` has scikit-learn 1.9, spaCy 3.8 and NLTK 3.10, but not
   `gensim` or `scattertext`. Add both to `requirements.txt`. `scattertext` writes its own HTML; we would use its
   term scores and draw the chart ourselves in the site's style.
3. **Name the null.** Every week's openers ask "compared to what". For text: shuffle community labels across pages,
   compare against random page pairs at the same network distance, or hold out pages the story was not built on.
4. **Check by hand and say how many.** Carry Week 5's pattern forward: a CSV of n hand-read cases and how many were
   right. The brief asks for "what you checked in the underlying text".
5. **Test stability.** On 303 pages Word2Vec neighbours and LDA topics move with the seed. Train several seeds and
   report neighbour overlap or topic match; an unstable result is the "axis that turned out to be noise".
6. **One figure carries the post.** Build it as a precomputed JSON plus a client-side chart, like the course's
   explorables and our Week 5 sections.
7. **Keep it short.** Run `text-budget.test.mjs` and read POST_GUIDE's "Keep the card short" before writing.

The "course methods only, no embeddings" note in memory dates from the network weeks. Week 6 teaches PPMI and
Word2Vec, so both are course tools now.

## Week 7 preview

The repo already ships eleven explorables that no week page links yet: `ner-bio`, `entity-network` ("Network created
by your rule": names extracted from text, aliases resolved), `bertopic-map`, `contextual-transformer`, `corpus-atlas`,
`semantic-search`, three `sentiment-*` pages, `bias-flow` and `nlp-arc`, plus `week7_corpus_atlas.json`, `week7_search_index.json` and `week7_topic_map.json`.
Week 7 (21 Oct) looks like named-entity recognition, networks built from extracted entities, BERTopic and
contextual embeddings, semantic search and sentiment. Week 8 (28 Oct) joins networks and language. Test 2 on 4 Nov covers weeks 5-8.

## Decisions for the group

- Week 6 shape: one shared question, or three owner sections?
- Which opener or openers, and who owns each?
- Our own vectors, or the course's universe-map vectors as a cross-check?
