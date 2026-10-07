// Week 4 redesign · who filed for which roles, #cut-roles. Stacked-area
// chart from public/weeks/week04/data/roles.json (analysis/week04_roles.py):
// certified H-1B filings split by detailed occupation, SOC major group,
// employer, or placed-at-a-client against direct employer, over the same
// five fiscal years as #cut-years. The card (src/features/week04/roles/)
// draws it with the vendored ECharts build, coloured from the card's own CSS
// tokens, once the box is first opened; this module builds the option, the
// tooltip and the text. `view` is { split, scale, window }, `token(name)`
// reads a colour and `T` is the type scale.

export const YEARS = ["2022", "2023", "2024", "2025", "2026"];
export const SPLIT_LABEL = {
  occupations: "Roles", groups: "Occupation groups", employer: "Employer", placement: "Placed or direct",
};
// What the answer calls a series in each split but placement.
const SPLIT_NOUN = { occupations: "role", groups: "occupation group", employer: "employer" };
const AREA_TOKENS = Array.from({ length: 14 }, (_, i) => `--w4-area-${i + 1}`);

/** The tokens the card reads. */
export const ROLES_TOKENS = [...AREA_TOKENS, "--w4-area-other", "--people", "--access", "--w4-band", "--ink-mute-text", "--line", "--w4-grid", "--w4-tip-bg", "--w4-tip-ink", "--ink-mute"];

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const whole = new Intl.NumberFormat("en-US");
const num = (v) => whole.format(Math.round(v));
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const word = (n) => WORDS[n] ?? String(n);

// Series hidden from the legend at first, per split. The ten named employers
// file about a fifth of all filings, so the Employer split starts with its
// catch-all band hidden; otherwise that band fills four fifths of the 100% view.
export const START_HIDDEN = { occupations: [], groups: [], employer: ["All other employers"], placement: [] };

// The catch-all band ("All other …") goes on top of the stack and last in the
// legend, so the named series sit together from the baseline up.
export function seriesOf(data, split) {
  const all = data.splits[split].series;
  return [...all.filter((s) => s.code !== null), ...all.filter((s) => s.code === null)];
}

export function colourOf(split, s, i, token) {
  if (split === "placement") return s.name === "Placed at a client" ? token("--people") : token("--access");
  if (s.code === null) return token("--w4-area-other");
  return token(AREA_TOKENS[i % AREA_TOKENS.length]);
}

const totalsFor = (data, view) => (view.window === "full" ? data.totals : data.oct_jun_totals);
const valuesFor = (s, view) => (view.window === "full" ? s.counts : s.oct_jun);

// FY2026 is nine months, not twelve; in the full-year window the stretch
// from FY2025 to FY2026 is shaded, so its shorter height is not read as a
// real fall. The mark lives on its own empty series, which the legend never
// lists, so hiding a named series cannot take the shading with it.
function partialYearSeries(data, view, xLabels, token, T) {
  if (view.window !== "full") return [];
  return [{
    id: "partial-year",
    name: "partial-year",
    type: "line",
    data: [],
    silent: true,
    tooltip: { show: false },
    markArea: {
      silent: true,
      itemStyle: { color: token("--w4-band"), opacity: 0.5 },
      label: { show: true, position: "insideTopRight", formatter: `${data.partial.year}: ${data.partial.window} only`, color: token("--ink-mute-text"), fontSize: T.fs("caption") },
      data: [[{ xAxis: xLabels[3] }, { xAxis: xLabels[4] }]],
    },
    z: 0,
  }];
}

function buildSeries(data, view, token) {
  const series = seriesOf(data, view.split);
  const totals = totalsFor(data, view);
  return series.map((s, i) => ({
    id: s.name,
    name: s.name,
    type: "line",
    stack: "roles",
    stackStrategy: "all",
    symbol: "none",
    areaStyle: { opacity: 0.86 },
    lineStyle: { width: 0.5 },
    emphasis: { focus: "series" },
    blur: { areaStyle: { opacity: 0.35 } },
    // Lets the area itself fire mouseover, so the tooltip knows the band.
    triggerLineEvent: true,
    itemStyle: { color: colourOf(view.split, s, i, token) },
    data: valuesFor(s, view).map((v, yi) => {
      const t = totals[YEARS[yi]];
      return view.scale === "percent" && t ? (100 * v) / t : v;
    }),
  }));
}

