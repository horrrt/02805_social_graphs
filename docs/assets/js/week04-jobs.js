// Section 2 figures: certified H-1B occupation co-hiring network.
// Plain SVG, coloured from the page's CSS tokens; every mark carries a
// native tooltip (<title>).
import { stripChart, token, node as el, fitted, fs, textWidth } from "./week04-strip.js?v=2";

const DATA_URL = new URL("../../weeks/week04/data/jobs.json?v=2", import.meta.url);
const whole = new Intl.NumberFormat("en-US");
const num = (value) => whole.format(value);
const short = (title) => title.replace(/\s+\([^)]*\)$/, "").replace(/\s+/g, " ");
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const tip = (element, text) => {
  element.append(el("title", {}, text));
  return element;
};
// Every chart here is drawn at its host's width (see fitted), one unit to a pixel.
const svgRoot = (width, height, label, role = "img") =>
  el("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role, "aria-label": label, style: "display:block;font-family:inherit" });

// The start card: the most common job pairs, with pairs that include the
// most-filed occupation dark and the rest grey.
function renderPairs(data) {
  const host = $("chart-job-pairs");
  if (!host) return;
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const top = data.nodes.reduce((best, n) => (n.filings > best.filings ? n : best));
  const rows = [...data.pairs].sort((a, b) => b.weight - a.weight).slice(0, 12);
  const hasTop = (p) => p.source === top.id || p.target === top.id;
  const withTop = rows.filter(hasTop).length;
  // The most-filed occupation always takes the bold first line.
  const names = rows.map((p) => {
    const [first, second] = p.target === top.id ? [p.target, p.source] : [p.source, p.target];
    return [byId.get(first)?.title || first, byId.get(second)?.title || second];
  });

  host.replaceChildren(fitted((W) => drawPairs(data, rows, names, top, withTop, hasTop, W), 860));
}

function drawPairs(data, rows, names, top, withTop, hasTop, W) {
  const rowH = 40;
  const y0 = 46;
  const small = fs("small");
  const caption = fs("caption");
  const longest = Math.max(...names.map(([first, second]) => Math.max(textWidth(first, "small", 700), textWidth(`+ ${second}`, "small"))));
  const labelRight = Math.ceil(longest) + 4;
  const x0 = labelRight + 12;
  const x1 = W - 60;
  const maxWeight = Math.max(...rows.map((p) => p.weight));
  const raw = maxWeight / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const domain = Math.ceil(maxWeight / step) * step;
  const X = (v) => x0 + ((x1 - x0) * v) / domain;
  const bottom = y0 + rows.length * rowH - 12;
  const H = bottom + 40;
  const dark = token("--w4-accent");
  const grey = token("--w4-map-edge");

  const svg = svgRoot(W, H, `The ${rows.length} occupation pairs with the most shared employers; ${withTop} include ${top.title}`);
  const keyText = `Pair includes ${top.title} (${withTop} of ${rows.length})`;
  svg.append(el("rect", { x: 0, y: 4, width: 12, height: 12, rx: 2, fill: dark }));
  svg.append(el("text", { x: 18, y: 14, "font-size": caption, fill: token("--ink"), "font-weight": 600 }, keyText));
  const otherX = 18 + textWidth(keyText, "caption", 600) + 24;
  svg.append(el("rect", { x: otherX, y: 4, width: 12, height: 12, rx: 2, fill: grey }));
  svg.append(el("text", { x: otherX + 18, y: 14, "font-size": caption, fill: token("--ink-soft"), "font-weight": 600 }, "Other pairs"));

  for (let v = 0; v <= domain; v += step) {
    svg.append(el("line", { x1: X(v), x2: X(v), y1: 30, y2: bottom, stroke: token("--line-soft") }));
    svg.append(el("text", { x: X(v), y: bottom + 14, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "middle" }, num(v)));
  }
  svg.append(el("text", { x: (x0 + x1) / 2, y: bottom + 36, "font-size": caption, fill: token("--ink-mute"), "text-anchor": "middle" },
    `Companies that filed for both jobs in ${data.meta.year}`));

  rows.forEach((p, i) => {
    const y = y0 + i * rowH;
    const [first, second] = names[i];
    const mark = hasTop(p);
    svg.append(el("text", { x: labelRight, y: y + 5, "font-size": small, "text-anchor": "end", fill: token("--ink"), "font-weight": mark ? 700 : 600 }, first));
    svg.append(el("text", { x: labelRight, y: y + 21, "font-size": small, "text-anchor": "end", fill: token("--ink-soft") }, `+ ${second}`));
    const g = tip(el("g"), `${first} + ${second}: ${num(p.weight)} companies filed for both`);
    g.append(el("rect", { x: x0, y, width: X(p.weight) - x0, height: 16, rx: 3, fill: mark ? dark : grey }));
    svg.append(g);
    svg.append(el("text", { x: X(p.weight) + 6, y: y + 12.5, "font-size": small, "font-weight": 700, fill: token("--ink") }, num(p.weight)));
  });
  return svg;
}

function inspector(node, data) {
  const panel = $("jobs-node-inspector");
  if (!node) return;
  const label = (id) => clusterName(data, id);
  const partners = node.partners
    .map(([, title, weight]) => `<li><span>${esc(short(title))}</span><b>${num(weight)}</b></li>`)
    .join("");
  const where = node.bridge
    ? `In the ${esc(label(node.clusters[0]))} cluster, with more ties than chance to the ${esc(label(node.clusters[1]))} cluster.`
    : `In the ${esc(label(node.cluster))} cluster only.`;
  panel.innerHTML = `<h2>${esc(short(node.title))}</h2><p class="jobs-meta">SOC ${esc(node.id)} · ${num(node.filings)} certified filings</p><p>${where}</p><h3>Most shared employers</h3><ol class="jobs-partners">${partners}</ol><button type="button" class="jobs-back">Back to the bridge list</button>`;
  panel.querySelector(".jobs-back").addEventListener("click", () => {
    selectNode(null);
    bridgeList(data);
  });
}

// Clusters are named after their largest occupation.
function clusterName(data, id) {
  const group = data.clusters.find((g) => g.id === id);
  return group ? short(group.label) : `cluster ${id + 1}`;
}

// Rings the chosen occupation in the network; renderNetwork sets it.
let selectNode = () => {};

function bridgeList(data) {
  const bridges = data.nodes.filter((node) => node.bridge);
  $("jobs-node-inspector").innerHTML = `<h2>Bridge jobs</h2><p>${bridges.length} of the ${data.nodes.length} occupations shown have more employer ties to a second cluster than any rewired network gives them.${bridges.length ? " Ringed in the network." : ""}</p><div class="jobs-bridge-list" id="jobs-bridge-list"></div>`;
  $("jobs-bridge-list").innerHTML = bridges.map((node) => `<button type="button" data-job-id="${esc(node.id)}"><span>${esc(short(node.title))}</span><b>${num(node.filings)}</b></button>`).join("") || `<p>None of the ${data.nodes.length} occupations shown here passes the overlap test; ${num(data.bridges.all_occupations)} ${data.bridges.all_occupations === 1 ? "does" : "do"} across the whole network.</p>`;
  $("jobs-bridge-list").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    const node = data.nodes.find((item) => item.id === button.dataset.jobId);
    inspector(node, data);
    selectNode(node.id);
  }));
}

