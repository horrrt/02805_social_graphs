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
        With the names gone, she and her are among the heaviest words left, and every page drifts toward pages about women.
      </SectionOpener>
      <QuestionCard
        section="gender"
        num="3A"
        question="With the names gone, what makes two pages read alike?"
        answer="Pronouns, mostly. Pages about women fill 48% of all the ten-nearest lists and make up 17% of the pages."
        layout="beside"
        did={
          <TermProse as="p" className="sub" roots={["#gender-did p"]} terms={TERMS} after={[DATA]}>
            Wikidata labels 197 of the pages as a woman or a man: 52 women and 145 men. For each group we counted the women among their ten nearest labelled pages. A shuffle deals the labels out again over the same pages and keeps every list; we ran 1,000. A page that sits in many lists lifts women's and men's shares alike, so the gap between the two is what it cannot explain. Then we removed he, she and their forms as well.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            He is on 291 pages and his on 300, so TF-IDF gives them almost no weight: 0.04 per use against 0.46 for she. Without names a woman's labelled nearest pages are 96% women and a man's 44%, against 26% and 27% shuffled. Removing the pronouns too cuts the gap from 51 to 13 points, but women's pages still fill 44% of the lists, and we have not found why.
          </Notice>
        }
        figure={
          <Plot
            title="Women among the labelled nearest pages of women and of men"
            note="Filled dot: the 52 women's lists. Hollow dot: the 145 men's lists. Band: 1,000 shuffles of the labels over the same lists, mean and one standard deviation."
          >
            <Part part="gender" />
          </Plot>
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
              Without names, Jean Grey sits in 182 pages' ten nearest, Spider-Woman (Jessica Drew) in 142 and Emma Frost in 116. Her and she carry 44% of the similarity between women and the women in their lists.
            </p>
          </Drawer>
          <Drawer label="Table">
            <Part part="words" />
          </Drawer>
          <Drawer label="What we read" bodyId="gender-checked">
            <p>
              We read the 25 most similar pairs that do not link, names removed. All 25 join two women, and every match leads with she and her. One pair shares a story: Mockingbird and Jessica Drew were both New Avengers after Secret Invasion. Some share a theme, such as She-Hulk and Spitfire, who both got their powers from a blood transfusion. The other 24 share no team or storyline at the same time.
            </p>
            <Part part="readRemoved" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
