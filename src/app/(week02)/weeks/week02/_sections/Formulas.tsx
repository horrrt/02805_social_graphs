import { Tex } from "@/lib/Tex";

// The post's formulas, written in LaTeX and typeset by KaTeX (Tex). Each part
// is tagged with \htmlClass{x-…} so hovering it explains it. The numbers are
// the prose's, pinned by tests/week02-data.test.mjs and
// tests/week02-prose.test.mjs, which read the LaTeX with the tags unwrapped.

const x = (name: string, tex: string) => String.raw`\htmlClass{x-${name}}{${tex}}`;

const P = {
  removal: "p: the share of the 1,000 rewired maps in which this removal strands at least as many articles, counting the real map as one more. Small means the real result is rare under the shuffle.",
  shuffle: "p: the share of the 1,000 shuffled networks at least as extreme as the real one, on the nearer side, counting the real network as one more.",
  link: "p: the chance that any one pair of articles is linked.",
};

/** p = value, an empirical tail or a link probability; `kind` picks what p means. */
export const PIs = ({ v, kind }: { v: string; kind: keyof typeof P }) => (
  <Tex tex={`${x("p", "p")} = ${v}`} label={`p equals ${v}`} explain={{ p: P[kind] }} />
);

/** z = value, against the degree-preserving shuffle or G(n, m). */
export const ZIs = ({ v }: { v: string }) => (
  <Tex
    tex={`${x("z", "z")} = ${v}`}
    label={`z equals ${v}`}
    explain={{ z: "z: how many standard deviations of the null's draws the real value sits from their mean. The sign says on which side." }}
  />
);

const GNM = {
  g: "G(n, m): a random network with n nodes and m links, each link placed between a pair of nodes picked uniformly at random.",
  n: "n: the number of nodes, here the 303 articles.",
  m: "m: the number of links, here 1,434.",
};

/** G(n, m), the random-graph null. */
export const Gnm = () => <Tex tex={x("g", `G(${x("n", "n")}, ${x("m", "m")})`)} label="G of n and m" explain={GNM} />;

/** n or m alone, as the random null keeps them. */
export const GnmPart = ({ part }: { part: "n" | "m" }) => <Tex tex={x(part, part)} label={part} explain={{ [part]: GNM[part] }} />;

/** ⟨k²⟩/⟨k⟩, the mean degree at the end of a random link, with "= value" when given. */
export const EdgeMean = ({ v }: { v?: string }) => (
  <Tex
    tex={`${x("ratio", `${x("k2", String.raw`\langle k^2 \rangle`)} / ${x("k", String.raw`\langle k \rangle`)}`)}${v ? ` = ${v}` : ""}`}
    label={`mean of k squared over mean of k${v ? ` equals ${v}` : ""}`}
    explain={{
      ratio: "⟨k²⟩/⟨k⟩: the average degree at the end of a randomly chosen link. A hub sits at the end of many links, so it is picked often.",
      k2: "⟨k²⟩: the average, over articles, of each article's degree squared. Hubs weigh heavily in it.",
      k: "⟨k⟩: the average degree, the number of links per article.",
    }}
  />
);

/** 106 / 2,868, the biggest hub's share of link ends. */
export const HubShare = () => (
  <Tex
    tex={`${x("hub", "106")} / ${x("ends", "2{,}868")}`}
    label="106 over 2,868"
    explain={{
      hub: "106: Spider-Man's links, the most of any article.",
      ends: "2,868: all link ends, two for each of the 1,434 links.",
    }}
  />
);

/** (1 + draws at least as extreme) / (1 + total), the empirical tail; `total` is 1,000 or "draws". */
export const Tail = ({ total }: { total: "1,000" | "draws" }) => (
  <Tex
    tex={`(${x("one", "1")} + ${x("extreme", String.raw`\text{draws at least as extreme}`)}) / (${x("one", "1")} + ${x("total", total === "draws" ? String.raw`\text{draws}` : "1{,}000")})`}
    label={`1 plus draws at least as extreme, over 1 plus ${total}`}
    explain={{
      one: "1 +: the real network counts as one more draw, so p is never 0.",
      extreme: "Draws at least as extreme: null networks whose value is as far out as the real one, or farther, on the same side.",
      total: total === "draws" ? "Draws: all the null networks drawn, 1,000 per null." : "1,000: the null networks drawn.",
    }}
  />
);
