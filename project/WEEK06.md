# Week 6 · What makes two Marvel pages read alike?

The plan for the Week 6 post (NLP II, "From counts to meaning"), set up 6 October 2026. Gyula picked the
recommended question and had the whole post built in one session the same day; see "What we built" at the end.

Brief: <https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html>, exercise 6.11, read 6 October 2026
from the course repo (`deaf55f`, byte-identical to the live page). The digest is
[go-nuts/week06-brief.md](go-nuts/week06-brief.md); the script that wrote it and the go-nuts-week skill sit
on unmerged PR #162.

## Deadline and owners

Class is Wednesday 7 October; the post link goes in the Teams channel by **Monday 12 October, evening**.
Owners as in Week 5 unless the group changes them: Gyula, Àngela, Niklas.

The branch `claude/week-06-design-a99b3c` has no Week 6 commits, only untracked Week 4 canvas files, so
nobody is building Week 6 in parallel.

## What the brief asks of the post

One free-form post, link by Monday evening, friendly criticism for one other group. "One good question and
one convincing figure beats five methods thrown together. Whatever you claim, inspect the text underneath it
before you believe it."

The post's shape, mapped onto Week 4's card (POST_GUIDE "Keep the card short"):

| Brief asks for | Where it goes |
| --- | --- |
| What you asked | `w4-q` header: the question |
| What representation you chose | `w4-two` paragraph: what we did |
| One strong figure or table | the figure, in view |
| What surprised you | "What to notice", the number against its baseline |
| What you checked in the underlying text | "What we read" drawer, with the passages |
| One limitation | "Method" drawer |

## Topic map

| Method the week teaches | Use in the post | Why |
| --- | --- | --- |
| TF-IDF and cosine | Main tool | Deterministic, no new package, and the openers about names and distance rest on it |
| Scattertext | Not used, or the alternative question | Needs `scattertext`; answers a different question (communities) |
| LDA topics | Not used, or the alternative question | Seed-sensitive on 303 pages; the brief's own run found mostly name topics |
| PPMI word-context | Not used | A word-level question; ours is about pages |
| Word2Vec, GloVe | One drawer at most, only if the group picks "does the representation change the answer" | Needs `gensim` and a 128 MB GloVe download; neighbours move with the seed |

## What the course already computed

`docs/explorables/lookalikes.json` in the course repo gives, for each page's ten textual neighbours, how many
are also linked in the network: TF-IDF 4.01, stopwords removed 2.84, raw counts 1.86, ten random pages 0.31.
The brief also names the cases: Storm next to the Human Torch (surname), Emma Frost and Jack Frost (closest
unlinked pair), and the Strikeforce: Morituri cluster (real team structure). `week6_fingerprints.json` marks
10,520 words as names. These are calibration, not our result. The method behind them is unknown beyond what
the brief states.

## Openers

| Opener | Method | Course already has | Null | Hand check | Stability | Reuses | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Names or meaning? | TF-IDF with and without names | 4.01 linked in 10; Storm, Frost | Same pages, same TF-IDF, names removed | Closest unlinked pairs sorted into fixed buckets | Deterministic; a second name rule as the check | `week05_text.py`, `week05_copying_ties.csv` | Low |
| Textually close, structurally far | TF-IDF cosine vs undirected shortest path | Closest unlinked pairs list | Random pairs; isolates as their own bucket | Read the far pairs | Deterministic | `week05_text.graph()` | Low |
| Does the representation change the answer? | TF-IDF vs Word2Vec page vectors | none | Seeds `SEED + i` | Disagreements read | Neighbour overlap across seeds | Week 5 search engine | Medium, `gensim` |
| Recognise a community from its language | Scattertext or LDA on two Louvain communities | none on Marvel | Shuffled labels; held-out pages | High-weight pages read | Louvain and LDA seeds | `week05_communities.py` | Medium, `scattertext` |
| Characters between topics | LDA mixture entropy | Brief's LDA run | Seeds | Mixed pages read | Topic match across seeds | `week05_text.py` | Medium |
| Words in surprising company | PPMI or Word2Vec neighbours | Brief's `hammer` example | none natural | Concordance lines | Seeds | `week05_relations.py` | Medium |
| Draw your own map | Word-list axes on page vectors | `week6_universe_map` | Random word-list axes | Ends read | Axis from two word lists | course map vectors | Medium |

