// Corridor Control: three views the rest of the post cannot draw.
//
// A force layout answers what the globe hides: which countries sit together
// once geography is taken away. A stacked area answers what a single snapshot
// hides: who grew. Both run on Apache ECharts, which is a megabyte, so nothing
// here loads until the reader opens the section.
//
// Every number is computed from the same two files the rest of the page reads.

const $ = (id) => document.getElementById(id);

// The build stamp that week03-boot.js put on this module's own URL. new URL()
// drops the query when it resolves a relative path, so a data file would
// otherwise sit at a fixed address and a reader would keep the previous
// deploy's numbers for as long as the cache holds them. The seven data files
// are inputs to this stamp's hash, so changing one moves it.
const BUILD = new URL(import.meta.url).searchParams.get("v") ?? "";
function dataUrl(name) {
  const url = new URL(`../data/${name}`, import.meta.url);
  if (BUILD) url.searchParams.set("v", BUILD);
  return url;
}


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
  // Only the dozen largest carry a standing label. A force layout has no
  // label avoidance, so labelling everything above a threshold writes
  // "United StatesBangladesh" across the middle of the pile. Hovering any
  // node still names it.
  const named = new Set(
    [...total.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([iso3]) => iso3),
  );
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
      label: { show: named.has(iso3) },
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
  const CAP = 25;
  const ranked = [...nodes].sort((a, b) => b.inn + b.out - (a.inn + a.out));
  api.chartTable(
    "v-graph",
    ranked.length > CAP
      ? `countries on the canvas at this floor, capped to the ${CAP} largest`
      : "countries on the canvas at this floor",
    ["Country", "Arrived", "Left"],
    ranked.slice(0, CAP).map((n) => [n.name, fmt(n.inn), fmt(n.out)]),
  );
  answerGraph();
}

function answerGraph() {
  const { nodes, rows } = graphData();
  const host = $("v-graph-answer");
  if (!host) return;
  const people = rows.reduce((sum, r) => sum + r[2], 0);
  const all = yearRows(graphState.year).reduce((sum, r) => sum + r[2], 0);
  const receivers = nodes.filter((n) => n.inn >= n.out).length;

  // How many pieces the floor has cut the world into. Union-find over the
  // surviving corridors, treated as undirected: a corridor connects its two
  // ends whichever way the people went.
  const parent = new Map(nodes.map((n) => [n.id, n.id]));
  const find = (x) => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  };
  for (const [o, d] of rows) {
    const a = find(o);
    const b = find(d);
    if (a !== b) parent.set(a, b);
  }
  const components = new Set([...parent.keys()].map(find)).size;
  // Every country that has a migration corridor this year, which is not the
  // same set as state.data.countries: that one is the union of migration and
  // flights, and a country that only has flights was never on this chart.
  const present = new Set(yearRows(graphState.year).flatMap((r) => [r[0], r[1]]));
  const isolated = present.size - nodes.length;
  host.innerHTML =
    `At a floor of <b>${compact(graphState.floor)}</b> people, ` +
    `${graphState.year} leaves <b>${nodes.length}</b> countries and ` +
    `<b>${fmt(rows.length)}</b> corridors on the canvas, carrying ` +
    `<b>${fmt(people)}</b> people, <b>${((people / all) * 100).toFixed(1)}%</b> of everyone ` +
    `living outside their country of birth that year. ` +
    `<b>${isolated}</b> of the <b>${present.size}</b> countries with any corridor that year ` +
    `have none that big. ` +
    `Blue nodes take more people than they send, orange ones send more; ` +
    `<b>${receivers}</b> of the survivors are blue. ` +
    `They fall into <b>${components}</b> ` +
    `${components === 1 ? "group" : "separate groups"} that share no corridor ` +
    `this big with each other` +
    (components > 1
      ? `, and the groups are not continents: a bloc here is a hiring ` +
        `relationship or an old border, not a neighbourhood.`
      : `, which is what the corridors look like before the floor breaks them apart.`);
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
  api.chartTable(
    "v-area",
    "people by country and year",
    ["Country", ...years.map(String)],
    [
      ...keep.map(([iso3, row]) => [name(iso3), ...row.map((v) => compact(v))]),
      ["Everyone else", ...rest.map((v) => compact(v))],
    ],
  );
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
  const fastest =
    [...grew].filter((g) => Number.isFinite(g[2])).sort((a, b) => b[2] - a[2])[0] ?? grew[0];
  const fell = grew.filter((g) => g[1] < 0);
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
          `The named twelve are pulling away, though they were picked on their ${last} ` +
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
    (fell.length === 1
      ? `<b>${name(fell[0][0])}</b> is the only band to shrink, by <b>${compact(-fell[0][1])}</b>. `
      : fell.length > 1
        ? `<b>${fell.length}</b> bands shrank, ${name(fell.at(-1)[0])} most, by ` +
          `<b>${compact(-fell.at(-1)[1])}</b>. `
        : "") +
    drift +
    ` “${mode.label}” counts ${mode.blurb}.`;
}

