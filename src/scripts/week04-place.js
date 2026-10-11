// Where the hiring is · Week 4 post (companies × cities → metro projection).
// Four questions, one selected city across every panel. Numbers come from
// public/assets/data/week04_place.json (analysis/week04_where.py). The
// components in src/features/week04/place/ draw the charts from the ECharts
// options built here; this module only builds them and touches no DOM.
// `T` is { fs, family, token }: the type scale and the page's colour tokens.

export const INK = "#0f2340";
export const MUTE = "#7a8fac";
export const MUTE_TEXT = "#59708f";
export const ORANGE = "#f2820c";
export const BLUE = "#1f8fd6";
export const LINE = "#eaf0f7";
// The alpha table's row for the α on show.
export const ON_ROW = { fontWeight: 700, background: "#f7fafd" };

// week04_place.json's scope reads "FY2025"; the page writes the plain year.
export const yr = (s) => String(s).replace(/\bFY(\d{4})/g, "$1");

const axis = (T) => ({
  axisLine: { lineStyle: { color: "#c6d4e6" } },
  axisLabel: { color: MUTE_TEXT, fontSize: T.fs("caption") },
  splitLine: { lineStyle: { color: LINE, type: "dashed" } },
  nameTextStyle: { color: MUTE_TEXT, fontSize: T.fs("caption") },
});

const base = (T) => ({
  animationDuration: 420,
  animationEasing: "cubicOut",
  textStyle: { fontFamily: T.family("sans"), fontSize: T.fs("caption") },
  tooltip: {
    trigger: "item",
    confine: true,
    backgroundColor: "rgba(15,35,64,0.92)",
    borderWidth: 0,
    padding: [10, 12],
    textStyle: { color: "#eaf2fb", fontSize: T.fs("small") },
  },
});

export function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

export function pct(x) {
  return `${Math.round(x * 100)}%`;
}

function tipHtml(title, rows) {
  const body = rows.map(([k, v]) => `${k}: <b>${v}</b>`).join("<br/>");
  return `<div style="font-weight:700;margin-bottom:4px">${title}</div>${body}`;
}

// No top-40 metro lies outside the contiguous states; drawing Alaska, Hawaii
// and Puerto Rico shrank the 48 states to a corner of every map.
const OFF_MAINLAND = new Set(["Alaska", "Hawaii", "Puerto Rico"]);
export const mainland = (f) => !OFF_MAINLAND.has(f.properties.name);

// Fit each map inside its box. A layoutSize above 100% zoomed past the
// box whenever a full-screen window made the chart taller than it is wide,
// and cut off the east coast. The wider sides and bottom leave room for
// the city labels, which sit below their dots.
const MAP_FIT = { left: 24, right: 24, top: 10, bottom: 24 };

/** The lookups every chart shares, from the three files. */
export function placeModel(data, whereWho) {
  const byId = Object.fromEntries(data.cities.map((c) => [c.id, c]));
  const byFilings = [...data.cities].sort((a, b) => b.filings - a.filings);
  const placedShare = Object.fromEntries(whereWho.rows.map((r) => [r.id, r.placed_share]));
  return {
    data,
    byId,
    byFilings,
    placedShare,
    heroEdges: data.backbone.graphs["0.2"].edges,
    heroDefault: byFilings[0].id,
    defaultAlpha: String(
      data.backbone.alphas.find((a) => Number(a) === Number(data.backbone.default_alpha)) ?? data.backbone.default_alpha,
    ),
  };
}

// The redesign's colour grammar keeps orange and blue for placed and direct
// filings, so the three metro groups take violet, green and slate from the
// page's CSS tokens instead of the colours in the data file.
export const groups = (T) => [0, 1, 2].map((g) => T.token(`--w4-group-${g}`));
const groupsDark = (T) => [0, 1, 2].map((g) => T.token(`--w4-group-${g}-dark`));

