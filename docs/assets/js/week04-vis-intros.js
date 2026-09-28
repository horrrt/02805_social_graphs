// Figures for the section intros that have no chart of their own, and the
// closing's visual recap. Each one is drawn from the same JSON the section's
// own cards already read, in the page's one chart grammar: dark ink the real
// network, the grey band a random baseline, orange a worker placed at a
// client, blue a direct employer. Plain SVG, coloured from CSS tokens.

import { miniStrip, stripChart, node, token } from "./week04-strip.js";

const load = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url.pathname} ${r.status}`);
    return r.json();
  });

const num = (n) => n.toLocaleString("en-US");
const pct = (x, digits = 0) => `${(x * 100).toFixed(digits)}%`;

const DATA = {
  jobs: new URL("../../weeks/week04/data/jobs.json?v=2", import.meta.url),
  communities: new URL("../../weeks/week04/data/staffing_communities.json", import.meta.url),
  clients: new URL("../../weeks/week04/data/staffing_clients.json", import.meta.url),
  moves: new URL("../../weeks/week04/data/staffing_moves.json", import.meta.url),
  beyond: new URL("../../weeks/week04/data/beyond.json", import.meta.url),
  place: new URL("../data/week04_place.json", import.meta.url),
  footprint: new URL("../../weeks/week04/data/footprint.json?v=2", import.meta.url),
  whereWho: new URL("../../weeks/week04/data/where_who.json", import.meta.url),
};

/** A plain HTML element: node() from week04-strip.js is SVG-namespaced, wrong for a wrapper div. */
function html(name, attrs = {}) {
  const el = document.createElement(name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

/** One labelled row for a summary figure: a small heading above a miniStrip and a caption below. */
function stripRow(label, spec, note) {
  const row = html("div", { class: "w4-mini-row" });
  const h = html("p", { class: "w4-mini-label" });
  h.textContent = label;
  row.append(h);
  row.append(miniStrip(spec));
  if (note) {
    const small = html("small");
    small.textContent = note;
    row.append(small);
  }
  return row;
}

// ---- section 2 · which jobs go together --------------------------------

async function drawJobsIntro() {
  const host = document.querySelector('[data-strip="jobs-modularity"]');
  if (!host) return;
  const jobs = await load(DATA.jobs);
  const q = jobs.quality.null;
  host.replaceChildren(
    stripChart(
      [
        {
          label: "Modularity",
          sub: `${num(jobs.meta.occupations)} occupations, ${num(jobs.quality.louvain.clusters)} clusters`,
          real: q.real,
          realLabel: q.real.toFixed(2),
          realTip: `The real network: ${q.real.toFixed(2)}`,
          base: [q.null, q.null_sd],
          baseLabel: `rewired ${q.null.toFixed(2)}`,
          baseTip: `Rewired networks: mean ${q.null.toFixed(2)}, sd ${q.null_sd.toFixed(4)}`,
          badge: `z = ${Math.round(q.z)}`,
        },
      ],
      {
        domain: [0, 0.35],
        ticks: [0, 0.1, 0.2, 0.3],
        fmt: (v) => v.toFixed(1),
        labelW: 132,
        badgeW: 66,
        aria: "Modularity of the occupation clusters against rewired networks",
      },
    ),
  );
}

// ---- section 3 · who staffs whom ---------------------------------------

/** The name that best splits into two roughly even lines, for a label inside a circle. */
function twoLines(name) {
  const words = name.split(" ");
  if (words.length < 2) return [name, ""];
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < words.length - 1; i++) {
    const line1 = words.slice(0, i + 1).join(" ");
    const line2 = words.slice(i + 1).join(" ");
    const diff = Math.abs(line1.length - line2.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best + 1).join(" "), words.slice(best + 1).join(" ")];
}

/** A name cut to fit inside the client's circle; the full name stays in the caption and the label. */
const cut = (s) => (s.length > 13 ? `${s.slice(0, 12)}…` : s);

/** An ego diagram: the firms that staff one client, vendors on the left, the client on the right. */
function egoDiagram(client, firmNames, year) {
  const rows = client.top.slice(0, 8).map(([i, n]) => [firmNames[i], n]);
  const restFirms = client.vendors - rows.length;
  if (restFirms > 0) rows.push([`${num(restFirms)} other firms`, client.rest]);
  const w = 460;
  const h = 220;
  const top = 14;
  const gap = rows.length > 1 ? (h - 2 * top) / (rows.length - 1) : 0;
  const cx = w - 62;
  const cy = h / 2;
  const xEnd = 200;
  // A long firm name and its filing count must never touch: compress the name
  // to fit the space left of the count's column when it would run into it.
  const maxNameWidth = xEnd - 8 - 44;
  const estCharW = 12 * 0.56;
  const vmax = Math.max(...rows.map(([, n]) => n));
  const placed = token("--w4-placed");
  const ink = token("--ink");
  const inkSoft = token("--ink-soft");
  const card = token("--card");
  const svg = node("svg", {
    viewBox: `0 0 ${w} ${h}`,
    width: w,
    height: h,
    role: "img",
    "aria-label": `${client.name} and the ${num(client.vendors)} firms that place H-1B workers there in ${year}`,
    class: "w4-ego",
  });
  rows.forEach(([name, n], i) => {
    const y = top + i * gap;
    const other = i === rows.length - 1 && restFirms > 0;
    const sw = 1 + 9 * (n / vmax);
    const path = node("path", {
      d: `M${xEnd} ${y.toFixed(1)} C${xEnd + 90} ${y.toFixed(1)} ${cx - 90} ${cy.toFixed(1)} ${cx - 28} ${cy.toFixed(1)}`,
      fill: "none",
      stroke: placed,
      "stroke-width": sw.toFixed(1),
      opacity: other ? 0.3 : 0.62,
    });
    path.append(node("title", {}, `${name}: ${num(n)} filings`));
    svg.append(path);
    const nameAttrs = { x: 0, y: y + 4, "font-size": 12, fill: other ? inkSoft : ink, "font-weight": other ? 400 : 600 };
    if (name.length * estCharW > maxNameWidth) {
      nameAttrs.textLength = maxNameWidth;
      nameAttrs.lengthAdjust = "spacingAndGlyphs";
    }
    const nameText = node("text", nameAttrs, name);
    nameText.append(node("title", {}, name));
    svg.append(nameText);
    svg.append(node("text", { x: xEnd - 8, y: y + 4, "font-size": 12, fill: inkSoft, "font-weight": 600, "text-anchor": "end" }, num(n)));
  });
  svg.append(node("circle", { cx, cy, r: 28, fill: ink }));
  const [line1, line2] = twoLines(client.name).map(cut);
  svg.append(node("text", { x: cx, y: line2 ? cy - 3 : cy + 4, "font-size": 10.5, fill: card, "font-weight": 700, "text-anchor": "middle" }, line1));
  if (line2) svg.append(node("text", { x: cx, y: cy + 11, "font-size": 10.5, fill: card, "font-weight": 700, "text-anchor": "middle" }, line2));
  svg.append(node("text", { x: cx, y: cy + 48, "font-size": 11.5, fill: ink, "font-weight": 700, "text-anchor": "middle" }, `${num(client.filings)} filings`));
  return svg;
}

async function drawWhoIntro() {
  const modHost = document.querySelector('[data-strip="who-modularity"]');
  const egoHost = document.querySelector('[data-strip="who-ego"]');
  if (!modHost && !egoHost) return;
  const [communities, clients] = await Promise.all([load(DATA.communities), load(DATA.clients)]);
  if (modHost) {
    const wo = communities.modularity.wiring_only;
    const iv = communities.industry_or_vendor.unweighted;
    modHost.replaceChildren(
      stripChart(
        [
          {
            label: "Modularity",
            sub: "each link counted once",
            real: wo.real,
            realLabel: wo.real.toFixed(2),
            base: [wo.null, wo.null_sd],
            baseLabel: `rewired ${wo.null.toFixed(2)}`,
            badge: `z = ${Math.round(wo.z)}`,
          },
          {
            label: "Matches main vendor",
            sub: "AMI, clients with 2+ vendors",
            real: iv.ami_community_main_vendor_same_clients,
            realLabel: iv.ami_community_main_vendor_same_clients.toFixed(2),
            divider: true,
          },
          {
            label: "Matches industry",
            sub: "AMI, same clients",
            real: iv.ami_community_industry,
            realLabel: iv.ami_community_industry.toFixed(2),
          },
        ],
        {
          domain: [0, 0.8],
          ticks: [0, 0.2, 0.4, 0.6, 0.8],
          fmt: (v) => v.toFixed(1),
          labelW: 168,
          badgeW: 60,
          aria: "Modularity against rewired networks, and how well the groups match vendor and industry",
        },
      ),
    );
  }
  if (egoHost) egoExplorer(egoHost, clients);
}

/** The client the board opened on, shown whenever the year has it. */
const EGO_DEFAULT = "Bank of America";

/**
 * The ego diagram with its controls: a year toggle built from the JSON's
 * years and a search over that year's clients. The picked client stays when
 * the year changes if it is there; otherwise the year's largest client shows.
 */
function egoExplorer(host, clients) {
  const years = Object.keys(clients.years).sort();
  const partial = (y) => clients.years[y].months < 12;
  const yearLabel = (y) => (partial(y) ? `${y} · Oct–Jun` : y);
  const largest = (y) => clients.years[y].shown.reduce((a, b) => (b.filings > a.filings ? b : a));
  const find = (y, name) => clients.years[y].shown.find((c) => c.name === name);
  const full = years.filter((y) => !partial(y));
  let year = full.length ? full[full.length - 1] : years[years.length - 1];
  let client = find(year, EGO_DEFAULT) || largest(year);

  const ctrl = html("div", { class: "rx-ego-ctrl" });
  const seg = html("div", { class: "rx-seg", role: "group", "aria-label": "Year" });
  for (const y of years) {
    const btn = html("button", { type: "button", "aria-pressed": String(y === year), "data-year": y });
    btn.textContent = yearLabel(y);
    btn.addEventListener("click", () => {
      year = y;
      client = find(year, client.name) || largest(year);
      for (const b of seg.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === btn));
      update();
      if (input.value.trim()) listMatches();
    });
    seg.append(btn);
  }
  const label = html("label", { class: "rx-ego-search" });
  const labelText = html("span");
  labelText.textContent = "Client";
  const input = html("input", {
    type: "search",
    placeholder: "Type any client, e.g. Apple",
    "aria-label": "Find a client",
    "aria-controls": "who-ego-matches",
    "aria-expanded": "false",
    autocomplete: "off",
  });
  label.append(labelText, input);
  ctrl.append(seg, label);

  const matches = html("div", { class: "rx-ego-matches", id: "who-ego-matches", role: "group", "aria-label": "Matching clients" });
  const none = html("p", { class: "rx-ego-none", "aria-live": "polite" });
  const chart = html("div");
  host.replaceChildren(ctrl, matches, none, chart);
  const caption = host.closest("figure")?.querySelector("figcaption span");

  function update() {
    chart.replaceChildren(egoDiagram(client, clients.firms, year));
    if (caption) {
      const when = partial(year) ? `${year} (October to June only)` : year;
      caption.textContent = `${client.name}'s largest staffing firms by filings in ${when}, ${num(client.vendors)} firms in all; link width is filings placed there. Pick a year or type any client.`;
    }
  }

  // The stylesheet gives both boxes a display, which beats the hidden attribute.
  const show = (el, on) => {
    el.style.display = on ? "" : "none";
  };

  function closeMatches() {
    matches.replaceChildren();
    show(matches, false);
    none.textContent = "";
    show(none, false);
    input.setAttribute("aria-expanded", "false");
  }

  function pick(c) {
    client = c;
    input.value = "";
    closeMatches();
    update();
    input.focus();
  }

  function listMatches() {
    const q = input.value.trim().toLowerCase();
    if (!q) return closeMatches();
    const found = clients.years[year].shown
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => b.name.toLowerCase().startsWith(q) - a.name.toLowerCase().startsWith(q) || b.filings - a.filings)
      .slice(0, 6);
    matches.replaceChildren(
      ...found.map((c) => {
        const btn = html("button", { type: "button" });
        const n = html("span");
        n.textContent = num(c.filings);
        btn.append(c.name, n);
        btn.addEventListener("click", () => pick(c));
        return btn;
      }),
    );
    show(matches, found.length > 0);
    input.setAttribute("aria-expanded", String(found.length > 0));
    show(none, !found.length);
    none.textContent = found.length ? "" : `No client with ${num(clients.min_filings)} or more placed filings matches in ${yearLabel(year)}.`;
  }

  input.addEventListener("input", listMatches);
  input.addEventListener("keydown", (e) => {
    const first = matches.querySelector("button");
    if (e.key === "ArrowDown" && first) {
      e.preventDefault();
      first.focus();
    } else if (e.key === "Enter" && first) {
      e.preventDefault();
      first.click();
    } else if (e.key === "Escape") {
      e.preventDefault();
      input.value = "";
      closeMatches();
    }
  });
  matches.addEventListener("keydown", (e) => {
    const buttons = [...matches.querySelectorAll("button")];
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = i + (e.key === "ArrowDown" ? 1 : -1);
      (next < 0 ? input : buttons[Math.min(next, buttons.length - 1)]).focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      input.value = "";
      closeMatches();
      input.focus();
    }
  });

  closeMatches();
  update();
}

