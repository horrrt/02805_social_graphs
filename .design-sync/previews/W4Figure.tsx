import { StripChart, W4Figure } from "log-log-legends-kit";

// Week 4 section 1's figure: modularity of the metro groups against rewired
// networks. Numbers from week04_place.json (null_model): Q 0.049, rewired
// 0.013 ± 0.0012, z = 29, 40 metros in 3 groups.
const modularity = (
  <StripChart
    rows={[
      {
        label: "Modularity",
        sub: "40 metros, 3 groups",
        real: 0.049,
        realLabel: "0.049",
        base: [0.013, 0.0012],
        baseLabel: "rewired 0.013 ± 0.0012",
        badge: "z = 29",
      },
    ]}
    opts={{ domain: [0, 0.06], ticks: [0, 0.02, 0.04, 0.06], fmt: (v: number) => v.toFixed(2), labelW: 132, badgeW: 66, aria: "Modularity of the metro groups against rewired networks" }}
  />
);

export const StripFigure = () => (
  <W4Figure title="Weak but real" caption="The groups against rewired networks in which each company keeps its number of metros.">
    <div className="w4-figure-body">{modularity}</div>
  </W4Figure>
);
