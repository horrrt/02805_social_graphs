// Week 4's plain-SVG charts beyond the strip chart, as the old vis scripts
// drew them: horizontal bars, stacked proportion rows, ranking bars with a
// reference line and a slope chart. Each draws at its parent's width
// (useFittedWidth, as week04-strip.js fitted() did), takes its type sizes and
// colours from `T`, and carries a <title> tooltip on each mark.
import { useRef, type ReactNode } from "react";
import { useFittedWidth } from "@/lib/useSize";
import type { T } from "./useT";

const pct = (v: number, digits = 0) => `${(v * 100).toFixed(digits)}%`;

export type HBar = { label: string; sub?: string; value: number; valueLabel?: string; color?: string; tip?: string };

/** One value per row, no shared baseline; labels above the bars when the column is too narrow (week04-vis-staffing.js hbars). */
export function HBars({ rows, domain, fmt, aria, rowH = 34, width: fallback = 520, T }: { rows: HBar[]; domain: [number, number]; fmt: (v: number) => string; aria: string; rowH?: number; width?: number; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, fallback);
  const [d0, d1] = domain;
  const small = T.fs("small");
  const caption = T.fs("caption");
  const labelNeed = Math.ceil(Math.max(0, ...rows.map((r) => Math.max(T.measure(r.label, "small", 600), r.sub ? T.measure(r.sub, "caption") : 0)))) + 14;
  // Too narrow for a label column: each label goes on a line above its bar.
  const above = width - labelNeed - 12 < 160;
  const lift = above ? 18 : 0;
  const x0 = above ? 0 : labelNeed;
  const x1 = width - 12;
  const X = (v: number) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);
  const top = 8;
  const step = rowH + lift;
  const h = top + rows.length * step + 4;
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${h}`} width={width} height={h} role="img" aria-label={aria}>
      {rows.map((r, i) => {
        const cy = top + i * step + lift + rowH / 2;
        const bx = X(r.value);
        const label = r.valueLabel ?? fmt(r.value);
        const inside = bx - x0 > T.measure(label, "small", 700) + 12;
        return (
          <g key={i}>
            {above ? (
              <text x={0} y={cy - 13} fontSize={small} fill={T.token("--ink")} fontWeight={600}>
                {r.label}
              </text>
            ) : (
              <>
                <text x={0} y={cy - (r.sub ? 3 : -4)} fontSize={small} fill={T.token("--ink")} fontWeight={600}>
                  {r.label}
                </text>
                {r.sub ? (
                  <text x={0} y={cy + 12} fontSize={caption} fill={T.token("--ink-mute-text")}>
                    {r.sub}
                  </text>
                ) : null}
              </>
            )}
            <line x1={x0} y1={cy} x2={x1} y2={cy} stroke={T.token("--line")} strokeWidth={1} />
            <rect x={x0} y={cy - 7} width={Math.max(2, bx - x0)} height={14} rx={4} fill={r.color ? T.token(r.color) : T.token("--ink")}>
              {r.tip ? <title>{r.tip}</title> : null}
            </rect>
            <text x={inside ? bx - 6 : bx + 6} y={cy + 4.5} fontSize={small} fontWeight={700} fill={inside ? T.token("--card") : T.token("--ink")} textAnchor={inside ? "end" : "start"}>
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Stacked proportion rows with a legend under them (week04-vis-staffing.js stackedRows). Tints are token names, ink first. */
export function Stacked({
  groups,
  names,
  tints,
  aria,
  digits = 0,
  rowH = 42,
  width: fallback = 520,
  T,
}: {
  groups: [string, number[]][];
  names: string[];
  tints: string[];
  aria: string;
  digits?: number;
  rowH?: number;
  width?: number;
  T: T;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, fallback);
  const x0 = 0;
  const x1 = width;
  const top = 12;
  const small = T.fs("small");
  const caption = T.fs("caption");
  const h = top + groups.length * rowH + 22;
  const ly = top + groups.length * rowH + 6;
  let lx = 0;
  const legend = names.map((name, j) => {
    const at = lx;
    lx += 14 + T.measure(name, "caption") + 16;
    return (
      <g key={name}>
        <circle cx={at + 5} cy={ly} r={5} fill={T.token(tints[j])} />
        <text x={at + 14} y={ly + 4} fontSize={caption} fill={T.token("--ink-mute-text")}>
          {name}
        </text>
      </g>
    );
  });
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${h}`} width={width} height={h} role="img" aria-label={aria}>
      {groups.map(([label, shares], i) => {
        const cy = top + i * rowH;
        let x = x0;
        const parts: ReactNode[] = shares.map((share, j) => {
          const w = share * (x1 - x0);
          const at = x;
          x += w;
          const text = pct(share, digits);
          return (
            <g key={j}>
              <rect x={at} y={cy} width={Math.max(0, w)} height={18} fill={T.token(tints[j])}>
                <title>{`${names[j]}: ${pct(share, 1)}`}</title>
              </rect>
              {w > T.measure(text, "small", 700) + 10 ? (
                <text x={at + w / 2} y={cy + 13.5} fontSize={small} fontWeight={700} textAnchor="middle" fill={j === 0 ? T.token("--card") : T.token("--ink")}>
                  {text}
                </text>
              ) : null}
            </g>
          );
        });
        return (
          <g key={label}>
            <text x={0} y={cy - 4} fontSize={small} fill={T.token("--ink")} fontWeight={600}>
              {label}
            </text>
            {parts}
          </g>
        );
      })}
      {legend}
    </svg>
  );
}

