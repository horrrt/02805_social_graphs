// An ECharts chart at the site's type sizes and colours, as kit.js echart()
// draws it: the theme from the page's tokens, an item tooltip, overlapping
// labels hidden, the svg renderer, and a resize with its host (useEChart).
// Like echart(), it adds its host div only once the library has loaded, so a
// failed load leaves the figure around it as main left it: without a chart,
// and with one error logged.
import { useEffect, useMemo, useRef } from "react";
import { report } from "@/lib/island";
import { useEChart } from "@/lib/useEChart";
import { useHydrated } from "@/lib/useHydrated";
import { useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { useVendor } from "@/lib/useVendor";
import { PALETTE, palette } from "./palette";

const ECHARTS = "echarts-5.5.1.min.js";
const TOKENS = [...PALETTE, "--ink", "--line", "--line-soft"];

type Option = Record<string, any>;

// kit.js echart()'s merge, key for key: the option's own keys override the
// theme's tooltip, then its axes and series take the theme underneath.
function themed(option: Option, scale: TypeScale, tokens: Record<string, string>): Option {
  const text = { fontFamily: scale.family(), fontSize: scale.fs("small"), color: tokens["--ink"] };
  const axis = {
    axisLabel: { fontSize: scale.fs("caption"), color: tokens["--ink-mute"] },
    nameTextStyle: { fontSize: scale.fs("caption"), color: tokens["--ink-soft"] },
    axisLine: { lineStyle: { color: tokens["--line"] } },
    splitLine: { lineStyle: { color: tokens["--line-soft"] } },
  };
  const series = ([option.series ?? []].flat() as Option[]).map((s) => ({ labelLayout: { hideOverlap: true }, ...s }));
  const withAxis = (a: unknown) => (a === undefined ? a : ([a].flat() as Option[]).map((x) => ({ ...axis, ...x })));
  return {
    color: palette(tokens),
    textStyle: text,
    tooltip: { trigger: "item", textStyle: text, ...option.tooltip },
    ...option,
    xAxis: withAxis(option.xAxis),
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
  const full = useMemo(() => (scale && tokens ? themed(option, scale, tokens) : null), [option, scale, tokens]);
  const host = useRef<HTMLDivElement>(null);
  const ready = vendor.status === "ready";
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
