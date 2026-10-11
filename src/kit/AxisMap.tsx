// Items placed on two meaning axes (science ↔ magic across, street ↔ cosmic
// up), drawn by the kit's EChart as a scatter: the four axis ends named at
// the sides, dot size from `size`, one colour per `group`, highlighted points
// labelled, and points whose label contains `find` (case ignored) enlarged
// and labelled. onPick(key) follows a click on a point. The option is
// memoised, so the chart redraws only when its inputs change. Options for
// comparing two rates (scattertext style): `log` puts both axes on a log
// scale (points at or below 0 are left out and counted), `diagonal` draws
// y = x, `sides` colours points above, below and near the diagonal in place
// of the groups, `selected` rings one point, and `detail` is shown under the
// map. Style: .kit-axismap in post.css.
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useTokens, useTypeScale } from "@/lib/useTypeScale";
import EChart from "./EChart";
import { cssColour } from "./svgBits";

export type MapPoint = { key: string; label: string; x: number; y: number; size?: number; group?: string };
export type MapAxes = { left: string; right: string; bottom: string; top: string };
/** Names for the points above, below and near y = x; `band` is how near counts (log10 units on log axes). */
export type MapSides = { above: string; below: string; similar?: string; band?: number };

const TOKENS = ["--ink", "--card", "--access", "--people", "--ink-mute", "--ink-mute-text", "--line", "--line-soft"];
const SIDES = [
  ["above", "--access"],
  ["similar", "--ink-mute"],
  ["below", "--people"],
] as const;

// The power-of-ten bounds around positive values.
function decades(values: number[]): [number, number] {
  if (values.length === 0) return [1, 10];
  const lo = 10 ** Math.floor(Math.log10(Math.min(...values)));
  const hi = 10 ** Math.ceil(Math.log10(Math.max(...values)));
  return [lo, hi > lo ? hi : lo * 10];
}
const tick = (v: number) => String(+v.toPrecision(v >= 1 ? 3 : 2));

