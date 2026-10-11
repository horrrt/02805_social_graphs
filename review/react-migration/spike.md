# P2a spike: React 19 and Next 16 behaviour the rewrite depends on

Run on 2026-10-04 with Next 16.3.8 and React 19.3.0 (this repo's `node_modules`), in a scratch App Router app
built with `output: "export"` and `trailingSlash: true`, served as static files and driven by Playwright 1.63.0
with the headless shell the parity tools use (1200x800, desktop). One route per question. A layout script
logged `DOMContentLoaded`, every `requestAnimationFrame` for six frames and every `MutationObserver` callback on
`<body>`, and tagged `#outer` and `#sib` with a JavaScript property before hydration, so a node React replaced
reads as a different node afterwards. The error boundary was `catchError(Fallback)` from `next/error`, as
`island()` will use it. Questions (d), (f), (g), (i), (j) and (k) were also run under `next dev` to see React's
development warnings. The scratch app is not committed.

`node_modules/next/dist/client/app-index.js` still roots React at `document` (line 33, `const appElement =
document`) and hydrates with `startTransition(() => hydrateRoot(appElement, …))` (lines 301-305).

## Results

| | question | result |
| --- | --- | --- |
| a | A `'use client'` child inside `catchError` whose `useEffect` throws | **Fallback renders, siblings stay.** The boundary replaced only the child's markup with the fallback; `#outer` and the client sibling `#sib` kept their server nodes, and the sibling's effect ran. React logged the error once with `console.error` (`Error: effect error …`). |
| b | The same with no boundary | **The page blanks.** React unmounted the root: `<main>` and all page content were gone, leaving only Next's `<script>` tags in `<body>`. Logged as a page error. |
| c | A rejected promise (and an async throw) in an effect | **Nothing unmounts.** The markup stayed; each rejection surfaced as an unhandled rejection (`pageerror`). No boundary sees it, so async failures must become state. |
| d | `useHydrated` (both `useSyncExternalStore(noop, () => true, () => false)` and `useState(false)` + `useEffect(set true)`) | **Hydrates without warnings and re-renders once.** Each rendered `false` for hydration and `true` exactly once afterwards; no console output in production or under `next dev`. Both shapes re-render in the same pass, after the hydration commit's passive effects. |
| e | `createPortal` into a div after a library appended its own child | **Both kept.** The host held `canvas#lib-child` then the portalled `button#reset`; a later state change updated the button in place and left the canvas and the order alone. |
| f | A throw during the hydration render inside `catchError` | **Root client-render, not a local fallback.** A throw on the first client render (succeeding on retry) made React give up hydrating and client-render the whole root: `#outer` and `#sib`, both outside the boundary, came back as new nodes, the layout's inline script was re-created (`next dev`: "Encountered a script tag while rendering React component"), and the error was reported as a page error with no fallback shown. A throw on every client render did the same root client-render and then showed the boundary's fallback. So a render error must never fire during hydration: `faultPoint('render')` fires only after `useHydrated()` is true, as architecture section 4 says. |
| g | Controlled `<input value>`, `<select value>` and `type=number` | **Text input: React writes the `value` attribute.** After typing, `getAttribute('value')` followed the state (`abc` → `abcd`). **Select: React never moves `selected`.** After choosing `c`, `select.value` was `c` but the `selected` attribute stayed on the server's option `b`. **Number input with raw string state:** clearing gave `onChange("")`; typing `-` fired no `onChange` (the field's value stays `""`), and the next `1` arrived as `onChange("-1")`, so React did not clear the `-` (inferred from that value, not read off the screen); typing `1.` fired `onChange("1")` for `1` and nothing for `.`, and `5` gave `onChange("1.5")`, so the field kept its `1.` (inferred the same way). The value attribute tracked the last state (`""`, `-1`, `1`, `1.5`). The parity snapshot already compares properties and ignores these attributes. |
| h | Synthetic `e.stopPropagation()` in a React `onClick` vs a native `document.addEventListener('click')` | **The native listener still fires.** Order: the React handler, then the document listener (`target=stopper`). React listens at the root (`document`), so stopping the synthetic event cannot stop a listener on the same node. Outside-click closers must check `ref.contains(target)` (useOutsideClose). |
| i | Ref callback of island B vs passive effects of island A in the same hydration commit, and vs a MutationObserver | **The ref callback runs first.** Hydration commit order: render A, render B, A's layout effect, B's ref callback, then a frame (`raf`), then A's and B's passive effects. In the following `useHydrated` commit, which inserted nodes into A and B, B's ref callback on its new node ran inside the commit, and the MutationObserver callback for those insertions ran after the commit and its passive effects. The hydration commit itself caused no mutation records. `markOwned` in a ref callback is therefore in place before any legacy MutationObserver sees the node. |
| j | When the `PageScripts` effect runs (modelled on `src/components/PageScripts.tsx`, placed after two islands) | **Hydration render → frame → islands' passive effects (tree order) → the PageScripts effect → the islands' `useHydrated` re-render and its effects → (later frames) → the entry module evaluates.** Passive effects run in tree order, and `<PageScripts>` is the last child of every page today, so its effect runs after every island's hydration effects. The effect only starts the dynamic `import()`; the entry chunk arrived two frames later, after every island had finished its `useHydrated` render pass. That pass is all the order covers: an island whose drawing waits for data or a vendor script can still draw after the legacy entry runs, and an island must not assume the entry has or has not run in its first effects. |
| k | `useSyncExternalStore` whose server snapshot differs from the client snapshot | **No warning, but not before the first paint after hydration.** React hydrated with the server snapshot (`render v=server`, layout effect), a frame ran (`raf`), passive effects ran, and only then did it re-render with the client snapshot (`render v=client`), synchronously with its effects. No console output in production or under `next dev`. The server value is what the HTML already showed, so readers see no flash, but code must not assume the client value is on screen at the first frame after hydration. |

## What this means for the plan

- (a), (c), (d), (e), (h) and (i) confirm the assumptions in architecture sections 2, 4, 8 and fixes C1-12 and C2-3.
- (b) is why every island goes through `island()` and no page-level provider exists (J6).
- (f) narrows section 4: a render-phase throw during hydration is not isolated by `catchError`; it costs the
  whole root a client render. Islands must render exactly the server markup until `useHydrated()` is true, and
  `faultPoint('render')` fires only after hydration, as planned.
- (g) settles C2-12: keep controlled inputs on raw strings; never compare `value` or `selected` attributes.
- (j): the legacy entry evaluates after the islands' hydrated render pass, but async island work can finish on
  either side of it. Pages where an island and a legacy script share elements (Week 3 and Week 4 integration
  branches) must not depend on either order.
- (k): stores read through `useSyncExternalStore` with a different server snapshot settle one frame after the
  hydration commit, the same timing as `useHydrated`.
