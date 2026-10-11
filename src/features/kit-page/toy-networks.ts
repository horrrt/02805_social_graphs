// The networks batch's toy graphs for the kit page: two textbook networks
// typed in (Krackhardt's kite and Zachary's karate club, as networkx ships
// them) and the seeded layouts the demos draw them with. Nothing here is a
// result of this project.
import { forceLayout, mulberry32 } from "@/kit/graph-core";
import type { Point } from "@/kit/NetCanvas";

export type Edge = [number, number];

/** Krackhardt's kite: ten people, the classic picture of degree, closeness and betweenness disagreeing. */
export const KITE_NAMES = ["Andre", "Beverly", "Carol", "Diane", "Ed", "Fernando", "Garth", "Heather", "Ike", "Jane"];
export const KITE: Edge[] = [
  [0, 1], [0, 2], [0, 3], [0, 5], [1, 3], [1, 4], [1, 6], [2, 3], [2, 5], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [5, 7], [6, 7], [7, 8], [8, 9],
];
// The kite as it is usually drawn, turned so the tail runs right: x from 0 to 1, y from 0 to 0.5.
export const KITE_AT: Point[] = [
  [0.06, 0.15], [0.06, 0.35], [0.236, 0.05], [0.236, 0.25], [0.236, 0.45], [0.412, 0.15], [0.412, 0.35], [0.588, 0.25], [0.764, 0.25], [0.94, 0.25],
];

/** Zachary's karate club: 34 members, 78 friendships. */
export const KARATE: Edge[] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 10], [0, 11], [0, 12], [0, 13], [0, 17], [0, 19], [0, 21], [0, 31],
  [1, 2], [1, 3], [1, 7], [1, 13], [1, 17], [1, 19], [1, 21], [1, 30], [2, 3], [2, 7], [2, 8], [2, 9], [2, 13], [2, 27], [2, 28], [2, 32],
  [3, 7], [3, 12], [3, 13], [4, 6], [4, 10], [5, 6], [5, 10], [5, 16], [6, 16], [8, 30], [8, 32], [8, 33], [9, 33], [13, 33], [14, 32],
  [14, 33], [15, 32], [15, 33], [18, 32], [18, 33], [19, 33], [20, 32], [20, 33], [22, 32], [22, 33], [23, 25], [23, 27], [23, 29],
  [23, 32], [23, 33], [24, 25], [24, 27], [24, 31], [25, 31], [26, 29], [26, 33], [27, 33], [28, 31], [28, 33], [29, 32], [29, 33],
  [30, 32], [30, 33], [31, 32], [31, 33], [32, 33],
];

let karateAt: Point[] | null = null;
/** The club laid out once per page (seeded), in the unit square. */
export function karateLayout(): Point[] {
  karateAt ??= forceLayout(34, KARATE, { rng: mulberry32(34), iterations: 200 }) as Point[];
  return karateAt;
}

/** Unit-square points into NetworkView's box, y running to ratio, without stretching. */
export const toBox = (pos: Point[], ratio: number): Point[] => {
  const s = Math.min(1, ratio);
  return pos.map(([x, y]) => [(1 - s) / 2 + x * s, (ratio - s) / 2 + y * s]);
};