/** The tokens the place charts read. */
export const PLACE_TOKENS = [
  "--w4-group-0",
  "--w4-group-1",
  "--w4-group-2",
  "--w4-group-0-dark",
  "--w4-group-1-dark",
  "--w4-group-2-dark",
  "--ink-soft",
  "--w4-hero-lede",
  "--w4-hero-ink",
  "--deep",
  "--w4-hero-state",
  "--w4-hero-state-edge",
  "--ink",
  "--ink-mute",
  "--ink-mute-text",
  "--card",
  "--w4-grid",
];

function colourFor(m, state, T, city) {
  if (state.regionMode === "census") return m.data.census_colours[city.census] ?? MUTE;
  return groups(T)[city.community] ?? MUTE;
}

// Counts of positions or employers carry no placed-or-direct meaning, so
// they take the neutral ink tone rather than the grammar's orange or blue.
const metricColour = (T) => T.token("--ink-soft");

/** Tight bubble scale so hubs do not swallow the map. */
function bubbleSize(m, positions, minPx = 7, maxPx = 18) {
  const vals = m.data.cities.map((c) => c.positions);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const t = Math.sqrt((positions - lo) / (hi - lo || 1));
  return Math.round(minPx + t * (maxPx - minPx));
}

function ranked(m, state) {
  return [...m.data.cities].sort((a, b) => b[state.metric] - a[state.metric]).slice(0, 12);
}

/** #chart-rank: the twelve cities with the most positions or employers. */
export function barsOption(m, state, T) {
  const BASE = base(T);
  const AXIS = axis(T);
  const { byId } = m;
  const rows = ranked(m, state);
  const names = rows.map((r) => r.name).reverse();
  const selectedName = state.selected ? byId[state.selected].name : null;
  const colour = metricColour(T);
  return {
    ...BASE,
    grid: { left: 108, right: 56, top: 12, bottom: 8 },
    xAxis: {
      type: "value",
      ...AXIS,
      splitNumber: 3,
      axisLabel: { ...AXIS.axisLabel, formatter: (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v) },
    },
    yAxis: {
      type: "category",
      data: names,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: INK, fontSize: T.fs("small"), fontWeight: 600 },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 22,
        data: rows
          .slice()
          .reverse()
          .map((r) => ({
            value: r[state.metric],
            id: r.id,
            itemStyle: {
              color: r.name === selectedName ? INK : colour,
              borderRadius: [0, 8, 8, 0],
              opacity: selectedName && r.name !== selectedName ? 0.35 : 1,
            },
          })),
        label: {
          show: true,
          position: "right",
          color: INK,
          fontSize: T.fs("small"),
          fontWeight: 700,
          formatter: (p) => fmt(p.value),
        },
        emphasis: { focus: "self" },
      },
    ],
    tooltip: {
      ...BASE.tooltip,
      formatter: (p) => {
        const city = byId[p.data.id];
        return tipHtml(city.name, [
          ["Positions", fmt(city.positions)],
          ["Employers", fmt(city.employers)],
          ["Top filer", `${city.top_employer} (${pct(city.top_share)})`],
        ]);
      },
    },
  };
}

