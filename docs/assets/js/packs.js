import {
  setupChrome,
  $,
  $$,
  esc,
  load,
  prediction,
  canvasStage,
  tone,
  errorMessage,
} from "./cabinet.js";
import { rng } from "./arcade-core.mjs";
import { card } from "./cards.js";
setupChrome();
try {
  const [data, packs] = await Promise.all([load(), load("week01_packs.json")]);
  $("#app-status").hidden = true;
  prediction($("#prediction"), {
    id: "w1-packs",
    week: 1,
    prompt: "How many five-card packs to collect every article, on average?",
    min: 0,
    max: 4000,
    answer: 1945,
    unit: "packs",
    explain:
      "An approximate expectation, not a guaranteed finish. The slow part is finding the last rare cards.",
  });
  const KEY = "loglog-packs-20260826",
    known = new Set(data.nodes.map((n) => n.id));
  let counts = {},
    pulls = 0,
    limit = 24,
    random = rng(7),
    compare = false;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.counts)
      for (const [id, v] of Object.entries(saved.counts))
        if (known.has(id) && Number.isSafeInteger(v) && v > 0) counts[id] = v;
    if (
      Number.isInteger(saved?.randomState) &&
      saved.randomState >= 0 &&
      saved.randomState <= 4294967295
    )
      random = rng(saved.randomState);
    if (
      Number.isInteger(saved?.seed) &&
      saved.seed >= 0 &&
      saved.seed <= 4294967295
    )
      $("#pack-seed").value = saved.seed;
  } catch {}
  pulls = Object.values(counts).reduce((a, b) => a + b, 0);
  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          counts,
          randomState: random.state(),
          seed: Number($("#pack-seed").value),
        }),
      );
    } catch {
      $("#pack-status").textContent +=
        " Storage is unavailable; collection lasts for this visit.";
    }
  }
  function collection() {
    const term = $("#collection-search").value.toLowerCase(),
      filter = $("#collection-filter").value;
    const all = data.nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(term) &&
        (filter === "all" ||
          (filter === "owned" && counts[n.id]) ||
          (filter === "missing" && !counts[n.id]) ||
          (filter === "rare" && n.kin === 0)),
    );
    $("#collection-grid").innerHTML =
      all
        .slice(0, limit)
        .map((n) =>
          card(n, { index: data.nodes.indexOf(n), count: counts[n.id] || 0 }),
        )
        .join("") || '<p class="empty">No cards match this view.</p>';
    $("#collection-count").textContent =
      `Showing ${Math.min(limit, all.length)} of ${all.length} cards. ${filter === "all" ? "The index includes cards you have not drawn." : ""}`;
    $("#more-cards").disabled = limit >= all.length;
  }
  function metrics() {
    $("#unique-count").textContent = `${Object.keys(counts).length} / 303`;
    $("#pull-count").textContent = pulls.toLocaleString();
    $("#rare-count").textContent =
      `${data.nodes.filter((n) => n.kin === 0 && counts[n.id]).length} / 58`;
    collection();
  }
  $("#open-pack").disabled = false;
  $("#open-pack").addEventListener("click", () => {
    if (!$("#pack-seed").reportValidity()) return;
    const draws = [];
    for (let i = 0; i < 5; i++) {
      let ticket = random() * packs.totalWeight;
      let n = data.nodes.at(-1);
      for (const item of data.nodes) {
        ticket -= item.kin + 1;
        if (ticket < 0) {
          n = item;
          break;
        }
      }
      const fresh = !counts[n.id];
      counts[n.id] = (counts[n.id] || 0) + 1;
      pulls++;
      draws.push({ n, fresh });
    }
    $("#pack-tray").innerHTML = draws
      .map(({ n, fresh }) => card(n, { index: data.nodes.indexOf(n), fresh }))
      .join("");
    $("#pack-status").textContent =
      `Pack ${Math.floor(pulls / 5)}: ${draws.filter((d) => d.fresh).length} new cards. ${draws.map((d) => d.n.name).join(", ")}.`;
    save();
    metrics();
    drawChart();
  });
  $("#pack-seed").addEventListener("change", () => {
    const input = $("#pack-seed");
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    random = rng(Number(input.value));
    save();
    $("#pack-status").textContent =
      `New random sequence, seed ${input.value}. Your collection is kept.`;
  });
  $("#reset-packs").addEventListener("click", () => {
    if (!confirm("Clear your collected cards? Your prediction log will stay."))
      return;
    counts = {};
    pulls = 0;
    random = rng(Number($("#pack-seed").value) || 7);
    save();
    metrics();
    drawChart();
    $("#pack-tray").innerHTML =
      '<p class="empty">Your next five cards are waiting.</p>';
    $("#pack-status").textContent = "Collection reset.";
  });
  for (const selector of ["#collection-search", "#collection-filter"])
    $(selector).addEventListener("input", () => {
      limit = 24;
      collection();
    });
  $("#more-cards").addEventListener("click", () => {
    limit += 24;
    collection();
  });
  const drawChart = canvasStage($("#degree-chart"), (c, w, h) => {
    const log = $("#degree-scale").value === "log",
      left = 53,
      right = 20,
      top = 30,
      bottom = 53,
      W = w - left - right,
      H = h - top - bottom;
    c.clearRect(0, 0, w, h);
    c.font = "12px Barlow";
    c.fillStyle = tone("--cv-packs-text", "#cebea1");
    c.strokeStyle = tone("--cv-packs-grid", "#625139");
    const maxY = 100;
    const X = (k) =>
      left + (log ? Math.log10(k + 1) / Math.log10(107) : k / 106) * W;
    const Y = (p) =>
      top +
      H -
      (log
        ? (Math.log10(Math.max(p, 0.3)) - Math.log10(0.3)) /
          (Math.log10(maxY) - Math.log10(0.3))
        : p / maxY) *
        H;
    for (const p of log ? [0.3, 1, 3, 10, 30, 100] : [0, 25, 50, 75, 100]) {
      const y = Y(p);
      c.beginPath();
      c.moveTo(left, y);
      c.lineTo(w - right, y);
      c.stroke();
      c.fillText(p + "%", 5, y + 4);
    }
    for (const k of log ? [0, 1, 3, 9, 29, 106] : [0, 20, 40, 60, 80, 106]) {
      c.fillText(log ? String(k + 1) : String(k), X(k) - 5, h - bottom + 20);
    }
    const drawn = new Map();
    for (const n of data.nodes)
      drawn.set(n.kin, (drawn.get(n.kin) || 0) + (counts[n.id] || 0));
    for (const row of packs.histogram) {
      const x = X(row.degree),
        y = Y((row.count / 303) * 100);
      c.fillStyle = tone("--cv-packs-dot", "#ffd15c");
      c.beginPath();
      c.arc(x, y, 4, 0, Math.PI * 2);
      c.fill();
      if (pulls >= 20 && drawn.get(row.degree)) {
        c.strokeStyle = tone("--cv-packs-ring", "#ff9f86");
        c.lineWidth = 2;
        c.beginPath();
        c.arc(x, Y((drawn.get(row.degree) / pulls) * 100), 5, 0, Math.PI * 2);
        c.stroke();
      }
    }
    c.fillStyle = tone("--cv-packs-text", "#cebea1");
    c.fillText(
      log ? "Incoming links + 1 (log scale)" : "Incoming links per article",
      left,
      h - 12,
    );
    c.fillText(log ? "Share (%, logarithmic)" : "Share (%)", left, 16);
  });
  $("#degree-scale").addEventListener("change", drawChart);
  $("#degree-table").innerHTML =
    '<table><thead><tr><th>Incoming links</th><th class="num">Articles</th><th class="num">Share</th></tr></thead><tbody>' +
    packs.histogram
      .map(
        (r) =>
          `<tr><td>${r.degree}</td><td class="num">${r.count}</td><td class="num">${((r.count / 303) * 100).toFixed(2)}%</td></tr>`,
      )
      .join("") +
    "</tbody></table>";
  const bins = [
      [0, 0],
      [1, 1],
      [2, 3],
      [4, 7],
      [8, 15],
      [16, 31],
      [32, 106],
    ],
    guess = [40, 40, 40, 40, 40, 40, 40],
    actual = bins.map(
      ([a, b]) => data.nodes.filter((n) => n.kin >= a && n.kin <= b).length,
    );
  $("#sketch-inputs").innerHTML = bins
    .map(
      ([a, b], i) =>
        `<label>${a === b ? a : a + "–" + b}<input type="number" min="0" max="160" step="1" value="40" data-bin="${i}" aria-label="Articles with ${a} to ${b} incoming links"></label>`,
    )
    .join("");
  const drawSketch = canvasStage($("#sketch-chart"), (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const bw = (w - 50) / 7;
    for (let i = 0; i < 7; i++) {
      const x = 35 + i * bw,
        height = ((h - 55) * guess[i]) / 160;
      c.fillStyle = tone("--cv-packs-bar", "#ffd15c");
      c.fillRect(x, h - 35 - height, bw * 0.38, height);
      if (compare) {
        c.fillStyle = tone("--cv-packs-bar-actual", "#ff9f86");
        const ah = ((h - 55) * actual[i]) / 160;
        c.fillRect(x + bw * 0.4, h - 35 - ah, bw * 0.38, ah);
      }
      c.fillStyle = tone("--cv-packs-text", "#cebea1");
      c.font = "12px Barlow";
      c.fillText(String(guess[i]), x, h - 40 - height);
    }
    c.fillStyle = tone("--cv-packs-text", "#cebea1");
    c.fillText(
      "Height = articles, 0–160. Horizontal bins are labelled below.",
      20,
      17,
    );
  });
  $$("#sketch-inputs input").forEach((input) =>
    input.addEventListener("input", () => {
      guess[Number(input.dataset.bin)] = Math.max(
        0,
        Math.min(160, Number(input.value) || 0),
      );
      drawSketch();
    }),
  );
  let sketching = false;
  function sketch(e) {
    const r = $("#sketch-chart").getBoundingClientRect(),
      i = Math.floor((e.clientX - r.left - 35) / ((r.width - 50) / 7));
    if (i < 0 || i > 6) return;
    guess[i] = Math.max(
      0,
      Math.min(
        160,
        Math.round(
          ((r.height - 35 - (e.clientY - r.top)) / (r.height - 55)) * 160,
        ),
      ),
    );
    $(`[data-bin="${i}"]`).value = guess[i];
    drawSketch();
  }
  $("#sketch-chart").style.touchAction = "none";
  $("#sketch-chart").addEventListener("pointerdown", (e) => {
    sketching = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    sketch(e);
  });
  $("#sketch-chart").addEventListener("pointermove", (e) => {
    if (sketching) sketch(e);
  });
  $("#sketch-chart").addEventListener("pointerup", () => {
    sketching = false;
  });
  $("#sketch-chart").addEventListener("pointercancel", () => {
    sketching = false;
  });
  $("#compare-sketch").addEventListener("click", () => {
    compare = true;
    drawSketch();
    $("#sketch-feedback").textContent =
      `Gold = your sketch; coral = snapshot. Actual counts from left to right: ${actual.join(", ")}. The distribution is uneven; this alone does not prove a power law.`;
  });
  metrics();
} catch (error) {
  errorMessage(error);
}