// Display names for the network labels and key; the full title is in each tooltip.
const SHORT = {
  "Software Quality Assurance Analysts and Testers": "Software QA Testers",
  "Market Research Analysts and Marketing Specialists": "Market Research Analysts",
  "Computer and Information Research Scientists": "Computer Research Scientists",
  "Medical and Clinical Laboratory Technologists": "Lab Technologists",
  "Computer and Information Systems Managers": "IT Managers",
  "Network and Computer Systems Administrators": "Network Administrators",
  "Health Specialties Teachers, Postsecondary": "Health Teachers (college)",
  "Engineering Teachers, Postsecondary": "Engineering Teachers (college)",
  "Business Teachers, Postsecondary": "Business Teachers (college)",
  "Architects, Except Landscape and Naval": "Architects",
  "Web and Digital Interface Designers": "Web Designers",
  "General and Operations Managers": "General Managers",
  "Architectural and Engineering Managers": "Engineering Managers",
  "Bioengineers and Biomedical Engineers": "Bioengineers",
  "Electronics Engineers, Except Computer": "Electronics Engineers",
  "Elementary School Teachers, Except Special Education": "Elementary Teachers",
  "Secondary School Teachers, Except Special and Career/Technical Education": "Secondary Teachers",
  "Medical Scientists, Except Epidemiologists": "Medical Scientists",
  "Financial and Investment Analysts": "Financial Analysts",
  "Computer Occupations, All Other": "Computer Occupations (other)",
  "Physicians, All Other": "Physicians (other)",
};
const shortName = (title) => SHORT[title] || title.replace(", All Other", " (other)").replaceAll(" and ", " & ").split(",")[0];
// Cluster hues in cluster order: the page's navy cluster family, kept apart
// from orange and blue (placed and direct) and the metro-group colours.
const CLUSTER_TOKENS = ["--w4-cluster-0", "--w4-cluster-1", "--w4-cluster-2", "--w4-cluster-3"];

