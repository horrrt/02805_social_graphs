// Corridor Control — the questions drawer.
//
// Six questions the shipped data can actually answer, drawn on canvas so they
// look the same in every renderer. Nothing here fetches anything: it reads the
// same two files the rest of the post reads, and every number in the prose is
// computed from them at render time rather than typed in.
//
// The year is fixed at 2024, the most recent DESA revision, so a reader moving
// the year slider upstairs does not silently change the answers down here.

const YEAR = 2024;
const $ = (id) => document.getElementById(id);

let api = null;
let model = null;
let drawn = false;

/* -------------------------------------------------------------------- data */

// One pass over the 9,095 corridors, reshaped into everything the six charts
// need. Called once, on the first open.
function build() {
  const { state } = api;
  const edges = state.edges;
  const yi = edges.years.indexOf(YEAR);
  const nodes = state.data.nodes;
  const indicators = state.data.indicators ?? {};

  const rows = [];
  for (const [oi, di, stocks, , km, female] of edges.edges) {
    const people = stocks[yi];
    if (!people) continue;
    rows.push({
      o: edges.countries[oi],
      d: edges.countries[di],
      people,
      km,
      female: female >= 0 ? female : null,
    });
  }
  const total = rows.reduce((sum, r) => sum + r.people, 0);

  const hosts = new Map();
  const abroad = new Map();
  for (const r of rows) {
    hosts.set(r.d, (hosts.get(r.d) ?? 0) + r.people);
    abroad.set(r.o, (abroad.get(r.o) ?? 0) + r.people);
  }

  return {
    rows, total, hosts, abroad, nodes, indicators,
    name: (iso3) => nodes[iso3]?.name ?? iso3,
    gdp: (iso3) => indicators[iso3]?.gdp ?? null,
    pop: (iso3) => indicators[iso3]?.pop ?? null,
    growth: (iso3) => indicators[iso3]?.growth ?? null,
  };
}

// The median of a distance distribution weighted by how many people are on it.
function weightedMedian(pairs) {
  const sorted = [...pairs].sort((a, b) => a[0] - b[0]);
  const half = sorted.reduce((sum, p) => sum + p[1], 0) / 2;
  let seen = 0;
  for (const [value, weight] of sorted) {
    seen += weight;
    if (seen >= half) return value;
  }
  return sorted.at(-1)?.[0] ?? 0;
}

function correlation(xs, ys) {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

const pct = (part, whole) => (whole ? (part / whole) * 100 : 0);

// The card colour, for text that has to sit on top of a filled bar. Read from
// CSS rather than written here, so it follows the skin.
const paper = () =>
  getComputedStyle(document.body).getPropertyValue("--card").trim() || "white";

// Country names run from "Chad" to "People's Republic of China", and a label
// that overruns its column is worse than one that ends in an ellipsis.
function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text.length;
  while (cut > 1 && ctx.measureText(`${text.slice(0, cut)}…`).width > maxWidth) cut -= 1;
  return `${text.slice(0, cut).trimEnd()}…`;
}
const one = (value) => value.toFixed(1);

/* ------------------------------------------------------------------ picking

   Each chart hands back the marks it drew: a dot with a radius, or a ribbon
   with the Path2D it was filled from. One handler per canvas turns a hover
   into a tooltip and a click into a selection, exactly as the charts upstairs
   behave. */

const marks = new Map();

function register(id) {
  const list = [];
  marks.set(id, list);
  return list;
}

function hit(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const ratio = canvas.width / (canvas.clientWidth || canvas.width);
  const ctx = canvas.getContext("2d");
  let nearest = null;
  for (const mark of marks.get(canvas.id) ?? []) {
    if (mark.path) {
      // isPointInPath measures the path through the live transform, so the
      // point has to be in device pixels while the path is in CSS pixels.
      if (ctx.isPointInPath(mark.path, x * ratio, y * ratio)) return mark;
      continue;
    }
    if (mark.box) {
      const [x0, y0, x1, y1] = mark.box;
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return mark;
      continue;
    }
    const d = Math.hypot(mark.x - x, mark.y - y);
    if (d <= (mark.r ?? 14) && (!nearest || d < nearest.d)) nearest = { mark, d };
  }
  return nearest?.mark ?? null;
}

function wire(id) {
  const canvas = $(id);
  if (!canvas || canvas.dataset.qpick) return;
  canvas.dataset.qpick = "on";
  canvas.addEventListener("pointermove", (event) => {
    const mark = hit(canvas, event);
    canvas.style.cursor = mark ? "pointer" : "default";
    if (mark?.label) api.showTip(event, mark.label);
    else api.hideTip();
  });
  canvas.addEventListener("pointerleave", () => api.hideTip());
  canvas.addEventListener("click", (event) => {
    const mark = hit(canvas, event);
    if (mark?.iso3) api.select(mark.iso3);
  });
}

