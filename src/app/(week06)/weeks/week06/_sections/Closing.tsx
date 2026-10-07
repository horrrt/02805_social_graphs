import { ClosingCard } from "@/components/post/ClosingCard";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { QaDisclosure } from "@/components/post/QaDisclosure";
import { SectionOpener } from "@/components/post/SectionOpener";

const CODE = "https://github.com/horrrt/02805_social_graphs/blob/main/analysis/";

// Closing: the takeaway, the one limit, the next step, then the methods and the AI-use note.
export function Closing() {
  return (
    <PostSection id="closing" owner="Gyula">
      <SectionOpener num="✓" title="Closing">Two Marvel pages read alike mostly because they share names, and names are where Wikipedia puts its links.</SectionOpener>
      <ClosingCard
        takeaway={
          <>
            TF-IDF finds the link network because it finds names: names alone get 3.96 linked pages among the ten nearest,
            and without them the count falls from 4.01 to 1.91. Of the 25 most similar pairs that do not link, 20 still
            share a story or a title and 5 share only a name word. Take the names out and most lists shift toward pages
            about women, which take 48% of the slots: women's pages are longer, and at equal length still sit in more lists.
            Separately, TF-IDF weighs she and her far above he and his, which sit on nearly every page, so women's pages land
            closest to each other.
          </>
        }
        limit={
          <Notice icon="!" gap headline="One important limit">
            We asked one representation, TF-IDF on single words. Word vectors from the second half of the brief might
            find shared stories without names; we did not try them, so the lean toward women's pages holds for TF-IDF
            only.
          </Notice>
        }
        next={
          <>
            <b>Next step.</b>
            {" "}
            Next week's contextual embeddings give storm a different vector in "Johnny Storm" and in "Storm summons
            lightning". Rerunning the explorer with them tests whether a page can find its story without leaning on a
            name or a pronoun.
          </>
        }
      >
        <QaDisclosure id="methods" cue="Methods, data and AI use">
          <p className="sub">
            Data: the course's snapshot of the 303 pages, their node table and their links, frozen on 26 August 2026
            and checked against a SHA-256 hash on every load, and Wikidata's sex or gender for each page's item, fetched
            on 6 October 2026 and committed (
            <a href={`${CODE}week06_gender.csv`}>week06_gender.csv</a>
            ). Every random step has a fixed seed.
          </p>
          <p className="sub">
            Before changing anything we rebuilt the course's lookalikes: its token rule gives the same 27,033 words, and
            raw counts, stopwords removed, TF-IDF and the random line come out at 1.86, 2.84, 4.01 and 0.31 (
            <a href={`${CODE}course_reference.py`}>course_reference.py</a>
            ), with the same ten nearest pages for all 303 pages, checked against the course's file.
          </p>
          <ul className="w5-methods">
            <li>
              <b>
                1–3 ·
                {" "}
                <a href={`${CODE}week06_lookalikes.py`}>week06_lookalikes.py</a>
              </b>
              {" "}
              TF-IDF and cosine on the 303 pages; names removed, or kept alone, by the brief's capital-letter rule; 20
              removals of other words matched on rarity; 1,000 shuffles of Wikidata's gender labels; undirected network distances; 50 pairs read by
              hand (
              <a href={`${CODE}week06_pairs_read.csv`}>week06_pairs_read.csv</a>
              ).
            </li>
          </ul>
        </QaDisclosure>
        <QaDisclosure id="closing-ai" cue="AI use and how we checked it">
          <p className="sub">
            An AI coding assistant (Claude) wrote the analysis and the page code, drafted the text, read the 50 pairs
            against their pages, re-read them after a review and tested the page in a browser. The numbers come from the course data, Wikidata and
            the script above.
          </p>
          <p className="sub">
            The script writes every number the page quotes to one JSON file the page reads. A schema check tests the
            file against the fields the page uses, and the site tests fail when a number in the text drifts from it.
            Each hand verdict is stored with the six words behind its pair, and the script stops if those words change.
            We reran the script under two hash seeds and got identical files.
          </p>
        </QaDisclosure>
      </ClosingCard>
    </PostSection>
  );
}
