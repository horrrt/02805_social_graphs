// Deep dive: every 2025 worker (each H-1B position and PERM case) and every
// filing company as a dot, coloured by its Louvain community in a two-sided
// network of workers (or companies) and the occupations, metros, wage levels
// and sectors they have (analysis/week04_entities.py). The box
// (src/features/week04/entities/Entities.tsx) draws it with the vendored
// deck.gl build, loaded when the box first opens; this module builds the dot
// layout, the colours, the deck.gl layers and every line of text from the
// data. A worker profile's workers sit in a sunflower disc around the
// profile's place in the layout; a company is one dot sized by its workers.
// `rgb(name)` reads a colour token as [r, g, b]; `T` is the type scale and
// `token(name)` a token's value.

export const FILES = {
  workers: "entities_workers",
  companies: "entities_companies",
  staffing: "entities_network_staffing",
  lawfirms: "entities_network_lawfirms",
};
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
export const LABELS = {
  major_group: "Occupation group",
  place: "Metro",
  level: "Wage level",
  sector: "Sector",
  employer: "Employer (not in the network)",
  placed: "Placed at a client (not in the network)",
  visa: "H-1B or PERM (not in the network)",
  placing_firm: "Placing firm or not (not in the network)",
  staffing_community: "Section 3 staffing group (not in the network)",
  hq_state: "Headquarters state (not in the network)",
};
const SECTOR_TOKENS = { 52: "--w4-sector-finance", "31-33": "--w4-sector-manufacturing", 62: "--w4-sector-health" };

/** Every token the box reads. */
export const ENTITY_TOKENS = [
  ...Array.from({ length: 12 }, (_, i) => `--w4-community-${i + 1}`),
  "--w4-community-other",
  "--card",
  ...Object.values(SECTOR_TOKENS),
  "--w4-sector-other",
  "--w4-sector-unknown",
  "--w4-level-1",
  "--w4-level-2",
  "--w4-level-3",
  "--w4-level-4",
  "--w4-rank-high",
  "--w4-rank-low",
  "--w4-grid",
  "--line",
  "--ink",
  "--ink-soft",
  "--ink-mute",
  "--ink-mute-text",
  "--w4-tip-bg",
  "--w4-tip-ink",
];

