// Pins the two migration documents to the source list they are generated from.
// Both are written by scripts/migration/render_catalogue.py; these tests fail
// when someone edits the Markdown by hand or forgets to re-render after
// changing scripts/migration/sources.py.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
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

test("every question idea states a stake, a null and a source that exists", () => {
  const names = new Set(rows.map((r) => r.name));
  const blocks = questions.split(/^\*\*/m).filter((b) => b.includes("*What is at stake:*"));
  assert.ok(blocks.length >= 20, `expected 20 question ideas, found ${blocks.length}`);
  for (const block of blocks) {
    assert.ok(block.includes("*Null:*"), "an idea has no null");
    assert.ok(block.includes("*Data:*"), "an idea names no data");
    assert.ok(block.includes("*Verdict:*"), "an idea has no verdict");
    const cited = [...block.matchAll(/\[([^\]]+)\]\(MIGRATION_DATA_CATALOGUE\.md#/g)];
    assert.ok(cited.length > 0, "an idea cites no catalogued source");
    for (const [, name] of cited) {
      assert.ok(names.has(name), `idea cites an uncatalogued source: ${name}`);
    }
  }
});

test("the numbers quoted on the questions page come from the committed facts file", () => {
  const facts = JSON.parse(read("analysis/week03_country_facts.json"));
  assert.equal(facts.destination_overlap.overlap_count, 4);
  assert.ok(
    questions.includes("4 of\ntheir top 15 destinations") ||
      questions.includes("4 of their top 15 destinations"),
    "the overlap claim on the page does not match the facts file",
  );
  // The page rounds to two decimals; the facts file keeps three.
  assert.ok(
    questions.includes(facts.stock.mean_path.toFixed(2)),
    "the raw mean path length on the page does not match the facts file",
  );
  const swept = facts.stock_threshold_sweep.at(-1);
  assert.equal(swept.threshold, 100000);
  assert.ok(
    questions.includes(swept.mean_path.toFixed(2)),
    "the thresholded mean path length on the page does not match the facts file",
  );
});

test("the Apple edition of the week 3 post is in sync with the arcade edition", () => {
  // Generated by scripts/sync_week03_v2.py; the two editions share markup and
  // differ only in asset depth and the chrome tags the site tests look for.
  const source = read("docs/weeks/week03/index.html");
  const twin = read("docs/v2/weeks/week03/index.html");
  const wanted = source
    .replaceAll('href="../../assets/', 'href="../../../assets/')
    .replaceAll('src="../../assets/', 'src="../../../assets/')
    .replace(
      '<link href="../../../assets/favicon.svg" rel="icon" type="image/svg+xml" />',
      '<meta content="../../" name="site-root" />\n' +
        '    <link href="../../../assets/favicon.svg" rel="icon" type="image/svg+xml" />',
    )
    .replace('<body class="corridor">', '<body class="corridor theme-apple">')
    .replace(
      "<title>Corridor Control · Log–Log Arcade</title>",
      "<title>Corridor Control · Log–Log Arcade · Apple edition</title>",
    );
  assert.equal(twin, wanted, "run: python scripts/sync_week03_v2.py");
});

test("every element the week 3 script writes into exists in both editions", () => {
  const script = read("docs/assets/js/corridor.js");
  const wanted = [...script.matchAll(/\$\("([a-z0-9-]+)"\)/g)].map((m) => m[1]);
  assert.ok(wanted.length > 20, "expected the script to address many elements");
  for (const page of ["docs/weeks/week03/index.html", "docs/v2/weeks/week03/index.html"]) {
    const html = read(page);
    const missing = [...new Set(wanted)].filter((id) => !html.includes(`id="${id}"`));
    assert.deepEqual(missing, [], `${page} is missing ids the script writes into`);
  }
});

test("every render variant names a vendored library that exists", () => {
  const boot = read("docs/assets/js/week03-boot.js");
  const names = [...boot.matchAll(/^\s{2}(\w+): \{$/gm)].map((m) => m[1]);
  assert.deepEqual(names, ["canvas", "d3", "echarts", "globe", "atlas", "deck"]);
  for (const [, file] of boot.matchAll(/script: "([^"]+)"/g)) {
    const path = join(ROOT, "docs/assets/vendor", file);
    assert.ok(existsSync(path), `missing vendored library: ${file}`);
    // The switcher advertises a download size; it has to be the real one.
    const bytes = statSync(path).size;
    assert.ok(
      boot.includes(`bytes: ${bytes},`),
      `${file} is ${bytes} bytes and the registry says otherwise`,
    );
  }
  for (const [, module] of boot.matchAll(/module: "\.\/([^"]+)"/g)) {
    assert.ok(
      existsSync(join(ROOT, "docs/assets/js", module)),
      `missing variant module: ${module}`,
    );
  }
});

test("each variant module exports install and touches no data", () => {
  for (const name of ["d3", "echarts", "globe", "atlas", "deck"]) {
    const src = read(`docs/assets/js/variants/${name}.js`);
    assert.match(src, /export function install\(/, `${name} exports install`);
    assert.doesNotMatch(src, /\bfetch\(/, `${name} must not load its own data`);
    // The SVG namespace is a URI, not a fetch; anything else is a CDN.
    const urls = [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]);
    assert.deepEqual(
      urls.filter((u) => !u.startsWith("http://www.w3.org/")),
      [],
      `${name} must not reference a CDN`,
    );
  }
});
