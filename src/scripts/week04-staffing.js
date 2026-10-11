// Section 3 figure: every client with 20 or more placed H-1B filings in a year.
// x = filings (log), y = share supplied by its largest vendor. Hover a dot for
// its numbers; click it, or search, to list its vendors. The box
// (src/features/week04/staffing/Staffing.tsx) draws it with the vendored
// ECharts build, the same library as section 1; this module builds the
// options, the vendor panel, the table and the community numbers.
// `token(name)` reads a colour from the figure's CSS; `T` is the type scale.

// Three sectors in navy and slate, the rest in grey drawn beneath them.
export const SECTORS = [
  ["Finance and insurance", "--w4-sector-finance", (s) => s === "52"],
  ["Manufacturing", "--w4-sector-manufacturing", (s) => s === "31-33"],
  ["Health care", "--w4-sector-health", (s) => s === "62"],
  ["Other sectors", "--w4-sector-other", (s) => s !== ""],
  ["Sector unknown", "--w4-sector-unknown", () => true],
];
const GREY = new Set(["Other sectors", "Sector unknown"]);
const sectorOf = (s) => SECTORS.find(([, , test]) => test(s));
// NAICS two-digit codes to short names; a code missing here reads "Other sectors".
const SECTOR_NAMES = {
  52: "Finance and insurance",
  "31-33": "Manufacturing",
  51: "Information and telecoms",
  62: "Health care",
  "44-45": "Retail",
  54: "Professional services",
  22: "Utilities",
  "48-49": "Transport",
  92: "Government",
  42: "Wholesale",
  56: "Business support",
  21: "Mining and energy",
  72: "Hospitality",
  53: "Real estate",
  61: "Education",
  81: "Other services",
  23: "Construction",
  "": "Sector unknown",
};
export const sectorName = (s) => SECTOR_NAMES[s] ?? "Other sectors";
const whole = new Intl.NumberFormat("en-US");
export const num = (v) => whole.format(v);
export const pct = (v) => (v > 0 && v < 0.005 ? "<1%" : `${Math.round(v * 100)}%`);
export const share = (d) => d.top[0][1] / d.filings;
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** The tokens the figure reads. */
export const STAFFING_TOKENS = [...SECTORS.map(([, colour]) => colour), "--surface", "--paper", "--muted", "--grid", "--line", "--series-none", "--series-1"];

/** One scatter point. */
export function point(d) {
  return { value: [d.filings, share(d)], name: d.name, client: d };
}

