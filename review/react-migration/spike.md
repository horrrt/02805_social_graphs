# React spike (P2a)

Date: 2026-10-04

## Versions and setup

- next 16.3.8 (Turbopack build), react 19.3.0, react-dom 19.3.0 (from node_modules), typescript 6.0.3, @types/react 19.3.0, @types/react-dom 19.3.0, playwright 1.63.0.
- **The App Router does not use node_modules/react at runtime.** It uses Next's vendored copy, `next/dist/compiled/react-dom`, which reports `version = "19.3.0-canary-cbb046ab-20260731"`. Every observation below comes from that build.
- Browser: Chromium 141.0.7390.37 at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, headless, 1280×900 viewport. Playwright 1.63 expects `chromium_headless_shell-1243`, which is not installed, so the runner passes `executablePath` (the repo's `scripts/parity/lib.mjs` does the same).
- App: `next.config.ts` has `output: "export"` and `trailingSlash: true`. It uses the App Router, TypeScript and one route per experiment. `out/` is served by a small node http server (`serve.mjs`, port 8790).
- **Primary runs use the production export (`next build`).** I added a second pass against `next dev` (port 8791) only to get the unminified console text. Dev mode renders every component twice and runs mount effects twice, which looks like StrictMode behaviour; production does neither.
- node_modules is copied, not symlinked. With a symlink, Turbopack refused to build: `Symlink [project]/node_modules is invalid, it points out of the filesystem root`.
- Instrumentation is an inline `<script>` in the root layout `<head>`, which runs during HTML parse, before any Next chunk. It keeps a timestamped log (`window.L`) and runs a document-wide MutationObserver filtered to `[data-w]` subtrees. It also runs a rAF loop (40 frames), a `paint` PerformanceObserver, `window` error/unhandledrejection listeners, and document and window click listeners. A Playwright init script tags every parser-inserted element (`el.__parsed = true`), so `parsed=false` after load means React created that node on the client.
- Docs checked: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/catchError.md` and `02-guides/static-exports.md`. `catchError` exists in `node_modules/next/error.js` as a lazy getter for `dist/client/components/catch-error`, and became stable in 16.3.0. Usage: in a `'use client'` module, `export default catchError((props, { error, retry, reset }) => <Fallback/>)`, then `<Wrapper {...props}>children</Wrapper>`. The fallback must live in a `'use client'` module. Type gotcha: `ErrorInfo.error` is typed `unknown` in `dist/client/components/error-boundary.d.ts`, although the docs say `Error`. `error.message` fails `tsc` with `TS2339: Property 'message' does not exist on type '{}'`, so the spike casts it.
- `app-index.js` line 33 is `const appElement = document;`. Lines 301–302 are `_react.default.startTransition(()=>{ _client.default.hydrateRoot(appElement, reactEl, {...}) })`. The production root options pass Next's `onCaughtError`/`onUncaughtError`/`onRecoverableError`.

A **control route `/ctl/`** has a deliberate text mismatch (`typeof window === "undefined" ? "server-text" : "client-text"`). It shows that real hydration problems are reported in production, so "no warnings" below means something:

- Production: `[pageerror] Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]= ...`. The whole body was re-created on the client: MutationObserver shows `-[nav#nav] -[main#main] -[footer#footer]` then `+[main#main]`, and every node is `parsed=false`.
- Dev: `[pageerror] Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. ...`. Dev also logs `Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client. Consider using template tag instead`, because the root client render re-renders the inline `<script>` in the layout `<head>`.

---

## (a) catchError around a client child whose useEffect throws

**Built:** `/a/`: a server `<p>`, a `Counter` island, then `<Boundary name="a"><ThrowInEffect/></Boundary>` (Boundary = `catchError(Fallback)`), then a second `Counter`.

**Observed (production):**
- The log shows `a: effect about to throw` (139.5 ms), then `fallback render a: a: thrown in useEffect` (155.8 ms). The MutationObserver records `-[div#a-thrower]`, then `+[div#fallback-a]`.
- Final main text: `server sibling / count 0 / Fallback a: a: thrown in useEffect / count 0`. The server `<p>` and both counters are still the parser-created nodes (`parsed=true`). Only `#fallback-a` is new. Both counters still work after the error (clicking shows `count 1`).
- Console: one `[console.error] Error: a: thrown in useEffect` with a minified stack, from Next's `onCaughtError`. No pageerror.
- One `Failed to load resource: 404` also appeared on this route. A later probe that logged every response ≥400 did not reproduce it, so I could not tie it to the experiment.
- Dev: the error was logged twice (the second time from `reconnectPassiveEffects`, the dev double effect run), each ending `The above error occurred in the <ThrowInEffect> component. It was handled by the <catchError(Next.CatchError)> error boundary.`

**Conclusion:** catchError catches errors thrown in a passive effect. Only the wrapped subtree is replaced by the fallback; siblings keep their DOM, state and handlers.

## (b) Same throw, no boundary

**Built:** `/b/`: the same page without the Boundary.

**Observed (production):**
- `b: effect about to throw` (91.1 ms), then `window.onerror: b: thrown in useEffect` (115.1 ms). The MutationObserver records `-[nav#nav] -[main#main] -[footer#footer]` from `<body>`.
- After that, `<html id="__next_error__">` and the body holds only the three Next scripts plus one inline-styled `<div>`. The visible page text is `"This page couldn’t load\n\nReload to try again, or go back.\n\nReload\nBack"`: Next's built-in global error UI. Counters are gone.
- Console: `[pageerror] b: thrown in useEffect`. The dev message is the same.

**Conclusion:** yes. An uncaught effect error without a user boundary unmounts the whole app: layout, nav and footer are replaced by Next's "This page couldn't load" screen.

## (c) Rejected promise in an effect (unhandled)

**Built:** `/c/`: `RejectInEffect` runs `Promise.reject(new Error(...))` and an `async` IIFE that throws, both inside `useEffect`. A server `<p>` and a `Counter` sit alongside it.

**Observed (production):**
- `unhandledrejection: c: unhandled rejection from effect` and `unhandledrejection: c: async IIFE throw in effect`.
- Console: `[pageerror] c: unhandled rejection from effect` and `[pageerror] c: async IIFE throw in effect`. Dev reports each twice because of the double effect run.
- No DOM removals. All nodes are still `parsed=true`, the counter still increments, and `<html>` has no error id.

**Conclusion:** async failures escape React entirely. Nothing unmounts, and no boundary sees them, catchError included. They show up only as `unhandledrejection` events and page errors.

## (d) useHydrated: hydration warnings and render count

**Built:** `/d/`: `useHydrated()` = `useSyncExternalStore(() => () => {}, () => true, () => false)`, next to the alternative `useState(false)` + `useEffect(() => setH(true), [])`. Each component calls `R()` in its render body.

**Observed (production):**
- Render log: `d-uses: [false, true]`, `d-state: [false, true]`. Each component rendered exactly twice: the hydration render, then one re-render.
- Sequence: `89.9 render d-uses false`, `90.1 render d-state false`, `95.5 render d-uses true`, `95.8 render d-state true`. Both re-renders landed in one commit: one MutationObserver batch at 96.9 ms with `MO text "false" -> "true"` ×2.
- Server HTML contains `hydrated=<!-- -->false` for both. First contentful paint was at 48 ms, before hydration at ~90 ms, so `false` is what paints first.
- Console: none, in production or dev. The control shows mismatches are reported, so this absence is meaningful.
- Dev render log `[false,false,true,true]` is the dev double render, not extra commits.

**Conclusion:** the useSyncExternalStore form hydrates with no warning and re-renders exactly once (false → true). In this run the useState+useEffect form behaved the same and was batched into the same commit.

## (e) createPortal into a div a library already wrote into

**Built:** `/e/`: `PortalHost` renders an empty `<div id="e-host" ref>`. Its effect does `host.appendChild(<svg-lib id="lib-child">)` (plain DOM, standing in for a library), then `setTarget(host)` and renders `createPortal(<span id="e-portal">portal child {n}</span>, target)`. A button bumps `n`.

**Observed (production):**
- `e: library appended #lib-child; host children=1`, then MutationObserver `+[svg-lib#lib-child]`, then `+[span#e-portal]`.
- Host children after load: `["lib-child","e-portal"]`. After two bumps: `["lib-child:library-owned child","e-portal:portal child 2"]`.
- No console messages.

**Conclusion:** both are kept. The portal appends after the library's node, and React re-renders do not remove the foreign child. This was tested only with a host div that React renders with no children of its own.

## (f) Throw during the hydration render (client only) inside catchError

**Built:** `/f/`: `<Boundary name="f"><ThrowOnClientRender/></Boundary>`, where the component throws when `typeof window !== "undefined"`. A server `<p>` and a `Counter` sit alongside it. Variant `/f2/` (extra) wraps the boundary in `<Suspense>`.

**Observed (`/f/`, production):**
- `ThrowOnClientRender` rendered 6 times on the client (94–108.7 ms), then `fallback render f: ...`.
- The MutationObserver then shows `-[nav#nav] -[main#main] -[footer#footer]` and `+[main#main]` on `<body>`. Afterwards every element in `#main` is `parsed=false`, and body child order changed: scripts first, then nav/main/footer.
- The final UI shows the local fallback, with server `<p>`, counter (works, `count 1`), nav and footer re-created.
- Console: one `[console.error] Error: f: thrown during client (hydration) render`. No #418 error.
- Dev: the same, ending `... It was handled by the <catchError(Next.CatchError)> error boundary.`, plus `Encountered a script tag while rendering React component...` (the head script being client-rendered).

**Observed (`/f2/`, Suspense around the boundary):**
- 5 renders, then the fallback.
- The MutationObserver shows only the Suspense subtree replaced: `-[node8] -[div#f2-susp] -[node8]` (the Suspense comment markers), then `+[div#f2-susp]`.
- The server `<p>`, counter and the rest of the page stay `parsed=true` (hydrated, not re-created). No script-tag warning in dev.

**Conclusion:** the fallback renders locally, but without a Suspense boundary React discards the server HTML and client-renders the whole root. Every node is re-created, the layout's inline scripts are re-rendered, and dev logs a warning. Wrapping in `<Suspense>` confines the client re-render to that Suspense subtree.

## (g) Controlled `<input value>`, `<select value>` and type=number

**Built:** `/g/`: a text input (`"hello"`), a select (`"b"` of a/b/c), and two `type=number` inputs. One stores the raw string (`setRaw(e.target.value)`, initial `""`). The other stores a Number (`setNum(Number(e.target.value))`, initial `0`).

**Observed, server HTML** (`out/g/index.html`): `<input id="g-text" value="hello"/>`, `<select id="g-select">` with `<option value="b" selected="">` (no `value` on the select), `<input id="g-num-raw" type="number" value=""/>`, `<input id="g-num-number" type="number" value="0"/>`.

**Observed, live DOM:**
- On hydration, React rewrote the `value` attribute on all three inputs and `type` on the number inputs: MutationObserver `attr value on input#g-text -> "hello"` etc., same values.
- After typing `!`, the text input has attribute `value="hello!"`: React keeps the attribute in sync with the property.
- After `selectOption("c")`: `select.value="c"`, but options are `a:false/false, b:true/false, c:false/true` (hasAttribute("selected") / .selected). The server-rendered `selected` attribute stays on `b`; React only sets the `.selected` property.
- On every update React also re-applies `type` and touches `name` (removes it, since it is unset) on the inputs.

**Observed, number input, per keystroke** (displayed text read from element screenshots; prop = `.value`):

| storage | keys | displayed | `.value` | state |
|---|---|---|---|---|
| raw string | select-all + Backspace | `` | `""` | `""` |
| raw string | `-` | `-` | `""` (badInput=true) | `""` |
| raw string | `1` | `-1` | `"-1"` | `"-1"` |
| raw string | `.` | `-1.` | `"-1"` | `"-1"` |
| raw string | `5` | `-1.5` | `"-1.5"` | `"-1.5"` |
| raw string | clear, `1` | `1` | `"1"` | `"1"` |
| raw string | `.` | `1.` | `"1"` | `"1"` |
| raw string | `0`, `5` | `1.0`, `1.05` | `"1.0"`, `"1.05"` | same |
| raw string | Backspace ×2 | `1.0`, `1.` | `"1.0"`, `"1"` | same |
| raw string | clear, `-`, Backspace | ``, `-`, `` | `""` ×3 | `""` |
| Number | select-all + Backspace | `0` | `"0"` | `0` |
| Number | `-` | `0` | `"0"` | `0` |
| Number | `1` | `01` | `"01"` | `1` |
| Number | `.` | `01.` | `"01"` | `1` |
| Number | `5` | `01.5` | `"01.5"` | `1.5` |
| Number | clear, `1`, `.`, `0`, `5` | `0`, `01`, `01.`, `01.0`, `01.05` | `"0"`, `"01"`, `"01"`, `"01.0"`, `"01.05"` | `0`, `1`, `1`, `1`, `1.05` |
| Number | Backspace ×2 | `01.0`, `01.` | `"01.0"`, `"01"` | `1`, `1` |
| Number | clear, `-`, Backspace | `0`, `0`, `0` | `"0"` ×3 | `0` |

No console messages.

**Conclusion:** React 19 writes `value` into the server HTML and keeps the live `value` attribute synced for inputs. For `<select value>` it emits `selected` on the server option but never moves that attribute on the client. For number inputs, storing the raw string preserves `''`, `-` and `1.` while typing. Storing a Number cannot be cleared (it snaps back to `0`), swallows a leading `-`, and produces `01…`.

## (h) e.stopPropagation() in React onClick vs native document/window listeners

**Built:** `/h/`: buttons inside a div with a React `onClick`. `#h-btn` calls `e.stopPropagation()`. `#h-btn-native` also calls `e.nativeEvent.stopImmediatePropagation()`. Native listeners: a document bubble listener and a window listener from the inline head script (before `hydrateRoot`), plus a document bubble, a document capture and a body listener added in a `useEffect` (after `hydrateRoot`).

**Observed (production):**
- Root confirmation: `document` carries `__reactContainer$…`, `_reactListening…`, `__reactResources$…`. React's root container and its delegated listeners are on `document`, matching `const appElement = document` at app-index.js:33.
- Click on `#h-btn`, in order:
  1. document CAPTURE (effect)
  2. body listener (effect)
  3. **document listener from the head script (registered before hydrateRoot)**
  4. React onClick on button → `stopPropagation()`
  5. **document listener registered in useEffect (after hydrateRoot)**

  Neither the window listener nor the React parent-div onClick fired.
- Click on `#h-btn-native`: document capture, body, head-script document listener, React onClick with stopImmediatePropagation. The effect-registered document listener and the window listener did not fire.
- Control (other routes, no stopPropagation): the window listener does fire on clicks.

**Conclusion:** React's `e.stopPropagation()` stops native listeners on `window` and React ancestors, but not other listeners on `document` itself. Those run before or after React according to registration order. Listeners on `body` or deeper always run before React's handler. Only `nativeEvent.stopImmediatePropagation()` suppresses later document listeners.

## (i) Ref callback of island B vs passive effects of island A vs MutationObserver

**Built:** `/i/`: `IslandA` (useLayoutEffect + useEffect, which queues a microtask), server text, then `IslandB`. B's ref callback sets attribute `data-ref`, queues a microtask and queues `setTimeout(0)`. B also has a useLayoutEffect and a useEffect. A head-script MutationObserver watches the page.

**Observed (production, ms):**
```
96.4  render i-A
96.5  render i-B
100.0 i: A useLayoutEffect
100.0 i: B ref callback (mutating data-ref attr)
100.0 i: B useLayoutEffect
100.2 MO attr data-ref on div#i-b -> "set"        <- MutationObserver callback
100.2 i: microtask queued from B ref callback
100.3 i: setTimeout(0) queued from B ref callback  <- a macrotask ran before passive effects
100.6 i: A useEffect (passive)
100.6 i: B useEffect (passive)
103.9 i: microtask queued from A useEffect
```
No console messages. Dev showed the same order, with double renders and effects.

**Conclusion:** yes to both. B's ref callback runs in the layout phase of the hydration commit, before A's passive effects. The MutationObserver callback from that commit, and even a `setTimeout(0)` queued from the ref callback, run before any passive effect. The hydration commit is a transition, so passive effects are flushed in a later scheduler task.

## (j) Page-level "script loader" effect vs other islands' effects and useHydrated re-render

**Built:** `/j/`: `JIsland X` (useHydrated + layout/passive effects logging the hydrated value), server text, `JIsland Y`, and last `ScriptLoader`. ScriptLoader is a client component that returns null; its useEffect appends `<script src="/ext.js">`.

**Observed (production, ms):**
```
122.9 render j-X false | 123.1 render j-Y false | 123.1 render j-loader
128.3 X useLayoutEffect hydrated=false | 128.3 Y useLayoutEffect hydrated=false
129.3 X useEffect hydrated=false | 129.3 Y useEffect hydrated=false
129.3 ScriptLoader useEffect (appends /ext.js)
133.3 render j-X true | 133.6 render j-Y true
135.3 X useLayoutEffect hydrated=true | 135.3 Y useLayoutEffect hydrated=true
135.3 X useEffect hydrated=true | 135.3 Y useEffect hydrated=true   <- flushed synchronously with this commit
135.6 MO text "false" -> "true" (x2)
135.8 rAF#6
147.8 ext.js (external script appended by loader effect) executed
148.1 ext.js onload
```
Render counts: `j-X [false,true]`, `j-Y [false,true]`, `j-loader [render]` (the loader rendered once). No console messages.

**Conclusion:**
- The loader's effect runs in the same passive flush as the other islands' first effects, in tree order (last), with every island still `hydrated=false`.
- The useHydrated re-render comes after that, as a separate commit. Its passive effects flush synchronously, before the MutationObserver microtask.
- The external script executes later still. A loader effect cannot assume other islands have re-rendered as hydrated.

## (k) useSyncExternalStore with server snapshot ≠ client snapshot

**Built:** `/k/`: `useSyncExternalStore(noop, () => "client", () => "server")` rendered into `<span id="k-val">`. The head script's rAF loop logs `k-val` text every frame, and a `paint` observer logs FCP. I ran it normally and with 6× CPU throttling (CDP `Emulation.setCPUThrottlingRate`).

**Observed (production, normal):**
- `rAF#1..#5 k-val="server"` (23.9–97.2 ms), with `first-contentful-paint startTime=44`.
- Then `render k server` (98.8), `useLayoutEffect v=server` (101.9), `useEffect v=server` (102.5), `render k client` (103.9), `useLayoutEffect/useEffect v=client` (105.1), `MO text "server" -> "client"` (105.4).
- Renders `["server","client"]`. Console: none (production and dev).

**Observed (6× CPU):**
- FCP at 136 ms, with `k-val="server"` in rAF#2–#11 before hydration started at 531.9 ms.
- `rAF#12` fired *during* the hydration render (533.5, after `render k server`), so hydration yielded to the browser.
- `rAF#13` (551.0) fired between the hydration commit's `useLayoutEffect v=server` (550.8) and its `useEffect` (551.7). A frame was produced after hydration with `"server"` still shown.
- Then `render k client` (553.1) and `MO text "server" -> "client"` (562.3). No console messages.

**Conclusion:** there is no hydration warning, and the client value replaces the server value in one extra render. It does not happen before first paint: the server value is painted from the static HTML long before JS runs, and it can stay visible for at least one more frame after the hydration commit. Passive effects of the hydration commit also see the server value first.

---

## Re-running

Source is in `scratchpad/spike/`:
- `app/` (layout + one route per letter, plus `f2`, `ctl`); `app/boot.js.txt` holds the inline head instrumentation.
- `components/Boundary.tsx` (catchError), `components/Islands.tsx`, `components/hooks.ts`.
- `next.config.ts`, `tsconfig.json`, `package.json`, `public/ext.js`.
- `serve.mjs` (static server for `out/`), `run.mjs` (Playwright driver), `summarize.mjs` (log printer), `probe-b.mjs` (body text and 404 probe).

Commands:
```
cd scratchpad/spike
cp -r /home/user/02805_social_graphs/node_modules ./node_modules   # if missing; do not symlink (Turbopack refuses)
npx next build
node serve.mjs &                                  # http://localhost:8790
node run.mjs http://localhost:8790 [routes...]    # writes results/<route>.json (+ results/g-number-sheet.png)
node summarize.mjs a b c ...                      # condensed logs
# optional dev pass for unminified messages:
npx next dev -p 8791 &  then  SPIKE_OUT=./results-dev/ node run.mjs http://localhost:8791 a b ...
```
Raw results from this run are in `spike/results/` (production) and `spike/results-dev/` (dev). The repo at `/home/user/02805_social_graphs` was not modified (`git status` clean).
