// Week 5 · section 4 · Community autocomplete. Owner: Àngela.
//
// Draws into this section's slots on docs/weeks/week05/index.html: the visitor
// quiz over the masked fake pages, the map of the groups (#chart-autocomplete-map,
// through week05-map.js), the modularity strip chart in More numbers
// (#chart-autocomplete-modularity) and one fake's copied run beside its source
// sentence (#autocomplete-run). The quiz is a game for visitors; its clicks
// stay in the browser and are never reported as results.
// Data: docs/weeks/week05/data/autocomplete.json, written by analysis/week05_autocomplete.py.

import { loadData, passage, stripChart, termify } from "./kit.js?v=4";
import { loadNetwork, marvelMap } from "./week05-map.js?v=5";

const data = await loadData(new URL("../../weeks/week05/data/autocomplete.json", import.meta.url));
const $ = (id) => document.getElementById(id);
const el = (tag, text, className) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
};
const option = new Map(data.options.map((o) => [o.community_index, o]));
const groupName = (o) => `${o.label} (${o.size} pages)`;

// ---- the figure, right: the groups on the link network. Hubs only are named,
// and they are the quiz's options, so the map gives no member away.
const mapHost = $("chart-autocomplete-map");
if (mapHost) {
  // Not awaited: the quiz below must not wait for the map.
  loadNetwork()
    .then((net) => marvelMap(mapHost, net, {
      colorLinks: true,
      legend: true,
      noneLabel: "Morituri and the pages with no links",
      aria: "The Marvel link network coloured by its eight consensus groups, each named after its hub",
    }))
    .catch((err) => console.error("week05 map failed", err));
}

// ---- More numbers: the groups' modularity against rewired networks
const p = data.partition;
$("chart-autocomplete-modularity")?.append(
  stripChart(
    [
      {
        label: "Louvain",
        sub: `mean of ${p.runs} runs`,
        real: p.modularity_mean,
        realLabel: p.modularity_mean.toFixed(3),
        realTip: `Real network: modularity ${p.modularity_mean.toFixed(3)} ± ${p.modularity_sd.toFixed(3)} over ${p.runs} runs`,
        base: [p.null_mean, p.null_sd],
        baseTip: `${p.null_runs} rewired networks: ${p.null_mean.toFixed(3)} ± ${p.null_sd.toFixed(3)}`,
        badge: `z ${p.null_z.toFixed(1)}`,
        bold: true,
      },
    ],
    {
      domain: [0.3, 0.55],
      ticks: [0.3, 0.35, 0.4, 0.45, 0.5, 0.55],
      fmt: (v) => v.toFixed(2),
      axisTitle: "modularity",
      aria: "Modularity of the Louvain groups on the real network against rewired networks",
    },
  ),
);

// ---- the figure, left: the visitor quiz
const locked = new Map(); // fake id -> chosen community_index, fixed once revealed
let index = 0;
const select = $("ac-select");
const button = $("ac-submit");
const reveal = $("ac-reveal");

select.append(el("option", "Pick a group…"));
select.options[0].value = "";
for (const o of data.options) {
  const opt = el("option", `${groupName(o)}: ${o.hubs.slice(0, 2).join(", ")}`);
  opt.value = String(o.community_index);
  select.append(opt);
}

function paintScore(note) {
  const fakes = data.fakes.filter((f) => locked.has(f.id));
  const right = fakes.filter((f) => locked.get(f.id) === f.community_index).length;
  $("ac-scoreboard").textContent =
    note ??
    (fakes.length === 0
      ? `Your score in this browser: no guesses yet. A random guess gets 1 in ${data.n_fakes} right.`
      : `Your score in this browser: ${right} of ${fakes.length} right. A random guess gets 1 in ${data.n_fakes} right.`);
}

function paintReveal(fake) {
  const choice = locked.get(fake.id);
  const home = option.get(fake.community_index);
  const ok = choice === fake.community_index;
  const verdict = el("p");
  verdict.append(el("span", ok ? "Right." : "Not that group.", ok ? "w5-ok" : "w5-fail"));
  verdict.append(` This fake came from the ${groupName(home)} group; its best-linked pages are ${home.hubs.join(", ")}.`);
  const phrases = el("p", `Phrases most typical of this group's pages: ${fake.typical_phrases.join(" · ")}.`, "w5-hubs");
  const plainNote = el("p", "The same group's model without the name mask wrote:", "w5-hubs");
  const plain = el("blockquote", fake.text_unmasked, "w5-quote");
  // Unhide before filling, so screen readers announce the live region's new text.
  reveal.hidden = false;
  reveal.replaceChildren(verdict, phrases, plainNote, plain);
}

function show(i) {
  index = (i + data.fakes.length) % data.fakes.length;
  const fake = data.fakes[index];
  $("ac-char").textContent = fake.character;
  $("ac-text").textContent = fake.text;
  $("ac-progress").textContent = `Fake page ${fake.number} of ${data.n_fakes}`;
  const done = locked.has(fake.id);
  select.value = done ? String(locked.get(fake.id)) : "";
  select.disabled = done;
  button.disabled = done;
  if (done) paintReveal(fake);
  else {
    reveal.hidden = true;
    reveal.replaceChildren();
  }
  paintScore();
}

button.addEventListener("click", () => {
  const fake = data.fakes[index];
  if (locked.has(fake.id)) return;
  if (select.value === "") {
    paintScore("Pick a group first, then lock it.");
    select.focus();
    return;
  }
  locked.set(fake.id, Number(select.value));
  show(index);
  $("ac-next").focus(); // the Lock button is now disabled; keep keyboard focus in the quiz
});
$("ac-next").addEventListener("click", () => show(index + 1));
$("ac-prev").addEventListener("click", () => show(index - 1));
show(0);

// ---- what we checked: one fake's longest copied run beside its source sentence
const example = data.fakes.find((f) => f.id === data.summary.example);
const run = example.longest_run;
$("autocomplete-run")?.append(
  el(
    "p",
    `Fake ${example.number} (${example.character}) came from the ${example.community_label} group. ` +
      `It repeats ${run.length} words in a row from this sentence (digits and punctuation dropped): "${run.run}".`,
  ),
  passage({ page: run.page, text: run.sentence, highlight: run.highlight }),
);

// ---- glossary terms
const did = $("autocomplete-did");
termify(did, "Louvain", "A method that finds groups in a network by moving pages between groups until the links inside groups are as dense as they can get. Two runs can differ, so we ran it 100 times.", "w5-term-autocomplete-louvain");
termify(did, "normalised mutual information", "How much two ways of splitting the same pages into groups agree: 1 when they are identical, near 0 when they are unrelated.", "w5-term-autocomplete-nmi");
termify(did, "trigram model", "A table of how often each word follows each pair of words. It predicts the next word from the two before it.", "w5-term-autocomplete-trigram");
