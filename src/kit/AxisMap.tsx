// Items placed on two meaning axes (science ↔ magic across, street ↔ cosmic
// up), drawn by the kit's EChart as a scatter: the four axis ends named at
// the sides, dot size from `size`, one colour per `group`, highlighted points
// labelled, and points whose label contains `find` (case ignored) enlarged
// and labelled. onPick(key) follows a click on a point. The option is
// memoised, so the chart redraws only when its inputs change. Style: .kit-axismap
// in post.css.
import { useLayoutEffect, useMemo, useRef } from "react";
import { useTokens } from "@/lib/useTypeScale";
import EChart from "./EChart";

export type MapPoint = { key: string; label: string; x: number; y: number; size?: number; group?: string };
export type MapAxes = { left: string; right: string; bottom: string; top: string };

const TOKENS = ["--ink", "--card"];

/** <AxisMap points={[{ key: "strange", label: "Doctor Strange", x: 2.1, y: 1.7 }]} axes={{ left: "science", right: "magic", bottom: "street", top: "cosmic" }} /> */
export default function AxisMap({
  points,
  axes,
  highlight,
  find,
  onPick,
  height = 380,
}: {
  points: MapPoint[];
  axes: MapAxes;
  highlight?: string[];
  find?: string;
  onPick?: (key: string) => void;
  height?: number;
}) {
  const tokens = useTokens(TOKENS);
  const pick = useRef(onPick);
  useLayoutEffect(() => {
    pick.current = onPick;
  });
  const onEvents = useMemo(() => ({ click: (p: { data?: { key?: string } }) => p.data?.key && pick.current?.(p.data.key) }), []);
  const needle = (find ?? "").trim().toLowerCase();
  const option = useMemo(() => {
    const marked = new Set(highlight ?? []);
    const sizes = points.map((p) => p.size ?? 1);
    const [lo, hi] = [Math.min(...sizes), Math.max(...sizes)];
    const radius = (s: number) => (hi > lo ? 6 + 12 * Math.sqrt((s - lo) / (hi - lo)) : 9);
    const groups = [...new Set(points.map((p) => p.group ?? ""))];
    const ext = Math.max(1e-9, ...points.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)])) * 1.1;
    const axis = { type: "value", min: -ext, max: ext, axisLabel: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLine: { onZero: true, lineStyle: { type: "dashed" } } };
    return {
      grid: { left: 8, right: 8, top: 8, bottom: 8 },
      tooltip: { formatter: (p: { data: { name: string } }) => p.data.name },
      xAxis: axis,
      yAxis: axis,
      series: groups.map((g) => ({
        type: "scatter",
        name: g || "points",
        data: points
          .filter((p) => (p.group ?? "") === g)
          .map((p) => {
            const hit = needle !== "" && p.label.toLowerCase().includes(needle);
            const on = hit || marked.has(p.key);
            return {
              key: p.key,
              name: p.label,
              value: [p.x, p.y],
              symbolSize: radius(p.size ?? 1) * (hit ? 1.6 : 1),
              itemStyle: on && tokens ? { borderColor: tokens["--ink"], borderWidth: 2, opacity: 1 } : { opacity: needle ? 0.35 : 0.8 },
              label: { show: on, position: "right", formatter: p.label, fontWeight: 600 },
              z: on ? 3 : 2,
            };
          }),
      })),
    };
  }, [points, highlight, needle, tokens]);
  const named = points.filter((p) => (highlight ?? []).includes(p.key) || (needle !== "" && p.label.toLowerCase().includes(needle))).map((p) => p.label);
  const aria = `${points.length} ${points.length === 1 ? "point" : "points"} from ${axes.left} to ${axes.right} and ${axes.bottom} to ${axes.top}${named.length ? `; labelled: ${named.join(", ")}` : ""}`;
  return (
    <figure className="kit-axismap">
      <span className="kit-axis-top">↑ {axes.top}</span>
      <span className="kit-axis-left">← {axes.left}</span>
      <div className="kit-axismap-plot" role="img" aria-label={aria}>
        <EChart option={option} height={height} onEvents={onPick ? onEvents : undefined} />
      </div>
      <span className="kit-axis-right">{axes.right} →</span>
      <span className="kit-axis-bottom">↓ {axes.bottom}</span>
    </figure>
  );
}
