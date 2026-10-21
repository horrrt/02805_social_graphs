// Semantic Search Detective: the six cases and the rules that score them.
// Every number a reader sees as a "similarity" is hand-set for teaching, not
// the output of an embedding model; the map positions are hand-placed too.
// What the game computes is computed here from the text and the positions:
// the keyword ranking (shared words after a stop list), the nearest point on
// the map, and the points a pick earns. tests/components/SearchDetective
// checks that the hand-set scores agree with each case's answer.

export type Doc = {
  key: string;
  title: string;
  text: string;
  /** Illustrative cosine similarity to the query, hand-set: 0 to 1. */
  cos: number;
  /** Hand-placed map position, 0 to 100 across and up. */
  at: [x: number, y: number];
};

export type Round = {
  id: string;
  /** What the round teaches, shown over the query. */
  kind: string;
  query: string;
  queryAt: [x: number, y: number];
  /** The cards in the order they are dealt (never sorted by score). */
  docs: Doc[];
  /** Picks that score full points: the top result, and a near-tie when the query is ambiguous. */
  accept: string[];
  /** Why the top result is relevant. */
  why: string;
  /** What the map shows in this round, one sentence. */
  map: string;
};

export const POINTS = { hit: 100, near: 40, bonus: 25 } as const;

export const ROUNDS: Round[] = [
  {
    id: "weather",
    kind: "Synonyms",
    query: "A hero who controls the weather",
    queryAt: [30, 50],
    docs: [
      { key: "thor", title: "Thor", text: "An Asgardian hero associated with thunder and lightning.", cos: 0.72, at: [38, 58] },
      { key: "storm", title: "Storm", text: "A mutant superhero who can manipulate the weather.", cos: 0.86, at: [18, 38] },
      { key: "torch", title: "Human Torch", text: "A superhero who generates flames.", cos: 0.44, at: [72, 70] },
      { key: "forecast", title: "Weather forecasting", text: "Scientific methods for predicting atmospheric conditions.", cos: 0.51, at: [62, 26] },
    ],
    accept: ["storm"],
    why: "Storm says the same thing in other words: “superhero” for hero, “manipulate” for controls. Thor is close, since thunder and lightning are weather, but his card only names them; Storm’s says outright that she manipulates the weather. The forecasting page shares the word “weather” and nothing else: it predicts, it does not control, and it has no hero.",
    map: "On this map Thor sits nearer the query than Storm, yet Storm has the higher cosine. Squeezing many dimensions into two moved them.",
  },
  {
    id: "fly",
    kind: "Paraphrase",
    query: "A character who can fly",
    queryAt: [40, 40],
    docs: [
      { key: "fishing", title: "Fly fishing", text: "Casting an artificial fly to catch trout.", cos: 0.34, at: [15, 80] },
      { key: "hawkeye", title: "Hawkeye", text: "Clint Barton, an archer who never misses a shot.", cos: 0.55, at: [62, 60] },
      { key: "falcon", title: "Falcon", text: "Sam Wilson soars through the sky on mechanical wings.", cos: 0.81, at: [48, 34] },
      { key: "kitty", title: "Kitty Pryde", text: "A mutant who can walk through solid walls.", cos: 0.5, at: [72, 46] },
    ],
    accept: ["falcon"],
    why: "Falcon never uses the word “fly”, but “soars through the sky on wings” is flying. Fly fishing is the only card with the word, and there it is a hook dressed as an insect. An embedding reads the whole sentence, so the two senses of “fly” land far apart.",
    map: "Here the map and the cosine agree: Falcon is the nearest point and the top result.",
  },
  {
    id: "armour",
    kind: "Related concept",
    query: "A genius who builds his own armour",
    queryAt: [55, 45],
    docs: [
      { key: "plate", title: "Plate armour", text: "Steel suits worn by knights in fifteenth-century Europe.", cos: 0.55, at: [35, 62] },
      { key: "ironman", title: "Iron Man", text: "Tony Stark, an inventor who fights in a powered suit he designed himself.", cos: 0.84, at: [60, 38] },
      { key: "lego", title: "LEGO", text: "Plastic bricks that children click together into toy models.", cos: 0.32, at: [20, 20] },
      { key: "reed", title: "Mister Fantastic", text: "Reed Richards, a brilliant scientist who stretches his body like rubber.", cos: 0.61, at: [76, 24] },
    ],
    accept: ["ironman"],
    why: "Iron Man shares no word with the query, yet an inventor who designed his own suit is a genius who builds his own armour. Plate armour matches the word “armour” but has no genius and no builder. Mister Fantastic is a genius with no armour, so he comes second.",
    map: "The map and the cosine agree here: Iron Man is both the nearest point and the top result.",
  },
  {
    id: "wakanda",
    kind: "Breaking a tie",
    query: "Wakanda’s king",
    queryAt: [45, 55],
    docs: [
      { key: "vibranium", title: "Vibranium", text: "A rare metal mined in Wakanda.", cos: 0.58, at: [68, 40] },
      { key: "arthur", title: "King Arthur", text: "A legendary British ruler who pulled a sword from a stone.", cos: 0.49, at: [18, 30] },
      { key: "shuri", title: "Shuri", text: "T’Challa’s sister, who leads Wakanda’s science labs.", cos: 0.71, at: [62, 64] },
      { key: "panther", title: "Black Panther", text: "T’Challa rules Wakanda, a hidden African nation.", cos: 0.86, at: [50, 48] },
    ],
    accept: ["panther"],
    why: "Every card shares exactly one word with the query, so counting words cannot choose. Black Panther is the one that pairs Wakanda with ruling it. Shuri’s card is about her science labs, not about ruling; King Arthur rules the wrong country.",
    map: "The map and the cosine agree here: Black Panther is both the nearest point and the top result.",
  },
  {
    id: "hulk",
    kind: "No shared words",
    query: "Someone who turns huge when angry",
    queryAt: [50, 50],
    docs: [
      { key: "giant", title: "Giant-Man", text: "Hank Pym grows to enormous height using Pym particles.", cos: 0.64, at: [58, 44] },
      { key: "anger", title: "Anger management", text: "Therapy that helps people who get angry too easily.", cos: 0.55, at: [70, 72] },
      { key: "hulk", title: "Hulk", text: "Bruce Banner becomes a giant green brute whenever rage takes over.", cos: 0.87, at: [36, 64] },
      { key: "whale", title: "Blue whale", text: "The largest animal ever known, up to 30 metres long.", cos: 0.31, at: [86, 28] },
    ],
    accept: ["hulk"],
    why: "Hulk matches every part of the query in other words: “becomes” for turns, “giant” for huge, “rage” for angry. Giant-Man grows but not from anger; anger management has the anger but no growing. Only Hulk has both halves.",
    map: "On this map Giant-Man sits nearer the query than Hulk, yet Hulk has the higher cosine. Two dimensions cannot keep every distance.",
  },
  {
    id: "widow",
    kind: "Ambiguous",
    query: "Black Widow",
    queryAt: [50, 50],
    docs: [
      { key: "natasha", title: "Natasha Romanoff", text: "A Russian-trained spy who joined the Avengers.", cos: 0.69, at: [62, 45] },
      { key: "spiderman", title: "Spider-Man", text: "Peter Parker gained his powers from a spider bite.", cos: 0.47, at: [80, 28] },
      { key: "mourning", title: "Mourning dress", text: "Victorian widows wore black, often for years.", cos: 0.41, at: [24, 78] },
      { key: "spider", title: "Black widow spider", text: "A venomous spider; the female carries a red hourglass mark.", cos: 0.71, at: [40, 56] },
    ],
    accept: ["spider", "natasha"],
    why: "Two words, two meanings: the spider and the Avenger. The two scores are almost equal because the query gives no context to choose between them, so either pick scores full points. Semantic search can rank by similarity; it cannot know which meaning you had in mind.",
    map: "Black widow spider is both the nearest point and the top result, but only just: Natasha Romanoff is a hair behind on both.",
  },
];

