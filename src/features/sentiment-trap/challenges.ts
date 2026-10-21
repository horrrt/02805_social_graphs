// Sentiment Trap's four challenges, in the brief's order of trouble: negation,
// sarcasm, confidence and domain. Each names the sentence it shows (a key into
// the data's sentences, or "page" for the Marvel page), the words to light when
// the player inspects them, the question, four answers with a reason for each
// wrong one, and the explanation. Explanations and reasons are built from the
// data, so no number here is typed by hand.
import { count, type SentimentTrapData, score3, signed } from "./data";

export type Option = { id: string; text: string; why?: string };

export type Challenge = {
  id: "negation" | "sarcasm" | "confidence" | "domain";
  title: string;
  /** One line under the title: what the challenge is about. */
  lede: string;
  source: "negation" | "sarcasm" | "confidence" | "page";
  /** Words the inspection lights in the sentence. */
  focus: string[];
  question: (d: SentimentTrapData) => string;
  /** Four answers; `why` explains a wrong one, the right one has none. */
  options: (d: SentimentTrapData) => Option[];
  answer: string;
  explain: (d: SentimentTrapData) => string;
  lesson: string;
};

const valence = (d: SentimentTrapData, key: "negation" | "sarcasm" | "confidence", w: string) =>
  d.sentences[key].words.find((x) => x.w === w)?.valence ?? 0;
const part = (d: SentimentTrapData, key: "negation" | "sarcasm" | "confidence", w: string) =>
  d.sentences[key].classifier.parts.find((x) => x.w === w)?.contribution ?? 0;

export const POINTS = { correct: 100, reflection: 100, bonus: 100 };