/** #chart-citymap ("metric") and #chart-regions ("partition"). */
export function usMapOption(m, state, T, colourMode = "metric") {
  const BASE = base(T);
  const { data, byId } = m;
  const colour = metricColour(T);
  const values = data.cities.map((city) => city[state.metric]);
  const vmax = Math.max(...values, 1);
  // Colour carries meaning in partition mode; keep sizes almost even.
  const sizeMin = colourMode === "partition" ? 8 : 7;
  const sizeMax = colourMode === "partition" ? 14 : 18;

  const bubbles = data.cities.map((city) => {
    const dim = state.selected && state.selected !== city.id;
    const t = city[state.metric] / vmax;
    return {
      name: city.name,
      id: city.id,
      value: [city.lon, city.lat, city[state.metric]],
      itemStyle: {
        color: colourMode === "partition" ? colourFor(m, state, T, city) : colour,
        opacity: dim ? 0.2 : colourMode === "partition" ? 0.88 : 0.5 + 0.45 * t,
        borderColor: "#fff",
        borderWidth: 1.5,
        shadowBlur: dim ? 0 : 4,
        shadowColor: "rgba(15,35,64,0.18)",
      },
      symbolSize: bubbleSize(m, city.positions, sizeMin, sizeMax),
    };
  });

  const sel = state.selected ? byId[state.selected] : null;

  return {
    ...BASE,
    geo: {
      map: "USA",
      roam: false,
      ...MAP_FIT,
      itemStyle: {
        areaColor: "#eef3f9",
        borderColor: "#c5d3e6",
        borderWidth: 0.9,
      },
      emphasis: {
        disabled: true,
      },
      select: { disabled: true },
      silent: true,
    },
    series: [
      {
        type: "scatter",
        coordinateSystem: "geo",
        data: bubbles,
        zlevel: 2,
        emphasis: {
          scale: 1.25,
          itemStyle: { borderColor: INK, borderWidth: 2 },
        },
      },
      ...(sel
        ? [
            {
              type: "effectScatter",
              coordinateSystem: "geo",
              zlevel: 3,
              data: [
                {
                  name: sel.name,
                  value: [sel.lon, sel.lat, sel[state.metric]],
                },
              ],
              symbolSize: bubbleSize(m, sel.positions, sizeMin, sizeMax) + 4,
              showEffectOn: "render",
              rippleEffect: { brushType: "stroke", scale: 1.8, period: 3.5 },
              itemStyle: {
                color: colourMode === "partition" ? colourFor(m, state, T, sel) : colour,
                shadowBlur: 8,
                shadowColor: "rgba(15,35,64,0.28)",
              },
              label: {
                show: true,
                formatter: sel.name,
                position: "right",
                color: INK,
                fontSize: T.fs("small"),
                fontWeight: 700,
                distance: 8,
              },
              tooltip: { show: false },
            },
          ]
        : []),
    ],
    tooltip: {
      ...BASE.tooltip,
      formatter: (p) => {
        if (p.data?.id) {
          const city = byId[p.data.id];
          return tipHtml(city.name, [
            ["Filings", fmt(city.filings)],
            ["Positions", fmt(city.positions)],
            ["Employers", fmt(city.employers)],
            ["Region", city.census],
          ]);
        }
        return p.name ?? "";
      },
    },
  };
}

/** #place-region-legend: the chips under the region toggle. */
export function legendChips(m, state, T) {
  return state.regionMode === "census"
    ? Object.entries(m.data.census_colours).map(([label, colour]) => ({ label, colour }))
    : m.data.communities.map((c) => ({ label: c.label, colour: groups(T)[c.id] ?? MUTE }));
}

/** #chart-backbone: the links the disparity filter keeps at the α on show. */
export function backboneOption(m, state, T) {
  const BASE = base(T);
  const { data, byId, byFilings } = m;
  const g = data.backbone.graphs[state.alpha];
  if (!g) return null;
  // The backbone drawn on the map: lines are the links kept at this alpha, and
  // metros outside the giant component turn grey.
  const inGiant = new Set(g.nodes);
  const maxW = Math.max(...g.edges.map(([, , w]) => w), 1);
  const at = (id) => [byId[id].lon, byId[id].lat];
  const named = new Set(byFilings.slice(0, 12).map((city) => city.id));
  if (state.selected) named.add(state.selected);

  return {
    ...BASE,
    geo: {
      map: "USA",
      roam: false,
      ...MAP_FIT,
      itemStyle: { areaColor: "#eef3f9", borderColor: "#c5d3e6", borderWidth: 0.9 },
      emphasis: { disabled: true },
      select: { disabled: true },
      silent: true,
    },
    series: [
      {
        type: "lines",
        coordinateSystem: "geo",
        zlevel: 1,
        data: g.edges.map(([a, b, w]) => ({
          coords: [at(a), at(b)],
          a,
          b,
          value: w,
          lineStyle: {
            width: 0.6 + 5 * Math.sqrt(w / maxW),
            opacity: !state.selected || state.selected === a || state.selected === b ? 0.5 : 0.08,
          },
        })),
        lineStyle: { color: "#5f7896", curveness: 0 },
      },
      {
        type: "scatter",
        coordinateSystem: "geo",
        zlevel: 2,
        data: data.cities.map((city) => ({
          id: city.id,
          name: city.name,
          value: [city.lon, city.lat],
          symbolSize: bubbleSize(m, city.positions),
          itemStyle: {
            color: inGiant.has(city.id) ? colourFor(m, state, T, city) : "#c3ccd8",
            borderColor: state.selected === city.id ? INK : "#fff",
            borderWidth: state.selected === city.id ? 3 : 1.5,
          },
          label: {
            show: named.has(city.id),
            formatter: city.name,
            position: "right",
            color: INK,
            fontSize: T.fs("small"),
            fontWeight: 600,
            textBorderColor: "#fff",
            textBorderWidth: 2,
          },
        })),
        labelLayout: { hideOverlap: true },
      },
    ],
    tooltip: {
      ...BASE.tooltip,
      formatter: (p) => {
        if (p.seriesType === "lines") {
          return tipHtml(`${byId[p.data.a].name} – ${byId[p.data.b].name}`, [["Shared weight", fmt(p.data.value)]]);
        }
        const city = byId[p.data.id];
        return tipHtml(city.name, [
          ["Filings", fmt(city.filings)],
          ["Backbone links at this α", fmt(g.edges.filter(([a, b]) => a === city.id || b === city.id).length)],
          ["In the giant component", inGiant.has(city.id) ? "yes" : "no"],
          ["Community", data.communities[city.community]?.label ?? "—"],
        ]);
      },
    },
  };
}

