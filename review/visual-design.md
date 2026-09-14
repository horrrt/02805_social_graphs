# Desktop visual redesign

The homepage now leads with the Marvel article network, a starting action, and illustrated weekly posts. Explore offers three experiments; secondary tools remain in a disclosure. Weekly posts pair a short introduction with an illustration, then separate the interaction, findings, takeaway, and optional evidence.

The second edition uses navy text, blue controls, Barlow typography, and pale backgrounds drawn from the card and transit illustrations. The arcade edition keeps its existing colours. The illustrations use the frozen dataset: the network has its actual links; the transit schematic shows links among six selected articles; the card counts are incoming references.

This branch builds on `codex/social-graphs-for-everyone`. Mobile-specific additions from this pass were removed at the user's request. Desktop is the review target.

## Validation

- All 34 repository tests pass with `node --test 'tests/*.test.mjs'`.
- Both homepages and both weekly posts were checked at 1440 px: no horizontal overflow or JavaScript errors.
- Pack draws work, and collection counts survive reloads. Station closure reveals Spider-Man's five cut-off articles.
- Direct links into methods and null-model evidence open their enclosing disclosures. All evidence images decode successfully.
- All previous element IDs remain in the six edited pages. Local links and asset paths exist. Data, calculations and saved-progress code are unchanged.
- The course-manifest test accepts whitespace in closing tags after HTML formatting; its assertions are unchanged.

These are browser and repository checks, not a reader usability study. Main and the Pages deployment remain unchanged.

## Desktop screenshots

| Page | Arcade | Second edition |
| --- | --- | --- |
| Home | [View](visual-design/arcade-home.png) | [View](visual-design/v2-home.png) |
| Week 1 | [View](visual-design/arcade-week01.png) | [View](visual-design/v2-week01.png) |
| Week 2 | [View](visual-design/arcade-week02.png) | [View](visual-design/v2-week02.png) |
