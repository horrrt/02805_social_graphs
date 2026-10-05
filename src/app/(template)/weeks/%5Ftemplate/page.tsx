import PageScripts from "@/components/PageScripts";
import { Anatomy } from "@/components/post/Anatomy";
import { Card } from "@/components/post/Card";
import { ClosingCard } from "@/components/post/ClosingCard";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { FindingRow } from "@/components/post/FindingRow";
import { FindingsStrip } from "@/components/post/FindingsStrip";
import { HeroStat } from "@/components/post/HeroStat";
import { HowTo } from "@/components/post/HowTo";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostHero } from "@/components/post/PostHero";
import { PostSection } from "@/components/post/PostSection";
import { QaDisclosure } from "@/components/post/QaDisclosure";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";

export default function Page() {
  return (
    <>
      <SkipLink />
      <PostTopbar
        root="../../"
        brandSpace
        siteLink
        navLabel="Sections of this post"
        links={[
          { href: "#opening", label: "Opening" },
          { href: "#first", label: "1" },
          { href: "#second", label: "2" },
          { href: "#closing", label: "Closing" },
        ]}
      />
      <main id="main">
        {/* Hero: the post's one question, a short answer, the scope caution, two numbers and one figure. */}
        <PostHero
          id="top"
          eyebrow="Week N · Course topic"
          title="A title that states the question"
          gridClass="w4-hero-grid w5-hero-grid"
          body={
            <>
              <b>The one question the whole post answers, in words a visitor can answer after reading?</b>
              {" "}
              One or two sentences on the data and on what the sections below ask.
            </>
          }
          caution="The scope caution: what a link or a count in this data does not mean."
          stats={
            <>
              <HeroStat value="000,000" label="the first number that sets the scale" />
              <HeroStat value="0,000" label="the second number" />
            </>
          }
        >
          <figure className="w4-hero-stage w5-hero-stage">
            <div aria-label="Toy figure: replace with the one figure that answers the question" className="w5-hero-plot" id="chart-hero" role="img"></div>
            <figcaption className="w5-hero-caption">
              How to read the figure and the one thing to notice, with the number against its baseline.
              Toy figure: Zachary's karate club stands in for your data.
              {" "}
              <a href="#first">Section 1</a>
              {" "}
              has the detail.
            </figcaption>
          </figure>
        </PostHero>
        {/* Findings: one row per section, each with its answer against the baseline. */}
        <div className="shell">
          <FindingsStrip id="findings" label="Findings" caps="Two sections, two findings" real="the real data">
            <FindingRow num="1" title="First section's title" finding="1" href="#first" link="Section 1 →">
              The first section's answer in one sentence, with its number and its baseline.
            </FindingRow>
            <FindingRow num="2" title="Second section's title" finding="2" href="#second" link="Section 2 →">
              The second section's answer in one sentence, with its number and its baseline.
            </FindingRow>
          </FindingsStrip>
        </div>
        <div className="shell">
          {/* Opening: self-contained. The data, what a link means, the terms, how to read the sections. */}
          <PostSection id="opening" owner="">
            <SectionOpener num="0" title="Opening">What the data is, in one line.</SectionOpener>
            <Card className="card w4-card">
              <div className="w4-two">
                <div>
                  <p className="sub">Where the data comes from, when it was frozen, and how many items it holds.</p>
                  <p className="sub">
                    <b>What a link means.</b>
                    {" "}
                    One concrete sentence on what joins two nodes, then what a link
                    does not mean. Readers may arrive here first: define every term the sections use.
                  </p>
                  <Notice icon="!" gap headline="Read the scope carefully">
                    The one caveat that changes how every number reads.
                  </Notice>
                </div>
                <div>
                  <Anatomy
                    title="How each section reads"
                    intro="Every section answers one question on one card."
                    rows={[
                      { term: "Question", def: "What we asked, and the short answer" },
                      { term: "Did", def: "What we did, beside what to notice" },
                      { term: "Figure", def: "The chart or table that answers it" },
                      { term: "Drawers", def: "Method and its limits, more numbers, and what we read in the data" },
                    ]}
                  />
                  <HowTo
                    rows={[
                      { swatch: "w4-sw-real", label: "The real data", text: "What the data shows." },
                      { swatch: "w4-sw-band", label: "Random baseline", text: "Mean and one standard deviation over shuffles or rewired networks." },
                      { swatch: "w4-sw-ref", label: "Reference", text: "What chance alone would give." },
                    ]}
                  />
                </div>
              </div>
            </Card>
          </PostSection>
          {/* Section 1: the standard card. Question and answer on top, text column with the figure beside it,
             checked passages below. Copy this whole <PostSection> for each further section. */}
          <PostSection id="first" owner="">
            <SectionOpener num="1" title="First section's title">
              The finding in one sentence: what a reader should remember from this section.
            </SectionOpener>
            <QuestionCard
              section="first"
              num="1A"
              question="The question, answerable after reading this card?"
              answer="The short answer, with its number and what it is compared against."
              layout="beside"
              did={
                <p className="sub">
                  One paragraph: what was counted, on which data, and the baseline that gives the number meaning. Everything else goes in the drawers.
                </p>
              }
              surprise={
                <Notice icon="💡" headline="What to notice">
                  The result we did not expect, with its number and its baseline.
                </Notice>
              }
              figure={
                <Plot
                  title="The figure's title: what it compares"
                  note="Dot: the real value. Band: the baseline, mean and one standard deviation either side. Toy numbers."
                >
                  <div id="chart-first"></div>
                </Plot>
              }
            >
              <Drawers variant="foot">
                <Drawer label="Method">
                  <p>
                    The rules a reader needs only to reproduce the count: what the null keeps and what it changes, with an example before any technical word.
                  </p>
                  <p>Seeds, runs, the tokeniser or the layout, word for word as the script does it.</p>
                  <p id="first-limit">The main limitation, in one sentence. Add no others.</p>
                </Drawer>
                <Drawer label="More numbers">
                  <p>Secondary results, a second sample, the robustness checks.</p>
                </Drawer>
                <Drawer label="What we read in the data" bodyId="first-checked">
                  <p>What we read by hand to test the counts, and what it showed.</p>
                  <div id="first-passage"></div>
                </Drawer>
              </Drawers>
            </QuestionCard>
          </PostSection>
          {/* Section 2: two panels in a row under the text, for a figure with two charts. */}
          <PostSection id="second" owner="">
            <SectionOpener num="2" title="Second section's title">The finding in one sentence.</SectionOpener>
            <QuestionCard
              section="second"
              num="2A"
              question="The second question?"
              answer="The short answer, with its number and its baseline."
              layout="below"
              did={<p className="sub">The method and the baseline. A term gets a definition on hover the first time it appears.</p>}
              surprise={
                <Notice icon="💡" headline="What to notice">
                  The unexpected result.
                </Notice>
              }
              figure={
                <div className="w5-two">
                  <Plot title="Left panel: the network" note="Toy network: Zachary's karate club, coloured by the club each member joined.">
                    <div id="chart-second-left"></div>
                  </Plot>
                  <Plot title="Right panel: the numbers behind it" note="Toy numbers.">
                    <div id="chart-second-right"></div>
                  </Plot>
                </div>
              }
            >
              <Drawers variant="foot">
                <Drawer label="Method">
                  <p id="second-limit">The limitation.</p>
                </Drawer>
                <Drawer label="What we read in the data" bodyId="second-checked">
                  <p>What we read, and a concordance or passage from the data.</p>
                </Drawer>
              </Drawers>
            </QuestionCard>
          </PostSection>
          {/* Closing: the takeaway, one limit, one next step; methods and the AI-use note one click away. */}
          <PostSection id="closing" owner="">
            <SectionOpener num="✓" title="Closing">The takeaway in one line.</SectionOpener>
            <ClosingCard
              takeaway="The takeaway with the sections' key numbers, each against its baseline."
              limit={
                <Notice icon="!" gap headline="One important limit">
                  The limit that applies to the whole post.
                </Notice>
              }
              next={
                <>
                  <b>Next step.</b>
                  {" "}
                  One meaningful next step, such as next week's method applied to this data.
                </>
              }
            >
              <QaDisclosure id="methods" cue="Methods, data and AI use">
                <p className="sub">
                  Data: the source, its licence and the date it was frozen. Every random step has a fixed seed.
                </p>
                <ul className="w5-methods">
                  <li>
                    <b>1 · analysis/weekNN_first.py</b>
                    {" "}
                    The method and its baseline, in one line.
                  </li>
                  <li>
                    <b>2 · analysis/weekNN_second.py</b>
                    {" "}
                    The method and its baseline, in one line.
                  </li>
                </ul>
              </QaDisclosure>
              <QaDisclosure id="closing-ai" cue="AI use and how we checked it">
                <p className="sub">What AI assistants did: code, drafts, revisions, browser tests.</p>
                <p className="sub">
                  How we checked it: each script writes the numbers its section quotes to a JSON file, a schema check tests the file, the site tests fail when the page and the file disagree, and the scripts rerun identically under two hash seeds.
                </p>
              </QaDisclosure>
            </ClosingCard>
          </PostSection>
        </div>
      </main>
      <SiteFooter>
        <span>Credit each data source here, in the form its licence asks for.</span>
        {" "}
        <span>
          Post template ·
          {" "}
          <a href="../../">Log–Log Legends</a>
          {" "}
          · DTU 02805
        </span>
      </SiteFooter>
      {/* Replace with one script per section: src/scripts/weekNN-<section>.js. */}
      {" "}
      <PageScripts page="template" />
    </>
  );
}
