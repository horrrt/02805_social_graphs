// Pins the text methods under the kit's text pieces (src/kit/text-core.js):
// the tokenizer and its filters, n-grams, BIO spans, the seeded Markov
// sampler, the lexicon's negation rule, TF-IDF, cosine, PPMI and the logistic
// regression's contributions. Pure functions, so this runs in node with no DOM.
import test from "node:test";
import assert from "node:assert/strict";
import {
  bioSpans, cosine, countVector, fitLogistic, generate, makeRng, nearestRow, nextDistribution, ngrams, ppmi, predictLogistic,
  sampleNext, scoreLexicon, sigmoid, tfidf, tfidfMatrix, tfidfVector, tfMatrix, tokenDetails, tokenize, transformMatrix,
} from "../src/kit/text-core.js";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("tokenize keeps one inner apostrophe in a word and splits punctuation off", () => {
  assert.deepEqual(tokenize("Marvel's heroes weren't there."), ["Marvel's", "heroes", "weren't", "there", "."]);
  assert.deepEqual(tokenize("rock'n'roll"), ["rock'n", "'", "roll"], "a second apostrophe ends the word");
  assert.deepEqual(tokenize("'tis"), ["'", "tis"]);
  assert.deepEqual(tokenize("dogs'"), ["dogs", "'"]);
  assert.deepEqual(tokenize("It’s"), ["It's"], "a curly apostrophe reads as a straight one");
  assert.deepEqual(tokenize("3.5 stars, 10"), ["3.5", "stars", ",", "10"]);
  assert.deepEqual(tokenize(""), []);
  assert.deepEqual(tokenize(null), []);
});

test("splitClitics splits n't and 's 're 'm 've 'll 'd as spaCy does", () => {
  const opts = { splitClitics: true };
  assert.deepEqual(tokenize("Marvel's heroes weren't", opts), ["Marvel", "'s", "heroes", "were", "n't"]);
  assert.deepEqual(tokenize("I'm sure they're here, we'll see, can't", opts), ["I", "'m", "sure", "they", "'re", "here", ",", "we", "'ll", "see", ",", "ca", "n't"]);
  assert.deepEqual(tokenize("rock'n", opts), ["rock'n"], "an apostrophe that is not a clitic stays");
});

test("the filters drop punctuation and stopwords, and stopwords match in any case", () => {
  const text = "The heroes were NOT in New York!";
  assert.deepEqual(tokenize(text, { dropPunct: true }), ["The", "heroes", "were", "NOT", "in", "New", "York"]);
  assert.deepEqual(tokenize(text, { dropStopwords: true }), ["heroes", "NOT", "New", "York", "!"], "The and were go uncased; not is no stopword");
  assert.deepEqual(tokenize(text, { lowercase: true, dropPunct: true, dropStopwords: true }), ["heroes", "not", "new", "york"]);
  const d = tokenDetails("The end.");
  assert.deepEqual(d.map((t) => [t.text, t.stop, t.punct, t.index]), [["The", true, false, 0], ["end", false, false, 1], [".", false, true, 2]]);
});

test("ngrams slides a window of 1 to 3 tokens", () => {
  const t = ["a", "b", "c", "d"];
  assert.deepEqual(ngrams(t, 2), [["a", "b"], ["b", "c"], ["c", "d"]]);
  assert.equal(ngrams(t, 3).length, 2);
  assert.equal(ngrams(t, 9).length, 2, "n is clamped to 3");
  assert.equal(ngrams(t, 0).length, 4, "n is clamped to 1");
  assert.deepEqual(ngrams(["a"], 2), []);
});

