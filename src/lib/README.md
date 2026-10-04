# React on this site: rules, recipes and gates

Every batch of the React rewrite follows this file. The plan is `review/react-migration/plan.json`
(architecture, batches, known bugs); `review/react-migration/map.json` records how each old script behaves on
main; `scripts/parity/README.md` documents the parity tools. Cite rules by id: W1-W7, R1-R22, F1-F8, Z1-Z6 and
G1-G6.

## What lives here

- Hooks: `useStore`, `useHydrated`, `useData`, `useVendor`, `useElementSize`, `useFittedWidth`,
  `useCanvasPaint`, `useCanvasStage`, `useEChart`, `useEChartsMap`, `useDeck`, `useGlobe`, `useTypeScale`,
  `useTokens`, `useTextMeasure`, `useBodyDataset`, `useBodyClass`, `useDocumentEvent`, `useOutsideClose`,
  `useOwnedRef`.
- `island.tsx`: `island()`, `useIslandReady`, `useThrowToBoundary`, `report`; `islandOptions.ts` checks an
  island's `{ roots, affects }`.
- `ChartTip.tsx`: the one tooltip div the corridor charts share (`showTip`, `hideTip`).
- Next to it: `src/scripts/runtime/` (stores, the data and vendor caches, the owned registry, fault hooks) and
  `src/components/post/` (`Term`, `TermLayer`, `SegmentedControl`, `TermProse`, `Termified`).

## Rules

- **R1 Zero static diff.** The built HTML of every page equals main's after `normalise()` in
  `tests/built-page.mjs`. `scripts/parity/static.mjs` checks it on every batch, locally and in CI.
- **R2 First client render equals the server render.** Never read the browser in render: no `window`,
  `document`, `location`, storage, `matchMedia`, `getComputedStyle`, `Date.now` or `Math.random`. Render
  `url()`, `asset()` and `SITE` values only after `useHydrated()` is true. An island shows exactly its server
  markup until it is hydrated and its data is ready.
- **R3 Banned APIs.** `useSearchParams`, `usePathname`, `useRouter`, `next/link`, `next/dynamic`, `React.lazy`,
  `lazy` from react, `<Suspense>` and `use()`. A static export never navigates on the client, and
  `useSearchParams` client-renders up to a Suspense boundary. `tests/react-rules.test.mjs` enforces this.
- **R4 Ownership and surfaces.** React renders every element. A surface is what a library draws inside a host
  React hands it: canvas pixels, ECharts host internals, deck.gl and globe.gl canvases, D3 joins under a
  React `<svg>` or `<g>`, and the d3-zoom transform. A surface host's props are frozen after mount, except a
  canvas's `style.display` set from a renderer descriptor. A surface host has no React children; a portal goes
  into it only after its library has initialised. Only `// surface:` files under `src/lib` and `src/kit` write
  the DOM.
- **R5 Details stay uncontrolled.** React never drives a `<details>`'s `open` state; the reader's clicks do.
- **R6 Module stores.** Page-wide state lives in module-scope stores (`createStore` in
  `src/scripts/runtime/store.js`, a `store.js` per feature folder) read through `useStore`. No page-level
  providers, so nothing above the prose holds state or can throw. The server snapshot is the initial state.
- **R7 Islands.** Every client component on a page comes from `island(name, Component, Placeholder, { roots,
  affects })`. Placeholder renders the server markup; roots lists the selectors of every element the island
  renders (`"none"` for a service island); affects lists other islands' elements that may change when it fails
  (`"page"` for a driver). Islands take no children. Shells (`*Shell.tsx`) wrap server children and only add
  attributes or handlers from stores: no data, vendor, chart or canvas hooks, no throw. Slots files
  (`slots*.tsx`) stay server files. A helper component imported only by islands carries no `'use client'`.
- **R8 Failure paths.** On the happy path every page equals main. Where main couples failures, the rewrite
  isolates each independent chart, and each such place has an FP id (R14). An async failure renders main's
  error text in the failing island's own hosts. Render and effect errors reach the island's boundary, which
  shows the Placeholder and logs `a page script failed` once.
