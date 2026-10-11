// P0b base scenario for Week 4's panels: every details.rx-panel opened in
// turn, topic by topic. The topic and panel summaries are display: none, so a
// topic opens by its hash (the router opens it, and opening a topic opens its
// first panel, week04-cut.js) and each later panel from the topic's toc
// link to an element inside it. Panels share a name, so the previous one
// closes. This file covers the first three topics; base-panels-b.mjs the
// other two (one file took over 3 minutes under --runs 3).
const TOPICS = {
  "topic-where": ["#place-backbone", "#place-longhaul", "#deeper-density", "#w4m-panel-gn"],
  "topic-jobs": ["#jobs-bridges", "#jobs-groups", "#cut-skills", "#cut-pagerank"],
  "topic-outsourcing": ["#who-q2", "#who-q3", "#staffing-figure", "#staffing-community-stats", "#staffing-ties", "#deeper-strength", "#entity-communities"],
};

export default [
  {
    name: "w4-panels",
    url: "weeks/week04/",
    steps: Object.entries(TOPICS).flatMap(([topic, targets]) => [
      { hash: `#${topic}`, label: `open ${topic} (panel 1)` },
      ...targets.slice(1).flatMap((t, k) => [
        { click: `#${topic} nav.rx-toc a[href="${t}"]`, label: `${topic} panel ${k + 2} (${t})` },
        { snap: true },
      ]),
    ]),
  },
];
