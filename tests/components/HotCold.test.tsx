// Cold Read round 5's rules against its real vectors: each word is nearest
// to itself, ranks put the hidden word first, every hidden word has a clear
// neighbourhood and the hints exist, as analysis/week06_hot_cold.py promised.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { atRank, cosinesTo, heat, HINT_RANKS, type HotColdMeta, points, prepare, ranks } from "@/features/cold-read/vectors";

const dir = new URL("../../public/play/cold-read/data/", import.meta.url);
const meta: HotColdMeta = JSON.parse(readFileSync(new URL("hot_cold.json", dir), "utf8"));
const bin = readFileSync(new URL("hot_cold.bin", dir));
const data = prepare(meta, bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength));

test("the vectors match the vocabulary and are unit length", () => {
  assert.equal(data.q.length, meta.vocab.length * meta.dims);
  for (const t of meta.targets.slice(0, 40)) assert.ok(Math.abs(cosinesTo(data, t)[t] - 1) < 0.01, meta.vocab[t]);
});

test("every hidden word ranks first and has close neighbours and every hint", () => {
  assert.ok(meta.targets.length >= 100);
  for (const t of meta.targets) {
    const cos = cosinesTo(data, t);
    const rank = ranks(cos, t);
    assert.equal(rank[t], 0);
    assert.ok(cos[atRank(rank, 1)] >= 0.5, meta.vocab[t]);
    for (const r of HINT_RANKS) assert.notEqual(atRank(rank, r), -1);
  }
});

test("heat follows rank", () => {
  assert.deepEqual([0, 1, 10, 11, 100, 101, 500, 501, 2000, 2001].map(heat), ["found", "burning", "burning", "hot", "hot", "warm", "warm", "cool", "cool", "cold"]);
});

test("points fall with guesses and hints, rise with the streak", () => {
  assert.equal(points(1, 0), 1000);
  assert.equal(points(11, 1), 500);
  assert.equal(points(100, 4), 100, "never below 100");
  assert.equal(points(1, 0, 9), 5000, "the streak caps at ×5");
});
