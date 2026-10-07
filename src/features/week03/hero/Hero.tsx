"use client";
// The hero's two controls: the year slider, which every year-bound visual on
// the page follows, and the globe stage, which the canvas renderer turns under
// a drag and the other renderers replace with their own host (an SVG for d3,
// a WebGL host for globe.gl, the atlas and deck.gl), plus the hint under it.
import { type PointerEvent } from "react";
import { island } from "@/lib/island";
import { R, globePointer, registerHost, setYear, yearsOf } from "@/scripts/corridor.js";
import { useCorridor, usePaint, useReady } from "../frame/shared";
import { CLIENT_IDS } from "./ids";


// ---- the year slider -------------------------------------------------------------

function YearLineView() {
  const ready = useReady();
  const index = useCorridor((s) => s.yearIndex);
  const year = useCorridor((s) => s.year);
  // On every input event, as the old listener moved it: onChange alone skips
  // an input whose value a script set first (scripts/audit_week03.js does).
  const move = (e: { currentTarget: HTMLInputElement }) => {
    if (ready) setYear(Number(e.currentTarget.value));
  };
  return (
    <div className="yearline">
      <input
        value={ready && index !== null ? String(index) : "6"}
        onChange={move}
        onInput={move}
        aria-label="Year of the migration snapshot"
        id="year-slider"
        max={ready ? String(yearsOf().length - 1) : "7"}
        min="0"
        step="1"
        type="range"
      />
      <div className="ends">
        <span>1990</span>
        <span>2024</span>
      </div>
      <label htmlFor="year-slider">
        Year · moves the globe, the map, both distributions and the
        panels · showing
        {" "}
        <b id="year-now">{ready && year !== null ? String(year) : "2020"}</b>
      </label>
    </div>
  );
}

function YearLinePlaceholder() {
  return (
    <div className="yearline">
      <input defaultValue="6" aria-label="Year of the migration snapshot" id="year-slider" max="7" min="0" step="1" type="range" />
      <div className="ends">
        <span>1990</span>
        <span>2024</span>
      </div>
      <label htmlFor="year-slider">
        Year · moves the globe, the map, both distributions and the
        panels · showing
        {" "}
        <b id="year-now">2020</b>
      </label>
    </div>
  );
}

export const YearLine = island("week03/hero/YearLine", YearLineView, YearLinePlaceholder, { roots: [".yearline"], affects: "page" });

// ---- the globe stage -------------------------------------------------------------

const HINT = "Drag to spin. Click a country to inspect it.";

// The host each library renderer draws its globe into, after the canvas.
function GlobeHost({ renderer }: { renderer: string }) {
  const ref = (id: string) => (el: Element | null) => registerHost(id, el);
  if (renderer === "d3")
    return (
      <>
        <canvas id={CLIENT_IDS.d3Photo} ref={ref(CLIENT_IDS.d3Photo)}></canvas>
        <svg id={CLIENT_IDS.d3Globe} ref={ref(CLIENT_IDS.d3Globe)}></svg>
      </>
    );
  if (renderer === "globe") return <div id={CLIENT_IDS.globeGl} ref={ref(CLIENT_IDS.globeGl)}></div>;
  if (renderer === "atlas") return <div id={CLIENT_IDS.atlas} ref={ref(CLIENT_IDS.atlas)}></div>;
  if (renderer === "deck") return <div id={CLIENT_IDS.deckGlobe} ref={ref(CLIENT_IDS.deckGlobe)}></div>;
  return null;
}

function StageView() {
  const ready = useReady();
  const renderer = useCorridor((s) => s.renderer);
  const deps = useCorridor((s) => [s.year, s.selected, s.paint]);
  usePaint(ready, () => R.globe(), deps);
  const live = ready
    ? {
        onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => globePointer.down(e.currentTarget, e.nativeEvent),
        onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => globePointer.move(e.nativeEvent),
        onPointerUp: (e: PointerEvent<HTMLCanvasElement>) => globePointer.up(e.currentTarget, e.nativeEvent),
      }
    : {};
  return (
    <div className="stage-wrap">
      <canvas
        aria-label="Globe of the countries and the migration corridors between them"
        className="stage"
        height="900"
        id="globe-canvas"
        role="img"
        width="900"
        ref={(el) => registerHost("globe-canvas", el)}
        {...live}
      ></canvas>
      {ready ? <GlobeHost renderer={renderer} /> : null}
      <p className="stage-hint">{(ready && (R.hint as string | undefined)) || HINT}</p>
    </div>
  );
}

function StagePlaceholder() {
  return (
    <div className="stage-wrap">
      <canvas aria-label="Globe of the countries and the migration corridors between them" className="stage" height="900" id="globe-canvas" role="img" width="900"></canvas>
      <p className="stage-hint">{HINT}</p>
    </div>
  );
}

export const Stage = island("week03/hero/Stage", StageView, StagePlaceholder, { roots: [".stage-wrap"] });
