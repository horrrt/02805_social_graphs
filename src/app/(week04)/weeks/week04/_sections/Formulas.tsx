import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex): the z, p
// and α the prose reports. Each symbol is tagged with \htmlClass{x-…} so
// hovering it explains it. The numbers are the prose's, pinned by the Week 4
// tests, which read the LaTeX with the tags unwrapped (tests/week04-html.mjs).

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

const ALPHA = "α: the disparity filter's threshold. It keeps a link only when chance would give the link's weight with a probability below α, so a smaller α keeps fewer links.";

/** z = value against the random baseline. */
export const Z = ({ v }: { v: string }) => (
  <Tex
    tex={`${x("z", "z")} = ${v}`}
    label={`z equals ${v}`}
    explain={{ z: "z: how many standard deviations the real value sits from the random baseline's mean." }}
  />
);

/** p = value, the share of random runs at least as extreme. */
export const P = ({ v }: { v: string }) => (
  <Tex
    tex={`${x("p", "p")} = ${v}`}
    label={`p equals ${v}`}
    explain={{ p: "p: the share of random runs that give a result at least as extreme as the real one. Small means chance alone rarely does it." }}
  />
);

/** α = value, or α alone, the disparity filter's threshold. */
export const Alpha = ({ v }: { v?: string }) => (
  <Tex tex={`${x("alpha", String.raw`\alpha`)}${v ? ` = ${v}` : ""}`} label={v ? `alpha equals ${v}` : "alpha"} explain={{ alpha: ALPHA }} />
);
