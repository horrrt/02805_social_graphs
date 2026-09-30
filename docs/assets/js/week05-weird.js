// Week 5 · section 7 · Who has the weirdest Wikipedia page?. Owner: not assigned yet (see WEEK05.md).
//
// Draws into this section's slots on docs/weeks/week05/index.html:
// #weird-figure, #weird-surprise, #weird-checked and the rest.
// Data: docs/weeks/week05/data/weird.json, written by analysis/week05_weird.py.
// Likely components: table() of the ranking, passage() for what the winners actually contain.
// Every component is listed in docs/assets/js/README.md.

// Loading the kit here surfaces a broken import in the console straight away.
import "./kit.js?v=1";

// The section draws nothing until its data exists. Start here, for example:
//
//   import { echart, figure, loadData, slot } from "./kit.js?v=1";
//
//   const data = await loadData(new URL("../../weeks/week05/data/weird.json", import.meta.url));
//   figure(slot("weird", "figure"), {
//     chart: (el) => echart(el, { xAxis: {}, yAxis: {}, series: [{ type: "scatter", data: data.points }] }),
//     caption: "How to read it, and what to notice.",
//     data: { columns: [{ key: "page", label: "Page" }], rows: data.rows },
//   });

