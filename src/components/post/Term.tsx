"use client";
// A glossary term: the word as a button, described by a pop-up that CSS shows
// on hover and focus (span.w4-term > button + span.w4-pop[role=tooltip]), the
// markup Week 4's JSX writes and termify() builds. The is-open class, which
// keeps the pop-up open after a click, comes from termStore; only TermLayer
// (Week 4) changes it, so a term stays inert on pages that do not mount one.
import type { ReactNode } from "react";
import { createStore } from "@/scripts/runtime/store.js";
import { useOwnedRef } from "@/lib/useOwnedRef";
import { useStore, type Store } from "@/lib/useStore";

/** The open term's id, or null when every term is closed. */
export const termStore: Store<{ open: string | null }> = createStore({ open: null });

/** <Term id="w4-term-top-fiscal-year" word="fiscal years">The year from 1 October …</Term> */
export function Term({ id, word, children }: { id: string; word: ReactNode; children?: ReactNode }) {
  const open = useStore(termStore, (s) => s.open === id);
  return (
    <span className={open ? "w4-term is-open" : "w4-term"} ref={useOwnedRef()}>
      <button aria-describedby={id} type="button">{word}</button>
      <span className="w4-pop" id={id} role="tooltip">{children}</span>
    </span>
  );
}
