// Cold Read, round 2 (Whose Line): the rules as pure functions. The data is
// public/play/cold-read/data/whose_line.json, written by
// analysis/week06_whose_line.py: for each pair of communities, words that lean
// to one side, words both use alike, and one-page flukes, each with its rate
// per 10,000 words in both groups.
import { shuffled } from "./rules";

export type Answer = "a" | "b" | "both" | "fluke";
export type Term = { w: string; x: number; y: number; ua: number; ub: number; pa: number; pb: number; top: string; share: number };
export type Pair = { a: number; b: number; cards: Record<Answer, Term[]>; cloud: [number, number][] };
export type WhoseLineData = {
  groups: { label: string; size: number; tokens: number; hubs: { name: string; img: string | null }[] }[];
  pairs: Pair[];
};

export const CARDS = 8;
export const PER_KIND = 2;
export { LIVES } from "./rules"; // every round plays with the same hearts
export const INSPECT_COST = 50;
export const MAX_STREAK = 5;
const KINDS: Answer[] = ["a", "b", "both", "fluke"];

/** A match's hand: two words of each kind, drawn at random, in random order. */
export function deal(pair: Pair, random: () => number = Math.random): { term: Term; kind: Answer }[] {
  return shuffled(
    KINDS.flatMap((kind) => shuffled(pair.cards[kind], random).slice(0, PER_KIND).map((term) => ({ term, kind }))),
    random,
  );
}

/** Rate in the first group over rate in the second. */
export const ratio = (t: Term) => t.x / t.y;

export type Verdict = "right" | "half" | "wrong";

/**
 * A call's verdict. Calling the corner a fluke sits in is half right: the
 * group does use the word more, it just takes one page to show it. Half right
 * scores nothing and breaks the streak, but costs no life.
 */
export function judge(kind: Answer, said: Answer, t: Term): Verdict {
  if (said === kind) return "right";
  if (kind === "fluke" && said === (ratio(t) >= 1 ? "a" : "b")) return "half";
  return "wrong";
}

/** Points for a right call: 100 times the streak (this call included, up to MAX_STREAK), less the inspection, never below 0. */
export function gain(streak: number, inspected: boolean) {
  return Math.max(0, 100 * Math.min(Math.max(streak, 1), MAX_STREAK) - (inspected ? INSPECT_COST : 0));
}
