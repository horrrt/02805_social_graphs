import { useState } from "react";
import { TokenWindow } from "log-log-legends-kit";
import { negatives, sentence } from "@/features/kit-page/toy";

// The kit page's context window over a toy sentence
// (src/features/kit-page/toy.ts): skip-gram, window ±2, centred on "chased".
export const SkipGram = () => {
  const [centre, setCentre] = useState(2);
  return <TokenWindow tokens={sentence} centre={centre} window={2} onCentre={setCentre} negatives={negatives} mode="skipgram" />;
};

// CBOW with a window of ±1, centred on "ball".
export const Cbow = () => {
  const [centre, setCentre] = useState(4);
  return <TokenWindow tokens={sentence} centre={centre} window={1} onCentre={setCentre} negatives={negatives} mode="cbow" />;
};
