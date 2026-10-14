import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Gloss } from "@/components/post/Gloss";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Part } from "@/features/week06/Parts";
import { DATA } from "@/scripts/week06-lookalikes.js";
import { TfIdfWeight } from "./Formulas";
import { TERMS } from "./terms";

// Section 1: the explorer. Pick a character and compare its ten nearest pages with names kept and removed.
export function Explore() {
  return (
    <PostSection id="explore" owner="Gyula">
      <SectionOpener num="1" title="Pick a character">
        With names, a page reads like the pages that share its names. Without them, most lists shift toward pages about women, a woman's most of all.
      </SectionOpener>
      <QuestionCard
        section="explore"
        num="1A"
        question="Which pages read most like a character, and why?"
        answer="With names kept, pages that share a name, a team or a title with it. Without names, a woman's page matches on she and her, and a man's on whatever words remain; section 3 measures where that leads."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#explore-did p"]} terms={TERMS} after={[DATA]}>
            Pick a character. Left, the ten pages whose TF-IDF weights point closest to its page, by cosine; right, the same with every name taken out. Each row says whether the two pages link or how many steps apart they sit, gives the cosine, and lists the three words that add most to the match.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Pick Storm, then Wolverine. With names, half of each list is women, mostly X-Men teammates. Without names, Storm's ten nearest pages are all women; Wolverine's keep six men.
          </Notice>
        }
        figure={<Part part="explore" />}
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              Words are runs of letters in any alphabet with one inner apostrophe kept, lowercased: the course's rule, recovered by matching every page length in its lookalikes data. A word&apos;s weight on a page is its count over the page&apos;s length, times the natural log of 303 over the number of pages that use it:
              {" "}
              <TfIdfWeight />
              . The words behind a match are the three with the largest product of their weights on the two pages.
            </p>
            <p id="explore-limit">
              TF-IDF reads each word on its own, so it cannot tell Storm the codename from Storm the surname. A
              {" "}
              <Gloss id="w6a-term-static-word-embedding" word="static" />
              {" "}
              word vector, from the brief&apos;s second half, gives storm one vector too; telling the two apart needs the sentence around the word.
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
