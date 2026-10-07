// bridge: week04 close, goes with src/scripts/entries/week04.js
"use client";
// What week04-frame.js did for the markup the old Week 4 scripts still build,
// until the last of them is a component: glossary terms that termify() wrote
// open and close on click and Escape, segmented controls get week04-frame.js's
// keyboard and tab stops, and tables get week04-tables.js's classes and bars.
// Elements React renders (isOwned) are left to their components. It also
// hands the method tab the deep dive asks for to week04-methods.js, as
// #w4m-root's data-want and a w4m:show event.
import { useEffect } from "react";
import { island } from "@/lib/island";
import { useDocumentEvent } from "@/lib/useEvents";
import { isOwned } from "@/scripts/runtime/owned.js";
import { decorate } from "@/scripts/week04-tables.js";
import { deep } from "./deep";

const OPEN = ".w4-term.is-open";
const SEGMENTS = ".rx-seg, .axis-modes, .staffing-years";
const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

const legacy = (el: Element | null) => Boolean(el) && !isOwned(el);

function segmentButtons(group: Element) {
  return [...group.querySelectorAll("button")].filter((b) => !b.disabled && !b.hidden);
}

function syncSegments(root: Element) {
  for (const group of root.querySelectorAll(SEGMENTS)) {
    if (!legacy(group)) continue;
    const buttons = segmentButtons(group);
    const pressed = buttons.find((b) => b.getAttribute("aria-pressed") === "true") || buttons[0];
    for (const b of buttons) b.tabIndex = b === pressed ? 0 : -1;
  }
}

// week04-tables.js decorateAll(), skipping the tables React renders.
function decorateAll(root: Element) {
  let queued = new Set<HTMLTableElement>();
  let pending = 0;
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target.nodeType === 1 ? (record.target as Element) : record.target.parentElement;
      const table = target?.closest("table");
      if (table) queued.add(table);
      for (const added of record.addedNodes) {
        if (!(added instanceof Element)) continue;
        if (added instanceof HTMLTableElement) queued.add(added);
        else for (const t of added.querySelectorAll("table")) queued.add(t);
      }
    }
    if (queued.size && !pending) pending = requestAnimationFrame(flush);
  });
  const watch = () => observer.observe(root, { childList: true, subtree: true });
  const run = (tables: Iterable<HTMLTableElement>) => {
    observer.disconnect();
    for (const table of tables) if (table.isConnected && root.contains(table) && legacy(table)) decorate(table);
    observer.takeRecords();
    watch();
  };
  function flush() {
    pending = 0;
    const tables = queued;
    queued = new Set();
    run(tables);
  }
  run(root.querySelectorAll("table"));
  return () => {
    observer.disconnect();
    cancelAnimationFrame(pending);
  };
}

function BridgeView() {
  useDocumentEvent("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest(".w4-term > button") ?? null;
    const term = button && legacy(button.parentElement!) ? button.parentElement : null;
    for (const open of document.querySelectorAll(OPEN)) {
      if (legacy(open) && open !== term) open.classList.remove("is-open");
    }
    if (term) term.classList.toggle("is-open");
  });
  useDocumentEvent("keydown", (event) => {
    if (event.key === "Escape") {
      for (const open of document.querySelectorAll(OPEN)) if (legacy(open)) open.classList.remove("is-open");
      return;
    }
    if (!KEYS.has(event.key) || event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    const group = target?.closest?.(SEGMENTS);
    if (!group || !legacy(group) || target.tagName !== "BUTTON") return;
    const buttons = segmentButtons(group);
    const i = buttons.indexOf(target as HTMLButtonElement);
    if (i < 0) return;
    const n = buttons.length;
    const next = { ArrowLeft: buttons[(i - 1 + n) % n], ArrowRight: buttons[(i + 1) % n], Home: buttons[0], End: buttons[n - 1] }[event.key]!;
    event.preventDefault();
    next.focus();
    next.click();
  });

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    let queued = 0;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        syncSegments(main);
      });
    });
    observer.observe(main, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"], childList: true });
    syncSegments(main);
    const undecorate = decorateAll(main);
    const unsubscribe = deep.subscribe((s, prev) => {
      const ask = s.method;
      if (!ask || ask === prev.method) return;
      const root = document.getElementById("w4m-root");
      if (!root) return;
      root.dataset.want = ask.panel;
      root.dispatchEvent(new CustomEvent("w4m:show", { detail: { panel: ask.panel } }));
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(queued);
      undecorate();
      unsubscribe();
    };
  }, []);
  return null;
}

/** Renders nothing; mount one on the page while its old scripts run. */
export const LegacyBridge = island("week04/frame/LegacyBridge", BridgeView, () => null, { roots: "none", affects: "page" });