// Label placement: largest occupation first, first free spot wins. A second
// pass lets large or cluster-naming occupations overlap other nodes; a third
// sets them further out with a leader line.
function placeLabels(nodes, P, radius, clusterLabels, { W, legendTop }) {
  const boxes = nodes.map((n) => {
    const [x, y] = P.get(n.id);
    const r = radius(n.filings);
    return [x - r, y - r, x + r, y + r];
  });
  const placed = [];
  const labels = [];
  const clear = (b) => placed.every((q) => b[2] < q[0] || b[0] > q[2] || b[3] < q[1] || b[1] > q[3]);
  const free = (b) => b[0] >= 2 && b[2] <= W - 2 && b[1] >= 2 && b[3] <= legendTop + 6 && clear(b)
    && boxes.every((q) => b[2] < q[0] + 1 || b[0] > q[2] - 1 || b[3] < q[1] + 1 || b[1] > q[3] - 1);
  const loose = (b) => b[0] >= 2 && b[2] <= W - 2 && b[1] >= 2 && clear(b);
  const box = (lx, ly, dy, anchor, tw, th) => {
    const x0 = anchor === "start" ? lx : anchor === "end" ? lx - tw : lx - tw / 2;
    const yb = ly + (dy === 0 ? th / 2 - 2 : 0);
    return { yb, b: [x0 - 2, yb - th + 1, x0 + tw + 2, yb + 3] };
  };
  // A leader line may not pass through a placed label or another node.
  const inside = (px, py, q) => px >= q[0] && px <= q[2] && py >= q[1] && py <= q[3];
  const lineClear = ([x1, y1, x2, y2], id) => {
    for (let i = 1; i <= 12; i += 1) {
      const px = x1 + ((x2 - x1) * i) / 12;
      const py = y1 + ((y2 - y1) * i) / 12;
      if (placed.some((q) => inside(px, py, q))) return false;
      if (boxes.some((q, j) => nodes[j].id !== id && inside(px, py, q))) return false;
    }
    return true;
  };
  const tryAt = (n, offsets, ok, leader) => {
    const [x, y] = P.get(n.id);
    const r = radius(n.filings);
    const big = n.filings >= 30000;
    const text = shortName(n.title);
    const size = fs("small");
    const tw = textWidth(text, "small", big ? 700 : 600);
    const th = size + 2;
    for (const [dx, dy, anchor] of offsets(r, th)) {
      const { yb, b } = box(x + dx, y + dy, dy, anchor, tw, th);
      if (!ok(b)) continue;
      const line = leader ? [x + (dx * r) / Math.hypot(dx, dy), y + (dy * r) / Math.hypot(dx, dy), x + dx, y + dy] : null;
      if (line && !lineClear(line, n.id)) continue;
      placed.push(b);
      labels.push({ id: n.id, x: x + dx, y: yb, anchor, size, weight: big ? 700 : 600, text, leader: line });
      return true;
    }
    return false;
  };
  const near = (r, th) => [[r + 4, 0, "start"], [-r - 4, 0, "end"], [0, -r - 4, "middle"], [0, r + th, "middle"],
    [r + 4, -7, "start"], [r + 4, 7, "start"], [-r - 4, -7, "end"], [-r - 4, 7, "end"],
    [r + 3, -r - 2, "start"], [-r - 3, -r - 2, "end"], [r + 3, r + th - 2, "start"], [-r - 3, r + th - 2, "end"]];
  const relaxed = (r, th) => [[r + 4, 0, "start"], [-r - 4, 0, "end"], [0, -r - 4, "middle"], [0, r + th, "middle"],
    [r + 4, -9, "start"], [-r - 4, -9, "end"], [r + 4, 9, "start"], [-r - 4, 9, "end"]];
  const far = (r) => [18, 30, 44].flatMap((d) => [[r + d, 0, "start"], [-r - d, 0, "end"], [0, -r - d, "middle"], [0, r + d, "middle"],
    [r + d, -d, "start"], [r + d, d, "start"], [-r - d, -d, "end"], [-r - d, d, "end"]]);
  const keyNames = new Set(clusterLabels);
  const important = (n) => n.filings >= 5000 || keyNames.has(n.title);
  const missed = [...nodes].sort((a, b) => b.filings - a.filings).filter((n) => !tryAt(n, near, free));
  for (const n of missed.filter(important)) tryAt(n, relaxed, loose);
  const done = new Set(labels.map((label) => label.id));
  for (const n of missed.filter((item) => !done.has(item.id))) tryAt(n, far, free, true);
  return labels;
}

