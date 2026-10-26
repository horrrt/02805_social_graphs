import { FindingRow } from "@/components/post/FindingRow";
import { FindingsStrip } from "@/components/post/FindingsStrip";
import { Part } from "@/features/week07/Parts";

// Findings: one row per section, each with its number against its baseline.
export function Findings() {
  return (
    <FindingsStrip id="findings" label="Four findings" caps="Four sections, four findings" real="the real pages" band="rewired network, mean ± 1 sd; a dashed tick is a named reference">
      <FindingRow num="1" title="Pick a character" mini={<Part part="1" />} href="#explore" link="Section 1 →">
        1,568 pairs of characters are named in one sentence somewhere. 56% of them are linked, against 15% when the same network is rewired.
      </FindingRow>
      <FindingRow num="2" title="Named together, mostly linked" mini={<Part part="2" />} href="#together" link="Section 2 →">
        A pair named in one sentence is linked 43% of the time; a pair named in 10 or more, 95%, against 38% rewired.
      </FindingRow>
      <FindingRow num="3" title="Sentence, paragraph or page" mini={<Part part="3" />} href="#unit" link="Section 3 →">
        One sentence finds 61% of the links, one paragraph 76%, one page 94%; but only 19% of the pairs one page names are linked. spaCy&apos;s tagger finds 40%.
      </FindingRow>
      <FindingRow num="4" title="What only one network has" mini={<Part part="4" />} href="#only" link="Section 4 →">
        Of the 25 strongest ties without a link, 6 share a story, 8 name a title and 7 are wrong names. 78% of the links no sentence finds are named on one page, just not beside the page&apos;s own name.
      </FindingRow>
    </FindingsStrip>
  );
}
