// P0b base scenario for the home page: the load, the two in-page anchors
// (#weeks, #about) and the skip link. The home page runs no page script of its
// own; this covers its static behaviour.
export default [
  {
    name: "home-base",
    url: "",
    steps: [
      { snap: true, label: "loaded" },
      { hash: "#weeks" },
      { hash: "#about" },
      { press: [null, "Tab"], label: "focus skip link" },
      { snap: true },
    ],
  },
];
