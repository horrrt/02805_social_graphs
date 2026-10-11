// The toy inputs of the kit's edge-state page (/styleguide/kit/states/): the
// awkward cases each component meets in a post, such as long labels, empty
// rows, values outside the axis and every optional mark at once. None of them
// is a result.
import type { StripOptions, StripRow } from "@/kit/StripChart";
import type { MiniSpec } from "@/kit/MiniStrip";
import type { KwicRow } from "@/kit/Concordance";
import type { TableSpec } from "@/kit/Table";
import type { AnalogyPoints, MapPoint, MixPart, RankedRow, SplitRow } from "@/kit";

const fmt = (v: number) => v.toFixed(1);

/** Every optional mark of a strip row, a long label, a missing value and one off the axis. */
export const stripAllRows: StripRow[] = [
  {
    label: "A very long row label that keeps going past where a label usually stops",
    sub: "and a sub-label just as long, to see where both wrap or clip",
    real: 0.62, realLabel: "0.62", realTip: "Toy value", color: "--w4-accent",
    base: [0.41, 0.03], baseLabel: "baseline 0.41 ± 0.03", baseTip: "Toy baseline",
    ci: [0.55, 0.69], ciTip: "Toy 95% interval", ref: [0.5, "reference 0.5"], badge: "×1.5", bold: true,
  },
  { label: "Hollow dot", real: 0.3, realLabel: "0.30", hollow: true, base: [0.32, 0.02], baseLabel: "0.32" },
  { label: "No real value", real: null, base: [0.5, 0.1], baseLabel: "baseline only", divider: true },
  { label: "Above the axis", real: 1.4, realLabel: "1.40", base: [0.9, 0.05], baseLabel: "0.90" },
  { label: "Below the axis", real: -0.3, realLabel: "−0.30", base: [0.1, 0.05], baseLabel: "0.10" },
  { label: "Value on the baseline", real: 0.5, realLabel: "0.50", base: [0.5, 0.05], baseLabel: "0.50" },
];

export const stripAllOpts: StripOptions = {
  domain: [0, 1],
  ticks: [0, 0.25, 0.5, 0.75, 1],
  fmt: (v) => v.toFixed(2),
  axisTitle: "toy share",
  zeroLine: 0,
  aria: "Toy strip chart: every optional mark, long labels and values outside the axis",
};

/** Ten plain rows, for a tall chart. */
export const stripManyRows: StripRow[] = Array.from({ length: 10 }, (_, i) => ({
  label: `Toy row ${i + 1}`,
  real: (i + 1) / 11,
  realLabel: fmt((i + 1) / 11),
  base: [0.5, 0.04] as [number, number],
  baseLabel: "0.5",
}));

export const stripManyOpts: StripOptions = { domain: [0, 1], ticks: [0, 0.5, 1], fmt, aria: "Toy strip chart: ten rows" };

/** A half-width strip: a long label squeezed into a narrow column. */
export const stripNarrowRows: StripRow[] = [
  { label: "A long label in a narrow column", real: 0.62, realLabel: "0.62", base: [0.41, 0.03], baseLabel: "baseline 0.41 ± 0.03" },
];

export const miniEdge: MiniSpec = {
  domain: [0, 1], real: 1, realLabel: "1.00 (on the edge)", base: [0.95, 0.04], baseLabel: "0.95",
  ref: 0.9, refLabel: "ref", ci: [0.97, 1], aria: "Toy mini strip: a value on the edge of its axis",
};

export const tableEmpty: TableSpec = {
  columns: [{ key: "word", label: "Word" }, { key: "count", label: "Count", num: true }],
  rows: [],
};

export const tableAwkward: TableSpec = {
  columns: [
    { key: "page", label: "Page" },
    { key: "note", label: "A long column heading that might not fit" },
    { key: "count", label: "Count", num: true },
    { key: "share", label: "Share", num: true },
  ],
  rows: [
    { page: "Supercalifragilisticexpialidocious_(an_unbroken_page_name_with_no_spaces)", note: "Long text in a cell that should wrap onto a second or third line", count: 123456789, share: 0.000123 },
    { page: "Missing values", note: null, count: undefined, share: 0 },
    { page: "Negative", note: "", count: -42, share: -0.5 },
  ],
};

