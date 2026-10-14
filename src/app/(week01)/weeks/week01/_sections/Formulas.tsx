import { explainFor } from "@/lib/glossary";
import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex). Each part
// is tagged with \htmlClass{x-…} so hovering it explains it, in the site's
// shared wording (src/lib/glossary.ts) with this page's numbers added. The
// numbers are the prose's, pinned by tests/week01-prose.test.mjs, which reads
// the LaTeX with the tags unwrapped and {,} read as a comma.

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

const TOTAL = "Here, 2,087: every card's incoming links + 1, added up over all 303 cards.";

/** 1 − (1 − p)^d, the chance of seeing a card at least once in d draws. */
export const SeenFormula = () => (
  <Tex
    tex={x("seen", String.raw`1 - ${x("miss", String.raw`(1 - ${x("p-draw", "p")})^{${x("draws", "d")}}`)}`)}
    label="1 minus, 1 minus p, to the power d"
    explain={explainFor(["seen", "miss", "p-draw", "draws"], { draws: "Five per pack." })}
  />
);

/** p = 1/303, equal odds. */
export const EqualOdds = () => (
  <Tex
    tex={`${x("p-draw", "p")} = 1/${x("n-items", "303")}`}
    label="p equals 1 over 303"
    explain={explainFor(["p-draw", "n-items"], { "n-items": "Here, the 303 cards." })}
  />
);

/** (incoming links + 1)/2,087, with "p =" in front when `p` is set. */
export const OurOdds = ({ p = false, spaced = false }: { p?: boolean; spaced?: boolean }) => (
  <Tex
    tex={`${p ? `${x("p-draw", "p")} = ` : ""}(${x("in-links", String.raw`\text{incoming links}`)} + ${x("plus-one", "1")})${spaced ? " / " : "/"}${x("weight-total", "2{,}087")}`}
    label={`${p ? "p equals " : ""}incoming links plus 1, over 2,087`}
    explain={explainFor([...(p ? (["p-draw"] as const) : []), "in-links", "plus-one", "weight-total"], { "weight-total": TOTAL })}
  />
);

/** 1 / 2,087, the lowest drop rate. */
export const LowestOdds = () => (
  <Tex
    tex={`${x("weight-min", "1")} / ${x("weight-total", "2{,}087")}`}
    label="1 over 2,087"
    explain={explainFor(["weight-min", "weight-total"], { "weight-total": TOTAL })}
  />
);

/** degree + 1, the quantity a log axis can show. */
export const DegreePlusOne = () => (
  <Tex
    tex={`${x("degree", String.raw`\text{degree}`)} + ${x("log-shift", "1")}`}
    label="degree plus 1"
    explain={explainFor(["degree", "log-shift"])}
  />
);

/** p < 0.001, under a correlation. */
export const PBelow = () => (
  <Tex tex={`${x("p-value", "p")} < 0.001`} label="p below 0.001" explain={explainFor(["p-value"], { "p-value": "Here, below one in a thousand." })} />
);
