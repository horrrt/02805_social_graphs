import type { ReactNode } from "react";
import { explainFor } from "@/lib/glossary";
import { Tex } from "@/lib/Tex";

// Week 3's formulas, written in LaTeX and typeset by KaTeX (Tex). Each part
// is tagged with \htmlClass{x-…} so hovering it explains it, in the site's
// shared wording (src/lib/glossary.ts). The page's sections place them by
// name; a string from corridor.js places one with <tex name="…" v="…"></tex>,
// which Rich turns into the formula (FORMULAS). The numbers are the prose's,
// pinned by tests/week03-prose.test.mjs.

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

/** P(K ≥ k), the CCDF. */
export const Ccdf = () => (
  <Tex
    tex={`${x("deg-share", "P")}(${x("deg-K", "K")} \\geq ${x("deg-k", "k")})`}
    label="P of K at least k"
    explain={explainFor(["deg-share", "deg-K", "deg-k"], { "deg-share": "Here, countries." })}
  />
);

/** α alone, as a table heading, or α = value. */
export const TailAlpha = ({ v }: { v?: string }) => (
  <Tex tex={`${x("alpha-tail", String.raw`\alpha`)}${v ? ` = ${v}` : ""}`} label={v ? `alpha equals ${v}` : "alpha"} explain={explainFor(["alpha-tail"])} />
);

/** x_min, the tail's lower bound. */
export const Xmin = () => <Tex tex={x("xmin", String.raw`x_{\min}`)} label="x min" explain={explainFor(["xmin"])} />;

/** p = value, the goodness-of-fit p of a power-law fit. */
export const FitP = ({ v }: { v: string }) => <Tex tex={`${x("p-fit", "p")} = ${v}`} label={`p equals ${v}`} explain={explainFor(["p-fit"])} />;

/** 1 / people, or distance = 1 / people (or routes). */
export const Step = ({ per, named = false }: { per: "people" | "routes"; named?: boolean }) => (
  <Tex
    tex={`${named ? `${x("distance", String.raw`\text{distance}`)} = ` : ""}${x("inverse", "1")} / ${x(per, String.raw`\text{${per}}`)}`}
    label={`${named ? "distance equals " : ""}1 over ${per}`}
    explain={explainFor([...(named ? (["distance"] as const) : []), "inverse", per])}
  />
);

/** α = 0.85, PageRank's damping factor. */
export const Damping = () => (
  <Tex tex={`${x("alpha-damping", String.raw`\alpha`)} = ${x("damping-value", "0.85")}`} label="alpha equals 0.85" explain={explainFor(["alpha-damping", "damping-value"])} />
);

const AGAINST = {
  bridge: "Here, a country's betweenness against 100 shuffled networks.",
  modularity: "Here, the modularity against 100 shuffled networks.",
  table: "Here, against 100 shuffled networks.",
};

/** z = value, or z alone: against a null (`of` says which), or the role coordinate. */
export const ZIs = ({ v, of }: { v?: string; of: keyof typeof AGAINST | "role" }) =>
  of === "role" ? (
    <Tex tex={`${x("z-within", "z")}${v ? ` = ${v}` : ""}`} label={v ? `z equals ${v}` : "z"} explain={explainFor(["z-within"])} />
  ) : (
    <Tex tex={`${x("z", "z")}${v ? ` = ${v}` : ""}`} label={v ? `z equals ${v}` : "z"} explain={explainFor(["z"], { z: AGAINST[of] })} />
  );

/** P alone, the participation coefficient. */
export const PartP = () => <Tex tex={x("p-part", "P")} label="P" explain={explainFor(["p-part"])} />;

/** z_i = (s_{i,c_i} − μ) / σ, the within-community z-score. */
export const RoleZ = () => (
  <Tex
    block
    tex={`${x("z-within", "z_i")} = \\frac{${x("s-own", "s_{i,c_i}")} - ${x("mu-community", String.raw`\mu_{c_i}`)}}{${x("sigma-community", String.raw`\sigma_{c_i}`)}}`}
    label="z i equals s i in its own community minus the community mean mu, over the community standard deviation sigma"
    explain={explainFor(["z-within", "s-own", "mu-community", "sigma-community"], { "s-own": "Here, people on the corridors." })}
  />
);

/** P_i = 1 − Σ_c (s_ic / s_i)², the participation coefficient. */
export const RoleP = () => (
  <Tex
    block
    tex={`${x("p-part", "P_i")} = 1 - ${x("sum-communities", String.raw`\sum_{c}`)} ${x("share-squared", String.raw`\left( \frac{${x("s-ic", "s_{ic}")}}{${x("s-i", "s_i")}} \right)^{2}`)}`}
    label="P i equals 1 minus the sum over communities c of s i c over s i, squared"
    explain={explainFor(["p-part", "sum-communities", "share-squared", "s-ic", "s-i"])}
  />
);

/** R², a model's share of the variation explained. */
export const R2 = () => <Tex tex={x("r2", "R^2")} label="R squared" explain={explainFor(["r2"])} />;

/** (real − null mean) / null standard deviation, what z is. */
export const ZDef = () => (
  <Tex
    tex={`(${x("z-real", String.raw`\text{real}`)} - ${x("null-mean", String.raw`\text{null mean}`)}) / ${x("null-sd", String.raw`\text{null standard deviation}`)}`}
    label="real minus null mean, over null standard deviation"
    explain={explainFor(["z-real", "null-mean", "null-sd"])}
  />
);

/** ρ = value, Spearman's rank correlation, placed by corridor.js. */
export const Rho = ({ v }: { v: string }) => <Tex tex={`${x("rho", String.raw`\rho`)} = ${v}`} label={`rho equals ${v}`} explain={explainFor(["rho"])} />;

/** z = value against the bridge null, placed by corridor.js. */
const ZBridge = ({ v }: { v: string }) => <ZIs v={v} of="bridge" />;

/** The formulas a string from corridor.js may name in a <tex> tag. */
export const FORMULAS: Record<string, (props: { v: string }) => ReactNode> = { rho: Rho, z: ZBridge };
