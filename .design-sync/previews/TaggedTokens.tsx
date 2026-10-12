import { useState } from "react";
import { TaggedTokens, type TaggedToken } from "log-log-legends-kit";
import { tokenDetails } from "@/kit/text-core.js";
import { ngramText, pipelineText } from "@/features/kit-page/toy-text";

// The Text section's tokenizer demo on a toy sentence
// (src/features/kit-page/toy-text.ts): clitics split, stopwords and
// punctuation greyed, with the raw text editable above.
export const Pipeline = () => {
  const [text, setText] = useState(pipelineText);
  const tokens: TaggedToken[] = tokenDetails(text, { splitClitics: true }).map((t: { text: string; stop: boolean; punct: boolean; index: number }) => ({
    text: t.text,
    tone: t.stop || t.punct ? "muted" : undefined,
    attrs: [["is_stop", String(t.stop)], ["is_punct", String(t.punct)], ["position", String(t.index + 1)]],
  }));
  return <TaggedTokens tokens={tokens} source={{ value: text, onChange: setText, label: "Raw text" }} label="Tokens after your choices" />;
};

// Bigrams over a toy sentence, the third one lit.
export const Bigrams = () => {
  const [active, setActive] = useState(2);
  return <TaggedTokens tokens={ngramText.split(" ").map((text) => ({ text }))} gram={{ n: 2, active, onActive: setActive }} />;
};
