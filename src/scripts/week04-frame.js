// The Week 4 page frame: the section rail, glossary terms, segmented controls,
// table styling and the five findings under the hero. The rail marks the
// section in view and opens its questions. A glossary term opens on hover and
// keyboard focus through CSS, and on click here, for touch and for browsers
// that do not focus a clicked button. Each finding gets a one-row strip of the
// real network against its random baseline, drawn as plain SVG from the
// sections' own data files.

import { asset } from "./site.js";
import { miniStrip, stripChart } from "./week04-strip.js";
import { decorateAll } from "./week04-tables.js";

// ---- the rail

function watchRail() {
  const rail = document.querySelector(".w4-rail");
  if (!rail) return;
  const items = [...rail.querySelectorAll("li[data-target]")];
  const targets = items
    .map((li) => [li, document.getElementById(li.dataset.target)])
    .filter(([, target]) => target);
  // Size the contents panel to the widest label. Which questions are listed
  // depends on the section in view, so the panel is refitted whenever that
  // changes, as well as when it opens.
  const fit = () => {
    const left = rail.getBoundingClientRect().left;
    let right = 0;
    for (const label of rail.querySelectorAll(".w4-rail-label")) {
      if (label.offsetParent) right = Math.max(right, label.getBoundingClientRect().right);
    }
    if (right) rail.style.setProperty("--w4-rail-panel", `${Math.ceil(right - left) + 40}px`);
  };
  let queued = false;
  const mark = () => {
    queued = false;
    const line = window.innerHeight * 0.35;
    let current = null;
    for (const [li, target] of targets) {
      // A closed topic, or a box inside one, has no place on screen to pass.
      if (target.closest("details:not([open])")) continue;
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
    if (rail.matches(":hover, :focus-within")) fit();
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(mark);
  };
  rail.addEventListener("mouseenter", () => requestAnimationFrame(fit));
  rail.addEventListener("focusin", () => requestAnimationFrame(fit));
  document.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  // toggle does not bubble; the capture phase also sees drawers built later.
  document.addEventListener("toggle", queue, true);
  mark();
}

// ---- glossary terms

function wireReveals() {
  const OPEN = ".w4-term.is-open";
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".w4-term > button");
    for (const open of document.querySelectorAll(OPEN)) {
      if (!button || open !== button.parentElement) open.classList.remove("is-open");
    }
    if (button) button.parentElement.classList.toggle("is-open");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const open of document.querySelectorAll(OPEN)) open.classList.remove("is-open");
    // .w4-term:focus-within > .w4-pop still matches after the class is gone, so
    // a term whose button holds focus stays open unless we move focus off it.
    const active = document.activeElement;
    if (active && active.closest(".w4-term")) active.blur();
  });
}

// ---- segmented controls

// Every segmented control on the page, whichever script owns it. Tab reaches
// the group once, on its pressed option; the arrow keys, Home and End move to
// another option and press it. Each owner sets aria-pressed itself, so one
// observer keeps the tab stops in step.
const SEGMENTS = ".rx-seg, .axis-modes, .staffing-years";

function segmentButtons(group) {
  return [...group.querySelectorAll("button")].filter((b) => !b.disabled && !b.hidden);
}

function syncSegments(root) {
  for (const group of root.querySelectorAll(SEGMENTS)) {
    const buttons = segmentButtons(group);
    const pressed = buttons.find((b) => b.getAttribute("aria-pressed") === "true") || buttons[0];
    for (const b of buttons) b.tabIndex = b === pressed ? 0 : -1;
  }
}

function wireSegments(root) {
  if (!root) return;
  const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);
  root.addEventListener("keydown", (event) => {
    if (!KEYS.has(event.key)) return;
    const group = event.target.closest(SEGMENTS);
    if (!group || event.target.tagName !== "BUTTON") return;
    const buttons = segmentButtons(group);
    const i = buttons.indexOf(event.target);
    if (i < 0 || !buttons.length) return;
    const n = buttons.length;
    const next = {
      ArrowLeft: buttons[(i - 1 + n) % n],
      ArrowRight: buttons[(i + 1) % n],
      Home: buttons[0],
      End: buttons[n - 1],
    }[event.key];
    event.preventDefault();
    next.focus();
    next.click();
  });
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      syncSegments(root);
    });
  }).observe(root, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"], childList: true });
  syncSegments(root);
}

// ---- the five findings

const DATA = {
  place: asset("assets/data/week04_place.json"),
  jobs: asset("weeks/week04/data/jobs.json"),
  moves: asset("weeks/week04/data/staffing_moves.json"),
  footprint: asset("weeks/week04/data/footprint.json"),
  beyond: asset("weeks/week04/data/beyond.json"),
};

const load = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url.pathname} ${r.status}`);
    return r.json();
  });

const pct = (x) => `${Math.round(x * 100)}%`;

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

// ---- figures beside the section openers

async function drawOpeners() {
  const host = document.querySelector('[data-strip="place-modularity"]');
  if (!host) return;
  const place = await load(DATA.place);
  const q = place.null_model;
  host.replaceChildren(
    stripChart(
      [
        {
          label: "Modularity",
          sub: `${place.cities.length} metros, ${q.communities} groups`,
          real: q.Q,
          realLabel: q.Q.toFixed(3),
          realTip: `The real network: ${q.Q.toFixed(3)}`,
          base: [q.Q_null_mean, q.Q_null_std],
          baseLabel: `rewired ${q.Q_null_mean.toFixed(3)} ± ${q.Q_null_std.toFixed(4)}`,
          baseTip: `Rewired networks: mean ${q.Q_null_mean.toFixed(3)}, sd ${q.Q_null_std.toFixed(4)}`,
          badge: `z = ${Math.round(q.z)}`,
        },
      ],
      {
        domain: [0, 0.06],
        ticks: [0, 0.02, 0.04, 0.06],
        fmt: (v) => v.toFixed(2),
        labelW: 132,
        badgeW: 66,
        aria: "Modularity of the metro groups against rewired networks",
      },
    ),
  );
}

const main = document.querySelector("main");
watchRail();
wireReveals();
wireSegments(main);
decorateAll(main);
drawFindings().catch((err) => console.error("findings", err));
drawOpeners().catch((err) => console.error("openers", err));
