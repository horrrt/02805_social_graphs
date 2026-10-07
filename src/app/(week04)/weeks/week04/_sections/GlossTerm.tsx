import type { ReactNode } from "react";

// A glossary term as plain server markup (span.w4-term > button + span.w4-pop). Week 4's scripts open and
// close it, so it skips the client Term in components/post.
export function GlossTerm({ id, word, children }: { id: string; word: string; children: ReactNode }) {
  return (
    <span className="w4-term">
      <button aria-describedby={id} type="button">{word}</button>
      <span className="w4-pop" id={id} role="tooltip">{children}</span>
    </span>
  );
}
