"use client";
// "How uneven are the links?": the axis-view select, the degree chart, its
// table and the sketch, which packs.js drew on main. The chart plots each
// incoming-link count's share of the 303 articles and, once the reader has
// drawn 20 cards, the share of their weighted draws; it repaints when the
// axis view or the collection changes. The sketch is the reader's own
// seven-bin guess, set by dragging or typing, compared with the snapshot on
// request.
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useCanvasStage } from "@/lib/useCanvas";
import { useHydrated } from "@/lib/useHydrated";
import { useStore } from "@/lib/useStore";
import { tone } from "@/scripts/cabinet.js";
import { font } from "@/scripts/type-scale.mjs";
import { type Model, usePacks } from "../packs/model";
import { packs } from "../packs/store.js";
import { chart, setScale } from "./store.js";

// ---- the axis view -------------------------------------------------------------------

function ScaleView() {
  const hydrated = useHydrated();
  return (
    <select id="degree-scale" onChange={hydrated ? (e) => setScale(e.target.value) : undefined}>
      <option value="linear">Linear</option>
      <option value="log">Log–log: incoming links + 1</option>
    </select>
  );
}

const ScaleHost = () => (
  <select id="degree-scale">
    <option value="linear">Linear</option>
    <option value="log">Log–log: incoming links + 1</option>
  </select>
);

export const DegreeScale = island("week01/chart/Scale", ScaleView, ScaleHost, { roots: ["#degree-scale"] });

// ---- the degree chart ---------------------------------------------------------------------

type Collection = { counts: Record<string, number>; pulls: number };
const collection = (s: Collection) => s;
const scaleOf = (s: { scale: string }) => s.scale;

