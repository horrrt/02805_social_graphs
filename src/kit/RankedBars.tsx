// A numbered ranking with a bar per row: the label, a bar on one scale (the
// largest value), then any extra columns such as "196×" or "83 of 303". Muted
// rows keep their place but grey their bar, as a word the reader has set
// aside. A row with onClick gets a button for its label. Style: .kit-ranked
// in post.css.
import type { ReactNode } from "react";

export type RankedRow = {
  key: string;
  label: ReactNode;
  value: number;
  valueLabel?: ReactNode;
  cols?: ReactNode[];
  muted?: boolean;
  onClick?: () => void;
};

/** <RankedBars rows={[{ key: "claws", label: "claws", value: 0.12, cols: ["17×", "26 of 303"] }]} colHeads={["On page", "Pages"]} /> */
export default function RankedBars({ rows, colHeads, title, labelHead = "Word" }: { rows: RankedRow[]; colHeads?: string[]; title?: ReactNode; labelHead?: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  const extra = Math.max(colHeads?.length ?? 0, ...rows.map((r) => r.cols?.length ?? 0));
  const withValue = rows.some((r) => r.valueLabel !== undefined);
  return (
    <table className="kit-ranked">
      {title ? <caption>{title}</caption> : null}
      <colgroup>
        <col className="kit-ranked-n" />
        <col className="kit-ranked-label" />
        <col className="kit-ranked-bar" />
        {withValue ? <col className="kit-ranked-col" /> : null}
        {Array.from({ length: extra }, (_, i) => (
          <col key={i} className="kit-ranked-col" />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th scope="col">
            <span className="visually-hidden">Rank</span>
          </th>
          <th scope="col">{labelHead}</th>
          <th scope="col">
            <span className="visually-hidden">Bar</span>
          </th>
          {withValue ? <th scope="col" className="num">Score</th> : null}
          {Array.from({ length: extra }, (_, i) => (
            <th key={i} scope="col" className="num">
              {colHeads?.[i] ?? ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={3 + extra + (withValue ? 1 : 0)} className="kit-empty">
              No rows to show.
            </td>
          </tr>
        ) : null}
        {rows.map((r, i) => (
          <tr key={r.key} className={r.muted ? "kit-muted" : undefined}>
            <td className="kit-rank">{i + 1}</td>
            <td className="kit-ranked-word">
              {r.onClick ? (
                <button type="button" className="kit-link" onClick={r.onClick}>
                  {r.label}
                </button>
              ) : (
                r.label
              )}
            </td>
            <td>
              <span className="kit-track" aria-hidden="true">
                <span className="kit-seg" style={{ width: `${max > 0 ? Math.max(0, r.value / max) * 100 : 0}%` }} />
              </span>
            </td>
            {withValue ? <td className="num">{r.valueLabel}</td> : null}
            {Array.from({ length: extra }, (_, j) => (
              <td key={j} className="num">
                {r.cols?.[j]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
