// Invariants between analysis/week01_packs.py's output and the Week 1 page.
//
// The page used to hand-type its pack-collecting numbers, so a rerun of the
// script could silently drift from what the page says. These check totalWeight
// against the card weights, each card's probability, the histogram against the
// card count, and pin the page's ≈1,945 / ≈382 / 1,944.19–1,944.99 figures to
// week01_packs.json. See
// tests/week01-prose.test.mjs for the rest of the page's numbers (58, 2,087,
// 106/107 and the others).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const packs = JSON.parse(
  readFileSync(join(ROOT, "public/assets/data/week01_packs.json"), "utf8"),
);
const html = builtPage("out/weeks/week01/index.html");

test("the totalWeight equals the sum of every card's weight", () => {
  const summed = packs.cards.reduce((total, c) => total + c.weight, 0);
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

test("the histogram counts every card once", () => {
  const total = packs.histogram.reduce((sum, row) => sum + row.count, 0);
  assert.equal(total, packs.cards.length);
});

const count = (n) => n.toLocaleString("en-US");

test("the page's ≈ expected-packs metric equals collector.expectedPacksRounded", () => {
  const shown = `<strong>≈${count(packs.collector.expectedPacksRounded)}</strong`;
  assert.ok(html.includes(shown), `the page should show "${shown}"`);
});

test("the page's ≈ uniform-odds metric equals collector.uniformExpectedPacks", () => {
  const shown = `<strong>≈${count(packs.collector.uniformExpectedPacks)}</strong`;
  assert.ok(html.includes(shown), `the page should show "${shown}"`);
});

test("the printed pack range matches expectedPacksLower/Upper to 2 decimals", () => {
  const twoDp = (n) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lower = twoDp(packs.collector.expectedPacksLower);
  const upper = twoDp(packs.collector.expectedPacksUpper);
  assert.ok(
    html.includes(`between ${lower} and ${upper}`),
    `the page does not quote ${lower} and ${upper}`,
  );
});
