// Week 5 · #search — bag-of-words cosine search over the 303 Marvel pages.

const SEARCH_URL = new URL("../../weeks/week05/data/search.json", import.meta.url);
const LIVE_URL = new URL("../../weeks/week05/data/search_live.json", import.meta.url);

async function loadJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url.pathname} ${r.status}`);
  return r.json();
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) || []);
}

function cosineSparse(qIdx, qVal, pIdx, pVal) {
  // Prefer a map so unsorted page index lists still score correctly.
  const page = new Map();
  for (let i = 0; i < pIdx.length; i += 1) page.set(pIdx[i], pVal[i]);
  let dot = 0;
  let qn = 0;
  let pn = 0;
  for (const v of qVal) qn += v * v;
  for (const v of pVal) pn += v * v;
  if (!qn || !pn) return 0;
  for (let i = 0; i < qIdx.length; i += 1) {
    const pv = page.get(qIdx[i]);
    if (pv) dot += qVal[i] * pv;
  }
  return dot / (Math.sqrt(qn) * Math.sqrt(pn));
}

function vectorizeQuery(query, vocabIndex) {
  const counts = new Map();
  for (const t of tokenize(query)) {
    const idx = vocabIndex.get(t);
    if (idx === undefined) continue;
    counts.set(idx, (counts.get(idx) || 0) + 1);
  }
  const idx = [...counts.keys()].sort((a, b) => a - b);
  const val = idx.map((i) => counts.get(i));
  return { idx, val };
}

function rankLive(query, live) {
  const vocabIndex = new Map(live.vocab.map((t, i) => [t, i]));
  const q = vectorizeQuery(query, vocabIndex);
  if (!q.idx.length) return { empty: true, rows: [] };
  const scored = live.pages.map((p) => ({
    id: p.id,
    name: p.name,
    cosine: cosineSparse(q.idx, q.val, p.idx, p.val),
  }));
  scored.sort((a, b) => b.cosine - a.cosine || a.name.localeCompare(b.name));
  return { empty: false, rows: scored.slice(0, 8) };
}

function fmt(n) {
  return (Math.round(n * 1000) / 10).toFixed(n < 0.1 ? 1 : 0) + "%";
}

function overlapText(terms) {
  if (!terms?.length) return "no shared tokens";
  return terms
    .slice(0, 5)
    .map((t) => (t.is_stop ? `${t.term}*` : t.term))
    .join(", ");
}

function renderStats(summary, host) {
  host.innerHTML = "";
  const cells = [
    [summary.hits_at_1 + "/" + summary.n_queries, "raw BoW hits at rank 1"],
    [summary.hits_at_5 + "/" + summary.n_queries, "raw BoW hits in top 5"],
    [summary.hits_at_1_nostop + "/" + summary.n_queries, "without stopwords @1"],
    [summary.hits_at_5_nostop + "/" + summary.n_queries, "without stopwords @5"],
  ];
  for (const [value, label] of cells) {
    const d = document.createElement("div");
    d.className = "w5-stat";
    d.innerHTML = `<b>${value}</b><span>${label}</span>`;
    host.appendChild(d);
  }
}

function renderTable(data, tbody, onPick) {
  tbody.innerHTML = "";
  for (const q of data.queries) {
    const tr = document.createElement("tr");
    tr.dataset.id = q.id;
    const ok = q.hit_at_1;
    tr.innerHTML = `
      <td><button class="linkish" type="button"></button></td>
      <td></td>
      <td class="${ok ? "w5-ok" : "w5-fail"}"></td>
      <td></td>
      <td></td>`;
    tr.querySelector("button").textContent = q.query;
    tr.children[1].textContent = q.expected_name;
    tr.children[2].textContent = ok ? `#1` : `#${q.rank}`;
    tr.children[3].textContent = `#${q.rank_nostop}`;
    tr.children[4].textContent = q.top5[0]?.name || "—";
    tr.querySelector("button").addEventListener("click", () => onPick(q.id));
    tbody.appendChild(tr);
  }
}