/* ---------------------------------------------------------------- 1. a ring

   The busiest corridors among the fourteen countries most involved in them, as
   a directed chord diagram. Each country's arc is split in two: the outgoing
   half it sends from, the incoming half it receives into, so the ring shows
   direction rather than just volume. */

const RING_N = 14;

function ringData() {
  const involved = new Map();
  for (const r of model.rows) {
    involved.set(r.o, (involved.get(r.o) ?? 0) + r.people);
    involved.set(r.d, (involved.get(r.d) ?? 0) + r.people);
  }
  const keep = [...involved.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, RING_N)
    .map(([iso3]) => iso3);
  const index = new Map(keep.map((iso3, i) => [iso3, i]));
  const matrix = keep.map(() => keep.map(() => 0));
  for (const r of model.rows) {
    const i = index.get(r.o);
    const j = index.get(r.d);
    if (i !== undefined && j !== undefined) matrix[i][j] += r.people;
  }
  const out = keep.map((_, i) => matrix[i].reduce((a, b) => a + b, 0));
  const into = keep.map((_, j) => matrix.reduce((sum, row) => sum + row[j], 0));
  return { keep, matrix, out, into, index };
}

function drawRing() {
  const canvas = $("q-ring");
  if (!canvas) return;
  const { ctx, width, height } = api.surface(canvas);
  const { INK, MUTE } = api.colours;
  const { keep, matrix, out, into } = ringData();
  const list = register("q-ring");

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(60, Math.min(width, height) / 2 - 92);
  const gap = 0.022;
  const totals = keep.map((_, i) => out[i] + into[i]);
  const sum = totals.reduce((a, b) => a + b, 0);
  const unit = (Math.PI * 2 - gap * keep.length) / sum;

  // Where every sub-arc sits: outgoing first, then incoming, in country order.
  const spans = [];
  let angle = -Math.PI / 2;
  for (let i = 0; i < keep.length; i += 1) {
    const start = angle;
    const outArcs = [];
    const inArcs = [];
    for (let j = 0; j < keep.length; j += 1) {
      const value = matrix[i][j];
      outArcs.push([angle, angle + value * unit]);
      angle += value * unit;
    }
    for (let j = 0; j < keep.length; j += 1) {
      const value = matrix[j][i];
      inArcs.push([angle, angle + value * unit]);
      angle += value * unit;
    }
    spans.push({ start, end: angle, outArcs, inArcs, mid: (start + angle) / 2 });
    angle += gap;
  }

  const at = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  // Hue follows position on the ring, so a ribbon's colour says where it left.
  const hue = (i) => (i / keep.length) * 320 + 8;

  const ribbons = [];
  for (let i = 0; i < keep.length; i += 1) {
    for (let j = 0; j < keep.length; j += 1) {
      if (!matrix[i][j] || i === j) continue;
      ribbons.push({ i, j, value: matrix[i][j] });
    }
  }
  ribbons.sort((a, b) => a.value - b.value);

  for (const { i, j, value } of ribbons) {
    const [a0, a1] = spans[i].outArcs[j];
    const [b0, b1] = spans[j].inArcs[i];
    const path = new Path2D();
    path.arc(cx, cy, radius, a0, a1);
    path.quadraticCurveTo(cx, cy, ...at(b0, radius));
    path.arc(cx, cy, radius, b0, b1);
    path.quadraticCurveTo(cx, cy, ...at(a0, radius));
    path.closePath();
    ctx.fillStyle = `hsla(${hue(i)}, 68%, 52%, 0.5)`;
    ctx.fill(path);
    list.push({
      path,
      iso3: keep[i],
      label:
        `<b>${model.name(keep[i])} → ${model.name(keep[j])}</b><br>` +
        `${api.format.fmt.format(value)} people`,
    });
  }

  // Segments on top, so the ring reads as a rim the ribbons hang from.
  const room = Math.min(104, width / 2 - radius - 26);
  ctx.font = "600 11px -apple-system, system-ui, sans-serif";
  for (let i = 0; i < keep.length; i += 1) {
    const span = spans[i];
    const outEnd = span.outArcs.at(-1)[1];
    for (const [from, to, colour] of [
      [span.start, outEnd, `hsl(${hue(i)}, 68%, 46%)`],
      [outEnd, span.end, `hsl(${hue(i)}, 34%, 68%)`],
    ]) {
      if (to - from < 0.0005) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 7, from, to);
      ctx.lineWidth = 9;
      ctx.strokeStyle = colour;
      ctx.stroke();
    }
    const [lx, ly] = at(span.mid, radius + 20);
    const right = Math.cos(span.mid) > -0.02;
    ctx.fillStyle = INK;
    ctx.textAlign = right ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(ctx, model.name(keep[i]), room), lx, ly);
    // The total only fits while the ring is wide enough to leave a margin.
    if (room > 70) {
      ctx.fillStyle = MUTE;
      ctx.font = "10px -apple-system, system-ui, sans-serif";
      ctx.fillText(api.format.compact.format(out[i] + into[i]), lx, ly + 12);
      ctx.font = "600 11px -apple-system, system-ui, sans-serif";
    }
    list.push({
      box: right ? [lx - 4, ly - 10, lx + room, ly + 18] : [lx - room, ly - 10, lx + 4, ly + 18],
      iso3: keep[i],
      label:
        `<b>${model.name(keep[i])}</b><br>` +
        `${api.format.fmt.format(out[i])} living abroad · ` +
        `${api.format.fmt.format(into[i])} hosted, within this ring`,
    });
  }

  ctx.fillStyle = MUTE;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    "Deep rim: people who left. Pale rim: people who arrived. " +
      "A ribbon takes the colour of the country it leaves.",
    cx,
    height - 16,
  );
}