test("bioSpans joins B- and I- tags into spans and reads an orphan I- as a start", () => {
  const tokens = ["Iron", "Man", "met", "Black", "Widow", "in", "New", "York", "."];
  const tags = ["B-PER", "I-PER", "O", "B-PER", "I-PER", "O", "B-GPE", "I-GPE", "O"];
  assert.deepEqual(bioSpans(tokens, tags), [
    { type: "PER", start: 0, end: 2, text: "Iron Man" },
    { type: "PER", start: 3, end: 5, text: "Black Widow" },
    { type: "GPE", start: 6, end: 8, text: "New York" },
  ]);
  assert.deepEqual(bioSpans(["a", "b"], ["I-ORG", "I-ORG"]), [{ type: "ORG", start: 0, end: 2, text: "a b" }], "orphan I- opens a span");
  assert.deepEqual(
    bioSpans(["a", "b"], ["B-PER", "I-ORG"]).map((s) => [s.type, s.start, s.end]),
    [["PER", 0, 1], ["ORG", 1, 2]],
    "an I- of another type starts its own span",
  );
  assert.deepEqual(bioSpans(["a", "b"], ["B-X", "B-X"]).length, 2, "B- after B- starts a new span");
  assert.deepEqual(bioSpans(["a", "b"], ["B-X"]), [{ type: "X", start: 0, end: 1, text: "a" }], "a missing tag is O");
});

test("the Markov sampler is seeded, renormalises and turns greedy at temperature 0", () => {
  const table = { the: { cat: 2, dog: 1, eel: 0 }, cat: { sat: 1 }, dog: { ran: 1 } };
  const dist = nextDistribution(table, "the");
  assert.deepEqual(dist.map(([t]) => t), ["cat", "dog"], "a probability of 0 is dropped");
  close(dist[0][1], 2 / 3);
  close(dist[1][1], 1 / 3);
  assert.deepEqual(nextDistribution(table, "the", 0), [["cat", 1], ["dog", 0]]);
  const hot = nextDistribution(table, "the", 4);
  assert.ok(hot[0][1] < 2 / 3 && hot[0][1] > 0.5, "a high temperature flattens");
  const cold = nextDistribution(table, "the", 0.25);
  assert.ok(cold[0][1] > 0.9, "a low temperature sharpens");
  assert.deepEqual(nextDistribution(table, "zebra"), []);
  assert.equal(sampleNext(table, "zebra", { rng: makeRng(1) }), null);

  const a = generate(table, ["the"], { steps: 5, seed: 7 });
  assert.deepEqual(generate(table, ["the"], { steps: 5, seed: 7 }), a, "the same seed gives the same text");
  assert.equal(a.length, 3, "stops when the context has no row");
  assert.deepEqual(generate(table, ["the"], { steps: 5, temperature: 0 }), ["the", "cat", "sat"]);
  const r = makeRng(42);
  const first = [r(), r(), r()];
  const r2 = makeRng(42);
  assert.deepEqual([r2(), r2(), r2()], first);
  assert.ok(first.every((v) => v >= 0 && v < 1));
});

test("the lexicon flips a word within three tokens of a negator, and two negators cancel", () => {
  const lex = { good: 2, bad: -2, great: 3 };
  assert.equal(scoreLexicon(["a", "good", "film"], lex).total, 2);
  const neg = scoreLexicon(["not", "a", "very", "good", "film"], lex);
  assert.equal(neg.total, -2);
  assert.deepEqual(neg.hits, [{ index: 3, token: "good", base: 2, value: -2, flipped: true }]);
  assert.equal(scoreLexicon(["not", "a", "very", "very", "good"], lex).total, 2, "four tokens away is out of reach");
  assert.equal(scoreLexicon(["isn't", "good"], lex).total, -2, "a word ending in n't negates without the clitic split");
  assert.equal(scoreLexicon(["is", "n't", "good"], lex).total, -2, "so does the split n't");
  assert.equal(scoreLexicon(["not", "not", "good"], lex).total, 2, "double negation cancels");
  assert.equal(scoreLexicon(["not", ".", "good"], lex).total, 2, "a full stop ends the reach");
  assert.equal(scoreLexicon(["not", "good"], lex, { negation: false }).total, 2);
  assert.equal(scoreLexicon(["Not", "GOOD"], lex).total, -2, "lookups are case-insensitive");
  assert.equal(scoreLexicon(["constructor"], lex).total, 0, "only the lexicon's own keys count");
  assert.deepEqual(scoreLexicon([], lex), { total: 0, hits: [] });
});

