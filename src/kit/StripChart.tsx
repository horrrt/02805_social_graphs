// The real network against its random baseline on a shared axis, as
// week04-strip.js stripChart() draws it: the same SVG elements, attributes and
// tooltips, from the same geometry (stripLayout). It draws once the page's
// type scale, colour tokens and text measure are read after hydration (the
// server renders nothing, as main's host held nothing), at the fallback width
// first and then at its parent's width (useFittedWidth). The marks of each
// width are drawn anew, as fitted() replaces the whole chart.
import { Fragment, useRef, type ReactNode } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { useFittedWidth } from "@/lib/useSize";
import { useTextMeasure, useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { stripLayout as layout } from "@/scripts/week04-strip.js";
import { Tipped } from "./HoverTipHost";

export type Measure = (text: unknown, role?: string, weight?: number | string) => number;
export type Tokens = Record<string, string>;

export type StripRow = {
  label: string;
  sub?: string;
  real?: number | null;
  realLabel?: string;
  realTip?: string;
  hollow?: boolean;
  color?: string;
  base?: [number, number];
  baseLabel?: string;
  baseTip?: string;
  ci?: [number, number];
  ciTip?: string;
  ref?: [number, string?];
  badge?: string;
  divider?: boolean;
  bold?: boolean;
};

export type StripOptions = {
  domain: [number, number];
  ticks: number[];
  fmt: (v: number) => string;
  aria?: string;
  width?: number;
  labelW?: number;
  rowH?: number;
  badgeW?: number;
  axisTitle?: string;
  zeroLine?: number;
  ref?: [number, string?];
  top?: number;
};

/** The tokens every strip mark reads, as week04-strip.js token() reads them from <body>. */
export const MARK_TOKENS = ["--ink", "--ink-soft", "--ink-mute", "--ink-mute-text", "--line", "--card", "--ground", "--w4-band", "--w4-grid"];

type Placed = { x: number; y: number; anchor: "start" | "middle" | "end"; text: string; role: string; weight: number | string };

// week04-strip.js is plain JS; these are the types its geometry is used with.
const stripLayout = layout as unknown as (rows: StripRow[], opts: StripOptions, width: number, measure: Measure) => any;

/** smartText(): a placed label, in --ink-soft unless a fill is given. */
export function SmartText({ label, fill, scale, tokens }: { label: Placed; fill?: string; scale: TypeScale; tokens: Tokens }) {
  const { x, y, anchor, text, role, weight } = label;
  return (
    <text x={x} y={y} fontSize={scale.fs(role)} fill={fill ?? tokens["--ink-soft"]} fontWeight={weight} textAnchor={anchor}>
      {text}
    </text>
  );
}

type BandAt = { x: number; y: number; width: number; mean: number; y1: number; y2: number };

/** band(): the baseline's band, with its tooltip on the rect, and its mean as a tick. */
export function Band({ band, tip, tokens }: { band: BandAt; tip?: string; tokens: Tokens }) {
  const { x, y, width, mean, y1, y2 } = band;
  return (
    <g>
      <Tipped tag="rect" tip={tip} x={x} y={y} width={width} height={12} rx={6} fill={tokens["--w4-band"]} />
      <line x1={mean} y1={y1} x2={mean} y2={y2} stroke={tokens["--ink-mute"]} strokeWidth={2} />
    </g>
  );
}

type IntervalAt = { lo: number; hi: number; y: number; y1: number; y2: number };

/** interval(): a 95% interval with end caps, its tooltip on the group. */
export function Interval({ ci, tip, tokens }: { ci: IntervalAt; tip?: string; tokens: Tokens }) {
  const { lo, hi, y, y1, y2 } = ci;
  const ink = tokens["--ink"];
  return (
    <Tipped tag="g" tip={tip}>
      <line x1={lo} y1={y} x2={hi} y2={y} stroke={ink} strokeWidth={2} />
      <line x1={lo} y1={y1} x2={lo} y2={y2} stroke={ink} strokeWidth={2} />
      <line x1={hi} y1={y1} x2={hi} y2={y2} stroke={ink} strokeWidth={2} />
    </Tipped>
  );
}

/** dot(): the real value; a colour "--name" is read as a token. */
export function Dot({ dot, color, hollow, tip, tokens }: { dot: { cx: number; cy: number; r: number }; color?: string; hollow?: boolean; tip?: string; tokens: Tokens }) {
  const c = color?.startsWith("--") ? tokens[color] : color;
  const fill = hollow ? tokens["--card"] : (c ?? tokens["--ink"]);
  const stroke = hollow ? (c ?? tokens["--ink"]) : tokens["--card"];
  return <Tipped tag="circle" tip={tip} cx={dot.cx} cy={dot.cy} r={dot.r} fill={fill} stroke={stroke} strokeWidth={2} />;
}

function StripSvg({ rows, opts, scale, measure, tokens }: { rows: StripRow[]; opts: StripOptions; scale: TypeScale; measure: Measure; tokens: Tokens }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, opts.width ?? 556);
  const L = stripLayout(rows, opts, width, measure);
  const { height: h, x0, x1, ybot } = L;
  const caption = scale.fs("caption");
  const small = scale.fs("small");
  const t = tokens;
  const marks: ReactNode[] = [];
  L.ticks.forEach((tick: { x: number; y: number; label: string }, i: number) => {
    marks.push(<line key={`tick-line ${i}`} x1={tick.x} y1={L.gridTop} x2={tick.x} y2={ybot} stroke={t["--w4-grid"]} strokeWidth={1} />);
    marks.push(
      <text key={`tick ${i}`} x={tick.x} y={tick.y} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="middle">
        {tick.label}
      </text>,
    );
  });
  if (L.zero !== undefined) marks.push(<line key="zero" x1={L.zero} y1={L.gridTop} x2={L.zero} y2={ybot} stroke={t["--ink-mute"]} strokeWidth={1} />);
  if (L.axisTitle) {
    const { x, y, text } = L.axisTitle;
    marks.push(
      <text key="axis-title" x={x} y={y} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="end">
        {text}
      </text>,
    );
  }
  if (L.ref) {
    marks.push(
      <Tipped key="ref" tag="line" tip={L.ref.tip} x1={L.ref.x} y1={L.gridTop} x2={L.ref.x} y2={ybot} stroke={t["--ink-soft"]} strokeWidth={1.4} strokeDasharray="3 2" />,
    );
    if (L.ref.label) marks.push(<SmartText key="ref-label" label={L.ref.label} fill={t["--ink-soft"]} scale={scale} tokens={t} />);
  }
  L.rows.forEach((g: any, i: number) => {
    const r = rows[i];
    const { cy } = g;
    const k = (part: string) => `${i} ${part}`;
    if (g.divider !== null)
      marks.push(<line key={k("divider")} x1={0} y1={g.divider} x2={width} y2={g.divider} stroke={t["--line"]} strokeWidth={1} strokeDasharray="2 3" />);
    marks.push(
      <text key={k("label")} x={g.label.x} y={g.label.y} fontSize={small} fill={t["--ink"]} fontWeight={g.weight}>
        {r.label}
      </text>,
    );
    if (g.sub)
      marks.push(
        <text key={k("sub")} x={g.sub.x} y={g.sub.y} fontSize={caption} fill={t["--ink-mute-text"]}>
          {r.sub}
        </text>,
      );
    marks.push(<line key={k("axis")} x1={x0} y1={cy} x2={x1} y2={cy} stroke={t["--line"]} strokeWidth={1} />);
    if (g.base) {
      marks.push(<Band key={k("band")} band={g.base.band} tip={r.baseTip} tokens={t} />);
      if (g.base.label) marks.push(<SmartText key={k("base-label")} label={g.base.label} scale={scale} tokens={t} />);
    }
    if (g.ref) {
      marks.push(
        <line key={k("ref")} x1={g.ref.x} y1={g.ref.y1} x2={g.ref.x} y2={g.ref.y2} stroke={t["--ink-soft"]} strokeWidth={1.4} strokeDasharray="3 2" />,
      );
      if (g.ref.label) marks.push(<SmartText key={k("ref-label")} label={g.ref.label} scale={scale} tokens={t} />);
    }
    if (g.ci) marks.push(<Interval key={k("ci")} ci={g.ci} tip={r.ciTip} tokens={t} />);
    if (g.real) {
      marks.push(<Dot key={k("dot")} dot={g.real.dot} color={r.color} hollow={r.hollow} tip={r.realTip} tokens={t} />);
      if (g.real.label) marks.push(<SmartText key={k("real-label")} label={g.real.label} fill={t["--ink"]} scale={scale} tokens={t} />);
    }
    if (g.badge) {
      const b = g.badge;
      marks.push(<rect key={k("badge")} x={b.x} y={b.y} width={b.width} height={22} rx={11} fill={t["--ground"]} />);
      marks.push(
        <text key={k("badge-text")} x={b.textX} y={b.textY} fontSize={small} fill={t["--ink"]} fontWeight={700} textAnchor="middle">
          {r.badge}
        </text>,
      );
    }
  });
  // aria-label as main sets it, so a chart without one says "undefined" there too.
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${h}`} width={width} height={h} role="img" aria-label={`${opts.aria}`} className="w4-strip">
      <Fragment key={width}>{marks}</Fragment>
    </svg>
  );
}

/** <StripChart rows={[{ label, real, realLabel, base: [mean, sd], baseLabel }]} opts={{ domain, ticks, fmt, aria }} /> */
export default function StripChart({ rows, opts }: { rows: StripRow[]; opts: StripOptions }) {
  const hydrated = useHydrated();
  const scale = useTypeScale();
  const measure = useTextMeasure();
  const colours = rows.map((r) => r.color).filter((c): c is string => Boolean(c?.startsWith("--")));
  const tokens = useTokens([...MARK_TOKENS, ...colours]);
  if (!hydrated || !scale || !measure || !tokens) return null;
  // No rows would draw a bare axis; say so instead.
  if (rows.length === 0) return <p className="kit-empty">No rows to show.</p>;
  return <StripSvg rows={rows} opts={opts} scale={scale} measure={measure} tokens={tokens} />;
}
