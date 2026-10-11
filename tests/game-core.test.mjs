// Pins the rules under the kit's games (src/kit/game-core.js): seeds, the
// best-score store when storage throws, the run reducer, and each game's
// logic on small graphs worked by hand. Pure functions, so this runs in node
// with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import * as G from "../src/kit/game-core.js";
import { louvain, modularity, mulberry32 } from "../src/kit/graph-core.js";

// A directed toy: 0 → 1 → 2 → 3 → 0 is a loop; 2 → 4 is a dead end; 1 → 5 → 3 a detour.
const N = 6;
const DIR = [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [1, 5], [5, 3]];

// Two triangles joined by one bridge, 2–3.
const BARBELL = [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [4, 5]];

test("seeds: the same text gives the same seed, and dailySeed reads only the date part", () => {
  assert.equal(G.hashSeed("abc"), G.hashSeed("abc"));
  assert.notEqual(G.hashSeed("abc"), G.hashSeed("abd"));
  assert.equal(G.dailySeed("2026-10-07"), G.dailySeed("2026-10-07T23:59:00Z"));
  assert.notEqual(G.dailySeed("2026-10-07"), G.dailySeed("2026-10-08"));
  const a = G.sample([1, 2, 3, 4, 5], 3, mulberry32(9));
  assert.deepEqual(a, G.sample([1, 2, 3, 4, 5], 3, mulberry32(9)));
  assert.equal(new Set(a).size, 3);
  assert.equal(G.pick([], mulberry32(1)), undefined);
});

test("the best-score store keeps the best, and survives a storage that throws or is missing", () => {
  const data = new Map();
  const ok = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  const s = G.bestStore(ok);
  assert.equal(s.get("a"), null);
  assert.deepEqual(s.record("a", 5), { best: 5, isNew: true });
  assert.deepEqual(s.record("a", 3), { best: 5, isNew: false });
  assert.deepEqual(s.record("low", 9, "lower"), { best: 9, isNew: true });
  assert.deepEqual(s.record("low", 4, "lower"), { best: 4, isNew: true });
  assert.equal(data.get("kit-game:a"), "5");

  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  for (const storage of [broken, null, undefined]) {
    const b = G.bestStore(storage);
    assert.equal(b.get("x"), null);
    assert.deepEqual(b.record("x", 2), { best: 2, isNew: true });
    assert.equal(b.get("x"), 2, "the memory copy stands in");
  }
  assert.equal(G.settingsKey("attack", { budget: 5, bots: "all" }), G.settingsKey("attack", { bots: "all", budget: 5 }));
});

test("the run goes idle → playing → reveal and refuses actions out of turn", () => {
  let r = G.runInit(4);
  assert.equal(G.runReducer(r, { type: "finish", score: 1 }), r);
  r = G.runReducer(r, { type: "start" });
  assert.equal(r.phase, "playing");
  assert.equal(G.runReducer(r, { type: "start" }), r);
  r = G.runReducer(r, { type: "finish", score: 7 });
  assert.deepEqual([r.phase, r.score], ["reveal", 7]);
  const again = G.runReducer(r, { type: "again" });
  assert.deepEqual([again.phase, again.seed, again.runs], ["playing", 5, 2]);
  assert.equal(G.runReducer(r, { type: "again", seed: 4 }).seed, 4, "the daily seed replays");
  assert.equal(G.runReducer(r, { type: "replay" }).phase, "idle");
  assert.equal(G.runReducer(G.runReducer(G.runInit(), { type: "start", seed: 42 }), { type: "replay" }).seed, 42);
});

test("path quest: directed distances, par and a target with a way back", () => {
  assert.deepEqual(G.distancesOut(N, DIR, 0), [0, 1, 2, 3, 3, 2]);
  assert.equal(G.par(N, DIR, 0, 2), 2 + 2);
  assert.equal(G.par(N, DIR, 0, 4), null, "4 is a dead end: no path back");
  for (let s = 1; s < 20; s++) {
    const t = G.pickTarget(N, DIR, 0, [3, 3], mulberry32(s));
    assert.equal(t, 3, "4 is also 3 out, but has no path back");
  }
  assert.equal(G.pickTarget(N, DIR, 4, [1, 5], mulberry32(1)), null, "nothing leaves 4");
  assert.equal(G.pickTarget(N, DIR, 0, [9, 12], mulberry32(1)), null, "an empty band");
});

