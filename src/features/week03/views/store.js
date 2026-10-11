// The views drawer, which echarts-views.js kept in its module and the DOM on
// main: whether the <details> is open (the reader's clicks open it; React only
// listens) and whether it has ever been, where ECharts and the two extra files
// are, the status line, and each view's own control. Memory only.
import { createStore } from "../../../scripts/runtime/store.js";

export const views = createStore({
  open: false,
  opened: false,
  // "idle" until the drawer first opens, then "loading", "ready" or "error".
  library: "idle",
  // The two extra files: null until they have loaded or failed.
  asylum: null,
  closures: null,
  status: "",
  year: 2024,
  floor: 400000,
  mode: "in",
  origin: "SY",
});

/** The drawer's toggle event: its open state as the reader left it. */
export function toggled(open) {
  views.setState((s) => ({ open, opened: s.opened || open }));
}
