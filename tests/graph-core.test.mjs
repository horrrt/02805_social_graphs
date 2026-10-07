// Pins the network models and measures under the kit's network explorables
// (src/kit/graph-core.js). The expected centralities, clustering and
// modularity are networkx 3.6.1's on the Krackhardt kite and Zachary's karate
// club (nx.krackhardt_kite_graph(), nx.karate_club_graph() unweighted),
// rounded to 10 places. Pure functions, so this runs in node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import * as G from "../src/kit/graph-core.js";

const KITE = [[0, 1], [0, 2], [0, 3], [0, 5], [1, 3], [1, 4], [1, 6], [2, 3], [2, 5], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [5, 7], [6, 7], [7, 8], [8, 9]];
const KARATE = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 10], [0, 11], [0, 12], [0, 13], [0, 17], [0, 19], [0, 21], [0, 31],
  [1, 2], [1, 3], [1, 7], [1, 13], [1, 17], [1, 19], [1, 21], [1, 30], [2, 3], [2, 7], [2, 8], [2, 9], [2, 13], [2, 27], [2, 28], [2, 32],
  [3, 7], [3, 12], [3, 13], [4, 6], [4, 10], [5, 6], [5, 10], [5, 16], [6, 16], [8, 30], [8, 32], [8, 33], [9, 33], [13, 33], [14, 32],
  [14, 33], [15, 32], [15, 33], [18, 32], [18, 33], [19, 33], [20, 32], [20, 33], [22, 32], [22, 33], [23, 25], [23, 27], [23, 29],
  [23, 32], [23, 33], [24, 25], [24, 27], [24, 31], [25, 31], [26, 29], [26, 33], [27, 33], [28, 31], [28, 33], [29, 32], [29, 33],
  [30, 32], [30, 33], [31, 32], [31, 33], [32, 33],
];
// The club each member joined after the split: 0 Mr. Hi, 1 Officer.
const CLUB = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

const close = (actual, expected, tol = 1e-8, what = "") => {
  assert.equal(actual.length, expected.length, `${what} length`);
  actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < tol, `${what}[${i}]: ${v} vs ${expected[i]}`));
};
const keyOf = ([a, b]) => (a < b ? `${a},${b}` : `${b},${a}`);
const edgeSet = (edges) => new Set(edges.map(keyOf));

test("mulberry32 repeats under a seed and differs across seeds", () => {
  const a = G.mulberry32(42);
  const b = G.mulberry32(42);
  const xs = Array.from({ length: 5 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 5 }, () => b()));
  assert.notDeepEqual(xs, Array.from({ length: 5 }, G.mulberry32(43)));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
});

test("centralities on the Krackhardt kite match networkx", () => {
  const n = 10;
  close(G.degreeCentrality(n, KITE), [0.4444444444, 0.4444444444, 0.3333333333, 0.6666666667, 0.3333333333, 0.5555555556, 0.5555555556, 0.3333333333, 0.2222222222, 0.1111111111], 1e-9, "degree");
  close(G.closeness(n, KITE), [0.5294117647, 0.5294117647, 0.5, 0.6, 0.5, 0.6428571429, 0.6428571429, 0.6, 0.4285714286, 0.3103448276], 1e-9, "closeness");
  close(G.harmonic(n, KITE), [6.0833333333, 6.0833333333, 5.5833333333, 7.0833333333, 5.5833333333, 6.8333333333, 6.8333333333, 6, 4.6666666667, 3.4166666667], 1e-9, "harmonic");
  close(G.betweenness(n, KITE), [0.0231481481, 0.0231481481, 0, 0.1018518519, 0, 0.2314814815, 0.2314814815, 0.3888888889, 0.2222222222, 0], 1e-9, "betweenness");
  close(G.edgeBetweenness(n, KITE), [0.0592592593, 0.0333333333, 0.0407407407, 0.1037037037, 0.0407407407, 0.0333333333, 0.1037037037, 0.0666666667, 0.1, 0.0666666667, 0.0740740741, 0.0740740741, 0.1, 0.0592592593, 0.2333333333, 0.2333333333, 0.3555555556, 0.2], 1e-9, "edge betweenness");
  close(G.eigenvector(n, KITE), [0.3522093968, 0.3522093968, 0.2858349914, 0.4810208583, 0.2858349914, 0.3976906365, 0.3976906365, 0.195860583, 0.048073485, 0.0111632553], 1e-7, "eigenvector");
  close(G.pagerank(n, KITE), [0.101919913, 0.101919913, 0.079418114, 0.1471479163, 0.079418114, 0.1289069276, 0.1289069276, 0.0952482868, 0.0856939563, 0.0514199314], 1e-8, "pagerank");
  // By hand: Heather (7) lies on every shortest path between the kite's tail and its body.
  assert.equal(G.betweenness(n, KITE).indexOf(Math.max(...G.betweenness(n, KITE))), 7);
  // Unnormalised betweenness counts pairs: Heather's 0.3888… × 36 pairs = 14.
  assert.ok(Math.abs(G.betweenness(n, KITE, false)[7] - 14) < 1e-9);
});

