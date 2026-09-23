// Where the hiring is · Week 4 post (companies × cities → metro projection).
// Four questions, one selected city across every panel. Numbers come from
// docs/assets/data/week04_place.json (placeholder until analysis/week04_where.py).

const DATA_URL = new URL("../data/week04_place.json", import.meta.url);
const USA_URL = new URL("../data/usa.json", import.meta.url);

const INK = "#0f2340";
const MUTE = "#7a8fac";
const ORANGE = "#f2820c";
const BLUE = "#1f8fd6";
const LINE = "#eaf0f7";

const AXIS = {
  axisLine: { lineStyle: { color: "#c6d4e6" } },
  axisLabel: { color: MUTE, fontSize: 11 },
  splitLine: { lineStyle: { color: LINE, type: "dashed" } },
  nameTextStyle: { color: MUTE, fontSize: 11 },
};

const BASE = {
  animationDuration: 420,
  animationEasing: "cubicOut",
  textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  tooltip: {
    trigger: "item",
    confine: true,
    backgroundColor: "rgba(15,35,64,0.92)",
    borderWidth: 0,
    padding: [10, 12],
    textStyle: { color: "#eaf2fb", fontSize: 12 },
  },
};

function $(id) {
  return document.getElementById(id);
}

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

function pct(x) {
  return `${Math.round(x * 100)}%`;
}

function tipHtml(title, rows) {
  const body = rows.map(([k, v]) => `${k}: <b>${v}</b>`).join("<br/>");
  return `<div style="font-weight:700;margin-bottom:4px">${title}</div>${body}`;
}

