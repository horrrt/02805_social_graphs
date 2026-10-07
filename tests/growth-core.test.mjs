// Pins the numbers under the kit's growth pieces (src/kit/growth-core.js):
// the spiral, degrees at time t, the top k, the hub's share, the α sweep, the
// component split and the friendship-paradox sampler. Pure functions, so this
// runs in node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { ba, mulberry32 } from "../src/kit/graph-core.js";
import {
  clampAlpha, degreeShares, degreesAt, edgesAt, hubStats, orderOf, rankBy, regime, sampleMany, samplePair, spiralLayout, spiralPosition,
  splitComponents, sweepHubShare, sweepPoint, topK,
} from "../src/kit/growth-core.js";

const near = (a, b, eps = 1e-12) => Math.abs(a - b) <= eps;

test("the spiral puts the first arrival at the centre and the last on the rim", () => {
  assert.deepEqual(spiralPosition(0, 100), [0.5, 0.5]);
  assert.deepEqual(spiralPosition(0, 1), [0.5, 0.5]);
  const [x, y] = spiralPosition(99, 100);
  assert.ok(near(Math.hypot(x - 0.5, y - 0.5), 0.46));
  const radii = spiralLayout(50).map(([px, py]) => Math.hypot(px - 0.5, py - 0.5));
  for (let i = 1; i < radii.length; i++) assert.ok(radii[i] > radii[i - 1], "later arrivals sit further out");
  for (const [px, py] of spiralLayout(300)) assert.ok(px >= 0 && px <= 1 && py >= 0 && py <= 1);
  assert.deepEqual(spiralPosition(7, 40), spiralPosition(7, 40), "a position depends only on rank and total");
});

test("rankBy orders by value, ties in node order, and orderOf inverts it", () => {
  const rank = rankBy([1962, 1939, 1962, 1941]);
  assert.deepEqual(rank, [2, 0, 3, 1]);
  assert.deepEqual(orderOf(rank), [1, 3, 0, 2]);
  assert.deepEqual(rankBy([]), []);
});

test("an edge counts at time t only once both ends have arrived", () => {
  const edges = [[0, 1], [1, 2], [0, 2], [2, 3]];
  assert.deepEqual(degreesAt(4, edges, null, 0), [0, 0, 0, 0]);
  assert.deepEqual(degreesAt(4, edges, null, 2), [1, 1, 0, 0]);
  assert.deepEqual(degreesAt(4, edges, null, 3), [2, 2, 2, 0]);
  assert.deepEqual(degreesAt(4, edges, null, 4), [2, 2, 3, 1]);
  // With node 3 arriving first, the edge 2–3 turns on as soon as 2 arrives.
  const rank = [1, 2, 3, 0];
  assert.deepEqual(degreesAt(4, edges, rank, 2), [0, 0, 0, 0]);
  assert.deepEqual(degreesAt(4, edges, rank, 4), [2, 2, 3, 1]);
  assert.deepEqual(edgesAt(edges, null, 3), [[0, 1], [1, 2], [0, 2]]);
  assert.deepEqual(degreesAt(2, [[1, 1]], null, 2), [0, 1], "a self-loop counts once");
});

test("topK sorts by links, ties to the earlier arrival, among the arrived", () => {
  const deg = [3, 5, 5, 1, 9];
  assert.deepEqual(topK(deg, 3).map((r) => r.node), [4, 1, 2]);
  assert.deepEqual(topK(deg, 3, [4, 3, 2, 1, 0]).map((r) => r.node), [4, 2, 1], "the tie goes to who came first");
  assert.deepEqual(topK(deg, 10, null, 3).map((r) => r.node), [1, 2, 0], "node 3 and 4 have not arrived");
  assert.deepEqual(topK(deg, 0), []);
  assert.deepEqual(topK([], 3), []);
});

test("the hub's share is its links over all links", () => {
  assert.deepEqual(hubStats([3, 1, 1, 1], 3), { hub: 0, k: 3, share: 1, arrival: 1 }, "a star's centre holds every link");
  const four = hubStats([3, 3, 3, 3], 6);
  assert.equal(four.share, 0.5);
  assert.equal(four.arrival, 1);
  assert.deepEqual(hubStats([0, 0], 0), { hub: 0, k: 0, share: 0, arrival: 1 }, "no links, no NaN");
  assert.deepEqual(hubStats([], 0), { hub: -1, k: 0, share: 0, arrival: 0 });
});