export const fmt = (n) => Number(n).toLocaleString("en-US");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Dot positions. Each community is a disc placed by the analysis (a force
// layout of how strongly the groups link, discs pushed apart); its dots fill
// it in a sunflower pattern, the n-th at radius spacing * sqrt(n). Workers
// run from the group's largest occupation outwards; companies from the
// largest, each taking room in proportion to its workers.
export function layoutDots(d) {
  const p = d.profiles;
  const n = p.community.length;
  const s = d.spacing;
  const members = d.communities.map(() => []);
  for (let i = 0; i < n; i++) if (p.community[i] >= 0) members[p.community[i]].push(i);
  if (d.dots === "workers") {
    let total = 0;
    for (let i = 0; i < n; i++) total += p.h1b[i] + p.perm[i];
    const pos = new Float32Array(total * 2);
    const profile = new Int32Array(total);
    const visa = new Uint8Array(total);
    let k = 0;
    d.communities.forEach((c, ci) => {
      const byOcc = new Map();
      for (const i of members[ci]) byOcc.set(p.occupation[i], (byOcc.get(p.occupation[i]) ?? 0) + p.h1b[i] + p.perm[i]);
      const order = members[ci].slice().sort((a, b) => byOcc.get(p.occupation[b]) - byOcc.get(p.occupation[a]) || p.occupation[a] - p.occupation[b] || a - b);
      let slot = 0;
      for (const i of order) {
        const count = p.h1b[i] + p.perm[i];
        for (let j = 0; j < count; j++, slot++, k++) {
          const r = s * Math.sqrt(slot + 0.5);
          pos[2 * k] = c.x + r * Math.cos(slot * GOLDEN);
          pos[2 * k + 1] = c.y + r * Math.sin(slot * GOLDEN);
          profile[k] = i;
          visa[k] = j < p.h1b[i] ? 0 : 1;
        }
      }
    });
    return { length: k, pos, profile, visa, radius: new Float32Array(k).fill(s * 0.5) };
  }
  // Companies: item k is profile k, sorted by workers, largest first.
  const total = n;
  const pos = new Float32Array(total * 2);
  const radius = new Float32Array(total);
  const used = new Float64Array(d.communities.length);
  const slot = new Int32Array(d.communities.length);
  for (let k = 0; k < total; k++) {
    const ci = p.community[k];
    const c = d.communities[ci];
    const area = p.h1b[k] + p.perm[k];
    const r = s * Math.sqrt(used[ci] + area / 2);
    pos[2 * k] = c.x + r * Math.cos(slot[ci] * GOLDEN);
    pos[2 * k + 1] = c.y + r * Math.sin(slot[ci] * GOLDEN);
    radius[k] = s * Math.sqrt(area) * 0.8;
    used[ci] += area;
    slot[ci] += 1;
  }
  return { length: total, pos, profile: Int32Array.from({ length: total }, (_, k) => k), radius };
}

/** The colouring `by` ("community", "sector", "level" or "pagerank"): of(i), legend and key(i) per profile. */
export function palette(d, by, rgb) {
  const other = rgb("--w4-community-other");
  if (by === "community") {
    const colours = Array.from({ length: d.top }, (_, i) => rgb(`--w4-community-${i + 1}`));
    // Every group gets a colour: the largest ones the full hues, the rest the
    // same hues in lighter tints, cycling, so neighbouring groups still differ.
    const white = rgb("--card");
    const tints = colours.map((c) => mix(c, white, 0.5));
    return {
      of: (i) => {
        const c = d.profiles.community[i];
        return c < 0 ? other : c < d.top ? colours[c] : tints[c % d.top];
      },
      legend: [
        ...d.communities.slice(0, d.top).map((c, i) => ({ key: i, label: `${i + 1} · ${c.name}`, colour: colours[i], count: c.workers })),
        { key: "other", label: `${d.communities.length - d.top} smaller groups, in lighter tints`, colour: tints[0] },
      ],
      key: (i) => {
        const c = d.profiles.community[i];
        return c >= 0 && c < d.top ? c : "other";
      },
    };
  }
  if (by === "sector") {
    const codes = d.lookups.sector.map(([code]) => code);
    const named = Object.entries(SECTOR_TOKENS).map(([code, name]) => [code, rgb(name)]);
    const colourOf = Object.fromEntries(named);
    const rest = rgb("--w4-sector-other");
    const unknown = rgb("--w4-sector-unknown");
    const bucketColour = { ...colourOf, rest, unknown };
    const label = Object.fromEntries(d.lookups.sector);
    const bucket = (i) => {
      const code = codes[d.profiles.sector[i]];
      return code in colourOf ? code : code === "unknown" ? "unknown" : "rest";
    };
    return {
      of: (i) => bucketColour[bucket(i)],
      legend: [
        ...named.map(([code, colour]) => ({ key: code, label: label[code] ?? code, colour })),
        { key: "rest", label: "Other sectors", colour: rest },
        { key: "unknown", label: "Sector unknown", colour: unknown },
      ],
      key: bucket,
    };
  }
  if (by === "level") {
    const colours = [1, 2, 3, 4].map((l) => rgb(`--w4-level-${l}`));
    return {
      of: (i) => colours[d.profiles.level[i]],
      legend: d.lookups.level.map((label, i) => ({ key: i, label, colour: colours[i] })),
      key: (i) => d.profiles.level[i],
    };
  }
  // PageRank: rank within the connected network, most central darkest.
  const hi = rgb("--w4-rank-high");
  const lo = rgb("--w4-rank-low");
  const ranks = d.profiles.pagerank_rank;
  let n = 1;
  for (const r of ranks) if (r > n) n = r;
  const quart = (i) => (ranks[i] < 0 ? 4 : Math.min(3, Math.floor((4 * ranks[i]) / (n + 1))));
  const steps = [0, 1, 2, 3].map((q) => mix(hi, lo, q / 3));
  return {
    of: (i) => (ranks[i] < 0 ? other : mix(hi, lo, Math.sqrt(ranks[i] / n))),
    legend: [
      ...["Top quarter by PageRank", "Second quarter", "Third quarter", "Bottom quarter"].map((label, q) => ({
        key: q,
        label,
        colour: steps[q],
      })),
      { key: 4, label: "Outside the connected network", colour: other },
    ],
    key: quart,
  };
}

// deck.gl sets its own inline colours; these take the page's tooltip tokens.
function tipStyle(T) {
  return {
    background: T.token("--w4-tip-bg"),
    color: T.token("--w4-tip-ink"),
    padding: "8px 10px",
    borderRadius: "8px",
    maxWidth: "320px",
    fontSize: `${T.fs("caption")}px`,
    lineHeight: "1.45",
  };
}

/** The deck.gl view a box opens at, fitted to a host of this size. */
export function fit(width, height) {
  return { target: [500, 500, 0], zoom: Math.log2(Math.min(width || 900, height || 640) / 1060) };
}

/** The layers, tooltip and legend for the workers or companies: { layers, getTooltip, legend }. */
export function entityView(deck, d, dots, state, rgb, T) {
  const pal = palette(d, state.by, rgb);
  const out = new Uint8Array(dots.length * 4);
  const perProfile = d.profiles.community.map((_, i) => pal.of(i));
  const keys = state.focus === null ? null : d.profiles.community.map((_, i) => pal.key(i) === state.focus);
  for (let k = 0; k < dots.length; k++) {
    const i = dots.profile[k];
    const c = perProfile[i];
    out[4 * k] = c[0];
    out[4 * k + 1] = c[1];
    out[4 * k + 2] = c[2];
    out[4 * k + 3] = keys && !keys[i] ? 28 : 215;
  }
  const layers = [
    new deck.ScatterplotLayer({
      id: `dots-${state.entity}`,
      data: {
        length: dots.length,
        attributes: {
          getPosition: { value: dots.pos, size: 2 },
          getFillColor: { value: out, size: 4, normalized: true },
          getRadius: { value: dots.radius, size: 1 },
        },
      },
      radiusUnits: "common",
      radiusMinPixels: 0.55,
      radiusMaxPixels: 40,
      pickable: true,
      updateTriggers: { getFillColor: [state.by, state.focus] },
    }),
  ];
  if (state.by === "community") {
    layers.push(
      new deck.TextLayer({
        id: "labels",
        data: d.communities.slice(0, Math.min(10, d.top)).map((c, i) => ({ position: [c.x, c.y], text: `${i + 1}` })),
        getPosition: (o) => o.position,
        getText: (o) => o.text,
        getSize: T.fs("small"),
        fontFamily: T.family("sans"),
        fontWeight: 700,
        getColor: rgb("--ink"),
        background: true,
        getBackgroundColor: [...rgb("--card"), 230],
        backgroundPadding: [5, 2],
      }),
    );
  }
  const getTooltip = ({ index }) => {
    if (index < 0) return null;
    const p = d.profiles;
    const i = dots.profile[index];
    const occ = d.lookups.occupation[p.occupation[i]][1];
    const place = d.lookups.place[p.place[i]][1];
    const sector = d.lookups.sector[p.sector[i]][1];
    const level = d.lookups.level[p.level[i]];
    const c = p.community[i];
    const group = c >= 0 ? d.communities[c].name : "outside the connected network";
    const count = p.h1b[i] + p.perm[i];
    let head;
    let body;
    if (d.dots === "workers") {
      head = `${dots.visa[index] ? "PERM worker" : "H-1B worker"}: ${occ}`;
      body = `${level} · ${sector}<br>${place}<br>${fmt(count)} workers share this profile (${fmt(p.h1b[i])} H-1B, ${fmt(p.perm[i])} PERM)`;
    } else {
      head = d.items.name[index];
      body = `${fmt(count)} workers, mostly ${occ}<br>${level} · ${sector}<br>Most workers in ${place}`;
    }
    return {
      html: `<b>${esc(head)}</b>${body}<br>Community ${c >= 0 ? c + 1 : "–"}: ${esc(group)}`,
      className: "w4-entities-tip",
      style: tipStyle(T),
    };
  };
  return { layers, getTooltip, legend: pal.legend };
}

// Node-link networks (staffing firms and clients, employers by law firm),
// drawn as exercise 4.11 asks: the backbone at the chosen alpha, dropped links
// faint or hidden, nodes sized by strength and coloured by community, the
// largest member of each large community named.
function communityColours(d, rgb) {
  const colours = Array.from({ length: d.top }, (_, i) => rgb(`--w4-community-${i + 1}`));
  const tints = colours.map((c) => mix(c, rgb("--card"), 0.5));
  return (c) => (c < d.top ? colours[c] : tints[c % d.top]);
}

/** The layers, tooltip, legend and stats for a network: { layers, getTooltip, legend, nodes, links }. */
export function networkView(deck, d, state, rgb, T) {
  const n = d.nodes;
  const a = state.alpha ?? d.alpha;
  const colourOf = communityColours(d, rgb);
  const focus = state.focus;
  const inFocus = (c) => focus === null || (focus === "other" ? c >= d.top : c === focus);
  const visible = new Uint8Array(n.name.length);
  const kept = [];
  const dropped = [];
  const L = d.links;
  for (let k = 0; k < L.source.length; k++) {
    const o = { s: L.source[k], t: L.target[k], w: L.weight[k] };
    if (L.p[k] < a) {
      kept.push(o);
      visible[o.s] = 1;
      visible[o.t] = 1;
    } else if (state.dropped === "faint") dropped.push(o);
  }
  let smax = 1;
  for (const v of n.strength) smax = Math.max(smax, v);
  const nodes = [];
  for (let i = 0; i < n.name.length; i++) if (visible[i]) nodes.push(i);
  const grey = rgb("--w4-grid");
  const faint = rgb("--line");
  const pos = (i) => [n.x[i], n.y[i]];
  const wmax = Math.max(1, ...kept.map((o) => o.w));
  const layers = [
    new deck.LineLayer({
      id: `dropped-${state.entity}`,
      data: dropped,
      getSourcePosition: (o) => pos(o.s),
      getTargetPosition: (o) => pos(o.t),
      getColor: [...faint, 70],
      getWidth: 0.6,
      widthUnits: "pixels",
    }),
    new deck.LineLayer({
      id: `kept-${state.entity}`,
      data: kept,
      getSourcePosition: (o) => pos(o.s),
      getTargetPosition: (o) => pos(o.t),
      getColor: (o) => {
        const cs = n.community[o.s];
        const same = cs === n.community[o.t];
        const on = inFocus(cs) || inFocus(n.community[o.t]);
        return same ? [...colourOf(cs), on ? 130 : 20] : [...grey, on ? 170 : 30];
      },
      getWidth: (o) => 0.5 + 2.5 * Math.sqrt(o.w / wmax),
      widthUnits: "pixels",
      updateTriggers: { getColor: [focus] },
    }),
    new deck.ScatterplotLayer({
      id: `nodes-${state.entity}`,
      data: nodes,
      getPosition: (i) => pos(i),
      getRadius: (i) => 2 + 11 * Math.sqrt(n.strength[i] / smax),
      radiusUnits: "pixels",
      getFillColor: (i) => [...colourOf(n.community[i]), inFocus(n.community[i]) ? 235 : 35],
      getLineColor: [...rgb("--card"), 220],
      lineWidthMinPixels: 0.6,
      stroked: true,
      pickable: true,
      updateTriggers: { getFillColor: [focus] },
    }),
    new deck.TextLayer({
      id: `names-${state.entity}`,
      data: d.communities.slice(0, 10).filter((c) => visible[c.head] && inFocus(c.id)),
      getPosition: (c) => pos(c.head),
      getText: (c) => n.name[c.head],
      getSize: T.fs("caption"),
      fontFamily: T.family("sans"),
      fontWeight: 700,
      characterSet: "auto",
      getColor: rgb("--ink"),
      getPixelOffset: [0, -14],
      background: true,
      getBackgroundColor: [...rgb("--card"), 225],
      backgroundPadding: [4, 2],
      updateTriggers: { data: [focus, a] },
    }),
  ];
  const getTooltip = ({ object }) => {
    if (typeof object !== "number") return null;
    const i = object;
    const c = d.communities[n.community[i]];
    const kind = { firm: "Placing firm", client: "Client company", employer: "Employer" }[n.kind[i]];
    const unit = d.network === "staffing" ? "placed filings" : "filings through a law firm";
    return {
      html: `<b>${esc(n.name[i])}</b>${kind} · ${fmt(n.strength[i])} ${unit} in the drawn network<br>Group ${c.id + 1}: ${esc(c.label)}`,
      style: tipStyle(T),
    };
  };
  const legend = d.communities.slice(0, d.top).map((c) => ({ key: c.id, label: `${c.id + 1} · ${c.label} (${fmt(c.nodes)})`, colour: colourOf(c.id) }));
  if (d.communities.length > d.top) legend.push({ key: "other", label: `${d.communities.length - d.top} smaller groups, in lighter tints`, colour: colourOf(d.top) });
  const at = d.at[String(a)] ?? { giant: 0 };
  const stats = [
    ["Links kept", `${fmt(kept.length)} of ${fmt(d.all_links)} · ${Math.round((100 * kept.length) / d.all_links)}%`],
    ["Nodes with a link", `${fmt(nodes.length)} of ${fmt(d.nodes.name.length)}`],
    ["Giant component", fmt(at.giant)],
  ];
  return { layers, getTooltip, legend, stats, alpha: a };
}

// Headings of the chart slots, which the network views rename.
export const NET_TEXT = {
  "labels-head": "What survives the filter",
  "labels-note": "The disparity filter keeps a link when it carries more of a node's weight than chance would give it. Pick the cut above the map.",
  "ccdf-head": "How much is left, across the whole range",
  "ccdf-note": "Share of the drawn network the filter keeps at each α, log scale. The dot marks the cut on the map.",
};

/** A network's answer line and figure caption. */
export function networkText(d) {
  const l = d.louvain;
  const who = d.network === "staffing" ? "placing firms and client companies" : "employers";
  const answer =
    `The ${fmt(d.nodes.name.length)} largest ${who} fall into ${fmt(l.communities)} groups (modularity ${l.Q_best.toFixed(2)}, ` +
    `against ${d.null.Q_mean.toFixed(2)} for rewired networks` +
    (d.null.Q_mean > l.Q_best ? ", which split around a few heavy links once their filing counts are shuffled, as section 3 shows" : "") +
    `). The largest: ${d.communities.slice(0, 3).map((c) => c.label).join("; ").replace(/\.$/, "")}.`;
  const caption =
    (d.network === "staffing"
      ? `Section 3's network: a placing firm links to each client it places H-1B workers at in 2025, weighted by filings. ` +
        `The ${fmt(d.nodes.name.length)} firms and clients with the most filings are drawn (${Math.round(d.notes.drawn_filing_share * 100)}% of the weight), ` +
        `coloured by section 3's Louvain groups, found on the whole network of ${fmt(d.notes.network_nodes)} nodes (best of ${l.runs} seeds). `
      : `Two employers link when the same law firm files their H-1B applications, weighted by the smaller of their filings through it, summed over the firms they share (in-house counsel left out). ` +
        `The ${fmt(d.nodes.name.length)} employers with the most such filings are drawn, coloured by Louvain group (best of ${l.runs} seeds); a group's label names its main law firm. `) +
    `Only the links the disparity filter keeps are drawn in colour; nodes are sized by filings and placed by a force layout of the backbone at α = ${d.alpha}. ` +
    `Hover a node for its name, click a legend entry to highlight a group, scroll to zoom and drag to pan.`;
  return { answer, caption };
}

/** A network's strip: modularity against rewired networks, and seed agreement. */
export function networkStrip(d) {
  return {
    rows: [
      {
        label: "Modularity",
        sub: `Louvain, best of ${d.louvain.runs} seeds`,
        real: d.louvain.Q_best,
        realLabel: d.louvain.Q_best.toFixed(2),
        realTip: `Real network: ${d.louvain.Q_best}`,
        base: [d.null.Q_mean, Math.max(d.null.Q_sd, 0.002)],
        baseLabel: `rewired ${d.null.Q_mean.toFixed(2)}`,
        baseTip: `${d.null.draws} rewired networks (${d.null.kind}): ${d.null.Q_mean} ± ${d.null.Q_sd}`,
      },
      {
        label: "Seed agreement",
        sub: "NMI between two Louvain seeds",
        real: d.louvain.nmi_between_seeds_median,
        realLabel: d.louvain.nmi_between_seeds_median.toFixed(2),
        realTip: `Median NMI between pairs of seeds: ${d.louvain.nmi_between_seeds_median}`,
      },
    ],
    opts: {
      domain: [0, 1],
      ticks: [0, 0.25, 0.5, 0.75, 1],
      fmt: (v) => v.toFixed(2),
      aria: "Modularity of the real network against rewired networks, and the agreement between Louvain seeds.",
      rowH: 52,
    },
  };
}

/** The share of links, nodes with a link and giant component kept at each α, at width W. */
export function curveLayout(d, alpha, width) {
  const total = [d.all_links, d.nodes.name.length, d.nodes.name.length];
  const series = [
    [1, "links kept", "--w4-community-5"],
    [2, "nodes with a link", "--w4-community-2"],
    [3, "giant component", "--ink-mute"],
  ];
  const h = 240;
  const m = { l: 44, r: 12, t: 12, b: 36 };
  const lx = (a) => Math.log10(a);
  const a0 = lx(d.curve[0][0]);
  const a1 = lx(d.curve.at(-1)[0]);
  const X = (a) => m.l + ((lx(a) - a0) / (a1 - a0)) * (width - m.l - m.r);
  const Y = (v) => m.t + (1 - v) * (h - m.t - m.b);
  const at = d.at[String(alpha)];
  return {
    h,
    m,
    grid: [0, 0.25, 0.5, 0.75, 1].map((v) => ({ y: Y(v), label: `${Math.round(v * 100)}%` })),
    xTicks: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1].filter((a) => !(a < d.curve[0][0] || a > d.curve.at(-1)[0])).map((a) => ({ x: X(a), label: String(a) })),
    cut: X(alpha),
    series: series.map(([col, label, colour], si) => {
      const v = at ? [at.links / d.all_links, at.nodes_with_a_link / total[1], at.giant / total[2]][si] : null;
      return {
        label,
        colour,
        dashed: si === 2,
        points: d.curve.map((row) => [X(row[0]), Y(row[col] / total[col - 1])].join(",")).join(" "),
        dot: v === null ? null : { cx: X(alpha), cy: Y(v), tip: `${label} at α = ${alpha}: ${Math.round(v * 100)}%` },
        y: m.t + 14 + si * 15,
      };
    }),
  };
}

