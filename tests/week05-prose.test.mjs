// Week 5 page wiring: owners and a clean merge. Stylesheets: tests/stylesheets.test.mjs. The numbers are
// pinned per section (tests/week05-*.test.mjs) and for the frame
// (tests/week05-frame.test.mjs).

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "docs/weeks/week05/index.html"), "utf8");

test("week 5 sections are owned", () => {
  assert.match(html, /id="search"/);
  assert.match(html, /data-owner="Àngela"/);
});

test("week 5 page has no unresolved merge markers or placeholder hints", () => {
  assert.doesNotMatch(html, /<<<<<<<|=======|>>>>>>>/);
  assert.doesNotMatch(html, /class="w5-hint"/);
});
