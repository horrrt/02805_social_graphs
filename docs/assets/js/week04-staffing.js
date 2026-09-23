// Section 3 figure: every client with 20 or more placed H-1B filings in a year.
// x = filings (log), y = share supplied by its largest vendor. Hover a dot for
// its numbers; click it, or search, to list its vendors. d3 is the vendored
// UMD build, loaded by the page before this module.
import { esc } from "./cabinet.js";

const d3 = window.d3;
const root = document.querySelector("#staffing-figure");
const SECTORS = [
  ["s1", "Finance and insurance", (s) => s === "52"],
  ["s2", "Health care", (s) => s === "62"],
  ["s3", "Other labelled sector", (s) => s !== ""],
  ["s0", "No sector label", () => true],
];
const sectorOf = (s) => SECTORS.find(([, , test]) => test(s));
const pct = (v) => (v > 0 && v < 0.005 ? "<1%" : d3.format(".0%")(v));
const num = d3.format(",");
const W = 700;
const H = 440;
const M = { top: 34, right: 18, bottom: 46, left: 52 };

let data;
let year;
let selected;

const svg = d3.select(root).select(".staffing-chart svg").attr("viewBox", `0 0 ${W} ${H}`);
const tip = d3.select(root).select(".staffing-tip");
const panel = root.querySelector(".staffing-panel");
const search = root.querySelector(".staffing-search input");
const x = d3.scaleLog().range([M.left, W - M.right]);
const y = d3.scaleLinear().domain([0, 1]).range([H - M.bottom, M.top]);

const gridY = svg.append("g").attr("class", "grid");
const axisX = svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - M.bottom})`);
const axisY = svg.append("g").attr("class", "axis").attr("transform", `translate(${M.left},0)`);
const dots = svg.append("g");
const labels = svg.append("g");
svg.append("text").attr("class", "axis-title").attr("x", W - M.right).attr("y", H - 8)
  .attr("text-anchor", "end").text("Placed filings in the year (log scale) →");
svg.append("text").attr("class", "axis-title").attr("x", M.left - 44).attr("y", 12)
  .text("↑ Share from the largest vendor");

function clients() {
  return data.years[year].shown;
}

function show(client) {
  selected = client;
  dots.selectAll("circle").classed("selected", (d) => d === client).filter((d) => d === client).raise();
  if (!client) return;
  const [, sector] = sectorOf(client.sector);
  const top = client.top.map(([f, n]) => [data.firms[f], n]);
  panel.innerHTML = `
    <h3>${esc(client.name)}</h3>
    <p class="meta">${sector} · ${num(client.filings)} placed filings · ${num(client.vendors)}
      ${client.vendors === 1 ? "vendor" : "vendors"}</p>
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
  const share = (d) => d.top[0][1] / d.filings;
  x.domain([data.min_filings, d3.max(rows, (d) => d.filings) * 1.15]);

  gridY.selectAll("line").data(y.ticks(5)).join("line")
    .attr("x1", M.left).attr("x2", W - M.right).attr("y1", y).attr("y2", y);
  const ticks = [20, 50, 100, 200, 500, 1000, 2000, 5000].filter((t) => t <= x.domain()[1]);
  axisX.call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format("~s")).tickSizeOuter(0));
  axisY.call(d3.axisLeft(y).ticks(5).tickFormat(pct).tickSize(0).tickPadding(8));

  dots.selectAll("circle").data(rows, (d) => d.name).join("circle")
    .attr("class", (d) => `dot ${sectorOf(d.sector)[0]}`)
    .attr("r", 4.5)
    .attr("cx", (d) => x(d.filings))
    .attr("cy", (d) => y(share(d)));

  // Name the three largest clients and the largest one-vendor client, no more.
  const loyal = rows.filter((d) => share(d) >= 0.9).slice(0, 1);
  const named = [...new Set([...rows.slice(0, 3), ...loyal])];
  labels.selectAll("text").data(named, (d) => d.name).join("text")
    .attr("class", "label")
    .attr("x", (d) => x(d.filings) - 9)
    .attr("y", (d) => y(share(d)) + 4)
    .attr("text-anchor", "end")
    .text((d) => d.name);

  search.setAttribute("placeholder", `${rows.length} clients · type a name`);
  root.querySelector("#staffing-names").innerHTML =
    rows.map((d) => `<option value="${esc(d.name)}"></option>`).join("");
  table(rows);
  show(rows.find((d) => selected && d.name === selected.name) ?? rows[0]);
}

function table(rows) {
  const body = root.querySelector("tbody");
  body.innerHTML = rows.slice(0, 25).map((d) => `<tr><td>${esc(d.name)}</td>
    <td>${sectorOf(d.sector)[1]}</td><td class="num">${num(d.filings)}</td>
    <td class="num">${num(d.vendors)}</td><td>${esc(data.firms[d.top[0][0]])}</td>
    <td class="num">${pct(d.top[0][1] / d.filings)}</td></tr>`).join("");
}

// One nearest-dot lookup for hover and click, so the hit area is wider than the dot.
function nearest(event) {
  const [mx, my] = d3.pointer(event, svg.node());
  const rows = clients();
  const i = d3.Delaunay.from(rows, (d) => x(d.filings), (d) => y(d.top[0][1] / d.filings)).find(mx, my);
  const d = rows[i];
  return Math.hypot(x(d.filings) - mx, y(d.top[0][1] / d.filings) - my) < 18 ? d : null;
}

svg.on("pointermove", (event) => {
  const d = nearest(event);
  if (!d) return tip.attr("hidden", true);
  const box = svg.node().getBoundingClientRect();
  const scale = box.width / W;
  tip.attr("hidden", null)
    .style("left", `${x(d.filings) * scale + 12}px`)
    .style("top", `${y(d.top[0][1] / d.filings) * scale - 10}px`)
    .html(`<strong>${esc(d.name)}</strong>${num(d.filings)} filings · ${num(d.vendors)} vendors<br />
      <span>${pct(d.top[0][1] / d.filings)} from ${esc(data.firms[d.top[0][0]])}</span>`);
});
svg.on("pointerleave", () => tip.attr("hidden", true));
svg.on("click", (event) => {
  const d = nearest(event);
  if (d) show(d);
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

root.querySelector(".staffing-legend").innerHTML = SECTORS
  .map(([cls, name]) => `<li><i class="${cls}"></i>${name}</li>`).join("");

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
