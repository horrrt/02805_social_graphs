// Week 4 redesign · the deep dive's PageRank explorable, #cut-pagerank. Built
// from docs/weeks/week04/data/pagerank.json (analysis/week04_pagerank.py):
// PageRank on section 2's occupation network, kept to its strongest ties (the
// disparity-filter backbone, alpha = 0.05), at three damping factors, plus a
// from-scratch power iteration checked against nx.pagerank. Nothing here is
// computed in the browser; every number comes from that JSON.

import { node, token } from "./week04-strip.js";
import { drawer, drawerRow } from "./week04-ui.js";

const DATA = new URL("../../weeks/week04/data/pagerank.json?v=2", import.meta.url);
const DEFAULT_D = "0.85";
const BAR_W = 556;
const LABEL_W = 300;
const ROW_H = 24;
const TOP_SHOWN = 15;

// Display names for the two titles too long for a label column. Every chart
// keeps the full title in its <title> tooltip.
const SHORT = {
  "Software Quality Assurance Analysts and Testers": "Software QA Analysts and Testers",
  "Medical Scientists, Except Epidemiologists": "Medical Scientists",
};
const short = (title) => SHORT[title] ?? title;

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
    const label = node("text", { x: 0, y: cy + 13, "font-size": 12, fill: token("--ink") }, `${r.rank}. ${r.label}`);
    label.append(node("title", {}, r.tip));
    svg.append(label);
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
      label: short(r.title),
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
    <span class="w4-num">6</span>
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

  const howBody = document.createElement("p");
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
  const moreBody = document.createElement("p");
  const movers = data.movers.slice(0, 4);
  moreBody.textContent = movers.length
    ? `Biggest movers between d = 0.5 and d = 0.99: ${movers
        .map((m) => `${m.title} (rank ${m.rank_d0_5} → ${m.rank_d0_99})`)
        .join("; ")}.`
    : "";
  left.append(drawerRow(drawer("Method", howBody), drawer("More numbers", moreBody)));

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

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const word = (n) => WORDS[n] ?? String(n);

/** What the card claims, all read from it.steps: the round from which the
 * final leader holds first place, the round from which the top 10 holds its
 * final members, and how many of them still change places after that. */
function iterationClaims(it) {
  const codes = (s) => s.rows.map((r) => r.code);
  const leaderStep = stablePoint(it.steps, (s) => s.rows[0].code);
  const setStep = stablePoint(it.steps, (s) => [...codes(s)].sort().join(","));
  const atSet = codes(it.steps.find((s) => s.step === setStep));
  const finalCodes = codes(it.steps.at(-1));
  const lateMovers = finalCodes.filter((code, i) => atSet[i] !== code).length;
  return { leaderStep, setStep, lateMovers, leaderTitle: it.steps.at(-1).rows[0].title };
}

/** A bump chart: rank after each round for the occupations in the final top
 * 10. Round 0 is left out (every score is equal there). A dot on the bottom
 * line means that occupation sat outside the top 10 after that round. */
function bumpChart(it) {
  const steps = it.steps.filter((s) => s.step > 0);
  const final = steps.at(-1).rows;
  const n = final.length;
  const W = 620;
  const LEFT = 34;
  const NAMES_W = 274;
  const TOP = 34;
  const ROW = 25;
  const out = TOP + n * ROW + 6;
  const H = out + 10;
  const xs = steps.map((_, i) => LEFT + (i * (W - LEFT - NAMES_W)) / (steps.length - 1));
  const y = (rank) => TOP + (rank - 1) * ROW;
  const roundLabel = (s, i) => (i === steps.length - 1 ? "final" : i === 0 ? `round ${s.step}` : String(s.step));
  const roundName = (s, i) => (i === steps.length - 1 ? "the final round" : `round ${s.step}`);

  const leader = final[0].code;
  const firstLeader = steps[0].rows[0].code;
  const colour = (code) =>
    code === leader ? token("--w4-accent") : code === firstLeader ? token("--ink") : token("--ink-mute");
  const highlight = (code) => code === leader || code === firstLeader;

  const svg = node("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: W,
    height: H,
    role: "img",
    "aria-label":
      `Rank after each round for the ${n} occupations that finish on top: ${final[0].title} first from round ` +
      `${stablePoint(it.steps, (s) => s.rows[0].code)} on`,
  });
  const muted = token("--ink-mute");
  steps.forEach((s, i) => {
    svg.append(node("text", { x: xs[i], y: 16, "text-anchor": "middle", "font-size": 11, fill: muted }, roundLabel(s, i)));
    svg.append(node("line", { x1: xs[i], x2: xs[i], y1: TOP - 8, y2: out + 4, stroke: token("--w4-grid") }));
  });
  for (let r = 1; r <= n; r++) {
    svg.append(node("text", { x: LEFT - 10, y: y(r) + 4, "text-anchor": "end", "font-size": 10.5, fill: muted }, String(r)));
  }
  svg.append(
    node("text", { x: LEFT - 10, y: out + 4, "text-anchor": "end", "font-size": 10.5, fill: muted, opacity: 0.6 }, `${n + 1}+`),
  );

  // Grey lines first, so the two highlighted ones sit on top.
  const order = [...final].sort((a, b) => highlight(a.code) - highlight(b.code));
  for (const occ of order) {
    const c = colour(occ.code);
    const strong = highlight(occ.code);
    const g = node("g");
    g.append(node("title", {}, `${occ.title}: rank ${final.indexOf(occ) + 1} at the end`));
    const pts = steps.map((s, i) => {
      const at = s.rows.findIndex((r) => r.code === occ.code);
      return { x: xs[i], y: at < 0 ? out : y(at + 1), rank: at < 0 ? null : at + 1, name: roundName(s, i) };
    });
    g.append(
      node("polyline", {
        points: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
        fill: "none",
        stroke: c,
        "stroke-width": strong ? 3 : 1.6,
        "stroke-opacity": strong ? 1 : 0.5,
        "stroke-linejoin": "round",
      }),
    );
    for (const p of pts) {
      const dot = node("circle", {
        cx: p.x.toFixed(1),
        cy: p.y.toFixed(1),
        r: strong ? 3.5 : 2.6,
        fill: p.rank === null ? token("--card") : c,
        stroke: c,
        "stroke-width": 1.5,
      });
      dot.append(
        node(
          "title",
          {},
          p.rank === null
            ? `${occ.title}: outside the top ${n} after ${p.name}`
            : `${occ.title}: rank ${p.rank} after ${p.name}`,
        ),
      );
      g.append(dot);
    }
    const label = node(
      "text",
      {
        x: xs.at(-1) + 12,
        y: y(final.indexOf(occ) + 1) + 4,
        "font-size": 11.5,
        "font-weight": strong ? 700 : 500,
        fill: strong ? c : token("--ink-soft"),
      },
      short(occ.title),
    );
    g.append(label);
    svg.append(g);
  }
  return svg;
}

