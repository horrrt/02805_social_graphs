// W5-3: Week 5's sections 3, 5, 6 and 7, now islands (src/features/week05/
// search, heaps, fame, weird). Hovers the heaps curve's overlay at three
// points and leaves it, hovers a mark of the gap strip and the weird scatter
// (a dot, the band, the neighbour line), opens the drawer inside the weird
// host, zooms the fame scatter (Ctrl and the wheel), pans it and resets the
// zoom with the toolbox's restore icon, and narrows the window
// with a drawer open so every chart draws at its new width. Then the search:
// every chip, every table row, typed queries run with Enter and with the
// button (one the model knows no word of, one that is the selected query with
// a trailing space, so it keeps its target), a pick after typing, and every
// drawer these sections fill.
// base.json masks every #chart-* host and its id ancestors (KB07), so
// hostsHtml returns each W5-3 SVG host's markup, attributes sorted, as W5-2's
// does; echartsShape returns the fame host's own markup and children, and its
// chart's renderer, size and option without functions, since ECharts' svg
// numbers its own ids. Run it with --runs 3: main's tip lands before or after
// a chart at random.
const HOSTS = ["chart-heaps-curve", "chart-heaps-gap", "chart-weird-scatter"];

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

/** The fame host: its attributes (sorted), each child's tag, class, hidden and style, and its chart's renderer, size and option. */
export async function echartsShape(page, id = "chart-fame-scatter") {
  return page.evaluate((id) => {
    const host = document.getElementById(id);
    if (!host) return null;
    const attrs = (n) =>
      Object.fromEntries(
        [...n.attributes]
          .filter((a) => a.name !== "_echarts_instance_")
          .map((a) => [a.name, a.name === "style" ? n.style.cssText : a.value])
          .sort((a, b) => (a[0] < b[0] ? -1 : 1)),
      );
    const chartEl = host.querySelector(".kit-echart");
    const chart = chartEl && window.echarts?.getInstanceByDom(chartEl);
    const plain = (v) => JSON.parse(JSON.stringify(v, (k, x) => (typeof x === "function" ? undefined : x)));
    return {
      host: attrs(host),
      children: [...host.children].map((c) => ({ tag: c.localName, attrs: attrs(c), text: c.textContent, kids: [...c.children].map((k) => k.localName) })),
      chart: chart ? { renderer: chart.getZr().painter.getType(), width: chart.getWidth(), height: chart.getHeight(), option: plain(chart.getOption()) } : null,
    };
  }, id);
}

/**
 * Focus the search box and put the caret after its text: what End does on
 * Linux and Windows. On macOS End is scrollToEndOfDocument, an animated scroll
 * of the whole page that leaves the caret where it was.
 */
export async function caretToEnd(page) {
  return page.locator("#search-input").evaluate((el) => {
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    return el.selectionStart;
  });
}

/** Click at a fraction of an element's box. */
export async function clickAt(page, sel, fx, fy) {
  const box = await page.locator(sel).first().boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  return true;
}

/** Ctrl and the wheel at a fraction of an element's box: the fame scatter's zoom. */
export async function zoomAt(page, sel, fx, fy, deltaY) {
  const box = await page.locator(sel).first().boundingBox();
  await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, deltaY);
  await page.keyboard.up("Control");
  return true;
}

/** The search box: its value, and the ranking's lines. */
export async function searchBox(page) {
  return page.evaluate(() => {
    const input = document.getElementById("search-input");
    const ranks = document.getElementById("search-live-ranks");
    return { value: input?.value ?? null, ranks: ranks ? [...ranks.children].map((li) => `${li.className}|${li.textContent}`) : null };
  });
}

const html = (label, ids = HOSTS) => [{ evaluate: "hostsHtml", args: [ids], label: `hosts ${label}` }, { snap: true }];
const fame = (label) => ({ evaluate: "echartsShape", label: `fame ${label}` });
const drawer = (has) => ({ click: `details.rx-drawer:has(${has}) > summary`, label: `open the drawer holding ${has}` });
const box = (label) => [{ evaluate: "searchBox", label: `search box ${label}` }, { snap: true }];
const clear = () => [{ press: ["#search-input", "ControlOrMeta+a"] }, { press: ["#search-input", "Backspace"] }];
const CHIPS = ["thunder", "bill", "wolverine", "spider", "strange", "deadpool"];
const QUERIES = ["thunder", "bill", "wolverine", "spider", "strange", "deadpool", "blackpanther", "hulk", "storm", "witch", "venom", "moon"];