// ---- section 5 · beyond the three networks -----------------------------

async function drawBeyondIntro() {
  const host = document.querySelector('[data-strip="beyond-summary"]');
  if (!host) return;
  const beyond = await load(DATA.beyond);
  const f = beyond.finding;
  const wrap = html("div", { class: "w4-mini-stack" });
  wrap.append(
    stripRow(
      "5A · Law firms",
      {
        domain: [0, 0.05],
        real: f.q1_ami,
        realLabel: f.q1_ami.toFixed(3),
        base: [f.q1_ami_rewired_mean, f.q1_ami_rewired_sd],
        baseLabel: `rewired ${f.q1_ami_rewired_mean.toFixed(3)}`,
        aria: "AMI of the law-firm groups with the section 3 groups, against rewired networks",
      },
      `AMI against rewired networks · z = ${Math.round(f.q1_ami_z_vs_rewired)}`,
    ),
  );
  wrap.append(
    stripRow(
      "5B · Green cards",
      {
        domain: [0, 0.25],
        real: f.q2_placing_pooled_ratio,
        realLabel: f.q2_placing_pooled_ratio.toFixed(2),
        ci: f.q2_direct_pooled_ci95,
        aria: "Green cards per H-1B filing for outsourcing firms, against direct employers' 95% interval",
      },
      `Per H-1B filing · bracket: direct employers' 95% interval, ${f.q2_direct_pooled_ratio.toFixed(2)}`,
    ),
  );
  wrap.append(
    stripRow(
      "5C · Wage levels",
      {
        domain: [0, 6],
        real: f.q3_odds_ratio,
        realLabel: `${f.q3_odds_ratio.toFixed(1)}×`,
        ref: 1,
        refLabel: "1 = same odds",
        ci: f.q3_odds_ratio_cluster_ci95,
        aria: "Odds of a low wage level, placed against direct filings for the same job",
      },
      "Odds of wage level I or II, same job · 95% interval",
    ),
  );
  host.replaceChildren(wrap);
}

