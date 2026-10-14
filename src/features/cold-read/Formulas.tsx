// The debriefs' formulas, written once in LaTeX and typeset by KaTeX (Tex).
// Each part is tagged with \htmlClass{x-…} so hovering it explains it, in the
// site's shared wording (src/lib/glossary.ts). The game writes lowercase
// tf-idf of a term t, so those parts have keys of their own.
import { explainFor } from "@/lib/glossary";
import { Tex } from "@/lib/Tex";

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

export const TfIdfFormula = () => (
  <Tex
    block
    tex={String.raw`${x("tfidf-t", String.raw`\text{tf-idf}(t, d)`)} = ${x(
      "tf",
      String.raw`\frac{${x("count-t", String.raw`\text{count}(t, d)`)}}{${x("len", String.raw`\lvert d \rvert`)}}`,
    )} \times ${x("idf", String.raw`${x("ln", String.raw`\ln`)} \frac{${x("n-docs", "N")}}{${x("df-t", String.raw`\text{df}(t)`)}}`)}`}
    label="tf-idf of t in d equals count of t in d over the length of d, times the natural log of N over df of t"
    explain={explainFor(["tfidf-t", "tf", "count-t", "len", "idf", "ln", "n-docs", "df-t"], { "n-docs": "Here, 303 pages." })}
  />
);

/** idf = ln(N / df) = value, inline in a sentence. */
export const IdfInline = ({ n, df, value }: { n: number; df: number; value: string }) => (
  <Tex
    tex={String.raw`${x("idf", String.raw`\text{idf}`)} = ${x("ln", String.raw`\ln`)} \tfrac{${x("n-docs", String(n))}}{${x("df-t", String(df))}} = ${x("idf-value", value)}`}
    label={`idf equals the natural log of ${n} over ${df}, ${value}`}
    explain={explainFor(["idf", "ln", "n-docs", "df-t", "idf-value"], {
      "n-docs": `Here, ${n} pages.`,
      "df-t": `Here, ${df} pages use the word.`,
      "idf-value": value === "0.00" ? "0 means every page uses it, so it tells you nothing." : undefined,
    })}
  />
);

export const CosineFormula = () => (
  <Tex
    block
    tex={String.raw`${x("cos", String.raw`\cos(a, b)`)} = \frac{${x("dot", String.raw`a \cdot b`)}}{${x("norm-a", String.raw`\lVert a \rVert`)} \, ${x("norm-b", String.raw`\lVert b \rVert`)}}`}
    label="cosine of a and b equals a dot b over the norm of a times the norm of b"
    explain={explainFor(["cos", "dot", "norm-a", "norm-b"])}
  />
);

export const PpmiFormula = () => (
  <Tex
    block
    tex={String.raw`${x("ppmi", String.raw`\text{PPMI}(w, c)`)} = ${x("max", String.raw`\max`)}\!\left(${x("log2", String.raw`\log_2`)} \frac{${x(
      "p-joint",
      "P(w, c)",
    )}}{${x("p-word", "P(w)")}\,${x("p-context", "P(c)")}},\ ${x("zero", "0")}\right)`}
    label="PPMI of w and c equals the maximum of log base 2 of P of w and c over P of w times P of c, and zero"
    explain={explainFor(["ppmi", "max", "log2", "p-joint", "p-word", "p-context", "zero"])}
  />
);
