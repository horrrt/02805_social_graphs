import type { ReactNode } from "react";
import { Tex } from "@/lib/Tex";

// Week 3's formulas, written in LaTeX and typeset by KaTeX (Tex). Each part
// is tagged with \htmlClass{x-…} so hovering it explains it. The page's
// sections place them by name; a string from corridor.js places one with
// <tex name="…" v="…"></tex>, which Rich turns into the formula (FORMULAS).
// The numbers are the prose's, pinned by tests/week03-prose.test.mjs.

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

/** P(K ≥ k), the CCDF. */
export const Ccdf = () => (
  <Tex
    tex={`${x("p", "P")}(${x("big", "K")} \\geq ${x("k", "k")})`}
    label="P of K at least k"
    explain={{
      p: "P(…): the share of countries for which the statement in brackets holds.",
      big: "K: a country's number of partners.",
      k: "k: a partner count, read along the chart's horizontal axis.",
    }}
  />
);

const ALPHA_TAIL = "α: the fitted power law's exponent. The share of values at least x falls roughly as x to the power 1 − α, so a larger α means a thinner tail.";

/** α alone, as a table heading, or α = value. */
export const TailAlpha = ({ v }: { v?: string }) => (
  <Tex tex={`${x("alpha", String.raw`\alpha`)}${v ? ` = ${v}` : ""}`} label={v ? `alpha equals ${v}` : "alpha"} explain={{ alpha: ALPHA_TAIL }} />
);

/** x_min, the tail's lower bound. */
export const Xmin = () => (
  <Tex
    tex={x("xmin", String.raw`x_{\min}`)}
    label="x min"
    explain={{ xmin: "x_min: the lower bound of the tail. The power law is fitted only to values at or above it." }}
  />
);

/** p = value, the goodness-of-fit p of a power-law fit. */
export const FitP = ({ v }: { v: string }) => (
  <Tex
    tex={`${x("p", "p")} = ${v}`}
    label={`p equals ${v}`}
    explain={{ p: "p: the share of synthetic datasets drawn from the fitted power law that fit it worse than the real data. Below 0.1 the power law is ruled out." }}
  />
);

const STEP = {
  distance: "Distance: the length of one step along a link when betweenness looks for shortest paths.",
  people: "People: the migrants on the corridor, so a heavy corridor is a short step.",
  routes: "Routes: the flight routes between the two countries, so a well-served pair is a short step.",
};

/** 1 / people, or distance = 1 / people (or routes). */
export const Step = ({ per, named = false }: { per: "people" | "routes"; named?: boolean }) => (
  <Tex
    tex={`${named ? `${x("distance", String.raw`\text{distance}`)} = ` : ""}${x("one", "1")} / ${x(per, String.raw`\text{${per}}`)}`}
    label={`${named ? "distance equals " : ""}1 over ${per}`}
    explain={{
      ...(named ? { distance: STEP.distance } : {}),
      one: "1 over a number: the bigger the number, the shorter the step.",
      [per]: STEP[per],
    }}
  />
);

/** α = 0.85, PageRank's damping factor. */
export const Damping = () => (
  <Tex
    tex={`${x("alpha", String.raw`\alpha`)} = ${x("v", "0.85")}`}
    label="alpha equals 0.85"
    explain={{
      alpha: "α: the damping factor. At each step PageRank follows a link with chance α and jumps to a random country otherwise.",
      v: "0.85: the standard value, so 15% of each step lands anywhere at random.",
    }}
  />
);

const Z = {
  bridge: "z: how many standard deviations of the 100 shuffled networks a country's betweenness sits above their mean.",
  modularity: "z: how many standard deviations of the 100 shuffles' modularity the real network's sits above their mean.",
  role: "z: the within-community z-score, how large a country is among the other members of its own community.",
  table: "z: how far the real value sits from the shuffles' mean, in standard deviations of the shuffles.",
};

/** z = value, or z alone. */
export const ZIs = ({ v, of }: { v?: string; of: keyof typeof Z }) => (
  <Tex tex={`${x("z", "z")}${v ? ` = ${v}` : ""}`} label={v ? `z equals ${v}` : "z"} explain={{ z: Z[of] }} />
);

/** P alone, the participation coefficient. */
export const PartP = () => (
  <Tex tex={x("p", "P")} label="P" explain={{ p: "P: the participation coefficient, how evenly a country's corridors are spread across the communities. 0 when they all stay in one." }} />
);

/** z_i = (s_{i,c_i} − mean) / sd, the within-community z-score. */
export const RoleZ = () => (
  <Tex
    block
    tex={`${x("zi", "z_i")} = \\frac{${x("own", "s_{i,c_i}")} - ${x("mean", String.raw`\mu_{c_i}`)}}{${x("sd", String.raw`\sigma_{c_i}`)}}`}
    label="z i equals s i in its own community minus the community mean mu, over the community standard deviation sigma"
    explain={{
      zi: "z_i: country i's within-community z-score.",
      own: "s_i,c_i: people on country i's corridors to the other members of its own community c_i.",
      mean: "μ_c_i: the average of that number over the community's members.",
      sd: "σ_c_i: how much that number varies across the members, the standard deviation.",
    }}
  />
);

/** P_i = 1 − Σ_c (s_ic / s_i)², the participation coefficient. */
export const RoleP = () => (
  <Tex
    block
    tex={`${x("pi", "P_i")} = 1 - ${x("sum", String.raw`\sum_{c}`)} ${x("sq", String.raw`\left( \frac{${x("sic", "s_{ic}")}}{${x("si", "s_i")}} \right)^{2}`)}`}
    label="P i equals 1 minus the sum over communities c of s i c over s i, squared"
    explain={{
      pi: "P_i: country i's participation coefficient. 0 when every corridor stays in one community, near 1 when they are spread evenly over many.",
      sum: "Σ_c: add up over every community c.",
      sq: "The share squared: one large share counts far more than many small ones, so P stays low when one community dominates.",
      sic: "s_ic: people on country i's corridors into community c.",
      si: "s_i: people on all of country i's corridors.",
    }}
  />
);

/** R², a model's share of the variation explained. */
export const R2 = () => (
  <Tex tex={x("r2", "R^2")} label="R squared" explain={{ r2: "R²: how much of the variation in corridor sizes the model accounts for, from 0 (none) to 1 (all)." }} />
);

/** (real − null mean) / null standard deviation, what z is. */
export const ZDef = () => (
  <Tex
    tex={`(${x("real", String.raw`\text{real}`)} - ${x("mean", String.raw`\text{null mean}`)}) / ${x("sd", String.raw`\text{null standard deviation}`)}`}
    label="real minus null mean, over null standard deviation"
    explain={{
      real: "Real: the value on the real network.",
      mean: "Null mean: the average over the 100 shuffled networks.",
      sd: "Null standard deviation: how much the shuffles' values typically vary.",
    }}
  />
);

/** ρ = value, Spearman's rank correlation, placed by corridor.js. */
export const Rho = ({ v }: { v: string }) => (
  <Tex
    tex={`${x("rho", String.raw`\rho`)} = ${v}`}
    label={`rho equals ${v}`}
    explain={{ rho: "ρ: Spearman's rank correlation between the two rankings. 1 when they agree exactly, 0 when they are unrelated." }}
  />
);

/** z = value against the bridge null, placed by corridor.js. */
const ZBridge = ({ v }: { v: string }) => <ZIs v={v} of="bridge" />;

/** The formulas a string from corridor.js may name in a <tex> tag. */
export const FORMULAS: Record<string, (props: { v: string }) => ReactNode> = { rho: Rho, z: ZBridge };
