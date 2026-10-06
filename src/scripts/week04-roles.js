// Week 4 redesign · who filed for which roles, #cut-roles. Stacked-area
// chart from public/weeks/week04/data/roles.json (analysis/week04_roles.py):
// certified H-1B filings split by detailed occupation, SOC major group,
// employer, or placed-at-a-client against direct employer, over the same
// five fiscal years as #cut-years. Drawn with the vendored ECharts build the
// page already loads (window.echarts), coloured from this page's own CSS
// tokens, and rendered once the box is first opened.
import { asset } from "./site.js";
import { esc } from "./cabinet.js";
import { fs, family } from "./type-scale.mjs";
import { drawer, termify } from "./week04-ui.js";

const echarts = window.echarts;
const details = document.querySelector("#cut-roles");
const card = document.querySelector("#roles-card");
const answerEl = document.querySelector("#roles-answer");
const summaryEl = document.querySelector("#roles-summary");
const noticeText = document.querySelector("#roles-notice-text");
const legendEl = document.querySelector("#roles-legend");
const revealsEl = document.querySelector("#roles-reveals");
const chartHost = document.querySelector("#roles-chart");

const YEARS = ["2022", "2023", "2024", "2025", "2026"];
const SPLIT_LABEL = {
  occupations: "Roles", groups: "Occupation groups", employer: "Employer", placement: "Placed or direct",
};
// What the answer calls a series in each split but placement.
const SPLIT_NOUN = { occupations: "role", groups: "occupation group", employer: "employer" };
const AREA_TOKENS = Array.from({ length: 14 }, (_, i) => `--w4-area-${i + 1}`);

const css = getComputedStyle(card);
const token = (name) => css.getPropertyValue(name).trim() || "currentColor";
const whole = new Intl.NumberFormat("en-US");
const num = (v) => whole.format(Math.round(v));
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const word = (n) => WORDS[n] ?? String(n);

let data;
let chart;
// The band under the pointer, from the chart's own mouseover/mouseout; null
// between bands. The tooltip shows that band alone when it is set.
let hovered = null;
const state = { split: "occupations", scale: "count", window: "full" };
// Series hidden from the legend, per split. The ten named employers file about
// a fifth of all filings, so the Employer split starts with its catch-all band
// hidden; otherwise that band fills four fifths of the 100% view.
const hidden = { occupations: new Set(), groups: new Set(), employer: new Set(["All other employers"]), placement: new Set() };

// The catch-all band ("All other …") goes on top of the stack and last in the
// legend, so the named series sit together from the baseline up.
function seriesOf(split) {
  const all = data.splits[split].series;
  return [...all.filter((s) => s.code !== null), ...all.filter((s) => s.code === null)];
}

function colourOf(split, s, i) {
  if (split === "placement") return s.name === "Placed at a client" ? token("--people") : token("--access");
  if (s.code === null) return token("--w4-area-other");
  return token(AREA_TOKENS[i % AREA_TOKENS.length]);
}

function totalsFor() {
  return state.window === "full" ? data.totals : data.oct_jun_totals;
}

function valuesFor(s) {
  return state.window === "full" ? s.counts : s.oct_jun;
}

// ---------------------------------------------------------------- the chart

// FY2026 is nine months, not twelve; in the full-year window the stretch
// from FY2025 to FY2026 is shaded, so its shorter height is not read as a
// real fall. The mark lives on its own empty series, which the legend never
// lists, so hiding a named series cannot take the shading with it.
function partialYearSeries(xLabels) {
  if (state.window !== "full") return [];
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
      label: { show: true, position: "insideTopRight", formatter: `${data.partial.year}: ${data.partial.window} only`, color: token("--ink-mute"), fontSize: fs("caption") },
      data: [[{ xAxis: xLabels[3] }, { xAxis: xLabels[4] }]],
    },
    z: 0,
  }];
}

function buildSeries(xLabels) {
  const series = seriesOf(state.split);
  const totals = totalsFor();
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
    itemStyle: { color: colourOf(state.split, s, i) },
    data: valuesFor(s).map((v, yi) => {
      const t = totals[YEARS[yi]];
      return state.scale === "percent" && t ? (100 * v) / t : v;
    }),
  }));
}

