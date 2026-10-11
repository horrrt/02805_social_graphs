// A merge tree, leaves along the bottom and merge height up the side, cut
// into coloured community blocks. Takes a merge list ({ a, b, h }, leaves
// 0 … n − 1, merge i making cluster n + i) or a nested tree, which
// dendro-core.js turns into one. `cut` is one height for every branch (a
// dashed line across) or a list of clusters chosen branch by branch (say by
// bestCut; a dashed tick on each; one inside another listed one is dropped). Each block spans from its cut down to the
// leaves; the largest eight with at least `minBlock` leaves take the group
// colours NetworkView and NetCanvas use, in size order, so a sibling view
// coloured by blocksOf()'s partition matches. With onSelect each block is a
// button. `metric` adds a strip under the tree: a SweepCurve of a score per
// cut height, with its best as a reference line. Drawn after hydration at its
// parent's width. Style: .kit-dendro in post.css.
import { useMemo, useRef, type KeyboardEvent } from "react";
import { useFittedWidth } from "@/lib/useSize";
import type { TypeScale } from "@/lib/useTypeScale";
import { blocksOf, buildTree, cutAt, fromTree } from "./dendro-core.js";
import SweepCurve from "./SweepCurve";
import { useSvgBase, type Tokens } from "./svgBits";

export type Merge = { a: number; b: number; h: number };
export type DendroTree = number | string | { id: number | string } | { h: number; children: DendroTree[] };
export type DendroCut = { height: number } | { clusters: number[] };
export type DendroBlock = { cluster: number; members: number[]; rank: number; group: number | null };
export type DendroMetric = { label: string; points: [number, number][]; best?: { y: number; label: string } };

type Tree = ReturnType<typeof buildTree>;
const M = { top: 12, right: 12, left: 44 };
const LABEL_ROOM = 90;
const fmt = (v: number) => String(+v.toFixed(2));

function Plot({
  t,
  labels,
  cut,
  minBlock,
  selected,
  onSelect,
  yLabel,
  height,
  aria,
  scale,
  tokens,
}: {
  t: Tree;
  labels: string[];
  cut?: DendroCut;
  minBlock: number;
  selected?: number;
  onSelect?: (b: DendroBlock) => void;
  yLabel: string;
  height: number;
  aria: string;
  scale: TypeScale;
  tokens: Tokens;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(svg, 560);
  const n = t.n;
  const named = labels.length > 0 && n <= 60;
  const caption = scale.fs("caption");
  // Leaf labels run up at 60°: the margin grows with the longest, to at most
  // LABEL_ROOM, and a longer label is cut with an ellipsis (its title keeps it whole).
  const perChar = 0.55 * caption * Math.sin(Math.PI / 3);
  const fit = Math.max(3, Math.floor((LABEL_ROOM - 16) / perChar));
  const longest = named ? Math.max(1, ...labels.map((l) => String(l ?? "").length)) : 0;
  const bottom = named ? Math.ceil(16 + Math.min(longest, fit) * perChar) : 22;
  const short = (l: string) => (l.length > fit ? `${l.slice(0, fit - 1)}…` : l);
  const plotW = Math.max(1, width - M.left - M.right);
  const plotH = Math.max(1, height - M.top - bottom);
  const cutH = cut && "height" in cut ? cut.height : null;
  const top = Math.max(1e-9, ...t.h, cutH ?? 0);
  const x = (pos: number) => M.left + ((pos + 0.5) * plotW) / n;
  const y = (h: number) => M.top + (1 - Math.max(0, Math.min(h, top)) / top) * plotH;

  const blocks = useMemo(() => {
    if (!cut) return [];
    const listed = "height" in cut ? cutAt(t, cut.height) : cut.clusters.filter((c) => Number.isInteger(c) && t.members[c]);
    // A cluster inside another listed one is dropped, so each leaf sits in one block at most.
    const set = new Set<number>(listed);
    const clusters = listed.filter((c: number) => {
      for (let p = t.parent[c]; p >= 0; p = t.parent[p]) if (set.has(p)) return false;
      return true;
    });
    const raw = blocksOf(t, clusters).blocks as { cluster: number; members: number[]; rank: number }[];
    return raw.map((b) => {
      const c = b.cluster;
      // A branch-by-branch cut sits halfway between the cluster's merge and its parent's.
      const level = cutH ?? (t.parent[c] >= 0 ? (t.h[c] + t.h[t.parent[c]]) / 2 : t.h[c] + (top - t.h[c]) / 2);
      const xs = b.members.map((v) => t.pos[v]);
      return { ...b, level, x0: Math.min(...xs), x1: Math.max(...xs), group: b.rank < 8 && b.members.length >= minBlock ? b.rank : null };
    });
  }, [t, cut, cutH, top, minBlock]);

  const links = [];
  for (let c = n; c < t.members.length; c++) {
    const k = t.kids[c];
    if (!k) continue;
    const [a, b] = k;
    links.push(<path key={c} d={`M ${x(t.pos[a])} ${y(t.h[a])} V ${y(t.h[c])} H ${x(t.pos[b])} V ${y(t.h[b])}`} fill="none" stroke={tokens["--ink-mute"]} strokeWidth={1} />);
  }
  const pick = (b: DendroBlock) => onSelect?.({ cluster: b.cluster, members: b.members, rank: b.rank, group: b.group });
  const press = (b: DendroBlock) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(b);
    }
  };
  const ticks = [0, top / 2, top];
  const name = (b: DendroBlock) => {
    const shown = b.members.slice(0, 6).map((v) => labels[v] ?? String(v));
    return `${b.members.length} ${b.members.length === 1 ? "leaf" : "leaves"}: ${shown.join(", ")}${b.members.length > 6 ? "…" : ""}`;
  };
  return (
    <svg ref={svg} viewBox={`0 0 ${width} ${height}`} width={width} height={height} role={onSelect ? "group" : "img"} aria-label={aria}>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} stroke={tokens["--w4-grid"]} strokeWidth={1} />
          <text x={M.left - 6} y={y(v) + 4} fontSize={caption} fill={tokens["--ink-mute-text"]} textAnchor="end">
            {fmt(v)}
          </text>
        </g>
      ))}
      <text x={12} y={M.top + plotH / 2} fontSize={caption} fill={tokens["--ink-soft"]} textAnchor="middle" transform={`rotate(-90 12 ${M.top + plotH / 2})`}>
        {yLabel}
      </text>
      <g>{links}</g>
      {blocks.map((b) => {
        const x0 = x(b.x0) - (0.5 * plotW) / n;
        const w = ((b.x1 - b.x0 + 1) * plotW) / n;
        const on = selected === b.cluster;
        const rect = <rect x={x0 + 0.5} y={y(b.level)} width={Math.max(1, w - 1)} height={Math.max(2, y(0) - y(b.level))} className={`kit-dendro-block ${b.group === null ? "kit-dendro-grey" : `kit-dendro-g${b.group}`}${on ? " kit-on" : ""}`} />;
        return onSelect ? (
          <g key={b.cluster} role="button" tabIndex={0} aria-pressed={on} aria-label={`Block of ${name(b)}`} className="kit-dendro-pick" onClick={() => pick(b)} onKeyDown={press(b)}>
            {rect}
          </g>
        ) : (
          <g key={b.cluster}>{rect}</g>
        );
      })}
      {cutH !== null ? (
        <g>
          <line x1={M.left} x2={width - M.right} y1={y(cutH)} y2={y(cutH)} stroke={tokens["--ink"]} strokeWidth={1.2} strokeDasharray="5 4" />
          <text x={width - M.right} y={y(cutH) - 5} fontSize={caption} fill={tokens["--ink-soft"]} textAnchor="end">
            cut at {fmt(cutH)}
          </text>
        </g>
      ) : (
        blocks.map((b) => {
          const x0 = x(b.x0) - (0.5 * plotW) / n;
          const w = ((b.x1 - b.x0 + 1) * plotW) / n;
          return <line key={`t${b.cluster}`} x1={x0} x2={x0 + w} y1={y(b.level)} y2={y(b.level)} stroke={tokens["--ink"]} strokeWidth={1.2} strokeDasharray="3 2" />;
        })
      )}
      {named ? (
        t.order.map((leaf, i) => (
          <text key={leaf} x={x(i)} y={y(0) + 10} fontSize={caption} fill={tokens["--ink-soft"]} textAnchor="end" transform={`rotate(-60 ${x(i)} ${y(0) + 10})`}>
            {String(labels[leaf] ?? leaf).length > fit ? <title>{labels[leaf]}</title> : null}
            {short(String(labels[leaf] ?? leaf))}
          </text>
        ))
      ) : (
        <text x={M.left + plotW / 2} y={height - 6} fontSize={caption} fill={tokens["--ink-mute-text"]} textAnchor="middle">
          {n.toLocaleString("en-GB")} leaves, in tree order
        </text>
      )}
    </svg>
  );
}

