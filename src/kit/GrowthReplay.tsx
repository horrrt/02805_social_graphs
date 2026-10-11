// A network replayed in arrival order: each node takes its place on a spiral
// by arrival rank (the first at the centre, the last on the rim) and grows
// with the links it holds at time t. Play, +1, Reset, a time scrubber and a
// speed slider drive t; beside the canvas, the top k by links, a card for the
// newest arrival (or the pinned node) and the CCDF of the degrees so far.
// Modes are tabs, each its own network and arrival order (say the real order
// against preferential attachment). Play pauses off screen and runs no faster
// than two steps a second under reduced motion (useStepper). The numbers are
// in growth-core.js. Style: .kit-growth in post.css.
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import DistributionPlot from "./DistributionPlot";
import NetCanvas, { type CanvasLink, type CanvasNode } from "./NetCanvas";
import Readouts from "./Readouts";
import { useStepper } from "./StepPlayer";
import { degreesAt, hubStats, orderOf, spiralPosition, topK } from "./growth-core.js";
import { useOnScreen } from "./network/motion";

export type GrowthMode = {
  key: string;
  label: string;
  /** Nodes 0 … n − 1. */
  n: number;
  edges: [number, number][];
  /** Arrival rank per node (0 first); the node ids by default. */
  rank?: number[];
  /** A line under the tabs saying what this mode is. */
  note?: ReactNode;
};
export type ArrivalCard = { title: string; line?: ReactNode };

const int = (v: number) => v.toLocaleString("en-GB");
const radiusOf = (k: number) => Math.min(18, 2.5 + 1.8 * Math.sqrt(k));

