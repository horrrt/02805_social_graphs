// Section 3 figure: every client with 20 or more placed H-1B filings in a year.
// x = filings (log), y = share supplied by its largest vendor. Hover a dot for
// its numbers; click it, or search, to list its vendors. Drawn with the
// vendored ECharts build that the page loads before its modules, the same
// library as section 1.
import { esc } from "./cabinet.js";

const echarts = window.echarts;
const root = document.querySelector("#staffing-figure");
const host = root.querySelector(".staffing-chart .chart-host");
const panel = root.querySelector(".staffing-panel");
const search = root.querySelector(".staffing-search input");
const css = getComputedStyle(root);
const token = (name) => css.getPropertyValue(name).trim();
const SECTORS = [
  ["Finance and insurance", "--series-1", (s) => s === "52"],
  ["Health care", "--series-2", (s) => s === "62"],
  ["Other labelled sector", "--series-3", (s) => s !== ""],
  ["No sector label", "--series-none", () => true],
];
const sectorOf = (s) => SECTORS.find(([, , test]) => test(s));
const whole = new Intl.NumberFormat("en-US");
const num = (v) => whole.format(v);
const pct = (v) => (v > 0 && v < 0.005 ? "<1%" : `${Math.round(v * 100)}%`);
const share = (d) => d.top[0][1] / d.filings;

let data;
let year;
let selected;
const chart = echarts.init(host, null, { renderer: "canvas" });

function clients() {
  return data.years[year].shown;
}

function point(d) {
  return { value: [d.filings, share(d)], name: d.name, client: d };
}

function show(client) {
  selected = client;
  chart.setOption({ series: [{ id: "selected", data: client ? [point(client)] : [] }] });
  if (!client) return;
  const top = client.top.map(([f, n]) => [data.firms[f], n]);
  panel.innerHTML = `
    <h3>${esc(client.name)}</h3>
    <p class="meta">${sectorOf(client.sector)[0]} · ${num(client.filings)} placed filings ·
      ${num(client.vendors)} ${client.vendors === 1 ? "vendor" : "vendors"}</p>
    <ol>${top.map(([name, n]) => `
      <li><span class="name" title="${esc(name)}">${esc(name)}</span>
        <span class="share">${pct(n / client.filings)}</span>
        <span class="track"><span class="fill" style="width:${(100 * n) / client.filings}%"></span></span></li>`).join("")}
    </ol>
    ${client.rest ? `<p class="rest">${num(client.rest)} more filings from
      ${num(client.vendors - top.length)} other firms</p>` : ""}`;
}

