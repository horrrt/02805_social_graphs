import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Copying as Part } from "@/features/week05/copying/Copying";
import { COPYING, TERMS } from "@/scripts/week05-copying.js";

// Section 2: pages that share a passage of 30 words or more. The copying islands
// (src/features/week05/copying/) draw the linked strip, the copying network, the cluster table and the
// passages; the term in "what we did" waits for copying.json, as on main.
export function Copying() {
  return (
    <PostSection id="copying" owner="Gyula">
      <SectionOpener num="2" title="Catch Wikipedia copying itself">
        Pages copy each other when their characters share a codename or a team, and what they copy is mostly publication history and lists of films and games, rarely the character's story.
      </SectionOpener>
      <QuestionCard
        section="copying"
        num="2A"
        question="Which Marvel pages copy text from each other?"
        answer="22 pairs of pages, in 12 clusters, nearly all about characters who already link to each other."
        layout="beside"
        did={
          <TermProse as="p" className="sub" roots={["#copying-did p"]} terms={TERMS} after={[COPYING]}>
            We collected every run of eight words in a row on each page, set aside runs found on more than 10 pages as house style, and linked two pages when they share a passage of 30 words or more.
          </TermProse>
        }
        surprise={
          <>
            <Notice icon="💡" headline="What to notice">
              20 of the 22 copying pairs link to each other, against 3.1% of all pairs of pages and 16% of pairs that share only a phrase. Counted on both pages of each pair, 35% of the copied words sit under Publication history and 24% under In other media, the lists of films and games, and only 5% in the character's biography.
            </Notice>
            <Part part="linked" />
          </>
        }
        figure={
          <Plot
            title="The copying network"
            note="Each dot is a page, sized by the words it shares. A line joins two pages that share a passage of 30 words or more, thicker for more shared words; a dashed line means the two pages do not link to each other. Hover a line for the passage."
          >
            <Part part="network" />
          </Plot>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              We split every page into lower-case words, 740,282 in all, and collected every run of eight words in a row, an 8-gram. A run found on many pages is house style, not copying: "in American comic books published by Marvel Comics" is on 282 of the 303 pages. So 8-grams on more than 10 pages are set aside.
            </p>
            <p>
              The remaining 8-grams merge into passages, overlapping runs counting once. Two pages copy each other when they share a passage of 30 words or more. The copying network links those pages, and its connected pieces are the clusters.
            </p>
            <p>
              A word is a run of letters and digits, with an apostrophe inside a word kept ("jean's"); punctuation and line breaks are dropped. Each word keeps its place on the page, so every shared passage is quoted from the page itself, and a passage copied twice on a page counts twice. A passage is labelled with the section heading above it on each of the two pages. What ties each cluster's characters was read from their pages.
            </p>
            <p>
              The check: a pair that copies is compared with all 45,753 pairs of pages and with the 2,830 pairs that share only a phrase, an 8-gram run shorter than 30 words. A link counts in either direction.
            </p>
            <p id="copying-limit">
              The text has no edit history, so we cannot tell who copied whom. The passage length matters: at 20 words, 80 pairs copy and 46 of them link; at 50 words, 11 copy and all of them link.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              The two pairs that do not link are Wild Child's: his page shares a stock sentence about Krakoa with Storm's and Rachel Summers's. Five clusters share a codename (Venom and Eddie Brock), six a team (Rocket Raccoon and Star-Lord) and one a family.
            </p>
            <p>
              The house-style cutoff barely matters: any cutoff from 3 to 20 pages gives the same 22 pairs. And runs of 12 words add 16 pairs from a templated lead that 8-word runs split, on eight Strikeforce: Morituri pages whose leads come in two versions.
            </p>
          </Drawer>
          <Drawer label="Table: the 12 clusters">
            <Part part="clusters" />
          </Drawer>
          <Drawer label="What we read in the pages" bodyId="copying-checked">
            <p>
              The longest passage of the largest copying pair, quoted from its first page. The next two pairs, and a templated lead that only runs of 12 words find, are one click away.
            </p>
            <Part part="passages" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
