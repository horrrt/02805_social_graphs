import { explainFor } from "@/lib/glossary";
import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex): the
// TF-IDF weight and the z, p and R² the prose reports. Each symbol is tagged
// with \htmlClass{x-…} so hovering it explains it, in the site's shared
// wording (src/lib/glossary.ts) with this page's numbers added. The numbers
// are the prose's, pinned by tests/week06-prose.test.mjs, which reads the
// LaTeX with the tags unwrapped (tests/week04-html.mjs).

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

/** A word's TF-IDF weight on a page, as the explorer computes it. */
export const TfIdfWeight = () => (
  <Tex
    tex={String.raw`${x("tfidf", String.raw`\text{TF-IDF}(w, d)`)} = ${x("tf", String.raw`\tfrac{${x("count", String.raw`\text{count}(w, d)`)}}{${x("len", String.raw`\lvert d \rvert`)}}`)} \times ${x(
      "idf",
      String.raw`${x("ln", String.raw`\ln`)} \tfrac{${x("n-docs", "303")}}{${x("df", String.raw`\text{DF}(w)`)}}`,
    )}`}
    label="TF-IDF of word w on page d equals the count of w on d over the length of d, times the natural log of 303 over DF of w"
    explain={explainFor(["tfidf", "tf", "count", "len", "idf", "ln", "n-docs", "df"], { "n-docs": "Here, the 303 pages." })}
  />
);

/** z = value against the shuffled labels. */
export const Z = ({ v }: { v: string }) => <Tex tex={`${x("z", "z")} = ${v}`} label={`z equals ${v}`} explain={explainFor(["z"])} />;

/** p = value, from the length model's regression. */
export const PTest = ({ v }: { v: string }) => <Tex tex={`${x("p-value", "p")} = ${v}`} label={`p equals ${v}`} explain={explainFor(["p-value"])} />;

/** R² = value, the length model's fit. */
export const R2 = ({ v }: { v: string }) => <Tex tex={`${x("r2", "R^2")} = ${v}`} label={`R squared equals ${v}`} explain={explainFor(["r2"])} />;
