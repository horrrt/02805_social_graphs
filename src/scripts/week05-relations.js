// Week 5 · section 1 · Turn links into relationships. Owner: Gyula.
//
// What this section's islands (src/features/week05/relations/) draw into its
// slots on src/app/(week05)/weeks/week05/_sections/Relations.tsx: the strip chart of
// links that join two communities (#chart-relations-crossing), the map of where
// fight and family links run (#chart-relations-map, the shared map in
// week05-map.js), and the sentences read by hand, one label at a time
// (#relations-chips, #relations-lines).
// Data: public/weeks/week05/data/relations.json, written by analysis/week05_relations.py,
// and the shared map in network.json.

/** relations.json, which every part of the section waits for. */
export const RELATIONS = "weeks/week05/data/relations.json";

export const LABEL = { killed: "Killed", family: "Family", enemy: "Enemy", ally: "Ally", teammate: "Teammate" };
const pct = (v) => `${Math.round(v * 100)}%`;
const signed = (z) => `z ${z < 0 ? "−" : "+"}${Math.abs(z).toFixed(1)}`;

// ---- the figure: each label's crossing share against its shuffled labels

/** The strip chart's rows and options. */
export function crossing(data) {
  const rows = [...data.crossing]
    .sort((a, b) => b.crossing - a.crossing)
    .map((c) => ({
      label: LABEL[c.label],
      sub: `${c.arcs} links`,
      real: c.crossing,
      realLabel: pct(c.crossing),
      realTip: `${LABEL[c.label]}: ${pct(c.crossing)} of ${c.arcs} links join two communities, averaged over ${data.communities.runs} Louvain runs`,
      base: [c.null_mean, c.null_sd],
      baseTip: `Shuffled labels: ${pct(c.null_mean)} ± ${pct(c.null_sd)}`,
      badge: signed(c.z),
      bold: c.label === "enemy" || c.label === "family",
    }));
  const opts = {
    domain: [0.1, 0.7],
    ticks: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    fmt: pct,
    axisTitle: "share of links joining two communities",
    aria: "Share of each label's links that join two communities, against shuffled labels",
  };
  return { rows, opts };
}

// ---- what we checked: the sentences read by hand, one label at a time

/** The label the sentences open on. */
export const FIRST_LABEL = "enemy";

/** One chip per label, in LABEL's order: "Enemy · 5/12". */
export function chips(data) {
  return Object.keys(LABEL).map((label) => ({ label, text: `${LABEL[label]} · ${data.precision[label].right}/${data.precision[label].read}` }));
}

/** The concordance of one label's sentences, each with its verdict mark and note. */
export function lines(data, label) {
  const rows = data.concordance
    .filter((r) => r.label === label)
    .map((r) => ({
      page: r.page,
      left: r.left,
      hit: r.hit,
      right: r.right,
      mark: r.verdict === "right" ? "✓" : "✗",
      markTitle: r.verdict === "right" ? "The label describes how the two characters relate" : "The label is wrong here",
      note: r.note,
    }));
  return { caption: `${LABEL[label]}: ${data.precision[label].right} of ${data.precision[label].read} right`, rows };
}

// ---- glossary terms. Main's first call, "Louvain" (w5-term-relations-louvain),
// matched no text in #relations-did, so only "communities" is placed.
export const TERMS = [
  { phrase: "communities", definition: "Groups of characters linked more among themselves than to the rest of the network.", id: "w5-term-relations-communities" },
];

// ---- the map: the pairs one kind of word labels, over the communities

/** The kind the map opens on, and its aria label for each kind. */
export const FIRST_KIND = "enemy";

export function mapAria(kind) {
  return `The Marvel link network coloured by community, with the links whose sentence uses ${kind === "enemy" ? "a fight word" : "a family word"} drawn dark`;
}