function render() {
  const series = seriesOf(state.split);
  const names = series.map((s) => s.name);
  const xLabels = YEARS.map((y, i) => (state.window === "full" && i === 4 ? "2026 (Oct–Jun)" : y));

  chart.setOption(
    {
      animationDuration: 280,
      textStyle: { fontFamily: family("sans"), fontSize: fs("caption") },
      grid: { left: 56, right: 20, top: 20, bottom: 40 },
      legend: { show: false, data: names, selected: Object.fromEntries([...hidden[state.split]].map((n) => [n, false])) },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: { lineStyle: { color: token("--line") } },
        axisLabel: { color: token("--ink-mute"), fontSize: fs("caption") },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        // 100% is the ceiling only while every series shows; with some hidden the
        // axis fits what is left, still as a share of all filings.
        max: state.scale === "percent" && hidden[state.split].size === 0 ? 100 : null,
        axisLabel: {
          color: token("--ink-mute"), fontSize: fs("caption"),
          formatter: (v) => (state.scale === "percent" ? `${v}%` : num(v)),
        },
        splitLine: { lineStyle: { color: token("--w4-grid") } },
      },
      series: [...partialYearSeries(xLabels), ...buildSeries(xLabels)],
      tooltip: {
        trigger: "axis",
        confine: true,
        backgroundColor: token("--w4-tip-bg"),
        borderWidth: 0,
        padding: [8, 10],
        extraCssText: "border-radius:8px;box-shadow:0 4px 14px rgba(11,31,58,.18);max-width:240px;white-space:normal;",
        axisPointer: { type: "line", lineStyle: { color: token("--ink-mute"), width: 1 } },
        textStyle: { color: token("--w4-tip-ink"), fontSize: fs("small") },
        formatter: (points) => compactTip(points),
      },
    },
    { notMerge: true },
  );
}

// One band when the pointer is on it: its share of the year, its filings and
// the change on the year before. Between bands: the year's total and its
// three largest named series, with a prompt to hover a band.
function compactTip(points) {
  const yi = points[0]?.dataIndex ?? 0;
  const total = totalsFor()[YEARS[yi]] || 1;
  const series = seriesOf(state.split);
  const partial = state.window === "full" && yi === 4;
  const head =
    `<div style="font-size:${fs("small")}px;opacity:.75">${esc(YEARS[yi])}${state.window === "oct_jun" || partial ? ", Oct–Jun" : ""}` +
    ` · ${num(total)} filings</div>`;

  const line = (s, big) => {
    const i = series.indexOf(s);
    const v = valuesFor(s)[yi];
    const swatch =
      `<span style="display:inline-block;flex:none;width:9px;height:9px;border-radius:2px;` +
      `background:${colourOf(state.split, s, i)};box-shadow:0 0 0 1px ${token("--w4-tip-ink")}"></span>`;
    const row =
      `<div style="display:flex;gap:6px;align-items:baseline;margin-top:${big ? 4 : 2}px">${swatch}` +
      `<span style="flex:1${big ? ";font-weight:700" : ""}">${esc(s.name)}</span><b>${pct(v / total)}</b></div>`;
    if (!big) return row;
    const prev = yi > 0 ? valuesFor(s)[yi - 1] : null;
    // Nine months against twelve is not a change on the year, so the partial
    // year in the full-year window says so instead.
    let change = "";
    if (partial) change = `, ${esc(data.partial.window)} only`;
    else if (prev) change = `, ${v >= prev ? "+" : "−"}${Math.abs(Math.round((100 * (v - prev)) / prev))}% on ${YEARS[yi - 1]}`;
    return `${row}<div style="margin-left:15px;font-size:${fs("small")}px;opacity:.8">${num(v)} filings${change}</div>`;
  };

  const shown = new Set(points.map((p) => p.seriesName));
  const band = hovered && shown.has(hovered) && series.find((s) => s.name === hovered);
  if (band) return head + line(band, true);
  const top = series
    .filter((s) => shown.has(s.name) && (s.code !== null || state.split === "placement"))
    .sort((a, b) => valuesFor(b)[yi] - valuesFor(a)[yi])
    .slice(0, 3);
  return `${head}${top.map((s) => line(s, false)).join("")}` +
    `<div style="margin-top:4px;font-size:${fs("small")}px;opacity:.7">Hover a band for its numbers</div>`;
}

// ---------------------------------------------------------------- legend

function renderLegend() {
  const series = seriesOf(state.split);
  const selected = chart.getOption().legend[0].selected || {};
  legendEl.innerHTML = "";
  series.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const pressed = selected[s.name] !== false;
    btn.setAttribute("aria-pressed", String(pressed));
    const sw = document.createElement("span");
    sw.className = "sw";
    sw.style.background = colourOf(state.split, s, i);
    const label = document.createElement("span");
    label.textContent = s.name;
    btn.append(sw, label);
    btn.addEventListener("mouseenter", () => chart.dispatchAction({ type: "highlight", seriesName: s.name }));
    btn.addEventListener("mouseleave", () => chart.dispatchAction({ type: "downplay", seriesName: s.name }));
    btn.addEventListener("click", () => {
      if (hidden[state.split].has(s.name)) hidden[state.split].delete(s.name);
      else hidden[state.split].add(s.name);
      // Re-render so the 100% axis ceiling follows what is shown.
      render();
      renderLegend();
      legendEl.querySelectorAll("button")[i]?.focus();
    });
    legendEl.appendChild(btn);
  });
}

