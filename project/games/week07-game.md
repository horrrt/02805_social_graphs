# Week 7 games: one per section

Teaching games for Week 7, "From meaning to measurement", written 21 October 2026. Section 3 (three ways to group the same pages) is
taken by Topic Tetris. Sentiment Trap was shared for section 4 (sentiment), and we build it here on Marvel data
with the changes below. This plan covers sections 1, 2, 5 and 6 as well. Section 7 is optional and not on Test 2, so it gets no game.

Every pitch had to pass one test, that a player who ignores the concept loses. Each section got three pitches from
different angles (a known game's loop with the week's quantity swapped in, a fast genre whose pressure forces
the trade-off, the test's misconception as the tempting move, and a surprising number from our data). Below
are the two best per section, the one we'd build, and the solver check it has to pass before any UI exists.

Numbers in the cards come from quick first-pass runs or from the course's own explorable data. Each game's
script has to reproduce them before anything is built. The Spider-Man counts in Head Count are already
checked against `week07_comention.json` on the post branch.

Scores run 0 to 2 on seven rows (winning needs the concept, real quantity, one loop and an S build, verbs over
reading, losing teaches, fresh, and playable on the Marvel pages), so 14 is the maximum.

## What each section needs installed

| Section | Game we'd build | Install | Depends on |
| --- | --- | --- | --- |
| 2 · Walk through a corpus | Two Stripes (built) | sentence-transformers and torch, all-MiniLM-L6-v2 (about 90 MB) | nothing |
| 5 · Entities | Head Count | none (spaCy small model is installed) | `claude/week07-post` merged, a spaCy rerun of about 2 minutes, about 60 hand labels |
| 6 · Search by meaning | Dense Dan | sentence-transformers and torch, all-MiniLM-L6-v2 (about 90 MB) | nothing |
| 1 · One vector for a whole text | Twin Stamp | transformers and torch, bert-base-uncased (about 440 MB) | hand-labelled word senses |

We're building them in the table's order. Two Stripes is built, Head Count waits only on the post branch, and
both encoders are installed in `.venv-course` and pinned in the requirements files. Models run offline in the
analysis scripts. The browser only reads precomputed numbers, as Cold Read does.

## 1 · One vector for a whole text

Test 2 asks you to tell a static embedding from a contextual one using an ambiguous word such as *bank*.

### Twin Stamp (build this): every card says "vision", the dictionary says they're all twins, and it's wrong

- Concept: a static embedding has one vector per word type, so two occurrences of a word always score cosine
  1.00. A contextual model computes a vector per token from its sentence: cos(h_i, h_j) on BERT's last layer.
- Loop: read the anchor card, scan four more cards with the same word, tap the one used in the same sense,
  watch all five fan out on a cosine ruler.
- On screen: every card arrives stamped "GloVe 1.00", which is a true reading. After the tap each card shows
  its real BERT cosine to the anchor, from our own Marvel sentences. Text is lowercased, since
  bert-base-uncased can't see capitals, so "Vision" against "vision" is no shortcut.
- Winning needs the concept: the word is identical on every card, so only the context words can tell the
  senses apart ("synthezoid", "android" against "eyes", "blurred").
- How a naive player loses: the static answer is the default. If the 10-second clock runs out, the 1.00
  stamps lock in as "all the same", the ruler spreads them apart, and the player loses a heart.
- Debrief: per word, the one static arrow next to the two contextual clouds (`VectorAngle`), and the clue
  words each round turned on. It ends with the document half of the section: an average of GloVe word vectors
  puts every pair of Marvel pages at 0.94 or above, and the spread comes back once the corpus mean is
  subtracted.
- The moment: "vision" on Vision's own page landing far from "vision" two lines later, while GloVe still
  reads 1.00.
- Data: new `analysis/week07_twin_stamp.py`. It splits sentences the way `week07_comention.py` does and runs
  BERT on words that are both a Marvel name and a common word. A rough count of capitalised against lowercase
  uses: vision 131/60, thing 263/59, blade 305/33, rogue 51/28, hope 73/24, storm 405/12 (capitalised Storm includes the surname of Johnny and Sue). Senses get hand
  labels in a new `week07_senses_read.parquet`, because lowercase "venom" or "thing" can still mean the
  character. A test reproduces 0.48 and 0.81 on the brief's three bank sentences.
- Reuse: `TokenWindow`, `VectorAngle`, `AxisMap` as the ruler, and Cold Read's `StartPanel`, `Tutorial`,
  `pace.tsx`, `LevelParts`, `Formulas`.
- Build: S. Biggest risk: too few hand-checked other-sense uses for storm, beast and angel.
- Solver check: pick the hand-labelled same-sense card, against random (25%) and against a word-overlap bot
  (most words shared with the anchor's window). Kill it if BERT's closest card is the same-sense card in under
  70% of candidate rounds, or if the overlap bot comes within 10 points of the sense solver.
- Score: 12 (1 on "winning needs the concept", because a careful reader can win it, though reading the
  context words is exactly what exercise 7.1 asks for).

### Lookup Rush (runner-up): the dictionary is instant, the encoder is right, and the shift is 60 seconds

- Concept: when a static vector is good enough. Inside BERT's own space the static stand-in for a word is its
  type mean, the average of all its contextual vectors on our pages. That mean leans toward the majority
  sense, so cos(h_token, mean) is high for majority uses and low for the minority sense.
- Loop: read the ticket, send it to LOOKUP (instant) or ENCODE (costs 3 seconds of the shared clock), serve,
  read the cosine.
- Winning needs the concept: LOOKUP the unambiguous words and the majority sense, ENCODE only the minority sense ("a storm hit New York").
- How a naive player loses: sending everything to LOOKUP bounces every minority-sense ticket. Encoding every
  ambiguous word runs out the clock.
- Data: shares Twin Stamp's BERT vectors and sense labels, so it's cheap once Twin Stamp exists.
- Build: S leaning M. Biggest risk: BERT's last layer is anisotropic, so a mean sits close to all its members
  and minority uses may clear any threshold.
- Solver check: kill it if no threshold separates majority from minority uses at 80% or better on each side,
  or if "encode every ambiguous word" comes within 10% of the sense rule.
- Score: 12.

## 2 · Walk through a corpus

Test 2 asks why nearest neighbours on a 2D map can differ from nearest neighbours by cosine in the original
space.

### Two Stripes (built 21 October): the map draws two numbers per page, so match the whole vector

Built at `/play/week07/two-stripes/` (noindex, linked from nowhere). The card below describes what shipped.

- Concept: a document vector is all of its coordinates. Nearest neighbours are cos(x_i, x_j) in the original
  384 dimensions. A PCA map keeps two axes, which hold 9.9% of the variance. t-SNE keeps local
  neighbourhoods better but is still a drawing.
- Vectors: all-MiniLM-L6-v2 with the brief's passage rule (passages of at most 180 words along sentence
  boundaries, 4,473 of them, averaged per page). They reproduce byte for byte from a fresh encode.
- Loop: look at the map, compare the bars, tap the nearest page, see its true rank, next.
- On screen: a target page lit on a PCA or t-SNE map with four ringed candidates, names hidden until the pick.
  Each page's vector is drawn as 24 signed bars (its first 24 principal coordinates after centring, at real
  height on one scale, the tallest 2% clipped). The lit page's bars are outlined over each candidate's. On
  PCA rounds the first two bars are shaded as the map's own axes. After the pick: every candidate's cosine
  and its rank among the other 302 pages, and a line from the target to its true nearest page.
