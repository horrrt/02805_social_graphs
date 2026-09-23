// Pins the Week 2 post's twelve-quantity table and the key numbers quoted in
// its prose to the JSON the analysis scripts write. The table's cells are
// hand-formatted HTML, not templated, so a rerun of analysis/week02_nullmodels.py
// or analysis/week02_resilience.py with different data would not by itself
// change a single character of the page: these tests are what would catch it.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const loadJson = (name) => JSON.parse(read(join("docs/assets/data", name)));

const html = read("docs/weeks/week02/index.html");
// Prose wraps across source lines; collapse runs of whitespace so a sentence
// spanning several lines still matches a single-line regex.
const prose = html.replace(/\s+/g, " ");
const nulls = loadJson("week02_nullmodels.json");
const resilience = loadJson("week02_resilience.json");
const screentest = loadJson("week02_screentest.json");
const quantities = Object.fromEntries(nulls.quantities.map((q) => [q.key, q]));

// A displayed number as a plain float: strips the thousands comma, the "−"
// the site uses in place of an ASCII hyphen, and a trailing percent sign.
const num = (cell) => Number(cell.replace(/,/g, "").replace(/−/g, "-").replace(/%$/, ""));
const isPercent = (cell) => cell.trim().endsWith("%");
const decimalsOf = (cell) => (cell.split(".")[1] ?? "").replace(/[%]/g, "").length;

// The displayed value is rounded to however many decimals the page shows;
// this tolerates a table that shows a mean to a different precision than its
// "digits" field (the components row shows its mean to 2dp, triangles to 0),
// while still catching a value that disagrees with the JSON outright.
function assertRounds(actual, cell, { percent = false } = {}) {
  const expected = num(cell);
  const decimals = decimalsOf(cell);
  const value = percent ? actual * 100 : actual;
  const eps = 0.5 * 10 ** -decimals + 1e-9;
  assert.ok(
    Math.abs(value - expected) <= eps,
    `expected ${value} to round to the shown ${expected} (${decimals}dp), from cell "${cell}"`,
  );
}

// The twelve-quantity table's row label -> the JSON's quantity key. Row order
// on the page does not follow QUANTITIES' order in the script, so this is
// matched by label text, not position.
const ROW_KEYS = {
  "Average clustering C": "avg_clustering",
  "Transitivity": "transitivity",
  "Triangles": "triangles",
  "Islands (connected components)": "components",
  "Largest component": "giant_size",
  "Average distance in the largest component": "avg_path_giant",
  "Degree assortativity": "assortativity",
  "Mean degree at the end of a random link": "neighbour_degree_edge",
  "Mean degree of a random character’s random friend": "neighbour_degree_node",
  "Chance your random friend is at least as linked": "friend_at_least",
  "Characters no friend out-links": "unbeaten",
  "Biggest hub’s share of all link ends": "hub_share",
};

