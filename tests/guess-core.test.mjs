// Pins the rules under the kit's GuessRanker (src/kit/guess-core.js): how a
// word is spent, how items rank, when a round is won and what it scores.
// Pure functions, so this runs in node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { addWord, isWin, left, points, ranking, scored, start } from "../src/kit/guess-core.js";

// A toy scorer: an item scores one point per word it lists.
const ITEMS = { wolverine: ["claws", "canada", "healing"], storm: ["weather", "africa"], thor: ["hammer", "weather"] };
const score = (words) => new Map(Object.entries(ITEMS).map(([k, ws]) => [k, words.filter((w) => ws.includes(w)).length]));
const opts = { score, target: "wolverine", banned: (w) => w === "logan" };

test("ranking orders by score, breaks ties by key, and takes a Map or an object", () => {
  const rows = ranking({ b: 1, a: 1, c: 3 });
  assert.deepEqual(rows.map((r) => [r.key, r.rank]), [["c", 1], ["a", 2], ["b", 3]]);
  assert.deepEqual(ranking(new Map([["x", 2], ["y", 5]]), 1), [{ key: "y", score: 5, rank: 1 }]);
  assert.deepEqual(ranking(null), []);
  assert.equal(ranking({ a: "n/a" })[0].score, 0, "a score that is not a number counts as 0");
});

test("a tie at the top is not a win, and neither is a score of 0", () => {
  assert.equal(isWin(ranking({ a: 2, b: 2 }), "a"), false);
  assert.equal(isWin(ranking({ a: 0 }), "a"), false);
  assert.equal(isWin(ranking({ a: 3, b: 2 }), "a"), true);
  assert.equal(isWin([], "a"), false);
});

test("addWord trims and lowercases, refuses empty and repeated words", () => {
  let s = start(3);
  assert.equal(addWord(s, "   ", opts).status, "empty");
  ({ state: s } = addWord(s, "  Weather ", opts));
  assert.deepEqual(scored(s), ["weather"]);
  const again = addWord(s, "WEATHER", opts);
  assert.equal(again.status, "repeat");
  assert.equal(again.state, s, "a refused word leaves the state as it was");
});

test("a banned word costs a word but is not scored", () => {
  const { state, status } = addWord(start(3), "Logan", opts);
  assert.equal(status, "banned");
  assert.equal(left(state), 2);
  assert.deepEqual(scored(state), []);
  assert.deepEqual(state.used, [{ word: "logan", banned: true }]);
});

test("the round is won when the target ranks first alone, and then takes no more words", () => {
  let s = start(4);
  ({ state: s } = addWord(s, "weather", opts));
  assert.equal(s.won, false);
  ({ state: s } = addWord(s, "claws", opts));
  assert.equal(s.won, false, "wolverine ties storm and thor at 1");
  ({ state: s } = addWord(s, "canada", opts));
  assert.equal(s.won, true);
  assert.equal(points(s), 2, "one word left, plus one");
  assert.equal(addWord(s, "healing", opts).status, "done");
});

test("a spent budget takes no more words and scores nothing", () => {
  let s = start(1);
  ({ state: s } = addWord(s, "hammer", opts));
  assert.equal(left(s), 0);
  assert.equal(addWord(s, "claws", opts).status, "done");
  assert.equal(points(s), 0);
});

test("a win on the last word scores 1", () => {
  const { state } = addWord(start(1), "claws", opts);
  assert.equal(state.won, true);
  assert.equal(points(state), 1);
});