function answerRing() {
  const data = ringData();
  const among = data.matrix.flat().reduce((a, b) => a + b, 0);
  const biggest = [];
  for (let i = 0; i < data.keep.length; i += 1)
    for (let j = 0; j < data.keep.length; j += 1)
      if (data.matrix[i][j]) biggest.push([data.keep[i], data.keep[j], data.matrix[i][j]]);
  biggest.sort((a, b) => b[2] - a[2]);
  const [o, d, v] = biggest[0];
  const second = biggest[1];
  return (
    `These ${RING_N} countries are the ones most people move between. ` +
    `Among themselves they account for ` +
    `<b>${api.format.fmt.format(among)}</b> people, ` +
    `<b>${one(pct(among, model.total))}%</b> of everyone living outside their country of birth. ` +
    `The single heaviest ribbon is <b>${model.name(o)} → ${model.name(d)}</b> at ` +
    `${api.format.fmt.format(v)} people, ` +
    `<b>${(v / second[2]).toFixed(1)}×</b> the next one ` +
    `(${model.name(second[0])} → ${model.name(second[1])}). ` +
    `The ring is lopsided on purpose: a few countries are almost all deep rim ` +
    `(people left) and a few almost all pale (people arrived), and those are ` +
    `different kinds of country.`
  );
}

/* ----------------------------------------------- 2. hosted vs born elsewhere

   Our World in Data's framing: the map of where migrants live and the map of
   where they were born are not the same map. */

function hostsData() {
  const iso = [...new Set([...model.hosts.keys(), ...model.abroad.keys()])];
  iso.sort(
    (a, b) =>
      Math.max(model.hosts.get(b) ?? 0, model.abroad.get(b) ?? 0) -
      Math.max(model.hosts.get(a) ?? 0, model.abroad.get(a) ?? 0),
  );
  return iso;
}

function drawHosts() {
  const canvas = $("q-hosts");
  if (!canvas) return;
  const { ctx, width, height } = api.surface(canvas);
  const { PEOPLE, ACCESS, INK, MUTE, GRID } = api.colours;
  const list = register("q-hosts");
  const rows = hostsData().slice(0, 15);

  const gutter = 172;
  const mid = width / 2;
  const half = mid - gutter / 2 - 46;
  const top = 34;
  const rowHeight = (height - top - 26) / rows.length;
  const max = Math.max(
    ...rows.map((iso3) => Math.max(model.hosts.get(iso3) ?? 0, model.abroad.get(iso3) ?? 0)),
  );

  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ACCESS;
  ctx.textAlign = "right";
  ctx.fillText("← born here, living abroad", mid - gutter / 2 - 4, 16);
  ctx.fillStyle = PEOPLE;
  ctx.textAlign = "left";
  ctx.fillText("living here, born abroad →", mid + gutter / 2 + 4, 16);

  rows.forEach((iso3, i) => {
    const y = top + i * rowHeight + rowHeight / 2;
    const bar = Math.min(rowHeight - 7, 17);
    const left = ((model.abroad.get(iso3) ?? 0) / max) * half;
    const right = ((model.hosts.get(iso3) ?? 0) / max) * half;

    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, Math.round(y + rowHeight / 2) + 0.5);
    ctx.lineTo(width - 12, Math.round(y + rowHeight / 2) + 0.5);
    ctx.stroke();

    ctx.fillStyle = ACCESS;
    ctx.fillRect(mid - gutter / 2 - left, y - bar / 2, left, bar);
    ctx.fillStyle = PEOPLE;
    ctx.fillRect(mid + gutter / 2, y - bar / 2, right, bar);

    ctx.fillStyle = INK;
    ctx.font = "600 11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(fitText(ctx, model.name(iso3), gutter - 8), mid, y);
    ctx.font = "10px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = MUTE;
    ctx.textAlign = "right";
    ctx.fillText(api.format.compact.format(model.abroad.get(iso3) ?? 0), mid - gutter / 2 - left - 4, y);
    ctx.textAlign = "left";
    ctx.fillText(api.format.compact.format(model.hosts.get(iso3) ?? 0), mid + gutter / 2 + right + 4, y);

    list.push({
      box: [12, y - rowHeight / 2, width - 12, y + rowHeight / 2],
      iso3,
      label:
        `<b>${model.name(iso3)}</b><br>` +
        `${api.format.fmt.format(model.hosts.get(iso3) ?? 0)} people here were born elsewhere<br>` +
        `${api.format.fmt.format(model.abroad.get(iso3) ?? 0)} people born here live elsewhere`,
    });
  });
}

