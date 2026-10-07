// The Week 6 essentials page's pure helpers: data paths, defaults and the small
// builders its islands share (src/features/week06/Essentials.tsx). The data comes
// from analysis/week06_essentials.py. No DOM, no listeners, no fetch.

/** One data file per section, under public/: pass each to asset() once hydrated. */
export const FILES = {
  weights: "weeks/week06/data/essentials-weights.json",
  cosine: "weeks/week06/data/essentials-cosine.json",
  contrast: "weeks/week06/data/essentials-contrast.json",
  topics: "weeks/week06/data/essentials-topics.json",
  contexts: "weeks/week06/data/essentials-contexts.json",
  pmi: "weeks/week06/data/essentials-pmi.json",
  vectors: "weeks/week06/data/essentials-vectors.json",
  glove: "weeks/week06/data/essentials-glove.json",
};

/** Where each section opens. */
export const START = {
  page: "Storm (Marvel Comics)",
  pair: ["Storm (Marvel Comics)", "Human Torch"],
  k: 8,
  topicPage: "Storm (Marvel Comics)",
  word: "storm",
  window: "5",
  pmiWord: "web",
  vectorWord: "symbiote",
  gloveWord: "vision",
};

/** The brief's Essentials list, in its order, with the section that uses each term. */
export const ESSENTIALS = [
  ["TF-IDF", "weights"], ["Term frequency, TF", "weights"], ["Document frequency, DF", "weights"],
  ["Inverse document frequency, IDF", "weights"], ["Cosine similarity", "cosine"], ["Scattertext", "contrast"],
  ["Topic model", "topics"], ["LDA", "topics"], ["Distributional hypothesis", "contexts"],
  ["Word-context matrix", "contexts"], ["PMI", "pmi"], ["PPMI", "pmi"], ["Static word embedding", "vectors"],
  ["Skip-gram", "vectors"], ["CBOW", "vectors"], ["Negative sampling", "vectors"], ["GloVe", "glove"],
];

export const two = (v) => v.toFixed(2);
export const three = (v) => v.toFixed(3);
export const pct = (v) => `${Math.round(v * 100)}%`;
/** "Storm (Marvel Comics)" -> "Storm": the disambiguation Wikipedia adds to a title. */
export const short = (name) => name.replace(/ \((character|Marvel Comics|comics|Marvel Comics character)\)$/, "");

/** The cosine record for two of the curated pages, in either order. */
export function pair(data, a, b) {
  const i = data.pages.indexOf(a);
  const j = data.pages.indexOf(b);
  if (i < 0 || j < 0 || i === j) return null;
  return data.pairs[`${Math.min(i, j)}-${Math.max(i, j)}`];
}

/** The page's vector length under raw counts and TF-IDF when the page is written out `times` times.
 * Raw counts scale with the page; TF divides by the page's length, so TF-IDF does not move. */
export function lengths(data, name, times) {
  const n = data.norms[data.pages.indexOf(name)];
  return { raw: n.raw * times, tfidf: n.tfidf };
}

/** One LDA fit: k topics from one seed, and seed 1's topics in seed 0's order when `aligned`. */
export function fit(data, k, seed) {
  const f = data.fits[`${k}-${seed}`];
  if (seed === 0) return f;
  const match = data.stability[String(k)].match;
  return { topics: match.map((j) => f.topics[j]), mix: f.mix.map((row) => match.map((j) => row[j])) };
}

/** Top-word overlap of each seed-0 topic with its matched seed-1 topic, 0 to 1. */
export function topicOverlap(data, k) {
  const a = data.fits[`${k}-0`].topics;
  const b = fit(data, k, 1).topics;
  return a.map((t, i) => {
    const set = new Set(b[i].map(([w]) => w));
    return t.filter(([w]) => set.has(w)).length / t.length;
  });
}
