// Corridor Control — three views the rest of the post cannot draw.
//
// A force layout answers what the globe hides: which countries sit together
// once geography is taken away. A stacked area answers what a single snapshot
// hides: who grew. Both run on Apache ECharts, which is a megabyte, so nothing
// here loads until the reader opens the section.
//
// Every number is computed from the same two files the rest of the page reads.

const $ = (id) => document.getElementById(id);

let api = null;
let echarts = null;
let loading = null;
const charts = new Map();

/* ------------------------------------------------------------------- setup */

function chart(id) {
  const host = $(id);
  if (!host) return null;
  if (!charts.has(id)) {
    const instance = echarts.init(host, null, { renderer: "canvas" });
    window.addEventListener("resize", () => instance.resize());
    charts.set(id, instance);
  }
  return charts.get(id);
}

const BASE = {
  animationDuration: 320,
  textStyle: { fontFamily: "-apple-system, system-ui, sans-serif" },
};

// ECharts draws its own tooltip here rather than borrowing the page's, because
// both of these charts want a tooltip that follows a moving node. The colours
// are the page's ink on the page's card, read at draw time, so the pairing
// inverts with the skin instead of being dark twice.
const paper = () =>
  getComputedStyle(document.body).getPropertyValue("--card").trim() || "white";

const tip = (formatter) => ({
  trigger: "item",
  confine: true,
  backgroundColor: `rgba(${api.rgb(api.colours.INK)},0.96)`,
  borderWidth: 0,
  padding: [8, 10],
  textStyle: { color: paper(), fontSize: 12 },
  formatter,
});

const fmt = (n) => api.format.fmt.format(Math.round(n));
const compact = (n) => api.format.compact.format(n);

/* -------------------------------------------------------------------- data */

// One pass over the corridors of a year: who sends, who receives, and the
// edges themselves. The rest of this file works off this.
function yearRows(year) {
  const edges = api.state.edges;
  const yi = edges.years.indexOf(year);
  const rows = [];
  for (const [oi, di, stocks] of edges.edges) {
    const people = stocks[yi];
    if (people) rows.push([edges.countries[oi], edges.countries[di], people]);
  }
  return rows;
}

const name = (iso3) => api.state.data.nodes[iso3]?.name ?? iso3;

/* ------------------------------------------------------------- force layout

   Every country, with a floor on how big a corridor has to be to count. Drag
   the floor up and the hairball resolves into the blocs the map keeps apart:
   the Gulf hiring from South Asia, the ex-Soviet countries trading people
   among themselves, the Anglosphere pulling from everywhere. */

const graphState = { year: 2024, floor: 400000 };

function graphData() {
  const rows = yearRows(graphState.year).filter((r) => r[2] >= graphState.floor);
  const total = new Map();
  const sent = new Map();
  const got = new Map();
  for (const [o, d, people] of rows) {
    total.set(o, (total.get(o) ?? 0) + people);
    total.set(d, (total.get(d) ?? 0) + people);
    sent.set(o, (sent.get(o) ?? 0) + people);
    got.set(d, (got.get(d) ?? 0) + people);
  }
  const biggest = Math.max(1, ...total.values());
  const nodes = [...total.keys()].map((iso3) => {
    const out = sent.get(iso3) ?? 0;
    const inn = got.get(iso3) ?? 0;
    return {
      id: iso3,
      name: name(iso3),
      iso3,
      inn,
      out,
      // Area, not radius, carries the number: a country twice the size gets
      // twice the ink rather than four times it.
      symbolSize: 8 + Math.sqrt(total.get(iso3) / biggest) * 42,
      itemStyle: { color: inn >= out ? api.colours.ACCESS : api.colours.PEOPLE },
      label: { show: total.get(iso3) > biggest * 0.12 },
    };
  });
  const heaviest = Math.max(1, ...rows.map((r) => r[2]));
  const links = rows.map(([o, d, people]) => ({
    source: o,
    target: d,
    people,
    lineStyle: { width: 0.6 + (people / heaviest) * 5, opacity: 0.28, curveness: 0.16 },
  }));
  return { nodes, links, rows };
}

