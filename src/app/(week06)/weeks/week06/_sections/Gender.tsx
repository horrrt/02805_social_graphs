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

// Section 3: with names removed, every page leans toward women's pages. Women's and men's nearest pages
// against shuffled labels, and the gap between them.
export function Gender() {
  return (
    <PostSection id="gender" owner="Gyula">
      <SectionOpener num="3" title="Without names, pages lean toward women's pages">
        With the names gone, every page drifts toward pages about women, and she and her pull women's pages closest to each other.
      </SectionOpener>
      <QuestionCard
        section="gender"
        num="3A"
        question="With the names gone, what makes two pages read alike?"
        answer="Pages about women. They fill 48% of all the ten-nearest lists and make up 17% of the pages; she and her make a woman's list almost all women."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#gender-did p"]} terms={TERMS} after={[DATA]}>
            For every page we took its ten nearest pages and counted the pages about women among them, by Wikidata's label: 52 women and 145 men among the 197 pages that have one. Then we compared women's lists with men's. Women's pages that sit in many lists lift both alike, so the gap between the two is what the pages' own words add; 1,000 shuffles of the labels over the same lists put that gap at about 0. Last, we removed he, she and their forms as well.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            He is on 291 pages and his on 300, so TF-IDF gives them almost no weight: an IDF of 0.04 against 0.46 for she. That makes the gap: without names a woman's list is 51 points more female than a man's, and 13 points once the pronouns go too. The lean itself barely moves, from 48% to 44%, and we have not found why.
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
              The label is Wikidata's, not the page's, and the 106 pages without a woman or man label drop out of every share. Counting every slot of the women's lists, labelled or not, 92% are women.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              With names kept, women's lists are 49% women and men's 28%, a gap of 21 points (z 7.5). Without names the gap is 51 points (z 23.9); without pronouns too, 13 points (z 5.8).
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
