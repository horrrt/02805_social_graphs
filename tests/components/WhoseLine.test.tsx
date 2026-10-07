// Cold Read round 2's rules against its real word counts: every pair can deal
// a full hand of two words per kind, each kind sits where its name says on the
// Scattertext plot, and flukes really are carried by one page.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CARDS, deal, gain, judge, ratio, type WhoseLineData } from "@/features/cold-read/groups";

const data: WhoseLineData = JSON.parse(readFileSync(new URL("../../public/play/cold-read/data/whose_line.json", import.meta.url), "utf8"));

test("every pair deals two words of each kind", () => {
  assert.equal(data.groups.length, 8);
  for (const pair of data.pairs) {
    const hand = deal(pair);
    assert.equal(hand.length, CARDS);
    assert.equal(new Set(hand.map((c) => c.term.w)).size, CARDS);
    for (const kind of ["a", "b", "both", "fluke"]) assert.equal(hand.filter((c) => c.kind === kind).length, 2);
  }
});

test("each kind sits where it says on the plot", () => {
  for (const pair of data.pairs) {
    for (const t of pair.cards.a) assert.ok(Math.log2(ratio(t)) >= 1.5, t.w);
    for (const t of pair.cards.b) assert.ok(Math.log2(ratio(t)) <= -1.5, t.w);
    for (const t of pair.cards.both) assert.ok(Math.abs(Math.log2(ratio(t))) <= 0.4, t.w);
    for (const t of pair.cards.fluke) assert.ok(Math.abs(Math.log2(ratio(t))) >= 1.5 && t.share >= 0.6, t.w);
    for (const t of pair.cards.a.concat(pair.cards.b)) assert.ok(t.share < 0.6, t.w);
  }
});

test("a right call pays 100 times the streak, less an inspection", () => {
  assert.equal(gain(1, false), 100);
  assert.equal(gain(3, true), 250);
  assert.equal(gain(9, false), 500, "the streak caps at ×5");
  assert.equal(gain(1, true), 50);
});

test("calling a fluke's corner is half right, any other miss is wrong", () => {
  const fluke = data.pairs[0].cards.fluke[0];
  const corner = ratio(fluke) >= 1 ? "a" : "b";
  const other = corner === "a" ? "b" : "a";
  assert.equal(judge("fluke", "fluke", fluke), "right");
  assert.equal(judge("fluke", corner, fluke), "half");
  assert.equal(judge("fluke", other, fluke), "wrong");
  assert.equal(judge("fluke", "both", fluke), "wrong");
  const lean = data.pairs[0].cards.a[0];
  assert.equal(judge("a", "fluke", lean), "wrong");
});