/** A network's table: { head, rows } for the 25 largest groups. */
export function networkTable(d) {
  const top = d.communities.slice(0, 25);
  return {
    head: [{ text: "#" }, { text: "Group" }, { text: "Nodes", className: "num" }, { text: "Filings", className: "num" }, { text: "Largest members" }],
    rows: top.map((c, i) => [
      { swatch: swatchColour(i, d.top), text: String(c.id + 1) },
      { text: c.label },
      { text: fmt(c.nodes), className: "num" },
      { text: fmt(c.strength), className: "num" },
      { text: c.top.join(", ") },
    ]),
    title: `The ${top.length} largest of ${d.communities.length} groups`,
  };
}

// The largest groups take the full community hues, the rest a lighter tint of the same cycle.
function swatchColour(i, top) {
  const hue = `var(--w4-community-${(i % top) + 1})`;
  return i < top ? hue : `color-mix(in srgb, ${hue} 50%, var(--card))`;
}

/** The workers' or companies' answer line and figure caption. */
export function entityText(d, dots) {
  const s = d.summary;
  const tests = Object.entries(s.labels).sort((a, b) => b[1].nmi - a[1].nmi);
  const [first, second] = tests;
  const filer = s.labels.employer ?? s.labels.placing_firm;
  const plain = (k) => LABELS[k].replace(/ \(.*\)/, "").toLowerCase();
  const answer =
    `${fmt(dots.length)} ${d.dots === "workers" ? "workers" : "companies"} fall into ${s.louvain.communities_best} groups. ` +
    `The groups follow ${plain(first[0])} most (NMI ${first[1].nmi.toFixed(2)}), then ${plain(second[0])} (${second[1].nmi.toFixed(2)})` +
    (filer
      ? `; ${d.unit === "worker" ? "the employer" : "being a placing firm"}, never part of the network, scores ${filer.nmi.toFixed(2)} against ${filer.nmi_shuffled_mean.toFixed(2)} by chance.`
      : ".");
  const how =
    `Louvain splits a two-sided network: on one side the ${d.dots === "workers" ? "worker profiles" : "companies"}, on the other every occupation, metro, wage level and sector, ` +
    `each ${d.dots === "workers" ? "profile" : "company"} linked to its own with weight = its workers (best of ${s.louvain.runs} seeds). ` +
    `Each group is a disc sized by its workers; a force layout of how strongly the groups link places the discs, so linked groups sit close, ` +
    `and inside a disc ${d.dots === "workers" ? "workers run from the group's largest occupation outwards" : "companies run from the largest outwards, sized by their workers"}. `;
  const caption =
    d.dots === "workers"
      ? `One dot per worker in the 2025 filings: each position a certified H-1B filing asks for and each certified PERM case. ` +
        `Workers with the same occupation, metro, wage level and sector form one profile. ${how}` +
        `The employer and whether the worker is placed at a client are not in the network, so the colours cannot follow them by construction. ` +
        `Hover a dot for its profile, click a legend entry to highlight one group, scroll to zoom and drag to pan.`
      : `One dot per company that filed for a worker in 2025, sized by its workers. ${how}` +
        `Whether a company places workers at clients is not in the network. ` +
        `Hover a dot for the company, click a legend entry to highlight one group, scroll to zoom and drag to pan.`;
  return { answer, caption };
}

