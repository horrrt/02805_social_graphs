// Same Word, Different Worlds: the six rounds and the rules that score them.
// Each round shows the same word in two sentences and says how its model
// makes a word's vector, as a procedure rather than a brand name: looked up
// in a table (static) or computed from the sentence (contextual). That line
// fixes both answers. No vector here is computed: the dot strips the game
// draws are pictures, and it shows no similarity numbers.
// tests/components/SameWordGame.test.tsx checks every round against these rules.

export type Method = "static" | "contextual";
export type Compare = "same" | "different" | "unknown";

export type Round = {
  id: string;
  /** What the round tests, shown over the sentences. */
  kind: string;
  /** The word type, lowercase; it appears once in each sentence. */
  word: string;
  sentences: [string, string];
  /** How the model makes the word's vector, or null when the round does not say. */
  method: Method | null;
  /** The procedure as the player reads it; for a null method, what is missing. */
  how: string;
  /** Whether the word means the same thing in both sentences, as a careful reader would judge. */
  sense: "same" | "different" | "unclear";
  /** The second question. It names the result the player must match to a kind of model. */
  modelQuestion: string;
  /** The words in each sentence that settle the word's sense, lowercase; absent when the round has no clue step. */
  clues?: [string[], string[]];
  /** Why the answers are right, in plain words. */
  why: string;
};

export const POINTS = { compare: 50, model: 50, clue: 10, wrongClue: 5 } as const;

export const COMPARE: [Compare, string][] = [
  ["same", "Same representation"],
  ["different", "Different representations"],
  ["unknown", "Not enough information"],
];

export const METHOD: [Method, string][] = [
  ["static", "Static embedding (e.g. Word2Vec, GloVe)"],
  ["contextual", "Contextual embedding (e.g. BERT)"],
];

const LOOKUP = "Each word is lowercased and looked up in a table of vectors that was trained once. The same word always fetches the same row.";
const ENCODE = "The model reads the whole sentence and computes a vector for each word from the words around it.";

export const ROUNDS: Round[] = [
  {
    id: "bank",
    kind: "Two meanings",
    word: "bank",
    sentences: ["I deposited my salary at the bank.", "We sat on the bank of the river."],
    method: "contextual",
    how: ENCODE,
    sense: "different",
    modelQuestion: "Which kind of model works this way?",
    clues: [["deposited", "salary"], ["sat", "river"]],
    why: "This model computes each vector from the sentence around the word. “Deposited” and “salary” point to money, “sat” and “river” point to land by water, so the two occurrences of bank get different vectors. That is what a contextual model such as BERT does.",
  },
  {
    id: "apple",
    kind: "A lookup table",
    word: "apple",
    sentences: ["Investors cheered when Apple announced a new phone.", "I ate the apple that was left on the table."],
    method: "static",
    how: LOOKUP,
    sense: "different",
    modelQuestion: "Which kind of model works this way?",
    why: "The company and the fruit are different meanings, but this model never reads the sentence: it lowercases the word and fetches its row. “Investors”, “announced” and “ate” make no difference, so both occurrences get the very same vector. That is a static embedding such as GloVe: one vector per word type.",
  },
  {
    id: "bat",
    kind: "Averaging words",
    word: "bat",
    sentences: ["The bat flew out of the cave at dusk.", "He swung the bat and hit the ball."],
    method: "static",
    how: `${LOOKUP} The sentence's vector is then the average of its words' vectors.`,
    sense: "different",
    modelQuestion: "Which kind of model works this way?",
    clues: [["flew", "cave", "dusk"], ["swung", "hit", "ball"]],
    why: "The two sentence averages differ, because the other words differ. But the question is about bat itself, and bat is still one row of the table: the same vector in both sentences. Averaging a sentence's word vectors is a useful baseline; it cannot give one word two meanings.",
  },
  {
    id: "loan",
    kind: "Same meaning",
    word: "bank",
    sentences: ["The bank approved our loan on Monday.", "I paid the cheque into the bank."],
    method: "contextual",
    how: ENCODE,
    sense: "same",
    modelQuestion: "Which kind of model works this way?",
    why: "Both are the money sense of bank, so you might expect one shared vector. But this model computes each vector from its own sentence, and the sentences differ. The two vectors come out different, and usually close to each other, because the contexts mean similar things. Close is not identical.",
  },
  {
    id: "pitch",
    kind: "A vague context",
    word: "pitch",
    sentences: ["Everyone agreed the pitch was terrible.", "Her pitch impressed the investors, who funded the startup."],
    method: "contextual",
    how: ENCODE,
    sense: "unclear",
    modelQuestion: "Which kind of model works this way?",
    clues: [[], ["impressed", "investors", "funded", "startup"]],
    why: "The model still computes two different vectors, one from each sentence. But the first sentence never settles which pitch it is: a sports field, a musical note or a sales pitch could all be terrible. Context changes the representation; it does not guarantee the right reading. When the words around it are vague, the vector is a guess too.",
  },
  {
    id: "crane",
    kind: "No model given",
    word: "crane",
    sentences: ["A crane lifted the steel beams onto the roof.", "A crane waded through the shallow marsh."],
    method: null,
    how: "This round does not say how the vectors are made.",
    sense: "different",
    modelQuestion: "Which kind of model could give the two cranes different vectors?",
    clues: [["lifted", "steel", "beams", "roof"], ["waded", "shallow", "marsh"]],
    why: "The meanings clearly differ, a machine and a bird, but that alone does not tell you the vectors. A static table gives both the same vector; a contextual model gives them different ones. Without knowing the model, the honest answer is that there is not enough information. Only a contextual model could tell the cranes apart.",
  },
];