/* ------------------------------------------------------- 3. the month grid

   Eurostat's monthly asylum applications, the finest-grained bilateral
   migration series there is. A grid of years against months, one origin at a
   time, because a war shows up in a column of a single row and DESA's
   five-year spine cannot see it at all. */

let asylum = null;
const asylumState = { origin: "SY" };

async function loadAsylum() {
  if (asylum) return asylum;
  const url = dataUrl("week03_asylum.json");
  asylum = await fetch(url).then((r) => r.json());
  return asylum;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function asylumRows() {
  const origin = asylum.origins[asylumState.origin];
  const years = [...new Set(asylum.months.map((m) => m.slice(0, 4)))].sort();
  const cells = [];
  asylum.months.forEach((month, i) => {
    const value = origin.months[i];
    cells.push([
      Number(month.slice(5, 7)) - 1,
      years.indexOf(month.slice(0, 4)),
      value,
      month,
    ]);
  });
  return { origin, years, cells };
}

function drawAsylum() {
  const instance = chart("v-asylum");
  if (!instance || !asylum?.origins?.[asylumState.origin]) return;
  const { PEOPLE, INK, MUTE, GRID } = api.colours;
  const { origin, years, cells } = asylumRows();
  const reported = cells.filter((c) => c[2] !== null);
  const biggest = Math.max(1, ...reported.map((c) => c[2]));

  instance.setOption(
    {
      ...BASE,
      tooltip: tip((p) => {
        const [, , value, month] = p.data;
        return (
          `<b>${origin.name} · ${month}</b><br>` +
          (value === null
            ? "no figure published"
            : `${fmt(value)} first-time applications`)
        );
      }),
      visualMap: {
        type: "piecewise",
        orient: "horizontal",
        left: 66,
        top: 0,
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 6,
        textStyle: { color: MUTE, fontSize: 10 },
        // Fixed to this origin's own maximum, so the grid is a story about
        // one country's months rather than a comparison with Syria.
        splitNumber: 5,
        min: 0,
        max: biggest,
        inRange: { color: [`rgba(${api.rgb(PEOPLE)},0.14)`, `rgba(${api.rgb(PEOPLE)},1)`] },
        formatter: (lo, hi) => `${compact(Math.round(lo))}–${compact(Math.round(hi))}`,
      },
      grid: { left: 66, right: 24, top: 44, bottom: 30 },
      xAxis: {
        type: "category",
        data: MONTHS,
        splitArea: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: MUTE, fontSize: 10 },
      },
      yAxis: {
        type: "category",
        data: years,
        inverse: true,
        splitArea: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: INK, fontSize: 11, fontWeight: 600 },
      },
      series: [
        {
          type: "heatmap",
          data: cells.map((c) => ({ value: [c[0], c[1], c[2]], data: c })),
          // A month nobody published is not a quiet month, so it is drawn as
          // a hole rather than as a zero.
          itemStyle: { borderColor: GRID, borderWidth: 1 },
          emphasis: { itemStyle: { borderColor: INK, borderWidth: 2 } },
          label: { show: false },
        },
      ],
    },
    true,
  );
  api.chartTable(
    "v-asylum",
    `${origin.name}: applications by month, months with no published figure omitted`,
    ["Month", "Applications"],
    reported.map((c) => [c[3], fmt(c[2])]),
  );
  answerAsylum();
}

