// Week 6's pure builders: the charts, tables and explorer rows the islands in
// src/features/week06/ draw, all from public/weeks/week06/data/lookalikes.json
// (analysis/week06_lookalikes.py). No DOM, no listeners, no fetch.

/** The page's one data file under public/: pass it to asset() once hydrated. */
export const DATA = "weeks/week06/data/lookalikes.json";

/** The character the explorer opens on, and the ones its buttons jump to. */
export const START = "Storm (Marvel Comics)";
export const PICKS = ["Storm (Marvel Comics)", "Emma Frost", "Wolverine (character)", "Backhand (character)"];

export const pct = (v) => `${Math.round(v * 100)}%`;
export const two = (v) => v.toFixed(2);
/** "Storm (Marvel Comics)" -> "Storm": the disambiguation Wikipedia adds to a title. */
export const short = (name) => name.replace(/ \((character|Marvel Comics|comics|Marvel Comics character)\)$/, "");

// Section 2: linked neighbours in ten, one row per representation, the course's
// four first, then ours. The names row carries the null: as many other words
// removed, matched on how many pages use them.
export function ladder({ facts: f }) {
  const c = f.course;
  const nullLabel = `as many other words removed: ${two(f.null.mean)} ± ${two(f.null.sd)}`;
  return {
    rows: [
      { label: "Raw counts", sub: "course", real: c.raw, realLabel: two(c.raw) },
      { label: "Stopwords removed", sub: "course", real: c.stopwords, realLabel: two(c.stopwords) },
      { label: "TF-IDF", sub: "course", real: c.tfidf, realLabel: two(c.tfidf), bold: true },
      { label: "TF-IDF, names only", real: f.names_only.hits, realLabel: two(f.names_only.hits) },
      { label: "TF-IDF, names removed", real: f.names.hits, realLabel: two(f.names.hits), base: [f.null.mean, f.null.sd], baseLabel: nullLabel, bold: true },
      { label: "…and he, she removed", real: f.pronouns.hits, realLabel: two(f.pronouns.hits) },
    ],
    opts: {
      domain: [0, 5], ticks: [0, 1, 2, 3, 4, 5], fmt: (v) => String(v), ref: [c.random, `ten random pages ${two(c.random)}`],
      axisTitle: "linked pages among a page's ten nearest",
      aria: `Linked pages among each page's ten nearest by text: TF-IDF ${two(c.tfidf)}, names only ${two(f.names_only.hits)}, names removed ${two(f.names.hits)}, as many other words removed ${two(f.null.mean)}, random ${two(c.random)}`,
    },
  };
}

// Section 3: the share of women among the labelled neighbours of women and of
// men, against shuffled labels, as names and then pronouns are removed.
export function genderRows({ facts: f }) {
  const g = f.gender;
  const row = (label, sub, t, hollow) => ({
    label, sub, hollow, real: t.observed, realLabel: pct(t.observed), base: [t.null_mean, t.null_sd],
    baseLabel: `shuffled ${pct(t.null_mean)}`,
  });
  const pair = (label, rep, divider) => [
    { ...row(label, "a woman's nearest", g[rep].female, false), bold: true, divider },
    row("", "a man's nearest", g[rep].male, true),
  ];
  return {
    rows: [...pair("TF-IDF", "tfidf"), ...pair("Names removed", "no_names", true), ...pair("Names, he and she removed", "no_names_pronouns", true)],
    opts: {
      domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt: pct, axisTitle: "women among the labelled nearest pages",
      aria: `Women among the nearest pages of women and of men: TF-IDF ${pct(g.tfidf.female.observed)} and ${pct(g.tfidf.male.observed)}, names removed ${pct(g.no_names.female.observed)} and ${pct(g.no_names.male.observed)}, names and pronouns removed ${pct(g.no_names_pronouns.female.observed)} and ${pct(g.no_names_pronouns.male.observed)}; shuffled about ${pct(g.no_names.female.null_mean)}`,
    },
  };
}

// The findings strip: each section's number against its baseline.
export function minis({ facts: f }) {
  const n = f.pages;
  const g = f.gender;
  return {
    1: [{ domain: [0, n], real: f.names.first_linked_no_names, realLabel: `${f.names.first_linked_no_names} without names`,
      ref: f.names.first_linked, refLabel: `${f.names.first_linked} with`, aria: `Closest page linked: ${f.names.first_linked} of ${n} with names, ${f.names.first_linked_no_names} without` },
    `pages whose closest page is linked with them, of ${n}`],
    2: [{ domain: [0, 5], real: f.names.hits, realLabel: two(f.names.hits), base: [f.null.mean, f.null.sd], baseLabel: `other words ${two(f.null.mean)}`,
      aria: `Names removed ${two(f.names.hits)} linked in ten, against ${two(f.null.mean)} when as many other words are removed` },
    `linked in ten without names, TF-IDF ${two(f.course.tfidf)}`],
    3: [{ domain: [0, 1], real: g.no_names.slots_to_women, realLabel: pct(g.no_names.slots_to_women), ref: g.female / n,
      refLabel: `${pct(g.female / n)} of pages`, aria: `Without names, ${pct(g.no_names.slots_to_women)} of all nearest-page slots go to women's pages, which are ${pct(g.female / n)} of pages` },
    "nearest-page slots that go to women's pages, without names"],
  };
}

