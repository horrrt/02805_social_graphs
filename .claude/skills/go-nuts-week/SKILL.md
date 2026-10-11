---
name: go-nuts-week
description: Use when asked to generate, plan, start or build this week's (or week N's) go-nuts post for the 02805 Social Graphs course site, or when a new course week has been published and the group needs to know what it covers and what to make of it.
---

# Go-nuts week

## Overview

Every course week ends with "Go nuts with your LLM": one free-form post on the group site, judged on the outcome,
the rigor behind it, and whether the group can defend every choice. This skill turns a week's brief into a plan
the group can decide on in one sitting, then into a post. `project/POST_GUIDE.md` governs the build.
`project/GO_NUTS.md` holds what stays true across weeks: the standing rules, every past week's openers and our
coverage, and how the course draws. The plan for one week goes in `project/WEEK{NN}.md`.

**One question carries the post.** Every brief from week 5 on says one good question and one convincing figure
beat five methods. Week 5 ran seven openers at twice Week 4's text and had to be rebuilt. Apply the week's
topics as tools in service of that question, never as a tour.

## Phase 1: digest (automatic)

1. Run the digest. It clones or updates the course repo into `~/.cache/socialgraphs2026-web`, defaults to the
   latest week, and reports sections, exercises, the go-nuts text verbatim, the "on the test" box, explorables,
   Python imports checked against `.venv-course`, every released data file, next week's unlinked explorables,
   and this week's files, branches and worktrees in our repo:
   ```bash
   .venv-course/bin/python scripts/go_nuts_brief.py --out project/go-nuts/weekNN-brief.md
   ```
   The digest is committed with the plan, so the group reads the same brief.
2. **Another branch or worktree for the week exists?** Look at it and tell the user before planning in parallel.
3. Set the deadline: the Monday evening after the week's class date (`docs/index.html` has the dates). Size the
   plan to the days left.
4. Read `project/POST_GUIDE.md`, `project/GO_NUTS.md`, the latest `project/WEEK*.md`, and memory notes whose
   name or description mentions the week, the dataset or the post layout.
5. Read the explorables' JS and **their data files** in the cache for every opener you might recommend. The course
   often ships the answer to an opener: Week 6's `lookalikes.json` already gives TF-IDF neighbours linked 4.01 in 10
   times against 0.31 at random. Quote such numbers as calibration and go past them. The scripts that generated the
   data are not public, so say "method unknown" rather than guess how a file was built.

## Phase 2: plan, then stop

Write `project/WEEK{NN}.md` with:

- **Deadline and owners** (owners as last week unless told otherwise).
- **Brief coverage:** the post-shape the brief requires mapped onto Week 4's card. Question and answer go in the
  `w4-q` header, the method in the `w4-two` paragraph, the surprise in "What to notice", the figure stays in view,
  and the limitation and text checks go in the drawers. The six parts are never six open blocks.
- **Topic map:** every method the week teaches, and whether the post uses it as the main tool, a cross-check,
  a drawer, or not at all, with a reason.
- **Openers table:** for each opener, the method, what the course already computed, the null, the hand check,
  the stability check, the files it reuses (open a file before claiming it computes something), and effort.
- **Recommendation:** one question, the figure that answers it, and a split that has each owner answering part
  of that question.
- **Packages** the recommendation needs.

Then ask the user to pick the question and the owners: AskUserQuestion if available, otherwise end your reply
with the questions. Don't build before they answer, unless they said to go ahead on your recommendation.

## Phase 3: build

Add only the packages the chosen question needs to `requirements.txt`, install them into `.venv-course`, and
regenerate `requirements-lock.txt` with `pip freeze`. Then follow `project/POST_GUIDE.md` from "Start with the
brief": branch, copy `src/app/(template)/`, Week 4's card, the text budget, data treatment, review, PR, merge once
checks pass. Run long analysis from the main session and spread seeded reruns over cores.

## Rigor checklist

| Check | Form |
|---|---|
| Compared to what | A null that keeps what the claim doesn't test: shuffled labels, degree-preserving rewiring, random pairs matched on page length or network distance, held-out pages. Quote mean, spread, z or p |
| Read the text | A CSV of hand-read cases: n read, n right. The brief asks "what you checked in the underlying text" |
| Stability | Seeds `SEED + i` for LDA, Word2Vec, Louvain; report overlap between seeds before comparing methods. Word2Vec: `workers=1` and a `hashfxn` that does not use Python's `hash`, or reruns differ under different `PYTHONHASHSEED` |
| Distances | Undirected shortest paths unless direction is the point; unreachable pairs (17 isolates, small islands) form their own bucket, never infinity in a mean |
| Numbers | Every quoted number comes from a script's JSON and a test pins it |
| Brief claims | The "on the test" box lists flawed claims (one fitted solution as the answer, a topic label as model output, high cosine as proof of meaning). The post must not make them |

## Methods

A method the course has taught counts as a course method from that week on. Use similarity (cosine, embeddings)
to measure and compare. Don't build network links from similarity (kNN or threshold graphs) unless the brief
itself asks for it: Gyula rejected exactly that in Week 4. Links come from Wikipedia links or co-occurrence.

## Common mistakes

- Doing every opener. Pick one question; put a second opener in a drawer at most.
- Planning from the week page text alone. The explorables' data shows what the course already computed.
- Claiming a reused script computes something without opening it.
- Trusting the old `materials/` mirror. The digest reads the course repo, which matches the live site.
- Treating weeks 2-4's "crawl your own category" option as open later. From week 5 the corpus is the Marvel pages.
