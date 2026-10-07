// The debriefs' formulas, written once in LaTeX and typeset by KaTeX (Tex).
import { Tex } from "@/lib/Tex";

export const TfIdfFormula = () => (
  <Tex
    block
    tex={String.raw`\text{tf-idf}(t, d) = \frac{\text{count}(t, d)}{\lvert d \rvert} \times \ln \frac{N}{\text{df}(t)}`}
    label="tf-idf of t in d equals count of t in d over the length of d, times the natural log of N over df of t"
  />
);

/** idf = ln(N / df) = value, inline in a sentence. */
export const IdfInline = ({ n, df, value }: { n: number; df: number; value: string }) => (
  <Tex tex={String.raw`\text{idf} = \ln \tfrac{${n}}{${df}} = ${value}`} label={`idf equals the natural log of ${n} over ${df}, ${value}`} />
);

export const CosineFormula = () => (
  <Tex
    block
    tex={String.raw`\cos(a, b) = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert}`}
    label="cosine of a and b equals a dot b over the norm of a times the norm of b"
  />
);

export const PpmiFormula = () => (
  <Tex
    block
    tex={String.raw`\text{PPMI}(w, c) = \max\!\left(\log_2 \frac{P(w, c)}{P(w)\,P(c)},\ 0\right)`}
    label="PPMI of w and c equals the maximum of log base 2 of P of w and c over P of w times P of c, and zero"
  />
);