/** The scatter for one year's clients; the "selected" series holds the ring around `selected`. */
export function scatterOption(data, rows, selected, token, T) {
  // Name the three largest clients and the largest one-vendor client, no more.
  // ECharts copies data items, so match labels by name, not by object.
  const named = new Set([...rows.slice(0, 3), ...rows.filter((d) => share(d) >= 0.9).slice(0, 1)].map((d) => d.name));
  const series = SECTORS.map(([name, colour, test]) => ({
    type: "scatter",
    name,
    symbolSize: GREY.has(name) ? 6 : 8,
    z: GREY.has(name) ? 1 : 3,
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
    z: 10,
    silent: true,
    itemStyle: { color: "transparent" },
    label: {
      show: true,
      position: "left",
      distance: 8,
      color: token("--paper"),
      fontWeight: 600,
      fontSize: T.fs("small"),
      textBorderColor: token("--surface"),
      textBorderWidth: 3,
      formatter: (p) => p.data.name,
    },
    // The largest client sits among the other large ones: its name goes above.
    data: rows
      .filter((d) => named.has(d.name))
      .map((d, i) => ({
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
    data: selected ? [point(selected)] : [],
  });
  return {
    animationDuration: 300,
    textStyle: { fontFamily: T.family("sans"), fontSize: T.fs("caption") },
    grid: { left: 52, right: 20, top: 36, bottom: 72 },
    legend: {
      bottom: 0,
      left: 0,
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: token("--muted"), fontSize: T.fs("caption") },
      data: SECTORS.map(([name]) => name),
    },
    tooltip: {
      trigger: "item",
      confine: true,
      backgroundColor: token("--surface"),
      borderColor: token("--line"),
      textStyle: { color: token("--paper"), fontSize: T.fs("small") },
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
      nameTextStyle: { color: token("--muted"), fontSize: T.fs("caption"), align: "right", verticalAlign: "top", padding: [28, 0, 0, 0] },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: token("--muted"), fontSize: T.fs("caption"), formatter: (v) => (v >= 1000 ? `${v / 1000}k` : `${v}`) },
      splitLine: { lineStyle: { color: token("--grid") } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      interval: 0.2,
      name: "↑ Share from the largest vendor",
      nameTextStyle: { color: token("--muted"), fontSize: T.fs("caption"), align: "left", padding: [0, 0, 6, -44] },
      axisLabel: { color: token("--muted"), fontSize: T.fs("caption"), formatter: (v) => `${Math.round(v * 100)}%` },
      splitLine: { lineStyle: { color: token("--grid") } },
    },
    series,
  };
}

/** The vendor panel for one client: its name, a line of numbers, its top vendors and the rest. */
export function panelFor(data, client) {
  const top = client.top.map(([f, n]) => [data.firms[f], n]);
  return {
    name: client.name,
    meta: `${sectorName(client.sector)} · ${num(client.filings)} placed filings · ${num(client.vendors)} ${client.vendors === 1 ? "vendor" : "vendors"}`,
    top: top.map(([name, n]) => ({ name, share: pct(n / client.filings), width: `${(100 * n) / client.filings}%` })),
    rest: client.rest ? `${num(client.rest)} more filings from ${num(client.vendors - top.length)} other firms` : null,
  };
}

// Vendor -> client flows. Node names carry a side prefix, because a firm can be
// a vendor and a client at once (Deloitte places workers and receives them).
export function flowsOption(f, token, T) {
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
  return {
    animationDuration: 300,
    textStyle: { fontFamily: T.family("sans"), fontSize: T.fs("caption") },
    tooltip: {
      trigger: "item",
      confine: true,
      backgroundColor: token("--surface"),
      borderColor: token("--line"),
      textStyle: { color: token("--paper"), fontSize: T.fs("small") },
      formatter: (p) => {
        if (p.dataType === "edge") {
          const client = f.clients.find((d) => d.name === side(p.data.target));
          return `<strong>${esc(side(p.data.source))} → ${esc(side(p.data.target))}</strong><br />
              ${num(p.data.value)} filings, ${pct(p.data.value / client.placed)} of the client's placed filings`;
        }
        const d = p.data;
        if (d.other) return `<strong>All other firms</strong><br />${num(d.placed)} filings to these ${f.clients.length} clients`;
        return `<strong>${esc(side(d.name))}</strong><br />${num(d.placed)} placed filings in the year${d.vendor ? ", to all its clients" : ", from all firms"}`;
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
        label: { color: token("--paper"), fontSize: T.fs("small"), fontWeight: 600, formatter: (p) => side(p.name) },
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
  };
}

/** The line under the flows: how much the named firms supply. */
export function coverage(f) {
  return `The ${f.vendors.length - 1} largest firms supply ${num(f.from_top_vendors)} of the ${num(f.client_filings)} filings these ${f.clients.length} clients receive (${pct(f.from_top_vendors / f.client_filings)}); every other firm together supplies the rest.`;
}

/** The 25 largest clients: [client, sector, filings, vendors, largest vendor, its share]. */
export function tableRows(data, rows) {
  return rows.slice(0, 25).map((d) => [d.name, sectorName(d.sector), num(d.filings), num(d.vendors), data.firms[d.top[0][0]], pct(share(d))]);
}

// Communities with and without filing counts, from analysis/week04_staffing.py.
const two = (v) => v.toFixed(2);

/** #staffing-community-stats: the table's rows and every number its prose quotes, by class. */
export function communityStats(c) {
  const m = c.modularity;
  const w = c.weighted_vs_unweighted;
  const iv = c.industry_or_vendor;
  const rows = [
    ["Communities (median run)", num(m.communities_median), num(w.communities_median_unweighted)],
    ["Modularity, real network", two(m.weighted_vs_rewired.real), two(m.wiring_only.real)],
    ["Modularity, rewired null (largest piece)", two(m.weighted_vs_rewired.null), two(m.wiring_only.null)],
    ["Modularity, filing counts shuffled", two(m.weights_only.null), "–"],
    ["NMI between two seeds", two(w.nmi_between_seeds_weighted), two(w.nmi_between_seeds_unweighted)],
    ["NMI with client industry", two(iv.nmi_community_industry), two(iv.unweighted.nmi_community_industry)],
    ["NMI with main vendor", two(iv.nmi_community_main_vendor_same_clients), two(iv.unweighted.nmi_community_main_vendor_same_clients)],
    ["AMI with client industry", two(iv.ami_community_industry), two(iv.unweighted.ami_community_industry)],
    ["AMI with main vendor", two(iv.ami_community_main_vendor_same_clients), two(iv.unweighted.ami_community_main_vendor_same_clients)],
    ["Clients in their main vendor's group", pct(iv.share_with_own_main_vendor), pct(iv.unweighted.share_with_own_main_vendor)],
  ];
  const wc = m.weights_check;
  const values = {
    "cross-share": pct(1 - wc.real_inside_share),
    "cross-share-null": pct(1 - wc.shuffled_inside_share),
    "multi-filings": pct(wc.filings_to_multi_vendor_clients_share),
    "multi-links": pct(wc.links_to_multi_vendor_clients_share),
    pieces: num(m.rewired_components_median),
    "im-modules": num(c.infomap.modules),
  };
  const fill = {
    cross: w.nmi_median,
    seeds: w.nmi_between_seeds_weighted,
    "seeds-plain": w.nmi_between_seeds_unweighted,
    vendor: iv.ami_community_main_vendor_same_clients,
    "vendor-plain": iv.unweighted.ami_community_main_vendor_same_clients,
    industry: iv.ami_community_industry,
    "im-louvain": c.infomap.nmi_with_louvain,
    "im-vendor": c.infomap.ami_community_main_vendor_same_clients,
    "im-industry": c.infomap.ami_community_industry,
    mod: m.weighted_vs_rewired.real,
    null: m.weighted_vs_rewired.null,
    "mod-plain": m.wiring_only.real,
    "null-plain": m.wiring_only.null,
    "null-weights": m.weights_only.null,
  };
  for (const [k, v] of Object.entries(fill)) values[k] = two(v);
  return { rows, values };
}
