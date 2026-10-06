import { Plot, StripChart } from "log-log-legends-kit";

// Week 5 section 1's chart panel: title, axis note, then the chart. Numbers
// from public/weeks/week05/data/relations.json (crossing).
const crossing = [
  { label: "enemy", arcs: 202, crossing: 0.54, mean: 0.4196, sd: 0.028, z: 4.29 },
  { label: "teammate", arcs: 217, crossing: 0.4579, mean: 0.4182, sd: 0.0273, z: 1.46 },
  { label: "killed", arcs: 84, crossing: 0.3649, mean: 0.4193, sd: 0.0483, z: -1.13 },
  { label: "ally", arcs: 58, crossing: 0.306, mean: 0.4197, sd: 0.0583, z: -1.95 },
  { label: "family", arcs: 116, crossing: 0.2315, mean: 0.419, sd: 0.0405, z: -4.63 },
];
const pct = (v: number) => `${Math.round(v * 100)}%`;
const rows = crossing.map((c) => ({
  label: c.label,
  sub: `${c.arcs} links`,
  real: c.crossing,
  realLabel: pct(c.crossing),
  base: [c.mean, c.sd] as [number, number],
  baseLabel: `shuffled ${pct(c.mean)}`,
  badge: `z = ${c.z.toFixed(1)}`,
}));
const opts = { domain: [0, 0.8] as [number, number], ticks: [0, 0.2, 0.4, 0.6, 0.8], fmt: pct, aria: "Share of each label's links that join two communities, against shuffled labels" };

export const TitleNoteChart = () => (
  <Plot
    title="Links that join two communities, by label"
    note="Dot: the share of that label's links that join two communities, over 100 Louvain runs. Band: the same share with the labels shuffled, mean ± one standard deviation."
  >
    <StripChart rows={rows} opts={opts} />
  </Plot>
);

export const TitleOnly = () => (
  <Plot title="Enemy and family links against shuffled labels">
    <StripChart rows={[rows[0], rows[4]]} opts={opts} />
  </Plot>
);
