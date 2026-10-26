import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { Part } from "@/features/week07/Parts";

// Section 4: the ties in only one network, read by hand.
export function Only() {
  return (
    <PostSection id="only" owner="Gyula">
      <SectionOpener num="4" title="What only one network has">
        The strongest ties without a link are mostly titles and wrong names. The links without a sentence are mostly a page saying he or she, or another name.
      </SectionOpener>
      <QuestionCard
        section="only"
        num="4A"
        question="What do the ties in only one of the two networks turn out to be?"
        answer="Of the 25 strongest ties without a link, 6 share a story. Of 20 links no sentence finds, 7 use he or she for one of the two, 10 another name, and 3 never name the other."
        layout="below"
        did={
          <p className="sub">
            We read the first sentence for each of the 25 pairs named together most often without a link, and the pages of 20 links that no sentence finds, drawn at random from 558. Each pair went into one group by what the text shows.
          </p>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Most missing links sit in plain view: for 78% of the 558, one page names the other, just never in a sentence that also names the page&apos;s own character. Jessica Jones&apos;s page says she forms a partnership with Misty Knight.
          </Notice>
        }
        figure={
          <div className="w5-two">
            <Plot title="Ties without a link" note="The 25 pairs named together most often whose pages do not link, by the first sentence that names both.">
              <Part part="pairsBuckets" />
            </Plot>
            <Plot title="Links without a sentence" note="20 of the 558 links no sentence finds, drawn at random, by what the two pages say.">
              <Part part="linksBuckets" />
            </Plot>
          </div>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              A shared story means both take part in one scene, team or storyline. A title means the sentence names a comic, film, show or game, such as Hawkeye #2. A passing mention names both without a shared scene. A wrong name is a match that is not the character, such as Blade in Blade of the Phoenix. For a link, he or she means a sentence names one and calls the other he, she or his; another name means a name our list does not give to that page, such as Brock or the bare Spider-Woman.
            </p>
            <p id="only-limit">
              One reader sorted the pairs, from the first sentence alone. A pair whose first sentence is a title can share a story further down its pages; Hawkeye and Mockingbird are married in the comics.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              Two names stand out among the 692 pairs named in one sentence without a link. The Hawkeye page is about everyone who used the name, and the main Hawkeye, Clint Barton, has a page outside the 303: Hawkeye is named with 42 characters and linked with 2, and 6 of the 25 pairs we read are Hawkeye&apos;s. Force matches phrases such as Air Force and Force Works: 32 partners, none linked. We left both as the rules made them, since the rules were set before any comparison with the links.
            </p>
          </Drawer>
          <Drawer label="Table">
            <Part part="pairsRead" />
            <Part part="linksRead" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
