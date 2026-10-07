"use client";
// Section 1, which week04-place.js drew on main: the hero map and its
// inspector, the status line, the start card's city ranking, group lists,
// null-model table and two maps, and the deep dive's backbone, giant
// component, long-haul scatter and one employer's arcs. One metro selected
// on any chart is selected on all of them; every map then shows a Reset view
// button that clears it. Each part renders its server markup until the three
// files have loaded, and is its own island.
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { SegmentedControl } from "@/components/post/SegmentedControl";
import { TermText } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import type { EChartsInstance } from "@/lib/useEChart";
import { useTextMeasure } from "@/lib/useTypeScale";
import {
  ON_ROW,
  arcsOption,
  backboneOption,
  barsOption,
  fmt,
  groupList,
  heroInspector,
  heroMapOption,
  legendChips,
  nullRows,
  scatterOption,
  usMapOption,
  yr,
} from "@/scripts/week04-place.js";
import { W4Chart } from "../W4Chart";
import { W4Table } from "../W4Table";
import { placeStore, usePlace, type Raw } from "./usePlace";

const set = (patch: Partial<Raw>) => placeStore.setState(patch);
const select = (id: string | null) => set({ selected: id });

// A click on a mark that carries a metro id (in `key`) selects that metro.
function useSelectOnClick(key = "id") {
  return useMemo(
    () => ({
      click: (ev: { data?: Record<string, string> }) => {
        const id = ev.data?.[key];
        if (id) select(id);
      },
    }),
    [key],
  );
}

const RIGHT = { textAlign: "right" as const };

const RESET = (show: boolean) => ({ show, onReset: () => select(null) });

// ---- the hero

const HERO_MAP = {
  "aria-label":
    "Map of the 40 metro areas with the most certified H-1B filings in 2025, sized by filings and coloured by Louvain group, with the links the disparity filter keeps at alpha 0.2. Click a metro to inspect it.",
  className: "w4-hero-map",
  id: "chart-hero-map",
  role: "img",
};

function HeroMapServer() {
  return <div {...HERO_MAP}></div>;
}

function HeroMap() {
  const p = usePlace();
  const events = useSelectOnClick();
  const ready = Boolean(p?.mapReady);
  const selected = p?.s.selected ?? null;
  const option = useMemo(() => (p && ready ? heroMapOption(p.m, { selected }, p.T) : null), [p?.m, p?.T, ready, selected]);
  useIslandReady(option !== null);
  return <W4Chart {...HERO_MAP} option={option} onEvents={events} reset={RESET(selected !== null)} />;
}

function HeroInspectorServer() {
  return (
    <aside aria-label="Selected metro" aria-live="polite" className="w4-inspector" id="hero-inspector">
      <p className="w4-caps">Selected metro</p>
      <div className="w4-inspector-name">
        <b id="hero-sel-name">New York</b>
        <span id="hero-sel-codes">NY · 2025</span>
      </div>
      <span className="w4-chip">
        <i id="hero-sel-dot"></i>
        <span id="hero-sel-group">New York–Dallas group</span>
      </span>
      <dl id="hero-sel-stats"></dl>
      <div className="w4-links">
        <p className="w4-caps">Strongest links</p>
        <ol id="hero-sel-links"></ol>
      </div>
    </aside>
  );
}

