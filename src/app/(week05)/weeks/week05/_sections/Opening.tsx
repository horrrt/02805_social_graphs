import { Anatomy } from "@/components/post/Anatomy";
import { Card } from "@/components/post/Card";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { HowTo } from "@/components/post/HowTo";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";

// Opening: the pages, what a link means, what counts as a word, and how to read the sections.
export function Opening() {
  return (
    <PostSection id="opening" owner="">
      <SectionOpener num="0" title="Opening">303 Wikipedia pages about Marvel characters, read once as a network and once as text.</SectionOpener>
      <Card className="card w4-card">
        <div className="w4-two">
          <div>
            <p className="sub">
              The pages are the English Wikipedia articles in Category:Marvel Comics superheroes, as the
              course froze them on 26 August 2026. Each is plain text, from 193 to 14,037 words long,
              1,218 at the median.
            </p>
            <p className="sub">
              <b>What a link means.</b>
              {" "}
              A link runs from page A to page B when A's text links to B's
              article. The pages hold 1,784 such links, joining 1,434 pairs of pages. 58 pages receive
              no link at all, and 17 of those also link to no page. A link records an editor's choice
              to point there, not a friendship or a fight in the comics.
            </p>
            <Drawers variant="foot">
              <Drawer label="What counts as a word">
                <p className="sub">
                  <b>What a word is.</b>
                  {" "}
                  A tokenizer decides where one word ends and the next begins.
                  Unless a section says otherwise, a word is a run of letters, lowercased, with an
                  apostrophe or hyphen inside it kept and a possessive 's removed: "Spider-Man's first
                  appearance in 1962" gives spider-man, first, appearance, in. The pages then hold
                  713,617 tokens, word occurrences, of 27,754 types, different words.
                </p>
                <Notice icon="!" gap headline="Preprocessing changes the counts">
                  Sections 2 and 3 keep digits and split words at hyphens, so the same sentence gives
                  spider, man's, first, appearance, in, 1962, and the pages hold about 740,000 tokens,
                  4% more. Each section states its rule.
                </Notice>
              </Drawer>
            </Drawers>
          </div>
          <div>
            <Anatomy
              title="How each section reads"
              intro="Every section answers one question on one card."
              rows={[
                { term: "Question", def: "What we asked, and the short answer" },
                { term: "Did", def: "What we did, beside what to notice" },
                { term: "Figure", def: "The chart or table that answers it" },
                { term: "Drawers", def: "Method and its limits, more numbers, and the passages we read" },
              ]}
            />
            <HowTo
              rows={[
                { swatch: "w4-sw-real", label: "The real pages", text: "What the pages and links show." },
                { swatch: "w4-sw-band", label: "Random baseline", text: "Mean and one standard deviation over shuffles, rewired networks or random orders." },
                { swatch: "w4-sw-ref", label: "Reference", text: "What chance alone would give." },
              ]}
            />
          </div>
        </div>
      </Card>
    </PostSection>
  );
}