function draw() {
  const rows = clients();
  // Name the three largest clients and the largest one-vendor client, no more.
  // ECharts copies data items, so match labels by name, not by object.
  const named = new Set([...rows.slice(0, 3), ...rows.filter((d) => share(d) >= 0.9).slice(0, 1)].map((d) => d.name));
  const series = SECTORS.map(([name, colour, test]) => ({
    type: "scatter",
    name,
    symbolSize: 9,
    itemStyle: { color: token(colour), borderColor: token("--surface"), borderWidth: 1.5 },
    emphasis: { scale: 1.4 },
    data: rows.filter((d) => sectorOf(d.sector)[2] === test).map(point),
  }));
  // The named clients carry their labels in a series of their own.
  series.push({
    id: "names",
    type: "scatter",
    name: "Names",
    symbolSize: 1,
    silent: true,
    itemStyle: { color: "transparent" },
    label: {
      show: true,
      position: "left",
      distance: 8,
      color: token("--paper"),
      fontWeight: 600,
      fontSize: 12,
      textBorderColor: token("--surface"),
      textBorderWidth: 3,
      formatter: (p) => p.data.name,
    },
    // The largest client sits among the other large ones: its name goes above.
    data: rows.filter((d) => named.has(d.name)).map((d, i) => ({
      ...point(d),
      label: i === 0 ? { position: "top", distance: 10 } : undefined,
    })),
  });
  series.push({
    id: "selected",
    type: "scatter",
    name: "Selected",
    symbolSize: 14,
    silent: true,
    z: 5,
    itemStyle: { color: "transparent", borderColor: token("--paper"), borderWidth: 2.5 },
    data: [],
  });
  chart.setOption(
    {
      animationDuration: 300,
      textStyle: { fontFamily: token("--sans") },
      grid: { left: 52, right: 20, top: 36, bottom: 64 },
      legend: {
        bottom: 0,
        left: 0,
        icon: "circle",
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: token("--muted"), fontSize: 13 },
        data: SECTORS.map(([name]) => name),
      },
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: token("--surface"),
        borderColor: token("--line"),
        textStyle: { color: token("--paper"), fontSize: 13 },
        formatter: (p) => {
          const d = p.data.client;
          return `<strong>${esc(d.name)}</strong><br />${num(d.filings)} filings · ${num(d.vendors)} vendors<br />
            ${pct(share(d))} from ${esc(data.firms[d.top[0][0]])}`;
        },
      },
      xAxis: {
        type: "log",
        logBase: 10,
        min: data.min_filings,
        // The next round value (1, 2 or 5 times a power of ten) past the largest client.
        max: (v) => [1, 2, 5, 10].map((m) => m * 10 ** Math.floor(Math.log10(v.max))).find((t) => t >= v.max * 1.05),
        name: "Placed filings in the year (log scale) →",
        nameLocation: "end",
        nameGap: 0,
        nameTextStyle: { color: token("--muted"), align: "right", verticalAlign: "top", padding: [28, 0, 0, 0] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: token("--muted"), formatter: (v) => (v >= 1000 ? `${v / 1000}k` : `${v}`) },
        splitLine: { lineStyle: { color: token("--grid") } },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        interval: 0.2,
        name: "↑ Share from the largest vendor",
        nameTextStyle: { color: token("--muted"), align: "left", padding: [0, 0, 6, -44] },
        axisLabel: { color: token("--muted"), formatter: (v) => `${Math.round(v * 100)}%` },
        splitLine: { lineStyle: { color: token("--grid") } },
      },
      series,
    },
    { replaceMerge: ["series"] },
  );

  search.setAttribute("placeholder", `${rows.length} clients · type a name`);
  root.querySelector("#staffing-names").innerHTML =
    rows.map((d) => `<option value="${esc(d.name)}"></option>`).join("");
  table(rows);
  show(rows.find((d) => selected && d.name === selected.name) ?? rows[0]);
}

function table(rows) {
  root.querySelector("tbody").innerHTML = rows.slice(0, 25).map((d) => `<tr><td>${esc(d.name)}</td>
    <td>${sectorOf(d.sector)[0]}</td><td class="num">${num(d.filings)}</td>
    <td class="num">${num(d.vendors)}</td><td>${esc(data.firms[d.top[0][0]])}</td>
    <td class="num">${pct(share(d))}</td></tr>`).join("");
}

chart.on("click", (p) => {
  if (p.data?.client) show(p.data.client);
});
search.addEventListener("change", () => {
  const d = clients().find((c) => c.name.toLowerCase() === search.value.trim().toLowerCase());
  if (d) show(d);
});
root.querySelectorAll(".staffing-years button").forEach((button) => {
  button.addEventListener("click", () => {
    year = button.dataset.year;
    root.querySelectorAll(".staffing-years button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b === button)));
    draw();
  });
});
window.addEventListener("resize", () => chart.resize());

fetch(new URL("../../weeks/week04/data/staffing_clients.json", import.meta.url))
  .then((r) => r.json())
  .then((json) => {
    data = json;
    year = root.querySelector('.staffing-years button[aria-pressed="true"]').dataset.year;
    draw();
  })
  .catch(() => {
    panel.textContent = "The figure's data did not load. The table below needs it too.";
  });
