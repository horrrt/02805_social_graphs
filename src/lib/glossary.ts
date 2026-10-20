// The site's shared wording for formulas and glossary terms, written once so a
// concept reads the same on every page.
//
// EXPLAIN: what a reader sees on hovering a part of a formula (src/lib/Tex.tsx).
// A formula tags the part with \htmlClass{x-<id>}{…} and builds its explain map
// with explainFor([<id>, …]), so the class name and the key here line up. The
// text is page-independent: a page that needs its own number appends it at the
// call site (explainFor(ids, { id: "Here, …" })).
//
// TERMS: the pop-up definition behind a glossary term (src/components/post/Gloss.tsx).
// A term's id is <page>-term-<concept>, w6-term-tf-idf for instance, and its
// definition is TERMS[<concept>].
//
// tests/glossary.test.mjs fails on a tagged part or a term with no entry here.

export const EXPLAIN = {
  // ---- text: TF-IDF, cosine, PMI
  tfidf: "TF-IDF(w, d): how much the word w tells you about document d. It's high when w is frequent in d and rare in the other documents.",
  tf: "TF, the term frequency: the word's share of the document's words.",
  count: "count(w, d): how many times the word w appears in document d.",
  // The Cold Read game writes lowercase tf-idf of a term t (src/features/cold-read/Formulas.tsx).
  "tfidf-t": "tf-idf(t, d): how much the word t tells you about document d. It's high when t is frequent in d and rare in the other documents.",
  "count-t": "count(t, d): how many times the word t appears in document d.",
  "df-t": "df(t): how many documents the word t appears in.",
  len: "|d|: how many words document d has in all, so a long document doesn't win by its size.",
  idf: "IDF, the inverse document frequency: how rare the word is across documents. It's 0 when every document uses it.",
  "idf-value": "The word's IDF. The higher, the rarer the word.",
  ln: "ln: the natural log. It grows slowly, so a very rare word doesn't swamp the rest.",
  "n-docs": "N: how many documents there are.",
  df: "DF(w), the document frequency: how many documents use the word w.",
  cos: "cos(a, b): how alike two vectors point, whatever their length. It's 1 when they point the same way, 0 when they share nothing and −1 when they point opposite ways.",
  dot: "a · b, the dot product: multiply the two vectors entry by entry and add up.",
  "dot-sum": "The dot product written out, one term per word.",
  "a-w": "a_w: vector a's entry for the word w, such as its count or TF-IDF.",
  "b-w": "b_w: vector b's entry for the word w.",
  "norm-a": "‖a‖: the length of vector a. Dividing by the lengths keeps only the direction.",
  "norm-b": "‖b‖: the length of vector b.",
  pmi: "PMI(w, c): how much more often the word w and the context word c meet than chance would put them together.",
  ppmi: "PPMI(w, c), positive PMI: the pair's PMI when that's above 0, and 0 otherwise.",
  "ln-ratio": "ln: the natural log of the ratio. The score is 0 when the pair meets exactly as often as chance predicts, above 0 when it meets more often and below 0 when it meets less often.",
  log2: "log₂: the log base 2. The score is 0 when the pair meets exactly as often as chance predicts and above 0 when it meets more often.",
  "p-joint": "P(w, c): how often w and c sit within the window of each other, as a share of all the pairs counted.",
  "p-word": "P(w): how often the word w is counted at all.",
  "p-context": "P(c): how often the context word c is counted at all. P(w) times P(c) is how often the pair would meet by chance.",
  max: "max: the larger of the two, so a score below 0 becomes 0.",
  zero: "0: every pair that meets less often than chance scores 0.",
  "types-seen": "V: the number of types, distinct words, met so far.",
  "heaps-k": "K: a constant that sets the height of the curve.",
  "tokens-read": "n: the number of tokens, words as they occur, read so far.",
  "beta-heaps": "β: Heaps' exponent. Below 1, the count of distinct words grows more slowly than the text, because more and more words are ones already met.",
  "log-fit": "log: the logarithm. Taking logs turns a power law into a straight line whose slope is the exponent.",

  // ---- drawing at random
  "p-draw": "p: the chance of drawing this item on one draw.",
  seen: "The chance of seeing the item at least once: 1 minus the chance of missing it every time.",
  miss: "(1 − p)^d: the chance of missing the item on all d draws. Each draw misses it with chance 1 − p.",
  draws: "d: the number of draws.",
  "n-items": "The number of items. With equal odds each gets the same share.",
  "in-links": "Incoming links: how many of the other items link to this one.",
  "plus-one": "+ 1: so an item with no incoming links still has a chance.",
  "weight-min": "1: the weight of an item with no incoming links, the + 1 every item gets.",
  "weight-total": "The sum of every item's weight, so the chances add up to 1.",

  // ---- networks
  degree: "Degree: a node's number of links.",
  "log-shift": "+ 1: a log axis has no place for 0, so every count moves up by one.",
  "k-avg": "⟨k⟩: the average degree, the number of links per node.",
  "k2-avg": "⟨k²⟩: the average, over nodes, of each node's degree squared. Hubs weigh heavily in it.",
  "edge-degree": "⟨k²⟩/⟨k⟩: the average degree at the end of a randomly chosen link. A hub sits at the end of many links, so it is picked often.",
  "hub-links": "The most links any one node has.",
  "link-ends": "All link ends, two for each link.",
  gnm: "G(n, m): a random network with n nodes and m links, each link placed between a pair of nodes picked uniformly at random.",
  "n-nodes": "n: the number of nodes.",
  "m-links": "m: the number of links.",
  "p-link": "p: the chance that any one pair of nodes is linked.",
  "deg-share": "P(…): the share of nodes for which the statement in brackets holds.",
  "deg-K": "K: a node's degree, its number of partners.",
  "deg-k": "k: a degree, read along the chart's horizontal axis.",
  distance: "Distance: the length of one step along a link when betweenness looks for shortest paths.",
  inverse: "1 over a number: the bigger the number, the shorter the step.",
  people: "People: the migrants on the corridor, so a heavy corridor is a short step.",
  routes: "Routes: the flight routes between the two countries, so a well-served pair is a short step.",
  "alpha-damping": "α: the damping factor. At each step PageRank follows a link with chance α and jumps to a random node otherwise.",
  "damping-value": "0.85: the standard value, so 15% of the steps land anywhere at random.",
  "alpha-disparity": "α: the disparity filter's threshold. It keeps a link only when chance would give the link's weight with a probability below α, so a smaller α keeps fewer links.",

  // ---- communities
  "z-within": "z: the within-community z-score, how large a node is among the other members of its own community.",
  "s-own": "s_i,c_i: the weight on node i's links to the other members of its own community c_i.",
  "mu-community": "μ_c_i: the average of that weight over the community's members.",
  "sigma-community": "σ_c_i: how much that weight varies across the community's members, the standard deviation.",
  "p-part": "P: the participation coefficient, how evenly a node's links are spread across the communities. 0 when they all stay in one.",
  "sum-communities": "Σ_c: add up over every community c.",
  "share-squared": "The share squared: one large share counts far more than many small ones, so P stays low when one community dominates.",
  "s-ic": "s_ic: the weight on node i's links into community c.",
  "s-i": "s_i: the weight on all of node i's links.",

  // ---- statistics
  z: "z: how many standard deviations of the random baseline the real value sits from the baseline's mean. The sign says on which side.",
  "z-real": "Real: the value on the real network.",
  "null-mean": "Null mean: the average over the shuffled networks.",
  "null-sd": "Null standard deviation: how much the shuffled networks' values typically vary.",
  "p-value": "p: the chance of a result at least this extreme if only chance were at work.",
  "p-empirical": "p: the share of random runs that give a result at least as extreme as the real one, counting the real one as one more. Small means chance alone rarely does it.",
  "tail-plus-one": "1 +: the real network counts as one more draw, so p is never 0.",
  extreme: "Draws at least as extreme: null networks whose value is as far out as the real one, or farther, on the same side.",
  "n-draws": "The number of null networks drawn.",
  "alpha-tail": "α: the fitted power law's exponent. The share of values at least x falls roughly as x to the power 1 − α, so a larger α means a thinner tail.",
  xmin: "x_min: the lower bound of the tail. The power law is fitted only to values at or above it.",
  "p-fit": "p: the share of synthetic datasets drawn from the fitted power law that fit it worse than the real data. Below 0.1 the power law is ruled out.",
  r2: "R²: how much of the variation the model accounts for, from 0 (none) to 1 (all).",
  rho: "ρ: Spearman's rank correlation between two rankings. 1 when they agree exactly, 0 when they are unrelated.",
  "pearson-r": "r: Pearson's correlation. It's 1 when the points lie on a rising straight line and 0 when there is no straight-line relation.",
  "z-neighbours": "z: how many standard deviations a document's score sits from the average score of the documents nearest it in length. The sign says on which side.",
  "ln-length": "ln: the natural log. Each doubling is the same step on it, so short and long documents fit on one straight line.",
  "words-doc": "Words: the document's length in words.",
  exp: "exp: e raised to the value, which undoes the natural log.",
  "residual-log": "Residual: how far a point sits above (positive) or below (negative) the fitted line, in natural-log units.",
} as const satisfies Record<string, string>;