function tableRows() {
  const table = html.match(/<table>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  assert.ok(table, "the twelve-quantity table is missing");
  const rows = table[1].match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
  return rows.map((row) => {
    const label = row.match(/<th scope="row">\s*([\s\S]*?)\s*<\/th>/)[1].replace(/\s+/g, " ").trim();
    const cells = [...row.matchAll(/<td>\s*([\s\S]*?)\s*<\/td>/g)].map((m) => m[1].trim());
    return { label, cells };
  });
}

test("the twelve-quantity table has exactly twelve rows, one per QUANTITIES entry", () => {
  assert.equal(nulls.quantities.length, 12, "week02_nullmodels.json does not carry twelve quantities");
  const rows = tableRows();
  assert.equal(rows.length, 12, `the table has ${rows.length} rows, not twelve`);
  assert.deepEqual(
    rows.map((r) => r.label).sort(),
    Object.keys(ROW_KEYS).sort(),
    "a table row's label does not match any entry in ROW_KEYS",
  );
});

test("every table row's real value, null mean, z and p match the JSON", () => {
  for (const { label, cells } of tableRows()) {
    const key = ROW_KEYS[label];
    const q = quantities[key];
    assert.ok(q, `${label} has no matching quantity in week02_nullmodels.json`);
    const [real, shuffle, z, p, er, erZ] = cells;
    const percent = isPercent(real);

    assertRounds(q.real, real, { percent });

    if (q.swap.fixed) {
      assert.equal(z, "—", `${label}: the shuffle cannot move this quantity, so z should read —`);
      assert.equal(p, "—", `${label}: a fixed quantity has no p`);
      assertRounds(q.real, shuffle, { percent }); // the shuffle mean equals the real value exactly
    } else {
      assertRounds(q.swap.mean, shuffle, { percent });
      const zSign = num(z) >= 0;
      assertRounds(Math.abs(q.swap.z), z.replace(/[+−-]/, ""), {});
      assert.equal(zSign, q.swap.z >= 0, `${label}: the shown z's sign disagrees with the JSON`);
      const pExpected = q.swap.z >= 0 ? q.swap.pHigh : q.swap.pLow;
      assertRounds(pExpected, p, {});
    }

    assertRounds(q.er.mean, er, { percent });
    assertRounds(Math.abs(q.er.z), erZ.replace(/[+−-]/, ""), {});
    assert.equal(num(erZ) >= 0, q.er.z >= 0, `${label}: the shown ER z's sign disagrees with the JSON`);
  }
});

test("the clustering-vs-G(n,m) ratio quoted in prose matches the JSON", () => {
  const ratio = quantities.avg_clustering.real / quantities.avg_clustering.swap.mean;
  const match = prose.match(/about ([\d.]+) times the degree-preserving mean/);
  assert.ok(match, "the '... times the degree-preserving mean' sentence is missing");
  assert.equal(Number(match[1]), Math.round(ratio * 10) / 10, `0.307454 / 0.142929 rounds to ${ratio.toFixed(4)}, not ${match[1]}`);
});

test("the four removal cases' stranded counts and p-values match week02_resilience.json", () => {
  const caseByLabel = Object.fromEntries(resilience.cases.map((c) => [c.label, c]));
  const patterns = [
    [/Spider-Man strands (\d+) against a shuffle mean of ([\d.]+), empirical p = ([\d.]+)/, "Spider-Man"],
    [/Black Widow strands (\d+) against ([\d.]+), p = ([\d.]+)/, "Black Widow"],
    [/Doctor Strange’s (\d+) against ([\d.]+) gives p = ([\d.]+)/, "Doctor Strange"],
    [/Hulk’s (\d+) against ([\d.]+) is the most ordinary outcome there is \(p = ([\d.]+)\)/, "Hulk"],
  ];
  for (const [pattern, label] of patterns) {
    const match = prose.match(pattern);
    assert.ok(match, `could not find the ${label} sentence in the prose`);
    const [, stranded, mean, p] = match;
    const real = caseByLabel[label];
    assert.equal(Number(stranded), real.real.count, `${label}: prose says ${stranded} stranded, JSON says ${real.real.count}`);
    assertRounds(real.null.mean, mean);
    assertRounds(real.null.upperTailEstimate, p);
  }
});

test("Doctor Strange's histogram alt text states 'or more', matching atLeastReal", () => {
  const doctorStrange = resilience.cases.find((c) => c.label === "Doctor Strange");
  const exactlyTwo = doctorStrange.null.histogram.find((h) => h.value === 2)?.count ?? 0;
  assert.notEqual(doctorStrange.null.atLeastReal, exactlyTwo, "the fixture no longer needs the 'or more' wording");
  assert.match(prose, /Doctor Strange’s 2 or more appears in 85 of 1,000/, "the alt text should read '2 or more'");
  assert.equal(doctorStrange.null.atLeastReal, 85);
});

test("week02_screentest.json picks clustering by row position and carries one paradox row", () => {
  assert.equal(screentest.rows[0].key, "clus", "the page reads clustering from rows[0]; the script must keep it first");
  const paradoxRows = screentest.rows.filter((r) => r.key === "paradox");
  assert.equal(paradoxRows.length, 1, `expected exactly one paradox row, found ${paradoxRows.length}`);
});
