// The site's wording for formula hovers and glossary terms lives in one place,
// src/lib/glossary.ts, so a concept reads the same on every page. This fails
// when a formula tags a part (\htmlClass{x-<id>}) with no EXPLAIN entry, when
// a formula writes its own explain map instead of taking it from EXPLAIN, when
// a glossary term's concept has no TERMS entry, when a converted page writes a
// definition inline, and when two entries say the same thing word for word.
// Week 4's own terms (GlossTerm, with their definitions inline) predate the
// shared glossary and are left as they are.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, codeFiles } from "./built-page.mjs";

const source = readFileSync(join(ROOT, "src/lib/glossary.ts"), "utf8");
const section = (name) => source.slice(source.indexOf(`export const ${name}`), source.indexOf("\n};", source.indexOf(`export const ${name}`)));
const keys = (block, shape) => [...block.matchAll(new RegExp(`^  "?([\\w-]+)"?: ${shape}`, "gm"))].map((m) => m[1]);
const EXPLAIN = keys(section("EXPLAIN"), '"');
const TERMS = keys(section("TERMS"), "\\{ word:");
const files = codeFiles(join(ROOT, "src"), /\.(tsx|ts|js)$/).map((path) => [relative(ROOT, path), readFileSync(path, "utf8")]);

// Pages whose terms all come from the shared glossary.
const CONVERTED = /^src\/app\/\((week0[12356]|week06alternative)\)\//;

test("the glossary has entries to check against", () => {
  assert.ok(EXPLAIN.length > 50 && TERMS.length > 50, `${EXPLAIN.length} explanations, ${TERMS.length} terms`);
});

test("every tagged part of a formula has a shared explanation", () => {
  const missing = [];
  for (const [path, text] of files) {
    if (path === "src/lib/glossary.ts" || path === "src/lib/Tex.tsx") continue;
    const ids = [...text.matchAll(/\bx\("([\w-]+)"/g), ...text.matchAll(/\\\\?htmlClass\{x-([\w-]+)\}/g)].map((m) => m[1]);
    for (const id of new Set(ids)) if (!EXPLAIN.includes(id)) missing.push(`${path}: x-${id}`);
  }
  assert.deepEqual(missing, [], "add each id to EXPLAIN in src/lib/glossary.ts");
});

test("every formula takes its explanations from the shared glossary", () => {
  const inline = files.filter(([path, text]) => path !== "src/lib/Tex.tsx" && /explain=\{\{/.test(text)).map(([path]) => path);
  assert.deepEqual(inline, [], "build the explain map with explainFor() from src/lib/glossary.ts");
});

test("every glossary term resolves to a shared definition", () => {
  const missing = [];
  for (const [path, text] of files) {
    for (const [, id] of text.matchAll(/<Gloss id="([^"]+)"/g)) {
      const concept = id.replace(/^(w\d+a?|sg)-term-/, "");
      if (!TERMS.includes(concept)) missing.push(`${path}: ${id}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("converted pages define no term inline", () => {
  const inline = files.filter(([path, text]) => CONVERTED.test(path) && /<Term\s/.test(text)).map(([path]) => path);
  assert.deepEqual(inline, [], "use <Gloss id> with an entry in TERMS");
});

test("no two entries share their wording", () => {
  const texts = (block) => [...block.matchAll(/(?:: |definition: )"((?:[^"\\]|\\.)+)"/g)].map((m) => m[1]);
  for (const name of ["EXPLAIN", "TERMS"]) {
    const all = texts(section(name));
    assert.deepEqual(all.filter((t, i) => all.indexOf(t) !== i), [], `${name} repeats a text`);
  }
});
