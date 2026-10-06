import { Anatomy } from "@/components/post/Anatomy";
import { Card } from "@/components/post/Card";
import { HowTo } from "@/components/post/HowTo";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";

// Opening: the pages, what a link means, how pages become vectors, and how to read the sections.
export function Opening() {
  return (
    <PostSection id="opening" owner="Gyula">
      <SectionOpener num="0" title="Opening">303 Wikipedia pages about Marvel characters, compared once by their links and once by their words.</SectionOpener>
      <Card className="card w4-card">
        <div className="w4-two">
          <div>
            <p className="sub">
              The pages are the English Wikipedia articles in Category:Marvel Comics superheroes, as the course
              froze them on 26 August 2026: 727,261 words in all, with 27,033 different words.
            </p>
            <p className="sub">
              <b>How a page becomes a vector.</b>
              {" "}
              Each word gets a weight on each page: how often the page uses it, times how rare it is across the
              303 pages. Eleven words sit on every page, among them the, and, marvel and comics, and weigh nothing.
              Two pages are near when their weights point the same way. A page's ten nearest pages are the ten
              that point closest to it.
            </p>
            <p className="sub">
              <b>What a link means.</b>
              {" "}
              Two pages are linked when either one links to the other's article. A link records an editor's choice
              to point there, not a friendship or a fight in the comics.
            </p>
            <Notice icon="!" gap headline="What counts as a name">
              We use the course brief's rule: a word written with a capital in more than half of its uses is a
              name. That catches Storm and Frost, and also Avengers, Latveria and the men of X-Men.
            </Notice>
          </div>
          <div>
            <Anatomy
              title="How each section reads"
              intro="Every section answers one question on one card."
              rows={[
                { term: "Question", def: "What we asked, and the short answer" },
                { term: "Did", def: "What we did, beside what to notice" },
                { term: "Figure", def: "The chart or the explorer that answers it" },
                { term: "Drawers", def: "Method and its limit, more numbers, tables, and the pairs we read" },
              ]}
            />
            <HowTo
              rows={[
                { swatch: "w4-sw-real", label: "The real pages", text: "What the 303 pages show." },
                { swatch: "w4-sw-band", label: "Baseline", text: "Mean and one standard deviation over random removals or shuffled labels." },
                { swatch: "w4-sw-ref", label: "Reference", text: "Ten pages picked at random." },
              ]}
            />
          </div>
        </div>
      </Card>
    </PostSection>
  );
}
