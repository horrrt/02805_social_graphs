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
  errorMessage,
} from "./cabinet.js";
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
  let closed = null,
    selectedLine = 1,
    drawMap = () => {};
  articleOptions($("#route-from"), data, "Spider-Man");
  articleOptions($("#route-to"), data, "Hulk");
  const colors = [
    "#005c68",
    "#b23e29",
    "#765096",
    "#27784a",
    "#956900",
    "#254caa",
    "#972d68",
  ];
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
      : "All 60 real links among these 16 hubs. Crossings without a station circle are not connections. Select one line for a clearer view.";
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
        : "#cbd2cb";
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
        // Offset track lanes keep a direct edge from visually stopping at intervening stations.
        const d = Math.min(16, w / 48) + (line.id % 3) * 2,
          sign = q[0] >= p[0] ? 1 : -1,
          offset = (line.id % 2 ? 1 : -1) * d;
        let lane = (p[0] + q[0]) / 2;
        if (transit.stations.some((s) => Math.abs(s.x * sx - lane) < d))
          lane += d * 1.8;
        c.beginPath();
        c.moveTo(...p);
        c.lineTo(p[0] + sign * d, p[1] + offset);
        c.lineTo(lane, p[1] + offset);
        c.lineTo(lane, q[1] + offset);
        c.lineTo(q[0] - sign * d, q[1] + offset);
        c.lineTo(...q);
        c.stroke();
      }
      c.setLineDash([]);
    };
    transit.lines
      .filter((l) => l.id !== selectedLine)
      .forEach((l) => renderLine(l, selectedLine === 0));
    const current = transit.lines.find((l) => l.id === selectedLine);
    if (current) renderLine(current, true);
    for (const station of transit.stations) {
      const [x, y] = pt(station.id),
        active = !current || current.stations.includes(station.id);
      c.fillStyle = "#f7f5ec";
      c.strokeStyle =
        station.id === closed ? "#a33d23" : active ? "#152b35" : "#849393";
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
      c.font = `${active ? "600 " : ""}${w < 550 ? 10 : 13}px Barlow`;
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
        c.fillStyle = "#f7f5ecee";
        c.fillRect(x - width / 2 - 3, yy - 11, width + 6, 14);
        c.fillStyle = active ? "#152b35" : "#617271";
        c.fillText(text, x, yy);
      });
    }
    c.textAlign = "left";
    c.fillStyle = "#465b61";
    c.font = "11px Barlow";
    c.fillText(
      "Circles = stations. Unmarked crossings are not connections.",
      12,
      h - 12,
    );
  });
  $$("#line-chips button").forEach((button) =>
    button.addEventListener("click", () => {
      selectedLine = Number(button.dataset.line);
      $$("#line-chips button").forEach((b) =>
        b.setAttribute("aria-pressed", b === button),
      );
      drawMap();
      describe();
    }),
  );
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
  function challenge() {
    closed = null;
    $("#service-state").textContent = "NORMAL SERVICE";
    $("#disruption-results").hidden = true;
    drawMap();
    plan();
    describe();
    const entry = transit.closures.find(
        (c) => c.id === $("#closure-select").value,
      ),
      actual = outcome(data, entry.id);
    prediction($("#prediction"), {
      id: "w2-close-" + entry.id.replace(/[^a-z0-9]/gi, "-"),
      week: 2,
      prompt: `If ${entry.label} closes, how many of the other 276 core articles become stranded?`,
      min: 0,
      max: 20,
      answer: actual.stranded.length,
      unit: "articles",
      explain:
        "Stranded means outside the largest remaining component. The guess range is a game choice, not a theoretical maximum.",
      onReveal: () => {
        closed = entry.id;
        $("#service-state").textContent = "ONE CLOSURE";
        $("#disruption-results").hidden = false;
        $("#disruption-headline").textContent =
          `${entry.label} closed. ${actual.stranded.length} ${actual.stranded.length === 1 ? "article" : "articles"} stranded.`;
        $("#disruption-detail").textContent =
          `${actual.largest.length} / ${actual.remaining} remaining articles stay in the main component. ${entry.degree} original neighbours. ${actual.groups.length - 1} separated ${actual.groups.length === 2 ? "group" : "groups"}.`;
        $("#stranded-list").innerHTML = actual.stranded.length
          ? `<p><b>Outside the main component:</b> ${actual.stranded.map((id) => esc(name(id))).join(", ")}.</p>`
          : "<p>Every remaining article still has a route to every other. High degree does not automatically mean fragile connectivity.</p>";
        const n = entry.null,
          total = n.histogram.reduce((s, r) => s + r.count, 0),
          atLeast = n.histogram
            .filter((r) => r.value >= actual.stranded.length)
            .reduce((s, r) => s + r.count, 0),
          peak = Math.max(...n.histogram.map((r) => r.count));
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
      },
    });
  }
  $("#closure-select").addEventListener("change", challenge);
  $("#restore-service").addEventListener("click", () => {
    closed = null;
    $("#service-state").textContent = "NORMAL SERVICE";
    $("#disruption-headline").textContent =
      "Service restored. All 277 core articles are connected.";
    $("#disruption-detail").textContent =
      "The recorded closure comparison remains below. The map and route planner now use the original graph.";
    $("#stranded-list").innerHTML = "";
    drawMap();
    describe();
    plan();
  });
  challenge();
  describe();
} catch (error) {
  errorMessage(error);
}
