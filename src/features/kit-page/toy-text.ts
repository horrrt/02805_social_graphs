// The toy inputs of the kit page's Text demos (demos-text.tsx): made-up
// sentences, a small sentiment lexicon, a labelled training set, a handful of
// toy documents to search and two toy word rates. The models are fitted here
// with text-core.js, once, when the module loads. None of it is a result.
import type { MapPoint } from "@/kit";
import { cosine, countVector, fitLogistic, predictLogistic, tfidf, tfidfVector, tokenize } from "@/kit/text-core.js";

export const pipelineText = "Marvel's heroes weren't fighting in New York. Fans marvel at heroes who fight, too.";

export const ngramText = "the hero saved the city from the storm";

/** NER: tokens and their BIO tags, for two toy sentences. */
export const nerSentences: { key: string; label: string; tokens: string[]; tags: string[] }[] = [
  {
    key: "iron",
    label: "Iron Man (Tony Stark) met Black Widow in New York.",
    tokens: ["Iron", "Man", "(", "Tony", "Stark", ")", "met", "Black", "Widow", "in", "New", "York", "."],
    tags: ["B-PER", "I-PER", "O", "B-PER", "I-PER", "O", "O", "B-PER", "I-PER", "O", "B-GPE", "I-GPE", "O"],
  },
  {
    key: "shield",
    label: "S.H.I.E.L.D. hired Nick Fury in May 1965.",
    tokens: ["S.H.I.E.L.D.", "hired", "Nick", "Fury", "in", "May", "1965", "."],
    tags: ["B-ORG", "O", "B-PER", "I-PER", "O", "B-DATE", "I-DATE", "O"],
  },
];

/** A toy sentiment lexicon: each word's fixed score. */
export const lexicon: Record<string, number> = {
  good: 1,
  great: 2,
  wonderful: 2,
  love: 2,
  fun: 1,
  excellent: 2,
  beautiful: 1.5,
  bad: -1,
  awful: -2,
  terrible: -2,
  boring: -1.5,
  hate: -2,
  dull: -1,
  slow: -0.5,
  disappointing: -1.5,
};

export const sentimentSentences = [
  "The movie was good.",
  "The movie was not good.",
  "Not a bad film, but the ending wasn't great.",
  "I don't hate it, I love it!",
  "Never boring, never dull.",
];

/** The classifier's labelled training texts: 1 positive, 0 negative. */
export const training: [string, 0 | 1][] = [
  ["wonderful album with great songs", 1],
  ["good concert with excellent sound", 1],
  ["i love this beautiful record", 1],
  ["fun energetic performance", 1],
  ["terrible album with boring songs", 0],
  ["bad concert with awful sound", 0],
  ["i hate this dull record", 0],
  ["disappointing slow performance", 0],
];

export const classifierSentences = ["This album has great songs", "A boring concert with good sound", "not a fun record", "i love this slow album"];

const words = (text: string) => tokenize(text, { lowercase: true, dropPunct: true, splitClitics: true }) as string[];

// TF-IDF unigram features and a logistic regression on them, fitted once.
const trainDocs = training.map(([t]) => words(t));
export const classifierModel = tfidf(trainDocs);
export const classifier = fitLogistic(classifierModel.vectors, training.map(([, y]) => y), { seed: 1, epochs: 400 });

/** One sentence through the classifier: its z, p and the nonzero contributions by feature, largest first. */
export function classify(text: string) {
  const x = tfidfVector(words(text), classifierModel);
  const r = predictLogistic(classifier, x);
  const items = classifierModel.vocab
    .map((term, j) => ({ key: term, label: term, value: r.contributions[j] }))
    .filter((it) => it.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { ...r, items, bias: classifier.bias };
}

/** Toy documents to search: a title and one made-up line each. */
export const searchDocs: { key: string; title: string; text: string }[] = [
  { key: "d1", title: "Toy hero A", text: "A mutant hero who can turn into a lizard and lives in the city." },
  { key: "d2", title: "Toy hero B", text: "A mutant made of rock who is a student at the school for mutants." },
  { key: "d3", title: "Toy hero C", text: "The hero of the story is a woman who was bitten by a spider in the lab." },
  { key: "d4", title: "Toy team D", text: "A team of the heroes of the city who fight the villains of the world." },
  { key: "d5", title: "Toy villain E", text: "A villain who is a symbiote from space and bonds with a host." },
  { key: "d6", title: "Toy soldier F", text: "A soldier given a serum in the war who carries a round shield." },
  { key: "d7", title: "Toy hero G", text: "The spider woman of the team, an agent who can fly and is in the war." },
  { key: "d8", title: "Toy mutant H", text: "A mutant teacher who runs the school and reads the minds of the students." },
];
export const searchPresets = ["mutant school", "spider woman", "the hero of the city", "shield"];

const docTokens = searchDocs.map((d) => words(`${d.title} ${d.text}`));
const searchModel = tfidf(docTokens);

/** The two engines' rankings for a query: raw word counts (stopwords and all) and TF-IDF, each by cosine. */
export function search(query: string) {
  const q = words(query);
  const rank = (score: (i: number) => number | null) =>
    searchDocs
      .map((d, i) => ({ key: d.key, title: d.title, snippet: d.text, score: score(i) ?? 0 }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || (a.key < b.key ? -1 : 1));
  const qCounts = countVector(q, searchModel.vocab);
  const qTfidf = tfidfVector(q, searchModel);
  return {
    counts: rank((i) => cosine(qCounts, countVector(docTokens[i], searchModel.vocab))),
    tfidf: rank((i) => cosine(qTfidf, searchModel.vectors[i])),
  };
}

/** Toy uses per 10,000 words of each word in two made-up speech sets, A (y) and B (x). */
const RATES: [string, number, number][] = [
  ["jobs", 17, 24], ["people", 48, 52], ["country", 30, 33], ["american", 35, 31], ["families", 6, 14], ["health", 4, 12],
  ["taxes", 14, 5], ["business", 18, 7], ["freedom", 9, 3], ["energy", 6, 8], ["education", 5, 11], ["women", 3, 10],
  ["unemployment", 5, 0.6], ["constitution", 3, 0.4], ["church", 2.5, 0.5], ["auto", 0.3, 6], ["pell", 0.2, 2], ["coverage", 0.5, 3],
  ["debt", 11, 4], ["spending", 9, 2.5], ["future", 12, 13], ["god", 7, 6], ["military", 6, 4], ["medicare", 4, 9],
  ["economy", 15, 13], ["work", 22, 25], ["dream", 4, 4.5], ["small", 10, 9], ["promise", 5, 8], ["record", 6, 2],
];
export const rates: MapPoint[] = RATES.map(([label, b, a]) => ({ key: label, label, x: b, y: a, size: a + b }));
export const ratesBy = new Map(RATES.map(([label, b, a]) => [label, { a, b }]));
