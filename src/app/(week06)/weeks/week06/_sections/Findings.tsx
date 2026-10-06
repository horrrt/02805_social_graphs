import { FindingsStrip } from "@/components/post/FindingsStrip";
import { FindingRow } from "@/features/week05/frame/FindingRow";
import { Part } from "@/features/week06/Parts";

// Findings: one row per section, each with its number against its baseline.
export function Findings() {
  return (
    <FindingsStrip id="findings" label="Three findings" caps="Three sections, three findings" real="the real pages">
      <FindingRow num="1" title="Pick a character" mini={<Part part="1" />} href="#explore" link="Section 1 →">
        With names, a page's closest page is linked with it for 223 of the 303 pages. Without names, for 125.
      </FindingRow>
      <FindingRow num="2" title="Names carry the links" mini={<Part part="2" />} href="#names" link="Section 2 →">
        Without names, 1.91 of a page's ten nearest pages are linked with it, against 4.01 with them and 3.96 with names alone. Of the 25 closest unlinked pairs, 20 share a story or a title and 5 share only a name.
      </FindingRow>
      <FindingRow num="3" title="Without names, pages lean toward women's pages" mini={<Part part="3" />} href="#gender" link="Section 3 →">
        Pages about women fill 48% of the ten-nearest lists and make up 17% of the pages, and still 44% with he and she removed. She and her make a woman's list 96% women.
      </FindingRow>
    </FindingsStrip>
  );
}
