// surface: paints the network's <canvas> each frame (useCanvasStage sizes it)
// A network on a canvas, for 200 to 2,000 nodes where SVG marks get slow: links
// and nodes painted every frame while positions move, in the .gv palette
// (group colours, or a sequential ramp by value), with node states (ghost,
// picked, new, ring), highlighted links and arrows for directed links.
// Positions are in the unit square: each node's x and y, or one of the named
// layouts in `positions` (node order), and switching layouts tweens the nodes
// there (instantly under reduced motion or off screen). Hover shows a
// tooltip, a click names the node under the pointer; the canvas has no
// per-node keyboard access, so a page that needs a pick offers a control for
// it too. A line under the canvas says what it shows, in counts. Pass
// `specs` for small multiples, one canvas per spec. Style: .kit-netcanvas in
// post.css.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { useCanvasStage } from "@/lib/useCanvas";
import { useHydrated } from "@/lib/useHydrated";
import { useTokens } from "@/lib/useTypeScale";
import TipBox, { type Tip } from "./TipBox";
import { useOnScreen, useReducedMotion } from "./network/motion";
import { RAMP_TOKENS, radiusScale, rampColour, unit } from "./network/ramp";

export type NodeState = "ghost" | "picked" | "new" | "ring";
export type CanvasNode = { id: string; x?: number; y?: number; r?: number; value?: number; group?: number | null; state?: NodeState; label?: string };
export type CanvasLink = { s: string; t: string; w?: number; highlight?: boolean };
export type Point = [number, number];

export type NetCanvasSpec = {
  nodes: CanvasNode[];
  links: CanvasLink[];
  positions?: Record<string, Point[]>;
  layout?: string;
  color?: "group" | "sequential";
  directed?: boolean;
  linkWidth?: (l: CanvasLink) => number;
  onNodeClick?: (id: string) => void;
  tooltip?: (n: CanvasNode) => string[] | null;
  /** Radius range for nodes sized by value (under color "sequential", only when set); nodes without r or value take the smaller end. */
  sizes?: [number, number];
  height?: number;
  theme?: "dark";
  title?: string;
  aria: string;
  /** The line under the canvas; by default the counts of nodes, links and each state. */
  describe?: string;
};

const TOKENS = [
  "--group-0", "--group-1", "--group-2", "--group-3", "--group-4", "--group-5", "--group-6", "--group-7", "--group-none",
  "--graph-edge", "--graph-accent", "--graph-ink", "--graph-ground", "--people", ...RAMP_TOKENS,
];
const TWEEN_MS = 700;
const PAD = 14;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Where each node sits in the unit square: the named layout, else its own x
// and y, else round a circle.
function targetsOf(spec: NetCanvasSpec): Point[] {
  const named = spec.layout ? spec.positions?.[spec.layout] : undefined;
  const n = spec.nodes.length;
  return spec.nodes.map((node, i) => {
    const p = named?.[i];
    if (p) return [p[0], p[1]];
    if (Number.isFinite(node.x) && Number.isFinite(node.y)) return [node.x!, node.y!];
    const t = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
    return [0.5 + 0.46 * Math.cos(t), 0.5 + 0.46 * Math.sin(t)];
  });
}

/** The text alternative: what the canvas shows, in counts. */
export function describeCanvas(spec: Pick<NetCanvasSpec, "nodes" | "links" | "directed">): string {
  const n = spec.nodes.length;
  const m = spec.links.length;
  const counts = new Map<NodeState, number>();
  for (const node of spec.nodes) if (node.state) counts.set(node.state, (counts.get(node.state) ?? 0) + 1);
  const hi = spec.links.filter((l) => l.highlight).length;
  const parts = [`${n.toLocaleString("en-GB")} ${n === 1 ? "node" : "nodes"}`, `${m.toLocaleString("en-GB")} ${spec.directed ? "directed " : ""}${m === 1 ? "link" : "links"}`];
  const said: Record<NodeState, string> = { picked: "picked", new: "new", ring: "ringed", ghost: "greyed out" };
  for (const s of ["picked", "new", "ring", "ghost"] as NodeState[]) if (counts.get(s)) parts.push(`${counts.get(s)} ${said[s]}`);
  if (hi) parts.push(`${hi} ${hi === 1 ? "link" : "links"} highlighted`);
  return `${parts.join(", ")}.`;
}

