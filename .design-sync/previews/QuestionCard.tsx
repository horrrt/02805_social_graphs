import { Drawer, Drawers, Notice, Plot, QuestionCard, StripChart } from "log-log-legends-kit";

// Week 5's question card in its two layouts: section 1 with the figure below
// the two text columns, section 6 with the figure beside the text. Text from
// the Week 5 page; numbers from relations.json (crossing) and fame.json (fit).
const pct = (v: number) => `${Math.round(v * 100)}%`;
const crossing = [
  { label: "enemy", arcs: 202, crossing: 0.54, mean: 0.4196, sd: 0.028, z: 4.29 },
  { label: "ally", arcs: 58, crossing: 0.306, mean: 0.4197, sd: 0.0583, z: -1.95 },
  { label: "family", arcs: 116, crossing: 0.2315, mean: 0.419, sd: 0.0405, z: -4.63 },
];

export const FigureBelow = () => (
  <QuestionCard
    section="relations"
    num="1A"
    question="Do enemies sit in different communities from allies and family?"
    answer="Mostly yes, as a tendency: about half of the word list's labels are right."
    layout="below"
    did={
      <p className="sub">
        We labelled each link by the sentence that names it, using a small word list, then counted how often each label's links join two communities, against the labels shuffled.
      </p>
    }
    surprise={
      <Notice icon="💡" headline="What to notice">
        54% of enemy links join two communities, against 42% when the labels are shuffled (z = 4.3). Family links cross only 23% of the time (z = −4.6).
      </Notice>
    }
    figure={
      <Plot
        title="Links that join two communities, by label"
        note="Dot: the real share over 100 Louvain runs. Band: shuffled labels, mean ± one standard deviation."
      >
        <StripChart
          rows={crossing.map((c) => ({
            label: c.label,
            sub: `${c.arcs} links`,
            real: c.crossing,
            realLabel: pct(c.crossing),
            base: [c.mean, c.sd] as [number, number],
            baseLabel: `shuffled ${pct(c.mean)}`,
            badge: `z = ${c.z.toFixed(1)}`,
          }))}
          opts={{ domain: [0, 0.8], ticks: [0, 0.4, 0.8], fmt: pct, aria: "Share of three labels' links that join two communities, against shuffled labels" }}
        />
      </Plot>
    }
  >
    <Drawers variant="foot">
      <Drawer label="Method">
        <p>A link from A to B means A's Wikipedia page links to B's. For each of the 1,784 links we took the first sentence on A's page that names B, and found one for 1,513 (85%).</p>
      </Drawer>
      <Drawer label="More numbers">
        <p>The labelled links: 217 teammate, 202 enemy, 116 family, 84 killed and 58 ally.</p>
      </Drawer>
      <Drawer label="What we read in the pages" bodyId="relations-checked">
        <p>We read 60 sentences, 12 per label, drawn at random: 32 of the labels describe how A and B relate.</p>
      </Drawer>
    </Drawers>
  </QuestionCard>
);

export const FigureBeside = () => (
  <QuestionCard
    section="fame"
    num="6A"
    question="Do characters that more pages link to get longer Wikipedia pages?"
    answer="Yes, and strongly (Pearson 0.77, Spearman 0.75)."
    layout="beside"
    did={
      <p className="sub">
        The correlation of 0.77 is far from chance: in 1,000 shuffles of in-degree over the pages it averaged 0.00 ± 0.06 and never passed 0.19. For the five pages furthest above the line and the five furthest below we measured what could explain the gap.
      </p>
    }
    surprise={
      <Notice icon="💡" headline="What to notice">
        The 46 hub pages sit 0.25 below the rest (×0.78, p = 0.008). Being named on other pages without a link barely goes with a longer page (Spearman 0.07, p = 0.202).
      </Notice>
    }
    figure={
      <Plot title="Page length against incoming links" note="Pearson correlation of log length and log in-degree over the 303 pages, against 1,000 shuffles of in-degree.">
        <StripChart
          rows={[
            { label: "Pearson r", sub: "303 pages", real: 0.77, realLabel: "0.77", base: [0.0, 0.057], baseLabel: "shuffled 0.00 ± 0.06" },
            { label: "Spearman ρ", sub: "303 pages", real: 0.75, realLabel: "0.75" },
          ]}
          opts={{ domain: [-0.2, 1], ticks: [0, 0.5, 1], fmt: (v: number) => v.toFixed(1), aria: "Correlation of page length and in-degree against shuffles" }}
        />
      </Plot>
    }
  >
    <Drawers variant="foot">
      <Drawer label="Method">
        <p>We fitted a straight line to ln(words) against ln(1 + in-degree) by ordinary least squares over all 303 pages. The slope is 0.72: each doubling of 1 + in-degree multiplies the predicted length by 1.65.</p>
      </Drawer>
      <Drawer label="More numbers">
        <p>Out-degree tracks length even more closely (Spearman 0.78); PageRank gives 0.71.</p>
      </Drawer>
    </Drawers>
  </QuestionCard>
);
