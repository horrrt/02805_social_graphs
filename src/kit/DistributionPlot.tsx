// A distribution drawn by the kit's EChart: one or more series of points
// (dots or a line), reference curves, optional ensemble envelopes (a median
// line over a shaded 5–95% band) and an optional side list of the top items.
// A series given as raw values (`ks`, say degrees) is drawn in the view the
// reader picks: raw P(k), mixed-binned P(k) or the CCDF (dist-core.js); a
// series given as `points` is drawn as it is in every view. Toggles pick the
// view and the axes, linear or log, together or one axis at a time. A log
// axis cannot show 0, so points at 0 are left off it and a note says how
// many. The option is memoised, so the chart redraws only when its inputs
// change. Style: .kit-dist in post.css.
import { useId, useMemo, useState, type ReactNode } from "react";
import { SegmentedControl } from "@/components/post/SegmentedControl";
import { useTokens } from "@/lib/useTypeScale";
import { binnedPk, ccdf, rawPk } from "./dist-core.js";
import EChart from "./EChart";
import { cssColour, markColour } from "./svgBits";

export type DistView = "raw" | "binned" | "ccdf";
export type AxisScale = "lin" | "log";
export type DistSeries = { key: string; name: string; ks?: number[]; points?: [number, number][]; style?: "dots" | "line"; color?: string };
export type RefCurve = { key: string; name: string; points: [number, number][]; color?: string };
export type Envelope = { key: string; name: string; rows: { x: number; median: number; lo: number; hi: number }[]; color?: string };
export type TopList = { title: string; items: { label: ReactNode; value: ReactNode }[] };

type ByView<T> = T | ((view: DistView) => T);

const VIEW_LABEL: Record<DistView, string> = { raw: "raw", binned: "binned", ccdf: "CCDF" };
const Y_LABEL: Record<DistView, string> = { raw: "P(k)", binned: "P(k), binned", ccdf: "P(K ≥ k)" };
const SERIES_COLOURS = ["--access", "--people", "--outbound"];
const TOKENS = ["--access", "--people", "--outbound", "--gain", "--ink-soft", "--ink-mute"];

const byView = <T,>(v: ByView<T> | undefined, view: DistView, fallback: T): T => (v === undefined ? fallback : typeof v === "function" ? (v as (view: DistView) => T)(view) : v);

const SUP: Record<string, string> = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
/** A tick on a log axis: plain down to 0.001, then 10 to a superscript power. */
export function logTick(v: number): string {
  if (v >= 0.001 || v <= 0) return String(+v.toPrecision(6));
  const e = Math.round(Math.log10(v));
  return Math.abs(v - 10 ** e) < 10 ** e * 1e-6 ? `10${String(e).replace(/./g, (c) => SUP[c] ?? c)}` : v.toExponential(0);
}

const fmt = (v: number) => (Math.abs(v) >= 1000 || v === 0 ? String(Math.round(v * 100) / 100) : String(+v.toPrecision(3)));

