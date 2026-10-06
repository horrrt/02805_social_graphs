// Read a page-wide store (src/scripts/runtime/store.js) from a component.
// The server and the hydration render see the store's initial state, which is
// what the server rendered; the client state follows one frame after the
// hydration commit (spike.md, finding k).
import { useMemo, useRef, useSyncExternalStore } from "react";

/** The shape createStore returns. */
export type Store<S> = {
  getState: () => S;
  getInitialState: () => S;
  setState: (partial: Partial<S> | ((state: S) => Partial<S> | null | undefined) | null | undefined) => void;
  subscribe: (fn: (state: S, previous: S) => void) => () => boolean | void;
};

type Memo<S, T> = { has: boolean; state?: S; selector?: (state: S) => T; selection?: T };

// A snapshot reader that runs the selector only when the state object or the
// selector changes, and keeps the previous selection while isEqual says
// nothing changed, so a selector that returns a fresh object or array neither
// loops nor re-renders on every update.
function reader<S, T>(memo: Memo<S, T>, read: () => S, selector: (state: S) => T, isEqual: (a: T, b: T) => boolean) {
  return () => {
    const state = read();
    if (memo.has && Object.is(memo.state, state) && memo.selector === selector) return memo.selection as T;
    const next = selector(state);
    memo.state = state;
    memo.selector = selector;
    if (memo.has && isEqual(memo.selection as T, next)) return memo.selection as T;
    memo.has = true;
    memo.selection = next;
    return next;
  };
}

/** useStore(store, (s) => s.open) -> the selection, re-rendering when it changes. */
export function useStore<S, T>(store: Store<S>, selector: (state: S) => T, isEqual: (a: T, b: T) => boolean = Object.is): T {
  const client = useRef<Memo<S, T>>({ has: false });
  const server = useRef<Memo<S, T>>({ has: false });
  const [getSnapshot, getServerSnapshot] = useMemo(
    () => [
      reader(client.current, store.getState, selector, isEqual),
      reader(server.current, store.getInitialState, selector, isEqual),
    ],
    [store, selector, isEqual],
  );
  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
}
