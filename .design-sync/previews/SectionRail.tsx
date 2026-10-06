import { PostSection, SectionOpener, SectionRail } from "log-log-legends-kit";

// Week 5's rail: each section with its one question (a lone question draws no
// sub-dot). The rail marks the section whose top has passed 35% of the
// viewport, so the card renders the first two sections it points at.
const RAIL = [
  { target: "opening", label: "Opening" },
  { target: "relations", label: "Turn links into relationships", q: "Do enemies sit in different communities from allies and family?" },
  { target: "copying", label: "Catch Wikipedia copying itself", q: "Which Marvel pages copy text from each other?" },
  { target: "search", label: "A Marvel search engine in 20 lines", q: "Can a Bag-of-Words search find the right Marvel page from a short description?" },
  { target: "autocomplete", label: "Community autocomplete", q: "Can someone who has not seen the pages tell which community a fake page came from?" },
  { target: "heaps", label: "Heaps' law of the Marvel universe", q: "Do minor characters bring new words, or mostly repeat the famous ones?" },
  { target: "fame", label: "Does network fame buy you more words?", q: "Do characters that more pages link to get longer Wikipedia pages?" },
  { target: "weird", label: "Who has the weirdest Wikipedia page?", q: "Which Marvel page uses the most varied words for its length, and is that real or boilerplate?" },
  { target: "closing", label: "Closing" },
].map(({ target, label, q }) => ({ target, label, children: q ? [{ target: `${target}-asked`, label: q }] : undefined }));

export const Week5 = () => (
  <>
    <SectionRail items={RAIL} />
    <PostSection id="opening" owner="">
      <SectionOpener num="0" title="Opening">303 Wikipedia pages about Marvel characters, read once as a network and once as text.</SectionOpener>
    </PostSection>
    <PostSection id="relations" owner="Gyula">
      <SectionOpener num="1" title="Turn links into relationships">
        Links written in fight words reach across the network's communities, and links written in family words stay inside them.
      </SectionOpener>
    </PostSection>
  </>
);
