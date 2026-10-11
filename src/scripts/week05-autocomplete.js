// Week 5 · section 4 · Community autocomplete. Owner: Àngela.
//
// What this section's islands (src/features/week05/autocomplete/) draw into its
// slots on src/app/(week05)/weeks/week05/_sections/Autocomplete.tsx: the visitor quiz
// over the masked fake pages, the map of the groups (#chart-autocomplete-map,
// the shared map in week05-map.js), the modularity strip chart in More numbers
// (#chart-autocomplete-modularity) and one fake's copied run beside its source
// sentence (#autocomplete-run). The quiz is a game for visitors; its clicks
// stay in the browser and are never reported as results.
// Data: public/weeks/week05/data/autocomplete.json, written by analysis/week05_autocomplete.py.

/** autocomplete.json, which every part of the section waits for. */
export const AUTOCOMPLETE = "weeks/week05/data/autocomplete.json";

const groupName = (o) => `${o.label} (${o.size} pages)`;

// ---- the figure, right: the groups on the link network. Hubs only are named,
// and they are the quiz's options, so the map gives no member away.
export const MAP_OPTIONS = {
  colorLinks: true,
  legend: true,
  noneLabel: "Morituri and the pages with no links",
  aria: "The Marvel link network coloured by its eight consensus groups, each named after its hub",
};

// ---- More numbers: the groups' modularity against rewired networks

/** The modularity strip chart's rows and options. */
export function modularity(data) {
  const p = data.partition;
  const rows = [
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
  ];
  const opts = {
    domain: [0.3, 0.55],
    ticks: [0.3, 0.35, 0.4, 0.45, 0.5, 0.55],
    fmt: (v) => v.toFixed(2),
    axisTitle: "modularity",
    aria: "Modularity of the Louvain groups on the real network against rewired networks",
  };
  return { rows, opts };
}

// ---- the figure, left: the visitor quiz. Its state (the fake shown, the
// group picked, the locked guesses) lives in memory only; a reload clears it.

/** The select's first option, which picks nothing. */
export const PICK = "Pick a group…";

/** The note the scoreboard shows when Lock is pressed with nothing picked. */
export const PICK_FIRST = "Pick a group first, then lock it.";

/** One option per group: [value, text]. */
export function options(data) {
  return data.options.map((o) => [String(o.community_index), `${groupName(o)}: ${o.hubs.slice(0, 2).join(", ")}`]);
}

/** The fake at index i, wrapping around both ends, and its index. */
export function fakeAt(data, i) {
  const index = (i + data.fakes.length) % data.fakes.length;
  return { index, fake: data.fakes[index] };
}

/** The progress line above the fake. */
export function progress(data, fake) {
  return `Fake page ${fake.number} of ${data.n_fakes}`;
}

/** The scoreboard line: the note when there is one, else the score over the locked guesses. */
export function score(data, locked, note) {
  if (note) return note;
  const fakes = data.fakes.filter((f) => locked.has(f.id));
  const right = fakes.filter((f) => locked.get(f.id) === f.community_index).length;
  return fakes.length === 0
    ? `Your score in this browser: no guesses yet. A random guess gets 1 in ${data.n_fakes} right.`
    : `Your score in this browser: ${right} of ${fakes.length} right. A random guess gets 1 in ${data.n_fakes} right.`;
}

/** What the reveal says about a locked fake. */
export function reveal(data, fake, choice) {
  const home = data.options.find((o) => o.community_index === fake.community_index);
  const ok = choice === fake.community_index;
  return {
    ok,
    verdict: ok ? "Right." : "Not that group.",
    rest: ` This fake came from the ${groupName(home)} group; its best-linked pages are ${home.hubs.join(", ")}.`,
    phrases: `Phrases most typical of this group's pages: ${fake.typical_phrases.join(" · ")}.`,
    plainNote: "The same group's model without the name mask wrote:",
    plain: fake.text_unmasked,
  };
}

// ---- what we checked: one fake's longest copied run beside its source sentence

/** The line above the passage, and the passage. */
export function copiedRun(data) {
  const example = data.fakes.find((f) => f.id === data.summary.example);
  const run = example.longest_run;
  return {
    text:
      `Fake ${example.number} (${example.character}) came from the ${example.community_label} group. ` +
      `It repeats ${run.length} words in a row from this sentence (digits and punctuation dropped): "${run.run}".`,
    passage: { page: run.page, text: run.sentence, highlight: run.highlight },
  };
}

// ---- glossary terms. Main's first two calls, "Louvain" (w5-term-autocomplete-louvain)
// and "normalised mutual information" (w5-term-autocomplete-nmi), matched no
// text in #autocomplete-did, so only "trigram model" is placed.
export const TERMS = [
  { phrase: "trigram model", definition: "A table of how often each word follows each pair of words. It predicts the next word from the two before it.", id: "w5-term-autocomplete-trigram" },
];