/** <DistributionPlot series={[{ key: "in", name: "in-degree", ks }]} refs={(v) => …} aria="…" /> */
export default function DistributionPlot({
  series,
  refs,
  envelopes,
  views,
  defaultView = "raw",
  scale = { x: "log", y: "log" },
  scaleToggle = "joint",
  xLabel = "k",
  yLabel,
  top,
  height = 320,
  aria,
}: {
  series: DistSeries[];
  refs?: ByView<RefCurve[]>;
  envelopes?: ByView<Envelope[]>;
  /** The view toggles; all three when any series has `ks`, none otherwise. */
  views?: DistView[];
  defaultView?: DistView;
  scale?: { x: AxisScale; y: AxisScale };
  scaleToggle?: "joint" | "split" | "none";
  xLabel?: string;
  yLabel?: ByView<string>;
  top?: TopList;
  height?: number;
  aria: string;
}) {
  const id = useId();
  const tokens = useTokens(TOKENS);
  const shownViews = views ?? (series.some((s) => s.ks) ? (["raw", "binned", "ccdf"] as DistView[]) : []);
  const [view, setView] = useState<DistView>(defaultView);
  const [xs, setXs] = useState<AxisScale>(scale.x);
  const [ys, setYs] = useState<AxisScale>(scale.y);
  const refList = useMemo(() => byView(refs, view, [] as RefCurve[]), [refs, view]);
  const envList = useMemo(() => byView(envelopes, view, [] as Envelope[]), [envelopes, view]);
  const yName = byView(yLabel, view, Y_LABEL[view]);

  const drawn = useMemo(() => {
    const xLog = xs === "log";
    const yLog = ys === "log";
    const fits = ([x, y]: [number, number]) => Number.isFinite(x) && Number.isFinite(y) && (!xLog || x > 0) && (!yLog || y > 0);
    let dropped = 0;
    const pts = series.map((s, i) => {
      const all: [number, number][] = s.ks ? ((view === "raw" ? rawPk(s.ks) : view === "binned" ? binnedPk(s.ks) : ccdf(s.ks)) as [number, number][]) : s.points ?? [];
      const kept = all.filter(fits);
      dropped += all.length - kept.length;
      return { s, i, kept };
    });
    const curves = refList.map((r) => ({ r, kept: r.points.filter(fits).sort((a, b) => a[0] - b[0]) }));
    const ys0 = [...pts.flatMap((p) => p.kept.map((q) => q[1])), ...envList.flatMap((e) => e.rows.flatMap((r) => [r.median, r.hi]))].filter((y) => y > 0);
    // On a log axis, a band's lower quantile of 0 is drawn down to the floor: half the smallest y shown.
    const floor = ys0.length ? Math.min(...ys0) / 2 : 1e-6;
    const bands = envList.map((e) => ({
      e,
      rows: e.rows.filter((r) => (!xLog || r.x > 0) && Number.isFinite(r.lo) && Number.isFinite(r.hi)).map((r) => ({ ...r, lo: yLog ? Math.max(r.lo, floor) : r.lo, hi: yLog ? Math.max(r.hi, floor) : r.hi })),
    }));
    return { pts, curves, bands, dropped, xLog, yLog };
  }, [series, refList, envList, view, xs, ys]);

  const option = useMemo(() => {
    if (!tokens) return null;
    const colourOf = (c: string | undefined, fallback: string) => markColour(c ?? fallback, tokens);
    const { pts, curves, bands, xLog, yLog } = drawn;
    const tip = (p: { seriesName: string; value: [number, number] }) => `${p.seriesName}<br/>${xLabel} ${fmt(p.value[0])}: ${fmt(p.value[1])}`;
    const axis = (log: boolean, name: string, gap: number) => ({
      type: log ? "log" : "value",
      ...(log ? { logBase: 10, axisLabel: { formatter: logTick } } : {}),
      name,
      nameLocation: "middle",
      nameGap: gap,
      splitLine: { show: true },
    });
    const out: Record<string, unknown>[] = [];
    for (const { e, rows } of bands) {
      const colour = colourOf(e.color, "--ink-mute");
      const quads = rows.slice(1).map((r, i) => [rows[i].x, rows[i].lo, rows[i].hi, r.x, r.lo, r.hi]);
      out.push({
        type: "custom",
        name: `${e.name}, 5–95%`,
        silent: true,
        tooltip: { show: false },
        clip: true,
        encode: { x: [0, 3], y: [1, 2, 4, 5] },
        data: quads,
        renderItem: (_: unknown, api: { value: (i: number) => number; coord: (p: number[]) => number[] }) => {
          const v = [0, 1, 2, 3, 4, 5].map((i) => api.value(i));
          return { type: "polygon", shape: { points: [api.coord([v[0], v[1]]), api.coord([v[3], v[4]]), api.coord([v[3], v[5]]), api.coord([v[0], v[2]])] }, style: { fill: colour, opacity: 0.2 } };
        },
        z: 1,
      });
      out.push({
        type: "line",
        name: `${e.name}, median`,
        showSymbol: false,
        data: rows.filter((r) => !yLog || r.median > 0).map((r) => [r.x, r.median]),
        lineStyle: { color: colour, width: 2 },
        itemStyle: { color: colour },
        tooltip: { formatter: tip },
        z: 2,
      });
    }
    for (const { r, kept } of curves) {
      const colour = colourOf(r.color, "--gain");
      out.push({ type: "line", name: r.name, showSymbol: false, data: kept, lineStyle: { color: colour, width: 2, type: "dashed" }, itemStyle: { color: colour }, tooltip: { formatter: tip }, z: 3 });
    }
    for (const { s, i, kept } of pts) {
      const colour = colourOf(s.color, SERIES_COLOURS[i % SERIES_COLOURS.length]);
      out.push(
        s.style === "line"
          ? { type: "line", name: s.name, showSymbol: kept.length < 2, data: kept, lineStyle: { color: colour, width: 2 }, itemStyle: { color: colour }, tooltip: { formatter: tip }, z: 4 }
          : { type: "scatter", name: s.name, symbolSize: 7, data: kept, itemStyle: { color: colour, opacity: 0.85 }, tooltip: { formatter: tip }, z: 4 },
      );
    }
    return {
      grid: { left: 64, right: 18, top: 14, bottom: 46 },
      xAxis: axis(xLog, xLabel, 28),
      yAxis: axis(yLog, yName, 50),
      series: out,
    };
  }, [drawn, tokens, xLabel, yName]);

  const scaleNote = `${xs === "log" ? "log" : "linear"} x, ${ys === "log" ? "log" : "linear"} y`;
  const label = `${aria}; ${shownViews.length ? `${VIEW_LABEL[view]} view, ` : ""}${scaleNote}`;
  const swatch = (kind: "dot" | "line" | "dash" | "band", colour: string) => <span className={`kit-swatch kit-swatch-${kind}`} style={{ color: cssColour(colour), background: kind === "dot" || kind === "band" ? cssColour(colour) : undefined }} />;
  const lin = { value: "lin", label: "linear" };

  return (
    <div className="kit-dist">
      {shownViews.length > 1 || scaleToggle !== "none" ? (
        <div className="kit-controls">
          {shownViews.length > 1 ? (
            <>
              <span className="kit-seg-label" id={`${id}-view`}>View</span>
              <SegmentedControl className="w5-chips" ariaLabelledBy={`${id}-view`} buttons={shownViews.map((v) => ({ value: v, label: VIEW_LABEL[v] }))} value={view} onChange={(v) => setView(v as DistView)} />
            </>
          ) : null}
          {scaleToggle === "joint" ? (
            <>
              <span className="kit-seg-label" id={`${id}-axes`}>Axes</span>
              <SegmentedControl
                className="w5-chips"
                ariaLabelledBy={`${id}-axes`}
                buttons={[lin, { value: "log", label: "log–log" }]}
                value={xs === ys ? xs : null}
                onChange={(v) => {
                  setXs(v as AxisScale);
                  setYs(v as AxisScale);
                }}
              />
            </>
          ) : null}
          {scaleToggle === "split" ? (
            <>
              <span className="kit-seg-label" id={`${id}-x`}>x axis</span>
              <SegmentedControl className="w5-chips" ariaLabelledBy={`${id}-x`} buttons={[lin, { value: "log", label: "log" }]} value={xs} onChange={(v) => setXs(v as AxisScale)} />
              <span className="kit-seg-label" id={`${id}-y`}>y axis</span>
              <SegmentedControl className="w5-chips" ariaLabelledBy={`${id}-y`} buttons={[lin, { value: "log", label: "log" }]} value={ys} onChange={(v) => setYs(v as AxisScale)} />
            </>
          ) : null}
        </div>
      ) : null}
      <div className={top ? "kit-dist-body kit-dist-with-top" : "kit-dist-body"}>
        <div className="kit-dist-plot" role="img" aria-label={label}>
          {option ? <EChart option={option} height={height} /> : null}
        </div>
        {top ? (
          <div className="kit-dist-top">
            <h4>{top.title}</h4>
            {top.items.length ? (
              <ol>
                {top.items.map((it, i) => (
                  <li key={i}>
                    <span className="kit-word">{it.label}</span>
                    <span className="kit-num">{it.value}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="kit-empty">Nothing to list.</p>
            )}
          </div>
        ) : null}
      </div>
      <ul className="kit-legend">
        {series.map((s, i) => (
          <li key={s.key}>
            {swatch(s.style === "line" ? "line" : "dot", s.color ?? SERIES_COLOURS[i % SERIES_COLOURS.length])}
            {s.name}
          </li>
        ))}
        {refList.map((r) => (
          <li key={r.key}>
            {swatch("dash", r.color ?? "--gain")}
            {r.name}
          </li>
        ))}
        {envList.map((e) => (
          <li key={e.key}>
            {swatch("band", e.color ?? "--ink-mute")}
            {e.name}: median and 5–95% of runs
          </li>
        ))}
      </ul>
      {drawn.dropped > 0 ? (
        <p className="kit-note">
          {drawn.dropped} {drawn.dropped === 1 ? "point" : "points"} at 0 left off the log {drawn.xLog && drawn.yLog ? "axes" : "axis"}.
        </p>
      ) : null}
    </div>
  );
}
