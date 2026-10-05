// The network view's types, and graph.js's pure layout typed for them: the
// same rows networkView() turns into elements, so NetworkView draws the same
// view. graph.js is plain JS; these are the shapes it is used with.
import * as graph from "@/scripts/graph.js";

export type NetId = string | number;

/** A node: x and y from 0 to 1 (y to ratio), group 0 to 7 or null, groups [a, b] for a node in two. */
export type NetNode = {
  id: NetId;
  x: number;
  y: number;
  label?: string;
  group?: number | null;
  groups?: number[];
  r?: number;
  title?: string;
  labelSide?: "left";
};

export type NetLink = {
  source: NetId;
  target: NetId;
  weight?: number;
  group?: number | null;
  mark?: boolean;
  width?: number;
  dashed?: boolean;
  title?: string;
};

export type NodeInfo = { degree: number; marked: number; group: string | null };

/** networkView's spec: graph.js's header lists what each option does. */
export type NetworkSpec = {
  nodes: NetNode[];
  links: NetLink[];
  groups?: string[];
  theme?: "dark";
  colorNodes?: boolean;
  colorLinks?: boolean;
  fade?: boolean;
  titles?: "hubs" | "none";
  hubs?: NetId[];
  labels?: "inside" | "beside";
  tone?: "accent";
  strongLinks?: boolean;
  badges?: boolean;
  hollow?: boolean;
  weights?: boolean;
  highlight?: { source: NetId; target: NetId; weight?: number };
  movable?: boolean;
  legend?: boolean;
  legendNone?: boolean;
  noneLabel?: string;
  unit?: [string, string];
  note?: string;
  ratio?: number;
  radius?: number;
  width?: number;
  aria?: string;
  explore?: boolean;
  describe?: (n: NetNode, info: NodeInfo) => unknown[] | null | undefined;
};

export type Measure = (text: unknown, role?: string, weight?: number | string) => number;

type At = { x1: number; y1: number; x2: number; y2: number };
export type LineRow = { link: NetLink & { key: string; a: NetNode; b: NetNode }; cls: string; width: number; at: At; title: string | null; hit: string | null };
export type Shape = { d: string; cls: string } | { cx: number; cy: number; r: number; cls: string };
export type NodeRow = {
  id: NetId;
  one: number | null | undefined;
  empty: boolean;
  shapes: Shape[];
  label: { x: number; y: number; role: string; text: NetId; cls: string } | null;
  badge: { cx: number; cy: number; r: number; x: number; y: number; text: string } | null;
  title: string | null;
  movable: string | null;
};
export type HubRow = {
  id: NetId;
  group: number | null | undefined;
  aria: string;
  ring: { cx: number; cy: number; r: number; cls: string };
  leader: At | null;
  pill: { x: number; y: number; width: number; height: number; rx: number };
  name: { x: number; y: number; text: NetId };
};
export type Layout = {
  width: number;
  height: number;
  lines: LineRow[];
  nodes: NodeRow[];
  side: { x: number; y: number; anchor: "start" | "end"; text: string }[] | null;
  hubs: HubRow[];
  weight: { pill: { x: number; y: number; width: number; height: number; rx: number }; text: { x: number; y: number; text: string } } | null;
};
export type Near = Map<NetId, { lines: number[]; ids: Set<NetId>; marked: number }>;
export type Legend = { rows: { group: number; dot: string; text: string }[]; none: { dot: string; text: string } | null };

/** The spec with networkView's defaults: coloured nodes and a ratio of 0.75. */
export type Options = NetworkSpec & { colorNodes: boolean; ratio: number };

export const gclass = graph.gclass as (g: number | null | undefined) => string;
export const groupOf = graph.groupOf as (n: NetNode) => number | null | undefined;
export const legendRows = graph.legendRows as (opts: Options, state: NetNode[]) => Legend;
export const nextGroup = graph.nextGroup as (mark: NodeRow, k: number) => number;
export const networkLayout = graph.networkLayout as unknown as (
  opts: Options,
  state: NetNode[],
  width: number,
  focus: string | null,
  measure: Measure,
  size: (role: string) => number,
) => Layout;
export const neighbours = graph.neighbours as unknown as (state: NetNode[], lines: LineRow[]) => Near;
export const describeNode = graph.describeNode as unknown as (opts: Options, n: NetNode, e: { ids: Set<NetId>; marked: number }) => unknown[];