/** The chart; `hidden` is the split's hidden series, `hovered()` the band under the pointer. */
export function rolesOption(data, view, hidden, hovered, token, T) {
  const series = seriesOf(data, view.split);
  const names = series.map((s) => s.name);
  const xLabels = YEARS.map((y, i) => (view.window === "full" && i === 4 ? "2026 (Oct–Jun)" : y));
  return {
    animationDuration: 280,
    textStyle: { fontFamily: T.family("sans"), fontSize: T.fs("caption") },
    grid: { left: 56, right: 20, top: 20, bottom: 40 },
    legend: { show: false, data: names, selected: Object.fromEntries([...hidden].map((n) => [n, false])) },
    xAxis: {
      type: "category",
      data: xLabels,
      axisLine: { lineStyle: { color: token("--line") } },
      axisLabel: { color: token("--ink-mute-text"), fontSize: T.fs("caption") },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      // 100% is the ceiling only while every series shows; with some hidden the
      // axis fits what is left, still as a share of all filings.
      max: view.scale === "percent" && hidden.length === 0 ? 100 : null,
      axisLabel: {
        color: token("--ink-mute-text"), fontSize: T.fs("caption"),
        formatter: (v) => (view.scale === "percent" ? `${v}%` : num(v)),
      },
      splitLine: { lineStyle: { color: token("--w4-grid") } },
    },
    series: [...partialYearSeries(data, view, xLabels, token, T), ...buildSeries(data, view, token)],
    tooltip: {
      trigger: "axis",
      confine: true,
      backgroundColor: token("--w4-tip-bg"),
      borderWidth: 0,
      padding: [8, 10],
      extraCssText: "border-radius:8px;box-shadow:0 4px 14px rgba(11,31,58,.18);max-width:240px;white-space:normal;",
      axisPointer: { type: "line", lineStyle: { color: token("--ink-mute"), width: 1 } },
      textStyle: { color: token("--w4-tip-ink"), fontSize: T.fs("small") },
      formatter: (points) => compactTip(data, view, points, hovered(), token, T),
    },
  };
}

// One band when the pointer is on it: its share of the year, its filings and
// the change on the year before. Between bands: the year's total and its
// three largest named series, with a prompt to hover a band.
function compactTip(data, view, points, hovered, token, T) {
  const yi = points[0]?.dataIndex ?? 0;
  const total = totalsFor(data, view)[YEARS[yi]] || 1;
  const series = seriesOf(data, view.split);
  const partial = view.window === "full" && yi === 4;
  const head =
    `<div style="font-size:${T.fs("small")}px;opacity:.75">${esc(YEARS[yi])}${view.window === "oct_jun" || partial ? ", Oct–Jun" : ""}` +
    ` · ${num(total)} filings</div>`;

  const line = (s, big) => {
    const i = series.indexOf(s);
    const v = valuesFor(s, view)[yi];
    const swatch =
      `<span style="display:inline-block;flex:none;width:9px;height:9px;border-radius:2px;` +
      `background:${colourOf(view.split, s, i, token)};box-shadow:0 0 0 1px ${token("--w4-tip-ink")}"></span>`;
    const row =
      `<div style="display:flex;gap:6px;align-items:baseline;margin-top:${big ? 4 : 2}px">${swatch}` +
      `<span style="flex:1${big ? ";font-weight:700" : ""}">${esc(s.name)}</span><b>${pct(v / total)}</b></div>`;
    if (!big) return row;
    const prev = yi > 0 ? valuesFor(s, view)[yi - 1] : null;
    // Nine months against twelve is not a change on the year, so the partial
    // year in the full-year window says so instead.
    let change = "";
    if (partial) change = `, ${esc(data.partial.window)} only`;
    else if (prev) change = `, ${v >= prev ? "+" : "−"}${Math.abs(Math.round((100 * (v - prev)) / prev))}% on ${YEARS[yi - 1]}`;
    return `${row}<div style="margin-left:15px;font-size:${T.fs("small")}px;opacity:.8">${num(v)} filings${change}</div>`;
  };

  const shown = new Set(points.map((p) => p.seriesName));
  const band = hovered && shown.has(hovered) && series.find((s) => s.name === hovered);
  if (band) return head + line(band, true);
  const top = series
    .filter((s) => shown.has(s.name) && (s.code !== null || view.split === "placement"))
    .sort((a, b) => valuesFor(b, view)[yi] - valuesFor(a, view)[yi])
    .slice(0, 3);
  return `${head}${top.map((s) => line(s, false)).join("")}` +
    `<div style="margin-top:4px;font-size:${T.fs("small")}px;opacity:.7">Hover a band for its numbers</div>`;
}

