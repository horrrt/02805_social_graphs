// The toy inputs of the edge-state page's Text states (states-text.tsx): no
// tokens, long tokens, spans that overlap or run past the end, contributions
// off the scale, empty engines, more cards than fit and a log map with points
// at or below zero. None of it is a result.
import type { Contribution, MapPoint, MethodCard, ResultColumn, TaggedToken, TokenSpan } from "@/kit";

const LONG = "Pneumonoultramicroscopicsilicovolcanoconiosis-and-then-some-more-letters";

export const tokensAwkward: TaggedToken[] = [
  { text: "A", tag: "B-PER", tone: "accent", attrs: [["is_stop", "true"], ["a long attribute name that keeps going", "and a long value beside it as well"]] },
  { text: "very", tag: "I-PER", tone: "accent" },
  { text: LONG, tag: "a tag as long as a phrase", tone: "pos" },
  { text: "bad", tag: "−2.0", tone: "neg" },
  { text: "", tag: "empty" },
  { text: "the", tone: "muted" },
  { text: "end", tag: "O" },
];
/** Overlapping (the second is dropped), past the end (clamped) and empty (dropped). */
export const spansAwkward: TokenSpan[] = [
  { start: 0, end: 2, label: "PER: A very" },
  { start: 1, end: 3, label: "dropped: overlaps the first" },
  { start: 5, end: 99, label: "a span that runs past the last token" },
  { start: 4, end: 4, label: "dropped: empty" },
];

export const contribAwkward: Contribution[] = [
  { key: "a", label: "a feature with a very long name that should cut rather than spill", value: -12.5 },
  { key: "b", label: "zero", value: 0 },
  { key: "c", label: "not a number", value: Number.NaN },
  { key: "d", label: "past max", value: -4 },
  { key: "e", label: "small", value: -0.01 },
];

const longDoc = {
  key: "long",
  title: `A result title that goes on and on, ${LONG}`,
  snippet: `A snippet with an unbroken run of letters, ${LONG}, then more words to wrap over several lines in a narrow column.`,
  score: 0.91,
};
export const resultsAwkward: ResultColumn[] = [
  { key: "none", title: "An engine with nothing", sub: "and a custom empty message", results: [], empty: "This engine found nothing for the query." },
  { key: "long", title: "Long titles and snippets", results: [longDoc, { key: "b", title: "Short", score: 0.2 }] },
  { key: "zero", title: "Zero and negative scores", results: [{ key: "z", title: "Zero", score: 0 }, { key: "n", title: "Negative", score: -0.3, scoreLabel: "−0.300" }] },
];
export const resultPresets = ["a preset", "another preset that is rather long", LONG, "x"];

export const cardsFour: MethodCard[] = [
  { key: "a", title: `A method with a very long title, ${LONG}`, blurb: "A blurb.", body: "Toy body.", note: "A note." },
  { key: "b", title: "No blurb or note", body: "" },
  { key: "c", title: "Its own accent", blurb: "An accent token of its own.", body: "Toy body.", accent: "--w4-group-1" },
  { key: "d", title: "Fourth", blurb: "Wraps to a quarter of the width.", body: LONG },
];

export const tfidfRows = ["doc one", "doc two", "empty doc"];
export const tfidfCols = ["the", "hero", "storm"];
/** "the" is in every non-empty row, so its idf is 0; the last row is all zeros. */
export const tfidfCells = [[3, 1, 0], [2, 0, 2], [0, 0, 0]];

export const logEdge: MapPoint[] = [
  { key: "zero-x", label: "zero in B", x: 0, y: 4 },
  { key: "neg", label: "negative", x: -1, y: 2 },
  { key: "on", label: "on the line", x: 5, y: 5 },
  { key: "huge", label: "a huge rate with a long label", x: 4000, y: 9000 },
  { key: "tiny", label: "tiny", x: 0.002, y: 0.01 },
];
