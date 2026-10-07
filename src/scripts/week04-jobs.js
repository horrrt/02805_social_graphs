// Section 2 figures: certified H-1B occupation co-hiring network. The
// components in src/features/week04/jobs/ draw them as plain SVG, coloured
// from the page's CSS tokens, every mark with a native tooltip (<title>);
// this module holds the names, the label placement and the numbers the
// prose quotes, from public/weeks/week04/data/jobs.json.

const whole = new Intl.NumberFormat("en-US");
export const num = (value) => whole.format(value);
export const short = (title) => title.replace(/\s+\([^)]*\)$/, "").replace(/\s+/g, " ");

// Clusters are named after their largest occupation.
export function clusterName(data, id) {
  const group = data.clusters.find((g) => g.id === id);
  return group ? short(group.label) : `cluster ${id + 1}`;
}

// Display names for the network labels and key; the full title is in each tooltip.
const SHORT = {
  "Software Quality Assurance Analysts and Testers": "Software QA Testers",
  "Market Research Analysts and Marketing Specialists": "Market Research Analysts",
  "Computer and Information Research Scientists": "Computer Research Scientists",
  "Medical and Clinical Laboratory Technologists": "Lab Technologists",
  "Computer and Information Systems Managers": "IT Managers",
  "Network and Computer Systems Administrators": "Network Administrators",
  "Health Specialties Teachers, Postsecondary": "Health Teachers (college)",
  "Engineering Teachers, Postsecondary": "Engineering Teachers (college)",
  "Business Teachers, Postsecondary": "Business Teachers (college)",
  "Architects, Except Landscape and Naval": "Architects",
  "Web and Digital Interface Designers": "Web Designers",
  "General and Operations Managers": "General Managers",
  "Architectural and Engineering Managers": "Engineering Managers",
  "Bioengineers and Biomedical Engineers": "Bioengineers",
  "Electronics Engineers, Except Computer": "Electronics Engineers",
  "Elementary School Teachers, Except Special Education": "Elementary Teachers",
  "Secondary School Teachers, Except Special and Career/Technical Education": "Secondary Teachers",
  "Medical Scientists, Except Epidemiologists": "Medical Scientists",
  "Financial and Investment Analysts": "Financial Analysts",
  "Computer Occupations, All Other": "Computer Occupations (other)",
  "Physicians, All Other": "Physicians (other)",
};
export const shortName = (title) => SHORT[title] || title.replace(", All Other", " (other)").replaceAll(" and ", " & ").split(",")[0];
// Cluster hues in cluster order: the page's navy cluster family, kept apart
// from orange and blue (placed and direct) and the metro-group colours.
export const CLUSTER_TOKENS = ["--w4-cluster-0", "--w4-cluster-1", "--w4-cluster-2", "--w4-cluster-3"];

/** The node radius for a number of filings. */
export const radius = (filings) => Math.max(4.5, Math.min(14, 3.5 + Math.sqrt(filings) / 14));

// Label placement: largest occupation first, first free spot wins. A second
// pass lets large or cluster-naming occupations overlap other nodes; a third
// sets them further out with a leader line. `measure(text, role, weight)` is
// the text width; `size` the small type size.
export function placeLabels(nodes, P, clusterLabels, { W, legendTop }, measure, size) {
  const boxes = nodes.map((n) => {
    const [x, y] = P.get(n.id);
    const r = radius(n.filings);
    return [x - r, y - r, x + r, y + r];
  });
  const placed = [];
  const labels = [];
  const clear = (b) => placed.every((q) => b[2] < q[0] || b[0] > q[2] || b[3] < q[1] || b[1] > q[3]);
  const free = (b) => b[0] >= 2 && b[2] <= W - 2 && b[1] >= 2 && b[3] <= legendTop + 6 && clear(b)
    && boxes.every((q) => b[2] < q[0] + 1 || b[0] > q[2] - 1 || b[3] < q[1] + 1 || b[1] > q[3] - 1);
  const loose = (b) => b[0] >= 2 && b[2] <= W - 2 && b[1] >= 2 && clear(b);
  const box = (lx, ly, dy, anchor, tw, th) => {
    const x0 = anchor === "start" ? lx : anchor === "end" ? lx - tw : lx - tw / 2;
    const yb = ly + (dy === 0 ? th / 2 - 2 : 0);
    return { yb, b: [x0 - 2, yb - th + 1, x0 + tw + 2, yb + 3] };
  };
  // A leader line may not pass through a placed label or another node.
  const inside = (px, py, q) => px >= q[0] && px <= q[2] && py >= q[1] && py <= q[3];
  const lineClear = ([x1, y1, x2, y2], id) => {
    for (let i = 1; i <= 12; i += 1) {
      const px = x1 + ((x2 - x1) * i) / 12;
      const py = y1 + ((y2 - y1) * i) / 12;
      if (placed.some((q) => inside(px, py, q))) return false;
      if (boxes.some((q, j) => nodes[j].id !== id && inside(px, py, q))) return false;
    }
    return true;
  };
  const tryAt = (n, offsets, ok, leader) => {
    const [x, y] = P.get(n.id);
    const r = radius(n.filings);
    const big = n.filings >= 30000;
    const text = shortName(n.title);
    const tw = measure(text, "small", big ? 700 : 600);
    const th = size + 2;
    for (const [dx, dy, anchor] of offsets(r, th)) {
      const { yb, b } = box(x + dx, y + dy, dy, anchor, tw, th);
      if (!ok(b)) continue;
      const line = leader ? [x + (dx * r) / Math.hypot(dx, dy), y + (dy * r) / Math.hypot(dx, dy), x + dx, y + dy] : null;
      if (line && !lineClear(line, n.id)) continue;
      placed.push(b);
      labels.push({ id: n.id, x: x + dx, y: yb, anchor, size, weight: big ? 700 : 600, text, leader: line });
      return true;
    }
    return false;
  };
  const near = (r, th) => [[r + 4, 0, "start"], [-r - 4, 0, "end"], [0, -r - 4, "middle"], [0, r + th, "middle"],
    [r + 4, -7, "start"], [r + 4, 7, "start"], [-r - 4, -7, "end"], [-r - 4, 7, "end"],
    [r + 3, -r - 2, "start"], [-r - 3, -r - 2, "end"], [r + 3, r + th - 2, "start"], [-r - 3, r + th - 2, "end"]];
  const relaxed = (r, th) => [[r + 4, 0, "start"], [-r - 4, 0, "end"], [0, -r - 4, "middle"], [0, r + th, "middle"],
    [r + 4, -9, "start"], [-r - 4, -9, "end"], [r + 4, 9, "start"], [-r - 4, 9, "end"]];
  const far = (r) => [18, 30, 44].flatMap((d) => [[r + d, 0, "start"], [-r - d, 0, "end"], [0, -r - d, "middle"], [0, r + d, "middle"],
    [r + d, -d, "start"], [r + d, d, "start"], [-r - d, -d, "end"], [-r - d, d, "end"]]);
  const keyNames = new Set(clusterLabels);
  const important = (n) => n.filings >= 5000 || keyNames.has(n.title);
  const missed = [...nodes].sort((a, b) => b.filings - a.filings).filter((n) => !tryAt(n, near, free));
  for (const n of missed.filter(important)) tryAt(n, relaxed, loose);
  const done = new Set(labels.map((label) => label.id));
  for (const n of missed.filter((item) => !done.has(item.id))) tryAt(n, far, free, true);
  return labels;
}