test("α is clamped to 0 … 50 and sorted into three regimes", () => {
  assert.equal(clampAlpha(-1), 0);
  assert.equal(clampAlpha(1e6), 50);
  assert.equal(clampAlpha(NaN), 1);
  assert.deepEqual([0.5, 1, 1.5].map((a) => regime(a)), ["sub", "linear", "super"]);
});

test("a very large α lets one early node take nearly every link", () => {
  const g = ba(300, 2, { alpha: clampAlpha(1e6) }, mulberry32(4));
  const h = hubStats(g.degree, g.edges.length);
  assert.ok(h.share > 0.45, `share ${h.share}`);
  assert.ok(h.arrival <= 3, "the hub is one of the seed clique");
  assert.ok(Number.isFinite(h.share));
});

test("the sweep is seeded and the hub's share grows across the three regimes", () => {
  const opts = { alphas: [0, 1, 2], ns: [200, 400], m: 2, seed: 3, runs: 2 };
  const a = sweepHubShare(opts);
  assert.deepEqual(a, sweepHubShare(opts), "same seed, same curve");
  assert.deepEqual(a.map((c) => c.n), [200, 400]);
  for (const { points } of a) {
    const [s0, s1, s2] = points.map((p) => p[1]);
    assert.ok(s0 < s1 && s1 < s2, `shares ${s0} < ${s1} < ${s2}`);
    assert.ok(s2 > 0.3, "super-linear: a winner takes a fixed share");
  }
  // Linear attachment: the share falls as n grows; super-linear keeps it.
  assert.ok(a[1].points[1][1] < a[0].points[1][1]);
  assert.equal(sweepPoint(1, 200, 2, 3, 2), a[0].points[1][1], "a point on its own matches the curve");
});

test("splitComponents lists components largest first with local edges", () => {
  const parts = splitComponents(7, [[0, 1], [1, 2], [4, 5]]);
  assert.deepEqual(parts.map((p) => p.nodes), [[0, 1, 2], [4, 5], [3], [6]]);
  assert.deepEqual(parts[1].edges, [[0, 1]]);
  assert.deepEqual(splitComponents(0, []), []);
  const groups = splitComponents(5, [[0, 1], [1, 2], [3, 4]], [[2, 1, 1], [4, 9], []]);
  assert.deepEqual(groups.map((g) => g.nodes), [[1, 2], [4], []]);
  assert.deepEqual(groups[0].edges, [[0, 1]]);
});

test("a friend has at least as many links as the person, on average", () => {
  // A star: every leaf's friend is the centre.
  const star = Array.from({ length: 9 }, (_, i) => [0, i + 1]);
  const s = sampleMany(10, star, 2000, mulberry32(1));
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(mean(s.friend) > mean(s.person));
  const g = ba(400, 2, {}, mulberry32(2));
  const b = sampleMany(400, g.edges, 3000, mulberry32(5));
  assert.equal(b.person.length, 3000);
  assert.ok(mean(b.friend) > 1.5 * mean(b.person), `friend ${mean(b.friend)} vs person ${mean(b.person)}`);
  assert.deepEqual(sampleMany(400, g.edges, 50, mulberry32(5)), sampleMany(400, g.edges, 50, mulberry32(5)), "seeded");
});

test("isolates are never drawn, and a network with no links gives nothing", () => {
  const adj = [[1], [0], []];
  for (let i = 0; i < 50; i++) assert.notEqual(samplePair(adj, mulberry32(i)).person, 2);
  assert.equal(samplePair([[], []], mulberry32(1)), null);
  assert.deepEqual(sampleMany(3, [], 10, mulberry32(1)), { person: [], friend: [], last: null });
});

test("degreeShares bins each k up to a cap that holds the rest", () => {
  assert.deepEqual(degreeShares([0, 1, 1, 5, 9], 3), [[0, 0.2], [1, 0.4], [2, 0], [3, 0.4]]);
  assert.deepEqual(degreeShares([], 2), [[0, 0], [1, 0], [2, 0]]);
});
