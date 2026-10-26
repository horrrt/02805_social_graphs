# Week 7 go-nuts digest: From meaning to measurement

Course repo `b01ffe4 2026-10-20 Publish 2026-10-20 09:49: week1 week2 week3 week4 week5 week6 week7`, read 2026-10-20. Live page: https://sunelehmann.com/socialgraphs2026-web/weeks/week7.html

## Sections and exercises

- **1 · One vector for a whole text**
  - 7.1 — Static and contextual representations, by hand 🧠 Learn
- **2 · Walk through a corpus**
  - 7.2 — Build a corpus atlas 🔬 Tool
- **3 · Different ways to split up the same corpus**
  - 7.3 — Same documents, different groupings 🧠 Learn
  - 7.4 — Compare groupings on Marvel, as code 🔬 Tool
- **4 · Sentiment as a measurement**
  - 7.5 — Sentiment, by hand 🧠 Learn
  - 7.6 — Validate a sentiment instrument 🔬 Tool + 🚀 Builder
- **5 · Entities turn prose into structured data**
  - 7.7 — BIO tags, entities, and edges, by hand 🧠 Learn
  - 7.8 — Tag, check, resolve, connect 🔬 Tool + 🚀 Builder
- **6 · Search by meaning**
  - 7.9 — Sparse and dense retrieval, by hand 🧠 Learn
  - 7.10 — Search the Marvel corpus 🔬 Tool
- **7 · Bias can enter before the model**
  - 7.11 — Trace bias through one NLP analysis 🧠 Learn + 🔬 Tool · optional
  - 7.12 — Ship an explorable 🚀 Builder · stretch, optional
  - 7.13 — Go nuts with your LLM 🚀 Builder · every week
- **8 · Next week: putting it all together**

## Go nuts, verbatim

**7.13 — Go nuts with your LLM 🚀 Builder · every week**

The standing rules live in week 1, exercise 1.8 : one free-form post on your group's site, link in this week's Teams channel by Monday evening, friendly criticism for at least one other group. Winner announced at the start of the next session.

This is the last week of the language block, so use the Marvel text and network to ask one question that genuinely interests you. One good question and one convincing figure beats five methods thrown together. Whatever model you use, keep enough of the underlying text visible that you can check what produced the pattern.

Some openers, if you want them:

- Who is semantically close but structurally far away? Find characters whose pages are close in embedding space but far apart in the hyperlink network, then read the pages and work out why.

- How much does the grouping method change the story? Compare LDA topics, embedding-based clusters and network communities for the same characters. Focus on the cases where they disagree.

- Can you break a sentiment model? Design a small set of examples that isolate negation, mixed sentiment, sarcasm or Marvel-specific language, then compare several sentiment measurements.

- Six shapes? Score a few dozen fan-fiction stories sentence by sentence, smooth, and cluster the arcs. Do Reagan et al.'s six shapes show up, and does DeepMoji's anger follow the same shape as the classifier's negativity?

- Can text build a useful network? Construct an entity co-occurrence network and compare it with the Wikipedia hyperlink network. Investigate the edges that exist in only one of them.

- When does semantic search beat keyword search? Design queries where sparse and dense retrieval disagree and read the returned pages to decide which representation helped.

- Or ignore every suggestion and chase something one of the explorables made you wonder about. The winner is rarely the group that played it safe.

Write the post around the question rather than the software package you used: what you asked, what representation or measurement you chose, one strong figure or table, what surprised you, what you checked in the underlying text, and one limitation.

## On the test

