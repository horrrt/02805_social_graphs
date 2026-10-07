// A word-context count matrix: rows are target words, columns the words seen
// near them, each cell tinted by its count with zeros muted. One row may be
// highlighted, and is written out under the table as a vector, so the reader
// sees that a word's row is its representation. With onRow the row heads are
// buttons. Style: .kit-matrix in post.css.
import type { ReactNode } from "react";

/** <CountMatrix rows={["wine", "beer"]} cols={["drink", "bottle"]} cells={[[3, 1], [2, 0]]} highlightRow={0} /> */
export default function CountMatrix({
  rows,
  cols,
  cells,
  highlightRow,
  onRow,
  caption,
}: {
  rows: string[];
  cols: string[];
  cells: number[][];
  highlightRow?: number;
  onRow?: (i: number) => void;
  caption?: ReactNode;
}) {
  if (rows.length === 0 || cols.length === 0) return <p className="kit-empty">No counts to show.</p>;
  const max = Math.max(0, ...cells.flat().filter(Number.isFinite));
  const at = (r: number, c: number) => cells[r]?.[c] ?? 0;
  const tint = (v: number) => (max > 0 && v > 0 ? `color-mix(in srgb, var(--access) ${Math.round(8 + (v / max) * 34)}%, var(--card))` : undefined);
  const hi = highlightRow !== undefined && highlightRow >= 0 && highlightRow < rows.length ? highlightRow : null;
  return (
    <div className="kit-matrix">
      <table>
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">target</th>
            {cols.map((c, j) => (
              <th key={j} scope="col" title={c}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i === hi ? "kit-row-on" : undefined}>
              <th scope="row" title={r}>
                {onRow ? (
                  <button type="button" className="kit-link" aria-pressed={i === hi} onClick={() => onRow(i)}>
                    {r}
                  </button>
                ) : (
                  r
                )}
              </th>
              {cols.map((_, j) => {
                const v = at(i, j);
                return (
                  <td key={j} className={v === 0 ? "kit-zero" : undefined} style={{ background: tint(v) }}>
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {hi !== null ? (
        <p className="kit-vector">
          <code>
            {rows[hi]} = [{cols.map((_, j) => at(hi, j)).join(", ")}]
          </code>
        </p>
      ) : null}
    </div>
  );
}