// Five labels fit the crowded corner of the scatter without touching; hover names the rest.
const LABELS = 5;

/**
 * #chart-longhaul: distance against weight for every backbone link. Returns
 * the option and the labelled links, which the legend's
 * labelsFor(selected) filters when a series is hidden.
 */
export function scatterOption(m, state, T) {
  const BASE = base(T);
  const AXIS = axis(T);
  const { data, byId } = m;
  const weights = data.longhaul.edges.map((e) => e.weight);
  const wMin = Math.min(...weights);
  const wMax = Math.max(...weights);

  function edgeSize(w) {
    const t = Math.sqrt((w - wMin) / (wMax - wMin || 1));
    return Math.round(8 + t * 10);
  }

  // 84 links pass 1,500 km and their names would pile up. Label each
  // company once, on its heaviest far edge (of the selected city, if one is
  // selected), for the LABELS heaviest companies.
  const isTied = (e) => !state.selected || state.selected === e.a || state.selected === e.b;
  const heaviest = new Map();
  for (const e of data.longhaul.edges) {
    if (!isTied(e) || e.distance_km < 1500) continue;
    const best = heaviest.get(e.top_employer);
    if (!best || e.weight > best.weight) heaviest.set(e.top_employer, e);
  }
  const labelled = new Set([...heaviest.values()].sort((x, y) => y.weight - x.weight).slice(0, LABELS));

  const staffing = [];
  const local = [];
  for (const e of data.longhaul.edges) {
    const tied = isTied(e);
    const point = {
      value: [e.distance_km, e.weight],
      name: `${byId[e.a].name} – ${byId[e.b].name}`,
      staffing: e.staffing,
      employer: e.top_employer,
      a: e.a,
      b: e.b,
      symbolSize: edgeSize(e.weight),
      itemStyle: {
        color: e.staffing ? ORANGE : BLUE,
        opacity: tied ? 0.9 : 0.12,
        borderColor: "#fff",
        borderWidth: 1.5,
      },
    };
    (e.staffing ? staffing : local).push(point);
  }

  const option = {
    ...BASE,
    legend: {
      top: 4,
      right: 8,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: MUTE_TEXT, fontSize: T.fs("caption") },
      data: [
        { name: "Staffing shortlist", itemStyle: { color: ORANGE } },
        { name: "Other lead employer", itemStyle: { color: BLUE } },
      ],
    },
    grid: { left: 58, right: 24, top: 40, bottom: 52 },
    xAxis: {
      type: "value",
      name: "Distance between cities (km)",
      ...AXIS,
      nameLocation: "middle",
      nameGap: 34,
    },
    yAxis: {
      type: "value",
      name: "Backbone weight",
      ...AXIS,
      nameGap: 42,
    },
    series: [
      {
        name: "Staffing shortlist",
        type: "scatter",
        data: staffing,
        emphasis: { scale: 1.2, focus: "series" },
      },
      {
        name: "Other lead employer",
        type: "scatter",
        data: local,
        emphasis: { scale: 1.2, focus: "series" },
      },
      // The labels ride in a series of their own, above every dot.
      {
        name: "Labels",
        type: "scatter",
        silent: true,
        z: 5,
        itemStyle: { color: "transparent" },
        label: {
          show: true,
          formatter: (p) => p.data.employer,
          position: "top",
          color: MUTE_TEXT,
          fontSize: T.fs("small"),
          fontWeight: 600,
          distance: 4,
          textBorderColor: "#fff",
          textBorderWidth: 3,
        },
        // Neighbouring labels alternate above and below their dots, so two
        // heavy links at similar distances do not print on top of each other.
        labelLayout: { moveOverlap: "shiftY" },
        data: [...labelled]
          .sort((x, y) => x.distance_km - y.distance_km)
          .map((e, i) => ({
            value: [e.distance_km, e.weight],
            employer: e.top_employer,
            symbolSize: edgeSize(e.weight),
            label: { position: i % 2 ? "bottom" : "top" },
          })),
      },
    ],
    tooltip: {
      ...BASE.tooltip,
      formatter: (p) =>
        tipHtml(p.data.name, [
          ["Distance", `${fmt(p.value[0])} km`],
          ["Weight", fmt(p.value[1])],
          ["Top employer", p.data.employer],
          ["Type", p.data.staffing ? "Staffing shortlist" : "Other lead employer"],
        ]),
    },
  };
  // Hiding a series in the legend hides its labels too.
  const labelsFor = (selected) => {
    const shown = (e) => selected[e.staffing ? "Staffing shortlist" : "Other lead employer"] !== false;
    return {
      series: [
        {},
        {},
        {
          data: [...labelled].filter(shown).map((e) => ({
            value: [e.distance_km, e.weight],
            employer: e.top_employer,
            symbolSize: edgeSize(e.weight),
          })),
        },
      ],
    };
  };
  return { option, labelsFor };
}

