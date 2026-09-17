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
  for (const [oi, di, stocks, , km, female, forced = 0] of edges.edges) {
    const people = stocks[yi];
    if (!people) continue;
    rows.push({
      o: edges.countries[oi],
      d: edges.countries[di],
      people,
      km,
      female: female >= 0 ? female : null,
      // UNHCR counts at the end of 2024, DESA estimates in the middle of it,
      // so a corridor that filled during the year can carry more refugees than
      // it carries people. Capping keeps every share on this page inside 100%
      // and makes the fast-moving corridors read low rather than impossible.
      forced: Math.min(forced, people),
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

// A quantile of a distance distribution weighted by how many people are on it.
// The median migrant, not the median corridor: a corridor of four people and a
// corridor of four million should not count the same.
function weightedQuantile(pairs, q = 0.5) {
  const sorted = [...pairs].sort((a, b) => a[0] - b[0]);
  const mark = sorted.reduce((sum, p) => sum + p[1], 0) * q;
  let seen = 0;
  for (const [value, weight] of sorted) {
    seen += weight;
    if (seen >= mark) return value;
  }
  return sorted.at(-1)?.[0] ?? 0;
}
const weightedMedian = (pairs) => weightedQuantile(pairs, 0.5);

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

// The ring is the one question with its own year, because the club of countries
// people move between is not a fixed list: it was a Soviet-successor story in
// 1990 and it is an American, Indian and Gulf one now. The other five questions
// stay on YEAR; changing the year under them would pair old stocks with a
// single snapshot of GDP, population and sex.
const ringState = { year: YEAR };

function ringRows(year) {
  const edges = api.state.edges;
  const yi = edges.years.indexOf(year);
  const rows = [];
  for (const [oi, di, stocks] of edges.edges) {
    const people = stocks[yi];
    if (!people) continue;
    rows.push({ o: edges.countries[oi], d: edges.countries[di], people });
  }
  return rows;
}

function ringData(year = ringState.year) {
  const rows = ringRows(year);
  const inn = new Map();
  const out = new Map();
  for (const r of rows) {
    out.set(r.o, (out.get(r.o) ?? 0) + r.people);
    inn.set(r.d, (inn.get(r.d) ?? 0) + r.people);
  }
  const keep = [...new Set([...inn.keys(), ...out.keys()])]
    .map((iso3) => [iso3, (inn.get(iso3) ?? 0) + (out.get(iso3) ?? 0)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, RING_N)
    .map(([iso3]) => iso3);
  const index = new Map(keep.map((iso3, i) => [iso3, i]));
  const matrix = keep.map(() => keep.map(() => 0));
  for (const r of rows) {
    const i = index.get(r.o);
    const j = index.get(r.d);
    if (i !== undefined && j !== undefined) matrix[i][j] += r.people;
  }
  const outArc = keep.map((_, i) => matrix[i].reduce((a, b) => a + b, 0));
  const into = keep.map((_, j) => matrix.reduce((sum, row) => sum + row[j], 0));
  const total = rows.reduce((sum, r) => sum + r.people, 0);
  return { keep, matrix, out: outArc, into, index, total };
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

  // The same club, computed at both ends of the slider, so the reader gets the
  // trend without having to remember what the ring looked like eight steps ago.
  const first = api.state.edges.years[0];
  const early = ringData(first);
  const earlyAmong = early.matrix.flat().reduce((a, b) => a + b, 0);
  const earlyShare = pct(earlyAmong, early.total);
  const share = pct(among, data.total);
  const joined = data.keep.filter((iso3) => !early.keep.includes(iso3));
  const left = early.keep.filter((iso3) => !data.keep.includes(iso3));
  const names = (list) => list.slice(0, 3).map((iso3) => model.name(iso3)).join(", ");

  const churn =
    ringState.year === first
      ? `Drag the slider forward and watch the rim change hands.`
      : `Between ${first} and ${ringState.year} the club itself changed hands: ` +
        `${names(joined) || "nobody"} moved in, ` +
        `${names(left) || "nobody"} dropped out. ` +
        `Its share of the world fell from <b>${one(earlyShare)}%</b> to ` +
        `<b>${one(share)}%</b> — not because the big corridors shrank, but ` +
        `because everything else grew around them.`;

  return (
    `These ${RING_N} countries are the ones most people move between, in ` +
    `${ringState.year}. Among themselves they account for ` +
    `<b>${api.format.fmt.format(among)}</b> people, ` +
    `<b>${one(share)}%</b> of everyone living outside their country of birth ` +
    `that year. ` +
    `The single heaviest ribbon is <b>${model.name(o)} → ${model.name(d)}</b> at ` +
    `${api.format.fmt.format(v)} people, ` +
    `<b>${(v / second[2]).toFixed(1)}×</b> the next one ` +
    `(${model.name(second[0])} → ${model.name(second[1])}). ` +
    `The ring is lopsided on purpose: a few countries are almost all deep rim ` +
    `(people left) and a few almost all pale (people arrived), and those are ` +
    `different kinds of country. ` +
    churn
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

/* ------------------------------------------- 4. wealth, growth and migration

   Two things wealth does. It decides what share of a country was born
   somewhere else, and it decides how far those people came. The second panel
   used to hold GDP growth against the same share; it was a vertical cloud with
   r = -0.10, so the growth null now lives in one labelled line under the
   charts and the space went to the finding that was only in the prose. */

// Destination income bands, shared with question 5 so the two charts cut the
// world the same way.
const TIERS = [
  [0, 5000, "under $5k"],
  [5000, 20000, "$5k–20k"],
  [20000, 50000, "$20k–50k"],
  [50000, Infinity, "over $50k"],
];

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

// How far the people arriving in each income band had to travel. Weighted by
// people, so this is the journey of the median migrant into that band.
function reachData() {
  return TIERS.map(([lo, hi, label]) => {
    const rows = model.rows.filter((r) => {
      const g = model.gdp(r.d);
      return g !== null && g >= lo && g < hi && r.km > 0;
    });
    const pairs = rows.map((r) => [r.km, r.people]);
    const people = rows.reduce((sum, r) => sum + r.people, 0);
    return {
      label,
      people,
      p25: weightedQuantile(pairs, 0.25),
      median: weightedQuantile(pairs, 0.5),
      p75: weightedQuantile(pairs, 0.75),
      far: pct(rows.filter((r) => r.km > 5000).reduce((s, r) => s + r.people, 0), people),
    };
  });
}

// Least squares through the log-log cloud, so the correlation in the corner is
// a line a reader can see rather than a number they have to trust.
function fitLine(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den ? num / den : 0;
  return { slope, at: (x) => my + slope * (x - mx) };
}

function drawWealthScatter(ctx, box, rows, list) {
  const { PEOPLE, INK, MUTE } = api.colours;
  const values = rows.map((d) => d.gdp);
  const domain = [Math.min(...values), Math.max(...values)];
  box.x = api.logScale(box, domain, "x");
  box.y = api.logScale(box, [0.02, 100], "y");
  api.axes(ctx, box, {
    xTicks: api.logTicks(domain[0], domain[1]),
    yTicks: [0.1, 1, 10, 100].map((v) => ({ value: v, label: `${v}%` })),
    xLabel: "GDP per capita, US$ (log)",
    yLabel: "Foreign-born share of population",
  });

  const xs = rows.map((d) => Math.log10(d.gdp));
  const ys = rows.map((d) => Math.log10(Math.max(d.share, 0.02)));
  const fit = fitLine(xs, ys);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.left, box.top, box.right - box.left, box.bottom - box.top);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(box.x(domain[0]), box.y(10 ** fit.at(Math.log10(domain[0]))));
  ctx.lineTo(box.x(domain[1]), box.y(10 ** fit.at(Math.log10(domain[1]))));
  ctx.strokeStyle = `rgba(${api.rgb(INK)},0.35)`;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  const r = api.rgb(PEOPLE);
  const placed = [];
  for (const d of rows) {
    d.px = box.x(d.gdp);
    d.py = box.y(Math.max(d.share, 0.02));
    const size = Math.max(2.2, Math.min(9, Math.log10(d.pop) - 4.4));
    ctx.beginPath();
    ctx.arc(d.px, d.py, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},0.45)`;
    ctx.fill();
    list.push({
      x: d.px, y: d.py, r: Math.max(size, 7), iso3: d.iso3,
      label:
        `<b>${model.name(d.iso3)}</b><br>` +
        `${one(d.share)}% of the population was born abroad<br>` +
        `$${api.format.fmt.format(Math.round(d.gdp))} per head · ` +
        `${d.growth === null ? "growth not published" : `${one(d.growth)}% growth`}`,
    });
  }

  // Name the countries a reader would otherwise have to hover for: the top of
  // the cloud, the two furthest from the line in either direction, and the
  // largest country on the chart. Chosen from the data, not typed in, so the
  // labels follow a data refresh instead of going stale against it.
  const residual = (d) => Math.log10(Math.max(d.share, 0.02)) - fit.at(Math.log10(d.gdp));
  const byShare = [...rows].sort((a, b) => b.share - a.share);
  const byResidual = [...rows].sort((a, b) => residual(a) - residual(b));
  const notable = new Set([
    ...byShare.slice(0, 3),
    ...byResidual.slice(0, 2),
    ...byResidual.slice(-1),
    [...rows].sort((a, b) => b.pop - a.pop)[0],
  ]);
  ctx.font = "600 10px -apple-system, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  for (const d of notable) {
    if (!d) continue;
    const right = d.px < (box.left + box.right) / 2;
    let y = d.py;
    // Two labels on one pixel row read as one long wrong label.
    while (placed.some((other) => Math.abs(other - y) < 11)) y -= 11;
    placed.push(y);
    ctx.textAlign = right ? "left" : "right";
    ctx.fillStyle = MUTE;
    ctx.fillText(fitText(ctx, model.name(d.iso3), 92), d.px + (right ? 8 : -8), y);
  }
}

function drawReach(ctx, box, list) {
  const { ACCESS, INK, MUTE } = api.colours;
  const bands = reachData();
  const domain = [400, 12000];
  box.x = api.logScale(box, domain, "x");
  api.axes(ctx, box, {
    xTicks: [500, 1000, 2000, 5000, 10000].map((v) => ({
      value: v,
      label: `${api.format.compact.format(v)} km`,
    })),
    yTicks: [],
    xLabel: "Distance from country of birth (log)",
  });

  const step = (box.bottom - box.top) / bands.length;
  const r = api.rgb(ACCESS);
  bands.forEach((band, i) => {
    const y = box.top + step * (i + 0.5);
    const x25 = box.x(band.p25);
    const x75 = box.x(band.p75);

    ctx.fillStyle = `rgba(${r},0.22)`;
    ctx.fillRect(x25, y - 11, x75 - x25, 22);
    ctx.beginPath();
    ctx.arc(box.x(band.median), y, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},0.95)`;
    ctx.fill();

    ctx.fillStyle = MUTE;
    ctx.font = "600 10px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(band.label, box.left - 8, y - 6);
    ctx.font = "10px -apple-system, system-ui, sans-serif";
    ctx.fillText(`${api.format.compact.format(band.people)} people`, box.left - 8, y + 7);

    ctx.fillStyle = INK;
    ctx.font = "600 11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${api.format.fmt.format(band.median)} km`, x75 + 9, y);

    list.push({
      box: [x25, y - 11, x75, y + 11],
      label:
        `<b>Destinations ${band.label} a head</b><br>` +
        `Median arrival came ${api.format.fmt.format(band.median)} km<br>` +
        `Middle half: ${api.format.fmt.format(band.p25)}–${api.format.fmt.format(band.p75)} km · ` +
        `${one(band.far)}% came over 5,000 km`,
    });
  });
}

function drawWealth() {
  const canvas = $("q-wealth");
  if (!canvas) return;
  const { ctx, width, height } = api.surface(canvas);
  const { INK, MUTE } = api.colours;
  const list = register("q-wealth");
  const data = wealthData();

  const gapX = 52;
  const panelWidth = (width - gapX) / 2;
  const foot = 18;

  const scatter = api.frame(panelWidth, height - foot, { l: 46, r: 12, t: 34, b: 44 });
  drawWealthScatter(ctx, scatter, data, list);

  const reach = api.frame(panelWidth, height - foot, { l: 86, r: 76, t: 34, b: 44 });
  reach.left += panelWidth + gapX;
  reach.right += panelWidth + gapX;
  drawReach(ctx, reach, list);

  const xs = data.map((d) => Math.log10(d.gdp));
  const ys = data.map((d) => Math.log10(Math.max(d.share, 0.02)));
  const titles = [
    [scatter, "How rich the destination is", `r = ${correlation(xs, ys).toFixed(2)} · n = ${data.length}`],
    [reach, "How far its foreign-born came", "bar: middle half · dot: median"],
  ];
  for (const [box, title, stat] of titles) {
    ctx.fillStyle = INK;
    ctx.font = "600 11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(title, box.left - (box === reach ? 70 : 0), box.top - 12);
    ctx.fillStyle = MUTE;
    ctx.font = "10px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(stat, box.right + (box === reach ? 70 : 0), box.top - 12);
  }

  // The panel that is not here. Growth was the obvious second axis and it
  // explains nothing, which is worth one line and not half a chart.
  const growing = data.filter((d) => d.growth !== null);
  const speed = correlation(
    growing.map((d) => d.growth),
    growing.map((d) => Math.log10(Math.max(d.share, 0.02))),
  );
  ctx.fillStyle = MUTE;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    `Dashed line: least squares through the cloud. Dot area is population. ` +
      `Against 2024 GDP growth instead of income, the same ${growing.length} countries give ` +
      `r = ${speed.toFixed(2)} — no relationship, so that panel is a sentence rather than a chart.`,
    0,
    height - 2,
  );
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
  const bands = reachData();
  const poorest = bands[0];
  const richest = bands.at(-1);
  return (
    `Wealth explains a lot; growth explains nothing. Across <b>${data.length}</b> countries the ` +
    `correlation between GDP per head and the foreign-born share of the population is ` +
    `<b>${level.toFixed(2)}</b> on log axes — ten times the income, roughly ` +
    `<b>${(10 ** fitLine(data.map((d) => Math.log10(d.gdp)), data.map((d) => Math.log10(Math.max(d.share, 0.02)))).slope).toFixed(1)}×</b> ` +
    `the foreign-born share. Put the same countries against their 2024 growth rate and it falls ` +
    `to <b>${speed.toFixed(2)}</b>: a fast year does not fill a country with migrants, a rich ` +
    `decade does. ` +
    `Wealth also buys distance, which is the right-hand panel and the real reason the two ` +
    `findings are one finding. The median person living in a country under $5,000 a head came ` +
    `<b>${api.format.fmt.format(poorest.median)} km</b> — a border crossing. In countries over ` +
    `$50,000 the median came <b>${api.format.fmt.format(richest.median)} km</b>, and ` +
    `<b>${one(richest.far)}%</b> of them came further than 5,000 km, against ` +
    `<b>${one(poorest.far)}%</b> at the bottom. Poor countries take their neighbours because ` +
    `neighbours are who arrives. Rich ones draw from the whole map.`
  );
}

/* ------------------------------------------ 5. skill, and what stands in for it

   The stock table cannot see a degree, so this question used to stop at the
   thing it can see: destination income. UNHCR's 2024 counts add the other
   half of it. Sorted by income is one story; sorted by whether anybody chose
   to go is a different one, and the poorest destinations turn out to be
   hosting the second. */

function incomeData() {
  // Both bars compare a corridor's two ends, so they need income at both. The
  // strip underneath compares destinations only — and insisting on the origin
  // there would quietly delete the origins that produce refugees, since Syria,
  // Afghanistan, Eritrea, Somalia and South Sudan are among the countries the
  // World Bank does not publish GDP per head for. It costs the bottom tier a
  // seventh of its people and a third of its refugees.
  const known = model.rows.filter((r) => model.gdp(r.o) && model.gdp(r.d));
  const placed = model.rows.filter((r) => model.gdp(r.d));
  const total = known.reduce((sum, r) => sum + r.people, 0);
  const placedTotal = placed.reduce((sum, r) => sum + r.people, 0);

  const slice = (from, denominator) => (label, test) => {
    const rows = from.filter(test);
    const people = rows.reduce((s, r) => s + r.people, 0);
    const forced = rows.reduce((s, r) => s + r.forced, 0);
    return {
      label,
      people,
      forced,
      share: pct(people, denominator),
      forcedShare: pct(forced, people),
    };
  };
  const inTier = ([lo, hi]) => (r) => model.gdp(r.d) >= lo && model.gdp(r.d) < hi;
  const tiers = TIERS.map((tier) => slice(known, total)(tier[2], inTier(tier)));
  const fled = TIERS.map((tier) => slice(placed, placedTotal)(tier[2], inTier(tier)));
  const steps = [
    ["at least 4× richer", (r) => model.gdp(r.d) >= 4 * model.gdp(r.o)],
    ["richer, under 4×", (r) => model.gdp(r.d) > model.gdp(r.o) && model.gdp(r.d) < 4 * model.gdp(r.o)],
    ["poorer", (r) => model.gdp(r.d) <= model.gdp(r.o)],
  ].map(([label, test]) => slice(known, total)(label, test));
  const forcedTotal = model.rows.reduce((s, r) => s + r.forced, 0);
  return { known, total, placed, placedTotal, tiers, fled, steps, forcedTotal };
}

function drawIncome() {
  const canvas = $("q-income");
  if (!canvas) return;
  const { ctx, width, height } = api.surface(canvas);
  const { PEOPLE, ACCESS, INK, MUTE } = api.colours;
  const list = register("q-income");
  const { tiers, fled, steps, placedTotal } = incomeData();

  const left = 16;
  const right = width - 16;
  const span = right - left;
  const tall = 44;

  // One bar draws a set of slices that add to 100%, in the order given.
  function stack(parts, colour, y, title) {
    ctx.fillStyle = INK;
    ctx.font = "600 12px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(title, left, y - 12);

    const boxes = [];
    let x = left;
    parts.forEach((part, i) => {
      const w = (part.share / 100) * span;
      const shade = 0.28 + (i / Math.max(parts.length - 1, 1)) * 0.62;
      ctx.fillStyle = `rgba(${api.rgb(colour)},${shade})`;
      ctx.fillRect(x, y, Math.max(w - 1.5, 0), tall);
      if (w > 52) {
        ctx.fillStyle = shade > 0.62 ? paper() : INK;
        ctx.font = "600 12px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${one(part.share)}%`, x + w / 2, y + tall / 2);
      }
      ctx.fillStyle = MUTE;
      ctx.font = "10px -apple-system, system-ui, sans-serif";
      ctx.textAlign = w > 52 ? "center" : "left";
      ctx.textBaseline = "top";
      ctx.fillText(part.label, w > 52 ? x + w / 2 : x, y + tall + 6);
      list.push({
        box: [x, y, x + w, y + tall],
        label:
          `<b>${part.label}</b><br>` +
          `${one(part.share)}% of migrants with income data at both ends<br>` +
          `${api.format.fmt.format(part.forced)} of them — ${one(part.forcedShare)}% — are ` +
          `refugees or asylum seekers`,
      });
      boxes.push({ part, x, w });
      x += w;
    });
    return boxes;
  }

  const tierBoxes = stack(tiers, PEOPLE, 40, "Where they live, by the destination's income");

  // Hanging under each slice: how much of that slice fled. Same columns, same
  // widths, so the eye compares down the page instead of across a legend. The
  // scale is fixed rather than fitted, because the point is the size of the
  // gap between the bottom tier and the rest.
  const CEIL = 40;
  const top = 142;
  const deep = 58;
  ctx.fillStyle = INK;
  ctx.font = "600 12px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("How many of them fled", left, top - 14);
  ctx.strokeStyle = `rgba(${api.rgb(MUTE)},0.45)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top + 0.5);
  ctx.lineTo(right, top + 0.5);
  ctx.stroke();

  tierBoxes.forEach(({ x, w }, i) => {
    const part = fled[i];
    const drop = Math.min(part.forcedShare / CEIL, 1) * deep;
    ctx.fillStyle = `rgba(${api.rgb(INK)},0.68)`;
    ctx.fillRect(x, top, Math.max(w - 1.5, 0), drop);
    ctx.fillStyle = INK;
    ctx.font = "600 11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = w > 52 ? "center" : "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${one(part.forcedShare)}%`, w > 52 ? x + w / 2 : x, top + drop + 5);
    list.push({
      box: [x, top, x + w, top + Math.max(drop, 10)],
      label:
        `<b>Destinations ${part.label} a head</b><br>` +
        `${api.format.fmt.format(part.forced)} refugees and asylum seekers, ` +
        `${one(part.forcedShare)}% of the ` +
        `${api.format.compact.format(part.people)} foreign-born living there`,
    });
  });
  ctx.fillStyle = MUTE;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    `depth scaled to ${CEIL}% · ${api.format.compact.format(placedTotal)} people with a ` +
      `destination income`,
    right,
    top - 14,
  );

  stack(steps, ACCESS, 260, "The destination against their own country of birth");

  ctx.fillStyle = MUTE;
  ctx.font = "10px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    "Fled: refugees and asylum seekers, UNHCR end-2024, capped at the corridor's stock. " +
      "Income tier is the destination's GDP per head — a proxy for selection, not a measure of anybody's skill.",
    left,
    324,
  );
}

