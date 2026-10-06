import { Card, Drawer, Drawers, HowTo, Notice, StripChart } from "log-log-legends-kit";

// Week 5's opening card (its text, the chart key and a drawer), stacked, and a plain
// card with a title, its line and a chart. Text and numbers from Week 5.
export const OpeningCard = () => (
  <Card className="card w4-card">
    <p className="sub">
      The pages are the English Wikipedia articles in Category:Marvel Comics superheroes, as the course froze them on 26 August 2026. Each is plain text, from 193 to 14,037 words long, 1,218 at the median.
    </p>
    <p className="sub">
      <b>What a link means.</b> A link runs from page A to page B when A's text links to B's article. The pages hold 1,784 such links, joining 1,434 pairs of pages.
    </p>
    <HowTo
      rows={[
        { swatch: "w4-sw-real", label: "The real pages", text: "What the pages and links show." },
        { swatch: "w4-sw-band", label: "Random baseline", text: "Mean and one standard deviation over shuffles, rewired networks or random orders." },
        { swatch: "w4-sw-ref", label: "Reference", text: "What chance alone would give." },
      ]}
    />
    <Drawers variant="foot">
      <Drawer label="What counts as a word">
        <Notice icon="!" gap headline="Preprocessing changes the counts">
          Sections 2 and 3 keep digits and split words at hyphens, so the pages hold about 740,000 tokens, 4% more. Each section states its rule.
        </Notice>
      </Drawer>
    </Drawers>
  </Card>
);

export const TitleAndChart = () => (
  <Card className="card">
    <h3>Enemy links against shuffled labels</h3>
    <p className="sub">Enemy links cross communities more often than shuffled labels would make them.</p>
    <StripChart
      rows={[{ label: "Enemy links across communities", real: 0.54, realLabel: "54%", base: [0.4196, 0.028], baseLabel: "shuffled labels 42% ± 3%" }]}
      opts={{ domain: [0, 1], ticks: [0, 0.5, 1], fmt: (v: number) => `${Math.round(v * 100)}%`, aria: "Enemy link share against shuffled labels" }}
    />
  </Card>
);
