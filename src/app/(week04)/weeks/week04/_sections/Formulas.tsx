import { explainFor } from "@/lib/glossary";
import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex): the z, p
// and α the prose reports. Each symbol is tagged with \htmlClass{x-…} so
// hovering it explains it, in the site's shared wording (src/lib/glossary.ts).
// The numbers are the prose's, pinned by the Week 4 tests, which read the
// LaTeX with the tags unwrapped (tests/week04-html.mjs).

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

/** z = value against the random baseline. */
export const Z = ({ v }: { v: string }) => <Tex tex={`${x("z", "z")} = ${v}`} label={`z equals ${v}`} explain={explainFor(["z"])} />;

/** p = value, the share of random runs at least as extreme. */
export const P = ({ v }: { v: string }) => <Tex tex={`${x("p-empirical", "p")} = ${v}`} label={`p equals ${v}`} explain={explainFor(["p-empirical"])} />;

/** α = value, or α alone, the disparity filter's threshold. */
export const Alpha = ({ v }: { v?: string }) => (
  <Tex tex={`${x("alpha-disparity", String.raw`\alpha`)}${v ? ` = ${v}` : ""}`} label={v ? `alpha equals ${v}` : "alpha"} explain={explainFor(["alpha-disparity"])} />
);
