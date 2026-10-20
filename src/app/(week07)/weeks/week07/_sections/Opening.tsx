import { Anatomy } from "@/components/post/Anatomy";
import { Card } from "@/components/post/Card";
import { HowTo } from "@/components/post/HowTo";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";

// Opening: the pages, what a link means, how a sentence becomes a tie, and how to read the sections.
export function Opening() {
  return (
    <PostSection id="opening" owner="Gyula">
      <SectionOpener num="0" title="Opening">303 Wikipedia pages about Marvel characters, joined once by their links and once by the sentences that name two of them.</SectionOpener>
      <Card className="card w4-card">
        <div className="w4-two">
          <div>
            <p className="sub">
              The pages are the English Wikipedia articles in Category:Marvel Comics superheroes, as the course froze them on 26 August 2026. spaCy, the language library the course uses, splits them into 33,243 sentences.
            </p>
            <p className="sub">
              <b>What a link means.</b>
              {" "}
              Two pages are linked when either one links to the other&apos;s article: 1,434 linked pairs. A link records an editor&apos;s choice to point there, not a friendship or a fight in the comics.
            </p>
            <p className="sub">
              <b>How a sentence becomes a tie.</b>
              {" "}
              We find each character&apos;s names in the text: its page title, and the names Wikidata gives it, such as T&apos;Challa for Black Panther. When one sentence names two characters, the two are tied. 300 of the 303 characters are named somewhere, 24,919 times in all.
            </p>
            <Notice icon="!" gap headline="Which name is which character">
              One name can mean several characters. The bare name Human Torch goes to Johnny Storm&apos;s page, though the pages also use it for the android hero of the 1940s, and Iron Man goes to no page, because the main Iron Man is not one of the 303.
            </Notice>
          </div>
          <div>
            <Anatomy
              title="How each section reads"
              intro="Every section answers one question on one card."
              rows={[
                { term: "Question", def: "What we asked, and the short answer" },
                { term: "Did", def: "What we did, beside what to notice" },
                { term: "Figure", def: "The chart, table or explorer that answers it" },
                { term: "Drawers", def: "Method and its limit, more numbers, tables, and the text we read" },
              ]}
            />
            <HowTo
              rows={[
                { swatch: "w4-sw-real", label: "The real pages", text: "What the 303 pages show." },
                { swatch: "w4-sw-band", label: "Rewired network", text: "Mean and one standard deviation over the text network rewired at random, each character keeping its number of partners." },
                { swatch: "w4-sw-ref", label: "Reference", text: "A fixed value to compare against, named on the chart." },
              ]}
            />
          </div>
        </div>
      </Card>
    </PostSection>
  );
}
