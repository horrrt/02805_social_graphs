// A network as small multiples: one NetworkView per connected component
// (largest first) or per given group of nodes, each laid out on its own and
// packed into a grid that fits as many columns as its width allows, with a
// title and counts over each. Components of one node fold into a single tile
// that counts them; past `max` tiles a line counts what is left out. Groups
// are drawn as given, an empty one as an empty tile. The split is
// splitComponents() in growth-core.js. Style: .kit-gallery in post.css.
import { useMemo } from "react";
import NetworkView from "./NetworkView";
import type { NetworkSpec } from "./network/layout";
import { forceLayout, mulberry32 } from "./graph-core";
import { splitComponents } from "./growth-core.js";

type Part = { nodes: number[]; edges: [number, number][] };
type Tile = { key: string; title: string; part: Part } | { key: string; title: string; isolates: number };

const int = (v: number) => v.toLocaleString("en-GB");
const counts = (p: Part) => `${int(p.nodes.length)} ${p.nodes.length === 1 ? "node" : "nodes"} · ${int(p.edges.length)} ${p.edges.length === 1 ? "link" : "links"}`;

function TileView({ part, index, labels, title }: { part: Part; index: number; labels?: string[]; title: string }) {
  const spec = useMemo<NetworkSpec>(() => {
    const size = part.nodes.length;
    const pos = (size > 1 ? forceLayout(size, part.edges, { rng: mulberry32(index + 1), iterations: size > 150 ? 60 : 120 }) : [[0.5, 0.5]]) as [number, number][];
    return {
      ratio: 1,
      width: 240,
      nodes: part.nodes.map((v, i) => ({ id: v, x: 0.08 + pos[i][0] * 0.84, y: 0.08 + pos[i][1] * 0.84, group: index % 8, title: labels?.[v] })),
      links: part.edges.map(([a, b]) => ({ source: part.nodes[a], target: part.nodes[b] })),
      aria: `${title}: ${counts(part)}`,
    };
  }, [part, index, labels, title]);
  return <NetworkView spec={spec} />;
}

/** <ComponentGallery n={n} edges={edges} />, or <ComponentGallery n={n} edges={edges} groups={[{ title: "Heroes", nodes: [0, 3, 5] }]} /> */
export default function ComponentGallery({
  n,
  edges,
  groups,
  labels,
  max = 12,
  minWidth = 180,
  noun = "Component",
}: {
  n: number;
  edges: [number, number][];
  /** Draw these node sets (their induced subgraphs) instead of the components. */
  groups?: { title: string; nodes: number[] }[];
  /** A name per node, shown on hover. */
  labels?: string[];
  max?: number;
  /** The narrowest a tile may get, in px. */
  minWidth?: number;
  /** What a tile is called in its title. */
  noun?: string;
}) {
  const { tiles, hidden } = useMemo(() => {
    const parts = splitComponents(n, edges, groups?.map((g) => g.nodes)) as Part[];
    let list: Tile[];
    if (groups) {
      list = parts.map((part, i) => ({ key: `g${i}`, title: groups[i].title, part }));
    } else {
      const big = parts.filter((p) => p.nodes.length > 1);
      const isolates = parts.length - big.length;
      list = big.map((part, i) => ({ key: `c${i}`, title: `${noun} ${i + 1}`, part }));
      if (isolates) list.push({ key: "isolates", title: "Isolated nodes", isolates });
    }
    const cap = Math.max(0, max);
    return { tiles: list.slice(0, cap), hidden: list.slice(cap) };
  }, [n, edges, groups, max, noun]);

  if (tiles.length === 0 && hidden.length === 0) return <p className="kit-empty">{groups ? "No groups to draw." : "No nodes, so no components."}</p>;
  const hiddenNodes = hidden.reduce((s, t) => s + ("part" in t ? t.part.nodes.length : t.isolates), 0);
  return (
    <div className="kit-gallery">
      <ul className="kit-gallery-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))` }}>
        {tiles.map((t, i) => (
          <li key={t.key} className="kit-gallery-tile">
            <p className="kit-gallery-title">{t.title}</p>
            {"part" in t ? (
              <>
                <p className="kit-gallery-count">{counts(t.part)}</p>
                {t.part.nodes.length ? <TileView part={t.part} index={i} labels={labels} title={t.title} /> : <p className="kit-empty">No nodes in this group.</p>}
              </>
            ) : (
              <>
                <p className="kit-gallery-count">{int(t.isolates)} {t.isolates === 1 ? "component" : "components"} of one node</p>
                <p className="kit-gallery-isolates" aria-hidden="true">
                  {"●".repeat(Math.min(t.isolates, 60))}
                  {t.isolates > 60 ? "…" : ""}
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
      {hidden.length ? (
        <p className="kit-note">
          And {int(hidden.length)} more {hidden.length === 1 ? "tile" : "tiles"} with {int(hiddenNodes)} {hiddenNodes === 1 ? "node" : "nodes"} between them, not drawn.
        </p>
      ) : null}
    </div>
  );
}
