import { HoverTipHost, StripChart } from "log-log-legends-kit";

// A chart host with instant tooltips: hovering a mark shows its realTip or
// baseTip. Week 5 relations data (public/weeks/week05/data/relations.json).
export const AroundStripChart = () => (
  <HoverTipHost className="w5-hero-plot" role="img" aria-label="Share of enemy and family links that join two communities">
    <StripChart
      rows={[
        { label: "Enemy", sub: "202 links", real: 0.54, realLabel: "54%", realTip: "Enemy: 54% of 202 links join two communities", base: [0.4196, 0.028], baseTip: "Shuffled labels: 42% ± 3%", badge: "z +4.3" },
        { label: "Family", sub: "116 links", real: 0.2315, realLabel: "23%", realTip: "Family: 23% of 116 links join two communities", base: [0.419, 0.0405], baseTip: "Shuffled labels: 42% ± 4%", badge: "z −4.6" },
      ]}
      opts={{ domain: [0.1, 0.7], ticks: [0.1, 0.3, 0.5, 0.7], fmt: (v: number) => `${Math.round(v * 100)}%`, aria: "Share of enemy and family links that join two communities" }}
    />
  </HoverTipHost>
);
