// Week 7's pure builders: the charts, tables and explorer rows the islands in
// src/features/week07/ draw, all from public/weeks/week07/data/comention.json
// (analysis/week07_comention.py). No DOM, no listeners, no fetch.

/** The page's one data file under public/: pass it to asset() once hydrated. */
export const DATA = "weeks/week07/data/comention.json";

/** The character the explorer opens on, and the ones its buttons jump to. */
export const START = "Luke Cage";
export const PICKS = ["Luke Cage", "Storm (Marvel Comics)", "Human Torch", "Hawkeye (comics)"];

/** Why each chip is there, shown in the note under the picker when that page is picked. */
export const PICK_WHY = {
  "Luke Cage": "A page whose ties mostly match its links.",
  "Storm (Marvel Comics)": "Her codename is also Johnny Storm's surname.",
  "Human Torch": "The bare name also means the android Human Torch of the 1940s, who has a page of his own.",
  "Hawkeye (comics)": "One page for everyone who used the name; the main Hawkeye, Clint Barton, is not one of the 303, so almost none of its ties link.",
};

export const pct = (v) => `${Math.round(v * 100)}%`;
export const count = (n) => n.toLocaleString("en-US");
/** "Storm (Marvel Comics)" -> "Storm": the disambiguation Wikipedia adds to a title. */
export const short = (name) => name.replace(/ \((character|characters|Marvel Comics|comics|Marvel)\)$/, "");

const UNIT_LABEL = { sentence: "One sentence", paragraph: "One paragraph", page: "One page" };
const UNITS = ["sentence", "paragraph", "page"];

/** "shuffled 15% ± 0.7": a rewired null's mean and spread in points. */
const nullLabel = (u) => `rewired ${pct(u.null_mean)} ± ${(u.null_sd * 100).toFixed(1)}`;

// Section 2: the share of sentence ties that are links, by how many sentences name the pair,
// each bin against its own rewiring.
export function weightRows({ facts: f }) {
  return {
    rows: f.weights.map((w, i) => ({
      label: w.bin === "1" ? "1 sentence" : `${w.bin} sentences`,
      sub: `${count(w.ties)} pairs`,
      real: w.share_linked,
      realLabel: pct(w.share_linked),
      base: [w.null_mean, w.null_sd],
      baseLabel: i === 0 ? nullLabel(w) : pct(w.null_mean),
      bold: i === f.weights.length - 1,
    })),
    opts: {
      domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt: pct, labelW: 150,
      axisTitle: "share of pairs that are linked",
      aria: `Share of character pairs named in one sentence that are also linked, by how many sentences name them: ${f.weights
        .map((w) => `${w.bin}: ${pct(w.share_linked)} against ${pct(w.null_mean)} rewired`)
        .join("; ")}`,
    },
  };
}

/** The numbers behind the section 2 chart as a kit Table. */
export function weightTable({ facts: f }) {
  return {
    caption: `Pairs named together in one sentence, by how many sentences; rewired: ${f.runs / 5} degree-preserving rewirings of each bin`,
    columns: [
      { key: "bin", label: "Sentences naming both", num: true }, { key: "ties", label: "Pairs", num: true },
      { key: "linked", label: "Linked", num: true }, { key: "share", label: "Share linked", num: true }, { key: "null", label: "Rewired", num: true },
    ],
    rows: f.weights.map((w) => ({
      bin: w.bin, ties: count(w.ties), linked: count(w.linked), share: pct(w.share_linked), null: `${pct(w.null_mean)} ± ${(w.null_sd * 100).toFixed(1)}`,
    })),
  };
}

