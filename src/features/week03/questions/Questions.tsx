"use client";
// The questions drawer (questions.js on main): six canvas charts, each with
// its answer under it, drawn on the first open and again on every open, every
// restyle and every resize while it is open. Nothing is computed until a
// reader opens the drawer. The ring has its own year slider, which redraws it
// and rewrites its answer. A chart's pointer shows the shared tooltip and
// selects on a click, as the charts upstairs do.
import { useMemo, type MouseEvent, type PointerEvent } from "react";
import { island } from "@/lib/island";
import { useDocumentEvent } from "@/lib/useEvents";
import { registerHost } from "@/scripts/corridor.js";
import { QUESTION_YEAR, RING_SCOPE, answerQuestion, drawQuestion, questionPointer, ringYears, setRingYear } from "@/scripts/questions.js";
import { rich } from "../Rich";
import { ChartTable } from "../frame/ChartParts";
import { useCorridor, usePaint, useReady } from "../frame/shared";
import { useStore, type Store } from "@/lib/useStore";
import { questions as store, toggled } from "./store.js";

type QuestionsState = { open: boolean; opened: boolean; ringYear: number };
const questions = store as unknown as Store<QuestionsState>;
const useQuestions = <T,>(selector: (s: QuestionsState) => T) => useStore(questions, selector);

// ---- the drawer's open state -----------------------------------------------------

// A <details> toggle does not bubble, so it is caught on the way down.
function WatchService() {
  useDocumentEvent(
    "toggle",
    (event) => {
      const target = event.target as HTMLDetailsElement | null;
      if (target?.id === "questions") toggled(target.open);
    },
    { capture: true },
  );
  return null;
}

export const QuestionsWatch = island("week03/questions/QuestionsWatch", WatchService, () => null, { roots: "none", affects: ["#questions"] });

// ---- a chart and its table --------------------------------------------------------

type ChartProps = { id: string; width: string; height: string; label: string };

function QChartView({ id, width, height, label }: ChartProps) {
  const ready = useReady();
  const open = useQuestions((s) => s.open);
  const ringYear = useQuestions((s) => (id === "q-ring" ? s.ringYear : 0));
  const paint = useCorridor((s) => s.paint);
  usePaint(ready && open, () => drawQuestion(id), [ringYear, paint]);
  const table = useCorridor((s) => s.tables[id]);
  const live =
    ready && open
      ? {
          onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => questionPointer.move(e.currentTarget, e.nativeEvent),
          onPointerLeave: () => questionPointer.leave(),
          onClick: (e: MouseEvent<HTMLCanvasElement>) => questionPointer.click(e.currentTarget, e.nativeEvent),
        }
      : {};
  return (
    <>
      <canvas aria-label={label} className="chart" height={height} id={id} role="img" width={width} ref={(el) => registerHost(id, el)} {...live}></canvas>
      {table ? <ChartTable id={id} spec={table} /> : null}
    </>
  );
}

function QChartPlaceholder({ id, width, height, label }: ChartProps) {
  return <canvas aria-label={label} className="chart" height={height} id={id} role="img" width={width}></canvas>;
}

/** <QChart id="q-ring" width="760" height="660" label="Chart: …" /> in place of the server's canvas. */
export const QChart = island("week03/questions/QChart", QChartView, QChartPlaceholder, {
  roots: ["q-ring", "q-hosts", "q-distance", "q-wealth", "q-income", "q-sex"].map((id) => `[id="${id}"]`),
});

// ---- the answers ------------------------------------------------------------------

type AnswerProps = { chart: string };

// Written on the first open; the ring's again whenever its year moves.
function AnswerView({ chart }: AnswerProps) {
  const ready = useReady();
  const opened = useQuestions((s) => s.opened);
  const ringYear = useQuestions((s) => (chart === "q-ring" ? s.ringYear : 0));
  const html = useMemo(() => (ready && opened ? answerQuestion(chart) : null), [ready, opened, chart, ringYear]);
  return (
    <p className="qa-answer" id={`${chart}-answer`}>
      {rich(html)}
    </p>
  );
}

export const QAnswer = island("week03/questions/QAnswer", AnswerView, ({ chart }: AnswerProps) => <p className="qa-answer" id={`${chart}-answer`}></p>, {
  roots: ["q-ring", "q-hosts", "q-distance", "q-wealth", "q-income", "q-sex"].map((id) => `#${id}-answer`),
});

// ---- the ring's year ----------------------------------------------------------------

function RingControlsView() {
  const ready = useReady();
  const opened = useQuestions((s) => s.opened);
  const year = useQuestions((s) => s.ringYear);
  const live = ready && opened;
  const years: number[] = live ? ringYears() : [];
  const move = (e: { currentTarget: HTMLInputElement }) => {
    if (!live) return;
    const next = years[Number(e.currentTarget.value)] ?? QUESTION_YEAR;
    setRingYear(next);
    questions.setState({ ringYear: next });
  };
  return (
    <div className="qa-controls">
      <label htmlFor="q-ring-year">Year</label>
      <div className="qa-slider">
        <input
          value={live ? String(Math.max(years.indexOf(year), 0)) : "7"}
          onChange={move}
          onInput={move}
          aria-label="Year of the ring"
          aria-valuetext={live ? String(year) : undefined}
          id="q-ring-year"
          max={live ? String(years.length - 1) : "7"}
          min="0"
          step="1"
          type="range"
        />
        <div className="ends">
          <span>{live ? years[0] : 1990}</span>
          <span>{live ? years.at(-1) : 2024}</span>
        </div>
      </div>
      <b className="qa-slider-now" id="q-ring-now">{year}</b>
    </div>
  );
}

function RingControlsPlaceholder() {
  return (
    <div className="qa-controls">
      <label htmlFor="q-ring-year">Year</label>
      <div className="qa-slider">
        <input defaultValue="7" aria-label="Year of the ring" id="q-ring-year" max="7" min="0" step="1" type="range" />
        <div className="ends">
          <span>1990</span>
          <span>2024</span>
        </div>
      </div>
      <b className="qa-slider-now" id="q-ring-now">2024</b>
    </div>
  );
}

export const RingControls = island("week03/questions/RingControls", RingControlsView, RingControlsPlaceholder, {
  roots: [".qa-controls"],
  affects: ["#q-ring", "#q-ring-answer"],
});

function ScopeView() {
  const opened = useQuestions((s) => s.opened);
  const ready = useReady();
  return <p className="axis-note" id="q-ring-scope">{ready && opened ? RING_SCOPE : null}</p>;
}

export const RingScope = island("week03/questions/RingScope", ScopeView, () => <p className="axis-note" id="q-ring-scope"></p>, {
  roots: ["#q-ring-scope"],
});
