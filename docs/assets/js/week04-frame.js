// The Week 4 page frame: the section rail, the reveal buttons and the five
// findings under the hero. The rail marks the section in view and opens its
// questions. Reveal buttons open on hover and keyboard focus through CSS, and
// on click here, for touch and for browsers that do not focus a clicked
// button. Each finding gets a one-row strip of the real network against its
// random baseline, drawn as plain SVG from the sections' own data files.

const css = getComputedStyle(document.body);
const token = (name) => css.getPropertyValue(name).trim();
const SVG = "http://www.w3.org/2000/svg";

// ---- the rail

function watchRail() {
  const rail = document.querySelector(".w4-rail");
  if (!rail) return;
  const items = [...rail.querySelectorAll("li[data-target]")];
  const targets = items
    .map((li) => [li, document.getElementById(li.dataset.target)])
    .filter(([, target]) => target);
  let queued = false;
  const mark = () => {
    queued = false;
    const line = window.innerHeight * 0.35;
    let current = null;
    for (const [li, target] of targets) {
      if (target.getBoundingClientRect().top <= line) current = li;
    }
    for (const li of items) {
      li.classList.remove("is-current");
      li.querySelector(":scope > a").removeAttribute("aria-current");
    }
    for (let li = current; li; li = li.parentElement.closest("li[data-target]")) {
      li.classList.add("is-current");
      li.querySelector(":scope > a").setAttribute("aria-current", "true");
    }
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(mark);
  };
  document.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  mark();
}

// ---- reveal buttons and glossary terms

function wireReveals() {
  const OPEN = ".w4-tip.is-open, .w4-term.is-open";
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".w4-tip > button, .w4-term > button");
    for (const open of document.querySelectorAll(OPEN)) {
      if (!button || open !== button.parentElement) open.classList.remove("is-open");
    }
    if (button) button.parentElement.classList.toggle("is-open");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const open of document.querySelectorAll(OPEN)) open.classList.remove("is-open");
  });
}

// ---- the five findings

const DATA = {
  place: new URL("../data/week04_place.json", import.meta.url),
  jobs: new URL("../../weeks/week04/data/jobs.json", import.meta.url),
  moves: new URL("../../weeks/week04/data/staffing_moves.json", import.meta.url),
  footprint: new URL("../../weeks/week04/data/footprint.json", import.meta.url),
  beyond: new URL("../../weeks/week04/data/beyond.json", import.meta.url),
};

