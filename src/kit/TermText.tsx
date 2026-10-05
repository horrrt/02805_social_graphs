// Script-built text with one glossary term, as termify() places it: the first
// occurrence of `phrase` in `text` becomes a <Term> whose pop-up says
// `definition`. The server and the first client render show the text plain,
// as main's text was plain until its script ran; the term follows once
// hydrated. Text without the phrase stays plain.
import { Term } from "@/components/post/Term";
import { useHydrated } from "@/lib/useHydrated";
import { splitTerm } from "@/scripts/week04-ui.js";

/** <p><TermText text="A hapax is …" phrase="hapax" definition="A type observed exactly once …" id="kit-term-hapax" /></p> */
export default function TermText({ text, phrase, definition, id }: { text: string; phrase: string; definition: string; id: string }) {
  const hydrated = useHydrated();
  const parts = hydrated ? (splitTerm(text, phrase) as [string, string, string] | null) : null;
  if (!parts) return text;
  return (
    <>
      {parts[0]}
      <Term id={id} word={parts[1]}>
        {definition}
      </Term>
      {parts[2]}
    </>
  );
}
