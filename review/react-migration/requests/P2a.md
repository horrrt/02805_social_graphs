# P2a requests

## 1. engine.mjs: compare console messages without their stack frames

**File:** `scripts/parity/engine.mjs`, in `openPage`

**Patch:**

```diff
   const norm = (s) => String(s)
     .replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/g, "ORIGIN")
-    .replace(/\[\.WebGL-0x[0-9a-f]+\]/g, "[.WebGL-ADDR]");
+    .replace(/\[\.WebGL-0x[0-9a-f]+\]/g, "[.WebGL-ADDR]")
+    .replace(/\n\s+at [^\n]*/g, "");
```

**Why:** `console.error(error)` logs the error's stack, and Chromium's console text carries every frame:
`at r.onerror (ORIGIN/02805_social_graphs/_next/static/chunks/0fuc-u2ncc9z4.js:27:76912)`. The frames name the
content-hashed chunk, the minified function and the line and column, so they change whenever the module that
creates the error changes, while the message a reader could see stays the same. P2a moves the `could not load
<file>` error from week03-boot.js into src/scripts/runtime/vendor.js, and `runtime.mjs` then fails
`scenarios/week03/base-style.mjs` at step 18 (`w3-style-abort`, d3 aborted under `?variant=d3`) on `console`
alone: the message line `error: Error: could not load d3-7.9.0.min.js` is equal on both sides, and only the
frame lines differ (`onlyBase: at r.onerror (…0fuc-u2ncc9z4.js:27:76912)`, `onlyHead: at …42-zk_t-ar012.js:1:640`,
`at async ap (…0rcw53enuh2_i.js:27:77442)`). Every later batch that touches a module which logs an Error will
hit the same wall. With the patch the message, its type, the count and the order of console lines are still
compared; only the build-specific frame lines go. Checked on 2026-10-04: with the patch applied locally (and
reverted afterwards), base-style.mjs passes all 23 steps on P2a's head.
