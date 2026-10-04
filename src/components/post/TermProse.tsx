// Server prose that main's scripts put glossary terms into after load
// (termify() on a server-rendered element). TermProse turns its JSX children
// into the tree Termified renders: host elements keep their props in JSX
// order, each JSX string child stays its own text node (React prints a
// <!-- --> between adjacent ones), numbers become strings, fragments flatten,
// server components are called and their output converted, and <Term> becomes
// a term node. Any other client component fails the build. The target renders
// only the attributes its server markup has: one without an id passes roots,
// e.g. roots={["#second-did p"]}.
import { Fragment, isValidElement, type ReactNode } from "react";
import { Term } from "./Term";
import { Termified, type TermDef, type TermElement, type TermNode } from "./Termified";

type Props = {
  as: string;
  id?: string;
  className?: string;
  terms: TermDef[];
  after?: string[];
  roots?: string[];
  children?: ReactNode;
};

const CLIENT_REFERENCE = Symbol.for("react.client.reference");

function typeName(type: unknown): string {
  if (typeof type === "string") return type;
  const t = type as { displayName?: string; name?: string; $$id?: string } | null;
  return t?.displayName ?? t?.name ?? t?.$$id ?? String(type);
}

// The plain text of a term's word or definition.
function textOf(node: ReactNode, what: string): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map((n) => textOf(n, what)).join("");
  throw new Error(`TermProse: a <Term>'s ${what} must be text`);
}

function convert(node: ReactNode, out: TermNode[]) {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (typeof node === "string") {
    out.push(node);
    return;
  }
  if (typeof node === "number" || typeof node === "bigint") {
    out.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) convert(child, out);
    return;
  }
  if (!isValidElement(node)) throw new Error(`TermProse: cannot render ${typeName(node)} into termified prose`);
  const { type } = node;
  const props = node.props as Record<string, unknown>;
  if (type === Fragment) return convert(props.children as ReactNode, out);
  if (type === Term) {
    out.push({ term: { id: String(props.id), word: textOf(props.word as ReactNode, "word"), definition: textOf(props.children as ReactNode, "definition") } });
    return;
  }
  if (typeof type === "string") {
    const { children, ...attrs } = props;
    // Raw HTML stays in ChartTip (R13); a tree holds text, elements and terms only.
    if (Object.keys(attrs).some((k) => k.startsWith("dangerously"))) throw new Error(`TermProse: <${type}> sets raw HTML`);
    out.push({ tag: type, attrs, children: toTree(children as ReactNode) });
    return;
  }
  if ((type as { $$typeof?: symbol }).$$typeof === CLIENT_REFERENCE)
    throw new Error(`TermProse: ${typeName(type)} is a client component; only <Term> may sit in termified prose`);
  if (typeof type === "function") {
    const result = (type as (p: unknown) => unknown)(props);
    if (result instanceof Promise) throw new Error(`TermProse: ${typeName(type)} is async`);
    return convert(result as ReactNode, out);
  }
  throw new Error(`TermProse: cannot render ${typeName(type)} into termified prose`);
}

function toTree(children: ReactNode): TermNode[] {
  const out: TermNode[] = [];
  convert(children, out);
  return out;
}

/**
 * <TermProse as="div" id="fame-did" terms={[{ phrase: "in-degree", definition: "…", id: "w5-term-fame-indegree" }]}
 *   after={["weeks/week05/data/fame.json"]}>…prose…</TermProse>
 */
export function TermProse(props: Props) {
  const { as, terms, after = [], roots, children } = props;
  if (!props.id && !roots?.length) throw new Error(`TermProse: a <${as}> without an id needs roots`);
  // id and className in the order the caller wrote them, as the JSX it replaces did.
  const attrs: Record<string, unknown> = {};
  for (const key of Object.keys(props)) if ((key === "id" || key === "className") && props[key] !== undefined) attrs[key] = props[key];
  const tree: TermElement = { tag: as, attrs, children: toTree(children) };
  return <Termified tree={tree} terms={terms} after={after} roots={roots} />;
}
