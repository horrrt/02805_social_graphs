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
      <SectionOpener num="✓" title="Closing">The sentences rebuild most of the link network, and what they get wrong is in plain view.</SectionOpener>
      <ClosingCard
        takeaway={
          <>
            Two characters named in one sentence are linked 56% of the time, against 15% in the same network rewired, and 95% once ten or more sentences name them. One sentence finds 61% of the 1,434 links; a whole page finds 94%, at the price of pairs that are mostly not links. The strongest ties without a link are mostly comic and film titles and wrong names, and the missing links are mostly a page that calls its character he or she, or uses a name our list does not know.
          </>
        }
        limit={
          <Notice icon="!" gap headline="One important limit">
            Our names find 70% of the character mentions in 80 sentences we read, and are right for 83% of what they find. Every count on this page carries that instrument&apos;s misses: first names, surnames, and he and she.
          </Notice>
        }
        next={
          <>
            <b>Next step.</b>
            {" "}
            Resolving he and she to the character a page is about would tie the subject of each page to the people its sentences name, and show how many of the missing links that recovers. Next week joins networks and language on the same 303 pages.
          </>
        }
      >
        <QaDisclosure id="methods" cue="Methods and data">
          <p className="sub">
            Data: the course&apos;s snapshot of the 303 pages, their node table and their links, frozen on 26 August 2026 and checked against a SHA-256 hash on every load, and Wikidata&apos;s English label and aliases for each page&apos;s item, fetched on 20 October 2026 and committed (
            <a href={`${CODE}week07_wikidata_names.parquet`}>week07_wikidata_names.parquet</a>
            ). Every random step has a fixed seed.
          </p>
          <p className="sub">
            Before building on it we reran the brief&apos;s own example: spaCy on the Spider-Man page gives its 445 sentences, 635 PERSON spans, 179 different, and a network of 146 names and 293 ties, with the same four strongest pairs (
            <a href={`${CODE}course_reference.py`}>course_reference.py</a>
            ).
          </p>
          <ul className="w5-methods">
            <li>
              <b>
                1–4 ·
                {" "}
                <a href={`${CODE}week07_comention.py`}>week07_comention.py</a>
              </b>
              {" "}
              spaCy sentences; names from page titles and Wikidata, with the decisions we made by hand (
              <a href={`${CODE}week07_alias_decisions.parquet`}>week07_alias_decisions.parquet</a>
              ) and the full table (
              <a href={`${CODE}week07_aliases.parquet`}>week07_aliases.parquet</a>
              ); ties by sentence, paragraph and page; 1,000 degree-preserving rewirings; 80 sentences, 25 pairs and 20 links read against the text (
              <a href={`${CODE}week07_sentences_read.parquet`}>week07_sentences_read.parquet</a>
              ,
              {" "}
              <a href={`${CODE}week07_pairs_read.parquet`}>week07_pairs_read.parquet</a>
              ,
              {" "}
              <a href={`${CODE}week07_links_read.parquet`}>week07_links_read.parquet</a>
              ).
            </li>
          </ul>
        </QaDisclosure>
        <QaDisclosure id="closing-ai" cue="AI use and how we checked it">
          <p className="sub">
            An AI coding assistant (Claude) wrote the analysis script, this page and its tests, chose the alias decisions, and read the 80 sentences, 25 pairs and 20 links for Gyula; each reading is committed with the text it judged, so the group can check it line by line. The group has not yet reviewed this page.
          </p>
          <p className="sub">
            How we checked it: the script writes every number the page quotes to a JSON file, a schema check tests the file, the site tests fail when the page and the file disagree, and the script reruns identically under two hash seeds. It stops when a sampled sentence, pair or link has no reading, or when the text a reading judged has changed.
          </p>
        </QaDisclosure>
      </ClosingCard>
    </PostSection>
  );
}
