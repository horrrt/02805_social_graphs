import { TermText } from "log-log-legends-kit";

// Script-built text with one glossary term; the definition opens in a pop-up.
export const GlossaryTerm = () => (
  <p>
    <TermText
      text="A hapax is a word that occurs exactly once in the corpus."
      phrase="hapax"
      definition="A type observed exactly once in the corpus."
      id="preview-term-hapax"
    />
  </p>
);

export const TermMidSentence = () => (
  <p>
    <TermText
      text="Communities found by Louvain maximise modularity, the share of links inside groups beyond what chance gives."
      phrase="modularity"
      definition="Q: the fraction of links inside communities minus the fraction a random network with the same degrees would have."
      id="preview-term-modularity"
    />
  </p>
);