function answerAsylum() {
  const host = $("v-asylum-answer");
  if (!host || !asylum?.origins?.[asylumState.origin]) return;
  const { origin, cells } = asylumRows();
  const reported = cells.filter((c) => c[2] !== null && c[2] > 0);
  const blank = cells.length - cells.filter((c) => c[2] !== null).length;
  const ranked = [...reported].sort((a, b) => b[2] - a[2]);
  const peak = ranked[0];
  const twelve = ranked.slice(0, 12).reduce((sum, c) => sum + c[2], 0);
  const worldPeak = asylum.totals.indexOf(Math.max(...asylum.totals));
  const share = (twelve / origin.total) * 100;
  const where = origin.top
    .slice(0, 3)
    .map((d) => `${d.name} (${compact(d.people)})`)
    .join(", ");
  host.innerHTML =
    `<b>${fmt(origin.total)}</b> first-time asylum applications from ` +
    `<b>${origin.name}</b> across ${asylum.reporting} European countries, ` +
    `${asylum.months[0]} to ${asylum.months.at(-1)}. The heaviest month is ` +
    `<b>${peak[3]}</b> at <b>${fmt(peak[2])}</b>, and twelve months out of ` +
    `${asylum.months.length} carry <b>${share.toFixed(0)}%</b> of the series` +
    (share > 40
      ? `, a spike with quiet on either side of it`
      : share > 20
        ? `, heavier in some years than others, without one dominant month`
        : `, which is close to what an even flow would give and reads as a steady one`) +
    `. Most of it went to ${where}. ` +
    (blank
      ? `<b>${blank}</b> months have no published figure and are drawn as holes: ` +
        `Eurostat suppresses small cells, so a blank is a silence, not a zero. `
      : "") +
    `The busiest month in Europe across every origin here is ` +
    `<b>${asylum.months[worldPeak]}</b>, at <b>${fmt(asylum.totals[worldPeak])}</b>. ` +
    `These are applications, not arrivals: one person who applies in Hungary and again ` +
    `in Germany is counted twice, where the corridor data upstairs would see them once.`;
}

function wireAsylum() {
  const picker = $("v-asylum-origin");
  if (!picker || picker.dataset.ready || !asylum?.origins) return;
  picker.dataset.ready = "on";
  const sorted = Object.entries(asylum.origins).sort((a, b) => b[1].total - a[1].total);
  picker.innerHTML = sorted
    .map(
      ([code, origin]) =>
        `<option value="${code}"${code === asylumState.origin ? " selected" : ""}>` +
        `${origin.name} · ${compact(origin.total)}</option>`,
    )
    .join("");
  // This changes the grid and nothing else, the same promise the ring and the
  // force layout make about their own controls.
  picker.addEventListener("change", (event) => {
    asylumState.origin = event.target.value;
    drawAsylum();
  });
}

/* --------------------------------------------------------- 4. the closures

   The Oxford tracker's international travel controls, one number per country
   per day. This is the only chart on the page that can see 2020: the flight
   network is undated and the migrant stock jumps from 2020 straight to 2024,
   so the pandemic happens entirely between two of its observations. */

let closures = null;

async function loadClosures() {
  if (closures) return closures;
  const url = dataUrl("week03_closures.json");
  closures = await fetch(url).then((r) => r.json());
  return closures;
}