- Winning needs the concept: match the whole shape, the tall bars most of all, and ignore which dot touches
  the target. On t-SNE the map is a fair shortlist. On PCA it says almost nothing.
- How a naive player loses: tapping the dot that touches the target. Over all 303 pages that dot is the true
  nearest page 4% of the time on PCA and 61% on t-SNE.
- Debrief: per round, each candidate's cosine, rank and whether it was the closest dot, with the cosine
  formula. At the end of a run, the player's hits against what tapping the closest dot would have scored,
  and the corpus-wide rates for both maps.
- Data: `analysis/week07_two_stripes.py` writes `public/play/week07/data/two_stripes.json`. A round's
  candidates are the true nearest page, the two dots closest to it on that map, and one page outside its ten
  nearest. A round is kept when the true nearest beats the next candidate by at least 0.06 cosine and a bot
  reading only the shown bars picks it with a cosine gap of at least 0.15. Kept: 208 PCA and 64 t-SNE rounds.
- Solver check, over all 303 pages: map dot 4% against bar match 91% on PCA, 61% against 64% on t-SNE,
  random 25%. On the kept rounds the map dot is right 2% of the time on PCA and 92% on t-SNE. t-SNE rounds
  are not filtered on the map dot, so the game doesn't pretend t-SNE fails.
