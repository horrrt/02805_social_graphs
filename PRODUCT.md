# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, all confirmed as primary:

- **Classmates in DTU 02805.** Other groups open each post from the link in that week's Teams channel, give friendly criticism, and help pick the weekly "go nuts" winner. They know the week's methods and read several groups' posts side by side.
- **Course staff.** Sune Lehmann and the TAs judge the outcome, the rigor behind it, and whether the group can defend every choice.
- **Curious outsiders.** Friends, recruiters and others arriving from a link, with no network-science background.

Any of them may land on a post directly, without the homepage or earlier posts.

## Product Purpose

Log–Log Legends is the course website of group Log-Log Legends (Gyula Kürthy, Àngela Buxó, Niklas Johansen) for DTU 02805 Social Graphs and Interactions, autumn 2026. Each course week it publishes one free-form post that takes that week's method, points it at one question about real data, and answers it with an interactive figure. Data so far: the course's 303 Marvel Wikipedia pages (weeks 1, 2, 5, 6), global migration flows (week 3) and US H-1B hiring filings (week 4).

A post succeeds when a reader can state its question, its answer, and the baseline that gives the answer meaning, and when the group can defend every number on it.

## Positioning

Rigor first, play second. The identity is the evidence: every post reproduces the course's own figures before building on them, holds each claim to a null model that keeps what the claim does not test, reads the underlying text by hand, and pins every number the page quotes to a script's output. Interaction exists to let the reader see that evidence, not to entertain around it.

## Operating Context

- One post per course week, linked in Teams by the Monday evening after class; the course runs eight weeks (2 September to 28 October 2026).
- Posts are built from a template (`src/app/(template)/`) and follow `project/POST_GUIDE.md`; the weekly plan lives in `project/WEEKNN.md`.
- The site is a Next.js static export deployed to GitHub Pages by merging to `main`.

## Capabilities and Constraints

- **Desktop only.** Phone layout is out of scope; do not test, design for, or caveat mobile.
- **Self-contained posts.** Each post explains its dataset, what a link means, its local rules and every technical term, for a reader with no network-science background.
- **Numbers from JSON.** Every number a page quotes comes from an analysis script's JSON, and a test fails when page and file disagree. Never invent a result, a group reaction or an experiment.
- Each post follows the brief's shape: what we asked, what we did, one strong figure, what surprised us, what we checked in the data, one limitation.
- Undecided: whether the AI-use note on every post is a binding commitment. Current posts carry one and POST_GUIDE asks to preserve it.

## Brand Commitments

- Name: Log–Log Legends (with an en dash), group Log-Log Legends.
- Voice: plain, specific, no inflated claims; the group's notes and personality stay.

## Evidence on Hand

- Course data snapshots in `data/` (Marvel pages and links, frozen 26 August 2026) and the group's own sources (migration, H-1B; see `project/MIGRATION_DATA_CATALOGUE.md`).
- Analysis outputs in `analysis/*.json` and hand-read verdicts in `analysis/*.csv`.
- Team portraits in `public/assets/images/team/`.
- None of the following exists, so do not fabricate it: testimonials, reader studies, usage statistics, awards or competition wins.

## Product Principles

1. One question per post, answered with one convincing figure; more methods never substitute for a better question.
2. A number means nothing without its baseline: show the null, what it keeps, and how far the result sits from it.
3. Check the data underneath before believing a pattern, and show the reader what was checked.
4. Distinguish what the data shows from the consequences of a method choice or a game rule.
5. Keep the answer, its baseline and its main limit in view; put method detail one click away.
