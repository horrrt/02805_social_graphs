import { FindingsStrip } from "@/components/post/FindingsStrip";
import { FindingRow } from "@/features/week05/frame/FindingRow";
import { Part } from "@/features/week06/Parts";

// Findings: one row per section, each with its number against its baseline.
export function Findings() {
  return (
    <FindingsStrip id="findings" label="Three findings" caps="Three sections, three findings" real="the real pages">
      <FindingRow num="1" title="Pick a character" mini={<Part part="1" />} href="#explore" link="Section 1 →">
        With names, a page's closest page links to it for 223 of the 303 pages. Without names, for 125.
      </FindingRow>
      <FindingRow num="2" title="Names carry the links" mini={<Part part="2" />} href="#names" link="Section 2 →">
        Without names, 1.91 of a page's ten nearest pages link to it, against 4.01 with them and 4.00 ± 0.01 when as many other words go. Of the 25 closest unlinked pairs, 19 share a story or a title and 6 share only a name.
      </FindingRow>
      <FindingRow num="3" title="Without names, pages pair by gender" mini={<Part part="3" />} href="#gender" link="Section 3 →">
        96% of a woman's nearest pages are about women, against 26% ± 7% when the labels are shuffled. Her and she carry the match.
      </FindingRow>
    </FindingsStrip>
  );
}