- A first version drew 48 cells in five shades, and it failed a playtest: the eye counts matching colours,
  while cosine weights the big values. Bars at real height with the outline fixed it.
- Still open: nobody has played it by eye yet. Kill it if playtesters score under 60% on PCA rounds.
- Reuse: Cold Read's `StartPanel`, `Tutorial`, `LevelParts`, `pace.tsx`, `Formulas`, and `Face` portraits.

Whoever builds this should know that our data doesn't support a "far gaps on t-SNE are meaningless" mechanic.
The far-pair Spearman correlation is 0.27, and on gaps between network communities PCA is right on 0.69 of
comparisons against 0.63 to 0.70 for t-SNE. Every claim the game makes should rest on the local-neighbour
failure.

### Skrull Sweep (runner-up): each number counts Skrulls among a page's nearest pages, not the dots touching it

- Concept: a page's neighbourhood is its cosine-nearest set in the original space, which differs from the
  dots next to it on the map.
- Loop: reveal a page, read its number and its neighbour lines, flag, reveal again.
- On screen: a 30-page board (a target and its 29 cosine-nearest) on pinned t-SNE coordinates, PCA in hard
  mode. A revealed page shows how many Skrulls sit among its cosine neighbours and draws lines to them,
  labelled with cosine.
- How a naive player loses: counting the dots that touch the number, flags an innocent page, then clicks
  into a Skrull at the far end of a line.
- Data: TF-IDF neighbour sets (top 3, symmetrised), pinned coordinates and seeded boards. The neighbour lines
  are a display, not a network. That still needs a yes from the group, since course methods build links from
  hyperlinks or co-occurrence only.
- Build: M. Boards must avoid forced guesses.
- Solver check, simulated on 200 boards with 4 Skrulls: a solver reading original-space neighbours hits 0.7
  Skrulls with 2.9 forced guesses. The same solver reading t-SNE adjacency hits 3.2. Kill it if under 30% of
  boards pass "at most one forced guess".
- Score: 12.

## 5 · Entities turn prose into structured data

Test 2 asks you to tell finding an entity from deciding two mentions are the same entity, and to spot an
entity count that skipped resolution.

Both games reuse the post's data on `claude/week07-post` (`week07_comention.py`, `week07_aliases.parquet`
and the read sentences, pairs and links). That branch must merge first. The spaCy parse cache isn't in
main's `build/`, so either game needs a rerun of about 2 minutes.

### Head Count (build this): the strongest friendship on Spider-Man's page is between Peter Parker and Spider-Man

- Concept: resolution is a separate step from extraction. A node is one resolved character, not one distinct
  string. An edge's weight is the number of sentences naming both characters.
