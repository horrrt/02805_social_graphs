// Week 4 redesign · the deep dive's PageRank explorable, #cut-pagerank. Built
// from docs/weeks/week04/data/pagerank.json (analysis/week04_pagerank.py):
// PageRank on section 2's occupation network, kept to its strongest ties (the
// disparity-filter backbone, alpha = 0.05), at three damping factors, plus a
// from-scratch power iteration checked against nx.pagerank. Nothing here is
// computed in the browser; every number comes from that JSON.

import { node, token } from "./week04-strip.js";

const DATA = new URL("../../weeks/week04/data/pagerank.json", import.meta.url);
const DEFAULT_D = "0.85";
const BAR_W = 556;
const LABEL_W = 210;
const ROW_H = 24;
const TOP_SHOWN = 15;

async function load() {
  const r = await fetch(DATA);
  if (!r.ok) throw new Error(`${DATA.pathname} ${r.status}`);
  return r.json();
}

function frag(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function reveal(id, label, bodyEl) {
  const span = document.createElement("span");
  span.className = "w4-tip";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-describedby", id);
  btn.innerHTML =
    '<svg aria-hidden="true" height="14" viewBox="0 0 24 24" width="14"><circle cx="12" cy="12" fill="none" r="9" stroke="currentColor" stroke-width="2"></circle><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path></svg>' +
    label;
  const pop = document.createElement("span");
  pop.className = "w4-pop";
  pop.id = id;
  pop.setAttribute("role", "tooltip");
  const b = document.createElement("b");
  b.textContent = label;
  pop.append(b, bodyEl);
  span.append(btn, pop);
  return span;
}

/** A horizontal bar per row, value 0..max, with a small numeral badge (e.g. a
 * degree rank) so the chart doubles as the "PageRank vs degree" comparison. */
function hbars(rows, { max, badgeLabel, aria }) {
  const top = 4;
  const h = top + rows.length * ROW_H + 8;
  const svg = node("svg", { viewBox: `0 0 ${BAR_W} ${h}`, width: BAR_W, height: h, role: "img", "aria-label": aria });
  const x0 = LABEL_W;
  const x1 = BAR_W - 54;
  rows.forEach((r, i) => {
    const cy = top + i * ROW_H;
    const w = ((x1 - x0) * r.value) / max;
    svg.append(
      node(
        "text",
        { x: 0, y: cy + 13, "font-size": 12, fill: token("--ink") },
        `${r.rank}. ${r.label}`,
      ),
    );
    const bar = node("g");
    bar.append(node("title", {}, r.tip));
    bar.append(node("rect", { x: x0, y: cy + 2, width: Math.max(w, 1), height: 14, rx: 3, fill: token("--w4-accent") }));
    svg.append(bar);
    if (r.badge !== undefined) {
      svg.append(
        node(
          "text",
          { x: BAR_W, y: cy + 13, "font-size": 11, fill: token("--ink-mute"), "text-anchor": "end" },
          `${badgeLabel} #${r.badge}`,
        ),
      );
    }
  });
  return svg;
}

function pagerankRows(list) {
  const max = Math.max(...list.map((r) => r.pagerank));
  return {
    max,
    rows: list.map((r) => ({
      rank: r.rank,
      label: r.title,
      value: r.pagerank,
      badge: r.degree_rank ?? undefined,
      tip: `${r.title}: PageRank ${r.pagerank.toFixed(4)}, filings ${r.filings.toLocaleString("en-US")}`,
    })),
  };
}

function buildDampingCard(data) {
  const article = document.createElement("div");
  article.className = "card w4-card";
  article.id = "cut-pagerank-explore";

  const header = document.createElement("header");
  header.className = "w4-q";
  header.innerHTML = `
    <span class="w4-num">P1</span>
    <div>
      <h2>Change the damping factor: does the ranking move?</h2>
      <p class="w4-answer">Yes. Raising the damping factor from ${data.damping[0]} to ${data.damping.at(-1)} reshuffles
      the ranking and pulls it away from a plain count of ties, toward occupations linked to the network's biggest hubs.</p>
    </div>`;

  const two = document.createElement("div");
  two.className = "w4-two";
  const left = document.createElement("div");
  left.innerHTML = `
    <p class="sub">
      PageRank on ${data.meta.network.toLowerCase()}. Every step, a walker follows a tie with probability
      d (the damping factor) and otherwise jumps to a random occupation; d = 0 ignores the network entirely,
      d close to 1 lets ties fully decide the order. Pick a value below.
    </p>`;

  const toggle = document.createElement("div");
  toggle.className = "axis-modes";
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Damping factor");
  for (const d of data.damping) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `d = ${d}`;
    btn.dataset.d = String(d);
    btn.setAttribute("aria-pressed", String(d) === DEFAULT_D ? "true" : "false");
    toggle.append(btn);
  }
  left.append(toggle);

  const legend = document.createElement("p");
  legend.className = "w4-legend";
  legend.innerHTML =
    '<span><i style="background:var(--w4-accent)"></i>PageRank (bar length)</span>' +
    "<span>deg #n = that occupation's rank by plain unweighted degree</span>";
  left.append(legend);

  const notice = document.createElement("div");
  notice.className = "notice";
  notice.innerHTML = `<span class="ico">💡</span><span><b>What to notice</b></span>`;
  const overlap5v99 = data.finding.top15_overlap_d0_5_vs_d0_99;
  const overlapDeg = data.finding.pagerank_vs_degree_top15_overlap;
  const overlapStr = data.finding.pagerank_vs_strength_top15_overlap;
  notice.querySelector("span:last-child").append(
    frag(
      `The top 15 at d = 0.5 and at d = 0.99 share only ${overlap5v99} of 15 occupations: raising the damping ` +
        `factor really does reorder the ranking, not just rescale it. At d = 0.85, PageRank's top 15 shares ` +
        `${overlapDeg} of 15 with plain unweighted-degree's top 15, and ${overlapStr} of 15 with weighted ` +
        `strength's (the projection's own edge weight, shared companies): being tied to the right occupations ` +
        `matters as much as how many ties there are.`,
    ),
  );
  left.append(notice);

  const revealsRow = document.createElement("div");
  revealsRow.className = "w4-reveals";
  const howBody = document.createElement("span");
  howBody.append(
    frag(
      `The network is section 2's companies x occupations projection, kept to its disparity-filter backbone at ` +
        `alpha = ${data.meta.alpha_filter} (stricter than section 2's own alpha = ${data.meta.section2_alpha_filter} ` +
        `backbone, chosen so the ranking has to lean on network position, not just tie count): ${data.meta.nodes} of the ` +
        `${data.meta.nodes_before_backbone} occupations, ${data.meta.edges} of its ${data.meta.edges_before_backbone} ` +
        `ties. A firm-to-client staffing network was tried first and rejected: with no incoming ties for a firm and ` +
        `no outgoing ones for a client, every firm gets the same score and the damping factor cannot reorder the ` +
        `clients either, whatever value it takes.`,
    ),
  );
  const moreBody = document.createElement("span");
  const movers = data.movers.slice(0, 4);
  moreBody.textContent = movers.length
    ? `Biggest movers between d = 0.5 and d = 0.99: ${movers
        .map((m) => `${m.title} (rank ${m.rank_d0_5} → ${m.rank_d0_99})`)
        .join("; ")}.`
    : "";
  revealsRow.append(reveal("w4-pop-pagerank-how", "How we tested it", howBody));
  revealsRow.append(reveal("w4-pop-pagerank-more", "More numbers", moreBody));
  left.append(revealsRow);

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Top ${TOP_SHOWN} occupations by PageRank</h3>
    <p class="axis-note">
      Bar length is PageRank at the chosen damping factor; the badge on the right is that occupation's rank by
      plain unweighted degree, so a short bar with a small badge number is well connected but not well placed.
    </p>`;
  const host = document.createElement("div");
  host.className = "w4-figure-body";
  plot.append(host);

  const drawFor = (d) => {
    const list = data.rankings[d].slice(0, TOP_SHOWN);
    const { max, rows } = pagerankRows(list);
    host.replaceChildren(
      hbars(rows, {
        max,
        badgeLabel: "deg",
        aria: `Top ${TOP_SHOWN} occupations by PageRank at damping ${d}, with each occupation's plain-degree rank`,
      }),
    );
  };
  drawFor(DEFAULT_D);
  toggle.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-d]");
    if (!btn) return;
    for (const b of toggle.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === btn));
    drawFor(btn.dataset.d);
  });

  two.append(left, plot);
  article.append(header, two);
  return article;
}