function buildIterationCard(data) {
  const article = document.createElement("div");
  article.className = "card w4-card";
  article.id = "cut-pagerank-iteration";

  const it = data.iteration;
  const claims = iterationClaims(it);
  const n = it.steps.at(-1).rows.length;
  const late = claims.lateMovers
    ? `, though ${word(claims.lateMovers)} of them still swap places after it`
    : "";

  const header = document.createElement("header");
  header.className = "w4-q";
  header.innerHTML = `
    <span class="w4-num">7</span>
    <div>
      <h2>Stepped one round at a time, how fast does the ranking settle?</h2>
      <p class="w4-answer">${claims.leaderTitle} leads from round ${claims.leaderStep}; the rest of the top ${n} is
      set by round ${claims.setStep}${late}.</p>
    </div>`;

  const two = document.createElement("div");
  two.className = "w4-two";
  const left = document.createElement("div");
  left.innerHTML = `
    <p class="sub">
      Every occupation starts with an equal score, and each round passes it along the network's ties: the same walk
      <span class="w4-term"><button aria-describedby="w4-term-pagerank-iteration" type="button">PageRank</button><span class="w4-pop" id="w4-term-pagerank-iteration" role="tooltip">A score from a random walk along the ties. Here it is computed step by step (power iteration) with damping d = ${it.alpha}, and the walk is stopped after each round.</span></span>
      repeats until nothing moves. The chart follows the ${word(n)} occupations that finish on top.
    </p>`;

  const howBody = document.createElement("div");
  const howCheck = document.createElement("p");
  howCheck.append(
    frag(
      `The rounds use damping d = ${it.alpha}, and the final scores match a standard PageRank calculation within ` +
        `${it.max_error_vs_nx_pagerank}.`,
    ),
  );
  const howStep = document.createElement("p");
  howStep.append(
    frag(
      "Each step redistributes (1 - d)/n to every occupation, plus d times the score its ties send it, split by " +
        "each neighbour's total tie weight. No dangling-node correction is needed: every occupation in this " +
        "network has at least one tie, unlike a firm-to-client network where one whole side has none.",
    ),
  );
  howBody.append(howCheck, howStep);
  const moreBody = document.createElement("p");
  const lastStep = it.steps.at(-1).step;
  moreBody.append(
    frag(
      `Run to step ${lastStep}, where every occupation's score matches nx.pagerank's own fixed point within ` +
        `${it.max_error_vs_nx_pagerank}: past that point, one more round would not change the ranking.`,
    ),
  );
  left.append(drawerRow(drawer("Method", howBody), drawer("More numbers", moreBody)));

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>First place settles by round ${word(claims.leaderStep)}, the top ${n} by round ${word(claims.setStep)}</h3>
    <p class="axis-note">Rank after each round for the ${word(n)} occupations that finish on top. A hollow dot on the
    bottom line means outside the top ${n} at that round.</p>`;
  const host = document.createElement("div");
  host.className = "w4-figure-body";
  host.append(bumpChart(it));
  plot.append(host);

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
    const intro = document.createElement("p");
    intro.className = "w4-box-intro";
    intro.textContent =
      "PageRank scores a node by how often a random walker lands on it: at each step the walker follows a link " +
      "with probability d, the damping factor, and otherwise jumps to a random node. Here it runs on section 2's " +
      "occupation network, kept to its strongest ties.";
    body.replaceChildren(intro, buildDampingCard(data), buildIterationCard(data));
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