function HeroInspector() {
  const p = usePlace();
  useIslandReady(p !== null);
  if (!p) return <HeroInspectorServer />;
  const c = heroInspector(p.m, p.s, p.T);
  return (
    <aside aria-label="Selected metro" aria-live="polite" className="w4-inspector" id="hero-inspector">
      <p className="w4-caps">Selected metro</p>
      <div className="w4-inspector-name">
        <b id="hero-sel-name">{c.name}</b>
        <span id="hero-sel-codes">{c.codes}</span>
      </div>
      <span className="w4-chip">
        <i id="hero-sel-dot" style={{ background: c.dot }}></i>
        <span id="hero-sel-group">{c.group}</span>
      </span>
      <dl id="hero-sel-stats">
        {c.stats.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="w4-links">
        <p className="w4-caps">Strongest links</p>
        <ol id="hero-sel-links">
          {c.links.map(([name, w]: string[]) => (
            <li key={name}>
              {name}
              <span>{w}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

// ---- the status line

function StatusServer() {
  return (
    <p aria-live="polite" className="status-line" id="place-status">
      Loading place data…
    </p>
  );
}

function Status() {
  const p = usePlace();
  useIslandReady(p !== null);
  if (!p) return <StatusServer />;
  const meta = p.m.data.meta;
  const text = meta.status === "placeholder" ? `Scaffold · ${yr(meta.scope)} · placeholder data` : yr(meta.scope);
  return (
    <p aria-live="polite" className="status-line" id="place-status">
      {text}
    </p>
  );
}

// ---- the start card

const METRICS = [
  { value: "positions", label: "Positions", dataAttr: { name: "place-metric", value: "positions" } },
  { value: "employers", label: "Employers", dataAttr: { name: "place-metric", value: "employers" } },
];

function MetricServer() {
  return (
    <div className="axis-modes" role="group" aria-label="Rank cities by">
      <button aria-pressed="true" data-place-metric="positions" type="button">
        Positions
      </button>{" "}
      <button aria-pressed="false" data-place-metric="employers" type="button">
        Employers
      </button>
    </div>
  );
}

function Metric() {
  const metric = usePlace()?.s.metric ?? "positions";
  return (
    <SegmentedControl className="axis-modes" role="group" ariaLabel="Rank cities by" separator=" " buttons={METRICS} value={metric} onChange={(v) => set({ metric: v })} />
  );
}

const RANK = { className: "chart-host tall", id: "chart-rank" };

function RankServer() {
  return <div {...RANK}></div>;
}

function Rank() {
  const p = usePlace();
  const events = useSelectOnClick();
  const { metric, selected } = p?.s ?? {};
  const option = useMemo(() => (p ? barsOption(p.m, { metric, selected }, p.T) : null), [p?.m, p?.T, metric, selected]);
  useIslandReady(option !== null);
  return <W4Chart {...RANK} option={option} onEvents={events} notMerge={false} />;
}

const GROUP_HEADS = [
  { id: 1, title: "Eight tech hubs", lead: "led by San Jose and San Francisco" },
  { id: 0, title: "Seven large hubs", lead: "led by New York and Dallas" },
  { id: 2, title: "The other 25", lead: "from Detroit and Phoenix down" },
];

function GroupsBody({ lists }: { lists: Record<number, string> | null }) {
  return (
    <div className="rx-groups" id="place-groups">
      {GROUP_HEADS.map((g) => (
        <div className="rx-group" data-community={g.id} key={g.id}>
          <div className="rx-group-head">
            <i style={{ background: `var(--w4-group-${g.id})` }}></i>
            <b>{g.title}</b>
            <span>{g.lead}</span>
          </div>
          <p>{lists?.[g.id]}</p>
        </div>
      ))}
    </div>
  );
}

function GroupsServer() {
  return <GroupsBody lists={null} />;
}

function Groups() {
  const p = usePlace();
  useIslandReady(p !== null);
  const lists = p ? Object.fromEntries(GROUP_HEADS.map((g) => [g.id, groupList(p.m.data, g.id)])) : null;
  return <GroupsBody lists={lists} />;
}

function NullStatsServer() {
  return (
    <table className="ego">
      <tbody id="place-null-stats"></tbody>
    </table>
  );
}

function NullStats() {
  const p = usePlace();
  useIslandReady(p !== null);
  if (!p) return <NullStatsServer />;
  return <W4Table className="ego" tbodyId="place-null-stats" rows={nullRows(p.m.data).map(([k, v]: string[]) => [k, { text: v, style: RIGHT }])} />;
}

const REGIONS = [
  { value: "communities", label: "Communities", dataAttr: { name: "place-region", value: "communities" } },
  { value: "census", label: "Census regions", dataAttr: { name: "place-region", value: "census" } },
];

function RegionServer() {
  return (
    <div className="axis-modes" role="group" aria-label="Colour cities by">
      <button aria-pressed="true" data-place-region="communities" type="button">
        Communities
      </button>{" "}
      <button aria-pressed="false" data-place-region="census" type="button">
        Census regions
      </button>
    </div>
  );
}

function Region() {
  const mode = usePlace()?.s.regionMode ?? "communities";
  return (
    <SegmentedControl className="axis-modes" role="group" ariaLabel="Colour cities by" separator=" " buttons={REGIONS} value={mode} onChange={(v) => set({ regionMode: v })} />
  );
}

function LegendServer() {
  return <div className="region-legend" id="place-region-legend"></div>;
}

function Legend() {
  const p = usePlace();
  useIslandReady(p !== null);
  if (!p) return <LegendServer />;
  return (
    <div className="region-legend" id="place-region-legend">
      {legendChips(p.m, p.s, p.T).map((it: { label: string; colour: string }) => (
        <span key={it.label}>
          <i style={{ background: it.colour }}></i>
          {it.label}
        </span>
      ))}
    </div>
  );
}

const CITY_MAP = { className: "chart-host map", id: "chart-citymap" };
const REGION_MAP = { className: "chart-host map", id: "chart-regions" };

function CityMapServer() {
  return <div {...CITY_MAP}></div>;
}

function CityMap() {
  const p = usePlace();
  const events = useSelectOnClick();
  const ready = Boolean(p?.mapReady);
  const { metric, selected } = p?.s ?? {};
  const option = useMemo(() => (p && ready ? usMapOption(p.m, { metric, selected }, p.T, "metric") : null), [p?.m, p?.T, ready, metric, selected]);
  useIslandReady(option !== null);
  return <W4Chart {...CITY_MAP} option={option} onEvents={events} reset={RESET(selected != null)} />;
}

function RegionMapServer() {
  return <div {...REGION_MAP}></div>;
}

function RegionMap() {
  const p = usePlace();
  const events = useSelectOnClick();
  const ready = Boolean(p?.mapReady);
  const { metric, selected, regionMode } = p?.s ?? {};
  const option = useMemo(
    () => (p && ready ? usMapOption(p.m, { metric, selected, regionMode }, p.T, "partition") : null),
    [p?.m, p?.T, ready, metric, selected, regionMode],
  );
  useIslandReady(option !== null);
  return <W4Chart {...REGION_MAP} option={option} onEvents={events} reset={RESET(selected != null)} />;
}

// ---- the deep dive: the backbone

function AlphaServer() {
  return <div aria-labelledby="place-alpha-label" className="rx-seg" id="place-alpha" role="group"></div>;
}

function Alpha() {
  const p = usePlace();
  useIslandReady(p !== null);
  if (!p) return <AlphaServer />;
  const buttons = p.m.data.backbone.alphas.map((a: number) => ({ value: String(a), label: String(a), dataAttr: { name: "alpha", value: String(a) } }));
  return (
    <SegmentedControl ariaLabelledBy="place-alpha-label" className="rx-seg" id="place-alpha" role="group" buttons={buttons} value={p.s.alpha} onChange={(v) => set({ alpha: v })} />
  );
}

const BACKBONE = { className: "chart-host map", id: "chart-backbone" };

function BackboneServer() {
  return <div {...BACKBONE}></div>;
}

function Backbone() {
  const p = usePlace();
  const events = useSelectOnClick();
  const ready = Boolean(p?.mapReady);
  const { alpha, selected, regionMode } = p?.s ?? {};
  const option = useMemo(
    () => (p && ready ? backboneOption(p.m, { alpha, selected, regionMode }, p.T) : null),
    [p?.m, p?.T, ready, alpha, selected, regionMode],
  );
  useIslandReady(option !== null);
  return <W4Chart {...BACKBONE} option={option} onEvents={events} reset={RESET(selected != null)} />;
}

function GcServer() {
  return <div className="w4-figure-body" id="chart-gc"></div>;
}

// The giant component against α, drawn as plain SVG: a flat ink line, open
// dots with the selected α filled, a dashed marker where the backbone snaps,
// and the links kept printed under each stop. Drawn at the host's width, one
// unit to a pixel; redrawn when it changes.
function Gc() {
  const p = usePlace();
  const measure = useTextMeasure();
  const host = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const contentWidth = () => {
      const cs = getComputedStyle(el);
      return Math.floor(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    };
    setW(contentWidth() || 1000);
    const watch = new ResizeObserver(() => {
      const w = contentWidth();
      if (w > 0) setW(w);
    });
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  useIslandReady(p !== null && measure !== null);
  if (!p || !measure || !W) return <div className="w4-figure-body" id="chart-gc" ref={host}></div>;
  const { m, s, T } = p;
  const { alphas, gc_size: gc, edges_kept: kept, snap_alpha: snap } = m.data.backbone;
  const metros = m.data.cities.length;
  const ink = T.token("--ink");
  const soft = T.token("--ink-soft");
  const mute = T.token("--ink-mute");
  const muteText = T.token("--ink-mute-text");
  const card = T.token("--card");
  const grid = T.token("--w4-grid");
  const caption = T.fs("caption");
  const small = T.fs("small");
  const H = 250;
  const L = 48;
  const R = W - 24;
  const Top = 30;
  const B = 192;
  // A round tick step that gives about four gridlines above zero.
  const gmax = Math.max(...gc, 1);
  const raw = gmax / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((k) => k * mag).find((st) => st >= raw)!;
  const top = Math.ceil(gmax / step) * step;
  const amax = Math.max(...alphas) * 1.1;
  const x = (a: number) => L + (a / amax) * (R - L);
  const y = (v: number) => B - (v / top) * (B - Top);
  // Text width at the caption size, to keep labels inside the frame.
  const width = (t: string) => measure(t, "caption");
  const place = (px: number, t: string) => (px + 12 + width(t) > W - 8 ? { x: px - 12, anchor: "end" as const } : { x: px + 12, anchor: "start" as const });

  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const snapIdx = alphas.findIndex((a: number) => Number(a) === Number(snap));
  const snapText = snapIdx >= 0 ? `Snaps: only ${gc[snapIdx]} metros stay joined` : "";
  const snapAt = place(x(snap) - 4, snapText);
  const snapSpan = snapAt.anchor === "start" ? [snapAt.x, snapAt.x + width(snapText)] : [snapAt.x - width(snapText), snapAt.x];
  const note = "shown on the map above";

  return (
    <div className="w4-figure-body" id="chart-gc" ref={host}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Metros in the largest connected piece at each backbone alpha" style={{ display: "block" }}>
        {ticks.map((v) => [
          <line key={`g${v}`} x1={L} x2={R} y1={y(v)} y2={y(v)} stroke={grid} />,
          <text key={`t${v}`} x={L - 10} y={y(v) + 4} textAnchor="end" fontSize={caption} fill={muteText}>
            {fmt(v)}
          </text>,
        ])}
        {alphas.map((a: number) => (
          <text key={`a${a}`} x={x(a)} y="212" textAnchor="middle" fontSize={caption} fill={soft}>
            α {a}
          </text>
        ))}
        <text x={(L + R) / 2} y="242" textAnchor="middle" fontSize={caption} fill={muteText}>
          ← stricter filter · looser filter →
        </text>
        <line x1={x(snap)} x2={x(snap)} y1={Top - 8} y2={B} stroke={mute} strokeDasharray="4 3" />
        {snapText ? (
          <text x={snapAt.x} y={Top - 12} textAnchor={snapAt.anchor} fontSize={caption} fill={soft}>
            {snapText}
          </text>
        ) : null}
        <polyline points={alphas.map((a: number, i: number) => `${x(a)},${y(gc[i])}`).join(" ")} fill="none" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
        {alphas.map((a: number, i: number) => {
          const cx = x(a);
          const cy = y(gc[i]);
          const on = String(a) === s.alpha;
          // Near the top the value label goes under its dot.
          const atTop = cy - 12 < Top + 8;
          let noteText = null;
          if (on) {
            const at = place(cx, note);
            const span = at.anchor === "start" ? [at.x, at.x + width(note)] : [at.x - width(note), at.x];
            const hitsSnap = snapText && span[0] < snapSpan[1] && snapSpan[0] < span[1];
            // Above the dot on the top row, unless the snap label is there; below it otherwise.
            const ny = atTop ? (hitsSnap ? cy + 38 : cy - 10) : cy + 22;
            noteText = (
              <text x={at.x} y={ny} textAnchor={at.anchor} fontSize={caption} fill={soft}>
                {note}
              </text>
            );
          }
          return [
            <g key={`d${a}`}>
              <title>{`α = ${a}: ${gc[i]} of ${metros} metros in the largest connected piece, ${fmt(kept[i])} links kept`}</title>
              <circle cx={cx} cy={cy} r={on ? 6.5 : 5} fill={on ? ink : card} stroke={ink} strokeWidth="2" />
            </g>,
            <text key={`v${a}`} x={cx} y={atTop ? cy + 20 : cy - 12} textAnchor="middle" fontSize={small} fontWeight="700" fill={ink}>
              {gc[i]}
            </text>,
            <text key={`k${a}`} x={cx} y="226" textAnchor="middle" fontSize={caption} fill={muteText}>
              {fmt(kept[i])} links
            </text>,
            noteText ? <g key={`n${a}`}>{noteText}</g> : null,
          ];
        })}
      </svg>
    </div>
  );
}

const SNAP_INTRO = "Watch where the giant component snaps as you step α down with the control above.";

function SnapServer() {
  return <span id="place-snap-note">{SNAP_INTRO}</span>;
}

function Snap() {
  const p = usePlace();
  useIslandReady(p !== null);
  if (!p) return <SnapServer />;
  return (
    <span id="place-snap-note">
      <TermText
        text={p.m.data.backbone.snap_note}
        phrase="giant component"
        definition="The largest piece of the map in which every metro can reach every other along kept links."
        id="w4-term-place-backbone-giant"
      />
    </span>
  );
}

const ALPHA_HEAD = [{ text: "α" }, { text: "Edges kept", style: RIGHT }, { text: "Giant component", style: RIGHT }];

function AlphaTableServer() {
  return (
    <table className="ego">
      <thead>
        <tr>
          <th>α</th>
          <th style={RIGHT}>Edges kept</th>
          <th style={RIGHT}>Giant component</th>
        </tr>
      </thead>
      <tbody id="place-alpha-table"></tbody>
    </table>
  );
}

function AlphaTable() {
  const p = usePlace();
  useIslandReady(p !== null);
  if (!p) return <AlphaTableServer />;
  const b = p.m.data.backbone;
  const rows = b.alphas.map((a: number, i: number) => ({
    style: String(a) === p.s.alpha ? ON_ROW : undefined,
    cells: [String(a), { text: String(b.edges_kept[i]), style: RIGHT }, { text: String(b.gc_size[i]), style: RIGHT }],
  }));
  return <W4Table className="ego" head={ALPHA_HEAD} tbodyId="place-alpha-table" rows={rows} />;
}

function ChoiceServer() {
  return <span id="place-alpha-choice"></span>;
}

function Choice() {
  const p = usePlace();
  useIslandReady(p !== null);
  return <span id="place-alpha-choice">{p ? p.m.data.backbone.choice_note || "" : null}</span>;
}

// ---- the deep dive: long-haul links

const LONGHAUL = { className: "chart-host", id: "chart-longhaul" };

function LonghaulServer() {
  return <div {...LONGHAUL}></div>;
}

function Longhaul() {
  const p = usePlace();
  const chart = useRef<EChartsInstance | null>(null);
  const selected = p?.s.selected;
  const built = useMemo(() => (p ? scatterOption(p.m, { selected }, p.T) : null), [p?.m, p?.T, selected]);
  const labelsFor = built?.labelsFor;
  const legend = useCallback((ev: { selected: Record<string, boolean> }) => {
    if (labelsFor) chart.current?.setOption(labelsFor(ev.selected));
  }, [labelsFor]);
  const events = useMemo(
    () => ({
      click: (ev: { data?: Record<string, string> }) => {
        if (ev.data?.a) select(ev.data.a);
      },
      legendselectchanged: legend,
    }),
    [legend],
  );
  useIslandReady(built !== null);
  return <W4Chart {...LONGHAUL} option={built?.option ?? null} onEvents={events} notMerge={false} chartRef={chart} />;
}

function EmployerServer() {
  return <select id="place-employer"></select>;
}

function Employer() {
  const p = usePlace();
  useIslandReady(p !== null);
  if (!p) return <EmployerServer />;
  const arcs = p.m.data.longhaul;
  return (
    <select id="place-employer" value={p.s.employer ?? ""} onChange={(e) => set({ employer: e.target.value })}>
      {arcs.arc_employers.map((name: string) => (
        <option key={name} value={name}>
          {`${name} · ${arcs.employer_arcs[name].length} links`}
        </option>
      ))}
    </select>
  );
}

const ARCS = { className: "chart-host map", id: "chart-arcs" };

function ArcsServer() {
  return <div {...ARCS}></div>;
}

function Arcs() {
  const p = usePlace();
  const events = useSelectOnClick();
  const ready = Boolean(p?.mapReady);
  const { employer, selected } = p?.s ?? {};
  const option = useMemo(() => (p && ready ? arcsOption(p.m, { employer }, p.T) : null), [p?.m, p?.T, ready, employer]);
  useIslandReady(option !== null);
  return <W4Chart {...ARCS} option={option} onEvents={events} reset={RESET(selected != null)} />;
}

// ---- one island per part

const PARTS: Record<string, [ComponentType, ComponentType, string]> = {
  heroMap: [HeroMap, HeroMapServer, "#chart-hero-map"],
  heroInspector: [HeroInspector, HeroInspectorServer, "#hero-inspector"],
  status: [Status, StatusServer, "#place-status"],
  metric: [Metric, MetricServer, "[data-place-metric]"],
  rank: [Rank, RankServer, "#chart-rank"],
  groups: [Groups, GroupsServer, "#place-groups"],
  nullStats: [NullStats, NullStatsServer, "#place-null-stats"],
  region: [Region, RegionServer, "[data-place-region]"],
  legend: [Legend, LegendServer, "#place-region-legend"],
  cityMap: [CityMap, CityMapServer, "#chart-citymap"],
  regionMap: [RegionMap, RegionMapServer, "#chart-regions"],
  alpha: [Alpha, AlphaServer, "#place-alpha"],
  backbone: [Backbone, BackboneServer, "#chart-backbone"],
  gc: [Gc, GcServer, "#chart-gc"],
  snap: [Snap, SnapServer, "#place-snap-note"],
  alphaTable: [AlphaTable, AlphaTableServer, "#place-alpha-table"],
  choice: [Choice, ChoiceServer, "#place-alpha-choice"],
  longhaul: [Longhaul, LonghaulServer, "#chart-longhaul"],
  employer: [Employer, EmployerServer, "#place-employer"],
  arcs: [Arcs, ArcsServer, "#chart-arcs"],
};

const ISLANDS = Object.fromEntries(
  Object.entries(PARTS).map(([name, [View, Server, root]]) => [name, island(`week04/place/${name}`, View, Server, { roots: [root] })]),
);

type Props = { part: keyof typeof PARTS };

function View({ part }: Props) {
  const Part = ISLANDS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Server = PARTS[part][1];
  return <Server />;
}

/** <PlacePart part="rank" />: one client reference for every part of section 1. */
export const PlacePart = island("week04/place/Place", View, Placeholder, { roots: Object.values(PARTS).map(([, , root]) => root) });
