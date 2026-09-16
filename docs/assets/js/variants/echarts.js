// ?variant=echarts — every chart redrawn by Apache ECharts.
//
// Swaps the six data charts: the degree histogram, the CCDF, both scatters,
// Denmark's two scatters and the Nordic bars. The globe and the twin map stay
// on canvas, since ECharts would need its GL extension for either. What you
// get over the hand-rolled version is tooltips on every point, a zoomable
// axis, and log scales maintained by the library instead of by hand.

const AXIS = {
  axisLine: { lineStyle: { color: "#c6d4e6" } },
  axisLabel: { color: "#7a8fac", fontSize: 10 },
  splitLine: { lineStyle: { color: "#eaf0f7" } },
  nameTextStyle: { color: "#7a8fac", fontSize: 10 },
};

const BASE = {
  animationDuration: 320,
  textStyle: { fontFamily: "-apple-system, system-ui, sans-serif" },
  tooltip: { trigger: "item", confine: true },
};

export function install(api, echarts) {
  const {
    state, node, metrics, withMetrics, degreeCounts, ccdf, select, $, colours,
    showTip, hideTip, modeFlags, spotlight,
  } = api;
  const charts = new Map();

  function chart(id) {
    const canvas = $(id);
    if (!canvas) return null;
    let host = document.getElementById(`${id}-ec`);
    if (!host) {
      host = document.createElement("div");
      host.id = `${id}-ec`;
      host.style.width = "100%";
      host.style.height = `${Math.round((canvas.clientWidth || 600) * (canvas.height / canvas.width))}px`;
      canvas.after(host);
      canvas.style.display = "none";
    }
    if (!charts.has(id)) {
      const instance = echarts.init(host, null, { renderer: "canvas" });
      instance.on("click", (event) => {
        const iso3 = event.data?.iso3 ?? event.data?.[2];
        if (iso3) select(iso3);
      });
      // The page has one tooltip design; ECharts feeds it rather than running
      // a second one of its own, so hovering reads the same in every renderer.
      instance.on("mouseover", (event) => {
        if (!event.data?.tip) return;
        const rect = host.getBoundingClientRect();
        showTip(
          { clientX: rect.left + (event.event?.offsetX ?? rect.width / 2),
            clientY: rect.top + (event.event?.offsetY ?? rect.height / 2) },
          event.data.tip,
        );
      });
      instance.on("mouseout", hideTip);
      host.addEventListener("pointerleave", hideTip);
      charts.set(id, instance);
      window.addEventListener("resize", () => instance.resize());
    }
    return charts.get(id);
  }

  const point = (x, y, iso3, name, tip) => ({ value: [x, y], iso3, name, tip });

  function scatterSeries(name, rows, colour, size = 6) {
    return {
      name,
      type: "scatter",
      symbolSize: size,
      itemStyle: { color: colour, opacity: 0.8 },
      emphasis: { itemStyle: { color: colour, opacity: 1, borderColor: "#0f2340", borderWidth: 1.5 } },
      data: rows,
    };
  }

  function highlightSeries(iso3, x, y, colour = "#0f2340") {
    if (!iso3) return [];
    return [
      {
        type: "scatter",
        symbolSize: 13,
        symbol: "circle",
        itemStyle: { color: "transparent", borderColor: colour, borderWidth: 2 },
        label: {
          show: true,
          position: "right",
          formatter: node(iso3).name,
          color: colour,
          fontSize: 10,
          fontWeight: 600,
        },
        data: [point(x, y, iso3, node(iso3).name)],
        tooltip: { show: false },
        z: 10,
      },
    ];
  }

  function hist() {
    const instance = chart("hist");
    if (!instance) return;
    const series = [
      ["In-degree", (n, m) => m.in_degree, colours.PEOPLE],
      ["Out-degree", (n, m) => m.out_degree, colours.INK],
      ["Flight degree", (n) => n.flight_degree, colours.ACCESS],
    ].map(([name, pick, colour]) => ({
      name,
      type: "bar",
      barGap: "-20%",
      barCategoryGap: "40%",
      itemStyle: { color: colour, opacity: 0.85 },
      data: degreeCounts(pick).map((d) =>
        point(d.k, d.c, d.iso3, name,
          `<b>${d.k} partners</b><span>${d.c} ${d.c === 1 ? "country" : "countries"}</span>` +
          `<span>largest: ${node(d.iso3).name}</span>`)),
    }));
    instance.setOption(
      {
        ...BASE,
        legend: { top: 0, textStyle: { color: "#46618a", fontSize: 11 } },
        grid: { left: 54, right: 16, top: 30, bottom: 44 },
        xAxis: { ...AXIS, type: modeFlags("hist").x ? "log" : "value", name: "Partners", nameLocation: "middle", nameGap: 26 },
        yAxis: { ...AXIS, type: modeFlags("hist").y ? "log" : "value", name: "Countries", nameLocation: "middle", nameGap: 36 },
        tooltip: {
          ...BASE.tooltip,
          formatter: (p) =>
            `degree ${p.value[0]}<br/>${p.value[1]} countries<br/>largest: ${node(p.data.iso3).name}`,
        },
        series,
      },
      true,
    );
  }

  function ccdfChart() {
    const instance = chart("ccdf");
    if (!instance) return;
    const rows = withMetrics();
    const series = [
      ["In-degree", (n, m) => m.in_degree, colours.PEOPLE],
      ["Out-degree", (n, m) => m.out_degree, colours.INK],
      ["Flight degree", (n) => n.flight_degree, colours.ACCESS],
    ].map(([name, pick, colour]) =>
      scatterSeries(
        name,
        ccdf(rows.map(({ iso3, n, m }) => ({ k: pick(n, m), iso3 }))).map((d) =>
          point(d.k, d.p, d.iso3, name,
            `<b>at least ${d.k} partners</b><span>${(d.p * 100).toFixed(1)}% of countries</span>` +
            `<span>e.g. ${node(d.iso3).name}</span>`),
        ),
        colour,
        5,
      ),
    );
    instance.setOption(
      {
        ...BASE,
        legend: { top: 0, textStyle: { color: "#46618a", fontSize: 11 } },
        grid: { left: 54, right: 16, top: 30, bottom: 44 },
        xAxis: { ...AXIS, type: modeFlags("ccdf").x ? "log" : "value", name: "Partners", nameLocation: "middle", nameGap: 26 },
        yAxis: { ...AXIS, type: modeFlags("ccdf").y ? "log" : "value", name: "P(K ≥ k)", nameLocation: "middle", nameGap: 40 },
        tooltip: {
          ...BASE.tooltip,
          formatter: (p) =>
            `${p.seriesName} ≥ ${p.value[0]}<br/>${(p.value[1] * 100).toFixed(1)}% of countries`,
        },
        series,
      },
      true,
    );
  }

  function scatterBetween() {
    const instance = chart("scatter-between");
    if (!instance) return;
    const y = String(state.data.null_year);
    const migration = withMetrics(y)
      .filter((r) => r.m.in_degree > 0 && r.m.betweenness > 0)
      .map((r) => point(r.m.in_degree, r.m.betweenness, r.iso3, r.n.name,
        `<b>${r.n.name}</b><span>Migration network</span>` +
        `<span>${r.m.in_degree} origins · #${r.m.in_degree_rank}</span>` +
        `<span>betweenness ${r.m.betweenness.toExponential(2)} · #${r.m.betweenness_rank}</span>`));
    const flights = state.data.countries
      .map((iso3) => ({ iso3, n: node(iso3) }))
      .filter((r) => r.n.flight_in_degree > 0 && r.n.flight_betweenness > 0)
      .map((r) => point(r.n.flight_in_degree, r.n.flight_betweenness, r.iso3, r.n.name,
        `<b>${r.n.name}</b><span>Flight network</span>` +
        `<span>${r.n.flight_in_degree} flight partners</span>`));
    const chosen = state.selected ? metrics(state.selected, y) : null;
    instance.setOption(
      {
        ...BASE,
        legend: { top: 0, textStyle: { color: "#46618a", fontSize: 11 } },
        grid: { left: 62, right: 18, top: 30, bottom: 46 },
        xAxis: { ...AXIS, type: "log", name: "In-degree", nameLocation: "middle", nameGap: 26 },
        yAxis: { ...AXIS, type: "log", name: "Betweenness", nameLocation: "middle", nameGap: 44 },
        tooltip: {
          ...BASE.tooltip,
          formatter: (p) =>
            `<b>${p.data.name}</b><br/>${p.seriesName}<br/>degree ${p.value[0]}<br/>betweenness ${Number(p.value[1]).toExponential(2)}`,
        },
        series: [
          scatterSeries("Migration", migration, colours.PEOPLE, 9),
          scatterSeries("Flights", flights, colours.ACCESS, 8),
          ...(chosen && chosen.betweenness > 0
            ? highlightSeries(state.selected, chosen.in_degree, chosen.betweenness)
            : []),
        ],
      },
      true,
    );
  }

  function scatterZ() {
    const instance = chart("scatter-z");
    if (!instance) return;
    const y = String(state.data.null_year);
    const rows = withMetrics(y).filter((r) => r.m.z !== undefined && r.m.in_degree > 0);
    const zTip = (r) =>
      `<b>${r.n.name}</b><span>z = ${r.m.z.toFixed(2)}</span>` +
      `<span>${r.m.in_degree} origins · betweenness #${r.m.betweenness_rank}</span>`;
    const above = rows.filter((r) => r.m.z >= 2).map((r) => point(r.m.in_degree, r.m.z, r.iso3, r.n.name, zTip(r)));
    const rest = rows.filter((r) => r.m.z < 2).map((r) => point(r.m.in_degree, r.m.z, r.iso3, r.n.name, zTip(r)));
    const chosen = state.selected ? metrics(state.selected, y) : null;
    instance.setOption(
      {
        ...BASE,
        legend: { top: 0, textStyle: { color: "#46618a", fontSize: 11 } },
        grid: { left: 58, right: 18, top: 30, bottom: 46 },
        xAxis: { ...AXIS, type: "log", name: "In-degree", nameLocation: "middle", nameGap: 26 },
        yAxis: { ...AXIS, type: "value", name: "z-score", nameLocation: "middle", nameGap: 38 },
        tooltip: {
          ...BASE.tooltip,
          formatter: (p) =>
            `<b>${p.data.name}</b><br/>degree ${p.value[0]}<br/>z = ${Number(p.value[1]).toFixed(2)}`,
        },
        series: [
          scatterSeries("Surprising (z ≥ 2)", above, colours.PEOPLE, 10),
          scatterSeries("Explained by degree", rest, colours.ACCESS, 8),
          {
            type: "line",
            markLine: {
              silent: true,
              symbol: "none",
              lineStyle: { color: "#c2d0e2", type: "dashed" },
              data: [{ yAxis: 0 }],
              label: { show: false },
            },
            data: [],
          },
          ...(chosen && chosen.z !== undefined
            ? highlightSeries(state.selected, chosen.in_degree, chosen.z)
            : []),
        ],
      },
      true,
    );
  }

  function denmark() {
    const focus = spotlight();
    const y = String(state.data.null_year);
    const rows = withMetrics(y).filter((r) => r.m.in_degree > 0 && r.m.betweenness > 0);
    const dk = metrics(focus.iso3, y);
    if (!dk) return;

    const small = (id, option) => {
      const instance = chart(id);
      if (instance) instance.setOption({ ...BASE, ...option }, true);
    };

    small("dk-scatter", {
      grid: { left: 48, right: 12, top: 14, bottom: 34 },
      xAxis: { ...AXIS, type: "log", name: "Degree", nameLocation: "middle", nameGap: 22 },
      yAxis: { ...AXIS, type: "log" },
      tooltip: { ...BASE.tooltip, formatter: (p) => p.data.name ?? "" },
      series: [
        scatterSeries(
          "Countries",
          rows.map((r) => point(r.m.in_degree, r.m.betweenness, r.iso3, r.n.name,
            `<b>${r.n.name}</b><span>${r.m.in_degree} origins</span>` +
            `<span>betweenness #${r.m.betweenness_rank}</span>`)),
          "#c9d7e8",
          6,
        ),
        scatterSeries(
          focus.name,
          [point(dk.in_degree, dk.betweenness, focus.iso3, focus.name)],
          "#d0021b",
          10,
        ),
      ],
    });

    const zRows = rows.filter((r) => r.m.z !== undefined);
    small("dk-z", {
      grid: { left: 42, right: 12, top: 14, bottom: 34 },
      xAxis: { ...AXIS, type: "log", name: "Degree", nameLocation: "middle", nameGap: 22 },
      yAxis: { ...AXIS, type: "value" },
      tooltip: { ...BASE.tooltip, formatter: (p) => p.data.name ?? "" },
      series: [
        scatterSeries(
          "Countries",
          zRows.map((r) => point(r.m.in_degree, r.m.z, r.iso3, r.n.name,
            `<b>${r.n.name}</b><span>z = ${r.m.z.toFixed(2)}</span>`)),
          "#c9d7e8",
          6,
        ),
        ...(dk.z === undefined
          ? []
          : [scatterSeries(focus.name, [point(dk.in_degree, dk.z, focus.iso3, focus.name)], "#d0021b", 10)]),
      ],
    });

    small("dk-time", {
      grid: { left: 54, right: 12, top: 14, bottom: 30 },
      xAxis: { ...AXIS, type: "category", data: focus.series.map((s) => s.year) },
      yAxis: { ...AXIS, type: "value" },
      tooltip: { trigger: "axis", confine: true },
      series: [
        {
          name: "In-strength",
          type: "line",
          smooth: true,
          itemStyle: { color: colours.PEOPLE },
          areaStyle: { color: "rgba(242,130,12,0.12)" },
          data: focus.series.map((s) => s.in_strength),
        },
        {
          name: "Out-strength",
          type: "line",
          smooth: true,
          itemStyle: { color: colours.ACCESS },
          data: focus.series.map((s) => s.out_strength),
        },
      ],
    });

    small("dk-rank", {
      grid: { left: 44, right: 12, top: 14, bottom: 30 },
      xAxis: { ...AXIS, type: "category", data: focus.series.map((s) => s.year) },
      yAxis: { ...AXIS, type: "value", inverse: true, axisLabel: { ...AXIS.axisLabel, formatter: "#{value}" } },
      tooltip: { trigger: "axis", confine: true, formatter: (p) => `${p[0].name}: rank #${p[0].value}` },
      series: [
        {
          type: "line",
          smooth: true,
          itemStyle: { color: colours.INK },
          data: focus.series.map((s) => s.betweenness_rank),
        },
      ],
    });

    small("dk-nordic", {
      legend: { top: 0, textStyle: { color: "#46618a", fontSize: 10 } },
      grid: { left: 40, right: 12, top: 26, bottom: 30 },
      xAxis: { ...AXIS, type: "category", data: focus.peers.map((i) => i.iso3) },
      yAxis: { ...AXIS, type: "value", max: 1, axisLabel: { show: false } },
      tooltip: { trigger: "axis", confine: true },
      series: [
        ["In-degree", (i) => i.in_degree, colours.PEOPLE],
        ["z-score", (i) => Math.abs(i.z ?? 0), colours.INK],
        ["Flight degree", (i) => i.flight_degree, colours.ACCESS],
      ].map(([name, pick, colour]) => {
        const max = Math.max(...focus.peers.map(pick), 1);
        return {
          name,
          type: "bar",
          itemStyle: { color: colour },
          data: focus.peers.map((i) => ({ value: pick(i) / max, iso3: i.iso3, name: i.name })),
        };
      }),
    });
  }

  return {
    hist,
    ccdf: ccdfChart,
    scatterBetween,
    scatterZ,
    scatters: () => {
      scatterBetween();
      scatterZ();
    },
    denmark,
  };
}
