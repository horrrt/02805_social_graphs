import { FindingRow } from "log-log-legends-kit";

// One row of Week 5's findings strip. The kit's FindingRow writes an empty
// div.w4-mini[data-finding] for the page's script to draw into; nothing draws here.
export const Relations = () => (
  <FindingRow num="1" title="Turn links into relationships" finding="1" href="#relations" link="Section 1 →">
    54% of links written in fight words join two communities, against 42% when the labels are shuffled; family links cross only 23% of the time. Read by hand, the word list labels only 32 of 60 links right.
  </FindingRow>
);

// A short answer.
export const Copying = () => (
  <FindingRow num="2" title="Catch Wikipedia copying itself" finding="2" href="#copying" link="Section 2 →">
    20 of the 22 pairs of pages that share a copied passage already link to each other, against 3.1% of all pairs.
  </FindingRow>
);