test("clustering on the kite and the club matches networkx", () => {
  close(G.localClustering(10, KITE), [0.6666666667, 0.6666666667, 1, 0.5333333333, 1, 0.5, 0.5, 0.3333333333, 0, 0], 1e-9, "clustering");
  assert.ok(Math.abs(G.transitivity(10, KITE) - 0.5789473684) < 1e-9);
  assert.ok(Math.abs(G.transitivity(34, KARATE) - 0.2556818182) < 1e-9);
  assert.equal(G.transitivity(3, [[0, 1], [1, 2]]), 0, "a path has triples but no triangle");
  assert.equal(G.transitivity(2, []), 0, "no triples");
});

test("karate club spot checks against networkx", () => {
  assert.ok(Math.abs(G.betweenness(34, KARATE)[0] - 0.4376352814) < 1e-9);
  assert.ok(Math.abs(G.pagerank(34, KARATE)[0] - 0.0969972854) < 1e-8);
  const eb = G.edgeBetweenness(34, KARATE);
  assert.ok(Math.abs(eb[0] - 0.0252525253) < 1e-9, "edge 0-1");
});

test("closeness uses the Wasserman–Faust correction on a disconnected graph", () => {
  close(G.closeness(6, [[0, 1], [1, 2], [3, 4]]), [0.2666666667, 0.4, 0.2666666667, 0.2, 0.2, 0], 1e-9, "closeness");
});

test("directed PageRank spreads a dangling node's rank over every node", () => {
  const pr = G.pagerank(4, [[0, 1], [1, 2], [2, 0], [2, 3]], { directed: true });
  close(pr, [0.2137621541, 0.2646222887, 0.3078534031, 0.2137621541], 1e-8, "pagerank");
  assert.ok(Math.abs(pr.reduce((a, b) => a + b) - 1) < 1e-12);
  assert.deepEqual(G.pagerank(0, []), []);
});

test("modularity of the club split matches networkx, and of one community is 0", () => {
  assert.ok(Math.abs(G.modularity(KARATE, CLUB) - 0.358234714) < 1e-9);
  assert.ok(Math.abs(G.modularity(KARATE, new Array(34).fill(0))) < 1e-12);
  assert.equal(G.modularity([], []), 0);
  // A weighted self-loop: two nodes, each community holding half the weight.
  assert.ok(Math.abs(G.modularity([[0, 0, 1], [1, 1, 1]], [0, 1]) - 0.5) < 1e-12);
});

test("Louvain never lowers Q per move, ends near networkx's 0.419 on the club, and repeats under a seed", () => {
  let s = G.louvainInit(KARATE, { rng: G.mulberry32(3) });
  assert.equal(s.phase, "move");
  assert.equal(new Set(G.louvainPartition(s)).size, 34, "every node starts alone");
  let q = s.q;
  let steps = 0;
  while (s.phase === "move") {
    s = G.stepMove(s);
    assert.ok(s.q >= q - 1e-12, `Q fell from ${q} to ${s.q}`);
    if (s.last) assert.ok(s.last.gain > 0, "a move gains");
    q = s.q;
    steps += 1;
  }
  assert.ok(steps > 10);
  assert.equal(s.phase, "aggregate");
  const run = G.louvain(KARATE, G.mulberry32(3));
  assert.ok(run.q >= 0.4 && run.q <= 0.4199, `Q ${run.q}`);
  assert.ok(Math.abs(run.q - G.modularity(KARATE, run.partition)) < 1e-12);
  assert.deepEqual(run, G.louvain(KARATE, G.mulberry32(3)));
  // Without an rng the visiting order is the id order: still deterministic.
  assert.deepEqual(G.louvain(KARATE), G.louvain(KARATE));
});

