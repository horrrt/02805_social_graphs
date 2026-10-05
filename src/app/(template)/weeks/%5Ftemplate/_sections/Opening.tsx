import { Anatomy } from "@/components/post/Anatomy";
import { Card } from "@/components/post/Card";
import { HowTo } from "@/components/post/HowTo";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";

// Opening: self-contained. The data, what a link means, the terms, how to read the sections.
export function Opening() {
  return (
    <PostSection id="opening" owner="">
      <SectionOpener num="0" title="Opening">What the data is, in one line.</SectionOpener>
      <Card className="card w4-card">
        <div className="w4-two">
          <div>
            <p className="sub">Where the data comes from, when it was frozen, and how many items it holds.</p>
            <p className="sub">
              <b>What a link means.</b>
              {" "}
              One concrete sentence on what joins two nodes, then what a link
              does not mean. Readers may arrive here first: define every term the sections use.
            </p>
            <Notice icon="!" gap headline="Read the scope carefully">
              The one caveat that changes how every number reads.
            </Notice>
          </div>
          <div>
            <Anatomy
              title="How each section reads"
              intro="Every section answers one question on one card."
              rows={[
                { term: "Question", def: "What we asked, and the short answer" },
                { term: "Did", def: "What we did, beside what to notice" },
                { term: "Figure", def: "The chart or table that answers it" },
                { term: "Drawers", def: "Method and its limits, more numbers, and what we read in the data" },
              ]}
            />
            <HowTo
              rows={[
                { swatch: "w4-sw-real", label: "The real data", text: "What the data shows." },
                { swatch: "w4-sw-band", label: "Random baseline", text: "Mean and one standard deviation over shuffles or rewired networks." },
                { swatch: "w4-sw-ref", label: "Reference", text: "What chance alone would give." },
              ]}
            />
          </div>
        </div>
      </Card>
    </PostSection>
  );
}
