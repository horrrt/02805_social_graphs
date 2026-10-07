// The debriefs' formulas, written once in LaTeX and typeset by KaTeX (Tex).
// Each part is tagged with \htmlClass{x-…} so hovering it explains it.
import { Tex } from "@/lib/Tex";

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

export const TfIdfFormula = () => (
  <Tex
    block
    tex={String.raw`${x("tfidf", String.raw`\text{tf-idf}(t, d)`)} = ${x(
      "tf",
      String.raw`\frac{${x("count", String.raw`\text{count}(t, d)`)}}{${x("len", String.raw`\lvert d \rvert`)}}`,
    )} \times ${x("idf", String.raw`${x("ln", String.raw`\ln`)} \frac{${x("N", "N")}}{${x("df", String.raw`\text{df}(t)`)}}`)}`}
    label="tf-idf of t in d equals count of t in d over the length of d, times the natural log of N over df of t"
    explain={{
      tfidf: "tf-idf(t, d): how much the word t tells you about page d. High when t is frequent here and rare elsewhere.",
      tf: "tf, the term frequency: the word's share of this page's words.",
      count: "count(t, d): how many times the word appears on this page.",
      len: "|d|: how many words the page has in all, so long pages don't win by size.",
      idf: "idf, the inverse document frequency: how rare the word is across pages. 0 when every page uses it.",
      ln: "ln: the natural log. It flattens big ratios, so 1 page against 2 matters more than 200 against 201.",
      N: "N: how many pages there are, 303.",
      df: "df(t): on how many pages the word appears.",
    }}
  />
);

/** idf = ln(N / df) = value, inline in a sentence. */
export const IdfInline = ({ n, df, value }: { n: number; df: number; value: string }) => (
  <Tex
    tex={String.raw`${x("idf", String.raw`\text{idf}`)} = ${x("ln", String.raw`\ln`)} \tfrac{${x("N", String(n))}}{${x("df", String(df))}} = ${x("value", value)}`}
    label={`idf equals the natural log of ${n} over ${df}, ${value}`}
    explain={{
      idf: "idf: how rare the word is across pages.",
      ln: "ln: the natural log.",
      N: `${n}: all the pages.`,
      df: `${df}: the pages that use this word.`,
      value: value === "0.00" ? "0: every page uses it, so it tells you nothing." : `${value}: the higher, the rarer the word.`,
    }}
  />
);

export const CosineFormula = () => (
  <Tex
    block
    tex={String.raw`${x("cos", String.raw`\cos(a, b)`)} = \frac{${x("dot", String.raw`a \cdot b`)}}{${x("na", String.raw`\lVert a \rVert`)} \, ${x("nb", String.raw`\lVert b \rVert`)}}`}
    label="cosine of a and b equals a dot b over the norm of a times the norm of b"
    explain={{
      cos: "cos(a, b): how alike two words' vectors point, from −1 (opposite) to 1 (the same direction).",
      dot: "a · b: multiply the vectors dimension by dimension and add up. Large when both are big in the same dimensions.",
      na: "‖a‖: the length of vector a. Dividing by it keeps only the direction.",
      nb: "‖b‖: the length of vector b.",
    }}
  />
);

export const PpmiFormula = () => (
  <Tex
    block
    tex={String.raw`${x("ppmi", String.raw`\text{PPMI}(w, c)`)} = ${x("max", String.raw`\max`)}\!\left(${x("log", String.raw`\log_2`)} \frac{${x(
      "joint",
      "P(w, c)",
    )}}{${x("pw", "P(w)")}\,${x("pc", "P(c)")}},\ ${x("zero", "0")}\right)`}
    label="PPMI of w and c equals the maximum of log base 2 of P of w and c over P of w times P of c, and zero"
    explain={{
      ppmi: "PPMI(w, c): how much more often the word w and the context word c meet than chance would put them together.",
      max: "max(…, 0): keep the score only when it is positive.",
      log: "log₂: 0 when the pair meets exactly as often as chance, above 0 when more often.",
      joint: "P(w, c): how often w and c appear within the window of each other.",
      pw: "P(w): how often the word w appears at all.",
      pc: "P(c): how often the context word c appears at all.",
      zero: "0: pairs that meet less often than chance are set to 0, since rare negative scores are noisy.",
    }}
  />
);
