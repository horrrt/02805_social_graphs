// Section 2 figure: certified H-1B occupation co-hiring network.
const DATA_URL = new URL("../../weeks/week04/data/jobs.json", import.meta.url);
const INK = "#0f2340";
const MUTE = "#7a8fac";
const LINE = "#e6edf5";
const ORANGE = "#f2820c";
const BLUE = "#1f8fd6";
const PALETTE = ["#1f8fd6", "#eb6834", "#1baf7a", "#8b68c9", "#d18b27", "#3c9ba5"];
const whole = new Intl.NumberFormat("en-US");
const num = (value) => whole.format(value);
const short = (title) => title.replace(/\s+\([^)]*\)$/, "").replace(/\s+/g, " ");
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const base = {
  animationDuration: 360,
  textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  tooltip: {
    confine: true,
    backgroundColor: "rgba(15,35,64,0.94)",
    borderWidth: 0,
    textStyle: { color: "#eaf2fb", fontSize: 12 },
  },
};
const axis = {
  axisLine: { lineStyle: { color: "#c6d4e6" } },
  axisLabel: { color: MUTE, fontSize: 11 },
  splitLine: { lineStyle: { color: LINE, type: "dashed" } },
};

function chart(id) {
  const host = $(id);
  return host ? window.echarts.init(host, null, { renderer: "canvas" }) : null;
}

const charts = [];

function renderPairs(data) {
  const c = chart("chart-job-pairs");
  charts.push(c);
  const rows = data.pairs.slice(0, 12).reverse();
  c.setOption({
    ...base,
    grid: { left: 178, right: 24, top: 12, bottom: 36 },
    xAxis: { ...axis, type: "value", name: "shared employers →", nameLocation: "middle", nameGap: 28 },
    yAxis: { ...axis, type: "category", data: rows.map((p) => `${short(data.nodes.find((n) => n.id === p.source)?.title || p.source)} × ${short(data.nodes.find((n) => n.id === p.target)?.title || p.target)}`), axisLabel: { ...axis.axisLabel, width: 160, overflow: "truncate" } },
    tooltip: { ...base.tooltip, trigger: "item", formatter: (p) => `<b>${esc(p.name)}</b><br>${num(p.value)} shared employers` },
    series: [{ type: "bar", data: rows.map((p) => p.weight), barMaxWidth: 18, itemStyle: { color: BLUE, borderRadius: [0, 4, 4, 0] } }],
  });
}

function inspector(node, data) {
  const panel = $("jobs-inspector");
  if (!node) return;
  const partners = data.edges
    .filter((edge) => edge.source === node.id || edge.target === node.id)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((edge) => {
      const id = edge.source === node.id ? edge.target : edge.source;
      const other = data.nodes.find((item) => item.id === id);
      return `<li><span>${esc(short(other?.title || id))}</span><b>${num(edge.weight)}</b></li>`;
    }).join("");
  panel.innerHTML = `<h2>${esc(short(node.title))}</h2><p class="jobs-meta">SOC ${esc(node.id)} · ${num(node.filings)} certified filings</p><p>${node.bridge ? "This occupation bridges two network clusters." : "This occupation sits mainly inside one network cluster."}</p><h3>Closest hiring partners</h3><ol class="jobs-partners">${partners || "<li>No displayed partner edges</li>"}</ol>`;
}

