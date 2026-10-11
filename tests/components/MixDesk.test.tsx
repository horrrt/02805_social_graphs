// Cold Read round 3's rules against its real topic model: every page's
// mixture sums to 1 and really mixes, every word points at a topic, and the
// scoring rewards the best chips most.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { bestChips, CHIPS, distance, grade, type MixDeskData, score, sizeBucket } from "@/features/cold-read/topics";
import { json } from "./coldReadData";

const data = json<MixDeskData>("mix_desk.json");

test("eight topics, and every page a real mixture of them", () => {
  assert.equal(data.K, 8);
  assert.equal(data.topics.length, 8);
  assert.ok(data.pages.length >= 40);
  for (const p of data.pages) {
    assert.ok(Math.abs(p.theta.reduce((a, b) => a + b, 0) - 1) < 0.01, p.name);
    const [first, second] = [...p.theta].sort((a, b) => b - a);
    assert.ok(first <= 0.92 && second >= 0.08, p.name);
    for (const [, n, k] of p.words) assert.ok(n > 0 && k >= 0 && k < 8, p.name);
  }
});

test("the best chips sum to ten and beat any other spread", () => {
  for (const p of data.pages) {
    const best = bestChips(p.theta);
    assert.equal(best.reduce((a, b) => a + b, 0), CHIPS);
    const flat = Array(8).fill(0).map((_, k) => (k < 2 ? 5 : 0));
    assert.ok(score(best, p.theta) >= score(flat, p.theta), p.name);
  }
});

test("distance, grades and word sizes", () => {
  assert.equal(distance([10, 0], [1, 0]), 0);
  assert.equal(distance([0, 10], [1, 0]), 1);
  assert.equal(score([5, 5], [0.5, 0.5]), 1000);
  assert.deepEqual([900, 700, 500, 100].map(grade), ["Perfect read", "Sharp read", "Half read", "Misread"]);
  assert.deepEqual([10, 5, 3, 1].map((n) => sizeBucket(n, 10)), [4, 3, 2, 1]);
});