function drawGraph() {
  const instance = chart("v-graph");
  if (!instance) return;
  const { nodes, links } = graphData();
  const { INK, MUTE } = api.colours;

  instance.setOption(
    {
      ...BASE,
      tooltip: tip((p) => {
        if (p.dataType === "edge")
          return `<b>${name(p.data.source)} → ${name(p.data.target)}</b><br>${fmt(p.data.people)} people`;
        return (
          `<b>${p.data.name}</b><br>` +
          `${fmt(p.data.inn)} arrived · ${fmt(p.data.out)} left<br>` +
          `<span style="opacity:.7">on corridors of ${compact(graphState.floor)}+ people</span>`
        );
      }),
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          data: nodes,
          links,
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 5,
          label: { position: "right", color: INK, fontSize: 11, fontWeight: 600 },
          emphasis: { focus: "adjacency", label: { show: true } },
          force: {
            repulsion: 320,
            gravity: 0.08,
            edgeLength: [40, 160],
            friction: 0.12,
            layoutAnimation: true,
          },
          lineStyle: { color: MUTE },
        },
      ],
    },
    true,
  );
  instance.off("click");
  instance.on("click", (event) => {
    if (event.dataType === "node" && event.data?.iso3) api.select(event.data.iso3);
  });
  answerGraph();
}

function answerGraph() {
  const { nodes, rows } = graphData();
  const host = $("v-graph-answer");
  if (!host) return;
  const people = rows.reduce((sum, r) => sum + r[2], 0);
  const all = yearRows(graphState.year).reduce((sum, r) => sum + r[2], 0);
  const receivers = nodes.filter((n) => n.inn >= n.out).length;
  const isolated = api.state.data.countries.length - nodes.length;
  host.innerHTML =
    `At a floor of <b>${compact(graphState.floor)}</b> people, ` +
    `${graphState.year} leaves <b>${nodes.length}</b> countries and ` +
    `<b>${fmt(rows.length)}</b> corridors on the canvas, carrying ` +
    `<b>${fmt(people)}</b> people — <b>${((people / all) * 100).toFixed(1)}%</b> of everyone ` +
    `living outside their country of birth that year. ` +
    `<b>${isolated}</b> countries have no corridor that big at all. ` +
    `Blue nodes take more people than they send, orange ones send more; ` +
    `<b>${receivers}</b> of the survivors are blue. ` +
    `Drag the floor up and the map's geography stops mattering: what is left is ` +
    `the Gulf hiring from South Asia, the ex-Soviet republics exchanging among ` +
    `themselves, and the English-speaking destinations pulling from everywhere.`;
}

/* ------------------------------------------------------------- stacked area

   The whole period at once. A snapshot says who is big; this says who grew,
   and the growth is not where the 2024 ranking would have you look. */

const AREA_MODES = {
  in: { label: "Arrived", blurb: "foreign-born people living there" },
  out: { label: "Left", blurb: "people born there who live elsewhere" },
  both: { label: "Both", blurb: "arrivals plus departures, so a person counts twice" },
};
const areaState = { mode: "in", top: 12 };

function areaData() {
  const years = api.state.edges.years;
  const series = new Map();
  const totals = years.map(() => 0);
  years.forEach((year, i) => {
    for (const [o, d, people] of yearRows(year)) {
      if (areaState.mode !== "out") {
        const row = series.get(d) ?? years.map(() => 0);
        row[i] += people;
        series.set(d, row);
      }
      if (areaState.mode !== "in") {
        const row = series.get(o) ?? years.map(() => 0);
        row[i] += people;
        series.set(o, row);
      }
      totals[i] += areaState.mode === "both" ? people * 2 : people;
    }
  });
  // The bands are chosen once, on the last year, and then held. Re-ranking
  // every year would make a band change meaning halfway across the chart.
  const ranked = [...series.entries()].sort((a, b) => b[1].at(-1) - a[1].at(-1));
  const keep = ranked.slice(0, areaState.top);
  const rest = years.map((_, i) =>
    ranked.slice(areaState.top).reduce((sum, [, row]) => sum + row[i], 0),
  );
  return { years, keep, rest, totals };
}

