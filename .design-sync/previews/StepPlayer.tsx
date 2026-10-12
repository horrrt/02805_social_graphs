import { NetCanvas, Readouts, StepPlayer, type CanvasLink, type CanvasNode } from "log-log-legends-kit";
import { aggregate, louvainInit, louvainPartition, mulberry32, stepMove } from "@/kit/graph-core";
import { KARATE, karateLayout } from "@/features/kit-page/toy-networks";

// The kit page's Louvain demo on Zachary's karate club
// (src/features/kit-page/toy-networks.ts), opened twelve moves in.
const fmt = (v: number, d = 3) => v.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
type Lv = ReturnType<typeof louvainInit>;
const lvStep = (s: Lv): Lv => (s.phase === "move" ? stepMove(s) : aggregate(s));
const lvInit = (moves: number) => (): Lv => {
  let s = louvainInit(KARATE, { rng: mulberry32(7) });
  for (let i = 0; i < moves && s.phase !== "done"; i++) s = lvStep(s);
  return s;
};

function Board({ s }: { s: Lv }) {
  const at = karateLayout();
  const part = louvainPartition(s) as number[];
  const size = new Map<number, number>();
  for (const c of part) size.set(c, (size.get(c) ?? 0) + 1);
  const ranked = [...size].filter(([, k]) => k > 1).sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([c]) => c);
  const moved = s.last?.node ?? -1;
  const nodes: CanvasNode[] = part.map((c, v) => ({ id: String(v), x: at[v][0], y: at[v][1], group: ranked.includes(c) ? ranked.indexOf(c) : null, state: v === moved ? "picked" : undefined }));
  const links: CanvasLink[] = KARATE.map(([a, b]) => ({ s: String(a), t: String(b), highlight: a === moved || b === moved }));
  return (
    <>
      <NetCanvas nodes={nodes} links={links} height={320} aria={`Zachary's karate club coloured by Louvain's communities so far: ${size.size} communities`} />
      <Readouts
        items={[
          { label: "Communities", value: String(size.size) },
          { label: "Modularity Q", value: fmt(s.q) },
          { label: "Moves", value: String(s.moves) },
          { label: "Last move", value: s.last ? `member ${s.last.node}` : "none", sub: s.last ? `Q +${fmt(s.last.gain, 4)}` : undefined },
        ]}
      />
    </>
  );
}

export const LouvainMidRun = () => (
  <div className="kit-net-demo">
    <StepPlayer label="Louvain" seed={7} speedMs={250} init={lvInit(12)} step={lvStep} done={(s) => s.phase === "done"} extraActions={[{ label: "Aggregate", run: aggregate }]} render={(s) => <Board s={s} />} />
  </div>
);
