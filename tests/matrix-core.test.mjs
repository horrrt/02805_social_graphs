// Pins the arithmetic under the kit's EditableMatrix (src/kit/matrix-core.js):
// raw cell strings to numbers, row and column sums, symmetry, and the edge
// list a matrix describes. Pure functions, so this runs in node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { isSymmetric, parseCell, parseMatrix, sums, symmetrize, toEdges, zeros } from "../src/kit/matrix-core.js";

// The course's adjacency-matrix example: A→B 3, A→C 1, B→A 1, B→D 4.
const M = [
  [0, 3, 1, 0],
  [1, 0, 0, 4],
  [0, 0, 0, 2],
  [0, 0, 0, 0],
];

test("parseCell reads blanks, junk and a lone minus as 0", () => {
  assert.equal(parseCell("3"), 3);
  assert.equal(parseCell(" 2.5 "), 2.5);
  assert.equal(parseCell("-1"), -1);
  for (const raw of ["", "  ", "-", "abc", "1e400", null, undefined, "NaN"]) assert.equal(parseCell(raw), 0, String(raw));
});

test("parseMatrix pads a short row and squares the grid", () => {
  assert.deepEqual(parseMatrix([["1"], ["x", "2"]]), [[1, 0], [0, 2]]);
  assert.deepEqual(parseMatrix([]), []);
});

test("sums gives out-strength by row, in-strength by column and the total", () => {
  assert.deepEqual(sums(M), { rows: [4, 5, 2, 0], cols: [1, 3, 1, 6], total: 11 });
  assert.deepEqual(sums([]), { rows: [], cols: [], total: 0 });
  assert.deepEqual(sums([[Number.NaN, -2], [1]]).rows, [-2, 1], "NaN and a missing cell count as 0");
});

test("isSymmetric compares each pair within a tolerance", () => {
  assert.equal(isSymmetric(M), false);
  assert.equal(isSymmetric([[0, 1], [1, 0]]), true);
  assert.equal(isSymmetric([[0, 1], [1 + 1e-12, 0]]), true);
  assert.equal(isSymmetric([]), true);
  assert.equal(isSymmetric([[5]]), true, "the diagonal never breaks symmetry");
});

test("symmetrize keeps the larger entry by default, or the mean, and the diagonal", () => {
  const s = symmetrize([[7, 3], [1, 0]]);
  assert.deepEqual(s, [[7, 3], [3, 0]]);
  assert.equal(isSymmetric(s), true);
  assert.deepEqual(symmetrize([[0, 3], [1, 0]], "mean"), [[0, 2], [2, 0]]);
  assert.deepEqual(symmetrize(M), symmetrize(symmetrize(M)), "symmetrize is idempotent");
});

test("toEdges lists nonzero cells, directed by default, without the diagonal", () => {
  assert.deepEqual(toEdges(M), [[0, 1, 3], [0, 2, 1], [1, 0, 1], [1, 3, 4], [2, 3, 2]]);
  assert.deepEqual(toEdges(M, { directed: false }), [[0, 1, 3], [0, 2, 1], [1, 3, 4], [2, 3, 2]]);
  assert.deepEqual(toEdges([[2, 0], [0, 0]]), []);
  assert.deepEqual(toEdges([[2, 0], [0, 0]], { loops: true }), [[0, 0, 2]]);
  assert.deepEqual(toEdges([]), []);
  assert.deepEqual(toEdges([[0, -1], [0, 0]]), [[0, 1, -1]], "a negative weight is still an edge");
});

test("zeros makes an n × n grid of independent rows", () => {
  const z = zeros(3);
  z[0][1] = 1;
  assert.deepEqual(z, [[0, 1, 0], [0, 0, 0], [0, 0, 0]]);
  assert.deepEqual(zeros(0), []);
  assert.deepEqual(zeros(-2), []);
});
