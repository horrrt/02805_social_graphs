// Page chrome for week 4: the deep-dive router and the top bar.
//
// The deep dive is a catalogue of topics. Each topic is a closed
// <details class="rx-topic" name="w4-topic">, and each box inside it a
// <details class="rx-panel" name="w4-panel-…">, so one topic and one box per
// topic show at a time. A link to a box, from the catalogue, a topic's
// contents, the rail or another page, opens the topic and the box and scrolls
// there. Old anchors from before the topics still land on their box.
// A chart drawn while its box is closed has no width, so opening any
// <details> fires a resize for every chart on the page.

// Anchors that the topics retired, and where each one now leads.
const ALIAS = {
  "cut-place": "topic-where",
  "cut-jobs": "topic-jobs",
  "cut-who": "topic-outsourcing",
  "cut-more": "cut",
  "who-first-round": "who-q2",
  "place-inspector": "place-start",
};

// Boxes that scripts build inside one panel, and which one the panel shows.
const SUB = {
  "cut-skills-direct": ["cut-skills", "direct"],
  "cut-skills-cluster": ["cut-skills", "cluster"],
  "cut-skills-radar": ["cut-skills", "radar"],
  "cut-pagerank-explore": ["cut-pagerank", "explore"],
  "cut-pagerank-iteration": ["cut-pagerank", "iteration"],
};

// The four method tabs, all inside the one #cut-methods panel.
const METHOD = {
  "w4m-panel-gn": "gn",
  "w4m-panel-mod": "mod",
  "w4m-panel-louvain": "louvain",
  "w4m-panel-overlap": "overlap",
};

const $ = (id) => document.getElementById(id);

// Open `el` if it is a <details>, then every <details> around it, inside out.
function openAround(el) {
  let opened = false;
  for (let d = el.tagName === "DETAILS" ? el : el.parentElement; d; d = d.parentElement) {
    if (d.tagName === "DETAILS" && !d.open) {
      d.open = true;
      opened = true;
    }
  }
  return opened;
}

// Which box a contents or catalogue entry points at.
function entryId(a) {
  return a.dataset.target || decodeURIComponent(a.hash.slice(1));
}

// The method tab showing now, or the one asked for before the tabs were built.
function currentMethod() {
  const pressed = document.querySelector('.w4m-tab[aria-pressed="true"]');
  const root = $("w4m-root");
  if (root && !root.hidden && pressed) return pressed.dataset.panel;
  return (root && root.dataset.want) || "gn";
}

// Is the box behind a contents entry the one on show?
function isShowing(id) {
  if (SUB[id]) {
    const [panelId, show] = SUB[id];
    const panel = $(panelId);
    return !!panel && panel.open && panel.dataset.show === show;
  }
  if (METHOD[id]) {
    const panel = $("cut-methods");
    return !!panel && panel.open && currentMethod() === METHOD[id];
  }
  const el = $(id);
  const panel = el && el.closest("details.rx-panel");
  return !!panel && panel.open;
}

// Mark the contents entry of the box on show, in every topic.
function syncContents() {
  for (const a of document.querySelectorAll("a.rx-toc-item")) {
    if (isShowing(entryId(a))) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  }
}

// Each topic's "N boxes", counted from its contents.
function writeCounts() {
  for (const topic of document.querySelectorAll("details.rx-topic")) {
    const count = topic.querySelector(".rx-topic-count");
    if (!count) continue;
    const n = topic.querySelectorAll("a.rx-toc-item").length;
    if (n) count.textContent = `${n} ${n === 1 ? "box" : "boxes"}`;
  }
}

// A panel of script-built boxes shows its first one unless told otherwise.
function defaultShow(panel) {
  if (panel.dataset.show) return;
  const first = Object.values(SUB).find(([panelId]) => panelId === panel.id);
  if (first) panel.dataset.show = first[1];
}

let lastRoute = null;