export const kwicLong: KwicRow[] = [
  {
    page: "A_page_with_an_extremely_long_title_(Marvel_Comics_and_more)",
    left: "a left context that runs on much longer than the column was laid out for, to see what gives ",
    hit: "power",
    right: " and a right context just as long, which should clip or wrap without pushing the table off the card",
  },
  { page: "Thor_(Marvel_Comics)", left: "", hit: "power", right: "" },
];

export const passageNoMatch = { page: "Thor_(Marvel_Comics)", text: "Toy passage without the highlighted word in it.", highlight: "power" };

export const passageRegex = { page: "Thor_(Marvel_Comics)", text: "Toy passage whose highlight has regex characters: (a+b)? and (a+b)? again.", highlight: "(a+b)?" };

export const echartEmpty = {
  xAxis: { type: "category", data: [], name: "word" },
  yAxis: { type: "value", name: "count (toy)" },
  series: [{ type: "bar", data: [] }],
};

export const echartLongLabels = {
  xAxis: { type: "category", data: ["a rather long category label", "another long category label", "and a third long one"], name: "label" },
  yAxis: { type: "value", name: "count (toy)" },
  series: [{ type: "bar", data: [3, 7, 5], label: { show: true, position: "top" } }],
};

export const termMissing = {
  text: "A sentence that never uses the glossary phrase.",
  phrase: "hapax",
  definition: "A type observed exactly once in the corpus.",
  id: "kit-state-term-missing",
};

// The text explorables in awkward cases.

export const splitLong: SplitRow[] = [
  { key: "a", label: "A very long page title that keeps going well past the name column (and a qualifier)", sub: "and a sub-label just as long as the title above it", parts: [0.5, 0.3, 0.4], value: 1.2, valueLabel: "1.200", status: { text: "not linked", tone: "bad" } },
  { key: "b", label: "All parts zero", parts: [0, 0, 0], value: 0, valueLabel: "0.000" },
  { key: "c", label: "Fewer parts than the legend", parts: [0.2], value: 0.2, valueLabel: "0.200", status: { text: "linked", tone: "good" } },
];

export const sweepOne: [number, number][] = [[50, 2]];

export const tokensLong = ["a", "supercalifragilisticexpialidocious_with_no_spaces_at_all", "b"];

export const matrixWideCols = Array.from({ length: 18 }, (_, i) => `a long context word ${i + 1}`);
export const matrixWideRows = ["a long target word in the first column", "zeros"];
export const matrixWideCells = [matrixWideCols.map((_, i) => (i * 7) % 5), matrixWideCols.map(() => 0)];

export const mixTiny: MixPart[] = [
  { label: "A topic with a very long name that cannot fit its card", share: 3 },
  { label: "Tiny", share: 0.001 },
  { label: "Negative", share: -1 },
  { label: "Rest", share: 1 },
];

export const rankedAwkward: RankedRow[] = [
  { key: "a", label: "an_extremely_long_unbroken_word_that_should_be_cut_with_an_ellipsis", value: 5, valueLabel: "5.00", cols: ["1,234,567×", "303 of 303", "extra"] },
  { key: "b", label: "zero", value: 0, valueLabel: "0.00", cols: ["0×"] },
  { key: "c", label: "negative", value: -2, valueLabel: "−2.00", muted: true },
];

export const analogySame: AnalogyPoints = {
  a: { label: "one", x: 1, y: 1 },
  b: { label: "two", x: 1, y: 1 },
  c: { label: "three", x: 1, y: 1 },
  d: { label: "a long nearest-word label", x: 1, y: 1 },
};

export const mapOne: MapPoint[] = [{ key: "only", label: "The only point, with a long label", x: 0, y: 0, size: 3 }];

export const guessTieItems = [{ key: "x", label: "X" }, { key: "y", label: "Y" }];
export const guessTieScore = () => ({ x: 1, y: 1 });
