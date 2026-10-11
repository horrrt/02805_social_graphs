import { SectionOpener } from "log-log-legends-kit";

// Week 5's opening: section 0 and its one line.
export const Opening = () => (
  <SectionOpener num="0" title="Opening">
    303 Wikipedia pages about Marvel characters, read once as a network and once as text.
  </SectionOpener>
);

// Section 1, with the finding the section argues.
export const Relations = () => (
  <SectionOpener num="1" title="Turn links into relationships">
    Links written in fight words reach across the network's communities, and links written in family words stay inside them.
  </SectionOpener>
);

// Section 7: a long title.
export const Weird = () => (
  <SectionOpener num="7" title="Who has the weirdest Wikipedia page?">
    10 of the 30 most repetitive pages are about several characters who share one name, where 4.6 would be expected.
  </SectionOpener>
);
