// ?variant=d3 — everything in SVG, drawn with D3 v7.
//
// Swaps the most: all six data charts become SVG with real axes, and the hero
// globe becomes a d3-geo orthographic projection with great-circle arcs. The
// twin map stays on canvas, because 400 arcs as SVG paths is where the frame
// rate goes. What you gain over canvas is selectable text, crisp type at any
// zoom, and axes that D3 maintains instead of the hand-rolled tick code.

const FONT = "-apple-system, system-ui, sans-serif";

export function install(api, d3) {
  const { state, node, metrics, withMetrics, degreeCounts, ccdf, select, colours, $ } =
    api;

  // One SVG per canvas, sized from the canvas it replaces so the layout does
  // not move when you switch variants.
  function svgFor(id, pad = { l: 52, r: 16, t: 14, b: 38 }) {
    const canvas = $(id);
    if (!canvas) return null;
    const width = canvas.clientWidth || 600;
    const height = Math.round(width * (canvas.height / canvas.width));
    let host = document.getElementById(`${id}-d3`);
    if (!host) {
      host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      host.id = `${id}-d3`;
      host.style.display = "block";
      host.style.width = "100%";
      canvas.after(host);
      canvas.style.display = "none";
    }
    const svg = d3.select(host).attr("viewBox", `0 0 ${width} ${height}`).attr("height", height);
    svg.selectAll("*").remove();
    return {
      svg,
      width,
      height,
      inner: { left: pad.l, right: width - pad.r, top: pad.t, bottom: height - pad.b },
    };
  }

  function axes(svg, box, x, y, { xLabel, yLabel, xTicks = 5, yTicks = 5, yFormat } = {}) {
    const g = svg.append("g");
    g.append("g")
      .attr("transform", `translate(0,${box.bottom})`)
      .call(d3.axisBottom(x).ticks(xTicks, "~s").tickSize(-(box.bottom - box.top)))
      .call((s) => s.selectAll(".tick line").attr("stroke", "#eaf0f7"))
      .call((s) => s.select(".domain").attr("stroke", "#c6d4e6"))
      .call((s) => s.selectAll("text").attr("fill", "#7a8fac").attr("font-size", 10));
    g.append("g")
      .attr("transform", `translate(${box.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(yTicks, yFormat ?? "~s")
          .tickSize(-(box.right - box.left)),
      )
      .call((s) => s.selectAll(".tick line").attr("stroke", "#eaf0f7"))
      .call((s) => s.select(".domain").attr("stroke", "#c6d4e6"))
      .call((s) => s.selectAll("text").attr("fill", "#7a8fac").attr("font-size", 10));
    const label = (text, tx, ty, rotate) =>
      g
        .append("text")
        .attr("transform", `translate(${tx},${ty})${rotate ? " rotate(-90)" : ""}`)
        .attr("fill", "#7a8fac")
        .attr("font-family", FONT)
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text(text);
    if (xLabel) label(xLabel, (box.left + box.right) / 2, box.bottom + 30, false);
    if (yLabel) label(yLabel, 13, (box.top + box.bottom) / 2, true);
    return g;
  }

  function plotPoints(svg, rows, x, y, colour, radius, onPick) {
    svg
      .append("g")
      .selectAll("circle")
      .data(rows)
      .join("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", radius)
      .attr("fill", colour)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => onPick(d.iso3))
      .append("title")
      .text((d) => d.title);
  }

  function highlight(svg, x, y, point, name) {
    if (!point) return;
    const g = svg.append("g");
    g.append("circle")
      .attr("cx", x(point.x))
      .attr("cy", y(point.y))
      .attr("r", 6)
      .attr("fill", "none")
      .attr("stroke", colours.INK)
      .attr("stroke-width", 1.8);
    g.append("text")
      .attr("x", x(point.x) + 9)
      .attr("y", y(point.y) + 3)
      .attr("fill", colours.INK)
      .attr("font-family", FONT)
      .attr("font-size", 10)
      .attr("font-weight", 600)
      .text(name);
  }

  // Rebuilt per draw, so the palette dropdown reaches the SVG charts too.
  const series = () => [
    ["In-degree", (n, m) => m.in_degree, colours.PEOPLE],
    ["Out-degree", (n, m) => m.out_degree, colours.INK],
    ["Flight degree", (n) => n.flight_degree, colours.ACCESS],
  ];

  function hist() {
    const box = svgFor("hist");
    if (!box) return;
    const SERIES = series();
    const all = SERIES.map(([, pick]) => degreeCounts(pick));
    const flat = all.flat();
    const x = d3
      .scaleLog()
      .domain([1, d3.max(flat, (d) => d.k)])
      .range([box.inner.left, box.inner.right]);
    const y = d3
      .scaleLog()
      .domain([1, d3.max(flat, (d) => d.c)])
      .range([box.inner.bottom, box.inner.top]);
    axes(box.svg, box.inner, x, y, { xLabel: "Degree", yLabel: "Countries" });
    all.forEach((rows, i) => {
      box.svg
        .append("g")
        .selectAll("rect")
        .data(rows)
        .join("rect")
        .attr("x", (d) => x(d.k) - 1.5 + i * 1.6)
        .attr("y", (d) => y(d.c))
        .attr("width", 2)
        .attr("height", (d) => box.inner.bottom - y(d.c))
        .attr("fill", SERIES[i][2])
        .attr("opacity", 0.85)
        .attr("cursor", "pointer")
        .on("click", (_e, d) => select(d.iso3))
        .append("title")
        .text((d) => `degree ${d.k} · ${d.c} countries · largest ${node(d.iso3).name}`);
    });
  }

  function ccdfChart() {
    const box = svgFor("ccdf");
    if (!box) return;
    const rows = withMetrics();
    const SERIES = series();
    const curves = SERIES.map(([, pick]) =>
      ccdf(rows.map(({ iso3, n, m }) => ({ k: pick(n, m), iso3 }))),
    );
    const flat = curves.flat();
    const x = d3.scaleLog().domain([1, d3.max(flat, (d) => d.k)]).range([box.inner.left, box.inner.right]);
    const y = d3.scaleLog().domain([d3.min(flat, (d) => d.p), 1]).range([box.inner.bottom, box.inner.top]);
    axes(box.svg, box.inner, x, y, { xLabel: "Degree", yLabel: "P(K ≥ k)", yFormat: ".0e" });
    curves.forEach((points, i) =>
      plotPoints(
        box.svg,
        points.map((d) => ({
          x: d.k,
          y: d.p,
          iso3: d.iso3,
          title: `${SERIES[i][0]} ≥ ${d.k} · ${(d.p * 100).toFixed(1)}%`,
        })),
        x,
        y,
        SERIES[i][2],
        2.4,
        select,
      ),
    );
  }

  function scatterBetween() {
    const box = svgFor("scatter-between", { l: 62, r: 18, t: 14, b: 42 });
    if (!box) return;
    const y3 = String(state.data.null_year);
    const migration = withMetrics(y3)
      .filter((r) => r.m.in_degree > 0 && r.m.betweenness > 0)
      .map((r) => ({
        x: r.m.in_degree,
        y: r.m.betweenness,
        iso3: r.iso3,
        title: `${r.n.name} · degree ${r.m.in_degree}`,
      }));
    const flights = state.data.countries
      .map((iso3) => ({ iso3, n: node(iso3) }))
      .filter((r) => r.n.flight_in_degree > 0 && r.n.flight_betweenness > 0)
      .map((r) => ({
        x: r.n.flight_in_degree,
        y: r.n.flight_betweenness,
        iso3: r.iso3,
        title: `${r.n.name} · flights`,
      }));
    const all = migration.concat(flights);
    const x = d3.scaleLog().domain([1, d3.max(all, (d) => d.x)]).range([box.inner.left, box.inner.right]);
    const y = d3
      .scaleLog()
      .domain([d3.min(all, (d) => d.y), d3.max(all, (d) => d.y)])
      .range([box.inner.bottom, box.inner.top]);
    axes(box.svg, box.inner, x, y, { xLabel: "In-degree", yLabel: "Betweenness", yFormat: ".0e" });
    plotPoints(box.svg, flights, x, y, `${colours.ACCESS}99`, 2.2, select);
    plotPoints(box.svg, migration, x, y, `${colours.PEOPLE}cc`, 2.6, select);
    const chosen = state.selected ? metrics(state.selected, y3) : null;
    if (chosen?.betweenness > 0) {
      highlight(box.svg, x, y, { x: chosen.in_degree, y: chosen.betweenness }, node(state.selected).name);
    }
  }

  function scatterZ() {
    const box = svgFor("scatter-z", { l: 58, r: 18, t: 14, b: 42 });
    if (!box) return;
    const y3 = String(state.data.null_year);
    const rows = withMetrics(y3)
      .filter((r) => r.m.z !== undefined && r.m.in_degree > 0)
      .map((r) => ({ x: r.m.in_degree, y: r.m.z, iso3: r.iso3, title: `${r.n.name} · z ${r.m.z.toFixed(2)}` }));
    const x = d3.scaleLog().domain([1, d3.max(rows, (d) => d.x)]).range([box.inner.left, box.inner.right]);
    const y = d3
      .scaleLinear()
      .domain([Math.min(-2, d3.min(rows, (d) => d.y)), Math.max(2, d3.max(rows, (d) => d.y))])
      .nice()
      .range([box.inner.bottom, box.inner.top]);
    axes(box.svg, box.inner, x, y, { xLabel: "In-degree", yLabel: "z-score", yFormat: "d" });
    box.svg
      .append("line")
      .attr("x1", box.inner.left)
      .attr("x2", box.inner.right)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "#c2d0e2")
      .attr("stroke-dasharray", "4 4");
    plotPoints(box.svg, rows.filter((d) => d.y < 2), x, y, `${colours.ACCESS}99`, 2.4, select);
    plotPoints(box.svg, rows.filter((d) => d.y >= 2), x, y, colours.PEOPLE, 2.8, select);
    const chosen = state.selected ? metrics(state.selected, y3) : null;
    if (chosen?.z !== undefined) {
      highlight(box.svg, x, y, { x: chosen.in_degree, y: chosen.z }, node(state.selected).name);
    }
  }

  function denmark() {
    const focus = state.data.focus;
    const y3 = String(state.data.null_year);
    const dk = metrics(focus.iso3, y3);
    if (!dk) return;
    const rows = withMetrics(y3).filter((r) => r.m.in_degree > 0 && r.m.betweenness > 0);
    const pad = { l: 44, r: 12, t: 12, b: 30 };

    let box = svgFor("dk-scatter", pad);
    if (box) {
      const x = d3.scaleLog().domain([1, d3.max(rows, (r) => r.m.in_degree)]).range([box.inner.left, box.inner.right]);
      const y = d3
        .scaleLog()
        .domain([d3.min(rows, (r) => r.m.betweenness), d3.max(rows, (r) => r.m.betweenness)])
        .range([box.inner.bottom, box.inner.top]);
      axes(box.svg, box.inner, x, y, { xLabel: "Degree", xTicks: 3, yTicks: 3, yFormat: ".0e" });
      plotPoints(
        box.svg,
        rows.map((r) => ({ x: r.m.in_degree, y: r.m.betweenness, iso3: r.iso3, title: r.n.name })),
        x, y, "#c9d7e8", 1.9, select,
      );
      highlight(box.svg, x, y, { x: dk.in_degree, y: dk.betweenness }, "Denmark");
    }

    box = svgFor("dk-z", pad);
    if (box) {
      const zRows = rows.filter((r) => r.m.z !== undefined);
      const x = d3.scaleLog().domain([1, d3.max(zRows, (r) => r.m.in_degree)]).range([box.inner.left, box.inner.right]);
      const y = d3
        .scaleLinear()
        .domain([d3.min(zRows, (r) => r.m.z), d3.max(zRows, (r) => r.m.z)])
        .nice()
        .range([box.inner.bottom, box.inner.top]);
      axes(box.svg, box.inner, x, y, { xLabel: "Degree", xTicks: 3, yTicks: 3, yFormat: "d" });
      plotPoints(
        box.svg,
        zRows.map((r) => ({ x: r.m.in_degree, y: r.m.z, iso3: r.iso3, title: r.n.name })),
        x, y, "#c9d7e8", 1.9, select,
      );
      if (dk.z !== undefined) highlight(box.svg, x, y, { x: dk.in_degree, y: dk.z }, "Denmark");
    }

    const line = (id, pick, colour, invert, format) => {
      const b = svgFor(id, pad);
      if (!b) return;
      const years = focus.series.map((s) => s.year);
      const x = d3.scaleLinear().domain([years[0], years.at(-1)]).range([b.inner.left, b.inner.right]);
      const extent = d3.extent(focus.series, pick);
      const y = d3
        .scaleLinear()
        .domain(invert ? [d3.max(focus.series, pick), 1] : [0, extent[1]])
        .range([b.inner.bottom, b.inner.top]);
      axes(b.svg, b.inner, x, y, { xTicks: 3, yTicks: 3, yFormat: format });
      b.svg
        .append("path")
        .datum(focus.series)
        .attr("fill", "none")
        .attr("stroke", colour)
        .attr("stroke-width", 2)
        .attr("d", d3.line().x((s) => x(s.year)).y((s) => y(pick(s))).curve(d3.curveMonotoneX));
    };
    line("dk-time", (s) => s.in_strength, colours.PEOPLE, false, "~s");
    line("dk-rank", (s) => s.betweenness_rank, colours.INK, true, "d");

    const b = svgFor("dk-nordic", pad);
    if (b) {
      const bars = [
        ["In-degree", (i) => i.in_degree, colours.PEOPLE],
        ["z-score", (i) => Math.abs(i.z ?? 0), colours.INK],
        ["Flights", (i) => i.flight_degree, colours.ACCESS],
      ];
      const x0 = d3
        .scaleBand()
        .domain(focus.nordics.map((i) => i.iso3))
        .range([b.inner.left, b.inner.right])
        .padding(0.18);
      const x1 = d3.scaleBand().domain(bars.map(([n]) => n)).range([0, x0.bandwidth()]).padding(0.1);
      const y = d3.scaleLinear().domain([0, 1]).range([b.inner.bottom, b.inner.top]);
      axes(b.svg, b.inner, x0, y, { xTicks: 5, yTicks: 3, yFormat: ".0%" });
      for (const [name, pick, colour] of bars) {
        const max = d3.max(focus.nordics, pick) || 1;
        b.svg
          .append("g")
          .selectAll("rect")
          .data(focus.nordics)
          .join("rect")
          .attr("x", (i) => x0(i.iso3) + x1(name))
          .attr("y", (i) => y(pick(i) / max))
          .attr("width", x1.bandwidth())
          .attr("height", (i) => b.inner.bottom - y(pick(i) / max))
          .attr("fill", colour)
          .attr("cursor", "pointer")
          .on("click", (_e, i) => select(i.iso3))
          .append("title")
          .text((i) => `${i.name} · ${name}`);
      }
    }
  }

  // A d3-geo orthographic globe, dragged with d3.drag and rendered as SVG
  // paths. Great-circle arcs come from d3.geoInterpolate, so a corridor bends
  // the way a flight path does rather than the way a quadratic curve does.
  let projection = null;
  function globe() {
    const canvas = $("globe-canvas");
    if (!canvas) return;
    let host = document.getElementById("globe-canvas-d3");
    const width = canvas.clientWidth || 520;
    const height = Math.round(width * 0.86);
    if (!host) {
      host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      host.id = "globe-canvas-d3";
      host.style.display = "block";
      host.style.width = "100%";
      canvas.after(host);
      canvas.style.display = "none";
    }
    const svg = d3.select(host).attr("viewBox", `0 0 ${width} ${height}`).attr("height", height);
    svg.selectAll("*").remove();

    if (!projection) {
      projection = d3
        .geoOrthographic()
        .rotate([-12, -18])
        .translate([width / 2, height / 2])
        .scale(Math.min(width, height) * 0.44);
      svg.call(
        d3.drag().on("drag", (event) => {
          const [lon, lat] = projection.rotate();
          projection.rotate([lon + event.dx * 0.35, lat - event.dy * 0.25]);
          globe();
        }),
      );
    }
    projection.translate([width / 2, height / 2]).scale(Math.min(width, height) * 0.44);
    const path = d3.geoPath(projection);

    svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .attr("fill", "#0d2b4c");
    if (state.world) {
      svg
        .append("g")
        .selectAll("path")
        .data(state.world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", "#245f92")
        .attr("stroke", "rgba(178,215,248,0.6)")
        .attr("stroke-width", 0.6)
        .append("title")
        .text((f) => f.properties.name);
    }

    svg
      .append("path")
      .datum(d3.geoGraticule10())
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "rgba(165,198,230,0.24)");
    const arcColour = colours.PEOPLE;

    const edges = api.topEdges(260);
    const heaviest = edges[0]?.weight ?? 1;
    const arcs = svg.append("g").attr("fill", "none");
    for (const edge of edges) {
      const from = node(state.edges.countries[edge.oi])?.coord;
      const to = node(state.edges.countries[edge.di])?.coord;
      if (!from || !to) continue;
      const share = Math.sqrt(edge.weight / heaviest);
      arcs
        .append("path")
        .attr("d", path({ type: "LineString", coordinates: [[from[1], from[0]], [to[1], to[0]]] }))
        .attr("stroke", arcColour)
        .attr("stroke-opacity", 0.2 + share * 0.6)
        .attr("stroke-width", 0.5 + share * 3)
        .attr("stroke-linecap", "round");
    }

    const dots = svg.append("g");
    for (const iso3 of state.data.countries) {
      const coord = node(iso3)?.coord;
      const m = metrics(iso3);
      if (!coord || !m) continue;
      const point = projection([coord[1], coord[0]]);
      if (!point || d3.geoDistance([coord[1], coord[0]], [-projection.rotate()[0], -projection.rotate()[1]]) > Math.PI / 2)
        continue;
      const chosen = iso3 === state.selected;
      dots
        .append("circle")
        .attr("cx", point[0])
        .attr("cy", point[1])
        .attr("r", chosen ? 5 : 0.7 + Math.sqrt(m.in_degree) * 0.16)
        .attr("fill", chosen ? "#ffffff" : "rgba(200,226,250,0.7)")
        .attr("stroke", chosen ? colours.INK : "none")
        .attr("cursor", "pointer")
        .on("click", () => select(iso3))
        .append("title")
        .text(`${node(iso3).name} · in-degree ${m.in_degree}`);
      if (chosen) {
        dots
          .append("text")
          .attr("x", point[0])
          .attr("y", point[1] - 12)
          .attr("text-anchor", "middle")
          .attr("fill", "#eaf2fb")
          .attr("font-family", FONT)
          .attr("font-size", 12)
          .attr("font-weight", 600)
          .text(node(iso3).name);
      }
    }
  }

  return {
    globe,
    setupGlobe() {
      const hint = document.querySelector(".stage-hint");
      if (hint) hint.textContent = "Drag to spin. Click a country. (SVG)";
    },
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
