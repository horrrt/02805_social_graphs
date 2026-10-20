import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Part } from "@/features/week07/Parts";
import { DATA } from "@/scripts/week07-comention.js";
import { TERMS } from "./terms";

// Section 1: the explorer. Pick a character and read every sentence tie it has, linked or not.
export function Explore() {
  return (
    <PostSection id="explore" owner="Gyula">
      <SectionOpener num="1" title="Pick a character">
        Each tie comes with the sentence that made it, so you can check what the count rests on.
      </SectionOpener>
      <QuestionCard
        section="explore"
        num="1A"
        question="Who do the pages name in one sentence with a character, and are the two linked?"
        answer="1,568 pairs of characters are named in one sentence somewhere, and 56% of them are linked. Some pages break the pattern: Hawkeye's page, about a name rather than one person, links to 2 of its 42 partners."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#explore-did p"]} terms={TERMS} after={[DATA]}>
            Pick a character. The list gives each character named in one sentence with it, most sentences first, whether the two pages link, and the first sentence that names both. Below it are the links no sentence finds.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Pick the Human Torch and find Toro, his partner in the Second World War. The two are not linked: Toro&apos;s partner was the android Human Torch, and the bare name sends both to Johnny Storm&apos;s page.
          </Notice>
        }
        figure={<Part part="explore" />}
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              A name counts when it matches one of the character&apos;s names exactly, capitals included, as a whole word; the longest name wins, so Spider-Man Noir is not also Spider-Man. A sentence that names one character twice counts once. Section 3&apos;s Method drawer gives the rules for which names a character gets.
            </p>
            <p id="explore-limit">
              The list shows the first sentence for each pair, not the strongest. A pair named in many sentences can open on a list or a title even when later sentences tell a shared story.
            </p>
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