On Test 2 From this week, you should be able to do the following on paper, closed book . Any formula you need is printed on the test paper — you are never asked to write one from memory: distinguish a static word embedding from a contextual representation using an ambiguous word such as bank ; explain what a document embedding represents, and distinguish the original vector space from a two-dimensional projection of it; explain why nearest neighbors in a 2D map can differ from nearest neighbors by cosine similarity in the original space; distinguish topic-model topics, embedding-based text clusters and structural network communities as three different ways of grouping the same documents; calculate a simple lexicon sentiment score and explain why negation, mixed sentiment or sarcasm can break word lookup; explain how a TF-IDF representation can enter a logistic-regression text classifier, and interpret the sign of a feature weight; explain why a model confidence score is not by itself evidence that a text measurement is valid for a new domain; read and construct simple BIO tags — B begins an entity span, I continues it, O marks a token outside one — and distinguish finding an entity from deciding that two mentions are the same entity; explain how the chosen unit of co-occurrence changes the meaning and structure of a text-derived entity network; distinguish sparse TF-IDF retrieval from dense retrieval and explain the vocabulary-mismatch problem; explain the two stages of retrieval-augmented generation (RAG) separately, and distinguish a retrieval error from a generation error; give a concrete validation check for a pretrained model used as a measurement instrument; spot the flaw in a short (possibly AI-written) claim built on a model's output: an accuracy borrowed from another domain presented as validation, a score reported without saying what it measures, or an entity count that skipped resolution.

## Explorables (how the course draws this week)

| Explorable | Scripts | Data it loads | SVG | Canvas |
|---|---|---|---|---|
| corpus-atlas | d3.v7.min.js, corpus-atlas.js | data/week7_corpus_atlas.json | yes |  |
| sentiment-lab | sentiment-lab.js | inline |  |  |
| story-sentiment | d3.v7.min.js, story-sentiment.js | data/week7_story_arc.json, data/week7_story_arc/${story.slug}/ch${String(chapterN).padStart(2,  | yes |  |
| story-emotion | d3.v7.min.js, story-emotion.js | data/week7_story_arc.json, data/week7_story_arc/${story.slug}/ch${String(chapterN).padStart(2,  | yes |  |
| ner-bio | ner-bio.js | inline |  |  |
| entity-network | entity-network.js | inline | yes |  |
| semantic-search | semantic-search.js | data/week7_search_index.json, data/week7_search_presets.json |  |  |
| bias-flow | inline | inline |  |  |

Videos: 2.

House chart style: `docs/explorables/vizkit.js`. Code and data: `/root/.cache/socialgraphs2026-web/docs/explorables/`.

## Python the brief imports

| Import | pip name | In .venv-course |
|---|---|---|
| bertopic | bertopic | **MISSING** |
| networkx | networkx | yes |
| numpy | numpy | yes |
| sentence_transformers | sentence_transformers | **MISSING** |
| sklearn | scikit-learn | yes |
| spacy | spacy | yes |
| torch | torch | **MISSING** |
| transformers | transformers | **MISSING** |
| umap | umap | **MISSING** |

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
- `explorables/data/week7_corpus_atlas.json` 157
- `explorables/data/week7_search_index.json` 537
- `explorables/data/week7_search_presets.json` 66
- `explorables/data/week7_story_arc` 4
- `explorables/data/week7_story_arc.json` 9
- `explorables/lookalikes.json` 426
- `explorables/zipf-full-pages.json` 4

## Explorables in the repo that no week links yet (next week's preview)

`contextual-transformer`, `nlp-arc`, `sentiment-classifier`, `sentiment-lexicon`

## This repo

- Post route `src/app/(week07)/`: not started
- This week's analysis files: none
- Last week's (reuse candidates) analysis files: `week06_cold_read.py`, `week06_cold_read_images.json`, `week06_cold_read_images.py`, `week06_essentials.json`, `week06_essentials.py`, `week06_gender.py`, `week06_hot_cold.py`, `week06_lean.py`, `week06_lookalikes.json`, `week06_lookalikes.py`, `week06_mix_desk.py`, `week06_portrait_sources.json`, `week06_portraits.py`, `week06_schemas.py`, `week06_tezguino.py`, `week06_whose_line.py`
- Other branches or worktrees for this week: `claude/week07-post`
- Notes `project/WEEK07.md`: none yet