// The co-hiring network on its precomputed layout (fractions of a 700 x 580 frame).
function renderNetwork(data) {
  const host = $("chart-job-network");
  // An older cached jobs.json has no layout; skip rather than draw at NaN.
  if (!host || !data.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))) return;
  host.replaceChildren(fitted((W) => drawNetwork(data, W), 700));
  bridgeList(data);
}

// The occupation ringed in the network, kept across redraws.
let selectedJob = null;

function drawNetwork(data, W) {
  const H = 580;
  const legendTop = H - 74;
  const P = new Map(data.nodes.map((n) => [n.id, [n.x * W, n.y * H]]));
  const radius = (filings) => Math.max(4.5, Math.min(14, 3.5 + Math.sqrt(filings) / 14));
  const position = new Map(data.clusters.map((group, i) => [group.id, i]));
  const colour = (id) => token(CLUSTER_TOKENS[position.get(id) % CLUSTER_TOKENS.length]);
  const halo = { "paint-order": "stroke", stroke: token("--card"), "stroke-width": 3, "stroke-linejoin": "round" };

  const svg = svgRoot(W, H, "Occupations linked by the companies that file for both; colour is the hiring cluster", "group");
  const maxWeight = Math.max(...data.edges.map((e) => e.weight));
  for (const e of [...data.edges].sort((a, b) => a.weight - b.weight)) {
    const [x1, y1] = P.get(e.source);
    const [x2, y2] = P.get(e.target);
    svg.append(el("line", { x1, y1, x2, y2, stroke: token("--w4-rail-ring"), "stroke-opacity": 0.28, "stroke-width": (0.6 + 2.2 * Math.sqrt(e.weight / maxWeight)).toFixed(2) }));
  }

  const ring = el("circle", { r: 0, fill: "none", stroke: token("--ink"), "stroke-width": 1.5, visibility: "hidden", "pointer-events": "none" });
  selectNode = (id) => {
    selectedJob = id;
    const at = id && P.get(id);
    if (!at) {
      ring.setAttribute("visibility", "hidden");
      return;
    }
    const n = data.nodes.find((item) => item.id === id);
    ring.setAttribute("cx", at[0]);
    ring.setAttribute("cy", at[1]);
    ring.setAttribute("r", radius(n.filings) + 4);
    ring.setAttribute("visibility", "visible");
  };
  const choose = (n) => {
    inspector(n, data);
    selectNode(n.id);
  };
  for (const n of [...data.nodes].sort((a, b) => a.filings - b.filings)) {
    const [cx, cy] = P.get(n.id);
    const where = n.bridge
      ? `bridges the ${clusterName(data, n.clusters[0])} and ${clusterName(data, n.clusters[1])} clusters`
      : `${clusterName(data, n.cluster)} cluster`;
    const g = tip(el("g", { tabindex: 0, role: "button", "aria-label": `${n.title}, ${num(n.filings)} filings, ${where}`, style: "cursor:pointer" }),
      `${n.title}: ${num(n.filings)} filings, ${where}`);
    g.append(el("circle", { cx, cy, r: radius(n.filings), fill: colour(n.cluster),
      stroke: n.bridge ? token("--ink") : token("--card"), "stroke-width": n.bridge ? 2.5 : 1.5 }));
    g.addEventListener("click", () => choose(n));
    g.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      choose(n);
    });
    svg.append(g);
  }
  svg.append(ring);

  const labels = placeLabels(data.nodes, P, radius, data.clusters.map((c) => c.label), { W, legendTop });
  for (const label of labels) {
    if (!label.leader) continue;
    const [x1, y1, x2, y2] = label.leader;
    svg.append(el("line", { x1, y1, x2, y2, stroke: token("--ink-mute"), "stroke-width": 0.8, "pointer-events": "none" }));
  }
  for (const label of labels) {
    svg.append(el("text", { x: label.x.toFixed(1), y: label.y.toFixed(1), "text-anchor": label.anchor, "font-size": label.size,
      "font-weight": label.weight, fill: token("--ink"), "pointer-events": "none", ...halo }, label.text));
  }

  // The cluster key, under the chart.
  let lx = 0;
  let ly = legendTop + 40;
  for (const c of data.clusters) {
    const text = `${shortName(c.label)} cluster (${num(c.occupations)})`;
    svg.append(el("circle", { cx: lx + 6, cy: ly - 4, r: 5, fill: colour(c.id) }));
    svg.append(el("text", { x: lx + 16, y: ly, "font-size": fs("caption"), fill: token("--ink-soft") }, text));
    lx += 16 + textWidth(text, "caption") + 18;
    if (lx > W - 150) {
      lx = 0;
      ly += 18;
    }
  }
  selectNode(selectedJob);
  return svg;
}

