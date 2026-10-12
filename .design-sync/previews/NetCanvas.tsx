import { NetCanvas, type CanvasLink, type CanvasNode } from "log-log-legends-kit";
import { bfsLayers, mulberry32, ringPlusShortcuts, toAdj } from "@/kit/graph-core";
import { KARATE, KARATE_SPLIT } from "@/features/kit-page/toy-games";
import { karateLayout } from "@/features/kit-page/toy-networks";

// Zachary's karate club on the canvas, coloured by the club each member
// joined after the split, laid out as the kit page's Louvain demo lays it
// (src/features/kit-page/toy-networks.ts, toy-games.ts).
export const KarateSplit = () => {
  const at = karateLayout();
  const nodes: CanvasNode[] = KARATE_SPLIT.map((g, v) => ({ id: String(v), x: at[v][0], y: at[v][1], group: g }));
  const links: CanvasLink[] = KARATE.map(([a, b]) => ({ s: String(a), t: String(b) }));
  return <NetCanvas nodes={nodes} links={links} height={360} aria="Zachary's karate club, 34 members, coloured by the club each joined" tooltip={(n) => [`Member ${n.id}`]} />;
};

// The kit page's search demo, three layers in: a ring of 60 with six
// shortcuts, breadth-first search from node 0, shaded by hops.
const RING_N = 60;
const LAYER = 3;
export const BreadthFirst = () => {
  const g = ringPlusShortcuts(RING_N, 4, 6, mulberry32(5));
  const bfs = bfsLayers(toAdj(RING_N, g.edges).out, 0);
  const nodes: CanvasNode[] = bfs.dist.map((d: number, v: number) => ({
    id: String(v),
    value: d >= 0 && d <= LAYER ? d : undefined,
    state: v === 0 ? "picked" : d === LAYER ? "ring" : undefined,
  }));
  const links: CanvasLink[] = g.edges.map(([a, b]: number[], i: number) => ({
    s: String(a),
    t: String(b),
    w: g.shortcut[i] ? 1 : 0,
    highlight: (bfs.parent[b] === a && bfs.dist[b] <= LAYER) || (bfs.parent[a] === b && bfs.dist[a] <= LAYER),
  }));
  return (
    <NetCanvas
      nodes={nodes}
      links={links}
      color="sequential"
      height={360}
      linkWidth={(l) => (l.w ? 1.8 : 1)}
      aria={`A ring of ${RING_N} nodes with 6 shortcuts; breadth-first search from node 0 after ${LAYER} steps`}
      tooltip={(n) => [`Node ${n.id}`, n.value === undefined ? "not reached yet" : `${n.value} hops from node 0`]}
    />
  );
};
