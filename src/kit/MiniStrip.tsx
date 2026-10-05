// One row of StripChart without an axis, as week04-strip.js miniStrip()
// draws it, from miniLayout's geometry: the real value as a dot, the baseline
// as a band, an optional reference line and 95% interval. Drawn after
// hydration (the server renders nothing), at `width` first and then at its
// parent's width.
import { Fragment, useRef } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { useFittedWidth } from "@/lib/useSize";
import { useTextMeasure, useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { miniLayout as layout } from "@/scripts/week04-strip.js";
import { Band, Dot, Interval, MARK_TOKENS, SmartText, type Measure, type Tokens } from "./StripChart";

export type MiniSpec = {
  domain: [number, number];
  real: number;
  realLabel: string;
  base?: [number, number];
  baseLabel?: string;
  ref?: number;
  refLabel?: string;
  ci?: [number, number];
  aria?: string;
  width?: number;
};

// week04-strip.js is plain JS; this is the type its geometry is used with.
const miniLayout = layout as unknown as (spec: MiniSpec, width: number, measure: Measure) => any;

function MiniSvg({ spec, scale, measure, tokens }: { spec: MiniSpec; scale: TypeScale; measure: Measure; tokens: Tokens }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, spec.width ?? 300);
  const L = miniLayout(spec, width, measure);
  const { width: w, height: h, x0, x1, cy } = L;
  const t = tokens;
  // aria-label as main sets it, so a strip without one says "undefined" there too.
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`${spec.aria}`}>
      <Fragment key={width}>
        <line x1={x0} y1={cy} x2={x1} y2={cy} stroke={t["--line"]} strokeWidth={1} />
        {L.base ? <Band band={L.base.band} tip={spec.baseLabel} tokens={t} /> : null}
        {L.base?.label ? <SmartText label={L.base.label} scale={scale} tokens={t} /> : null}
        {L.ref ? <line x1={L.ref.x} y1={L.ref.y1} x2={L.ref.x} y2={L.ref.y2} stroke={t["--ink-soft"]} strokeWidth={1.3} strokeDasharray="3 2" /> : null}
        {L.ref?.label ? <SmartText label={L.ref.label} scale={scale} tokens={t} /> : null}
        {L.ci ? <Interval ci={L.ci} tip={L.ci.tip} tokens={t} /> : null}
        <Dot dot={L.real.dot} tip={spec.realLabel} tokens={t} />
        <SmartText label={L.real.label} fill={t["--ink"]} scale={scale} tokens={t} />
      </Fragment>
    </svg>
  );
}

/** <MiniStrip spec={{ domain, real, realLabel, base: [mean, sd], baseLabel, aria }} /> */
export default function MiniStrip({ spec }: { spec: MiniSpec }) {
  const hydrated = useHydrated();
  const scale = useTypeScale();
  const measure = useTextMeasure();
  const tokens = useTokens(MARK_TOKENS);
  if (!hydrated || !scale || !measure || !tokens) return null;
  return <MiniSvg spec={spec} scale={scale} measure={measure} tokens={tokens} />;
}
