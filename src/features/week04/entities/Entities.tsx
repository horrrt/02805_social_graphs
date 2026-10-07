"use client";
// The deep dive's box of every worker and company (#entity-communities),
// which week04-entities.js drew on main: deck.gl dots coloured by community,
// sector, wage level or PageRank, or the staffing and law-firm networks at a
// chosen backbone, with the legend, caption, strips, plots, the course's
// weeks and the table. Nothing loads until the box first opens.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { StripChart } from "@/kit";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import { island, useIslandReady } from "@/lib/island";
import { useFittedWidth } from "@/lib/useSize";
import { useVendor } from "@/lib/useVendor";
import { useDeck, type DeckInstance } from "@/lib/useWebGL";
import {
  ENTITY_TOKENS,
  FILES,
  NET_TEXT,
  ccdfLayout,
  curveLayout,
  entityStrip,
  entityTable,
  entityText,
  entityView,
  fit,
  labelStrip,
  layoutDots,
  networkStrip,
  networkTable,
  networkText,
  networkView,
  weeks,
} from "@/scripts/week04-entities.js";
import { W4Table } from "../W4Table";
import { W4, useW4Data } from "../useW4Data";
import { useT, type T } from "../useT";

type Entity = keyof typeof FILES;
type State = { entity: Entity; by: string; focus: string | number | null; alpha: number | null; dropped: string };
type Rgb = (name: string) => number[];

const ENTITIES: [Entity, string][] = [
  ["workers", "Workers"],
  ["companies", "Companies"],
  ["staffing", "Staffing network"],
  ["lawfirms", "Law-firm network"],
];

// Headings of the chart slots, as the page writes them; the network views rename them.
const SLOT_TEXT: Record<string, string> = {
  "labels-head": "What the groups follow",
  "labels-note":
    "NMI between the groups and each label, weighted by workers. Hollow dots were never part of the network. Bands: the same label shuffled, the level a label with that many values reaches by chance. Dashed: two Louvain seeds against each other.",
  "ccdf-head": "How many links?",
  "ccdf-note": "Share of occupations, metros, levels and sectors with at least a given number of links or workers, log-log.",
};

// Any CSS colour value as [r, g, b], read through a canvas.
function rgbReader(T: T): Rgb {
  const probe = document.createElement("canvas").getContext("2d")!;
  return (name) => {
    probe.fillStyle = "black";
    probe.fillStyle = T.token(name);
    const v = String(probe.fillStyle);
    if (v.startsWith("#")) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
    return (v.match(/\d+/g) ?? []).slice(0, 3).map(Number);
  };
}

// ---- the plots

