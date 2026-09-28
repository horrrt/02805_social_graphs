// Week 4 redesign · the course's four community methods (Girvan–Newman,
// modularity, Louvain, overlapping communities) on the 40 metros, in the deep
// dive's #cut-methods box. Ported from
// review/week04-redesign/generator/explore4.py: every number here is computed
// at runtime from docs/weeks/week04/data/explore.json and
// docs/assets/data/week04_place.json, not typed in by hand. Built lazily: the
// box does nothing until it is first opened.

import { termify } from "./week04-ui.js?v=2";

const EXPLORE_URL = new URL("../../weeks/week04/data/explore.json", import.meta.url);
const PLACE_URL = new URL("../data/week04_place.json", import.meta.url);
const USA_URL = new URL("../data/usa.json", import.meta.url);
const MAP_NAME = "week04-methods-usa";

function $(id) {
  return document.getElementById(id);
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tipHtml(title, rows) {
  const body = rows.map(([k, v]) => `${esc(k)}: <b>${esc(v)}</b>`).join("<br/>");
  return `<div style="font-weight:700;margin-bottom:4px">${esc(title)}</div>${body}`;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function baseOption(token) {
  return {
    animationDuration: 320,
    animationEasing: "cubicOut",
    textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
    tooltip: {
      trigger: "item",
      confine: true,
      backgroundColor: token("--w4-tip-bg"),
      borderWidth: 0,
      padding: [10, 12],
      textStyle: { color: token("--w4-tip-ink"), fontSize: 12 },
    },
  };
}

function geoBase(token) {
  return {
    map: MAP_NAME,
    roam: false,
    // Fit the mainland inside the host, whatever its shape; the map keeps its aspect.
    left: 12,
    right: 12,
    top: 12,
    bottom: 12,
    itemStyle: { areaColor: token("--w4-map-fill"), borderColor: token("--w4-map-edge"), borderWidth: 0.9 },
    emphasis: { disabled: true },
    select: { disabled: true },
    silent: true,
  };
}

/** A steady circle diameter: small metros stay visible, hubs do not swallow the map. */
function makeDotR(cities) {
  const fmax = Math.max(...cities.map((c) => c.filings));
  return (city, min = 8, max = 26) => Math.round(min + (max - min) * Math.sqrt(city.filings / fmax));
}

function setPressed(group, active) {
  group.querySelectorAll("[aria-pressed]").forEach((b) => b.setAttribute("aria-pressed", String(b === active)));
}

function chartFor(echarts, hostId) {
  const host = $(hostId);
  const chart = echarts.init(host, null, { renderer: "canvas" });
  window.addEventListener("resize", () => chart.resize());
  return chart;
}

/** A static-domain line chart: axis, ticks, reference line and the whole
 * series drawn once; only a marker moves as the visitor steps through. */
function buildLineChart(svg, ys, { ref, refLabel, xLabel, fmtY, title, token }) {
  const W = 1000;
  const H = 200;
  const L = 56;
  const R = 20;
  const T = 16;
  const Bm = 36;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "none");
  const n = ys.length;
  const vals = ref != null ? [...ys, ref] : ys;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo) * 0.1 || 0.01;
  const y0 = lo - pad;
  const y1 = hi + pad;
  const X = (i) => L + (i * (W - L - R)) / Math.max(n - 1, 1);
  const Y = (v) => T + ((y1 - v) * (H - T - Bm)) / (y1 - y0);
  const ink = token("--ink");
  const inkSoft = token("--ink-soft");
  const inkMute = token("--ink-mute");
  const line = token("--line");
  const accent = token("--w4-accent");
  const card = token("--card");
  const parts = [`<title>${esc(title)}</title>`];
  for (let k = 0; k <= 4; k++) {
    const v = y0 + ((y1 - y0) * k) / 4;
    const y = Y(v).toFixed(1);
    parts.push(`<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${line}" stroke-width="1"></line>`);
    parts.push(`<text x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" font-size="11" fill="${inkMute}" text-anchor="end">${esc(fmtY(v))}</text>`);
  }
  if (ref != null) {
    const y = Y(ref).toFixed(1);
    parts.push(`<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="${inkMute}" stroke-width="1.4" stroke-dasharray="5 4"></line>`);
    if (refLabel) {
      parts.push(
        `<text x="${W - R}" y="${(Y(ref) - 6).toFixed(1)}" font-size="11" fill="${inkSoft}" text-anchor="end" font-weight="600">${esc(refLabel)}</text>`,
      );
    }
  }
  const d = `M${ys.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" L")}`;
  parts.push(`<path d="${d}" fill="none" stroke="${ink}" stroke-width="2"></path>`);
  if (xLabel) parts.push(`<text x="${W - R}" y="${H - 6}" font-size="11" fill="${inkMute}" text-anchor="end">${esc(xLabel)}</text>`);
  parts.push(`<line class="w4m-marker-line" x1="0" y1="${T - 4}" x2="0" y2="${H - Bm}" stroke="${accent}" stroke-width="1.4"></line>`);
  parts.push(`<circle class="w4m-marker-dot" cx="0" cy="0" r="5.5" fill="${card}" stroke="${accent}" stroke-width="2"></circle>`);
  svg.innerHTML = parts.join("\n");
  const markerLine = svg.querySelector(".w4m-marker-line");
  const markerDot = svg.querySelector(".w4m-marker-dot");
  return {
    move(i) {
      const x = X(i).toFixed(1);
      markerLine.setAttribute("x1", x);
      markerLine.setAttribute("x2", x);
      markerDot.setAttribute("cx", x);
      markerDot.setAttribute("cy", Y(ys[i]).toFixed(1));
    },
  };
}