function drawArea() {
  const instance = chart("v-area");
  if (!instance) return;
  const { years, keep, rest } = areaData();
  const { PEOPLE, ACCESS, INK, MUTE, GRID } = api.colours;

  // One ramp, so the stack reads as one quantity split many ways rather than
  // as twelve unrelated series.
  const shade = (i, n) => {
    const t = i / Math.max(n - 1, 1);
    const [r1, g1, b1] = api.rgb(PEOPLE).split(",").map(Number);
    const [r2, g2, b2] = api.rgb(ACCESS).split(",").map(Number);
    const mix = (a, b) => Math.round(a + (b - a) * t);
    return `rgba(${mix(r1, r2)},${mix(g1, g2)},${mix(b1, b2)},0.88)`;
  };

  const bands = [
    ...keep.map(([iso3, row], i) => ({
      name: name(iso3),
      type: "line",
      stack: "people",
      areaStyle: { color: shade(i, keep.length + 1) },
      lineStyle: { width: 0.9, color: paper(), opacity: 0.75 },
      showSymbol: false,
      smooth: 0.2,
      emphasis: { focus: "series" },
      data: row,
    })),
    {
      name: "Everyone else",
      type: "line",
      stack: "people",
      areaStyle: { color: `rgba(${api.rgb(MUTE)},0.35)` },
      lineStyle: { width: 0.9, color: paper(), opacity: 0.75 },
      showSymbol: false,
      smooth: 0.2,
      emphasis: { focus: "series" },
      data: rest,
    },
  ];

  instance.setOption(
    {
      ...BASE,
      tooltip: {
        ...tip(),
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: MUTE } },
        formatter: (points) => {
          const year = points[0]?.axisValue;
          const sorted = [...points].sort((a, b) => b.value - a.value).slice(0, 8);
          return (
            `<b>${year}</b><br>` +
            sorted
              .map((p) => `${p.marker} ${p.seriesName} ${compact(p.value)}`)
              .join("<br>")
          );
        },
      },
      legend: {
        type: "scroll",
        bottom: 0,
        textStyle: { color: MUTE, fontSize: 11 },
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: { left: 62, right: 18, top: 18, bottom: 56 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: years,
        axisLine: { lineStyle: { color: GRID } },
        axisLabel: { color: MUTE, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: MUTE, fontSize: 10, formatter: (v) => compact(v) },
        splitLine: { lineStyle: { color: GRID } },
      },
      textStyle: { ...BASE.textStyle, color: INK },
      series: bands,
    },
    true,
  );
  const note = $("v-area-note");
  if (note)
    note.textContent =
      `Each band is one country, stacked. Height is ${AREA_MODES[areaState.mode].blurb}; ` +
      `the twelve are the largest in 2024 and keep their place across every year.`;
  answerArea();
}

function answerArea() {
  const { years, keep, rest, totals } = areaData();
  const host = $("v-area-answer");
  if (!host) return;
  const first = years[0];
  const last = years.at(-1);
  const grew = [...keep]
    .map(([iso3, row]) => [iso3, row.at(-1) - row[0], row[0] ? row.at(-1) / row[0] : Infinity])
    .sort((a, b) => b[1] - a[1]);
  const fastest = [...grew].filter((g) => Number.isFinite(g[2])).sort((a, b) => b[2] - a[2])[0];
  const shrank = grew.at(-1);
  const restThen = (rest[0] / totals[0]) * 100;
  const restNow = (rest.at(-1) / totals.at(-1)) * 100;
  const mode = AREA_MODES[areaState.mode];
  // Which way the stack tilted is a fact about the data, not a line to write
  // in advance, and it changes when the reader changes the direction.
  const move = restNow - restThen;
  const shares =
    `The grey band is every other country: <b>${restThen.toFixed(0)}%</b> of the total in ` +
    `${first}, <b>${restNow.toFixed(0)}%</b> in ${last}. `;
  const drift =
    Math.abs(move) < 3
      ? shares +
        `The split barely moved. The whole stack roughly doubled and the named twelve ` +
        `took their existing share of it.`
      : move < 0
        ? shares +
          `The named twelve are pulling away — though they were picked on their ${last} ` +
          `size, so some of that is the chart choosing its own winners.`
        : shares +
          `The growth went to the countries too small to name here, not to the twelve ` +
          `that are biggest today.`;
  host.innerHTML =
    `Stacked, this is <b>${compact(totals[0])}</b> people in ${first} and ` +
    `<b>${compact(totals.at(-1))}</b> in ${last}` +
    (areaState.mode === "both" ? ", counting everybody twice" : "") +
    `. The band that added most is <b>${name(grew[0][0])}</b>, up ` +
    `<b>${compact(grew[0][1])}</b>; the one that multiplied fastest is ` +
    `<b>${name(fastest[0])}</b>, <b>${fastest[2].toFixed(1)}×</b> what it was. ` +
    (shrank[1] < 0
      ? `<b>${name(shrank[0])}</b> is the only band to shrink, by <b>${compact(-shrank[1])}</b>. `
      : "") +
    drift +
    ` “${mode.label}” counts ${mode.blurb}.`;
}

