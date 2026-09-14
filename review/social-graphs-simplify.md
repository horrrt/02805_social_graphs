# Social Graphs: setup and hand-in review

Reviewed 13 September 2026 against GitHub main at `5b3b258` and the published
[Week 1 brief](https://sunelehmann.com/socialgraphs2026-web/weeks/week1.html) and
[Week 2 brief](https://sunelehmann.com/socialgraphs2026-web/weeks/week2.html).

## Reading experience

Both editions now lead with a question, one interaction, findings and a takeaway.
The posts can be read without making a prediction. The longer analyses and extra
tools remain under Evidence & details; links into those sections open them.
Published posts lead the homepage. Upcoming weeks are collapsed, and the other
games sit under Explore.

The arcade palette and the quieter second edition are retained. The changes do
not alter the dataset, numerical calculations, saved-progress keys or published
routes. Every original HTML anchor and post link remains accessible.

## Brief coverage

| Brief or chosen analysis | Where to find it |
| --- | --- |
| Public site, group identity and weekly posts | Homepage: published posts and group members |
| Week 1 question, method, figure and surprise | Hero Packs: main story and degree-distribution figure |
| Incoming versus outgoing links | Main findings; Evidence → Degree rankings, interpretation & Wikipedia spot check |
| Linear and log–log distributions | Main figure; Evidence → Degree distribution: interactive chart & sketch |
| Network drawing and islands | Evidence → Network drawing, island & isolates |
| Wikipedia API spot check (optional stretch) | Degree evidence: all three checked articles, comparison table and limits |
| Week 2 use of models/null models | Transit Authority: removal benchmark and clustering comparison |
| Degree-preserving shuffle and G(n, m) | Evidence → Full shuffle test: two null models, twelve measurements |
| Statistics, null distributions and limitations | Removal benchmark; full shuffle test; Methods and reproducibility |
| Friendship paradox (chosen extension) | Evidence → Friendship paradox & the two local leaders |
| Reproducible evidence and AI disclosure | Download links, methods and AI use sections in both editions |

The Week 2 ideas are suggestions for a free-form post, not a checklist requiring
every model. The existing null-model story fits that brief. No additional model
or unrelated experiment was added to fill space.

The course also asks groups to share the weekly site link in Teams by Monday
evening and leave constructive feedback on another group's post. Repository and
website publication do not establish whether those actions are complete. Neither
a Teams post nor peer feedback was sent during this work.

## Wording corrections

- Editorial familiarity and article length are presented as possible explanations
  of degree rankings, not measured causes.
- A z-score describes standard deviations from the null mean; it does not require
  normality. Normal-tail interpretation requires further assumptions.
- Small differences in distance and assortativity are no longer described as
  identical to the null. Their empirical p-values remain visible and qualified.
- The neighbour-sampled friendship statistic can change under rewiring; the
  edge-sampled expression depending only on degrees is exactly preserved.
- G(n, m) and degree-preserving rewiring answer different questions. The simpler
  baseline is not labelled an inherently wrong model.

## Environment and checks

The new `.venv-course` uses Python 3.13 and the dependency versions recorded in
`requirements-lock.txt`. The previous `.venv` and existing local materials and
outputs were preserved. VS Code points to the new environment. A named
**Social Graphs (Python 3.13)** kernel is installed inside it.

- `pip check`: no broken requirements.
- NetworkX, NumPy, pandas, SciPy, Matplotlib and JupyterLab import successfully.
- JupyterLab starts; its authenticated status endpoint returns HTTP 200.
- Both notebooks execute in the named kernel from temporary copies, without
  overwriting tracked notebook outputs or figures.
- 34 Node tests pass, including nested-disclosure fragment recovery.
- All six revised pages fit 1280 px and 390 px viewports without horizontal overflow.
- All original anchors are retained; local assets and links resolve.
- Browser checks cover pack draws and reload persistence, station removal and
  restore, route planning, links into evidence, and static takeaways without JavaScript.

## Screenshots

| Page | Arcade | Second edition |
| --- | --- | --- |
| Homepage, desktop | [Screenshot](screenshots/arcade-lobby-1280.png) | [Screenshot](screenshots/v2-lobby-1280.png) |
| Week 1, desktop | [Screenshot](screenshots/arcade-week01-1280.png) | [Screenshot](screenshots/v2-week01-1280.png) |
| Week 2, desktop | [Screenshot](screenshots/arcade-week02-1280.png) | [Screenshot](screenshots/v2-week02-1280.png) |
| Homepage, phone | [Screenshot](screenshots/arcade-lobby-390.png) | [Screenshot](screenshots/v2-lobby-390.png) |
| Week 1, phone | [Screenshot](screenshots/arcade-week01-390.png) | [Screenshot](screenshots/v2-week01-390.png) |
| Week 2, phone | [Screenshot](screenshots/arcade-week02-390.png) | [Screenshot](screenshots/v2-week02-390.png) |
