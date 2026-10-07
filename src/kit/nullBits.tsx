// Pieces NullHistogram and NullBoard share: the x domain of a null
// distribution and its real value, round ticks, number formats and the bars
// with the real value's marker, drawn into an SVG the caller sizes. The
// domain comes from every sample, so a histogram that grows one sample at a
// time keeps its axis. A real value more than one domain width beyond the
// samples is not squeezed in: its marker stands at the edge with an arrow.
import type { ReactNode } from "react";
import type { TypeScale } from "@/lib/useTypeScale";
import { histogram } from "./dist-core.js";
import type { Tokens } from "./svgBits";

export type Verdict = "survives" | "dies" | "fixed";

export type NullDomain = { domain: [number, number]; off: -1 | 0 | 1 };

/** The x domain for samples and a real value; `off` is −1 or 1 when the real value lies off it to the left or right. */
export function nullDomain(samples: number[], real: number): NullDomain {
  const vs = samples.filter(Number.isFinite);
  const lo = vs.length ? Math.min(...vs) : real;
  const hi = vs.length ? Math.max(...vs) : real;
  const span = hi - lo;
  const pad = span > 0 ? span * 0.08 : Math.max(Math.abs(lo) * 0.1, 0.5);
  let a = lo - pad;
  let b = hi + pad;
  const width = b - a;
  if (!Number.isFinite(real) || (real >= a && real <= b)) return { domain: [a, b], off: 0 };
  if (real < a && a - real <= width) a = real - pad;
  else if (real > b && real - b <= width) b = real + pad;
  else return { domain: [a, b], off: real < a ? -1 : 1 };
  return { domain: [a, b], off: 0 };
}

/** About `n` ticks at a round step (1, 2 or 5 times a power of ten) inside the domain. */
export function niceTicks([lo, hi]: [number, number], n = 4): number[] {
  const raw = (hi - lo) / n;
  if (!(raw > 0) || !Number.isFinite(raw)) return [lo];
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toPrecision(12));
  return out;
}

/** Three significant figures, or whole numbers from 1000 up. */
export const fmt3 = (v: number) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-GB") : String(+v.toPrecision(3)));

/** A p-value: "< 0.001" below a thousandth, else three decimals. */
export const fmtP = (p: number | null) => (p === null ? "–" : p < 0.001 ? "< 0.001" : p.toFixed(3));

/** z to one decimal, "–" when undefined. */
export const fmtZ = (z: number | null) => (z === null ? "–" : (z > 0 ? "+" : "") + z.toFixed(1));

export const VERDICT_TEXT: Record<Verdict, string> = { survives: "survives", dies: "dies", fixed: "fixed by construction" };
export const VERDICT_TOKEN: Record<Verdict, string> = { survives: "--good", dies: "--bad", fixed: "--ink-mute-text" };

/**
 * The bars of `samples` over `domain` in the box [x0, x1] × [top, bottom], the
 * real value's line and label, and an optional curve (the normal overlay)
 * given as [x, count] pairs. yMax is the count at the top of the box.
 */
export function HistMarks({
  samples,
  real,
  realLabel,
  nd,
  bins,
  box,
  yMax,
  curve,
  scale,
  tokens,
}: {
  samples: number[];
  real: number;
  realLabel: string;
  nd: NullDomain;
  bins: number;
  box: { x0: number; x1: number; top: number; bottom: number };
  yMax: number;
  curve?: [number, number][];
  scale: TypeScale;
  tokens: Tokens;
}): ReactNode {
  const [a, b] = nd.domain;
  const sx = (x: number) => box.x0 + ((x - a) / (b - a)) * (box.x1 - box.x0);
  const sy = (c: number) => box.bottom - (Math.min(c, yMax) / yMax) * (box.bottom - box.top);
  const t = tokens;
  const hist = histogram(samples, { bins, domain: nd.domain });
  const rx = nd.off === -1 ? box.x0 : nd.off === 1 ? box.x1 : sx(real);
  const caption = scale.fs("caption");
  const text = nd.off === 1 ? `${realLabel} →` : nd.off === -1 ? `← ${realLabel}` : realLabel;
  const anchor = nd.off === 1 || rx > (box.x0 + box.x1) / 2 + (box.x1 - box.x0) * 0.3 ? "end" : nd.off === -1 || rx < box.x0 + (box.x1 - box.x0) * 0.2 ? "start" : "middle";
  const d = curve?.length ? curve.map(([x, c], i) => `${i ? "L" : "M"} ${sx(x).toFixed(1)} ${sy(c).toFixed(1)}`).join(" ") : null;
  return (
    <g>
      {hist.map((h, i) =>
        h.count > 0 ? <rect key={i} x={sx(h.x0) + 0.5} width={Math.max(0.5, sx(h.x1) - sx(h.x0) - 1)} y={sy(h.count)} height={box.bottom - sy(h.count)} fill={t["--access"]} opacity={0.75} /> : null,
      )}
      {d ? <path d={d} fill="none" stroke={t["--ink-soft"]} strokeWidth={1.5} strokeDasharray="4 3" /> : null}
      <line x1={box.x0} x2={box.x1} y1={box.bottom} y2={box.bottom} stroke={t["--line"]} strokeWidth={1} />
      <line x1={rx} x2={rx} y1={box.top - 2} y2={box.bottom} stroke={t["--people"]} strokeWidth={2} strokeDasharray={nd.off ? "3 2" : undefined} />
      <text x={anchor === "end" ? rx - 3 : anchor === "start" ? rx + 3 : rx} y={box.top - 6} fontSize={caption} fontWeight={700} fill={t["--ink"]} textAnchor={anchor}>
        {text}
      </text>
    </g>
  );
}
