import { ClosingCard } from "@/components/post/ClosingCard";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { QaDisclosure } from "@/components/post/QaDisclosure";
import { SectionOpener } from "@/components/post/SectionOpener";

// Closing: the takeaway, the one limit, then the methods and the AI-use note.
export function Closing() {
  return (
    <PostSection id="closing" owner="">
      <SectionOpener num="✓" title="Closing">Counting words finds the network in the text, and shows where counting stops.</SectionOpener>
      <ClosingCard
        takeaway={
          <>
            Where the words meet the links, the links show through. Page length follows in-degree at
            Pearson 0.77, 20 of the 22 copied pairs already link to each other, and 54% of enemy links
            cross communities against 42% for shuffled labels, though the word list labels only 32 of
            the 60 links we read right. Raw counts rank and read less well:
            they put the right page first for 1 of 11 queries, because cosine favours a short page over a
            long one with the same words, and a trigram model trained on one community copies its pages word for word.
          </>
        }
        limit={
          <Notice icon="!" gap headline="One important limit">
            Wikipedia editors write both the words and the links. A long,
            well-linked page may measure how much editors care about a character more than the character's
            place in the comics, and nothing on this page separates the two.
          </Notice>
        }
      >
        <QaDisclosure id="methods" cue="Methods, data and AI use">
          <p className="sub">
            Data: the course's snapshot of the 303 pages, their node table and their links, frozen on
            26 August 2026 and checked against a SHA-256 hash on every load
            (
            <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_text.py">week05_text.py</a>
            ). Every random step has a fixed seed.
          </p>
          <p className="sub">
            Word counts depend on the tokenizer. The course brief quotes about 727,000 tokens and 27,000
            types for these pages, 36% of them used once, without naming its tokenizer. Our word rule counts
            713,617 words and 27,754 types, 38% used once: it keeps 14,341 words such as Spider-Man whole and
            drops numbers and the possessive 's. spaCy's tokenizer with punctuation dropped gives 744,495 tokens, 26,987 types and
            36% used once (
            <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/course_reference.py">course_reference.py</a>
            ).
          </p>
          <ul className="w5-methods">
            <li>
              <b>
                1 ·
                {" "}
                <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_relations.py">week05_relations.py</a>
              </b>
              {" "}
              Concordance of the sentence behind each link, a word list of five labels, Louvain run 100 times; 1,000 label shuffles, and 1,000 more within each page.
            </li>
            <li>
              <b>
                2 ·
                {" "}
                <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_copying.py">week05_copying.py</a>
              </b>
              {" "}
              Shared 8-word n-grams, n-grams on more than 10 pages set aside as template; the link rate of all pairs as the baseline.
            </li>
            <li>
              <b>
                3 ·
                {" "}
                <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_search.py">week05_search.py</a>
              </b>
              {" "}
              Bag of Words and cosine similarity on the document-term matrix, with and without spaCy's stopwords; a random ranking as the baseline.
            </li>
            <li>
              <b>
                4 ·
                {" "}
                <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_communities.py">week05_communities.py</a>
                ,
                {" "}
                <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_autocomplete.py">week05_autocomplete.py</a>
              </b>
              {" "}
              A consensus of 100 Louvain runs against 100 rewired networks that keep each page's partners and link weight; one trigram model per community.
            </li>
            <li>
              <b>
                5 ·
                {" "}
                <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_heaps.py">week05_heaps.py</a>
              </b>
              {" "}
              Vocabulary growth in link order against 500 random orders and 500 orders that keep page length, and Heaps' law V = K·n
              <sup>β</sup>
              {" "}
              fitted to their mean.
            </li>
            <li>
              <b>
                6 ·
                {" "}
                <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_fame.py">week05_fame.py</a>
              </b>
              {" "}
              Log length against log in-degree, against 1,000 shuffles of in-degree.
            </li>
            <li>
              <b>
                7 ·
                {" "}
                <a href="https://github.com/horrrt/02805_social_graphs/blob/main/analysis/week05_weird.py">week05_weird.py</a>
              </b>
              {" "}
              Moving-average type-token ratio over a 100-word window, scored against the 30 pages nearest in length; 2,000 random stretches of the corpus draw the figure's band.
            </li>
          </ul>
        </QaDisclosure>
        <QaDisclosure id="closing-ai" cue="AI use and how we checked it">
          <p className="sub">
            AI coding assistants helped write the analysis and page code, drafted and revised text, and
            tested the page in a browser. The numbers come from the course data and the scripts above.
          </p>
          <p className="sub">
            Each script writes the numbers its section quotes to a JSON file the page reads. A schema
            check tests each file against the fields the page uses, and the site tests fail when a
            number or a word such as "barely" in the text drifts from that file. We reran the scripts
            under two hash seeds and got identical files, and we read the passages behind the counts:
            12 sentences per relation label, the copied runs, the search misses, the ten outliers of
            section 6 and the top pages of section 7.
          </p>
        </QaDisclosure>
      </ClosingCard>
    </PostSection>
  );
}