function renderNetwork(data) {
  const c = chart("chart-job-network");
  charts.push(c);
  const nodes = data.nodes.map((node) => ({
    id: node.id,
    name: short(node.title),
    value: node.filings,
    category: node.cluster,
    symbolSize: Math.max(9, Math.min(28, 7 + Math.sqrt(node.filings) / 7)),
    itemStyle: node.bridge ? { borderColor: ORANGE, borderWidth: 3 } : undefined,
    node,
  }));
  c.setOption({
    ...base,
    legend: { bottom: 0, left: 0, textStyle: { color: MUTE, fontSize: 11 }, data: data.clusters.map((group) => `Cluster ${group.id + 1}`) },
    tooltip: { ...base.tooltip, formatter: (p) => p.data?.node ? `<b>${esc(short(p.data.node.title))}</b><br>${num(p.data.node.filings)} filings<br>${p.data.node.bridge ? "Bridge occupation" : `Cluster ${p.data.node.cluster + 1}`}` : "" },
    series: [{
      type: "graph", layout: "force", roam: true, draggable: true, data: nodes,
      links: data.edges.map((edge) => ({ source: edge.source, target: edge.target, value: edge.weight, lineStyle: { width: Math.min(5, 1 + Math.log(edge.weight)) } })),
      categories: data.clusters.map((group) => ({ name: `Cluster ${group.id + 1}` })),
      force: { repulsion: 105, gravity: 0.12, edgeLength: [42, 120], friction: 0.15 },
      lineStyle: { color: "#b8c7d8", opacity: 0.45, curveness: 0.08 },
      label: { show: true, position: "right", color: INK, fontSize: 10, formatter: (p) => p.data.node.bridge ? p.data.name : "" },
      emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
    }],
  });
  c.on("click", (event) => inspector(event.data?.node, data));

  const bridges = data.nodes.filter((node) => node.bridge).slice(0, 8);
  $("jobs-bridge-list").innerHTML = bridges.map((node) => `<button type="button" data-job-id="${esc(node.id)}"><span>${esc(short(node.title))}</span><b>${num(node.filings)}</b></button>`).join("") || "<p>No bridge occupations passed the overlap threshold.</p>";
  $("jobs-bridge-list").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    const node = data.nodes.find((item) => item.id === button.dataset.jobId);
    inspector(node, data);
    c.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: data.nodes.indexOf(node) });
  }));
}

function renderGroups(data) {
  const c = chart("chart-job-groups");
  charts.push(c);
  const majors = [...new Set(data.nodes.map((node) => node.major))].sort();
  const clusters = data.clusters.map((group) => group.id).sort((a, b) => a - b);
  const values = [];
  clusters.forEach((cluster, y) => majors.forEach((major, x) => {
    values.push([x, y, data.nodes.filter((node) => node.cluster === cluster && node.major === major).length]);
  }));
  c.setOption({
    ...base,
    grid: { left: 62, right: 18, top: 18, bottom: 64 },
    xAxis: { ...axis, type: "category", data: majors.map((major) => `SOC ${major}`), axisLabel: { ...axis.axisLabel, rotate: 45 } },
    yAxis: { ...axis, type: "category", data: clusters.map((cluster) => `Cluster ${cluster + 1}`) },
    visualMap: { min: 0, max: Math.max(...values.map((value) => value[2]), 1), calculable: false, orient: "horizontal", left: "center", bottom: 4, inRange: { color: ["#edf5fb", "#1f8fd6"] }, textStyle: { color: MUTE, fontSize: 10 } },
    tooltip: { ...base.tooltip, formatter: (p) => `<b>${p.name}</b><br>${num(p.value[2])} displayed occupations` },
    series: [{ type: "heatmap", data: values, label: { show: true, color: INK, fontSize: 10 } }],
  });

  const nmi = data.quality.nmi;
  const shuffled = data.quality.nmi_shuffled.mean;
  const n = chart("chart-job-nmi");
  charts.push(n);
  n.setOption({
    ...base,
    grid: { left: 54, right: 18, top: 24, bottom: 54 },
    xAxis: { ...axis, type: "category", data: ["Observed", "Shuffled mean", "Shuffled max"] },
    yAxis: { ...axis, type: "value", min: 0, max: 1, name: "NMI", nameTextStyle: { color: MUTE }, axisLabel: { ...axis.axisLabel, formatter: (value) => value.toFixed(1) } },
    tooltip: { ...base.tooltip, formatter: (p) => `<b>${p.name}</b><br>NMI ${p.value.toFixed(3)}` },
    series: [{ type: "bar", data: [{ value: nmi, itemStyle: { color: ORANGE } }, { value: shuffled, itemStyle: { color: "#9eb1c7" } }, { value: data.quality.nmi_shuffled.max, itemStyle: { color: "#c6d2df" } }], barMaxWidth: 42, label: { show: true, position: "top", color: INK, formatter: (p) => p.value.toFixed(2) } }],
  });
}

fetch(DATA_URL).then((response) => {
  if (!response.ok) throw new Error(`jobs data ${response.status}`);
  return response.json();
}).then((data) => {
  renderPairs(data);
  renderNetwork(data);
  renderGroups(data);
  $("jobs-status").textContent = `${num(data.meta.filings)} certified H-1B filings · ${num(data.meta.occupations)} occupations · FY2025`;
  window.addEventListener("resize", () => charts.forEach((item) => item.resize()));
}).catch((error) => {
  $("jobs-status").textContent = `Jobs section failed to load: ${error.message}`;
});
