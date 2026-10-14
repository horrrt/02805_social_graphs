import { explainFor } from "@/lib/glossary";
import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex): Heaps'
// law, the fame fit's logs, and the z, p, r and β the prose reports. Each
// symbol is tagged with \htmlClass{x-…} so hovering it explains it, in the
// site's shared wording (src/lib/glossary.ts) with this page's numbers added.
// The numbers are the prose's, pinned by the Week 5 tests, which read the
// LaTeX with the tags unwrapped (tests/week04-html.mjs).

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

/** z = value against the shuffled labels, random orders or rewired networks. */
export const Z = ({ v }: { v: string }) => <Tex tex={`${x("z", "z")} = ${v}`} label={`z equals ${v}`} explain={explainFor(["z"])} />;

/** z = value against the pages nearest in length (section 7). */
export const ZNear = ({ v }: { v: string }) => (
  <Tex tex={`${x("z-neighbours", "z")} = ${v}`} label={`z equals ${v}`} explain={explainFor(["z-neighbours"], { "z-neighbours": "Here, the 30 pages nearest in length." })} />
);

/** p = value from shuffles, counting the real one as one more. */
export const P = ({ v }: { v: string }) => <Tex tex={`${x("p-empirical", "p")} = ${v}`} label={`p equals ${v}`} explain={explainFor(["p-empirical"])} />;

/** p = value, or p < value, from a test's formula (binomial, hypergeometric, Spearman). */
export const PTest = ({ v, below = false }: { v: string; below?: boolean }) => (
  <Tex tex={`${x("p-value", "p")} ${below ? "<" : "="} ${v}`} label={`p ${below ? "below" : "equals"} ${v}`} explain={explainFor(["p-value"])} />
);

/** Pearson r = value, on the logs of length and 1 + in-degree. */
export const R = ({ v }: { v: string }) => <Tex tex={`${x("pearson-r", "r")} = ${v}`} label={`r equals ${v}`} explain={explainFor(["pearson-r"])} />;

/** β, or β = value, Heaps' exponent. */
export const Beta = ({ v }: { v?: string }) => (
  <Tex tex={`${x("beta-heaps", String.raw`\beta`)}${v ? ` = ${v}` : ""}`} label={v ? `beta equals ${v}` : "beta"} explain={explainFor(["beta-heaps"])} />
);

/** K = value, Heaps' constant. */
export const K = ({ v }: { v: string }) => <Tex tex={`${x("heaps-k", "K")} = ${v}`} label={`K equals ${v}`} explain={explainFor(["heaps-k"])} />;

/** Heaps' law, V = K n^β; `dot` writes the product K·n. */
export const HeapsLaw = ({ dot = false }: { dot?: boolean }) => (
  <Tex
    tex={`${x("types-seen", "V")} = ${x("heaps-k", "K")}${dot ? String.raw` \cdot ` : String.raw`\,`}${x("tokens-read", "n")}^{${x("beta-heaps", String.raw`\beta`)}}`}
    label="V equals K times n to the power beta"
    explain={explainFor(["types-seen", "heaps-k", "tokens-read", "beta-heaps"])}
  />
);

/** log V or log n, the axes of Heaps' straight-line fit. */
export const Log = ({ of }: { of: "V" | "n" }) => (
  <Tex
    tex={String.raw`${x("log-fit", String.raw`\log`)} ${x(of === "V" ? "types-seen" : "tokens-read", of)}`}
    label={`log ${of}`}
    explain={explainFor(["log-fit", of === "V" ? "types-seen" : "tokens-read"])}
  />
);

/** ln(words), the fame fit's outcome. */
export const LnWords = () => (
  <Tex
    tex={String.raw`${x("ln-length", String.raw`\ln`)}(${x("words-doc", String.raw`\text{words}`)})`}
    label="the natural log of words"
    explain={explainFor(["ln-length", "words-doc"])}
  />
);

/** ln(1 + in-degree), the fame fit's predictor. */
export const LnInDegree = () => (
  <Tex
    tex={String.raw`${x("ln-length", String.raw`\ln`)}(${x("log-shift", "1 +")} ${x("in-links", String.raw`\text{in-degree}`)})`}
    label="the natural log of 1 plus in-degree"
    explain={explainFor(["ln-length", "log-shift", "in-links"], { "in-links": "Here, the other pages that link to a page." })}
  />
);

/** exp(residual), a page's length over the predicted length. */
export const ExpResidual = () => (
  <Tex
    tex={String.raw`${x("exp", String.raw`\exp`)}(${x("residual-log", String.raw`\text{residual}`)})`}
    label="e to the power of the residual"
    explain={explainFor(["exp", "residual-log"])}
  />
);