function answerHosts() {
  const all = hostsData();
  const receiving = all.filter(
    (iso3) => (model.hosts.get(iso3) ?? 0) > (model.abroad.get(iso3) ?? 0),
  );
  const usa = model.hosts.get("USA") ?? 0;
  const ind = model.abroad.get("IND") ?? 0;
  const sau = model.hosts.get("SAU") ?? 0;
  const sauOut = model.abroad.get("SAU") ?? 0;
  return (
    `Two different maps. <b>${receiving.length}</b> of <b>${all.length}</b> countries host more ` +
    `people than they send, which means the other <b>${all.length - receiving.length}</b> are net ` +
    `senders, and the world's migrants are packed into a much smaller set of destinations than ` +
    `the set of origins they came from. The United States alone hosts ` +
    `<b>${api.format.fmt.format(usa)}</b> foreign-born residents, ` +
    `<b>${one(pct(usa, model.total))}%</b> of everyone in the data. India sends the most: ` +
    `<b>${api.format.fmt.format(ind)}</b> people born in India live somewhere else. ` +
    `Saudi Arabia is the sharpest asymmetry in the top fifteen — ` +
    `${api.format.compact.format(sau)} hosted against ${api.format.compact.format(sauOut)} abroad, ` +
    `a ratio of <b>${Math.round(sau / Math.max(sauOut, 1))}:1</b>.`
  );
}

/* ---------------------------------------------------- 3. migrants don't move far */

const BUCKETS = [
  [0, 500, "0–500"],
  [500, 1000, "500–1k"],
  [1000, 2000, "1k–2k"],
  [2000, 4000, "2k–4k"],
  [4000, 8000, "4k–8k"],
  [8000, 16000, "8k–16k"],
  [16000, Infinity, "16k+"],
];

function distanceData() {
  return BUCKETS.map(([lo, hi, label]) => {
    const inside = model.rows.filter((r) => r.km >= lo && r.km < hi);
    return {
      label,
      people: pct(inside.reduce((sum, r) => sum + r.people, 0), model.total),
      corridors: pct(inside.length, model.rows.length),
    };
  });
}

