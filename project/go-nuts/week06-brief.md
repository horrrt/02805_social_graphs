# Week 6 go-nuts digest: From counts to meaning

Course repo `deaf55f 2026-10-01 Publish 2026-10-01 18:05: week1 week2 week3 week4 week5 week6`, read 2026-10-06. Live page: https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html

## Sections and exercises

- **1 · Documents need better weights**
  - 6.1 — TF-IDF and cosine, by hand 🧠 Learn
  - 6.2 — Document similarity on Marvel, as code 🔬 Tool
- **2 · Compare groups of documents**
  - 6.3 — Compare two corpora with Scattertext 🔬 Tool
- **3 · Find recurring themes**
  - 6.4 — Topic models, by hand 🧠 Learn
  - 6.5 — Topic models on Marvel, as code 🔬 Tool
- **4 · Now let's think about words**
- **5 · Raw co-occurrence is not enough**
  - 6.6 — Word context and PPMI, by hand 🧠 Learn
  - 6.7 — PPMI neighbors on Marvel, as code 🔬 Tool
- **6 · Learn dense word embeddings**
  - 6.8 — Word2Vec, by hand 🧠 Learn
  - 6.9 — Train and inspect a word embedding 🔬 Tool
  - 6.10 — Ship an explorable 🚀 Builder · stretch, optional
  - 6.11 — Go nuts with your LLM 🚀 Builder · every week
- **7 · Next week: from meaning to measurement**

## Go nuts, verbatim

**6.11 — Go nuts with your LLM 🚀 Builder · every week**

The standing rules live in week 1, exercise 1.8 : one free-form post on your group's site, link in this week's Teams channel by Monday evening, friendly criticism for at least one other group. Winner announced at the start of the next session.

This week you have learned about several different ways of deciding when language is "close": TF-IDF and cosine similarity for documents, term contrasts between groups, topic mixtures, PPMI context vectors and Word2Vec. Use one of them to ask a question about the Marvel corpus that you actually want answered. One good question and one convincing figure beats five methods thrown together. Whatever you claim, inspect the text underneath it before you believe it.

Some openers, if you want them:

- Who is textually close but structurally far away? Find pairs of characters with very similar Wikipedia text but large network distance. Read the pages and work out why.

- Can you recognize a network community from its language? Compare two communities with Scattertext or topic mixtures, then test the story on pages you did not use to invent it.

- Which characters live between topics? Find pages with unusually mixed LDA topic proportions and ask whether the characters really bridge themes or whether the model is confused.

- Which Marvel words keep surprising company? Use PPMI or Word2Vec neighbors, then return to concordance lines and explain the strangest pair that turns out to make sense.

- How much does the representation change the answer? Ask one question twice with two methods from the week and investigate the cases where they disagree.

- Names or meaning? TF-IDF put Storm next to the Human Torch because of a surname. Find a way to tell name-driven matches from story-driven ones across the whole corpus, and show what the lookalikes look like once the names are handled.

- Draw your own map of the Marvel universe. Build two axes of your own on the Marvel map, or with your own vectors, that give a picture you can defend. Check the characters at both ends of each axis against their pages, and show at least one axis that looked promising and turned out to be noise.

- Or ignore every suggestion and chase something the explorables made you wonder about. The winner is rarely the group that played it safe.

Write the post around the question rather than the method: what you asked, what representation you chose, one strong figure or table, what surprised you, what you checked in the underlying text, and one limitation.

## On the test

On Test 2 From this week, you should be able to do the following on paper, closed book . Any formula you need is printed on the test paper — you are never asked to write one from memory: compute term frequency (TF), document frequency (DF), inverse document frequency (IDF) and TF-IDF for a tiny corpus, and explain why a term that appears in every document receives little or no distinguishing weight; compute cosine similarity for small vectors, read the angle intuition, and explain why multiplying a vector by a positive constant changes its length but not its cosine with another vector; distinguish a document-term representation from a word-context representation by stating what one row, one column and one cell mean in each; read a two-corpus term plot such as Scattertext and distinguish language that is common in both groups from language that is comparatively distinctive of one group; explain what topic modeling is trying to recover, distinguish the general idea from LDA specifically, and state that in LDA a topic is a distribution over words while a document is a mixture over topics; explain why topic labels are human interpretations, and why the number of topics, preprocessing and initialization can change a fitted solution; explain the distributional hypothesis — that words occurring in similar contexts tend to have related meanings — and predict how a narrow versus a wide context window changes the information in a word-context vector; compute the ingredients of a simple PMI value (pointwise mutual information: observed co-occurrence against what independence would predict), turn it into PPMI by keeping only its positive part, and explain why that reduces the influence of common context words; construct training examples from a short sentence in both directions — center word predicting its neighbors ( Skip-gram ) and neighbors predicting the center word ( CBOW ) — and explain what negative sampling is doing; explain what PPMI vectors, Word2Vec and GloVe have in common, and name the main limitation of a single fixed vector per word for a word such as bank that has several meanings; spot the flaw in a short (possibly AI-written) claim about topics or embeddings: a topic label presented as the model's own output, one fitted solution presented as the answer, or a high cosine presented as evidence of similar meaning.