/** The network-against-random strip for workers or companies. */
export function entityStrip(d) {
  const s = d.summary;
  const w2 = d.facts.week2;
  const w3 = d.facts.week3;
  const a = w3.assortativity;
  const rows = [
    {
      label: "Modularity, weighted",
      sub: "workers as link weights",
      real: s.louvain.Q_best,
      realLabel: s.louvain.Q_best.toFixed(2),
      realTip: `Real network: ${s.louvain.Q_best.toFixed(3)}`,
      base: [s.null.Q_mean, Math.max(s.null.Q_sd, 0.002)],
      baseLabel: `rewired ${s.null.Q_mean.toFixed(2)}`,
      baseTip: `${s.null.draws} rewired networks, worker counts dealt back out: ${s.null.Q_mean.toFixed(3)} ± ${s.null.Q_sd.toFixed(3)}. A few heavy links let a rewired network split around them, so this null can beat the real one.`,
    },
    {
      label: "Modularity, wiring only",
      sub: "every link counts once",
      real: s.null.wiring_only.real,
      realLabel: s.null.wiring_only.real.toFixed(2),
      realTip: `Real network without weights: ${s.null.wiring_only.real.toFixed(3)}`,
      base: [s.null.wiring_only.null, Math.max(s.null.wiring_only.null_sd, 0.002)],
      baseLabel: `rewired ${s.null.wiring_only.null.toFixed(2)}`,
      baseTip: `The same rewired networks without weights: ${s.null.wiring_only.null.toFixed(3)} ± ${s.null.wiring_only.null_sd.toFixed(3)}`,
    },
    {
      label: "Clustering",
      sub: "projection onto attributes",
      real: w2.transitivity,
      realLabel: w2.transitivity.toFixed(2),
      realTip: `Real projection: ${w2.transitivity}`,
      base: [w2.transitivity_rewired.mean, Math.max(w2.transitivity_rewired.sd, 0.002)],
      baseLabel: `rewired ${w2.transitivity_rewired.mean.toFixed(2)}`,
      baseTip: `Projections of the rewired networks: ${w2.transitivity_rewired.mean}; a random graph of the same size: ${w2.transitivity_random}`,
    },
    {
      label: "Degree mixing",
      sub: "projection, assortativity",
      real: a.degree,
      realLabel: a.degree.toFixed(2),
      realTip: `Real projection: ${a.degree}`,
      base: [a.degree_rewired.mean, Math.max(a.degree_rewired.sd, 0.002)],
      baseLabel: `rewired ${a.degree_rewired.mean.toFixed(2)}`,
      baseTip: `Projections of the rewired networks: ${a.degree_rewired.mean}`,
    },
    {
      label: "Same kind",
      sub: "occupation to occupation, metro to metro",
      real: a.kind.real,
      realLabel: a.kind.real.toFixed(2),
      realTip: `Nominal assortativity by kind of attribute: ${a.kind.real}`,
      base: [a.kind.shuffled_mean, Math.max(a.kind.shuffled_sd, 0.002)],
      baseLabel: `shuffled ${a.kind.shuffled_mean.toFixed(2)}`,
      baseTip: `Kinds shuffled: ${a.kind.shuffled_mean}`,
    },
  ];
  const lo = Math.min(-0.1, ...rows.map((r) => Math.min(r.real, r.base[0]) - 0.05));
  return {
    rows,
    opts: {
      domain: [lo, 1],
      ticks: [-0.5, -0.25, 0, 0.25, 0.5, 0.75, 1].filter((t) => t >= lo),
      fmt: (v) => v.toFixed(2),
      aria: "The real network against rewired networks and shuffled kinds, for modularity, clustering and mixing.",
      zeroLine: 0,
      rowH: 52,
    },
  };
}