/** The start card's pairs: the 12 most common, the most-filed occupation always first in its pair. */
export function pairs(data) {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const top = data.nodes.reduce((best, n) => (n.filings > best.filings ? n : best));
  const rows = [...data.pairs].sort((a, b) => b.weight - a.weight).slice(0, 12);
  const hasTop = (p) => p.source === top.id || p.target === top.id;
  const names = rows.map((p) => {
    const [first, second] = p.target === top.id ? [p.target, p.source] : [p.source, p.target];
    return [byId.get(first)?.title || first, byId.get(second)?.title || second];
  });
  return { rows, names, top, withTop: rows.filter(hasTop).length, hasTop };
}

/** The bridges card's two strips: how many occupations pass each rule against the baseline. */
export function bridgeStrips(data) {
  const br = data.bridges;
  return [
    {
      rows: [{
        label: "First rule",
        sub: "ratio above 1",
        real: br.lift_above_1,
        realLabel: num(br.lift_above_1),
        ref: [br.lift_above_1_by_chance_mean, `rewired ${num(Math.round(br.lift_above_1_by_chance_mean))}`],
      }],
      opts: { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500], fmt: num, labelW: 150, badgeW: 20,
        aria: "Occupations passing the first rule, real against rewired" },
    },
    {
      rows: [{
        label: "Strict rule",
        sub: "beats every rewired network",
        bold: true,
        real: br.all_occupations,
        realLabel: num(br.all_occupations),
        ref: [br.expected_false_positives, `by chance ${num(Math.round(br.expected_false_positives))}`],
      }],
      opts: { domain: [0, 25], ticks: [0, 5, 10, 15, 20, 25], fmt: num, labelW: 150, badgeW: 20,
        aria: "Occupations passing the strict rule, against the number expected by chance" },
    },
  ];
}

/** The section's status line. */
export const status = (data) => `${num(data.meta.filings)} certified H-1B filings · ${num(data.meta.occupations)} occupations · ${data.meta.year}`;

/** Every number the prose quotes, by its data-jobs key. */
export function jobsFill(data) {
  const q = data.quality;
  return {
    occupations: num(data.meta.occupations), nmi: q.nmi.toFixed(2), shuffled: q.nmi_shuffled.mean.toFixed(2),
    ami: q.ami.toFixed(2), scored: num(q.occupations), legacy: `${num(data.meta.legacy_filings_recoded)} filings`,
    years: data.comparison.nmi_between_years.toFixed(2), shared: num(data.comparison.shared_occupations),
    infomap: num(q.infomap.modules_of_two_or_more), "infomap-louvain": q.infomap.nmi_with_louvain.toFixed(2),
    "infomap-soc": q.infomap.nmi_with_soc.toFixed(2),
    "null-real": q.null.real.toFixed(2), "null-null": q.null.null.toFixed(2),
    "null-z": num(Math.round(q.null.z)), "null-runs": num(q.null.runs),
    "runs-nmi": q.louvain.nmi_between_runs_median.toFixed(2),
    "bridges-pass": num(data.bridges.all_occupations), "bridges-tested": num(data.bridges.tested),
    "bridges-chance": num(Math.round(data.bridges.expected_false_positives)),
    lift1: num(data.bridges.lift_above_1), "lift1-chance": num(Math.round(data.bridges.lift_above_1_by_chance_mean)),
    "bb-alpha": String(data.backbone.alpha), "bb-links": num(data.backbone.links),
    "bb-total": num(data.backbone.links_total), "bb-occ": num(data.backbone.occupations_linked),
    "bb-clusters": num(data.backbone.clusters_on_backbone), "bb-nmi": data.backbone.nmi_with_full_clusters.toFixed(2),
    "bb-base": data.backbone.nmi_between_full_runs_median.toFixed(2),
  };
}