/** The answer to “how do the representations compare?”: fixed by the round's procedure. */
export const compareAnswer = (round: Round): Compare => (round.method === "static" ? "same" : round.method === "contextual" ? "different" : "unknown");

/** The answer to the model question: the round's own kind, or, when none is given, the kind that could separate the two. */
export const methodAnswer = (round: Round): Method => round.method ?? "contextual";

/** A sentence split into its words: the text as shown, and its lowercase letters for matching. */
export function tokens(sentence: string) {
  return sentence.split(" ").map((text) => ({ text, word: text.toLowerCase().replace(/[^a-z'-]/g, "") }));
}

/** The position of the round's word in a sentence. */
export const targetIndex = (round: Round, sentence: string) => tokens(sentence).findIndex((t) => t.word === round.word);

/** A clue pick: the sentence (0 or 1) and the word's position in it. */
export type Pick = `${0 | 1}:${number}`;

/** The points for the clue words a player tapped: +10 for each true clue, −5 for each other word, never below 0. */
export function scoreClues(round: Round, picks: Pick[]) {
  if (!round.clues) return { right: 0, wrong: 0, points: 0 };
  let right = 0;
  let wrong = 0;
  for (const p of picks) {
    const [s, i] = p.split(":").map(Number);
    const word = tokens(round.sentences[s])[i]?.word;
    if (word && round.clues[s].includes(word)) right++;
    else wrong++;
  }
  return { right, wrong, points: Math.max(0, right * POINTS.clue - wrong * POINTS.wrongClue) };
}

/** The points for a round: each of the two questions, then the clue step. */
export function scoreRound(round: Round, compare: Compare, method: Method, picks: Pick[] = []) {
  const compareOk = compare === compareAnswer(round);
  const methodOk = method === methodAnswer(round);
  const clues = scoreClues(round, picks);
  return { compareOk, methodOk, clues, points: (compareOk ? POINTS.compare : 0) + (methodOk ? POINTS.model : 0) + clues.points };
}

/** The clue words a round has in all. */
export const clueCount = (round: Round) => (round.clues ? round.clues[0].length + round.clues[1].length : 0);

/** The most a run can score: both questions right and every clue tapped, nothing else. */
export const maxScore = (rounds: Round[]) => rounds.reduce((sum, r) => sum + POINTS.compare + POINTS.model + clueCount(r) * POINTS.clue, 0);