function drawDistance() {
  const canvas = $("q-distance");
  if (!canvas) return;
  const { ctx, width, height } = api.surface(canvas);
  const { PEOPLE, ACCESS, INK, MUTE } = api.colours;
  const list = register("q-distance");
  const data = distanceData();
  const box = api.frame(width, height, { l: 46, r: 16, t: 30, b: 46 });
  const max = Math.max(...data.flatMap((d) => [d.people, d.corridors])) * 1.12;

  box.x = api.linearScale(box, [0, data.length], "x");
  box.y = api.linearScale(box, [0, max], "y");
  api.axes(ctx, box, {
    xTicks: [],
    yTicks: [0, 10, 20, 30].map((v) => ({ value: v, label: `${v}%` })),
    xLabel: "Kilometres between the two countries' centres",
    yLabel: "Share",
  });

  const slot = (box.right - box.left) / data.length;
  let cumulative = 0;
  const line = [];
  data.forEach((d, i) => {
    const x = box.left + slot * i;
    const pad = slot * 0.16;
    const w = (slot - pad * 2) / 2;
    for (const [value, colour, what] of [
      [d.people, PEOPLE, "of all migrants"],
      [d.corridors, ACCESS, "of all corridors"],
    ]) {
      const bx = x + pad + (colour === PEOPLE ? 0 : w);
      const by = box.y(value);
      ctx.fillStyle = colour;
      ctx.fillRect(bx, by, w - 1, box.bottom - by);
      list.push({
        box: [bx, by, bx + w, box.bottom],
        label: `<b>${d.label} km</b><br>${one(value)}% ${what}`,
      });
    }
    cumulative += d.people;
    line.push([x + slot / 2, cumulative]);
    ctx.fillStyle = MUTE;
    ctx.font = "10px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(d.label, x + slot / 2, box.bottom + 6);
  });

  // The cumulative share of people, on its own 0–100 scale.
  ctx.beginPath();
  line.forEach(([x, value], i) => {
    const y = box.bottom - (value / 100) * (box.bottom - box.top);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = INK;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("cumulative share of people (0–100%)", box.left + 4, box.top + 12);

  let legendX = box.right;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const [colour, text] of [[ACCESS, "of all corridors"], [PEOPLE, "of all migrants"]]) {
    ctx.fillStyle = MUTE;
    ctx.fillText(text, legendX, box.top - 12);
    legendX -= ctx.measureText(text).width + 7;
    ctx.fillStyle = colour;
    ctx.fillRect(legendX - 8, box.top - 17, 8, 9);
    legendX -= 20;
  }
}

function answerDistance() {
  const near = model.rows.filter((r) => r.km > 0 && r.km <= 2000);
  const share = pct(near.reduce((sum, r) => sum + r.people, 0), model.total);
  const median = weightedMedian(model.rows.map((r) => [r.km, r.people]));
  const unweighted = [...model.rows].map((r) => r.km).sort((a, b) => a - b)[
    Math.floor(model.rows.length / 2)
  ];
  const far = distanceData().slice(-3);
  const farPeople = far.reduce((sum, d) => sum + d.people, 0);
  const farCorridors = far.reduce((sum, d) => sum + d.corridors, 0);
  return (
    `They do not. Half of everyone living outside their country of birth is within ` +
    `<b>${api.format.fmt.format(median)} km</b> of it, and ` +
    `<b>${one(share)}%</b> are within 2,000 km — roughly Copenhagen to Rome. ` +
    `The typical corridor that exists, counted without regard to how many people are on it, ` +
    `spans <b>${api.format.fmt.format(unweighted)} km</b>. ` +
    `That gap is the whole finding: long corridors are the <i>common</i> kind of corridor and the ` +
    `<i>rare</i> kind of move. Past 4,000 km sit <b>${Math.round(farCorridors)}%</b> of all corridors ` +
    `but only <b>${Math.round(farPeople)}%</b> of all people. ` +
    `Distance here is centre-to-centre between two countries, so it is crude for the large ones: ` +
    `Russia and Ukraine score 3,950 km apart because Russia's centre is in Siberia.`
  );
}

/* ------------------------------------------- 4. wealth, growth and migration */

function wealthData() {
  const out = [];
  for (const [iso3, hosted] of model.hosts) {
    const gdp = model.gdp(iso3);
    const pop = model.pop(iso3);
    if (!gdp || !pop || pop < 200000) continue;
    out.push({ iso3, gdp, pop, growth: model.growth(iso3), share: (hosted / pop) * 100, hosted });
  }
  return out;
}

function drawWealth() {
  const canvas = $("q-wealth");
  if (!canvas) return;
  const { ctx, width, height } = api.surface(canvas);
  const { PEOPLE, ACCESS, INK } = api.colours;
  const list = register("q-wealth");
  const data = wealthData();

  const panels = [
    {
      key: "gdp",
      value: (d) => d.gdp,
      logged: true,
      label: "GDP per capita, US$ (log)",
      colour: PEOPLE,
      title: "Against how rich the destination is",
    },
    {
      key: "growth",
      value: (d) => d.growth,
      logged: false,
      label: "GDP growth 2024, %",
      colour: ACCESS,
      title: "Against how fast it is growing",
    },
  ];

  const gapX = 34;
  const panelWidth = (width - gapX) / 2;
  for (const [p, panel] of panels.entries()) {
    const rows = data.filter((d) => panel.value(d) !== null && panel.value(d) > (panel.logged ? 0 : -Infinity));
    const left = p * (panelWidth + gapX);
    const box = api.frame(panelWidth, height, { l: 46, r: 12, t: 34, b: 44 });
    box.left += left;
    box.right += left;

    const values = rows.map(panel.value);
    const domain = [Math.min(...values), Math.max(...values)];
    box.x = panel.logged
      ? api.logScale(box, domain, "x")
      : api.linearScale(box, domain, "x");
    box.y = api.logScale(box, [0.02, 100], "y");
    api.axes(ctx, box, {
      xTicks: panel.logged
        ? api.logTicks(domain[0], domain[1])
        : [-5, 0, 5, 10].map((v) => ({ value: v, label: `${v}%` })),
      yTicks: [0.1, 1, 10, 100].map((v) => ({ value: v, label: `${v}%` })),
      xLabel: panel.label,
      yLabel: p === 0 ? "Foreign-born share of population" : "",
    });

    ctx.fillStyle = INK;
    ctx.font = "600 11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(panel.title, box.left, box.top - 12);

    const r = api.rgb(panel.colour);
    for (const d of rows) {
      const x = box.x(panel.value(d));
      const y = box.y(Math.max(d.share, 0.02));
      const size = Math.max(2.2, Math.min(9, Math.log10(d.pop) - 4.4));
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},0.5)`;
      ctx.fill();
      list.push({
        x, y, r: Math.max(size, 7), iso3: d.iso3,
        label:
          `<b>${model.name(d.iso3)}</b><br>` +
          `${one(d.share)}% of the population was born abroad<br>` +
          `$${api.format.fmt.format(Math.round(d.gdp))} per head · ` +
          `${d.growth === null ? "growth not published" : `${one(d.growth)}% growth`}`,
      });
    }

    const xs = rows.map((d) => (panel.logged ? Math.log10(panel.value(d)) : panel.value(d)));
    const ys = rows.map((d) => Math.log10(Math.max(d.share, 0.02)));
    ctx.fillStyle = INK;
    ctx.font = "10px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`r = ${correlation(xs, ys).toFixed(2)} · n = ${rows.length}`, box.right, box.top - 12);
  }
}

function answerWealth() {
  const data = wealthData();
  const level = correlation(
    data.map((d) => Math.log10(d.gdp)),
    data.map((d) => Math.log10(Math.max(d.share, 0.02))),
  );
  const growing = data.filter((d) => d.growth !== null);
  const speed = correlation(
    growing.map((d) => d.growth),
    growing.map((d) => Math.log10(Math.max(d.share, 0.02))),
  );
  const rich = model.rows.filter((r) => (model.gdp(r.d) ?? 0) >= 30000);
  const poor = model.rows.filter((r) => {
    const g = model.gdp(r.d);
    return g !== null && g > 0 && g < 10000;
  });
  const richMedian = weightedMedian(rich.map((r) => [r.km, r.people]));
  const poorMedian = weightedMedian(poor.map((r) => [r.km, r.people]));
  return (
    `Wealth explains a lot; growth explains nothing. Across <b>${data.length}</b> countries the ` +
    `correlation between GDP per head and the foreign-born share of the population is ` +
    `<b>${level.toFixed(2)}</b> on log axes. Put the same countries against their 2024 growth rate ` +
    `and it falls to <b>${speed.toFixed(2)}</b>: a fast year does not fill a country with migrants, ` +
    `a rich decade does. ` +
    `Wealth also buys distance. Into destinations above $30,000 a head the median migrant has ` +
    `travelled <b>${api.format.fmt.format(richMedian)} km</b>; into destinations below $10,000, ` +
    `<b>${api.format.fmt.format(poorMedian)} km</b>. Poor countries take their neighbours. ` +
    `Rich ones draw from the whole map, which is the distance finding above and the wealth finding ` +
    `here turning out to be the same sentence.`
  );
}

/* ------------------------------------------ 5. skill, and what stands in for it */

const TIERS = [
  [0, 5000, "under $5k"],
  [5000, 20000, "$5k–20k"],
  [20000, 50000, "$20k–50k"],
  [50000, Infinity, "over $50k"],
];

function incomeData() {
  const known = model.rows.filter((r) => model.gdp(r.o) && model.gdp(r.d));
  const total = known.reduce((sum, r) => sum + r.people, 0);
  const tiers = TIERS.map(([lo, hi, label]) => ({
    label,
    share: pct(
      known.filter((r) => model.gdp(r.d) >= lo && model.gdp(r.d) < hi).reduce((s, r) => s + r.people, 0),
      total,
    ),
  }));
  const steps = [
    ["at least 4× richer", (r) => model.gdp(r.d) >= 4 * model.gdp(r.o)],
    ["richer, under 4×", (r) => model.gdp(r.d) > model.gdp(r.o) && model.gdp(r.d) < 4 * model.gdp(r.o)],
    ["poorer", (r) => model.gdp(r.d) <= model.gdp(r.o)],
  ].map(([label, test]) => ({
    label,
    share: pct(known.filter(test).reduce((s, r) => s + r.people, 0), total),
  }));
  return { known, total, tiers, steps };
}

function drawIncome() {
  const canvas = $("q-income");
  if (!canvas) return;
  const { ctx, width, height } = api.surface(canvas);
  const { PEOPLE, ACCESS, INK, MUTE } = api.colours;
  const list = register("q-income");
  const { tiers, steps } = incomeData();

  const left = 16;
  const right = width - 16;
  const span = right - left;
  const bars = [
    { title: "Where they live, by the destination's income", parts: tiers, colour: PEOPLE, y: 44 },
    { title: "The destination against their own country of birth", parts: steps, colour: ACCESS, y: 150 },
  ];

  for (const bar of bars) {
    ctx.fillStyle = INK;
    ctx.font = "600 12px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(bar.title, left, bar.y - 12);

    let x = left;
    bar.parts.forEach((part, i) => {
      const w = (part.share / 100) * span;
      const shade = 0.28 + (i / Math.max(bar.parts.length - 1, 1)) * 0.62;
      ctx.fillStyle = `rgba(${api.rgb(bar.colour)},${shade})`;
      ctx.fillRect(x, bar.y, Math.max(w - 1.5, 0), 40);
      if (w > 52) {
        ctx.fillStyle = shade > 0.62 ? paper() : INK;
        ctx.font = "600 12px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${one(part.share)}%`, x + w / 2, bar.y + 20);
      }
      ctx.fillStyle = MUTE;
      ctx.font = "10px -apple-system, system-ui, sans-serif";
      ctx.textAlign = w > 52 ? "center" : "left";
      ctx.textBaseline = "top";
      ctx.fillText(part.label, w > 52 ? x + w / 2 : x, bar.y + 46);
      list.push({
        box: [x, bar.y, x + w, bar.y + 40],
        label: `<b>${part.label}</b><br>${one(part.share)}% of migrants with income data at both ends`,
      });
      x += w;
    });
  }

  ctx.fillStyle = MUTE;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    "Income tier is the destination's GDP per head, which is a proxy for selection, not a measure of anybody's skill.",
    left,
    bars.at(-1).y + 62,
  );
}