## Recommendation

**Question:** When two Marvel pages read alike, is it a shared name, a shared story, or Wikipedia's template?

**Figure:** for the same 303 pages and the same TF-IDF, how many of each page's ten textual neighbours are
linked in the network, with names kept and with names removed, against ten random pages. Beside it, the
closest unlinked pairs, each sorted into one of four buckets fixed before reading: shared codename or mantle,
team or co-appearance, surname coincidence, Wikipedia boilerplate. "Name-driven" is not "spurious": the
brief calls the Morituri match real structure, and Week 5's copying ties were 5 codename, 6 team, 1 family.

**Split, one part of the question each:**

- Gyula: names removed, and what it does to the hit rate and to how many of the 303 neighbour lists change.
- Àngela: close but far. Undirected network distance of the closest textual pairs against random pairs, with
  unreachable pairs (the 17 isolates) in their own bucket.
- Niklas: the hand-read buckets for the closest unlinked pairs, stored with each pair's top shared terms so a
  verdict goes stale when its terms change (the guard in `week05_relations.py`).

**First build step:** reproduce 4.01, 2.84, 1.86 and 0.31 and "Marvel and Comics on all 303 pages", and add
them to `analysis/course_reference.py`. Matching settles whether "linked" counts either direction and which
tokenizer the course used. If they do not match, report the gap and its cause; do not tune to close it.

**Packages:** none new. scikit-learn 1.9 is already in `.venv-course`.

## What we built

Post: [src/app/(week06)/weeks/week06/](../src/app/(week06)/weeks/week06/), owner Gyula for every section.
Script: `analysis/week06_lookalikes.py` writes `analysis/week06_lookalikes.json` and the page file
`public/weeks/week06/data/lookalikes.json`; `tests/week06-prose.test.mjs` pins the prose to it.

| # | Section | Anchor | Answer |
| --- | --- | --- | --- |
| 1 | Pick a character | `#explore` | The explorer: a page's ten nearest pages with names kept and removed. Closest page linked for 223 of 303 with names, 125 without |
| 2 | Names carry the links | `#names` | Linked in ten: TF-IDF 4.01, names only 3.96, names removed 1.91, as many other words of the same rarity removed 4.00 ± 0.01 (they carry 19.8% of the weight, names 44.5%). Of the 25 closest unlinked pairs, 18 story, 2 title, 5 name only; names removed, 23 template, 2 story |
| 3 | Without names, pages lean toward women's pages | `#gender` | Women's pages fill 48% of all ten-nearest lists (17% of pages); women's lists 96% women, men's 44%, gap 51 points (z 23.9); 13 points with he and she removed too |

Traps written down for next time:

- The course's token rule is `[^\W\d_]+(?:['’][^\W\d_]+)?`, lowercased. It reproduces all 303 page lengths in
  `lookalikes.json` and its 27,033 types. Week 5's rule (hyphens kept, possessive dropped) gives 27,754 and
  does not reproduce the course's neighbours.
- The course's stopword list is NLTK's English list (26,859 remaining types); scikit-learn's gives 26,734.
- "Linked" in the course's lookalikes means either direction; the random line is 10 × undirected density.
- The brief's name rule catches 10,519 types, the course's `week6_fingerprints.json` says 10,520 (one type changes
  length when lowercased). It also catches "men" and "x" (X-Men), Avengers and Latveria.
- Wikidata P21 has a value for 199 pages; Ajak has two and drops out. Only 36 of the 104 unlabelled pages are
  shared-codename pages. Fin Fang Foom is a "male organism" (Q44148). The API rate-limits a second quick run (429).
- A review caught two traps worth keeping. First, a label-shuffle null keeps every neighbour list, so a hub page
  that sits in many lists passes it: test the gap between groups, not one group's share. Second, matching a
  control on document frequency does not match TF-IDF weight; say which one the control holds.
- He (291 pages) and his (300) get almost no IDF; she (191) and her (208) keep it. Any TF-IDF comparison on these
  pages without names leans toward women's pages.
