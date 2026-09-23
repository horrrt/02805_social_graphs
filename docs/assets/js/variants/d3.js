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
  const { spotlight, earthScale } = api;
  const { showTip, hideTip, modeFlags, format } = api;

  // The axis switch reaches SVG too: log where the mode says log, linear where
  // it does not.
  const scaleFor = (logged, domain, range) =>
    logged
      ? d3.scaleLog().domain(domain).range(range)
      : d3.scaleLinear().domain([0, domain[1]]).nice().range(range);

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

  // A 2px circle is not a target, so each mark carries an invisible disc big
  // enough to hit and the visible one grows under the cursor.
  function plotPoints(svg, rows, x, y, colour, radius, onPick) {
    const g = svg.append("g");
    g.selectAll("circle.mark")
      .data(rows)
      .join("circle")
      .attr("class", "mark")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", radius)
      .attr("fill", colour);
    g.selectAll("circle.hit")
      .data(rows)
      .join("circle")
      .attr("class", "hit")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", Math.max(radius * 4, 8))
      .attr("fill", "transparent")
      .attr("cursor", "pointer")
      .on("click", (_event, d) => onPick(d.iso3))
      .on("pointermove", (event, d) => showTip(event, d.title))
      .on("pointerleave", hideTip);
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
    ["Out-degree", (n, m) => m.out_degree, colours.OUTBOUND],
    ["Flight partners", (n) => n.flight_partners, colours.ACCESS],
  ];

  function hist() {
    const box = svgFor("hist");
    if (!box) return;
    const SERIES = series();
    const all = SERIES.map(([, pick]) => degreeCounts(pick));
    const flat = all.flat();
    const mode = modeFlags("hist");
    const x = scaleFor(mode.x, [1, d3.max(flat, (d) => d.k)], [box.inner.left, box.inner.right]);
    const y = scaleFor(mode.y, [1, d3.max(flat, (d) => d.c)], [box.inner.bottom, box.inner.top]);
    axes(box.svg, box.inner, x, y, { xLabel: "Partners", yLabel: "Countries" });
    all.forEach((rows, i) => {
      box.svg
        .append("g")
        .selectAll("rect")
        .data(rows)
        .join("rect")
        .attr("x", (d) => x(d.k) - 2 + i * 4.5)
        .attr("y", (d) => y(d.c))
        .attr("width", 4)
        .attr("height", (d) => box.inner.bottom - y(d.c))
        .attr("fill", SERIES[i][2])
        .attr("opacity", 0.85);
      box.svg
        .append("g")
        .selectAll("rect")
        .data(rows)
        .join("rect")
        .attr("x", (d) => x(d.k) - 8)
        .attr("y", box.inner.top)
        .attr("width", 16)
        .attr("height", box.inner.bottom - box.inner.top)
        .attr("fill", "transparent")
        .attr("cursor", "pointer")
        .on("click", (_e, d) => select(d.iso3))
        .on("pointermove", (event, d) =>
          showTip(event,
            `<b>${d.k} partners</b><span>${d.c} ${d.c === 1 ? "country" : "countries"}</span>` +
            `<span>largest: ${node(d.iso3).name}</span>`))
        .on("pointerleave", hideTip);
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
    const mode = modeFlags("ccdf");
    const x = scaleFor(mode.x, [1, d3.max(flat, (d) => d.k)], [box.inner.left, box.inner.right]);
    const y = mode.y
      ? d3.scaleLog().domain([d3.min(flat, (d) => d.p), 1]).range([box.inner.bottom, box.inner.top])
      : d3.scaleLinear().domain([0, 1]).range([box.inner.bottom, box.inner.top]);
    axes(box.svg, box.inner, x, y, {
      xLabel: "Partners", yLabel: "P(K ≥ k)", yFormat: mode.y ? ".0e" : ".0%",
    });
    curves.forEach((points, i) =>
      plotPoints(
        box.svg,
        points.map((d) => ({
          x: d.k,
          y: d.p,
          iso3: d.iso3,
          title: `<b>at least ${d.k} partners</b><span>${(d.p * 100).toFixed(1)}% of countries</span><span>e.g. ${node(d.iso3).name}</span>`,
        })),
        x,
        y,
        SERIES[i][2],
        3.5,
        select,
      ),
    );
  }

  function scatterBetween() {
    const box = svgFor("scatter-between", { l: 62, r: 18, t: 14, b: 42 });
    if (!box) return;
    const y3 = String(state.data.null_year);
    const zeroTip = "<span>betweenness 0 · on no shortest path between two other countries</span>";
    const rows = withMetrics(y3).filter((r) => r.m.in_degree > 0);
    const flightRows = state.data.countries
      .map((iso3) => ({ iso3, n: node(iso3) }))
      .filter((r) => r.n.flight_in_degree > 0);
    const migration = rows.map((r) => ({
      x: r.m.in_degree,
      y: r.m.betweenness,
      iso3: r.iso3,
      title: `<b>${r.n.name}</b><span>Migration network</span><span>${r.m.in_degree} origins · #${r.m.in_degree_rank}</span>` +
        (r.m.betweenness > 0 ? `<span>betweenness #${r.m.betweenness_rank}</span>` : zeroTip),
    }));
    const flights = flightRows.map((r) => ({
      x: r.n.flight_in_degree,
      y: r.n.flight_betweenness,
      iso3: r.iso3,
      title: `<b>${r.n.name}</b><span>Flight network</span><span>${r.n.flight_in_degree} flight partners</span>` +
        (r.n.flight_betweenness > 0 ? "" : zeroTip),
    }));
    const all = migration.concat(flights);
    // Half of these countries broker nothing, and a log axis has no room for a
    // zero. They keep their place on a baseline row under a dashed break
    // instead of being filtered out of the chart and out of the claim.
    const positive = all.map((d) => d.y).filter((v) => v > 0);
    const minB = d3.min(positive);
    const zeroRow = minB / 4;
    const x = d3.scaleLog().domain([1, d3.max(all, (d) => d.x)]).range([box.inner.left, box.inner.right]);
    const y = d3
      .scaleLog()
      .domain([minB / 8, d3.max(positive)])
      .range([box.inner.bottom, box.inner.top]);
    const g = axes(box.svg, box.inner, x, y, { xLabel: "In-degree", yLabel: "Betweenness", yFormat: ".0e" });
    // The axis floor is only there to make room for the baseline row, so its
    // tick is dropped: the one label below the break is the 0 written here.
    g.selectAll(".tick")
      .filter((value) => value < minB)
      .selectAll("text")
      .remove();
    box.svg
      .append("line")
      .attr("x1", box.inner.left)
      .attr("x2", box.inner.right)
      .attr("y1", y(minB / 2))
      .attr("y2", y(minB / 2))
      .attr("stroke", "#c2d0e2")
      .attr("stroke-dasharray", "3 4");
    box.svg
      .append("text")
      .attr("x", box.inner.left - 6)
      .attr("y", y(zeroRow))
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#7a8fac")
      .attr("font-size", 10)
      .text("0");
    const onRow = (rowsIn) =>
      rowsIn.map((d) => (d.y > 0 ? d : { ...d, y: zeroRow }));
    plotPoints(box.svg, onRow(flights), x, y, `${colours.ACCESS}99`, 2.2, select);
    plotPoints(box.svg, onRow(migration), x, y, `${colours.PEOPLE}cc`, 2.6, select);
    const chosen = state.selected ? metrics(state.selected, y3) : null;
    if (chosen && chosen.in_degree > 0) {
      highlight(
        box.svg,
        x,
        y,
        { x: chosen.in_degree, y: chosen.betweenness > 0 ? chosen.betweenness : zeroRow },
        node(state.selected).name,
      );
    }
  }

  function scatterZ() {
    const box = svgFor("scatter-z", { l: 58, r: 18, t: 14, b: 42 });
    if (!box) return;
    const y3 = String(state.data.null_year);
    const rows = withMetrics(y3)
      .filter((r) => r.m.z !== undefined && r.m.in_degree > 0)
      .map((r) => ({ x: r.m.in_degree, y: r.m.z, iso3: r.iso3, title: `<b>${r.n.name}</b><span>z = ${r.m.z.toFixed(2)}</span><span>${r.m.in_degree} origins</span>` }));
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
    const focus = spotlight();
    const y3 = String(state.data.null_year);
    const dk = metrics(focus.iso3, y3);
    if (!dk) return;
    const pad = { l: 44, r: 12, t: 12, b: 30 };

    // Each series carries its own tip, so dk-time's two lines (in and out
    // strength) read the same hover card the canvas and echarts renderers show,
    // and a point is a real click target rather than a bare path.
    const line = (id, seriesSpecs, invert, yFormat) => {
      const b = svgFor(id, pad);
      if (!b) return;
      const years = focus.series.map((s) => s.year);
      const x = d3.scaleLinear().domain([years[0], years.at(-1)]).range([b.inner.left, b.inner.right]);
      const maxV = Math.max(...seriesSpecs.flatMap(({ pick }) => focus.series.map(pick)));
      const y = d3
        .scaleLinear()
        .domain(invert ? [maxV, 1] : [0, maxV])
        .range([b.inner.bottom, b.inner.top]);
      axes(b.svg, b.inner, x, y, { xTicks: 3, yTicks: 3, yFormat });
      for (const { pick, colour, tip } of seriesSpecs) {
        b.svg
          .append("path")
          .datum(focus.series)
          .attr("fill", "none")
          .attr("stroke", colour)
          .attr("stroke-width", 2)
          .attr("d", d3.line().x((s) => x(s.year)).y((s) => y(pick(s))).curve(d3.curveMonotoneX));
        plotPoints(
          b.svg,
          focus.series.map((s) => ({ x: s.year, y: pick(s), iso3: focus.iso3, title: tip(s) })),
          x, y, colour, 2.4, select,
        );
      }
    };
    const timeTip = (s) =>
      `<b>${focus.name}, ${s.year}</b>` +
      `<span>${format.fmt.format(s.in_strength)} incoming</span>` +
      `<span>${format.fmt.format(s.out_strength)} outgoing</span>`;
    line("dk-time", [
      { pick: (s) => s.in_strength, colour: colours.PEOPLE, tip: timeTip },
      { pick: (s) => s.out_strength, colour: colours.ACCESS, tip: timeTip },
    ], false, "~s");
    line("dk-rank", [
      {
        pick: (s) => s.betweenness_rank,
        colour: colours.INK,
        tip: (s) =>
          `<b>${focus.name}, ${s.year}</b>` +
          `<span>bridge rank #${s.betweenness_rank}</span>` +
          `<span>${s.in_degree} origins</span>`,
      },
    ], true, "d");

    const b = svgFor("dk-nordic", pad);
    if (b) {
      const bars = [
        ["In-degree", (i) => i.in_degree, colours.PEOPLE],
        ["z-score", (i) => Math.abs(i.z ?? 0), colours.INK],
        ["Flights", (i) => i.flight_partners, colours.ACCESS],
      ];
      const x0 = d3
        .scaleBand()
        .domain(focus.peers.map((i) => i.iso3))
        .range([b.inner.left, b.inner.right])
        .padding(0.18);
      const x1 = d3.scaleBand().domain(bars.map(([n]) => n)).range([0, x0.bandwidth()]).padding(0.1);
      const y = d3.scaleLinear().domain([0, 1]).range([b.inner.bottom, b.inner.top]);
      axes(b.svg, b.inner, x0, y, { xTicks: 5, yTicks: 3, yFormat: ".0%" });
      for (const [name, pick, colour] of bars) {
        const max = d3.max(focus.peers, pick) || 1;
        b.svg
          .append("g")
          .selectAll("rect")
          .data(focus.peers)
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
  // One canvas behind the globe SVG, used only when the photograph is chosen.
  let underlay = null;
  function photoUnderlay(width, height, radius) {
    const svg = document.getElementById("globe-canvas-d3");
    if (!svg) return;
    if (!underlay) {
      underlay = document.createElement("canvas");
      underlay.id = "globe-canvas-d3-photo";
      underlay.style.position = "absolute";
      underlay.style.inset = "0";
      underlay.style.pointerEvents = "none";
      svg.parentElement.style.position = "relative";
      svg.parentElement.insertBefore(underlay, svg);
      svg.style.position = "relative";
    }
    underlay.hidden = state.basemap !== "photo";
    if (underlay.hidden) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    underlay.style.width = `${width}px`;
    underlay.style.height = `${height}px`;
    underlay.width = Math.round(width * ratio);
    underlay.height = Math.round(height * ratio);
    const ctx = underlay.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    api.paintPhotoGlobe(ctx, radius, width / 2, height / 2);
  }

  let projection = null;
  function globe() {
    const canvas = $("globe-canvas");
    if (!canvas) return;
    let host = document.getElementById("globe-canvas-d3");
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || width;
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
        .scale(Math.min(Math.min(width, height) * 0.48, Math.min(width, height) * 0.42 * earthScale()));
      svg.call(
        d3.drag().on("drag", (event) => {
          const [lon, lat] = projection.rotate();
          projection.rotate([lon + event.dx * 0.35, lat - event.dy * 0.25]);
          globe();
        }),
      );
    }
    projection
      .translate([width / 2, height / 2])
      .scale(Math.min(Math.min(width, height) * 0.48, Math.min(width, height) * 0.42 * earthScale()));
    const path = d3.geoPath(projection);

    svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .attr("fill", "#0d2b4c");

    // SVG cannot resample a photograph through an orthographic projection, so
    // a canvas underlay paints it and the vectors sit on top. Same picture as
    // every other renderer, same code doing the sampling.
    photoUnderlay(width, height, projection.scale());
    if (state.basemap === "outline" && state.world) {
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
