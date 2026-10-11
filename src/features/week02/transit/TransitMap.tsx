"use client";
// "Explore the 16-station interchange map": the line chips, the schematic and
// its description, which transit.js drew on main. A chip picks one line (or
// all tracks); hovering or focusing a chip lights that line in the all-tracks
// view. The closed station is drawn crossed out with dashed track.
import { useEffect, useMemo, useRef } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useCanvasStage } from "@/lib/useCanvas";
import { useStore } from "@/lib/useStore";
import { tone } from "@/scripts/cabinet.js";
import { font, fs } from "@/scripts/type-scale.mjs";
import { type Model, useTransit } from "./model";
import { hoverLine, selectLine, transit } from "./store.js";

type State = { closed: string | null; line: number; hover: number | null };
const all = (s: State) => s;

const CANVAS = {
  "aria-label": "Schematic map of real links among 16 high-degree articles. The selected line’s station list appears below.",
  className: "stage transit-map",
  id: "transit-map",
};

function paintMap(c: CanvasRenderingContext2D, w: number, h: number, model: Model, { closed, line: selectedLine, hover }: State) {
  const { transit: t, name } = model;
  const stationById = new Map(t.stations.map((n) => [n.id, n]));
  // The rows of the schematic grid, so a same-row segment can be routed
  // through the gap between rows instead of straight through it.
  const rowsY = [...new Set(t.stations.map((s) => s.y))].sort((a, b) => a - b);
  const rowGap = rowsY.length > 1 ? rowsY[1] - rowsY[0] : 170;
  // One token holds all seven line colours as a comma-separated list.
  const colors = tone("--cv-transit-lines", "#005c68,#b23e29,#765096,#27784a,#956900,#254caa,#972d68")
    .split(",")
    .map((s: string) => s.trim());
  c.clearRect(0, 0, w, h);
  const sx = w / 1030,
    sy = (h - 30) / 780;
  const pt = (id: string): [number, number] => {
    const s = stationById.get(id)!;
    return [s.x * sx, s.y * sy + 20];
  };
  const renderLine = (line: Model["transit"]["lines"][number], active: boolean) => {
    c.strokeStyle = active ? colors[(line.id - 1) % colors.length] : tone("--cv-transit-line-inactive", "#d3dce8");
    c.lineWidth = active ? 4 : 1;
    c.lineJoin = "round";
    for (let i = 1; i < line.stations.length; i++) {
      const a = line.stations[i - 1],
        b = line.stations[i],
        p = pt(a),
        q = pt(b);
      c.setLineDash(a === closed || b === closed ? [4, 5] : []);
      c.beginPath();
      c.moveTo(...p);
      if (p[1] === q[1]) {
        // A same-row run would otherwise draw straight through every
        // station between its ends. Route it through the gap between
        // rows instead, the way the lane jump below already keeps a
        // cross-row run clear of intervening station columns.
        const rowY = stationById.get(a)!.y,
          lastRow = rowY === rowsY[rowsY.length - 1],
          corridor = (lastRow ? rowY - rowGap / 2 : rowY + rowGap / 2) * sy + 20 + ((line.id % 5) - 2) * 3;
        c.lineTo(p[0], corridor);
        c.lineTo(q[0], corridor);
        c.lineTo(...q);
      } else {
        // Offset track lanes keep a direct edge from visually stopping at intervening stations.
        const d = Math.min(16, w / 48) + (line.id % 3) * 2,
          sign = q[0] >= p[0] ? 1 : -1,
          offset = (line.id % 2 ? 1 : -1) * d;
        let lane = (p[0] + q[0]) / 2;
        if (t.stations.some((s) => Math.abs(s.x * sx - lane) < d)) lane += d * 1.8;
        c.lineTo(p[0] + sign * d, p[1] + offset);
        c.lineTo(lane, p[1] + offset);
        c.lineTo(lane, q[1] + offset);
        c.lineTo(q[0] - sign * d, q[1] + offset);
        c.lineTo(...q);
      }
      c.stroke();
    }
    c.setLineDash([]);
  };
  // In "All tracks" every line shares a neutral grey; only the selected or
  // hovered line takes its own colour, so 15 lines never repeat a hue.
  t.lines.filter((l) => l.id !== selectedLine).forEach((l) => renderLine(l, selectedLine === 0 && l.id === hover));
  const current = t.lines.find((l) => l.id === selectedLine);
  if (current) renderLine(current, true);
  for (const station of t.stations) {
    const [x, y] = pt(station.id),
      active = !current || current.stations.includes(station.id);
    c.fillStyle = tone("--cv-transit-station-fill", "#ffffff");
    if (station.id === closed) c.strokeStyle = tone("--cv-transit-station-closed", "#d9480f");
    else if (active) c.strokeStyle = tone("--cv-transit-station-active", "#0f2340");
    else c.strokeStyle = tone("--cv-transit-station-inactive", "#7a8fac");
    c.lineWidth = active ? 2 : 1;
    c.beginPath();
    c.arc(x, y, station.id === closed ? 7 : 5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    if (station.id === closed) {
      c.beginPath();
      c.moveTo(x - 5, y - 5);
      c.lineTo(x + 5, y + 5);
      c.stroke();
    }
    // Station names are small type; the stations on the chosen route are
    // heavier, and colour carries the same difference.
    c.font = font("small", active ? 700 : 600);
    c.textAlign = "center";
    const words = name(station.id).split(" "),
      lines: string[] = [];
    let line = "";
    const max = w / 4 - 12;
    for (const word of words) {
      if (c.measureText(line + " " + word).width > max && line) {
        lines.push(line);
        line = word;
      } else line += (line ? " " : "") + word;
    }
    if (line) lines.push(line);
    const size = fs("small"),
      step = Math.ceil(size * 1.25);
    lines.forEach((text, i) => {
      const yy = y + 20 + i * step;
      const width = c.measureText(text).width;
      c.fillStyle = tone("--cv-transit-label-bg", "#ffffffee");
      c.fillRect(x - width / 2 - 3, yy - Math.ceil(size), width + 6, step);
      c.fillStyle = active ? tone("--cv-transit-label-active", "#0f2340") : tone("--cv-transit-label-inactive", "#46618a");
      c.fillText(text, x, yy);
    });
  }
  c.textAlign = "left";
  c.fillStyle = tone("--cv-transit-caption", "#46618a");
  c.font = font("caption");
  c.fillText("Circles = stations. Unmarked crossings are not connections.", 12, h - 12);
}

function MapView() {
  const model = useTransit();
  const state = useStore(transit, all);
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useCanvasStage(ref, (c, w, h) => {
    if (model) paintMap(c, w, h, model, state);
  });
  useEffect(draw, [draw, model, state]);
  useIslandReady(model !== null);
  const description = useMemo(() => {
    if (!model) return "";
    const { transit: t, name } = model;
    const line = t.lines.find((l) => l.id === state.line);
    const totalLinks = t.lines.reduce((sum, l) => sum + l.stations.length - 1, 0);
    return line
      ? `Line ${line.id}: ${line.stations.map(name).join(" → ")}. ${state.closed ? "Closed station: " + name(state.closed) + "." : ""}`
      : `All ${totalLinks} real links among these 16 hubs. Crossings without a station circle are not connections. Select one line for a clearer view.`;
  }, [model, state.line, state.closed]);
  return (
    <>
      <div className="line-chips" id="line-chips">
        {model
          ? [...model.transit.lines.map((l) => l.id), 0].map((id) => {
              const hover = id !== 0 ? (on: boolean) => () => hoverLine(on ? id : null) : null;
              return (
                <button
                  key={id}
                  className="quiet"
                  data-line={id}
                  aria-pressed={state.line === id}
                  onClick={() => selectLine(id)}
                  onMouseEnter={hover?.(true)}
                  onMouseLeave={hover?.(false)}
                  onFocus={hover?.(true)}
                  onBlur={hover?.(false)}
                >
                  {id === 0 ? "All tracks" : `Line ${id}`}
                </button>
              );
            })
          : null}
      </div>
      <canvas ref={ref} {...CANVAS}></canvas>
      <p className="fine" id="line-description" role="status">
        {description}
      </p>
    </>
  );
}

function MapHost() {
  return (
    <>
      <div className="line-chips" id="line-chips"></div>
      <canvas {...CANVAS}></canvas>
      <p className="fine" id="line-description" role="status"></p>
    </>
  );
}

export const TransitMap = island("week02/transit/Map", MapView, MapHost, { roots: ["#line-chips", "#transit-map", "#line-description"] });