## Explorables (how the course draws this week)

| Explorable | Scripts | Data it loads | SVG | Canvas |
|---|---|---|---|---|
| tfidf-weighting | tfidf-weighting.js | inline |  |  |
| cosine-similarity | cosine-similarity.js | inline | yes |  |
| lookalikes-tfidf | lookalikes.js | lookalikes.json |  |  |
| fingerprints | fingerprints.js | data/week6_fingerprints.json |  |  |
| scattertext-2012-conventions | scattertext-2012-conventions.js | data/week6_convention_speeches.json | yes |  |
| topic-mixtures | topic-mixtures.js | inline |  |  |
| word-context-matrix | word-context-matrix.js | inline |  |  |
| ppmi-context | ppmi-context.js | inline |  |  |
| word2vec-window | word2vec-window.js | inline |  |  |
| embedding-analogy-simple | embedding-analogy-simple.js | inline | yes |  |
| universe-map | d3.v7.min.js, universe-map.js | data/${data.binary}, data/week6_universe_map.json | yes |  |

Videos: 1.

House chart style: `docs/explorables/vizkit.js`. Code and data: `/Users/gyula/.cache/socialgraphs2026-web/docs/explorables/`.

## Python the brief imports

| Import | pip name | In .venv-course |
|---|---|---|
| gensim | gensim | **MISSING** |
| numpy | numpy | yes |
| scattertext | scattertext | **MISSING** |
| sklearn | scikit-learn | yes |

## Course data files

| File | Arrives | What |
|---|---|---|
| `week1_edges.tsv` + `week1_nodes.tsv` | week 1 ✅ | unweighted directed edge list + full node roster (303 nodes, 1,784 edges; snapshot 2026-08-26) |
| `week4_edges_weighted.tsv` | week 4 ✅ | the week-1 edges + weight = repeat count of the link (snapshot 2026-09-06, same crawl; 1,288 of 1,784 have weight 1, max 11; summed both ways max 16) |
| `week4_philosophers_edges.tsv` + `week4_philosophers_nodes.tsv` | week 4 ✅ | **week 4's own network** (Sune, 2026-09-15: Marvel's communities are too weak to see): everyone on Wikipedia's seven by-century lists of philosophers born before 1900; 1,444 nodes, 11,135 weighted directed edges (weight = repeat count; 8,186 weight 1, max 18; summed both ways max 24); undirected GCC 1,374 / 9,139. Node file adds `era` (the century list) and `subfields` (other lists the philosopher is on) — list membership, not statistics. Snapshot 2026-09-15, crawl `philosophers` (14 lists) in wiki-crawl |

All released files (sizes in KB). Explorable data shows what the course already computed; use it to calibrate, not as our result:

- `data/marvel_pages.zip` 1790
- `data/week1_edges.tsv` 59
- `data/week1_nodes.tsv` 61
- `data/week4_edges_weighted.tsv` 63
- `data/week4_philosophers_edges.tsv` 368
- `data/week4_philosophers_nodes.tsv` 336
- `explorables/data/adaptive-cut-marvel.json` 59
- `explorables/data/adaptive-cut-philosophers.json` 389
- `explorables/data/philosophers-layout.json` 47
- `explorables/data/week6_convention_speeches.json` 969
- `explorables/data/week6_fingerprints.json` 381
- `explorables/data/week6_universe_map.bin` 350
- `explorables/data/week6_universe_map.json` 218
- `explorables/data/week7_corpus_atlas.json` 153
- `explorables/data/week7_search_index.json` 537
- `explorables/data/week7_topic_map.json` 70
- `explorables/lookalikes.json` 426
- `explorables/zipf-full-pages.json` 4

## Explorables in the repo that no week links yet (next week's preview)

`bertopic-map`, `bias-flow`, `contextual-transformer`, `corpus-atlas`, `entity-network`, `ner-bio`, `nlp-arc`, `semantic-search`, `sentiment-classifier`, `sentiment-lab`, `sentiment-lexicon`

## This repo

- Post route `src/app/(week06)/`: not started
- This week's analysis files: none
- Last week's (reuse candidates) analysis files: `week05_autocomplete.py`, `week05_communities.py`, `week05_copying.py`, `week05_copying_ties.csv`, `week05_fame.json`, `week05_fame.py`, `week05_heaps.json`, `week05_heaps.py`, `week05_network.py`, `week05_relations.py`, `week05_relations_checked.csv`, `week05_schemas.py`, `week05_search.py`, `week05_text.py`, `week05_weird.json`, `week05_weird.py`
- Other branches or worktrees for this week: `claude/create-week-6-75dedc`, `claude/week-06-design-a99b3c`
- Notes `project/WEEK06.md`: none yet
