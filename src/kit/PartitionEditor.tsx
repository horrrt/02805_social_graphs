// A network the reader splits into groups by hand: a click (or Enter) on a
// node moves it to the next group, a preset loads a whole partition, and Undo
// steps back. Modularity Q is worked out live by graph-core.js, with the links
// inside groups and the number expected by chance, and every partition the
// reader visits adds a point to a trace of Q (SweepCurve), so the landscape
// shows as they explore. Nodes are 0 … n − 1 with x and y placed (NetworkView's
// box); `groups` names the groups a click cycles through, at most eight.
// NetworkView holds the groups a click gives, so a preset, Undo or Reset
// draws it afresh. Style: .kit-part in post.css.
import { useMemo, useState } from "react";
import type { NetNode, NetworkSpec } from "./network/layout";
import { modularity } from "./graph-core";
import NetworkView from "./NetworkView";
import Readouts from "./Readouts";
import SweepCurve from "./SweepCurve";

export type PartitionPreset = { key: string; label: string; partition: number[] };
type Visit = { partition: number[]; from: string | null };

const fmt = (v: number, d = 3) => v.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });

/** <PartitionEditor nodes={nodes} edges={edges} groups={["Group 1", "Group 2"]} presets={[{ key: "real", label: "Zachary's split", partition }]} aria="…" /> */
export default function PartitionEditor({
  nodes,
  edges,
  groups,
  initial,
  presets = [],
  reference,
  ratio = 0.62,
  onChange,
  aria,
}: {
  nodes: NetNode[];
  edges: [number, number][];
  groups: string[];
  initial?: number[];
  presets?: PartitionPreset[];
  reference?: { y: number; label: string };
  ratio?: number;
  onChange?: (partition: number[]) => void;
  aria: string;
}) {
  const k = Math.max(1, Math.min(8, groups.length));
  const clip = (p: number[]) => nodes.map((_, i) => Math.max(0, Math.min(k - 1, Math.trunc(p[i] ?? 0) || 0)));
  const start = (): Visit[] => [{ partition: clip(initial ?? []), from: null }];
  const [history, setHistory] = useState<Visit[]>(start);
  // The partition NetworkView was last drawn from; a new gen redraws it (presets, Undo and Reset).
  const [drawn, setDrawn] = useState(() => ({ gen: 0, partition: history[0].partition }));
  const now = history[history.length - 1];
  const redraw = (partition: number[]) => setDrawn((d) => ({ gen: d.gen + 1, partition }));

  const visit = (v: Visit, draw: boolean) => {
    setHistory((h) => [...h, v]);
    if (draw) redraw(v.partition);
    onChange?.(v.partition);
  };
  const undo = () => {
    if (history.length < 2) return;
    const back = history[history.length - 2].partition;
    setHistory((h) => h.slice(0, -1));
    redraw(back);
    onChange?.(back);
  };
  const reset = () => {
    const s = start();
    setHistory(s);
    redraw(s[0].partition);
    onChange?.(s[0].partition);
  };

  const spec: NetworkSpec = useMemo(
    () => ({
      ratio,
      nodes: nodes.map((n, i) => ({ ...n, group: drawn.partition[i] })),
      links: edges.map(([a, b]) => ({ source: a, target: b })),
      groups: groups.slice(0, k),
      labels: "inside",
      movable: true,
      legend: true,
      aria,
    }),
    [drawn, nodes, edges, groups, k, ratio, aria],
  );

  const m = edges.length;
  const q = modularity(edges, now.partition) as number;
  const inside = edges.filter(([a, b]) => now.partition[a] === now.partition[b]).length;
  const expected = inside - q * m;
  const used = new Set(now.partition).size;
  const points = history.map((v, i) => [i + 1, modularity(edges, v.partition) as number] as [number, number]);

  if (nodes.length === 0) return <p className="kit-empty">No nodes to split.</p>;
  return (
    <div className="kit-part">
      <div className="kit-controls">
        {presets.length ? (
          <span className="kit-part-presets" role="group" aria-label="Presets">
            {presets.map((p) => (
              <button key={p.key} type="button" aria-pressed={now.from === p.key} onClick={() => visit({ partition: clip(p.partition), from: p.key }, true)}>
                {p.label}
              </button>
            ))}
          </span>
        ) : null}
        <button type="button" onClick={undo} disabled={history.length < 2}>
          Undo
        </button>
        <button type="button" onClick={reset} disabled={history.length < 2}>
          Reset
        </button>
        <span className="kit-note">Click a node, or Tab to it and press Enter, to move it to the next group.</span>
      </div>
      <div className="kit-part-body">
        <NetworkView
          key={drawn.gen}
          spec={spec}
          onChange={(ns) => visit({ partition: clip(ns.map((n) => n.group ?? 0)), from: null }, false)}
        />
        <div className="kit-part-trace">
          <p className="kit-part-head">Q of every partition visited</p>
          <SweepCurve points={points} current={history.length} refLine={reference} xLabel="partition visited" yLabel="modularity Q" domain={{ x: [1, Math.max(8, history.length)] }} fmt={(v) => String(+v.toFixed(2))} />
        </div>
      </div>
      <Readouts
        live
        items={[
          { label: "Modularity Q", value: fmt(q), sub: m ? `= (${inside} − ${fmt(expected, 1)}) / ${m}` : "no links" },
          { label: "Links inside groups", value: `${inside} of ${m}` },
          { label: "Expected inside, by chance", value: fmt(expected, 1) },
          { label: "Groups in use", value: `${used} of ${k}` },
        ]}
      />
    </div>
  );
}
