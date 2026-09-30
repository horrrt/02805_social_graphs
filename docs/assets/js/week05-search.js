// Week 5 · section 3 · A Marvel search engine in 20 lines. Owner: Àngela.
//
// Draws into #search on docs/weeks/week05/index.html: the stat row, the search
// box (the stopword-free model, same vocabulary and tie rule as the script), the
// table of queries with the detail of the selected one, and the passage checked.
// Data: docs/weeks/week05/data/search.json and search_live.json, written by
// analysis/week05_search.py.

import { loadData, passage, termify } from "./kit.js?v=4";

const VERSION = "2";
const SEARCH_URL = new URL(`../../weeks/week05/data/search.json?v=${VERSION}`, import.meta.url);
const LIVE_URL = new URL(`../../weeks/week05/data/search_live.json?v=${VERSION}`, import.meta.url);

// The script's token rule: letters and digits in any alphabet, an inner apostrophe kept.
const TOKEN = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)?/gu;
const tokenize = (text) => (text.toLowerCase().match(TOKEN) || []).map((t) => t.replace("’", "'"));
const pct = (v, digits = 1) => `${(100 * v).toFixed(digits)}%`;
const el = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};

function model(live) {
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

function renderStats(s, host) {
  host.replaceChildren();
  for (const [value, label] of [
    [`${s.hits_at_1}/${s.n_scored}`, "right page first, raw counts"],
    [`${s.hits_at_5}/${s.n_scored}`, "in the top 5, raw counts"],
    [`${s.hits_at_1_nostop}/${s.n_scored}`, "first, stopwords removed"],
    [`${s.hits_at_5_nostop}/${s.n_scored}`, "in the top 5, stopwords removed"],
  ]) {
    const d = el("div", undefined, "w5-stat");
    d.append(el("b", value), el("span", label));
    host.append(d);
  }
}

function renderRanks(rows, host, target) {
  host.replaceChildren();
  if (!rows) {
    const li = el("li");
    li.append(el("span", "No page shares a word with this query once stopwords are removed.", "w5-name"));
    host.append(li);
    return;
  }
  rows.forEach((row, i) => {
    const li = el("li");
    const hit = target && row.id === target;
    if (hit) li.classList.add("w5-hit");
    li.append(el("span", String(i + 1), "w5-pos"), el("span", hit ? `${row.name} (target)` : row.name, "w5-name"),
      el("span", row.cosine.toFixed(3), "w5-score"));
    host.append(li);
  });
}

function renderTable(data, tbody, onPick) {
  tbody.replaceChildren();
  for (const q of data.queries) {
    const tr = el("tr");
    tr.dataset.id = q.id;
    const button = el("button", q.query, "linkish");
    button.type = "button";
    button.addEventListener("click", () => onPick(q.id));
    const cell = (text, cls) => {
      const td = el("td", text, cls);
      tr.append(td);
      return td;
    };
    tr.append(el("td"));
    tr.firstChild.append(button);
    cell(q.expected_name ?? "none in the snapshot");
    cell(q.rank ? `#${q.rank}` : "none", q.hit_at_1 ? "w5-ok" : "w5-fail");
    cell(q.rank_nostop ? `#${q.rank_nostop}` : "none");
    cell(q.top5[0].name);
    tbody.append(tr);
  }
}

function renderDetail(q, s, host) {
  host.replaceChildren();
  const status = q.hit_at_1 ? "Right page first." : q.scored ? `The target sits at #${q.rank}.` : "No page is right.";
  host.append(el("p", `${status} ${q.why_expected}`));
  const words = (terms) => (terms?.length ? terms.slice(0, 5).map((t) => (t.is_stop ? `${t.term} (stopword)` : t.term)).join(", ") : "none");
  host.append(el("p", `Top raw hit: ${q.top5[0].name}, ${q.top5[0].n_tokens.toLocaleString("en-GB")} words, shares ${words(q.top5[0].overlap_terms)}.`));
  if (q.scored) host.append(el("p", `${q.expected_name} shares ${words(q.expected_overlap)}.`));
  if (q.failure_reason) host.append(el("p", q.failure_reason));
  host.append(el("p", `A random ranking puts the target first ${pct(s.chance_at_1)} of the time.`, "w5-caption"));
}

async function boot() {
  const section = document.getElementById("search");
  if (!section) return;
  const [data, live] = await Promise.all([loadData(SEARCH_URL), loadData(LIVE_URL)]);
  const search = model(live);
  const byId = Object.fromEntries(data.queries.map((q) => [q.id, q]));
  const s = data.summary;
  renderStats(s, document.getElementById("search-stats"));

  const tbody = document.getElementById("search-tbody");
  const detail = document.getElementById("search-detail");
  const input = document.getElementById("search-input");
  const ranks = document.getElementById("search-live-ranks");
  const chips = document.getElementById("search-chips");
  let selected = null;

  const pick = (id) => {
    selected = byId[id];
    for (const tr of tbody.querySelectorAll("tr")) tr.setAttribute("aria-selected", String(tr.dataset.id === id));
    for (const b of chips.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.id === id));
    renderDetail(selected, s, detail);
    input.value = selected.query;
    renderRanks(search(selected.query), ranks, selected.expected);
  };
  renderTable(data, tbody, pick);
  for (const q of data.queries.slice(0, 6)) {
    const b = el("button", q.query, "w5-chip");
    b.type = "button";
    b.dataset.id = q.id;
    b.addEventListener("click", () => pick(q.id));
    chips.append(b);
  }
  const run = () => {
    // A typed query has no target unless it is the selected query word for word.
    const target = selected && input.value.trim() === selected.query ? selected.expected : null;
    renderRanks(search(input.value.trim()), ranks, target);
  };
  document.getElementById("search-run").addEventListener("click", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });
  pick(data.queries.find((q) => q.id === "storm")?.id ?? data.queries[0].id);

  const c = data.checked;
  if (c) document.getElementById("search-passage").append(passage({ page: c.winner, text: c.quote, highlight: c.terms[0] }));

  const did = document.getElementById("search-did");
  termify(did, "Bag of Words", "A page or a query as a list of word counts, with the word order thrown away.", "w5-term-search-bow");
  termify(did, "cosine similarity", "How close two count vectors point: their dot product divided by both their lengths, from 0 (no shared word) to 1 (the same proportions).", "w5-term-search-cosine");
  termify(did, "document-term matrix", "A table with one row per page, one column per word and the counts inside.", "w5-term-search-dtm");
  termify(did, "stopwords", "Very common words such as the, of and with, dropped before counting.", "w5-term-search-stop");
}

boot().catch((err) => console.error("week05 search failed", err));
