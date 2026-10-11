# Week 5 hover tips

On main, `hoverTips()` in `src/scripts/tips.js` runs on all 11 `[id^="chart-"]` hosts of Week 5 and
turns them into tip hosts (KB07). This file records what each host looks like after load, after a hover and
after a resize, so the batches that draw the hosts in React (W5-1: hero; W5-2: relations, copying,
autocomplete; W5-3: heaps, fame, weird) can render `HoverTipHost` from `src/kit` to match. Source:
`scripts/parity/fixtures/hovertips/week05.json`.

## How the states were captured

- Main's export at 7978c8a and fed3c83, whose Week 5 markup and scripts are the same, three runs each, the
  third with `--profile slow`: six runs per state.
- **load**: the host after the page settles.
- **hover**: the pointer moves to the centre of the host's first `[data-tip]`. Hosts are hovered in document
  order after the modularity drawer is opened (`scripts/parity/scenarios/week05/base-tips.mjs`). A host
  without a `[data-tip]` has no hover state.
- **resize**: the viewport changes to 1280 x 800 after the last hover, with the pointer left where it was.
- The fixture drops `_echarts_instance_` attributes and writes the server origin as ORIGIN.

## What every host shares

- The host keeps its server attributes and gains the class `kit-tip-host` after its own classes.
- The tip is `div.kit-tip`. While nothing is hovered it carries `hidden=""` and no children.
- A hover shows the tip with `style="left: …px; top: …px;"` and the mark's `data-tip` text: the first line in
  a `<b>`, a second line in a `<span>`. The mark under the pointer gains the class `kit-hot`.
- When the pointer leaves, the tip keeps its `style` and its text and gains `hidden=""`. The mark that was hot
  loses `kit-hot`; a mark that had no other class keeps an empty `class=""`.
- Where the tip sits among the host's children follows `HoverTipHost`'s `tip` prop:
  - `first`: the tip comes before the chart from load on.
  - `none`: the draw emptied the host after `hoverTips()` ran, so no tip exists until a hover, which appends
    it last.
- "Same as load" below means the state's DOM equals the load DOM byte for byte.

## Every host

Each state has one DOM in all six runs, except `chart-weird-scatter` after the hover, which has two.

| Host | Batch | Classes | tip | Marks with `data-tip` | Hover state |
| --- | --- | --- | --- | ---: | --- |
| `chart-hero-fame` | W5-1 | `w5-hero-plot kit-tip-host` | none | 303 | yes |
| `chart-relations-crossing` | W5-2 | `kit-tip-host` | first | 10 | yes |
| `chart-relations-map` | W5-2 | `kit-tip-host` | none (never shown) | 0 | no |
| `chart-copying-linked` | W5-2 | `kit-tip-host` | first | 3 | yes |
| `chart-copying-network` | W5-2 | `kit-tip-host` | none | 22 | yes |
| `chart-autocomplete-map` | W5-2 | `kit-tip-host` | none (never shown) | 0 | no |
| `chart-autocomplete-modularity` | W5-2 | `kit-tip-host` | first | 2 | yes |
| `chart-heaps-curve` | W5-3 | `kit-tip-host` | first, two tip divs | 0 | no |
| `chart-heaps-gap` | W5-3 | `kit-tip-host` | first | 8 | yes |
| `chart-fame-scatter` | W5-3 | `kit-tip-host` | first | 0 | no |
| `chart-weird-scatter` | W5-3 | `kit-tip-host` | first | 305 | yes |

### chart-hero-fame

The attributes come in the server's order: `aria-label`, `class`, `id`, `role`.

- **load**: `svg[aria-hidden]` (viewBox `0 0 764 380`) alone. There is no tip div.
- **hover**: `svg`, then `div.kit-tip[style]` holding `<b>Abomination (character): 3,930 words, 5 incoming
  links</b>`. The hovered circle has `class="kit-hot"`.
- **resize**: `svg`, then `div.kit-tip[style][hidden]` with the same text. The circle keeps `class=""`.

### chart-relations-crossing

- **load**: `div.kit-tip[hidden]`, then `svg.w4-strip[role=img]` (viewBox `0 0 582 360`).
- **hover**: same as load. Main shows no tip and marks nothing hot here.
- **resize**: same as load.

### chart-relations-map

- **load**: `div.gv.gv-explore`, which holds `div.gv-stage`: `div.gv-tip[hidden]`, `div.gv-tools` (three
  buttons), then `svg[role=img]` (viewBox `0 0 476 425`). There is no `div.kit-tip`.
