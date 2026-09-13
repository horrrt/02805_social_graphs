# Weekly post quality review

Reviewed 13 September 2026 against the official [Week 1 brief](https://sunelehmann.com/socialgraphs2026-web/weeks/week1.html), exercise 1.8, and [Week 2 brief](https://sunelehmann.com/socialgraphs2026-web/weeks/week2.html), exercise 2.11. These ask for a creative weekly data story; the other classroom exercises and suggested topics are not all mandatory post sections.

## Brief coverage

| Requirement | Week 1 | Week 2 |
| --- | --- | --- |
| A question using the shared network | Why the same cards recur | Which article removals disrupt connectivity |
| What the group did | Draw rule, link counts, methods and reproducible analysis | Core removal experiment and connected degree-preserving rewiring |
| A figure or table | Odds comparison; optional linear/log degree plots | Removal figure; shuffle distribution and further null-model figures |
| Findings and surprise | Unequal incoming counts; rare-card bottleneck; different incoming/outgoing leaders; separate island | Neighbour count alone does not determine disruption; comparison with rewired maps |
| Source data and qualifications | Roster limits, designed draw rule, methods and AI disclosure | Undirected core, null constraints, empirical-tail limits, methods and AI disclosure |

Both posts meet this content structure. This is not a grade prediction. The repo does not establish that the separate Teams link and peer-feedback steps have been completed.

## Changes

Week 1 previously stated a consequence of the draw rule as its main finding. The heading now names an observed feature: 58 roster articles receive no incoming links. The collection gets immediate feedback on distinct cards and repeats. A new comparison holds the deck and draw count fixed while changing the odds; its averages are labelled, with the calculation available in a disclosure. The comparison is separate from saved progress. Exact Spider-Man/Baymax odds remain available.

Week 2 previously hid the null comparison inside a disclosure after the reveal. A short side-by-side explanation now states what is preserved, what changes and how the selected article compares with the 1,000 rearranged maps. Readers can try Hulk and Spider-Man in sequence. The full histogram remains optional. Zero matching draws for Black Widow is explicitly a finite-sample result, not impossibility. The static article still explains the central result without requiring interaction.

## Validation

- 36 Node tests pass. New calculation tests include exhaustive enumeration of a three-card deck and deterministic/zero-draw cases.
- All four post pages checked at 1440 px, with no horizontal overflow or JavaScript errors.
- Compared 100 packs: 182.1 expected distinct cards under the weighted rule and 245.0 under equal odds.
- All four closure comparisons match the stored histogram counts: Spider-Man 9/1,000 at least observed, Hulk 558/1,000 exactly zero, Black Widow 0/1,000 at least observed, Doctor Strange 85/1,000 at least observed.
- Changing draw-count comparisons does not alter saved collection data; saved cards survive reloads.
- All previous HTML IDs remain. No frozen data or storage keys changed.

The user requested desktop work only. No mobile rules were added. Reader testing remains the next step: ask someone unfamiliar with networks to explain the question, result and a limitation without prompting. Do not claim engagement or comprehension gains until that is checked.

## Standalone reading

Each post now introduces the dataset and experiment without assuming an earlier visit. A compact disclosure defines the terms used locally. Week 1 explains incoming versus outgoing references and distinguishes no incoming links from isolation. Week 2 explains why the removal experiment uses 277 of the 303 articles, what a closure removes, and what a null model means. Findings paragraphs also include context for direct fragment links. Both editions were checked on desktop, and all 36 tests still pass.

## Reuse

[POST_GUIDE.md](../POST_GUIDE.md) records the workflow and user preferences. The repository's [AGENTS.md](../AGENTS.md) directs future post work to read it first.

## Desktop screenshots

| Post | Arcade | Second edition |
| --- | --- | --- |
| Week 1 | [View](post-quality/arcade-week01.png) | [View](post-quality/v2-week01.png) |
| Week 2 | [View](post-quality/arcade-week02.png) | [View](post-quality/v2-week02.png) |
