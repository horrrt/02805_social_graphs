// A permutation test as it runs: the histogram of the null samples drawn so
// far (the first `step` of `samples`), a fixed marker at the real value, an
// optional normal curve with the same mean and sd, and the readouts the test
// gives: null mean ± sd, z and the empirical p (dist-core.js nullStats, with
// the +1 correction). The x axis is set from every sample, so it stays put as
// the histogram grows; the y axis grows with the tallest bar. Drawn after
// hydration at its parent's width. Style: .kit-nullhist in post.css.
import { useRef } from "react";
import { useFittedWidth } from "@/lib/useSize";
import type { TypeScale } from "@/lib/useTypeScale";
import { histogram, normalPdf, nullStats } from "./dist-core.js";
import { HistMarks, fmt3, fmtP, fmtZ, niceTicks, nullDomain } from "./nullBits";
import { useSvgBase, type Tokens } from "./svgBits";

export type NullHistogramProps = {
  samples: number[];
  real: number;
  xLabel: string;
  normalOverlay?: boolean;
  /** How many of `samples` are drawn; all by default. */
  step?: number;
  bins?: number;
  realLabel?: string;
  fmt?: (v: number) => string;
};

const HEIGHT = 230;
const M = { top: 26, right: 16, bottom: 42, left: 40 };

type Stats = ReturnType<typeof nullStats>;

function Plot({ samples, shown, real, xLabel, normalOverlay, bins, realLabel, fmt, stats, scale, tokens }: { samples: number[]; shown: number[]; real: number; xLabel: string; normalOverlay: boolean; bins: number; realLabel: string; fmt: (v: number) => string; stats: Stats; scale: TypeScale; tokens: Tokens }) {
  const svg = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(svg, 520);
  const t = tokens;
  const nd = nullDomain(samples, real);
  const tallest = Math.max(0, ...histogram(shown, { bins, domain: nd.domain }).map((h) => h.count));
  const yTicks = niceTicks([0, Math.max(3, tallest)], 3);
  const yMax = Math.max(3, tallest, yTicks[yTicks.length - 1]);
  const box = { x0: M.left, x1: width - M.right, top: M.top, bottom: HEIGHT - M.bottom };
  const [a, b] = nd.domain;
  const sx = (x: number) => box.x0 + ((x - a) / (b - a)) * (box.x1 - box.x0);
  const sy = (c: number) => box.bottom - (c / yMax) * (box.bottom - box.top);
  const binW = (b - a) / bins;
  const curve: [number, number][] | undefined =
    normalOverlay && stats.sd && stats.mean !== null
      ? Array.from({ length: 81 }, (_, i) => {
          const x = a + ((b - a) * i) / 80;
          return [x, stats.n * binW * normalPdf(x, stats.mean as number, stats.sd as number)];
        })
      : undefined;
  const caption = scale.fs("caption");
  const aria = `${xLabel}: ${stats.n} null ${stats.n === 1 ? "sample" : "samples"}${stats.n ? `, mean ${fmt(stats.mean as number)} ± ${fmt(stats.sd as number)}` : ""}; ${realLabel} ${fmt(real)}${stats.n ? `, z ${fmtZ(stats.z)}, p ${fmtP(stats.pOne)} one-sided` : ""}${nd.off ? ", off the axis" : ""}`;
  return (
    <svg ref={svg} viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} role="img" aria-label={aria}>
      {yTicks.map((v, i) => (
        <g key={`y${i}`}>
          <line x1={box.x0} x2={box.x1} y1={sy(v)} y2={sy(v)} stroke={t["--w4-grid"]} strokeWidth={1} />
          <text x={box.x0 - 6} y={sy(v) + 4} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {niceTicks(nd.domain, 5).map((v, i) => (
        <text key={`x${i}`} x={sx(v)} y={box.bottom + 15} fontSize={caption} fill={t["--ink-mute-text"]} textAnchor="middle">
          {fmt(v)}
        </text>
      ))}
      <text x={(box.x0 + box.x1) / 2} y={HEIGHT - 6} fontSize={caption} fill={t["--ink-soft"]} textAnchor="middle">
        {xLabel}
      </text>
      <text x={12} y={(box.top + box.bottom) / 2} fontSize={caption} fill={t["--ink-soft"]} textAnchor="middle" transform={`rotate(-90 12 ${(box.top + box.bottom) / 2})`}>
        null samples
      </text>
      <HistMarks samples={shown} real={real} realLabel={`${realLabel} ${fmt(real)}`} nd={nd} bins={bins} box={box} yMax={yMax} curve={curve} scale={scale} tokens={tokens} />
    </svg>
  );
}

/** <NullHistogram samples={nullCs} real={0.32} xLabel="average clustering" step={shown} normalOverlay /> */
export default function NullHistogram({ samples, real, xLabel, normalOverlay = false, step, bins = 30, realLabel = "real", fmt = fmt3 }: NullHistogramProps) {
  const base = useSvgBase();
  const shown = step === undefined ? samples : samples.slice(0, Math.max(0, Math.floor(step)));
  const stats = nullStats(shown, real);
  return (
    <div className="kit-nullhist">
      <div className="kit-plot">{base ? <Plot samples={samples} shown={shown} real={real} xLabel={xLabel} normalOverlay={normalOverlay} bins={bins} realLabel={realLabel} fmt={fmt} stats={stats} {...base} /> : null}</div>
      {normalOverlay ? (
        <ul className="kit-legend">
          <li>
            <span className="kit-swatch" style={{ background: "var(--access)" }} />
            null samples
          </li>
          <li>
            <span className="kit-swatch kit-swatch-line" style={{ color: "var(--people)" }} />
            {realLabel}
          </li>
          <li>
            <span className="kit-swatch kit-swatch-dash" style={{ color: "var(--ink-soft)" }} />
            normal with the same mean and sd
          </li>
        </ul>
      ) : null}
      <dl className="kit-readouts">
        <div>
          <dt>samples</dt>
          <dd>
            {shown.length.toLocaleString("en-GB")}
            {shown.length < samples.length ? <small> of {samples.length.toLocaleString("en-GB")}</small> : null}
          </dd>
        </div>
        <div>
          <dt>{realLabel}</dt>
          <dd>{fmt(real)}</dd>
        </div>
        <div>
          <dt>null mean ± sd</dt>
          <dd>{stats.n ? `${fmt(stats.mean as number)} ± ${fmt(stats.sd as number)}` : "–"}</dd>
        </div>
        <div>
          <dt>z</dt>
          <dd>{fmtZ(stats.z)}</dd>
        </div>
        <div>
          <dt>p, one-sided</dt>
          <dd>{fmtP(stats.pOne)}</dd>
        </div>
        <div>
          <dt>p, two-sided</dt>
          <dd>{fmtP(stats.pTwo)}</dd>
        </div>
      </dl>
    </div>
  );
}
