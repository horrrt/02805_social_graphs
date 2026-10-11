// P0b base scenario for Week 4's hash router (week04-cut.js): deep links into
// a closed panel (#cut-skills-radar), a section anchor (#who-first-round), the
// place inspector, two methods panels (#w4m-panel-mod sets w4m-root's
// data-want), the #cut section and Back. Each {hash} step snapshots, with the
// target's top edge. w4-topnav scrolls to each .topnav target in turn (the
// base-controls spec item, moved here to keep both files under 90 s).
const TOPNAV = ["#opening", "#place", "#jobs", "#who", "#footprint", "#beyond", "#cut"];

export default [
  {
    name: "w4-hash",
    url: "weeks/week04/",
    steps: [
      { hash: "#cut-skills-radar" },
      { hash: "#who-first-round" },
      { hash: "#place-inspector" },
      { hash: "#w4m-panel-louvain" },
      { hash: "#w4m-panel-mod" },
      { hash: "#cut" },
      { back: true },
      { snap: true, label: "after back" },
    ],
  },
  {
    name: "w4-topnav",
    url: "weeks/week04/",
    steps: TOPNAV.flatMap((t) => [{ scrollTo: t, label: `scroll to ${t}` }, { snap: true }]),
  },
];