test("path quest: moves, fog, phases outbound → return → done", () => {
  let q = G.questInit(N, DIR, 0, 2);
  assert.deepEqual(G.exits(q), [1]);
  assert.deepEqual([...G.revealed(q)].sort(), [0, 1]);
  assert.equal(G.questMove(q, 3), q, "not an exit");
  q = G.questMove(q, 1);
  q = G.questMove(q, 2);
  assert.equal(q.phase, "return");
  assert.equal(q.turn, 2);
  assert.deepEqual(G.exits(q), [3, 4]);
  q = G.questMove(q, 3);
  q = G.questMove(q, 0);
  assert.equal(q.phase, "done");
  assert.equal(G.questSteps(q), 4);
  assert.equal(G.questMove(q, 1), q, "a finished quest takes no more moves");
  assert.equal(G.questInit(N, DIR, 0, null).phase, "done", "no target: nothing to play");
});

test("path quest: a hint takes the next shortest step and costs steps; undo costs too and never crosses the turn", () => {
  let q = G.questInit(N, DIR, 0, 3);
  q = G.questMove(q, 1);
  assert.ok([2, 5].includes(G.nextStep(q)));
  const hinted = G.questHint(q);
  assert.equal(hinted.hints, 1);
  assert.equal(G.questSteps(hinted), 2 + G.HINT_COST);
  const undone = G.questUndo(hinted);
  assert.deepEqual(undone.path, [0, 1]);
  assert.equal(G.questSteps(undone), 2 + G.HINT_COST + G.UNDO_COST, "the undone step still counts");
  assert.equal(G.questUndo(G.questInit(N, DIR, 0, 3)).undos, 0, "nothing to undo at home");
  // Stuck on the dead end: no hint leads on, but undo does.
  let stuck = G.questInit(N, DIR, 0, 3);
  for (const v of [1, 2, 4]) stuck = G.questMove(stuck, v);
  assert.equal(G.nextStep(stuck), null);
  assert.equal(G.questHint(stuck), stuck);
  assert.deepEqual(G.questUndo(stuck).path, [0, 1, 2]);
  // At the target the undo would cross the turn.
  let turned = G.questInit(N, DIR, 0, 1);
  turned = G.questMove(turned, 1);
  assert.equal(G.questUndo(turned), turned);
  assert.deepEqual(G.shortestRoute(N, DIR, 0, 3), [0, 1, 2, 3]);
  assert.equal(G.shortestRoute(N, DIR, 4, 0), null);
});

