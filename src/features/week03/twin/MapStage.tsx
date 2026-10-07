"use client";
// Sections 4-5's flat map: the layer toggle and the map canvas, which the
// renderer draws (deck.gl into its own host beside it). The toggle and the
// canvas's pointer go live once the engine has started; the map repaints with
// the year, the selection, the layer and every repaint the page asks for, and
// the renderer's own pointer handlers read the canvas.
import { Fragment, type MouseEvent, type PointerEvent } from "react";
import { island } from "@/lib/island";
import { R, registerHost, setLayer } from "@/scripts/corridor.js";
import { VariantHost } from "../frame/ChartParts";
import { useCorridor, usePaint, useReady } from "../frame/shared";

const LAYERS = [
  ["migration", "Migration"],
  ["flights", "Flights"],
  ["both", "Both"],
  ["net", "Net"],
] as const;

type MapEvents = {
  click?: (canvas: HTMLCanvasElement, event: globalThis.MouseEvent) => void;
  move?: (canvas: HTMLCanvasElement, event: globalThis.PointerEvent) => void;
  leave?: () => void;
};

function MapStageView() {
  const ready = useReady();
  const layer = useCorridor((s) => s.layer);
  const deps = useCorridor((s) => [s.year, s.selected, s.layer, s.paint]);
  usePaint(ready, () => R.map(), deps);
  const events = (ready ? R.mapEvents : undefined) as MapEvents | undefined;
  return (
    <>
      <div className="map-tools">
        <div className="toggle" id="map-toggle" role="group">
          {LAYERS.map(([value, text], i) => (
            <Fragment key={value}>
              {i ? " " : null}
              <button
                aria-pressed={String(layer === value) as "true" | "false"}
                data-layer={value}
                type="button"
                onClick={() => {
                  if (ready) setLayer(value);
                }}
              >
                {text}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
      <canvas
        aria-label="Map of the most surprising bridges"
        height="450"
        id="map-canvas"
        role="img"
        width="900"
        ref={(el) => registerHost("map-canvas", el)}
        onClick={events?.click ? (e: MouseEvent<HTMLCanvasElement>) => events.click?.(e.currentTarget, e.nativeEvent) : undefined}
        onPointerMove={events?.move ? (e: PointerEvent<HTMLCanvasElement>) => events.move?.(e.currentTarget, e.nativeEvent) : undefined}
        onPointerLeave={events?.leave ? () => events.leave?.() : undefined}
      ></canvas>
      <VariantHost id="map-canvas" />
    </>
  );
}

function MapStagePlaceholder() {
  return (
    <>
      <div className="map-tools">
        <div className="toggle" id="map-toggle" role="group">
          {LAYERS.map(([value, text], i) => (
            <Fragment key={value}>
              {i ? " " : null}
              <button aria-pressed={value === "both" ? "true" : "false"} data-layer={value} type="button">
                {text}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
      <canvas aria-label="Map of the most surprising bridges" height="450" id="map-canvas" role="img" width="900"></canvas>
    </>
  );
}

export const MapStage = island("week03/twin/MapStage", MapStageView, MapStagePlaceholder, { roots: [".map-tools", "#map-canvas"] });
