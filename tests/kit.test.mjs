// Keeps the component kit usable: every export of src/scripts/kit.js is
// documented in src/scripts/README.md, and every export of the React kit's
// src/kit/index.ts in src/kit/README.md, with nothing documented missing;
// and the week 5 page loads one script per section and keeps the ids of the
// brief's six parts, which scripts and anchors use. Reads the files as text, so it needs no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage, pageScripts, pageStyles } from "./built-page.mjs";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));
const read = (p) => readFileSync(join(SRC, p), "utf8");

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

// exportsOf reads `export function X` and `export { a, default as X }`, so it
// covers kit.js's re-exports and index.ts's `export { default as X } from …`.
test("README.md documents exactly the exports", () => {
  for (const [readme, source] of [
    ["scripts/README.md", "scripts/kit.js"],
    ["kit/README.md", "kit/index.ts"],
  ])
    assert.deepEqual(documented(read(readme)), exportsOf(read(source)), `${readme} and ${source}`);
});

test("the week 5 page loads each section's script and keeps the six parts' ids", () => {
  const html = builtPage("out/weeks/week05/index.html");
  const scripts = pageScripts("week05");
  for (const s of SECTIONS) {
    assert.ok(html.includes(`id="${s}"`), `#${s} section`);
    assert.ok(scripts.includes(`week05-${s}.js`), `week05-${s}.js is loaded`);
    assert.ok(existsSync(join(SRC, `scripts/week05-${s}.js`)), `week05-${s}.js exists`);
    for (const p of PARTS) assert.ok(html.includes(`id="${s}-${p}"`), `#${s}-${p} is still on the page`);
  }
  assert.ok(pageStyles("week05").includes("post.css"), "post.css is imported");
});

test("the kit README's code fences are balanced", () => {
  // A merge once dropped one closing ``` and turned a whole section into code.
  const fences = readFileSync(new URL("../src/kit/README.md", import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("```")).length;
  assert.equal(fences % 2, 0, `src/kit/README.md has ${fences} fence lines`);
});