/** <Dendrogram merges={merges} n={34} cut={{ height: 0.5 }} onSelect={(b) => setPicked(b.cluster)} metric={{ label: "Q", points, best }} /> */
export default function Dendrogram({
  merges,
  n,
  tree,
  labels,
  cut,
  minBlock = 2,
  selected,
  onSelect,
  metric,
  yLabel = "height",
  height = 280,
  aria = "A dendrogram",
}: {
  merges?: Merge[];
  n?: number;
  tree?: DendroTree;
  labels?: string[];
  cut?: DendroCut;
  minBlock?: number;
  selected?: number;
  onSelect?: (block: DendroBlock) => void;
  metric?: DendroMetric;
  yLabel?: string;
  height?: number;
  aria?: string;
}) {
  const base = useSvgBase();
  const built = useMemo(() => {
    if (tree !== undefined) {
      const f = fromTree(tree);
      return { t: buildTree(f.n, f.merges), ids: f.ids.map(String) };
    }
    return { t: buildTree(Math.max(0, n ?? 0), merges ?? []), ids: [] as string[] };
  }, [tree, merges, n]);
  if (!base) return <div className="gv kit-dendro" />;
  if (built.t.n === 0)
    return (
      <div className="gv kit-dendro">
        <p className="kit-empty">No leaves to draw.</p>
      </div>
    );
  return (
    <div className="gv kit-dendro">
      <Plot t={built.t} labels={labels ?? built.ids} cut={cut} minBlock={minBlock} selected={selected} onSelect={onSelect} yLabel={yLabel} height={height} aria={aria} {...base} />
      {metric ? (
        <div className="kit-dendro-metric">
          <p className="kit-dendro-head">{metric.label}</p>
          <SweepCurve
            points={metric.points}
            current={cut && "height" in cut ? cut.height : undefined}
            refLine={metric.best}
            xLabel={yLabel}
            yLabel={metric.label}
          />
        </div>
      ) : null}
    </div>
  );
}
