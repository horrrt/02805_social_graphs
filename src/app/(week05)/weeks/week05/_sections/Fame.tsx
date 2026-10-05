import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";

// Section 6: page length against incoming links. week05-fame.js draws the scatter, the outlier table and
// the passages into the empty hosts.
export function Fame() {
  return (
    <PostSection id="fame" owner="Niklas">
      <SectionOpener num="6" title="Does network fame buy you more words?">
        Pages that more characters link to are longer. Pages for a codename several characters share sit below that trend, and so do minor characters whose every linking page names the same team or place.
      </SectionOpener>
      <QuestionCard
        section="fame"
        num="6A"
        question="Do characters that more pages link to get longer Wikipedia pages?"
        answer="Yes, and strongly (Pearson 0.77, Spearman 0.75)."
        layout="beside"
        did={
          <p className="sub">
            The correlation of 0.77 is far from chance: in 1,000 shuffles of in-degree over the pages it averaged 0.00 ± 0.06 and never passed 0.19. For the five pages furthest above the line and the five furthest below we measured what could explain the gap, then read each page and the pages that name it.
          </p>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Of two likely explanations, one holds across all 303 pages: the 46 hub pages sit 0.25 below the rest (×0.78, p = 0.008). Being named on other pages without a link barely goes with a longer page (Spearman 0.07, p = 0.202).
          </Notice>
        }
        figure={
          <Plot
            title="Page length against incoming links"
            note="Each dot is one of the 303 pages, on log scales; hollow dots are the 17 isolates. The line is the fit. The ten named pages sit furthest from it, coloured by side as the key shows, each marked with its length over the predicted length. Pages with the same in-degree are spread slightly sideways so they do not hide each other; hover a dot for its numbers."
          >
            <div id="chart-fame-scatter"></div>
          </Plot>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              A character's in-degree is the number of the other pages that link to its page. We counted the words on each of the 303 pages by the rule sections 5 to 7 share: runs of letters in any alphabet, an inner apostrophe or hyphen kept, lowercased, a possessive 's removed; digits and punctuation dropped.
            </p>
            <p>
              We fitted a straight line to ln(words) against ln(1 + in-degree) by ordinary least squares over all 303 pages. The 1 + keeps the 58 pages nobody links to, 17 of them isolates with no links at all. The slope is 0.72: each doubling of 1 + in-degree multiplies the predicted length by 1.65, starting from 546 words at zero in-degree. A page's residual is its distance from the line in natural-log units, so exp(residual) is its length over the predicted length: ×2 means twice as long as the line predicts.
            </p>
            <p>
              What we measured for each of the ten: whether the page is an isolate; how many other pages name the character and how many of those link to it, where a name is its title without the disambiguation plus the real name its node description gives in brackets, as in section 1; whether the page is for a codename several characters share, which we call a hub page (its first sentence says several characters share its title, the rule section 7 uses); and its section headings before the references.
            </p>
            <p>
              Reading added two things the rules miss: a codename other pages use instead of the title, which we counted with series titles and the Captain Britain Corps set aside, and a team that every page linking to a character mentions. Each shuffle test uses 1,000 shuffles with seed 2805.
            </p>
            <p id="fame-limit">
              In-degree counts only links among these 303 pages. A character famous from British comics or television, like Miracleman or Isaiah Bradley, gets nothing for it. The trend is a correlation: links do not write words, and both could share a cause we did not measure.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              Out-degree, the links a page makes, tracks length even more closely (Spearman 0.78), but a longer page has more room for links, so it partly measures length itself. PageRank, which counts a link from a much-linked page for more, gives 0.71.
            </p>
            <p>
              The names we counted come from the text alone, which lost its infoboxes, so a page can link to a character without naming it in our copy.
            </p>
            <p>
              Pages named without a link: Spearman 0.07 with the residual, against 0.00 ± 0.06 in shuffles (p = 0.202). The 46 hub pages: mean residual −0.21, against 0.04 for the other pages (p = 0.008).
            </p>
            <p>
              Each of the two explanations, hub pages and names without a link, shows at its extreme in one outlier: Brian Braddock's codename, Captain Britain, is on 14 other pages but linked from 1, and Quasar is a page for a name four characters share, with 24 incoming links.
            </p>
          </Drawer>
          <Drawer label="Table: the ten pages furthest from the line">
            <div id="fame-outliers"></div>
          </Drawer>
          <Drawer label="What we read in the pages" bodyId="fame-checked">
            <p>
              The ten pages furthest from the line, above it first. For each, the reason we found by measuring and reading, and a passage that supports it, from the page itself or a page that names it. Four of the five below the line are minor characters whose every linking page names the same team or place.
            </p>
            <div id="fame-passages"></div>
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
