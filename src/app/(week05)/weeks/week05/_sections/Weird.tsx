import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Weird as Part } from "@/features/week05/weird/Weird";
import { TERMS, WEIRD } from "@/scripts/week05-weird.js";

// Section 7: MATTR against page length. The weird islands (src/features/week05/weird/) draw the scatter
// with its drawer of all pages, the passages and the top and bottom table; the term in "what we did"
// waits for weird.json, as on main.
export function Weird() {
  return (
    <PostSection id="weird" owner="Niklas">
      <SectionOpener num="7" title="Who has the weirdest Wikipedia page?">
        The pages with the most varied words hold lists and an interview, and 10 of the 30 most repetitive pages are about several characters who share one name.
      </SectionOpener>
      <QuestionCard
        section="weird"
        num="7A"
        question="Which Marvel page uses the most varied words for its length, and is that real or boilerplate?"
        answer="Real text: Coldblood, Super Rabbit and Ravage 2099 win with a list of cyborg parts, a Golden Age publication record and an interview."
        layout="beside"
        did={
          <TermProse as="p" className="sub" roots={["#weird-did p"]} terms={TERMS} after={[WEIRD]}>
            Weird, for us, means varied words. We slide a window of 100 words along each page one word at a time, count the different words in each window and average them: the moving-average type-token ratio, MATTR. The fixed window lets the shortest page, 193 words, meet the longest, 14,037 words, since the share of different words in a whole page falls as the page grows.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            The winners are real writing: 4 of the top 5 carry less house phrasing than their length neighbours, and 4 use more rare words. The losers are partly paperwork: 10 of the 30 lowest pages are about several characters sharing one name, against 4.6 expected by chance (p = 0.0071), and 4 of the bottom 5 carry more house phrasing than their neighbours. Ms. Marvel comes last (z = −4.15). Across all 303 pages, more house phrasing goes with a lower score (rank correlation −0.28, p &lt; 0.001).
          </Notice>
        }
        figure={
          <Plot
            title="Varied words against page length"
            note="Each dot is a page: its MATTR against its length in words, on a log scale. The shaded band holds random stretches of the whole corpus of the same length (mean ± 2 standard deviations; the dashed line is the mean). The solid line is the mean of each page's 30 length neighbours, which the ranking measures against. The five highest and five lowest scores against pages of similar length are named. Hover a dot for its numbers."
          >
            <Part part="scatter" />
          </Plot>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              We split each page into words: runs of letters in any alphabet, an inner apostrophe or hyphen kept, lowercased, a possessive 's removed; digits and punctuation dropped. We keep stopwords and do not lemmatise. The 303 pages hold 713,617 words.
            </p>
            <p>
              MATTR has no trend with length, but short pages spread more because they have fewer windows to average: a standard deviation of 0.031 in the shortest quarter of pages against 0.021 in the longest. So each page gets a z-score against the 30 pages nearest to it in length. Then we read the five highest and the five lowest.
            </p>
            <p>
              The score passes its length checks. Its rank correlation with page length is 0.02, its z-scores spread 1.11 in the shortest quarter and 1.00 in the longest, and 6 of the top 10 pages are shorter than the median page of 1,218 words. With a 50-word window instead of 100, 7 of the top 10 and 8 of the bottom 10 stay in their ten (rank correlation 0.945 over all pages).
            </p>
            <p>
              Real or boilerplate: a rare word is one found on at most 2 of the 303 pages. House phrasing is any run of 8 words found on more than 10 pages, section 2's cutoff applied to our word rule. It finds 113 such runs, led by "in american comic books published by marvel comics" on 282 pages. Both shares move with length (rank correlation 0.55 for rare words and −0.54 for house phrasing), since the house lead is a bigger slice of a short page, so each page we show is compared with the median of its 30 length neighbours. We leave out the share of a page's words used once (the hapax share): it falls as a page grows, so it cannot compare pages of different length.
            </p>
            <p>
              Long pages also stray from random text more often: 6.6% of pages longer than the median fall outside the corpus band, against 2.0% of shorter pages. That is why each page is ranked against pages of its own length and not against the band.
            </p>
            <p>
              The band: 2,000 random stretches of the whole corpus, every page joined in order, at each of 40 lengths (seed 2805), scored the same way. Sentences come from spaCy's rule-based sentencizer, so "Ms." and "U.S." do not end one. A page is about several characters when its first sentence says so ("Hawkeye is the name of several fictional characters"): 46 pages do. Section 6 calls them hub pages.
            </p>
            <p id="weird-limit">
              MATTR counts repeats, not strangeness: Coldblood wins by naming each cyborg part once, and only reading tells a list from an odd story.
            </p>
          </Drawer>
          <Drawer label="What we read in the pages" bodyId="weird-checked">
            <p>
              A sentence past the lead of each of the top three pages, and one from the last page, quoted from the page.
            </p>
            <Part part="passages" />
            <Plot
              title="The top and bottom five, read"
              note="Rank of 303 by z-score. Rare words: the share of the page's different words found on at most 2 pages. House phrasing: the share of its words inside runs of 8 found on more than 10 pages. In brackets, the median of the page's 30 length neighbours."
            >
              <Part part="table" />
            </Plot>
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