function Curve({ d, alpha, T }: { d: any; alpha: number; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, 420);
  const L = curveLayout(d, alpha, width);
  const caption = T.fs("caption");
  const muted = T.token("--ink-mute-text");
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${L.h}`} width={width} height={L.h} role="img" aria-label="Share of links, nodes with a link and giant component kept at each alpha.">
      {L.grid.map((g: any) => [
        <line key={`g${g.label}`} x1={L.m.l} x2={width - L.m.r} y1={g.y} y2={g.y} stroke={T.token("--w4-grid")} />,
        <text key={`t${g.label}`} x={L.m.l - 6} y={g.y + 4} textAnchor="end" fontSize={caption} fill={muted}>
          {g.label}
        </text>,
      ])}
      {L.xTicks.map((t: any) => (
        <text key={t.label} x={t.x} y={L.h - L.m.b + 16} textAnchor="middle" fontSize={caption} fill={muted}>
          {t.label}
        </text>
      ))}
      <text x={width - L.m.r} y={L.h - 4} textAnchor="end" fontSize={caption} fill={muted}>
        disparity filter α (log scale)
      </text>
      <line x1={L.cut} x2={L.cut} y1={L.m.t} y2={L.h - L.m.b} stroke={T.token("--ink-soft")} strokeDasharray="3 3" />
      {L.series.map((s: any) => [
        <polyline key={`p${s.label}`} points={s.points} fill="none" stroke={T.token(s.colour)} strokeWidth={2} strokeDasharray={s.dashed ? "5 3" : "none"} />,
        s.dot ? (
          <circle key={`c${s.label}`} cx={s.dot.cx} cy={s.dot.cy} r={4.5} fill={T.token(s.colour)}>
            <title>{s.dot.tip}</title>
          </circle>
        ) : null,
        <text key={`l${s.label}`} x={L.m.l + 8} y={s.y} fontSize={caption} fill={T.token(s.colour === "--ink-mute" ? "--ink-mute-text" : s.colour)} fontWeight={600}>
          {s.label}
        </text>,
      ])}
    </svg>
  );
}

function Ccdf({ d, T }: { d: any; T: T }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, 420);
  const L = ccdfLayout(d, width);
  const caption = T.fs("caption");
  const muted = T.token("--ink-mute-text");
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${L.h}`}
      width={width}
      height={L.h}
      role="img"
      className="w4-entities-ccdf"
      aria-label="Share of attribute nodes with at least a given degree or strength, on log-log axes."
    >
      {L.grid.map((g: any) => [
        <line key={`g${g.label}`} x1={L.m.l} x2={width - L.m.r} y1={g.y} y2={g.y} stroke={T.token("--w4-grid")} />,
        <text key={`t${g.label}`} x={L.m.l - 6} y={g.y + 4} textAnchor="end" fontSize={caption} fill={muted}>
          {g.label}
        </text>,
      ])}
      {L.xTicks.map((t: any) => (
        <text key={t.label} x={t.x} y={L.h - L.m.b + 16} textAnchor="middle" fontSize={caption} fill={muted}>
          {t.label}
        </text>
      ))}
      <text x={width - L.m.r} y={L.h - 4} textAnchor="end" fontSize={caption} fill={muted}>
        links or workers (log)
      </text>
      {L.series.map((s: any) => [
        <g key={`s${s.label}`}>
          <title>{s.label}</title>
          <polyline points={s.points} fill="none" stroke={T.token(s.colour)} strokeWidth={2} />
          {s.dots.map((c: any, i: number) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={2.4} fill={T.token(s.colour)}>
              <title>{c.tip}</title>
            </circle>
          ))}
        </g>,
        <text key={`l${s.label}`} x={width - L.m.r} y={s.y} textAnchor="end" fontSize={caption} fill={T.token(s.colour === "--ink-mute" ? "--ink-mute-text" : s.colour)} fontWeight={600}>
          {s.label}
        </text>,
      ])}
    </svg>
  );
}

// ---- the box

type Shown = {
  net: boolean;
  data: any;
  view: { layers: unknown[]; getTooltip: unknown; legend: { key: string | number; label: string; colour: number[] }[]; stats?: string[][]; alpha?: number };
  text: { answer: string; caption: string };
  strips: { rows: StripRow[]; opts: StripOptions };
  labels: { rows: StripRow[]; opts: StripOptions } | null;
  table: { head: { text: string; className?: string }[]; rows: { text: string; className?: string; swatch?: string }[][]; title: string };
};

const EMPTY_HEAD = ["#", "Group", "Workers", "H-1B", "PERM", "Main occupation", "Largest employers"].map((text) => ({
  text,
  className: ["Workers", "H-1B", "PERM"].includes(text) ? "num" : undefined,
}));