- **resize**: same as load.

### chart-copying-linked

- **load**: `div.kit-tip[hidden]`, then `svg.w4-strip[role=img]` (viewBox `0 0 500 192`).
- **hover**: `div.kit-tip[style]` holding `<b>20 of 22 copying pairs link to each other</b>`, then the svg.
  The hovered circle has `class="kit-hot"`.
- **resize**: `div.kit-tip[style][hidden]` with the same text, then the svg. The circle keeps `class=""`.

### chart-copying-network

- **load**: `div.gv.gv-explore` > `div.gv-stage`: `div.gv-tip[hidden]`, `div.gv-tools` (three buttons),
  `svg[role=img]` (viewBox `0 0 534 509`). There is no `div.kit-tip`.
- **hover**: the same `div.gv`, then `div.kit-tip[style]` last, holding `<b>Eddie Brock and Venom: 1,023
  shared words, under Publication history.</b>` and a `<span>` with the quoted passage. The hovered line gains
  `kit-hot` after its own classes; `div.gv-tip` stays hidden.
- **resize**: `div.gv`, then `div.kit-tip[style][hidden]` with the same text. The line goes back to its own
  classes, so no `class=""` appears.

### chart-autocomplete-map

- **load**: `div.gv.gv-explore`, which holds `p.gv-legend` (8 `button.gv-key`, then a `span`) and
  `div.gv-stage` (`div.gv-tip[hidden]`, `div.gv-tools` with three buttons, `svg[role=img]` with viewBox
  `0 0 476 425`). There is no `div.kit-tip`.
- **resize**: same as load.

### chart-autocomplete-modularity

The host sits in the closed "More numbers" drawer of section 4.

- **load**: `div.kit-tip[hidden]`, then `svg.w4-strip[role=img]` with viewBox `0 0 556 120`.
- **hover**: the same children with viewBox `0 0 631 120`. Opening the drawer before the hover redrew the
  strip at the drawer's width; the hover itself shows no tip and marks nothing hot.
- **resize**: same as hover.

### chart-heaps-curve

- **load**: two `div.kit-tip[hidden]`, then `svg[role=img]` (no class; viewBox `0 0 519 374`). The second
  tip div is KB07's doubled tip.
- **resize**: same as load.

### chart-heaps-gap

- **load**: `div.kit-tip[hidden]`, then `svg.w4-strip[role=img]` (viewBox `0 0 519 300`).
- **hover**: same as load. Main shows no tip and marks nothing hot here.
- **resize**: same as load.

### chart-fame-scatter

- **load**: `div.kit-tip[hidden]`, then `div.kit-echart[style]` (height 440 px), which holds ECharts' SVG
  renderer output: a `div[style]` with the 534 x 440 svg, then an empty `div` with `class=""`.
- **resize**: same as load.

### chart-weird-scatter

`week05-weird.js:89` appends a drawer row inside the host after the chart, through `drawerRow(drawer(…))` from
`kit.js`: `div.rx-drawers.rx-foot` holding one closed `details.rx-drawer` ("Table: all 303 pages"). It is
part of the host's children in every state and is not in the server markup.

Since 6 October 2026 that table is its own island (#weird-pages) in the card's drawer row, labelled "Table", so the host
holds the tip and the svg only; the record below keeps the drawer row as main had it.

- **load**: `div.kit-tip[hidden]`, `svg[role=img]` (no class; viewBox `0 0 534 384`), then the drawer row.
- **hover**, two variants:
  - Variant 1, in 5 runs (7978c8a 1, 2 and 3, fed3c83 2 and 3): `div.kit-tip[style]` holding `<b>Xorn: 1,688
    words, MATTR 0.696, z = +0.19 against the 30 pages nearest in length, rank 141 of 303</b>`, then the svg
    with the Xorn circle `class="kit-hot"`, then the drawer row.
  - Variant 2, in 1 run (fed3c83 1): variant 1 plus `class=""` on the band polygon, left by an earlier hover
    on the band in that run.
  - Either variant is a match.
- **resize**: the tip stays visible (`div.kit-tip[style]`, no `hidden`) and now holds `<b>Random stretches of
  the whole corpus at each length: mean ± 2 sd of 2,000 draws</b>`. The band polygon has `class="kit-hot"`
  and the Xorn circle keeps `class=""`. The new layout put the band under the pointer, which had not moved.