- **R9 Data through `useData` only.** `useData(asset(path))` after hydration; one request per URL. Lazy loads
  keep their trigger. No data in server-to-client props and no build-time JSON in the HTML.
- **R10 Vendor libraries through `useVendor` only.** Files stay in `public/assets/vendor/`; `loadVendor` loads
  each once and reuses a script tag already there.
- **R11 Document and window listeners** go through `useDocumentEvent` or `useOutsideClose` and are removed on
  cleanup. Outside clicks are decided by `ref.contains(target)`. Never `stopPropagation`: React listens at the
  document, so a native listener still fires.
- **R12 Test-read literals stay put.** The literals tests read and the pure builders stay in their `.js` files
  under their names (the ANCHORS list in `tests/page-modules.test.mjs`).
- **R13 `dangerouslySetInnerHTML`** only in `ChartTip.tsx` (`// allow-html:` files under `src/lib`).
- **R14 Known bugs are preserved.** `review/react-migration/known-bugs.md` lists them (KB) and the failure-path
  changes (FP). A known file entry cites `approvedBug` or `fp`.
- **R15 Names and marks.** Islands are named `<page>/<feature>/<Name>`. `island()` marks
  `island:mounted:<name>`, and `island:ready:<name>` once the island calls `useIslandReady()`.
- **R16 StrictMode-safe effects.** Every effect survives mount, cleanup and mount again: listeners through an
  AbortController, library instances disposed in cleanup, module caches for one-time work.
- **R17 Theme and type scale.** Colours come from CSS tokens (`useTokens`), sizes from the type scale
  (`useTypeScale`). Code that needs a legacy hex colour imports the constant from the LEGACY files
  `tests/theme.test.mjs` lists; never write a new hex literal.
- **R18 Order through stores.** One island waits for another through a store, never by observing the DOM,
  except in bridges.
- **R19 `markOwned` only through `useOwnedRef`.** The ref callback marks the element inside React's commit,
  before any legacy MutationObserver sees it.
- **R20 Body and html writes are monotonic.** `useBodyDataset` and `useBodyClass` never clean up on unmount,
  as main never removes what it sets.
- **R21 Form controls hold the raw string.** A controlled input keeps what the reader typed; never compare
  `value` or `selected` attributes.
- **R22 ECharts renderer as main initialised it.** Pass `renderer` to `useEChart` (`'svg'` for kit charts,
  the others as their modules do).

## Verified behaviour

The P2a spike (`review/react-migration/spike.md`, Next 16.3.8 and React 19.3.0) checked what these rules rely
on:

- (a) An effect that throws inside `catchError` shows the fallback in that island only; siblings keep their
  server nodes.
- (b) Without a boundary the whole page blanks. Every island goes through `island()`.
- (c) A rejected promise in an effect unmounts nothing and no boundary sees it: async failures become state.
- (d) `useHydrated()` renders false for hydration and true once afterwards, with no warning.
- (e) A portal into a host after a library appended its own child keeps both, in that order.
- (f) A throw during the hydration render makes React client-render the whole root, not show the fallback.
  The render fault point fires only once `useHydrated()` is true.
- (g) React writes a controlled text input's `value` attribute but never moves `selected`; a number input's
  raw string state keeps `-` and `1.` while typing.
- (h) A synthetic `stopPropagation()` does not stop a native document listener.
- (i) A ref callback runs inside the commit, before passive effects and before a MutationObserver callback.
- (j) The legacy entry module evaluates after every island's hydrated render pass; async island work can
  finish on either side of it.
- (k) `useSyncExternalStore` with a different server snapshot settles one frame after the hydration commit.

## Working rules

- **W1 Setup.** `cp -Rc "$LL_NODE_MODULES" node_modules`, then `npm ls --depth=0` exits 0. Never
  `npm install` or `npm ci`, and never a symlink.
- **W2 Read first:** this file, `scripts/parity/README.md`, your entries in `review/react-migration/map.json`,
  every source you convert and your page's fixtures under `scripts/parity/fixtures/`.
