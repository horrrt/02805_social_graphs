"use client";
// The views drawer (echarts-views.js on main): four ECharts views the rest of
// the post cannot draw. ECharts is a megabyte, so nothing loads until a reader
// opens the drawer; then the library, then the two extra files, each failure
// said in the drawer's status line and leaving the other views alone. Every
// open and every restyle redraws; a resize only resizes. Each view keeps its
// own control: the force layout's year and floor, the area's direction, the
// grid's origin.
import { Fragment, useEffect, useMemo } from "react";
import { island } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useDocumentEvent } from "@/lib/useEvents";
import { useStore, type Store } from "@/lib/useStore";
import { useVendor } from "@/lib/useVendor";
import { registerHost, yearsOf } from "@/scripts/corridor.js";
import {
  areaNote,
  asylumOptions,
  drawView,
  floorLabel,
  floorOf,
  resizeViews,
  setLibrary,
  setViewData,
  setViews,
  viewAnswer,
} from "@/scripts/echarts-views.js";
import { asset } from "@/scripts/site.js";
import { rich } from "../Rich";
import { ChartTable } from "../frame/ChartParts";
import { useCorridor, usePaint, useReady } from "../frame/shared";
import { toggled, views as store } from "./store.js";

type ViewsState = {
  open: boolean;
  opened: boolean;
  library: "idle" | "loading" | "ready" | "error";
  asylum: "ready" | "error" | null;
  closures: "ready" | "error" | null;
  status: string;
  year: number;
  floor: number;
  mode: string;
  origin: string;
};
const views = store as unknown as Store<ViewsState>;
const useViews = <T,>(selector: (s: ViewsState) => T) => useStore(views, selector);

// ---- the drawer, the library and the two files --------------------------------------

function ViewsService() {
  const ready = useReady();
  const open = useViews((s) => s.open);
  const library = useViews((s) => s.library);
  // A <details> toggle does not bubble, so it is caught on the way down.
  useDocumentEvent(
    "toggle",
    (event) => {
      const target = event.target as HTMLDetailsElement | null;
      if (target?.id === "views") toggled(target.open);
    },
    { capture: true },
  );

  useEffect(() => {
    if (open && ready && library === "idle") views.setState({ library: "loading", status: "Loading the charting library (1 MB)…" });
  }, [open, ready, library]);
  const echarts = useVendor("echarts-5.5.1.min.js", "echarts", { enabled: library !== "idle" });
  useEffect(() => {
    if (library !== "loading") return;
    if (echarts.status === "ready") {
      setLibrary(echarts.lib);
      views.setState({ library: "ready", status: "" });
    } else if (echarts.status === "error") {
      views.setState({
        library: "error",
        status:
          `These views need Apache ECharts, and it did not load (${(echarts.error as Error)?.message}). ` +
          "Everything else on the page is drawn by hand and is unaffected.",
      });
    }
  }, [library, echarts]);

  // Two data files the rest of the page does not load. A failure on one of
  // them must not take the other three views down.
  const loaded = library === "ready";
  const asylum = useData(loaded ? asset("assets/data/week03_asylum.json") : null);
  const closures = useData(loaded ? asset("assets/data/week03_closures.json") : null);
  useEffect(() => {
    const settled = (s: { status: string }) => s.status === "ready" || s.status === "error";
    if (!loaded || !settled(asylum) || !settled(closures) || views.getState().asylum) return;
    setViewData({ asylum: asylum.data ?? null, closures: closures.data ?? null });
    const missing = [
      ...(asylum.status === "error" ? ["monthly asylum applications"] : []),
      ...(closures.status === "error" ? ["the border-closure tracker"] : []),
    ];
    views.setState({
      asylum: asylum.status as "ready" | "error",
      closures: closures.status as "ready" | "error",
      ...(missing.length ? { status: `Could not load ${missing.join(" or ")}; the other views are fine.` } : {}),
    });
  }, [loaded, asylum, closures]);

  useEffect(() => {
    if (!loaded) return;
    const controller = new AbortController();
    window.addEventListener("resize", () => resizeViews(), { signal: controller.signal });
    return () => controller.abort();
  }, [loaded]);
  return null;
}