const load = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url.pathname} ${r.status}`);
    return r.json();
  });

const pct = (x) => `${Math.round(x * 100)}%`;

function node(name, attrs = {}, text = null) {
  const el = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  if (text !== null) el.textContent = text;
  return el;
}

/** One row without an axis: the real value as a dot, the baseline as a band. */
function miniStrip({ domain, real, realLabel, base, baseLabel, ref, refLabel, ci, aria }) {
  const w = 300;
  const h = 58;
  const x0 = 6;
  const x1 = w - 6;
  const cy = 28;
  const [d0, d1] = domain;
  const X = (v) => x0 + ((Math.min(Math.max(v, d0), d1) - d0) * (x1 - x0)) / (d1 - d0);
  const svg = node("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: "img", "aria-label": aria });
  // A label centred on x, kept inside the strip.
  const label = (x, y, text, { size = 11, fill = token("--ink-soft"), weight = 400 } = {}) => {
    const half = (text.length * size * 0.56) / 2;
    const anchor = x - half < 0 ? "start" : x + half > w ? "end" : "middle";
    const at = anchor === "start" ? 0 : anchor === "end" ? w : x;
    return node("text", { x: at, y, "font-size": size, fill, "font-weight": weight, "text-anchor": anchor }, text);
  };
  svg.append(node("line", { x1: x0, y1: cy, x2: x1, y2: cy, stroke: token("--line"), "stroke-width": 1 }));
  if (base) {
    const [mean, sd] = base;
    let lo = X(mean - sd);
    let hi = X(mean + sd);
    if (hi - lo < 4) {
      const mid = (lo + hi) / 2;
      lo = mid - 2;
      hi = mid + 2;
    }
    svg.append(node("rect", { x: lo, y: cy - 6, width: hi - lo, height: 12, rx: 6, fill: token("--w4-band") }));
    svg.append(node("line", { x1: X(mean), y1: cy - 9, x2: X(mean), y2: cy + 9, stroke: token("--ink-mute"), "stroke-width": 2 }));
    if (baseLabel) svg.append(label(X(mean), cy + 24, baseLabel));
  }
  if (ref !== undefined) {
    svg.append(
      node("line", {
        x1: X(ref),
        y1: cy - 11,
        x2: X(ref),
        y2: cy + 11,
        stroke: token("--ink-soft"),
        "stroke-width": 1.3,
        "stroke-dasharray": "3 2",
      }),
    );
    if (refLabel) svg.append(label(X(ref), cy + 24, refLabel));
  }
  if (ci) {
    const [lo, hi] = ci;
    const ink = { stroke: token("--ink"), "stroke-width": 2 };
    svg.append(node("line", { x1: X(lo), y1: cy, x2: X(hi), y2: cy, ...ink }));
    svg.append(node("line", { x1: X(lo), y1: cy - 5, x2: X(lo), y2: cy + 5, ...ink }));
    svg.append(node("line", { x1: X(hi), y1: cy - 5, x2: X(hi), y2: cy + 5, ...ink }));
  }
  svg.append(node("circle", { cx: X(real), cy, r: 6.5, fill: token("--ink"), stroke: token("--card"), "stroke-width": 2 }));
  svg.append(label(X(real), cy - 13, realLabel, { size: 12, fill: token("--ink"), weight: 700 }));
  return svg;
}

async function drawFindings() {
  const hosts = document.querySelectorAll("[data-finding]");
  if (!hosts.length) return;
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
  const strips = {
    1: [
      {
        domain: [0, 0.06],
        real: q.Q,
        realLabel: q.Q.toFixed(3),
        base: [q.Q_null_mean, q.Q_null_std],
        baseLabel: `rewired ${q.Q_null_mean.toFixed(3)}`,
        aria: "Modularity of the metro network against rewired networks",
      },
      `Modularity against rewired networks · z = ${Math.round(q.z)}`,
    ],
    2: [
      {
        domain: [0, 0.35],
        real: jq.louvain.modularity_mean,
        realLabel: jq.louvain.modularity_mean.toFixed(2),
        base: [jq.null.null, jq.null.null_sd],
        baseLabel: `rewired ${jq.null.null.toFixed(2)}`,
        aria: "Modularity of the occupation network against rewired networks",
      },
      `Modularity against rewired networks · z = ${Math.round(jq.null.z)}`,
    ],
    3: [
      {
        domain: [0, 0.3],
        real: f.q1_pooled_observed_share,
        realLabel: pct(f.q1_pooled_observed_share),
        base: [f.q1_pooled_null_mean, f.q1_pooled_null_sd],
        baseLabel: `random vendor ${pct(f.q1_pooled_null_mean)}`,
        aria: "Share of vendor switches that stay inside the client's group",
      },
      `Vendor switches that stay in the group · z = ${Math.round(f.q1_pooled_z)}`,
    ],
    4: [
      {
        domain: [-0.03, 0.2],
        real: drop.ami_region,
        realLabel: drop.ami_region.toFixed(2),
        base: [control.ami_region, control.ami_region_sd],
        baseLabel: "random cuts",
        ref: full.ami_region,
        aria: "Match with Census regions without the ten largest filers",
      },
      `Match with Census regions without the ten largest filers · dashed: all firms, ${full.ami_region.toFixed(2)}`,
    ],
    5: [
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
    ],
  };
  for (const host of hosts) {
    const [spec, note] = strips[host.dataset.finding];
    const small = document.createElement("small");
    small.textContent = note;
    host.replaceChildren(miniStrip(spec), small);
  }
}

watchRail();
wireReveals();
drawFindings().catch((err) => console.error("findings", err));