function drawClosures() {
  const instance = chart("v-closures");
  if (!instance || !closures?.days) return;
  const { ACCESS, INK, MUTE, GRID } = api.colours;
  const entries = Object.entries(closures.days);
  const years = [...new Set(entries.map(([d]) => d.slice(0, 4)))].sort();

  const gap = 96;
  const calendars = years.map((year, i) => ({
    top: 40 + i * gap,
    left: 58,
    right: 24,
    cellSize: [13, 13],
    range: year,
    splitLine: { show: false },
    itemStyle: { color: "transparent", borderColor: GRID, borderWidth: 1 },
    yearLabel: { show: true, color: INK, fontSize: 13, fontWeight: 700, margin: 34 },
    monthLabel: { show: i === 0, color: MUTE, fontSize: 10 },
    dayLabel: { show: true, firstDay: 1, nameMap: ["S", "M", "T", "W", "T", "F", "S"], color: MUTE, fontSize: 9 },
  }));

  instance.setOption(
    {
      ...BASE,
      tooltip: tip((p) => {
        const [, shut] = p.value;
        const counts = p.data.counts;
        const reporting = counts.reduce((a, b) => a + b, 0);
        return (
          `<b>${p.value[0]}</b><br>` +
          `${shut} of ${reporting} countries closed to all arrivals ` +
          `(${((shut / reporting) * 100).toFixed(0)}%)<br>` +
          `<span style="opacity:.75">${counts[3]} banned some regions · ` +
          `${counts[2]} quarantined arrivals · ${counts[0]} had no restriction</span>`
        );
      }),
      visualMap: {
        type: "piecewise",
        orient: "horizontal",
        left: 58,
        top: 0,
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 6,
        textStyle: { color: MUTE, fontSize: 10 },
        pieces: [
          { min: 0, max: 0, label: "none closed", color: `rgba(${api.rgb(MUTE)},0.12)` },
          { min: 1, max: 9, label: "1–9", color: `rgba(${api.rgb(ACCESS)},0.25)` },
          { min: 10, max: 29, label: "10–29", color: `rgba(${api.rgb(ACCESS)},0.45)` },
          { min: 30, max: 59, label: "30–59", color: `rgba(${api.rgb(ACCESS)},0.65)` },
          { min: 60, max: 99, label: "60–99", color: `rgba(${api.rgb(ACCESS)},0.82)` },
          { min: 100, label: "100+", color: `rgba(${api.rgb(ACCESS)},1)` },
        ],
      },
      calendar: calendars,
      series: years.map((year, i) => ({
        type: "heatmap",
        coordinateSystem: "calendar",
        calendarIndex: i,
        data: entries
          .filter(([date]) => date.startsWith(year))
          .map(([date, counts]) => ({ value: [date, counts[4]], counts })),
      })),
    },
    true,
  );
  const CAP = 60;
  const topClosed = [...entries]
    .sort((a, b) => b[1][4] - a[1][4])
    .slice(0, CAP)
    .sort((a, b) => a[0].localeCompare(b[0]));
  api.chartTable(
    "v-closures",
    `countries closed to all arrivals, by day, capped to the ${CAP} highest days`,
    ["Date", "Closed", "Reporting"],
    topClosed.map(([date, counts]) => [
      date,
      String(counts[4]),
      String(counts.reduce((a, b) => a + b, 0)),
    ]),
  );
  answerClosures();
}

function answerClosures() {
  const host = $("v-closures-answer");
  if (!host || !closures) return;
  const entries = Object.entries(closures.days);
  const reporting = (counts) => counts.reduce((a, b) => a + b, 0);
  const peak = entries.reduce((best, e) => (e[1][4] > best[1][4] ? e : best));
  const open = (counts) => counts[0];
  // The first day a hundred countries were shut, and the last one, which is
  // the span the page's undated flight network draws straight through.
  const hundred = entries.filter(([, c]) => c[4] >= 100);
  const last = entries.at(-1);
  const everOpen = entries.reduce(
    (best, e) => (open(e[1]) > open(best[1]) ? e : best),
  );
  host.innerHTML =
    `On <b>${peak[0]}</b>, <b>${peak[1][4]}</b> of the ` +
    `<b>${reporting(peak[1])}</b> countries reporting that day were closed to ` +
    `arrivals from everywhere. ` +
    (hundred.length
      ? `A hundred or more stayed shut from <b>${hundred[0][0]}</b> to ` +
        `<b>${hundred.at(-1)[0]}</b>, <b>${hundred.length}</b> days in all. `
      : "") +
    `By <b>${last[0]}</b>, where the tracker stops, it was <b>${last[1][4]}</b>. ` +
    `The freest day in the record is <b>${everOpen[0]}</b>, with ` +
    `<b>${open(everOpen[1])}</b> countries reporting no restriction at all. ` +
    `This is the hole in the rest of the page: the flight network above is one ` +
    `undated snapshot and the migrant stock jumps from 2020 to 2024, so the ` +
    `largest shock to human movement in living memory happens between two ` +
    `observations and leaves no mark on either. ` +
    `Read the levels as policy, not as traffic. A country at level 4 had closed ` +
    `its border on paper; who actually crossed it is a different dataset.`;
}

