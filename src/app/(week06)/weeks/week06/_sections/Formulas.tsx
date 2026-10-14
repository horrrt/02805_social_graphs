import { explainFor } from "@/lib/glossary";
import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex). The
// Cold Read game has its own (src/features/cold-read/Formulas.tsx), but in
// lowercase tf/idf, log base 2 for PPMI and words' vectors; the post writes
// TF, DF and IDF, takes PMI's natural log and compares pages. Each part of a
// display formula is tagged with \htmlClass{x-…} so hovering it explains it,
// in the site's shared wording (src/lib/glossary.ts) with this page's numbers
// added. The numbers are the prose's, pinned by tests/week06-essentials.test.mjs.

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

/** TF-IDF(w, d) = TF × IDF = count over length × ln(303 / DF). */
export const TfIdfFormula = () => (
  <Tex
    block
    tex={String.raw`${x("tfidf", String.raw`\text{TF-IDF}(w, d)`)} = ${x("tf", String.raw`\text{TF}(w, d)`)} \times ${x("idf", String.raw`\text{IDF}(w)`)} = ${x(
      "tf",
      String.raw`\frac{${x("count", String.raw`\text{count}(w, d)`)}}{${x("len", String.raw`\lvert d \rvert`)}}`,
    )} \times ${x("idf", String.raw`${x("ln", String.raw`\ln`)} \frac{${x("n-docs", "303")}}{${x("df", String.raw`\text{DF}(w)`)}}`)}`}
    label="TF-IDF of word w on page d equals TF times IDF: the count of w on d over the length of d, times the natural log of 303 over DF of w"
    explain={explainFor(["tfidf", "tf", "count", "len", "idf", "ln", "n-docs", "df"], { "n-docs": "Here, the 303 pages." })}
  />
);

/** IDF = ln(303 / DF), inline in the sentence that defines it. */
export const IdfInline = () => <Tex tex={String.raw`\ln \tfrac{303}{\text{DF}}`} label="the natural log of 303 over DF" />;

/** ln(303 / df) = value, the worked example inline. */
export const IdfWorked = ({ df, value }: { df: number; value: string }) => (
  <Tex
    tex={String.raw`${x("ln", String.raw`\ln`)} \tfrac{${x("n-docs", "303")}}{${x("df", String(df))}} = ${x("idf-value", value)}`}
    label={`the natural log of 303 over ${df} is ${value}`}
    explain={explainFor(["ln", "n-docs", "df", "idf-value"], { "n-docs": "Here, the 303 pages.", df: `Here, ${df} pages use the word.` })}
  />
);

/** cos(a, b) = a · b over the product of the lengths, and the dot product written word by word. */
export const CosineFormula = () => (
  <Tex
    block
    tex={String.raw`${x("cos", String.raw`\cos(a, b)`)} = \frac{${x("dot", String.raw`a \cdot b`)}}{${x("norm-a", String.raw`\lVert a \rVert`)} \, ${x("norm-b", String.raw`\lVert b \rVert`)}} = \frac{${x(
      "dot-sum",
      String.raw`\sum_{w} ${x("a-w", "a_w")} \, ${x("b-w", "b_w")}`,
    )}}{${x("norm-a", String.raw`\lVert a \rVert`)} \, ${x("norm-b", String.raw`\lVert b \rVert`)}}`}
    label="cosine of a and b equals a dot b over the length of a times the length of b, which is the sum over words w of a w times b w, over the same lengths"
    explain={explainFor(["cos", "dot", "dot-sum", "a-w", "b-w", "norm-a", "norm-b"], { "dot-sum": "Each bar in the chart below is one of these terms, divided by the two lengths." })}
  />
);

/** PMI(w, c) = ln[P(w, c) / (P(w) P(c))], natural log. */
export const PmiFormula = () => (
  <Tex
    block
    tex={String.raw`${x("pmi", String.raw`\operatorname{PMI}(w, c)`)} = ${x("ln-ratio", String.raw`\ln`)} \frac{${x("p-joint", "P(w, c)")}}{${x("p-word", "P(w)")} \, ${x("p-context", "P(c)")}}`}
    label="PMI of w and c equals the natural log of P of w and c over P of w times P of c"
    explain={explainFor(["pmi", "ln-ratio", "p-joint", "p-word", "p-context"])}
  />
);

/** PPMI = max(PMI, 0), under PMI. */
export const PpmiFormula = () => (
  <Tex
    block
    tex={String.raw`${x("ppmi", String.raw`\operatorname{PPMI}(w, c)`)} = ${x("max", String.raw`\max`)}\bigl(${x("pmi", String.raw`\operatorname{PMI}(w, c)`)}, ${x("zero", "0")}\bigr)`}
    label="PPMI of w and c equals the larger of PMI of w and c and zero"
    explain={explainFor(["ppmi", "max", "pmi", "zero"])}
  />
);
