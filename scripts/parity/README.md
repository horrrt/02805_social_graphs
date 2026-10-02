# Parity tools

These tools prove that a branch shows readers the same site as main. The React rewrite
([review/react-migration/](../../review/react-migration/README.md)) runs them after every batch: the static
export must match markup for markup, and the running pages must match step for step. They compare two export
trees: the base (main, built once and cached) and the head (your `out/`).

| tool | npm script | what it answers |
| --- | --- | --- |
| `build-ref.mjs` | `npm run parity:build -- --ref <sha>` | Where is the export of commit X? Builds it once, then reuses it. |
| `static.mjs` | `npm run parity:static -- <base> <head>` | Do the built pages carry the same markup and stylesheets? |
| `runtime.mjs` | `npm run parity:runtime -- --base <b> --head <h>` | Do the pages behave the same in a browser? |
| `faults.mjs` | `npm run parity:faults -- --base <b> --head <h> --pages p` | Does a failed file or island leave the rest of the page alone? |
| `touched.mjs` | | Which server elements do main's scripts touch? |
| `slot-coverage.mjs` | | Is every touched element behind a slot? |
| `capture.mjs` | | What markup does a selector match, built or after a scenario? |
| `dev-strict.mjs` | | What does React StrictMode in `next dev` double? |

`lib.mjs` (flags, pages, serving, the browser), `engine.mjs` (context, settle, steps, snapshot, compare) and
`evaluate.mjs` (built-in `{evaluate}` functions) are shared plumbing.

## Ground rules

- **Desktop only, never the hidden Browser pane.** The tools drive their own headless Chromium. The hidden pane
  pauses `requestAnimationFrame` and `ResizeObserver`, so charts there stay at their fallback size and every
  comparison made in it is wrong.
- **About 90 seconds per command.** No command may run longer than about 2 minutes, so plan each one for 90 s.
  Run `--estimate` first, then cut the work with `--steps a..b`, `--only <scenario>`, `--pages` or `--shard i/n`.
  Run builds in the background with output to a log and poll the log.
- **The same build id on both sides.** Files under `public/` carry the deploy's commit in their URLs
  (`asset()` in `src/scripts/site.js`, `NEXT_PUBLIC_BUILD_ID` in `next.config.ts`). Build the head with
  `GITHUB_SHA=parity00000 npm run build`; `build-ref.mjs` builds the base the same way. A head built without it
  differs from the base in every asset URL.
- **Never weaken a check to pass.** A real difference is fixed in the code, or recorded in a known file with a
  reason (below). A tool that needs a change goes through the gap protocol in
  [review/react-migration/requests/](../../review/react-migration/requests/README.md).

## build-ref.mjs

```
node scripts/parity/build-ref.mjs --ref <sha|branch|HEAD> [--print-out]
BASE=$(node scripts/parity/build-ref.mjs --ref origin/main --print-out)
```

Builds a commit's static export and caches it at `$PARITY_DIR/<full sha>/out` (default `~/.cache/llparity`).
A second call for the same commit returns at once.

- **Lock.** The first caller creates the directory `$PARITY_DIR/<sha>.lock`; anyone else waits, prints a line
  every 10 s, and reuses the finished tree. The builder touches the lock every 10 s; a lock older than 10 minutes
  is stale and taken over.
