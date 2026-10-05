# K1b requests

## 1. faults.mjs --islands check (2): compare id elements with the island's roots masked

**Status:** pending, reproduced 5 Oct 2026. Until it lands, G5 `--islands kit/` fails for K1b, and for every
later island that sits inside an element with an id.

**File:** `scripts/parity/faults.mjs` (the `--islands` loop)

**Why.** Check (2) compares every id element's canonical hash between the unfaulted page and the faulted one,
skipping only ids inside the island's roots and affects on the faulted page. Two kinds of id fail it for any
island, through no fault of the island:

- an ancestor of a root (`#demo-figure`, `#demo-term`, `#main` on the kit page): its hash covers the root's
  subtree, which the fault replaces with the Placeholder by design;
- an id the island renders only when it works (`#kit-term-hapax`, the term's pop-up): it is absent from the
  faulted page, so it is not in the faulted page's excluded ids, and the unfaulted page still has it.

Run on K1b's build, all 14 faults (seven islands, render and effect) fail on check (2) alone: the outer
`kit/demos/Demo` reports the six section ids, `#main` and `#kit-term-hapax`; each demo island its own section
and `#main`, plus `#kit-term-hapax` for the term demo. Checks (1), (3), (4) and (5) pass. Listing ancestors such as `#main` in `affects` would exclude every id under them,
so that is no way out.

**Patch.** Compare both sides with the island's roots and affects masked (`snapshot(..., { mask })`, which writes
`<masked/>` in place of a masked subtree and records no id inside it). An ancestor is then still compared, minus
the root's subtree; an id inside a root is skipped on both sides; and an id that appears outside the roots only
on the faulted page now counts too, which the old loop over the unfaulted ids missed. The unfaulted masked
snapshot is taken once per distinct mask. With this patch applied to a scratch copy, all 14 of K1b's
faults pass (`ok · 7 faults` on each of the two shards).

