import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Part } from "@/features/week06/Parts";
import { DATA, TERMS } from "@/scripts/week06-lookalikes.js";

// Section 2: linked pages among the ten nearest, with and without names, against a matched removal.
export function Names() {
  return (
    <PostSection id="names" owner="Gyula">
      <SectionOpener num="2" title="Names carry the links">
        TF-IDF finds the link network because it finds names. Without them it does no better than raw counts.
      </SectionOpener>
      <QuestionCard
        section="names"
        num="2A"
        question="How much of TF-IDF's agreement with the links comes from names?"
        answer="Most of it: linked pages among the ten nearest fall from 4.01 to 1.91 once the names go."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#names-did p"]} terms={TERMS} after={[DATA]}>
            We rebuilt the course's lookalikes and got its four numbers to the second decimal, with the same ten nearest pages for all 303. Then we removed the 10,519 words the name rule catches and counted again. As a control we removed 10,519 other words instead, each matched to a name on how many pages use it, in 20 runs.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Names hold 44.5% of all TF-IDF weight. Removing them drops TF-IDF to 1.91, level with raw counts (1.86); removing as many other words leaves 4.00 ± 0.01. Wikipedia links a character where it names one, so names and links travel together.
          </Notice>
        }
        figure={
          <Plot
            title="Linked pages among each page's ten nearest"
            note="Mean over the 303 pages. Dot: the real pages. Band: 20 runs removing as many other words, matched on how many pages use each, mean and one standard deviation. Dashed line: ten pages picked at random. The first three rows are the course's figures, reproduced."
          >
            <Part part="ladder" />
          </Plot>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              Two pages count as linked when either links to the other. The random line is ten times the share of all pairs that are linked. The stopword row uses NLTK's English list, which reproduces the course's 26,859 remaining words.
            </p>
            <p>
              The control pairs each name with an unused non-name on the same number of pages, or the nearest number with one left, drawn with seeds 6 to 25. It keeps how rare the removed words are and changes only whether they are names.
            </p>
            <p id="names-limit">
              The name rule is crude. It removes team and place names (Avengers, Latveria) and the men of X-Men along with people's names, and it keeps a name that is mostly written in lower case.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              The ten nearest pages sit close in the network: 40% are linked and 8% have no path, against 3% and 16% of all pairs. Without names 19% are linked and 48% are two steps away, against 34% with names.
            </p>
            <p>
              Removing he, she and their forms as well brings the count to 2.10.
            </p>
          </Drawer>
          <Drawer label="Table">
            <Part part="ladderTable" />
            <Part part="distance" />
          </Drawer>
          <Drawer label="What we read" bodyId="names-checked">
            <p>
              We read the 25 most similar pairs that do not link, names kept, and sorted each into four groups we fixed before reading. 16 share a story: 12 are teammates in Strikeforce: Morituri, whose pages repeat one lead sentence and one creator credit. 3 hold the same title, such as Doctor Doom. 6 share only a name word: Frost, Kane, Storm, Rider, Walker and Devil.
            </p>
            <Part part="readKept" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
