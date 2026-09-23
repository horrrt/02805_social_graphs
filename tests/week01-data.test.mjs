// Invariants between analysis/week01_packs.py's output and the Week 1 page.
//
// The page used to hand-type 1,945, 303, 58 and 106/107 into packs.js and the
// prose, so a rerun of the script could silently drift from what the page
// says. These pin the page's numbers to the JSON the script writes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const packs = JSON.parse(
  readFileSync(join(ROOT, "docs/assets/data/week01_packs.json"), "utf8"),
);
const html = readFileSync(
  join(ROOT, "docs/weeks/week01/index.html"),
  "utf8",
);

test("the totalWeight equals the sum of every card's weight", () => {
  const summed = packs.cards.reduce((total, c) => total + c.weight, 0);
  assert.equal(packs.totalWeight, 2087);
  assert.equal(summed, packs.totalWeight);
});

test("every card's probability is weight / totalWeight, and they sum to 1", () => {
  for (const c of packs.cards) {
    assert.ok(
      Math.abs(c.probability - c.weight / packs.totalWeight) < 1e-12,
      `${c.id}: probability ${c.probability} disagrees with weight ${c.weight} / ${packs.totalWeight}`,
    );
  }
  const total = packs.cards.reduce((sum, c) => sum + c.probability, 0);
  assert.ok(
    Math.abs(total - 1) < 1e-9,
    `probabilities sum to ${total}, not 1`,
  );
});

test("the histogram counts sum to all 303 articles", () => {
  const total = packs.histogram.reduce((sum, row) => sum + row.count, 0);
  assert.equal(total, 303);
});

test("the page's ≈1,945 metric equals collector.expectedPacksRounded", () => {
  assert.equal(packs.collector.expectedPacksRounded, 1945);
  assert.match(html, /≈1,945/);
});

test("the page's ≈382 uniform-odds metric equals collector.uniformExpectedPacks", () => {
  assert.equal(packs.collector.uniformExpectedPacks, 382);
  assert.match(html, /≈382/);
});

test("the printed pack range matches expectedPacksLower/Upper to 2 decimals", () => {
  const lower = packs.collector.expectedPacksLower.toFixed(2);
  const upper = packs.collector.expectedPacksUpper.toFixed(2);
  assert.equal(lower, "1944.19");
  assert.equal(upper, "1944.99");
  assert.ok(
    html.includes(`between ${Number(lower).toLocaleString("en-US", { minimumFractionDigits: 2 })} and ${Number(upper).toLocaleString("en-US", { minimumFractionDigits: 2 })}`),
    `the page does not quote ${lower} and ${upper}`,
  );
});