function route(raw, { fromToc = false, fromLink = false } = {}) {
  let id = raw === undefined ? decodeURIComponent(location.hash.slice(1)) : raw;
  if (!id) return;
  // Back and Forward fire both popstate and hashchange; act once per frame.
  if (lastRoute === id) return;
  lastRoute = id;
  requestAnimationFrame(() => {
    lastRoute = null;
  });

  const aliased = id in ALIAS;
  if (aliased) id = ALIAS[id];

  // The deep dive itself: close the open topic so the catalogue shows again.
  if (id === "cut") {
    for (const topic of document.querySelectorAll("details.rx-topic[open]")) topic.open = false;
    const cut = $("cut");
    if (cut) requestAnimationFrame(() => cut.scrollIntoView());
    return;
  }

  let target;
  let moved = aliased;
  if (SUB[id]) {
    const [panelId, show] = SUB[id];
    const panel = $(panelId);
    if (!panel) return;
    // An open panel that swaps boxes fires no toggle, and the box it now
    // shows was laid out hidden, so its chart needs the resize too.
    if (panel.open && panel.dataset.show !== show) {
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }
    panel.dataset.show = show;
    target = $(id) || panel;
    moved = true;
  } else if (METHOD[id]) {
    target = $("cut-methods");
    const root = $("w4m-root");
    if (!target) return;
    if (root) {
      root.dataset.want = METHOD[id];
      root.dispatchEvent(new CustomEvent("w4m:show", { detail: { panel: METHOD[id] } }));
    }
    moved = true;
  } else {
    target = $(id);
  }
  if (!target) return;

  const opened = openAround(target);
  syncContents();

  if (fromToc) {
    // Stay at the contents: the box opens below them. Bring them back only
    // when the reader has scrolled past them.
    const toc = target.closest("details.rx-topic")?.querySelector("nav.rx-toc");
    requestAnimationFrame(() => {
      if (toc && toc.getBoundingClientRect().top < 0) toc.scrollIntoView();
    });
  } else if (opened || moved || fromLink) {
    requestAnimationFrame(() => target.scrollIntoView());
  }
}

// Contents and catalogue links. A link to a script-built box names its panel in
// href (the box is not in the page source) and the box itself in data-target.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const a = event.target.closest('a.rx-toc-item, .rx-catalogue a[href^="#"]');
  if (!a) return;
  const id = entryId(a);
  if (!id) return;
  event.preventDefault();
  history.pushState(null, "", `#${id}`);
  // The default action is cancelled, so the router does the scrolling.
  const fromToc = a.classList.contains("rx-toc-item");
  route(id, { fromToc, fromLink: !fromToc });
});

// A method tab clicked inside #cut-methods moves the contents mark too.
document.addEventListener("click", (event) => {
  if (event.target.closest(".w4m-tab")) syncContents();
});

// toggle does not bubble; catching it in the capture phase also covers drawers
// and panels that scripts add later.
document.addEventListener(
  "toggle",
  (event) => {
    const el = event.target;
    if (!(el instanceof HTMLDetailsElement)) return;
    if (el.open) {
      // Browsers without <details name> groups: close the others by hand.
      const name = el.getAttribute("name");
      if (name) {
        for (const other of document.querySelectorAll("details[name][open]")) {
          if (other !== el && other.getAttribute("name") === name) other.open = false;
        }
      }
      if (el.classList.contains("rx-topic") && !el.querySelector("details.rx-panel[open]")) {
        const first = el.querySelector("details.rx-panel");
        if (first) first.open = true;
      }
      if (el.classList.contains("rx-panel")) defaultShow(el);
      window.dispatchEvent(new Event("resize"));
    }
    if (el.classList.contains("rx-topic") || el.classList.contains("rx-panel")) syncContents();
  },
  true,
);

window.addEventListener("hashchange", () => route());
window.addEventListener("popstate", () => route());
writeCounts();
route();
syncContents();

// The top bar marks the section in view instead of always "Where".
const links = [...document.querySelectorAll(".topnav a[href^='#']")];
const sections = links.map((a) => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
function mark() {
  const line = 120;
  let current = sections[0];
  for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
  links.forEach((a) => a.classList.toggle("here", a.getAttribute("href") === `#${current.id}`));
}
addEventListener("scroll", mark, { passive: true });
mark();
