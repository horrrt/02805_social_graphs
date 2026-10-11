// The text methods under the kit's text pieces (TaggedTokens, ContributionBars,
// RankedResults, CountMatrix's transforms), with no DOM: a tokenizer, n-grams,
// BIO tags to entity spans, a seeded Markov sampler, a sentiment lexicon with
// a negation rule, TF-IDF and cosine, PPMI, and a small logistic regression.
// Pure functions over plain arrays and objects, so tests/text-core.test.mjs
// runs them in node.
//
//   tokenize("Fans weren't there.", { splitClitics: true, lowercase: true })
//   bioSpans(tokens, tags); scoreLexicon(tokens, LEXICON)
//   const m = tfidf(docs); cosine(m.vectors[0], tfidfVector(query, m))
//   const model = fitLogistic(X, y, { seed: 1 }); predictLogistic(model, x)

/** A small English stopword list: articles, pronouns, auxiliaries, prepositions and the clitics 's 're 'm 've 'll 'd. */
export const STOPWORDS = new Set(
  (
    "a an the and or but if then so than that this these those there here " +
    "i me my we us our you your he him his she her it its they them their " +
    "am is are was were be been being have has had do does did will would shall should can could may might must " +
    "of in on at to for from by with about as into over under up down out off again " +
    "who whom which what when where why how all any both each few more most other some such own same too very just " +
    "'s 're 'm 've 'll 'd"
  ).split(" "),
);

/** Words that flip the sentiment of what follows; any token ending in n't negates too. */
export const NEGATORS = new Set(["not", "no", "never", "n't", "nothing", "nobody", "none", "neither", "nor", "without", "cannot"]);