/** The modularity strip: a band for the rewired baseline, a reference tick
 * for Louvain's score, and a marker for the visitor's current groups. */
function buildStrip(svg, { loQ, hiQ, band, meanQ, refQ, token }) {
  const W = 440;
  const H = 70;
  const Lm = 12;
  const Rm = 12;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "none");
  const SX = (v) => Lm + ((Math.min(Math.max(v, loQ), hiQ) - loQ) * (W - Lm - Rm)) / (hiQ - loQ);
  const ink = token("--ink");
  const inkSoft = token("--ink-soft");
  const inkMute = token("--ink-mute");
  const line = token("--line");
  const bandColor = token("--w4-band");
  const card = token("--card");
  const bx0 = SX(band[0]);
  const bx1 = SX(band[1]);
  const parts = [
    "<title>Your modularity against the rewired networks and Louvain’s</title>",
    `<line x1="${Lm}" y1="30" x2="${W - Rm}" y2="30" stroke="${line}" stroke-width="1"></line>`,
    `<rect x="${bx0.toFixed(1)}" y="24" width="${(bx1 - bx0).toFixed(1)}" height="12" rx="6" fill="${bandColor}"></rect>`,
    `<line x1="${SX(meanQ).toFixed(1)}" y1="21" x2="${SX(meanQ).toFixed(1)}" y2="39" stroke="${inkMute}" stroke-width="2"></line>`,
    `<text x="${SX(meanQ).toFixed(1)}" y="54" font-size="11" fill="${inkSoft}" text-anchor="middle">rewired ${meanQ.toFixed(3)}</text>`,
    `<line x1="${SX(refQ).toFixed(1)}" y1="16" x2="${SX(refQ).toFixed(1)}" y2="44" stroke="${inkSoft}" stroke-width="1.3" stroke-dasharray="3 2"></line>`,
    `<text x="${SX(refQ).toFixed(1)}" y="12" font-size="11" fill="${inkSoft}" text-anchor="middle" font-weight="600">Louvain ${refQ.toFixed(3)}</text>`,
  ];
  for (const v of [-0.02, 0, 0.02, 0.04, 0.06]) {
    parts.push(`<text x="${SX(v).toFixed(1)}" y="68" font-size="10.5" fill="${inkMute}" text-anchor="middle">${v.toFixed(2)}</text>`);
  }
  parts.push(`<circle class="w4m-strip-mk" cx="${SX(0).toFixed(1)}" cy="30" r="7" fill="${ink}" stroke="${card}" stroke-width="2"></circle>`);
  svg.innerHTML = parts.join("\n");
  const marker = svg.querySelector(".w4m-strip-mk");
  return { move: (v) => marker.setAttribute("cx", SX(v).toFixed(1)) };
}

// ================================================================ 1 · Girvan–Newman, one cut at a time