- Loop: a real spaCy PERSON span drops onto the desk with three words of context. Drop it on a roster portrait
  (merge), park it as "someone else" (an off-roster node such as Mary Jane), or bin it as "not in the story"
  (Ditko, Lee, and spaCy's non-names such as "Universe" and "MI6"). Then the next span arrives. 10 seconds
  per span.
- On screen: a live node count next to the page's count of distinct strings, and a small sentence-level
  network with its three strongest edges, redrawn after every drop. An edge between two names of one
  character turns red as a self-tie. The numbers come from our script's rerun of the Spider-Man page: 445
  sentences, 635 PERSON spans, 179 distinct, 146 nodes, 293 edges. Top pairs: Mary Jane and Peter 15, Peter
  Parker and Spider-Man 14, Peter and Spider-Man 9, Ditko and Lee 8.
- Winning needs the concept: resolve before you count. Fold Peter, Parker, Spidey and Web-slinger into one
  portrait. Keep look-alikes apart: Spider-Woman, Spider-Girl, and Mayday Parker, who isn't May Parker. Bin
  the creators.
- How a naive player loses: treating every new string as a new character, which is how the brief's flawed
  report got "1,847 distinct characters". After 20 spans their node count is about double the resolved one,
  and the top edge flashes red: Peter Parker to Spider-Man, a man linked to himself. Over-correcting by
  merging on a shared surname puts Aunt May, Ben and Richard Parker into Spider-Man, and that loses too.
- Debrief: the player's node count against the resolved count, every wrong merge and split, and the network
  redrawn after resolution. It ends with our own pipeline's choices from `week07_aliases.parquet`. We don't
  count "Peter Parker" at all, because Spider-Man and Spider-Man Noir share it. We reject "Tony Stark",
  because the roster holds only the Ultimate Iron Man, and "May Parker", because on most pages it means Aunt
  May. Resolution is a decision, and ours drops names too.
- The moment: the red self-tie at the top of a network the player built.
- Data: new `analysis/week07_head_count.py`. Per round it needs a page's PERSON spans with sentence ids, and
  a gold label per distinct string: roster id, someone else, or not in the story. The alias table labels the
  multi-word roster names. One-word names, off-roster characters and creators need about 60 new hand labels
  for the Spider-Man page, if rounds use only strings that occur at least twice.
- Reuse: `portraits.ts`, and Cold Read's `pace.tsx`, `LevelParts`, `StartPanel`, `Tutorial`, `Formulas` for
  the node and edge definitions.
- Build: M. Biggest risk: the hand labels and their edge cases (is Kang a character? Is "Spider-Man" in a
  game title a mention?). Each needs a decision before shipping.
- Solver check: a gold resolver against "every string is new" and "merge on any shared word". Kill it if the
  shared-word bot's merge F1 comes within 10 points of gold on the chosen pages. If it does, pick pages with
  more Parker and Spider-name collisions.
- Score: 12.

### Same Breath (runner-up): two hidden characters share 41 pages and no sentences, so bet on whether they're linked

- Concept: the co-occurrence unit is a modelling decision. From sentence to paragraph to page, the share of
  ties that are links falls from 0.56 to 0.48 to 0.19, while the share of links found rises from 0.61 to
  0.76 to 0.94. Co-mention isn't interaction.
- Loop: read three counters for an unnamed pair (sentences, paragraphs and pages naming both), stake 1 to 5
  chips on linked or not linked, flip to see the names, the link and one sentence, next.
- Winning needs the concept: weigh the sentence count and nearly ignore the page count. A pair named together
  in one sentence is linked 43% of the time, and in 10 or more sentences 95%, while page-only co-mention
  barely beats the null (0.19 against 0.098).
- How a naive player loses: "they share 41 pages, so they must know each other". Then the climax: the
  strongest unlinked tie, Hawkeye and Mockingbird at 45 sentences, turns out to be a series title, "Hawkeye
  & Mockingbird". Only 6 of the 25 strongest unlinked ties we read are a shared story (8 titles, 7 wrong
  names, 4 passing mentions).
- Data: `week07_comention.json` (units, weights, null, read pairs) plus a new per-pair export. No hand labels.
- Build: S. Biggest risk: fans recognise pairs from the counts, so names stay hidden until the flip.
- Solver check: a bettor using the sentence-weight bins against one using only the page count and one that
  always says linked. Kill it if the page-count bettor finishes within 5 points.
- Score: 12. It's the cheaper build, but its climax is the post's own finding, so a player who has read the
  post gets less from it. Head Count teaches the test item the post doesn't.

## 6 · Search by meaning

Test 2 asks you to tell sparse from dense retrieval, explain vocabulary mismatch, and tell a retrieval error
from a generation error in RAG.

Built 21 October alongside the plan: Semantic Minefield at `/play/week07/semantic-minefield/` (noindex, linked
from nowhere). It is Minesweeper over hand-labelled Marvel characters: the round's target category is the query and
decides the bombs, hidden tiles show one non-target category, and the debrief sets a keyword match over one-line
descriptions against the labels. Its labels are teaching data, not encoder output, so Dense Dan below is still the
game that runs the real retrievers.

### Dense Dan (build this): a ghost always trusts the encoder, and you pass him only where plain word matching wins

- Concept: sparse TF-IDF against dense MiniLM, both ranking by s = q·d, which equals the cosine because both
  sides are unit length. Dense comes in two forms: one mean vector per page, or the page's best 60-word
  passage. Vocabulary mismatch is why dense usually wins. Literal rare words are why it sometimes loses.