/** #chart-arcs: the backbone links one employer leads. */
export function arcsOption(m, state, T) {
  const BASE = base(T);
  const { data, byId } = m;
  const pairs = data.longhaul.employer_arcs[state.employer] ?? [];
  const connected = new Set(pairs.flat());

  const lines = pairs.map(([a, b]) => ({
    coords: [
      [byId[a].lon, byId[a].lat],
      [byId[b].lon, byId[b].lat],
    ],
    a,
    b,
  }));

  // Only cities this employer touches — drop the grey clutter.
  const points = data.cities
    .filter((city) => connected.has(city.id))
    .map((city) => ({
      name: city.name,
      id: city.id,
      value: [city.lon, city.lat],
      symbolSize: 11,
      itemStyle: {
        color: ORANGE,
        borderColor: "#fff",
        borderWidth: 2,
        shadowBlur: 6,
        shadowColor: "rgba(242,130,12,0.35)",
      },
      label: {
        show: true,
        formatter: city.name,
        position: "bottom",
        color: INK,
        fontSize: T.fs("small"),
        fontWeight: 600,
        distance: 6,
      },
    }));

  return {
    ...BASE,
    geo: {
      map: "USA",
      roam: false,
      ...MAP_FIT,
      itemStyle: {
        areaColor: "#f3f7fb",
        borderColor: "#d0dcec",
        borderWidth: 0.9,
      },
      emphasis: { disabled: true },
      silent: true,
    },
    series: [
      {
        type: "lines",
        coordinateSystem: "geo",
        data: lines,
        lineStyle: {
          color: ORANGE,
          width: 2.2,
          opacity: 0.7,
          curveness: 0,
        },
        effect: {
          show: true,
          period: 4.5,
          trailLength: 0.25,
          symbol: "circle",
          symbolSize: 4,
          color: "#ffb768",
        },
        zlevel: 1,
      },
      {
        type: "scatter",
        coordinateSystem: "geo",
        data: points,
        zlevel: 2,
        emphasis: {
          scale: 1.2,
          itemStyle: { borderColor: INK, borderWidth: 2 },
        },
      },
    ],
    tooltip: {
      ...BASE.tooltip,
      formatter: (p) => {
        if (p.seriesType === "lines") {
          return tipHtml(state.employer, [["Link", `${byId[p.data.a].name} – ${byId[p.data.b].name}`]]);
        }
        return p.data?.name ?? "";
      },
    },
  };
}