test("TF-IDF uses count over length and ln(N/df); a term in every document weighs 0", () => {
  const docs = [["cat", "sat", "cat"], ["dog", "sat"], []];
  const m = tfidf(docs);
  assert.deepEqual(m.vocab, ["cat", "dog", "sat"]);
  close(m.idf[0], Math.log(3));
  close(m.idf[2], Math.log(3 / 2));
  close(m.vectors[0][0], (2 / 3) * Math.log(3));
  assert.deepEqual(m.vectors[2], [0, 0, 0], "an empty document is all zeros");
  const all = tfidf([["a", "b"], ["a"]]);
  assert.equal(all.idf[all.vocab.indexOf("a")], 0);
  assert.deepEqual(tfidf([]), { vocab: [], idf: [], vectors: [] });
  const q = tfidfVector(["cat", "unknown"], m);
  close(q[0], 0.5 * Math.log(3), 1e-12);
  assert.deepEqual(countVector(["sat", "sat", "x"], m.vocab), [0, 0, 2]);
});

test("cosine is null for a zero vector and 1 for parallel ones", () => {
  close(cosine([1, 2], [2, 4]), 1);
  close(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0], [1, 1]), null);
  assert.equal(cosine([], []), null);
});

test("matrix transforms: PPMI, TF and TF-IDF give 0 where the count is 0 and never NaN", () => {
  const cells = [[2, 0, 1], [0, 0, 0], [1, 3, 0]];
  for (const t of ["count", "ppmi", "tf", "tfidf"]) {
    const out = transformMatrix(cells, t);
    assert.ok(out.flat().every(Number.isFinite), `${t} is finite`);
    assert.deepEqual(out[1], [0, 0, 0], `${t} keeps the zero row at 0`);
  }
  const p = ppmi(cells);
  // P(w0,c0) = 2/7, P(w0) = 3/7, P(c0) = 3/7.
  close(p[0][0], Math.max(0, Math.log2((2 / 7) / ((3 / 7) * (3 / 7)))));
  assert.ok(p.flat().every((v) => v >= 0), "negative PMI is clipped");
  assert.deepEqual(ppmi([[0, 0]]), [[0, 0]]);
  close(tfMatrix(cells)[0][0], 2 / 3);
  close(tfidfMatrix(cells)[2][1], (3 / 4) * Math.log(3), 1e-12);
  assert.deepEqual(tfidfMatrix([]), []);
});

test("nearestRow skips itself and zero rows, and breaks ties to the lower index", () => {
  const m = [[1, 0], [0, 0], [1, 0.1], [1, 0.1]];
  assert.equal(nearestRow(m, 0).index, 2);
  assert.equal(nearestRow(m, 1), null, "a zero row has no neighbour");
  assert.equal(nearestRow([[1, 1]], 0), null);
});

test("the logistic regression is seeded, separates a toy set, and its contributions add up to z", () => {
  const X = [[1, 0], [0.8, 0], [0, 1], [0, 0.9]];
  const y = [1, 1, 0, 0];
  const m = fitLogistic(X, y, { seed: 3 });
  assert.deepEqual(fitLogistic(X, y, { seed: 3 }), m, "same seed, same model");
  assert.ok(m.weights[0] > 0 && m.weights[1] < 0);
  const r = predictLogistic(m, [1, 0.5]);
  close(r.contributions.reduce((s, c) => s + c, m.bias), r.z, 1e-12);
  close(r.p, sigmoid(r.z));
  assert.ok(predictLogistic(m, X[0]).p > 0.5 && predictLogistic(m, X[2]).p < 0.5);
  const norm = (w) => Math.hypot(...w);
  assert.ok(norm(fitLogistic(X, y, { l2: 0.5 }).weights) < norm(fitLogistic(X, y, { l2: 0 }).weights), "a larger L2 shrinks the weights");
  assert.equal(sigmoid(1e6), 1 / (1 + Math.exp(-30)), "z is clamped before exp");
  assert.deepEqual(fitLogistic([], []).bias, 0);
});