function answerIncome() {
  const { known, total, fled, steps, forcedTotal } = incomeData();
  const coverage = pct(total, model.total);
  const top = fled.at(-1);
  const bottom = fled[0];
  return (
    `No table here knows who has a degree. What the data can show is the thing skill-selective ` +
    `visa systems actually do: sort people by destination income. ` +
    `<b>${one(steps[0].share + steps[1].share)}%</b> of migrants live somewhere richer than where ` +
    `they were born, <b>${one(steps[0].share)}%</b> of them at least four times richer, and only ` +
    `<b>${one(steps[2].share)}%</b> moved down the ladder. ` +
    `The bars hanging under the first one ask how much of that was a choice. UNHCR counts ` +
    `<b>${api.format.fmt.format(forcedTotal)}</b> refugees and asylum seekers on these corridors, ` +
    `and they are nowhere near evenly spread: <b>${one(bottom.forcedShare)}%</b> of the ` +
    `foreign-born in destinations under $5,000 a head fled, against ` +
    `<b>${one(top.forcedShare)}%</b> above $50,000. A third of the poorest tier is not a labour ` +
    `market at all. ` +
    `Read the income bars as evidence about sorting rather than skill — a nurse and a nanny are ` +
    `both in the top tier — and over the <b>${one(coverage)}%</b> of people whose corridor has a ` +
    `GDP figure at both ends.`
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

// The ring's own controls. Its answer is rewritten on every change, since the
// numbers in it belong to the year and the list on screen.
function redrawRing() {
  drawRing();
  wire("q-ring");
  const host = $("q-ring-answer");
  if (host) {
    host.innerHTML = answerRing();
    host.dataset.written = "on";
  }
}

function setupRingControls() {
  const scope = $("q-ring-scope");
  // The other five answers pair stocks with one snapshot of GDP, population and
  // sex, so they stay where that pairing holds. Saying which questions the year
  // moves is cheaper than a reader assuming it moves all six.
  if (scope)
    scope.textContent =
      `The slider changes this ring only. The five answers below are all ${YEAR}.`;
  const slider = $("q-ring-year");
  if (!slider || slider.dataset.ready) return;
  slider.dataset.ready = "on";

  const years = api.state.edges.years;
  const ends = slider.parentElement?.querySelector(".ends");
  if (ends) ends.innerHTML = `<span>${years[0]}</span><span>${years.at(-1)}</span>`;
  slider.max = String(years.length - 1);
  slider.value = String(Math.max(years.indexOf(ringState.year), 0));
  // The slider's value is an index into the eight snapshots, so without this a
  // screen reader announces "3" where the page says 2005.
  slider.setAttribute("aria-valuetext", String(ringState.year));

  slider.addEventListener("input", (event) => {
    ringState.year = years[Number(event.target.value)] ?? YEAR;
    slider.setAttribute("aria-valuetext", String(ringState.year));
    const now = $("q-ring-now");
    if (now) now.textContent = String(ringState.year);
    redrawRing();
  });
}

// Six canvases and a pass over 9,095 corridors is not free, and most readers
// never open the drawer. Nothing is computed until they do.
export function installQuestions(shared) {
  api = shared;
  const drawer = $("questions");
  if (!drawer) return;
  drawer.addEventListener("toggle", () => {
    if (drawer.open) {
      setupRingControls();
      render();
    }
  });
  if (drawer.open) {
    setupRingControls();
    render();
  }
  window.addEventListener("week03:restyle", () => {
    if (drawn && drawer.open) render();
  });
  window.addEventListener("resize", () => {
    if (drawn && drawer.open) render();
  });
}