// Section 3, left: share of text ties that are links, per unit, against the rewired network.
export function unitPrecision({ facts: f }) {
  const rows = UNITS.map((u) => {
    const x = f.units[u];
    return { label: UNIT_LABEL[u], sub: `${count(x.ties)} pairs`, real: x.share_linked, realLabel: pct(x.share_linked), base: [x.null_mean, x.null_sd], baseLabel: nullLabel(x), bold: u === "sentence" };
  });
  const n = f.ner_sentence;
  rows.push({ label: "spaCy's tagger, one sentence", sub: `${count(n.ties)} pairs`, real: n.share_linked, realLabel: pct(n.share_linked), base: [n.null_mean, n.null_sd], baseLabel: nullLabel(n), hollow: true, divider: true });
  return {
    rows,
    opts: {
      domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt: pct, labelW: 170,
      axisTitle: "share of text pairs that are linked",
      aria: `Share of text pairs that are links: ${UNITS.map((u) => `${u} ${pct(f.units[u].share_linked)} against ${pct(f.units[u].null_mean)} rewired`).join("; ")}; spaCy's tagger ${pct(n.share_linked)}`,
    },
  };
}

// Section 3, right: share of the links each unit finds.
export function unitRecall({ facts: f }) {
  const rows = UNITS.map((u) => ({ label: UNIT_LABEL[u], sub: `${count(f.units[u].linked)} links`, real: f.units[u].share_links_found, realLabel: pct(f.units[u].share_links_found), bold: u === "sentence" }));
  const n = f.ner_sentence;
  rows.push({ label: "spaCy's tagger, one sentence", sub: `${count(n.linked)} links`, real: n.share_links_found, realLabel: pct(n.share_links_found), hollow: true, divider: true });
  return {
    rows,
    opts: {
      domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt: pct, labelW: 170,
      axisTitle: `share of the ${count(f.links)} linked pairs found`,
      aria: `Share of the ${count(f.links)} linked pairs each unit finds: ${UNITS.map((u) => `${u} ${pct(f.units[u].share_links_found)}`).join(", ")}; spaCy's tagger ${pct(n.share_links_found)}`,
    },
  };
}

/** The numbers behind section 3 as a kit Table. */
export function unitTable({ facts: f }) {
  const row = (label, x) => ({
    unit: label, chars: count(x.characters), ties: count(x.ties), linked: count(x.linked), share: pct(x.share_linked),
    null: `${pct(x.null_mean)} ± ${(x.null_sd * 100).toFixed(1)}`, z: x.z.toFixed(0), found: pct(x.share_links_found),
  });
  return {
    caption: `Three text networks and spaCy's, against the ${count(f.links)} linked pairs; rewired: ${count(f.runs)} degree-preserving rewirings`,
    columns: [
      { key: "unit", label: "Named together in" }, { key: "chars", label: "Characters", num: true }, { key: "ties", label: "Pairs", num: true },
      { key: "linked", label: "Linked", num: true }, { key: "share", label: "Share linked", num: true }, { key: "null", label: "Rewired", num: true },
      { key: "z", label: "z", num: true }, { key: "found", label: "Links found", num: true },
    ],
    rows: [...UNITS.map((u) => row(UNIT_LABEL[u], f.units[u])), row("One sentence, spaCy's tagger", f.ner_sentence)],
  };
}

/** The instrument check: what each instrument found in the 80 sentences read. */
export function instrumentTable({ facts: f }) {
  const i = f.instrument;
  const row = (label, x) => ({ inst: label, found: x.found, right: x.right, missed: x.missed, p: pct(x.precision), r: pct(x.recall) });
  return {
    caption: `Characters named in ${i.sentences} random sentences: ${i.mentions} by our reading`,
    columns: [
      { key: "inst", label: "Instrument" }, { key: "found", label: "Found", num: true }, { key: "right", label: "Right", num: true },
      { key: "missed", label: "Missed", num: true }, { key: "p", label: "Right of found", num: true }, { key: "r", label: "Found of named", num: true },
    ],
    rows: [row("Our names", i.names), row("spaCy's entities, then our names", i.ner)],
  };
}

const list = (xs) => (xs.length ? xs.map(short).join(", ") : "none");