export type ExplainId = keyof typeof EXPLAIN;

/** The explain map for a formula: each id's shared text, with a page's own
 * words appended where it passes them (`more`). */
export function explainFor(ids: readonly ExplainId[], more: Partial<Record<ExplainId, string>> = {}): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, more[id] ? `${EXPLAIN[id]} ${more[id]}` : EXPLAIN[id]]));
}

export const TERMS: Record<string, { word: string; definition: string }> = {
  // ---- text
  "named-entity-recognition": { word: "named entity recognition", definition: "A model that marks the spans of a text that name a person, a place, an organisation or another named thing, and gives each span a type." },
  "entity-resolution": { word: "entity resolution", definition: "Deciding which mentions name the same thing, such as Peter Parker and Spider-Man; a separate step from finding the mentions." },
  "co-mention": { word: "co-mention", definition: "Two names in the same stretch of text, such as one sentence. It records that a text names both, not that the two met." },
  "tf-idf": { word: "TF-IDF", definition: "A word's weight in one document. It's high when the word is frequent in that document and rare in the others." },
  tf: { word: "TF", definition: "Term frequency: how often a word appears in a document, divided by the number of words in that document." },
  df: { word: "DF", definition: "Document frequency: the number of documents a word appears in at least once." },
  idf: { word: "IDF", definition: "Inverse document frequency: a weight that is high for a word few documents use and 0 for a word every document uses." },
  "document-term-matrix": { word: "document-term matrix", definition: "A table with one row per document and one column per word. Each cell says how much that word counts in that document." },
  stopword: { word: "stopword", definition: "A very common word, such as the, and or of, that says little about a text on its own. Analyses often drop them using a fixed list." },
  "cosine-similarity": { word: "cosine similarity", definition: "Cosine similarity: how alike two lists of numbers are by their direction alone, ignoring their size. It's 1 when they point the same way and 0 when they share nothing." },
  scattertext: { word: "Scattertext", definition: "A tool that plots every word used by two groups of documents by how common it is in each group, so the words one group uses more stand out." },
  "z-score": { word: "z-score", definition: "How far a value lies from what chance would give, measured in standard deviations, the typical size of chance's swings. The farther from 0, the less likely chance alone produced it." },
  lda: { word: "LDA", definition: "Latent Dirichlet allocation: a topic model that treats each document as a mix of topics and each topic as a mix of words, and learns both from the text." },
  "topic-model": { word: "topic model", definition: "A method that finds groups of words that tend to appear together across many documents and treats each group as a topic." },
  "distributional-hypothesis": { word: "distributional hypothesis", definition: "The idea that a word's meaning can be read from the words that usually appear around it." },
  "word-context-matrix": { word: "word-context matrix", definition: "A table with one row per word and one column per neighbouring word. Each cell counts how often the two appear close together." },
  "context-window": { word: "window", definition: "The context window: the words counted as a word's neighbours, a fixed number of words on either side of it." },
  pmi: { word: "PMI", definition: "Pointwise mutual information: how much more, or less, often two words appear together than they would if they had nothing to do with each other." },
  ppmi: { word: "PPMI", definition: "Positive PMI: PMI with every negative score set to 0, so only pairs that meet more often than chance keep a score." },
  word2vec: { word: "Word2Vec", definition: "A family of small neural networks that learn a short list of numbers for each word by predicting words from their neighbours." },
  "skip-gram": { word: "skip-gram", definition: "A Word2Vec model that learns each word's numbers by predicting the words around it from the word itself." },
  cbow: { word: "CBOW", definition: "Continuous bag of words: a Word2Vec model that learns each word's numbers by predicting the word from the words around it." },
  "negative-sampling": { word: "negative sampling", definition: "A training shortcut. Instead of scoring every word in the vocabulary, the model learns to tell a real neighbour from a few randomly drawn words." },
  "static-word-embedding": { word: "static", definition: "A static word embedding gives each word one fixed list of numbers, learned from a corpus, whatever sentence the word appears in." },
  glove: { word: "GloVe", definition: "Global Vectors: a method that learns word vectors from how often every pair of words appears near each other across a whole corpus." },
  token: { word: "tokens", definition: "Words as they occur in a text: \"the Hulk smashes the tank\" has 5 tokens." },
  type: { word: "types", definition: "Distinct words: \"the Hulk smashes the tank\" has 4 types, since \"the\" comes twice." },
  "n-gram": { word: "n-grams", definition: "Runs of n words in a row, in the order they appear in the text: an 8-gram is eight words in a row." },
  concordance: { word: "concordances", definition: "Every place a word occurs, each shown with the words around it." },
  "bag-of-words": { word: "Bag of Words", definition: "A document or a query as a list of word counts, with the word order thrown away." },
  "trigram-model": { word: "trigram model", definition: "A table of how often each word follows each pair of words. It predicts the next word from the two before it." },
  "house-style": { word: "house style", definition: "Wording Wikipedia editors repeat on page after page, such as the first sentence of almost every character's article." },
  mattr: { word: "MATTR", definition: "Moving-average type-token ratio: the share of different words in each window of a fixed number of words, averaged over every window." },
  "heaps-law": { word: "Heaps' law", definition: "The rule that the number of distinct words in a text grows as a power of its length below 1, so each new stretch of text brings fewer new words than the last." },

  // ---- networks
  hub: { word: "hub", definition: "A node with far more links than most of the others." },
  "giant-component": { word: "giant component", definition: "The largest component: the biggest group of nodes that can all reach each other through links." },
  scc: { word: "strongly connected components", definition: "Groups in which every node can reach every other by following links only in the direction they point." },
  "force-layout": { word: "force-directed layout", definition: "A drawing method that pulls linked nodes together and pushes every pair apart, then lets the picture settle." },
  "log-log": { word: "log–log axes", definition: "A chart where both axes are logarithmic: each step along an axis multiplies the value by the same factor, so small and huge counts fit on one chart." },
  "power-law": { word: "power law", definition: "A pattern where the share of items with a value of at least k falls off as a fixed power of k, so most items have small values and a few have huge ones. It draws a straight line on log–log axes, but other patterns can look nearly straight too." },
  "degree-preserving-shuffle": { word: "degree-preserving shuffle", definition: "A null model that rewires the links at random while every node keeps its exact number of links." },
  "erdos-renyi": { word: "Erdős–Rényi random graph", definition: "A network in which every link joins a pair of nodes picked uniformly at random. G(n, m) is the version with a fixed number of links." },
  "friendship-paradox": { word: "friendship paradox", definition: "On average your friends have more friends than you do, because people with many friends appear in many friend lists." },
  clustering: { word: "clustering", definition: "How often two neighbours of a node are also linked to each other, closing a triangle." },
  "path-length": { word: "path length", definition: "The number of links on the shortest route between two nodes." },
  "watts-strogatz": { word: "Watts–Strogatz", definition: "A model that starts from a ring where each node links to its nearest neighbours and rewires a few links at random, giving many triangles and short paths." },
  "barabasi-albert": { word: "Barabási–Albert", definition: "A model that grows a network one node at a time, each newcomer linking preferentially to nodes that already have many links, which makes hubs." },
  "degree-tail": { word: "degree tail", definition: "The high end of the spread of link counts: how many nodes have very many links." },
  assortativity: { word: "assortativity", definition: "Whether well-linked nodes tend to link to other well-linked nodes (above 0) or to sparsely linked ones (below 0, called disassortative)." },
  "degree-biased": { word: "degree-biased sampling", definition: "Picking in a way that favours nodes with more links: following a link lands on a hub far more often than picking a node at random does." },
  poisson: { word: "Poisson distribution", definition: "The spread of link counts a fully random network gives: most nodes near the average, few far from it." },
  "local-maxima": { word: "local degree maxima", definition: "Nodes with at least as many links as every one of their neighbours." },
  "path-decomposition": { word: "edge-disjoint greedy path decomposition", definition: "A way to split the links into lines: take a long route, remove its links, and repeat, so each link belongs to one line." },
  "null-model": { word: "null model", definition: "A null model: the network shuffled at random while some of its features stay fixed, to show what chance alone would give." },
  directed: { word: "directed", definition: "Each link points one way, from one node to another." },
  weighted: { word: "weighted", definition: "Each link carries a number, such as how many people it stands for, not just whether it exists." },
  betweenness: { word: "betweenness", definition: "How often a node lies on the shortest paths between other pairs of nodes." },
  pagerank: { word: "PageRank", definition: "A score that a node earns from the nodes linking to it, each passing on a share of its own score, so a link from a high-scoring node counts for more." },
  "damping-factor": { word: "damping factor", definition: "The chance that PageRank follows a link at each step rather than jumping to a random node." },
  "in-out-degree": { word: "in- and out-degree", definition: "A node's number of incoming links (in-degree) and of outgoing links (out-degree)." },
  "in-degree": { word: "in-degree", definition: "The number of nodes that link to a node." },
  isolate: { word: "isolates", definition: "Nodes with no links at all." },
  community: { word: "community", definition: "A group of nodes joined by more and heavier links among themselves than to the rest of the network." },
  "ultra-peripheral": { word: "ultra-peripheral", definition: "A role: not a hub, with nearly all of its links inside its own community." },
  peripheral: { word: "peripheral", definition: "A role: not a hub, with most of its links inside its own community." },
  "provincial-hub": { word: "provincial hub", definition: "A role: a hub, large inside its own community, with most of its links staying inside it." },
  louvain: { word: "Louvain", definition: "A method that finds communities by moving nodes between groups until links inside the groups are as dense as it can make them. It starts at random, so two runs can differ." },
  infomap: { word: "Infomap", definition: "A method that finds groups by following a random walk: a group is an area the walker tends to stay inside for a while." },
  modularity: { word: "modularity", definition: "A score for a split into groups: how many more links fall inside the groups than a random network with the same link counts would put there." },
  nmi: { word: "NMI", definition: "Normalised mutual information: how much two splits into groups agree, from 0 (unrelated) to 1 (identical)." },
  clique: { word: "clique", definition: "A group in which every pair shares a link." },
  diameter: { word: "diameter", definition: "The longest shortest path: the most steps needed to get between any two nodes." },
  "double-edge-swap": { word: "double-edge-swap", definition: "A shuffle step: take links A–B and C–D and rewire them to A–D and C–B, so every node keeps its number of partners." },
  reciprocity: { word: "reciprocity", definition: "The share of one-way links whose reverse also exists." },
  density: { word: "density", definition: "The share of all possible links that actually exist." },
  strength: { word: "strength", definition: "A node's total weight across its links, rather than its number of links." },
  gravity: { word: "gravity model", definition: "A model in which the flow between two places rises with the size of both and falls with the distance between them, as gravity does with mass and distance." },
  residual: { word: "residual", definition: "What is left of an observation once the model's prediction is taken out." },

  // ---- statistics
  spearman: { word: "Spearman", definition: "A correlation computed on ranks: 1 when two orderings agree exactly, 0 when they are unrelated." },
  pearson: { word: "Pearson", definition: "A correlation computed on the values themselves: 1 when the points lie on a rising straight line, 0 when there is no straight-line relation." },
  "p-value": { word: "p-value", definition: "The chance of a result at least this extreme if only the null model's randomness were at work." },
  "one-sided": { word: "one-sided", definition: "Counting only null results as extreme as the real one in the same direction." },
  unadjusted: { word: "unadjusted", definition: "Not corrected for testing several results at once, so one small p among many can still be luck." },
  "standard-deviation": { word: "standard deviation", definition: "How far values typically sit from their average." },
  "random-orders": { word: "random orders", definition: "The same documents read in a shuffled order, many times over. Their spread shows how much a count moves by chance." },
  "label-shuffle": { word: "shuffle", definition: "A baseline that deals the same labels out again at random over the same items, while everything else stays as it was." },
  ols: { word: "ordinary least squares", definition: "Fitting a line by making the sum of the squared vertical distances from the points to the line as small as possible." },
  "confidence-interval": { word: "confidence interval", definition: "A 95% confidence interval: the range that would hold the true value in 95 of 100 repeats of the study." },
  "bootstrap-interval": { word: "bootstrap interval", definition: "A range for a result found by recomputing it on many resamples of the data, drawn at random with repeats; 95% of the resampled results fall inside it." },
  resamples: { word: "resamples", definition: "Copies of the data made by drawing from it at random, with repeats allowed; how a result varies across them shows its uncertainty." },
  "fisher-interval": { word: "Fisher interval", definition: "A confidence interval for a correlation, computed after a change of scale that makes its spread close to a bell curve." },
  "coupon-collector": { word: "coupon-collector", definition: "The coupon collector's problem: how many random draws, repeats allowed, it takes on average to collect every item of a set." },
  "exponential-race": { word: "exponential race", definition: "A way to simulate collecting: each item gets a random waiting time until it first appears, shorter for likelier items, and the set is complete when the last item has appeared." },
  lognormal: { word: "lognormal", definition: "A spread whose logarithm follows the bell curve. Its tail is long, but it bends down on log–log axes where a power law runs straight." },
  exponential: { word: "exponential", definition: "A spread whose share falls by the same factor for each step up, so its tail dies off fast." },
  ccdf: { word: "CCDF", definition: "Complementary cumulative distribution function: for each value, the share of items at or above it." },
  decades: { word: "decades", definition: "Factors of ten: two decades span a hundredfold range, such as 2 to 200." },
  "maximum-likelihood": { word: "maximum likelihood", definition: "Choosing the model's numbers that make the data actually seen as likely as possible." },
  "ks-distance": { word: "Kolmogorov–Smirnov distance", definition: "The largest gap between the share of real values below a point and the share the model predicts, over every point." },
  "goodness-of-fit": { word: "goodness-of-fit test", definition: "A test of whether data could plausibly have come from a model, by comparing it with fake datasets drawn from that model." },
  "likelihood-ratio": { word: "likelihood-ratio test", definition: "A test of which of two models makes the data more likely, and whether the difference is larger than chance." },
  "heavy-tailed": { word: "heavy-tailed", definition: "Having many more very large values than a bell curve would, whatever the exact shape of the tail." },
  "scale-free": { word: "scale-free", definition: "Having a power-law tail, so no typical size sets the scale." },
  ppml: { word: "Poisson pseudo-maximum-likelihood", definition: "A way to fit a model to counts that keeps the zeros and does not take logs, so observations of zero still count." },
  elasticity: { word: "elasticity", definition: "The per cent change in one quantity for a one per cent change in another." },
  "sandwich-interval": { word: "heteroskedasticity-robust sandwich", definition: "An interval that stays honest when the scatter around the model is larger for some observations than for others." },
};

/** The concept behind a glossary term's id: w6-term-tf-idf is tf-idf. */
export const termConcept = (id: string) => id.replace(/^(w\d+a?|sg)-term-/, "");

/** A term a page script places by phrase (TermProse, termify()), with the
 * shared definition of `concept` and a page's own words appended (`more`).
 * The id stays the page's own, so it need not name the concept. */
export function termFor(concept: string, phrase: string, id: string, more?: string) {
  const entry = TERMS[concept];
  if (!entry) throw new Error(`${id}: no entry for "${concept}" in src/lib/glossary.ts`);
  return { phrase, id, definition: more ? `${entry.definition} ${more}` : entry.definition };
}