// Words too common to count as a match.
const STOP = new Set(
  "a an and are as at be by can for from get he her his in into is it its of on or s that the their they to too up was who when whenever with".split(" "),
);

/** The content words of a text: lowercased letters, split on everything else, minus the stop list. */
export function words(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1 && !STOP.has(w)));
}

/** The query's words that appear, exactly, in a card's title or text. */
export function shared(query: string, doc: Doc): string[] {
  const own = words(`${doc.title} ${doc.text}`);
  return [...words(query)].filter((w) => own.has(w));
}

/** The cards ranked by the hand-set cosine, highest first. */
export const bySimilarity = (round: Round) => [...round.docs].sort((a, b) => b.cos - a.cos);

/** The cards a keyword search would put first: the most shared words (several on a tie). */
export function keywordTop(round: Round): Doc[] {
  const counts = round.docs.map((d) => shared(round.query, d).length);
  const most = Math.max(...counts);
  return round.docs.filter((_, i) => counts[i] === most);
}

/** True when keyword search fails the top result: it ranks another card first, or cannot separate it from one. */
export function keywordMisses(round: Round): boolean {
  const top = keywordTop(round);
  return top.length !== 1 || top[0].key !== bySimilarity(round)[0].key;
}

const distance = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** The cards ranked by straight-line distance to the query on the 2D map, nearest first. */
export const byMapDistance = (round: Round) => [...round.docs].sort((a, b) => distance(a.at, round.queryAt) - distance(b.at, round.queryAt));

/** The points a pick earns: full for an accepted pick (plus the bonus when keyword search misses), part for the runner-up. */
export function scorePick(round: Round, key: string) {
  const ranked = bySimilarity(round);
  if (round.accept.includes(key)) {
    const bonus = keywordMisses(round) && key === ranked[0].key ? POINTS.bonus : 0;
    return { grade: "hit" as const, points: POINTS.hit + bonus, bonus };
  }
  if (ranked[1]?.key === key) return { grade: "near" as const, points: POINTS.near, bonus: 0 };
  return { grade: "miss" as const, points: 0, bonus: 0 };
}

/** The most a run can score: the top result picked in every case. */
export const maxScore = (rounds: Round[]) => rounds.reduce((sum, r) => sum + scorePick(r, bySimilarity(r)[0].key).points, 0);