export default [
  {
    name: "w5-W5-3-charts",
    url: "weeks/week05/",
    steps: [
      ...html("at load"),
      fame("at load"),
      { hover: ["#chart-heaps-curve rect[fill=transparent]", 0.2, 0.5], label: "hover the curve at a fifth" },
      ...html("curve at a fifth", ["chart-heaps-curve"]),
      { hover: ["#chart-heaps-curve rect[fill=transparent]", 0.6, 0.3], label: "move along the curve" },
      ...html("curve further on", ["chart-heaps-curve"]),
      { hover: ["#chart-heaps-curve rect[fill=transparent]", 0.95, 0.8], label: "move to the curve's end" },
      ...html("curve at its end", ["chart-heaps-curve"]),
      { hover: ["#chart-heaps-gap circle[data-tip]", 0.5, 0.5], label: "leave the curve for the gap strip's first dot" },
      ...html("gap dot", ["chart-heaps-curve", "chart-heaps-gap"]),
      { hover: ["#chart-heaps-gap rect[data-tip]", 0.5, 0.5], label: "hover the gap strip's first band" },
      ...html("gap band", ["chart-heaps-gap"]),
      { hover: ["#chart-weird-scatter circle[data-tip]", 0.5, 0.5], label: "hover the weird scatter's first dot" },
      ...html("weird dot", ["chart-weird-scatter"]),
      { hover: ["#chart-weird-scatter circle[data-tip]:last-of-type", 0.5, 0.5], label: "hover the weird scatter's last dot" },
      ...html("weird last dot", ["chart-weird-scatter"]),
      { hover: ["#chart-weird-scatter polygon[data-tip]", 0.5, 0.5], label: "hover the band" },
      ...html("weird band", ["chart-weird-scatter"]),
      { hover: ["#chart-weird-scatter polyline[data-tip]", 0.5, 0.5], label: "hover the neighbour line" },
      ...html("weird neighbour line", ["chart-weird-scatter"]),
      { click: "#chart-weird-scatter details.rx-drawer > summary", label: "open the drawer of all pages" },
      ...html("weird drawer open", ["chart-weird-scatter"]),
      { hover: ["#chart-fame-scatter .kit-echart", 0.3, 0.6], label: "hover the fame scatter" },
      fame("hovered"),
      { evaluate: "zoomAt", args: ["#chart-fame-scatter .kit-echart", 0.4, 0.5, -300], label: "zoom the fame scatter in" },
      { wait: 300 },
      fame("zoomed"),
      { snap: true },
      { drag: ["#chart-fame-scatter .kit-echart", [0.5, 0.5], [0.65, 0.4]], label: "pan the fame scatter" },
      fame("panned"),
      { snap: true },
      { evaluate: "clickAt", args: ["#chart-fame-scatter .kit-echart", 0.957, 0.034], label: "reset the zoom with the toolbox's restore icon" },
      fame("reset"),
      { snap: true },
      { resize: [1100, 900], label: "narrower window" },
      { wait: 400 },
      ...html("narrower"),
      fame("narrower"),
      { hover: ["#chart-heaps-curve rect[fill=transparent]", 0.5, 0.5], label: "hover the curve, narrower" },
      ...html("curve, narrower", ["chart-heaps-curve"]),
      { resize: [1440, 900], label: "window back" },
      { wait: 400 },
      ...html("window back"),
      fame("window back"),
    ],
  },
  {
    name: "w5-W5-3-drawers",
    url: "weeks/week05/",
    steps: [
      drawer("#search-passage"),
      { snap: true },
      { click: "#heaps-table details.rx-drawer > summary", label: "open the heaps table" },
      { snap: true },
      drawer("#heaps-passages"),
      { snap: true },
      drawer("#fame-outliers"),
      { snap: true },
      drawer("#fame-passages"),
      { snap: true },
      drawer("#weird-passages"),
      { snap: true },
    ],
  },
  {
    name: "w5-W5-3-search",
    url: "weeks/week05/",
    steps: [
      ...box("at load"),
      ...CHIPS.flatMap((id) => [{ click: `#search-chips [data-id="${id}"]`, label: `chip ${id}` }, ...box(`chip ${id}`)]),
      ...QUERIES.flatMap((id) => [{ click: `#search-tbody tr[data-id="${id}"] button`, label: `row ${id}` }, ...box(`row ${id}`)]),
      ...clear(),
      { type: ["#search-input", "king of Wakanda"] },
      ...box("typed, not run"),
      { press: ["#search-input", "Enter"], label: "run with Enter" },
      ...box("king of Wakanda"),
      ...clear(),
      { type: ["#search-input", "the of and with"] },
      { click: "#search-run", label: "run stopwords only with the button" },
      ...box("stopwords only"),
      ...clear(),
      { type: ["#search-input", "zzqx"] },
      { press: ["#search-input", "Enter"], label: "run a word the model does not know" },
      ...box("unknown word"),
      { click: '#search-tbody tr[data-id="venom"] button', label: "row venom after typing" },
      ...box("venom picked"),
      { evaluate: "caretToEnd", label: "caret to the end of the box" },
      { type: ["#search-input", " "] },
      { press: ["#search-input", "Enter"], label: "run the picked query with a trailing space" },
      ...box("picked query, trailing space"),
      { type: ["#search-input", "s"] },
      { click: "#search-run", label: "run the picked query with a letter added" },
      ...box("picked query changed"),
      { click: '#search-chips [data-id="spider"]', label: "chip spider after typing" },
      ...box("spider picked"),
    ],
  },
];
