# K1b requests

## 1. faults.mjs --islands check (2): compare id elements with the island's roots masked

**Status:** pending. Until it lands, G5 `--islands kit/` fails for K1b, and for every later island that sits
inside an element with an id.

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
faults pass (`ok · 14 faults`).

```diff
@@ -148,6 +148,7 @@ try {
     const allRoots = [...new Set(names.flatMap((n) => sel(registry[n].roots)))];
     const allSel = [...new Set(names.flatMap((n) => [...sel(registry[n].roots), ...sel(registry[n].affects)]))];
     const unfaulted = await snapshot(plain.page, plain.state, { screenshot: false });
+    const unfaultedMasked = new Map();
     await plain.context.close();
     const noJs = await open({ javaScriptEnabled: false });
     const off = await snapshot(noJs.page, noJs.state, { screenshot: false, select: allRoots, textOf: allSel });
@@ -160,6 +161,9 @@ try {
       const o = await open({ faults: [`${name}:${mode}`] });
       const s = await snapshot(o.page, o.state, { screenshot: false, select: rootSel, exclude: [...rootSel, ...affectSel] });
       const consoleLines = s.flat.get("console") ?? "";
+      // For (2): the same page with this island's roots and affects masked.
+      const hidden = [...rootSel, ...affectSel];
+      const sMasked = affects === "page" ? null : await snapshot(o.page, o.state, { screenshot: false, mask: hidden });
       await o.context.close();
       const problems = [];
       // (1) roots render their JavaScript-disabled markup.
@@ -170,13 +174,20 @@ try {
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

## 2. faults.mjs --islands --estimate crashes

**Status:** pending; nothing depends on it.

**File:** `scripts/parity/faults.mjs`

**Why.** With `--estimate` the browser is never launched, but the `--islands` branch calls `open()` to read the
registry before it checks `args.estimate`, so `node scripts/parity/faults.mjs --base … --head out --pages kit
--islands kit/ --estimate` throws `TypeError: Cannot read properties of null (reading 'newContext')`
(engine.mjs:60).

**Patch.** Estimate before loading anything; the registry is only known by loading head.

```diff
     // --islands: read the registry from head with the fault hook defined.
     const prefix = args.islands === true ? "" : String(args.islands);
     const modes = (args.modes ?? "render,effect").split(",").map((m) => m.trim()).filter(Boolean);
+    if (args.estimate) {
+      console.log(`${page}: about 7 s per island and mode, plus 7 s to read the registry; run without --estimate to list the islands`);
+      continue;
+    }
     const open = async (opts) => {
```
