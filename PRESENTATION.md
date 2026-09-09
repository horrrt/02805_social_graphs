# Presentation direction

Turn each week into a short, explorable story with a clear question, a surprising result, and a takeaway the reader can repeat.

This is a proposed design scorecard, not an official weighted judging rubric. The [course homepage](https://sunelehmann.com/socialgraphs2026-web/) values the outcome, rigor, and ability to explain and defend choices. The [Week 1 brief](https://sunelehmann.com/socialgraphs2026-web/weeks/week1.html) asks for creativity, a group identity, a question, evidence, and what surprised us.

The user identified **Web-Crawler by Capes & Edges** as the teacher-liked reference they remember. It was absent from the supplied ten-submission paste and is an additional reference, not a renamed entry in that list. The [game](https://oddvar112.github.io/Social-Graphs-and-Interactions/weeks/week1/game/) uses a clear mission, discovery through actions, directed routes and feedback. We adopt the mission-to-insight structure while developing a different experiment: adding links to an isolated node.

## Current entry point: Pull one hero

Week 2 leads with a consequence: removing Spider-Man strands five other articles,
whereas removing Hulk strands none. The visitor removes one of four characters,
sees who loses their route, then can switch to a shuffled graph with exactly the
same starting degrees. The page uses four recorded examples to explain the
operation and 1,000 simulations for its findings. Individual examples are labeled
and are never substituted for the ensemble result.

The question is narrower than a survey of the week's models: which articles are
single routes into small branches, and does their degree explain the damage?
Black Widow's 25 connections versus Hulk's 65 supplies a second surprise.
The headline comparison is Spider-Man's 5 stranded versus 1.409 on average after
shuffling; 9 of 1,000 draws are at least as large. The null conditions on connected
starting graphs, and longer-run checks and exploratory selection are disclosed.

`weeks/week02/#results` provides three conclusions without requiring the
interaction. Source scope, calculations, full distributions, the complete scan
of all 277 removals, AI use and limitations sit in optional evidence sections.
The homepage leads to this issue. The prior Baymax and Week 1 stories remain linked.

## Previous entry: Give Baymax a voice

The Week 1 extension lives at `play/`. Two short missions ask the visitor to make Baymax discoverable, then add a return path. Choosing an outward link first gives useful feedback instead of a penalty. Every action updates the real graph's reachable sets, with imagined links clearly separated from the snapshot. A replay lets readers compare no edit, outgoing only, incoming only and both directions.

The main results are explicit and readable without playing or running JavaScript: an imagined Spider-Man → Baymax link makes Baymax reachable from 274 other articles; reversing that link lets him reach 231 while leaving him unreachable; adding both directions yields 229 other articles with routes both ways. These are counterfactual reachability results, not direct degree counts or readership estimates. The exporter checks them independently with NetworkX, and the browser verifies its traversal against those results. Methods and attribution are optional disclosures.

| Criterion | What the presentation should do |
| --- | --- |
| First impression | Make the subject and reason to care clear within a few seconds. Baymax is isolated; the visitor can change it. |
| Originality | Derive the identity from the subject: comic issue typography, an ink/yellow/lilac palette, and actual network drawings. |
| Narrative | Make the visitor act: be found, discover the missing return path, then make the connection work both ways. |
| Main results | Provide a direct 30-second route to three conclusions. Keep calculations and distribution diagnostics in optional evidence sections. |
| Useful interaction | Give each link choice an immediate, visible consequence. Follow with optional rankings, character search and the full graph. |
| Credibility | State the snapshot date and graph boundary. Separate measured structure from interpretations about publishing or popularity. Link the data and notebooks. |
| Accessibility | Use labeled controls, keyboard search, textual counts, graph descriptions, high contrast, reduced motion, and static fallbacks. |
| Reliability | Use local fonts, data, and plain browser features. No third-party JavaScript runtime or live Wikipedia dependency is needed for the presentation. |
| Memorability | One link, 274 articles able to find Baymax. Reverse it, 231 destinations but no way in. Two directions, 229 round-trip destinations. |
| Shareability | Link directly to the results and preserve selected characters in the address. |

## Evidence behind the design choices

- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) supports revealing secondary detail when needed. Applied here by keeping calculations and methodology behind disclosure controls.
- [W3C WAI: Complex Images](https://www.w3.org/WAI/tutorials/images/complex/) recommends text alternatives that communicate a complex visual's information. Applied here through graph descriptions, explicit findings, and searchable character counts and neighbor lists.
- [Strikeforce: Morituri](https://en.wikipedia.org/wiki/Strikeforce:_Morituri) supplies context for the isolated cast. Network separation is computed from the frozen course files; publishing history is an interpretation to investigate, not a demonstrated cause.

## For the next issue

Lead with the result, not the method. Choose one real question and at most three findings. Give each interaction an explanatory job. Preserve the frozen data boundary. Add a new story when the analysis exists; avoid invented future results.

## Local preview

Serve `docs/` locally (any static server). The homepage is a quiet first screen
plus a week index. Week 2 lives at `weeks/week02/`; `#results` goes straight to
its findings. `play/#results` has the Baymax results; `weeks/week01/` keeps the
original investigation.
