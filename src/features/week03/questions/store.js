// The questions drawer, which questions.js kept in its module and the DOM on
// main: whether the <details> is open (the reader's clicks open it; React only
// listens), whether it has ever been, and the ring's own year. Memory only.
import { createStore } from "../../../scripts/runtime/store.js";

export const questions = createStore({ open: false, opened: false, ringYear: 2024 });

/** The drawer's toggle event: its open state as the reader left it. */
export function toggled(open) {
  questions.setState((s) => ({ open, opened: s.opened || open }));
}
