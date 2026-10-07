// The arithmetic under EditableMatrix, with no DOM: a square matrix of
// numbers (rows are sources, columns targets) read from raw cell strings,
// its row and column sums, whether it is symmetric, how to make it so, and
// the edge list it describes. Pure functions over arrays, so
// tests/matrix-core.test.mjs runs them in node.
//
//   const m = parseMatrix([["0", "3"], ["1", ""]]);
//   sums(m); isSymmetric(m); toEdges(symmetrize(m), { directed: false });

/** An n × n matrix of zeros. */
export function zeros(n) {
  return Array.from({ length: Math.max(0, n) }, () => new Array(Math.max(0, n)).fill(0));
}

/** A cell's raw string as a number: blank, a lone "-" or anything not a finite number reads as 0. */
export function parseCell(raw) {
  const t = String(raw ?? "").trim();
  if (t === "") return 0;
  const v = Number(t);
  return Number.isFinite(v) ? v : 0;
}

/** A grid of raw strings as numbers, row by row; a short row is padded with zeros to the grid's height. */
export function parseMatrix(raw) {
  const n = raw.length;
  return raw.map((row) => Array.from({ length: n }, (_, j) => parseCell(row?.[j])));
}

// A cell as a number, so a ragged or non-numeric input never yields NaN.
const at = (m, i, j) => {
  const v = Number(m[i]?.[j]);
  return Number.isFinite(v) ? v : 0;
};

/** Row sums (out-strength), column sums (in-strength) and the total. */
export function sums(m) {
  const n = m.length;
  const rows = new Array(n).fill(0);
  const cols = new Array(n).fill(0);
  let total = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = at(m, i, j);
      rows[i] += v;
      cols[j] += v;
      total += v;
    }
  return { rows, cols, total };
}

/** True when m[i][j] equals m[j][i] for every pair, to within `tol`. An empty matrix is symmetric. */
export function isSymmetric(m, tol = 1e-9) {
  const n = m.length;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(at(m, i, j) - at(m, j, i)) > tol) return false;
  return true;
}

/**
 * The symmetric matrix that keeps every link in both directions: each pair
 * takes the larger of its two entries ("max", the default), so a one-way
 * link becomes two-way at its own weight, or their mean ("mean"). The
 * diagonal is kept.
 */
export function symmetrize(m, mode = "max") {
  const n = m.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return at(m, i, i);
      const a = at(m, i, j);
      const b = at(m, j, i);
      return mode === "mean" ? (a + b) / 2 : Math.max(a, b);
    }),
  );
}

/**
 * The edges the matrix describes, as [source, target, weight], in row order.
 * Zero cells are no edge, and the diagonal is left out unless `loops`.
 * Directed (the default): one edge per nonzero cell. Undirected: one edge per
 * pair i < j with either entry nonzero, weighted by the larger entry.
 */
export function toEdges(m, { directed = true, loops = false } = {}) {
  const n = m.length;
  const out = [];
  for (let i = 0; i < n; i++)
    for (let j = directed ? 0 : i; j < n; j++) {
      if (i === j) {
        if (loops && at(m, i, i) !== 0) out.push([i, i, at(m, i, i)]);
        continue;
      }
      const w = directed ? at(m, i, j) : Math.max(at(m, i, j), at(m, j, i));
      if (w !== 0) out.push([i, j, w]);
    }
  return out;
}
