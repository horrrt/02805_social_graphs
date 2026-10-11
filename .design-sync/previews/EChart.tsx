import { EChart } from "log-log-legends-kit";

// ECharts at the site's type sizes and colours; the theme comes from the tokens.
// Week 5 data from public/weeks/week05/data/: relations.json (bars),
// heaps.json grid (z against random orders, lines), fame.json points (a 60-page sample, scatter).

export const RelationLabels = () => (
  <EChart
    height={280}
    option={{
      xAxis: { type: "category", data: ["Teammate", "Enemy", "Family", "Killed", "Ally"], name: "label" },
      yAxis: { type: "value", name: "links" },
      series: [{ type: "bar", data: [217, 202, 116, 84, 58], label: { show: true, position: "top" } }],
    }}
  />
);

const heaps = {"tokens":[1000,1179,1389,1637,1929,2273,2679,3158,3721,4386,5169,6091,7179,8460,9970,11750,13848,16320,19234,22667,26714,31483,37103,43726,51532,60732,71574,84351,99409,117155,138070,162718,191766,226000,266346,313893,369929,435969,513797,605520],"most":[1.24,1.2,0.38,-0.12,-0.47,0.17,0.43,0.23,-0.03,-0.11,-0.55,-2.54,-1.84,-2.03,-1.13,-1.13,-0.83,-0.79,-0.87,-0.65,-0.46,-0.42,0.52,0.44,0.86,-0.19,-0.37,-0.75,-0.96,-1.98,-1.65,-1.35,-0.79,-0.92,-1.06,-1.99,-3.27,-3.1,-3.68,-3.93],"least":[-0.88,-0.26,-0.09,0.16,-0.06,0.26,0.45,0.03,-0.15,-0.19,0.28,0.69,1.39,1.48,1.49,1.62,1.67,1.65,1.7,1.76,2.53,2.27,2.66,2.64,2.89,2.49,2.23,2.79,2.48,1.87,2.14,1.98,1.69,1.91,1.7,1.38,0.99,-0.17,-0.42,0.5]};

// How far each reading order runs ahead of random orders, in standard
// deviations of 500 random orders, as words accumulate.
export const VocabularyGrowth = () => (
  <EChart
    height={300}
    option={{
      legend: {},
      tooltip: { trigger: "axis" },
      xAxis: { type: "log", name: "words read" },
      yAxis: { type: "value", name: "z against random orders" },
      series: [
        { type: "line", name: "Most-linked first", showSymbol: false, data: heaps.tokens.map((t, i) => [t, heaps.most[i]]) },
        { type: "line", name: "Least-linked first", showSymbol: false, data: heaps.tokens.map((t, i) => [t, heaps.least[i]]) },
      ],
    }}
  />
);

export const LengthAgainstInDegree = () => (
  <EChart
    height={300}
    option={{
      xAxis: { type: "log", name: "in-degree" },
      yAxis: { type: "log", name: "words on the page" },
      series: [{ type: "scatter", symbolSize: 7, data: [[1,700],[4,4527],[2,992],[8,3784],[2,3342],[13,5641],[4,882],[2,957],[3,435],[3,3058],[9,2540],[2,601],[5,2464],[5,3023],[12,5352],[4,3145],[2,1067],[4,1039],[10,3592],[6,1523],[14,3909],[23,11357],[7,1878],[3,1961],[5,2019],[5,3930],[4,2436],[8,6311],[2,1709],[13,8417],[6,3041],[50,6778],[7,4283],[3,783],[7,1420],[2,1511],[3,714],[6,3827],[9,2481],[22,7001],[4,1371],[5,1524],[4,1016],[5,2087],[3,2329],[3,3543],[1,1218],[14,7644],[7,1413],[3,468],[7,1078],[1,393],[1,1168],[1,1585],[6,7755],[1,555],[3,979],[4,1164],[2,2885],[2,3531]] }],
    }}
  />
);