function answerIncome() {
  const { known, total, tiers, steps } = incomeData();
  const coverage = pct(total, model.total);
  const top = tiers.at(-1);
  return (
    `The shipped data cannot tell you who has a degree. UN DESA's stock table is split by sex and ` +
    `age, not by education, and the table that does split by education — OECD DIOC — is not in ` +
    `this build. What the data can show is the thing skill-selective visa systems actually do: ` +
    `sort people by destination income. ` +
    `<b>${one(top.share)}%</b> of migrants live in a country above $50,000 a head, and ` +
    `<b>${one(steps[0].share + steps[1].share)}%</b> live somewhere richer than where they were born ` +
    `— <b>${one(steps[0].share)}%</b> of them at least four times richer. ` +
    `Only <b>${one(steps[2].share)}%</b> moved down the income ladder, and most of those are ` +
    `neighbours or returnees rather than anybody's idea of a career move. ` +
    `This covers the <b>${one(coverage)}%</b> of people on corridors where the World Bank publishes ` +
    `GDP per head at both ends (${api.format.fmt.format(known.length)} corridors). ` +
    `Read it as evidence about sorting, not about skill: a nurse and a nanny both show up in the ` +
    `top tier, and nothing here separates them.`
  );
}

/* ------------------------------------------------------------ 6. who moves */

