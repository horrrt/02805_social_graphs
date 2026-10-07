// Observed counts against a null model, one row per category (say links
// between each pair of groups): a bar for the observed value, a tick at the
// null mean with whiskers to ±2 sd, and z at the right, bold once |z| ≥ 2.
// A row gives its null as `samples` (summarised by dist-core.js nullStats)
// or as `mean` and `sd`. Long labels are cut to fit with an ellipsis and keep
// their full text in a tooltip. Drawn after hydration at its parent's width.
// Style: .kit-nullbars in post.css.
import { useRef } from "react";
import { useFittedWidth } from "@/lib/useSize";
import { useTextMeasure, type TypeScale } from "@/lib/useTypeScale";
import { nullStats } from "./dist-core.js";
import { fmt3, fmtZ, niceTicks } from "./nullBits";
import { useSvgBase, type Tokens } from "./svgBits";

export type NullBarRow = { key: string; label: string; observed: number; samples?: number[]; mean?: number; sd?: number };

const ROW = 30;
const TOP = 6;
const AXIS = 34;
const Z_W = 74;

type Drawn = NullBarRow & { m: number | null; s: number | null; z: number | null };

/** The row's null mean and sd, from its samples when it has them. */
function summary(r: NullBarRow): Drawn {
  if (r.samples) {
    const st = nullStats(r.samples, r.observed);
    return { ...r, m: st.mean, s: st.sd, z: st.z };
  }
  const m = r.mean ?? null;
  const s = r.sd ?? null;
  return { ...r, m, s, z: m !== null && s ? (r.observed - m) / s : null };
}

function zText(d: Drawn): string {
  if (d.m === null) return "no null";
  if (d.z !== null) return `z ${fmtZ(d.z)}`;
  return d.observed === d.m ? "fixed" : "sd 0";
}

function Plot({ rows, xLabel, fmt, scale, tokens }: { rows: Drawn[]; xLabel: string; fmt: (v: number) => string; scale: TypeScale; tokens: Tokens }) {
  const svg = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(svg, 560);
  const measure = useTextMeasure();
  const t = tokens;
  const small = scale.fs("small");
  const caption = scale.fs("caption");
  const widest = Math.max(0, ...rows.map((r) => (measure ? measure(r.label, "small", 600) : r.label.length * 7)));
  const labelW = Math.min(widest, width * 0.32);
  const x0 = labelW + 14;
  const x1 = width - Z_W;
  const vals = rows.flatMap((r) => [r.observed, ...(r.m !== null ? [r.m - 2 * (r.s ?? 0), r.m + 2 * (r.s ?? 0)] : [])]);
  let lo = Math.min(0, ...vals);
  let hi = Math.max(0, ...vals);
  if (lo === hi) hi = lo + 1;
  const pad = (hi - lo) * 0.04;
  lo = lo < 0 ? lo - pad : lo;
  hi += pad;
  const sx = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
  const height = TOP + rows.length * ROW + AXIS;
  const bottom = TOP + rows.length * ROW;
  // Cut a label to labelW with an ellipsis.
  const cut = (text: string) => {
    if (!measure || measure(text, "small", 600) <= labelW) return text;
    let n = text.length;
    while (n > 1 && measure(`${text.slice(0, n)}…`, "small", 600) > labelW) n--;
    return `${text.slice(0, n).trimEnd()}…`;
  };
  const aria = rows.map((r) => `${r.label}: observed ${fmt(r.observed)}${r.m !== null ? `, null ${fmt(r.m)} ± ${fmt(r.s ?? 0)}, ${zText(r)}` : ""}`).join("; ");
  return (
    <svg ref={svg} viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={`${xLabel}. ${aria}`}>
      {niceTicks([lo, hi], 5).map((v, i) => (
        <g key={`x${i}`}>
          <line x1={sx(v)} x2={sx(v)} y1={TOP} y2={bottom} stroke={t["--w4-grid"]} strokeWidth={1} />
          <text x={sx(v)} y={bottom + 14} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="middle">
            {fmt(v)}
          </text>
        </g>
      ))}
      <text x={(x0 + x1) / 2} y={height - 4} fontSize={caption} fill={t["--ink-soft"]} textAnchor="middle">
        {xLabel}
      </text>
      <line x1={sx(0)} x2={sx(0)} y1={TOP} y2={bottom} stroke={t["--ink-mute"]} strokeWidth={1} />
      {rows.map((r, i) => {
        const cy = TOP + i * ROW + ROW / 2;
        const strong = r.z !== null && Math.abs(r.z) >= 2;
        const shown = cut(r.label);
        return (
          <g key={r.key}>
            <text x={labelW} y={cy + 4} fontSize={small} fontWeight={600} fill={t["--ink"]} textAnchor="end">
              {shown !== r.label ? <title>{r.label}</title> : null}
              {shown}
            </text>
            <rect x={Math.min(sx(0), sx(r.observed))} width={Math.abs(sx(r.observed) - sx(0))} y={cy - 7} height={14} rx={2} fill={t["--access"]} opacity={0.8} />
            {r.m !== null ? (
              <g>
                <line x1={sx(r.m - 2 * (r.s ?? 0))} x2={sx(r.m + 2 * (r.s ?? 0))} y1={cy} y2={cy} stroke={t["--ink"]} strokeWidth={1.5} />
                <line x1={sx(r.m - 2 * (r.s ?? 0))} x2={sx(r.m - 2 * (r.s ?? 0))} y1={cy - 5} y2={cy + 5} stroke={t["--ink"]} strokeWidth={1.5} />
                <line x1={sx(r.m + 2 * (r.s ?? 0))} x2={sx(r.m + 2 * (r.s ?? 0))} y1={cy - 5} y2={cy + 5} stroke={t["--ink"]} strokeWidth={1.5} />
                <line x1={sx(r.m)} x2={sx(r.m)} y1={cy - 10} y2={cy + 10} stroke={t["--people"]} strokeWidth={3} />
              </g>
            ) : null}
            <text x={width - 4} y={cy + 4} fontSize={small} fontWeight={strong ? 700 : 400} fill={strong ? t["--ink"] : t["--ink-mute-text"]} textAnchor="end">
              {zText(r)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** <NullBars rows={[{ key: "aa", label: "A–A", observed: 120, mean: 80, sd: 9 }]} xLabel="links" /> */
export default function NullBars({ rows, xLabel = "count", fmt = fmt3 }: { rows: NullBarRow[]; xLabel?: string; fmt?: (v: number) => string }) {
  const base = useSvgBase();
  const drawn = rows.map(summary);
  if (!rows.length)
    return (
      <div className="kit-nullbars">
        <p className="kit-empty">No categories to show.</p>
      </div>
    );
  return (
    <div className="kit-nullbars">
      <div className="kit-plot">{base ? <Plot rows={drawn} xLabel={xLabel} fmt={fmt} {...base} /> : null}</div>
      <ul className="kit-legend">
        <li>
          <span className="kit-swatch" style={{ background: "var(--access)" }} />
          observed
        </li>
        <li>
          <span className="kit-swatch kit-swatch-line" style={{ color: "var(--people)" }} />
          null mean, whiskers ±2 sd
        </li>
      </ul>
    </div>
  );
}
