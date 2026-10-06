import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { Chart } from "@/features/template/charts";

// Section 1: the standard card. Question and answer on top, text column with the figure beside it,
// checked passages below. Copy this whole file for each further section.
export function First() {
  return (
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
            <Chart chart="first" />
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
            <Chart chart="passage" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
