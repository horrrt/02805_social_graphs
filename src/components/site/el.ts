// Helpers for the server markup components in site/ and post/. A component
// that leaves out an attribute or a part must give React exactly what the JSX
// it replaces gave: an undefined prop or a false child costs nothing in the
// HTML but is still sent in the page's React payload ("$undefined", false),
// and static parity fails a page whose gzipped HTML grows by more than 2%.
// Children go to createElement one by one, as JSX passes static children, so
// a list of parts needs no keys, and a component's `children` array is spread
// among its siblings, as it was when the page wrote them there.
import { createElement, type ReactNode } from "react";

type Props = Record<string, unknown>;

/** `props` without its undefined values, in the order given. */
function defined(props: Props): Props {
  const out: Props = {};
  for (const [name, value] of Object.entries(props)) if (value !== undefined) out[name] = value;
  return out;
}

/** An element with the undefined props and the undefined, null or false parts dropped, and arrays spread. */
export function el(type: string, props: Props | null, ...children: ReactNode[]) {
  const kept = children.filter((c) => c !== undefined && c !== null && c !== false).flatMap((c) => (Array.isArray(c) ? c : [c]));
  return createElement(type, props && defined(props), ...kept);
}
