// Cold Read, round 4 (Tezgüino): the rules as pure functions. The data is
// public/play/cold-read/data/tezguino.json, written by
// analysis/week06_tezguino.py: for each hidden word, its strongest contexts
// at windows 1 to 4, by raw count and by PPMI, and three sentences with the
// word blacked out (■).
import { shuffled } from "./rules";

export type Weight = "counts" | "ppmi";
export type Row = [string, number][];
export type HiddenWord = { w: string; uses: number; df: number; rows: Record<Weight, Record<string, Row>>; sentences: string[] };
export type TezguinoData = { windows: number[]; words: HiddenWord[] };

export const LIVES = 3;
export const MAX_STREAK = 5;
export const OPTIONS = 4;
export const BASE = 1000;
export const FLOOR = 100;
/** Each window step past ±1, the switch to PPMI, and each sentence peek cost this much of the word's points. */
export const COST = { window: 100, ppmi: 200, peek: 150 } as const;

/** The four answers: the hidden word and three others, in random order. */
export function options(count: number, answer: number, random: () => number = Math.random): number[] {
  const others = shuffled(Array.from({ length: count }, (_, i) => i).filter((i) => i !== answer), random).slice(0, OPTIONS - 1);
  return shuffled([answer, ...others], random);
}

/** What the tools bought so far cost: wider windows, PPMI, peeks. */
export const spent = (window: number, ppmi: boolean, peeks: number) => COST.window * (window - 1) + (ppmi ? COST.ppmi : 0) + COST.peek * peeks;

/** Points for a right pick: what is left of 1,000 after the tools (at least 100), times the streak up to MAX_STREAK. */
export function points(cost: number, streak = 1) {
  return Math.max(FLOOR, BASE - cost) * Math.min(Math.max(streak, 1), MAX_STREAK);
}

/** A sentence split around its blacked-out word, so the reveal can show the word in place. */
export const pieces = (sentence: string) => sentence.split("■");