function paintDegrees(c: CanvasRenderingContext2D, w: number, h: number, model: Model, log: boolean, { counts, pulls }: Collection) {
  const { data, packs: p, N, maxDegree } = model;
  const left = 53,
    right = 20,
    top = 30,
    bottom = 53,
    W = w - left - right,
    H = h - top - bottom;
  c.clearRect(0, 0, w, h);
  // Ticks and axis names only, so the whole chart is caption type.
  c.font = font("caption");
  c.fillStyle = tone("--cv-packs-text", "#46618a");
  c.strokeStyle = tone("--cv-packs-grid", "#dce5f0");
  const drawn = new Map<number, number>();
  for (const n of data.nodes) drawn.set(n.kin, (drawn.get(n.kin) || 0) + (counts[n.id] || 0));
  const snapshotShares = p.histogram.map((row) => (row.count / N) * 100);
  const drawnShares = pulls ? p.histogram.map((row) => ((drawn.get(row.degree) || 0) / pulls) * 100) : [];
  // The snapshot tops out near 19%; a fixed 0–100 axis wastes most of the
  // chart. Size it to what is actually on screen, rounded up a little.
  const maxY = log ? 100 : Math.max(5, Math.ceil(Math.max(...snapshotShares, ...drawnShares) / 5) * 5);
  // On the log axis, clamping every small share to a fixed 0.3% floor makes
  // a card drawn once in a thousand pulls look identical to one drawn never.
  // Use the smallest share one draw could actually produce instead.
  const logFloor = Math.min(0.3, pulls ? 100 / pulls : 0.3);
  const X = (k: number) => left + (log ? Math.log10(k + 1) / Math.log10(maxDegree + 1) : k / maxDegree) * W;
  const Y = (v: number) =>
    top +
    H -
    (log ? (Math.log10(Math.max(v, logFloor)) - Math.log10(logFloor)) / (Math.log10(maxY) - Math.log10(logFloor)) : v / maxY) * H;
  const yTicks = log ? [0.3, 1, 3, 10, 30, 100] : [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxY));
  for (const v of yTicks) {
    const y = Y(v);
    c.beginPath();
    c.moveTo(left, y);
    c.lineTo(w - right, y);
    c.stroke();
    c.fillText(v + "%", 5, y + 4);
  }
  for (const k of log ? [0, 1, 3, 9, 29, maxDegree] : [0, 20, 40, 60, 80, maxDegree]) {
    c.fillText(log ? String(k + 1) : String(k), X(k) - 5, h - bottom + 20);
  }
  for (const row of p.histogram) {
    const x = X(row.degree),
      y = Y((row.count / N) * 100);
    c.fillStyle = tone("--cv-packs-dot", "#14618f");
    c.beginPath();
    c.arc(x, y, 4, 0, Math.PI * 2);
    c.fill();
    if (pulls >= 20 && drawn.get(row.degree)) {
      c.strokeStyle = tone("--cv-packs-ring", "#f2820c");
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, Y((drawn.get(row.degree)! / pulls) * 100), 5, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.fillStyle = tone("--cv-packs-text", "#46618a");
  c.fillText(log ? "Incoming links + 1 (log scale)" : "Incoming links per article", left, h - 12);
  c.fillText(log ? "Share (%, logarithmic)" : "Share (%)", left, 16);
}

const CANVAS = { "aria-label": "The distribution of incoming links across all 303 articles. A table follows.", className: "stage", id: "degree-chart" };

function ChartView() {
  const model = usePacks();
  const state = useStore(packs, collection);
  const log = useStore(chart, scaleOf) === "log";
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useCanvasStage(ref, (c, w, h) => {
    if (model) paintDegrees(c, w, h, model, log, state);
  });
  useEffect(draw, [draw, model, log, state]);
  useIslandReady(model !== null);
  return <canvas ref={ref} {...CANVAS}></canvas>;
}

const ChartHost = () => <canvas {...CANVAS}></canvas>;

export const DegreeChart = island("week01/chart/Degrees", ChartView, ChartHost, { roots: ["#degree-chart"] });

// ---- the table ----------------------------------------------------------------------

function TableView() {
  const model = usePacks();
  useIslandReady(model !== null);
  return (
    <div className="table-scroll" id="degree-table">
      {model ? (
        <table>
          <thead>
            <tr>
              <th>Incoming links</th>
              <th className="num">Articles</th>
              <th className="num">Share</th>
            </tr>
          </thead>
          <tbody>
            {model.packs.histogram.map((r) => (
              <tr key={r.degree}>
                <td>{r.degree}</td>
                <td className="num">{r.count}</td>
                <td className="num">{`${((r.count / model.N) * 100).toFixed(2)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

const TableHost = () => <div className="table-scroll" id="degree-table"></div>;

export const DegreeTable = island("week01/chart/Table", TableView, TableHost, { roots: ["#degree-table"] });

// ---- the sketch ----------------------------------------------------------------------

function SketchMarkup({ inputs = null, canvas = null, onCompare, feedback = "" }: { inputs?: React.ReactNode; canvas?: React.ReactNode; onCompare?: () => void; feedback?: string }) {
  return (
    <>
      {canvas ?? <canvas aria-label="Sketch histogram. Equivalent editable counts for seven degree bins follow." className="stage" id="sketch-chart" tabIndex={0}></canvas>}
      <div className="sketch-grid" id="sketch-inputs">
        {inputs}
      </div>
      <button className="quiet" id="compare-sketch" onClick={onCompare}>
        Compare with the snapshot
      </button>
      <p id="sketch-feedback" role="status">
        {feedback}
      </p>
    </>
  );
}

const clamp = (v: number) => Math.max(0, Math.min(160, v));

function SketchView() {
  const model = usePacks();
  const [guess, setGuess] = useState([40, 40, 40, 40, 40, 40, 40]);
  const [raw, setRaw] = useState(["40", "40", "40", "40", "40", "40", "40"]);
  const [compare, setCompare] = useState(false);
  const [feedback, setFeedback] = useState("");
  const sketching = useRef(false);
  const ref = useRef<HTMLCanvasElement>(null);
  useIslandReady(model !== null);

  const bins = model
    ? [
        [0, 0],
        [1, 1],
        [2, 3],
        [4, 7],
        [8, 15],
        [16, 31],
        [32, model.maxDegree],
      ]
    : [];
  const actual = model ? bins.map(([a, b]) => model.data.nodes.filter((n) => n.kin >= a && n.kin <= b).length) : [];

  const draw = useCanvasStage(ref, (c, w, h) => {
    if (!model) return;
    c.clearRect(0, 0, w, h);
    const bw = (w - 50) / 7;
    for (let i = 0; i < 7; i++) {
      const x = 35 + i * bw,
        height = ((h - 55) * guess[i]) / 160;
      // Blue means the real snapshot and orange means a reader's own input in
      // the degree chart above; match that here instead of reversing it.
      c.fillStyle = tone("--cv-packs-bar-actual", "#f2820c");
      c.fillRect(x, h - 35 - height, bw * 0.38, height);
      if (compare) {
        c.fillStyle = tone("--cv-packs-bar", "#14618f");
        const ah = ((h - 55) * actual[i]) / 160;
        c.fillRect(x + bw * 0.4, h - 35 - ah, bw * 0.38, ah);
      }
      c.fillStyle = tone("--cv-packs-text", "#46618a");
      c.font = font("small", 700);
      c.fillText(String(guess[i]), x, h - 40 - height);
    }
    c.fillStyle = tone("--cv-packs-text", "#46618a");
    c.font = font("caption");
    c.fillText("Height = articles, 0–160. Horizontal bins are labelled below.", 20, 17);
  });
  useEffect(draw, [draw, model, guess, compare]);

  const set = (i: number, value: number, text: string) => {
    setGuess((g) => g.map((v, j) => (j === i ? value : v)));
    setRaw((r) => r.map((v, j) => (j === i ? text : v)));
  };
  const sketch = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect(),
      i = Math.floor((e.clientX - r.left - 35) / ((r.width - 50) / 7));
    if (i < 0 || i > 6) return;
    const value = clamp(Math.round(((r.height - 35 - (e.clientY - r.top)) / (r.height - 55)) * 160));
    set(i, value, String(value));
  };

  // The canvas keeps its ref from the first render, so the stage observes it from mount.
  const live = model !== null;
  const canvas = (
    <canvas
      ref={ref}
      aria-label="Sketch histogram. Equivalent editable counts for seven degree bins follow."
      className="stage"
      id="sketch-chart"
      tabIndex={0}
      style={live ? { touchAction: "none" } : undefined}
      onPointerDown={
        live
          ? (e) => {
              sketching.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              sketch(e);
            }
          : undefined
      }
      onPointerMove={
        live
          ? (e) => {
              if (sketching.current) sketch(e);
            }
          : undefined
      }
      onPointerUp={() => {
        sketching.current = false;
      }}
      onPointerCancel={() => {
        sketching.current = false;
      }}
    ></canvas>
  );
  if (!live) return <SketchMarkup canvas={canvas} />;
  const inputs = bins.map(([a, b], i) => (
    <label key={i}>
      {a === b ? a : a + "–" + b}
      <input
        type="number"
        min="0"
        max="160"
        step="1"
        value={raw[i]}
        data-bin={i}
        aria-label={`Articles with ${a} to ${b} incoming links`}
        onChange={(e) => set(i, clamp(Number(e.target.value) || 0), e.target.value)}
      />
    </label>
  ));
  return (
    <SketchMarkup
      canvas={canvas}
      inputs={inputs}
      feedback={feedback}
      onCompare={() => {
        setCompare(true);
        setFeedback(`Orange = your sketch; blue = snapshot. Actual counts from left to right: ${actual.join(", ")}. The distribution is uneven; this alone does not prove a power law.`);
      }}
    />
  );
}

const SketchHost = () => <SketchMarkup />;

export const Sketch = island("week01/chart/Sketch", SketchView, SketchHost, {
  roots: ["#sketch-chart", "#sketch-inputs", "#compare-sketch", "#sketch-feedback"],
});
