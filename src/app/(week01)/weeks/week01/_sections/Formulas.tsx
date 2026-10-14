import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex). Each part
// is tagged with \htmlClass{x-…} so hovering it explains it. The numbers are
// the prose's, pinned by tests/week01-prose.test.mjs, which reads the LaTeX
// with the tags unwrapped and {,} read as a comma.

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

const TOTAL = "2,087: every card's incoming links + 1, added up over all 303 cards, so the chances add up to 1.";

/** 1 − (1 − p)^d, the chance of seeing a card at least once in d draws. */
export const SeenFormula = () => (
  <Tex
    tex={x("seen", String.raw`1 - ${x("miss", String.raw`(1 - ${x("p", "p")})^{${x("d", "d")}}`)}`)}
    label="1 minus, 1 minus p, to the power d"
    explain={{
      seen: "The chance of seeing the card at least once: 1 minus the chance of missing it every time.",
      miss: "(1 − p)^d: the chance of missing the card on all d draws. Each draw misses it with chance 1 − p.",
      p: "p: the card's chance of being drawn on one draw.",
      d: "d: the number of draws, five per pack.",
    }}
  />
);

/** p = 1/303, equal odds. */
export const EqualOdds = () => (
  <Tex
    tex={`${x("p", "p")} = 1/${x("n", "303")}`}
    label="p equals 1 over 303"
    explain={{
      p: "p: one card's chance of being drawn on one draw.",
      n: "303: all the cards. With equal odds each gets the same share.",
    }}
  />
);

/** (incoming links + 1)/2,087, with "p =" in front when `p` is set. */
export const OurOdds = ({ p = false, spaced = false }: { p?: boolean; spaced?: boolean }) => (
  <Tex
    tex={`${p ? `${x("p", "p")} = ` : ""}(${x("kin", String.raw`\text{incoming links}`)} + ${x("one", "1")})${spaced ? " / " : "/"}${x("total", "2{,}087")}`}
    label={`${p ? "p equals " : ""}incoming links plus 1, over 2,087`}
    explain={{
      ...(p ? { p: "p: the card's chance of being drawn on one draw." } : {}),
      kin: "Incoming links: how many of the other articles link to this card's article.",
      one: "+ 1: so a card with no incoming links still has a chance.",
      total: TOTAL,
    }}
  />
);

/** 1 / 2,087, the lowest drop rate. */
export const LowestOdds = () => (
  <Tex
    tex={`${x("one", "1")} / ${x("total", "2{,}087")}`}
    label="1 over 2,087"
    explain={{
      one: "1: a card with no incoming links gets one chance, the + 1 every card gets.",
      total: TOTAL,
    }}
  />
);

/** degree + 1, the quantity a log axis can show. */
export const DegreePlusOne = () => (
  <Tex
    tex={`${x("k", String.raw`\text{degree}`)} + ${x("one", "1")}`}
    label="degree plus 1"
    explain={{
      k: "Degree: an article's link count.",
      one: "+ 1: a log axis has no place for 0, so every count moves up by one.",
    }}
  />
);

/** p < 0.001, under a correlation. */
export const PBelow = () => (
  <Tex
    tex={`${x("p", "p")} < ${x("cut", "0.001")}`}
    label="p below 0.001"
    explain={{
      p: "p: the chance of a correlation at least this strong if the two counts were unrelated.",
      cut: "0.001: one in a thousand. Below it, chance alone is a poor explanation.",
    }}
  />
);