// A word: letters, with at most one inner apostrophe (straight or curly); or a
// number; or any other single character that is not a space.
const TOKEN = /\p{L}+(?:['’]\p{L}+)?|\p{N}+(?:[.,]\p{N}+)*|[^\s\p{L}\p{N}]/gu;
const CLITIC = /^(.+?)('(?:s|re|m|ve|ll|d))$/i;
const SENTENCE_END = new Set([".", "!", "?"]);

const isPunct = (t) => !/[\p{L}\p{N}]/u.test(t);

/**
 * Every token of `text` with what the filters need: { text, punct, stop, index }.
 * Curly apostrophes become straight ones. With splitClitics, "weren't" is
 * "were" + "n't" and "Marvel's" is "Marvel" + "'s", as spaCy splits them.
 * @param {string} text
 * @param {{ splitClitics?: boolean, stopwords?: Set<string> }} [opts]
 * @returns {{ text: string, punct: boolean, stop: boolean, index: number }[]}
 */
export function tokenDetails(text, opts = {}) {
  const stops = opts.stopwords ?? STOPWORDS;
  const out = [];
  for (const [raw] of String(text ?? "").matchAll(TOKEN)) {
    const word = raw.replace(/’/g, "'");
    let parts = [word];
    if (opts.splitClitics && /'/.test(word)) {
      const nt = /^(.+)(n't)$/i.exec(word);
      const cl = nt ?? CLITIC.exec(word);
      if (cl) parts = [cl[1], cl[2]];
    }
    for (const p of parts) out.push({ text: p, punct: isPunct(p), stop: stops.has(p.toLowerCase()), index: out.length });
  }
  return out;
}

/**
 * The tokens of `text` after the reader's choices: lowercase, splitClitics,
 * dropPunct, dropStopwords (checked case-insensitively either way).
 * @param {string} text
 * @param {{ lowercase?: boolean, splitClitics?: boolean, dropPunct?: boolean, dropStopwords?: boolean, stopwords?: Set<string> }} [opts]
 * @returns {string[]}
 */
export function tokenize(text, opts = {}) {
  return tokenDetails(text, opts)
    .filter((t) => !(opts.dropPunct && t.punct) && !(opts.dropStopwords && t.stop))
    .map((t) => (opts.lowercase ? t.text.toLowerCase() : t.text));
}

/**
 * Every run of `n` consecutive tokens, in order; n is clamped to 1..3, and a
 * text shorter than n has none.
 * @param {string[]} tokens
 * @param {number} n
 * @returns {string[][]}
 */
export function ngrams(tokens, n) {
  const k = Math.max(1, Math.min(3, Math.round(Number(n) || 1)));
  const out = [];
  for (let i = 0; i + k <= tokens.length; i++) out.push(tokens.slice(i, i + k));
  return out;
}

/**
 * BIO tags to entity spans: { type, start, end, text } with `end` one past the
 * last token. B-X opens a span; I-X continues a span of type X and otherwise
 * opens one (an orphan I- is read as B-, as conlleval reads it); O, a missing
 * tag or anything else closes it.
 * @param {string[]} tokens
 * @param {(string | undefined)[]} tags
 * @returns {{ type: string, start: number, end: number, text: string }[]}
 */
export function bioSpans(tokens, tags) {
  const spans = [];
  let open = null;
  const close = () => {
    if (open) spans.push({ ...open, text: tokens.slice(open.start, open.end).join(" ") });
    open = null;
  };
  tokens.forEach((_, i) => {
    const m = /^([BI])-(.+)$/.exec(String(tags[i] ?? "O"));
    if (!m) return close();
    const [, bi, type] = m;
    if (bi === "I" && open && open.type === type) open.end = i + 1;
    else {
      close();
      open = { type, start: i, end: i + 1 };
    }
  });
  close();
  return spans;
}

/**
 * A seeded random number generator (mulberry32): the same seed gives the same
 * numbers in [0, 1) on every machine.
 * @param {number} seed
 * @returns {() => number}
 */
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The next-token distribution after `context` at `temperature`, highest first
 * (ties by token): each probability raised to 1/T and renormalised, so T < 1
 * sharpens and T > 1 flattens. At T ≤ 0 the most likely token gets 1. Missing,
 * zero or negative probabilities are dropped; an unknown context gives [].
 * @param {Record<string, Record<string, number>>} table
 * @param {string} context
 * @param {number} [temperature]
 * @returns {[string, number][]}
 */
export function nextDistribution(table, context, temperature = 1) {
  const row = Object.entries(table?.[context] ?? {}).filter(([, p]) => Number.isFinite(p) && p > 0);
  if (row.length === 0) return [];
  row.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  if (!(temperature > 0)) return row.map(([t], i) => [t, i === 0 ? 1 : 0]);
  const top = row[0][1];
  // Raised relative to the top probability, so a small T cannot underflow to all zeros.
  const w = row.map(([t, p]) => [t, Math.pow(p / top, 1 / temperature)]);
  const sum = w.reduce((s, [, v]) => s + v, 0);
  return w.map(([t, v]) => [t, v / sum]);
}

/**
 * One draw from nextDistribution with `rng` (a makeRng); null when the context is unknown.
 * @param {Record<string, Record<string, number>>} table
 * @param {string} context
 * @param {{ temperature?: number, rng: () => number }} opts
 * @returns {string | null}
 */
export function sampleNext(table, context, { temperature = 1, rng }) {
  const dist = nextDistribution(table, context, temperature);
  if (dist.length === 0) return null;
  let r = rng();
  for (const [t, p] of dist) {
    r -= p;
    if (r < 0) return t;
  }
  return dist[dist.length - 1][0];
}

/**
 * Up to `steps` tokens after `start`, each drawn from the table under the last
 * `order` tokens joined by a space. Stops early at a context the table lacks.
 * Returns the start tokens followed by the drawn ones.
 * @param {Record<string, Record<string, number>>} table
 * @param {string[]} start
 * @param {{ steps?: number, temperature?: number, seed?: number, order?: number }} [opts]
 * @returns {string[]}
 */
export function generate(table, start, { steps = 10, temperature = 1, seed = 1, order = 1 } = {}) {
  const rng = makeRng(seed);
  const out = [...start];
  for (let i = 0; i < steps; i++) {
    const next = sampleNext(table, out.slice(-order).join(" "), { temperature, rng });
    if (next === null) break;
    out.push(next);
  }
  return out;
}

const negates = (t, negators) => negators.has(t) || /n't$/.test(t);

/**
 * A lexicon score: the sum of each matched token's value. With negation on, a
 * negator flips the matched words among the next `window` tokens (3 by
 * default); two negators reaching the same word cancel out, and . ! ? closes
 * a negator's reach. Tokens are looked up lowercased. Each hit is
 * { index, token, base, value, flipped }.
 * @param {string[]} tokens
 * @param {Record<string, number>} lexicon
 * @param {{ negation?: boolean, window?: number, negators?: Set<string> }} [opts]
 * @returns {{ total: number, hits: { index: number, token: string, base: number, value: number, flipped: boolean }[] }}
 */
export function scoreLexicon(tokens, lexicon, { negation = true, window = 3, negators = NEGATORS } = {}) {
  const low = tokens.map((t) => String(t).toLowerCase());
  const hits = [];
  low.forEach((t, i) => {
    const base = Object.hasOwn(lexicon, t) ? Number(lexicon[t]) : NaN;
    if (!Number.isFinite(base)) return;
    let flips = 0;
    if (negation)
      for (let j = i - 1; j >= Math.max(0, i - window); j--) {
        if (SENTENCE_END.has(low[j])) break;
        if (negates(low[j], negators)) flips++;
      }
    const flipped = flips % 2 === 1;
    hits.push({ index: i, token: tokens[i], base, value: flipped ? -base : base, flipped });
  });
  return { total: hits.reduce((s, h) => s + h.value, 0), hits };
}

/**
 * How often each token occurs.
 * @param {string[]} tokens
 * @returns {Map<string, number>}
 */
export function countsOf(tokens) {
  const m = new Map();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/**
 * TF-IDF over documents (each an array of tokens): tf = count / length, the
 * term's count over the document's token count, and idf = ln(N / df), N the
 * documents and df those holding the term. A term in every document gets idf 0. Returns the sorted vocabulary, its idf and one dense
 * vector per document.
 * @param {string[][]} docs
 * @returns {{ vocab: string[], idf: number[], vectors: number[][] }}
 */
export function tfidf(docs) {
  const N = docs.length;
  const df = new Map();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const vocab = [...df.keys()].sort();
  const idf = vocab.map((t) => Math.log(N / df.get(t)));
  const model = { vocab, idf, vectors: [] };
  model.vectors = docs.map((d) => tfidfVector(d, model));
  return model;
}

/**
 * One document's (or query's) TF-IDF vector in a fitted model's vocabulary;
 * tokens outside it count towards the length but get no weight.
 * @param {string[]} tokens
 * @param {{ vocab: string[], idf: number[] }} model
 * @returns {number[]}
 */
export function tfidfVector(tokens, model) {
  const counts = countsOf(tokens);
  const len = tokens.length;
  return model.vocab.map((t, j) => (len > 0 ? ((counts.get(t) ?? 0) / len) * model.idf[j] : 0));
}

/**
 * Raw counts in a vocabulary, for comparing against TF-IDF.
 * @param {string[]} tokens
 * @param {string[]} vocab
 * @returns {number[]}
 */
export function countVector(tokens, vocab) {
  const counts = countsOf(tokens);
  return vocab.map((t) => counts.get(t) ?? 0);
}

/**
 * The cosine of two vectors of one length; null when either has no length.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number | null}
 */
export function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return null;
  return Math.max(-1, Math.min(1, dot / Math.sqrt(na * nb)));
}

const finite = (v) => (Number.isFinite(v) ? v : 0);

/**
 * PPMI of a count matrix (rows are target words, columns contexts):
 * PPMI = max(0, log2(P(w, c) / (P(w) P(c)))), with P(w, c) the cell over the
 * total and P(w), P(c) its row and column sums over the total; 0 wherever the
 * count is 0.
 * @param {number[][]} cells
 * @returns {number[][]}
 */
export function ppmi(cells) {
  const total = cells.flat().reduce((s, v) => s + Math.max(0, finite(v)), 0);
  if (total === 0) return cells.map((r) => r.map(() => 0));
  const rowSum = cells.map((r) => r.reduce((s, v) => s + Math.max(0, finite(v)), 0));
  const width = Math.max(0, ...cells.map((r) => r.length));
  const colSum = Array.from({ length: width }, (_, j) => cells.reduce((s, r) => s + Math.max(0, finite(r[j])), 0));
  return cells.map((r, i) =>
    r.map((v, j) => {
      const n = Math.max(0, finite(v));
      if (n === 0) return 0;
      return Math.max(0, Math.log2((n / total) / ((rowSum[i] / total) * (colSum[j] / total))));
    }),
  );
}

/**
 * Term frequency of a count matrix read as documents (rows) by terms
 * (columns): each count over its row's total; 0 in an empty row.
 * @param {number[][]} cells
 * @returns {number[][]}
 */
export function tfMatrix(cells) {
  return cells.map((r) => {
    const len = r.reduce((s, v) => s + Math.max(0, finite(v)), 0);
    return r.map((v) => (len > 0 ? Math.max(0, finite(v)) / len : 0));
  });
}

/**
 * TF-IDF of a count matrix read as documents (rows) by terms (columns):
 * tf = count / row total (tfMatrix) times idf = ln(N / df), N the rows and df
 * the rows where the term occurs; 0 for a term in no row.
 * @param {number[][]} cells
 * @returns {number[][]}
 */
export function tfidfMatrix(cells) {
  const N = cells.length;
  const width = Math.max(0, ...cells.map((r) => r.length));
  const idf = Array.from({ length: width }, (_, j) => {
    const df = cells.filter((r) => finite(r[j]) > 0).length;
    return df > 0 ? Math.log(N / df) : 0;
  });
  return tfMatrix(cells).map((r) => r.map((v, j) => v * idf[j]));
}

/**
 * A count matrix under one of CountMatrix's transforms: "count" (as given),
 * "ppmi", "tf" or "tfidf".
 * @param {number[][]} cells
 * @param {"count" | "ppmi" | "tf" | "tfidf"} transform
 * @returns {number[][]}
 */
export function transformMatrix(cells, transform) {
  if (transform === "ppmi") return ppmi(cells);
  if (transform === "tf") return tfMatrix(cells);
  if (transform === "tfidf") return tfidfMatrix(cells);
  return cells.map((r) => r.map(finite));
}

/**
 * The row most like row `i` by cosine, itself and rows with no length left
 * out, ties to the lower index: { index, cosine }, or null when none compares.
 * @param {number[][]} matrix
 * @param {number} i
 * @returns {{ index: number, cosine: number } | null}
 */
export function nearestRow(matrix, i) {
  let best = null;
  matrix.forEach((r, k) => {
    if (k === i || !matrix[i]) return;
    const c = cosine(matrix[i], r);
    if (c !== null && (best === null || c > best.cosine)) best = { index: k, cosine: c };
  });
  return best;
}

/**
 * The logistic function, with z clamped to ±30 so exp never overflows.
 * @param {number} z
 * @returns {number}
 */
export function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
}

/**
 * Fits an L2-penalised logistic regression by batch gradient descent:
 * p_i = sigmoid(w·x_i + b), and each epoch steps
 * w ← w − lr · (Σ (p_i − y_i) x_i / N + l2 · w) and b ← b − lr · Σ (p_i − y_i) / N,
 * so the bias carries no penalty. Weights start at small seeded values.
 * X is one feature row per example, y its 0 or 1 label.
 * @param {number[][]} X
 * @param {number[]} y
 * @param {{ epochs?: number, lr?: number, l2?: number, seed?: number }} [opts]
 * @returns {{ weights: number[], bias: number }}
 */
export function fitLogistic(X, y, { epochs = 400, lr = 0.65, l2 = 0.015, seed = 1 } = {}) {
  const N = X.length;
  const D = Math.max(0, ...X.map((r) => r.length));
  const rng = makeRng(seed);
  const w = Array.from({ length: D }, () => (rng() - 0.5) * 0.02);
  let b = 0;
  if (N === 0) return { weights: w, bias: b };
  for (let e = 0; e < epochs; e++) {
    const gw = new Array(D).fill(0);
    let gb = 0;
    for (let i = 0; i < N; i++) {
      const err = sigmoid(dot(w, X[i]) + b) - y[i];
      for (let j = 0; j < D; j++) gw[j] += err * (X[i][j] ?? 0);
      gb += err;
    }
    for (let j = 0; j < D; j++) w[j] -= lr * (gw[j] / N + l2 * w[j]);
    b -= (lr * gb) / N;
  }
  return { weights: w, bias: b };
}

function dot(w, x) {
  let s = 0;
  for (let j = 0; j < w.length; j++) s += w[j] * (x[j] ?? 0);
  return s;
}

/**
 * A fitted model on one example: z = Σ w·x + bias, p = sigmoid(z), and each
 * feature's contribution w_j x_j, so contributions plus the bias add up to z.
 * @param {{ weights: number[], bias: number }} model
 * @param {number[]} x
 * @returns {{ z: number, p: number, contributions: number[] }}
 */
export function predictLogistic(model, x) {
  const contributions = model.weights.map((w, j) => w * (x[j] ?? 0));
  const z = contributions.reduce((s, c) => s + c, model.bias);
  return { z, p: sigmoid(z), contributions };
}