// The bridges card's main-claim figure: how many occupations pass each rule,
// real network against its rewired baseline, on the redesign's shared strip form.
function renderBridgeStrip(data) {
  const host = $("chart-job-bridge-rule");
  if (!host) return;
  const br = data.bridges;
  host.append(
    stripChart(
      [{
        label: "First rule",
        sub: "ratio above 1",
        real: br.lift_above_1,
        realLabel: num(br.lift_above_1),
        ref: [br.lift_above_1_by_chance_mean, `rewired ${num(Math.round(br.lift_above_1_by_chance_mean))}`],
      }],
      { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500], fmt: num, labelW: 150, badgeW: 20,
        aria: "Occupations passing the first rule, real against rewired" },
    ),
  );
  host.append(
    stripChart(
      [{
        label: "Strict rule",
        sub: "beats every rewired network",
        bold: true,
        real: br.all_occupations,
        realLabel: num(br.all_occupations),
        ref: [br.expected_false_positives, `by chance ${num(Math.round(br.expected_false_positives))}`],
      }],
      { domain: [0, 25], ticks: [0, 5, 10, 15, 20, 25], fmt: num, labelW: 150, badgeW: 20,
        aria: "Occupations passing the strict rule, against the number expected by chance" },
    ),
  );
}

// What each hiring cluster holds: its occupations split by official major
// group, the three largest named and the rest grey.
function renderGroups(data) {
  const host = $("chart-job-groups");
  if (host && data.clusters.every((c) => c.majors)) host.replaceChildren(fitted((W) => drawGroups(data, W), 640));
  renderNmi(data);
}

