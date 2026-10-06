# P2a requests

## 1. engine.mjs: compare console messages without their JS stack frames

**Status:** approved and applied by the orchestrator on 5 Oct 2026 (narrowed form below). Until it lands, `runtime.mjs` fails
`scenarios/week03/base-style.mjs` step 18 on `console` (see Why).

**Files:** `scripts/parity/engine.mjs` (in `openPage`) and a new `tests/parity-norm.test.mjs`

**Patch:** move `norm` to module scope as an exported `normConsole`, keep both existing rules, and drop only lines
that are JS frames pointing at a URL with a line and column. `openPage` calls `normConsole` where it called `norm`.

```diff
+// Console text normaliser. Drops only JS stack frames that point at a served URL ("    at fn (ORIGIN/x.js:1:2)",
+// "    at ORIGIN/x.js:1:2", "    at async fn (...)"); component-stack lines and message lines stay compared.
+export const normConsole = (s) => String(s)
+  .replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/g, "ORIGIN")
+  .replace(/\[\.WebGL-0x[0-9a-f]+\]/g, "[.WebGL-ADDR]")
+  .replace(/\n {4}at (?:async )?[^\n]*?\(?(?:ORIGIN|https?:)[^\n]*:\d+:\d+\)?/g, "");
+
 export async function openPage(browser, opts = {}) {
@@
-  const norm = (s) => String(s)
-    .replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/g, "ORIGIN")
-    .replace(/\[\.WebGL-0x[0-9a-f]+\]/g, "[.WebGL-ADDR]");
+  const norm = normConsole;
```

```js
// tests/parity-norm.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { normConsole } from "../scripts/parity/engine.mjs";

test("normConsole drops hashed-chunk frames", () => {
  const base = "Error: could not load d3-7.9.0.min.js\n    at r.onerror (http://127.0.0.1:4100/02805_social_graphs/_next/static/chunks/0fuc-u2ncc9z4.js:27:76912)";
  const head = "Error: could not load d3-7.9.0.min.js\n    at http://127.0.0.1:4200/02805_social_graphs/_next/static/chunks/42-zk_t-ar012.js:1:640\n    at async ap (http://127.0.0.1:4200/02805_social_graphs/_next/static/chunks/0rcw53enuh2_i.js:27:77442)";
  assert.equal(normConsole(base), "Error: could not load d3-7.9.0.min.js");
  assert.equal(normConsole(head), normConsole(base));
});

test("normConsole keeps component-stack lines and message lines that start with at", () => {
  const react = "An error occurred in the <Chart> component.\n    at Chart (a.js:1:1)\n    at Island (b.js:2:2)\n\nConsider adding an error boundary";
  assert.equal(normConsole(react), react);
  const prose = "first line\n  at the end of the list";
  assert.equal(normConsole(prose), prose);
});

test("normConsole keeps the origin and WebGL rules", () => {
  assert.equal(normConsole("GET http://localhost:3000/x 404"), "GET ORIGIN/x 404");
  assert.equal(normConsole("[.WebGL-0x7f00ab]GL_INVALID"), "[.WebGL-ADDR]GL_INVALID");
});
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
hit the same wall.

**What the check keeps:** the message, its type, the count and the order of console lines; every line that is not
a 4-space-indented `at` frame ending in `URL:line:col`, so React component stacks without URLs, blank lines and
message lines that begin with "at" still compare. An earlier draft of this request used `/\n\s+at [^\n]*/g`, which
also dropped those lines; a review rejected it as a weaker check, and P2a briefly applied it to the tool in
a90d1f0, which was taken out of the branch. Checked on 2026-10-04 in node: the pattern above reduces the base and
head step-18 messages to the same line and leaves the component-stack and prose examples unchanged.
