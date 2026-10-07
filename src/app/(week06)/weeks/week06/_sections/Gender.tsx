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

// Section 3: with names removed, most lists lean toward women's pages. Women's and men's nearest pages
// against shuffled labels, and the gap between them.
export function Gender() {
  return (
    <PostSection id="gender" owner="Gyula">
      <SectionOpener num="3" title="Without names, pages lean toward women's pages">
        Two things happen once names go: most lists lean toward pages about women, and a TF-IDF quirk pulls women's pages closest to each other.
      </SectionOpener>
      <QuestionCard
        section="gender"
        num="3A"
        question="With the names gone, what makes two pages read alike?"
        answer="Pages about women. They take 48% of all ten-nearest slots and are 17% of the pages, and a woman's list holds 9.2 women in ten against 3.9 for a man's."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#gender-did p"]} terms={TERMS} after={[DATA]}>
            For every page we took its ten nearest pages and counted the pages about women among them, by Wikidata's label: 52 women and 145 men among the 197 pages that have one. Then we compared women's lists with men's. Women's pages that sit in many lists lift both alike, so the gap between the two is what the pages' own words add; 1,000 shuffles of the labels over the same lists put that gap at about 0. Last, we removed he, she and their forms as well.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Left, the lean: it survives removing he and she (48% to 44%). Women's pages are longer and long pages sit in more lists, but at equal length a woman's page still sits in 12.6 more lists (p = 0.01). Right, the quirk: he and his sit on nearly every page, so TF-IDF gives them almost no weight while she and her keep theirs; removing the pronouns cuts the gap from 51 to 13 points.
          </Notice>
        }
        figure={
          <div className="w5-two">
            <Plot
              title="Pages about women in everyone's ten nearest"
              note="Share of all 3,030 ten-nearest slots that go to the 52 pages about women. Dashed line: their share of the 303 pages."
            >
              <Part part="lean" />
            </Plot>
            <Plot
              title="Women's lists against men's"
              note="Women among a woman's labelled nearest pages minus women among a man's, in percentage points. Band: 1,000 shuffles of the labels over the 197 labelled pages, mean and one standard deviation."
            >
              <Part part="gap" />
            </Plot>
          </div>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              We read Wikidata property P21 for each page's item on 6 October 2026. 104 pages have no value: 36 are pages for a codename several characters share, and most of the rest are minor characters whose item lacks one. Ajak has two values and Phoenix Force is agender; both are left out.
            </p>
            <p id="gender-limit">
              The label is Wikidata's, not the page's, and the 106 pages without a woman or man label drop out of the gap chart. Counting every slot, labelled or not, a woman's list holds 9.2 women in ten.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              With names kept, women's lists are 49% women and men's 28%, a gap of 21 points (z 7.5). Without names the gap is 51 points (z 23.9); without pronouns too, 13 points (z 5.8).
            </p>
            <p>
              Why the lean? Not reception sections: deleting every reception and relationship section leaves it at 46.4%, against 45.4% ± 0.4 pts when the same number of words is cut from other sections (20 runs). A page twice as long sits in 8.5 more lists, and women's pages are longer (median 2,068 words against 1,700); the length model explains under half of the variation (R² 0.45). 231 of 303 lists gain women once names go, 39 stay level and 33 lose; 110 of 145 men's lists gain. He is on 291 pages and his on 300, so their IDF is 0.04 and 0.01, against 0.46 for she and 0.38 for her.
            </p>
            <p>
              Without names, Jean Grey sits in 182 pages' ten nearest, Spider-Woman (Jessica Drew) in 142 and Emma Frost in 116. With the labels shuffled, women's lists are 26% women, the share of women among the 197 labelled pages.
            </p>
          </Drawer>
          <Drawer label="Table">
            <Part part="words" />
          </Drawer>
          <Drawer label="What we read" bodyId="gender-checked">
            <p>
              We read the 25 most similar pairs that do not link, names removed. All 25 join two women, and every match leads with she and her. Two pairs share a story: Mockingbird and Jessica Drew were both New Avengers after Secret Invasion, and She-Hulk and Spider-Woman (Gwen Stacy) both fight in A-Force during Secret Wars. Some share a theme, such as She-Hulk and Spitfire, who both got their powers from a blood transfusion. The other 23 share no team or storyline at the same time.
            </p>
            <Part part="readRemoved" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