/** The sentences where the reading and an instrument disagree. */
export function sentenceTable({ sentences_read: rows }) {
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  return {
    caption: "The sampled sentences where an instrument and the reading disagree",
    columns: [
      { key: "page", label: "Page" }, { key: "sentence", label: "Sentence" }, { key: "read", label: "We read" },
      { key: "names", label: "Our names" }, { key: "ner", label: "spaCy, then our names" }, { key: "note", label: "Note" },
    ],
    rows: rows
      .filter((r) => !same(r.read, r.names) || !same(r.read, r.ner))
      .map((r) => ({ page: short(r.page), sentence: r.sentence.trim(), read: list(r.read), names: list(r.names), ner: list(r.ner), note: r.note })),
  };
}

export const PAIR_BUCKET = { story: "Shared story", title: "A title", passing: "Passing mention", "wrong name": "Wrong name" };
export const LINK_BUCKET = { pronoun: "He, she or his", "other name": "Another name", "no mention": "No mention" };

/** Section 4's figure: how the hand-read ties and links split, with one example of each. */
export function bucketTable(data, which) {
  const rows = which === "pairs" ? data.pairs : data.links_missed;
  const labels = which === "pairs" ? PAIR_BUCKET : LINK_BUCKET;
  return {
    caption: which === "pairs"
      ? `The ${rows.length} strongest ties without a link, read`
      : `${rows.length} links no sentence finds, drawn at random and read`,
    columns: [{ key: "bucket", label: "Read as" }, { key: "n", label: "Pairs", num: true }, { key: "eg", label: "For example" }],
    rows: Object.entries(labels)
      .map(([key, label]) => {
        const hit = rows.filter((r) => r.bucket === key);
        return { bucket: label, n: hit.length, eg: hit.length ? `${short(hit[0].a)} · ${short(hit[0].b)}: ${hit[0].note}` : "" };
      })
      .filter((r) => r.n > 0),
  };
}

/** Every hand-read tie or link, as a kit Table. */
export function readTable(data, which) {
  if (which === "pairs") {
    return {
      caption: "The 25 strongest ties without a link: the first sentence that names both",
      columns: [{ key: "pair", label: "Pair" }, { key: "n", label: "Sentences", num: true }, { key: "bucket", label: "Read as" }, { key: "note", label: "What the sentence says" }],
      rows: data.pairs.map((p) => ({ pair: `${short(p.a)} · ${short(p.b)}`, n: p.sentences, bucket: PAIR_BUCKET[p.bucket], note: p.note })),
    };
  }
  return {
    caption: "20 links no sentence finds, drawn at random",
    columns: [{ key: "pair", label: "Pair" }, { key: "rule", label: "One page names the other", num: false }, { key: "bucket", label: "Read as" }, { key: "note", label: "What the pages say" }],
    rows: data.links_missed.map((p) => ({ pair: `${short(p.a)} · ${short(p.b)}`, rule: p.rule === "named" ? "yes" : "no", bucket: LINK_BUCKET[p.bucket], note: p.note })),
  };
}

// The findings strip: each section's number against its baseline.
export function minis({ facts: f }) {
  const s = f.units.sentence;
  const top = f.weights.at(-1);
  const p = f.pairs_read;
  return {
    1: [{ domain: [0, 1], real: s.share_linked, realLabel: pct(s.share_linked), base: [s.null_mean, s.null_sd], baseLabel: `rewired ${pct(s.null_mean)}`,
      aria: `${pct(s.share_linked)} of pairs named in one sentence are linked, against ${pct(s.null_mean)} after rewiring` },
    "pairs named in one sentence that are linked"],
    2: [{ domain: [0, 1], real: top.share_linked, realLabel: pct(top.share_linked), base: [top.null_mean, top.null_sd], baseLabel: `rewired ${pct(top.null_mean)}`,
      aria: `${pct(top.share_linked)} of pairs named together in ${top.bin} sentences are linked, against ${pct(top.null_mean)} after rewiring` },
    `pairs named in ${top.bin} sentences that are linked`],
    3: [{ domain: [0, 1], real: f.units.page.share_links_found, realLabel: `page ${pct(f.units.page.share_links_found)}`, ref: s.share_links_found, refLabel: `sentence ${pct(s.share_links_found)}`,
      aria: `One sentence finds ${pct(s.share_links_found)} of the links, one page ${pct(f.units.page.share_links_found)}` },
    "share of the links each unit finds"],
    4: [{ domain: [0, p.n], real: p.story ?? 0, realLabel: `${p.story ?? 0} share a story`, ref: p.n, refLabel: `of ${p.n}`,
      aria: `${p.story ?? 0} of the ${p.n} strongest unlinked ties share a story` },
    "strongest unlinked ties that share a story"],
  };
}

