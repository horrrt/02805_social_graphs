// The deep dive's state, which week04-cut.js kept on the DOM on main: which
// script-built box each panel shows (its data-show), the method tab the deep
// dive asked for (#w4m-root's data-want, as { panel, n }), the method tab on
// show once the methods work (null before), and the contents entries whose
// box is on show (their aria-current). The router (Router.tsx) and the
// methods (Methods.tsx) write it; the panels, the contents and the methods
// tabs read it. Memory only.
import { createStore } from "../../../scripts/runtime/store.js";

export const deep = createStore({ show: {}, method: null, tab: null, current: [] });

/** Show box `show` in panel `panelId` (#cut-skills, #cut-pagerank). */
export function showBox(panelId, show) {
  deep.setState((s) => (s.show[panelId] === show ? null : { show: { ...s.show, [panelId]: show } }));
}

/** Ask for a method tab ("gn", "mod", "louvain", "overlap"); each ask is new, so asking twice presses it twice. */
export function wantMethod(panel) {
  deep.setState((s) => ({ method: { panel, n: (s.method?.n ?? 0) + 1 } }));
}

/** The method tab on show, as the methods box presses it. */
export function setTab(tab) {
  deep.setState({ tab });
}

/** The contents entries whose box is on show, by target id. */
export function setCurrent(ids) {
  deep.setState((s) => (s.current.length === ids.length && s.current.every((id, i) => id === ids[i]) ? null : { current: ids }));
}
