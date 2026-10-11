// Week 4 redesign · the course's four community methods (Girvan–Newman,
// modularity, Louvain, overlapping communities) on the 40 metros, in the deep
// dive's #cut-methods box. Ported from
// review/week04-redesign/generator/explore4.py: every number here is computed
// at runtime from public/weeks/week04/data/explore.json and
// public/assets/data/week04_place.json, not typed in by hand. This module
// holds the models and the ECharts options; the box itself is
// src/features/week04/methods/Methods.tsx, built lazily when first opened.
// `token(name)` reads one of the page's colour tokens; `T` is the type scale.

export const MAP_NAME = "week04-methods-usa";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// One key per undirected link, whichever end comes first.
export function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function countBy(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  return counts;
}

// The first `max` names, then "and N more" for the rest.
function nameList(ids, NAME, max) {
  const shown = ids.slice(0, max).map((id) => NAME[id]).join(", ");
  return ids.length > max ? `${shown} and ${ids.length - max} more` : shown;
}

function tipHtml(title, rows) {
  const body = rows.map(([k, v]) => `${esc(k)}: <b>${esc(v)}</b>`).join("<br/>");
  return `<div style="font-weight:700;margin-bottom:4px">${esc(title)}</div>${body}`;
}

/** The tokens the methods read. */
export const METHOD_TOKENS = [
  "--w4-tip-bg",
  "--w4-tip-ink",
  "--w4-map-fill",
  "--w4-map-edge",
  "--ink",
  "--ink-soft",
  "--ink-mute",
  "--ink-mute-text",
  "--line",
  "--w4-accent",
  "--card",
  "--w4-band",
  "--w4-group-0",
  "--w4-group-1",
  "--w4-group-2",
];

