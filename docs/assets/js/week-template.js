// The post template's toy charts (docs/weeks/_template/). Each one is drawn by
// the kit component a real section would use, with toy numbers, so a copied
// template shows the finished look. Replace this file with one script per
// section, docs/assets/js/weekNN-<section>.js, reading its script's JSON.

import { loadData, miniStrip, networkView, passage, stripChart, table, termify } from "./kit.js?v=3";

const TOY = new URL("../../styleguide/data/graphs.json?v=1", import.meta.url);

async function boot() {
  const k = (await loadData(TOY)).karate;
  const karate = { ratio: k.ratio, nodes: k.nodes, links: k.links, groups: k.groups };

  // Hero: one figure that answers the post's question.
  networkView(document.getElementById("chart-hero"), {
    ...karate, theme: "dark", legend: true, aria: "Toy figure: Zachary's karate club, coloured by the club each member joined",
  });

  // Findings: each section's answer against its baseline.
  const minis = {
    1: [{ domain: [0, 1], real: 0.62, realLabel: "0.62", base: [0.41, 0.04], baseLabel: "shuffled 0.41", aria: "Toy: a result against its baseline" },
      "Toy: the section's number against its baseline · z = 5.3"],
    2: [{ domain: [0, 20], real: 9, realLabel: "9 of 30", ref: 2.7, refLabel: "expected 2.7", aria: "Toy: a count against its expected value" },
      "Toy: a count against what chance would give"],
  };
  for (const host of document.querySelectorAll("#findings [data-finding]")) {
    const [spec, note] = minis[host.dataset.finding];
    const small = document.createElement("small");
    small.textContent = note;
    host.replaceChildren(miniStrip(spec), small);
  }

  // Section 1: a result against its baseline, and the passage checked.
  document.getElementById("chart-first").append(
    stripChart(
      [
        { label: "First toy label", real: 0.54, realLabel: "54%", base: [0.42, 0.03], baseLabel: "shuffled 42%" },
        { label: "Second toy label", real: 0.23, realLabel: "23%", base: [0.42, 0.04], baseLabel: "shuffled 42%" },
      ],
      { domain: [0, 1], ticks: [0, 0.5, 1], fmt: (v) => `${Math.round(v * 100)}%`, aria: "Toy strip chart: two results against their baselines" },
    ),
  );
  document.getElementById("first-passage").append(
    passage({ page: "Toy_page", text: "A toy sentence from the data, with the word that carries the claim marked.", highlight: "marked" }),
  );

  // Section 2: two panels, a network a reader can edit and the numbers behind it.
  networkView(document.getElementById("chart-second-left"), {
    ...karate, labels: "inside", badges: true, movable: true, legend: true,
    note: "Click any member to move them to the next group.", aria: "Toy network: Zachary's karate club; click a member to move them",
  });
  document.getElementById("chart-second-right").append(
    table({
      caption: "Toy table",
      columns: [{ key: "group", label: "Group" }, { key: "size", label: "Members", num: true }, { key: "links", label: "Links inside", num: true }],
      rows: [{ group: "Toy group A", size: 17, links: 35 }, { group: "Toy group B", size: 17, links: 33 }],
    }),
  );
  termify(document.querySelector("#second-did [data-body] p"), "term", "A toy definition: one plain sentence, with an example.", "tpl-term");
}

boot().catch((err) => console.error("post template failed", err));