/** The answer, the notice and the summary line for the view. */
export function rolesText(data, view) {
  const split = data.splits[view.split];
  const f = split.finding;
  const label = SPLIT_LABEL[view.split].toLowerCase();
  let answer;
  if (view.split === "placement") {
    answer =
      `${pct(data.splits.placement.series.find((s) => s.name === "Placed at a client").counts[3] / data.totals["2025"])} ` +
      "of 2025's certified filings placed the worker at a client, not their own employer.";
  } else {
    const top = split.series.find((s) => s.code !== null) || split.series[0];
    answer = `${top.name} is the largest ${SPLIT_NOUN[view.split]} over the five years, with ${num(top.counts[3])} certified filings in 2025.`;
  }
  let notice = null;
  if (f) {
    const entered = f.entered_top ? " It entered the top between 2022 and 2025." : "";
    const left = f.left_top ? " It left the top between 2022 and 2025." : "";
    notice =
      `${f.name} ${f.direction} the most as a share of certified filings from 2022 to 2025: ` +
      `${pct(f.share_fy2022_percent / 100)} to ${pct(f.share_fy2025_percent / 100)}` +
      `, ${Math.abs(f.change_pp).toFixed(1)} percentage points.${entered}${left}`;
  }
  const shown = split.series.filter((s) => s.code !== null || view.split === "placement").map((s) => s.name);
  const summary = `Showing ${label} by ${view.scale === "percent" ? "share" : "filings"}${view.window === "oct_jun" ? ", October to June only" : ""}: ${shown.join(", ")}.`;
  return { answer, notice, summary };
}

/** The Background and Method drawers' text. */
export function rolesReveal(data) {
  const legacy = Object.values(data.legacy_recoded).reduce((a, b) => a + b, 0);
  const uncoded = Object.values(data.uncoded).reduce((a, b) => a + b, 0);
  const meta = data.meta || {};
  const table = meta.legacy_codes ? ` the ${num(meta.legacy_codes)} computer-occupation codes it leaves split go through a fixed table` : "";
  const p = data.partial;
  const method =
    "Counts are certified H-1B filings only. Occupations are 2018 SOC codes. " +
    `${num(legacy)} filings still on 2010 codes move to their 2018 successors: a detailed O*NET code follows ` +
    `O*NET's own 2010-to-2019 crosswalk wherever it names a single successor, and${table || " the rest keep their broader code"}. ` +
    `${num(uncoded)} filings whose SOC code does not parse fall into "All other occupations" ` +
    `and "Other groups". ${p.year} covers ${p.window} only, ${p.months} months: "Oct to Jun only" ` +
    "compares it with the same months of earlier years.";
  const background =
    "Each band is one series' certified filings, largest total at the bottom and everything else on top. Hover a " +
    "band to see its share of that year, its filings and the change on the year before; hover a legend entry to " +
    `trace it. "Oct to Jun only" limits every year to the ${word(p.months)} months ${p.year} covers, the fair way ` +
    "to set it beside a full year.";
  return { background, method };
}
