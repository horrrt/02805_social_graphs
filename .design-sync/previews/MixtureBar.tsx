import { useState } from "react";
import { MixtureBar } from "log-log-legends-kit";
import { mixParts, mixWords } from "@/features/kit-page/toy";

// The kit page's topic mixture: a toy page's share of each topic
// (src/features/kit-page/toy.ts), with Crime in focus and its top words.
export const CrimeInFocus = () => {
  const [focus, setFocus] = useState("Crime");
  return <MixtureBar parts={mixParts} focus={focus} onFocus={setFocus} words={mixWords[focus]} />;
};
