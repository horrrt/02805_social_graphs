import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Chart } from "@/features/template/charts";
import { second, TOY } from "@/scripts/week-template.js";

// Section 2: two panels in a row under the text, for a figure with two charts.
// The term in the prose appears once graphs.json has loaded, as on main.
export function Second() {
  return (
    <PostSection id="second" owner="">
      <SectionOpener num="2" title="Second section's title">The finding in one sentence.</SectionOpener>
      <QuestionCard
        section="second"
        num="2A"
        question="The second question?"
        answer="The short answer, with its number and its baseline."
        layout="below"
        did={
          <TermProse as="p" className="sub" terms={[second.term]} after={[TOY]} roots={["#second-did p"]}>
            The method and the baseline. A term gets a definition on hover the first time it appears.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            The unexpected result.
          </Notice>
        }
        figure={
          <div className="w5-two">
            <Plot title="Left panel: the network" note="Toy network: Zachary's karate club, coloured by the club each member joined.">
              <Chart chart="left" />
            </Plot>
            <Plot title="Right panel: the numbers behind it" note="Toy numbers.">
              <Chart chart="right" />
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
  );
}
