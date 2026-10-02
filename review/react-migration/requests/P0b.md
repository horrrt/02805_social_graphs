# P0b requests

Both requests tighten the comparison: each lets known entries in `scripts/parity/known/*/base.json` go, and
neither drops a check. P0b does not depend on them; its known files pass main-vs-main as they stand.

## 1. engine.mjs: drop the WebGL context address from console lines

**File:** `scripts/parity/engine.mjs`

**Patch:**

```diff
-  const norm = (s) => String(s).replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/g, "ORIGIN");
+  const norm = (s) => String(s)
+    .replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/g, "ORIGIN")
+    .replace(/\[\.WebGL-0x[0-9a-f]+\]/g, "[.WebGL-ADDR]");
```

**Why:** with a WebGL map on screen (week04's entity explorer, week03's globe, Atlas and deck.gl renderers),
Chromium logs `warning: [.WebGL-0x13c004bfa00]GL Driver Message (...) GPU stall due to ReadPixels`. The hex is
the context's address and differs on every run, so the `console` key never matches. `known/week04/base.json`
and `known/week03/base.json` mask `console` on those steps, which also hides any real error logged there.
With the address normalised, those entries can be deleted and the console compared again.

## 2. engine.mjs: canonicalise the hover tip's position in a kit-tip host

**File:** `scripts/parity/engine.mjs`, in `pageSnapshot`'s `walk`

**Patch:**

```diff
-      for (const node of el.childNodes) {
+      // tips.js appends div.kit-tip to its host whenever the host lacks one, so
+      // whether it sits before or after the chart depends on draw timing (KB07).
+      // Walk it last; its own content is still compared.
+      const nodes = [...el.childNodes];
+      if (el.classList?.contains("kit-tip-host")) {
+        const tip = (n) => n.nodeType === 1 && n.classList.contains("kit-tip");
+        nodes.sort((a, b) => tip(a) - tip(b));
+      }
+      for (const node of nodes) {
```

**Why:** on week05, `hoverTips()` adds a hidden `div.kit-tip` to every `[id^="chart-"]` host and the chart lands
before or after it depending on timing (P0a saw it in about half the load runs; P0b in every scenario on `fed3c83`, and in none of three passes on `7978c8a`).
`known/week05/base.json` therefore masks every chart host, every section and figure holding one, `#main` and
`body` on every step, so a real change anywhere in week05's markup without its own id goes unseen. With the
tip walked last, the tree and body hashes stop flipping, and those entries can be deleted (the `text` entry for
`w5-tips` stays: a visible tip's lines still move within `innerText`).
