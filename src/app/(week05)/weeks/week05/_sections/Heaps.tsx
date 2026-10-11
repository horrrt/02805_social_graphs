import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Heaps as Part } from "@/features/week05/heaps/Heaps";
import { HEAPS, SURPRISE_TERMS, TERMS } from "@/scripts/week05-heaps.js";

// Section 5: vocabulary growth in link order against random orders. The heaps islands
// (src/features/week05/heaps/) draw the curve, the gap strip, the table, the passages and the samples;
// the terms in "what we did" and in the notice wait for heaps.json, as on main.
export function Heaps() {
  return (
    <PostSection id="heaps" owner="Niklas">
      <SectionOpener num="5" title="Heaps' law of the Marvel universe">
        Word for word, the least-linked characters' pages bring more new vocabulary than random pages, and the most-linked pages bring less.
      </SectionOpener>
      <QuestionCard
        section="heaps"
        num="5A"
        question="Do minor characters bring new words, or mostly repeat the famous ones?"
        answer="They bring new words."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#heaps-did p"]} terms={TERMS} after={[HEAPS]}>
            We read the pages in three kinds of order: most-linked first, by the number of other pages that link to a page; least-linked first; and 500 random orders as the baseline. The ten most-linked pages hold 84,807 tokens and the ten least-linked only 6,636, so we compare the orders after the same number of tokens, not the same number of pages.
          </TermProse>
        }
        surprise={
          <TermProse as="div" className="notice" roots={["#heaps-surprise .notice"]} terms={SURPRISE_TERMS} after={[HEAPS]}>
            <span className="ico">💡</span>
            <span>
              <b>What to notice</b>
              {" "}
              After 100,000 tokens the least-linked order has met 11,079 types, 509 more than the random mean of 10,570 ± 207 (z = 2.5). After 400,000 tokens the most-linked order has met 20,613, 661 fewer than random (z = −3.5).
            </span>
          </TermProse>
        }
        figure={
          <>
            <div className="rx-start-grid">
              <Plot
                title="Types seen against tokens read"
                note="Both axes are logarithmic. Band: the middle 90% of 500 random page orders. Dashed: Heaps' law fitted to their mean. The two ordered lines stay within 11% of the random mean at every point, too close to tell apart at this scale; the right chart shows the gaps."
              >
                <Part part="curve" />
              </Plot>
              <Plot
                title="Each order against random, at two points"
                note="Dot: how many more (right) or fewer (left) types an order has than the random mean after the same number of tokens. Band: one standard deviation of the random orders either side of zero. The badge is z."
              >
                <Part part="gap" />
              </Plot>
            </div>
          </>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              A token is one word as it occurs, a type one distinct word: "the Hulk smashes the tank" has 5 tokens and 4 types, since "the" comes twice. We read the 303 pages one after another, 713,617 tokens in all, and counted after every token how many types had appeared so far. The whole corpus holds 27,754 types.
            </p>
            <p>
              Heaps' law says that count grows as a power of the tokens read, V = K n
              <sup>β</sup>
              , with β below 1: the more you have read, the more often a word is one you have met before. On Marvel β = 0.56, so reading 4 times as many words turns up about 2.2 times as many types.
            </p>
            <p>
              A word is a run of letters in any alphabet with an inner apostrophe or hyphen kept, lowercased, with a possessive 's removed; digits and punctuation are dropped. So "Spider-Man's" and "Spider-Man" are one type and "Pérez" stays whole. Ties in link count are broken by the page's id. Every curve is read off on 41 token counts spaced evenly on a log scale from 1,000 tokens to the whole corpus.
            </p>
            <p>
              The gap of an ordered curve to random is given in types and in z, the number of standard deviations of the 500 random orders. Every order ends on the same 27,754 types, so the random spread shrinks to nothing near the end; the two token counts we quote stay well short of it.
            </p>
            <p>
              The fit is a straight line through log V against log n on the random orders' mean, over the 26 grid points from 11,750 to 713,617 tokens: K = 16.7, β = 0.56. Fitted to each random order alone, β runs from 0.54 to 0.57 (5th to 95th percentile).
            </p>
            <p id="heaps-limit">
              Pages differ in length, and the most-linked pages are the long ones. Shuffling in-degree only among pages of similar length, in fifths by word count, 500 times, leaves both gaps standing (z = 3.2 for least-linked first at 100,000 tokens, z = −2.8 for most-linked first at 400,000), but fifths hold length only roughly.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              The gaps hold across the grid, not only at 100,000 and 400,000 tokens. The least-linked order stays 1.6 to 2.9 standard deviations above random from 11,750 to 266,346 tokens, and the most-linked order 2.0 to 3.9 below from 313,893 to 605,520 tokens. Each order leads or lags only while it reads its own end of the list: by 400,000 tokens the least-linked order has begun 253 pages, reached pages linked from 10 others, and sits at random (z = 0.2).
            </p>
            <p>
              Every count rests on one word rule; keeping digits or splitting hyphens would move them. And the link count only covers links among these 303 pages, not a character's fame in the comics: 58 of the pages get no link at all.
            </p>
          </Drawer>
          <Drawer label="Does the curve flatten?">
            <p>
              It bends but never flattens out. The slope on log-log axes is 0.63 below 91,570 tokens and 0.49 above, so new words come more slowly as the corpus grows. In the last tenth of the corpus the random orders still meet 18 new types per 1,000 tokens.
            </p>
          </Drawer>
          <Drawer label="Table">
            <Part part="table" />
          </Drawer>
          <Drawer label="What we read" bodyId="heaps-checked">
            <p>
              The last 100 pages in most-linked order, each linked from 2 pages or fewer, hold 90,907 tokens and add 2,144 types no earlier page used. 1,055 of them (49%) look like names, words that only ever occur with a capital letter, against 41% ± 1.6% for the last 100 pages of the random orders.
            </p>
            <Part part="passages" />
            <p>
              The split is a rough proxy: 53 of those names are capitalised only where they open a sentence or a line.
            </p>
            <Part part="samples" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
