import type { ReactNode } from "react";
import { Term } from "@/components/post/Term";

// A glossary term in the prose (span.w4-term > button + span.w4-pop). The page's TermLayer opens and
// closes it on click and Escape.
export function GlossTerm({ id, word, children }: { id: string; word: string; children: ReactNode }) {
  return (
    <Term id={id} word={word}>
      {children}
    </Term>
  );
}
