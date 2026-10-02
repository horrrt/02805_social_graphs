// Pins Week 2 prose that tests/week02-data.test.mjs does not reach: the
// post-narrative degrees, the population counts repeated across the primer,
// the departure board and the closing section, the core-only average-path
// check, the swap/split counts behind it, and the Screen Test prototype's
// friendship-paradox rate. A rerun of week02_resilience.py, week02_nullmodels.py
// or scripts/analyse_week2_models.py that moves any of these numbers would
// otherwise leave the prose stale with nothing to catch it.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const json = (name) => JSON.parse(read(name));

// No quoted fields in this file (every column is numeric or the fixed string
// "swap"/"er"), so a plain split is enough; see tests/arcade.test.mjs for the
// same approach against a CSV that does need quote-aware splitting.
const csv = (name) => {
  const [header, ...rows] = read(name).trim().split("\n");
  const cols = header.split(",");
  return rows.map((line) => Object.fromEntries(cols.map((c, i) => [c, line.split(",")[i]])));
};

// Strip tags and collapse whitespace, the same way tests/week04-prose.test.mjs
// does, so a sentence wrapped across several source lines still matches.
const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

const html = builtPage("out/weeks/week02/index.html");
const prose = strip(html);
const screenTestHtml = builtPage("out/prototypes/screen-test/index.html");
const screenTestProse = strip(screenTestHtml);

const arcade = json("public/assets/data/arcade_graph.json");
const nulls = json("public/assets/data/week02_nullmodels.json");
const resilience = json("public/assets/data/week02_resilience.json");
const screentest = json("public/assets/data/week02_screentest.json");
const nullDrawsCsv = csv("public/assets/data/week02_nullmodels_draws.csv");

const count = (n) => n.toLocaleString("en-US");
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const says = (t) => assert.ok(prose.includes(t), `the page should say "${t}"`);

// arcade_graph.json's own per-node component field, independent of both
// week02_resilience.json's and week02_nullmodels.json's population blocks.
const componentCounts = arcade.nodes.reduce((acc, n) => {
  acc[n.component] = (acc[n.component] ?? 0) + 1;
  return acc;
}, {});

test("the population counts (303 / 277 core / 9 island / 17 isolates / 1,784 arcs) match the data, and recur consistently across the page", () => {
  const total = arcade.nodes.length;
  const core = componentCounts.core;
  const island = componentCounts.island;
  const isolates = componentCounts.isolate;

  // Cross-check arcade_graph.json's per-node classification against the two
  // independently-written analysis files that also carry these counts.
  assert.equal(total, nulls.population.nodes, "arcade_graph.json's node count disagrees with week02_nullmodels.json's population.nodes");
  assert.equal(core, resilience.population.nodes, "arcade_graph.json's core count disagrees with week02_resilience.json's population.nodes");
  assert.equal(isolates, nulls.population.isolates, "arcade_graph.json's isolate count disagrees with week02_nullmodels.json's population.isolates");

  // The dataset primer's "core and component" definition.
  says(`The core is the largest one: ${count(core)} articles. A separate ${WORDS[island]}-article group and ${count(isolates)} articles with no links are outside this experiment.`);
  // The interactive panel's lead-in.
  says(`Of the ${count(total)} articles, ${count(core)} form one connected group`);
  // The "Which articles were already separate?" departure board.
  says(`MAIN NETWORK ${count(core)} STATIONS`);
  says(`MORITURI ISLAND ${count(island)} STATIONS`);
  says(`ISOLATED ARTICLES ${count(isolates)} STATIONS`);
  // The closing "What the data means" summary.
  says(`${count(total)} article entries and ${count(nulls.population.arcs)} directed links`);

  // "the nine-character Morituri island" repeats three times (the two null-model
  // paragraphs and the paradox pill caption); catch any one going stale.
  const islandPhrase = `the ${WORDS[island]}-character Morituri island`;
  says(islandPhrase);
  const islandMatches = prose.split(islandPhrase).length - 1;
  assert.equal(islandMatches, 3, `expected "${islandPhrase}" 3 times, found ${islandMatches}`);
  // "(303 minus 17)" deriving the 286 linked articles.
  says(`(${count(total)} minus ${count(isolates)})`);
});

test("the post-narrative degrees for Hulk and Black Widow match week02_resilience.json's cases", () => {
  const byLabel = Object.fromEntries(resilience.cases.map((c) => [c.label, c]));
  const hulk = byLabel["Hulk"].degree;
  const blackWidow = byLabel["Black Widow"].degree;
  // "A busy station is not always a vital connection."
  says(`even though Hulk has ${count(hulk)} neighbours`);
  // "What surprised us" (group-owned wording; only pinning its numbers here).
  says(`Black Widow has ${count(blackWidow)} links, far fewer than Hulk's ${count(hulk)}`);
});

test("\"only nine of those maps\" matches Spider-Man's atLeastReal in week02_resilience.json", () => {
  const spiderMan = resilience.cases.find((c) => c.label === "Spider-Man");
  says(`${WORDS[spiderMan.null.atLeastReal]} of those maps lost at least five articles`);
});

test("the core-only average-path check (2.674 / 2.601 / z / 400 samples / swaps-per-link) matches week02_screentest.json", () => {
  const row = screentest.rows.find((r) => r.key === "path");
  const swapsPerLink = screentest.meta.swaps / screentest.meta.m;
  assert.ok(Number.isInteger(swapsPerLink), "meta.swaps / meta.m should be a whole number of swaps per link");
  says(
    `gives ${row.real.toFixed(3)} against a null mean of ${row.mu.toFixed(3)} (z = +${row.z.toFixed(1)}, ` +
      `from ${count(screentest.meta.samples)} shuffles at ${swapsPerLink} swaps per link`,
  );
});

test("the 962/38 giant-size split matches week02_nullmodels_draws.csv", () => {
  const swapRows = nullDrawsCsv.filter((r) => r.null === "swap");
  const bySize = swapRows.reduce((acc, r) => {
    acc[r.giant_size] = (acc[r.giant_size] ?? 0) + 1;
    return acc;
  }, {});
  const sizes = Object.entries(bySize).sort((a, b) => b[1] - a[1]);
  assert.equal(sizes.length, 2, `expected exactly two distinct giant sizes among the ${swapRows.length} swap draws, found ${sizes.length}`);
  const [[majority, majorityCount], [minority, minorityCount]] = sizes;
  says(
    `In ${count(majorityCount)} draws the giant is exactly those ${count(majority)} nodes; ` +
      `in the other ${count(minorityCount)}, an unrelated two-article pair happens to split off elsewhere, ` +
      `leaving a giant of ${minority}`,
  );
  const nineteen = swapRows.filter((r) => Number(r.components) === 19).length;
  says(`The draws that reach 19 components (${count(nineteen)} of ${count(swapRows.length)})`);
});

test("the friendship-paradox pill (\"286 LINKED ARTICLES\") matches week02_nullmodels.json", () => {
  says(`${count(nulls.paradox.linked)} LINKED ARTICLES`);
  says(`leaves ${count(nulls.paradox.linked)} linked articles`);
});

test("Screen Test's 87.4% matches week02_screentest.json's paradox row", () => {
  const paradox = screentest.rows.find((r) => r.key === "paradox");
  assert.ok(paradox, "week02_screentest.json has no paradox row");
  const pct = (paradox.real * 100).toFixed(1);
  assert.ok(screenTestProse.includes(`The ${pct}% quoted below`), `screen-test prototype should say "The ${pct}% quoted below"`);
});