/** The step (from it.steps) at which keyFn's value settles into its final
 * value and never changes again, scanning backward from the last step. */
function stablePoint(steps, keyFn) {
  const finalKey = keyFn(steps.at(-1));
  let stable = steps.at(-1).step;
  for (let i = steps.length - 1; i >= 0 && keyFn(steps[i]) === finalKey; i--) stable = steps[i].step;
  return stable;
}

function iterationClaims(it) {
  const leaderStep = stablePoint(it.steps, (s) => s.rows[0].code);
  const top10Step = stablePoint(it.steps, (s) => [...s.rows.map((r) => r.code)].sort().join(","));
  return { leaderStep, top10Step, leaderTitle: it.steps.at(-1).rows[0].title };
}

function buildIterationCard(data) {
  const article = document.createElement("div");
  article.className = "card w4-card";
  article.id = "cut-pagerank-iteration";

  const it = data.iteration;
  const claims = iterationClaims(it);

  const header = document.createElement("header");
  header.className = "w4-q";
  header.innerHTML = `
    <span class="w4-num">P2</span>
    <div>
      <h2>Stepped one round at a time, how fast does the ranking settle?</h2>
      <p class="w4-answer">Unevenly. ${claims.leaderTitle} leads from step ${claims.leaderStep} on and never gives
      up first place again, but the rest of the top 10 keeps reshuffling until step ${claims.top10Step}.</p>
    </div>`;

  const two = document.createElement("div");
  two.className = "w4-two";
  const left = document.createElement("div");
  left.innerHTML = `
    <p class="sub">
      Power iteration at d = ${it.alpha} (the same walk PageRank runs to convergence): every occupation starts
      with an equal score, and each round redistributes it along the network's ties. Step through the rounds below.
    </p>`;

  const stepRow = document.createElement("div");
  stepRow.className = "w4-step-row";
  const modes = document.createElement("div");
  modes.className = "axis-modes";
  modes.setAttribute("role", "group");
  modes.setAttribute("aria-label", "Power-iteration step");
  it.steps.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = s.step === it.steps.at(-1).step ? "converged" : `step ${s.step}`;
    btn.dataset.i = String(i);
    btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    modes.append(btn);
  });
  stepRow.append(modes);
  left.append(stepRow);

  const note = document.createElement("p");
  note.className = "w4-step-note";
  note.textContent = `Checked against nx.pagerank: the largest disagreement at the final step is ${it.max_error_vs_nx_pagerank}.`;
  left.append(note);

  const revealsRow = document.createElement("div");
  revealsRow.className = "w4-reveals";
  const howBody = document.createElement("span");
  howBody.append(
    frag(
      "Each step redistributes (1 - d)/n to every occupation, plus d times the score its ties send it, split by " +
        "each neighbour's total tie weight. No dangling-node correction is needed: every occupation in this " +
        "network has at least one tie, unlike a firm-to-client network where one whole side has none.",
    ),
  );
  const moreBody = document.createElement("span");
  const lastStep = it.steps.at(-1).step;
  moreBody.append(
    frag(
      `Run to step ${lastStep}, where every occupation's score matches nx.pagerank's own fixed point within ` +
        `${it.max_error_vs_nx_pagerank}: past that point, one more round would not move the bars a visible amount.`,
    ),
  );
  revealsRow.append(reveal("w4-pop-pagerank-iter-how", "How we tested it", howBody));
  revealsRow.append(reveal("w4-pop-pagerank-iter-more", "More numbers", moreBody));
  left.append(revealsRow);

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Top 10 occupations after this many rounds</h3>
    <p class="axis-note">Same bar chart as P1, redrawn at each power-iteration step for the top 10 at d = ${it.alpha}.</p>`;
  const host = document.createElement("div");
  host.className = "w4-figure-body";
  plot.append(host);

  const drawStep = (i) => {
    const step = it.steps[i];
    const max = Math.max(...step.rows.map((r) => r.pagerank));
    const rows = step.rows.map((r, idx) => ({
      rank: idx + 1,
      label: r.title,
      value: r.pagerank,
      tip: `${r.title}: PageRank ${r.pagerank.toFixed(4)} after step ${step.step}`,
    }));
    host.replaceChildren(hbars(rows, { max, aria: `Top 10 occupations by PageRank after step ${step.step}` }));
  };
  drawStep(0);
  modes.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-i]");
    if (!btn) return;
    for (const b of modes.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === btn));
    drawStep(Number(btn.dataset.i));
  });

  two.append(left, plot);
  article.append(header, two);

  const table = document.createElement("table");
  table.className = "ego";
  table.innerHTML = `
    <caption>The ${data.movers.length} occupations whose rank changes most between d = 0.5 and d = 0.99</caption>
    <thead>
      <tr>
        <th>Occupation</th>
        <th style="text-align: right">Rank at d = 0.5</th>
        <th style="text-align: right">Rank at d = 0.99</th>
        <th style="text-align: right">Shift</th>
        <th style="text-align: right">Degree rank</th>
      </tr>
    </thead>
    <tbody></tbody>`;
  const body = table.querySelector("tbody");
  for (const m of data.movers) {
    const tr = document.createElement("tr");
    const shiftClass = m.rank_shift > 0 ? "up" : "down";
    tr.innerHTML = `
      <td>${m.title}</td>
      <td style="text-align: right">${m.rank_d0_5}</td>
      <td style="text-align: right">${m.rank_d0_99}</td>
      <td style="text-align: right"><span class="w4-rank-shift ${shiftClass}">${m.rank_shift > 0 ? "+" : ""}${m.rank_shift}</span></td>
      <td style="text-align: right">${m.degree_rank}</td>`;
    body.append(tr);
  }
  article.append(table);
  return article;
}

async function render() {
  const body = document.getElementById("pagerank-body");
  const status = document.getElementById("pagerank-status");
  try {
    const data = await load();
    body.replaceChildren(buildDampingCard(data), buildIterationCard(data));
  } catch (err) {
    status.textContent = "Could not load the PageRank explorable.";
    console.error("week04-pagerank", err);
  }
}

function wire() {
  const details = document.getElementById("cut-pagerank");
  if (!details) return;
  let done = false;
  const open = () => {
    if (done || !details.open) return;
    done = true;
    render();
  };
  details.addEventListener("toggle", open);
  open();
}

wire();
