// Semantic Minefield's six rounds, their scoring and the sentences the game
// builds from the data: why a tile was a bomb or safe, and how a plain
// keyword search over the one-line descriptions compares with the
// category labels.
import { type Board, hash, makeBoard, type Spec } from "./board";
import { CATEGORIES, type CatId, type Character, isIn } from "./characters";

export type Round = Spec & {
  id: string;
  title: string;
  /** What this round's overlap teaches, one sentence. */
  lesson: string;
  /** The word a keyword search looks for in the descriptions. */
  keyword: string;
};

export const ROUNDS: Round[] = [
  {
    id: "villains",
    title: "Find the villains",
    target: "villain",
    rows: 5,
    cols: 5,
    bombs: 4,
    include: ["hawkeye", "loki", "doom", "redskull"],
    lesson: "The basics: a number counts the villains among the eight tiles around it.",
    keyword: "villain",
  },
  {
    id: "avengers",
    title: "Find the Avengers",
    target: "avenger",
    rows: 5,
    cols: 5,
    bombs: 5,
    include: ["cyclops", "xavier", "surfer", "wong", "storm"],
    lesson: "Being a hero does not make you an Avenger: Cyclops and the Silver Surfer never joined, Storm did.",
    keyword: "Avengers",
  },
  {
    id: "tech",
    title: "Find the technology users",
    target: "tech",
    rows: 5,
    cols: 6,
    bombs: 5,
    include: ["ironman", "vulture", "panther", "cap", "wolverine"],
    lesson: "Technology crosses sides: heroes and villains both fight with machines, and Captain America’s shield is not one.",
    keyword: "technology",
  },
  {
    id: "magic",
    title: "Find the magic users",
    target: "magic",
    rows: 5,
    cols: 6,
    bombs: 5,
    include: ["strange", "loki", "thor", "ironfist", "surfer"],
    lesson: "Supernatural is not the same as magic: Thor’s godly power, Iron Fist’s chi and the Power Cosmic are not spells.",
    keyword: "magic",
  },
  {
    id: "ai",
    title: "Find the artificial intelligences",
    target: "ai",
    rows: 5,
    cols: 6,
    bombs: 5,
    include: ["ultron", "vision", "ironman", "warmachine", "modok"],
    lesson: "Using a machine is not being one: Iron Man and War Machine wear armour, Ultron and Vision are built minds.",
    keyword: "artificial intelligence",
  },
  {
    id: "aliens",
    title: "Find the aliens",
    target: "alien",
    rows: 5,
    cols: 6,
    bombs: 6,
    include: ["thor", "loki", "foom", "surfer", "magik", "strange", "storm"],
    lesson: "The mixed round: aliens are heroes, villains, Avengers and magic users at once, so no other chip gives them away.",
    keyword: "alien",
  },
];

/** Seeds: run 0 always deals the same boards; Play again deals new ones. */
export const seedFor = (round: Round, run: number) => hash(round.id) + run * 104729;

export const boardFor = (round: Round, run = 0): Board => makeBoard(round, seedFor(round, run));

export const POINTS = { reveal: 10, flag: 25, wrongFlag: 10, bomb: 50, clean: 50 } as const;
export const LIVES = 3;

/** "A", "A and B", "A, B and C". */
export const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

const label = (cat: CatId) => `“${CATEGORIES[cat].label}”`;

/** Why a revealed character was a bomb or safe this round, built from its row. */
export function explain(c: Character, target: CatId) {
  const others = c.cats.filter((cat) => cat !== target).map(label);
  if (isIn(c, target)) {
    const also = others.length ? ` It is also in ${list(others)}, but this round only ${label(target)} counts.` : "";
    return `${c.name} is a bomb: it belongs to the target category ${label(target)}.${also}`;
  }
  const also = others.length ? ` It is in ${list(others)}, which do not count this round.` : "";
  return `${c.name} is safe: it is not in ${label(target)}.${also}`;
}

/** Whole-word, case-blind match of the keyword (a phrase allowed) in a description. */
export function keywordHit(c: Character, keyword: string) {
  const words = keyword.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9-]/g, ""));
  const pattern = new RegExp(`(^|[^a-z0-9-])${words.join("\\s+")}s?($|[^a-z0-9-])`);
  return pattern.test(c.blurb.toLowerCase());
}

/**
 * The debrief's comparison over the characters on a board: who a keyword
 * search over the descriptions finds, who the category labels hold, and the
 * two kinds of disagreement.
 */
export function compare(board: Board, keyword: string) {
  const seen = [...new Map(board.tiles.map((c) => [c.id, c])).values()];
  const labelled = seen.filter((c) => isIn(c, board.target));
  const found = seen.filter((c) => keywordHit(c, keyword));
  return {
    both: labelled.filter((c) => found.includes(c)),
    /** Labelled, but the description never uses the word: vocabulary mismatch. */
    missed: labelled.filter((c) => !found.includes(c)),
    /** The word appears, but the label says no. */
    falseHits: found.filter((c) => !labelled.includes(c)),
  };
}

export type Tally = { revealed: number; flagsRight: number; wrongFlags: number; hits: number; cleared: boolean };

/** A round's points: reveals as they happen, flags only when the round ends, so the score never tells a flag apart. */
export function roundPoints(t: Tally) {
  const end = t.cleared ? t.flagsRight * POINTS.flag - t.wrongFlags * POINTS.wrongFlag + (t.hits ? 0 : POINTS.clean) : 0;
  return t.revealed * POINTS.reveal - t.hits * POINTS.bomb + end;
}

/** The most a board can give: every safe tile outside the opening, every bomb flagged, no hits. */
export function maxPoints(board: Board) {
  const bombs = board.bomb.filter(Boolean).length;
  return (board.bomb.length - bombs - board.opening.length) * POINTS.reveal + bombs * POINTS.flag + POINTS.clean;
}
