// A pick-k puzzle on a network: the reader clicks (or Tabs to and presses
// Enter on) k nodes, Check runs check(picked, graph) and says whether the
// pick holds, Reveal rings the answer, and New graph asks generate(seed) for
// the next graph, seeded, so the same seed gives the same puzzle. Picks are
// capped at k; links among the picks are highlighted, and the readouts count
// the picks, the links among them and the puzzles solved. The verdict is
// announced politely. Style: .kit-picker in post.css.
import { useMemo, useState, type ReactNode } from "react";
import type { NetId, NetLink, NetNode, NetworkSpec } from "./network/layout";
import NetworkView from "./NetworkView";
import Readouts from "./Readouts";

export type PickerGraph = { nodes: NetNode[]; links: NetLink[]; answer?: NetId[] };
export type PickerVerdict = { ok: boolean; msg: ReactNode };

/** <NodePicker k={4} seed={1} generate={(seed) => toyGraph(seed)} check={(picked, g) => ({ ok: allLinked(picked, g), msg: "…" })} aria="…" /> */
export default function NodePicker({
  k,
  generate,
  check,
  seed: firstSeed = 1,
  prompt,
  ratio = 0.62,
  aria,
}: {
  k: number;
  generate: (seed: number) => PickerGraph;
  check: (picked: NetId[], graph: PickerGraph) => PickerVerdict;
  seed?: number;
  prompt?: ReactNode;
  ratio?: number;
  aria: string;
}) {
  const [seed, setSeed] = useState(firstSeed);
  const [picked, setPicked] = useState<NetId[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [verdict, setVerdict] = useState<PickerVerdict | null>(null);
  const [found, setFound] = useState(0);
  const graph = useMemo(() => generate(seed), [generate, seed]);
  const want = Math.max(0, Math.floor(k));

  const pickedSet = new Set(picked);
  const answer = new Set(graph.answer ?? []);
  const among = (set: Set<NetId>) => graph.links.filter((l) => set.has(l.source) && set.has(l.target));
  const linked = among(pickedSet).length;
  const pairs = (picked.length * (picked.length - 1)) / 2;

  const toggle = (id: NetId) => {
    if (revealed) return;
    setVerdict(null);
    if (pickedSet.has(id)) setPicked(picked.filter((p) => p !== id));
    else if (picked.length < want) setPicked([...picked, id]);
    else setVerdict({ ok: false, msg: `You have picked ${want}. Click a picked node to drop it first.` });
  };
  const onCheck = () => {
    const v = check(picked, graph);
    setVerdict(v);
    if (v.ok) setFound((f) => f + 1);
  };
  const fresh = () => {
    setSeed((s) => s + 1);
    setPicked([]);
    setRevealed(false);
    setVerdict(null);
  };

  const spec: NetworkSpec = {
    ratio,
    nodes: graph.nodes.map((n) => ({ ...n, state: pickedSet.has(n.id) ? "picked" : revealed && answer.has(n.id) ? "ring" : undefined })),
    links: graph.links,
    highlightLinks: among(revealed ? answer : pickedSet).map((l) => [l.source, l.target]),
    labels: "inside",
    aria: `${aria}; ${picked.length} of ${want} picked`,
  };

  if (graph.nodes.length === 0) return <p className="kit-empty">The generator gave no nodes to pick from.</p>;
  return (
    <div className="kit-picker">
      <div className="kit-controls">
        <button type="button" className="kit-picker-check" onClick={onCheck} disabled={want === 0 || picked.length !== want || revealed}>
          Check
        </button>
        <button type="button" onClick={() => setRevealed(true)} disabled={revealed || answer.size === 0}>
          Reveal
        </button>
        <button type="button" onClick={() => (setPicked([]), setVerdict(null))} disabled={picked.length === 0 || revealed}>
          Clear picks
        </button>
        <button type="button" onClick={fresh}>
          New graph
        </button>
      </div>
      <div className="kit-picker-body">
        <NetworkView key={seed} spec={spec} onNodeClick={toggle} />
        <div className="kit-picker-side">
          {prompt ? <div className="kit-picker-prompt">{prompt}</div> : null}
          {want > graph.nodes.length ? <p className="kit-note">This graph has only {graph.nodes.length} nodes, fewer than {want}.</p> : null}
          <p className={`kit-picker-verdict${verdict ? (verdict.ok ? " kit-picker-ok" : " kit-picker-no") : ""}`} aria-live="polite">
            {verdict ? verdict.msg : revealed ? "The answer is ringed." : null}
          </p>
        </div>
      </div>
      <Readouts
        items={[
          { label: "Picked", value: `${picked.length} of ${want}` },
          { label: "Pairs linked", value: picked.length > 1 ? `${linked} of ${pairs}` : "–" },
          { label: "Found", value: found },
        ]}
      />
    </div>
  );
}