function baseOption(token, T) {
  return {
    animationDuration: 320,
    animationEasing: "cubicOut",
    textStyle: { fontFamily: T.family("sans"), fontSize: T.fs("caption") },
    tooltip: {
      trigger: "item",
      confine: true,
      backgroundColor: token("--w4-tip-bg"),
      borderWidth: 0,
      padding: [10, 12],
      textStyle: { color: token("--w4-tip-ink"), fontSize: T.fs("small") },
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

/** The lookups every method shares. */
export function methodsContext(explore, place) {
  const CITY = Object.fromEntries(place.cities.map((c) => [c.id, c]));
  const IDS = explore.metros.map((m) => m.id);
  const NAME = Object.fromEntries(explore.metros.map((m) => [m.id, m.name]));
  const GROUP = Object.fromEntries(explore.metros.map((m) => [m.id, m.community]));
  return { CITY, IDS, NAME, GROUP, dotR: makeDotR(place.cities) };
}

/** A static-domain line chart's geometry: axis, ticks, reference line and the series; `marker(i)` places the marker. */
export function lineChartLayout(ys, { ref }, W, H) {
  const L = 56;
  const R = 20;
  const T = 16;
  const Bm = 36;
  const n = ys.length;
  const vals = ref != null ? [...ys, ref] : ys;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo) * 0.1 || 0.01;
  const y0 = lo - pad;
  const y1 = hi + pad;
  const X = (i) => L + (i * (W - L - R)) / Math.max(n - 1, 1);
  const Y = (v) => T + ((y1 - v) * (H - T - Bm)) / (y1 - y0);
  const ticks = [];
  for (let k = 0; k <= 4; k++) {
    const v = y0 + ((y1 - y0) * k) / 4;
    ticks.push({ v, y: Y(v).toFixed(1), ty: (Y(v) + 4).toFixed(1) });
  }
  return {
    L, R, T, Bm, ticks,
    ref: ref != null ? { y: Y(ref).toFixed(1), ty: (Y(ref) - 6).toFixed(1) } : null,
    d: `M${ys.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" L")}`,
    marker: (i) => ({ x: X(i).toFixed(1), y: Y(ys[i]).toFixed(1) }),
  };
}

/** The modularity strip's scale: SX(v) at width W. */
export function stripScale({ loQ, hiQ }, W) {
  const Lm = 12;
  const Rm = 12;
  return { Lm, Rm, SX: (v) => Lm + ((Math.min(Math.max(v, loQ), hiQ) - loQ) * (W - Lm - Rm)) / (hiQ - loQ) };
}

// ================================================================ 1 · Girvan–Newman, one cut at a time

export function gnModel(explore, place, ctx) {
  const { IDS, NAME } = ctx;
  const gn = explore.girvan_newman;
  const backboneEdges = place.backbone.graphs["0.2"].edges;
  const cutStep = new Map(gn.cuts.map((c) => [edgeKey(c.edge[0], c.edge[1]), c.step]));
  const edgesOk = backboneEdges.every(([a, b]) => cutStep.has(edgeKey(a, b)));
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
  const hubNamesSorted = hubs.map((h) => NAME[h]).sort();
  const hubsOk = edgesOk && hubs.length === 2 && hubNamesSorted[0] === "Dallas" && hubNamesSorted[1] === "New York";
  const noPositiveSplit = qs.slice(1).every((q) => q < 0);

  let splitsOk = true;
  for (const l of levels) {
    const sizes = [...countBy(Object.values(l.partition)).values()].sort((a, b) => b - a);
    if (!(sizes.slice(1).every((s) => s === 1) || l.components > IDS.length - 5)) splitsOk = false;
  }

  const bestLevel = levels.find((l) => l.step === gn.best.step);
  let firstOutOk = false;
  let firstOutName = "";
  if (bestLevel) {
    const counts = countBy(Object.values(bestLevel.partition));
    const firstOut = Object.entries(bestLevel.partition)
      .filter(([, c]) => counts.get(c) === 1)
      .map(([id]) => id);
    firstOutOk = firstOut.length === 1 && bestLevel === levels[0];
    if (firstOutOk) firstOutName = NAME[firstOut[0]];
  }

  const hubOrder = hubsOk ? (NAME[hubs[0]] === "New York" ? hubs : [hubs[1], hubs[0]]) : hubs;
  const backgroundOk = hubsOk && noPositiveSplit && splitsOk && firstOutOk;

  const leadStart =
    `Cut the link that carries the most shortest paths, recompute, repeat, and keep the level of pieces with the highest ` +
    `modularity. On the ${backboneEdges.length} backbone links`;
  const lead = backgroundOk ? `${leadStart} it finds no groups.` : `${leadStart}, no split scores above zero.`;
  const caption = firstOutOk
    ? `No split scores above zero: the best, which cuts off only ${firstOutName}, scores ${gn.best.Q.toFixed(4)}. The ring marks where you are.`
    : `The best split found scores ${gn.best.Q.toFixed(4)}. The ring marks where you are.`;

  const steps = [];
  let li = 0;
  for (let s = 0; s <= n; s++) {
    while (li + 1 < lv.length && lv[li + 1].step <= s) li++;
    const cur = lv[li];
    const sizes = countBy(Object.values(cur.partition));
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
  return {
    n,
    qs,
    steps,
    splitSteps,
    backboneEdges,
    cutStep,
    lead,
    caption,
    background: backgroundOk ? { hubs: `${NAME[hubOrder[0]]} and ${NAME[hubOrder[1]]}`, first: firstOutName } : null,
  };
}

/** The Girvan–Newman step `s` reached by a button: "step", "back", "reset" or "split". */
export function gnGo(m, s, act) {
  const clamp = (v) => Math.max(0, Math.min(m.n, v));
  if (act === "step") return clamp(s + 1);
  if (act === "back") return clamp(s - 1);
  if (act === "reset") return 0;
  const nxt = m.splitSteps.find((x) => x > s);
  return clamp(nxt === undefined ? m.n : nxt);
}

export function gnOption(m, ctx, s, token, T) {
  const { CITY, IDS, dotR } = ctx;
  const st = m.steps[s];
  const ramp = [token("--ink"), token("--ink-soft"), token("--ink-mute")];
  const linesData = m.backboneEdges.map(([a, b]) => {
    const cut = m.cutStep.get(edgeKey(a, b)) <= s;
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
  const pieceDesc = (id) => (st.fills[id] != null ? "In one of the three largest pieces at this step" : "Alone, or in a smaller piece");
  const base = baseOption(token, T);
  return {
    ...base,
    geo: geoBase(token),
    series: [
      { type: "lines", coordinateSystem: "geo", zlevel: 1, silent: true, data: linesData },
      { type: "lines", coordinateSystem: "geo", zlevel: 2, silent: true, data: nextLine },
      { type: "scatter", coordinateSystem: "geo", zlevel: 3, data: dots },
    ],
    tooltip: {
      ...base.tooltip,
      formatter: (p) => (p.data?.id ? tipHtml(CITY[p.data.id].name, [["Piece", pieceDesc(p.data.id)]]) : ""),
    },
  };
}

// ================================================================ 2 · Move a metro, watch modularity

export function modModel(explore, place, ctx) {
  const { IDS, GROUP } = ctx;
  const full = explore.full;
  const nm = place.null_model;
  const edges = full.edges;
  const total = full.total_weight;
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
  return {
    page: { ...GROUP },
    computeQ,
    lead:
      `Click a metro to move it to the next group and watch modularity, the share of link weight inside the groups minus what ` +
      `chance would put there. Louvain’s three groups score ${full.Q_page_partition.toFixed(3)}; shuffled labels, or one big ` +
      `group, score about zero.`,
    qLabel: `modularity of your three groups, on all ${edges.length} weighted links`,
    strip: {
      loQ: -0.02,
      hiQ: 0.07,
      band: [nm.Q_null_mean - nm.Q_null_std, nm.Q_null_mean + nm.Q_null_std],
      meanQ: nm.Q_null_mean,
      refQ: full.Q_page_partition,
    },
  };
}

/** The groups after a button: "reset" (Louvain's), "one" (everyone together) or "shuffle" (labels shuffled, sizes kept). */
export function modAct(m, ctx, g, act, random = Math.random) {
  const { IDS } = ctx;
  if (act === "reset") return { g: { ...m.page }, last: "back to Louvain’s groups" };
  if (act === "one") return { g: Object.fromEntries(IDS.map((id) => [id, 0])), last: "everyone in one group" };
  const labs = IDS.map((id) => g[id]);
  for (let i = labs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [labs[i], labs[j]] = [labs[j], labs[i]];
  }
  return { g: Object.fromEntries(IDS.map((id, i) => [id, labs[i]])), last: "labels shuffled, sizes kept" };
}

export function modOption(ctx, g, token, T) {
  const { CITY, IDS, dotR } = ctx;
  const GROUP_COLOR = [0, 1, 2].map((k) => token(`--w4-group-${k}`));
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
  const base = baseOption(token, T);
  return {
    ...base,
    geo: geoBase(token),
    series: [{ type: "scatter", coordinateSystem: "geo", zlevel: 2, data: dots, cursor: "pointer" }],
    tooltip: {
      ...base.tooltip,
      formatter: (p) => (p.data?.id ? tipHtml(CITY[p.data.id].name, [["Group", `Group ${g[p.data.id] + 1}`]]) : ""),
    },
  };
}

// ================================================================ 3 · Louvain, move by move

export function louvainModel(explore, place, ctx) {
  const { CITY, NAME, GROUP, dotR } = ctx;
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
    const movedNames = moved.length ? nameList(moved, NAME, 3) : "none yet";
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
  const lead = assumptionsOk
    ? `Louvain starts with every metro alone and moves one at a time to the neighbouring community that raises modularity most. ` +
      `In this run, ${lv0.moves.length} moves over ${WORDS[lv0.sweeps] || lv0.sweeps} sweeps land on the page’s ` +
      `${WORDS[lv0.communities] || lv0.communities} metro groups.`
    : `Louvain starts with every metro alone and moves one at a time to the neighbouring community that raises modularity most, ` +
      `landing on ${louvain.final.Q.toFixed(3)} over ${louvain.levels.length} levels.`;
  return {
    steps,
    qs,
    levelEnds,
    lead,
    ref: nm.Q_null_mean,
    refLabel: `rewired networks ${nm.Q_null_mean.toFixed(3)}`,
    method: assumptionsOk
      ? { seed: String(louvain.seed), links: String(explore.full.edges.length), from: lv0.Q_start.toFixed(3), to: louvain.final.Q.toFixed(3) }
      : null,
  };
}

/** The Louvain move `s` reached by a button: "step", "back", "reset" or "level". */
export function louvainGo(m, s, act) {
  const last = m.steps.length - 1;
  const clamp = (v) => Math.max(0, Math.min(last, v));
  if (act === "step") return clamp(s + 1);
  if (act === "back") return clamp(s - 1);
  if (act === "reset") return 0;
  const e = m.levelEnds.find((x) => x > s);
  return clamp(e === undefined ? last : e);
}

export function louvainOption(m, ctx, i, token, T) {
  const { CITY, IDS, dotR } = ctx;
  const GROUP_COLOR = [0, 1, 2].map((k) => token(`--w4-group-${k}`));
  const st = m.steps[i];
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
  const base = baseOption(token, T);
  return {
    ...base,
    geo: geoBase(token),
    series: [
      { type: "scatter", coordinateSystem: "geo", zlevel: 2, data: dots },
      { type: "scatter", coordinateSystem: "geo", zlevel: 3, silent: true, data: ring },
    ],
    tooltip: {
      ...base.tooltip,
      formatter: (p) =>
        p.data?.id ? tipHtml(CITY[p.data.id].name, [["Community", st.fills[p.data.id] != null ? `Group ${st.fills[p.data.id] + 1}` : "Alone"]]) : "",
    },
  };
}

// ================================================================ 4 · Overlap: k-cliques and link communities

export function overlapModel(explore, place, ctx) {
  const { CITY, NAME } = ctx;
  const kc = explore.k_cliques.by_k;
  const lc = explore.link_communities;
  const baseEdges = place.backbone.graphs["0.2"].edges;

  const ks = ["3", "4", "5", "6"];
  const ksOk = ks.every((k) => kc[k] && kc[k].communities.length === 1);
  const lead = ksOk
    ? `A partition puts each metro in one group; these two methods let it sit in several. Clique percolation finds a single ` +
      `community at every k from ${ks[0]} to ${ks[ks.length - 1]}.`
    : `A partition puts each metro in one group; these two methods let it sit in several. Clique percolation finds a small ` +
      `number of overlapping communities at each k.`;
  // "A larger k only leaves more of the fringe out": one community at every k,
  // and each k's left-out metros hold the smaller k's and more.
  const fringeOk =
    ksOk &&
    ks.slice(1).every((k, i) => {
      const prev = kc[ks[i]].in_none;
      const next = new Set(kc[k].in_none);
      return next.size > prev.length && prev.every((id) => next.has(id));
    });

  const views = {};
  for (const k of ks) {
    const g = kc[k];
    if (!g) continue;
    const comms = g.communities;
    const two = new Set(g.in_two_or_more);
    const noneCount = g.in_none.length;
    let extra = `${two.size} metros in two or more, ${noneCount} in none`;
    if (comms.length === 1) {
      extra = noneCount === 0 ? "One community holding every metro." : `One community; ${noneCount} metros left out, drawn hollow.`;
    }
    views[`k${k}`] = {
      title: `k = ${k}`,
      count: comms.length,
      extra,
      items: comms.map((com, j) => {
        const sorted = [...com].sort((a, b) => CITY[b].filings - CITY[a].filings);
        return { key: `k${k}_${j}`, members: sorted, names: nameList(sorted, NAME, 6), edges: null };
      }),
      two,
    };
  }
  const twoL = Object.entries(lc.by_metro)
    .filter(([, cs]) => cs.length >= 2)
    .map(([id]) => id)
    .sort();
  const twoLSet = new Set(twoL);
  const most = [...twoL].sort((a, b) => lc.by_metro[b].length - lc.by_metro[a].length || CITY[b].filings - CITY[a].filings).slice(0, 2);
  views.link = {
    title: "link communities",
    count: lc.communities.length,
    extra:
      most.length === 2 && lc.by_metro[most[0]].length === lc.by_metro[most[1]].length
        ? `${twoL.length} metros sit in two or more: ${NAME[most[0]]} and ${NAME[most[1]]} in ${lc.by_metro[most[0]].length} each.`
        : `${twoL.length} metros sit in two or more.`,
    items: lc.communities.map((com, j) => {
      const members = [...new Set(com.flat())].sort((a, b) => CITY[b].filings - CITY[a].filings);
      return { key: `l_${j}`, members, names: nameList(members, NAME, 6), edges: com };
    }),
    two: twoLSet,
  };
  // A k-clique community has no edge list of its own in the source data: the
  // edges shown for it are the backbone links with both ends inside it.
  for (const k of ks) {
    const v = views[`k${k}`];
    if (!v) continue;
    for (const item of v.items) {
      const ms = new Set(item.members);
      item.edges = baseEdges.filter(([a, b]) => ms.has(a) && ms.has(b));
    }
  }
  return { views, baseEdges, lead, fringe: fringeOk ? " In clique percolation, a larger k only leaves more of the fringe out." : "" };
}

/** The view and community on show for overlap mode `mode`, community `j`. */
export function overlapItem(m, mode, j) {
  const v = m.views[mode];
  if (!v.items.length) return { view: v, item: { members: [], names: "No community at this setting.", edges: [] } };
  return { view: v, item: v.items[j % v.items.length] };
}

export function overlapOption(m, ctx, mode, j, token, T) {
  const { CITY, IDS, dotR } = ctx;
  const { view, item } = overlapItem(m, mode, j);
  const inItem = new Set(item.members);
  const memberEdgeKeys = new Set((item.edges || []).map(([a, b]) => edgeKey(a, b)));
  const baseLines = m.baseEdges.map(([a, b]) => ({
    coords: [
      [CITY[a].lon, CITY[a].lat],
      [CITY[b].lon, CITY[b].lat],
    ],
    lineStyle: { color: token("--ink-mute"), opacity: 0.3, width: 0.8 },
  }));
  const hiLines = m.baseEdges
    .filter(([a, b]) => memberEdgeKeys.has(edgeKey(a, b)))
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
  const base = baseOption(token, T);
  return {
    ...base,
    geo: geoBase(token),
    series: [
      { type: "lines", coordinateSystem: "geo", zlevel: 1, silent: true, data: baseLines },
      { type: "lines", coordinateSystem: "geo", zlevel: 2, silent: true, data: hiLines },
      { type: "scatter", coordinateSystem: "geo", zlevel: 3, data: dots },
      { type: "scatter", coordinateSystem: "geo", zlevel: 4, silent: true, data: rings },
    ],
    tooltip: {
      ...base.tooltip,
      formatter: (p) =>
        p.data?.id
          ? tipHtml(CITY[p.data.id].name, [
              ["In this community", inItem.has(p.data.id) ? "yes" : "no"],
              ["In two or more at this setting", view.two.has(p.data.id) ? "yes" : "no"],
            ])
          : "",
    },
  };
}