// ---------------------------------------------------------------- text

function renderText() {
  const split = data.splits[state.split];
  const f = split.finding;
  const label = SPLIT_LABEL[state.split].toLowerCase();

  if (state.split === "placement") {
    answerEl.textContent =
      `${pct(data.splits.placement.series.find((s) => s.name === "Placed at a client").counts[3] / data.totals["2025"])} ` +
      "of 2025's certified filings placed the worker at a client, not their own employer.";
  } else {
    const top = split.series.find((s) => s.code !== null) || split.series[0];
    answerEl.textContent =
      `${top.name} is the largest ${SPLIT_NOUN[state.split]} over the five years, with ${num(top.counts[3])} certified filings in 2025.`;
  }

  if (f) {
    const entered = f.entered_top ? " It entered the top between 2022 and 2025." : "";
    const left = f.left_top ? " It left the top between 2022 and 2025." : "";
    noticeText.textContent =
      `${f.name} ${f.direction} the most as a share of certified filings from 2022 to 2025: ` +
      `${pct(f.share_fy2022_percent / 100)} to ${pct(f.share_fy2025_percent / 100)}` +
      `, ${Math.abs(f.change_pp).toFixed(1)} percentage points.${entered}${left}`;
  }

  const shown = split.series.filter((s) => s.code !== null || state.split === "placement").map((s) => s.name);
  summaryEl.textContent =
    `Showing ${label} by ${state.scale === "percent" ? "share" : "filings"}${state.window === "oct_jun" ? ", October to June only" : ""}: ${shown.join(", ")}.`;
}

function renderReveal() {
  if (revealsEl.childElementCount) return;
  const legacy = Object.values(data.legacy_recoded).reduce((a, b) => a + b, 0);
  const uncoded = Object.values(data.uncoded).reduce((a, b) => a + b, 0);
  const meta = data.meta || {};
  const table = meta.legacy_codes ? ` the ${num(meta.legacy_codes)} computer-occupation codes it leaves split go through a fixed table` : "";
  const p = data.partial;
  const text =
    "Counts are certified H-1B filings only. Occupations are 2018 SOC codes. " +
    `${num(legacy)} filings still on 2010 codes move to their 2018 successors: a detailed O*NET code follows ` +
    `O*NET's own 2010-to-2019 crosswalk wherever it names a single successor, and${table || " the rest keep their broader code"}. ` +
    `${num(uncoded)} filings whose SOC code does not parse fall into "All other occupations" ` +
    `and "Other groups". ${p.year} covers ${p.window} only, ${p.months} months: "Oct to Jun only" ` +
    "compares it with the same months of earlier years.";
  const body = document.createElement("p");
  body.textContent = text;
  termify(body, "crosswalk", "A published table that maps each old occupation code to its new code or codes.",
    "w4-term-roles-card-crosswalk");
  const background = document.createElement("p");
  background.textContent =
    "Each band is one series' certified filings, largest total at the bottom and everything else on top. Hover a " +
    "band to see its share of that year, its filings and the change on the year before; hover a legend entry to " +
    `trace it. "Oct to Jun only" limits every year to the ${word(p.months)} months ${p.year} covers, the fair way ` +
    "to set it beside a full year.";
  // #roles-reveals is itself the card's drawer row.
  revealsEl.append(drawer("Background", background), drawer("Method", body));
}

// ---------------------------------------------------------------- boot

function renderAll() {
  render();
  renderLegend();
  renderText();
}

function bindToggles(key) {
  const buttons = document.querySelectorAll(`[data-roles-${key}]`);
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state[key] = btn.getAttribute(`data-roles-${key}`);
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderAll();
    });
  });
}

let rendered = false;
function load() {
  if (rendered) return;
  rendered = true;
  fetch(asset("weeks/week04/data/roles.json"))
    .then((r) => r.json())
    .then((json) => {
      data = json;
      chart = echarts.init(chartHost, null, { renderer: "canvas" });
      chart.on("mouseover", { seriesType: "line" }, (p) => { hovered = p.seriesName; });
      chart.on("mouseout", { seriesType: "line" }, () => { hovered = null; });
      chart.on("globalout", () => { hovered = null; });
      bindToggles("split");
      bindToggles("scale");
      bindToggles("window");
      window.addEventListener("resize", () => chart.resize());
      renderAll();
      renderReveal();
      chart.resize();
    })
    .catch((err) => {
      console.error(err);
      answerEl.textContent = "Who filed for which roles did not load.";
      rendered = false;
    });
}

if (details.open) load();
details.addEventListener("toggle", () => {
  if (details.open) {
    load();
    if (chart) chart.resize();
  }
});
