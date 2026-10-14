import { explainFor } from "@/lib/glossary";
import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex). Each part
// is tagged with \htmlClass{x-…} so hovering it explains it, in the site's
// shared wording (src/lib/glossary.ts) with this page's numbers added. The
// numbers are the prose's, pinned by tests/week02-data.test.mjs and
// tests/week02-prose.test.mjs, which read the LaTeX with the tags unwrapped.

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

/** p = value: an empirical tail over the rewired maps or nulls, or the chance a pair is linked. */
export const PIs = ({ v, kind }: { v: string; kind: "removal" | "shuffle" | "link" }) =>
  kind === "link" ? (
    <Tex tex={`${x("p-link", "p")} = ${v}`} label={`p equals ${v}`} explain={explainFor(["p-link"])} />
  ) : (
    <Tex
      tex={`${x("p-empirical", "p")} = ${v}`}
      label={`p equals ${v}`}
      explain={explainFor(["p-empirical"], {
        "p-empirical": kind === "removal" ? "Here, the 1,000 rewired maps, and how many of them this removal strands." : "Here, the 1,000 shuffled networks.",
      })}
    />
  );

/** z = value, against the degree-preserving shuffle or G(n, m). */
export const ZIs = ({ v }: { v: string }) => <Tex tex={`${x("z", "z")} = ${v}`} label={`z equals ${v}`} explain={explainFor(["z"])} />;

const GNM = { "n-nodes": "Here, the 303 articles.", "m-links": "Here, 1,434." };

/** G(n, m), the random-graph null. */
export const Gnm = () => (
  <Tex tex={x("gnm", `G(${x("n-nodes", "n")}, ${x("m-links", "m")})`)} label="G of n and m" explain={explainFor(["gnm", "n-nodes", "m-links"], GNM)} />
);

/** n alone, as the random null keeps it. */
export const GnmN = () => <Tex tex={x("n-nodes", "n")} label="n" explain={explainFor(["n-nodes"], GNM)} />;

/** m alone, as the random null keeps it. */
export const GnmM = () => <Tex tex={x("m-links", "m")} label="m" explain={explainFor(["m-links"], GNM)} />;

/** ⟨k²⟩/⟨k⟩, the mean degree at the end of a random link, with "= value" when given. */
export const EdgeMean = ({ v }: { v?: string }) => (
  <Tex
    tex={`${x("edge-degree", `${x("k2-avg", String.raw`\langle k^2 \rangle`)} / ${x("k-avg", String.raw`\langle k \rangle`)}`)}${v ? ` = ${v}` : ""}`}
    label={`mean of k squared over mean of k${v ? ` equals ${v}` : ""}`}
    explain={explainFor(["edge-degree", "k2-avg", "k-avg"])}
  />
);

/** 106 / 2,868, the biggest hub's share of link ends. */
export const HubShare = () => (
  <Tex
    tex={`${x("hub-links", "106")} / ${x("link-ends", "2{,}868")}`}
    label="106 over 2,868"
    explain={explainFor(["hub-links", "link-ends"], { "hub-links": "Here, Spider-Man's 106.", "link-ends": "Here, 2,868 for the 1,434 links." })}
  />
);

/** (1 + draws at least as extreme) / (1 + total), the empirical tail; `total` is 1,000 or "draws". */
export const Tail = ({ total }: { total: "1,000" | "draws" }) => (
  <Tex
    tex={`(${x("tail-plus-one", "1")} + ${x("extreme", String.raw`\text{draws at least as extreme}`)}) / (${x("tail-plus-one", "1")} + ${x("n-draws", total === "draws" ? String.raw`\text{draws}` : "1{,}000")})`}
    label={`1 plus draws at least as extreme, over 1 plus ${total}`}
    explain={explainFor(["tail-plus-one", "extreme", "n-draws"], { "n-draws": "Here, 1,000 per null." })}
  />
);
