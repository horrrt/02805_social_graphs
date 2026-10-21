// The game-over draw: recent cards are rare but possible, and the recent
// list is kept in this browser and stays short.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import "./coldReadData";
import { nextCard, pickCard, RECENT, RECENT_WEIGHT, remember } from "@/features/cold-read/gameOverPick";

/** mulberry32, so the counts below are the same on every run. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

beforeEach(() => localStorage.clear());

test("a draw covers the whole range at its edges", () => {
  assert.equal(pickCard(145, [], () => 0), 1);
  assert.equal(pickCard(145, [], () => 0.999999), 145);
});

test("recent cards come up at about a tenth of the rate, but they do come up", () => {
  const recent = Array.from({ length: RECENT }, (_, i) => i + 1);
  const random = rng(1);
  let hits = 0;
  const draws = 20000;
  for (let i = 0; i < draws; i++) if (pickCard(145, recent, random) <= RECENT) hits++;
  const expected = (RECENT * RECENT_WEIGHT) / (RECENT * RECENT_WEIGHT + 145 - RECENT);
  assert.ok(hits > 0);
  assert.ok(Math.abs(hits / draws - expected) < 0.01, `${hits / draws} vs ${expected}`);
});

test("remember moves a card to the end and keeps the last RECENT", () => {
  assert.deepEqual(remember([1, 2, 3], 2), [1, 3, 2]);
  const full = Array.from({ length: RECENT }, (_, i) => i + 1);
  const next = remember(full, 99);
  assert.equal(next.length, RECENT);
  assert.equal(next[0], 2);
  assert.equal(next.at(-1), 99);
});

test("nextCard keeps what it drew and repeats less often than a plain draw", () => {
  const random = rng(2);
  let repeats = 0;
  const seen: number[] = [];
  for (let i = 0; i < 30; i++) {
    const card = nextCard(145, random);
    if (seen.includes(card)) repeats++;
    seen.push(card);
  }
  const kept = JSON.parse(localStorage.getItem("cold-read:game-over-recent") ?? "[]");
  assert.deepEqual(kept, [...new Set(seen.toReversed())].toReversed().slice(-RECENT));
  assert.ok(repeats <= 2, `${repeats} repeats in 30`);
});