function buildGN(echarts, explore, place, ctx) {
  const { CITY, IDS, NAME, token, dotR } = ctx;
  const gn = explore.girvan_newman;
  const backboneEdges = place.backbone.graphs["0.2"].edges;
  const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const cutStep = new Map(gn.cuts.map((c) => [key(c.edge[0], c.edge[1]), c.step]));
  const edgesOk = backboneEdges.every(([a, b]) => cutStep.has(key(a, b)));
  const n = gn.cuts.length;
  const levels = gn.levels;
  const first0 = { step: 0, components: 1, partition: Object.fromEntries(IDS.map((id) => [id, 0])), Q: 0 };
  const lv = [first0, ...levels];
  const qs = lv.map((l) => l.Q);

  const deg = new Map();
  for (const [a, b] of backboneEdges) {
    deg.set(a, (deg.get(a) || 0) + 1);
    deg.set(b, (deg.get(b) || 0) + 1);
  }
  const hubs = IDS.filter((id) => (deg.get(id) || 0) === IDS.length - 1);
  const hubNamesSorted = hubs.map((h) => NAME[h]).slice().sort();
  const hubsOk = edgesOk && hubs.length === 2 && hubNamesSorted[0] === "Dallas" && hubNamesSorted[1] === "New York";
  const noPositiveSplit = qs.slice(1).every((q) => q < 0);

  let splitsOk = true;
  for (const l of levels) {
    const counts = new Map();
    for (const c of Object.values(l.partition)) counts.set(c, (counts.get(c) || 0) + 1);
    const sizes = [...counts.values()].sort((a, b) => b - a);
    if (!(sizes.slice(1).every((s) => s === 1) || l.components > IDS.length - 5)) splitsOk = false;
  }

  const bestLevel = levels.find((l) => l.step === gn.best.step);
  let firstOutOk = false;
  let firstOutName = "";
  if (bestLevel) {
    const counts = new Map();
    for (const c of Object.values(bestLevel.partition)) counts.set(c, (counts.get(c) || 0) + 1);
    const firstOut = Object.entries(bestLevel.partition)
      .filter(([, c]) => counts.get(c) === 1)
      .map(([id]) => id);
    firstOutOk = firstOut.length === 1 && bestLevel === levels[0];
    if (firstOutOk) firstOutName = NAME[firstOut[0]];
  }

  const hubOrder = hubsOk ? (NAME[hubs[0]] === "New York" ? hubs : [hubs[1], hubs[0]]) : hubs;
  const gnBackgroundOk = hubsOk && noPositiveSplit && splitsOk && firstOutOk;
  if (gnBackgroundOk) {
    $("w4m-gn-hubs").textContent = `${NAME[hubOrder[0]]} and ${NAME[hubOrder[1]]}`;
    $("w4m-gn-first").textContent = firstOutName;
  } else {
    $("w4m-gn-hubs").closest("details").hidden = true;
  }

  $("w4m-gn-lead").textContent =
    gnBackgroundOk && splitsOk && firstOutOk
      ? `Cut the link that carries the most shortest paths, recompute, repeat, and keep the level of pieces with the highest ` +
        `modularity. On the ${backboneEdges.length} backbone links it finds no groups.`
      : `Cut the link that carries the most shortest paths, recompute, repeat, and keep the level of pieces with the highest ` +
        `modularity. On the ${backboneEdges.length} backbone links, no split scores above zero.`;
  termify(
    $("w4m-gn-lead"),
    "modularity",
    "How much more of the link weight falls inside the groups than chance would put there. Higher means sharper groups.",
    "w4-term-w4m-panel-gn-modularity",
  );
  $("w4m-gn-caption").textContent = firstOutOk
    ? `No split scores above zero: the best, which cuts off only ${firstOutName}, scores ${gn.best.Q.toFixed(4)}. The ring marks where you are.`
    : `The best split found scores ${gn.best.Q.toFixed(4)}. The ring marks where you are.`;

  const steps = [];
  let li = 0;
  for (let s = 0; s <= n; s++) {
    while (li + 1 < lv.length && lv[li + 1].step <= s) li++;
    const cur = lv[li];
    const sizes = new Map();
    for (const c of Object.values(cur.partition)) sizes.set(c, (sizes.get(c) || 0) + 1);
    const top3 = [...sizes.entries()]
      .sort((a, b) => b[1] - a[1] || (String(a[0]) < String(b[0]) ? -1 : 1))
      .slice(0, 3)
      .map(([lab]) => lab);
    const fills = {};
    for (const id of IDS) {
      const lab = cur.partition[id];
      const rank = top3.indexOf(lab);
      fills[id] = rank >= 0 && sizes.get(lab) > 1 ? rank : null;
    }
    const next = s < n ? gn.cuts[s] : null;
    const sizeList = [...sizes.values()].sort((a, b) => b - a);
    steps.push({
      fills,
      comps: cur.components,
      sizesText: sizeList.slice(0, 4).join(" · ") + (sizes.size > 4 ? " …" : ""),
      Q: cur.Q,
      nextText: next ? `${NAME[next.edge[0]]}–${NAME[next.edge[1]]}` : "none left",
      bet: next ? next.betweenness.toFixed(1) : "–",
      nextEdge: next ? next.edge : null,
      li,
    });
  }
  const splitSteps = [...new Set(levels.map((l) => l.step))].sort((a, b) => a - b);
  const ramp = [token("--ink"), token("--ink-soft"), token("--ink-mute")];

  const chart = chartFor(echarts, "w4m-gn-map");
  const lineChart = buildLineChart($("w4m-gn-chart"), qs, {
    ref: 0,
    refLabel: "0: the backbone as one piece",
    xLabel: "split →",
    fmtY: (v) => v.toFixed(2),
    title: "Modularity of the pieces after each split",
    token,
  });

  function pieceDesc(st, id) {
    return st.fills[id] != null ? "In one of the three largest pieces at this step" : "Alone, or in a smaller piece";
  }

  function render(s) {
    const st = steps[s];
    const linesData = backboneEdges.map(([a, b]) => {
      const cut = cutStep.get(key(a, b)) <= s;
      return {
        coords: [
          [CITY[a].lon, CITY[a].lat],
          [CITY[b].lon, CITY[b].lat],
        ],
        lineStyle: { color: token("--ink"), opacity: cut ? 0.18 : 0.5, width: cut ? 0.8 : 1.4, type: cut ? "dashed" : "solid" },
      };
    });
    const nextLine = st.nextEdge
      ? [
          {
            coords: [
              [CITY[st.nextEdge[0]].lon, CITY[st.nextEdge[0]].lat],
              [CITY[st.nextEdge[1]].lon, CITY[st.nextEdge[1]].lat],
            ],
            lineStyle: { color: token("--ink"), width: 4, opacity: 0.85 },
          },
        ]
      : [];
    const dots = IDS.map((id) => {
      const city = CITY[id];
      const rank = st.fills[id];
      return {
        id,
        name: city.name,
        value: [city.lon, city.lat],
        symbolSize: dotR(city),
        itemStyle:
          rank != null
            ? { color: ramp[rank], borderColor: token("--card"), borderWidth: 1.2 }
            : { color: "transparent", borderColor: token("--ink-mute"), borderWidth: 1.4 },
      };
    });
    chart.setOption(
      {
        ...baseOption(token),
        geo: geoBase(token),
        series: [
          { type: "lines", coordinateSystem: "geo", zlevel: 1, silent: true, data: linesData },
          { type: "lines", coordinateSystem: "geo", zlevel: 2, silent: true, data: nextLine },
          { type: "scatter", coordinateSystem: "geo", zlevel: 3, data: dots },
        ],
        tooltip: {
          ...baseOption(token).tooltip,
          formatter: (p) => (p.data?.id ? tipHtml(CITY[p.data.id].name, [["Piece", pieceDesc(st, p.data.id)]]) : ""),
        },
      },
      { notMerge: true },
    );
    $("w4m-gn-step").textContent = `${s} of ${n}`;
    $("w4m-gn-comps").textContent = String(st.comps);
    $("w4m-gn-sizes").textContent = st.sizesText;
    $("w4m-gn-next").textContent = st.nextText;
    $("w4m-gn-bet").textContent = st.bet;
    $("w4m-gn-q").textContent = st.Q.toFixed(4);
    lineChart.move(st.li);
  }

  let s = 0;
  function go(v) {
    s = Math.max(0, Math.min(n, v));
    render(s);
  }
  $("w4m-panel-gn")
    .querySelectorAll("[data-act]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        if (act === "step") go(s + 1);
        else if (act === "back") go(s - 1);
        else if (act === "reset") go(0);
        else if (act === "split") {
          const nxt = splitSteps.find((x) => x > s);
          go(nxt === undefined ? n : nxt);
        }
      });
    });
  render(0);
}

