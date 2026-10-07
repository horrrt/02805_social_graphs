// A board of network measures against null models: which measures survive which nulls.
// A grid of small histograms, one row per measure and one column per null
// model, each with the real value's line; each panel's title says its verdict
// in words and is tinted by it (survives, dies, or fixed by construction when
// the null holds the measure equal to the real value). Under the grid, a
// table of the numbers. Hovering or focusing a panel highlights its row, and
// hovering a row highlights its panel. Verdicts come from dist-core.js
// (nullStats, verdict) unless a cell sets its own. Drawn after hydration;
// each panel at its own width. Style: .kit-board in post.css.
import { useRef, useState } from "react";
import { useFittedWidth } from "@/lib/useSize";
import type { TypeScale } from "@/lib/useTypeScale";
import { histogram, nullStats, verdict as verdictOf } from "./dist-core.js";
import { HistMarks, VERDICT_TEXT, VERDICT_TOKEN, fmt3, fmtP, fmtZ, nullDomain, type Verdict } from "./nullBits";
import { cssColour, useSvgBase, type Tokens } from "./svgBits";

export type BoardAxis = { key: string; label: string };
export type BoardCell = { measure: string; model: string; samples: number[]; real: number; verdict?: Verdict };

const PANEL_H = 92;
// Odd, so a null held at one value fills the bin the real value's line runs through.
const BINS = 21;

type Row = BoardCell & { key: string; measureLabel: string; modelLabel: string; stats: ReturnType<typeof nullStats>; v: Verdict | null };

function Panel({ row, fmt, scale, tokens }: { row: Row; fmt: (v: number) => string; scale: TypeScale; tokens: Tokens }) {
  const svg = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(svg, 220);
  const nd = nullDomain(row.samples, row.real);
  const box = { x0: 6, x1: width - 6, top: 20, bottom: PANEL_H - 18 };
  const [a, b] = nd.domain;
  const yMax = Math.max(1, ...histogram(row.samples, { bins: BINS, domain: nd.domain }).map((h) => h.count));
  const caption = scale.fs("caption");
  return (
    <svg ref={svg} viewBox={`0 0 ${width} ${PANEL_H}`} width={width} height={PANEL_H} aria-hidden="true">
      <HistMarks samples={row.samples} real={row.real} realLabel={fmt(row.real)} nd={nd} bins={BINS} box={box} yMax={yMax} scale={scale} tokens={tokens} />
      <text x={box.x0} y={PANEL_H - 4} fontSize={caption} fill={tokens["--ink-mute-text"]} textAnchor="start">
        {fmt(a)}
      </text>
      <text x={box.x1} y={PANEL_H - 4} fontSize={caption} fill={tokens["--ink-mute-text"]} textAnchor="end">
        {fmt(b)}
      </text>
    </svg>
  );
}

/** <NullBoard measures={[{ key: "C", label: "clustering" }]} models={[{ key: "er", label: "G(n, m)" }]} cells={[{ measure: "C", model: "er", samples, real: 0.32 }]} /> */
export default function NullBoard({
  measures,
  models,
  cells,
  alpha = 0.05,
  fmt = fmt3,
  caption,
}: {
  measures: BoardAxis[];
  models: BoardAxis[];
  cells: BoardCell[];
  alpha?: number;
  fmt?: (v: number) => string;
  caption?: string;
}) {
  const base = useSvgBase(["--good", "--bad"]);
  const [hot, setHot] = useState<string | null>(null);
  const label = (list: BoardAxis[], key: string) => list.find((x) => x.key === key)?.label ?? key;
  const rows: Row[] = cells.map((c) => {
    const stats = nullStats(c.samples, c.real);
    return { ...c, key: `${c.measure}\u0000${c.model}`, measureLabel: label(measures, c.measure), modelLabel: label(models, c.model), stats, v: c.verdict ?? verdictOf(stats, c.real, { alpha }) };
  });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  if (!rows.length || !measures.length || !models.length)
    return (
      <div className="kit-board">
        <p className="kit-empty">No measures or null models to show.</p>
      </div>
    );
  const hover = (key: string | null) => () => setHot(key);
  return (
    <div className="kit-board">
      <div className="kit-board-grid" style={{ gridTemplateColumns: `minmax(0, 9em) repeat(${models.length}, minmax(0, 1fr))` }}>
        <span />
        {models.map((m) => (
          <span key={m.key} className="kit-board-head">
            {m.label}
          </span>
        ))}
        {measures.map((ms) => [
          <span key={`${ms.key}-label`} className="kit-board-measure">
            {ms.label}
          </span>,
          ...models.map((md) => {
            const r = byKey.get(`${ms.key}\u0000${md.key}`);
            if (!r) return <div key={`${ms.key}-${md.key}`} className="kit-board-panel kit-board-none" />;
            const colour = r.v ? VERDICT_TOKEN[r.v] : "--ink-mute-text";
            const words = r.v ? VERDICT_TEXT[r.v] : "no samples";
            return (
              <div
                key={r.key}
                className={`kit-board-panel${hot === r.key ? " kit-on" : ""}`}
                style={{ borderTopColor: cssColour(colour) }}
                tabIndex={0}
                role="img"
                aria-label={`${r.measureLabel} under ${r.modelLabel}: real ${fmt(r.real)}${r.stats.n ? `, null ${fmt(r.stats.mean as number)} ± ${fmt(r.stats.sd as number)}, z ${fmtZ(r.stats.z)}, p ${fmtP(r.stats.pTwo)}` : ""}; ${words}`}
                onMouseEnter={hover(r.key)}
                onMouseLeave={hover(null)}
                onFocus={hover(r.key)}
                onBlur={hover(null)}
              >
                <b style={{ color: cssColour(colour) }}>
                  {words}
                  {r.stats.z !== null ? <small> z {fmtZ(r.stats.z)}</small> : null}
                </b>
                <div className="kit-plot">{base ? <Panel row={r} fmt={fmt} {...base} /> : null}</div>
              </div>
            );
          }),
        ])}
      </div>
      <table className="kit-board-table">
        {caption ? <caption>{caption}</caption> : null}
        <colgroup>
          <col className="kit-board-c-measure" />
          <col className="kit-board-c-model" />
          <col className="kit-board-c-num" />
          <col className="kit-board-c-null" />
          <col className="kit-board-c-num" />
          <col className="kit-board-c-num" />
          <col className="kit-board-c-verdict" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Measure</th>
            <th scope="col">Null model</th>
            <th scope="col" className="num">Real</th>
            <th scope="col" className="num">Null mean ± sd</th>
            <th scope="col" className="num">z</th>
            <th scope="col" className="num">p, two-sided</th>
            <th scope="col">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={hot === r.key ? "kit-on" : undefined} onMouseEnter={hover(r.key)} onMouseLeave={hover(null)}>
              <td>{r.measureLabel}</td>
              <td>{r.modelLabel}</td>
              <td className="num">{fmt(r.real)}</td>
              <td className="num">{r.stats.n ? `${fmt(r.stats.mean as number)} ± ${fmt(r.stats.sd as number)}` : "–"}</td>
              <td className="num">{fmtZ(r.stats.z)}</td>
              <td className="num">{fmtP(r.stats.pTwo)}</td>
              <td className={r.v ? `kit-verdict kit-verdict-${r.v}` : "kit-verdict"}>{r.v ? VERDICT_TEXT[r.v] : "no samples"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
