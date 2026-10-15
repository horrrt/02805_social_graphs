// ?variant=d3 — everything in SVG, drawn with D3 v7.
//
// Swaps the most: all six data charts become SVG with real axes, and the hero
// globe becomes a d3-geo orthographic projection with glowing arcs. The
// twin map stays on canvas, because 400 arcs as SVG paths is where the frame
// rate goes. What you gain over canvas is selectable text, crisp type at any
// zoom, and axes that D3 maintains instead of the hand-rolled tick code.

import { fs, family } from "../type-scale.mjs";

// Type comes from the scale in type.css, read when a chart is drawn: ticks and
// axis titles are captions, country names are small at 600.
const FONT = () => family("sans");

export function install(api, d3) {
  const {
    state, node, metrics, withMetrics, degreeCounts, ccdf, select, colours, $,
    spotlight, earthScale, showTip, hideTip, modeFlags, format,
  } = api;

  // The axis switch reaches SVG too: log where the mode says log, linear where
  // it does not.
  const scaleFor = (logged, domain, range) =>
    logged
      ? d3.scaleLog().domain(domain).range(range)
      : d3.scaleLinear().domain([0, domain[1]]).nice().range(range);

  // The first draw into a host takes it over from the canvas beside it: the
  // SVG fills the width and the canvas goes. The chart's island renders both.
  function takeOver(canvas, host) {
    if (host.style.display === "block") return;
    host.style.display = "block";
    host.style.width = "100%";
    canvas.style.display = "none";
  }

  // One SVG per canvas, sized from the canvas it replaces so the layout does
  // not move when you switch variants. The island renders it after the canvas.
  function svgFor(id, pad = { l: 52, r: 16, t: 14, b: 38 }) {
    const canvas = $(id);
    const host = $(`${id}-d3`);
    if (!canvas || !host) return null;
    // Once the canvas is hidden it measures 0 wide, and a fixed fallback width
    // scaled the SVG, and its text, down to fit. Measure the box it fills.
    const width = Math.round(
      (host.style.display === "block" && host.getBoundingClientRect().width) ||
        canvas.clientWidth ||
        canvas.parentElement?.clientWidth ||
        600,
    );
    const height = Math.round(width * (canvas.height / canvas.width));
    takeOver(canvas, host);
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
    const style = (s) => {
      s.selectAll(".tick line").attr("stroke", "#eaf0f7");
      s.select(".domain").attr("stroke", "#c6d4e6");
      s.selectAll("text").attr("fill", "#7a8fac").attr("font-family", FONT()).attr("font-size", fs("caption"));
    };
    const g = svg.append("g");
    g.append("g")
      .attr("transform", `translate(0,${box.bottom})`)
      .call(d3.axisBottom(x).ticks(xTicks, "~s").tickSize(-(box.bottom - box.top)))
      .call(style);
    g.append("g")
      .attr("transform", `translate(${box.left},0)`)
      .call(d3.axisLeft(y).ticks(yTicks, yFormat ?? "~s").tickSize(-(box.right - box.left)))
      .call(style);
    const label = (text, tx, ty, rotate) =>
      g
        .append("text")
        .attr("transform", `translate(${tx},${ty})${rotate ? " rotate(-90)" : ""}`)
        .attr("fill", "#7a8fac")
        .attr("font-family", FONT())
        .attr("font-size", fs("caption"))
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
    const label = g
      .append("text")
      .attr("x", x(point.x) + 9)
      .attr("y", y(point.y) + 3)
      .attr("fill", colours.INK)
      .attr("font-family", FONT())
      .attr("font-size", fs("small"))
      .attr("font-weight", 600)
      .text(name);
    // A point at the right edge takes its name on the left, inside the plot.
    if (x(point.x) + 9 + label.node().getComputedTextLength() > x.range()[1]) {
      label.attr("x", x(point.x) - 9).attr("text-anchor", "end");
    }
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
      .attr("font-family", FONT())
      .attr("font-size", fs("caption"))
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

  // The hero's globe, a d3-geo orthographic projection dragged with d3.drag
  // and rendered as SVG paths over a canvas underlay that carries the
  // photograph when one is chosen. A corridor is a glowing great circle
  // lifted off the sphere, so it reads as a route rather than a straight
  // spoke, and is cut where it passes over the edge of the globe.

  // ---- the photograph, in two strengths ------------------------------------
  // The day image as it is, and the same image darkened for the night look:
  // oceans go nearly black and land keeps its colour at half strength, so the
  // corridors carry the light. Each is decoded once into pixels the globe
  // samples.
  const textures = {};
  function texture(kind) {
    if (textures[kind]) return textures[kind];
    const image = api.earthTexture(() => globe());
    if (!image) return null;
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (kind === "night") {
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const grey = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
        for (let k = 0; k < 3; k += 1) {
          // A quarter of the colour goes grey, then a gamma above one pushes
          // the dark blue of the sea toward black faster than the land.
          const v = (px[i + k] * 0.78 + grey * 0.22) / 255;
          px[i + k] = Math.round(255 * 0.66 * v ** 1.4);
        }
      }
      ctx.putImageData(data, 0, 0);
    }
    textures[kind] = { pixels: data.data, width: canvas.width, height: canvas.height };
    return textures[kind];
  }

  // The globe's photograph, sampled through the projection itself, so land and
  // corridors turn together at any tilt. Sampled coarser while dragging, then
  // redrawn sharp when the drag ends.
  const sphere = { key: "", canvas: null };
  function photoSphere(tex) {
    const radius = projection.scale();
    const [cx, cy] = projection.translate();
    const step = dragging ? 2.4 : 1.25;
    const size = Math.ceil((radius * 2) / step);
    const key = `${tex.width}:${size}:${projection.rotate().map((v) => v.toFixed(2)).join(",")}:${cx}:${cy}`;
    if (sphere.key === key) return sphere.canvas;
    const off = sphere.canvas ?? document.createElement("canvas");
    off.width = size;
    off.height = size;
    const octx = off.getContext("2d");
    const out = octx.createImageData(size, size);
    const { pixels, width: tw, height: th } = tex;
    for (let y = 0; y < size; y += 1) {
      const py = cy - radius + (y + 0.5) * step;
      const dy = (py - cy) / radius;
      for (let x = 0; x < size; x += 1) {
        const px = cx - radius + (x + 0.5) * step;
        const dx = (px - cx) / radius;
        if (dx * dx + dy * dy > 1) continue;
        const at = projection.invert([px, py]);
        if (!at || Number.isNaN(at[0])) continue;
        const sx = Math.min(tw - 1, Math.floor((((at[0] + 180) % 360 + 360) % 360) / 360 * tw));
        const sy = Math.min(th - 1, Math.max(0, Math.floor(((90 - at[1]) / 180) * th)));
        const from = (sy * tw + sx) * 4;
        const to = (y * size + x) * 4;
        out.data[to] = pixels[from];
        out.data[to + 1] = pixels[from + 1];
        out.data[to + 2] = pixels[from + 2];
        out.data[to + 3] = 255;
      }
    }
    octx.putImageData(out, 0, 0);
    sphere.canvas = off;
    sphere.key = key;
    return off;
  }

  // One canvas behind the SVG, used only when a photograph is chosen.
  let underlay = null;
  function paintUnderlay(width, height) {
    const svg = $("globe-canvas-d3");
    if (!svg) return;
    // The hero island renders the underlay before the globe's SVG.
    if (!underlay || !underlay.isConnected) {
      underlay = $("globe-canvas-d3-photo");
      if (!underlay) return;
      underlay.style.position = "absolute";
      underlay.style.inset = "0";
      underlay.style.pointerEvents = "none";
      svg.parentElement.style.position = "relative";
      svg.style.position = "relative";
    }
    const kind = state.basemap === "night" ? "night" : state.basemap === "photo" ? "photo" : null;
    underlay.hidden = !kind;
    if (!kind) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    underlay.style.width = `${width}px`;
    underlay.style.height = `${height}px`;
    underlay.width = Math.round(width * ratio);
    underlay.height = Math.round(height * ratio);
    const ctx = underlay.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const sea = kind === "night" ? "#02060c" : "#0d2b4c";
    ctx.fillStyle = sea;
    ctx.beginPath();
    ctx.arc(projection.translate()[0], projection.translate()[1], projection.scale(), 0, Math.PI * 2);
    ctx.fill();
    const tex = texture(kind);
    if (!tex) return;
    ctx.imageSmoothingQuality = "high";
    const radius = projection.scale();
    const [cx, cy] = projection.translate();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(photoSphere(tex), cx - radius, cy - radius, radius * 2, radius * 2);
    // The limb darkens as a lit sphere does, so the globe reads as round.
    const limb = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius);
    limb.addColorStop(0, "rgba(0,0,0,0)");
    limb.addColorStop(1, kind === "night" ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.3)");
    ctx.fillStyle = limb;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  // ---- the projection -----------------------------------------------------
  let projection = null;
  let dragging = false;
  let pressed = null;
  let faced = null;
  const START_ROTATE = [-12, -18];
  // A press that moves less than this is a click, not a drag: a hand is never
  // perfectly still, and a spin under a click would lose the country.
  const CLICK_SLOP = 4;

  function onDrag(event) {
    if (!dragging && Math.hypot(event.x - pressed[0], event.y - pressed[1]) < CLICK_SLOP) return;
    dragging = true;
    const [lon, lat] = projection.rotate();
    projection.rotate([lon + event.dx * 0.35, lat - event.dy * 0.25]);
    globe();
  }

  // A click anywhere inside a country selects it: the point is turned back
  // into a longitude and latitude and tested against every outline, so the
  // arcs, dots and labels drawn over a country never get in the way.
  function onClick(event) {
    if (!state.world || !projection) return;
    const [x, y] = d3.pointer(event);
    const [cx, cy] = projection.translate();
    if (Math.hypot(x - cx, y - cy) > projection.scale()) return;
    const at = projection.invert([x, y]);
    if (!at) return;
    // The twin map's planar test, not d3.geoContains: some outlines are wound
    // the wrong way for the sphere (Russia's among them), and geoContains then
    // reads them as the whole world except that country.
    const hit = api.countryAt(at[0], at[1]);
    if (hit) select(hit);
  }

  // ---- the corridors ------------------------------------------------------
  // One hue that glows: a dim green for a small corridor, a bright mint for a
  // large one, as in the satellite maps this look is drawn after.
  const GLOW_LOW = [62, 160, 98];
  const GLOW_HIGH = [150, 255, 172];
  const glowTint = (rank) =>
    GLOW_LOW.map((c, i) => Math.round(c + (GLOW_HIGH[i] - c) * rank)).join(",");

  // A corridor as a great circle lifted off the sphere, highest in the
  // middle and higher for a longer corridor, projected in 3D. The part that
  // swings round the back of the globe is dropped; the clip on the arcs'
  // groups cuts the rest at the globe's edge, so a corridor to the far side
  // runs to the rim instead of vanishing.
  const RAD = Math.PI / 180;
  function lifted(a, b) {
    const rotate = d3.geoRotation(projection.rotate());
    const along = d3.geoInterpolate(a, b);
    const reach = d3.geoDistance(a, b);
    const height = Math.min(0.32, reach * 0.14);
    const radius = projection.scale();
    const [cx, cy] = projection.translate();
    // Coarser while dragging: 500 corridors are resampled on every frame.
    const steps = Math.max(6, Math.ceil(reach * (dragging ? 8 : 18)));
    const screen = (p) => `${(cx + radius * p.x).toFixed(1)},${(cy - radius * p.y).toFixed(1)}`;
    const cut = (p, q) => {
      const f = p.z / (p.z - q.z);
      return { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, z: 0 };
    };
    let d = "";
    let prev = null;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const [lon, lat] = rotate(along(t));
      const k = 1 + height * Math.sin(Math.PI * t);
      const p = {
        x: k * Math.cos(lat * RAD) * Math.sin(lon * RAD),
        y: k * Math.sin(lat * RAD),
        z: k * Math.cos(lat * RAD) * Math.cos(lon * RAD),
      };
      const shown = p.z >= 0;
      const was = prev && prev.z >= 0;
      if (shown && !was) d += `M${screen(prev ? cut(prev, p) : p)}L${screen(p)}`;
      else if (shown) d += `L${screen(p)}`;
      else if (was) d += `L${screen(cut(prev, p))}`;
      prev = p;
    }
    return d;
  }

  function globe() {
    const canvas = $("globe-canvas");
    const host = $("globe-canvas-d3");
    if (!canvas || !host) return;
    const nightLook = state.basemap === "night";
    // Measured on the stage, not the canvas: once the SVG has taken over, the
    // hidden canvas measures zero and a redraw (a drag) would shrink the globe.
    // The stage is square, so its width is the size; its height would
    // include the SVG's own and grow on every redraw.
    const stage = host.parentElement;
    const width = stage?.clientWidth || canvas.clientWidth || 720;
    const height = width;
    takeOver(canvas, host);
    const svg = d3.select(host).attr("viewBox", `0 0 ${width} ${height}`).attr("height", height).style("display", "block");
    svg.selectAll("*").remove();

    if (!projection) {
      projection = d3.geoOrthographic().rotate(START_ROTATE);
      svg.on("click", onClick).call(
        d3
          .drag()
          .clickDistance(CLICK_SLOP)
          .on("start", (event) => {
            pressed = [event.x, event.y];
          })
          .on("drag", onDrag)
          .on("end", () => {
            // Only a real drag redraws, sharp again. A plain click must find
            // the country it pressed still in the SVG when the click lands.
            if (!dragging) return;
            dragging = false;
            globe();
          }),
      );
    }

    // The globe turns to a reader's pick once; a drag after that is theirs.
    const pickedCoord = state.picked && state.selected ? node(state.selected)?.coord : null;
    if (pickedCoord && faced !== state.selected) projection.rotate([-pickedCoord[1], -pickedCoord[0] * 0.8]);
    faced = state.picked ? state.selected : null;
    projection.translate([width / 2, height / 2]).scale(Math.min(width * 0.48, width * 0.42 * earthScale()));
    const path = d3.geoPath(projection);

    const defs = svg.append("defs");
    const glow = defs
      .append("filter")
      .attr("id", "globe-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", 3);

    // The ground under everything: the sea, or space round the globe.
    // Under a photograph the SVG stays clear: the underlay behind it paints
    // its own ground, and an SVG fill here would cover it.
    const photo = state.basemap === "night" || state.basemap === "photo";
    const ground = photo ? "none" : "#0d2b4c";
    if (nightLook) {
      // A thin atmosphere round the limb.
      svg
        .append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", projection.scale() + 2)
        .attr("fill", "none")
        .attr("stroke", "rgba(120,190,255,0.35)")
        .attr("stroke-width", 6)
        .attr("filter", "url(#globe-glow)");
    }
    svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .attr("fill", ground);

    // SVG cannot resample a photograph through a projection, so a canvas
    // underlay paints it and the vectors sit on top.
    paintUnderlay(width, height);

    // Countries as the canvas globe draws them: the selection filled and
    // outlined in white. Under the night look they are only faint borders.
    // Clicks are hit-tested on the whole SVG (onClick), not per path.
    if ((state.basemap === "outline" || nightLook) && state.world) {
      svg
        .append("g")
        .selectAll("path")
        .data(state.world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (f) => (nightLook ? "transparent" : api.landFill(f.properties.iso3, "#245f92")))
        .attr("stroke", (f) => {
          const chosen = f.properties.iso3 === state.selected;
          if (nightLook) return chosen && state.picked ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.07)";
          return chosen ? "#ffffff" : "rgba(178,215,248,0.55)";
        })
        .attr("stroke-width", 0.6)
        .attr("cursor", (f) => (metrics(f.properties.iso3) ? "pointer" : null))
        .append("title")
        .text((f) => f.properties.name);
    }


    // Migration arcs: the same 500 corridors, sized by a log rank, faded or
    // hidden outside the selection, and every link-style choice honoured.
    const centre = [-projection.rotate()[0], -projection.rotate()[1]];
    const facing = (coord) => d3.geoDistance([coord[1], coord[0]], centre) <= Math.PI / 2;
    const place = (coord) => projection([coord[1], coord[0]]);
    const edges = api.topEdges(500);
    const heaviest = edges[0]?.weight ?? 1;
    const lightest = api.scaleFloor(edges, 500);
    const link = api.linkSpec();
    const scale = api.THICKNESS[state.thickness] ?? 1;
    defs
      .append("clipPath")
      .attr("id", "globe-disc")
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale());
    const halo = svg
      .append("g")
      .attr("clip-path", "url(#globe-disc)")
      .append("g")
      .attr("fill", "none")
      .attr("pointer-events", "none")
      .attr("filter", "url(#globe-glow)");
    const arcs = svg.append("g").attr("fill", "none").attr("pointer-events", "none").attr("clip-path", "url(#globe-disc)");
    const ends = [];
    for (const edge of edges) {
      const fromIso = state.edges.countries[edge.oi];
      const toIso = state.edges.countries[edge.di];
      const from = node(fromIso)?.coord;
      const to = node(toIso)?.coord;
      if (!from || !to) continue;
      const alpha = api.linkAlpha(edge);
      if (alpha === 0) continue;
      const share = Math.sqrt(edge.weight / heaviest);
      const rank = api.logShare(edge.weight, lightest, heaviest);
      // A picked country keeps its corridors lit; the rest are not drawn.
      if (!api.globeFocused(edge)) continue;
      const d = lifted([from[1], from[0]], [to[1], to[0]]);
      if (!d) continue;
      // The lit partner dot goes at the end away from the selection, when
      // that end is on the near side.
      const far = toIso === state.selected ? from : to;
      const end = facing(far) ? place(far) : null;
      // A picked country's own corridors draw brighter and wider than the
      // unpicked network.
      const lit = state.picked ? 0.35 : 0;
      const tint = link.ramp ? api.rampColour(share) : glowTint(Math.min(1, rank + lit));
      const wide = (link.width ? 0.8 + rank * rank * 4.6 : 1.8) * scale * (1 + lit * 1.6);
      const strength = Math.min(1, (0.45 + lit + rank * 0.55) * alpha);
      halo
        .append("path")
        .attr("d", d)
        .attr("stroke", `rgb(${tint})`)
        .attr("stroke-opacity", strength * 0.7)
        .attr("stroke-width", wide * 2.6 + 1)
        .attr("stroke-linecap", "round");
      arcs
        .append("path")
        .attr("d", d)
        .attr("stroke", `rgb(${tint})`)
        .attr("stroke-opacity", strength)
        .attr("stroke-width", wide)
        .attr("stroke-linecap", "round");
      if (state.picked && end) ends.push({ end, tint, rank });
    }

    // A picked country's partners light up where its corridors land, larger
    // for a larger corridor.
    for (const { end, tint, rank } of ends) {
      const r = (1.2 + rank * 2.4) * Math.sqrt(scale);
      halo.append("circle").attr("cx", end[0]).attr("cy", end[1]).attr("r", r * 2).attr("fill", `rgb(${tint})`).attr("fill-opacity", 0.6);
      arcs.append("circle").attr("cx", end[0]).attr("cy", end[1]).attr("r", r).attr("fill", `rgb(${tint})`);
    }

    // Country dots only when the style asks for them, as on the canvas.
    const dots = svg.append("g");
    if (state.dots !== "off") {
      for (const iso3 of state.data.countries) {
        const coord = node(iso3)?.coord;
        const m = metrics(iso3);
        if (!coord || !m || !facing(coord)) continue;
        const point = place(coord);
        dots
          .append("circle")
          .attr("cx", point[0])
          .attr("cy", point[1])
          .attr("r", 0.6 + Math.sqrt(m.in_degree) * 0.14)
          .attr("fill", "rgba(196,222,248,0.62)")
          .attr("cursor", "pointer")
          .on("click", (event) => {
            // The dot wins over the country under it.
            event.stopPropagation();
            select(iso3);
          })
          .append("title")
          .text(`${node(iso3).name} · in-degree ${m.in_degree}`);
      }
    }

    const chosen = state.selected && node(state.selected)?.coord;
    if (!chosen || !facing(chosen)) return;
    const [x, y] = place(chosen);
    const mark = svg.append("g").attr("pointer-events", "none");
    if (nightLook) {
      // The selection as a lit point with its name beside it, white on the
      // dark ground with a shadow to lift it off the arcs.
      mark.append("circle").attr("cx", x).attr("cy", y).attr("r", 10).attr("fill", "#ffffff").attr("fill-opacity", 0.5).attr("filter", "url(#globe-glow)");
      mark.append("circle").attr("cx", x).attr("cy", y).attr("r", 4.5).attr("fill", "#ffffff");
      const label = mark
        .append("text")
        .attr("x", x + 12)
        .attr("y", y)
        .attr("dominant-baseline", "middle")
        .attr("fill", "#ffffff")
        .attr("stroke", "rgba(0,0,0,0.6)")
        .attr("stroke-width", 3)
        .attr("paint-order", "stroke")
        .attr("font-family", FONT())
        .attr("font-size", fs("body"))
        .attr("font-weight", 600)
        .text(node(state.selected).name);
      // A selection near the right edge takes its name on the left.
      if (x + 12 + label.node().getComputedTextLength() > width - 8) {
        label.attr("x", x - 12).attr("text-anchor", "end");
      }
      return;
    }
    // The selection: a white ring and its name on a white label, as on the canvas.
    mark.append("circle").attr("cx", x).attr("cy", y).attr("r", 6).attr("fill", "none").attr("stroke", "#ffffff").attr("stroke-width", 1.5);
    const label = mark
      .append("text")
      .attr("x", x)
      .attr("y", y - 20)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", colours.INK)
      .attr("font-family", FONT())
      .attr("font-size", fs("small"))
      .attr("font-weight", 600)
      .text(node(state.selected).name);
    const box = label.node().getBBox();
    mark
      .insert("rect", "text")
      .attr("x", box.x - 8)
      .attr("y", y - 30)
      .attr("width", box.width + 16)
      .attr("height", 20)
      .attr("fill", "rgba(255,255,255,0.94)");
  }

  return {
    globe,
    // The globe's reset button turns it back to where it opened.
    resetView: () => {
      projection?.rotate(START_ROTATE);
      faced = null;
    },
    hint: "Drag to spin. Click a country. (SVG)",
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
