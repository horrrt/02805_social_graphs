// Pins the tree under the kit's Dendrogram (src/kit/dendro-core.js): merge
// lists and nested trees, the leaf order, cuts at one height and branch by
// branch, and Girvan–Newman read as merges. Pure functions, so this runs in
// node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { bestCut, blocksOf, buildTree, cutAt, fromTree, girvanNewman, levels, modularityTerms } from "../src/kit/dendro-core.js";
import { components, modularity } from "../src/kit/graph-core.js";

// Two triangles joined by one link: 0-1-2 and 3-4-5, bridge 2-3.
const BARBELL = [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [4, 5]];
// Leaves 0..3: (0, 2) at 1, (1, 3) at 2, then both at 5.
const MERGES = [{ a: 0, b: 2, h: 1 }, { a: 1, b: 3, h: 2 }, { a: 4, b: 5, h: 5 }];

test("buildTree orders leaves so every cluster is contiguous", () => {
  const t = buildTree(4, MERGES);
  assert.deepEqual(t.order, [0, 2, 1, 3]);
  assert.deepEqual(t.roots, [6]);
  assert.deepEqual(t.members[6].slice().sort(), [0, 1, 2, 3]);
  assert.equal(t.pos[4], 0.5);
  assert.equal(t.pos[6], 1.5);
  assert.equal(t.h[6], 5);
});

test("buildTree skips bad merges, keeps a forest and makes heights monotone", () => {
  const t = buildTree(4, [{ a: 0, b: 1, h: 3 }, { a: 0, b: 2, h: 1 }, { a: 4, b: 9, h: 2 }, { a: 4, b: 2, h: 1 }]);
  assert.equal(t.members[5], null, "0 is already merged");
  assert.equal(t.members[6], null, "9 does not exist");
  assert.equal(t.h[7], 3, "a parent is never below its child");
  assert.deepEqual(t.roots, [7, 3]);
  assert.deepEqual(t.order, [0, 1, 2, 3]);
  assert.deepEqual(buildTree(0, []).order, []);
});

test("cutAt keeps the top cluster at or below the height on each branch", () => {
  const t = buildTree(4, MERGES);
  assert.deepEqual(cutAt(t, 0), [0, 2, 1, 3]);
  assert.deepEqual(cutAt(t, 1), [4, 1, 3]);
  assert.deepEqual(cutAt(t, 2.5), [4, 5]);
  assert.deepEqual(cutAt(t, 99), [6]);
});

test("levels lists every distinct cut from all apart to one", () => {
  const ls = levels(buildTree(4, MERGES));
  assert.deepEqual(ls.map((l) => l.h), [0, 1, 2, 5]);
  assert.deepEqual(ls.map((l) => l.clusters.length), [4, 3, 2, 1]);
});

test("blocksOf numbers blocks by size, largest first, ties in leaf order", () => {
  const t = buildTree(4, MERGES);
  const { partition, blocks } = blocksOf(t, cutAt(t, 1));
  assert.deepEqual(blocks.map((b) => b.cluster), [4, 1, 3]);
  assert.deepEqual(partition, [0, 1, 0, 2]);
  assert.deepEqual(blocks[0].members, [0, 2]);
});

test("modularityTerms adds up to graph-core's modularity", () => {
  const term = modularityTerms(BARBELL);
  const part = [0, 0, 0, 1, 1, 1];
  const q = term([0, 1, 2]) + term([3, 4, 5]);
  assert.ok(Math.abs(q - modularity(BARBELL, part)) < 1e-12);
  assert.equal(modularityTerms([])([0]), 0);
});

test("fromTree turns a nested tree into merges, chaining a node with three children", () => {
  const { n, merges, ids } = fromTree({ h: 3, children: ["a", { h: 1, children: [{ id: "b" }, "c", "d"] }] });
  assert.equal(n, 4);
  assert.deepEqual(ids, ["a", "b", "c", "d"]);
  assert.deepEqual(merges, [{ a: 1, b: 2, h: 1 }, { a: 4, b: 3, h: 1 }, { a: 0, b: 5, h: 3 }]);
  assert.deepEqual(fromTree({ h: 2, children: [] }), { n: 0, merges: [], ids: [] });
  assert.deepEqual(fromTree({ h: 2, children: ["solo"] }).merges, [], "one child passes through");
});

test("Girvan–Newman cuts the bridge first, and the best cut finds the two triangles", () => {
  const { merges, removed } = girvanNewman(6, BARBELL);
  assert.deepEqual(removed[0], [2, 3], "the bridge carries every path between the triangles");
  assert.equal(removed.length, BARBELL.length);
  assert.equal(merges.length, 5, "a connected graph merges into one tree");
  const t = buildTree(6, merges);
  const { clusters, score } = bestCut(t, modularityTerms(BARBELL));
  const { partition } = blocksOf(t, clusters);
  assert.deepEqual(partition, [0, 0, 0, 1, 1, 1].map((g) => (partition[0] === 0 ? g : 1 - g)));
  assert.ok(Math.abs(score - modularity(BARBELL, partition)) < 1e-12);
  // No single-height cut does better than the branch-by-branch one.
  const term = modularityTerms(BARBELL);
  for (const { clusters: cs } of levels(t)) assert.ok(cs.reduce((s, c) => s + term(t.members[c]), 0) <= score + 1e-12);
});

test("Girvan–Newman on two components leaves a forest of two roots", () => {
  const edges = [[0, 1], [2, 3]];
  const { merges } = girvanNewman(4, edges);
  const t = buildTree(4, merges);
  assert.equal(t.roots.length, components(4, edges).sizes.length);
});
