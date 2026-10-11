# Parity scenarios (P0b)

The base scenarios that every later batch runs main-vs-head, the main-vs-main known files and the fixtures. The
tools and their step syntax are in [scripts/parity/README.md](../../scripts/parity/README.md).

Base: main's export at `7978c8a`, the merge base with `origin/main` after merge `8b4d383`
(`BASE=$(node scripts/parity/build-ref.mjs --ref 7978c8a --print-out)`, cached at
`~/.cache/llparity/7978c8a4dc1dcd66c774b86b9c06e2d74482865f/out`). The scenarios were first written against
`fed3c83`. Between the two commits `src/scripts` and the data did not change; the pages gained head metadata
(canonical and Markdown links, Open Graph, JSON-LD), week03's canvases gained `role="img"` and `aria-label`, and
the home page's About section changed. Every file was re-run main-vs-main on `7978c8a`.

## Running them

One command per file, each under 90 s by `--estimate`:

```
node scripts/parity/runtime.mjs --base $BASE --head out --pages <page> --scenario <file>
```

The estimate counts 4 s a load and 3 s a snapshot. Wall time differs: week04's deck.gl explorer and week03's
WebGL renderers snapshot slowly in the headless shell, so the "time" column gives one measured main-vs-main run on
`7978c8a` on an M-series Mac with nothing else running. The WebGL files carry their own caveat below.

`--steps a..b` runs the steps before `a` without settling. On `base-panels` that rushes the page: a later half
(`--steps 15..28`) under `--runs 3` flipped `#cut-pagerank-explore`, `#topic-jobs`, the scroll-spy classes and
`#w4m-gn-chart`'s size on main, which full runs never did. Run `base-panels` whole; under `--runs 3` it takes
65 s.

`base-controls` waits up to 45 s for the entity explorer to press "companies" before it picks a colour. Laying
out the companies holds the main thread, and on 4 October, with the machine's load average at 13, one `--runs 3`
pass had a base side miss the earlier 20 s wait (a base step error, which no known entry can mask). The same
command passed on the next try, and two more `--runs 3` passes with the 45 s wait passed in about 80 s each.

Every `{evaluate}` name resolves in the scenario module, then `scenarios/<page>/lib.mjs`, then
`scripts/parity/evaluate.mjs`. Shared helpers (`ctrlWheel`, `focus`, `clickAt`, `waitFor`) live in
`scenarios/shared.mjs`; `scenarios/week03/steps.mjs` builds the six renderer files.

## Files