export async function startPlace(echarts) {
  const [data, usa] = await Promise.all([
    fetch(DATA_URL).then((r) => {
      if (!r.ok) throw new Error(`place data ${r.status}`);
      return r.json();
    }),
    fetch(USA_URL).then((r) => {
      if (!r.ok) throw new Error(`usa map ${r.status}`);
      return r.json();
    }),
  ]);

  echarts.registerMap("USA", usa);

  const byId = Object.fromEntries(data.cities.map((c) => [c.id, c]));
  const state = {
    metric: "positions",
    alpha: String(data.backbone.default_alpha),
    regionMode: "communities",
    employer: "Infosys",
    selected: null,
  };

  const charts = new Map();

  function chart(id) {
    const host = $(id);
    if (!host) return null;
    if (!charts.has(id)) {
      const instance = echarts.init(host, null, { renderer: "canvas" });
      charts.set(id, instance);
      window.addEventListener("resize", () => instance.resize());
    }
    return charts.get(id);
  }

  function select(id) {
    if (!byId[id]) return;
    state.selected = id;
    renderAll();
  }

  function setStatus() {
    const el = $("place-status");
    if (!el) return;
    const draft = data.meta.status === "placeholder";
    el.textContent = draft
      ? `Scaffold · ${data.meta.scope} · placeholders until ${data.meta.script}`
      : `${data.meta.scope} · ${data.meta.script}`;
  }

  function renderInspector() {
    const who = $("place-sel-name");
    const codes = $("place-sel-codes");
    const stats = $("place-sel-stats");
    if (!who || !stats) return;
    const c = state.selected ? byId[state.selected] : null;
    who.textContent = c ? c.name : "Pick a city";
    codes.textContent = c ? `${c.state} · ${c.census}` : "Click a bar, a map bubble, or a node";
    if (!c) {
      stats.innerHTML = "";
      return;
    }
    stats.innerHTML = `
      <div><dt>Positions</dt><dd>${fmt(c.positions)}</dd></div>
      <div><dt>Employers</dt><dd>${fmt(c.employers)}</dd></div>
      <div><dt>Top filer</dt><dd>${c.top_employer} · ${pct(c.top_share)}</dd></div>
      <div><dt>Community</dt><dd>${data.communities[c.community]?.label ?? "—"}</dd></div>
    `;
  }

  function ranked() {
    return [...data.cities].sort((a, b) => b[state.metric] - a[state.metric]).slice(0, 12);
  }

  function colourFor(city) {
    if (state.regionMode === "census") {
      return data.census_colours[city.census] ?? MUTE;
    }
    return data.communities[city.community]?.colour ?? MUTE;
  }

  function metricColour() {
    return state.metric === "positions" ? ORANGE : BLUE;
  }

  /** Tight bubble scale so hubs do not swallow the map. */
  function bubbleSize(positions, minPx = 7, maxPx = 18) {
    const vals = data.cities.map((c) => c.positions);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const t = Math.sqrt((positions - lo) / (hi - lo || 1));
    return Math.round(minPx + t * (maxPx - minPx));
  }

  function renderBars() {
    const c = chart("chart-rank");
    if (!c) return;
    const rows = ranked();
    const names = rows.map((r) => r.name).reverse();
    const selectedName = state.selected ? byId[state.selected].name : null;
    const colour = metricColour();

    c.setOption({
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
        axisLabel: { color: INK, fontSize: 12, fontWeight: 600 },
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
            color: MUTE,
            fontSize: 11,
            fontWeight: 600,
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
    });
    c.off("click");
    c.on("click", (ev) => {
      if (ev.data?.id) select(ev.data.id);
    });
  }

  function renderUsMap(hostId, { colourMode = "metric" } = {}) {
    const c = chart(hostId);
    if (!c) return;
    const colour = metricColour();
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
          color: colourMode === "partition" ? colourFor(city) : colour,
          opacity: dim ? 0.2 : colourMode === "partition" ? 0.88 : 0.5 + 0.45 * t,
          borderColor: "#fff",
          borderWidth: 1.5,
          shadowBlur: dim ? 0 : 4,
          shadowColor: "rgba(15,35,64,0.18)",
        },
        symbolSize: bubbleSize(city.positions, sizeMin, sizeMax),
      };
    });

    const sel = state.selected ? byId[state.selected] : null;

    c.setOption(
      {
        ...BASE,
        geo: {
          map: "USA",
          roam: false,
          layoutCenter: ["50%", "52%"],
          layoutSize: "108%",
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
                  symbolSize: bubbleSize(sel.positions, sizeMin, sizeMax) + 4,
                  showEffectOn: "render",
                  rippleEffect: { brushType: "stroke", scale: 1.8, period: 3.5 },
                  itemStyle: {
                    color: colourMode === "partition" ? colourFor(sel) : colour,
                    shadowBlur: 8,
                    shadowColor: "rgba(15,35,64,0.28)",
                  },
                  label: {
                    show: true,
                    formatter: sel.name,
                    position: "right",
                    color: INK,
                    fontSize: 12,
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
                ["Positions", fmt(city.positions)],
                ["Employers", fmt(city.employers)],
                ["Region", city.census],
              ]);
            }
            return p.name ?? "";
          },
        },
      },
      { notMerge: true },
    );
    c.off("click");
    c.on("click", (ev) => {
      if (ev.data?.id) select(ev.data.id);
    });
  }

  function renderGcLine() {
    const c = chart("chart-gc");
    if (!c) return;
    const alphas = data.backbone.alphas;
    const gc = data.backbone.gc_size;
    const alpha = Number(state.alpha);
    const alphaIdx = alphas.findIndex((a) => Number(a) === alpha);
    const snap = data.backbone.snap_alpha;

    c.setOption({
      ...BASE,
      grid: { left: 52, right: 24, top: 36, bottom: 44 },
      xAxis: {
        type: "value",
        name: "α  (stricter →)",
        min: 0,
        max: 0.55,
        ...AXIS,
        nameLocation: "middle",
        nameGap: 28,
        inverse: true,
      },
      yAxis: {
        type: "value",
        name: "Cities in giant component",
        ...AXIS,
        nameGap: 40,
        minInterval: 1,
      },
      series: [
        {
          type: "line",
          data: alphas.map((a, i) => [a, gc[i]]),
          smooth: 0.2,
          symbol: "circle",
          symbolSize: 10,
          lineStyle: { color: BLUE, width: 3 },
          itemStyle: { color: BLUE, borderColor: "#fff", borderWidth: 2 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(31,143,214,0.28)" },
                { offset: 1, color: "rgba(31,143,214,0.02)" },
              ],
            },
          },
          markLine: {
            symbol: "none",
            label: {
              formatter: "snap",
              color: ORANGE,
              fontWeight: 700,
              fontSize: 11,
            },
            lineStyle: { color: ORANGE, type: "dashed", width: 1.5 },
            data: [{ xAxis: snap }],
          },
        },
        {
          type: "scatter",
          data: alphaIdx >= 0 ? [[alphas[alphaIdx], gc[alphaIdx]]] : [],
          symbolSize: 18,
          itemStyle: {
            color: ORANGE,
            borderColor: "#fff",
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: "rgba(242,130,12,0.45)",
          },
          z: 5,
          label: {
            show: true,
            formatter: (p) => `${p.value[1]} cities`,
            position: "top",
            color: INK,
            fontWeight: 700,
            fontSize: 11,
          },
        },
      ],
      tooltip: {
        ...BASE.tooltip,
        formatter: (p) => `α = ${p.value[0]} · giant component = ${p.value[1]} cities`,
      },
    });
  }

  function renderBackbone() {
    const c = chart("chart-backbone");
    if (!c) return;
    const g = data.backbone.graphs[state.alpha];
    if (!g) return;

    const nodes = g.nodes.map((id) => {
      const city = byId[id];
      const on = state.selected === id;
      return {
        id,
        name: city.name,
        symbolSize: 14 + Math.sqrt(city.positions) / 9,
        category: city.community,
        x: (city.lon + 126) * 6,
        y: -(city.lat - 24) * 10,
        itemStyle: {
          color: colourFor(city),
          borderColor: on ? INK : "#fff",
          borderWidth: on ? 3 : 2,
          shadowBlur: on ? 14 : 6,
          shadowColor: "rgba(15,35,64,0.2)",
        },
        label: {
          show: true,
          color: INK,
          fontSize: on ? 12 : 10,
          fontWeight: on ? 700 : 600,
          position: "bottom",
          distance: 6,
        },
      };
    });

    const links = g.edges.map(([a, b, w]) => ({
      source: a,
      target: b,
      value: w,
      lineStyle: {
        width: 1 + Math.log10(w + 1) * 1.4,
        color: "#8aa0b8",
        opacity: 0.55,
        curveness: 0.12,
      },
    }));

    c.setOption({
      ...BASE,
      series: [
        {
          type: "graph",
          layout: "none",
          roam: true,
          draggable: true,
          data: nodes,
          links,
          categories: data.communities.map((com) => ({ name: com.label })),
          lineStyle: { curveness: 0.12 },
          emphasis: {
            focus: "adjacency",
            lineStyle: { width: 4, opacity: 0.9, color: ORANGE },
          },
          scaleLimit: { min: 0.6, max: 3 },
        },
      ],
      tooltip: {
        ...BASE.tooltip,
        formatter: (p) => {
          if (p.dataType === "edge") {
            return tipHtml(`${byId[p.data.source].name} – ${byId[p.data.target].name}`, [
              ["Shared weight", fmt(p.data.value)],
            ]);
          }
          const city = byId[p.data.id];
          return tipHtml(city.name, [
            ["Positions", fmt(city.positions)],
            ["Community", data.communities[city.community]?.label ?? "—"],
          ]);
        },
      },
    });
    c.off("click");
    c.on("click", (ev) => {
      if (ev.dataType === "node" && ev.data?.id) select(ev.data.id);
    });
  }

  const LABELS = 8;

  function renderScatter() {
    const c = chart("chart-longhaul");
    if (!c) return;
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
    const isTied = (e) =>
      !state.selected || state.selected === e.a || state.selected === e.b;
    const heaviest = new Map();
    for (const e of data.longhaul.edges) {
      if (!isTied(e) || e.distance_km < 1500) continue;
      const best = heaviest.get(e.top_employer);
      if (!best || e.weight > best.weight) heaviest.set(e.top_employer, e);
    }
    const labelled = new Set(
      [...heaviest.values()].sort((x, y) => y.weight - x.weight).slice(0, LABELS),
    );

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

    c.setOption({
      ...BASE,
      legend: {
        top: 4,
        right: 8,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: MUTE, fontSize: 11, fontWeight: 600 },
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
        splitLine: { lineStyle: { color: LINE, type: "dashed" } },
      },
      yAxis: {
        type: "value",
        name: "Backbone weight",
        ...AXIS,
        nameGap: 42,
        splitLine: { lineStyle: { color: LINE, type: "dashed" } },
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
            color: MUTE,
            fontSize: 10,
            fontWeight: 600,
            distance: 4,
            textBorderColor: "#fff",
            textBorderWidth: 3,
          },
          labelLayout: { hideOverlap: true },
          data: [...labelled].map((e) => ({
            value: [e.distance_km, e.weight],
            employer: e.top_employer,
            symbolSize: edgeSize(e.weight),
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
    });
    c.off("click");
    c.on("click", (ev) => {
      if (ev.data?.a) select(ev.data.a);
    });
  }

  function renderArcs() {
    const c = chart("chart-arcs");
    if (!c) return;
    const pairs = data.longhaul.employer_arcs[state.employer] ?? [];
    const connected = new Set(pairs.flat());

    const lines = pairs.map(([a, b], i) => ({
      coords: [
        [byId[a].lon, byId[a].lat],
        [byId[b].lon, byId[b].lat],
      ],
      a,
      b,
      lineStyle: {
        // Slightly different curve per arc so parallel routes separate.
        curveness: 0.18 + (i % 3) * 0.06,
      },
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
          fontSize: 11,
          fontWeight: 600,
          distance: 6,
        },
      }));

    c.setOption(
      {
        ...BASE,
        geo: {
          map: "USA",
          roam: false,
          layoutCenter: ["50%", "52%"],
          layoutSize: "108%",
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
              return tipHtml(state.employer, [
                ["Link", `${byId[p.data.a].name} – ${byId[p.data.b].name}`],
              ]);
            }
            return p.data?.name ?? "";
          },
        },
      },
      { notMerge: true },
    );
    c.off("click");
    c.on("click", (ev) => {
      if (ev.data?.id) select(ev.data.id);
    });
  }

  function renderNullBits() {
    const box = $("place-null-stats");
    if (!box) return;
    const n = data.null_model;
    box.innerHTML = `
      <tr><td>Q (Louvain)</td><td style="text-align:right">${n.Q.toFixed(2)}</td></tr>
      <tr><td>Q null mean ± sd</td><td style="text-align:right">${n.Q_null_mean.toFixed(2)} ± ${n.Q_null_std.toFixed(2)}</td></tr>
      <tr><td>NMI across ${n.seeds} seeds</td><td style="text-align:right">${n.nmi_seeds.toFixed(2)}</td></tr>
      <tr><td>NMI vs Census regions</td><td style="text-align:right">${n.nmi_census_region.toFixed(2)}</td></tr>
      <tr><td>NMI vs Census divisions</td><td style="text-align:right">${n.nmi_census_division.toFixed(2)}</td></tr>
    `;
  }

  function renderAlphaTable() {
    const body = $("place-alpha-table");
    if (!body) return;
    body.innerHTML = data.backbone.alphas
      .map((a, i) => {
        const on = String(a) === state.alpha;
        return `<tr${on ? ' style="font-weight:700;background:#f7fafd"' : ""}><td>${a}</td><td style="text-align:right">${data.backbone.edges_kept[i]}</td><td style="text-align:right">${data.backbone.gc_size[i]}</td></tr>`;
      })
      .join("");
  }

  function renderSnapNote() {
    const el = $("place-snap-note");
    if (el) el.textContent = data.backbone.snap_note;
  }

  function renderLegendChips() {
    const el = $("place-region-legend");
    if (!el) return;
    const items =
      state.regionMode === "census"
        ? Object.entries(data.census_colours).map(([label, colour]) => ({ label, colour }))
        : data.communities.map((c) => ({ label: c.label, colour: c.colour }));
    el.innerHTML = items
      .map(
        (it) =>
          `<span><i style="background:${it.colour}"></i>${it.label}</span>`,
      )
      .join("");
  }

  function renderAll() {
    renderInspector();
    renderBars();
    renderUsMap("chart-citymap", { colourMode: "metric" });
    renderUsMap("chart-regions", { colourMode: "partition" });
    renderLegendChips();
    renderGcLine();
    renderBackbone();
    renderScatter();
    renderArcs();
    renderNullBits();
    renderAlphaTable();
    renderSnapNote();
  }

  document.querySelectorAll("[data-place-metric]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.metric = btn.getAttribute("data-place-metric");
      document.querySelectorAll("[data-place-metric]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      renderBars();
      renderUsMap("chart-citymap", { colourMode: "metric" });
    });
  });

  document.querySelectorAll("[data-place-region]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.regionMode = btn.getAttribute("data-place-region");
      document.querySelectorAll("[data-place-region]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      renderUsMap("chart-regions", { colourMode: "partition" });
      renderBackbone();
      renderLegendChips();
    });
  });

  const alpha = $("place-alpha");
  const alphaLabel = $("place-alpha-now");
  if (alpha) {
    const alphas = data.backbone.alphas;
    alpha.min = 0;
    alpha.max = alphas.length - 1;
    alpha.step = 1;
    alpha.value = String(alphas.indexOf(data.backbone.default_alpha));
    const sync = () => {
      state.alpha = String(alphas[Number(alpha.value)]);
      if (alphaLabel) alphaLabel.textContent = state.alpha;
      renderGcLine();
      renderBackbone();
      renderAlphaTable();
    };
    alpha.addEventListener("input", sync);
    sync();
  }

  const employer = $("place-employer");
  if (employer) {
    employer.innerHTML = data.longhaul.staffing
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");
    employer.value = state.employer;
    employer.addEventListener("change", () => {
      state.employer = employer.value;
      renderArcs();
    });
  }

  setStatus();
  renderAll();

  const draft = $("place-draft-banner");
  if (draft && data.meta.status === "placeholder") draft.hidden = false;

  return { select, data, state };
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function boot() {
  const status = $("place-status");
  if (status) status.textContent = "Loading place data…";
  try {
    if (!window.echarts) {
      await loadScript("../../assets/vendor/echarts-5.5.1.min.js");
    }
    await startPlace(window.echarts);
  } catch (err) {
    console.error(err);
    if (status) status.textContent = `Place section failed to load: ${err.message}`;
  }
}

boot();