function drawGroups(data, W) {
  const pct = (v, n) => `${Math.round((100 * v) / n)}%`;
  const ramp = [1, 0.6, 0.35];
  const accent = token("--w4-accent");
  const rest = token("--line");
  const parts = [];
  let y = 0;
  for (const c of data.clusters) {
    const items = Object.entries(c.majors).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const n = items.reduce((sum, [, v]) => sum + v, 0);
    const others = items.slice(3).reduce((sum, [, v]) => sum + v, 0);
    const segs = items.slice(0, 3).map(([code, v], j) => ({ label: data.majors[code] || `SOC ${code}`, v, fill: accent, opacity: ramp[j], light: j < 2 }));
    if (others) segs.push({ label: "All other groups", v: others, fill: rest, opacity: 1, light: false });
    const head = el("text", { x: 0, y: y + 14, "font-size": fs("small"), "font-weight": 700, fill: token("--ink") }, `${c.label} `);
    head.append(el("tspan", { "font-weight": 400, fill: token("--ink-soft") }, `cluster, ${num(n)} occupations`));
    parts.push(head);
    let x = 0;
    for (const s of segs) {
      const w = (W * s.v) / n;
      const g = tip(el("g"), `${s.label}: ${num(s.v)} of ${num(n)} occupations (${pct(s.v, n)})`);
      g.append(el("rect", { x: x.toFixed(1), y: y + 22, width: Math.max(w - 2, 1).toFixed(1), height: 24, rx: 4, fill: s.fill, "fill-opacity": s.opacity }));
      parts.push(g);
      if (w >= textWidth(pct(s.v, n), "small", 700) + 10) {
        parts.push(el("text", { x: (x + w / 2 - 1).toFixed(1), y: y + 38.5, "text-anchor": "middle", "font-size": fs("small"), "font-weight": 700,
          fill: s.light ? token("--card") : token("--ink"), "pointer-events": "none" }, pct(s.v, n)));
      }
      x += w;
    }
    let lx = 0;
    let ly = y + 64;
    for (const s of segs) {
      const piece = `${s.label} ${num(s.v)}`;
      const wide = 14 + textWidth(piece, "caption");
      if (lx + wide > W) {
        lx = 0;
        ly += 18;
      }
      parts.push(el("rect", { x: lx, y: ly - 9, width: 10, height: 10, rx: 2, fill: s.fill, "fill-opacity": s.opacity }));
      parts.push(el("text", { x: lx + 14, y: ly, "font-size": fs("caption"), fill: token("--ink-soft") }, piece));
      lx += wide + 16;
    }
    y = ly + 28;
  }
  const svg = svgRoot(W, y - 8, "Official major groups inside each hiring cluster");
  svg.append(...parts);
  return svg;
}

// How closely the clusters match the official groups, on NMI's 0 to 1 scale.
function renderNmi(data) {
  const scaleHost = $("chart-job-nmi");
  if (!scaleHost) return;
  scaleHost.replaceChildren(fitted((W) => drawNmi(data, W), 410));
}

