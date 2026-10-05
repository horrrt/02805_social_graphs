import { FindingRow } from "@/components/post/FindingRow";
import { FindingsStrip } from "@/components/post/FindingsStrip";

// Findings: one row per section; week05-frame.js draws each [data-finding] mini chart.
export function Findings() {
  return (
    <FindingsStrip id="findings" label="Seven findings" caps="Seven sections, seven findings" real="the real pages">
      <FindingRow num="1" title="Turn links into relationships" finding="1" href="#relations" link="Section 1 →">
        54% of links written in fight words join two communities, against 42% when the labels are shuffled; family links cross only 23% of the time.
      </FindingRow>
      <FindingRow num="2" title="Catch Wikipedia copying itself" finding="2" href="#copying" link="Section 2 →">
        20 of the 22 pairs of pages that share a copied passage already link to each other, against 3.1% of all pairs.
      </FindingRow>
      <FindingRow num="3" title="A Marvel search engine in 20 lines" finding="3" href="#search" link="Section 3 →">
        Raw word counts put the right page in the top five for 6 of 11 queries, but first for only 1: short pages win most misses.
      </FindingRow>
      <FindingRow num="4" title="Community autocomplete" finding="4" href="#autocomplete" link="Section 4 →">
        Every fake page repeats a run of 8 to 17 words from its community's pages. No other group has guessed yet.
      </FindingRow>
      <FindingRow num="5" title="Heaps' law of the Marvel universe" finding="5" href="#heaps" link="Section 5 →">
        Read least-linked first, the first 100,000 words hold 11,079 different words, against 10,570 ± 207 in random orders: minor characters bring new words.
      </FindingRow>
      <FindingRow num="6" title="Does network fame buy you more words?" finding="6" href="#fame" link="Section 6 →">
        Yes: page length follows in-degree at Pearson 0.77, and pages for a codename several characters share sit below the trend.
      </FindingRow>
      <FindingRow num="7" title="Who has the weirdest Wikipedia page?" finding="7" href="#weird" link="Section 7 →">
        10 of the 30 most repetitive pages are about several characters who share one name, where 4.6 would be expected.
      </FindingRow>
    </FindingsStrip>
  );
}
