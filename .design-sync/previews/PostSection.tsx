import { Card, Drawer, Drawers, PostSection, SectionOpener, StripChart } from "log-log-legends-kit";

// Week 5's opening section: the opener, then the card's text column with its
// closed drawer. (The page puts the section key beside it in a 500px + 1fr
// grid, which needs a page wider than this cell; see Anatomy and HowTo.)
export const Opening = () => (
  <PostSection id="opening" owner="">
    <SectionOpener num="0" title="Opening">303 Wikipedia pages about Marvel characters, read once as a network and once as text.</SectionOpener>
    <Card className="card w4-card">
      <p className="sub">
        The pages are the English Wikipedia articles in Category:Marvel Comics superheroes, as the
        course froze them on 26 August 2026. Each is plain text, from 193 to 14,037 words long,
        1,218 at the median.
      </p>
      <p className="sub">
        <b>What a link means.</b>
        {" "}
        A link runs from page A to page B when A's text links to B's
        article. The pages hold 1,784 such links, joining 1,434 pairs of pages. 58 pages receive
        no link at all, and 17 of those also link to no page. A link records an editor's choice
        to point there, not a friendship or a fight in the comics.
      </p>
      <Drawers variant="foot">
        <Drawer label="What counts as a word">
          <p className="sub">
            A tokenizer decides where one word ends and the next begins. Unless a section says
            otherwise, a word is a run of letters, lowercased, with an apostrophe or hyphen inside it
            kept and a possessive 's removed.
          </p>
        </Drawer>
      </Drawers>
    </Card>
  </PostSection>
);

// Section 1 of Week 5: the opener, then a card with the crossing shares from
// public/weeks/week05/data/relations.json against shuffled labels.
const pct = (v: number) => `${Math.round(v * 100)}%`;
const crossing = [
  { label: "enemy", arcs: 202, crossing: 0.54, mean: 0.4196, sd: 0.028 },
  { label: "teammate", arcs: 217, crossing: 0.4579, mean: 0.4182, sd: 0.0273 },
  { label: "killed", arcs: 84, crossing: 0.3649, mean: 0.4193, sd: 0.0483 },
  { label: "ally", arcs: 58, crossing: 0.306, mean: 0.4197, sd: 0.0583 },
  { label: "family", arcs: 116, crossing: 0.2315, mean: 0.419, sd: 0.0405 },
];

export const Relations = () => (
  <PostSection id="relations" owner="Gyula">
    <SectionOpener num="1" title="Turn links into relationships">
      Links written in fight words reach across the network's communities, and links written in family words stay inside them.
    </SectionOpener>
    <Card className="card w4-card">
      <h3>Links that join two communities, by label</h3>
      <p className="sub">
        54% of enemy links join two communities, against 42% when the labels are shuffled (z = 4.3).
        Family links cross only 23% of the time (z = −4.6).
      </p>
      <StripChart
        rows={crossing.map((c) => ({
          label: `${c.label} (${c.arcs} links)`,
          real: c.crossing,
          realLabel: pct(c.crossing),
          base: [c.mean, c.sd] as [number, number],
          baseLabel: `shuffled ${pct(c.mean)} ± ${pct(c.sd)}`,
        }))}
        opts={{ domain: [0.1, 0.7], ticks: [0.1, 0.3, 0.5, 0.7], fmt: (v: number) => pct(v), aria: "Share of each label's links that join two communities, against shuffled labels" }}
      />
    </Card>
  </PostSection>
);
