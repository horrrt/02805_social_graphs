// Elements React renders on a page whose old scripts still run. A legacy
// sweep (a MutationObserver, a querySelectorAll pass) asks isOwned(el) and
// leaves those alone. useOwnedRef marks them from a ref callback, which runs
// in React's commit before any MutationObserver callback. Transitional: it
// goes when the last legacy script does.

const owned = new WeakSet();

/** Mark an element as React's. Ignores null, which ref callbacks pass on detach. */
export function markOwned(el) {
  if (el) owned.add(el);
}

/** Whether markOwned was called on this element. */
export function isOwned(el) {
  return el ? owned.has(el) : false;
}