/** What the groups follow: NMI with each label against shuffled labels. */
export function labelStrip(d) {
  const s = d.summary;
  const rows = Object.entries(s.labels)
    .sort((a, b) => b[1].nmi - a[1].nmi)
    .map(([k, t]) => {
      const outside = /not in the network/.test(LABELS[k] ?? "");
      return {
        label: LABELS[k] ?? k,
        sub: `${fmt(t.values)} values${t.ami !== null ? `, AMI ${t.ami.toFixed(2)}` : ""}`,
        real: t.nmi,
        realLabel: t.nmi.toFixed(2),
        realTip: `NMI ${t.nmi}; shuffled labels matched it in ${t.p <= 1 / (t.shuffles + 1) ? "none" : Math.round(t.p * (t.shuffles + 1) - 1)} of ${t.shuffles} shuffles`,
        base: [t.nmi_shuffled_mean, Math.max(t.nmi_shuffled_sd, 0.004)],
        baseTip: `Shuffled labels reach ${t.nmi_shuffled_mean.toFixed(3)} by chance: a label with more values scores higher`,
        color: outside ? "--ink-mute" : undefined,
        hollow: outside,
      };
    });
  return {
    rows,
    opts: {
      domain: [0, 1],
      ticks: [0, 0.25, 0.5, 0.75, 1],
      fmt: (v) => v.toFixed(2),
      ref: [s.louvain.nmi_between_seeds_median, `two seeds ${s.louvain.nmi_between_seeds_median.toFixed(2)}`],
      aria: "NMI between the communities and each label, weighted by workers.",
      rowH: 46,
    },
  };
}