/** A sentence cut into plain and marked runs by its name spans: up to `room` characters kept on each side
 * of a name, and a long stretch between two names cut to "…". */
export function marked(text, spans, room = 160) {
  const lead = text.length - text.trimStart().length;
  const stop = text.trimEnd().length;
  const runs = [];
  let at = lead;
  const plain = (from, to, before) => {
    if (to <= from) return;
    if (to - from <= 2 * room + 20) runs.push({ text: text.slice(from, to), name: false });
    else if (before === "start") runs.push({ text: "…", name: false }, { text: text.slice(to - room, to), name: false });
    else if (before === "end") runs.push({ text: text.slice(from, from + room), name: false }, { text: "…", name: false });
    else runs.push({ text: text.slice(from, from + room), name: false }, { text: " … ", name: false }, { text: text.slice(to - room, to), name: false });
  };
  spans.forEach(([a, b], i) => {
    if (a < at) return;
    plain(at, a, i === 0 ? "start" : "middle");
    runs.push({ text: text.slice(a, b), name: true });
    at = b;
  });
  plain(at, stop, "end");
  return runs;
}

/** One character's partners: every sentence tie, most sentences first, and the links no sentence finds. */
export function partners(data, index) {
  const ties = data.ties
    .filter(([a, b]) => a === index || b === index)
    .map(([a, b, n, linked, text, spans, page]) => ({ other: a === index ? b : a, name: short(data.chars[a === index ? b : a]), page: data.chars[a === index ? b : a], n, linked: linked === 1, runs: marked(text, spans, 60), from: short(page) }))
    .sort((x, y) => y.n - x.n || x.name.localeCompare(y.name, "en"));
  const missed = data.missed
    .filter(([a, b]) => a === index || b === index)
    .map(([a, b, named]) => ({ name: short(data.chars[a === index ? b : a]), named: named === 1 }))
    .sort((x, y) => x.name.localeCompare(y.name, "en"));
  return { ties, missed };
}

/** The line under the picker: how many partners, how many linked, how many links the sentences miss. */
export function pickNote(data, index) {
  const { ties, missed } = partners(data, index);
  const linked = ties.filter((t) => t.linked).length;
  return `${short(data.chars[index])} is named in one sentence with ${ties.length} ${ties.length === 1 ? "character" : "characters"}; ${linked} of them are linked. ${missed.length} more ${missed.length === 1 ? "link has" : "links have"} no sentence naming both.`;
}

/** The explorer's choices: every page by its short name, alphabetical. */
export function choices(data) {
  return data.chars.map((name, i) => ({ i, name: short(name) })).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** The hero's three sentences: the strongest linked tie, a read story without a link, a read wrong name. */
export function heroSentences(data) {
  const index = new Map(data.chars.map((n, i) => [n, i]));
  const tie = (a, b) => {
    const [i, j] = [index.get(a), index.get(b)].sort((x, y) => x - y);
    return data.ties.find(([x, y]) => x === i && y === j);
  };
  const strongest = data.ties.filter((t) => t[3] === 1).sort((x, y) => y[2] - x[2])[0];
  const story = data.pairs.find((p) => p.bucket === "story");
  const wrong = data.pairs.find((p) => p.bucket === "wrong name");
  const row = (t, verdict) => ({ a: short(data.chars[t[0]]), b: short(data.chars[t[1]]), n: t[2], linked: t[3] === 1, runs: marked(t[4], t[5], 90), verdict });
  return [
    row(strongest, "linked, and named together most often"),
    row(tie(story.a, story.b), "not linked, but a shared story"),
    row(tie(wrong.a, wrong.b), "not linked, and a wrong name"),
  ];
}