function renderDetail(q, host) {
  if (!q) {
    host.innerHTML = `<p class="w5-caption">Pick a query in the table to see why it landed where it did.</p>`;
    return;
  }
  const status = q.hit_at_1
    ? `<span class="w5-ok">Hit at rank 1</span>`
    : `<span class="w5-fail">Miss — expected page at rank ${q.rank}</span>`;
  const topTerms = overlapText(q.top5[0]?.overlap_terms);
  const expTerms = overlapText(q.expected_overlap);
  host.innerHTML = `
    <p class="w5-lead">${status}. Without stopwords it sits at <b>#${q.rank_nostop}</b>
    (chance of a random hit at #1 is ${fmt(1 / 303)}).</p>
    <p class="w5-lead"><b>Top raw hit:</b> ${q.top5[0].name}
    (cosine ${q.top5[0].cosine}). Shared tokens: ${topTerms}.
    Asterisks mark stopwords.</p>
    <p class="w5-lead"><b>Expected page:</b> ${q.expected_name}
    shares ${expTerms}.</p>
    ${q.failure_reason ? `<p class="w5-lead">${q.failure_reason}</p>` : ""}
    <blockquote class="w5-quote">“${q.quote.text}”
      <span class="w5-caption"> — ${q.quote.name}</span></blockquote>`;
}

function renderLiveRanks(result, host, expectedName) {
  host.innerHTML = "";
  if (result.empty) {
    host.innerHTML = `<li><span class="w5-name">No vocabulary overlap</span>
      <span class="w5-terms">Try content words that actually appear on the pages
      (stopwords are already stripped in this live box).</span></li>`;
    return;
  }
  if (result.rows.length && result.rows[0].cosine === 0) {
    host.innerHTML = `<li><span class="w5-name">No shared content words</span>
      <span class="w5-terms">Every page scored 0 against this query after stopword removal.
      Try a more specific phrase, or pick a chip below.</span></li>`;
    return;
  }
  result.rows.forEach((row, i) => {
    const li = document.createElement("li");
    if (expectedName && row.name === expectedName) li.classList.add("w5-hit");
    li.innerHTML = `
      <span class="w5-pos">${i + 1}</span>
      <span class="w5-name"></span>
      <span class="w5-score"></span>`;
    li.querySelector(".w5-name").textContent = row.name;
    li.querySelector(".w5-score").textContent = row.cosine.toFixed(3);
    host.appendChild(li);
  });
}

export async function bootSearch(root = document) {
  const section = root.querySelector("#search");
  if (!section || section.dataset.booted) return;
  section.dataset.booted = "1";

  const [data, live] = await Promise.all([loadJson(SEARCH_URL), loadJson(LIVE_URL)]);
  const byId = Object.fromEntries(data.queries.map((q) => [q.id, q]));

  renderStats(data.summary, section.querySelector("#search-stats"));
  section.querySelector("#search-baseline").textContent = data.baseline;
  section.querySelector("#search-corpus-note").textContent = data.corpus_note;

  const tbody = section.querySelector("#search-tbody");
  const detail = section.querySelector("#search-detail");
  const input = section.querySelector("#search-input");
  const liveList = section.querySelector("#search-live-ranks");
  const chips = section.querySelector("#search-chips");

  let selected = data.queries[0]?.id;

  const pick = (id) => {
    selected = id;
    for (const tr of tbody.querySelectorAll("tr")) {
      tr.dataset.selected = tr.dataset.id === id ? "true" : "false";
    }
    const q = byId[id];
    renderDetail(q, detail);
    if (q && input) {
      input.value = q.query;
      const ranked = rankLive(q.query, live);
      renderLiveRanks(ranked, liveList, q.expected_name);
    }
  };

  renderTable(data, tbody, pick);

  chips.innerHTML = "";
  for (const q of data.queries.slice(0, 6)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "w5-chip";
    b.textContent = q.query;
    b.addEventListener("click", () => pick(q.id));
    chips.appendChild(b);
  }

  const runLive = () => {
    const ranked = rankLive(input.value.trim(), live);
    const expected = byId[selected]?.expected_name;
    renderLiveRanks(ranked, liveList, expected);
  };

  section.querySelector("#search-run").addEventListener("click", runLive);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runLive();
    }
  });

  pick(selected);

  section.querySelector("#search-surprise-num").textContent =
    `${data.summary.hits_at_1} of ${data.summary.n_queries}`;
  section.querySelector("#search-surprise-ns").textContent =
    `${data.summary.hits_at_5_nostop} of ${data.summary.n_queries}`;
  section.querySelector("#search-fail-count").textContent = String(data.summary.n_failures);

  const fail = data.queries.find((q) => !q.hit_at_1);
  if (fail) {
    section.querySelector("#search-checked-quote").textContent = `“${fail.quote.text}”`;
    section.querySelector("#search-checked-who").textContent = fail.quote.name;
    section.querySelector("#search-checked-why").textContent = fail.failure_reason || "";
  }
}