/** The attribute degree and strength CCDFs on log-log axes, at width W. */
export function ccdfLayout(d, width) {
  const series = [
    ["attribute_degree", `Attributes: ${d.dots === "workers" ? "profiles" : "companies"} linked`, "--w4-community-1"],
    ["attribute_strength", "Attributes: workers linked", "--w4-community-2"],
  ];
  const data = series.map(([k]) => d.facts.week1.ccdf[k]);
  const xs = data.flat().map((p) => p[0]);
  const ys = data.flat().map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const h = 230;
  const m = { l: 44, r: 10, t: 10, b: 36 };
  const X = (v) => m.l + ((Math.log10(v) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0) || 1)) * (width - m.l - m.r);
  const ymin = Math.max(1e-6, Math.min(...ys));
  const Y = (v) => m.t + (1 - (Math.log10(Math.max(v, ymin)) - Math.log10(ymin)) / (0 - Math.log10(ymin) || 1)) * (h - m.t - m.b);
  const grid = [];
  for (let e = Math.ceil(Math.log10(ymin)); e <= 0; e++) grid.push({ y: Y(10 ** e), label: e === 0 ? "1" : `10^${e}` });
  const xTicks = [];
  for (let e = 0; 10 ** e <= x1; e += 1) {
    if (10 ** e < x0) continue;
    xTicks.push({ x: X(10 ** e), label: fmt(10 ** e) });
  }
  return {
    h,
    m,
    grid,
    xTicks,
    series: series.map(([k, label, colour], si) => {
      const pts = d.facts.week1.ccdf[k];
      return {
        label,
        colour,
        points: pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" "),
        dots: pts.map(([x, y]) => ({ cx: X(x), cy: Y(y), tip: `${label}: ${(y * 100).toPrecision(3)}% have ${fmt(Math.round(x))} or more` })),
        y: m.t + 14 + si * 16,
      };
    }),
  };
}