| page | file | covers | estimate | time |
| --- | --- | --- | --- | --- |
| home | base | load, `#weeks` and `#about` anchors, Tab to the skip link | 19 s | 5 s |
| week01 | base | three `#open-pack` clicks, reload, `#compare-packs`, `#pack-seed` (cleared, typed, Tab), a pack on the new seed; the prediction typed and submitted, `#open-logbook` / `#close-logbook`, `#collection-filter`, `#collection-search`, `#more-cards`, `#degree-scale`, a drag on `#sketch-chart`, `#compare-sketch`; a storage event on the logbook key while `#logbook` is open, `#reset-logbook` dismissed then accepted (it reloads) | 88 s | 25 s |
| week02 | base | every `#line-chips` button hovered then clicked; the route form, `#route-isolate`, `#route-island`, `#closure-select`, "Just show me", `#restore-service`, `#compare-station`, reload | 87 s | 21 s |
| week03 | base-canvas, base-d3, base-echarts, base-deck | per renderer: `audit03Rows` (echarts: the plain `audit03`, which throws on main, then `audit03Rows`), year slider to 0, second option of `#edge-origin` and `#edge-dest`, each `#map-toggle` layer, each axis mode on both groups, three hovers and a click on the histogram and on the z-score scatter (the renderer's own host), a drag on the globe, a resize to 1280×800 | 74 s each | 37 to 46 s |
| week03 | base-globe, base-globe-b, base-atlas, base-atlas-b | the same steps without the audit, split in two: part a the controls, part b the hovers, clicks, drag and resize. Buttons are pressed with Enter and chart clicks land at the pixel, because the WebGL stage overlaps them and Playwright's click refuses | 37 s each | see below |
| week03 | base-style | `?palette=okabe&arcs=flow&basemap=outline&tables=zebra`, `#style-trigger`, a click inside the open bar, a palette change (no reload), Escape, the d3 chip (reloads, scroll restored from sessionStorage); then `?variant=d3` with the vendored d3 aborted and reloaded (fallback sentence, `data-variant="canvas"`) and a palette change after it | 42 s | 18 s |
| week03 | base-drawers | `#questions` (ring year slider and a hover on `#q-ring`), `#views` (each area mode, both sliders, the asylum select), `#cliques`, a typology chip and its "See all" drawer, `#dk-country`, a palette change with the drawers open | 46 s | 16 s |
| week04 | base-hash | `#cut-skills-radar`, `#who-first-round`, `#place-inspector`, `#w4m-panel-louvain`, `#w4m-panel-mod` (sets `data-want`), `#cut`, Back; and a scrollTo for each `.topnav` target | 60 s | 21 s |
| week04 | base-topics-a, base-topics-b | each `details.rx-topic` opened from the catalogue's topic head and closed by its back link, three per file | 16 s each | 7 s each |
| week04 | base-panels, base-panels-b | every `details.rx-panel`: a topic by its hash (which opens its first panel), each later panel by its toc link; where, jobs and outsourcing in the first file, paperwork and years in the second | 52 s, 34 s | 41 s, 13 s |
| week04 | base-place | two `echartsClick`s on `#chart-hero-map`, both `[data-place-metric]`, both `[data-place-region]`, `#place-alpha` by click and by ArrowRight, Home, End, `#place-employer` | 40 s | 14 s |
| week04 | base-controls | `w4-radar-race`: `skills.json` delayed 6 s, then `#cut-skills` opened (KB08: on main the radar's 5 s fallback mounts it and skills' `replaceChildren` wipes it); `w4-controls`: the catalogue link to the radar, the radar search and a radar chip, the toc link to PageRank and its damping, the entity explorer (entity button, colour select, first legend button, reset) | 41 s | 52 s |
| week04 | base-controls-b | the methods tabs with Step, "Everyone in one group", "Louvain's groups", Louvain's Step and overlap k = 4; the roles card (split, scale, window); the years card; the first `.w4-term` button: click, second click, outside click, Escape | 46 s | 19 s |
| week04 | base-staffing | `#staffing-figure`: each year button, ArrowRight, End and Home on the year control, a client typed into the staffing search, a client typed into the ego search | 40 s | 14 s |
| week05 | base | every runtime glossary term hovered; the relations map switch; `storm` typed into the search, then a second query; the autocomplete quiz: pick, lock and reveal, next, an empty lock, previous (the locked select is disabled) | 67 s | 20 s |
| week05 | base-tips | the first `[data-tip]` of each `[id^="chart-"]` host that has one, hovered in turn (the modularity drawer opened first), then a resize | 31 s | 10 s |
| template | base | term hover, a movable node by click and by Enter, Ctrl+wheel and a drag on the hero network, Escape, a legend click | 28 s | 8 s |
| kit | base | the same as the template, plus a hub ring click | 31 s | 13 s |
| styleguide | base | `?skin=terminal&palette=iris&tables=cards`, `#style-trigger`, a click inside the bar, each select, an outside click | 28 s | 8 s |
| mockups | base | every filter, a favourite, reload; `?collection=marvel`, `#mockup-5`, ArrowRight, Escape, a favourite and `#copy-shortlist` | 69 s | 22 s |
| play | base | both missions (the wrong page first), the return link, every replay button, restart | 34 s | 9 s |
| screen-test | base | the three cast buttons, every CCDF key, `#rig-run` (3 s), `#rig-reset`, the three draw buttons, both stats toggles | 46 s | 14 s |

`faults.mjs --data` uses `scenarios/<page>/base.mjs` when it exists: week05's `base.mjs` (11 files, about 25 s
each; `--shard i/6` keeps each command between 50 and 80 s) and a plain load for week04 (15 files; `--shard i/4`,
about 15 s each).

## Where the spec and main disagreed

- **Template and kit networks are not explore views.** Main draws no hub buttons, zoom buttons or legend
  buttons on the template, and no zoom or legend buttons on the kit, so those steps are absent. The legend click
  hits the plain legend; the hub click (kit only) hits a non-explore hub.
- **The week03 echarts audit throws on main.** `audit03` stops with `TypeError: Cannot read properties of null
  (reading 'getAttribute')`: main has no `#prestige-ec`, and ECharts 5.5.1's `getInstanceByDom(null)` throws.
  The scenario compares that error (`expectError`) and then runs `audit03Rows`, which returns `undefined` for a
  null host while the audit runs and gives main's 49 rows (0 failing at `7978c8a`, as at `fed3c83`; the canvases'
  new `aria-label`s changed no row). `known/week03/base.json` records both.
- **No audit under globe.gl and Atlas.** Main's audit takes 3.5 minutes under globe.gl in the headless shell and
  longer under Atlas, past the 2-minute command limit. Deck.gl's audit runs.
