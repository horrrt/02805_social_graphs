import { FigRow, Plot, StripChart, W4Figure } from "log-log-legends-kit";

// Two figures side by side (div.rx-fig-row), as Week 4 sets two plots or two
// figures in one row under the text. Numbers from Week 5's relations.json and
// fame.json, and Week 4's week04_place.json.
const pct = (v: number) => `${Math.round(v * 100)}%`;

const crossing = (
  <StripChart
    rows={[
      { label: "enemy", sub: "202 links", real: 0.54, realLabel: "54%", base: [0.4196, 0.028], baseLabel: "shuffled 42%", badge: "z = 4.3" },
      { label: "family", sub: "116 links", real: 0.2315, realLabel: "23%", base: [0.419, 0.0405], baseLabel: "shuffled 42%", badge: "z = −4.6" },
    ]}
    opts={{ domain: [0, 0.8], ticks: [0, 0.4, 0.8], fmt: pct, aria: "Enemy and family links that join two communities, against shuffled labels" }}
  />
);

const fame = (
  <StripChart
    rows={[
      { label: "Pearson r", sub: "303 pages", real: 0.77, realLabel: "0.77", base: [0.0, 0.057], baseLabel: "shuffled 0.00 ± 0.06" },
    ]}
    opts={{ domain: [-0.2, 1], ticks: [0, 0.5, 1], fmt: (v: number) => v.toFixed(1), aria: "Correlation of page length and in-degree against 1,000 shuffles" }}
  />
);

export const TwoPlots = () => (
  <FigRow>
    <Plot title="Links that join two communities" note="Dot: the real share. Band: shuffled labels, mean ± one standard deviation.">
      {crossing}
    </Plot>
    <Plot title="Page length against incoming links" note="Correlation of log length and log in-degree against 1,000 shuffles of in-degree.">
      {fame}
    </Plot>
  </FigRow>
);

export const TwoFigures = () => (
  <FigRow>
    <W4Figure title="Weak but real" caption="The metro groups against rewired networks in which each company keeps its number of metros.">
      <div className="w4-figure-body">
        <StripChart
          rows={[{ label: "Modularity", sub: "40 metros, 3 groups", real: 0.049, realLabel: "0.049", base: [0.013, 0.0012], baseLabel: "rewired 0.013", badge: "z = 29" }]}
          opts={{ domain: [0, 0.06], ticks: [0, 0.03, 0.06], fmt: (v: number) => v.toFixed(2), aria: "Modularity of the metro groups against rewired networks" }}
        />
      </div>
    </W4Figure>
    <W4Figure title="Fame buys words" caption="Pages more characters link to are longer: Pearson 0.77, where shuffles never passed 0.19.">
      <div className="w4-figure-body">{fame}</div>
    </W4Figure>
  </FigRow>
);
