"use client";
// The deep-dive router, week04-cut.js on main. A link to a box, from the
// catalogue, a topic's contents, the rail or another page, opens the topic and
// the box and scrolls there; old anchors land on their box (ALIAS). A box that
// a script builds inside a panel (SUB) is picked through the panel's
// data-show, and a method tab (METHOD) through the methods' wanted tab, both
// in the deep-dive store. A chart drawn while its box is closed has no width,
// so opening any <details> fires a resize for every chart on the page.
// <details> stay uncontrolled: the router opens them as a click would.
import { useEffect } from "react";
import { island } from "@/lib/island";
import { useDocumentEvent } from "@/lib/useEvents";
import { ALIAS, METHOD, SUB, firstShow } from "@/scripts/week04-cut.js";
import { deep, setCurrent, showBox, wantMethod } from "./deep";

const SUBS = SUB as unknown as Record<string, [string, string]>;
const METHODS = METHOD as Record<string, string>;
const ALIASES = ALIAS as Record<string, string>;

const $ = (id: string) => document.getElementById(id);
const frame = (fn: () => void) => requestAnimationFrame(fn);
const resize = () => window.dispatchEvent(new Event("resize"));

// Open `el` if it is a <details>, then every <details> around it, inside out.
function openAround(el: Element) {
  let opened = false;
  for (let d: Element | null = el.tagName === "DETAILS" ? el : el.parentElement; d; d = d.parentElement) {
    if (d instanceof HTMLDetailsElement && !d.open) {
      d.open = true;
      opened = true;
    }
  }
  return opened;
}

// Which box a contents or catalogue entry points at.
const entryId = (a: HTMLAnchorElement) => a.dataset.target || decodeURIComponent(a.hash.slice(1));

const isOpen = (el: Element | null): boolean => el instanceof HTMLDetailsElement && el.open;

// The method tab showing now, or the one asked for before the tabs were built.
function currentMethod() {
  const pressed = document.querySelector<HTMLElement>('.w4m-tab[aria-pressed="true"]');
  const root = $("w4m-root");
  if (root && !root.hidden && pressed) return pressed.dataset.panel;
  return deep.getState().method?.panel || "gn";
}

// Is the box behind a contents entry the one on show?
function isShowing(id: string) {
  if (SUBS[id]) {
    const [panelId, show] = SUBS[id];
    return isOpen($(panelId)) && deep.getState().show[panelId] === show;
  }
  if (METHODS[id]) return isOpen($("cut-methods")) && currentMethod() === METHODS[id];
  return isOpen($(id)?.closest("details.rx-panel") ?? null);
}

// The contents entries whose box is on show, in every topic.
function syncContents() {
  const ids = [...document.querySelectorAll<HTMLAnchorElement>("a.rx-toc-item")].map(entryId);
  setCurrent(ids.filter(isShowing));
}

// A panel of script-built boxes shows its first one unless told otherwise.
function defaultShow(panel: HTMLElement) {
  if (deep.getState().show[panel.id]) return;
  const first = firstShow(panel.id);
  if (first) showBox(panel.id, first);
}

let lastRoute: string | null = null;

function route(raw?: string, { fromToc = false, fromLink = false } = {}) {
  let id = raw === undefined ? decodeURIComponent(location.hash.slice(1)) : raw;
  if (!id) return;
  // Back and Forward fire both popstate and hashchange; act once per frame.
  if (lastRoute === id) return;
  lastRoute = id;
  frame(() => {
    lastRoute = null;
  });

  const aliased = id in ALIASES;
  if (aliased) id = ALIASES[id];

  // The deep dive itself: close the open topic so the catalogue shows again.
  if (id === "cut") {
    for (const topic of document.querySelectorAll<HTMLDetailsElement>("details.rx-topic[open]")) topic.open = false;
    const cut = $("cut");
    if (cut) frame(() => cut.scrollIntoView());
    return;
  }

  let target: Element | null;
  let moved = aliased;
  if (SUBS[id]) {
    const [panelId, show] = SUBS[id];
    const panel = $(panelId);
    if (!panel) return;
    // An open panel that swaps boxes fires no toggle, and the box it now
    // shows was laid out hidden, so its chart needs the resize too.
    if (isOpen(panel) && deep.getState().show[panelId] !== show) frame(resize);
    showBox(panelId, show);
    target = $(id) || panel;
    moved = true;
  } else if (METHODS[id]) {
    target = $("cut-methods");
    if (!target) return;
    wantMethod(METHODS[id]);
    moved = true;
  } else {
    target = $(id);
  }
  if (!target) return;

  const opened = openAround(target);
  syncContents();

  const to = target;
  if (fromToc) {
    // Stay at the contents: the box opens below them. Bring them back only
    // when the reader has scrolled past them.
    const toc = to.closest("details.rx-topic")?.querySelector("nav.rx-toc");
    frame(() => {
      if (toc && toc.getBoundingClientRect().top < 0) toc.scrollIntoView();
    });
  } else if (opened || moved || fromLink) {
    frame(() => to.scrollIntoView());
  }
}

function RouterView() {
  // Contents and catalogue links. A link to a script-built box names its panel
  // in href (the box is not in the page source) and the box in data-target.
  useDocumentEvent("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(".w4m-tab")) frame(syncContents);
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const a = target?.closest<HTMLAnchorElement>('a.rx-toc-item, .rx-catalogue a[href^="#"]');
    if (!a) return;
    const id = entryId(a);
    if (!id) return;
    event.preventDefault();
    history.pushState(null, "", `#${id}`);
    // The default action is cancelled, so the router does the scrolling.
    const fromToc = a.matches(".rx-toc-item");
    route(id, { fromToc, fromLink: !fromToc });
  });

  // toggle does not bubble; the capture phase also covers drawers and panels
  // that islands render later.
  useDocumentEvent(
    "toggle",
    (event) => {
      const el = event.target;
      if (!(el instanceof HTMLDetailsElement)) return;
      if (el.open) {
        // Browsers without <details name> groups: close the others by hand.
        const name = el.getAttribute("name");
        if (name) {
          for (const other of document.querySelectorAll<HTMLDetailsElement>("details[name][open]")) {
            if (other !== el && other.getAttribute("name") === name) other.open = false;
          }
        }
        if (el.matches(".rx-topic") && !el.querySelector("details.rx-panel[open]")) {
          const first = el.querySelector<HTMLDetailsElement>("details.rx-panel");
          if (first) first.open = true;
        }
        if (el.matches(".rx-panel")) defaultShow(el);
        resize();
      }
      if (el.matches(".rx-topic, .rx-panel")) syncContents();
    },
    { capture: true },
  );

  useEffect(() => {
    const controller = new AbortController();
    const again = () => route();
    window.addEventListener("hashchange", again, { signal: controller.signal });
    window.addEventListener("popstate", again, { signal: controller.signal });
    route();
    syncContents();
    // A method tab pressed in the methods panel moves the contents mark too.
    const unsubscribe = deep.subscribe((s, prev) => {
      if (s.show !== prev.show || s.method !== prev.method) syncContents();
    });
    return () => {
      controller.abort();
      unsubscribe();
    };
  }, []);
  return null;
}

/** Renders nothing; mount one on the page. */
export const Router = island("week04/frame/Router", RouterView, () => null, { roots: "none", affects: [".rx-toc-item", "#cut-skills", "#cut-pagerank"] });
