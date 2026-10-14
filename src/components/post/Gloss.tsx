// A glossary term whose definition comes from the site's shared glossary
// (src/lib/glossary.ts), so a concept is defined the same way on every page.
// The id is <page>-term-<concept>; `word` is the word as the sentence uses it,
// the glossary's own word when left out. A server component: only the one
// definition reaches the page, not the whole glossary.
import { TERMS, termConcept } from "@/lib/glossary";
import { Term } from "./Term";

export function Gloss({ id, word }: { id: string; word?: string }) {
  const entry = TERMS[termConcept(id)];
  if (!entry) throw new Error(`${id}: no entry for "${termConcept(id)}" in src/lib/glossary.ts`);
  return (
    <Term id={id} word={word ?? entry.word}>
      {entry.definition}
    </Term>
  );
}
