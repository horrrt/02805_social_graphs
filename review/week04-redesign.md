# Week 4 redesign canvas

The proposed redesign of the Week 4 post lives on a Claude Design canvas of 21 boards: the post from the hero
to every opened deep-dive box, seven explorables in the course's style, a chart kit, five years of filings and
the page as it is today. Nothing in this folder changes the live page. `docs/weeks/week04/index.html` stays as it is until the design is settled and ported.

The canvas is at https://claude.ai/code/artifact/7e7e17d5-8a2f-4fab-9f96-fdab656fbf50. It is private until its
owner shares it from the Share menu.

## What is here

- `week04-redesign/boards/` holds the 21 boards and the canvas index exactly as the canvas held them on
  27 September 2026. The `.dc.html` files need the canvas runtime, so they render on the canvas, not in a
  browser tab. The Today board's screenshot is stored on the canvas only.
- `week04-redesign/generator/` holds the Python that writes every board except Today from the repository's
  JSON, using the standard library only, and two checks.

| Boards | What they show |
| --- | --- |
| Main, Section3, Section4, Closing | The post from the hero down: findings, the opening, sections 1, 3 and 4, the closing |
| ChartKit | The colour key, the real-against-random strip chart, and before-and-after comparisons |
| Today | The live page at half size, for comparison |
| Deep1, Deep2, Deep3a, Deep3b, DeepMoreA, DeepMoreB, DeepMethods | Every "Go deeper" box, opened |
| FiveYears | Filings from FY2022 to FY2026, with FY2026 compared on matching months |
| ExploreMetros, ExploreBackbone, ExploreClients | Pick a metro, strip the backbone by α, follow clients over five years |
| ExploreGN, ExploreModularity, ExploreLouvain, ExploreOverlap | The course's four community explorables on the 40 metros |

## Rules the boards follow

- Each colour has one meaning. Dark ink is the real network, the grey band is the random baseline (mean and
  one standard deviation), orange is a worker placed at a client, blue is a direct employer. Violet, green and
  slate mark the three Louvain metro groups, on maps only.
- Every real-against-random result uses the same strip chart.
- Headings stand alone, with no pill or badge beside a section or question title.
- The answer, its baseline and its main limit stay visible. Method notes and extra numbers open from "How we
  tested it" and "More numbers" buttons on hover or keyboard focus.
- The left rail shows a section's questions only while you are in that section, and every item names itself on
  hover.
- Deep-dive boxes open without a breadcrumb, and Data and methods lists only the linked sources.
- Maps draw the states faintly behind the metros. Desktop is the only target.

## What the community explorables show

`analysis/week04_explore.py` writes their data to `docs/weeks/week04/data/explore.json`.

- Girvan–Newman finds no groups on the α = 0.2 backbone. New York and Dallas link to all 39 other metros, so
  every split strands a single metro, and modularity stays below zero at every level (best −0.0001).
- Louvain with seed 0 reaches the page's three metro groups in 43 moves, lifting modularity from −0.036 to
  0.049, against 0.013 on rewired networks.
- Clique percolation finds one community at every k from 3 to 6. Link communities find 16 (partition density
  0.46), and New York and Dallas sit in 15 of them each.

## Rebuild and check

```bash
python3 review/week04-redesign/generator/build_all.py
python3 review/week04-redesign/generator/svgbounds.py review/week04-redesign/boards/*.dc.html
node review/week04-redesign/generator/holes_check.mjs review/week04-redesign/boards/ExploreGN.dc.html '[{}, {"s": 2}]'
```

`build_all.py` keeps the board positions in `canvas.json`, because people move boards on the canvas. The
canvas keeps its own copy of each board, so a rebuilt board reaches it only when someone publishes it there.
The canvas is the source of truth. People also edit boards there directly, so refresh this folder by copying
the canvas's files back; a rebuild would drop any edit the generator does not know about.
`svgbounds.py` flags chart marks that fall outside their chart, the sign of an axis that stops short of its
data. `holes_check.mjs` runs a board's script in Node and fails if any `{{ hole }}` stays empty in the given
states.

## On the live page

The redesign is built into `docs/weeks/week04/index.html`. The canvas's metro, backbone and client explorers map
onto features the page already had: the hero map, the α slider in the deep dive and the client figure. The page
adds boxes the canvas does not have: skills behind the jobs (O*NET) and PageRank, step by step.
