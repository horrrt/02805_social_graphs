// An ECharts chart at the site's type sizes and colours, as kit.js echart()
// draws it: the theme from the page's tokens, an item tooltip, overlapping
// labels hidden, the svg renderer, and a resize with its host (useEChart).
// Like echart(), it adds its host div only once the library has loaded, so a
// failed load leaves the figure around it as main left it: without a chart,
// and with one error logged.
import { useEffect, useMemo, useRef, useState } from "react";
import { report } from "@/lib/island";
import { useEChart } from "@/lib/useEChart";
import { useHydrated } from "@/lib/useHydrated";
import { useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { useVendor } from "@/lib/useVendor";
import { PALETTE, palette } from "./palette";

const ECHARTS = "echarts-5.5.1.min.js";
const TOKENS = [...PALETTE, "--ink", "--line", "--line-soft"];

type Option = Record<string, any>;

// The px each label of a category x axis gets at the host's width: ECharts'
// default grid leaves 80% of it to the plot. Null when the axis is not a
// category axis, the width is not known yet, or the labels would be under 40px,
// where ECharts' own thinning reads better than wrapped words.
function categoryLabelWidth(option: Option, hostWidth: number): number | null {
  const axis = [option.xAxis].flat()[0] as Option | undefined;
  const n = axis?.type === "category" && Array.isArray(axis.data) ? axis.data.length : 0;
  if (!n || !hostWidth) return null;
  const width = Math.floor((hostWidth * 0.8) / n) - 8;
  return width >= 40 ? width : null;
}

const hasData = (s: Option) => Array.isArray(s.data) ? s.data.length > 0 : s.data !== undefined;

// kit.js echart()'s merge, key for key: the option's own keys override the
// theme's tooltip, then its axes and series take the theme underneath. Two
// additions: every category label shows, wrapped to its slot (labelWidth), and
// a chart with no data says so in its middle.
function themed(option: Option, scale: TypeScale, tokens: Record<string, string>, labelWidth: number | null): Option {
  const text = { fontFamily: scale.family(), fontSize: scale.fs("small"), color: tokens["--ink"] };
  const axis = {
    axisLabel: { fontSize: scale.fs("caption"), color: tokens["--ink-mute"] },
    nameTextStyle: { fontSize: scale.fs("caption"), color: tokens["--ink-soft"] },
    axisLine: { lineStyle: { color: tokens["--line"] } },
    splitLine: { lineStyle: { color: tokens["--line-soft"] } },
  };
  // ECharts draws series labels and legend text in its own dark grey, not textStyle's colour.
  const series = ([option.series ?? []].flat() as Option[]).map((s) => ({
    labelLayout: { hideOverlap: true },
    ...s,
    ...(s.label ? { label: { color: tokens["--ink"], ...s.label } } : null),
  }));
  const legend =
    option.legend === undefined
      ? undefined
      : ([option.legend].flat() as Option[]).map((l) => ({ ...l, textStyle: { color: tokens["--ink"], ...l.textStyle } }));
  const withAxis = (a: unknown) => (a === undefined ? a : ([a].flat() as Option[]).map((x) => ({ ...axis, ...x })));
  const wrapped = (a: unknown) =>
    labelWidth === null
      ? a
      : ([a].flat() as Option[]).map((x, i) =>
          i === 0 ? { ...x, axisLabel: { interval: 0, width: labelWidth, overflow: "break", ...x.axisLabel } } : x,
        );
  const empty = !series.some(hasData);
  const noData = { type: "text", left: "center", top: "middle", style: { text: "No data to show.", fill: tokens["--ink"], fontSize: scale.fs("small"), fontFamily: scale.family() } };
  return {
    color: palette(tokens),
    textStyle: text,
    tooltip: { trigger: "item", textStyle: text, ...option.tooltip },
    ...(empty ? { graphic: noData } : null),
    ...option,
    ...(legend ? { legend } : null),
    xAxis: withAxis(wrapped(option.xAxis)),
    yAxis: withAxis(option.yAxis),
    series,
  };
}

/** <EChart option={{ xAxis, yAxis, series }} height={280} /> */
export default function EChart({
  option,
  height = 360,
  className = "kit-echart",
  renderer = "svg",
}: {
  option: Option;
  height?: number;
  className?: string;
  renderer?: "canvas" | "svg";
}) {
  const hydrated = useHydrated();
  const vendor = useVendor(ECHARTS, "echarts", { enabled: hydrated });
  const scale = useTypeScale();
  const tokens = useTokens(TOKENS);
  const host = useRef<HTMLDivElement>(null);
  const ready = vendor.status === "ready";
  const [hostWidth, setHostWidth] = useState(0);
  useEffect(() => {
    const el = host.current;
    if (!ready || !el) return;
    const observer = new ResizeObserver(() => setHostWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);
  const labelWidth = categoryLabelWidth(option, hostWidth);
  const full = useMemo(() => (scale && tokens ? themed(option, scale, tokens, labelWidth) : null), [option, scale, tokens, labelWidth]);
  useEChart(host, { option: full, enabled: ready && full !== null, renderer });

  const logged = useRef(false);
  useEffect(() => {
    if (vendor.status !== "error" || logged.current) return;
    logged.current = true;
    report("kit/EChart", vendor.error);
  }, [vendor]);

  if (!ready) return null;
  return <div className={className} style={{ height: `${height}px` }} ref={host} />;
}
