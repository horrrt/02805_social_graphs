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
    showTip, hideTip, modeFlags, spotlight, format,
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

  function scatterSeries(name, rows, colour, size = 8) {
    return {
      name,
      type: "scatter",
      symbolSize: size,
      itemStyle: { color: colour, opacity: 0.8 },
      emphasis: {
        scale: 1.6,
        itemStyle: { color: colour, opacity: 1, borderColor: "#0f2340", borderWidth: 1.5 },
      },
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
      barGap: "8%",
      barCategoryGap: "28%",
      itemStyle: { color: colour, opacity: 0.85 },
      emphasis: { itemStyle: { opacity: 1, shadowBlur: 6, shadowColor: "rgba(15,35,64,0.25)" } },
      barMaxWidth: 10,
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
        // The page has one tooltip design; disabling ECharts' own keeps the
        // mouseover handler below as the only one that fires.
        tooltip: { show: false },
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
        8,
      ),
    );
    instance.setOption(
      {
        ...BASE,
        legend: { top: 0, textStyle: { color: "#46618a", fontSize: 11 } },
        grid: { left: 54, right: 16, top: 30, bottom: 44 },
        xAxis: { ...AXIS, type: modeFlags("ccdf").x ? "log" : "value", name: "Partners", nameLocation: "middle", nameGap: 26 },
        yAxis: { ...AXIS, type: modeFlags("ccdf").y ? "log" : "value", name: "P(K ≥ k)", nameLocation: "middle", nameGap: 40 },
        tooltip: { show: false },
        series,
      },
      true,
    );
  }

  function scatterBetween() {
    const instance = chart("scatter-between");
    if (!instance) return;
    const y = String(state.data.null_year);
    const rows = withMetrics(y).filter((r) => r.m.in_degree > 0);
    const flightRows = state.data.countries
      .map((iso3) => ({ iso3, n: node(iso3) }))
      .filter((r) => r.n.flight_in_degree > 0);
    // A log axis cannot hold a zero, and half the world has one. Rather than
    // drop those countries, they are drawn on a baseline row below the lowest
    // real value, with the tooltip saying the value is exactly zero.
    const positive = [
      ...rows.map((r) => r.m.betweenness),
      ...flightRows.map((r) => r.n.flight_betweenness),
    ].filter((value) => value > 0);
    const minB = Math.min(...positive);
    const zeroRow = minB / 4;
    const migrationTip = (r) =>
      `<b>${r.n.name}</b><span>Migration network</span>` +
      `<span>${r.m.in_degree} origins · #${r.m.in_degree_rank}</span>` +
      (r.m.betweenness > 0
        ? `<span>betweenness ${r.m.betweenness.toExponential(2)} · #${r.m.betweenness_rank}</span>`
        : "<span>betweenness 0 · on no shortest path between two other countries</span>");
    const flightTip = (r) =>
      `<b>${r.n.name}</b><span>Flight network</span>` +
      `<span>${r.n.flight_in_degree} flight partners</span>` +
      (r.n.flight_betweenness > 0
        ? `<span>betweenness ${r.n.flight_betweenness.toExponential(2)}</span>`
        : "<span>betweenness 0 · on no shortest path between two other countries</span>");
    const migration = rows
      .filter((r) => r.m.betweenness > 0)
      .map((r) => point(r.m.in_degree, r.m.betweenness, r.iso3, r.n.name, migrationTip(r)));
    const flights = flightRows
      .filter((r) => r.n.flight_betweenness > 0)
      .map((r) => point(r.n.flight_in_degree, r.n.flight_betweenness, r.iso3, r.n.name, flightTip(r)));
    const zeros = [
      ...rows.filter((r) => r.m.betweenness === 0)
        .map((r) => point(r.m.in_degree, zeroRow, r.iso3, r.n.name, migrationTip(r))),
      ...flightRows.filter((r) => r.n.flight_betweenness === 0)
        .map((r) => point(r.n.flight_in_degree, zeroRow, r.iso3, r.n.name, flightTip(r))),
    ];
    const chosen = state.selected ? metrics(state.selected, y) : null;
    instance.setOption(
      {
        ...BASE,
        legend: { top: 0, textStyle: { color: "#46618a", fontSize: 11 } },
        grid: { left: 62, right: 18, top: 30, bottom: 46 },
        xAxis: { ...AXIS, type: "log", name: "In-degree", nameLocation: "middle", nameGap: 26 },
        yAxis: {
          ...AXIS,
          type: "log",
          min: minB / 8,
          // Ticks below the smallest real value would label the baseline row
          // with a number, and the row is an exact zero. The row gets its own
          // label from the markLine instead.
          axisLabel: { ...AXIS.axisLabel, formatter: (value) => (value < minB ? "" : String(value)) },
          name: "Betweenness",
          nameLocation: "middle",
          nameGap: 44,
        },
        tooltip: { show: false },
        series: [
          scatterSeries("Migration", migration, colours.PEOPLE, 9),
          scatterSeries("Flights", flights, colours.ACCESS, 8),
          {
            ...scatterSeries("Betweenness 0", zeros, "#9fb2c9", 7),
            symbol: "diamond",
          },
          ...(chosen && chosen.in_degree > 0
            ? highlightSeries(
                state.selected,
                chosen.in_degree,
                chosen.betweenness > 0 ? chosen.betweenness : zeroRow,
              )
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
        tooltip: { show: false },
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
    const rows = withMetrics(y).filter((r) => r.m.in_degree > 0);
    const dk = metrics(focus.iso3, y);
    if (!dk) return;
    // The same baseline row as section 3: a country that brokers nothing stays
    // on its own chart instead of disappearing from it.
    const positive = rows.map((r) => r.m.betweenness).filter((value) => value > 0);
    const minB = Math.min(...positive);
    const zeroRow = minB / 4;
    const onRow = (value) => (value > 0 ? value : zeroRow);

    const small = (id, option) => {
      const instance = chart(id);
      if (instance) instance.setOption({ ...BASE, ...option }, true);
    };

    small("dk-scatter", {
      grid: { left: 48, right: 12, top: 14, bottom: 34 },
      xAxis: { ...AXIS, type: "log", name: "Degree", nameLocation: "middle", nameGap: 22 },
      yAxis: {
        ...AXIS,
        type: "log",
        min: zeroRow,
        // The axis floor is the baseline row itself, so its label reads 0.
        axisLabel: {
          ...AXIS.axisLabel,
          showMinLabel: true,
          formatter: (value) => (value <= zeroRow * 1.001 ? "0" : String(value)),
        },
      },
      tooltip: { show: false },
      series: [
        scatterSeries(
          "Countries",
          rows.map((r) => point(r.m.in_degree, onRow(r.m.betweenness), r.iso3, r.n.name,
            `<b>${r.n.name}</b><span>${r.m.in_degree} origins</span>` +
            (r.m.betweenness > 0
              ? `<span>betweenness #${r.m.betweenness_rank}</span>`
              : "<span>betweenness 0</span>"))),
          "#c9d7e8",
          6,
        ),
        scatterSeries(
          focus.name,
          [point(dk.in_degree, onRow(dk.betweenness), focus.iso3, focus.name)],
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
      tooltip: { show: false },
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

    const timeTip = (s) =>
      `<b>${focus.name}, ${s.year}</b>` +
      `<span>${format.fmt.format(s.in_strength)} incoming</span>` +
      `<span>${format.fmt.format(s.out_strength)} outgoing</span>`;
    small("dk-time", {
      grid: { left: 54, right: 12, top: 14, bottom: 30 },
      xAxis: { ...AXIS, type: "category", data: focus.series.map((s) => s.year) },
      yAxis: { ...AXIS, type: "value" },
      tooltip: { show: false },
      series: [
        {
          name: "In-strength",
          type: "line",
          smooth: true,
          showSymbol: true,
          symbolSize: 7,
          itemStyle: { color: colours.PEOPLE },
          areaStyle: { color: "rgba(242,130,12,0.12)" },
          data: focus.series.map((s) => ({ value: s.in_strength, iso3: focus.iso3, name: focus.name, tip: timeTip(s) })),
        },
        {
          name: "Out-strength",
          type: "line",
          smooth: true,
          showSymbol: true,
          symbolSize: 7,
          itemStyle: { color: colours.ACCESS },
          data: focus.series.map((s) => ({ value: s.out_strength, iso3: focus.iso3, name: focus.name, tip: timeTip(s) })),
        },
      ],
    });

    small("dk-rank", {
      grid: { left: 44, right: 12, top: 14, bottom: 30 },
      xAxis: { ...AXIS, type: "category", data: focus.series.map((s) => s.year) },
      yAxis: { ...AXIS, type: "value", inverse: true, axisLabel: { ...AXIS.axisLabel, formatter: "#{value}" } },
      tooltip: { show: false },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: true,
          symbolSize: 7,
          itemStyle: { color: colours.INK },
          data: focus.series.map((s) => ({
            value: s.betweenness_rank,
            iso3: focus.iso3,
            name: focus.name,
            tip: `<b>${focus.name}, ${s.year}</b>` +
              `<span>bridge rank #${s.betweenness_rank}</span>` +
              `<span>${s.in_degree} origins</span>`,
          })),
        },
      ],
    });

    const nordicTip = (name, raw, i) =>
      `<b>${i.name}</b><span>${name}: ${raw}</span>` +
      `<span>betweenness rank #${i.betweenness_rank}</span>` +
      `<span>${i.km ? `${format.fmt.format(i.km)} km away` : "the country in question"}</span>`;
    small("dk-nordic", {
      legend: { top: 0, textStyle: { color: "#46618a", fontSize: 10 } },
      grid: { left: 40, right: 12, top: 26, bottom: 30 },
      xAxis: { ...AXIS, type: "category", data: focus.peers.map((i) => i.iso3) },
      yAxis: { ...AXIS, type: "value", max: 1, axisLabel: { show: false } },
      tooltip: { show: false },
      series: [
        ["In-degree", (i) => i.in_degree, (i) => i.in_degree, colours.PEOPLE],
        ["z-score", (i) => Math.abs(i.z ?? 0), (i) => (i.z ?? 0).toFixed(2), colours.INK],
        ["Flight degree", (i) => i.flight_degree, (i) => i.flight_degree, colours.ACCESS],
      ].map(([name, pick, raw, colour]) => {
        const max = Math.max(...focus.peers.map(pick), 1);
        return {
          name,
          type: "bar",
          itemStyle: { color: colour },
          data: focus.peers.map((i) => ({
            value: pick(i) / max, iso3: i.iso3, name: i.name,
            tip: nordicTip(name, raw(i), i),
          })),
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
