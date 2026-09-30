// Week 5 · section 3 · A Marvel search engine in 20 lines. Owner: not assigned yet (see WEEK05.md).
//
// Draws into this section's slots on docs/weeks/week05/index.html:
// #search-figure, #search-surprise, #search-checked and the rest.
// Data: docs/weeks/week05/data/search.json, written by analysis/week05_search.py.
// Likely components: table() of queries and ranks, passage() for why a failure fails.
// Every component is listed in docs/assets/js/README.md.

// Loading the kit here surfaces a broken import in the console straight away.
import "./kit.js?v=1";

// The section draws nothing until its data exists. Start here, for example:
//
//   import { echart, figure, loadData, slot } from "./kit.js?v=1";
//
//   const data = await loadData(new URL("../../weeks/week05/data/search.json", import.meta.url));
//   figure(slot("search", "figure"), {
//     chart: (el) => echart(el, { xAxis: {}, yAxis: {}, series: [{ type: "scatter", data: data.points }] }),
//     caption: "How to read it, and what to notice.",
//     data: { columns: [{ key: "page", label: "Page" }], rows: data.rows },
//   });

