"use client";
// Server prose with glossary terms placed the way main's scripts place them
// (TermProse builds the tree). The server and the first client render show the
// prose plain; once hydrated and every file in `after` has loaded (the files
// main awaited before calling termify), the tree goes through termifyTree with
// the page's terms. If one of those files fails, the prose stays plain, as on
// main. One island name covers every instance, so each instance adds its
// roots to the island's footprint for scripts/parity/faults.mjs.
import { createElement, useMemo, type ReactNode } from "react";
import { island, useIslandReady } from "@/lib/island";
import { islandOptions } from "@/lib/islandOptions";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { registerIsland } from "@/scripts/runtime/islands.js";
import { asset } from "@/scripts/site.js";
import { termifyTree } from "@/scripts/week04-ui.js";
import { Term } from "./Term";

/** A text node, an element with its props in JSX order, or a glossary term. */
export type TermNode =
  | string
  | { tag: string; attrs: Record<string, unknown>; children: TermNode[] }
  | { term: { id: string; word: string; definition: string } };
export type TermElement = Extract<TermNode, { tag: string }>;
export type TermDef = { phrase: string; definition: string; id: string };
export type TermifiedProps = { tree: TermElement; terms: TermDef[]; after: string[]; roots?: string[] };

const NAME = "post/Termified";

// Children go to createElement as arguments, not as one array, so the plain
// and the termified tree reconcile by position and need no keys.
function render(node: TermNode): ReactNode {
  if (typeof node === "string") return node;
  if ("term" in node) return createElement(Term, { id: node.term.id, word: node.term.word }, node.term.definition);
  return createElement(node.tag, node.attrs, ...node.children.map(render));
}

function Plain({ tree }: TermifiedProps) {
  return render(tree);
}

function View({ tree, terms, after }: TermifiedProps) {
  const hydrated = useHydrated();
  // `after` never changes for a mounted instance, so these hooks run in the same order on every render.
  const loads = after.map((path) => useData(hydrated ? asset(path) : null));
  const ready = hydrated && loads.every((s) => s.status === "ready");
  const shown = useMemo(() => (ready ? (termifyTree(tree, terms) as TermElement) : tree), [ready, tree, terms]);
  useIslandReady(ready);
  return render(shown);
}

// island() registers a footprint once, at module load, before any instance
// is known; Termified replaces it with the union of every instance's roots.
const TermifiedIsland = island(NAME, View, Plain, { roots: "none" });
const known = new Set<string>();

/** The selectors an instance renders: its roots, or #id when the target has one. */
function termifiedRoots({ tree, roots }: Pick<TermifiedProps, "tree" | "roots">): string[] {
  if (roots?.length) return roots;
  const id = tree.attrs.id;
  if (typeof id === "string" && id) return [`#${id}`];
  throw new Error(`${NAME}: a <${tree.tag}> without an id needs roots`);
}

export function Termified(props: TermifiedProps) {
  const roots = termifiedRoots(props);
  if (roots.some((r) => !known.has(r))) {
    for (const r of roots) known.add(r);
    registerIsland(NAME, islandOptions(NAME, { roots: [...known] }));
  }
  return <TermifiedIsland {...props} />;
}
