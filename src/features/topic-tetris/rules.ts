// Topic Tetris: the rules as pure functions. The data is
// public/play/topic-tetris/data/topic_tetris.json, written by
// analysis/week07_topic_tetris.py: nine Marvel pages and, for each of three
// representations (words, meaning, connections), the group every page falls
// in and the evidence the board shows for it. The pages are the same in every
// round; only the representation, and so the grouping, changes.

export type RoundKey = "words" | "meaning" | "connections";

type WordsGroup = { letter: string; topic: number; words: string[] };
type MeaningGroup = { letter: string; cluster: number; size: number; anchors: string[] };
type ConnectionsGroup = { letter: string; community: number; size: number; hubs: string[] };

export type TetrisPage = {
  id: string;
  name: string;
  about: string;
  /** Its topic (group index), the topic's share of the page, and the listed words it uses most: [word, count, group]. */
  words: { group: number; share: number; chips: [string, number, number][] };
  /** Its cluster, and its nearest anchor pages: [name, cosine, group]. */
  meaning: { group: number; near: [string, number, number][] };
  /** Its community, its links into each shown community, links anywhere else, and the game pages it links to. */
  connections: { group: number; links: number[]; elsewhere: number; partners: string[] };
};

export type TopicTetrisData = {
  source: { pages: number; words: string; meaning: string; connections: string; topics: number; passages: number };
  rounds: [
    { key: "words"; groups: WordsGroup[] },
    { key: "meaning"; clusters: number; groups: MeaningGroup[] },
    { key: "connections"; communities: number; groups: ConnectionsGroup[] },
  ];
  pages: TetrisPage[];
};

export const ROUND_KEYS: RoundKey[] = ["words", "meaning", "connections"];

/** What each round is called, asks, and compares the pages by. */
export const ROUND = {
  words: {
    title: "Words",
    ask: "Group the pages by the words they use.",
    representation: "word counts",
    group: "Topic",
    clue: "Its counts of the group words",
    done: "You grouped the pages by their words.",
    lesson: "LDA finds words that keep turning up together across pages. Every page is a mix of topics; here it joins its highest-weight topic.",
  },
  meaning: {
    title: "Meaning",
    ask: "Same pages. Now group them by what they mean.",
    representation: "text embeddings",
    group: "Topic",
    clue: "Closest of the faces below",
    done: "Now the representation changed.",
    lesson: "An encoder turns each page into a vector. Pages about similar things land close together, even when they use different words.",
  },
  connections: {
    title: "Connections",
    ask: "Same pages again. Now group them by who links to whom.",
    representation: "the link network",
    group: "Community",
    clue: "Links into each group",
    done: "One more change.",
    lesson: "This time the text hardly matters. A community is a set of pages that link to each other more than to the rest.",
  },
} as const satisfies Record<RoundKey, Record<string, string>>;

/** Seconds a block takes to fall: each round a little faster. */
export const FALL_S: Record<RoundKey, number> = { words: 16, meaning: 14, connections: 12 };

export const POINTS = { right: 100, wrong: -25, fast: 25, round: 100 } as const;
/** A right call inside this share of the fall time earns the fast bonus. */
export const FAST_SHARE = 0.4;

export const letter = (data: TopicTetrisData, round: number, group: number) => data.rounds[round].groups[group].letter;

/** The group a page belongs to in a round. */
export const answer = (page: TetrisPage, round: number) => page[ROUND_KEYS[round]].group;

/** Points for one placement: 100 right (+25 when fast), −25 wrong. */
export function placementPoints(right: boolean, elapsedMs: number, round: number) {
  if (!right) return POINTS.wrong;
  return POINTS.right + (elapsedMs <= FAST_SHARE * FALL_S[ROUND_KEYS[round]] * 1000 ? POINTS.fast : 0);
}

const groupName = (data: TopicTetrisData, round: number, group: number) => `${ROUND[ROUND_KEYS[round]].group} ${letter(data, round, group)}`;

/** "Storm (Marvel Comics)" -> "Storm": the bracket only disambiguates the page title. */
export const short = (name: string) => name.replace(/\s*\(.*\)\s*$/, "");

/** An anchor or hub page's name: short, unless that would read as one of the game's own pages. */
export const label = (data: TopicTetrisData, name: string) =>
  data.pages.some((p) => p.name !== name && short(p.name) === short(name)) ? name : short(name);

/** "1 link from Storm", "38 links from Storm". */
export const linksFrom = (n: number, page: TetrisPage) => `${n} link${n === 1 ? "" : "s"} from ${short(page.name)}`;

const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/** The page's evidence, in a sentence that names the group it points to. */
export function evidence(data: TopicTetrisData, page: TetrisPage, round: number): string {
  const key = ROUND_KEYS[round];
  const home = groupName(data, round, answer(page, round));
  if (key === "words") {
    const own = page.words.chips.filter(([, , g]) => g === page.words.group).map(([w, n]) => `${w} ×${n}`);
    return `${short(page.name)} uses ${list(own)}: ${home}'s words.`;
  }
  if (key === "meaning") {
    const own = page.meaning.near.filter(([, , g]) => g === page.meaning.group).map(([n, c]) => `${label(data, n)} (${c.toFixed(2)})`);
    return `In meaning, ${short(page.name)} sits closest to ${list(own)}, in ${home}.`;
  }
  const { links, group } = page.connections;
  return `${short(page.name)} has ${links[group]} links into ${home}, more than into any other group.`;
}

/**
 * What the player reads after a placement. A wrong call says why, in the
 * round's own representation; when the page sat elsewhere in an earlier round,
 * it says that too, since the move is the point of the game.
 */
export function feedback(data: TopicTetrisData, page: TetrisPage, round: number, chosen: number) {
  const right = chosen === answer(page, round);
  const lines = [evidence(data, page, round)];
  if (!right && round > 0) {
    const before = letter(data, round - 1, answer(page, round - 1));
    const now = letter(data, round, answer(page, round));
    if (before !== now) {
      lines.push(`Under ${ROUND[ROUND_KEYS[round - 1]].representation} it was in ${ROUND[ROUND_KEYS[round - 1]].group} ${before}. This round compares ${ROUND[ROUND_KEYS[round]].representation}.`);
    } else lines.push(`This round compares ${ROUND[ROUND_KEYS[round]].representation}.`);
  }
  return { right, title: right ? "Right" : `Not quite: it belongs in ${groupName(data, round, answer(page, round))}`, lines };
}

/** The pages whose letter changes between round r − 1 and round r. */
export const movers = (data: TopicTetrisData, round: number) =>
  round === 0 ? [] : data.pages.filter((p) => letter(data, round - 1, answer(p, round - 1)) !== letter(data, round, answer(p, round)));

/** Each round's tally: right, fast and wrong placements, and the points they make with the round bonus. */
export type Tally = { right: number; fast: number; wrong: number; lost: number };

export const EMPTY_TALLY: Tally = { right: 0, fast: 0, wrong: 0, lost: 0 };

/**
 * The round's points. A wrong call takes off 25, but the score never goes
 * below zero, so `lost` holds what the wrong calls actually took off and the
 * breakdown adds up to the score.
 */
export const tallyPoints = (t: Tally) => t.right * POINTS.right + t.fast * POINTS.fast - t.lost + POINTS.round;

/** The final check: what changed between the rounds. */
export const QUIZ = {
  question: "What changed between the three rounds?",
  options: ["The documents", "The representation used to compare them", "The number of documents", "The algorithm's accuracy"],
  answer: 1,
  explain: "The documents stayed the same. What changed was the information used to decide which pages are similar.",
} as const;
