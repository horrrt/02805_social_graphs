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
const flowsHost = root.querySelector(".staffing-flows .chart-host");
const flowsChart = echarts.init(flowsHost, null, { renderer: "canvas" });

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
  drawFlows();
  show(rows.find((d) => selected && d.name === selected.name) ?? rows[0]);
}

// Vendor -> client flows. Node names carry a side prefix, because a firm can be
// a vendor and a client at once (Deloitte places workers and receives them).
function drawFlows() {
  const f = data.years[year].flows;
  const v = (i) => `v:${f.vendors[i].name}`;
  const c = (i) => `c:${f.clients[i].name}`;
  const side = (name) => name.slice(2);
  const nodes = [
    ...f.vendors.map((d, i) => ({
      name: v(i),
      placed: d.placed,
      vendor: true,
      other: d.other,
      label: { position: "left" },
      itemStyle: d.other ? { color: token("--series-none") } : undefined,
    })),
    ...f.clients.map((d, i) => ({ name: c(i), placed: d.placed, vendor: false, label: { position: "right" } })),
  ];
  flowsChart.setOption(
    {
      animationDuration: 300,
      textStyle: { fontFamily: token("--sans") },
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: token("--surface"),
        borderColor: token("--line"),
        textStyle: { color: token("--paper"), fontSize: 13 },
        formatter: (p) => {
          if (p.dataType === "edge") {
            const client = f.clients.find((d) => d.name === side(p.data.target));
            return `<strong>${esc(side(p.data.source))} → ${esc(side(p.data.target))}</strong><br />
              ${num(p.data.value)} filings, ${pct(p.data.value / client.placed)} of the client's placed filings`;
          }
          const d = p.data;
          if (d.other) return `<strong>All other firms</strong><br />${num(d.placed)} filings to these ${f.clients.length} clients`;
          return `<strong>${esc(side(d.name))}</strong><br />${num(d.placed)} placed filings in the year${
            d.vendor ? ", to all its clients" : ", from all firms"}`;
        },
      },
      series: [
        {
          type: "sankey",
          left: 170,
          right: 190,
          top: 8,
          bottom: 8,
          nodeWidth: 10,
          nodeGap: 6,
          layoutIterations: 0,
          draggable: false,
          emphasis: { focus: "adjacency" },
          itemStyle: { color: token("--paper"), borderWidth: 0 },
          lineStyle: { color: token("--series-none"), opacity: 0.55, curveness: 0.5 },
          label: { color: token("--paper"), fontSize: 12, formatter: (p) => side(p.name) },
          data: nodes,
          links: f.links.map(([vi, ci, n]) => ({
            source: v(vi),
            target: c(ci),
            value: n,
            // The named firms' bands in colour; every other firm's in grey.
            lineStyle: f.vendors[vi].other ? { opacity: 0.35 } : { color: token("--series-1"), opacity: 0.45 },
          })),
        },
      ],
    },
    { notMerge: true },
  );
  root.querySelector(".flows-coverage").textContent =
    `The ${f.vendors.length - 1} largest firms supply ${num(f.from_top_vendors)} of the ${num(f.client_filings)} filings these ${f.clients.length} clients receive (${pct(f.from_top_vendors / f.client_filings)}); every other firm together supplies the rest.`;
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
window.addEventListener("resize", () => {
  chart.resize();
  flowsChart.resize();
});

// Communities with and without filing counts, from analysis/week04_staffing.py.
const stats = document.querySelector("#staffing-community-stats");
const two = (v) => v.toFixed(2);
fetch(new URL("../../weeks/week04/data/staffing_communities.json", import.meta.url))
  .then((r) => r.json())
  .then((c) => {
    const m = c.modularity;
    const w = c.weighted_vs_unweighted;
    const iv = c.industry_or_vendor;
    const row = (label, weighted, plain) =>
      `<tr><td>${label}</td><td style="text-align:right">${weighted}</td><td style="text-align:right">${plain}</td></tr>`;
    stats.querySelector("tbody").innerHTML = [
      row("Communities (median run)", num(m.communities_median), num(w.communities_median_unweighted)),
      row("Modularity, real network", two(m.weighted_vs_rewired.real), two(m.wiring_only.real)),
      row("Modularity, rewired null", two(m.weighted_vs_rewired.null), two(m.wiring_only.null)),
      row("NMI between two seeds", two(w.nmi_between_seeds_weighted), two(w.nmi_between_seeds_unweighted)),
      row("NMI with client industry", two(iv.nmi_community_industry), two(iv.unweighted.nmi_community_industry)),
      row("NMI with main vendor", two(iv.nmi_community_main_vendor_same_clients),
        two(iv.unweighted.nmi_community_main_vendor_same_clients)),
    ].join("");
    const fill = {
      ".cross": w.nmi_median,
      ".seeds": w.nmi_between_seeds_weighted,
      ".seeds-plain": w.nmi_between_seeds_unweighted,
      ".vendor": iv.nmi_community_main_vendor_same_clients,
      ".vendor-plain": iv.unweighted.nmi_community_main_vendor_same_clients,
      ".industry": iv.nmi_community_industry,
      ".im-louvain": c.infomap.nmi_with_louvain,
      ".im-vendor": c.infomap.nmi_community_main_vendor_same_clients,
      ".im-industry": c.infomap.nmi_community_industry,
    };
    stats.querySelector(".im-modules").textContent = num(c.infomap.modules);
    for (const [sel, v] of Object.entries(fill)) stats.querySelector(sel).textContent = two(v);
  })
  .catch(() => {
    stats.querySelector("tbody").innerHTML = "<tr><td>The community numbers did not load.</td></tr>";
  });

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
