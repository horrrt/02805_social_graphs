import {
  setupChrome,
  $,
  $$,
  esc,
  shortName,
  load,
  prediction,
  articleOptions,
  canvasStage,
  tone,
  errorMessage,
  SANS,
} from "./cabinet.js";
import { mountRide } from "./ride.mjs";
import { graph, bfs, outcome } from "./arcade-core.mjs";
setupChrome();
try {
  const [data, transit] = await Promise.all([
    load(),
    load("week02_transit.json"),
  ]);
  $("#app-status").hidden = true;
  const byId = new Map(data.nodes.map((n) => [n.id, n])),
    stationById = new Map(transit.stations.map((n) => [n.id, n]));
  const name = (id) => shortName(byId.get(id));
  // The rows of the schematic grid, so a same-row segment can be routed
  // through the gap between rows instead of straight through it.
  const rowsY = [...new Set(transit.stations.map((s) => s.y))].sort((a, b) => a - b);
  const rowGap = rowsY.length > 1 ? rowsY[1] - rowsY[0] : 170;
  const totalLinks = transit.lines.reduce((sum, line) => sum + line.stations.length - 1, 0);
  let closed = null,
    selectedLine = 1,
    hoverLine = null,
    drawMap = () => {};
  articleOptions($("#route-from"), data, "Spider-Man");
  articleOptions($("#route-to"), data, "Hulk");
  // One token holds all seven line colours as a comma-separated list.
  const colors = tone("--cv-transit-lines", "#005c68,#b23e29,#765096,#27784a,#956900,#254caa,#972d68")
    .split(",")
    .map((s) => s.trim());
  $("#line-chips").innerHTML =
    transit.lines
      .map(
        (line) =>
          `<button class="quiet" data-line="${line.id}" aria-pressed="${line.id === 1}">Line ${line.id}</button>`,
      )
      .join("") +
    '<button class="quiet" data-line="0" aria-pressed="false">All tracks</button>';
  function describe() {
    const line = transit.lines.find((l) => l.id === selectedLine);
    $("#line-description").textContent = line
      ? `Line ${line.id}: ${line.stations.map(name).join(" → ")}. ${closed ? "Closed station: " + name(closed) + "." : ""}`
      : `All ${totalLinks} real links among these 16 hubs. Crossings without a station circle are not connections. Select one line for a clearer view.`;
  }
  drawMap = canvasStage($("#transit-map"), (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const sx = w / 1030,
      sy = (h - 30) / 780;
    const pt = (id) => {
      const s = stationById.get(id);
      return [s.x * sx, s.y * sy + 20];
    };
    const renderLine = (line, active) => {
      c.strokeStyle = active
        ? colors[(line.id - 1) % colors.length]
        : tone("--cv-transit-line-inactive", "#d3dce8");
      c.lineWidth = active ? 4 : 1;
      c.lineJoin = "round";
      for (let i = 1; i < line.stations.length; i++) {
        const a = line.stations[i - 1],
          b = line.stations[i],
          p = pt(a),
          q = pt(b);
        if (a === closed || b === closed) {
          c.setLineDash([4, 5]);
        } else c.setLineDash([]);
        c.beginPath();
        c.moveTo(...p);
        if (p[1] === q[1]) {
          // A same-row run would otherwise draw straight through every
          // station between its ends. Route it through the gap between
          // rows instead, the way the lane jump below already keeps a
          // cross-row run clear of intervening station columns.
          const rowY = stationById.get(a).y,
            lastRow = rowY === rowsY[rowsY.length - 1],
            corridor =
              (lastRow ? rowY - rowGap / 2 : rowY + rowGap / 2) * sy +
              20 +
              ((line.id % 5) - 2) * 3;
          c.lineTo(p[0], corridor);
          c.lineTo(q[0], corridor);
          c.lineTo(...q);
        } else {
          // Offset track lanes keep a direct edge from visually stopping at intervening stations.
          const d = Math.min(16, w / 48) + (line.id % 3) * 2,
            sign = q[0] >= p[0] ? 1 : -1,
            offset = (line.id % 2 ? 1 : -1) * d;
          let lane = (p[0] + q[0]) / 2;
          if (transit.stations.some((s) => Math.abs(s.x * sx - lane) < d))
            lane += d * 1.8;
          c.lineTo(p[0] + sign * d, p[1] + offset);
          c.lineTo(lane, p[1] + offset);
          c.lineTo(lane, q[1] + offset);
          c.lineTo(q[0] - sign * d, q[1] + offset);
          c.lineTo(...q);
        }
        c.stroke();
      }
      c.setLineDash([]);
    };
    // In "All tracks" every line shares a neutral grey; only the selected or
    // hovered line takes its own colour, so 15 lines never repeat a hue.
    transit.lines
      .filter((l) => l.id !== selectedLine)
      .forEach((l) => renderLine(l, selectedLine === 0 && l.id === hoverLine));
    const current = transit.lines.find((l) => l.id === selectedLine);
    if (current) renderLine(current, true);
    for (const station of transit.stations) {
      const [x, y] = pt(station.id),
        active = !current || current.stations.includes(station.id);
      c.fillStyle = tone("--cv-transit-station-fill", "#ffffff");
      c.strokeStyle =
        station.id === closed
          ? tone("--cv-transit-station-closed", "#d9480f")
          : active
            ? tone("--cv-transit-station-active", "#0f2340")
            : tone("--cv-transit-station-inactive", "#7a8fac");
      c.lineWidth = active ? 2 : 1;
      c.beginPath();
      c.arc(x, y, station.id === closed ? 7 : 5, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      if (station.id === closed) {
        c.beginPath();
        c.moveTo(x - 5, y - 5);
        c.lineTo(x + 5, y + 5);
        c.stroke();
      }
      c.font = `${active ? "600 " : ""}${w < 550 ? 10 : 13}px ${SANS}`;
      c.textAlign = "center";
      const words = name(station.id).split(" "),
        lines = [];
      let line = "";
      const max = w / 4 - 12;
      for (const word of words) {
        if (c.measureText(line + " " + word).width > max && line) {
          lines.push(line);
          line = word;
        } else line += (line ? " " : "") + word;
      }
      if (line) lines.push(line);
      lines.forEach((text, i) => {
        const yy = y + 20 + i * 14;
        const width = c.measureText(text).width;
        c.fillStyle = tone("--cv-transit-label-bg", "#ffffffee");
        c.fillRect(x - width / 2 - 3, yy - 11, width + 6, 14);
        c.fillStyle = active
          ? tone("--cv-transit-label-active", "#0f2340")
          : tone("--cv-transit-label-inactive", "#46618a");
        c.fillText(text, x, yy);
      });
    }
    c.textAlign = "left";
    c.fillStyle = tone("--cv-transit-caption", "#46618a");
    c.font = `11px ${SANS}`;
    c.fillText(
      "Circles = stations. Unmarked crossings are not connections.",
      12,
      h - 12,
    );
  });
  $$("#line-chips button").forEach((button) => {
    const lineId = Number(button.dataset.line);
    button.addEventListener("click", () => {
      selectedLine = lineId;
      $$("#line-chips button").forEach((b) =>
        b.setAttribute("aria-pressed", b === button),
      );
      drawMap();
      describe();
    });
    if (lineId !== 0) {
      const hover = (on) => () => {
        hoverLine = on ? lineId : null;
        drawMap();
      };
      button.addEventListener("mouseenter", hover(true));
      button.addEventListener("mouseleave", hover(false));
      button.addEventListener("focus", hover(true));
      button.addEventListener("blur", hover(false));
    }
  });
  function plan() {
    const from = $("#route-from").value,
      to = $("#route-to").value,
      directed = $("#route-direction").value === "directed",
      adj = graph(data, { directed, removed: closed ? [closed] : [] });
    const path = bfs(adj, from, to);
    if (from === closed || to === closed) {
      $("#route-status").textContent =
        `${name(closed)} is closed. Restore service to plan through that station.`;
      $("#route-strip").innerHTML = "";
      return;
    }
    $("#route-status").textContent = path
      ? `${path.length - 1} ${path.length === 2 ? "hop" : "hops"} · ${directed ? "one-way article links" : "undirected links"} · ${closed ? name(closed) + " closed" : "original snapshot"}.`
      : `No route from ${name(from)} to ${name(to)} under these rules. ${byId.get(from).degree === 0 || byId.get(to).degree === 0 ? "One of these articles is an isolate." : "They may lie in separate components, or link direction may block the journey."}`;
    $("#route-strip").innerHTML = path
      ? path
          .map(
            (id, i) =>
              `<li>${esc(name(id))}<small>${i === 0 ? "Start" : i === path.length - 1 ? "Arrive" : "Hop " + i}</small></li>`,
          )
          .join("")
      : "";
  }
  $("#route-form").addEventListener("submit", (e) => {
    e.preventDefault();
    plan();
  });
  $("#route-isolate").addEventListener("click", () => {
    $("#route-from").value = "Baymax";
    $("#route-to").value = "Spider-Man";
    plan();
  });
  $("#route-island").addEventListener("click", () => {
    $("#route-from").value = "Blackthorn_(character)";
    $("#route-to").value = "Vyking";
    plan();
  });
  let revealSelectedClosure = () => {};
  const ride = mountRide($("#ride"), data, {
    onClose: () => revealSelectedClosure(),
    onRestore: () => challenge(),
  });
  function challenge() {
    closed = null;
    $("#service-state").textContent = "NORMAL SERVICE";
    $("#disruption-results").hidden = true;
    if ($("#numeric-guess")) $("#numeric-guess").hidden = false;
    drawMap();
    plan();
    describe();
    const entry = transit.closures.find(
        (c) => c.id === $("#closure-select").value,
      ),
      actual = outcome(data, entry.id);
    ride.reset(entry.id);
    revealSelectedClosure = () => {
      closed = entry.id;
      $("#service-state").textContent = "ONE CLOSURE";
      $("#disruption-results").hidden = false;
      $("#disruption-headline").textContent =
        `${entry.label} closed. ${actual.stranded.length} ${actual.stranded.length === 1 ? "article" : "articles"} cut off.`;
      $("#disruption-detail").textContent =
        `${actual.largest.length} / ${actual.remaining} remaining articles can still reach each other. ${entry.degree} links to neighbouring articles before removal. ${actual.groups.length - 1} separated ${actual.groups.length === 2 ? "group" : "groups"}.`;
      $("#stranded-list").innerHTML = actual.stranded.length
        ? `<p><b>Cut off from the largest group:</b> ${actual.stranded.map((id) => esc(name(id))).join(", ")}.</p>`
        : "<p>Every remaining article still has a route to every other. The other links provide alternative routes.</p>";
      const n = entry.null,
        total = n.histogram.reduce((s, r) => s + r.count, 0),
        atLeast = n.histogram
          .filter((r) => r.value >= actual.stranded.length)
          .reduce((s, r) => s + r.count, 0),
        peak = Math.max(...n.histogram.map((r) => r.count));
      const verdict = $("#null-verdict");
      if (verdict) {
        const observed = actual.stranded.length;
        const same = n.histogram.find((r) => r.value === observed)?.count || 0;
        verdict.textContent =
          observed === 0
            ? `${entry.label}: no other articles cut off in the real network. ${same} of ${total.toLocaleString()} rearranged maps also lost none. This outcome is common under the benchmark.`
            : `${entry.label}: ${observed} cut off in the real network. ${atLeast} of ${total.toLocaleString()} rearranged maps lost at least that many. ${atLeast === 0 ? "None did in this finite sample; that does not mean it is impossible under the model." : "The same neighbour counts can produce less disruption when the links are arranged differently."}`;
        $("#compare-station").textContent =
          entry.id === "Hulk" ? "Try Spider-Man next" : "Try Hulk next";
      }
      $("#null-explanation").textContent =
        `In ${total.toLocaleString()} rewired starting networks, removing ${entry.label} stranded ${n.mean.toFixed(3)} articles on average. ${atLeast} / ${total} trials stranded at least the observed ${actual.stranded.length}. The actual graph is marked in the histogram.`;
      $("#null-hist").innerHTML = n.histogram
        .map(
          (r) =>
            `<div class="hist-row${r.value === actual.stranded.length ? " observed" : ""}"><span>${r.value} stranded${r.value === actual.stranded.length ? " ← real" : ""}</span><div class="hist-bar" style="width:${(r.count / peak) * 100}%"></div><span>${r.count}</span></div>`,
        )
        .join("");
      if (!n.histogram.some((r) => r.value === actual.stranded.length))
        $("#null-hist").insertAdjacentHTML(
          "beforeend",
          `<p class="fine">Observed ${actual.stranded.length}: zero benchmark draws at this value.</p>`,
        );
      drawMap();
      describe();
      plan();
      ride.update(closed);
      if ($("#numeric-guess")) $("#numeric-guess").hidden = true;
    };
    prediction($("#prediction"), {
      id: "w2-close-" + entry.id.replace(/[^a-z0-9]/gi, "-"),
      week: 2,
      allowSkip: true,
      autoReveal: !$("#ride"),
      plainLanguage: true,
      prompt: `If ${entry.label} closes, how many other articles lose their route to the largest group?`,
      min: 0,
      max: 20,
      answer: actual.stranded.length,
      unit: "articles",
      explain:
        "The cut-off articles can no longer reach the largest remaining group. Some may still connect to each other.",
      onReveal: () => revealSelectedClosure(),
    });
  }
  $("#closure-select").addEventListener("change", challenge);
  $("#compare-station")?.addEventListener("click", () => {
    const select = $("#closure-select");
    select.value = select.value === "Hulk" ? "Spider-Man" : "Hulk";
    challenge();
    select.focus();
    select.scrollIntoView({ block: "center", behavior: "instant" });
  });
  $("#restore-service").addEventListener("click", () => {
    closed = null;
    $("#service-state").textContent = "NORMAL SERVICE";
    $("#disruption-headline").textContent =
      "Service restored. All 277 articles can reach each other again.";
    $("#disruption-detail").textContent =
      "The recorded closure comparison remains below. The map and route planner now use the original graph.";
    $("#stranded-list").innerHTML = "";
    ride.update(null);
    if ($("#numeric-guess")) $("#numeric-guess").hidden = false;
    drawMap();
    describe();
    plan();
  });
  challenge();
  describe();
} catch (error) {
  errorMessage(error);
}
