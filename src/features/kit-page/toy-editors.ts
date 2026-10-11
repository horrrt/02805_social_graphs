// The editors batch's toy data for the kit page: the karate club (from
// toy-networks.ts) with Zachary's own split and its Girvan–Newman tree, a
// small directed matrix, an ego network, a seeded clique hunt, two pipelines,
// a run of text representations and a handful of made-up topics. Nothing
// here is a result of this project.
import type { NetLink, NetNode } from "@/kit";
import { buildTree, girvanNewman } from "@/kit/dendro-core.js";
import { circleLayout, louvain, mulberry32, plantedClique } from "@/kit/graph-core";
import type { Point } from "@/kit/NetCanvas";
import { KARATE, karateLayout, toBox } from "./toy-networks";

/** The club after the split: the 17 members who stayed with the instructor, Mr Hi (networkx's "club" attribute). */
const MR_HI = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 16, 17, 19, 21];
export const ZACHARY_SPLIT = Array.from({ length: 34 }, (_, i) => (MR_HI.includes(i) ? 0 : 1));

/** The club as NetworkView nodes, laid out once (seeded) in a box of the given ratio. */
export function karateNodes(ratio: number): NetNode[] {
  return toBox(karateLayout(), ratio).map(([x, y], i) => ({ id: i, x, y, label: String(i) }));
}

let gn: { merges: { a: number; b: number; h: number }[]; tree: ReturnType<typeof buildTree> } | null = null;
/** Girvan–Newman on the club, once per page. */
export function karateTree() {
  if (!gn) {
    const { merges } = girvanNewman(34, KARATE) as { merges: { a: number; b: number; h: number }[] };
    gn = { merges, tree: buildTree(34, merges) };
  }
  return gn;
}

/** Louvain on the club (seed 7) and a seeded shuffle of two groups, for the partition presets. */
export const karatePresets = () => {
  const rng = mulberry32(11);
  return [
    { key: "real", label: "Zachary's split", partition: ZACHARY_SPLIT },
    { key: "louvain", label: "Louvain", partition: louvain(KARATE, mulberry32(7)).partition as number[] },
    { key: "shuffle", label: "Shuffle members", partition: Array.from({ length: 34 }, () => (rng() < 0.5 ? 0 : 1)) },
    { key: "one", label: "One group", partition: new Array(34).fill(0) },
  ];
};

/** Eight people and who messages whom how often: a small adjacency-matrix example, H on its own. */
export const MATRIX_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const MATRIX_EXAMPLE = [
  [0, 3, 1, 0, 0, 0, 0, 0],
  [1, 0, 0, 4, 0, 0, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 0],
  [0, 0, 0, 0, 0, 2, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

/** A's neighbourhood: B to E attached, B–C and C–D linked, so C = 2 × 2 / (4 × 3). */
export const EGO = { focal: "A", neighbours: ["B", "C", "D", "E", "F", "G"], initial: { attached: [0, 1, 2, 3], links: [[0, 1], [1, 2]] as [number, number][] } };

const LETTERS = "ABCDEFGHIJKLMNOP".split("");
export type CliqueGraph = { nodes: NetNode[]; links: NetLink[]; answer: number[] };
/** Twelve people round a circle, a G(n, p) of p = 0.22 with a k-clique planted on shuffled members: seeded. */
export function cliqueGraph(seed: number, k: number, n = 12): CliqueGraph {
  const rng = mulberry32(seed * 31 + k);
  const { edges, clique } = plantedClique(n, 0.22, k, rng) as { edges: [number, number][]; clique: number[] };
  const ratio = 0.62;
  const at = toBox(circleLayout(n) as Point[], ratio);
  return {
    nodes: at.map(([x, y], i) => ({ id: i, x, y, label: LETTERS[i] ?? String(i) })),
    links: edges.map(([a, b]) => ({ source: a, target: b })),
    answer: clique,
  };
}

/** How one version of the world becomes the next (after Mhasawade, Zhao and Chunara, 2021). */
export const BIAS_FLOW = [
  { title: "The world as it should be", transition: "past injustice and social bias", example: "Everyone we would like the analysis to speak about, every voice present.", exampleTitle: "What we would like to study" },
  { title: "The world as it is", transition: "sampling and measurement", example: "Access, visibility and the chance to speak are unequal before anyone collects a word.", exampleTitle: "What actually happens" },
  { title: "The world according to the data", transition: "the questions asked, the outcomes chosen", example: "Only what a platform, a filter and a sampling choice let through.", exampleTitle: "What the dataset holds" },
  { title: "The world according to the model", example: "The data we kept and the target we set, so every label carries the choices before it.", exampleTitle: "What the model sees" },
];

/** From raw documents to a bag-of-words matrix, with three toy documents. */
export const BOW_DOCS = ["brains predict the future", "models predict the future", "brains build models"];

/** From counting words to large language models: each step's representation, what it buys, what it still misses. */
export const NLP_STAGES = [
  ["counts", "Counts", "a frequency table", "which words occur, and how often", "word order and context"],
  ["bow", "Bag of words", "one count vector per document", "documents compared as vectors", "every word weighs the same"],
  ["tfidf", "TF-IDF", "counts weighted by rarity", "the words that set a document apart", "synonyms look unrelated"],
  ["cooc", "Co-occurrence", "word × context counts, PPMI", "words known by the company they keep", "huge, sparse rows"],
  ["w2v", "Word2Vec", "a dense vector per word", "similar words close together, analogies", "one vector for every sense of a word"],
  ["ctx", "Contextual embeddings", "a vector per word in its sentence", "bank the river and bank the lender differ", "a sentence at a time"],
  ["transformers", "Transformers", "attention over the whole input", "long-range context, trained at scale", "costly, and hard to read"],
  ["llm", "LLMs", "a model that generates text", "one model for many tasks by prompting", "facts it makes up, data we cannot see"],
].map(([key, title, rep, buys, misses]) => ({ key, title, fields: { Representation: rep, "What it buys us": buys, "What is still missing": misses } }));

/** Eight made-up topics on a made-up 2D map: size, top words, three example documents. */
export const TOPICS = [
  { name: "Toy topic 0", words: ["ship", "crew", "space", "captain", "planet"], docs: 41, x: 0.78, y: 0.2 },
  { name: "Toy topic 1", words: ["school", "student", "mutant", "teacher", "power"], docs: 33, x: 0.3, y: 0.18 },
  { name: "Toy topic 2", words: ["armour", "suit", "engineer", "billionaire", "power"], docs: 27, x: 0.52, y: 0.42 },
  { name: "Toy topic 3", words: ["god", "hammer", "realm", "king", "brother"], docs: 22, x: 0.16, y: 0.46 },
  { name: "Toy topic 4", words: ["spider", "student", "city", "web", "aunt"], docs: 20, x: 0.4, y: 0.3 },
  { name: "Toy topic 5", words: ["gang", "city", "detective", "night", "crime"], docs: 16, x: 0.62, y: 0.55 },
  { name: "Toy topic 6", words: ["planet", "empire", "war", "king", "space"], docs: 12, x: 0.88, y: 0.48 },
  { name: "Toy topic 7", words: ["magic", "sorcerer", "realm", "night", "doctor"], docs: 9, x: 0.24, y: 0.58 },
].map((t, i) => ({ ...t, id: i, examples: [1, 2, 3].map((k) => ({ title: `Toy page ${i}.${k}`, text: `A made-up page about ${t.words[k - 1]} and ${t.words[k]}.` })) }));