// ================================================================ 2 · Move a metro, watch modularity

function buildMod(echarts, explore, place, ctx) {
  const { CITY, IDS, GROUP, GROUP_COLOR, token, dotR } = ctx;
  const full = explore.full;
  const nm = place.null_model;
  const edges = full.edges;
  const total = full.total_weight;
  const PAGE = { ...GROUP };
  const strength = Object.fromEntries(IDS.map((id) => [id, 0]));
  for (const [a, b, w] of edges) {
    strength[a] += w;
    strength[b] += w;
  }

  function computeQ(g) {
    const inside = [0, 0, 0];
    const tot = [0, 0, 0];
    for (const [a, b, w] of edges) if (g[a] === g[b]) inside[g[a]] += w;
    for (const id of IDS) tot[g[id]] += strength[id];
    let Q = 0;
    for (let c = 0; c < 3; c++) Q += inside[c] / total - (tot[c] / (2 * total)) ** 2;
    return Q;
  }

  $("w4m-mod-lead").textContent =
    `Click a metro to move it to the next group and watch modularity, the share of link weight inside the groups minus what ` +
    `chance would put there. Louvain’s three groups score ${full.Q_page_partition.toFixed(3)}; shuffled labels, or one big ` +
    `group, score about zero.`;
  $("w4m-mod-q-label").textContent = `modularity of your three groups, on all ${edges.length} weighted links`;

  const chart = chartFor(echarts, "w4m-mod-map");
  const strip = buildStrip($("w4m-mod-strip"), {
    loQ: -0.02,
    hiQ: 0.07,
    band: [nm.Q_null_mean - nm.Q_null_std, nm.Q_null_mean + nm.Q_null_std],
    meanQ: nm.Q_null_mean,
    refQ: full.Q_page_partition,
    token,
  });

  let g = { ...PAGE };
  let last = "none yet";

  function render() {
    const Q = computeQ(g);
    const sizes = [0, 0, 0];
    for (const id of IDS) sizes[g[id]] += 1;
    const dots = IDS.map((id) => {
      const city = CITY[id];
      return {
        id,
        name: city.name,
        value: [city.lon, city.lat],
        symbolSize: dotR(city),
        itemStyle: { color: GROUP_COLOR[g[id]], borderColor: token("--card"), borderWidth: 1.2 },
      };
    });
    chart.setOption(
      {
        ...baseOption(token),
        geo: geoBase(token),
        series: [{ type: "scatter", coordinateSystem: "geo", zlevel: 2, data: dots, cursor: "pointer" }],
        tooltip: {
          ...baseOption(token).tooltip,
          formatter: (p) => (p.data?.id ? tipHtml(CITY[p.data.id].name, [["Group", `Group ${g[p.data.id] + 1}`]]) : ""),
        },
      },
      { notMerge: true },
    );
    chart.off("click");
    chart.on("click", (ev) => {
      if (!ev.data?.id) return;
      const id = ev.data.id;
      g = { ...g, [id]: (g[id] + 1) % 3 };
      last = `${CITY[id].name} to group ${g[id] + 1}`;
      render();
    });
    strip.move(Q);
    $("w4m-mod-q").textContent = Q.toFixed(3);
    $("w4m-mod-sizes").textContent = sizes.join(" · ");
    $("w4m-mod-last").textContent = last;
  }

  $("w4m-panel-mod")
    .querySelectorAll("[data-act]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        if (act === "reset") {
          g = { ...PAGE };
          last = "back to Louvain’s groups";
        } else if (act === "one") {
          g = Object.fromEntries(IDS.map((id) => [id, 0]));
          last = "everyone in one group";
        } else if (act === "shuffle") {
          const labs = IDS.map((id) => g[id]);
          for (let i = labs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [labs[i], labs[j]] = [labs[j], labs[i]];
          }
          g = Object.fromEntries(IDS.map((id, i) => [id, labs[i]]));
          last = "labels shuffled, sizes kept";
        }
        render();
      });
    });
  render();
}