export type RankBar = { label: string; value: number; valueLabel?: string; tip?: string; bold?: boolean; outline?: boolean };

/** A label centred on x but kept inside [lo, hi], as in week04-strip.js. */
function SmartCaption({ x, y, text, lo, hi, T }: { x: number; y: number; text: string; lo: number; hi: number; T: T }) {
  const half = T.measure(text, "caption", 400) / 2;
  let anchor: "start" | "middle" | "end" = "middle";
  let at = x;
  if (x - half < lo) {
    anchor = "start";
    at = lo;
  } else if (x + half > hi) {
    anchor = "end";
    at = hi;
  }
  return (
    <text x={at} y={y} fontSize={T.fs("caption")} fill={T.token("--ink-soft")} fontWeight={400} textAnchor={anchor}>
      {text}
    </text>
  );
}

/** A bar per row on a shared axis, real values only (week04-vis-more.js hbars). */
export function RankBars({
  rows,
  domain,
  ticks,
  fmt,
  valueW = 54,
  rowH = 32,
  refValue,
  refLabel,
  aria,
  top = 8,
  width: fallback = 556,
  T,
}: {
  rows: RankBar[];
  domain: [number, number];
  ticks: number[];
  fmt: (v: number) => string;
  valueW?: number;
  rowH?: number;
  refValue?: number;
  refLabel?: string;
  aria: string;
  top?: number;
  width?: number;
  T: T;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, fallback);
  const [d0, d1] = domain;
  const small = T.fs("small");
  const caption = T.fs("caption");
  const x0 = Math.ceil(Math.max(...rows.map((r) => T.measure(r.label, "small", r.bold ? 700 : 600)))) + 12;
  const x1 = width - Math.max(valueW, Math.ceil(Math.max(...rows.map((r) => T.measure(r.valueLabel ?? fmt(r.value), "small", 700)))) + 12);
  const X = (v: number) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);
  const ybot = top + rows.length * rowH;
  const h = ybot + 30 + (refLabel ? 14 : 0);
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${h}`} width={width} height={h} role="img" aria-label={aria} className="w4-strip">
      {ticks.map((tv) => (
        <g key={tv}>
          <line x1={X(tv)} y1={top - 4} x2={X(tv)} y2={ybot} stroke={T.token("--w4-grid")} strokeWidth={1} />
          <text x={X(tv)} y={ybot + 16} fontSize={caption} fill={T.token("--ink-mute-text")} textAnchor="middle">
            {fmt(tv)}
          </text>
        </g>
      ))}
      {refValue !== undefined ? <line x1={X(refValue)} y1={top - 4} x2={X(refValue)} y2={ybot} stroke={T.token("--ink-soft")} strokeWidth={1.4} strokeDasharray="3 2" /> : null}
      {refValue !== undefined && refLabel ? <SmartCaption x={X(refValue)} y={ybot + 30} text={refLabel} lo={x0} hi={x1} T={T} /> : null}
      {rows.map((r, i) => {
        const cy = top + i * rowH + rowH / 2;
        const bh = rowH - 12;
        const bw = Math.max(X(r.value) - x0, 1);
        const paint = r.outline ? { fill: "none", stroke: T.token("--ink"), strokeWidth: 1.6 } : { fill: r.bold ? T.token("--ink") : T.token("--ink-mute") };
        return (
          <g key={i}>
            <text x={0} y={cy + 4.5} fontSize={small} fill={T.token("--ink")} fontWeight={r.bold ? 700 : 600}>
              {r.label}
            </text>
            <line x1={x0} y1={cy} x2={x1} y2={cy} stroke={T.token("--line")} strokeWidth={1} />
            <rect x={x0} y={cy - bh / 2} width={bw} height={bh} rx={3} {...paint}>
              {r.tip ? <title>{r.tip}</title> : null}
            </rect>
            <text x={X(r.value) + 6} y={cy + 4.5} fontSize={small} fontWeight={700} fill={T.token("--ink")}>
              {r.valueLabel ?? fmt(r.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Spread label baselines so no two sit closer than gap, keeping their order. */
function dodge(ys: number[], gap: number) {
  const order = ys.map((y, i) => [y, i] as const).sort((p, q) => p[0] - q[0]);
  const out: number[] = [];
  let prev = -Infinity;
  for (const [y, i] of order) {
    prev = Math.max(y, prev + gap);
    out[i] = prev;
  }
  return out;
}

export type SlopeSeries = { label: string; values: [number, number]; colorToken: string; tip?: string };

/** Two columns joined by one line per series (week04-vis-more.js slope). */
export function Slope({
  series,
  domain,
  labels,
  fmt,
  height = 210,
  aria,
  width: fallback = 556,
  T,
}: {
  series: SlopeSeries[];
  domain: [number, number];
  labels: string[];
  fmt: (v: number) => string;
  height?: number;
  aria: string;
  width?: number;
  T: T;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, fallback);
  const [d0, d1] = domain;
  const small = T.fs("small");
  const leftNeed = Math.max(...series.map((s) => T.measure(`${s.label} ${fmt(s.values[0])}`, "small", 700)));
  const rightNeed = Math.max(...series.map((s) => T.measure(fmt(s.values[1]), "small", 700)));
  const xl = Math.ceil(leftNeed) + 16;
  const xr = Math.min(width - Math.ceil(rightNeed) - 16, xl + 240);
  const top = 16;
  const bottom = height - 34;
  const Y = (v: number) => top + ((d1 - Math.min(Math.max(v, d0), d1)) * (bottom - top)) / (d1 - d0);
  const leftY = dodge(series.map((s) => Y(s.values[0]) + 4), 15);
  const rightY = dodge(series.map((s) => Y(s.values[1]) + 4), 15);
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={aria}>
      {[xl, xr].map((x, i) => (
        <line key={i} x1={x} y1={top - 8} x2={x} y2={bottom + 4} stroke={T.token("--w4-grid")} strokeWidth={1} />
      ))}
      <text x={xl} y={height - 10} fontSize={small} fill={T.token("--ink-soft")} fontWeight={600} textAnchor="middle">
        {labels[0]}
      </text>
      <text x={xr} y={height - 10} fontSize={small} fill={T.token("--ink-soft")} fontWeight={600} textAnchor="middle">
        {labels[1]}
      </text>
      {series.map((s, i) => {
        const [a, b] = s.values;
        const color = T.token(s.colorToken);
        return (
          <g key={s.label}>
            <g>
              {s.tip ? <title>{s.tip}</title> : null}
              <line x1={xl} y1={Y(a)} x2={xr} y2={Y(b)} stroke={color} strokeWidth={2.4} />
              <circle cx={xl} cy={Y(a)} r={4.5} fill={color} />
              <circle cx={xr} cy={Y(b)} r={4.5} fill={color} />
            </g>
            <text x={xl - 10} y={leftY[i]} fontSize={small} fill={color} fontWeight={700} textAnchor="end">
              {`${s.label} ${fmt(a)}`}
            </text>
            <text x={xr + 10} y={rightY[i]} fontSize={small} fill={color} fontWeight={700} textAnchor="start">
              {fmt(b)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
