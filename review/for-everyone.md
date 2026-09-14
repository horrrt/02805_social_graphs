# A first visit without network-science knowledge

This branch builds on `codex/social-graphs-simplify`. It keeps both visual
editions and changes how the weekly stories introduce their ideas.

- Week 1 explains the card draw with Spider-Man and Baymax before discussing
  link distributions. Drawn cards use “Mentioned by” and “Links to”; technical
  community labels remain in the full card index.
- Week 2 defines the transport-map analogy and “cut off” before the interaction.
  Visitors can choose **Just show me**, which reveals the result without
  recording a prediction. Submitted predictions still persist across reloads.
- The main takeaway uses everyday language. Clustering, log-scale plots,
  formulas, p-values and longer methods sit inside **Go deeper**. Readers first
  open the evidence guide, then choose a question that interests them.
- Existing numerical results, links, anchors and technical material remain
  available. The additional disclosure layer supports direct links into it.

## Verification

All 34 Node tests pass. Browser checks cover both weekly posts in both editions
at 1280 px and 390 px, with no horizontal overflow or JavaScript errors. Skipping
a prediction leaves the saved log untouched; submitted predictions survive a
reload. Pack draws work with the simpler card labels. Direct links open both
layers of evidence.

These are implementation and browser checks, not a usability study with readers.

## Screenshots

| Post | Arcade on phone | Second edition on phone |
| --- | --- | --- |
| Week 1 | [View](everyone/everyone-arcade-week01-390.png) | [View](everyone/everyone-v2-week01-390.png) |
| Week 2 | [View](everyone/everyone-arcade-week02-390.png) | [View](everyone/everyone-v2-week02-390.png) |

Desktop screenshots are in the same folder with the `1280` suffix.