function drawNmi(data, W) {
  const caption = fs("caption");
  const q = data.quality;
  const nmi = q.nmi;
  const sm = q.nmi_shuffled.mean;
  const sx = q.nmi_shuffled.max;
  const info = q.infomap.nmi_with_soc;
  const f2 = (v) => v.toFixed(2);
  const a = 14;
  const b = W - 14;
  const xv = (v) => a + (b - a) * v;
  const axy = 96;
  const svg = svgRoot(W, 170, "Match between hiring clusters and official major groups, from 0 to 1");
  const halo = { "paint-order": "stroke", stroke: token("--card"), "stroke-width": 3, "stroke-linejoin": "round" };
  svg.append(el("line", { x1: a, x2: b, y1: axy, y2: axy, stroke: token("--line"), "stroke-width": 6, "stroke-linecap": "round" }));
  for (let i = 0; i <= 4; i += 1) {
    const v = i / 4;
    svg.append(el("line", { x1: xv(v), x2: xv(v), y1: axy + 6, y2: axy + 12, stroke: token("--w4-rail-ring") }));
    svg.append(el("text", { x: xv(v), y: axy + 26, "text-anchor": "middle", "font-size": caption, fill: token("--ink-mute") }, String(v)));
  }
  svg.append(el("text", { x: a, y: axy + 46, "font-size": caption, fill: token("--ink-mute") }, "unrelated"));
  svg.append(el("text", { x: b, y: axy + 46, "text-anchor": "end", "font-size": caption, fill: token("--ink-mute") }, "the same groups"));
  const band = tip(el("g"), `Shuffled official labels: mean ${f2(sm)}, highest of ${num(q.nmi_shuffled.runs)} shuffles ${f2(sx)}`);
  band.append(el("rect", { x: xv(0), y: axy - 8, width: xv(sx) - xv(0), height: 16, rx: 8, fill: token("--w4-band") }));
  svg.append(band);
  svg.append(el("line", { x1: xv(sm), x2: xv(sm), y1: axy - 8, y2: axy - 30, stroke: token("--w4-rail-ring") }));
  svg.append(el("text", { x: xv(sm) + 6, y: axy - 34, "font-size": caption, fill: token("--ink-soft"), ...halo }, `Shuffled labels ${f2(sm)}`));
  svg.append(el("line", { x1: xv(nmi), x2: xv(nmi), y1: axy - 9, y2: axy - 62, stroke: token("--people") }));
  svg.append(el("text", { x: xv(nmi) - 4, y: axy - 66, "font-size": fs("small"), "font-weight": 700, fill: token("--ink"), ...halo }, `Hiring clusters ${f2(nmi)}`));
  svg.append(el("line", { x1: xv(info), x2: xv(info), y1: axy - 8, y2: axy - 20, stroke: token("--ink") }));
  svg.append(el("text", { x: xv(info) + 8, y: axy - 22, "font-size": caption, fill: token("--ink"), ...halo }, `Infomap ${f2(info)}`));
  const infoDot = tip(el("g"), `Infomap clusters against official groups: NMI ${f2(info)}`);
  infoDot.append(el("circle", { cx: xv(info), cy: axy, r: 6, fill: token("--card"), stroke: token("--ink"), "stroke-width": 2 }));
  const louvainDot = tip(el("g"), `Louvain hiring clusters against official groups: NMI ${f2(nmi)}`);
  louvainDot.append(el("circle", { cx: xv(nmi), cy: axy, r: 7.5, fill: token("--people") }));
  svg.append(infoDot, louvainDot);
  return svg;
}

fetch(DATA_URL).then((response) => {
  if (!response.ok) throw new Error(`jobs data ${response.status}`);
  return response.json();
}).then((data) => {
  renderPairs(data);
  renderBridgeStrip(data);
  renderNetwork(data);
  renderGroups(data);
  $("jobs-status").textContent = `${num(data.meta.filings)} certified H-1B filings · ${num(data.meta.occupations)} occupations · ${data.meta.year}`;
  const q = data.quality;
  const fill = {
    occupations: num(data.meta.occupations), nmi: q.nmi.toFixed(2), shuffled: q.nmi_shuffled.mean.toFixed(2),
    ami: q.ami.toFixed(2), scored: num(q.occupations), legacy: `${num(data.meta.legacy_filings_recoded)} filings`,
    years: data.comparison.nmi_between_years.toFixed(2), shared: num(data.comparison.shared_occupations),
    infomap: num(q.infomap.modules_of_two_or_more), "infomap-louvain": q.infomap.nmi_with_louvain.toFixed(2),
    "infomap-soc": q.infomap.nmi_with_soc.toFixed(2),
    "null-real": q.null.real.toFixed(2), "null-null": q.null.null.toFixed(2),
    "null-z": num(Math.round(q.null.z)), "null-runs": num(q.null.runs),
    "runs-nmi": q.louvain.nmi_between_runs_median.toFixed(2),
    "bridges-pass": num(data.bridges.all_occupations), "bridges-tested": num(data.bridges.tested),
    "bridges-chance": num(Math.round(data.bridges.expected_false_positives)),
    lift1: num(data.bridges.lift_above_1), "lift1-chance": num(Math.round(data.bridges.lift_above_1_by_chance_mean)),
    "bb-alpha": String(data.backbone.alpha), "bb-links": num(data.backbone.links),
    "bb-total": num(data.backbone.links_total), "bb-occ": num(data.backbone.occupations_linked),
    "bb-clusters": num(data.backbone.clusters_on_backbone), "bb-nmi": data.backbone.nmi_with_full_clusters.toFixed(2),
    "bb-base": data.backbone.nmi_between_full_runs_median.toFixed(2),
  };
  document.querySelectorAll("[data-jobs]").forEach((el) => { el.textContent = fill[el.dataset.jobs]; });
}).catch((error) => {
  $("jobs-status").textContent = `Jobs section failed to load: ${error.message}`;
});
