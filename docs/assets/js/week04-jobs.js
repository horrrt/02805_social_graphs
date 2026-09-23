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

const titleOf = (data, id) => short(data.nodes.find((n) => n.id === id)?.title || id);

function renderPairs(data) {
  const c = chart("chart-job-pairs");
  charts.push(c);
  const rows = data.pairs.slice(0, 12).reverse();
  const names = rows.map((p) => `${titleOf(data, p.source)}\n× ${titleOf(data, p.target)}`);
  c.setOption({
    ...base,
    grid: { left: 250, right: 24, top: 12, bottom: 36 },
    xAxis: { ...axis, type: "value", name: "shared employers →", nameLocation: "middle", nameGap: 28 },
    yAxis: { ...axis, type: "category", data: names, axisLabel: { ...axis.axisLabel, width: 236, overflow: "truncate", lineHeight: 13 } },
    tooltip: { ...base.tooltip, trigger: "item", formatter: (p) => `<b>${esc(p.name).replace("\n", "<br>")}</b><br>${num(p.value)} companies file for both` },
    series: [{ type: "bar", data: rows.map((p) => p.weight), barMaxWidth: 16, itemStyle: { color: BLUE, borderRadius: [0, 4, 4, 0] } }],
  });
  c.on("click", (event) => {
    const pair = rows[event.dataIndex];
    if (!pair) return;
    $("jobs-inspector").innerHTML = [pair.source, pair.target].map((id) => {
      const node = data.nodes.find((n) => n.id === id);
      return `<h2>${esc(titleOf(data, id))}</h2><p class="jobs-meta">SOC ${esc(id)} · ${num(node.filings)} certified filings</p>`;
    }).join("") + `<p>${num(pair.weight)} companies filed for both in FY${data.meta.year}.</p>`;
  });
}

function inspector(node, data) {
  const panel = $("jobs-node-inspector");
  if (!node) return;
  const label = (id) => clusterName(data, id);
  const partners = node.partners
    .map(([, title, weight]) => `<li><span>${esc(short(title))}</span><b>${num(weight)}</b></li>`)
    .join("");
  const where = node.bridge
    ? `In the ${esc(label(node.clusters[0]))} cluster, with more ties than chance to the ${esc(label(node.clusters[1]))} cluster.`
    : `In the ${esc(label(node.cluster))} cluster only.`;
  panel.innerHTML = `<h2>${esc(short(node.title))}</h2><p class="jobs-meta">SOC ${esc(node.id)} · ${num(node.filings)} certified filings</p><p>${where}</p><h3>Most shared employers</h3><ol class="jobs-partners">${partners}</ol><button type="button" class="jobs-back">Back to the bridge list</button>`;
  panel.querySelector(".jobs-back").addEventListener("click", () => bridgeList(data));
}

// Clusters are named after their largest occupation.
function clusterName(data, id) {
  const group = data.clusters.find((g) => g.id === id);
  return group ? short(group.label) : `cluster ${id + 1}`;
}

let network;

function bridgeList(data) {
  const bridges = data.nodes.filter((node) => node.bridge);
  $("jobs-node-inspector").innerHTML = `<h2>Bridge jobs</h2><p>${bridges.length} of the ${data.nodes.length} occupations shown have more employer ties to a second cluster than its size predicts. Ringed in the network.</p><div class="jobs-bridge-list" id="jobs-bridge-list"></div>`;
  $("jobs-bridge-list").innerHTML = bridges.map((node) => `<button type="button" data-job-id="${esc(node.id)}"><span>${esc(short(node.title))}</span><b>${num(node.filings)}</b></button>`).join("") || "<p>No occupation passed the overlap test.</p>";
  $("jobs-bridge-list").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    const node = data.nodes.find((item) => item.id === button.dataset.jobId);
    inspector(node, data);
    network.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: data.nodes.indexOf(node) });
  }));
}

