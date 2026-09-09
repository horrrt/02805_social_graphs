/* The story runs entirely on local assets. Every displayed edge is in the snapshot. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const NS = "http://www.w3.org/2000/svg";
  const colors = { giant: "#e7fa52", island: "#c0b0f2", isolate: "#f4f5ef" };
  const names = { all: "All 303 characters", giant: "The main crowd · 277 characters", island: "The separate island · 9 characters", isolate: "Alone · 17 characters" };
  const cleanName = node => node.name.replace(/ \((?:character|characters|Marvel Comics|comics|Morituri)\)/g, "");
  const svgElement = (tag, attributes = {}, text) => {
    const element = document.createElementNS(NS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const textElement = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const pressed = (selector, key, value) => $$(selector).forEach(button => button.setAttribute("aria-pressed", String(button.dataset[key] === value)));
  let nodes, links, byId, incoming, outgoing;
  let selected = null, group = "all", direction = "in", zoom = 1;
  let mainMap;
  const radius = node => node.grp === "isolate" ? 4 : 3.2 + Math.sqrt(node.kin) * 0.82;

  // These work independently of the data request.
  const progress = $(".read-progress");
  if (progress) {
    const updateProgress = () => {
      const available = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = (available > 0 ? Math.min(100, scrollY / available * 100) : 100) + "%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    document.addEventListener("toggle", updateProgress, true);
    updateProgress();
  }
  $("#share-story")?.addEventListener("click", async () => {
    const url = new URL(location.href);
    url.search = "";
    url.hash = "takeaway";
    const status = $("#share-status");
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = "Copied. Pass the story on.";
    } catch {
      status.replaceChildren(document.createTextNode("Copy this link: "));
      const link = textElement("a", url.href);
      link.href = url.href;
      status.append(link);
    }
  });

  function drawNetwork(svg, isCover) {
    const layer = svgElement("g");
    const edges = svgElement("g");
    const highlights = svgElement("g");
    const dots = svgElement("g");
    const labels = svgElement("g");
    const labelNodes = new Map();
    const edgeNodes = [];
    const dotNodes = new Map();
    const seen = new Set();
    for (const link of links) {
      const key = [link.s, link.t].sort().join("\0");
      if (seen.has(key)) continue;
      seen.add(key);
      const a = byId.get(link.s), b = byId.get(link.t);
      const line = svgElement("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: colors[a.grp], "stroke-width": 0.7, "stroke-opacity": isCover ? 0.17 : 0.13 });
      edges.append(line);
      edgeNodes.push({ line, a, b });
    }
    for (const node of nodes) {
      const dot = svgElement("g", { class: "graph-node", "data-node": node.id });
      dot.append(svgElement("circle", { cx: node.x, cy: node.y, r: 13, fill: "transparent", "pointer-events": "all" }));
      dot.append(svgElement("circle", { class: "node-dot", cx: node.x, cy: node.y, r: radius(node), fill: node.grp === "isolate" ? "#141614" : colors[node.grp], stroke: colors[node.grp], "stroke-width": node.grp === "isolate" ? 1.3 : 0.4 }));
      dot.append(svgElement("title", {}, cleanName(node) + ": " + node.kin + " incoming, " + node.kout + " outgoing links"));
      dot.addEventListener("click", () => {
        if (isCover) {
          location.href = "weeks/week01/?character=" + encodeURIComponent(node.id) + "#explore";
        } else {
          selectCharacter(node.id, true);
        }
      });
      dots.append(dot);
      dotNodes.set(node.id, dot);
      const label = svgElement("text", { x: node.x + radius(node) + 7, y: node.y + 4, class: "graph-label", visibility: "hidden" }, cleanName(node));
      labels.append(label);
      labelNodes.set(node.id, label);
    }
    layer.append(edges, highlights, dots, labels);
    svg.append(layer);
    if (isCover) {
      for (const id of ["Spider-Man", "Hulk"]) labelNodes.get(id)?.setAttribute("visibility", "visible");
      svg.append(svgElement("text", { x: 717, y: 98, class: "graph-group-label" }, "THE ISLAND / 9"));
      svg.append(svgElement("text", { x: 712, y: 378, class: "graph-group-label" }, "ALONE / 17"));
    }
    svg.dataset.ready = "true";
    return { svg, edges: edgeNodes, highlights, dots: dotNodes, labels: labelNodes };
  }

  function setView() {
    const visible = nodes.filter(node => group === "all" || node.grp === group);
    let box = [0, 0, 940, 650];
    if (group !== "all") {
      const xs = visible.map(node => node.x), ys = visible.map(node => node.y);
      const pad = group === "giant" ? 55 : 35;
      box = [Math.min(...xs) - pad, Math.min(...ys) - pad,
        Math.max(...xs) - Math.min(...xs) + 2 * pad, Math.max(...ys) - Math.min(...ys) + 2 * pad];
    }
    const width = box[2] / zoom, height = box[3] / zoom;
    const focus = zoom > 1 && selected ? byId.get(selected) : null;
    const centerX = focus ? Math.max(box[0] + width / 2, Math.min(box[0] + box[2] - width / 2, focus.x)) : box[0] + box[2] / 2;
    const centerY = focus ? Math.max(box[1] + height / 2, Math.min(box[1] + box[3] - height / 2, focus.y)) : box[1] + box[3] / 2;
    mainMap.svg.setAttribute("viewBox", [centerX - width / 2, centerY - height / 2, width, height].join(" "));
    $("#zoom-in").disabled = zoom >= 3;
    $("#zoom-out").disabled = zoom <= 1;
  }

  function updateMap() {
    const chosen = selected && byId.get(selected);
    const neighbors = chosen ? (direction === "in" ? incoming : outgoing).get(chosen.id) : new Set();
    for (const { line, a, b } of mainMap.edges) {
      line.style.display = group === "all" || a.grp === group ? "" : "none";
      line.setAttribute("stroke-opacity", chosen ? 0.07 : 0.16);
    }
    for (const node of nodes) {
      const visible = group === "all" || node.grp === group;
      const relevant = !chosen || node.id === selected || neighbors.has(node.id);
      const dot = mainMap.dots.get(node.id);
      dot.style.display = visible ? "" : "none";
      dot.setAttribute("opacity", relevant ? 1 : 0.3);
      const label = mainMap.labels.get(node.id);
      label.setAttribute("visibility", visible && (node.id === selected || group === "island") ? "visible" : "hidden");
      label.style.fontSize = group === "island" || group === "isolate" ? "6px" : "12px";
      label.style.strokeWidth = group === "island" || group === "isolate" ? "2px" : "5px";
    }
    mainMap.highlights.replaceChildren();
    if (chosen) {
      const color = direction === "in" ? colors.giant : colors.island;
      const defs = svgElement("defs");
      const marker = svgElement("marker", { id: "selected-arrow", viewBox: "0 0 6 6", refX: 5, refY: 3, markerWidth: 5, markerHeight: 5, orient: "auto" });
      marker.append(svgElement("path", { d: "M0,0 L6,3 L0,6 z", fill: color }));
      defs.append(marker);
      mainMap.highlights.append(defs);
      for (const id of neighbors) {
        const other = byId.get(id);
        const a = direction === "in" ? other : chosen, b = direction === "in" ? chosen : other;
        const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const dx = (b.x - a.x) / distance, dy = (b.y - a.y) / distance;
        mainMap.highlights.append(svgElement("line", {
          x1: a.x + dx * (radius(a) + 1), y1: a.y + dy * (radius(a) + 1),
          x2: b.x - dx * (radius(b) + 2), y2: b.y - dy * (radius(b) + 2),
          stroke: color, "stroke-width": group === "island" ? 0.9 : 1.3, "stroke-opacity": 0.75, "marker-end": "url(#selected-arrow)"
        }));
      }
      mainMap.highlights.append(svgElement("circle", { cx: chosen.x, cy: chosen.y, r: radius(chosen) + 5, fill: "none", stroke: colors[chosen.grp], "stroke-width": 1.5 }));
    }
    $("#map-caption").textContent = names[group] + " · " + (chosen ? cleanName(chosen) + " selected." : "Click a dot or search a name.");
    $("#direction-legend").textContent = chosen ? (neighbors.size ? "Highlighted arrows point " + (direction === "in" ? "toward " : "away from ") + cleanName(chosen) + "." : "No " + (direction === "in" ? "incoming" : "outgoing") + " links for " + cleanName(chosen) + ".") : "Choose a character to reveal link direction.";
    setView();
  }

  function updateNeighbors() {
    const node = byId.get(selected);
    const adjacent = [...(direction === "in" ? incoming : outgoing).get(selected)].map(id => byId.get(id)).sort((a, b) => cleanName(a).localeCompare(cleanName(b)));
    const list = $("#neighbor-list");
    list.replaceChildren();
    $("#neighbor-count").textContent = adjacent.length + (direction === "in" ? " articles link here." : " articles linked from here.") + (adjacent.length ? " Select one to follow it." : "");
    if (!adjacent.length) {
      list.append(textElement("li", node.grp === "isolate" ? "No links in either direction within this roster." : "No links in this direction within the roster.", "empty-neighbors"));
    }
    for (const neighbor of adjacent) {
      const item = document.createElement("li");
      const button = textElement("button", cleanName(neighbor) + " ↗");
      button.type = "button";
      button.addEventListener("click", () => {
        selectCharacter(neighbor.id, true);
        $("#character-search").focus({ preventScroll: true });
      });
      item.append(button);
      list.append(item);
    }
    list.scrollTop = 0;
  }

  function selectCharacter(id, remember = false) {
    if (!byId.has(id)) return;
    selected = id;
    const node = byId.get(id);
    if (group !== "all" && node.grp !== group) {
      group = node.grp;
      zoom = 1;
      pressed("[data-group]", "group", group);
    }
    $(".character-group").textContent = node.grp === "giant" ? "IN THE MAIN CROWD" : node.grp === "island" ? "STRIKEFORCE: MORITURI · THE ISLAND" : "ON THE ROSTER. OUTSIDE THE CONVERSATION.";
    $("#character-name").textContent = cleanName(node);
    $("#character-in").textContent = node.kin;
    $("#character-out").textContent = node.kout;
    $("#character-wiki").href = node.url;
    $("#character-context").textContent = node.grp === "isolate" ? "No incoming or outgoing links to any of the other 302 articles in this snapshot."
      : node.grp === "island" ? "Part of a nine-character island. None of its links reaches the main crowd."
      : id === "Spider-Man" ? "More incoming links than any other character in this snapshot."
      : id === "Betsy_Braddock" ? "More outgoing links than any other character. Her article links widely; fewer articles link back."
      : "Part of the 277-character main component when link direction is ignored.";
    $("#search-results").hidden = true;
    $("#character-search").value = "";
    $("#search-status").textContent = "";
    updateNeighbors();
    updateMap();
    if (remember) {
      const url = new URL(location.href);
      url.searchParams.set("character", id);
      history.replaceState(null, "", url);
    }
  }

  function changeGroup(value) {
    group = value;
    zoom = 1;
    pressed("[data-group]", "group", group);
    const current = selected && byId.get(selected);
    const initial = { giant: "Spider-Man", island: "Radian_(Morituri)", isolate: "Baymax", all: "Spider-Man" };
    selectCharacter(current && (group === "all" || current.grp === group) ? current.id : initial[group], true);
  }

  function ranking(mode, announce = true) {
    const ranked = [...nodes].sort((a, b) => b[mode] - a[mode] || a.id.localeCompare(b.id)).slice(0, 6);
    const list = $("#ranking-list");
    list.dataset.mode = mode;
    list.replaceChildren();
    for (const node of ranked) {
      const row = document.createElement("li");
      const mark = document.createElement("i");
      mark.style.setProperty("--bar", node[mode] / 106 * 100 + "%");
      mark.setAttribute("aria-hidden", "true");
      row.append(textElement("span", cleanName(node)), mark, textElement("b", String(node[mode])));
      list.append(row);
    }
    pressed("[data-ranking]", "ranking", mode);
    $("#ranking-title").textContent = mode === "kin" ? "WHO GETS THE ATTENTION?" : "WHO DOES THE LINKING?";
    $("#ranking-description").textContent = "The six articles with the most " + (mode === "kin" ? "incoming" : "outgoing") + " links " + (mode === "kin" ? "from" : "to") + " this roster.";
    $("#ranking-caption").textContent = (mode === "kin" ? "Incoming" : "Outgoing") + " links within the 303-article roster. Bars start at zero; both views use the same 0–106 scale.";
    if (announce) $("#ranking-status").textContent = (mode === "kin" ? "Incoming" : "Outgoing") + " ranking: " + ranked.map(node => cleanName(node) + ", " + node[mode]).join("; ") + ".";
  }

  function predict(id) {
    const winner = [...nodes].sort((a, b) => b.kout - a.kout)[0];
    pressed("[data-guess]", "guess", id);
    $$("[data-guess]").forEach(button => button.classList.toggle("correct", button.dataset.guess === winner.id));
    const selectedNode = byId.get(id);
    $("#prediction-feedback").textContent = id === winner.id
      ? "You called it. Betsy Braddock leads with 28 outgoing links. Only 7 articles link back to her."
      : id ? cleanName(selectedNode) + " has " + selectedNode.kout + " outgoing links. The surprise leader is Betsy Braddock, with 28—and just 7 incoming links."
      : "Betsy Braddock leads with 28 outgoing links. Only 7 articles link back to her. Being mentioned and doing the mentioning give us different winners.";
    $("#skip-prediction").textContent = "Show the answer again ↺";
    ranking("kout");
  }

  function drawIsland() {
    const svg = $("#island-graph");
    const island = nodes.filter(node => node.grp === "island");
    const positions = new Map(island.map((node, index) => {
      const angle = index * Math.PI * 2 / island.length - Math.PI / 2;
      return [node.id, { x: 300 + 160 * Math.cos(angle), y: 252 + 170 * Math.sin(angle), angle }];
    }));
    const defs = svgElement("defs");
    const marker = svgElement("marker", { id: "island-arrow", viewBox: "0 0 6 6", refX: 5, refY: 3, markerWidth: 5, markerHeight: 5, orient: "auto" });
    marker.append(svgElement("path", { d: "M0,0 L6,3 L0,6 z", fill: "#51416e" }));
    defs.append(marker);
    svg.append(defs);
    for (const edge of links.filter(edge => byId.get(edge.s).grp === "island")) {
      const a = positions.get(edge.s), b = positions.get(edge.t);
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const dx = (b.x - a.x) / distance, dy = (b.y - a.y) / distance;
      const start = { x: a.x + dx * 15, y: a.y + dy * 15 }, end = { x: b.x - dx * 16, y: b.y - dy * 16 };
      const mid = { x: (a.x + b.x) / 2 - dy * 16, y: (a.y + b.y) / 2 + dx * 16 };
      svg.append(svgElement("path", { d: "M" + start.x + "," + start.y + " Q" + mid.x + "," + mid.y + " " + end.x + "," + end.y, fill: "none", stroke: "#51416e", "stroke-width": 1.5, "stroke-opacity": 0.65, "marker-end": "url(#island-arrow)" }));
    }
    for (const node of island) {
      const p = positions.get(node.id);
      const anchor = Math.cos(p.angle) > 0.3 ? "start" : Math.cos(p.angle) < -0.3 ? "end" : "middle";
      const offsetX = Math.cos(p.angle) * 25, offsetY = Math.sin(p.angle) * 27;
      svg.append(svgElement("circle", { cx: p.x, cy: p.y, r: 12, fill: "#141614" }));
      svg.append(svgElement("text", { x: p.x + offsetX, y: p.y + offsetY + 5, fill: "#141614", "font-size": 16, "font-weight": 600, "text-anchor": anchor }, cleanName(node)));
    }
    svg.dataset.ready = "true";
  }

  function wireExplorer() {
    mainMap = drawNetwork($("#explore-graph"), false);
    $$("[data-group]").forEach(button => button.addEventListener("click", () => changeGroup(button.dataset.group)));
    $$("[data-character]").forEach(button => button.addEventListener("click", () => selectCharacter(button.dataset.character, true)));
    $$("[data-jump-group]").forEach(link => link.addEventListener("click", () => changeGroup(link.dataset.jumpGroup)));
    $$("[data-direction]").forEach(button => button.addEventListener("click", () => {
      direction = button.dataset.direction;
      pressed("[data-direction]", "direction", direction);
      updateNeighbors();
      updateMap();
    }));
    $("#zoom-in").addEventListener("click", () => { zoom = Math.min(3, zoom + 0.5); setView(); });
    $("#zoom-out").addEventListener("click", () => { zoom = Math.max(1, zoom - 0.5); setView(); });
    $("#reset-network").addEventListener("click", () => {
      group = "all"; direction = "in"; zoom = 1;
      pressed("[data-group]", "group", group);
      pressed("[data-direction]", "direction", direction);
      selectCharacter("Spider-Man");
      const url = new URL(location.href);
      url.searchParams.delete("character");
      history.replaceState(null, "", url);
    });
    const search = $("#character-search"), results = $("#search-results");
    search.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase();
      results.replaceChildren();
      if (!query) { results.hidden = true; $("#search-status").textContent = ""; return; }
      const matches = nodes.filter(node => (node.name + " " + node.id.replaceAll("_", " ")).toLocaleLowerCase().includes(query)).sort((a, b) => cleanName(a).localeCompare(cleanName(b)));
      const shown = matches.slice(0, 12);
      results.hidden = false;
      $("#search-status").textContent = matches.length ? matches.length + " matching characters." + (matches.length > 12 ? " Showing the first 12; keep typing to narrow the list." : "") : "No matching characters. Try another name.";
      if (!shown.length) results.append(textElement("li", "No match. Try another character.", "empty-search"));
      shown.forEach(node => {
        const item = document.createElement("li"), button = textElement("button", cleanName(node));
        button.type = "button";
        button.addEventListener("click", () => { selectCharacter(node.id, true); search.focus({ preventScroll: true }); });
        item.append(button); results.append(item);
      });
    });
    search.addEventListener("keydown", event => {
      if ((event.key === "ArrowDown" || event.key === "Enter") && !results.hidden) {
        const first = $("button", results);
        if (first) { event.preventDefault(); event.key === "Enter" ? first.click() : first.focus(); }
      }
      if (event.key === "Escape") { results.hidden = true; search.value = ""; $("#search-status").textContent = ""; }
    });
    results.addEventListener("keydown", event => {
      const buttons = $$("button", results), index = buttons.indexOf(document.activeElement);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      } else if (event.key === "Escape") { results.hidden = true; search.focus(); }
    });
    document.addEventListener("click", event => {
      if (!results.contains(event.target) && event.target !== search) results.hidden = true;
    });
    const requested = new URLSearchParams(location.search).get("character");
    selectCharacter(byId.has(requested) ? requested : "Spider-Man");
  }

  async function init() {
    try {
      const response = await fetch(document.body.dataset.graphSrc);
      if (!response.ok) throw new Error("Data request failed: " + response.status);
      const data = await response.json();
      if (!Array.isArray(data.nodes) || !Array.isArray(data.links) || !data.nodes.length) throw new Error("Invalid graph data");
      nodes = data.nodes; links = data.links;
      byId = new Map(nodes.map(node => [node.id, node]));
      incoming = new Map(nodes.map(node => [node.id, new Set()]));
      outgoing = new Map(nodes.map(node => [node.id, new Set()]));
      for (const link of links) { incoming.get(link.t).add(link.s); outgoing.get(link.s).add(link.t); }
      if ($("#cover-graph")) drawNetwork($("#cover-graph"), true);
      if ($("#attention-dots")) {
        const spider = byId.get("Spider-Man");
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < nodes.length - 1; index++) {
          const dot = document.createElement("i");
          if (index < spider.kin) dot.className = "lit";
          fragment.append(dot);
        }
        $("#attention-dots").append(fragment);
        $$("[data-guess]").forEach(button => button.addEventListener("click", () => predict(button.dataset.guess)));
        $("#skip-prediction").addEventListener("click", () => predict(null));
        $$("[data-ranking]").forEach(button => button.addEventListener("click", () => ranking(button.dataset.ranking)));
        ranking("kin", false);
        wireExplorer();
        drawIsland();
      }
    } catch (error) {
      console.error("Marvel presentation:", error);
      const status = $("#data-status");
      if (status) {
        status.replaceChildren(document.createTextNode("The interactive data couldn’t load. The results and static maps are still available. "));
        const retry = textElement("button", "Reload and try again", "text-button");
        retry.type = "button"; retry.addEventListener("click", () => location.reload()); status.append(retry);
      }
      $$("[data-guess], [data-ranking], [data-group], [data-character], [data-direction], #zoom-in, #zoom-out, #reset-network, #skip-prediction, #character-search").forEach(control => control.disabled = true);
    }
  }
  init();
})();