/** <AxisMap points={[{ key: "strange", label: "Doctor Strange", x: 2.1, y: 1.7 }]} axes={{ left: "science", right: "magic", bottom: "street", top: "cosmic" }} /> */
export default function AxisMap({
  points,
  axes,
  highlight,
  find,
  onPick,
  height = 380,
  log,
  diagonal,
  sides,
  selected,
  detail,
}: {
  points: MapPoint[];
  axes: MapAxes;
  highlight?: string[];
  find?: string;
  onPick?: (key: string) => void;
  height?: number;
  log?: boolean;
  diagonal?: boolean;
  sides?: MapSides;
  selected?: string;
  detail?: ReactNode;
}) {
  const tokens = useTokens(TOKENS);
  const scale = useTypeScale();
  const pick = useRef(onPick);
  useLayoutEffect(() => {
    pick.current = onPick;
  });
  const onEvents = useMemo(() => ({ click: (p: { data?: { key?: string } }) => p.data?.key && pick.current?.(p.data.key) }), []);
  const needle = (find ?? "").trim().toLowerCase();
  const kept = useMemo(() => (log ? points.filter((p) => p.x > 0 && p.y > 0) : points), [points, log]);
  const sideOf = useMemo(() => {
    if (!sides) return null;
    const band = Math.max(0, sides.band ?? (log ? 0.05 : 0));
    return (p: MapPoint) => {
      const d = log ? Math.log10(p.y / p.x) : p.y - p.x;
      return d > band ? "above" : d < -band ? "below" : "similar";
    };
  }, [sides, log]);
  const option = useMemo(() => {
    const marked = new Set(highlight ?? []);
    if (selected !== undefined) marked.add(selected);
    const sizes = kept.map((p) => p.size ?? 1);
    const [lo, hi] = [Math.min(...sizes), Math.max(...sizes)];
    const radius = (s: number) => (hi > lo ? 6 + 12 * Math.sqrt((s - lo) / (hi - lo)) : 9);
    const groups: string[] = sideOf ? SIDES.map(([s]) => s) : [...new Set(kept.map((p) => p.group ?? ""))];
    const groupOf = (p: MapPoint) => (sideOf ? sideOf(p) : p.group ?? "");
    const ext = Math.max(1e-9, ...kept.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)])) * 1.1;
    const axis = { type: "value", min: -ext, max: ext, axisLabel: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLine: { onZero: true, lineStyle: { type: "dashed" } } };
    // Log axes name their ticks; the theme's label style is replaced, not merged, so it is set here.
    const logAxis = ([min, max]: [number, number]) => ({
      type: "log",
      logBase: 10,
      min,
      max,
      axisLabel: { show: true, formatter: tick, fontSize: scale?.fs("caption"), color: tokens?.["--ink-mute-text"] },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: tokens?.["--line-soft"] } },
      axisLine: { onZero: false, lineStyle: { color: tokens?.["--line"] } },
    });
    const xr = decades(kept.map((p) => p.x));
    const yr = decades(kept.map((p) => p.y));
    // With the diagonal both axes share one range, so y = x runs corner to corner.
    const shared: [number, number] = [Math.min(xr[0], yr[0]), Math.max(xr[1], yr[1])];
    const [dLo, dHi] = log ? shared : [-ext, ext];
    // On log axes the largest point can sit on the last decade line, so labels in the right third go left.
    const [xLo, xHi] = diagonal ? shared : xr;
    const labelAt = (p: MapPoint) => (log && Math.log10(p.x / xLo) / Math.log10(xHi / xLo) > 0.67 ? "left" : "right");
    const line = diagonal
      ? [{ type: "line", name: "y = x", data: [[dLo, dLo], [dHi, dHi]], silent: true, symbol: "none", z: 1, tooltip: { show: false }, lineStyle: { type: "dashed", width: 1, color: tokens?.["--ink-mute"] } }]
      : [];
    const sideName = (g: string) => (g === "above" ? sides?.above : g === "below" ? sides?.below : sides?.similar ?? "similar");
    const sideColour = (g: string) => tokens?.[SIDES.find(([s]) => s === g)?.[1] ?? "--ink-mute"];
    return {
      grid: log ? { left: 8, right: 16, top: 12, bottom: 8, containLabel: true } : { left: 8, right: 8, top: 8, bottom: 8 },
      tooltip: { formatter: (p: { data: { name: string } }) => p.data.name },
      xAxis: log ? logAxis(diagonal ? shared : xr) : axis,
      yAxis: log ? logAxis(diagonal ? shared : yr) : axis,
      series: [...line, ...groups.map((g) => ({
        type: "scatter",
        name: sideOf ? sideName(g) : g || "points",
        ...(sideOf ? { itemStyle: { color: sideColour(g) } } : null),
        data: kept
          .filter((p) => groupOf(p) === g)
          .map((p) => {
            const hit = needle !== "" && p.label.toLowerCase().includes(needle);
            const on = hit || marked.has(p.key);
            return {
              key: p.key,
              name: p.label,
              value: [p.x, p.y],
              symbolSize: radius(p.size ?? 1) * (hit ? 1.6 : 1),
              itemStyle: on && tokens ? { borderColor: tokens["--ink"], borderWidth: 2, opacity: 1 } : { opacity: needle ? 0.35 : 0.8 },
              label: { show: on, position: labelAt(p), formatter: p.label, fontWeight: 600 },
              z: on ? 3 : 2,
            };
          }),
      }))],
    };
  }, [kept, highlight, selected, needle, tokens, scale, log, diagonal, sides, sideOf]);
  const named = kept.filter((p) => (highlight ?? []).includes(p.key) || p.key === selected || (needle !== "" && p.label.toLowerCase().includes(needle))).map((p) => p.label);
  const dropped = points.length - kept.length;
  const sideLabel = (s: string) => (s === "above" ? sides?.above : s === "below" ? sides?.below : sides?.similar ?? "similar");
  const counts = sideOf ? SIDES.map(([s]) => kept.filter((p) => sideOf(p) === s).length) : [];
  const aria =
    `${kept.length} ${kept.length === 1 ? "point" : "points"} from ${axes.left} to ${axes.right} and ${axes.bottom} to ${axes.top}` +
    (log ? "; log axes" : "") +
    (dropped ? `; ${dropped} left out at or below zero` : "") +
    (diagonal ? "; dashed line y = x" : "") +
    (sideOf ? `; ${SIDES.map(([s], i) => `${counts[i]} ${sideLabel(s)}`).join(", ")}` : "") +
    (named.length ? `; labelled: ${named.join(", ")}` : "");
  return (
    <figure className="kit-axismap">
      <span className="kit-axis-top">↑ {axes.top}</span>
      <span className="kit-axis-left">← {axes.left}</span>
      <div className="kit-axismap-plot" role="img" aria-label={aria}>
        <EChart option={option} height={height} onEvents={onPick ? onEvents : undefined} />
      </div>
      <span className="kit-axis-right">{axes.right} →</span>
      <span className="kit-axis-bottom">↓ {axes.bottom}</span>
      {sides ? (
        <ul className="kit-legend kit-axismap-foot">
          {SIDES.map(([s, colour], i) => (
            <li key={s}>
              <span className="kit-swatch" style={{ background: cssColour(colour) }} />
              {sideLabel(s)} ({counts[i]})
            </li>
          ))}
          {dropped ? <li>{dropped} left out at or below zero</li> : null}
        </ul>
      ) : log && dropped ? (
        <p className="kit-note kit-axismap-foot">{dropped} left out at or below zero.</p>
      ) : null}
      {detail ? <div className="kit-axismap-foot kit-axismap-detail">{detail}</div> : null}
    </figure>
  );
}
