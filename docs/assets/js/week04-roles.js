// Week 4 redesign · who filed for which roles, #cut-roles. Stacked-area
// chart from docs/weeks/week04/data/roles.json (analysis/week04_roles.py):
// certified H-1B filings split by detailed occupation, SOC major group,
// employer, or placed-at-a-client against direct employer, over the same
// five fiscal years as #cut-years. Drawn with the vendored ECharts build the
// page already loads (window.echarts), coloured from this page's own CSS
// tokens, and rendered once the box is first opened.
import { esc } from "./cabinet.js";

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
const FY = YEARS.map((y) => `FY${y}`);
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

function seriesOf(split) {
  return data.splits[split].series;
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

// FY2026 is nine months, not twelve; shaded in the full-year window so its
// shorter bar is not read as a real fall against a full FY2025, attached to
// whichever series draws first so it sits behind the stack.
function partialYearMark(xLabels) {
  if (state.window !== "full") return undefined;
  return {
    silent: true,
    itemStyle: { color: token("--w4-band") },
    label: { show: true, position: "insideTop", formatter: "Partial year", color: token("--ink-mute"), fontSize: 10.5 },
    data: [[{ xAxis: xLabels[4] }, { xAxis: xLabels[4] }]],
  };
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
    markArea: i === 0 ? partialYearMark(xLabels) : undefined,
    data: valuesFor(s).map((v, yi) => {
      const t = totals[YEARS[yi]];
      return state.scale === "percent" && t ? (100 * v) / t : v;
    }),
  }));
}

function render() {
  const series = seriesOf(state.split);
  const names = series.map((s) => s.name);
  const xLabels = FY.map((f, i) => (state.window === "full" && i === 4 ? "FY2026 (Oct–Jun)" : f));

  chart.setOption(
    {
      animationDuration: 280,
      textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
      grid: { left: 56, right: 20, top: 20, bottom: 40 },
      legend: { show: false, data: names },
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
        max: state.scale === "percent" ? 100 : null,
        axisLabel: {
          color: token("--ink-mute"), fontSize: 11,
          formatter: (v) => (state.scale === "percent" ? `${v}%` : num(v)),
        },
        splitLine: { lineStyle: { color: token("--w4-grid") } },
      },
      series: buildSeries(xLabels),
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
      const top = s && s.top_in && s.top_in.length ? ` <i>(top ${state.split === "employer" ? 10 : state.split === "groups" ? 7 : 10} in ${s.top_in.join(", ")})</i>` : "";
      return { html: `${p.marker}${esc(p.seriesName)}: <b>${num(v)}</b> (${pct(v / total)})${top}`, v };
    })
    .sort((a, b) => b.v - a.v);
  return `<div style="font-weight:700;margin-bottom:4px">${esc(FY[yi])}${state.window === "oct_jun" ? ", Oct–Jun" : ""}</div>${rows.map((r) => r.html).join("<br/>")}`;
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
    btn.addEventListener("mouseenter", () => chart.dispatchAction({ type: "highlight", name: s.name }));
    btn.addEventListener("mouseleave", () => chart.dispatchAction({ type: "downplay", name: s.name }));
    btn.addEventListener("click", () => {
      chart.dispatchAction({ type: "legendToggleSelect", name: s.name });
      const now = chart.getOption().legend[0].selected || {};
      btn.setAttribute("aria-pressed", String(now[s.name] !== false));
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
      "of FY2025's certified filings placed the worker at a client, not their own employer.";
  } else {
    const top = split.series.find((s) => s.code !== null) || split.series[0];
    answerEl.textContent =
      `${esc(top.name)} leads every named ${state.split === "occupations" ? "role" : state.split === "groups" ? "group" : "employer"}` +
      `, with ${num(top.counts[3])} certified filings in FY2025.`;
  }

  if (f) {
    const entered = f.entered_top ? " It entered the top between FY2022 and FY2025." : "";
    const left = f.left_top ? " It left the top between FY2022 and FY2025." : "";
    noticeText.textContent =
      `${esc(f.name)}'s share of certified filings ${f.direction} the most from FY2022 to FY2025, ` +
      `${pct(f.share_fy2022_percent / 100)} to ${pct(f.share_fy2025_percent / 100)}` +
      `, ${Math.abs(f.change_pp).toFixed(1)} percentage points.${entered}${left}`;
  }

  const shown = split.series.filter((s) => s.code !== null || state.split === "placement").map((s) => s.name);
  summaryEl.textContent =
    `Showing ${label} by ${state.scale === "percent" ? "share" : "filings"}${state.window === "oct_jun" ? ", October to June only" : ""}: ${shown.join(", ")}.`;
}

function reveal(id, label, bodyText) {
  const span = document.createElement("span");
  span.className = "w4-tip";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-describedby", id);
  btn.innerHTML =
    '<svg aria-hidden="true" height="14" viewBox="0 0 24 24" width="14"><circle cx="12" cy="12" fill="none" r="9" stroke="currentColor" stroke-width="2"></circle>' +
    '<path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path></svg>' + esc(label);
  const pop = document.createElement("span");
  pop.className = "w4-pop";
  pop.id = id;
  pop.setAttribute("role", "tooltip");
  const b = document.createElement("b");
  b.textContent = label;
  const body = document.createElement("span");
  body.textContent = bodyText;
  pop.append(b, body);
  span.append(btn, pop);
  return span;
}

function renderReveal() {
  if (revealsEl.childElementCount) return;
  const legacy = Object.values(data.legacy_recoded).reduce((a, b) => a + b, 0);
  const uncoded = Object.values(data.uncoded).reduce((a, b) => a + b, 0);
  const text =
    "Counts are certified H-1B filings only. Occupations are 2018 SOC codes; " +
    `${num(legacy)} filings still on the twelve 2010 computer-occupation codes are moved to their 2018 successors ` +
    `before ranking, and ${num(uncoded)} filings whose SOC code does not parse fall into "All other occupations" ` +
    'and "Other groups". FY2026 covers October 2025 to June 2026, nine months, not a year: "Oct to Jun only" ' +
    "compares it with the same months of earlier years.";
  revealsEl.appendChild(reveal("w4-pop-roles-how", "How we counted", text));
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
