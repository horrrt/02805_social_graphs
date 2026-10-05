// W5-2: Week 5's sections 1, 2 and 4, now islands (src/features/week05/
// relations, copying, autocomplete, map). Hovers a mark in every chart host,
// switches the relations map both ways and clicks the pressed kind again (a
// new view: zoom, pin and tip reset), clicks every label chip, opens every
// drawer these sections fill (the checked sentences, the cluster table, the
// passages, More numbers with the modularity strip, the nested copied run),
// lights a group from the map's legend and plays the quiz: pick, lock, next,
// an empty lock, back to the locked fake (its select disabled), back past the
// first fake to the last, and a pick left behind by moving on. Then narrows
// the window so every chart draws at its new width.
// base.json masks every #chart-* host and its id ancestors (KB07), so
// hostsHtml returns each W5-2 host's markup after loads, hovers and resizes:
// attributes sorted, as the snapshot's canonical form sorts them, and the
// tip's place among the host's children and the marks' classes as they are.
// Run it with --runs 3: main's tip lands before or after a strip at random.
const HOSTS = [
  "chart-relations-crossing",
  "chart-relations-map",
  "chart-copying-linked",
  "chart-copying-network",
  "chart-autocomplete-map",
  "chart-autocomplete-modularity",
];

/** Each host's markup, attributes sorted, `style` as cssText; null for a host not on the page. */
export async function hostsHtml(page, ids = HOSTS) {
  return page.evaluate((ids) => {
    const ser = (n) => {
      if (n.nodeType === 3) return n.data;
      if (n.nodeType !== 1) return "";
      const attrs = [...n.attributes]
        .filter((a) => a.name !== "_echarts_instance_")
        .map((a) => [a.name, a.name === "style" ? n.style.cssText : a.value])
        .sort((a, b) => (a[0] < b[0] ? -1 : 1));
      return `<${n.localName}${attrs.map(([k, v]) => ` ${k}="${v}"`).join("")}>${[...n.childNodes].map(ser).join("")}</${n.localName}>`;
    };
    return Object.fromEntries(ids.map((id) => [id, document.getElementById(id) ? ser(document.getElementById(id)) : null]));
  }, ids);
}

/** The quiz's select: its value and whether it is disabled. */
export async function quizSelect(page) {
  return page.evaluate(() => {
    const s = document.getElementById("ac-select");
    return s ? { value: s.value, disabled: s.disabled, options: s.options.length } : null;
  });
}

const html = (label, ids = HOSTS) => [{ evaluate: "hostsHtml", args: [ids], label: `hosts ${label}` }, { snap: true }];
const drawer = (has) => ({ click: `details.rx-drawer:has(${has}) > summary`, label: `open the drawer holding ${has}` });
const CHIPS = ["killed", "family", "enemy", "ally", "teammate"];

