import { ContributionBars } from "log-log-legends-kit";
import { scoreLexicon, tokenize } from "@/kit/text-core.js";
import { classifierSentences, classify, lexicon, sentimentSentences } from "@/features/kit-page/toy-text";

// The Text section's sentiment demos (src/features/kit-page/toy-text.ts).
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;

// A toy sentence scored by the toy lexicon, negation flipping the sign.
export const Lexicon = () => {
  const words = tokenize(sentimentSentences[2], { splitClitics: true, dropPunct: false }) as string[];
  const { hits } = scoreLexicon(words, lexicon, { negation: true }) as { hits: { index: number; token: string; value: number; flipped: boolean }[] };
  const items = hits.map((h) => ({ key: String(h.index), label: h.flipped ? `${h.token} (flipped)` : h.token, value: h.value }));
  return <ContributionBars items={items} ends={["very negative", "very positive"]} total={{ mode: "sum", label: "Sentence score" }} fmt={signed} />;
};

// A logistic regression fitted on eight toy texts: each word's weight, then the sigmoid.
export const Classifier = () => {
  const c = classify(classifierSentences[0]);
  return <ContributionBars items={c.items} total={{ mode: "sigmoid", bias: c.bias, label: "TF-IDF(text) → w·x + b → sigmoid" }} ends={["negative", "positive"]} />;
};