- **W3 Desktop only.** Never use the hidden Browser pane: it pauses requestAnimationFrame and ResizeObserver.
- **W4 No command over about 2 minutes.** Run builds in the background with output to a log and poll it.
- **W5 Edit only the files your batch owns.** Gap protocol: write `review/react-migration/requests/<batch>.md`
  with the exact patch and the reason. If you must proceed, add a shim in your own folder whose first line is
  `// shim: <batch>` and list it in your final message.
- **W6 Commits** use Conventional Commits, `type(scope): subject`, with scopes site, week01 to week05, tests,
  ci and docs.
- **W7 Parity files.** Your scenario is `scripts/parity/scenarios/<page>/<batch>.mjs`; your known files are
  `known/<page>/<batch>.json` and `known/<page>/faults-<batch>.json`. Never edit another batch's.

## Recipe F: feature batches

- **F1** Converted modules keep their names and become pure: no DOM, listeners, fetch or top-level await at
  import. R12 literals stay.
- **F2** Convert a slot by re-exporting an island from a separate `'use client'` file in your folder; never
  edit section files.
- **F3** Give each island a name (R15) and its `{ roots, affects }`.
- **F4** Load through `useData` and `useVendor`. A failing island shows main's error text in its own hosts;
  optional files keep `.catch(() => null)`.
- **F5** Use kit components: `<Drawer>` and `<Drawers>` for `drawer()` and `drawerRow()`, `<Term>` or
  TermText in script-built JSX, `TermProse` and `Termified` on server prose, with `after` taken from
  `scripts/parity/fixtures/terms/`. A gap in the kit gets a wrapper in your folder plus a request.
- **F6** ECharts hosts keep their position, classes and renderer, initialise after hydration and data, and
  resize on both window resize and ResizeObserver.
- **F7** Use `useOutsideClose`, `useBodyDataset` and `useBodyClass`, and raw-string inputs.
- **F8** Your scenario drives every control (`{type}` keystrokes), opens your panels and hovers each chart.
  Known entries carry reasons and KB or FP ids.

## Recipe Z: close batches

- **Z1** Rebase onto the latest main and rebuild `$BASE` from it.
- **Z2** Delete the page's entry, its ENTRIES line in `src/components/PageScripts.tsx`, the page's
  `<PageScripts/>`, and every bridge and shim of the page with their mounts.
- **Z3** Grep that no module of the page has top-level DOM, listeners, fetch or await.
- **Z4** Run `runtime.mjs --check-known <page>` and delete superseded known files.
- **Z5** Run all gates over every scenario file, and faults for every island (shards in the background).
- **Z6** Check that `pageScripts('<page>')` still lists every module the tests read.

## Gates

`$BASE` is `$(node scripts/parity/build-ref.mjs --ref <stage base sha> --print-out)`, prebuilt by the
orchestrator.

- **G1** `npm run typecheck`.
- **G2** `GITHUB_SHA=parity00000 npm run build` (in the background, polled), then
  `node scripts/parity/static.mjs $BASE out` exits 0.
- **G3** `node --test` on the tests you touched and your page's tests, then `npm test` once, in the background.
- **G4** `node scripts/parity/runtime.mjs --base $BASE --head out --pages <p> --scenario <file>` for every
  scenario file of the page (the base files and every batch file present), each command under 90 s by
  `--estimate` (split with `--steps`): every step ok.
- **G5** `node scripts/parity/faults.mjs` with `--data` (`--files` your data and vendor files) and
  `--islands <your prefix> --modes render,effect` (`--shard`): every assertion holds, and the only expected
  diffs come from `faults-base.json` and your `faults-<batch>.json`.
- **G6** `node --test tests/react-rules.test.mjs tests/markup-shapes.test.mjs tests/migration-docs.test.mjs
  tests/page-modules.test.mjs`.

## Transition

Until a page's close batch, its old scripts still run: `src/scripts/entries/<page>.js` imported by
`<PageScripts>` (`src/components/PageScripts.tsx`). Those two are legacy and go in the cleanup batch (Z2).
Bridges (`// bridge: <close batch>`) and shims (`// shim: <batch>`) exist only on integration branches, under
`src/features/<page>/`, while the page's entry exists.
