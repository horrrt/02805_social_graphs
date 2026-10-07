// The design review's state, which mockups.js kept in closures on main: the
// concepts (read once from the page's #mockup-data), the shortlist saved in
// this browser, the active filter, the viewer's mockup and the two status
// lines. The browser (storage, URL, history, clipboard) is touched only from
// the functions below, which islands call in effects and handlers.
import { createStore } from "../../scripts/runtime/store.js";

const STORAGE_KEY = "log-log-legends-mockup-shortlist-v1";

/** Every filter button's data-filter, in page order. */
export const FILTERS = ["all", "data-stories", "disney", "netflix", "marvel", "comedy", "ux", "reference", "original", "saved"];

export const review = createStore({
  list: [],
  ready: false,
  favourites: [],
  filter: "all",
  currentId: null,
  open: false,
  opens: 0,
  fitPage: false,
  scrolls: 0,
  status: "",
  viewerStatus: "",
  fallback: { main: null, viewer: null },
  focus: { target: null, n: 0 },
});

// The element that had focus when the viewer opened, focused again on close.
let opener = null;

const byId = (id) => review.getState().list.find((m) => m.number === id);
const ids = () => review.getState().list.map((m) => m.number);
const sorted = (set) => [...set].sort((a, b) => a - b);
const canOpen = () => typeof HTMLDialogElement !== "undefined" && typeof HTMLDialogElement.prototype.showModal === "function";

/** Whether card `id` shows under the current filter. */
export function visible(state, id) {
  const mockup = state.list.find((m) => m.number === id);
  if (!state.ready || !mockup) return true;
  return state.filter === "all" || mockup.collection === state.filter || (state.filter === "saved" && state.favourites.includes(id));
}

/** How many cards show under the current filter. */
export function visibleCount(state) {
  return state.list.filter((m) => visible(state, m.number)).length;
}

export function visibleText(state) {
  return `Showing ${visibleCount(state)} of ${state.list.length} visual concepts`;
}

function requestFocus(target) {
  review.setState((s) => ({ focus: { target, n: s.focus.n + 1 } }));
}

export function setFilter(filter, updateUrl = true) {
  const active = FILTERS.includes(filter) ? filter : "all";
  review.setState({ filter: active });
  if (updateUrl) {
    const url = new URL(location.href);
    if (active === "all") url.searchParams.delete("collection");
    else url.searchParams.set("collection", active);
    history.replaceState(null, "", url);
  }
}

/** A filter button's click: filter, then announce what shows. */
export function chooseFilter(filter) {
  setFilter(filter);
  review.setState((s) => ({ status: visibleText(s) }));
}

export function showAll() {
  setFilter("all");
  requestFocus("first-filter");
}

export function toggleFavourite(id) {
  if (!byId(id)) return;
  const set = new Set(review.getState().favourites);
  const adding = !set.has(id);
  if (adding) set.add(id); else set.delete(id);
  let persisted = true;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted(set))); }
  catch { persisted = false; }
  const s = review.getState();
  const message = `Mockup ${id} ${adding ? "saved" : "removed"}. ${set.size} in your shortlist.`
    + (persisted ? "" : " Browser storage is unavailable; copy your shortlist before leaving.");
  review.setState({ favourites: sorted(set), status: message, ...(s.open ? { viewerStatus: message } : {}) });
  if (s.filter === "saved" && !adding && !s.open) requestFocus("saved-filter");
}

export function openMockup(id, updateUrl = true) {
  const mockup = byId(id);
  if (!mockup || !canOpen()) return;
  const alreadyOpen = review.getState().open;
  if (!alreadyOpen) opener = document.activeElement;
  review.setState((s) => ({
    currentId: id,
    open: true,
    opens: s.opens + 1,
    scrolls: s.scrolls + 1,
    viewerStatus: "",
    fallback: { ...s.fallback, viewer: null },
  }));
  if (updateUrl) {
    const method = alreadyOpen ? "replaceState" : "pushState";
    history[method](null, "", `#mockup-${id}`);
  }
}

export function step(offset) {
  const list = ids();
  openMockup(list[list.indexOf(review.getState().currentId) + offset]);
}

/** Ask the viewer to close; the dialog's close event calls closed(). */
export function closeMockup() {
  review.setState({ open: false });
}

/** The dialog closed (button, Escape or hash): clear the hash, then return focus. */
export function closed() {
  review.setState({ open: false });
  if (/^#mockup-\d+$/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  if (opener && !opener.closest("[hidden]")) opener.focus();
  else requestFocus("first-filter");
}

export function readHash() {
  const match = location.hash.match(/^#mockup-(\d+)$/);
  if (match && byId(Number(match[1]))) openMockup(Number(match[1]), false);
  else if (review.getState().open) closeMockup();
}

export function toggleFit() {
  review.setState((s) => ({ fitPage: !s.fitPage, scrolls: s.scrolls + 1 }));
}

export async function copyText(text, inViewer = false) {
  const where = inViewer ? "viewer" : "main";
  review.setState((s) => ({ fallback: { ...s.fallback, [where]: null } }));
  try {
    await navigator.clipboard.writeText(text);
    const message = inViewer ? "Link copied. Paste it to share this mockup." : "Shortlist copied. Paste it into chat to share your choices.";
    review.setState(inViewer ? { viewerStatus: message } : { status: message });
  } catch {
    const message = "Automatic copying is unavailable. Copy the selected text below.";
    review.setState((s) => ({ fallback: { ...s.fallback, [where]: text }, ...(inViewer ? { viewerStatus: message } : { status: message }) }));
  }
}

export function copyShortlist() {
  const choices = review.getState().favourites.map((id) => {
    const mockup = byId(id);
    return `${id} — ${mockup.name}${mockup.inspiration ? ` (${mockup.inspiration})` : ""}`;
  });
  copyText(`My favourite mockups:\n${choices.join("\n")}`);
}

export function copyLink() {
  copyText(location.href, true);
}

export function imageFailed() {
  review.setState({ viewerStatus: "This image could not load. Try “Open image” or reload the page." });
}

/** Read the concepts and the saved shortlist, then apply the URL's filter and hash. */
export function init() {
  if (review.getState().ready) return;
  const list = JSON.parse(document.getElementById("mockup-data").textContent);
  let favourites = [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) favourites = [...new Set(saved.filter((id) => list.some((m) => m.number === id)))];
  } catch { /* Review remains usable when browser storage is unavailable. */ }
  review.setState({ list, favourites, ready: true });
  setFilter(new URLSearchParams(location.search).get("collection"), false);
  readHash();
}

export function onPopState() {
  setFilter(new URLSearchParams(location.search).get("collection"), false);
}
