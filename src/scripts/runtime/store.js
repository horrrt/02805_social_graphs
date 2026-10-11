// A page-wide store: plain state outside React, read through useStore
// (src/lib) or directly by scripts. Module scope equals page lifetime on a
// static export, so a store made at import lives as long as the page.
// No DOM, no globals: Node can import it.

/**
 * createStore({ open: false }) -> { getState, getInitialState, setState, subscribe }.
 * setState takes a partial object or a function of the current state that
 * returns one; the partial is merged into a new state object. Listeners run
 * only when a key changed (Object.is), with (state, previous).
 */
export function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    getState: () => state,
    getInitialState: () => initial,
    setState(partial) {
      const next = typeof partial === "function" ? partial(state) : partial;
      if (next == null || Object.keys(next).every((k) => Object.is(next[k], state[k]))) return;
      const previous = state;
      state = { ...state, ...next };
      for (const fn of [...listeners]) fn(state, previous);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