const BUCKET = { story: "Shared story", mantle: "Same title", name: "Name only", template: "She, her, lists" };

/** The hand-read pairs of one representation ("tfidf" or "no_names") as a kit Table. */
export function readTable({ facts: f }, rep) {
  return {
    caption: rep === "tfidf" ? "The 25 closest unlinked pairs, names kept" : "The 25 closest unlinked pairs, names removed",
    columns: [
      { key: "pair", label: "Pair" },
      { key: "cos", label: "Cosine", num: true },
      { key: "steps", label: "Steps apart", num: true },
      { key: "words", label: "Words behind it" },
      { key: "bucket", label: "Read as" },
      { key: "note", label: "What the pages say" },
    ],
    rows: f.pairs.filter((p) => p.rep === rep).map((p) => ({
      pair: `${short(p.a)} · ${short(p.b)}`,
      cos: two(rep === "tfidf" ? p.cos_tfidf : p.cos_no_names),
      steps: p.distance ?? "no path",
      words: p.words.slice(0, 4).join(", "),
      bucket: BUCKET[p.bucket],
      note: p.note,
    })),
  };
}

/** The numbers behind the section 2 chart as a kit Table. */
export function ladderTable({ facts: f }) {
  const c = f.course;
  return {
    caption: "Linked pages among each page's ten nearest, mean over 303 pages",
    columns: [{ key: "rep", label: "Representation" }, { key: "hits", label: "Linked in ten", num: true }, { key: "who", label: "Computed by" }],
    rows: [
      { rep: "Ten random pages (expected)", hits: two(c.random), who: "course, reproduced" },
      { rep: "Raw counts", hits: two(c.raw), who: "course, reproduced" },
      { rep: "Stopwords removed", hits: two(c.stopwords), who: "course, reproduced" },
      { rep: "TF-IDF", hits: two(c.tfidf), who: "course, reproduced" },
      { rep: "TF-IDF, names only", hits: two(f.names_only.hits), who: "us" },
      { rep: "TF-IDF, names removed", hits: two(f.names.hits), who: "us" },
      { rep: `TF-IDF, ${f.null.words_removed.toLocaleString("en-US")} other words removed (${f.null.runs} runs)`, hits: `${two(f.null.mean)} ± ${two(f.null.sd)}`, who: "us" },
      { rep: "TF-IDF, names, he and she removed", hits: two(f.pronouns.hits), who: "us" },
    ],
  };
}

/** The share of each page's ten nearest at each network distance, as a kit Table. */
export function distanceTable({ facts: f }) {
  const d = f.distance;
  const keys = ["1", "2", "3", "4+", "none"];
  const label = { 1: "Linked (1 step)", 2: "2 steps", 3: "3 steps", "4+": "4 or more", none: "No path" };
  return {
    caption: "How far apart in the network the ten nearest pages sit",
    columns: [{ key: "d", label: "Distance" }, { key: "tf", label: "TF-IDF", num: true }, { key: "nn", label: "Names removed", num: true }, { key: "all", label: "All pairs", num: true }],
    rows: keys.map((k) => ({ d: label[k], tf: pct(d.tfidf[k]), nn: pct(d.no_names[k]), all: pct(d.all[k]) })),
  };
}

/** One explorer column: a page's ten nearest pages with what places each there. */
export function neighbourRows(data, index, rep) {
  return data[rep][index].map(([j, cos, linked, steps, words]) => ({
    index: j, name: short(data.names[j]), cos: two(cos), linked: linked === 1,
    where: linked === 1 ? "linked" : steps === 0 ? "no path" : `${steps} steps`, words,
  }));
}

/** The explorer's choices: every page by its short name, alphabetical. */
export function choices(data) {
  return data.names.map((name, i) => ({ i, name: short(name), full: name })).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** How many of a page's ten nearest pages link to it, per column. */
export const linkedCount = (rows) => rows.filter((r) => r.linked).length;

// The glossary terms the "what we did" paragraphs carry, each placed once lookalikes.json has loaded.
export const TERMS = [
  { phrase: "TF-IDF", definition: "A word's weight on a page: how often the page uses it, as a share of the page's length, times the log of 303 over the number of pages that use it. A word on every page gets 0.", id: "w6-term-tfidf" },
  { phrase: "cosine", definition: "How closely two pages' weight vectors point the same way: 1 for the same direction, 0 when they share no weighted word. A long page and a short one can score 1.", id: "w6-term-cosine" },
  { phrase: "shuffle", definition: "The baseline: the same labels dealt out again at random over the same pages, while every page keeps its ten nearest pages.", id: "w6-term-shuffle" },
];