export const ViewsWatch = island("week03/views/ViewsWatch", ViewsService, () => null, { roots: "none", affects: ["#views"] });

function StatusView() {
  const status = useViews((s) => s.status);
  return (
    <p aria-live="polite" className="status-line" id="v-status">
      {status}
    </p>
  );
}

export const ViewsStatus = island("week03/views/ViewsStatus", StatusView, () => <p aria-live="polite" className="status-line" id="v-status"></p>, {
  roots: ["#v-status"],
});

// ---- a view and its table ----------------------------------------------------------

// What each view redraws with, beside an open and a restyle.
const follows: Record<string, (s: ViewsState) => unknown[]> = {
  "v-graph": (s) => [s.year, s.floor],
  "v-area": (s) => [s.mode],
  "v-asylum": (s) => [s.origin, s.asylum],
  "v-closures": (s) => [s.closures],
};

function useDrawn(id: string) {
  const ready = useReady();
  const live = useViews((s) => s.library === "ready");
  const deps = useStore(views, (s) => follows[id](s), (a, b) => a.every((v, i) => Object.is(v, b[i])));
  return { ready: ready && live, deps };
}

type ViewProps = { id: string; className: string };

function VChartView({ id, className }: ViewProps) {
  const { ready, deps } = useDrawn(id);
  const open = useViews((s) => s.open);
  const restyles = useCorridor((s) => s.restyles);
  usePaint(ready && open, () => drawView(id), [restyles, ...deps]);
  const table = useCorridor((s) => s.tables[id]);
  return (
    <>
      <div className={className} id={id} ref={(el) => registerHost(id, el)}></div>
      {table ? <ChartTable id={id} spec={table} /> : null}
    </>
  );
}

/** <VChart id="v-graph" className="echart tall" /> in place of the server's host. */
export const VChart = island("week03/views/VChart", VChartView, ({ id, className }: ViewProps) => <div className={className} id={id}></div>, {
  roots: ["#v-graph", "#v-area", "#v-asylum", "#v-closures"],
});

// ---- the answers and the area's note -------------------------------------------------

type AnswerProps = { view: string };

function VAnswerView({ view }: AnswerProps) {
  const { ready, deps } = useDrawn(view);
  const opened = useViews((s) => s.opened);
  // Rewritten with every draw of its view, as the draws wrote them.
  const html = useMemo(() => (ready && opened ? viewAnswer(view) : null), [ready, opened, view, ...deps]);
  return (
    <p className="qa-answer" id={`${view}-answer`}>
      {rich(html)}
    </p>
  );
}

export const VAnswer = island("week03/views/VAnswer", VAnswerView, ({ view }: AnswerProps) => <p className="qa-answer" id={`${view}-answer`}></p>, {
  roots: ["#v-graph-answer", "#v-area-answer", "#v-asylum-answer", "#v-closures-answer"],
});

function AreaNoteView() {
  const { ready, deps } = useDrawn("v-area");
  const text = useMemo(() => (ready ? areaNote() : null), [ready, ...deps]);
  return <p className="axis-note" id="v-area-note">{text}</p>;
}

export const AreaNote = island("week03/views/AreaNote", AreaNoteView, () => <p className="axis-note" id="v-area-note"></p>, {
  roots: ["#v-area-note"],
});

// ---- the controls -------------------------------------------------------------------