```diff
--- a/scripts/parity/faults.mjs
+++ b/scripts/parity/faults.mjs
@@ -148,6 +148,7 @@
     const allRoots = [...new Set(names.flatMap((n) => sel(registry[n].roots)))];
     const allSel = [...new Set(names.flatMap((n) => [...sel(registry[n].roots), ...sel(registry[n].affects)]))];
     const unfaulted = await snapshot(plain.page, plain.state, { screenshot: false });
+    const unfaultedMasked = new Map();
     await plain.context.close();
     const noJs = await open({ javaScriptEnabled: false });
     const off = await snapshot(noJs.page, noJs.state, { screenshot: false, select: allRoots, textOf: allSel });
@@ -160,6 +161,9 @@
       const o = await open({ faults: [`${name}:${mode}`] });
       const s = await snapshot(o.page, o.state, { screenshot: false, select: rootSel, exclude: [...rootSel, ...affectSel] });
       const consoleLines = s.flat.get("console") ?? "";
+      // For (2): the same page with this island's roots and affects masked.
+      const hidden = [...rootSel, ...affectSel];
+      const sMasked = affects === "page" ? null : await snapshot(o.page, o.state, { screenshot: false, mask: hidden });
       await o.context.close();
       const problems = [];
       // (1) roots render their JavaScript-disabled markup.
@@ -170,13 +174,20 @@
         else if (JSON.stringify(now) !== JSON.stringify(was)) problems.push(`roots ${r} differs from its JavaScript-disabled markup`);
       }
       if (roots !== "none" && !rootSel.length) problems.push("roots lists no selectors");
-      // (2) every id element outside roots and affects is unchanged.
-      if (affects !== "page") {
-        const skip = new Set(s.excludedIds.map((id) => `id:#${id}`));
-        for (const [key, value] of unfaulted.flat) {
-          if (!key.startsWith("id:#") || skip.has(key.replace(/\[\d+\]$/, ""))) continue;
-          if (s.flat.get(key) !== value) problems.push(`${key} changed outside roots/affects`);
+      // (2) every id element outside roots and affects is unchanged. Both
+      // sides are compared with those elements masked, so an id inside them
+      // (on either side) is not compared, and an ancestor of a root is
+      // compared with the root's subtree left out rather than skipped.
+      if (sMasked) {
+        const key = JSON.stringify(hidden);
+        if (!unfaultedMasked.has(key)) {
+          const u = await open({ faults: [] });
+          unfaultedMasked.set(key, await snapshot(u.page, u.state, { screenshot: false, mask: hidden }));
+          await u.context.close();
         }
+        const um = unfaultedMasked.get(key);
+        const ids = new Set([...um.flat.keys(), ...sMasked.flat.keys()].filter((k) => k.startsWith("id:#")));
+        for (const k of ids) if (sMasked.flat.get(k) !== um.flat.get(k)) problems.push(`${k} changed outside roots/affects`);
       }
       // (3) main keeps its children.
       if (s.mainChildren !== unfaulted.mainChildren) problems.push(`main has ${s.mainChildren} children, not ${unfaulted.mainChildren}`);
```

**Why this keeps every check.** The patch narrows nothing: the same `rootSel` and `affectSel` are left out, and
nothing else is.

- Before: an ancestor id failed on any change inside a root, which every island makes by design when it fails.
- After: a change inside a root is still caught by check (1), which compares the root with its JavaScript-disabled
  markup. Anything else under the ancestor is still caught by (2), since the ancestor is compared minus the root.
- (2) now also catches an id that appears outside the roots only on the faulted page; the old loop over the
  unfaulted ids missed it.

**Evidence (5 Oct 2026, K1b build, base main 08501e3).**

- Real tool, `--pages kit --islands kit/ --modes render,effect --shard 1/2` and `2/2`: `DIFF · 7 faults` on each
  shard, exit 1. Every failure is check (2) on the ids listed above.
- Copy with this patch, same commands: `ok · 7 faults` on each shard, exit 0.
- Negative tests on the patched copy, `--islands kit/demos/FigureDemo --modes render`, mutating the faulted page
  before the snapshot:
  - an attribute set on a child of `#demo-figure` outside `[data-demo="figure"]`: FAIL on `id:#demo-figure` and
    `id:#main`, so a masked ancestor is still compared;
  - a new `<span id="neg-x">` appended to `body`, outside every root: FAIL on `id:#neg-x`, the faulted-only path.

## 2. faults.mjs --islands --estimate crashes

**Status:** pending, reproduced 5 Oct 2026; nothing depends on it.

**File:** `scripts/parity/faults.mjs`

**Why.** With `--estimate` the browser is never launched, but the `--islands` branch calls `open()` to read the
registry before it checks `args.estimate`, so `node scripts/parity/faults.mjs --base … --head out --pages kit
--islands kit/ --estimate` throws `TypeError: Cannot read properties of null (reading 'newContext')`
(engine.mjs:60).

**Patch.** Estimate before loading anything; the registry is only known by loading head. The old estimate
block after `work` can no longer run, so the patch drops it. Each diff in this file applies alone to the current
`faults.mjs`, and both apply in order (checked with `patch` and `node --check`). Patched, the command above prints
the estimate line and exits 0.

```diff
--- a/scripts/parity/faults.mjs
+++ b/scripts/parity/faults.mjs
@@ -123,6 +123,12 @@
     // --islands: read the registry from head with the fault hook defined.
     const prefix = args.islands === true ? "" : String(args.islands);
     const modes = (args.modes ?? "render,effect").split(",").map((m) => m.trim()).filter(Boolean);
+    // --estimate launches no browser, and the registry is only known by
+    // loading head, so estimate before opening anything.
+    if (args.estimate) {
+      console.log(`${page}: about 7 s per island and mode, plus 7 s to read the registry; run without --estimate to list the islands`);
+      continue;
+    }
     const open = async (opts) => {
       const o = await openPage(browser, opts);
       o.state.origin = new URL(headSrv.base).origin;
@@ -139,11 +145,6 @@
       continue;
     }
     const work = names.flatMap((n) => modes.map((m) => [n, m])).filter(inShard);
-    if (args.estimate) {
-      console.log(`${page}: ${work.length} island faults, about ${work.length * 7 + 7} s`);
-      await plain.context.close();
-      continue;
-    }
     const sel = (list) => (list === "none" || list === "page" || !list ? [] : list);
     const allRoots = [...new Set(names.flatMap((n) => sel(registry[n].roots)))];
     const allSel = [...new Set(names.flatMap((n) => [...sel(registry[n].roots), ...sel(registry[n].affects)]))];
```
