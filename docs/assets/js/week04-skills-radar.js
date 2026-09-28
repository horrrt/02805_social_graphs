// Week 4 redesign · S3, the deep dive's O*NET skills radar (#cut-skills-radar).
// Built from docs/weeks/week04/data/skills_radar.json (analysis/week04_skills_radar.py):
// every H-1B occupation's own raw O*NET Importance ratings (1 to 5), grouped
// into skills, knowledge areas and work activities. Appends after S1 and S2's
// cards in #skills-body, which week04-skills.js also fills on the same
// <details> toggle, so this waits for that card to land instead of racing it.

import { token } from "./week04-strip.js";
import { drawer, drawerRow } from "./week04-ui.js";

const DATA = new URL("../../weeks/week04/data/skills_radar.json", import.meta.url);
const MAX_SELECTED = 5;
const SYMBOLS = ["circle", "rect", "triangle", "diamond", "pin"];
// Spoke names run along their own spoke, so neighbours never overlap however
// many spokes a group has. Past LABEL_CHARS a name ends in an ellipsis; the
// hover tip on the name gives it in full with every occupation's value.
const LABEL_CHARS = 26;
const LABEL_SPACE = 164;
const shorten = (name) => (name.length > LABEL_CHARS ? `${name.slice(0, LABEL_CHARS - 1).trimEnd()}…` : name);

const GROUP_ORDER = ["skills", "knowledge", "work_activities"];
const fmt2 = (v) => v.toFixed(2);

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

async function load() {
  const r = await fetch(DATA);
  if (!r.ok) throw new Error(`${DATA.pathname} ${r.status}`);
  return r.json();
}

