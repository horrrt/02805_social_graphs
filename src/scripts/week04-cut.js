// The deep dive's routing tables, read by its router
// (src/features/week04/frame/Router.tsx).
//
// The deep dive is a catalogue of topics. Each topic is a closed
// <details class="rx-topic" name="w4-topic">, and each box inside it a
// <details class="rx-panel" name="w4-panel-…">, so one topic and one box per
// topic show at a time. A link to a box, from the catalogue, a topic's
// contents, the rail or another page, opens the topic and the box and scrolls
// there. Old anchors from before the topics still land on their box.

// Anchors that the topics retired, and where each one now leads.
export const ALIAS = {
  "cut-place": "topic-where",
  "cut-jobs": "topic-jobs",
  "cut-who": "topic-outsourcing",
  "cut-more": "cut",
  "who-first-round": "who-q2",
  "place-inspector": "place-start",
};

// Boxes that scripts build inside one panel, and which one the panel shows.
export const SUB = {
  "cut-skills-direct": ["cut-skills", "direct"],
  "cut-skills-cluster": ["cut-skills", "cluster"],
  "cut-skills-radar": ["cut-skills", "radar"],
  "cut-pagerank-explore": ["cut-pagerank", "explore"],
  "cut-pagerank-iteration": ["cut-pagerank", "iteration"],
};

// The four method tabs, all inside the one #cut-methods panel.
export const METHOD = {
  "w4m-panel-gn": "gn",
  "w4m-panel-mod": "mod",
  "w4m-panel-louvain": "louvain",
  "w4m-panel-overlap": "overlap",
};

/** The box a panel of script-built boxes shows first: firstShow("cut-skills") -> "direct". */
export function firstShow(panelId) {
  const first = Object.values(SUB).find(([id]) => id === panelId);
  return first ? first[1] : null;
}
