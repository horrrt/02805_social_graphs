# Week 7 · Can the text rebuild the Marvel network?

The plan and notes for the Week 7 post (NLP III, "From meaning to measurement"), set up and built on 20 October
2026, the day the brief was published. Gyula asked for the week to be built but not published, so the post
went ahead on the recommendation below without a separate pick of question and owners; the group can still
change either before it goes live.

Brief: <https://sunelehmann.com/socialgraphs2026-web/weeks/week7.html>, exercise 7.13, read 20 October 2026
from the course repo (`b01ffe4`). The digest is [go-nuts/week07-brief.md](go-nuts/week07-brief.md).

## Deadline, owners and status

Class is Wednesday 21 October; the post link goes in the Teams channel by **Monday 26 October, evening**.
Owners as in Week 6: Gyula for every section, built for Gyula by Claude. The split below is a proposal if
Àngela and Niklas want a section each.

Published 26 October at Gyula's request, before the group's review: Week 7 is live in `src/scripts/weeks.js`
as "Named Together", the layout no longer sets `robots`, and the route is in the footer, top bar and stylesheet
tests. The closing's AI note still says the group has not yet reviewed the page. Once the group has read the
three `week07_*_read.parquet` files, remove that sentence. A card before the closing links the Week 7 campaign.

## What the brief asks of the post

"Use the Marvel text and network to ask one question that genuinely interests you. One good question and one
convincing figure beats five methods thrown together. Whatever model you use, keep enough of the underlying
text visible that you can check what produced the pattern." The post's shape, mapped onto Week 4's card:

| Brief asks for | Where it goes |
| --- | --- |
| What you asked | `w4-q` header of each card; the hero's bold question |
| What representation or measurement you chose | `w4-two` paragraph: names matched in sentences, three units, spaCy as a fourth |
| One strong figure or table | Section 2's chart by number of sentences; section 3's two panels |
| What surprised you | "What to notice" on each card |
| What you checked in the underlying text | Section 3's "What we read" (80 sentences) and section 4's figure and table (25 pairs, 20 links); the explorer quotes a sentence for every tie |
| One limitation | each card's Method drawer, and the closing's one limit |

The test box lists three flawed claims; the post avoids all three. It reports what the instrument measures and
how often it is right on our own reading instead of a borrowed accuracy, and it counts resolved characters
(300 named), not tagger strings (8,014 PERSON strings).

## Topic map

| Method the week teaches | Use in the post | Why |
| --- | --- | --- |
| NER, BIO tags, entity resolution (7.7, 7.8) | Main tool | The opener "Can text build a useful network?" and 7.8 ask for exactly this pipeline |
| Co-occurrence unit (7.7) | Section 3 | Sentence, paragraph and page, as 7.8 asks for "at least two units" |
| Sentiment (7.5, 7.6) | Not used | A second question; would need a new instrument check of its own |
| Document embeddings, corpus atlas, groupings (7.1 to 7.4) | Not used | Needs `sentence-transformers` and `torch`; Week 6 already compared text and links by similarity |
| Sparse vs dense search (7.9, 7.10) | Not used | A different question |
| Bias flow (7.11) | Not used | Optional |

## Openers

| Opener | Method | Course already has | Null | Hand check | Stability | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| **Can text build a useful network?** | Names in sentences, resolved to the 303, against links | Spider-Man example only (reproduced) | Degree-preserving rewiring of the text network | Sentences, pairs, links read | Deterministic; three units as the check | Medium, no new package |
| Semantically close, structurally far | Embeddings vs shortest paths | `week7_corpus_atlas.json` (method unknown) | Random pairs at the same distance | Read the far pairs | Embedding seeds | Medium, needs `torch` |
| Grouping method changes the story | LDA vs embedding clusters vs Louvain | Atlas groupings | Shuffled labels, NMI | Disagreements read | LDA and Louvain seeds | High |
| Break a sentiment model | Hand-built test sentences | `sentiment-lab` examples | none natural | All of it | n/a | Medium, needs `transformers` |
| Six shapes | Sentence arcs of fan fiction | `week7_story_arc` | Shuffled sentences | Arcs read | Smoothing | High, new corpus |
| Semantic vs keyword search | Sparse vs dense retrieval | `week7_search_index.json` | n/a | Results read | n/a | Medium |

