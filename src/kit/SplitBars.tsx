// Ranked rows, each a horizontal bar split into parts (say the share of a
// similarity that names, habit words and everything else contribute), with
// the row's value at the right, an optional status pill and a legend under
// the list. Bars share one scale: `max`, or the largest row total. Plain HTML,
// so it renders on the server. Style: .kit-split in post.css.
import type { ReactNode } from "react";
import { cssColour } from "./svgBits";

export type SplitRow = {
  key: string;
  label: ReactNode;
  sub?: ReactNode;
  parts: number[];
  value: number;
  valueLabel: ReactNode;
  status?: { text: string; tone: "good" | "bad" };
};
export type SplitPart = { name: string; color: string };

const pct = (v: number, max: number) => `${max > 0 ? Math.max(0, (v / max) * 100) : 0}%`;

/** <SplitBars rows={[{ key, label, parts: [0.2, 0.05], value: 0.25, valueLabel: "0.25" }]} parts={[{ name: "names", color: "--people" }]} /> */
export default function SplitBars({ rows, parts, max, onPick }: { rows: SplitRow[]; parts: SplitPart[]; max?: number; onPick?: (key: string) => void }) {
  const top = max ?? Math.max(0, ...rows.map((r) => r.parts.reduce((s, p) => s + Math.max(0, p), 0)));
  return (
    <div className="kit-split">
      {rows.length === 0 ? <p className="kit-empty">No rows to show.</p> : null}
      <ol>
        {rows.map((r, i) => (
          <li key={r.key}>
            <span className="kit-rank">{i + 1}</span>
            <span className="kit-split-name">
              {onPick ? (
                <button type="button" className="kit-link" onClick={() => onPick(r.key)}>
                  {r.label}
                </button>
              ) : (
                <b>{r.label}</b>
              )}
              {r.sub ? <small>{r.sub}</small> : null}
            </span>
            <span className="kit-track" aria-hidden="true">
              {r.parts.map((p, j) => (
                <span key={j} className="kit-seg" style={{ width: pct(p, top), background: cssColour(parts[j]?.color ?? "--ink-mute") }} />
              ))}
            </span>
            <span className="kit-num">{r.valueLabel}</span>
            <span className="kit-status">{r.status ? <span className={`kit-pill kit-pill-${r.status.tone}`}>{r.status.text}</span> : null}</span>
          </li>
        ))}
      </ol>
      <ul className="kit-legend">
        {parts.map((p) => (
          <li key={p.name}>
            <span className="kit-swatch" style={{ background: cssColour(p.color) }} />
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