- **Build.** `git archive <sha>` into `$PARITY_DIR/<sha>.tmp-<pid>/tree`, then `node_modules` cloned from
  `$LL_NODE_MODULES` (or this checkout's) with `cp -Rc` on macOS and `cp -al` on Linux. Never a symlink:
  Turbopack rejects a `node_modules` symlink that points outside the project. Then
  `GITHUB_SHA=parity00000 NEXT_TELEMETRY_DISABLED=1 next build`, with a progress line at least every 10 s and the
  full log in the tmp directory. `out/` is renamed into place atomically and the tmp directory deleted.
- `--print-out` prints only the path, for `$(...)`. Progress goes to stderr.

## static.mjs

```
node scripts/parity/static.mjs <baseOut> <headOut> [--report file]
```

For every `.html` in either tree (outside `_next/`), it compares:

- the page set: a page missing on one side is a difference;
- the markup after `normalise()` from `tests/built-page.mjs`, the same markup the tests read (Next's scripts,
  preload links and `<!-- -->` text markers dropped). Each stylesheet link is replaced by a hash of the CSS
  file's content, so a renamed chunk with the same CSS is not a difference. The first mismatch prints with 160
  characters of context on each side;
- the ordered list of stylesheets, by name without the content hash.

Raw HTML is never compared: Next's payload scripts and chunk names change between builds of the same markup.
It then prints a size table per page: raw HTML, gzipped HTML, bytes inside `self.__next_f.push` scripts and the
summed bytes of the `/_next/static/chunks` files the page references. Exit 1 on any difference, or when a page's
gzipped HTML grows by more than 2%.

## runtime.mjs

```
node scripts/parity/runtime.mjs --base <out> --head <out> [--pages a,b] [--scenario file]
  [--steps a..b] [--only name] [--estimate] [--motion] [--faults spec] [--profile slow]
  [--fonts-delay ms] [--runs n] [--check-known page] [--report file]
```

Serves both trees with `scripts/serve-out.mjs` on free ports, runs each scenario on both sides in parallel and
compares a snapshot at every `{snap: true}` step, every `{hash}` step and the end of each scenario. Prints
`[k/N] page scenario step ok|DIFF n`, the first five differences of each step, and exits 1 on any active
difference. `--report` writes JSON with the first 20 differences per step.

| flag | effect |
| --- | --- |
| `--pages a,b` | Pages to run (default all): home, week01, week02, week03, week04, week05, template, kit, styleguide, mockups, play, screen-test. |
| `--scenario file` | A scenario module (a path, or a name under `scenarios/<page>/`). Without it: load the page and snapshot. |
| `--steps a..b` | Only steps a to b (1-based across the file, each scenario's end counts as a step). Earlier steps of a scenario still run, unrecorded. |
| `--only name` | Only the named scenarios (comma-separated). |
| `--estimate` | Print the step count and time estimate (4 s per load, 3 s per snapshot, per side); run nothing. |
| `--motion` | Run with `prefers-reduced-motion: no-preference` (default `reduce`). |
| `--faults a,b` | Define `globalThis.__PARITY_FAULTS__ = new Set([...])` on both sides. |
| `--profile slow` | Add 300 ms latency to every data and vendor request. |
| `--fonts-delay ms` | Delay every font request. |
| `--runs n` | Run base n times (the last with `--profile slow`). A key that varied between base runs passes when head equals any of them. |
| `--check-known page` | Fail if an active known entry outside `base.json` has neither `approvedBug` nor `fp`. Alone, it runs nothing else. |

### Browser and settle

Playwright 1.63.0 launches the cached headless shell at `PARITY_CHROMIUM` (default
`~/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`).
Never download a browser for it. Each scenario gets a fresh context: 1440x900, device scale 1, reduced motion,
clipboard permissions, dialogs accepted unless a `{dialog: 'dismiss'}` step says otherwise. An init script
seeds `Math.random` (mulberry32, seed 7) and pins `Date` and `Date.now()` to 2026-10-01T12:00:00Z, advancing
with `performance.now()`.

After a page load: `load`, network idle, `document.fonts.ready`, no DOM mutation for 500 ms (cap 8 s), two
animation frames. After other steps the snapshot waits for network quiet and the same DOM rule.

### Steps

A scenario module exports `default [{ name, url, steps }]`; `url` is relative to the base path
(`"weeks/week05/"`). Steps:

| step | does |
| --- | --- |
| `{click: sel}` | Click the first match. |
| `{select: [sel, value]}` | Choose an option. |
| `{type: [sel, text]}` | Type keystroke by keystroke. |
| `{press: [sel or null, key]}` | Press a key on an element, or on the page. |
| `{hover: [sel, fx, fy]}` | Move the mouse to a fraction of the element's box. |
| `{drag: [sel, [fx0, fy0], [fx1, fy1]]}` | Drag between two fractions of the element's box. |
| `{scrollTo: sel}` | Scroll the element to the top. |
| `{hash: '#id'}` | Set `location.hash`, then snapshot, including the target's top edge rounded to 2 px. |
| `{back: true}`, `{reload: true}` | Navigate, then settle as after a load. |
| `{resize: [w, h]}` | Resize the viewport. |
| `{route: [glob, {delay: ms} or 'abort']}` | Delay or abort matching requests from now on. |
| `{dialog: 'accept' or 'dismiss'}` | How later dialogs are answered. |
| `{wait: ms}` | Wait. |
| `{evaluate: name, args}` | Call a function with the Playwright page; its JSON result is compared. |
| `{snap: true}` | Snapshot here. |

`{evaluate}` looks the name up in the scenario module's own exports, then `scenarios/<page>/lib.mjs`, then
`evaluate.mjs`: `echartsClick(hostId, seriesIndex, dataIndex)` clicks a data item at the pixel
`convertToPixel` gives, `audit03(options)` injects `scripts/audit_week03.js` and returns `auditWeek03()`, and
`storageEvent(key, value?)` fires the `storage` event another tab would send. Any step may carry a `label`.

### Snapshot

Every snapshot records, and the comparison checks:

| key | value |
| --- | --- |
| `id:#x` | For every element with an id: sha1 of its canonical subtree, its child tag sequence and a sha1 of its text. |
| `html-attrs`, `body-attrs` | Attributes of `<html>` and `<body>`. |
| `text` | `document.body.innerText`, whitespace-normalised per line; reported as a line diff. |
| `local:k`, `session:k` | Every `localStorage` and `sessionStorage` entry. |
| `url`, `history` | `pathname + search + hash` and `history.length`. |
| `scroll`, `hash-top:#id` | `scrollY` rounded; for `{hash}` steps, the target's top edge rounded to 2 px. |
| `focus` | The active element as `#id` or a tag path. |
| `canvas:path` | Width, height and sha1 of `toDataURL()`; size only inside `#globe-gl`, `#globe-atlas`, `[id$=-deck]` and `.w4-entities-map` (WebGL). |
| `console` | Console errors and warnings and page errors, React hydration warnings included. |
| `requests:path` | Requests per path without query (head may make fewer, never more). |
| `body` | sha1 of the canonical `<body>`; when it differs, up to 20 differing elements without ids, as paths from the nearest id ancestor (`#main > section:nth-of-type(3) > p:nth-of-type(2)`). |
| `pixels` | A viewport screenshot diffed with pixelmatch (threshold 0.1), WebGL hosts masked; fails above 0.1% of pixels. The diff image lands in `scripts/parity/reports/<page>/`. |
| `tooltip:#host` | At each scenario's end, for every ECharts instance with series: `showTip` on series 0, item 0, the tooltip text, `hideTip`. |
| `step-error`, `evaluate` | A step that throws, and `{evaluate}` results. |

`performance` marks named `island:*` print under head's steps and are not compared.

### Canonical form

The canonical subtree is what `id:` and `body` hash:

- the tag, then the attributes sorted by name, dropping `_echarts_instance_` and any value matching
  `^(ec|zr)_\d+$` (ECharts instance ids);
- `style` replaced by `el.style.cssText`; `class` whitespace-normalised; `?v=<anything>` removed from `src`, `href`,
  `srcset` and `xlink:href`; the server's origin replaced by `ORIGIN` (the two sides run on different ports);
- `input`, `select`, `option` and `textarea` drop their `value`, `checked` and `selected` attributes and record
  the properties `value`, `checked`, `selected` and `disabled` instead;
- whitespace-only text nodes dropped, other text whitespace-collapsed with adjacent text merged; comments, Next's
  scripts and `<template>` skipped; canvas pixels left to `canvas:`;
- an ECharts host (`echarts.getInstanceByDom(el)` is set): the children ECharts owns (the one holding
  `getZr().painter.getViewportRoot()`, and its tooltip) become `{option: sha1 of getOption() as stable JSON
  without functions, renderer, width, height}`; other children are canonicalised normally;
- a WebGL host keeps its own attributes; its children are left out.

`PARITY_DUMP=<dir>` writes each snapshot's canonical body to a file, for diffing by hand.

## faults.mjs

```
node scripts/parity/faults.mjs --base <out> --head <out> --pages p [--scenario f]
  [--data [--files glob]] [--islands prefix --modes render,effect] [--shard i/n] [--estimate] [--report file]
```

**`--data`** runs the scenario (default `scenarios/<page>/base.mjs`, else a plain load) once on base and lists
every data JSON (`assets/data/`, `weeks/*/data/`) and vendor file (`assets/vendor/`) the page requests. Then, for
each file (filtered by `--files`), it aborts that file on both sides, runs the scenario and compares as
`runtime.mjs` does. The selectors `known/<page>/faults-*.json` lists for that file are masked out of the
comparison, and the console counts only as "an error was logged or not": both sides log one, or neither does.

**`--islands`** reads `globalThis.__ISLANDS__` (island name to `{roots, affects}`), which `island()` fills only
when `globalThis.__PARITY_FAULTS__` exists. It captures head once with JavaScript disabled and once unfaulted,
then loads head once per matching island and mode with `__PARITY_FAULTS__ = new Set(['<name>:<mode>'])` and
checks:

1. every element `roots` matches equals its JavaScript-disabled canonical form, and `roots` matches at least one
   element unless it is `'none'`;
2. every id element outside `roots` and `affects` equals the unfaulted snapshot (skipped for `affects: 'page'`);
3. `<main>` keeps its `childElementCount`;
4. every line of the JavaScript-disabled body text outside every island's `roots` and `affects` is still there;
5. a console error contains `a page script failed` and the island's name.

An empty registry prints `no islands` and passes. `--shard i/n` runs every n-th file or island fault, starting
at the i-th; `--estimate` prints the work and runs nothing.

## touched.mjs and slot-coverage.mjs

```
node scripts/parity/touched.mjs --out <main's out> --page p [--scenario f] --save file
node scripts/parity/slot-coverage.mjs --touched file --slots '<glob of slots*.json>' --head <out>
```

`touched.mjs` runs on main's build. An init script records every element present at `DOMContentLoaded`; from
the first task after it, it wraps `getElementById`, `querySelector(All)`, `getElementsByClassName`,
`getElementsByTagName`, `closest`, `matches` and `addEventListener`, and observes every mutation under
`<html>`. A touched element counts as itself if it was there at `DOMContentLoaded`, else as its nearest ancestor
that was. `head`, `<html>`, `<body>`, scripts and templates are ignored, and `{evaluate}` steps run with the
recording paused. It saves `[{page, path, id, selector, kinds, count}]`, where `kinds` says how the element was
touched (`lookup`, `closest`, `matches`, `listen:<event>`, `attr:<name>`, `childList`, `characterData`).

`slot-coverage.mjs` loads the head build with JavaScript disabled. Each slots file is `[{selector, slot}]`. A
touched path is covered when it equals or lies inside an element a slot selector matches. It prints each
uncovered path (or one that no longer resolves) and exits 1; a clean run prints nothing.

## capture.mjs

```
node scripts/parity/capture.mjs --out <out> --page p --select <css> [--scenario f --steps a..b] [--raw] --save file
```

Saves `[{scenario, index, html}]` for the elements `--select` matches: their `outerHTML` after the page (or the
scenario's steps up to b) settles. `--raw` instead cuts each element's fragment byte for byte from the built
HTML file, `<!-- -->` markers and entities kept, and checks that it parses to the element the browser built.

## dev-strict.mjs

```
node scripts/parity/dev-strict.mjs --pages a,b
```

Starts `next dev` on a free port in the background, loads each page, and reports the requests per data and
vendor path, the number of `div.chart-tip` elements, vendor `<script>` tags per `src`, ECharts instances and
renderer roots per host, canvases inside deck and globe hosts, and console errors. When `out/` (or `$OUT`) holds
a production export, it loads the same pages there and marks every line that differs (dev serves without the
`/02805_social_graphs` base path, so request paths are compared without it); exit 1 if one does. Do not run it
while `next build` runs in the same checkout. `next dev` rewrites `AGENTS.md`; restore it with
`git checkout AGENTS.md` afterwards.

## Scenarios, known files and fixtures

```
scripts/parity/scenarios/<page>/<batch>.mjs     scenario modules; base*.mjs and lib.mjs belong to P0b
scripts/parity/known/<page>/<batch>.json        known runtime differences
scripts/parity/known/<page>/faults-<batch>.json known --data differences
scripts/parity/fixtures/                        captured markup (P0b)
```

A batch writes only its own `scenarios/<page>/<batch>.mjs`, `known/<page>/<batch>.json` and
`known/<page>/faults-<batch>.json`. Never edit another batch's file; ask through the gap protocol.

A known file is an array of entries:

```json
[{ "key": "load/3/id:#chart-arcs", "reason": "the arc canvas repaints on a timer", "fp": "FP04" }]
```

- `key`: the difference key as the report prints it, `<scenario>/<k>/<snapshot key>`; `*` matches anything.
- `reason`: why the difference is acceptable. Required.
- `approvedBug`: the known bug (from plan.json, `knownBugsPreserved`) the entry preserves.
- `fp`: the false-positive id the entry stands for.
- `supersededBy`: a scenario name; the entry stops applying once `scenarios/<page>/<supersededBy>.mjs` exists.

`base.json` holds main's own nondeterminism (P0b). Any other active entry needs `approvedBug` or `fp`;
`runtime.mjs --check-known <page>` fails otherwise.

A faults file maps a file path (relative to the base path, or a bare file name) to what may differ when that
file fails to load:

```json
{ "weeks/week05/data/relations.json": { "expectDiff": ["#relations-figure"], "fp": "FP07", "reason": "..." } }
```

## Continuous integration

`.github/workflows/site.yml` runs job `parity` on pull requests labelled `zero-diff`: it builds the merge base
with `build-ref.mjs`, builds the head with `GITHUB_SHA=parity00000`, and runs `static.mjs`. The label must be
on the pull request when the run starts; after adding it, push again or re-run the workflow.
