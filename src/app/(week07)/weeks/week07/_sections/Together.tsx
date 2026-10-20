import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Gloss } from "@/components/post/Gloss";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Part } from "@/features/week07/Parts";
import { DATA } from "@/scripts/week07-comention.js";
import { TERMS } from "./terms";

// Section 2: the share of sentence ties that are links, by how many sentences name the pair, against rewiring.
export function Together() {
  return (
    <PostSection id="together" owner="Gyula">
      <SectionOpener num="2" title="Named together, mostly linked">
        The more sentences name a pair, the likelier the two pages link, far above what the same network rewired at random gives.
      </SectionOpener>
      <QuestionCard
        section="together"
        num="2A"
        question="How often is a pair named in one sentence also linked?"
        answer="56% of the time, against 15% when the network is rewired; 95% when ten or more sentences name the pair."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#together-did p"]} terms={TERMS} after={[DATA]}>
            We tied two characters when they are named in one sentence on any page, 1,568 pairs in all, and counted how many of the pairs are linked pages. As the baseline, the script rewires the text network 1,000 times so that every character keeps its number of partners: a character named beside everyone gets as many links by chance as its partners allow.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            The number of sentences works like a confidence score. A pair named in one sentence is linked 43% of the time, against 12% rewired; a pair named in ten or more, 95%, against 38%. Spider-Man and Venom share the most sentences, 178.
          </Notice>
        }
        figure={
          <Plot
            title="Share of pairs that are linked, by how many sentences name both"
            note={
              <>
                Dot: the real pairs. Band: the same pairs rewired 200 times within each row, mean and one
                {" "}
                <Gloss id="w7-term-standard-deviation" />
                . Linked means either page links to the other.
              </>
            }
          >
            <Part part="weights" />
          </Plot>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              Rewiring takes two ties, A–B and C–D, and swaps their ends to A–D and C–B, ten swap attempts per tie, never tying a pair twice: every character keeps its number of partners and the network keeps its size. For the chart each row is rewired on its own, so a row is compared with pairs of characters as widely named as its own. Seeds start at 7, so a rerun gives the same files.
            </p>
            <p id="together-limit">
              A link and a sentence are not independent: Wikipedia&apos;s style is to link a name the first time an article uses it, so a sentence that names a character is often the sentence that carries the link. The comparison shows that the two records agree, not that they measure different things.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              Across all 1,568 pairs, the share linked is 56% against a rewired 15.0% ± 0.7, a z-score of 61. Of the 1,784 one-way links, 1,590 (89%) point to a character the linking page names somewhere in its text.
            </p>
          </Drawer>
          <Drawer label="Table">
            <Part part="weightTable" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
