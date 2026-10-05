// bridge: W5-Z
// Week 5's hover tips while the page's old scripts still draw most of its
// charts. On main, week05-frame.js ran tips.js hoverTips() on every
// [id^="chart-"] host when it was imported, before the other modules had
// their data (KB07). The HoverTipsCompat island calls sweepHoverTips() from
// its effect at the hydration commit, before the page's entry is imported, and
// it leaves alone every host React renders: those are marked through
// useOwnedRef in the same commit, before any passive effect runs, and draw
// their own tips with HoverTipHost. hoverTips keeps its own MutationObserver
// for the charts the old scripts draw later. Goes with the entry (W5-Z).
import { isOwned } from "../../../scripts/runtime/owned.js";
import { hoverTips } from "../../../scripts/tips.js";

// Hosts already given tips, so StrictMode's second effect adds no second tip.
const swept = new WeakSet();

/** hoverTips(host) once on every [id^="chart-"] host that React does not own. */
export function sweepHoverTips() {
  for (const host of document.querySelectorAll('[id^="chart-"]')) {
    if (isOwned(host) || swept.has(host)) continue;
    swept.add(host);
    hoverTips(host);
  }
}