- **The WebGL files run slowly.** A single base-globe run took 2.5 minutes before the split. Each half is about
  37 s by estimate but 61 to 102 s of wall time on `7978c8a` (`base-atlas-b` 102 s, `base-globe-b` 94 s). Under
  `--runs 3` cut each half with `--steps a..b` (earlier steps still run, unrecorded, without settling): the later
  half of `base-globe-b` took 109 s.
- **Shuffle is not pressed.** "Shuffle the labels" draws from `Math.random`, whose seeded sequence other modules
  consume a timing-dependent number of times on main, so its result differs between main runs; the scenario
  presses the two deterministic modularity controls instead.
- **Extra files.** `base-controls-b`, `base-panels-b`, `base-globe-b` and `base-atlas-b` exist because the named
  files ran too long in one piece (base-panels took 3.5 minutes under `--runs 3`), and the `.topnav` scrolls sit
  in `base-hash` for the same reason.
- **Topic and panel summaries are `display: none`.** Week04 opens topics from the catalogue's heads or by hash,
  and panels by their toc links.

## Known files

`scripts/parity/known/<page>/base.json` holds main's own nondeterminism, found by running every file main-vs-main
on `fed3c83` three times plain, once with `--runs 3` (the third slow) and once with `--fonts-delay 500`, then on
`7978c8a` once plain, once with `--runs 3` and once with `--fonts-delay 500`. Every file passed all three
`7978c8a` passes with these files and needed no new entry. Each entry's reason says why the key flips and, where it
flipped only sometimes, how often. Entries for rare flips stay although `7978c8a`'s passes did not hit them: the
mechanism is in `src/scripts`, which did not change. Week05's `div.kit-tip` flips, for one, hit none of the three
`7978c8a` passes. Keys start with `*` so they also match `faults.mjs`, which prefixes the aborted file.

| page | what flips on main |
| --- | --- |
| week01 | the first guess's `date` in the logbook record |
| week03 | `#v-graph`'s force layout canvas (and the screenshot while it shows); the WebGL context address in console warnings; a reference entry for the echarts audit (KB06), which masks nothing |
| week04 | the arc chart's lines effect (P0a); the selected metro's ripple layer on the citymap and regions maps; the WebGL context address while the entity explorer shows; once, the scroll position after `#topic-years` opens |
| week05 | the hidden `div.kit-tip`'s position in every chart host (KB07, P0a), so chart hosts, their sections and figures, `#main` and `body`; a visible tip's lines in `innerText` |
| mockups | lazy thumbnail requests after the reload |

`faults-base.json` for week04 and week05 is empty (`{}`): every abort compared ok main-vs-main on both commits
(26 files on `7978c8a`: 11 for week05, 15 for week04).
[requests/P0b.md](requests/P0b.md) asks for two engine changes that would let the WebGL console entries and most
of week05's entries go.

## Fixtures

`scripts/parity/fixtures/`, captured from main's export at `7978c8a`. The term fixtures came out byte for byte the
same as at `fed3c83`.

- `terms/week04.json`, `terms/week05.json`, `terms/template.json`: one row per `termify(` call in `src/scripts`:
  `module`, `line`, `selector` (the element the call touches; for a script-built element, its runtime path from
  the nearest id), `serverRendered`, `phrase`, `definition`, `id`, `order` (call order within the module),
  `afterData` (true for every call: week05's run after each module's top-level await, search's inside its data
  callback, week04's inside data callbacks, the template's after `await loadData`), `matched` (whether the phrase
  was found; 10 of week05's 21 calls find nothing on main), `raw` (`capture.mjs --raw` of a server-rendered
  element, else null) and `after` (the element's runtime `outerHTML` once the page settled; calls on one element
  share it, so apply them in `order`). Week04's six panels were opened by hash first. `#place-snap-note`'s text is
  set from data before its call, so its `raw` is the server text.
- `hovertips/week05.json`: every `[id^="chart-"]` host's `outerHTML` after load, after hovering its first
  `[data-tip]`, and after a resize to 1280×800, over three runs on `7978c8a` and three on `fed3c83` (the third
  of each with the slow profile), as the set of distinct DOMs per host and state with the runs that produced each,
  labelled by commit. `7978c8a`'s runs agreed on every host; one `fed3c83` run left `#chart-weird-scatter` with a
  different hover DOM (KB07).
- `touched/week03.json`, `touched/week04.json`: `touched.mjs` over every base scenario file of the page, merged by
  path (kinds unioned, counts summed, `scenarios` listing the files that touched it).
