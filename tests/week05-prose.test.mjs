// Week 5 prose pins: numbers on #search and #autocomplete must match JSON.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "docs/weeks/week05/index.html"), "utf8");

test("week05 search and autocomplete sections are owned and wired", () => {
  assert.match(html, /id="search"/);
  assert.match(html, /data-owner="Àngela"/);
  assert.match(html, /week05\.css\?v=1/);
});

test("sections 5 to 7 quote their generated data", () => {
});

test("week 5 page has no unresolved merge markers", () => {
  assert.doesNotMatch(html, /<<<<<<<|=======|>>>>>>>/);
});