## Recommendation (built)

**Question:** when a Marvel page names two characters in one sentence, are their pages linked?

**Figure:** the share of sentence pairs that are links, by how many sentences name the pair, each row against
its own degree-preserving rewiring. Section 3 adds the unit and the instrument; section 4 reads the edges in only
one network, which is what the opener asks for.

**Proposed split if the group wants one:** Gyula, sections 1 and 2 (the explorer and the sentence network);
Àngela, section 3 (units and the instrument check); Niklas, section 4 (the hand reading).

**Packages:** none new. spaCy 3.8 and `en_core_web_sm` 3.8.0 are already pinned.

## What we built

Post: [src/app/(week07)/weeks/week07/](../src/app/(week07)/weeks/week07/). Script: `analysis/week07_comention.py`
writes `analysis/week07_comention.json` and `public/weeks/week07/data/comention.json`;
`tests/week07-prose.test.mjs` pins the prose to it. Names: `analysis/week07_wikidata_names.py` (live, run once)
wrote `week07_wikidata_names.parquet`; the hand decisions are `week07_alias_decisions.parquet`; the script writes
the full table to `week07_aliases.parquet`. Readings: `week07_sentences_read.parquet`, `week07_pairs_read.parquet`,
`week07_links_read.parquet`, each with the text it judged; the script stops when one goes stale.

| # | Section | Anchor | Answer |
| --- | --- | --- | --- |
| 1 | Pick a character | `#explore` | Explorer: every sentence tie of a character, linked or not, with the first sentence that names both |
| 2 | Named together, mostly linked | `#together` | 1,568 sentence pairs, 56% linked against 15.0% ± 0.7 rewired (z 61); 43% at one sentence, 95% at ten or more |
| 3 | Sentence, paragraph or page | `#unit` | Links found: sentence 61%, paragraph 76%, page 94%; share linked 56%, 48%, 19%; spaCy's tagger 65% linked, 40% found. Names list right 83%, finds 70%; tagger 91%, 51% (80 sentences) |
| 4 | What only one network has | `#only` | 25 strongest unlinked ties: 6 story, 8 title, 4 passing, 7 wrong name. 20 random missing links: 7 he or she, 10 another name, 3 no mention; 78% of all 558 have one page naming the other |

Traps written down for next time:

- The committed `requirements-lock.txt` cannot install as one set: `scattertext==0.2.2` needs `scipy<1.14`, the
  lock pins `scipy==1.18.1`. Install the lock without scattertext, then `pip install --no-deps scattertext==0.2.2`.
- The brief's Spider-Man numbers need the whole page parsed as one document; parsing paragraph by paragraph
  gives other sentence counts. `nlp.pipe` over whole pages reproduces all of them.
- Wikidata aliases often name a different character who held the mantle: Steve Rogers on William Burnside,
  Tony Stark on the Ultimate Iron Man, Rick Jones on Bucky, Green Goblin on Phil Urich, May Parker on Mayday
  Parker. One-word aliases include Her (Kismet) and Frank (Frankenstein's Monster).
- Several roster pages are about a name, not a person: Hawkeye (comics), Spider-Woman, Captain Marvel
  (Marvel Comics), Ms. Marvel. The main Hawkeye and Iron Man are not among the 303, so text about them cannot
  match a link. Hawkeye has 42 sentence partners and 2 links.
- The bare title Force matches Air Force, Force Works and Fantastic Force: 32 partners, none linked. Left as the
  rules made it, because the rules were fixed before any comparison with the links; a later fix should be a
  dated decision row, not a silent change.
- `igraph.Graph.rewire(mode=...)` is deprecated; use `allowed_edge_types="simple"`.
- Wikidata answered 429 to a bare request; the project's `fetch.session()` waits it out.
