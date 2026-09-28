// Week 4 redesign · who filed for which roles, #cut-roles. Stacked-area
// chart from docs/weeks/week04/data/roles.json (analysis/week04_roles.py):
// certified H-1B filings split by detailed occupation, SOC major group,
// employer, or placed-at-a-client against direct employer, over the same
// five fiscal years as #cut-years. Drawn with the vendored ECharts build the
// page already loads (window.echarts), coloured from this page's own CSS
// tokens, and rendered once the box is first opened.
import { esc } from "./cabinet.js";
import { drawer } from "./week04-ui.js";

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
// roles.json's top_in lists read "FY2025"; the page writes the plain year.
const yr = (s) => String(s).replace(/^FY(\d{4})/, "$1");
const SPLIT_LABEL = {
  occupations: "Roles", groups: "Occupation groups", employer: "Employer", placement: "Placed or direct",
};
const AREA_TOKENS = Array.from({ length: 14 }, (_, i) => `--w4-area-${i + 1}`);

const css = getComputedStyle(card);
const token = (name) => css.getPropertyValue(name).trim() || "currentColor";
const whole = new Intl.NumberFormat("en-US");
const num = (v) => whole.format(Math.round(v));
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;

let data;
let chart;
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
      label: { show: true, position: "insideTopRight", formatter: `${data.partial.year}: ${data.partial.window} only`, color: token("--ink-mute"), fontSize: 10.5 },
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
      textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
      grid: { left: 56, right: 20, top: 20, bottom: 40 },
      legend: { show: false, data: names, selected: Object.fromEntries([...hidden[state.split]].map((n) => [n, false])) },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: { lineStyle: { color: token("--line") } },
        axisLabel: { color: token("--ink-mute"), fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        // 100% is the ceiling only while every series shows; with some hidden the
        // axis fits what is left, still as a share of all filings.
        max: state.scale === "percent" && hidden[state.split].size === 0 ? 100 : null,
        axisLabel: {
          color: token("--ink-mute"), fontSize: 11,
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
        padding: [10, 12],
        textStyle: { color: token("--w4-tip-ink"), fontSize: 12 },
        formatter: (points) => tooltipHtml(points),
      },
    },
    { notMerge: true },
  );
}

function tooltipHtml(points) {
  const yi = points[0]?.dataIndex ?? 0;
  const totals = totalsFor();
  const total = totals[YEARS[yi]] || 1;
  const series = seriesOf(state.split);
  const rows = points
    .map((p) => {
      const s = series.find((row) => row.name === p.seriesName);
      const v = valuesFor(s)[yi];
      const top = s && s.top_in && s.top_in.length ? ` <i>(top ${data.splits[state.split].top_n} in ${s.top_in.map(yr).join(", ")})</i>` : "";
      return { html: `${p.marker}${esc(p.seriesName)}: <b>${num(v)}</b> (${pct(v / total)})${top}`, v };
    })
    .sort((a, b) => b.v - a.v);
  return `<div style="font-weight:700;margin-bottom:4px">${esc(YEARS[yi])}${state.window === "oct_jun" ? ", Oct–Jun" : ""}</div>${rows.map((r) => r.html).join("<br/>")}`;
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
    const noun = state.split === "occupations" ? "role" : state.split === "groups" ? "occupation group" : "employer";
    answerEl.textContent =
      `${top.name} is the largest ${noun} over the five years, with ${num(top.counts[3])} certified filings in 2025.`;
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
  // #roles-reveals is itself the card's drawer row.
  revealsEl.appendChild(drawer("Method", body));
}

// ---------------------------------------------------------------- boot

function renderAll() {
  render();
  renderLegend();
  renderText();
}

function bindToggles(attr, key, after) {
  document.querySelectorAll(`[data-roles-${attr}]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      state[key] = btn.getAttribute(`data-roles-${attr}`);
      document.querySelectorAll(`[data-roles-${attr}]`).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      after();
    });
  });
}

let rendered = false;
function load() {
  if (rendered) return;
  rendered = true;
  fetch(new URL("../../weeks/week04/data/roles.json", import.meta.url))
    .then((r) => r.json())
    .then((json) => {
      data = json;
      chart = echarts.init(chartHost, null, { renderer: "canvas" });
      bindToggles("split", "split", renderAll);
      bindToggles("scale", "scale", renderAll);
      bindToggles("window", "window", renderAll);
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