function renderNetwork(data) {
  const c = chart("chart-job-network");
  network = c;
  charts.push(c);
  // ECharts reads category as a position in the categories list, not a cluster id.
  const position = (id) => data.clusters.findIndex((group) => group.id === id);
  const legendName = (group) => `${short(group.label)} (${num(group.occupations)})`;
  const nodes = data.nodes.map((node) => ({
    id: node.id,
    name: short(node.title),
    value: node.filings,
    category: position(node.cluster),
    symbolSize: Math.max(9, Math.min(28, 7 + Math.sqrt(node.filings) / 7)),
    itemStyle: node.bridge ? { borderColor: INK, borderWidth: 2.5 } : undefined,
    node,
  }));
  c.setOption({
    ...base,
    color: PALETTE,
    legend: { bottom: 0, left: 0, textStyle: { color: MUTE, fontSize: 11 }, data: data.clusters.map(legendName) },
    tooltip: { ...base.tooltip, formatter: (p) => p.data?.node ? `<b>${esc(short(p.data.node.title))}</b><br>${num(p.data.node.filings)} filings<br>${p.data.node.bridge ? `Bridges ${esc(clusterName(data, p.data.node.clusters[0]))} and ${esc(clusterName(data, p.data.node.clusters[1]))}` : esc(clusterName(data, p.data.node.cluster))}` : p.data?.value ? `${num(p.data.value)} companies file for both` : "" },
    series: [{
      type: "graph", layout: "force", roam: true, draggable: true, data: nodes,
      links: data.edges.map((edge) => ({ source: edge.source, target: edge.target, value: edge.weight, lineStyle: { width: Math.min(5, 1 + Math.log(edge.weight)) } })),
      categories: data.clusters.map((group) => ({ name: legendName(group) })),
      force: { repulsion: 105, gravity: 0.12, edgeLength: [42, 120], friction: 0.15 },
      lineStyle: { color: "#b8c7d8", opacity: 0.45, curveness: 0.08 },
      label: { show: true, position: "right", color: INK, fontSize: 10, textBorderColor: "#fff", textBorderWidth: 2, formatter: (p) => p.data.node.bridge ? p.data.name : "" },
      labelLayout: { hideOverlap: true },
      emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
    }],
  });
  c.on("click", (event) => inspector(event.data?.node, data));
  bridgeList(data);
}

function renderGroups(data) {
  const c = chart("chart-job-groups");
  charts.push(c);
  const majors = [...new Set(data.nodes.map((node) => node.major))].sort();
  const clusters = data.clusters.map((group) => group.id);
  const values = [];
  clusters.forEach((cluster, y) => majors.forEach((major, x) => {
    values.push([x, y, data.nodes.filter((node) => node.cluster === cluster && node.major === major).length]);
  }));
  c.setOption({
    ...base,
    grid: { left: 150, right: 18, top: 18, bottom: 96 },
    xAxis: { ...axis, type: "category", data: majors.map((major) => data.majors[major]), axisLabel: { ...axis.axisLabel, rotate: 35, width: 120, overflow: "truncate", interval: 0 } },
    yAxis: { ...axis, type: "category", inverse: true, data: clusters.map((cluster) => clusterName(data, cluster)), axisLabel: { ...axis.axisLabel, width: 140, overflow: "truncate" } },
    visualMap: { show: false, min: 0, max: Math.max(...values.map((value) => value[2]), 1), inRange: { color: ["#edf5fb", "#1f8fd6"] } },
    tooltip: { ...base.tooltip, formatter: (p) => `<b>${esc(clusterName(data, clusters[p.value[1]]))} cluster × ${esc(data.majors[majors[p.value[0]]])}</b><br>${num(p.value[2])} of the ${data.nodes.length} occupations shown` },
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
  $("jobs-status").textContent = `${num(data.meta.filings)} certified H-1B filings · ${num(data.meta.occupations)} occupations · FY${data.meta.year}`;
  const q = data.quality;
  const fill = {
    occupations: num(data.meta.occupations), nmi: q.nmi.toFixed(2), shuffled: q.nmi_shuffled.mean.toFixed(2),
    ami: q.ami.toFixed(2), scored: num(q.occupations), legacy: `${num(data.meta.legacy_filings_recoded)} filings`,
    years: data.comparison.nmi_between_years.toFixed(2), shared: num(data.comparison.shared_occupations),
    infomap: num(q.infomap.modules_of_two_or_more), "infomap-louvain": q.infomap.nmi_with_louvain.toFixed(2),
    "infomap-soc": q.infomap.nmi_with_soc.toFixed(2),
  };
  document.querySelectorAll("[data-jobs]").forEach((el) => { el.textContent = fill[el.dataset.jobs]; });
  window.addEventListener("resize", () => charts.forEach((item) => item.resize()));
}).catch((error) => {
  $("jobs-status").textContent = `Jobs section failed to load: ${error.message}`;
});
