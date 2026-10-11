// Week 5 · section 3 · A Marvel search engine in 20 lines. Owner: Àngela.
//
// What this section's islands (src/features/week05/search/) draw into #search on
// src/app/(week05)/weeks/week05/_sections/Search.tsx: the stat row, the search
// box (the stopword-free model, same vocabulary and tie rule as the script), the
// table of queries with the detail of the selected one, and the passage checked.
// Data: public/weeks/week05/data/search.json and search_live.json, written by
// analysis/week05_search.py. No DOM, no listeners, no fetch.

/** The queries, their ranks and the passage: every part of the section but the live ranking. */
export const SEARCH = "weeks/week05/data/search.json";
/** The stopword-free model the search box runs. */
export const LIVE = "weeks/week05/data/search_live.json";

// The script's token rule: letters and digits in any alphabet, an inner apostrophe kept.
const TOKEN = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)?/gu;
const tokenize = (text) => (text.toLowerCase().match(TOKEN) || []).map((t) => t.replace("’", "'"));
const pct = (v, digits = 1) => `${(100 * v).toFixed(digits)}%`;

/** The search box's ranking: model(live)(query) -> the top rows [{ id, name, cosine }], or null when no word is known. */
export function model(live) {
  const index = new Map(live.vocab.map((t, i) => [t, i]));
  const stop = new Set(live.stopwords);
  const norms = live.pages.map((p) => Math.sqrt(p.val.reduce((s, v) => s + v * v, 0)));
  const rows = live.pages.map((p) => new Map(p.idx.map((i, k) => [i, p.val[k]])));
  return (query) => {
    const counts = new Map();
    for (const t of tokenize(query)) {
      if (stop.has(t) || !index.has(t)) continue;
      counts.set(index.get(t), (counts.get(index.get(t)) || 0) + 1);
    }
    if (!counts.size) return null;
    const qn = Math.sqrt([...counts.values()].reduce((s, v) => s + v * v, 0));
    const scored = live.pages.map((p, i) => {
      let dot = 0;
      for (const [k, v] of counts) dot += v * (rows[i].get(k) || 0);
      return { id: p.id, name: p.name, cosine: norms[i] ? dot / (qn * norms[i]) : 0 };
    });
    // Ties break on node_id, as in analysis/week05_search.py.
    scored.sort((a, b) => b.cosine - a.cosine || (a.id < b.id ? -1 : 1));
    return scored.slice(0, live.top);
  };
}

/** The ranking's line when no page shares a word with the query. */
export const NO_MATCH = "No page shares a word with this query once stopwords are removed.";

/** The stat row: [value, label] per stat. */
export function stats(s) {
  return [
    [`${s.hits_at_1}/${s.n_scored}`, "right page first, raw counts"],
    [`${s.hits_at_5}/${s.n_scored}`, "in the top 5, raw counts"],
    [`${s.hits_at_1_nostop}/${s.n_scored}`, "first, stopwords removed"],
    [`${s.hits_at_5_nostop}/${s.n_scored}`, "in the top 5, stopwords removed"],
  ];
}

/** The query selected when the section first draws: storm, else the first. */
export function firstPick(data) {
  return data.queries.find((q) => q.id === "storm")?.id ?? data.queries[0].id;
}

/** How many example queries the chips offer: the first six. */
export const CHIPS = 6;

/** One row of the query table: the query, then four cells [text, class]. */
export function row(q) {
  return {
    id: q.id,
    query: q.query,
    cells: [
      [q.expected_name ?? "none in the snapshot"],
      [q.rank ? `#${q.rank}` : "none", q.hit_at_1 ? "w5-ok" : "w5-fail"],
      [q.rank_nostop ? `#${q.rank_nostop}` : "none"],
      [q.top5[0].name],
    ],
  };
}

// The detail's opening verdict on the selected query.
function status(q) {
  if (q.hit_at_1) return "Right page first.";
  if (q.scored) return `The target sits at #${q.rank}.`;
  return "No page is right.";
}

/** The detail of the selected query: paragraphs [text, class]. */
export function detail(q, s) {
  const words = (terms) => (terms?.length ? terms.slice(0, 5).map((t) => (t.is_stop ? `${t.term} (stopword)` : t.term)).join(", ") : "none");
  const lines = [[`${status(q)} ${q.why_expected}`]];
  lines.push([`Top raw hit: ${q.top5[0].name}, ${q.top5[0].n_tokens.toLocaleString("en-GB")} words, shares ${words(q.top5[0].overlap_terms)}.`]);
  if (q.scored) lines.push([`${q.expected_name} shares ${words(q.expected_overlap)}.`]);
  if (q.failure_reason) lines.push([q.failure_reason]);
  lines.push([`A random ranking puts the target first ${pct(s.chance_at_1)} of the time.`, "w5-caption"]);
  return lines;
}

/** The target a run of `text` marks: a typed query has none unless it is the selected query word for word. */
export function targetOf(selected, text) {
  return selected && text.trim() === selected.query ? selected.expected : null;
}

/** The checked passage's props, or null. */
export function checked(data) {
  const c = data.checked;
  return c ? { page: c.winner, text: c.quote, highlight: c.terms[0] } : null;
}

// ---- glossary terms, in main's call order. "document-term matrix"
// (w5-term-search-dtm) matched no text in #search-did, so it is not placed.
export const TERMS = [
  { phrase: "Bag of Words", definition: "A page or a query as a list of word counts, with the word order thrown away.", id: "w5-term-search-bow" },
  { phrase: "cosine similarity", definition: "How close two count vectors point: their dot product divided by both their lengths, from 0 (no shared word) to 1 (the same proportions).", id: "w5-term-search-cosine" },
  { phrase: "stopwords", definition: "Very common words such as the, of and with, dropped before counting.", id: "w5-term-search-stop" },
];
