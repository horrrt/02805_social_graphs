import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex). The
// Cold Read game has its own (src/features/cold-read/Formulas.tsx), but in
// lowercase tf/idf, log base 2 for PPMI and words' vectors; the post writes
// TF, DF and IDF, takes PMI's natural log and compares pages. Each part of a
// display formula is tagged with \htmlClass{x-…} so hovering it explains it.
// The numbers are the prose's, pinned by tests/week06-essentials.test.mjs.

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

/** TF-IDF(w, d) = TF × IDF = count over length × ln(303 / DF). */
export const TfIdfFormula = () => (
  <Tex
    block
    tex={String.raw`${x("tfidf", String.raw`\text{TF-IDF}(w, d)`)} = ${x("tf", String.raw`\text{TF}(w, d)`)} \times ${x("idf", String.raw`\text{IDF}(w)`)} = ${x(
      "tf",
      String.raw`\frac{${x("count", String.raw`\text{count}(w, d)`)}}{${x("len", String.raw`\lvert d \rvert`)}}`,
    )} \times ${x("idf", String.raw`${x("ln", String.raw`\ln`)} \frac{${x("n", "303")}}{${x("df", String.raw`\text{DF}(w)`)}}`)}`}
    label="TF-IDF of word w on page d equals TF times IDF: the count of w on d over the length of d, times the natural log of 303 over DF of w"
    explain={{
      tfidf: "TF-IDF(w, d): how much the word w tells you about page d. It's high when w is frequent on d and rare on the other pages.",
      tf: "TF, the term frequency: the word's share of the page's words.",
      count: "count(w, d): how many times w appears on page d.",
      len: "|d|: how many words page d has in all, so a long page doesn't win by its size.",
      idf: "IDF, the inverse document frequency: how rare the word is across pages. It's 0 when every page uses it.",
      ln: "ln: the natural log. It grows slowly, so a very rare word doesn't swamp the rest.",
      n: "303: all the pages.",
      df: "DF(w), the document frequency: how many of the pages use w.",
    }}
  />
);

/** IDF = ln(303 / DF), inline in the sentence that defines it. */
export const IdfInline = () => <Tex tex={String.raw`\ln \tfrac{303}{\text{DF}}`} label="the natural log of 303 over DF" />;

/** ln(303 / df) = value, the worked example inline. */
export const IdfWorked = ({ df, value }: { df: number; value: string }) => (
  <Tex
    tex={String.raw`${x("ln", String.raw`\ln`)} \tfrac{${x("n", "303")}}{${x("df", String(df))}} = ${x("value", value)}`}
    label={`the natural log of 303 over ${df} is ${value}`}
    explain={{
      ln: "ln: the natural log.",
      n: "303: all the pages.",
      df: `${df}: the pages that use the word.`,
      value: `${value}: the word's IDF. The higher, the rarer the word.`,
    }}
  />
);

/** cos(a, b) = a · b over the product of the lengths, and the dot product written word by word. */
export const CosineFormula = () => (
  <Tex
    block
    tex={String.raw`${x("cos", String.raw`\cos(a, b)`)} = \frac{${x("dot", String.raw`a \cdot b`)}}{${x("na", String.raw`\lVert a \rVert`)} \, ${x("nb", String.raw`\lVert b \rVert`)}} = \frac{${x(
      "sum",
      String.raw`\sum_{w} ${x("aw", "a_w")} \, ${x("bw", "b_w")}`,
    )}}{${x("na", String.raw`\lVert a \rVert`)} \, ${x("nb", String.raw`\lVert b \rVert`)}}`}
    label="cosine of a and b equals a dot b over the length of a times the length of b, which is the sum over words w of a w times b w, over the same lengths"
    explain={{
      cos: "cos(a, b): how alike two pages' word vectors point. It's 1 when they point the same way and 0 when they share no word.",
      dot: "a · b, the dot product: multiply the two vectors word by word and add up.",
      sum: "The dot product written out, one term per word. Each bar in the chart below is one of these terms, divided by the two lengths.",
      aw: "a_w: the word w's count or TF-IDF on page a.",
      bw: "b_w: the word w's count or TF-IDF on page b.",
      na: "‖a‖: the length of page a's vector. Dividing by the lengths keeps only the direction.",
      nb: "‖b‖: the length of page b's vector.",
    }}
  />
);

/** PMI(w, c) = ln[P(w, c) / (P(w) P(c))], natural log. */
export const PmiFormula = () => (
  <Tex
    block
    tex={String.raw`${x("pmi", String.raw`\operatorname{PMI}(w, c)`)} = ${x("ln", String.raw`\ln`)} \frac{${x("joint", "P(w, c)")}}{${x("pw", "P(w)")} \, ${x("pc", "P(c)")}}`}
    label="PMI of w and c equals the natural log of P of w and c over P of w times P of c"
    explain={{
      pmi: "PMI(w, c): how much more often the word w and the context word c meet than chance would put them together.",
      ln: "ln: the natural log. The score is 0 when the pair meets exactly as often as chance predicts, above 0 when it meets more often and below 0 when it meets less often.",
      joint: "P(w, c): how often w and c sit within the window of each other, as a share of all the pairs counted.",
      pw: "P(w): how often the word w is counted at all.",
      pc: "P(c): how often the context word c is counted at all. P(w) times P(c) is how often the pair would meet by chance.",
    }}
  />
);

/** PPMI = max(PMI, 0), under PMI. */
export const PpmiFormula = () => (
  <Tex
    block
    tex={String.raw`${x("ppmi", String.raw`\operatorname{PPMI}(w, c)`)} = ${x("max", String.raw`\max`)}\bigl(${x("pmi", String.raw`\operatorname{PMI}(w, c)`)}, ${x("zero", "0")}\bigr)`}
    label="PPMI of w and c equals the larger of PMI of w and c and zero"
    explain={{
      ppmi: "PPMI(w, c), positive PMI: the pair's PMI when that's above 0, and 0 otherwise.",
      max: "max: the larger of the two.",
      pmi: "PMI(w, c): the score above.",
      zero: "0: every pair that meets less often than chance scores 0.",
    }}
  />
);
