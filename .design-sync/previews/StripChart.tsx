import { StripChart } from "log-log-legends-kit";

// Week 5, section 1 (public/weeks/week05/data/relations.json, as
// src/scripts/week05-relations.js crossing() builds the chart): each relation
// label's share of links that join two communities, against shuffled labels.
const pct = (v: number) => `${Math.round(v * 100)}%`;

export const RelationsCrossing = () => (
  <StripChart
    rows={[
      { label: "Enemy", sub: "202 links", real: 0.54, realLabel: "54%", base: [0.4196, 0.028], baseTip: "Shuffled labels: 42% ± 3%", badge: "z +4.3", bold: true },
      { label: "Teammate", sub: "217 links", real: 0.4579, realLabel: "46%", base: [0.4182, 0.0273], baseTip: "Shuffled labels: 42% ± 3%", badge: "z +1.5" },
      { label: "Killed", sub: "84 links", real: 0.3649, realLabel: "36%", base: [0.4193, 0.0483], baseTip: "Shuffled labels: 42% ± 5%", badge: "z −1.1" },
      { label: "Ally", sub: "58 links", real: 0.306, realLabel: "31%", base: [0.4197, 0.0583], baseTip: "Shuffled labels: 42% ± 6%", badge: "z −2.0" },
      { label: "Family", sub: "116 links", real: 0.2315, realLabel: "23%", base: [0.419, 0.0405], baseTip: "Shuffled labels: 42% ± 4%", badge: "z −4.6", bold: true },
    ]}
    opts={{
      domain: [0.1, 0.7],
      ticks: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
      fmt: pct,
      axisTitle: "share of links joining two communities",
      aria: "Share of each label's links that join two communities, against shuffled labels",
    }}
  />
);

// Week 5 findings: three results, each against its own baseline, on one axis.
export const ThreeFindings = () => (
  <StripChart
    rows={[
      { label: "Pearson r, log length and log in-degree", real: 0.77, realLabel: "0.77", base: [0, 0.057], baseLabel: "shuffled 0.00" },
      { label: "Consensus modularity", sub: "8 communities", real: 0.5059, realLabel: "0.506", base: [0.3471, 0.0043], baseLabel: "rewired 0.347", badge: "z 36.6" },
      { label: "Copying pairs that already link", real: 0.9091, realLabel: "20 of 22", ref: [0.0313, "all pairs 3.1%"] },
    ]}
    opts={{ domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt: (v: number) => v.toFixed(2), aria: "Three Week 5 results against their baselines" }}
  />
);

// Every optional mark at once: sub-label, interval, reference line, badge,
// hollow dot, a row with no observed value and a divider. Numbers illustrative.
export const EveryMark = () => (
  <StripChart
    rows={[
      {
        label: "Modularity of the hero network", sub: "Louvain, best of 50 runs",
        real: 0.62, realLabel: "0.62", realTip: "Observed modularity",
        base: [0.41, 0.03], baseLabel: "configuration model 0.41 ± 0.03", baseTip: "Mean ± sd over 1,000 rewirings",
        ci: [0.55, 0.69], ciTip: "95% interval", ref: [0.5, "0.5"], badge: "×1.5", bold: true,
      },
      { label: "Villain network", real: 0.3, realLabel: "0.30", hollow: true, base: [0.32, 0.02], baseLabel: "0.32" },
      { label: "Baseline only", real: null, base: [0.5, 0.1], baseLabel: "no observed value", divider: true },
      { label: "Value on its baseline", real: 0.5, realLabel: "0.50", base: [0.5, 0.05], baseLabel: "0.50" },
    ]}
    opts={{ domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt: (v: number) => v.toFixed(2), axisTitle: "modularity Q", aria: "Every optional strip mark" }}
  />
);