function frag(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function offsetOf(groups, group) {
  let offset = 0;
  for (const g of GROUP_ORDER) {
    if (g === group) return offset;
    offset += groups[g].ids.length;
  }
  return offset;
}

function seriesColor(i) {
  return token(`--w4-series-${i + 1}`);
}

// Occupations for the search box's datalist: section 2's 60 first (by
// filings), then everyone else O*NET rates and H-1B filed for, also by
// filings. One entry per title: a handful of titles repeat across codes.
function searchIndex(occupations) {
  const ranked = [...occupations].sort(
    (a, b) => Number(b.in_network) - Number(a.in_network) || b.filings - a.filings,
  );
  const byTitle = new Map();
  for (const o of ranked) if (!byTitle.has(o.title)) byTitle.set(o.title, o.code);
  return byTitle;
}

function topDescriptors(occ, groups, group, n = 3) {
  const offset = offsetOf(groups, group);
  const names = groups[group].names;
  return names
    .map((name, i) => ({ name, value: occ.ratings[offset + i] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

class Radar {
  constructor(data, host) {
    this.data = data;
    this.host = host;
    this.byCode = new Map(data.occupations.map((o) => [o.code, o]));
    this.index = searchIndex(data.occupations);
    this.selected = [...data.default];
    this.group = "skills";
    this.chart = null;
    this.els = {};
  }

  titleOf(code) {
    return this.byCode.get(code)?.title ?? code;
  }

  select(code) {
    if (this.selected.includes(code) || this.selected.length >= MAX_SELECTED || !this.byCode.has(code)) return false;
    this.selected.push(code);
    this.renderAll();
    return true;
  }

  remove(code) {
    if (this.selected.length <= 1) return;
    this.selected = this.selected.filter((c) => c !== code);
    this.renderAll();
  }

  setGroup(group) {
    if (group === this.group) return;
    this.group = group;
    this.renderAll();
  }

  buildControls(container) {
    const wrap = document.createElement("div");
    wrap.className = "w4-radar-controls";

    const searchRow = document.createElement("div");
    searchRow.className = "w4-radar-search-row";
    const label = document.createElement("label");
    label.className = "w4-sr-only";
    label.htmlFor = "w4-radar-search";
    label.textContent = "Add an occupation to the radar";
    const input = document.createElement("input");
    input.type = "text";
    input.id = "w4-radar-search";
    input.setAttribute("list", "w4-radar-datalist");
    input.setAttribute("autocomplete", "off");
    input.placeholder = "Add an occupation…";
    const datalist = document.createElement("datalist");
    datalist.id = "w4-radar-datalist";
    datalist.append(...[...this.index.keys()].map((title) => {
      const opt = document.createElement("option");
      opt.value = title;
      return opt;
    }));
    const status = document.createElement("p");
    status.className = "w4-radar-search-status";
    status.setAttribute("aria-live", "polite");

    const commit = () => {
      const title = input.value.trim();
      if (!title) return;
      if (this.selected.length >= MAX_SELECTED) {
        status.textContent = "Five occupations are already on the radar. Remove one to add another.";
        return;
      }
      const code = this.index.get(title);
      if (!code) {
        status.textContent = `No occupation named "${title}" in the list.`;
        return;
      }
      if (this.selected.includes(code)) {
        status.textContent = `${title} is already on the radar.`;
        input.value = "";
        return;
      }
      this.select(code);
      input.value = "";
      status.textContent = `Added ${title}.`;
    };
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
    });

    searchRow.append(label, input, datalist);
    const chips = document.createElement("div");
    chips.className = "w4-radar-chips";
    chips.setAttribute("role", "list");
    chips.setAttribute("aria-label", "Occupations on the radar");

    const toggle = document.createElement("div");
    toggle.className = "rx-seg-row";
    const legend = document.createElement("span");
    legend.className = "rx-seg-label";
    legend.id = "w4-radar-group-label";
    legend.textContent = "Compare by";
    const seg = document.createElement("div");
    seg.className = "rx-seg";
    seg.setAttribute("role", "group");
    seg.setAttribute("aria-labelledby", legend.id);
    for (const group of GROUP_ORDER) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = `w4-radar-group-${group}`;
      btn.dataset.group = group;
      btn.textContent = this.data.meta.groups[group].label;
      btn.setAttribute("aria-pressed", String(group === this.group));
      btn.addEventListener("click", () => {
        for (const b of seg.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === btn));
        this.setGroup(group);
      });
      seg.append(btn);
    }
    toggle.append(legend, seg);

    wrap.append(searchRow, status, chips, toggle);
    container.append(wrap);
    this.els.input = input;
    this.els.status = status;
    this.els.chips = chips;
    this.els.toggle = toggle;
  }

  renderChips() {
    const { chips } = this.els;
    chips.replaceChildren();
    this.selected.forEach((code, i) => {
      const occ = this.byCode.get(code);
      const chip = document.createElement("span");
      chip.className = "w4-radar-chip";
      chip.setAttribute("role", "listitem");
      const dot = document.createElement("i");
      dot.style.background = seriesColor(i);
      const title = document.createElement("span");
      title.textContent = occ.title;
      title.title = occ.title;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      const canRemove = this.selected.length > 1;
      remove.setAttribute("aria-label", canRemove ? `Remove ${occ.title}` : `${occ.title} is the only occupation left; add another before removing it`);
      remove.disabled = !canRemove;
      remove.addEventListener("click", () => this.remove(code));
      chip.append(dot, title, remove);
      chips.append(chip);
    });
    this.els.input.disabled = this.selected.length >= MAX_SELECTED;
    this.els.input.placeholder = this.selected.length >= MAX_SELECTED
      ? "Five selected, remove one to add another"
      : "Add an occupation…";
  }

  renderNotice() {
    const groups = this.data.meta.groups;
    const lines = this.selected.map((code) => {
      const occ = this.byCode.get(code);
      const top = topDescriptors(occ, groups, this.group).map((d) => `${d.name} (${fmt2(d.value)})`).join(", ");
      return `${occ.title}: ${top}`;
    });
    this.els.notice.replaceChildren();
    this.els.notice.append(
      frag(`Highest-rated ${groups[this.group].label.toLowerCase()} for each occupation shown, on the 1-to-5 Importance scale. `),
    );
    const list = document.createElement("ul");
    list.className = "w4-radar-notice-list";
    for (const line of lines) {
      const li = document.createElement("li");
      li.textContent = line;
      list.append(li);
    }
    this.els.notice.append(list);

    const summary = `Comparing ${this.selected.length} occupation${this.selected.length === 1 ? "" : "s"} on ${groups[this.group].label.toLowerCase()}. ` +
      lines.join(". ") + ".";
    this.els.live.textContent = summary;
  }

  hideTip() {
    if (this.els.tip) this.els.tip.hidden = true;
  }

  showTip(event, axisIndex) {
    const groups = this.data.meta.groups;
    const offset = offsetOf(groups, this.group);
    const name = groups[this.group].names[axisIndex];
    const rows = this.selected.map((code, i) => {
      const occ = this.byCode.get(code);
      return `<div class="w4-radar-tip-row"><i style="background:${seriesColor(i)}"></i>${esc(occ.title)}: <b>${fmt2(occ.ratings[offset + axisIndex])}</b></div>`;
    }).join("");
    this.els.tip.innerHTML = `<b>${esc(name)}</b>${rows}`;
    this.els.tip.hidden = false;
    const rect = this.els.hostWrap.getBoundingClientRect();
    this.els.tip.style.left = `${event.clientX - rect.left + 14}px`;
    this.els.tip.style.top = `${event.clientY - rect.top + 10}px`;
  }

  option() {
    const groups = this.data.meta.groups;
    const group = groups[this.group];
    const offset = offsetOf(groups, this.group);
    const w = this.chart.getWidth();
    const h = this.chart.getHeight();
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.max(60, Math.min(w, h) / 2 - LABEL_SPACE);
    const n = group.names.length;
    const line = token("--line");
    const inset = token("--w4-inset");
    const card = token("--card");
    const softInk = token("--ink-soft");
    return {
      animationDuration: 260,
      textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
      tooltip: { show: false },
      legend: { show: false },
      radar: {
        center: [cx, cy],
        radius: r,
        indicator: group.names.map((name) => ({ name, max: 5, min: 1 })),
        shape: "polygon",
        axisLine: { lineStyle: { color: line } },
        splitLine: { lineStyle: { color: line } },
        splitArea: { areaStyle: { color: [card, inset] } },
        axisName: { show: false },
      },
      // ECharts lays indicators out counter-clockwise from the top.
      graphic: group.names.map((name, i) => {
        const angle = Math.PI / 2 + (2 * Math.PI * i) / n;
        const right = Math.cos(angle) >= -1e-9;
        return {
          type: "text",
          x: cx + (r + 8) * Math.cos(angle),
          y: cy - (r + 8) * Math.sin(angle),
          // Upright on both sides: the left half reads inward-to-outward from the right end.
          rotation: right ? Math.atan2(Math.sin(angle), Math.cos(angle)) : Math.atan2(Math.sin(angle), Math.cos(angle)) - Math.PI,
          style: { text: shorten(name), fill: softInk, font: "10px -apple-system, BlinkMacSystemFont, system-ui, sans-serif", align: right ? "left" : "right", verticalAlign: "middle" },
          onmouseover: (e) => this.showTip(e.event, i),
          onmouseout: () => this.hideTip(),
        };
      }),
      series: [{
        type: "radar",
        data: this.selected.map((code, i) => {
          const occ = this.byCode.get(code);
          return {
            name: occ.title,
            value: group.ids.map((_id, j) => occ.ratings[offset + j]),
            symbol: SYMBOLS[i],
            symbolSize: 6,
            lineStyle: { width: 2, color: seriesColor(i) },
            itemStyle: { color: seriesColor(i) },
            areaStyle: { opacity: 0 },
          };
        }),
      }],
    };
  }

  renderChart() {
    if (!this.chart) return;
    this.chart.setOption(this.option(), { notMerge: true });
  }

  renderAll() {
    this.renderChips();
    this.renderNotice();
    this.renderChart();
  }

  build(container) {
    this.buildControls(container);

    const notice = document.createElement("div");
    notice.className = "notice w4-radar-notice";
    notice.innerHTML = '<span class="ico">💡</span>';
    const noticeText = document.createElement("span");
    notice.append(noticeText);
    this.els.notice = noticeText;
    container.append(notice);

    const live = document.createElement("p");
    live.className = "w4-sr-only";
    live.setAttribute("aria-live", "polite");
    container.append(live);
    this.els.live = live;

    const hostWrap = document.createElement("div");
    hostWrap.className = "w4-figure-body w4-radar-host-wrap";
    const chartHost = document.createElement("div");
    chartHost.className = "w4-radar-host";
    const tip = document.createElement("div");
    tip.className = "w4-radar-tip";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    hostWrap.append(chartHost, tip);
    this.els.hostWrap = hostWrap;
    this.els.tip = tip;
    this.host.append(hostWrap);

    this.chart = window.echarts.init(chartHost, null, { renderer: "canvas" });
    this.chart.on("mouseover", (params) => {
      if (params.componentType === "radar" && params.targetType === "axisName") {
        this.showTip(params.event.event, params.axisIndex);
      }
    });
    this.chart.on("mouseout", (params) => {
      if (params.componentType === "radar" && params.targetType === "axisName") this.hideTip();
    });

    this.renderAll();
    // The host can be laid out after init (the card lands while its <details>
    // is still opening), which leaves a 0 x 0 canvas; resize whenever the host
    // itself changes size.
    new ResizeObserver(() => {
      this.chart.resize();
      this.renderChart();
    }).observe(chartHost);
  }
}

function howBody() {
  const body = document.createElement("p");
  body.append(
    frag(
      "A SOC code that names more than one detailed O*NET occupation gets the filing-weighted mean of " +
        "their ratings, the same weights the O*NET similarity above uses. A rating O*NET flags as too thin or " +
        "too varied to publish is filled with the mean over every rated occupation. ",
    ),
    frag(
      "O*NET 31.0 rates no profile for Financial and Investment Analysts (13-2051) or Financial Risk " +
        "Specialists (13-2054); their ratings come from O*NET 25.0 through O*NET's own 2010-to-2019 crosswalk, " +
        "the last release that covered them.",
    ),
  );
  return body;
}

function card(data) {
  const article = document.createElement("div");
  article.className = "card w4-card";
  article.id = "cut-skills-radar";

  const header = document.createElement("header");
  header.className = "w4-q";
  header.innerHTML = `
    <span class="w4-num">5</span>
    <div>
      <h2>How do two occupations' day-to-day skills actually compare?</h2>
      <p class="w4-answer">Put up to five H-1B occupations on one radar and see where their O*NET profiles pull apart.</p>
    </div>`;

  const two = document.createElement("div");
  two.className = "w4-two";
  const left = document.createElement("div");
  left.innerHTML = `
    <p class="sub">
      O*NET rates every detailed occupation's importance on 109 skills, knowledge areas and work activities,
      from 1 (not important) to 5 (extremely important), using surveys of people who hold the job and O*NET's
      own analysts. This radar plots those ratings directly, one spoke per descriptor, so a shape that reaches
      further out on a spoke means that descriptor matters more for that occupation.
    </p>`;
  left.append(drawerRow(drawer("Method", howBody())));

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Compare occupations' O*NET profiles</h3>
    <p class="axis-note">
      Every spoke runs from 1 to 5, O*NET's own Importance scale. Search adds an occupation, up to five at
      once; the toggle switches which of the three descriptor groups the spokes show. Hover a spoke's label
      for every chosen occupation's value there.
    </p>`;
  two.append(left, plot);

  const full = document.createElement("div");
  full.className = "plot w4-radar-full";

  article.append(header, two, full);
  return { article, controlsHost: plot, chartHost: full };
}

async function render() {
  const body = document.getElementById("skills-body");
  const status = document.getElementById("skills-status");
  if (!body) return;
  try {
    const data = await load();
    const { article, controlsHost, chartHost } = card(data);
    const radar = new Radar(data, chartHost);
    radar.build(controlsHost);
    insertAfterS2(body, article);
    resizeWhenVisible(radar);
  } catch (err) {
    if (status) status.textContent = "Could not load the O*NET radar.";
    console.error("week04-skills-radar", err);
  }
}

// week04-skills.js fills #skills-body on the same <details> toggle; whichever
// of the two scripts' fetch resolves first must not lose the other's card, so
// this waits for S2's card to exist before inserting after it.
function insertAfterS2(body, article) {
  const s2 = document.getElementById("cut-skills-cluster");
  if (s2) {
    s2.after(article);
    return;
  }
  const mo = new MutationObserver(() => {
    const found = document.getElementById("cut-skills-cluster");
    if (found) {
      mo.disconnect();
      found.after(article);
    }
  });
  mo.observe(body, { childList: true });
  // If the S1 and S2 cards never land (their data failed to load), the radar
  // still has its own data: mount it at the end of the box instead of waiting.
  setTimeout(() => {
    if (article.isConnected) return;
    mo.disconnect();
    body.append(article);
  }, 5000);
}

function resizeWhenVisible(radar) {
  const details = document.getElementById("cut-skills");
  if (!details) return;
  details.addEventListener("toggle", () => {
    if (details.open) radar.chart?.resize();
  });
}

function wire() {
  const details = document.getElementById("cut-skills");
  if (!details) return;
  let done = false;
  const open = () => {
    if (done || !details.open) return;
    done = true;
    render();
  };
  details.addEventListener("toggle", open);
  open();
}

wire();
