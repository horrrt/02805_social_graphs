import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Part } from "@/features/week06/Parts";
import { DATA, TERMS } from "@/scripts/week06-lookalikes.js";

// Section 1: the explorer. Pick a character and compare its ten nearest pages with names kept and removed.
export function Explore() {
  return (
    <PostSection id="explore" owner="Gyula">
      <SectionOpener num="1" title="Pick a character">
        With names, a page reads like the pages that share its names. Without them, it reads like pages about women.
      </SectionOpener>
      <QuestionCard
        section="explore"
        num="1A"
        question="Which pages read most like a character, and why?"
        answer="With names kept, pages that share a name or a team with it. With names removed, mostly pages about women, for men and women alike."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#explore-did p"]} terms={TERMS} after={[DATA]}>
            Pick a character. The left column lists the ten pages whose TF-IDF weights point closest to its page, by cosine; the right column does the same with every name taken out. Each row says whether the two pages are linked, or how many steps apart they sit, and gives the words that add most to the match.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Storm's nearest page is the Human Torch, whose surname is Storm; they do not link. Take the names out and her nearest pages are Jean Grey, She-Hulk, Emma Frost and Scarlet Witch, matched on her and she.
          </Notice>
        }
        figure={<Part part="explore" />}
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              Words are runs of letters in any alphabet with one inner apostrophe kept, lowercased: the course's rule, recovered by matching every page length in its lookalikes data. A word's weight on a page is its count over the page's length, times ln(303 / the number of pages that use it). The words behind a match are the four with the largest product of their weights on the two pages.
            </p>
            <p id="explore-limit">
              TF-IDF reads each word on its own, so it cannot tell Storm the codename from Storm the surname. A static word vector, from the brief's second half, gives storm one vector too; telling the two apart needs the sentence around the word.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              With names, a page's single nearest page is linked with it for 223 of the 303 pages; without names, for 125. Not one page keeps the same ten nearest pages once the names go: on average 2.83 of the ten stay.
            </p>
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