test("a Louvain sweep visits each node once, and aggregate collapses the level", () => {
  const s0 = G.louvainInit(KARATE);
  const s1 = G.sweep(s0);
  assert.equal(s1.sweeps, 1);
  assert.equal(s1.cursor, 0);
  const a = G.aggregate(s1);
  assert.equal(a.level, 1);
  assert.ok(a.g.n < 34);
  assert.ok(Math.abs(a.q - G.modularity(KARATE, G.louvainPartition(a))) < 1e-12, "Q carries across the collapse");
  let s = a;
  while (s.phase !== "done") s = G.aggregate(s);
  assert.equal(G.stepMove(s), s, "a finished run stays put");
});

test("label propagation finds communities and repeats under a seed", () => {
  const labels = G.labelPropagation(34, KARATE, G.mulberry32(9));
  assert.equal(labels.length, 34);
  assert.ok(new Set(labels).size >= 1 && new Set(labels).size < 34);
  assert.deepEqual(labels, G.labelPropagation(34, KARATE, G.mulberry32(9)));
  // Two triangles joined by nothing stay two communities.
  const two = G.labelPropagation(6, [[0, 1], [1, 2], [0, 2], [3, 4], [4, 5], [3, 5]], G.mulberry32(1));
  assert.deepEqual(two, [0, 0, 0, 1, 1, 1]);
});

test("BFS layers by hop count, follows direction, and marks the unreachable", () => {
  const ring = G.toAdj(6, G.ringLattice(6, 2)).out;
  const { dist, layers, parent } = G.bfsLayers(ring, 0);
  assert.deepEqual(dist, [0, 1, 2, 3, 2, 1]);
  assert.deepEqual(layers.map((l) => [...l].sort()), [[0], [1, 5], [2, 4], [3]]);
  assert.equal(parent[0], -1);
  assert.equal(dist[parent[3]], 2);
  const chain = G.toAdj(3, [[0, 1], [1, 2]], true);
  assert.deepEqual(G.bfsLayers(chain, 1, "out").dist, [-1, 0, 1]);
  assert.deepEqual(G.bfsLayers(chain, 1, "in").dist, [1, 0, -1]);
  assert.deepEqual(G.bfsLayers(chain, 1, "any").dist, [1, 0, 1]);
  assert.deepEqual(G.bfsLayers(chain, 7).layers, [], "a start off the graph reaches nothing");
});

test("components are numbered by size and giant returns the largest", () => {
  const { comp, sizes } = G.components(7, [[0, 1], [2, 3], [3, 4], [4, 2]]);
  assert.deepEqual(sizes, [3, 2, 1, 1]);
  assert.deepEqual(comp, [1, 1, 0, 0, 0, 2, 3]);
  assert.deepEqual(G.giant(7, [[0, 1], [2, 3], [3, 4]]), [2, 3, 4]);
  assert.deepEqual(G.giant(0, []), []);
});

test("random graphs: G(n,p) and G(n,m) have the right shape and repeat under a seed", () => {
  assert.equal(G.gnp(10, 1, G.mulberry32(1)).length, 45);
  assert.equal(G.gnp(10, 0, G.mulberry32(1)).length, 0);
  const m = G.gnm(30, 40, G.mulberry32(5));
  assert.equal(m.length, 40);
  assert.equal(edgeSet(m).size, 40, "no repeated edge");
  assert.ok(m.every(([a, b]) => a < b));
  assert.deepEqual(m, G.gnm(30, 40, G.mulberry32(5)));
  assert.notDeepEqual(m, G.gnm(30, 40, G.mulberry32(6)));
  assert.equal(G.gnm(4, 100, G.mulberry32(1)).length, 6, "capped at every pair");
});

test("preferential attachment grows by m links per newcomer and repeats under a seed", () => {
  const g = G.ba(200, 2, { alpha: 1 }, G.mulberry32(11));
  assert.equal(g.n, 200);
  assert.equal(g.edges.length, 3 + 2 * 197);
  assert.equal(edgeSet(g.edges).size, g.edges.length, "no repeated edge");
  assert.deepEqual(g.degree, G.degrees(200, g.edges));
  assert.deepEqual(g.born.slice(0, 5), [0, 0, 0, 1, 1]);
  assert.ok(g.edges.slice(3).every(([a, b], i) => a > b && g.born[i + 3] === a - 2), "edge [newcomer, older] born at the newcomer's step");
  assert.deepEqual(g, G.ba(200, 2, { alpha: 1 }, G.mulberry32(11)));
  // Superlinear attachment concentrates links: the top hub takes more.
  const hub = (alpha) => Math.max(...G.ba(300, 1, { alpha }, G.mulberry32(4)).degree);
  assert.ok(hub(1.5) > hub(0), `${hub(1.5)} vs ${hub(0)}`);
  // baStep leaves the state it was given alone.
  const s = G.baInit(1);
  const before = JSON.stringify(s);
  G.baStep(s, G.mulberry32(1));
  assert.equal(JSON.stringify(s), before);
});

