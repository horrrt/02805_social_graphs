"use client";
// A chart canvas, as the server rendered it, and what corridor.js added beside
// it: the host a renderer variant draws into instead (d3's SVG, an ECharts
// div), and the closed table of the numbers under it. The painter runs after
// every commit that changes what it reads; the pointer picks the country under
// it, shows the shared tooltip, and selects on a click.
import { type PointerEvent, type MouseEvent } from "react";
import { island } from "@/lib/island";
import { R, chartPointer, drawCartography, registerHost } from "@/scripts/corridor.js";
import { ChartTable, VariantHost } from "./ChartParts";
import { useCorridor, usePaint, useReady, type CorridorState } from "./shared";

type Paint = { run: () => void; deps: (s: CorridorState) => unknown[] };

// Every chart carries a marker for the selection and grows the hovered mark,
// so it follows both, the year slider, and every repaint the page asks for.
const follows = (s: CorridorState) => [s.year, s.selected, s.hover, s.paint];

const PAINTS: Record<string, Paint> = {
  hist: { run: () => R.hist(), deps: (s) => [...follows(s), s.axisMode.hist] },
  ccdf: { run: () => R.ccdf(), deps: (s) => [...follows(s), s.axisMode.ccdf] },
  "scatter-between": { run: () => R.scatterBetween(), deps: follows },
  "scatter-z": { run: () => R.scatterZ(), deps: follows },
  prestige: { run: () => R.prestige(), deps: follows },
  // One painter draws all three of section 8's charts.
  "dk-time": { run: () => R.denmark(), deps: follows },
  // The roles redraw with the year only, as renderTypology() drew them.
  cartography: { run: () => drawCartography(), deps: (s) => [s.year] },
};

type ChartProps = { id: string; width: string; height: string; label: string };

function ChartView({ id, width, height, label }: ChartProps) {
  const ready = useReady();
  const paint = PAINTS[id];
  const deps = useCorridor((s) => (paint ? paint.deps(s) : []));
  usePaint(ready && Boolean(paint), () => paint?.run(), deps);
  const table = useCorridor((s) => s.tables[id]);
  const live = ready
    ? {
        "data-picking": "on",
        title: "Click a point to select that country",
        onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => chartPointer.move(e.currentTarget, e.nativeEvent),
        onPointerLeave: () => chartPointer.leave(),
        onClick: (e: MouseEvent<HTMLCanvasElement>) => chartPointer.click(e.currentTarget, e.nativeEvent),
      }
    : {};
  return (
    <>
      <canvas
        aria-label={label}
        className="chart"
        height={height}
        id={id}
        role="img"
        width={width}
        ref={(el) => registerHost(id, el)}
        {...live}
      ></canvas>
      <VariantHost id={id} />
      {table ? <ChartTable id={id} spec={table} /> : null}
    </>
  );
}

function ChartPlaceholder({ id, width, height, label }: ChartProps) {
  return <canvas aria-label={label} className="chart" height={height} id={id} role="img" width={width}></canvas>;
}

/** <Chart id="hist" width="1100" height="560" label="Chart: …" /> in place of the server's canvas. */
export const Chart = island("week03/frame/Chart", ChartView, ChartPlaceholder, {
  roots: ["hist", "ccdf", "scatter-between", "scatter-z", "prestige", "cartography", "dk-time", "dk-rank", "dk-nordic"].map((id) => `[id="${id}"]`),
});