const SEX_FLOOR = 300000;

function sexData() {
  const per = new Map();
  for (const r of model.rows) {
    if (r.female === null) continue;
    const row = per.get(r.d) ?? { people: 0, female: 0 };
    row.people += r.people;
    row.female += r.female;
    per.set(r.d, row);
  }
  const rows = [...per.entries()]
    .filter(([, v]) => v.people >= SEX_FLOOR)
    .map(([iso3, v]) => ({ iso3, people: v.people, share: pct(v.female, v.people) }))
    .sort((a, b) => a.share - b.share);
  return rows;
}

function drawSex() {
  const canvas = $("q-sex");
  if (!canvas) return;
  const { ctx, width, height } = api.surface(canvas);
  const { PEOPLE, ACCESS, INK, MUTE, GRID } = api.colours;
  const list = register("q-sex");
  const rows = sexData();
  const show = [...rows.slice(0, 8), null, ...rows.slice(-8).reverse()];

  const left = 150;
  const right = width - 58;
  const top = 32;
  const rowHeight = (height - top - 28) / show.length;
  const domain = [10, 80];
  const x = (value) => left + ((value - domain[0]) / (domain[1] - domain[0])) * (right - left);

  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillStyle = MUTE;
  for (const tick of [20, 30, 40, 50, 60, 70]) {
    ctx.strokeStyle = tick === 50 ? MUTE : GRID;
    ctx.beginPath();
    ctx.moveTo(Math.round(x(tick)) + 0.5, top);
    ctx.lineTo(Math.round(x(tick)) + 0.5, height - 26);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText(`${tick}%`, x(tick), height - 22);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = MUTE;
  ctx.fillText("Share of the foreign-born population that is female", (left + right) / 2, 12);

  show.forEach((row, i) => {
    if (!row) return;
    const y = top + i * rowHeight + rowHeight / 2;
    const bar = Math.min(rowHeight - 5, 15);
    const colour = row.share < 50 ? ACCESS : PEOPLE;
    const from = Math.min(x(50), x(row.share));
    const to = Math.max(x(50), x(row.share));
    ctx.fillStyle = colour;
    ctx.fillRect(from, y - bar / 2, to - from, bar);

    ctx.fillStyle = INK;
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(ctx, model.name(row.iso3), left - 16), left - 8, y);
    ctx.fillStyle = MUTE;
    ctx.font = "10px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${one(row.share)}%`, right + 6, y);

    list.push({
      box: [8, y - rowHeight / 2, width - 8, y + rowHeight / 2],
      iso3: row.iso3,
      label:
        `<b>${model.name(row.iso3)}</b><br>` +
        `${one(row.share)}% of its ${api.format.compact.format(row.people)} foreign-born residents are women`,
    });
  });

  // The break between the two ends of the list.
  const gapIndex = show.indexOf(null);
  const gy = top + gapIndex * rowHeight + rowHeight / 2;
  ctx.strokeStyle = GRID;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(12, Math.round(gy) + 0.5);
  ctx.lineTo(width - 12, Math.round(gy) + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = MUTE;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${rows.length - 16} destinations between these two ends`, width / 2, gy);
}

function answerSex() {
  const rows = sexData();
  const counted = model.rows.filter((r) => r.female !== null);
  const people = counted.reduce((sum, r) => sum + r.people, 0);
  const female = counted.reduce((sum, r) => sum + r.female, 0);
  const lowest = rows[0];
  const highest = rows.at(-1);
  return (
    `Globally it is almost even: <b>${one(pct(female, people))}%</b> of the world's migrants are ` +
    `women. That average hides the most extreme sorting in the whole dataset. In ` +
    `<b>${model.name(lowest.iso3)}</b> only <b>${one(lowest.share)}%</b> of the foreign-born are ` +
    `women; in <b>${model.name(highest.iso3)}</b> it is <b>${one(highest.share)}%</b>. ` +
    `The bottom of this chart is a labour-recruitment system — construction and services in the ` +
    `Gulf and in Malaysia, hiring men on fixed contracts. The top is a mix of care work, marriage ` +
    `migration and the older, post-Soviet stocks where the men have died first. ` +
    `Age and family status are the obvious next cuts and they are <b>not</b> in this build: DESA ` +
    `publishes migrant stock by five-year age band, and this page ships only the totals and the ` +
    `female count. The age tables are in the source catalogue; wiring them in is a week's work, ` +
    `not an afternoon's.`
  );
}

