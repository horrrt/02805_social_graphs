// Cold Read round 4's rules against its real context rows: every hidden word
// has rows at every window under both weights, PPMI pushes the filler words
// out, and the sentences hide the word they come from.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { COST, options, pieces, points, spent, type TezguinoData } from "@/features/cold-read/contexts";
import { json } from "./coldReadData";

const data = json<TezguinoData>("tezguino.json");
const FILLER = new Set(["the", "of", "and", "a", "to", "in", "his", "her", "is", "was"]);

test("every hidden word has a full row at every window, under both weights", () => {
  assert.ok(data.words.length >= 100);
  for (const h of data.words)
    for (const k of data.windows) {
      assert.ok(h.rows.counts[k].length >= 5 && h.rows.ppmi[k].length >= 5, h.w);
      assert.ok(h.rows.ppmi[k].every(([, v]) => v > 0), h.w);
      assert.ok(h.rows.counts[k].every(([c]) => c !== h.w), h.w);
    }
});

test("PPMI pushes the filler words out of the rows that raw counts give them", () => {
  let counts = 0;
  let ppmi = 0;
  for (const h of data.words) {
    counts += h.rows.counts[2].filter(([c]) => FILLER.has(c)).length;
    ppmi += h.rows.ppmi[2].filter(([c]) => FILLER.has(c)).length;
  }
  assert.ok(counts > 4 * ppmi, `${counts} filler words by count, ${ppmi} by PPMI`);
});

test("each sentence hides its word and nothing else gives it away", () => {
  for (const h of data.words) {
    assert.equal(h.sentences.length, 3);
    const stem = h.w.length >= 5 ? h.w.slice(0, 5) : h.w;
    for (const s of h.sentences) {
      assert.ok(pieces(s).length >= 2, h.w);
      assert.ok(!s.includes("\n"), `a heading is glued to "${s}"`);
      // No other form of the word either: costumes, vampires, Soulsword.
      const words = s.toLowerCase().match(/[^\W\d_]+/gu) ?? [];
      assert.ok(!words.some((x) => x.startsWith(stem)), `${h.w} shows in "${s}"`);
    }
  }
});

test("no two hidden words are spellings of one word", () => {
  const seen = new Map<string, string>();
  for (const h of data.words) {
    const key = h.w.replace(/(.)\1/g, "$1");
    assert.ok(!seen.has(key), `${h.w} and ${seen.get(key)}`);
    seen.set(key, h.w);
  }
});

test("options hold the answer and three others, and tools cost what they say", () => {
  const four = options(data.words.length, 7, () => 0.3);
  assert.equal(new Set(four).size, 4);
  assert.ok(four.includes(7));
  assert.equal(spent(1, false, 0), 0);
  assert.equal(spent(3, true, 1), 2 * COST.window + COST.ppmi + COST.peek);
  assert.equal(points(0), 1000);
  assert.equal(points(450, 2), 1100);
  assert.equal(points(5000, 9), 500, "never below 100, streak capped at ×5");
});
