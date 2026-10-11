// Week 4 redesign · S3, the deep dive's O*NET skills radar (#cut-skills-radar).
// Built from public/weeks/week04/data/skills_radar.json (analysis/week04_skills_radar.py):
// every H-1B occupation's own raw O*NET Importance ratings (1 to 5), grouped
// into skills, knowledge areas and work activities. The card follows boxes 3
// and 4 in #skills-body (src/features/week04/skills/Skills.tsx); this module
// builds its search index, notice and ECharts option.

export const MAX_SELECTED = 5;
const SYMBOLS = ["circle", "rect", "triangle", "diamond", "pin"];
// Spoke names run along their own spoke, so neighbours never overlap however
// many spokes a group has. Past LABEL_CHARS a name splits into two lines at
// the word break nearest its middle; the hover tip on the name gives it with
// every occupation's value.
const LABEL_CHARS = 26;
const LABEL_SPACE = 164;
const shorten = (name) => {
  if (name.length <= LABEL_CHARS) return name;
  let cut = -1;
  for (let i = name.indexOf(" "); i !== -1; i = name.indexOf(" ", i + 1)) {
    if (cut === -1 || Math.abs(i - name.length / 2) < Math.abs(cut - name.length / 2)) cut = i;
  }
  return cut === -1 ? name : `${name.slice(0, cut)}\n${name.slice(cut + 1)}`;
};

export const GROUP_ORDER = ["skills", "knowledge", "work_activities"];
export const fmt2 = (v) => v.toFixed(2);

/** The tokens the radar reads. */
export const RADAR_TOKENS = ["--line", "--w4-inset", "--card", "--ink-soft", ...SYMBOLS.map((_, i) => `--w4-series-${i + 1}`)];

export const seriesToken = (i) => `--w4-series-${i + 1}`;

export function offsetOf(groups, group) {
  let offset = 0;
  for (const g of GROUP_ORDER) {
    if (g === group) return offset;
    offset += groups[g].ids.length;
  }
  return offset;
}

// Occupations for the search box's datalist: section 2's 60 first (by
// filings), then everyone else O*NET rates and H-1B filed for, also by
// filings. One entry per title: a handful of titles repeat across codes.
export function searchIndex(occupations) {
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

/** The notice's lead and one line per occupation, and the live region's sentence. */
export function radarNotice(data, byCode, selected, group) {
  const groups = data.meta.groups;
  const lines = selected.map((code) => {
    const occ = byCode.get(code);
    const top = topDescriptors(occ, groups, group).map((d) => `${d.name} (${fmt2(d.value)})`).join(", ");
    return `${occ.title}: ${top}`;
  });
  return {
    lead: `Highest-rated ${groups[group].label.toLowerCase()} for each occupation shown, on the 1-to-5 Importance scale. `,
    lines,
    live:
      `Comparing ${selected.length} occupation${selected.length === 1 ? "" : "s"} on ${groups[group].label.toLowerCase()}. ` +
      lines.join(". ") + ".",
  };
}

/** One spoke's tip: its name and each selected occupation's rating there. */
export function spokeTip(data, byCode, selected, group, axisIndex) {
  const groups = data.meta.groups;
  const offset = offsetOf(groups, group);
  return {
    name: groups[group].names[axisIndex],
    rows: selected.map((code, i) => ({ token: seriesToken(i), title: byCode.get(code).title, value: fmt2(byCode.get(code).ratings[offset + axisIndex]) })),
  };
}

/** The radar at a w × h host; `onTip(event, axisIndex)` and `offTip()` follow the spoke labels. */
export function radarOption(data, byCode, selected, group, w, h, token, T, onTip, offTip) {
  const groups = data.meta.groups;
  const g = groups[group];
  const offset = offsetOf(groups, group);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.max(60, Math.min(w, h) / 2 - LABEL_SPACE);
  const n = g.names.length;
  return {
    animationDuration: 260,
    textStyle: { fontFamily: T.family("sans"), fontSize: T.fs("caption") },
    tooltip: { show: false },
    legend: { show: false },
    radar: {
      center: [cx, cy],
      radius: r,
      indicator: g.names.map((name) => ({ name, max: 5, min: 1 })),
      shape: "polygon",
      axisLine: { lineStyle: { color: token("--line") } },
      splitLine: { lineStyle: { color: token("--line") } },
      splitArea: { areaStyle: { color: [token("--card"), token("--w4-inset")] } },
      axisName: { show: false },
    },
    // ECharts lays indicators out counter-clockwise from the top.
    graphic: g.names.map((name, i) => {
      const angle = Math.PI / 2 + (2 * Math.PI * i) / n;
      const right = Math.cos(angle) >= -1e-9;
      const along = Math.atan2(Math.sin(angle), Math.cos(angle));
      return {
        type: "text",
        x: cx + (r + 8) * Math.cos(angle),
        y: cy - (r + 8) * Math.sin(angle),
        // Upright on both sides: the left half reads inward-to-outward from the right end.
        rotation: right ? along : along - Math.PI,
        style: { text: shorten(name), fill: token("--ink-soft"), font: T.font("caption"), lineHeight: 14, align: right ? "left" : "right", verticalAlign: "middle" },
        onmouseover: (e) => onTip(e.event, i),
        onmouseout: () => offTip(),
      };
    }),
    series: [{
      type: "radar",
      data: selected.map((code, i) => {
        const occ = byCode.get(code);
        return {
          name: occ.title,
          value: g.ids.map((_id, j) => occ.ratings[offset + j]),
          symbol: SYMBOLS[i],
          symbolSize: 6,
          lineStyle: { width: 2, color: token(seriesToken(i)) },
          itemStyle: { color: token(seriesToken(i)) },
          areaStyle: { opacity: 0 },
        };
      }),
    }],
  };
}

/** The Method drawer's three sentences. */
export const RADAR_METHOD = [
  "A SOC code that names more than one detailed O*NET occupation gets the filing-weighted mean of " +
    "their ratings, the same weights the O*NET similarity above uses. A rating O*NET flags as too thin or " +
    "too varied to publish is filled with the mean over every rated occupation. ",
  "O*NET 31.0 rates no profile for Financial and Investment Analysts (13-2051) or Financial Risk " +
    "Specialists (13-2054); their ratings come from O*NET 25.0 through O*NET's own 2010-to-2019 crosswalk, " +
    "the last release that covered them. ",
  "The ratings come from surveys of people who hold the job and O*NET's own analysts.",
];