test("attack: the core after removals, cut-off nodes and the curve", () => {
  assert.deepEqual(G.coreAfter(6, BARBELL), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(G.coreAfter(6, BARBELL, [2]), [3, 4, 5]);
  assert.deepEqual(G.cutOff(6, BARBELL, [2]), [0, 1]);
  assert.deepEqual(G.coreAfter(4, [], []), [0], "no links: the core is one node, the smallest id");
  assert.deepEqual(G.coreAfter(2, [[0, 1]], [0, 1]), [], "everyone removed");
  assert.deepEqual(G.coreCurve(6, BARBELL, [2, 3]), [6, 3, 2]);
});

test("attack: a budget larger than the graph is clamped, and the bots run deterministically", () => {
  assert.equal(G.clampBudget(6, 8), 6);
  assert.equal(G.clampBudget(0, 3), 0);
  assert.deepEqual(G.botHits(6, BARBELL, 1, "degree"), [2], "2 and 3 tie at degree 3; the smaller id goes");
  assert.deepEqual(G.botHits(6, BARBELL, 1, "betweenness"), [2]);
  const all = G.botHits(6, BARBELL, 99, "degree");
  assert.equal(all.length, 6);
  assert.deepEqual([...all].sort(), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(G.botHits(6, BARBELL, 3, "random", mulberry32(5)), G.botHits(6, BARBELL, 3, "random", mulberry32(5)));
  assert.equal(G.botHits(6, BARBELL, 3, "random", mulberry32(5)).length, 3);
  // Adaptive: once the star's hub goes its leaves have degree 0, so the next hit is in the pair 4–5.
  const star = [[0, 1], [0, 2], [0, 3], [4, 5]];
  assert.deepEqual(G.botHits(6, star, 2, "degree"), [0, 4]);
});

test("attack: the hint is the hit that shrinks the core most", () => {
  assert.equal(G.bestHit(6, BARBELL), 2);
  assert.equal(G.bestHit(6, BARBELL, [2]), 3);
  assert.equal(G.bestHit(2, [[0, 1]], [0, 1]), -1);
  const ranks = G.rankRuns({ you: 3, degree: 3, random: 5, betweenness: 2 });
  assert.deepEqual(ranks.map((r) => [r.key, r.rank]), [["betweenness", 1], ["you", 2], ["degree", 2], ["random", 4]]);
});

test("seating: a table's score is L_in − (Σk)²/4m and sums to Q·m over a partition", () => {
  // Triangle 0,1,2: L_in 3, Σk = 2+2+3 = 7, m = 7 → 3 − 49/28.
  assert.ok(Math.abs(G.tableScore(6, BARBELL, [0, 1, 2]) - (3 - 49 / 28)) < 1e-12);
  const q = modularity(BARBELL, [0, 0, 0, 1, 1, 1]);
  const sum = G.tableScore(6, BARBELL, [0, 1, 2]) + G.tableScore(6, BARBELL, [3, 4, 5]);
  assert.ok(Math.abs(sum / BARBELL.length - q) < 1e-12);
  assert.ok(Math.abs(G.partitionQ(BARBELL, [0, 0, 0, 1, 1, 1]) - q) < 1e-12);
  assert.equal(G.tableScore(3, [], [0, 1]), 0, "no links, no score");
  assert.ok(Math.abs(G.seatDelta(6, BARBELL, [0, 1], 2) - (G.tableScore(6, BARBELL, [0, 1, 2]) - G.tableScore(6, BARBELL, [0, 1]))) < 1e-12);
});

test("seating: candidates, the greedy, random and best hosts", () => {
  assert.deepEqual(G.candidates(6, BARBELL, [0]), [1, 2]);
  assert.deepEqual(G.candidates(4, [[0, 1]], [2]), [0, 1, 3], "nobody linked: anyone not seated");
  assert.deepEqual(G.greedyTable(6, BARBELL, 0, 2), [0, 1, 2]);
  assert.deepEqual(G.greedyTable(2, [[0, 1]], 0, 5), [0, 1], "a table larger than the room seats everyone");
  const r = G.randomTable(6, BARBELL, 0, 2, mulberry32(3));
  assert.equal(r.length, 3);
  assert.deepEqual(r, G.randomTable(6, BARBELL, 0, 2, mulberry32(3)));
  const best = G.bestTable(6, BARBELL, 0, 2);
  assert.ok(G.tableScore(6, BARBELL, best) >= G.tableScore(6, BARBELL, G.greedyTable(6, BARBELL, 0, 2)) - 1e-12);
});

test("seating: place cards seat the room by label propagation; a node no card reaches sits alone", () => {
  const seats = G.seatFromCards(6, BARBELL, { 0: "a", 5: "b" }, mulberry32(1));
  assert.deepEqual(seats, [0, 0, 0, 1, 1, 1]);
  // 6 and 7 are linked only to each other, so no card reaches them.
  const island = G.seatFromCards(8, [...BARBELL, [6, 7]], { 0: "a" }, mulberry32(1));
  assert.equal(new Set(island.slice(0, 6)).size, 1);
  assert.notEqual(island[6], island[0]);
  assert.notEqual(island[6], island[7], "each unreached node at a table of its own");
  // The empty room: no cards at all, everyone alone.
  assert.deepEqual(G.seatFromCards(3, [[0, 1], [1, 2]], {}, mulberry32(1)), [0, 1, 2]);
  assert.deepEqual(G.seatFromCards(0, [], {}, mulberry32(1)), []);
});

test("seating: reference partitions, NMI and disagreements", () => {
  assert.deepEqual(G.greedyModularity(6, BARBELL), [0, 0, 0, 1, 1, 1]);
  assert.deepEqual(G.louvainSeating(6, BARBELL, mulberry32(2)), louvain(BARBELL, mulberry32(2), { n: 6 }).partition);
  assert.deepEqual(G.louvainSeating(0, [], mulberry32(2)), []);
  const rp = G.randomPartition(6, 2, mulberry32(4));
  assert.equal(rp.length, 6);
  assert.ok(rp.every((c) => c === 0 || c === 1));
  assert.equal(G.nmi([0, 0, 1, 1], [5, 5, 9, 9]), 1, "the same split under other labels");
  assert.ok(Math.abs(G.nmi([0, 0, 1, 1], [0, 1, 0, 1])) < 1e-12, "independent splits share nothing");
  assert.equal(G.nmi([0, 0], [0, 0]), 1);
  assert.equal(G.nmi([], []), 1);
  assert.deepEqual(G.disagreements([0, 0, 0, 1, 1, 1], [0, 0, 1, 1, 1, 1]), [2]);
  assert.deepEqual(G.disagreements([3, 3, 7, 7], [0, 0, 1, 1]), []);
});

test("quiz: fewer clues score more, the machine commits at 2× the runner-up, forced at the last clue", () => {
  assert.equal(G.cluePoints(1, 6, true), 6);
  assert.equal(G.cluePoints(6, 6, true), 1);
  assert.equal(G.cluePoints(9, 6, true), 1, "never below 1 when right");
  assert.equal(G.cluePoints(2, 6, false), 0);
  const bags = { cat: { claws: 2, fur: 2 }, dog: { fur: 3, bark: 1 }, owl: { feathers: 4 } };
  assert.deepEqual(G.clueScores(["fur"], bags), { cat: 0.5, dog: 0.75, owl: 0 });
  // After clue 1 cat leads alone, but the machine waits for two clues.
  const rows = [{ cat: 1, dog: 0 }, { cat: 0.6, dog: 0.4 }, { cat: 0.9, dog: 0.4 }, { cat: 1, dog: 0.5 }];
  assert.deepEqual(G.machineCommit(rows, 4), { clue: 3, pick: "cat", forced: false });
  assert.deepEqual(G.machineCommit([{ a: 1, b: 1 }, { a: 1, b: 1 }, { a: 1, b: 1 }], 3), { clue: 3, pick: "a", forced: true }, "a tie to the end: forced, the smaller key");
  assert.deepEqual(G.machineCommit([{ solo: 0.2 }, { solo: 0.3 }], 2), { clue: 2, pick: "solo", forced: false }, "a lone suspect: the runner-up is 0");
  assert.deepEqual(G.machineCommit([{ solo: 0 }, { solo: 0 }], 2), { clue: 2, pick: "solo", forced: true }, "a score of 0 never commits early");
  assert.deepEqual(G.machineCommit([{ a: 1 }], 1), { clue: 1, pick: "a", forced: true }, "one clue in all: forced at it");
});

test("quiz: cases are dealt by seed, and the streak breaks on a wrong answer", () => {
  const pool = ["a", "b", "c"];
  const d = G.dealCases(pool, 5, mulberry32(8));
  assert.equal(d.length, 5);
  assert.deepEqual(d, G.dealCases(pool, 5, mulberry32(8)));
  assert.deepEqual([...d.slice(0, 3)].sort(), pool, "the first pass deals each once");
  assert.deepEqual(G.dealCases([], 3, mulberry32(1)), []);
  let t = G.quizInit();
  t = G.quizAnswer(t, true, 4);
  t = G.quizAnswer(t, true, 2);
  t = G.quizAnswer(t, false);
  t = G.quizAnswer(t, true);
  assert.deepEqual(t, { score: 7, streak: 1, longest: 2, answered: 4, right: 3 });
});
