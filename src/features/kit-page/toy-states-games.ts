// The games batch's awkward cases for the edge-state page: graphs too small for
// the budget, a room with nobody in it, a lone suspect, a case with every clue
// shown, a line with no decoys, and the town's pages with no way home. All toys.
import type { BlankRound, ClueRound, TwoRound } from "@/kit/QuizRun";
import type { Edge } from "./toy-networks";

/** A path of four: a budget of 8 is cut to 4. */
export const PATH4: Edge[] = [[0, 1], [1, 2], [2, 3]];
export const PATH4_NAMES = ["Ann", "Ben", "Cleo", "Dov"];

/** Six people and not one link: every hit leaves a core of one. */
export const LONERS = ["Ada", "Bo", "Cy", "Di", "Ed", "Flo"];

/** A triangle: a table of 9 seats is cut to the 2 guests there are. */
export const TRIANGLE: Edge[] = [[0, 1], [1, 2], [0, 2]];

/** The only suspect, with a word bag that matches the clues. */
export const LONE_SUSPECT: ClueRound = {
  type: "clue",
  id: "lone",
  answer: "keeper",
  suspects: [{ key: "keeper", label: "The lighthouse keeper, whose page is the only one in this very long case file" }],
  clues: ["lamp", "storm", "tower"],
  bags: { keeper: { lamp: 5, storm: 3, tower: 4 } },
};

/** Four suspects that look alike to the machine until the end, opened with every clue shown. */
export const ALL_CLUES: ClueRound = {
  type: "clue",
  id: "alike",
  answer: "d",
  suspects: [
    { key: "a", label: "Suspect A" },
    { key: "b", label: "Suspect B" },
    { key: "c", label: "Suspect C" },
    { key: "d", label: "Suspect D" },
  ],
  clues: ["grey", "coat", "rain", "umbrella", "hat", "station"],
  bags: { a: { grey: 1, coat: 1 }, b: { grey: 1, coat: 1 }, c: { grey: 1, coat: 1 }, d: { grey: 1, coat: 1, station: 1 } },
};

/** Two sentences of very different lengths. */
export const LONG_TWO: TwoRound = {
  type: "two",
  id: "long",
  options: [
    "Yes.",
    "The keeper climbed the hundred and twelve steps of the tower every evening, trimmed the wick, wound the clockwork that turned the lens, and wrote the weather into a book nobody else ever read.",
  ],
  answer: 1,
};

/** A blank with no decoys: one option, the answer. */
export const NO_DECOYS: BlankRound = { type: "blank", id: "alone", left: "", right: "and nothing else on the line", answer: "only", decoys: [] };