/** The course's weeks 1 to 4 on this network: [title, lines] per week. */
export function weeks(d) {
  const f = d.facts;
  const w1 = f.week1;
  const w2 = f.week2;
  const w3 = f.week3;
  const w4 = f.week4;
  const s = d.summary;
  const unit = d.dots === "workers" ? "profiles" : "companies";
  const one = (v) => Number(v).toFixed(1);
  const two = (v) => Number(v).toFixed(2);
  const tops = (m) => w3.top[m].slice(0, 3).join(", ");
  const kinds = w1.attribute_nodes_by_kind;
  const ratio = w2.mean_path / w2.mean_path_random;
  const clique = Object.entries(w4.k_clique)
    .filter(([, v]) => !v.skipped)
    .map(([k, v]) => `k = ${k}: ${fmt(v.communities)} groups, ${fmt(v.nodes_in_two_or_more)} attributes in two or more${v.in_most?.length ? ` (most: ${v.in_most.join(", ")})` : ""}`)
    .join("; ");
  const strongest = w4.backbone.strongest.slice(0, 3).map(([a, b, w]) => `${a} with ${b} (${fmt(w)})`).join("; ");
  const robust = Object.entries(s.robustness)
    .map(([k, v]) => `${k} ${two(v.nmi_with_main)}`)
    .join(", ");
  let smallWorld = "Not small-world by these baselines.";
  if (ratio <= 1.5 && w2.transitivity > 2 * w2.transitivity_random && w2.transitivity > w2.transitivity_rewired.mean) {
    smallWorld = "Short paths and clustering above both baselines: small-world in Watts and Strogatz's sense.";
  } else if (w2.transitivity < w2.transitivity_rewired.mean) {
    smallWorld = "Paths are as short as a random graph's, but the rewired networks cluster more, so the clustering comes from the hubs, not from tight groups.";
  }
  return [
    [
      "Week 1 · the network",
      [
        `${fmt(w1.profiles)} ${unit} and ${fmt(w1.attribute_nodes)} attribute nodes (${fmt(kinds.occupation)} occupations, ${fmt(kinds.place)} metros, ${kinds.level} wage levels, ${kinds.sector} sectors), ${fmt(w1.links)} links.`,
        `Each ${d.dots === "workers" ? "profile" : "company"} links to ${one(w1.profile_degree_mean)} attributes on average; the largest hub, ${w1.attribute_hub}, to ${fmt(w1.attribute_degree_max)}. The plot shows how unevenly the links spread over the attributes.`,
      ],
    ],
    [
      "Week 2 · against random networks",
      [
        `The projection links two attributes when ${d.dots === "workers" ? "workers" : "companies"} share them: ${fmt(w2.projection_nodes)} nodes, ${fmt(w2.projection_links)} links, density ${two(w2.density)}.`,
        `Average path ${two(w2.mean_path)} steps against ${two(w2.mean_path_random)} in a random graph of the same size; clustering ${two(w2.transitivity)} against ${two(w2.transitivity_random)} random and ${two(w2.transitivity_rewired.mean)} rewired. ` +
          smallWorld,
        `Friendship paradox: neighbours average ${one(w2.friendship_paradox.mean_neighbour_degree)} links against ${one(w2.friendship_paradox.mean_degree)}; ${(w2.friendship_paradox.share_with_better_connected_neighbours * 100).toFixed(0)}% of attributes have better-connected neighbours.`,
      ],
    ],
    [
      "Week 3 · who sits in the middle",
      [
        `Most central by PageRank: ${tops("pagerank")}. Largest betweenness: ${tops("betweenness")}.`,
        `PageRank and degree agree at Spearman ${two(w3.spearman["degree~pagerank"])}; betweenness and degree at ${two(w3.spearman["degree~betweenness"])}. The deepest core holds ${fmt(w3.nodes_in_max_core)} attributes at k = ${w3.max_core}.`,
        `Degree mixing ${two(w3.assortativity.degree)} against ${two(w3.assortativity.degree_rewired.mean)} rewired: ` +
          (w3.assortativity.degree < 0
            ? `hubs link mostly to small attributes, ${w3.assortativity.degree > w3.assortativity.degree_rewired.mean ? "a little less than in the rewired networks" : "more than in the rewired networks"}.`
            : `hubs link to hubs, ${w3.assortativity.degree > w3.assortativity.degree_rewired.mean ? "more" : "less"} than in the rewired networks.`),
      ],
    ],
    [
      "Week 4 · communities, weights, backbone",
      [
        `Louvain finds ${s.louvain.communities_best} groups (Q ${two(s.louvain.Q_best)}); greedy merging ${fmt(w4.greedy.communities)} (NMI with Louvain ${two(w4.greedy.nmi_louvain)}); Infomap ${fmt(w4.infomap.communities)} (NMI ${two(w4.infomap.nmi_louvain)}).`,
        `Two seeds agree at NMI ${two(s.louvain.nmi_between_seeds_median)}. Against the main partition: ${robust}. Strength against degree on the projection: Spearman ${two(w4.strength_vs_degree_spearman)}.`,
        `The disparity filter at α = ${w4.backbone.alpha} keeps ${fmt(w4.backbone.links)} of the projection's links (${(w4.backbone.link_share * 100).toFixed(0)}%); the strongest: ${strongest}.`,
        w4.largest_clique === null
          ? "The backbone holds over 20,000 maximal cliques, too many for k-clique percolation."
          : `k-clique groups on the backbone (the largest clique ${w4.largest_clique} attributes): ${clique}.`,
      ],
    ],
  ];
}

/** The workers' or companies' table: { head, rows } for the 25 largest groups. */
export function entityTable(d) {
  const top = d.communities.slice(0, 25);
  return {
    head: [
      { text: "#" },
      { text: "Group" },
      { text: "Workers", className: "num" },
      { text: "H-1B", className: "num" },
      { text: "PERM", className: "num" },
      { text: "Main occupation" },
      { text: "Largest employers" },
    ],
    rows: top.map((c, i) => {
      const occ = c.fields.occupation?.[0];
      return [
        { swatch: swatchColour(i, d.top), text: String(c.id + 1) },
        { text: c.name },
        { text: fmt(c.workers), className: "num" },
        { text: fmt(c.h1b), className: "num" },
        { text: fmt(c.perm), className: "num" },
        { text: occ ? `${occ[0]} (${Math.round(occ[1] * 100)}%)` : "" },
        { text: c.top_employers.map(([n]) => n).join(", ") },
      ];
    }),
    title: `The ${top.length} largest of ${d.communities.length} groups`,
  };
}
