// A small line chart of one quantity as a dial sweeps its range: the curve, a
// dashed reference line, and a marker where the dial stands now. Points are
// drawn in x order; `current` is placed on the curve by linear interpolation
// and clamped to its ends. Drawn after hydration at its parent's width.
// Style: .kit-sweep in post.css.
import { useRef } from "react";
import { useFittedWidth } from "@/lib/useSize";
import type { TypeScale } from "@/lib/useTypeScale";
import { useSvgBase, type Tokens } from "./svgBits";

export type SweepProps = {
  points: [number, number][];
  current?: number;
  refLine?: { y: number; label: string };
  xLabel: string;
  yLabel: string;
  domain?: { x?: [number, number]; y?: [number, number] };
  fmt?: (v: number) => string;
};

const HEIGHT = 200;
const M = { top: 14, right: 16, bottom: 40, left: 40 };

/** The curve's y at x, by linear interpolation between sorted points; clamped to the ends. */
export function yAt(points: [number, number][], x: number): number | null {
  if (points.length === 0) return null;
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [xa, ya] = points[i - 1];
    const [xb, yb] = points[i];
    if (x <= xb) return xb === xa ? yb : ya + ((yb - ya) * (x - xa)) / (xb - xa);
  }
  return points[points.length - 1][1];
}

const span = (vals: number[], pad: boolean): [number, number] => {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  if (lo === hi) return [lo - 1, hi + 1];
  return pad ? [Math.min(0, lo), hi + (hi - lo) * 0.08] : [lo, hi];
};

// About four ticks at a round step (1, 2 or 5 times a power of ten) inside the domain.
function ticks([lo, hi]: [number, number]): number[] {
  const raw = (hi - lo) / 4;
  if (!(raw > 0) || !Number.isFinite(raw)) return [lo];
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toPrecision(12));
  return out;
}

function Plot({ points, current, refLine, xLabel, yLabel, domain, fmt, scale, tokens }: SweepProps & { points: [number, number][]; fmt: (v: number) => string; scale: TypeScale; tokens: Tokens }) {
  const svg = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(svg, 360);
  const t = tokens;
  const xd = domain?.x ?? span(points.map((p) => p[0]), false);
  const yd = domain?.y ?? span([...points.map((p) => p[1]), ...(refLine ? [refLine.y] : [])], true);
  const sx = (x: number) => M.left + ((x - xd[0]) / (xd[1] - xd[0])) * (width - M.left - M.right);
  const sy = (y: number) => HEIGHT - M.bottom - ((y - yd[0]) / (yd[1] - yd[0])) * (HEIGHT - M.top - M.bottom);
  const clampY = (y: number) => Math.max(M.top, Math.min(HEIGHT - M.bottom, sy(y)));
  const d = points.map((p, i) => `${i ? "L" : "M"} ${sx(p[0]).toFixed(1)} ${clampY(p[1]).toFixed(1)}`).join(" ");
  const cy = current === undefined ? null : yAt(points, current);
  const cx = current === undefined ? null : sx(Math.max(xd[0], Math.min(xd[1], current)));
  const caption = scale.fs("caption");
  const aria = `${yLabel} against ${xLabel}${cy !== null && current !== undefined ? `; at ${fmt(current)} it is ${fmt(cy)}` : ""}${refLine ? `; reference ${refLine.label} at ${fmt(refLine.y)}` : ""}`;
  return (
    <svg ref={svg} viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} role="img" aria-label={aria}>
      {ticks(yd).map((v, i) => (
        <g key={`y${i}`}>
          <line x1={M.left} x2={width - M.right} y1={sy(v)} y2={sy(v)} stroke={t["--w4-grid"]} strokeWidth={1} />
          <text x={M.left - 6} y={sy(v) + 4} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="end">
            {fmt(v)}
          </text>
        </g>
      ))}
      {ticks(xd).map((v, i) => (
        <text key={`x${i}`} x={sx(v)} y={HEIGHT - M.bottom + 15} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="middle">
          {fmt(v)}
        </text>
      ))}
      <text x={(M.left + width - M.right) / 2} y={HEIGHT - 6} fontSize={caption} fill={t["--ink-soft"]} textAnchor="middle">
        {xLabel}
      </text>
      <text x={12} y={(M.top + HEIGHT - M.bottom) / 2} fontSize={caption} fill={t["--ink-soft"]} textAnchor="middle" transform={`rotate(-90 12 ${(M.top + HEIGHT - M.bottom) / 2})`}>
        {yLabel}
      </text>
      {refLine ? (
        <g>
          <line x1={M.left} x2={width - M.right} y1={clampY(refLine.y)} y2={clampY(refLine.y)} stroke={t["--ink-mute"]} strokeWidth={1.3} strokeDasharray="4 3" />
          <text x={width - M.right} y={clampY(refLine.y) - 5} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="end">
            {refLine.label}
          </text>
        </g>
      ) : null}
      <path d={d} fill="none" stroke={t["--access"]} strokeWidth={2} />
      {cx !== null && cy !== null ? (
        <g>
          <line x1={cx} x2={cx} y1={M.top} y2={HEIGHT - M.bottom} stroke={t["--ink-mute"]} strokeWidth={1} strokeDasharray="2 3" />
          <circle cx={cx} cy={clampY(cy)} r={5} fill={t["--people"]} stroke={t["--card"]} strokeWidth={2} />
        </g>
      ) : null}
    </svg>
  );
}

/** <SweepCurve points={[[0, 2], [50, 3.6], [100, 4]]} current={100} refLine={{ y: 0.3, label: "random" }} xLabel="names kept (%)" yLabel="neighbours linked" /> */
export default function SweepCurve(props: SweepProps) {
  const base = useSvgBase();
  const points = [...props.points].sort((p, q) => p[0] - q[0]);
  const fmt = props.fmt ?? ((v: number) => String(+v.toFixed(2)));
  if (!base) return <div className="kit-sweep" />;
  if (points.length === 0)
    return (
      <div className="kit-sweep">
        <p className="kit-empty">No points to draw.</p>
      </div>
    );
  return (
    <div className="kit-sweep">
      <Plot {...props} points={points} fmt={fmt} {...base} />
    </div>
  );
}
