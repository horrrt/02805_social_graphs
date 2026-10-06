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

// Section 3: with names removed, do a woman's nearest pages share her gender, against shuffled labels?
export function Gender() {
  return (
    <PostSection id="gender" owner="Gyula">
      <SectionOpener num="3" title="Without names, pages pair by gender">
        Take the names out and the strongest thing left is grammar: pages about women read like pages about women.
      </SectionOpener>
      <QuestionCard
        section="gender"
        num="3A"
        question="With the names gone, what makes two pages read alike?"
        answer="Gender: 96% of a woman's nearest pages are about women, against 26% when the labels are shuffled."
        layout="beside"
        did={
          <TermProse as="p" className="sub" roots={["#gender-did p"]} terms={TERMS} after={[DATA]}>
            Wikidata gives a sex or gender for 197 of the pages: 52 women and 145 men. For each woman we counted the women among her ten nearest pages that have a label, and compared that with 1,000 shuffles of the labels over the 197 pages. Then we removed he, she and their forms as well.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Her and she carry 44% of the similarity between women. Without them the share falls to 64%, still far above 26%. What is left is mostly the wording of reception sections (list, best, female, ranked) and mutants.
          </Notice>
        }
        figure={
          <Plot
            title="Women among a woman's ten nearest pages"
            note="Share over the 52 women's labelled neighbours. Dot: the real pages. Band: 1,000 shuffles of the labels, mean and one standard deviation."
          >
            <Part part="gender" />
          </Plot>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              We read Wikidata property P21 for each page's item on 6 October 2026. 104 pages have no value: 36 are pages for a codename several characters share, and most of the rest are minor characters whose item lacks one. Ajak has two values and is left out. A shuffle deals the 197 labels out again over the same pages, so it keeps the number of women and changes who they are.
            </p>
            <p id="gender-limit">
              The label is Wikidata's, not the page's. A page about one woman can still describe a man at length, and the 104 unlabelled pages drop out of the count.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              Men are the majority, so their share says less. With names it matches chance, 72% against 74%. Without names it falls below chance, 56% against 73% (z −2.5), and to 50% once he and she go as well.
            </p>
            <p>
              With names, women's share is 49% against 26% (z 5.7); without them 96% (z 10.4); without pronouns too, 64% (z 5.5).
            </p>
          </Drawer>
          <Drawer label="Table">
            <Part part="words" />
          </Drawer>
          <Drawer label="What we read" bodyId="gender-checked">
            <p>
              We read the 25 most similar pairs that do not link, names removed. All 25 join two women, and every match leads with she and her. A few share a theme as well: She-Hulk and Spitfire both got their powers from a blood transfusion, and Patsy Walker and Jessica Drew both worked as private investigators. None shares a story.
            </p>
            <Part part="readRemoved" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