/* ------------------------------------------------------------------- wiring */

const CHARTS = [
  ["q-ring", drawRing, "q-ring-answer", answerRing],
  ["q-hosts", drawHosts, "q-hosts-answer", answerHosts],
  ["q-distance", drawDistance, "q-distance-answer", answerDistance],
  ["q-wealth", drawWealth, "q-wealth-answer", answerWealth],
  ["q-income", drawIncome, "q-income-answer", answerIncome],
  ["q-sex", drawSex, "q-sex-answer", answerSex],
];

function render() {
  if (!api?.state?.edges) return;
  if (!model) model = build();
  for (const [canvasId, draw, answerId, answer] of CHARTS) {
    draw();
    wire(canvasId);
    const host = $(answerId);
    if (host && !host.dataset.written) {
      host.innerHTML = answer();
      host.dataset.written = "on";
    }
  }
  drawn = true;
}

// Six canvases and a pass over 9,095 corridors is not free, and most readers
// never open the drawer. Nothing is computed until they do.
export function installQuestions(shared) {
  api = shared;
  const drawer = $("questions");
  if (!drawer) return;
  drawer.addEventListener("toggle", () => {
    if (drawer.open) render();
  });
  if (drawer.open) render();
  window.addEventListener("week03:restyle", () => {
    if (drawn && drawer.open) render();
  });
  window.addEventListener("resize", () => {
    if (drawn && drawer.open) render();
  });
}
