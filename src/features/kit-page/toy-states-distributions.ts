// The awkward cases the edge-state page draws for the "Distributions and
// nulls" components. Toy numbers only.
import type { BoardAxis, BoardCell, NullBarRow } from "@/kit";
import { boardCells, seeded } from "./toy-distributions";

/** Degrees with many zeros, for log axes that cannot show them. */
export const zerosKs = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 5, 8, 13, 0, 0, 0];

/** A null far below the real value: 200 draws around 0.02 against 0.32. */
export const farSamples: number[] = (() => {
  const rand = seeded(5);
  return Array.from({ length: 200 }, () => 0.02 + (rand() + rand() + rand() - 1.5) * 0.006);
})();

/** Every measure fixed by its null: degree-preserving shuffles hold degrees equal. */
const FIXED_MEASURES: BoardAxis[] = [
  { key: "kmax", label: "Largest degree" },
  { key: "kmean", label: "Mean degree" },
];
const FIXED_MODELS: BoardAxis[] = [
  { key: "config", label: "Degree-preserving shuffle" },
  { key: "stub", label: "Stub matching" },
];
export const fixedBoard = {
  measures: FIXED_MEASURES,
  models: FIXED_MODELS,
  cells: boardCells({ kmax: [[106, 106, 0], [106, 106, 0]], kmean: [[5.9, 5.9, 0], [5.9, 5.9, 0]] }, FIXED_MEASURES, FIXED_MODELS, 3),
};

/** Long measure and model names, and one cell missing. */
const LONG_MEASURES: BoardAxis[] = [
  { key: "a", label: "Share of links that cross between the two largest communities of the network" },
  { key: "b", label: "Reciprocity" },
];
const LONG_MODELS: BoardAxis[] = [
  { key: "x", label: "A null model with a very long name that keeps going" },
  { key: "y", label: "G(n, m)" },
  { key: "z", label: "Configuration" },
];
export const longBoard: { measures: BoardAxis[]; models: BoardAxis[]; cells: BoardCell[] } = {
  measures: LONG_MEASURES,
  models: LONG_MODELS,
  cells: boardCells({ a: [[0.12, 0.31, 0.02], [0.12, 0.5, 0.01], [0.12, 0.13, 0.02]], b: [[0.4, 0.05, 0.01], [0.4, 0.02, 0.005]] }, LONG_MEASURES, LONG_MODELS, 9),
};

/** Long labels, a negative observed value, a row with no null and a null with sd 0. */
export const longBars: NullBarRow[] = [
  { key: "a", label: "Links between pages in the same community and the same decade of first appearance", observed: 310, mean: 220, sd: 12 },
  { key: "b", label: "Change in links after removing the ten best-connected pages", observed: -40, mean: 5, sd: 10 },
  { key: "c", label: "A category with no null model", observed: 80 },
  { key: "d", label: "Fixed by construction", observed: 150, mean: 150, sd: 0 },
];
