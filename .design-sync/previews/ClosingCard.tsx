import { ClosingCard, Notice, QaDisclosure } from "log-log-legends-kit";

// Week 5's closing card: takeaway, the one limit, the next step, then the
// methods and AI-use disclosures. Text from the Week 5 page, trimmed.
export const Closing = () => (
  <ClosingCard
    takeaway={
      <>
        Where the words meet the links, the links show through. Page length follows in-degree at Pearson 0.77, 20 of the 22 copied pairs already link to each other, and 54% of enemy links cross communities against 42% for shuffled labels, though the word list labels only 32 of the 60 links we read right.
      </>
    }
    limit={
      <Notice icon="!" gap headline="One important limit">
        Wikipedia editors write both the words and the links. A long, well-linked page may measure how much editors care about a character more than the character's place in the comics, and nothing on this page separates the two.
      </Notice>
    }
    next={
      <>
        <b>Next step.</b> Next week's TF-IDF weighs a word by how few pages use it. Rerunning the section 3 queries with it tests whether the short-page misses are a counting problem.
      </>
    }
  >
    <QaDisclosure id="methods" cue="Methods, data and AI use">
      <p className="sub">Data: the course's snapshot of the 303 pages, their node table and their links, frozen on 26 August 2026. Every random step has a fixed seed.</p>
    </QaDisclosure>
    <QaDisclosure id="closing-ai" cue="AI use and how we checked it">
      <p className="sub">AI coding assistants helped write the analysis and page code, drafted and revised text, and tested the page in a browser.</p>
    </QaDisclosure>
  </ClosingCard>
);

export const WithoutDisclosures = () => (
  <ClosingCard
    takeaway="Where the words meet the links, the links show through: page length follows in-degree at Pearson 0.77."
    limit={
      <Notice icon="!" gap headline="One important limit">
        Wikipedia editors write both the words and the links, and nothing on this page separates the two.
      </Notice>
    }
    next={
      <>
        <b>Next step.</b> Next week's TF-IDF weighs a word by how few pages use it.
      </>
    }
  />
);
