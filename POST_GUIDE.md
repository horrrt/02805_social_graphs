# Writing and building weekly posts

Use this guide before creating or revising a post. It records the user's preferences, the lessons from the Week 1 and Week 2 reviews on 13 September 2026, and the lessons from the Week 3 and Week 4 posts on 27 September 2026.

## User preferences

- Make every post self-contained. Readers may arrive directly without reading the homepage or any earlier post. Explain the dataset, what links mean, the local experiment rules and essential terms in that post. Links to other posts are optional next steps, never prerequisites.
- Build for readers with no network-science background. Introduce terms through an example before using technical vocabulary.
- Keep the approved visual direction: illustrated introductions, clear primary actions, readable spacing, and the arcade look of weeks 1 and 2. Use `docs/assets/css/design.css` and the existing post markup.
- Focus on desktop. The user explicitly removed mobile layout work from scope.
- Keep deeper analysis available through descriptive disclosures and direct links. Do not hide the evidence needed to understand the main conclusion.
- Preserve the group's personality and AI-use disclosure. Remove generic introductions, inflated claims, repeated explanations and forced phrasing.
- Work on a branch, push it and open a pull request, then merge it once its checks pass. A draft is not needed. Merging to `main` is how the site deploys: do not deploy any other way, submit coursework, send Teams messages, or edit Notion.

## Start with the brief

Read the current official weekly brief before choosing a story. Separate the weekly public-post requirements from classroom exercises and optional suggestions; a free-form post need not reproduce every exercise.

Record the source URL, review date, required elements and where each appears. Check existing work before adding analysis. Never invent a group reaction, an experiment, a result or a completed submission.

## One question, one useful interaction

Write the question in language a visitor can answer after reading the post. Choose one interaction that exposes the mechanism: a comparison, a controlled change, or an observation with immediate feedback. Every control needs a teaching purpose.

Use this reading order:

1. Question and a concrete example.
2. Interaction with a clear first action; optional prediction, never a gate.
3. Result that explains what the visitor just saw.
4. Evidence supporting the claim, with axes, units, population and comparison made clear.
5. Takeaway and one meaningful next step.
6. Optional methods, full tables, secondary analyses, source data, code and AI disclosure.

Avoid making visitors click through many trials to discover the point. A simulation result must be labelled as one run; an expectation must be labelled as an average. Explain what remains fixed when comparing alternatives. Keep exploratory controls separate from saved progress unless changing that progress is the explicit action.

## Scientific and editorial quality

Distinguish a finding about the data from a consequence of an invented game rule. Show the baseline that gives a number meaning. For a null-model story, the main reading path must explain what the null preserves, what it changes and how the observed result compares; formulas and full distributions may be optional.

Explain scope where it affects interpretation: article links are not friendships, layout distance is not network distance, a roster is not the whole Marvel universe, and a model comparison does not establish a historical cause. Keep qualifications near the claim rather than collecting every caveat at the end.

A figure should answer a question, not decorate a paragraph. Captions must say how to read it and what to notice. Use real data for illustrative diagrams or label a toy example explicitly. Do not claim a power law from appearance alone, or imply that a finite empirical tail frequency is the probability a theory is true.

Use the frontend-design and writing-clearly-and-concisely skills. Before saving prose, remove filler and duplication, check concrete nouns and active verbs, and preserve facts, uncertainty, citations and the group's notes.

## Data treatment

Week 4 set these rules, and every earlier week now follows them. Apply them to each number a post quotes.

- Read every number from a script's JSON. Either the page script loads it, or a test in `tests/` builds the sentence from the JSON and fails when the page disagrees (`tests/week04-prose.test.mjs`). Pin the names and words a sentence attaches to a number as well: "about twice" and "comes close" each rest on a threshold. Six hand-typed Week 4 numbers drifted after a rerun before any test read them (#72).
- Rerun a script before you change it and confirm it reproduces its committed JSON. On 27 September three Week 3 files no longer did, and the page still quoted them.
- Keep reruns deterministic. Seed every random step, sort a set before drawing from it and break ties on a stable key. After a change, rerun under `PYTHONHASHSEED=1` and `PYTHONHASHSEED=2` and expect identical files.
- Hold each structural claim to a null that keeps what the claim does not test: degree-preserving rewiring for modularity or reciprocity, shuffled labels for NMI, random groups matched on size. Quote the null's mean and spread with z or p. When a claim fails its null, rewrite the claim; three Week 4 conclusions changed this way (#59).
- Run stochastic methods many times with seeds `SEED + i`. Report the partition found most often and how often it recurs, and measure a gap between two methods against the gap between two seeds of one method. Label a single run as one run.
- Repeat the headline on a second year or sample when the data has one. Compare two statistics only when both cover the same items.
- Check what a file covers before you name it: Week 4's "FY2025" H-1B file held one quarter, and UN DESA mixes population registers with surveys. Write each trap into the week's notes, as `WEEK04.md` does, and report the share of rows a fuzzy join matched.
- Validate page data against its week's model before writing it, with `check(path, data)` from `analysis/check_pages.py`.
- Credit each data source on the page that uses it, in the form its licence asks for.
- Before review, read the page for one quantity given twice with different values, or one result told in several places (#69: 817 against 818).

## Before opening a pull request

Run a correctness review of the full diff before you merge. On Week 4 it found four wrong statements in #65 and seven defects in #76. Check the page on desktop with a fresh browser context. Complete the main interaction, reload to verify saved progress, open deeper evidence and follow old anchors. Check keyboard controls, empty states, images, local links and JavaScript errors. Run repository tests and meaningful tests for new calculations. Preserve routes, element IDs, data and storage keys.

Include desktop screenshots and a short brief-coverage review. State which checks were performed and what remains untested. A browser check is not a reader usability study. For future refinement, ask someone unfamiliar with networks to explain the question, result and limitation after using the post; use their confusion to guide the next edit.

## Lessons from each post

Week 1: collecting cards is engaging, but drawing alone does not explain bias. Interpret the visitor's collection and compare unequal odds with equal odds. Do not present the game rule as a discovery about fame.

Week 2: removal results are a good entry point, but the null model is the week's central idea. Surface a short comparison after the reveal; leave the full histogram, statistical conventions and extra metrics one level deeper.

Week 3: the first country join dropped the Netherlands, Palestine and Taiwan, because UN DESA writes M49 codes without leading zeros. Join on a pinned code table and fail on any code it cannot map. Betweenness on the raw DESA matrix ranked reporting systems instead of countries, since register countries list hundreds of one-person origins; threshold small corridors before you compute it.

Week 4: hand-typed numbers drifted until tests built each sentence from the JSON, and like-for-like nulls reversed three conclusions. The long page needed one deep dive at the end. Keep the answer, its baseline and its main limit in view, and move method notes one click away, word for word.
