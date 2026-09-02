/* Interactive Marvel link graph — 303 nodes, 1784 arcs. d3 v7, SVG. */
(function () {
  const svgEl = document.getElementById("graph");
  if (!svgEl) return;

  const SRC     = svgEl.dataset.src;
  const BLUE    = "#2a78d6", ORANGE = "#eb6834", GREEN = "#1baf7a";
  const readout = document.querySelector(".graph-readout");
  const search  = document.getElementById("graph-search");
  const REST    = '<span class="hint">Hover a character to see who links to them. Drag to rearrange, click to open the article, double-click the canvas to reset.</span>';

  const shade = d3.scaleLinear()
    .domain([0, 8, 30, 106])
    .range(["#c3d8f0", "#6fa3e0", BLUE, "#123a68"])
    .clamp(true);

  let sizeBy = "kin", showIsolates = true, nodes, links, sim, node, link, adj;

  const svg = d3.select(svgEl);
  const root = svg.append("g");
  const gLink = root.append("g").attr("stroke", "#93aac4").attr("fill", "none");
  const gNode = root.append("g").attr("stroke", "#fff").attr("stroke-width", 1);

  // Wheel zoom only with a modifier held, so scrolling the page past the graph
  // is never hijacked. Trackpad pinch sets ctrlKey, so it keeps working.
  const zoom = d3.zoom().scaleExtent([0.35, 6])
    .filter(e => e.type !== "wheel" || e.ctrlKey || e.metaKey)
    .on("zoom", e => root.attr("transform", e.transform));
  svg.call(zoom).on("dblclick.zoom", null)
     .on("dblclick", () => svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity));

  const radius = d => 3.1 + 1.55 * Math.sqrt(d[sizeBy]);
  const fill   = d => d.grp === "island" ? ORANGE : d.grp === "isolate" ? GREEN : shade(d.kin);

  d3.json(SRC).then(data => {
    nodes = data.nodes.map(d => Object.assign({}, d));
    const byId = new Map(nodes.map(d => [d.id, d]));
    links = data.links.map(l => ({ source: byId.get(l.s), target: byId.get(l.t) }));

    adj = new Map(nodes.map(d => [d.id, new Set()]));
    links.forEach(l => { adj.get(l.source.id).add(l.target.id); adj.get(l.target.id).add(l.source.id); });

    link = gLink.selectAll("line").data(links).join("line")
      .attr("stroke-width", 0.55).attr("stroke-opacity", 0.34);

    node = gNode.selectAll("circle").data(nodes).join("circle")
      .attr("r", radius).attr("fill", fill)
      .style("cursor", "pointer")
      .on("pointerenter", (e, d) => focus(d))
      .on("pointerleave", () => { if (!search.value.trim()) clear(); })
      .on("click", (e, d) => window.open(d.url, "_blank", "noopener"));

    node.append("title").text(d => d.name);

    sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(26).strength(0.55))
      .force("charge", d3.forceManyBody().strength(-58).distanceMax(340))
      .force("collide", d3.forceCollide().radius(d => radius(d) + 1.6))
      .force("x", d3.forceX().strength(0.055))
      .force("y", d3.forceY().strength(0.075))
      .on("tick", tick);

    node.call(d3.drag()
      .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end",   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = d.fy = null; }));

    resize();
    clear();
  });

  function tick() {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("cx", d => d.x).attr("cy", d => d.y);
  }

  function visible(d) { return showIsolates || d.grp !== "isolate"; }

  function focus(d) {
    const near = adj.get(d.id);
    node.attr("opacity", n => !visible(n) ? 0 : (n === d || near.has(n.id)) ? 1 : 0.12);
    link.attr("stroke-opacity", l => (l.source === d || l.target === d) ? 0.85 : 0.03)
        .attr("stroke", l => (l.source === d || l.target === d) ? BLUE : "#93aac4")
        .attr("stroke-width", l => (l.source === d || l.target === d) ? 1.1 : 0.55);
    const grp = d.grp === "island" ? "Strikeforce: Morituri island"
              : d.grp === "isolate" ? "isolate, no link either way" : "giant component";
    readout.innerHTML =
      `<b>${d.name}</b> &nbsp;·&nbsp; <b>${d.kin}</b> article${d.kin === 1 ? "" : "s"} link here &nbsp;·&nbsp; ` +
      `links out to <b>${d.kout}</b> &nbsp;·&nbsp; <span class="hint">${grp}</span>`;
  }

  function clear() {
    node.attr("opacity", n => visible(n) ? 1 : 0);
    link.attr("stroke-opacity", 0.34).attr("stroke", "#93aac4").attr("stroke-width", 0.55);
    readout.innerHTML = REST;
  }

  /* --------------------------------------------------------------- search */
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    if (!q) return clear();
    const hits = nodes.filter(n => n.name.toLowerCase().includes(q) && visible(n));
    if (hits.length === 1) return focus(hits[0]);
    const ids = new Set(hits.map(n => n.id));
    node.attr("opacity", n => !visible(n) ? 0 : ids.has(n.id) ? 1 : 0.08);
    link.attr("stroke-opacity", 0.04);
    readout.innerHTML = hits.length
      ? `<b>${hits.length}</b> character${hits.length === 1 ? "" : "s"} matching “${search.value.trim()}”`
      : `<span class="hint">Nothing matches “${search.value.trim()}”.</span>`;
  });

  /* ---------------------------------------------------------------- chips */
  document.querySelectorAll("[data-size]").forEach(btn => {
    btn.addEventListener("click", () => {
      sizeBy = btn.dataset.size;
      document.querySelectorAll("[data-size]").forEach(b =>
        b.setAttribute("aria-pressed", String(b === btn)));
      node.transition().duration(420).attr("r", radius);
      sim.force("collide").radius(d => radius(d) + 1.6);
      sim.alpha(0.35).restart();
    });
  });

  const iso = document.getElementById("toggle-isolates");
  iso.addEventListener("click", () => {
    showIsolates = !showIsolates;
    iso.setAttribute("aria-pressed", String(showIsolates));
    clear();
  });

  /* --------------------------------------------------------------- resize */
  function resize() {
    const w = svgEl.clientWidth, h = svgEl.clientHeight;
    svg.attr("viewBox", [-w / 2, -h / 2, w, h]);
    if (sim) sim.alpha(0.25).restart();
  }
  window.addEventListener("resize", resize);
})();