function Replay({
  mode,
  card,
  top,
  reference,
  height,
  seed,
}: {
  mode: GrowthMode;
  card?: (node: number, mode: string) => ArrivalCard;
  top: number;
  reference?: { name: string; ks: number[] };
  height: number;
  seed: number;
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const N = mode.n;
  const rank = useMemo(() => mode.rank ?? Array.from({ length: N }, (_, i) => i), [mode.rank, N]);
  const order = useMemo(() => orderOf(rank) as number[], [rank]);
  const p = useStepper({ init: () => Math.min(1, N), step: (t: number) => Math.min(N, t + 1), done: (t: number) => t >= N, seed, speedMs: 125 });
  const t = p.state;
  const [pinned, setPinned] = useState<number | null>(null);

  const onScreen = useOnScreen(box);
  const { playing, pause } = p;
  useEffect(() => {
    if (!onScreen && playing) pause();
  }, [onScreen, playing, pause]);

  const degree = useMemo(() => degreesAt(N, mode.edges, rank, t) as number[], [N, mode.edges, rank, t]);
  const live = useMemo(() => mode.edges.filter(([a, b]) => rank[a] < t && rank[b] < t), [mode.edges, rank, t]);
  const hub = hubStats(degree, live.length, rank);
  const leaders = topK(degree, top, rank, t) as { node: number; k: number; rank: number }[];
  const newest = t > 0 ? order[t - 1] : -1;
  const shownNode = pinned ?? newest;
  const pinArrived = pinned !== null && rank[pinned] < t;

  const nodes: CanvasNode[] = order.slice(0, t).map((v) => {
    const [x, y] = spiralPosition(rank[v], N);
    return {
      id: String(v),
      x,
      y,
      r: radiusOf(degree[v]),
      value: degree[v],
      label: card?.(v, mode.key).title ?? `Node ${v}`,
      state: v === pinned ? "picked" : v === newest && t > 1 ? "new" : v === hub.hub && hub.k > 0 ? "ring" : undefined,
    };
  });
  const links: CanvasLink[] = live.map(([a, b]) => ({ s: String(a), t: String(b), highlight: pinned !== null && (a === pinned || b === pinned) }));
  const ks = useMemo(() => degree.filter((k, v) => rank[v] < t && k > 0), [degree, rank, t]);
  const series = useMemo(
    () => [{ key: "now", name: `degrees after ${int(t)} arrivals`, ks }, ...(reference ? [{ key: "ref", name: reference.name, ks: reference.ks }] : [])],
    [ks, t, reference],
  );

  const pin = (v: number) => setPinned((now) => (now === v ? null : v));
  const shown = shownNode >= 0 ? card?.(shownNode, mode.key) : undefined;

  return (
    <div className="kit-growth-body" ref={box}>
      <div className="kit-growth-stage">
        <NetCanvas
          nodes={nodes}
          links={links}
          color="sequential"
          height={height}
          onNodeClick={(s) => pin(Number(s))}
          tooltip={(n) => [n.label ?? n.id, `${degree[Number(n.id)]} links at this point`, `arrived #${rank[Number(n.id)] + 1} of ${int(N)}`]}
          aria={`${mode.label}: ${int(t)} of ${int(N)} nodes arrived, placed on a spiral from the centre out by arrival; size follows links so far`}
          describe={`${int(t)} of ${int(N)} arrived, ${int(live.length)} ${live.length === 1 ? "link" : "links"}. Centre: first to arrive; rim: last. Size: links so far. Orange: newest; ringed: the biggest hub.`}
        />
        <div className={`kit-growth-card${pinned !== null ? " kit-growth-pinned" : ""}`} aria-live={p.playing ? "off" : "polite"}>
          <p className="kit-growth-tag">{pinned !== null ? "Pinned" : "Just arrived"} · #{shownNode >= 0 ? rank[shownNode] + 1 : 0}</p>
          <p className="kit-growth-title">{shown?.title ?? `Node ${shownNode}`}</p>
          {shown?.line ? <p className="kit-growth-line">{shown.line}</p> : null}
          <p className="kit-growth-line">
            {pinned !== null && !pinArrived ? `Arrives at step ${int(rank[pinned] + 1)}.` : `${degree[shownNode] ?? 0} links so far.`}
          </p>
          {pinned !== null ? (
            <button type="button" className="kit-btn" onClick={() => setPinned(null)}>
              Unpin
            </button>
          ) : null}
        </div>
      </div>
      <div className="kit-growth-side">
        <div className="kit-controls">
          <button type="button" className="kit-btn" aria-pressed={p.playing} onClick={p.toggle} disabled={p.done && !p.playing}>
            {p.playing ? "Pause" : "Play"}
          </button>
          <button type="button" className="kit-btn" onClick={p.stepOnce} disabled={p.done || p.playing}>
            +1
          </button>
          <button
            type="button"
            className="kit-btn"
            onClick={() => {
              p.reset();
              setPinned(null);
            }}
          >
            Reset
          </button>
        </div>
        <div className="kit-controls">
          <label htmlFor={`${id}-t`}>Time</label>
          <input
            id={`${id}-t`}
            type="range"
            min={Math.min(1, N)}
            max={N}
            step={1}
            value={String(t)}
            onChange={(e) => {
              const v = Number(e.target.value);
              p.pause();
              p.run(() => Math.max(1, Math.min(N, v)));
            }}
          />
          <output htmlFor={`${id}-t`}>
            {int(t)} / {int(N)}
          </output>
        </div>
        <div className="kit-controls">
          <label htmlFor={`${id}-s`}>Speed</label>
          <input id={`${id}-s`} type="range" min={1} max={30} step={1} value={p.speed} onChange={(e) => p.setSpeed(e.target.value)} />
          <output htmlFor={`${id}-s`}>{p.speed}/s</output>
        </div>
        <Readouts
          items={[
            { label: "Arrived", value: `${int(t)} / ${int(N)}` },
            { label: "Links", value: int(live.length) },
            { label: "Biggest hub", value: `k = ${hub.k}`, sub: hub.k > 0 ? `arrived #${hub.arrival}` : undefined },
          ]}
        />
        <h4 className="kit-growth-head">Most linked, right now</h4>
        {leaders.length ? (
          <ol className="kit-growth-top">
            {leaders.map((row) => (
              <li key={row.node}>
                <button type="button" aria-pressed={pinned === row.node} onClick={() => pin(row.node)}>
                  <span className="kit-word">{card?.(row.node, mode.key).title ?? `Node ${row.node}`}</span>
                  <span className="kit-num">{row.k}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="kit-empty">Nobody yet.</p>
        )}
        <p className="kit-note">Click a node, or a name in the list, to pin its card and light its links; again to let it go.</p>
      </div>
      <div className="kit-growth-ccdf">
        <h4 className="kit-growth-head">Degree distribution so far</h4>
        <DistributionPlot series={series} views={["ccdf"]} defaultView="ccdf" scaleToggle="none" height={220} aria={`CCDF of the degrees after ${int(t)} arrivals, log–log`} />
      </div>
    </div>
  );
}

/** <GrowthReplay modes={[{ key: "real", label: "Real order", n, edges, rank }]} card={(v) => ({ title: names[v], line: `debut ${years[v]}` })} /> */
export default function GrowthReplay({
  modes,
  card,
  top = 8,
  reference,
  height = 420,
  seed = 1,
}: {
  modes: GrowthMode[];
  card?: (node: number, mode: string) => ArrivalCard;
  top?: number;
  reference?: { name: string; ks: number[] };
  height?: number;
  seed?: number;
}) {
  const [key, setKey] = useState(modes[0]?.key ?? "");
  const mode = modes.find((m) => m.key === key) ?? modes[0];
  if (!mode) return <p className="kit-empty">No growth to replay.</p>;
  return (
    <div className="kit-growth">
      {modes.length > 1 ? (
        <span className="w5-chips" role="group" aria-label="Growth mode">
          {modes.map((m) => (
            <button key={m.key} type="button" aria-pressed={m.key === mode.key} onClick={() => setKey(m.key)}>
              {m.label}
            </button>
          ))}
        </span>
      ) : null}
      {mode.note ? <p className="kit-note">{mode.note}</p> : null}
      {mode.n > 0 ? <Replay key={mode.key} mode={mode} card={card} top={top} reference={reference} height={height} seed={seed} /> : <p className="kit-empty">This mode has no nodes.</p>}
    </div>
  );
}
