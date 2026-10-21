// The shape of public/play/week07/data/sentiment_trap.json, which
// analysis/week07_sentiment_trap.py writes. Every number the game shows comes
// from it: word valences from the VADER word list summed with no rules, a
// TF-IDF and logistic-regression classifier trained on SST-2 movie reviews, and
// distilbert-base-uncased-finetuned-sst-2-english.

export type Label = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export type Word = { w: string; valence: number | null; weight: number | null };

export type Reading = {
  lexicon: { sum: number; label: Label };
  classifier: { p: number; label: Label; parts: { w: string; contribution: number }[] };
  contextual: { label: Label; score: number };
};

export type Sentence = Reading & { text: string; words: Word[] };

export type SentimentTrapData = {
  instruments: {
    lexicon: { source: string; words: number };
    classifier: { train: string; trainSize: number; validSize: number; accuracy: number };
    contextual: { model: string; revision: string; trainedOn: string };
  };
  sentences: Record<"good" | "negation" | "sarcasm" | "confidence", Sentence>;
  pages: {
    total: number;
    negative: { lexicon: number; classifier: number; contextual: number };
    allAgree: number;
    named: { name: string; label: Label; score: number }[];
    shown: Reading & { name: string; opening: string; words: number };
  };
};

/** 0.998 → "0.998"; 1 → "1.000", as the brief prints model scores. */
export const score3 = (x: number) => x.toFixed(3);

/** +1.9, −2.6, 0: a signed valence with a real minus sign. */
export const signed = (x: number, digits = 1) => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(digits);

/** 4432 → "4,432". */
export const count = (n: number) => n.toLocaleString("en");