/** #place-null-stats: the null model's rows, [label, value]. */
export function nullRows(data) {
  const n = data.null_model;
  const p = (v) => (v < 0.001 ? "< 0.001" : v.toFixed(3));
  return [
    ["Partition shown: found in", `${n.modal_runs} of ${n.seeds} Louvain runs`],
    ["Distinct partitions found", String(n.partitions_found)],
    ["Q of the partition shown", n.Q.toFixed(3)],
    ["Q of rewired networks, mean ± sd", `${n.Q_null_mean.toFixed(3)} ± ${n.Q_null_std.toFixed(3)}`],
    ["z", n.z.toFixed(1)],
    ["NMI between two runs, median (lowest)", `${n.nmi_seeds.toFixed(2)} (${n.nmi_seeds_min.toFixed(2)})`],
    ["NMI with Census regions (p)", `${n.nmi_census_region.toFixed(3)} (${p(n.p_region)})`],
    ["NMI with Census divisions (p)", `${n.nmi_census_division.toFixed(3)} (${p(n.p_division)})`],
    [
      "Infomap modules (random-walk method)",
      data.infomap.modules === 1 ? "1: all metros together" : `${data.infomap.modules} (NMI with Louvain ${data.infomap.nmi_with_louvain.toFixed(2)})`,
    ],
  ];
}

// The start card's three groups: the page holds each head with its
// data-community, and the paragraph under it lists the group's metros,
// largest first.
const GROUP_LIST_MAX = 12;
const GROUP_LIST_BY = "filings";

/** The metros of community `id`, largest first, as the start card lists them. */
export function groupList(data, id) {
  const names = data.cities
    .filter((city) => city.community === id)
    .sort((a, b) => b[GROUP_LIST_BY] - a[GROUP_LIST_BY])
    .map((city) => city.name);
  const shown = names.slice(0, GROUP_LIST_MAX).join(", ");
  const rest = names.length - GROUP_LIST_MAX;
  return rest > 0 ? `${shown}, and ${rest} more` : shown;
}

// ---- the hero: every metro on a dark map, and the inspector beside it.
// The hero shares the page's selection; with nothing picked it shows the
// metro with the most filings.

// Label positions for the metros the hero names without a click.
const HERO_LABELS = {
  35620: "top",
  19100: "right",
  41940: "bottom",
  41860: "top",
  42660: "right",
  12060: "right",
  16980: "top",
  19820: "right",
  38060: "right",
};