// ---- closing · what surprised us ----------------------------------------
// Two statements, each with its evidence: vendor switches against a random
// vendor, and the backbone losing metros one or two at a time as α tightens.

function backboneSteps(sweep, { lo, hi }) {
  const W = 470;
  const H = 150;
  const L = 34;
  const R = 10;
  const T = 14;
  const B = 30;
  const lx0 = Math.log10(0.004);
  const lx1 = Math.log10(1);
  const X = (a) => L + ((Math.log10(Math.max(a, 0.004)) - lx0) * (W - L - R)) / (lx1 - lx0);
  const Y = (v) => T + ((40 - v) * (H - T - B)) / 40;
  const ink = token("--ink");
  const mute = token("--ink-mute");
  const soft = token("--ink-soft");
  const grid = token("--line");
  const band = token("--line-soft");
  const svg = node("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: W,
    height: H,
    role: "img",
    "aria-label": `Metros in the largest connected piece as the disparity filter tightens: it falls in small steps, with no single drop between α = ${hi} and ${lo}`,
  });
  svg.append(node("rect", { x: X(lo), y: T, width: X(hi) - X(lo), height: H - T - B, fill: band }));
  for (const v of [0, 20, 40]) {
    svg.append(node("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: grid, "stroke-width": 1 }));
    svg.append(node("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end", "font-size": 11, fill: mute }, String(v)));
  }
  const pts = sweep.map((p) => [Math.max(p.alpha, 0.004), p.gc_size]).sort((a, b) => b[0] - a[0]);
  let d = `M${X(pts[0][0]).toFixed(1)} ${Y(pts[0][1]).toFixed(1)}`;
  let prev = pts[0][1];
  for (const [a, size] of pts.slice(1)) {
    d += ` L${X(a).toFixed(1)} ${Y(prev).toFixed(1)} L${X(a).toFixed(1)} ${Y(size).toFixed(1)}`;
    prev = size;
  }
  const line = node("path", { d, fill: "none", stroke: ink, "stroke-width": 2 });
  line.append(node("title", {}, "Metros still connected at each α; every step is one link removed"));
  svg.append(line);
  for (const [a, label] of [[0.01, "0.01"], [0.1, "0.1"], [1, "1"]]) {
    svg.append(node("text", { x: X(a), y: H - B + 16, "text-anchor": "middle", "font-size": 11, fill: mute }, label));
  }
  svg.append(node("text", { x: W - R, y: H - 4, "text-anchor": "end", "font-size": 11, fill: mute }, "α, disparity filter →"));
  svg.append(node("text", { x: (X(lo) + X(hi)) / 2, y: T + 12, "text-anchor": "middle", "font-size": 10.5, "font-weight": 700, fill: soft }, `α ${lo}–${hi}`));
  svg.append(node("text", { x: L, y: T - 3, "font-size": 10.5, fill: mute }, "metros connected"));
  return svg;
}

