// A Week 4 ECharts host: the server's empty div until hydrated, then the same
// div with ECharts drawn in it (useEChart). With `reset`, the host gains the
// small "Reset view" button week04-map-reset.js added after echarts.init: it
// shows while `reset.show` is true and calls `reset.onReset` on a click.
import { useEffect, useRef, type HTMLAttributes, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { useEChart, type EChartsHandler, type EChartsInstance } from "@/lib/useEChart";
import { useHydrated } from "@/lib/useHydrated";

type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  option: object | null;
  onEvents?: Record<string, EChartsHandler>;
  renderer?: "canvas" | "svg";
  notMerge?: boolean;
  reset?: { show: boolean; onReset: () => void };
  chartRef?: MutableRefObject<EChartsInstance | null>;
  onChart?: (chart: EChartsInstance | null) => void;
  /** Start ECharts before there is an option (a chart whose option needs the instance's size). */
  eager?: boolean;
};

function ResetButton({ show, onReset }: { show: boolean; onReset: () => void }) {
  return (
    <button type="button" className="w4-map-reset" hidden={!show} onClick={onReset}>
      <svg aria-hidden="true" height="12" viewBox="0 0 24 24" width="12">
        <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4"></path>
      </svg>
      Reset view
    </button>
  );
}

/** <W4Chart id="chart-rank" className="chart-host tall" option={option} onEvents={{ click }} /> */
export function W4Chart({ option, onEvents, renderer = "canvas", notMerge = true, reset, chartRef, onChart, eager = false, className, ...host }: Props) {
  const hydrated = useHydrated();
  const ref = useRef<HTMLDivElement>(null);
  const chart = useEChart(ref, { option, onEvents, renderer, notMerge, enabled: hydrated && (eager || option !== null) });
  useEffect(() => {
    if (chartRef) chartRef.current = chart;
    onChart?.(chart);
  }, [chart, chartRef, onChart]);
  const cls = reset && chart ? `${className ?? ""} w4-has-reset`.trim() : className;
  return (
    <div {...host} className={cls} ref={ref}>
      {reset && chart && ref.current ? createPortal(<ResetButton {...reset} />, ref.current) : null}
    </div>
  );
}
