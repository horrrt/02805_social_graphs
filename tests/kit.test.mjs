// Keeps the component kit usable: every export of docs/assets/js/kit.js is
// documented in docs/assets/js/README.md and nothing documented is missing,
// and the week 5 page loads one script per section with the six slots each
// section script draws into. Reads the files as text, so it needs no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS = fileURLToPath(new URL("../docs/", import.meta.url));
const read = (p) => readFileSync(join(DOCS, p), "utf8");

const SECTIONS = ["relations", "copying", "search", "autocomplete", "heaps", "fame", "weird"];
const PARTS = ["asked", "did", "figure", "surprise", "checked", "limit"];

function exportsOf(src) {
  const names = new Set();
  for (const [, name] of src.matchAll(/^export (?:async )?function (\w+)/gm)) names.add(name);
  for (const [, list] of src.matchAll(/^export \{([^}]+)\}/gm))
    for (const item of list.split(",")) names.add(item.trim().split(/\s+as\s+/).pop());
  return [...names].sort();
}

function documented(md) {
  const names = new Set();
  for (const [, heading] of md.matchAll(/^### (.+)$/gm))
    for (const [, name] of heading.matchAll(/(\w+)\(/g)) names.add(name);
  return [...names].sort();
}

test("README.md documents exactly the exports of kit.js", () => {
  assert.deepEqual(documented(read("assets/js/README.md")), exportsOf(read("assets/js/kit.js")));
});

test("the week 5 page loads each section's script and has its six slots", () => {
  const html = read("weeks/week05/index.html");
  for (const s of SECTIONS) {
    assert.ok(html.includes(`id="${s}"`), `#${s} section`);
    assert.ok(html.includes(`src="../../assets/js/week05-${s}.js?v=`), `week05-${s}.js is loaded`);
    assert.ok(existsSync(join(DOCS, `assets/js/week05-${s}.js`)), `week05-${s}.js exists`);
    for (const p of PARTS)
      assert.match(html, new RegExp(`id="${s}-${p}">\\s*<h3>[^<]+</h3>\\s*<div data-body>`), `#${s}-${p} has a heading and a body`);
  }
  assert.ok(html.includes('href="../../assets/css/post.css'), "post.css is linked");
});
