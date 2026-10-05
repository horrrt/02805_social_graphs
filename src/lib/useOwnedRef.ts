// Mark an element React renders as React's while a page's old scripts still
// run, so their sweeps (isOwned in src/scripts/runtime/owned.js) skip it. A ref
// callback runs inside React's commit, before any MutationObserver callback or
// passive effect sees the node (spike.md, finding i). Transitional, like owned.js.
import { markOwned } from "../scripts/runtime/owned.js";

const own = (el: Element | null) => {
  markOwned(el);
};

/** <table ref={useOwnedRef()}>: the ref callback marks the element at commit. The same function on every render. */
export function useOwnedRef(): (el: Element | null) => void {
  return own;
}
