// Week 5 · section 1 · Turn links into relationships. Owner: Gyula.
//
// Draws into this section's slots on docs/weeks/week05/index.html: the strip
// chart of links that join two communities (#chart-relations-crossing), the map of
// where fight and family links run (#chart-relations-map), and the sentences read
// by hand, one label at a time (#relations-lines).
// Data: docs/weeks/week05/data/relations.json, written by analysis/week05_relations.py,
// and the shared map in network.json (week05-map.js).

import { asset } from "./site.js";
import { concordance, loadData, stripChart, termify } from "./kit.js";
import { loadNetwork, marvelMap } from "./week05-map.js";

const LABEL = { killed: "Killed", family: "Family", enemy: "Enemy", ally: "Ally", teammate: "Teammate" };
const pct = (v) => `${Math.round(v * 100)}%`;
const signed = (z) => `z ${z < 0 ? "−" : "+"}${Math.abs(z).toFixed(1)}`;

const data = await loadData(asset("weeks/week05/data/relations.json"));

// ---- the figure: each label's crossing share against its shuffled labels
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
document.getElementById("chart-relations-crossing")?.append(
  stripChart(rows, {
    domain: [0.1, 0.7],
    ticks: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    fmt: pct,
    axisTitle: "share of links joining two communities",
    aria: "Share of each label's links that join two communities, against shuffled labels",
  }),
);

// ---- what we checked: the sentences read by hand, one label at a time
const chips = document.getElementById("relations-chips");
const lines = document.getElementById("relations-lines");

function show(label) {
  const picked = data.concordance.filter((r) => r.label === label);
  const table = concordance(picked, {
    caption: `${LABEL[label]}: ${data.precision[label].right} of ${data.precision[label].read} right`,
  });
  [...table.tBodies[0].rows].forEach((tr, i) => {
    const r = picked[i];
    const mark = tr.insertCell();
    mark.className = "w5-mark";
    mark.textContent = r.verdict === "right" ? "✓" : "✗";
    mark.title = r.verdict === "right" ? "The label describes how the two characters relate" : "The label is wrong here";
    const note = tr.insertCell();
    note.className = "w5-verdict";
    note.textContent = r.note;
  });
  lines.replaceChildren(table);
  for (const b of chips.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.label === label));
}

if (chips && lines) {
  for (const label of Object.keys(LABEL)) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.label = label;
    b.textContent = `${LABEL[label]} · ${data.precision[label].right}/${data.precision[label].read}`;
    b.addEventListener("click", () => show(label));
    chips.append(b);
  }
  show("enemy");
}

// ---- glossary terms
const did = document.getElementById("relations-did");
termify(did, "Louvain", "A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get. Two runs can differ, so we use 100.", "w5-term-relations-louvain");
termify(did, "communities", "Groups of characters linked more among themselves than to the rest of the network.", "w5-term-relations-communities");

// ---- the map: the pairs one kind of word labels, over the communities
const mapHost = document.getElementById("chart-relations-map");
const kinds = document.getElementById("relations-map-kind");
if (mapHost && kinds) {
  const net = await loadNetwork().catch((err) => console.error("week05 map failed", err));
  const show = (kind) => {
    for (const b of kinds.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.kind === kind));
    marvelMap(mapHost, net, {
      mark: kind,
      aria: `The Marvel link network coloured by community, with the links whose sentence uses ${kind === "enemy" ? "a fight word" : "a family word"} drawn dark`,
    });
  };
  if (net) {
    for (const b of kinds.querySelectorAll("button")) b.addEventListener("click", () => show(b.dataset.kind));
    show("enemy");
  }
}

