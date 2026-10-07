// The arcade logbook that cabinet.js kept in read()/write() on main: every
// first guess saved in this browser under one key, the dialog's open state,
// the storage note and body.unlocked (set by a reveal or a failed load and
// never removed, as main never removed it). Storage is touched only from the
// functions below, which islands call in effects and handlers, never in render.
import { createStore } from "../../scripts/runtime/store.js";
import { migrate } from "../../scripts/cabinet.js";

const KEY = "loglog-arcade-v1-20260826";

export const logbook = createStore({ attempts: {}, loaded: false, open: false, blocked: false, unlocked: false });

/** Read the saved log (cabinet.js read()), keeping the last good copy when storage fails. */
export function loadLog() {
  let attempts = logbook.getState().attempts;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.attempts && typeof saved.attempts === "object") attempts = saved.attempts;
  } catch {}
  migrate(attempts);
  logbook.setState({ attempts, loaded: true });
  return attempts;
}

function write(attempts) {
  let blocked = false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ attempts }));
  } catch {
    blocked = true;
  }
  logbook.setState((s) => ({ attempts, blocked: s.blocked || blocked }));
}

/** Save a first guess; a later guess for the same id never overwrites it. Returns the saved attempt. */
export function record(attempt) {
  const attempts = loadLog();
  if (attempts[attempt.id]) return attempts[attempt.id];
  write({ ...attempts, [attempt.id]: attempt });
  return attempt;
}

/** Reset my log: clear every first guess. */
export function resetLog() {
  write({});
}

/** The whole log as cabinet.js exported it. */
export function exportLog() {
  return { attempts: loadLog() };
}

export const openLogbook = () => {
  loadLog();
  logbook.setState({ open: true });
};
export const closeLogbook = () => logbook.setState({ open: false });
export const unlock = () => logbook.setState({ unlocked: true });
