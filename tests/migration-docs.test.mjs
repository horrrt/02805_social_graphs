// Pins the two migration documents to the source list they are generated from.
// Both are written by scripts/migration/render_catalogue.py; these tests fail
// when someone edits the Markdown by hand or forgets to re-render after
// changing scripts/migration/sources.py.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");

const tsv = read("data/migration_sources.tsv")
  .split("\n")
  .filter((line) => line && !line.startsWith("#"));
const header = tsv[0].split("\t");
const rows = tsv.slice(1).map((line) => {
  const cells = line.split("\t");
  return Object.fromEntries(header.map((key, i) => [key, cells[i]]));
});

const catalogue = read("MIGRATION_DATA_CATALOGUE.md");
const questions = read("MIGRATION_QUESTIONS.md");

const anchor = (text) =>
  [...text.toLowerCase()]
    .filter((c) => /[a-z0-9 \-_]/.test(c))
    .join("")
    .trim()
    .replace(/ /g, "-");

test("every source in the index has a section in the catalogue", () => {
  assert.ok(rows.length >= 80, `expected at least 80 sources, got ${rows.length}`);
  for (const row of rows) {
    assert.ok(
      catalogue.includes(`### ${row.name}\n`),
      `no catalogue section for ${row.id} (${row.name})`,
    );
  }
});

test("every source states a unit, a network shape and at least one limitation", () => {
  for (const row of rows) {
    for (const field of ["unit", "coverage", "network", "metrics", "limits", "url"]) {
      assert.ok(row[field] && row[field].length > 3, `${row.id} is missing ${field}`);
    }
    assert.ok(row.url.startsWith("http"), `${row.id} has no usable url`);
  }
});

test("the catalogue reports the same source count as the index", () => {
  const sections = catalogue.match(/^### /gm) ?? [];
  assert.equal(sections.length, rows.length);
  assert.ok(
    catalogue.includes(`${rows.length} sources across`),
    "the catalogue intro does not state the current source count",
  );
});

test("no internal link in either document points at a missing heading", () => {
  const headings = new Set(
    [...catalogue.matchAll(/^#+ (.+)$/gm)].map((m) => anchor(m[1])),
  );
  for (const [, target] of catalogue.matchAll(/\]\(#([^)]+)\)/g)) {
    assert.ok(headings.has(target), `broken catalogue anchor #${target}`);
  }
  for (const [, target] of questions.matchAll(
    /\]\(MIGRATION_DATA_CATALOGUE\.md#([^)]+)\)/g,
  )) {
    assert.ok(headings.has(target), `broken cross-document anchor #${target}`);
  }
});

test("the questions page covers all four project questions", () => {
  for (const measure of [
    "Closeness centrality",
    "Betweenness centrality",
    "Cliques and communities",
    "Shocks and event studies",
  ]) {
    assert.ok(questions.includes(`## ${measure}\n`), `missing section ${measure}`);
  }
  const traps = questions.match(/\*\*The trap\.\*\*/g) ?? [];
  assert.equal(traps.length, 4, "each question needs its trap written down");
});