/* ---------------------------------------------------------------- calendar

   The one chart on this page with a date on it. Everything else is UN DESA's
   stock table, which is eight five-year snapshots and cannot show a day, a
   week or a season. IOM's Missing Migrants Project can, and what it counts is
   the other end of a corridor: the people who did not arrive. */

let calendar = null;

async function loadCalendar() {
  if (calendar) return calendar;
  const url = dataUrl("week03_calendar.json");
  calendar = await fetch(url).then((r) => r.json());
  return calendar;
}

function drawCalendar() {
  const instance = chart("v-calendar");
  if (!instance || !calendar) return;
  const { PEOPLE, INK, MUTE, GRID } = api.colours;
  const years = calendar.years;
  const entries = Object.entries(calendar.days);

  // A continuous ramp is useless here: most days are single figures and one
  // shipwreck is six hundred, so a linear scale paints the whole calendar
  // pale. Buckets that roughly double give every band something to hold.
  const BANDS = [
    [0, 0],
    [1, 2],
    [3, 5],
    [6, 10],
    [11, 25],
    [26, 50],
    [51, Infinity],
  ];

  const partial = years.filter((y) => !calendar.complete_years.includes(y));
  const cellSize = 13;
  const top = 34;
  const gap = 92;
  const calendars = years.map((year, i) => ({
    top: top + i * gap,
    left: 58,
    right: 24,
    cellSize: [cellSize, cellSize],
    range: year,
    splitLine: { show: false },
    itemStyle: { color: "transparent", borderColor: GRID, borderWidth: 1 },
    yearLabel: {
      show: true,
      formatter: calendar.complete_years.includes(year) ? `${year}` : `${year} ·`,
      color: INK,
      fontSize: 13,
      fontWeight: 700,
      margin: 34,
    },
    monthLabel: { show: i === 0, color: MUTE, fontSize: 10 },
    dayLabel: { show: true, firstDay: 1, nameMap: ["S", "M", "T", "W", "T", "F", "S"], color: MUTE, fontSize: 9 },
  }));

  const series = years.map((year, i) => ({
    type: "heatmap",
    coordinateSystem: "calendar",
    calendarIndex: i,
    data: entries.filter(([date]) => date.startsWith(year)).map(([date, v]) => ({
      value: [date, v[0]],
      day: v,
    })),
  }));

  instance.setOption(
    {
      ...BASE,
      tooltip: tip((p) => {
        const [date, people] = p.value;
        const [, incidents, region, route, worst] = p.data.day;
        return (
          `<b>${date}</b><br>` +
          `${fmt(people)} dead or missing in ${incidents} ` +
          `${incidents === 1 ? "incident" : "incidents"}<br>` +
          `${[region, route].filter(Boolean).join(" · ")}` +
          (worst ? `<br><span style="opacity:.75">${worst}</span>` : "")
        );
      }),
      visualMap: {
        type: "piecewise",
        orient: "horizontal",
        left: 58,
        top: 0,
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 6,
        textStyle: { color: MUTE, fontSize: 10 },
        pieces: BANDS.map(([lo, hi], i) => ({
          min: lo,
          max: Number.isFinite(hi) ? hi : undefined,
          label:
            lo === 0 ? "none recorded" : Number.isFinite(hi) ? `${lo}–${hi}` : `${lo}+`,
          color:
            lo === 0
              ? `rgba(${api.rgb(MUTE)},0.12)`
              : `rgba(${api.rgb(PEOPLE)},${(0.18 + (i / (BANDS.length - 1)) * 0.82).toFixed(2)})`,
        })),
      },
      calendar: calendars,
      graphic: partial.length
        ? [
            {
              type: "text",
              right: 24,
              top: 4,
              style: {
                text: `${partial.join(", ")} runs to ${entries.at(-1)[0]}, not to December`,
                fill: MUTE,
                font: "10px -apple-system, system-ui, sans-serif",
              },
            },
          ]
        : [],
      series,
    },
    true,
  );
  api.chartTable(
    "v-calendar",
    "the fifty worst days",
    ["Date", "Dead or missing", "Incidents", "Region"],
    [...entries]
      .sort((a, b) => b[1][0] - a[1][0])
      .slice(0, 50)
      .map(([date, v]) => [date, fmt(v[0]), String(v[1]), v[2] || "—"]),
  );
  answerCalendar();
}