function GraphControlsView({ years }: { years: number[] | null }) {
  const live = useViews((s) => s.library === "ready");
  const year = useViews((s) => s.year);
  const floor = useViews((s) => s.floor);
  const on = live && years !== null;
  const moveYear = (e: { currentTarget: HTMLInputElement }) => {
    if (!on || !years) return;
    const next = years[Number(e.currentTarget.value)] ?? years.at(-1)!;
    setViews({ year: next });
    views.setState({ year: next });
  };
  const moveFloor = (e: { currentTarget: HTMLInputElement }) => {
    if (!on) return;
    const next = floorOf(Number(e.currentTarget.value));
    setViews({ floor: next });
    views.setState({ floor: next });
  };
  return (
    <div className="qa-controls">
      <label htmlFor="v-graph-year">Year</label>
      <div className="qa-slider">
        <input
          value={on && years ? String(Math.max(years.indexOf(year), 0)) : "7"}
          onChange={moveYear}
          onInput={moveYear}
          aria-label="Year of the force layout"
          aria-valuetext={on ? String(year) : undefined}
          id="v-graph-year"
          max={on && years ? String(years.length - 1) : "7"}
          min="0"
          step="1"
          type="range"
        />
        <div className="ends">
          <span>1990</span>
          <span>2024</span>
        </div>
      </div>
      <b className="qa-slider-now" id="v-graph-year-now">{year}</b>
      {" "}
      <label htmlFor="v-graph-floor">Smallest corridor drawn</label>
      <div className="qa-slider">
        <input
          value={on ? String(Math.round(Math.log10(floor / 50000) * 20)) : "18"}
          onChange={moveFloor}
          onInput={moveFloor}
          aria-label="Smallest corridor drawn"
          id="v-graph-floor"
          max="40"
          min="0"
          step="1"
          type="range"
        />
        <div className="ends">
          <span>50k</span>
          <span>5m</span>
        </div>
      </div>
      <b className="qa-slider-now" id="v-graph-floor-now">{on ? floorLabel(floor) : "400k"}</b>
    </div>
  );
}

function GraphControlsLive() {
  const ready = useReady();
  const years = useMemo(() => (ready ? (yearsOf() as number[]) : null), [ready]);
  return <GraphControlsView years={years} />;
}

export const GraphControls = island("week03/views/GraphControls", GraphControlsLive, () => <GraphControlsView years={null} />, {
  roots: ["#v-graph-year", "#v-graph-floor"],
  affects: ["#v-graph", "#v-graph-answer"],
});

const MODES = [
  ["in", "Arrived"],
  ["out", "Left"],
  ["both", "Both"],
] as const;

function AreaModesView() {
  const live = useViews((s) => s.library === "ready");
  const mode = useViews((s) => s.mode);
  return (
    <div aria-label="Which direction the bands count" className="axis-modes" id="v-area-mode" role="group">
      {MODES.map(([value, text], i) => (
        <Fragment key={value}>
          {i ? " " : null}
          <button
            aria-pressed={String(mode === value) as "true" | "false"}
            data-mode={value}
            type="button"
            onClick={() => {
              if (!live) return;
              setViews({ mode: value });
              views.setState({ mode: value });
            }}
          >
            {text}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

function AreaModesPlaceholder() {
  return (
    <div aria-label="Which direction the bands count" className="axis-modes" id="v-area-mode" role="group">
      {MODES.map(([value, text], i) => (
        <Fragment key={value}>
          {i ? " " : null}
          <button aria-pressed={value === "in" ? "true" : "false"} data-mode={value} type="button">
            {text}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

export const AreaModes = island("week03/views/AreaModes", AreaModesView, AreaModesPlaceholder, {
  roots: ["#v-area-mode"],
  affects: ["#v-area", "#v-area-answer", "#v-area-note"],
});

function OriginPickerView() {
  const has = useViews((s) => s.asylum === "ready");
  const origin = useViews((s) => s.origin);
  const options = useMemo(() => (has ? asylumOptions() : []), [has]);
  return (
    <select
      aria-label="Country of citizenship"
      id="v-asylum-origin"
      value={origin}
      onChange={(e) => {
        setViews({ origin: e.target.value });
        views.setState({ origin: e.target.value });
      }}
    >
      {options.map((o: { code: string; label: string }) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const OriginPicker = island(
  "week03/views/OriginPicker",
  OriginPickerView,
  () => <select aria-label="Country of citizenship" id="v-asylum-origin"></select>,
  { roots: ["#v-asylum-origin"], affects: ["#v-asylum", "#v-asylum-answer"] },
);
