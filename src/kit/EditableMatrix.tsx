// An n × n grid of numbers the reader types into: rows are sources, columns
// targets, a row sum at the end of each row and a column sum under each
// column, and a line saying whether the matrix is symmetric. Buttons make it
// symmetric (each pair takes its larger entry), clear it, and load the
// example when one is given. Each cell holds the raw string typed (R21) and
// reads as a number through matrix-core.js, which onChange(matrix) receives.
// ↑ and ↓ move between rows. The diagonal is locked unless `diagonal` is set.
// The parent re-keys the component to load new data. Style: .kit-emat in
// post.css.
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { isSymmetric, parseMatrix, sums, symmetrize, toEdges, zeros } from "./matrix-core.js";

const fmt = (v: number) => String(+v.toFixed(2));
const toRaw = (m: number[][], n: number): string[][] => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (m[i]?.[j] ? fmt(m[i][j]) : "")));

/** <EditableMatrix labels={["A", "B", "C"]} initial={[[0, 1, 0], [0, 0, 2], [1, 0, 0]]} example={…} onChange={(m) => setM(m)} /> */
export default function EditableMatrix({
  labels,
  initial,
  example,
  diagonal = false,
  onChange,
  caption,
}: {
  labels: string[];
  initial?: number[][];
  example?: number[][];
  diagonal?: boolean;
  onChange?: (matrix: number[][]) => void;
  caption?: ReactNode;
}) {
  const n = labels.length;
  const noDiag = (mx: number[][]) => (diagonal ? mx : mx.map((row, i) => row.map((v, j) => (i === j ? 0 : v))));
  const [raw, setRaw] = useState(() => toRaw(noDiag(initial ?? zeros(n)), n));
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  if (n === 0) return <p className="kit-empty">No nodes, so no matrix.</p>;
  // A grid typed for another size (labels changed without a new key) is cut or padded to n.
  const grid = raw.length === n ? raw : toRaw(parseMatrix(raw), n);
  const m = parseMatrix(grid);
  const { rows, cols, total } = sums(m);
  const symmetric = isSymmetric(m);
  const edges = toEdges(m).length;

  const commit = (next: string[][]) => {
    setRaw(next);
    onChange?.(parseMatrix(next));
  };
  const edit = (i: number, j: number, value: string) => commit(grid.map((row, r) => (r === i ? row.map((v, c) => (c === j ? value : v)) : row)));
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, i: number, j: number) => {
    const to = e.key === "ArrowDown" || e.key === "Enter" ? i + 1 : e.key === "ArrowUp" ? i - 1 : null;
    if (to === null || to < 0 || to >= n) return;
    e.preventDefault();
    cells.current[to * n + j]?.focus();
  };
  return (
    <div className="kit-emat">
      <table>
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            <td></td>
            {labels.map((l, j) => (
              <th key={j} scope="col" title={l}>
                {l}
              </th>
            ))}
            <th scope="col" className="kit-emat-sum">
              row Σ
            </th>
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={i}>
              <th scope="row" title={l}>
                {l}
              </th>
              {labels.map((c, j) => (
                <td key={j} className={i === j && !diagonal ? "kit-emat-diag" : m[i][j] !== 0 ? "kit-emat-on" : undefined}>
                  {i === j && !diagonal ? (
                    <span aria-label={`${l} to itself: no self-loops`}>·</span>
                  ) : (
                    <input
                      ref={(el) => {
                        cells.current[i * n + j] = el;
                      }}
                      type="text"
                      inputMode="decimal"
                      aria-label={`Link from ${l} to ${c}`}
                      value={grid[i][j]}
                      onChange={(e) => edit(i, j, e.target.value)}
                      onKeyDown={(e) => onKeyDown(e, i, j)}
                    />
                  )}
                </td>
              ))}
              <td className="kit-emat-sum">{fmt(rows[i])}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="kit-emat-sum">
              col Σ
            </th>
            {cols.map((v, j) => (
              <td key={j} className="kit-emat-sum">
                {fmt(v)}
              </td>
            ))}
            <td className="kit-emat-sum">{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="kit-controls">
        {example ? (
          <button type="button" onClick={() => commit(toRaw(noDiag(example), n))}>
            Load example
          </button>
        ) : null}
        <button type="button" onClick={() => commit(toRaw(symmetrize(m), n))} disabled={symmetric}>
          Symmetrize
        </button>
        <button type="button" onClick={() => commit(toRaw(zeros(n), n))} disabled={grid.every((row) => row.every((v) => v === ""))}>
          Clear
        </button>
        <span className={symmetric ? "kit-emat-flag kit-emat-sym" : "kit-emat-flag"} aria-live="polite">
          {symmetric ? "Symmetric: an undirected network" : "Not symmetric: a directed network"} · {edges} nonzero {edges === 1 ? "entry" : "entries"}
        </span>
      </div>
    </div>
  );
}