test("rings and rewiring: lattice, Watts–Strogatz and shortcuts", () => {
  const ring = G.ringLattice(10, 4);
  assert.equal(ring.length, 20);
  assert.ok(G.degrees(10, ring).every((k) => k === 4));
  const ws0 = G.wattsStrogatz(20, 4, 0, G.mulberry32(2));
  assert.deepEqual(ws0.edges, G.ringLattice(20, 4));
  assert.ok(ws0.rewired.every((r) => !r));
  const lo = G.wattsStrogatz(40, 4, 0.2, G.mulberry32(2));
  const hi = G.wattsStrogatz(40, 4, 0.6, G.mulberry32(2));
  assert.equal(lo.edges.length, 80);
  assert.equal(edgeSet(hi.edges).size, 80, "no repeated edge");
  assert.ok(hi.edges.every(([a, b]) => a !== b), "no self-loop");
  lo.rewired.forEach((r, i) => r && assert.ok(hi.rewired[i], `edge ${i} rewired at 0.2 but not 0.6`));
  assert.deepEqual(hi, G.wattsStrogatz(40, 4, 0.6, G.mulberry32(2)));
  // Shortcuts: the graph at s + 1 is the graph at s plus one link.
  const sets = [0, 1, 2, 5, 10].map((s) => G.ringPlusShortcuts(30, 2, s, G.mulberry32(8)));
  sets.forEach((g, i) => {
    assert.equal(g.edges.length, 30 + [0, 1, 2, 5, 10][i]);
    if (i) assert.deepEqual(g.edges.slice(0, sets[i - 1].edges.length), sets[i - 1].edges);
  });
  assert.equal(sets[4].shortcut.filter(Boolean).length, 10);
});

test("degree-preserving swaps keep every degree and make no loops or repeats", () => {
  const swapped = G.degreePreservingSwaps(KARATE, 200, G.mulberry32(6));
  assert.deepEqual(G.degrees(34, swapped), G.degrees(34, KARATE));
  assert.equal(edgeSet(swapped).size, KARATE.length);
  assert.ok(swapped.every(([a, b]) => a !== b));
  assert.notDeepEqual(edgeSet(swapped), edgeSet(KARATE));
  assert.deepEqual(swapped, G.degreePreservingSwaps(KARATE, 200, G.mulberry32(6)));
  // A star cannot swap: it comes back as it went in.
  const star = [[0, 1], [0, 2], [0, 3]];
  assert.deepEqual(G.degreePreservingSwaps(star, 5, G.mulberry32(1)), star);
});

test("a planted clique is a clique, and the rest is G(n, p)", () => {
  const { edges, clique } = G.plantedClique(40, 0.05, 7, G.mulberry32(12));
  assert.equal(clique.length, 7);
  const set = edgeSet(edges);
  for (let i = 0; i < clique.length; i++) for (let j = i + 1; j < clique.length; j++) assert.ok(set.has(keyOf([clique[i], clique[j]])));
  assert.equal(set.size, edges.length);
  assert.deepEqual(G.plantedClique(40, 0.05, 7, G.mulberry32(12)), { edges, clique });
});

test("layouts land in the unit square and repeat under a seed", () => {
  const pos = G.forceLayout(34, KARATE, { rng: G.mulberry32(1), iterations: 60 });
  assert.equal(pos.length, 34);
  assert.ok(pos.flat().every((v) => v >= 0 && v <= 1));
  assert.deepEqual(pos, G.forceLayout(34, KARATE, { rng: G.mulberry32(1), iterations: 60 }));
  const circle = G.circleLayout(4);
  assert.ok(Math.abs(circle[0][0] - 0.5) < 1e-12 && circle[0][1] < 0.1, "node 0 at the top");
  assert.deepEqual(G.forceLayout(0, []), []);
  assert.deepEqual(G.normalise([[3, 3]]), [[0.5, 0.5]]);
});
