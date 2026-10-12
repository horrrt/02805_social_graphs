import { ContributionBars, MethodCompare, TaggedTokens, type TaggedToken } from "log-log-legends-kit";
import { scoreLexicon, tokenize } from "@/kit/text-core.js";
import { classify, lexicon, sentimentSentences } from "@/features/kit-page/toy-text";

// The Text section's comparison: one toy sentence under three scoring rules
// (src/features/kit-page/toy-text.ts).
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
const verdict = (v: number, mid = 0) => (v > mid ? "positive" : v < mid ? "negative" : "neutral");

function lexiconParts(sentence: string, negation: boolean) {
  const words = tokenize(sentence, { splitClitics: true, dropPunct: false }) as string[];
  const { total, hits } = scoreLexicon(words, lexicon, { negation }) as { total: number; hits: { index: number; token: string; value: number; base: number; flipped: boolean }[] };
  const at = new Map(hits.map((h) => [h.index, h]));
  const tokens: TaggedToken[] = words.map((text, i) => {
    const h = at.get(i);
    return h ? { text, tag: signed(h.value), tone: h.value > 0 ? "pos" : "neg" } : { text };
  });
  const items = hits.map((h) => ({ key: String(h.index), label: h.flipped ? `${h.token} (flipped)` : h.token, value: h.value }));
  return { tokens, items, total };
}

const sentence = sentimentSentences[1];
const plain = lexiconParts(sentence, false);
const negated = lexiconParts(sentence, true);
const c = classify(sentence);

export const ThreeRules = () => (
  <MethodCompare
    cards={[
      {
        key: "lexicon",
        title: "Lexicon",
        blurb: "Every word in the dictionary adds its fixed score.",
        body: (
          <>
            <TaggedTokens tokens={plain.tokens} label="Tokens, lexicon only" />
            <ContributionBars items={plain.items} total={{ mode: "sum" }} fmt={signed} />
          </>
        ),
        note: `${signed(plain.total)}: ${verdict(plain.total)}. Word order is ignored.`,
      },
      {
        key: "negation",
        title: "Lexicon with negation",
        blurb: "The same scores, flipped within three words of not, never or n't.",
        body: (
          <>
            <TaggedTokens tokens={negated.tokens} label="Tokens, lexicon with negation" />
            <ContributionBars items={negated.items} total={{ mode: "sum" }} fmt={signed} />
          </>
        ),
        note: `${signed(negated.total)}: ${verdict(negated.total)}. One hand-written rule.`,
      },
      {
        key: "logistic",
        title: "TF-IDF + logistic regression",
        blurb: "Weights learned from eight labelled toy texts.",
        body: <ContributionBars items={c.items} total={{ mode: "sigmoid", bias: c.bias }} />,
        note: `p = ${c.p.toFixed(2)}: ${verdict(c.p, 0.5)}. Only words seen in training count.`,
      },
    ]}
    facts={[["Same input", "one sentence"], ["What changes", "the scoring rule"]]}
  />
);