function answerCalendar() {
  const host = $("v-calendar-answer");
  if (!host || !calendar) return;
  const entries = Object.entries(calendar.days);
  const byYear = new Map();
  for (const [date, v] of entries) {
    const year = date.slice(0, 4);
    byYear.set(year, (byYear.get(year) ?? 0) + v[0]);
  }
  const complete = calendar.complete_years;
  const worst = entries.slice().sort((a, b) => b[1][0] - a[1][0])[0];
  // Days the file has no row for at all, which is the honest version of
  // "quiet": a day with no recorded incident, not a day with no death.
  const span =
    (Date.parse(entries.at(-1)[0]) - Date.parse(entries[0][0])) / 86400000 + 1;
  const unrecorded = Math.round(span) - entries.length;
  const total = entries.reduce((sum, [, v]) => sum + v[0], 0);
  const busiest = [...byYear.entries()]
    .filter(([y]) => complete.includes(y))
    .sort((a, b) => b[1] - a[1])[0];
  const first = complete[0];
  const last = complete.at(-1);
  host.innerHTML =
    `<b>${fmt(total)}</b> people are recorded dead or missing across ` +
    `<b>${fmt(entries.length)}</b> days here, and the calendar almost never goes ` +
    `dark: in ${entries[0][0].slice(0, 4)} to ${entries.at(-1)[0].slice(0, 4)} only ` +
    `<b>${unrecorded}</b> days carry no recorded incident at all. ` +
    `The worst single day is <b>${worst[0]}</b>, <b>${fmt(worst[1][0])}</b> people` +
    (worst[1][4] ? `, ${worst[1][4]}` : "") +
    `${worst[1][4]?.endsWith("…") ? "" : "."} Of the full years, <b>${busiest[0]}</b> is the heaviest at ` +
    `<b>${fmt(busiest[1])}</b>, against <b>${fmt(byYear.get(first))}</b> in ${first} ` +
    `and <b>${fmt(byYear.get(last))}</b> in ${last}. ` +
    `Read a bright cell as a recorded incident, not as a measured death toll. ` +
    `IOM states that its record is an undercount, by an unknown amount that ` +
    `differs by route, so a brighter year can be a better-watched one. ` +
    `A single cell is often a single boat: the number missing after a shipwreck ` +
    `is estimated from what survivors say, and one estimate can outweigh a month ` +
    `of land crossings.`;
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
  wireAsylum();
  drawGraph();
  drawArea();
  drawAsylum();
  drawClosures();
  drawCalendar();
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
                `These views need Apache ECharts, and it did not load (${error.message}). ` +
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
    // Three data files the rest of the page does not load. A failure on one
    // of them must not take the other four views down.
    const status = $("v-status");
    const missing = [];
    await Promise.all(
      [
        ["monthly asylum applications", loadAsylum],
        ["the border-closure tracker", loadClosures],
        ["the deaths calendar", loadCalendar],
      ].map(([label, load]) =>
        load().catch(() => {
          missing.push(label);
        }),
      ),
    );
    if (missing.length && status)
      status.textContent = `Could not load ${missing.join(" or ")}; the other views are fine.`;
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
