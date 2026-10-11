"use client";
// The networks batch's demos on the kit page: growth, search, rewiring,
// community detection and centrality, each on toy or textbook graphs from
// toy-networks.ts and the seeded models in src/kit/graph-core.js. One island
// per [data-demo] host, wrapped by DemoNetworks as demos.tsx wraps its own, so
// the page carries one more client reference, not five.
import { useId, useMemo, useState, type ReactNode } from "react";
import { NetCanvas, NetworkView, Readouts, StepPlayer } from "@/kit";
import type { CanvasLink, CanvasNode, Point } from "@/kit/NetCanvas";
import {
  aggregate, baInit, baStep, betweenness, bfsLayers, closeness, degreeCentrality, eigenvector, forceLayout, harmonic, louvainInit,
  louvainPartition, mulberry32, pagerank, ringPlusShortcuts, stepMove, sweep, toAdj, transitivity, wattsStrogatz,
} from "@/kit/graph-core";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { KARATE, KITE, KITE_AT, KITE_NAMES, karateLayout, type Edge } from "./toy-networks";

const fmt = (v: number, d = 3) => v.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
const int = (v: number) => v.toLocaleString("en-GB");

function useShown() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated;
}

/** A row of toggle buttons, one pressed. */
function Chips<T extends string | number>({ label, options, value, onPick }: { label: string; options: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <span className="w5-chips" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onPick(v)}>
          {text}
        </button>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------- growth

type Grow = { g: ReturnType<typeof baInit>; pos: Point[] };
const GROW_MAX = 250;

const growInit = (m: number, alpha: number) => (): Grow => {
  const g = baInit(m, alpha);
  return { g, pos: forceLayout(g.n, g.edges, { rng: mulberry32(1), iterations: 60 }) as Point[] };
};

// One newcomer, placed beside its first target, then a few rounds of layout from where everyone was.
function grow(s: Grow, rng: () => number): Grow {
  if (s.g.n >= GROW_MAX) return s;
  const g = baStep(s.g, rng);
  const target = g.edges[g.edges.length - 1][1];
  const near = s.pos[target] ?? [0.5, 0.5];
  const init = [...s.pos, [near[0] + (rng() - 0.5) * 0.05, near[1] + (rng() - 0.5) * 0.05]];
  return { g, pos: forceLayout(g.n, g.edges, { init, iterations: 14, rng }) as Point[] };
}

function GrowView() {
  const shown = useShown();
  const [m, setM] = useState(2);
  const [alpha, setAlpha] = useState(1);
  const seedSize = Math.max(2, m + 1);
  const render = (s: Grow) => {
    const { g } = s;
    const step = g.n - seedSize;
    const nodes: CanvasNode[] = g.degree.map((k: number, i: number) => ({ id: String(i), value: k, state: step > 0 && i === g.n - 1 ? "new" : undefined }));
    const links: CanvasLink[] = g.edges.map(([a, b]: number[], i: number) => ({ s: String(a), t: String(b), highlight: step > 0 && g.born[i] === step }));
    const hub = Math.max(...g.degree);
    return (
      <>
        <NetCanvas
          nodes={nodes}
          links={links}
          positions={{ grow: s.pos }}
          layout="grow"
          height={380}
          aria={`A growing network of ${g.n} nodes; the newest node in orange, its links highlighted; node size follows degree`}
          tooltip={(n) => [`Node ${n.id}`, `${n.value} links`, Number(n.id) < seedSize ? "in the seed clique" : `arrived at step ${Number(n.id) - seedSize + 1}`]}
        />
        <Readouts
          items={[
            { label: "Nodes", value: int(g.n), sub: g.n >= GROW_MAX ? "the cap" : undefined },
            { label: "Links", value: int(g.edges.length) },
            { label: "Biggest hub", value: `k = ${hub}`, sub: `node ${g.degree.indexOf(hub)}` },
            { label: "Mean degree", value: fmt((2 * g.edges.length) / g.n, 2) },
          ]}
        />
      </>
    );
  };
  return (
    <div data-demo="nw-ba">
      {shown ? (
        <div className="kit-net-demo">
          <div className="kit-controls">
            <Chips label="Links per newcomer" options={[[1, "m = 1"], [2, "m = 2"], [3, "m = 3"]]} value={m} onPick={setM} />
            <Chips label="Attachment" options={[[0, "uniform"], [1, "preferential"], [1.5, "superlinear"]]} value={alpha} onPick={setAlpha} />
          </div>
          <StepPlayer
            key={`${m}-${alpha}`}
            label="Preferential attachment"
            seed={7}
            speedMs={150}
            init={growInit(m, alpha)}
            step={grow}
            done={(s) => s.g.n >= GROW_MAX}
            extraActions={[{ label: "+10", run: (s, rng) => Array.from({ length: 10 }).reduce<Grow>((t) => grow(t, rng), s) }]}
            render={render}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- search

const RING_N = 60;

function BfsView() {
  const shown = useShown();
  const id = useId();
  const [start, setStart] = useState(0);
  const [shortcuts, setShortcuts] = useState("6");
  const s = Number(shortcuts) || 0;
  const graph = useMemo(() => {
    const g = ringPlusShortcuts(RING_N, 4, s, mulberry32(5));
    return { ...g, bfs: bfsLayers(toAdj(RING_N, g.edges).out, start) };
  }, [s, start]);
  const { bfs } = graph;
  const last = bfs.layers.length - 1;
  const render = ({ layer }: { layer: number }) => {
    const reached = bfs.dist.filter((d: number) => d >= 0 && d <= layer).length;
    const nodes: CanvasNode[] = bfs.dist.map((d: number, v: number) => ({
      id: String(v),
      value: d >= 0 && d <= layer ? d : undefined,
      state: v === start ? "picked" : d === layer && layer > 0 ? "ring" : undefined,
    }));
    const links: CanvasLink[] = graph.edges.map(([a, b]: number[], i: number) => ({
      s: String(a),
      t: String(b),
      w: graph.shortcut[i] ? 1 : 0,
      highlight: (bfs.parent[b] === a && bfs.dist[b] <= layer) || (bfs.parent[a] === b && bfs.dist[a] <= layer),
    }));
    return (
      <>
        <NetCanvas
          nodes={nodes}
          links={links}
          color="sequential"
          height={360}
          linkWidth={(l) => (l.w ? 1.8 : 1)}
          onNodeClick={(n) => setStart(Number(n))}
          aria={`A ring of ${RING_N} nodes with ${s} shortcuts; breadth-first search from node ${start} has reached ${reached} nodes after ${layer} steps`}
          tooltip={(n) => [`Node ${n.id}`, n.value === undefined ? "not reached yet" : `${n.value} ${n.value === 1 ? "hop" : "hops"} from node ${start}`]}
        />
        <Readouts
          items={[
            { label: "Layer", value: `d = ${layer}` },
            { label: "Reached", value: `${reached} of ${RING_N}` },
            { label: "Farthest node", value: `${last} hops`, sub: `from node ${start}` },
          ]}
        />
      </>
    );
  };
  return (
    <div data-demo="nw-bfs">
      {shown ? (
        <div className="kit-net-demo">
          <div className="kit-controls">
            <label htmlFor={`${id}-s`}>Shortcuts</label>
            <input id={`${id}-s`} type="range" min={0} max={30} step={1} value={shortcuts} onChange={(e) => setShortcuts(e.target.value)} />
            <output htmlFor={`${id}-s`}>{s}</output>
            <label htmlFor={`${id}-start`}>Start</label>
            <select id={`${id}-start`} value={String(start)} onChange={(e) => setStart(Number(e.target.value))}>
              {Array.from({ length: RING_N }, (_, v) => (
                <option key={v} value={v}>
                  node {v}
                </option>
              ))}
            </select>
            <span className="kit-note">Or click a node to start there.</span>
          </div>
          <StepPlayer
            key={`${start}-${s}`}
            label="Breadth-first search"
            seed={1}
            speedMs={600}
            init={() => ({ layer: 0 })}
            step={(t) => ({ layer: t.layer + 1 })}
            done={(t) => t.layer >= last}
            render={render}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- rewiring

const WS_N = 30;

// The mean hop count between pairs that can reach each other.
function meanDistance(n: number, edges: Edge[]): number {
  const { out } = toAdj(n, edges);
  let sum = 0;
  let pairs = 0;
  for (let v = 0; v < n; v++)
    for (const d of bfsLayers(out, v).dist as number[])
      if (d > 0) {
        sum += d;
        pairs += 1;
      }
  return pairs ? sum / pairs : 0;
}

const WS_BASE = (() => {
  const { edges } = wattsStrogatz(WS_N, 4, 0, mulberry32(3));
  return { c: transitivity(WS_N, edges) as number, l: meanDistance(WS_N, edges as Edge[]) };
})();

function WsView() {
  const shown = useShown();
  const id = useId();
  const [q, setQ] = useState("0.05");
  const p = Math.max(0, Math.min(1, Number(q) || 0));
  const { edges, rewired } = useMemo(() => wattsStrogatz(WS_N, 4, p, mulberry32(3)), [p]);
  const c = transitivity(WS_N, edges) as number;
  const l = meanDistance(WS_N, edges as Edge[]);
  const spec = useMemo(
    () => ({
      ratio: 0.8,
      layout: "circle" as const,
      nodes: Array.from({ length: WS_N }, (_, i) => ({ id: i, x: 0, y: 0, label: `node ${i}` })),
      links: (edges as Edge[]).map(([a, b]) => ({ source: a, target: b })),
      highlightLinks: (edges as Edge[]).filter((_, i) => rewired[i]),
      radius: 5,
      aria: `A ring of ${WS_N} nodes, each linked to its four nearest neighbours, with each link moved at random with probability ${p}; moved links highlighted`,
    }),
    [edges, rewired, p],
  );
  return (
    <div data-demo="nw-ws">
      {shown ? (
        <div className="kit-net-demo">
          <div className="kit-controls">
            <label htmlFor={id}>Rewiring q</label>
            <input id={id} type="range" min={0} max={1} step={0.01} value={q} onChange={(e) => setQ(e.target.value)} />
            <output htmlFor={id}>{fmt(p, 2)}</output>
          </div>
          <NetworkView spec={spec} />
          <Readouts
            items={[
              { label: "Links moved", value: `${rewired.filter(Boolean).length} of ${edges.length}` },
              { label: "Clustering C", value: fmt(c), sub: `${fmt(c / WS_BASE.c, 2)} of the ring's` },
              { label: "Mean distance L", value: fmt(l, 2), sub: `${fmt(l / WS_BASE.l, 2)} of the ring's` },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- Louvain

type Lv = ReturnType<typeof louvainInit>;
const lvInit = (): Lv => louvainInit(KARATE, { rng: mulberry32(7) });
const lvStep = (s: Lv): Lv => (s.phase === "move" ? stepMove(s) : aggregate(s));

function lvPhase(s: Lv): string {
  if (s.phase === "done") return `done after ${s.level + 1} ${s.level ? "levels" : "level"}`;
  if (s.phase === "aggregate") return `level ${s.level + 1}: no move left, collapse next`;
  return `level ${s.level + 1}, sweep ${s.sweeps + 1}`;
}

function LouvainView() {
  const shown = useShown();
  const at = useMemo(() => (shown ? karateLayout() : []), [shown]);
  const render = (s: Lv) => {
    const part = louvainPartition(s) as number[];
    const size = new Map<number, number>();
    for (const c of part) size.set(c, (size.get(c) ?? 0) + 1);
    // Colour the communities with more than one member, biggest first; singletons stay grey.
    const ranked = [...size].filter(([, k]) => k > 1).sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([c]) => c);
    const moved = s.last?.node ?? -1;
    const nodes: CanvasNode[] = part.map((c, v) => ({
      id: String(v),
      x: at[v]?.[0],
      y: at[v]?.[1],
      group: ranked.includes(c) ? ranked.indexOf(c) : null,
      state: v === moved ? "picked" : undefined,
    }));
    const links: CanvasLink[] = KARATE.map(([a, b]) => ({ s: String(a), t: String(b), highlight: a === moved || b === moved }));
    return (
      <>
        <NetCanvas
          nodes={nodes}
          links={links}
          height={360}
          aria={`Zachary's karate club coloured by Louvain's communities so far: ${size.size} communities, modularity ${fmt(s.q)}`}
          tooltip={(n) => [`Member ${n.id}`, `community of ${size.get(part[Number(n.id)])}`]}
        />
        <Readouts
          items={[
            { label: "Communities", value: int(size.size) },
            { label: "Modularity Q", value: fmt(s.q) },
            { label: "Moves", value: int(s.moves) },
            { label: "Phase", value: lvPhase(s) },
            { label: "Last move", value: s.last ? `member ${s.last.node}` : "none", sub: s.last ? `Q +${fmt(s.last.gain, 4)}` : undefined },
          ]}
        />
      </>
    );
  };
  return (
    <div data-demo="nw-louvain">
      {shown ? (
        <div className="kit-net-demo">
          <StepPlayer
            label="Louvain"
            seed={7}
            speedMs={250}
            init={lvInit}
            step={lvStep}
            done={(s) => s.phase === "done"}
            extraActions={[
              { label: "Sweep", run: (s) => (s.phase === "move" ? sweep(s) : s) },
              { label: "Aggregate", run: aggregate },
            ]}
            render={render}
          />
          <p className="kit-note">Step: the next member that gains by moving joins its best neighbouring community. Sweep: one pass over every member. Aggregate: collapse each community into one node.</p>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- centrality

const MEASURES = {
  degree: ["Degree", degreeCentrality],
  closeness: ["Closeness", closeness],
  harmonic: ["Harmonic", harmonic],
  betweenness: ["Betweenness", betweenness],
  eigenvector: ["Eigenvector", eigenvector],
  pagerank: ["PageRank", pagerank],
} as const;
type Measure = keyof typeof MEASURES;

function KiteView() {
  const shown = useShown();
  const [measure, setMeasure] = useState<Measure>("betweenness");
  const [gone, setGone] = useState<number[]>([]);
  const kept = useMemo(() => KITE.filter(([a, b]) => !gone.includes(a) && !gone.includes(b)), [gone]);
  const values = useMemo(() => (MEASURES[measure][1] as (n: number, e: Edge[]) => number[])(10, kept), [measure, kept]);
  const live = KITE_NAMES.map((_, i) => i).filter((i) => !gone.includes(i));
  const top = live.reduce((b, i) => (values[i] > values[b] ? i : b), live[0] ?? 0);
  const toggle = (id: string | number) => {
    const v = Number(id);
    setGone((g) => (g.includes(v) ? g.filter((x) => x !== v) : [...g, v]));
  };
  const spec = {
    ratio: 0.5,
    nodes: KITE_NAMES.map((name, i) => ({
      id: i,
      x: KITE_AT[i][0],
      y: KITE_AT[i][1],
      label: name,
      title: `${name}: ${MEASURES[measure][0].toLowerCase()} ${fmt(values[i])}`,
      value: gone.includes(i) ? undefined : values[i],
      state: gone.includes(i) ? ("ghost" as const) : i === top ? ("ring" as const) : undefined,
    })),
    links: KITE.map(([a, b]) => ({ source: a, target: b })),
    color: "sequential" as const,
    scale: [5, 16] as [number, number],
    labels: "beside" as const,
    aria: `Krackhardt's kite, each person sized and shaded by ${MEASURES[measure][0].toLowerCase()} centrality; ${gone.length} taken out`,
  };
  return (
    <div data-demo="nw-kite">
      {shown ? (
        <div className="kit-net-demo">
          <div className="kit-controls">
            <Chips label="Centrality" options={(Object.keys(MEASURES) as Measure[]).map((k) => [k, MEASURES[k][0]])} value={measure} onPick={setMeasure} />
            <button type="button" onClick={() => setGone([])} disabled={gone.length === 0}>
              Put everyone back
            </button>
          </div>
          <NetworkView spec={spec} onNodeClick={toggle} />
          <Readouts
            items={[
              { label: `Top by ${MEASURES[measure][0].toLowerCase()}`, value: live.length ? KITE_NAMES[top] : "nobody", sub: live.length ? fmt(values[top]) : undefined },
              { label: "People left", value: `${live.length} of 10` },
              { label: "Links left", value: `${kept.length} of ${KITE.length}` },
            ]}
          />
          <p className="kit-note">Click a person, or Tab to them and press Enter, to take them out of the network; again to put them back.</p>
        </div>
      ) : null}
    </div>
  );
}

const Empty = (demo: string) =>
  function Host() {
    return <div data-demo={demo}></div>;
  };

const at = (demo: string) => ({ roots: [`[data-demo="${demo}"]`] });

// One island per demo, so a fault in one leaves the others alone.
const DEMOS = {
  "nw-ba": island("kit/demos/NwBaDemo", GrowView, Empty("nw-ba"), at("nw-ba")),
  "nw-bfs": island("kit/demos/NwBfsDemo", BfsView, Empty("nw-bfs"), at("nw-bfs")),
  "nw-ws": island("kit/demos/NwWsDemo", WsView, Empty("nw-ws"), at("nw-ws")),
  "nw-louvain": island("kit/demos/NwLouvainDemo", LouvainView, Empty("nw-louvain"), at("nw-louvain")),
  "nw-kite": island("kit/demos/NwKiteDemo", KiteView, Empty("nw-kite"), at("nw-kite")),
};

export type NetworksDemoName = keyof typeof DEMOS;

function View({ demo }: { demo: NetworksDemoName }): ReactNode {
  const Shown = DEMOS[demo];
  return <Shown />;
}

function Placeholder({ demo }: { demo: NetworksDemoName }) {
  return <div data-demo={demo}></div>;
}

/** <DemoNetworks demo="nw-ba" />: one host of the networks batch on the kit page. */
export const DemoNetworks = island("kit/demos/DemoNetworks", View, Placeholder, {
  roots: (Object.keys(DEMOS) as NetworksDemoName[]).map((demo) => `[data-demo="${demo}"]`),
});
