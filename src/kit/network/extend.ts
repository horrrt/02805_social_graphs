// The network view's additions for the explorables, applied to the rows
// networkLayout() returns, so a view that sets none of them draws exactly as
// graph.js draws it: a circle layout, node size and a sequential colour from
// a value, node states (ghost, picked, new, ring), a highlighted subset of
// links, and arrowheads for directed links. Style: the "Kit: networks"
// section of post.css (.kit-net-*).
import type { Layout, LineRow, NetId, NetNode, Options, Shape } from "./layout";
import { radiusScale, rampCss, unit } from "./ramp";

export type NodeState = "ghost" | "picked" | "new" | "ring";
export type Head = { points: string; cls: string };

const DEFAULT_SIZES: [number, number] = [4, 14];

/** Whether the spec uses any addition; when not, the rows stay as they are. */
export function extended(opts: Options, nodes: NetNode[]): boolean {
  return Boolean(
    opts.directed || opts.color === "sequential" || opts.scale || opts.highlightLinks?.length || opts.layout === "circle" ||
      nodes.some((n) => n.state !== undefined || n.value !== undefined),
  );
}

/** The nodes placed round a circle in the layout's box (y runs to ratio), node 0 at the top. */
export function circlePlaced(nodes: NetNode[], ratio: number): NetNode[] {
  const r = 0.45 * Math.min(1, ratio);
  return nodes.map((n, i) => {
    const t = (2 * Math.PI * i) / Math.max(1, nodes.length) - Math.PI / 2;
    return { ...n, x: 0.5 + r * Math.cos(t), y: ratio / 2 + r * Math.sin(t) };
  });
}

const linkKey = (a: NetId, b: NetId, directed: boolean) => (directed || String(a) < String(b) ? `${a}|${b}` : `${b}|${a}`);

/**
 * The rows with the additions: radii and fills from values, a state's class
 * and ring, highlighted and faint links, and the arrowheads (empty unless
 * directed). Returns the same layout when the spec uses none of them.
 */
export function extendLayout(L: Layout, opts: Options, nodes: NetNode[]): Layout & { heads: Head[] } {
  if (!extended(opts, nodes)) return { ...L, heads: [] };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const values = nodes.map((n) => n.value).filter((v): v is number => v !== undefined);
  const size = opts.scale || (values.length && !opts.color) ? radiusScale(values, opts.scale ?? DEFAULT_SIZES) : null;
  const shade = opts.color === "sequential" ? unit(values) : null;
  const radius = new Map<NetId, number>();

  const rows = L.nodes.map((row) => {
    const n = byId.get(row.id);
    if (!n) return row;
    const shapes: Shape[] = row.shapes.map((s) => {
      if (!("cx" in s) || !s.cls.includes("gv-node")) return s;
      const r = n.value !== undefined && size ? size(n.value) : s.r;
      const cls = n.state === "ghost" || n.state === "picked" || n.state === "new" ? `${s.cls} kit-net-is-${n.state}` : s.cls;
      const fill = n.value !== undefined && shade ? rampCss(shade(n.value)) : undefined;
      return { ...s, r, cls, ...(fill ? { fill } : {}) };
    });
    const disc = shapes.find((s): s is Extract<Shape, { cx: number }> => "cx" in s);
    if (disc) radius.set(row.id, disc.r);
    if (disc && n.state && n.state !== "ghost") shapes.push({ cx: disc.cx, cy: disc.cy, r: disc.r + 4, cls: `kit-net-ring kit-net-${n.state}` });
    return { ...row, shapes, name: `${n.label ?? n.id}${n.state && n.state !== "ring" ? `, ${n.state === "ghost" ? "removed" : n.state}` : ""}` };
  });

  const directed = Boolean(opts.directed);
  const hi = new Set((opts.highlightLinks ?? []).map(([a, b]) => linkKey(a, b, directed)));
  const ghost = (id: NetId) => byId.get(id)?.state === "ghost";
  const lines: LineRow[] = L.lines.map((row) => {
    const extra = [hi.has(linkKey(row.link.source, row.link.target, directed)) ? "kit-net-hi" : "", ghost(row.link.source) || ghost(row.link.target) ? "kit-net-faint" : ""].filter(Boolean);
    return extra.length ? { ...row, cls: `${row.cls} ${extra.join(" ")}` } : row;
  });
  // Highlighted lines last, so they sit on top.
  lines.sort((a, b) => Number(a.cls.includes("kit-net-hi")) - Number(b.cls.includes("kit-net-hi")));

  const heads: Head[] = [];
  if (directed)
    for (const row of lines) {
      const { x1, y1, x2, y2 } = row.at;
      const d = Math.hypot(x2 - x1, y2 - y1);
      if (d < 1) continue;
      const ux = (x2 - x1) / d;
      const uy = (y2 - y1) / d;
      const r = (radius.get(row.link.target) ?? 7) + 1.5;
      const tx = x2 - ux * r;
      const ty = y2 - uy * r;
      const h = Math.min(9, d * 0.35);
      const bx = tx - ux * h;
      const by = ty - uy * h;
      const w = h * 0.45;
      heads.push({
        points: `${tx.toFixed(2)},${ty.toFixed(2)} ${(bx - uy * w).toFixed(2)},${(by + ux * w).toFixed(2)} ${(bx + uy * w).toFixed(2)},${(by - ux * w).toFixed(2)}`,
        cls: `kit-net-head${row.cls.includes("kit-net-hi") ? " kit-net-hi" : ""}${row.cls.includes("kit-net-faint") ? " kit-net-faint" : ""}`,
      });
    }
  return { ...L, lines, nodes: rows, heads };
}
