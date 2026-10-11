// The network view's state, as networkView() keeps it in its closure.
//
// Model: the nodes' groups now (the legend counts these), the highlighted
// link, and what the svg on the page was drawn from. networkView's redraw()
// replaces the chart it last drew, but fitted() swaps in a new chart on every
// width change, so once the parent has been measured that chart is off the
// page and a move or a link hover redraws nothing anyone sees: the legend
// still counts the move, and the next width change draws it (main's kit page
// shows this, K2 request 1). `live` is true until the first width change.
//
// Ui: the lighting under explore. Each drawn svg starts unlit and unpinned;
// the tooltip lives in the stage and keeps its lines and place across draws.
// An element once lit keeps an empty class, as classList.remove leaves it.
import type { NetId, NetNode } from "./layout";

export type Drawn = { nodes: NetNode[]; focus: string | null; width: number };

export type Model = {
  nodes: NetNode[];
  focus: string | null;
  drawn: Drawn;
  live: boolean;
  // A redraw while not live drew a view off the page, which the legend, the
  // zoom buttons and Escape drive from then on: only the shared tooltip shows it.
  orphan: boolean;
  gen: number;
  keep: NetId | null;
};

export type ModelAction = { type: "resize"; width: number } | { type: "move"; nodes: NetNode[]; id: NetId } | { type: "focus"; key: string };

export function initModel({ nodes, focus, width }: Drawn): Model {
  return { nodes, focus, drawn: { nodes, focus, width }, live: true, orphan: false, gen: 0, keep: null };
}

export function model(s: Model, a: ModelAction): Model {
  if (a.type === "resize") {
    if (a.width === s.drawn.width) return s;
    return { ...s, drawn: { nodes: s.nodes, focus: s.focus, width: a.width }, live: false, orphan: false, gen: s.gen + 1, keep: null };
  }
  const nodes = a.type === "move" ? a.nodes : s.nodes;
  const focus = a.type === "focus" ? a.key : s.focus;
  const keep = a.type === "move" ? a.id : null;
  if (!s.live) return { ...s, nodes, focus, orphan: true };
  return { ...s, nodes, focus, drawn: { nodes, focus, width: s.drawn.width }, gen: s.gen + 1, keep };
}

export type Lit = { nodes: Set<NetId>; lines: Set<number>; hubs: Set<NetId> };
export type TipText = { lines: unknown[]; left: string; top: string };

export type Ui = {
  gen: number;
  lit: Lit | null;
  pinned: boolean;
  wasLit: boolean;
  ever: Set<NetId>;
  tip: TipText | null;
  hidden: boolean;
};

// say: the tooltip's lines and place; pin: pin after lighting.
export type UiAction =
  | { type: "clear"; gen: number; unpin: boolean }
  | { type: "light"; gen: number; lit: Lit; pin: boolean; ifUnpinned?: boolean; say?: TipText }
  | { type: "say"; gen: number; say: TipText };

const NONE: Set<NetId> = new Set();

export const initUi = (gen: number): Ui => ({ gen, lit: null, pinned: false, wasLit: false, ever: NONE, tip: null, hidden: true });

function clear(s: Ui, unpin: boolean): Ui {
  if (s.pinned && !unpin) return s;
  return { ...s, pinned: false, lit: null, hidden: true };
}

function step(s: Ui, a: UiAction): Ui {
  if (a.type === "clear") return clear(s, a.unpin);
  if (a.type === "say") return s.pinned ? s : { ...s, tip: a.say, hidden: false };
  if (a.ifUnpinned && s.pinned) return s;
  const lit = clear(s, true);
  const ever = new Set([...lit.ever, ...a.lit.nodes]);
  const next = { ...lit, lit: a.lit, pinned: a.pin, wasLit: true, ever };
  return a.say ? { ...next, tip: a.say, hidden: false } : next;
}

/** One reducer for every drawn svg: an action from an svg no longer drawn (a lower gen, -1 for the orphan) reaches only the shared tooltip. */
export function ui(s: Ui, a: UiAction): Ui {
  if (a.gen < s.gen) {
    const off = step(initUi(a.gen), a);
    return off.tip === null && off.hidden === s.hidden ? s : { ...s, tip: off.tip ?? s.tip, hidden: off.hidden };
  }
  return step(uiFor(s, a.gen), a);
}

/** The ui for the svg drawn now: a new svg starts unlit, keeping the tooltip. */
export const uiFor = (s: Ui, gen: number): Ui => (s.gen === gen ? s : { ...initUi(gen), tip: s.tip, hidden: s.hidden });