function Body({
  shown,
  state,
  status,
  T,
  mapRef,
  on,
}: {
  shown: Shown | null;
  state: State;
  status: string | null;
  T: T | null;
  mapRef?: React.Ref<HTMLDivElement>;
  on?: {
    entity: (e: Entity) => void;
    by: (by: string) => void;
    alpha: (a: number) => void;
    dropped: (d: string) => void;
    focus: (key: string | number) => void;
    reset: () => void;
    keyDown: (e: KeyboardEvent) => void;
  };
}) {
  const net = shown?.net ?? false;
  const slot = (key: string) => (net ? (NET_TEXT as Record<string, string>)[key] ?? SLOT_TEXT[key] : SLOT_TEXT[key]);
  const table = shown?.table;
  return (
    <div className="card w4-card">
      <header className="w4-q">
        <span className="w4-num">7</span>
        <div>
          <h2>Do workers group by job and pay, or by who files for them?</h2>
          <p className="w4-answer" data-entities="answer">
            {shown ? shown.text.answer : "Loading the filings…"}
          </p>
        </div>
      </header>
      <figure className="w4-entities" id="entity-communities" onKeyDown={on?.keyDown}>
        <div className="w4-entities-controls">
          <div aria-label="What each dot is" className="w4-entities-switch" role="group">
            {ENTITIES.map(([entity, label]) => (
              <button key={entity} aria-pressed={state.entity === entity ? "true" : "false"} data-entity={entity} type="button" onClick={on ? () => on.entity(entity) : undefined}>
                {label}
              </button>
            ))}
          </div>
          <div className="w4-entities-net" hidden={!net}>
            <label>
              Backbone{" "}
              <select aria-label="Disparity filter cut" value={net ? String(state.alpha ?? shown?.data.alpha) : undefined} onChange={on ? (e) => on.alpha(Number(e.target.value)) : undefined}>
                {net
                  ? shown!.data.alphas.map((a: number) => (
                      <option key={a} value={String(a)}>
                        {`α = ${a}`}
                      </option>
                    ))
                  : null}
              </select>
            </label>
            <div aria-label="Links the filter drops" className="w4-entities-switch" role="group">
              {[
                ["faint", "Dropped faint"],
                ["hidden", "Hidden"],
              ].map(([value, label]) => (
                <button key={value} aria-pressed={state.dropped === value ? "true" : "false"} data-dropped={value} type="button" onClick={on ? () => on.dropped(value) : undefined}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="w4-entities-colour" hidden={net}>
            Colour by{" "}
            <select value={on ? state.by : undefined} onChange={on ? (e) => on.by(e.target.value) : undefined}>
              <option value="community">Community</option>
              <option value="sector">Sector</option>
              <option value="level">Wage level</option>
              <option value="pagerank">PageRank</option>
            </select>
          </label>
        </div>
        <div className="w4-entities-stage">
          <button className="w4-entities-reset" type="button" onClick={on?.reset}>
            Reset view
          </button>
          <div
            aria-label="Every worker or company in the 2025 filings as a dot, coloured by its community. The table below lists the same groups."
            className="w4-entities-map"
            role="img"
            tabIndex={0}
            ref={mapRef}
          ></div>
          {status !== null ? (
            <p className="w4-entities-status" hidden={!status}>
              {status}
            </p>
          ) : null}
        </div>
        <ul aria-label="Legend: click a group to highlight it" className="w4-entities-legend">
          {shown?.view.legend.map((item) => (
            <li key={String(item.key)}>
              <button
                type="button"
                aria-pressed={state.focus === item.key ? "true" : "false"}
                title={net ? undefined : state.focus === item.key ? "Show every group" : "Highlight this group"}
                onClick={on ? () => on.focus(item.key) : undefined}
              >
                <i style={{ background: `rgb(${item.colour.join(",")})` }}></i>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <figcaption data-entities="caption">{shown?.text.caption}</figcaption>
        <div className="w4-entities-facts">
          <div>
            <h4 data-entities-text="labels-head">{slot("labels-head")}</h4>
            <p className="axis-note" data-entities-text="labels-note">
              {slot("labels-note")}
            </p>
            <div data-entities="labels">
              {shown && net
                ? shown.view.stats!.map(([k, v]) => (
                    <div className="w4-entities-stat" key={k}>
                      <span>{k}</span>
                      <b>{v}</b>
                    </div>
                  ))
                : null}
              {shown && !net && shown.labels ? <StripChart rows={shown.labels.rows} opts={shown.labels.opts} /> : null}
            </div>
          </div>
          <div>
            <h4>The network against random ones</h4>
            <p className="axis-note">Dots: the real network. Bands: rewired networks that keep every degree, or shuffled kinds.</p>
            <div data-entities="strips">{shown ? <StripChart rows={shown.strips.rows} opts={shown.strips.opts} /> : null}</div>
          </div>
        </div>
        <div className="w4-entities-facts">
          <div>
            <h4 data-entities-text="ccdf-head">{slot("ccdf-head")}</h4>
            <p className="axis-note" data-entities-text="ccdf-note">
              {slot("ccdf-note")}
            </p>
            <div data-entities="ccdf">
              {shown && T ? net ? <Curve d={shown.data} alpha={shown.view.alpha!} T={T} /> : <Ccdf d={shown.data} T={T} /> : null}
            </div>
          </div>
          <div className="w4-entities-weeks" data-entities="weeks" hidden={net}>
            {shown && !net
              ? (weeks(shown.data) as [string, string[]][]).map(([title, items]) => (
                  <section key={title}>
                    <h4>{title}</h4>
                    <ul>
                      {items.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </section>
                ))
              : null}
          </div>
        </div>
        <div className="rx-table-block" data-entities="table">
          <h4>{table ? table.title : "The largest groups"}</h4>
          {table ? (
            <W4Table
              head={table.head}
              rows={table.rows.map((row) =>
                row.map((c) => (c.swatch ? { text: c.text, content: <Swatched colour={c.swatch} text={c.text} /> } : { text: c.text, className: c.className })),
              )}
            />
          ) : (
            <table>
              <thead>
                <tr>
                  {EMPTY_HEAD.map((h) => (
                    <th key={h.text} className={h.className}>
                      {h.text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          )}
        </div>
      </figure>
    </div>
  );
}

function Swatched({ colour, text }: { colour: string; text: string }): ReactNode {
  const style: CSSProperties = { background: colour };
  return (
    <>
      <span className="swatch" style={style}></span>
      {text}
    </>
  );
}

const START: State = { entity: "workers", by: "community", focus: null, alpha: null, dropped: "faint" };

function Server() {
  return <Body shown={null} state={START} status={null} T={null} />;
}

function EntitiesView() {
  const mapRef = useRef<HTMLDivElement>(null);
  // Load deck.gl and the data when the box first opens.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const panel = mapRef.current?.closest("details");
    if (!panel || panel.open) {
      setOpened(true);
      return;
    }
    const controller = new AbortController();
    panel.addEventListener("toggle", () => panel.open && setOpened(true), { signal: controller.signal });
    return () => controller.abort();
  }, []);
  const [state, setState] = useState<State>(START);
  const vendor = useVendor<any>("deck.gl-9.0.30.min.js", "deck", { enabled: opened });
  const deckLib = vendor.status === "ready" ? vendor.lib : null;
  const file = useW4Data(W4.data(FILES[state.entity]), "entities", { enabled: opened && deckLib !== null });
  const T = useT(ENTITY_TOKENS);
  const rgb = useMemo(() => (T ? rgbReader(T) : null), [T]);
  const data = file.data;
  const net = Boolean(data?.network);
  const dots = useMemo(() => (data && !data.network ? layoutDots(data) : null), [data]);

  const shown = useMemo<Shown | null>(() => {
    if (!data || !deckLib || !rgb || !T) return null;
    if (net) {
      const view = networkView(deckLib, data, state, rgb, T);
      return { net, data, view, text: networkText(data), strips: networkStrip(data), labels: null, table: networkTable(data) } as Shown;
    }
    if (!dots) return null;
    const view = entityView(deckLib, data, dots, state, rgb, T);
    return { net, data, view, text: entityText(data, dots), strips: entityStrip(data), labels: labelStrip(data), table: entityTable(data) } as Shown;
  }, [data, deckLib, rgb, T, net, dots, state]);

  // The last view stays on the map while the next entity loads.
  const last = useRef<Shown | null>(null);
  if (shown) last.current = shown;
  const drawn = shown ?? last.current;
  const props = useMemo(() => (drawn ? { layers: drawn.view.layers, getTooltip: drawn.view.getTooltip } : null), [drawn]);
  const size = (): [number, number] => [mapRef.current?.clientWidth ?? 0, mapRef.current?.clientHeight ?? 0];
  const instance: DeckInstance | null = useDeck(mapRef, {
    enabled: opened,
    props,
    create: (deck) => ({
      views: [new deck.OrthographicView({ id: "map" })],
      initialViewState: fit(...size()),
      controller: { scrollZoom: { smooth: true }, doubleClickZoom: true, keyboard: true },
      parameters: { clearColor: [0, 0, 0, 0] },
    }),
  });
  // A new entity opens fitted.
  useEffect(() => {
    if (instance && data) instance.setProps({ initialViewState: { ...fit(...size()), transitionDuration: 0 } });
  }, [instance, data]);

  useIslandReady(shown !== null);
  const failed = vendor.status === "error" ? vendor.error : file.status === "error" ? file.error : null;
  const status = !opened ? null : failed ? `The map could not load: ${(failed as Error).message ?? failed}` : shown ? "" : "Loading the filings…";
  useEffect(() => {
    if (failed) console.error(failed);
  }, [failed]);

  const on = {
    entity: (entity: Entity) => setState((s) => ({ ...s, entity, focus: null, alpha: null })),
    by: (by: string) => setState((s) => ({ ...s, by, focus: null })),
    alpha: (alpha: number) => setState((s) => ({ ...s, alpha })),
    dropped: (dropped: string) => setState((s) => ({ ...s, dropped })),
    focus: (key: string | number) => setState((s) => ({ ...s, focus: s.focus === key ? null : key })),
    reset: () => instance?.setProps({ initialViewState: { ...fit(...size()), transitionDuration: 300 } }),
    keyDown: (e: KeyboardEvent) => {
      if (e.key === "Escape") setState((s) => (s.focus === null ? s : { ...s, focus: null }));
    },
  };
  return <Body shown={drawn} state={state} status={status} T={T} mapRef={mapRef} on={on} />;
}

/** <Entities />: the whole card of the box, its answer line included. */
export const Entities = island("week04/entities/Entities", EntitiesView, Server, { roots: ["#entity-communities", '[data-entities="answer"]'] });