// ================================================================ 3 · Louvain, move by move

function buildLouvain(echarts, explore, place, ctx) {
  const { CITY, IDS, NAME, GROUP, GROUP_COLOR, token, dotR } = ctx;
  const louvain = explore.louvain;
  const nm = place.null_model;
  const final = louvain.final.partition;

  const seq = [];
  for (const level of louvain.levels) {
    const members = level.members;
    const labels = { ...level.partition_start };
    if (seq.length === 0) {
      seq.push({ lab: { ...labels }, Q: level.Q_start, moved: [], level: level.level, gain: null });
    }
    for (const mv of level.moves) {
      for (const m of members[mv.node]) labels[m] = mv.to;
      seq.push({ lab: { ...labels }, Q: mv.Q, moved: members[mv.node].slice(), level: level.level, gain: mv.gain });
    }
  }

  const steps = seq.map((sq) => {
    const comm = new Map();
    for (const [id, lab] of Object.entries(sq.lab)) {
      if (!comm.has(lab)) comm.set(lab, []);
      comm.get(lab).push(id);
    }
    const fills = {};
    for (const [, ms] of comm) {
      if (ms.length < 2) {
        for (const m of ms) fills[m] = null;
        continue;
      }
      const votes = new Map();
      for (const m of ms) votes.set(final[m], (votes.get(final[m]) || 0) + 1);
      let fg = null;
      let best = -1;
      for (const [lab, c] of votes) {
        if (c > best) {
          best = c;
          fg = lab;
        }
      }
      let pageG = null;
      let pageBest = -1;
      for (const cand of new Set(ms.filter((m) => final[m] === fg).map((m) => GROUP[m]))) {
        const c = ms.filter((m) => GROUP[m] === cand).length;
        if (c > pageBest) {
          pageBest = c;
          pageG = cand;
        }
      }
      for (const m of ms) fills[m] = pageG;
    }
    const moved = sq.moved;
    let h = null;
    if (moved.length === 1) {
      const city = CITY[moved[0]];
      h = { x: city.lon, y: city.lat, r: dotR(city) };
    }
    const movedNames = moved.length
      ? moved
          .slice(0, 3)
          .map((m) => NAME[m])
          .join(", ") + (moved.length > 3 ? ` and ${moved.length - 3} more` : "")
      : "none yet";
    return {
      fills,
      n: comm.size,
      Q: sq.Q,
      moved: movedNames,
      level: sq.level + 1,
      gain: sq.gain == null ? "–" : `+${sq.gain.toFixed(4)}`,
      h,
    };
  });

  const qs = steps.map((st) => st.Q);
  const levelEnds = [];
  let cum = 0;
  for (const level of louvain.levels) {
    cum += level.moves.length;
    levelEnds.push(cum);
  }

  const lv0 = louvain.levels[0];
  const lvlLast = louvain.levels[louvain.levels.length - 1];
  const assumptionsOk = louvain.final.nmi_with_page === 1 && louvain.levels.length === 2 && lvlLast.moves.length === 0;
  const WORDS = { 2: "two", 3: "three", 4: "four", 5: "five" };
  if (assumptionsOk) {
    $("w4m-louvain-seed").textContent = String(louvain.seed);
    $("w4m-louvain-links").textContent = String(explore.full.edges.length);
    $("w4m-louvain-q-from").textContent = lv0.Q_start.toFixed(3);
    $("w4m-louvain-q-to").textContent = louvain.final.Q.toFixed(3);
  } else {
    $("w4m-louvain-seed").closest("details").hidden = true;
  }
  $("w4m-louvain-lead").textContent = assumptionsOk
    ? `Louvain starts with every metro alone and moves one at a time to the neighbouring community that raises modularity most. ` +
      `In this run, ${lv0.moves.length} moves over ${WORDS[lv0.sweeps] || lv0.sweeps} sweeps land on the page’s ` +
      `${WORDS[lv0.communities] || lv0.communities} metro groups.`
    : `Louvain starts with every metro alone and moves one at a time to the neighbouring community that raises modularity most, ` +
      `landing on ${louvain.final.Q.toFixed(3)} over ${louvain.levels.length} levels.`;

  const chart = chartFor(echarts, "w4m-louvain-map");
  const lineChart = buildLineChart($("w4m-louvain-chart"), qs, {
    ref: nm.Q_null_mean,
    refLabel: `rewired networks ${nm.Q_null_mean.toFixed(3)}`,
    xLabel: "move →",
    fmtY: (v) => v.toFixed(2),
    title: "Modularity after each move",
    token,
  });

  function render(i) {
    const st = steps[i];
    const dots = IDS.map((id) => {
      const city = CITY[id];
      const g = st.fills[id];
      return {
        id,
        name: city.name,
        value: [city.lon, city.lat],
        symbolSize: dotR(city),
        itemStyle:
          g != null
            ? { color: GROUP_COLOR[g], borderColor: token("--card"), borderWidth: 1.2 }
            : { color: "transparent", borderColor: token("--ink-mute"), borderWidth: 1.4 },
      };
    });
    const ring = st.h
      ? [
          {
            value: [st.h.x, st.h.y],
            symbolSize: 2 * st.h.r + 10,
            itemStyle: { color: "transparent", borderColor: token("--ink"), borderWidth: 2.4 },
          },
        ]
      : [];
    chart.setOption(
      {
        ...baseOption(token),
        geo: geoBase(token),
        series: [
          { type: "scatter", coordinateSystem: "geo", zlevel: 2, data: dots },
          { type: "scatter", coordinateSystem: "geo", zlevel: 3, silent: true, data: ring },
        ],
        tooltip: {
          ...baseOption(token).tooltip,
          formatter: (p) =>
            p.data?.id
              ? tipHtml(CITY[p.data.id].name, [["Community", st.fills[p.data.id] != null ? `Group ${st.fills[p.data.id] + 1}` : "Alone"]])
              : "",
        },
      },
      { notMerge: true },
    );
    $("w4m-louvain-q").textContent = st.Q.toFixed(3);
    $("w4m-louvain-n").textContent = String(st.n);
    $("w4m-louvain-step").textContent = `${i} of ${steps.length - 1}`;
    $("w4m-louvain-level").textContent = String(st.level);
    $("w4m-louvain-moved").textContent = st.moved;
    $("w4m-louvain-gain").textContent = st.gain;
    lineChart.move(i);
  }

  let s = 0;
  function go(v) {
    s = Math.max(0, Math.min(steps.length - 1, v));
    render(s);
  }
  $("w4m-panel-louvain")
    .querySelectorAll("[data-act]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        if (act === "step") go(s + 1);
        else if (act === "back") go(s - 1);
        else if (act === "reset") go(0);
        else if (act === "level") {
          const e = levelEnds.find((x) => x > s);
          go(e === undefined ? steps.length - 1 : e);
        }
      });
    });
  render(0);
}