async function drawClosingSurprises() {
  const switches = document.querySelector('[data-strip="closing-switches"]');
  const backbone = document.querySelector('[data-strip="closing-backbone"]');
  if (!switches && !backbone) return;
  const [moves, whereWho] = await Promise.all([load(DATA.moves), load(DATA.whereWho)]);
  const f = moves.finding;
  switches?.replaceChildren(
    miniStrip({
      domain: [0, 0.3],
      real: f.q1_pooled_observed_share,
      realLabel: pct(f.q1_pooled_observed_share, 1),
      base: [f.q1_pooled_null_mean, f.q1_pooled_null_sd],
      baseLabel: `random vendor ${pct(f.q1_pooled_null_mean, 1)}`,
      aria: "Vendor switches that stay in the client's group, against a random vendor",
      width: 440,
    }),
  );
  backbone?.replaceChildren(backboneSteps(whereWho.backbone_sweep, { lo: 0.05, hi: 0.1 }));
}

// ---- closing · a compact recap of the five sections --------------------

async function drawClosingRecap() {
  const host = document.querySelector('[data-strip="closing-recap"]');
  if (!host) return;
  const [place, jobs, moves, footprint, beyond] = await Promise.all(
    [DATA.place, DATA.jobs, DATA.moves, DATA.footprint, DATA.beyond].map(load),
  );
  const q = place.null_model;
  const jq = jobs.quality;
  const f = moves.finding;
  const variant = Object.fromEntries(footprint.metros.variants.map((v) => [v.id, v]));
  const drop = variant.drop_top10_filings;
  const control = variant.control_top10_filings;
  const full = variant.full;
  const odds = beyond.q3;
  const wrap = html("div", { class: "w4-mini-stack" });
  wrap.append(
    stripRow(
      "1 · Where the hiring is",
      {
        domain: [0, 0.06],
        real: q.Q,
        realLabel: q.Q.toFixed(3),
        base: [q.Q_null_mean, q.Q_null_std],
        baseLabel: `rewired ${q.Q_null_mean.toFixed(3)}`,
        aria: "Modularity of the metro network against rewired networks",
      },
      `Modularity against rewired networks · z = ${Math.round(q.z)}`,
    ),
  );
  wrap.append(
    stripRow(
      "2 · Which jobs go together",
      {
        domain: [0, 0.35],
        real: jq.louvain.modularity_mean,
        realLabel: jq.louvain.modularity_mean.toFixed(2),
        base: [jq.null.null, jq.null.null_sd],
        baseLabel: `rewired ${jq.null.null.toFixed(2)}`,
        aria: "Modularity of the occupation network against rewired networks",
      },
      `Modularity against rewired networks · z = ${Math.round(jq.null.z)}`,
    ),
  );
  wrap.append(
    stripRow(
      "3 · Who staffs whom",
      {
        domain: [0, 0.3],
        real: f.q1_pooled_observed_share,
        realLabel: pct(f.q1_pooled_observed_share),
        base: [f.q1_pooled_null_mean, f.q1_pooled_null_sd],
        baseLabel: `random vendor ${pct(f.q1_pooled_null_mean)}`,
        aria: "Share of vendor switches that stay inside the client's group",
      },
      `Vendor switches that stay in the group · z = ${Math.round(f.q1_pooled_z)}`,
    ),
  );
  wrap.append(
    stripRow(
      "4 · Where the footprint sits",
      {
        domain: [-0.03, 0.2],
        real: drop.ami_region,
        realLabel: drop.ami_region.toFixed(2),
        base: [control.ami_region, control.ami_region_sd],
        baseLabel: "random cuts",
        ref: full.ami_region,
        refLabel: "all firms",
        aria: "Match with Census regions without the ten largest filers",
      },
      `Match with Census regions, ten largest filers dropped · dashed: all firms, ${full.ami_region.toFixed(2)}`,
    ),
  );
  wrap.append(
    stripRow(
      "5 · Beyond the three networks",
      {
        domain: [0, 6],
        real: odds.mantel_haenszel_odds_ratio,
        realLabel: `${odds.mantel_haenszel_odds_ratio.toFixed(1)}×`,
        ref: 1,
        refLabel: "1 = same odds",
        ci: odds.odds_ratio_cluster_ci95,
        aria: "Odds of a low wage level, placed against direct filings",
      },
      "Odds of wage level I or II, placed against direct, same job · 95% interval",
    ),
  );
  host.replaceChildren(wrap);
}

drawJobsIntro().catch((err) => console.error("jobs intro", err));
drawWhoIntro().catch((err) => console.error("who intro", err));
drawBeyondIntro().catch((err) => console.error("beyond intro", err));
drawClosingRecap().catch((err) => console.error("closing recap", err));
drawClosingSurprises().catch((err) => console.error("closing surprises", err));