export const CHALLENGES: Challenge[] = [
  {
    id: "negation",
    title: "Negation",
    lede: "One small word changes the sentence. Does every instrument notice?",
    source: "negation",
    focus: ["not", "good"],
    question: (d) => {
      const s = d.sentences.negation;
      return `The word-score sum says ${s.lexicon.label} (${signed(s.lexicon.sum)}). The other two say NEGATIVE. What does the sum miss?`;
    },
    options: (d) => [
      { id: "short", text: "The sentence is too short to measure.", why: `The other two instruments read the same five words and get NEGATIVE.` },
      {
        id: "small",
        text: "“not” has a negative score in the word list, just too small.",
        why: `“not” has no score in the word list at all. It counts as 0, so “good” (${signed(valence(d, "negation", "good"))}) decides the sum.`,
      },
      { id: "sum", text: "It adds each word’s score on its own, so “not” can’t change “good”." },
      { id: "trained", text: "It was trained on the wrong kind of text.", why: "Nothing trained it. A lookup table is written in advance, word by word." },
    ],
    answer: "sum",
    explain: (d) => {
      const s = d.sentences.negation;
      return (
        `“good” scores ${signed(valence(d, "negation", "good"))} in the word list and “not” scores nothing, so the sum stays ${signed(s.lexicon.sum)}. ` +
        `The classifier learned a negative weight for “not” from labelled reviews: it pulls this sentence down by ${signed(part(d, "negation", "not"), 2)}, and the classifier lands at P(positive) ${s.classifier.p.toFixed(2)}. ` +
        `The contextual model reads the whole sentence: ${s.contextual.label} at ${score3(s.contextual.score)}. ` +
        "A lookup with a negation rule would catch this one. A plain sum can’t."
      );
    },
    lesson: "A word’s sentiment is not always the sentiment of the sentence containing it.",
  },
  {
    id: "sarcasm",
    title: "Sarcasm",
    lede: "The sentence contains a positive word. Is it a positive sentence?",
    source: "sarcasm",
    focus: ["love", "stuck"],
    question: (d) => `All three instruments call this POSITIVE, the contextual model at ${score3(d.sentences.sarcasm.contextual.score)}. What should make you suspicious?`,
    options: (d) => [
      { id: "uncertain", text: "The model is too uncertain.", why: `It reports ${score3(d.sentences.sarcasm.contextual.score)}. It is close to certain, and wrong anyway.` },
      { id: "sarcasm", text: "The sentence is sarcastic: the positive word says the opposite." },
      {
        id: "none",
        text: "The sentence contains no sentiment words.",
        why: `It has two: “love” scores ${signed(valence(d, "sarcasm", "love"))} and “stuck” ${signed(valence(d, "sarcasm", "stuck"))}.`,
      },
      { id: "proved", text: "Nothing. The model has proved the sentence is positive.", why: "A prediction is not a proof. It is the label the model’s training makes most likely." },
    ],
    answer: "sarcasm",
    explain: (d) => {
      const s = d.sentences.sarcasm;
      return (
        `“love” (${signed(valence(d, "sarcasm", "love"))}) outweighs “stuck” (${signed(valence(d, "sarcasm", "stuck"))}) in the sum, ` +
        `the classifier’s learned weights land at P(positive) ${s.classifier.p.toFixed(2)}, and the contextual model says ${s.contextual.label} at ${score3(s.contextual.score)}. ` +
        "Most readers hear a complaint. Every instrument follows the word, and none hears the tone."
      );
    },
    lesson: "Strong sentiment words don’t guarantee that a sentence expresses that sentiment.",
  },
  {
    id: "confidence",
    title: "Confidence trap",
    lede: "A model can be very sure of itself. Sure of what, exactly?",
    source: "confidence",
    focus: ["hero", "died", "saved"],
    question: (d) => `The contextual model says ${d.sentences.confidence.contextual.label} at ${score3(d.sentences.confidence.contextual.score)}. Does that mean it measured the sentence correctly?`,
    options: (d) => [
      {
        id: "yes",
        text: `Yes: ${score3(d.sentences.confidence.contextual.score)} means the label is almost certainly right.`,
        why: "The score is the model’s own probability for its label, out of two. It never checks the label against what the sentence means.",
      },
      {
        id: "negwords",
        text: "Only when the sentence has no negative words.",
        why: `“died” scores ${signed(valence(d, "confidence", "died"))} in the word list, and the model is still at ${score3(d.sentences.confidence.contextual.score)}.`,
      },
      { id: "bug", text: "No, the model has a software error.", why: "Nothing broke. It did what it was trained to do: pick one of two labels." },
      { id: "no", text: "No: it is sure of its own label, not that one label fits a sentence that is sad and good at once." },
    ],
    answer: "no",
    explain: (d) => {
      const s = d.sentences.confidence;
      return (
        `The sentence holds a death and a rescue. The word list scores “hero” ${signed(valence(d, "confidence", "hero"))}, “died” ${signed(valence(d, "confidence", "died"))} ` +
        `and “saved” ${signed(valence(d, "confidence", "saved"))}: the sum is ${signed(s.lexicon.sum)}. `+
        `One POSITIVE at ${score3(s.contextual.score)} can be defended under one definition of sentiment and still hide the grief. ` +
        "The confidence describes the prediction, not whether this measurement answers your question."
      );
    },
    lesson: "Confidence is not the same as validity.",
  },
  {
    id: "domain",
    title: "Domain mismatch",
    lede: "A model fine-tuned on movie reviews reads a Marvel encyclopedia page.",
    source: "page",
    focus: [],
    question: (d) => {
      const p = d.pages.shown;
      return `The contextual model calls ${p.name}’s Wikipedia page ${p.contextual.label} at ${score3(p.contextual.score)}. What is the main risk?`;
    },
    options: (d) => [
      {
        id: "villain",
        text: `${d.pages.shown.name} is a villain, so NEGATIVE is right.`,
        why: "The page’s first sentence calls her a superhero. And a page about a villain isn’t written in a negative voice either.",
      },
      {
        id: "length",
        text: "Positive and negative words can’t be measured in a long text.",
        why: `They can: the word sum over all ${count(d.pages.shown.words)} words is ${signed(d.pages.shown.lexicon.sum)}.`,
      },
      { id: "domain", text: "The model learned sentiment from movie reviews, and an encyclopedia page is not a review." },
      { id: "bug", text: "The model has a software error.", why: "Nothing broke. It gives every page a label, whether or not the label means anything there." },
    ],
    answer: "domain",
    explain: (d) => {
      const p = d.pages;
      return (
        `On the same page the word sum says ${p.shown.lexicon.label} (${signed(p.shown.lexicon.sum)}) and the classifier P(positive) ${p.shown.classifier.p.toFixed(2)}, ` +
        `pulled most by “${p.shown.classifier.parts[0].w}” and “${p.shown.classifier.parts[1].w}”, words that carry no feeling in an encyclopedia. ` +
        `Across all ${p.total} pages the contextual model calls ${p.negative.contextual} NEGATIVE, the classifier ${p.negative.classifier} and the word sum ${p.negative.lexicon}, ` +
        `and all three agree on only ${p.allAgree}. Wikipedia is written to be neutral, and the model reads only the first 512 word pieces of a page.`
      );
    },
    lesson: "A model trained for one domain may not measure sentiment meaningfully in another.",
  },
];

/** The closing question, on the whole corpus. */
export const reflection = (d: SentimentTrapData) => ({
  question: `The contextual model labels ${d.pages.negative.contextual} of the ${d.pages.total} Marvel Wikipedia pages NEGATIVE. Does that mean the Marvel corpus is negative in sentiment?`,
  answer: "no",
  explain:
    `No. The pages are encyclopedia entries, written to be neutral. On the same pages the classifier says ${d.pages.negative.classifier} are negative and the word sum ` +
    `${d.pages.negative.lexicon}, and the three agree on only ${d.pages.allAgree} of ${d.pages.total}. ` +
    d.pages.named.map((n) => `${n.name} comes back ${n.label} at ${score3(n.score)}`).join(", ").replace(/, ([^,]*)$/, " and $1") +
    ". Nothing in those numbers says what was measured.",
});