// ================================================================ 4 · Overlap: k-cliques and link communities

function buildOverlap(echarts, explore, place, ctx) {
  const { CITY, IDS, NAME, token, dotR } = ctx;
  const kc = explore.k_cliques.by_k;
  const lc = explore.link_communities;
  const baseEdges = place.backbone.graphs["0.2"].edges;

  const ks = ["3", "4", "5", "6"];
  const ksOk = ks.every((k) => kc[k] && kc[k].communities.length === 1);
  $("w4m-overlap-lead").textContent = ksOk
    ? `A partition puts each metro in one group; these two methods let it sit in several. Clique percolation finds a single ` +
      `community at every k from ${ks[0]} to ${ks[ks.length - 1]}.`
    : `A partition puts each metro in one group; these two methods let it sit in several. Clique percolation finds a small ` +
      `number of overlapping communities at each k.`;
  termify(
    $("w4m-overlap-lead"),
    "Clique percolation",
    "Grows groups from cliques: sets of k metros that all link to each other. Cliques that overlap in almost every " +
      "metro join the same group.",
    "w4-term-w4m-panel-overlap-clique",
  );

  const views = {};
  for (const k of ks) {
    const g = kc[k];
    if (!g) continue;
    const comms = g.communities;
    const two = new Set(g.in_two_or_more);
    const noneCount = g.in_none.length;
    views[`k${k}`] = {
      title: `k = ${k}`,
      count: comms.length,
      extra:
        comms.length === 1
          ? noneCount === 0
            ? "One community holding every metro."
            : `One community; ${noneCount} metros left out, drawn hollow.`
          : `${two.size} metros in two or more, ${noneCount} in none`,
      items: comms.map((com, j) => {
        const sorted = [...com].sort((a, b) => CITY[b].filings - CITY[a].filings);
        const names = sorted
          .slice(0, 6)
          .map((c) => NAME[c])
          .join(", ") + (sorted.length > 6 ? ` and ${sorted.length - 6} more` : "");
        return { key: `k${k}_${j}`, members: sorted, names, edges: null };
      }),
      two,
    };
  }
  const twoL = Object.entries(lc.by_metro)
    .filter(([, cs]) => cs.length >= 2)
    .map(([id]) => id)
    .sort();
  const twoLSet = new Set(twoL);
  const most = [...twoL].sort(
    (a, b) => lc.by_metro[b].length - lc.by_metro[a].length || CITY[b].filings - CITY[a].filings,
  ).slice(0, 2);
  views.link = {
    title: "link communities",
    count: lc.communities.length,
    extra:
      most.length === 2 && lc.by_metro[most[0]].length === lc.by_metro[most[1]].length
        ? `${twoL.length} metros sit in two or more: ${NAME[most[0]]} and ${NAME[most[1]]} in ${lc.by_metro[most[0]].length} each.`
        : `${twoL.length} metros sit in two or more.`,
    items: lc.communities.map((com, j) => {
      const members = [...new Set(com.flat())].sort((a, b) => CITY[b].filings - CITY[a].filings);
      const names = members
        .slice(0, 6)
        .map((c) => NAME[c])
        .join(", ") + (members.length > 6 ? ` and ${members.length - 6} more` : "");
      return { key: `l_${j}`, members, names, edges: com };
    }),
    two: twoLSet,
  };
  // A k-clique community has no edge list of its own in the source data: the
  // edges shown for it are the backbone links with both ends inside it.
  const edgeSet = new Set(baseEdges.map(([a, b]) => (a < b ? `${a}|${b}` : `${b}|${a}`)));
  for (const k of ks) {
    const v = views[`k${k}`];
    if (!v) continue;
    for (const item of v.items) {
      const ms = new Set(item.members);
      item.edges = baseEdges.filter(([a, b]) => ms.has(a) && ms.has(b) && edgeSet.has(a < b ? `${a}|${b}` : `${b}|${a}`));
    }
  }

  const chart = chartFor(echarts, "w4m-overlap-map");
  let mode = "link";
  let j = 0;

  function currentItem() {
    const v = views[mode];
    if (!v.items.length) return { view: v, item: { members: [], names: "No community at this setting.", edges: [] } };
    return { view: v, item: v.items[j % v.items.length] };
  }

  function render() {
    const { view, item } = currentItem();
    const inItem = new Set(item.members);
    const memberEdgeKeys = new Set((item.edges || []).map((e) => (e[0] < e[1] ? `${e[0]}|${e[1]}` : `${e[1]}|${e[0]}`)));
    const baseLines = baseEdges.map(([a, b]) => ({
      coords: [
        [CITY[a].lon, CITY[a].lat],
        [CITY[b].lon, CITY[b].lat],
      ],
      lineStyle: { color: token("--ink-mute"), opacity: 0.3, width: 0.8 },
    }));
    const hiLines = baseEdges
      .filter(([a, b]) => memberEdgeKeys.has(a < b ? `${a}|${b}` : `${b}|${a}`))
      .map(([a, b]) => ({
        coords: [
          [CITY[a].lon, CITY[a].lat],
          [CITY[b].lon, CITY[b].lat],
        ],
        lineStyle: { color: token("--ink"), opacity: 0.9, width: 2.4 },
      }));
    const dots = IDS.map((id) => {
      const city = CITY[id];
      return {
        id,
        name: city.name,
        value: [city.lon, city.lat],
        symbolSize: dotR(city),
        itemStyle: inItem.has(id)
          ? { color: token("--ink"), borderColor: token("--card"), borderWidth: 1.2 }
          : { color: "transparent", borderColor: token("--ink-mute"), borderWidth: 1.2 },
      };
    });
    const rings = IDS.filter((id) => view.two.has(id)).map((id) => {
      const city = CITY[id];
      return {
        value: [city.lon, city.lat],
        symbolSize: dotR(city) + 8,
        itemStyle: { color: "transparent", borderColor: token("--ink"), borderWidth: 1.6 },
      };
    });
    chart.setOption(
      {
        ...baseOption(token),
        geo: geoBase(token),
        series: [
          { type: "lines", coordinateSystem: "geo", zlevel: 1, silent: true, data: baseLines },
          { type: "lines", coordinateSystem: "geo", zlevel: 2, silent: true, data: hiLines },
          { type: "scatter", coordinateSystem: "geo", zlevel: 3, data: dots },
          { type: "scatter", coordinateSystem: "geo", zlevel: 4, silent: true, data: rings },
        ],
        tooltip: {
          ...baseOption(token).tooltip,
          formatter: (p) =>
            p.data?.id
              ? tipHtml(CITY[p.data.id].name, [
                  ["In this community", inItem.has(p.data.id) ? "yes" : "no"],
                  ["In two or more at this setting", view.two.has(p.data.id) ? "yes" : "no"],
                ])
              : "",
        },
      },
      { notMerge: true },
    );
    $("w4m-overlap-count").textContent = String(view.count);
    $("w4m-overlap-title").textContent = view.title;
    $("w4m-overlap-extra").textContent = view.extra;
    $("w4m-overlap-which").textContent = view.items.length ? `${(j % view.items.length) + 1} of ${view.items.length}` : "none";
    $("w4m-overlap-names").textContent = item.names;
  }

  $("w4m-overlap-modes")
    .querySelectorAll("[data-mode]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        j = 0;
        setPressed($("w4m-overlap-modes"), btn);
        render();
      });
    });
  $("w4m-overlap-modes")
    .querySelectorAll('[data-act="next"]')
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        j += 1;
        render();
      });
    });
  render();
}