export default [
  {
    name: "w5-W5-2-charts",
    url: "weeks/week05/",
    steps: [
      ...html("at load"),
      { hover: ["#chart-relations-crossing circle[data-tip]", 0.5, 0.5], label: "hover the crossing strip's first dot" },
      ...html("crossing dot", ["chart-relations-crossing"]),
      { hover: ["#chart-relations-crossing rect[data-tip]", 0.5, 0.5], label: "hover the crossing strip's first band" },
      ...html("crossing band", ["chart-relations-crossing"]),
      { hover: ["#chart-relations-map [data-id]:nth-child(10)", 0.5, 0.5], label: "hover a relations map node" },
      ...html("relations map node", ["chart-relations-map"]),
      { click: '#relations-map-kind [data-kind="family"]', label: "map: family words" },
      ...html("family", ["chart-relations-map"]),
      { hover: ["#chart-relations-map [data-id]:nth-child(20)", 0.5, 0.5], label: "hover a node of the family map" },
      { snap: true },
      { click: '#relations-map-kind [data-kind="enemy"]', label: "map: fight words" },
      ...html("enemy", ["chart-relations-map"]),
      { click: '#chart-relations-map button[aria-label="Zoom in"]', label: "map: zoom in" },
      { click: '#relations-map-kind [data-kind="enemy"]', label: "map: fight words again, already pressed" },
      ...html("enemy again: 1x", ["chart-relations-map"]),
      { click: "#chart-relations-map [data-id]:nth-child(10)", label: "map: pin a node" },
      ...html("pinned", ["chart-relations-map"]),
      { click: '#relations-map-kind [data-kind="enemy"]', label: "map: fight words again, pin and tip gone" },
      ...html("enemy again: no pin", ["chart-relations-map"]),
      { hover: ["#chart-copying-linked circle[data-tip]", 0.5, 0.5], label: "hover the linked strip's first dot" },
      ...html("linked dot", ["chart-copying-linked"]),
      { hover: ["#chart-copying-linked circle[data-tip]:last-of-type", 0.5, 0.5], label: "hover the linked strip's last dot" },
      ...html("linked last dot", ["chart-copying-linked"]),
      { hover: ["#chart-copying-network line[data-tip]", 0.5, 0.5], label: "hover a copying line" },
      ...html("copying line", ["chart-copying-network"]),
      { hover: ["#chart-copying-network [data-id]", 0.5, 0.5], label: "hover a copying node" },
      ...html("copying node", ["chart-copying-network"]),
      { hover: ["#chart-autocomplete-map [data-id]:nth-child(30)", 0.5, 0.5], label: "hover an autocomplete map node" },
      ...html("autocomplete map node", ["chart-autocomplete-map"]),
      { click: "#chart-autocomplete-map .gv-legend button.gv-key:nth-child(3)", label: "map: the third legend key" },
      ...html("legend key", ["chart-autocomplete-map"]),
      drawer("#chart-autocomplete-modularity"),
      ...html("modularity drawer open", ["chart-autocomplete-modularity"]),
      { hover: ["#chart-autocomplete-modularity circle[data-tip]", 0.5, 0.5], label: "hover the modularity dot" },
      ...html("modularity dot", ["chart-autocomplete-modularity"]),
      { resize: [1100, 900], label: "narrower window" },
      { wait: 400 },
      ...html("narrower"),
      { hover: ["#chart-copying-network line[data-tip]", 0.5, 0.5], label: "hover a copying line, narrower" },
      ...html("copying line, narrower", ["chart-copying-network"]),
      { resize: [1440, 900], label: "window back" },
      { wait: 400 },
      ...html("window back"),
    ],
  },
  {
    name: "w5-W5-2-drawers",
    url: "weeks/week05/",
    steps: [
      drawer("#relations-chips"),
      { snap: true },
      ...CHIPS.flatMap((label) => [{ click: `#relations-chips [data-label="${label}"]`, label: `chip ${label}` }, { snap: true }]),
      drawer("#copying-clusters"),
      { snap: true },
      drawer("#copying-passages"),
      { snap: true },
      drawer("#autocomplete-checked"),
      { snap: true },
      { click: "#autocomplete-checked > details.rx-drawer > summary", label: "open the copied run" },
      { snap: true },
    ],
  },
  {
    name: "w5-W5-2-quiz",
    url: "weeks/week05/",
    steps: [
      { evaluate: "quizSelect", label: "quiz at load" },
      { click: "#ac-submit", label: "lock with no pick" },
      { snap: true },
      { select: ["#ac-select", "2"], label: "pick a group" },
      { snap: true },
      { click: "#ac-submit", label: "lock and reveal" },
      { evaluate: "quizSelect", label: "the locked select" },
      { snap: true },
      { click: "#ac-next", label: "next fake" },
      { evaluate: "quizSelect", label: "the next fake's select" },
      { snap: true },
      { select: ["#ac-select", "5"], label: "pick without locking" },
      { click: "#ac-prev", label: "back to the locked fake" },
      { evaluate: "quizSelect", label: "back on the locked fake" },
      { snap: true },
      { click: "#ac-next", label: "forward again: the pick is gone" },
      { evaluate: "quizSelect", label: "the unlocked fake again" },
      { snap: true },
      { click: "#ac-prev" },
      { click: "#ac-prev", label: "back past the first fake to the last" },
      { evaluate: "quizSelect", label: "the last fake" },
      { snap: true },
      { select: ["#ac-select", "0"], label: "pick on the last fake" },
      { press: ["#ac-submit", "Enter"], label: "lock with the keyboard" },
      { evaluate: "quizSelect", label: "the last fake locked" },
      { snap: true },
    ],
  },
];