function Single({ spec, tokens, reduced }: { spec: NetCanvasSpec; tokens: Record<string, string>; reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const height = spec.height ?? 360;
  const onScreen = useOnScreen(hostRef);
  const [tip, setTip] = useState<Tip | null>(null);

  const targets = useMemo(() => targetsOf(spec), [spec]);
  const index = useMemo(() => new Map(spec.nodes.map((n, i) => [n.id, i])), [spec.nodes]);
  const radius = useMemo(() => {
    const [lo, hi] = spec.sizes ?? [spec.nodes.length > 600 ? 2 : 3.5, spec.nodes.length > 600 ? 7 : 12];
    const vals = spec.nodes.map((n) => n.value).filter((v): v is number => v !== undefined);
    // A value shades the node under the sequential ramp; it sizes it only when sizes asks for that too.
    const size = vals.length && (spec.color !== "sequential" || spec.sizes) ? radiusScale(vals, [lo, hi]) : null;
    return spec.nodes.map((n) => n.r ?? (n.value !== undefined && size ? size(n.value) : lo));
  }, [spec.nodes, spec.sizes, spec.color]);
  const shade = useMemo(() => {
    if (spec.color !== "sequential") return null;
    const u = unit(spec.nodes.map((n) => n.value ?? NaN));
    const stops = RAMP_TOKENS.map((t) => tokens[t]);
    return spec.nodes.map((n) => (n.value === undefined ? tokens["--group-none"] : rampColour(u(n.value), stops)));
  }, [spec.color, spec.nodes, tokens]);

  // What the canvas shows now, and the tween from the last positions to the targets.
  const shown = useRef<Point[]>([]);
  const tween = useRef<{ from: Point[]; to: Point[]; start: number } | null>(null);
  const frame = useRef(0);
  // The canvas's size at its last paint: the unit square fits inside it, centred.
  const size = useRef({ width: 0, height: 0 });
  const toPx = (p: Point): Point => {
    const { width, height } = size.current;
    const side = Math.max(10, Math.min(width, height) - 2 * PAD);
    return [(width - side) / 2 + p[0] * side, (height - side) / 2 + p[1] * side];
  };

  // useCanvasStage backs the canvas at its rendered size and device pixel
  // ratio, and calls this on mount and on every resize; a tween asks again each frame.
  const paint = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    frame.current = 0;
    size.current = { width, height };
    // The first paint (on mount, before the targets are shown) draws at the targets.
    let pos = shown.current.length === spec.nodes.length ? shown.current : targets;
    const tw = tween.current;
    let more = false;
    if (tw) {
      const t = Math.min(1, (performance.now() - tw.start) / TWEEN_MS);
      const e = ease(t);
      pos = tw.to.map((b, i) => {
        const a = tw.from[i] ?? b;
        return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
      });
      if (t < 1) more = true;
      else tween.current = null;
    }
    shown.current = pos;
    ctx.clearRect(0, 0, width, height);
    const px = pos.map(toPx);
    const ghost = (i: number | undefined) => i !== undefined && spec.nodes[i]?.state === "ghost";
    const big = spec.nodes.length > 600;

    // Links: plain first, then highlighted on top.
    for (const pass of [false, true]) {
      for (const l of spec.links) {
        if (Boolean(l.highlight) !== pass) continue;
        const a = index.get(l.s);
        const b = index.get(l.t);
        if (a === undefined || b === undefined) continue;
        const faint = ghost(a) || ghost(b);
        ctx.strokeStyle = pass ? tokens["--graph-accent"] : tokens["--graph-edge"];
        ctx.globalAlpha = faint ? 0.08 : pass ? 0.95 : big ? 0.25 : 0.45;
        ctx.lineWidth = (spec.linkWidth?.(l) ?? (big ? 0.6 : 1.2)) + (pass ? 1 : 0);
        const [x1, y1] = px[a];
        const [x2, y2] = px[b];
        if (a === b) {
          ctx.beginPath();
          ctx.arc(x1 + radius[a], y1 - radius[a], radius[a] * 0.9, 0, 2 * Math.PI);
          ctx.stroke();
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        if (spec.directed) {
          const d = Math.hypot(x2 - x1, y2 - y1) || 1;
          const ux = (x2 - x1) / d;
          const uy = (y2 - y1) / d;
          const tipX = x2 - ux * (radius[b] + 1.5);
          const tipY = y2 - uy * (radius[b] + 1.5);
          const head = Math.min(8, d * 0.4);
          ctx.lineTo(tipX - ux * head * 0.8, tipY - uy * head * 0.8);
          ctx.stroke();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX - ux * head - uy * head * 0.45, tipY - uy * head + ux * head * 0.45);
          ctx.lineTo(tipX - ux * head + uy * head * 0.45, tipY - uy * head - ux * head * 0.45);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Nodes: ghosts first, so live nodes sit on top; picked and new last.
    const order = spec.nodes.map((_, i) => i);
    const rank = (i: number) => ({ ghost: 0, undefined: 1, ring: 2, new: 3, picked: 4 })[String(spec.nodes[i].state) as "ghost"] ?? 1;
    order.sort((a, b) => rank(a) - rank(b));
    for (const i of order) {
      const node = spec.nodes[i];
      const [x, y] = px[i];
      const r = radius[i];
      const g = node.group;
      let fill = shade ? shade[i] : g === null || g === undefined ? tokens["--group-none"] : tokens[`--group-${((g % 8) + 8) % 8}`];
      if (node.state === "picked") fill = tokens["--graph-accent"];
      if (node.state === "new") fill = tokens["--people"];
      ctx.globalAlpha = node.state === "ghost" ? 0.2 : 1;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
      if (!big || node.state) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = tokens["--graph-ground"];
        ctx.stroke();
      }
      if (node.state === "ring" || node.state === "picked" || node.state === "new") {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = node.state === "new" ? tokens["--people"] : node.state === "picked" ? tokens["--graph-accent"] : tokens["--graph-ink"];
        ctx.beginPath();
        ctx.arc(x, y, r + 3.5, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (more) frame.current = requestAnimationFrame(() => draw.current());
  };
  const draw = useRef<() => void>(() => {});
  const stage = useCanvasStage(canvasRef, paint);
  useLayoutEffect(() => {
    draw.current = stage;
  });

  // New targets: tween there from what is shown (new nodes start in place).
  const lastTargets = useRef<Point[] | null>(null);
  useLayoutEffect(() => {
    const prev = lastTargets.current;
    lastTargets.current = targets;
    const instant = reduced || !onScreen || prev === null || shown.current.length === 0;
    if (instant) {
      tween.current = null;
      shown.current = targets;
    } else if (prev !== targets) {
      const from = targets.map((p, i) => shown.current[i] ?? p);
      tween.current = { from, to: targets, start: performance.now() };
    }
  }, [targets, reduced, onScreen]);

  // Every new spec or palette paints again, cancelling a frame already asked for.
  useLayoutEffect(() => {
    cancelAnimationFrame(frame.current);
    stage();
  }, [stage, spec, targets, radius, shade, tokens]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const nodeAt = (e: MouseEvent<HTMLCanvasElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let best = -1;
    let bestD = Infinity;
    shown.current.forEach((p, i) => {
      const [nx, ny] = toPx(p);
      const d = Math.hypot(nx - x, ny - y);
      if (d <= radius[i] + 4 && d < bestD && spec.nodes[i]?.state !== "ghost") {
        best = i;
        bestD = d;
      }
    });
    return best;
  };
  const tipFor = (i: number): string[] => {
    const n = spec.nodes[i];
    return spec.tooltip?.(n) ?? [n.label ?? n.id, ...(n.value !== undefined ? [`value ${+n.value.toFixed(3)}`] : [])];
  };
  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const i = nodeAt(e);
    setTip(i < 0 ? null : { lines: tipFor(i), x: e.clientX, y: e.clientY });
  };
  const click = spec.onNodeClick;

  return (
    <div className="kit-netcanvas-cell kit-tip-host" ref={hostRef}>
      {/* The stage carries the size and the label; React never changes the canvas after mount. */}
      <div className={`kit-netcanvas-stage${click ? " kit-netcanvas-pick" : ""}`} style={{ height }} role="img" aria-label={spec.aria}>
        <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerMove={onMove}
        onPointerLeave={() => setTip(null)}
        onClick={
          click
            ? (e) => {
                const i = nodeAt(e);
                if (i >= 0) click(spec.nodes[i].id);
              }
            : undefined
        }
        />
      </div>
      <TipBox host={hostRef} tip={tip} />
      <p className="kit-note">{spec.describe ?? describeCanvas(spec)}</p>
    </div>
  );
}

function Drawn({ specs, columns, theme }: { specs: NetCanvasSpec[]; columns?: number; theme?: "dark" }) {
  const ref = useRef<HTMLDivElement>(null);
  const tokens = useTokens(TOKENS, ref);
  const reduced = useReducedMotion();
  const many = specs.length > 1;
  return (
    <div
      ref={ref}
      className={`gv kit-netcanvas${theme === "dark" ? " gv-dark" : ""}${many ? " kit-netgrid" : ""}`}
      style={many ? { gridTemplateColumns: `repeat(${columns ?? Math.min(3, specs.length)}, minmax(0, 1fr))` } : undefined}
    >
      {tokens
        ? specs.map((s, i) => (
            <div key={i} className="kit-netcanvas-item">
              {s.title ? <p className="kit-netcanvas-title">{s.title}</p> : null}
              <Single spec={s} tokens={tokens} reduced={reduced} />
            </div>
          ))
        : null}
    </div>
  );
}

/** <NetCanvas nodes={nodes} links={links} positions={{ grid, force }} layout="force" aria="…" />, or <NetCanvas specs={[a, b, c]} /> for small multiples. */
export default function NetCanvas(props: NetCanvasSpec | { specs: NetCanvasSpec[]; columns?: number; theme?: "dark" }) {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="gv kit-netcanvas" />;
  if ("specs" in props) {
    if (props.specs.length === 0) return <p className="kit-empty">No networks to draw.</p>;
    return <Drawn specs={props.specs} columns={props.columns} theme={props.theme} />;
  }
  return <Drawn specs={[props]} theme={props.theme} />;
}
