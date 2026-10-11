// The post template's toy charts (public/weeks/_template/), as data. Each one
// is drawn by the kit component a real section would use (src/kit/), with toy
// numbers, so a copied template shows the finished look. The islands in
// src/features/template/ draw them. Replace this file with one module per
// section, src/scripts/weekNN-<section>.js, holding that section's pure
// builders: no DOM, no listeners, no fetch.

/** The toy networks' file under public/: pass it to asset() once hydrated. */
export const TOY = "styleguide/data/graphs.json";

/** Zachary's karate club from graphs.json, the toy both network charts draw. */
export const karate = ({ karate: k }) => ({ ratio: k.ratio, nodes: k.nodes, links: k.links, groups: k.groups });

export const TOYS = {
  // Hero: one figure that answers the post's question.
  hero: (graphs) => ({
    ...karate(graphs), theme: "dark", legend: true, aria: "Toy figure: Zachary's karate club, coloured by the club each member joined",
  }),
  // Section 2: two panels, a network a reader can edit and the numbers behind it.
  second: (graphs) => ({
    ...karate(graphs), labels: "inside", badges: true, movable: true, legend: true,
    note: "Click any member to move them to the next group.", aria: "Toy network: Zachary's karate club; click a member to move them",
  }),
};

// Findings: each section's answer against its baseline, and the line under it.
export const minis = {
  1: [{ domain: [0, 1], real: 0.62, realLabel: "0.62", base: [0.41, 0.04], baseLabel: "shuffled 0.41", aria: "Toy: a result against its baseline" },
    "Toy: the section's number against its baseline · z = 5.3"],
  2: [{ domain: [0, 20], real: 9, realLabel: "9 of 30", ref: 2.7, refLabel: "expected 2.7", aria: "Toy: a count against its expected value" },
    "Toy: a count against what chance would give"],
};

// Section 1: a result against its baseline, and the passage checked.
export const first = {
  rows: [
    { label: "First toy label", real: 0.54, realLabel: "54%", base: [0.42, 0.03], baseLabel: "shuffled 42%" },
    { label: "Second toy label", real: 0.23, realLabel: "23%", base: [0.42, 0.04], baseLabel: "shuffled 42%" },
  ],
  opts: { domain: [0, 1], ticks: [0, 0.5, 1], fmt: (v) => `${Math.round(v * 100)}%`, aria: "Toy strip chart: two results against their baselines" },
  passage: { page: "Toy_page", text: "A toy sentence from the data, with the word that carries the claim marked.", highlight: "marked" },
};

// Section 2's right panel and the term in its prose.
export const second = {
  table: {
    caption: "Toy table",
    columns: [{ key: "group", label: "Group" }, { key: "size", label: "Members", num: true }, { key: "links", label: "Links inside", num: true }],
    rows: [{ group: "Toy group A", size: 17, links: 35 }, { group: "Toy group B", size: 17, links: 33 }],
  },
  term: { phrase: "term", definition: "A toy definition: one plain sentence, with an example.", id: "tpl-term" },
};