/* ----------------------------------------------------------------- controls */

function wireGraph() {
  const years = api.state.edges.years;
  const yearSlider = $("v-graph-year");
  if (yearSlider && !yearSlider.dataset.ready) {
    yearSlider.dataset.ready = "on";
    yearSlider.max = String(years.length - 1);
    yearSlider.value = String(Math.max(years.indexOf(graphState.year), 0));
    yearSlider.setAttribute("aria-valuetext", String(graphState.year));
    yearSlider.addEventListener("input", (event) => {
      graphState.year = years[Number(event.target.value)] ?? years.at(-1);
      yearSlider.setAttribute("aria-valuetext", String(graphState.year));
      $("v-graph-year-now").textContent = String(graphState.year);
      drawGraph();
    });
  }
  const floor = $("v-graph-floor");
  if (floor && !floor.dataset.ready) {
    floor.dataset.ready = "on";
    // Logarithmic, because the interesting range runs from a hairball at
    // 50,000 to a dozen corridors at five million.
    const value = (step) => Math.round(50000 * 10 ** (step / 20));
    floor.addEventListener("input", (event) => {
      graphState.floor = value(Number(event.target.value));
      $("v-graph-floor-now").textContent = compact(graphState.floor);
      drawGraph();
    });
    floor.value = String(Math.round(Math.log10(graphState.floor / 50000) * 20));
    $("v-graph-floor-now").textContent = compact(graphState.floor);
  }
}

function wireArea() {
  const modes = $("v-area-mode");
  if (!modes || modes.dataset.ready) return;
  modes.dataset.ready = "on";
  modes.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    areaState.mode = button.dataset.mode;
    for (const other of modes.querySelectorAll("button[data-mode]"))
      other.setAttribute("aria-pressed", String(other === button));
    drawArea();
  });
}

function renderAll() {
  wireGraph();
  wireArea();
  drawGraph();
  drawArea();
}

/* ------------------------------------------------------------------ install */

export function installViews(shared, loadVendor) {
  api = shared;
  const drawer = $("views");
  if (!drawer) return;

  const open = async () => {
    if (!drawer.open || !api.state?.edges) return;
    if (!echarts) {
      if (!loading) {
        const status = $("v-status");
        if (status) status.textContent = "Loading the charting library (1 MB)…";
        loading = loadVendor("echarts-5.5.1.min.js")
          .then(() => {
            echarts = window.echarts;
            if (status) status.textContent = "";
          })
          .catch((error) => {
            if (status)
              status.textContent =
                `These three views need Apache ECharts, and it did not load (${error.message}). ` +
                "Everything else on the page is drawn by hand and is unaffected.";
            throw error;
          });
      }
      try {
        await loading;
      } catch {
        return;
      }
    }
    renderAll();
  };

  drawer.addEventListener("toggle", open);
  if (drawer.open) open();
  // The palette and the skin are page-wide, so these repaint with everything
  // else rather than keeping the colours they were built with.
  window.addEventListener("week03:restyle", () => {
    if (echarts && drawer.open) renderAll();
  });
}