/** #chart-hero-map. */
export function heroMapOption(m, state, T) {
  const BASE = base(T);
  const { data, byId, byFilings, heroEdges } = m;
  const GROUP = groups(T);
  const GROUP_DARK = groupsDark(T);
  // On the dark hero the third group takes the plain slate, so the two hub
  // groups stand out against it.
  const HERO_GROUP = [GROUP_DARK[0], GROUP_DARK[1], GROUP[2]];
  const selId = state.selected ?? m.heroDefault;
  const sel = byId[selId];
  const fmax = Math.max(...data.cities.map((x) => x.filings));
  const radius = (city) => 2.6 + 12.4 * Math.sqrt(city.filings / fmax);
  const wmax = Math.max(...heroEdges.map((e) => e[2]));
  const line = ([a, b, w], style) => ({
    coords: [
      [byId[a].lon, byId[a].lat],
      [byId[b].lon, byId[b].lat],
    ],
    lineStyle: style(byId[a].community, byId[b].community, w),
  });
  const all = [...heroEdges]
    .sort((x, y) => x[2] - y[2])
    .map((e) =>
      line(e, (ga, gb, w) => {
        const same = ga === gb && ga !== 2;
        return {
          color: same ? GROUP_DARK[ga] : T.token("--w4-hero-lede"),
          opacity: same ? 0.34 : 0.13,
          width: 0.5 + 2.4 * Math.sqrt(w / wmax),
        };
      }),
    );
  const mine = heroEdges
    .filter(([a, b]) => a === selId || b === selId)
    .map((e) =>
      line(e, (ga, gb, w) => ({
        color: T.token("--w4-hero-ink"),
        opacity: 0.55,
        width: 0.8 + 2.4 * Math.sqrt(w / wmax),
      })),
    );
  const dots = byFilings.map((city) => {
    const picked = city.id === selId;
    return {
      name: city.name,
      id: city.id,
      value: [city.lon, city.lat, city.filings],
      symbolSize: 2 * radius(city),
      itemStyle: { color: HERO_GROUP[city.community], borderColor: T.token("--deep"), borderWidth: 1.4 },
      label: {
        show: picked || city.id in HERO_LABELS,
        position: HERO_LABELS[city.id] ?? "top",
        formatter: city.name,
        color: picked ? T.token("--w4-hero-ink") : T.token("--w4-hero-lede"),
        fontSize: T.fs("small"),
        fontWeight: picked ? 700 : 600,
      },
    };
  });
  return {
    ...BASE,
    geo: {
      map: "USA",
      roam: false,
      layoutCenter: ["50%", "50%"],
      layoutSize: "135%",
      itemStyle: {
        areaColor: T.token("--w4-hero-state"),
        borderColor: T.token("--w4-hero-state-edge"),
        borderWidth: 0.6,
      },
      emphasis: { disabled: true },
      select: { disabled: true },
      silent: true,
    },
    series: [
      { type: "lines", coordinateSystem: "geo", zlevel: 1, silent: true, data: all },
      { type: "lines", coordinateSystem: "geo", zlevel: 2, silent: true, data: mine },
      {
        type: "scatter",
        coordinateSystem: "geo",
        zlevel: 3,
        data: dots,
        cursor: "pointer",
        labelLayout: { hideOverlap: true },
        emphasis: { scale: 1.15 },
      },
      {
        type: "scatter",
        coordinateSystem: "geo",
        zlevel: 4,
        silent: true,
        data: [{ value: [sel.lon, sel.lat] }],
        symbolSize: 2 * radius(sel) + 10,
        itemStyle: { color: "transparent", borderColor: T.token("--w4-hero-ink"), borderWidth: 1.6 },
      },
    ],
    tooltip: {
      ...BASE.tooltip,
      formatter: (p) => {
        const city = p.data?.id ? byId[p.data.id] : null;
        if (!city) return "";
        return tipHtml(city.name, [
          ["Filings", fmt(city.filings)],
          ["Group", data.communities[city.community]?.label ?? "–"],
        ]);
      },
    },
  };
}

/** The hero inspector's metro: its name, codes, group colour and label, stats and three strongest links. */
export function heroInspector(m, state, T) {
  const { data, byId, heroEdges, placedShare } = m;
  const city = byId[state.selected ?? m.heroDefault];
  const share = placedShare[city.id];
  const links = heroEdges
    .filter(([a, b]) => a === city.id || b === city.id)
    .sort((x, y) => y[2] - x[2])
    .slice(0, 3);
  return {
    name: city.name,
    codes: `${city.state} · 2025`,
    dot: groups(T)[city.community],
    group: `${data.communities[city.community]?.label ?? "–"} group`,
    stats: [
      ["Filings", fmt(city.filings)],
      ["Companies", fmt(city.employers)],
      ["Largest filer", `${city.top_employer}, ${(city.top_share * 100).toFixed(1)}%`],
      ["Placed at a client", share == null ? "–" : pct(share)],
      ["Census region", city.census],
    ],
    links: links.map(([a, b, w]) => [byId[a === city.id ? b : a].name, fmt(w)]),
  };
}