- Loop: read the query, see which of its words appear on the target page (underlined) and the page's length,
  plug one of three jacks (sparse, dense page mean, dense best passage), watch the target's rank land, see if
  the ghost moves ahead.
- On screen: the target's rank among 303 pages under all three engines after you plug, its score q·d, the
  words sparse matched, and the page length. The race counts top-3 hits, and summed rank breaks ties.
- Winning needs the concept: the ghost always plays best-passage dense, so you tie him on most queries and
  pass him only where another engine ranks the target higher. Pick sparse when the query's distinctive words
  are literally on the page. Pick best passage over page mean when the query names one trait of a long
  biography.
- How a naive player loses: always plugging dense ties the ghost at best, and plugging page mean because it's
  "the page's embedding" falls behind. On "a deaf archer who never misses", sparse puts Hawkeye at 1 and best
  passage puts him at 35, behind a passage about the deaf Makkari. On the Russian spy, page mean drops Black
  Widow to 20.
- Debrief: the full table of queries by engine with the player's picks marked, and s = q·d = cos(q, d) via
  `Formulas`. It says plainly that on a natural set of queries best-passage dense finds the target in the top
  3 far more often than TF-IDF does (our script's numbers), and that the deck over-samples the queries where
  the engines disagree.
- The moment: the ghost, unbeaten for six rounds, sinks to 35 on the deaf archer.
- Data: new `analysis/week07_dense_dan.py`. About 80 queries with target pages, written into the script
  before any ranking runs, as exercise 7.10 asks: half paraphrases, half using the page's own words. Three
  engines (TF-IDF on full pages, MiniLM mean of 180-word passages, MiniLM best passage of at most 60 words).
  Per query: the target's rank and score under each engine, the matched terms, the top 5 per engine. Like
  the Cold Read scripts, it prints pass rates and stops if too few rounds disagree.
- Reuse: `RankedResults`, `Formulas`, `portraits.ts`, and Cold Read's `LevelParts`, `pace.tsx`,
  `StartPanel`, `Tutorial`.
- Build: S. Biggest risk: too few queries where sparse strictly beats best passage, since dense wins on
  average.
- Solver check: a method policy (sparse when the IDF-weighted overlap between query and target page passes a
  threshold, best passage otherwise) against always best passage (the ghost), always sparse, always page mean
  and random. Kill it if fewer than about 12 of the 80 queries have sparse in the top 3 while best passage
  misses, or if the method beats the ghost by fewer than 3 hits over 10 rounds.
- Score: 12.

### Night Shift at the Index (runner-up, the better fit for RAG): a wrong answer is coming through one of two doors, and you have power for one camera look per monster

- Concept: RAG retrieves the top k passages by q·d, then generates an answer from them. A retrieval error
  means the evidence never reached the generator. A generation error means it did and the answer is still
  wrong. You tell them apart by inspecting the retrieved evidence, not the answer.
- Loop: hear the wrong answer, flip to a camera (costs power), slam the Retriever door or the Generator door,
  survive until dawn.
- Winning needs the concept: spend each look on the retrieval camera. If the true answer's page is among the
  three passages, it's a generation error. If not, it's a retrieval error.
- How a naive player loses: blaming the confident-sounding generator lets every retrieval error through.
  Checking both cameras every time runs the power out by monster five.
- The moment: the last monster asks for the Norse god of thunder, who isn't in the corpus. The retriever's
  best passage scores 0.675, its most confident of the night. That round is unscored and kept for the debrief.
- Data: about 60 questions with gold pages, MiniLM top 3 passages, and a deterministic stand-in generator
  labelled as one in the UI: it names the character with the most alias mentions in the three passages. No
  LLM. Keeps only wrong answers, labels each by stage, stops if either stage is under 30%.
- Build: M. Biggest risk: the stand-in makes too few generation errors, or ones the answer alone gives away.
- Solver check: kill it if always-Generator or always-Retriever scores 70% or more, or if the generator
  camera alone decides 80% of monsters.
- Score: 12. Worth building after Dense Dan, since it reuses the same passages and covers the RAG test item
  that Dense Dan doesn't.

## 4 · Sentiment: Sentiment Trap, rebuilt on Marvel data

Decided 21 October: we build Sentiment Trap here as its own game, linked from the Week 7 post, on Marvel
text rather than the spec's invented sentences. Its four challenges (negation, sarcasm, confidence, domain mismatch) match the section and the
test. Its spec has three problems against our rules.

1. A quiz, not a game. Each challenge asks the player to pick one of four reasons, so someone who read the
   lesson wins without using the method.
2. Invented numbers. The mock shows classifier confidences (0.76, 0.82, 0.78), a lexicon with a
   confidence (0.72), and word scores the course's toy lexicon doesn't have ("good" is +1 there, and "love",
   "stuck", "died" and "saved" aren't in it). AGENTS.md rules out a number typed by hand. The course
   reports the traffic sentence at 0.998, the hero sentence at 0.999 and 179 of 303 pages as NEGATIVE.
   Those can stay only if our own script runs distilbert on the same sentences and pages, writes the
   results to JSON, and a test pins them.
3. Mobile layouts. The site is desktop only.

The fix keeps its look and its four challenges and swaps the multiple choice for one of the pitches below.

- Red Wire as the core loop. Each challenge gives a sentence and an order such as "flip the classifier,
  leave the lookup". The player cuts one of four one-word edits (add "not", swap a sentiment word, a sarcasm
  frame, a contrast clause) and three real meters swing: a word lookup, TF-IDF with logistic regression, and
  distilbert SST-2. Cutting "not" and expecting every meter to flip loses, because the lookup doesn't move.
  Needs distilbert (about 260 MB) and vaderSentiment at analysis time, and about 120 hand-written edits.
  Solver check: kill it if a rule solver (lookup ignores context, the logistic regression moves only by the
  edited word's weight, the classifier follows negation but falls for sarcasm) is right on under 80% of
  rounds, or if "cut the biggest change in meaning" reaches 50%.
- Minimal Pair, the no-install fallback. Fill slots in a biography sentence with word tiles and read the
  real P(pos) from a TF-IDF and logistic-regression model trained on movie reviews. Change one tile at a time
  to read the sign of its weight. Traps are words whose learned sign differs from their everyday feel. It
  covers the test item "interpret the sign of a feature weight". Kill it if the learned sign matches the
  lexicon's on more than 80% of candidate words.
- Blind Audit, if challenge 3 should carry more weight. Sealed envelopes each show the classifier's label
  at about 0.99, a lexicon score and a spec card ("91% accuracy, movie reviews"). A few audit tokens open
  envelopes. Spending them where the two instruments disagree finds errors. Spending them on the low
  confidences doesn't. Needs about 150 hand-read sentences. Kill it if "lowest confidence first" catches as
  many errors as the disagreement rule.

## Where the games live

Decided 21 October: a Week 7 campaign that strings this week's games together, on Cold Read's pattern. It sits
in a hidden route group with `robots: noindex`, levels follow the brief's order, one score runs across them,
and each game keeps a practice page. Topic Tetris can join as level 3 if its author wants. The working route is `/play/week07/`,
with each game under it (Two Stripes at `/play/week07/two-stripes/`). Both encoders are approved for the
analysis scripts. Build order: Two Stripes, then the others.

## Rejected pitches

- Surname Trap (section 2): bet whether TF-IDF's or the encoder's nearest page is the linked one. Killed on
  "fresh" and "winning needs the concept": the rule ("bet the word-counter", right 79% of the time) is one bit
  a player learns in two rounds.
- Ninety-Nine (section 1): bet two needles, a GloVe average and the encoder, for a pair of pages. The averager
  puts every pair at 0.94 or above, so "always high" is learned after one round. Its finding moved into Twin
  Stamp's debrief.
- Beat Tagger (section 5): tap B, I or O on tokens in rhythm, scored by span precision and recall. Strong on
  BIO tags but an M build, and only 20 of the 47 read sentences that name a character are 25 tokens or
  shorter. Revisit if Head Count's hand labels add more short sentences.
- Top Five (section 6): type one word, pick sparse or dense, see only five passages. Killed on "winning needs
  the concept" (MiniLM on single words is a weak use of a sentence encoder) and an M binary precompute.
- Section 7 (bias before the model): optional and not on Test 2.