// ================================================================ boot

let built = false;
let ready = false;

// Press the tab the deep dive asked for (root.dataset.want), once the tabs work.
function showWanted() {
  const root = $("w4m-root");
  const want = root && root.dataset.want;
  const tab = want && $(`w4m-tab-${want}`);
  if (ready && tab && tab.getAttribute("aria-pressed") !== "true") tab.click();
}

async function build() {
  if (built) return;
  built = true;
  const status = $("methods-status");
  try {
    if (!window.echarts) await loadScript("../../assets/vendor/echarts-5.5.1.min.js");
    const echarts = window.echarts;
    const [explore, place, usa] = await Promise.all([
      fetch(EXPLORE_URL).then((r) => {
        if (!r.ok) throw new Error(`explore data ${r.status}`);
        return r.json();
      }),
      fetch(PLACE_URL).then((r) => {
        if (!r.ok) throw new Error(`place data ${r.status}`);
        return r.json();
      }),
      fetch(USA_URL).then((r) => {
        if (!r.ok) throw new Error(`usa map ${r.status}`);
        return r.json();
      }),
    ]);

    // No top-40 metro lies outside the contiguous states; drawing Alaska,
    // Hawaii and Puerto Rico shrank the 48 states to a corner of the map.
    const OFF_MAINLAND = new Set(["Alaska", "Hawaii", "Puerto Rico"]);
    echarts.registerMap(MAP_NAME, { ...usa, features: usa.features.filter((f) => !OFF_MAINLAND.has(f.properties.name)) });

    const css = getComputedStyle(document.body);
    const token = (name) => css.getPropertyValue(name).trim();
    const CITY = Object.fromEntries(place.cities.map((c) => [c.id, c]));
    const IDS = explore.metros.map((m) => m.id);
    const NAME = Object.fromEntries(explore.metros.map((m) => [m.id, m.name]));
    const GROUP = Object.fromEntries(explore.metros.map((m) => [m.id, m.community]));
    const GROUP_COLOR = [0, 1, 2].map((g) => token(`--w4-group-${g}`));
    const dotR = makeDotR(place.cities);
    const ctx = { CITY, IDS, NAME, GROUP, GROUP_COLOR, token, dotR };

    buildGN(echarts, explore, place, ctx);
    buildMod(echarts, explore, place, ctx);
    buildLouvain(echarts, explore, place, ctx);
    buildOverlap(echarts, explore, place, ctx);

    document.querySelectorAll(".w4m-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".w4m-tab").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        document.querySelectorAll(".w4m-panel").forEach((p) => {
          p.hidden = p.dataset.panel !== btn.dataset.panel;
        });
        window.dispatchEvent(new Event("resize"));
      });
    });

    $("w4m-root").hidden = false;
    ready = true;
    showWanted();
    if (status) status.remove();
    // The maps were set up while their container was hidden; size them now it shows.
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  } catch (err) {
    console.error(err);
    if (status) status.textContent = `Community explorables failed to load: ${err.message}`;
  }
}

// The deep dive's contents link to a method by its panel; the router sends
// w4m:show with { panel: "gn" | "mod" | "louvain" | "overlap" }.
const methodsRoot = $("w4m-root");
if (methodsRoot) {
  methodsRoot.addEventListener("w4m:show", (event) => {
    const panel = event.detail && event.detail.panel;
    if (!panel) return;
    methodsRoot.dataset.want = panel;
    showWanted();
  });
}

const details = $("cut-methods");
if (details) {
  if (details.open) build();
  details.addEventListener("toggle", () => {
    if (details.open) build();
  });
}
