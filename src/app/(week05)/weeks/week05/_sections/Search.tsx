import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Panel } from "@/components/week05/Panel";
import { Search as Part } from "@/features/week05/search/Search";
import { LIVE, SEARCH, TERMS } from "@/scripts/week05-search.js";

// Section 3: a Bag-of-Words search over the 303 pages. The search islands (src/features/week05/search/)
// fill the stats row, the query chips, the search box and its live ranking, the query table, its detail
// panel and the passage; the terms in "what we did" wait for search.json and search_live.json, as on main.
export function Search() {
  return (
    <PostSection id="search" owner="Àngela">
      <SectionOpener num="3" title="A Marvel search engine in 20 lines">
        Counting shared words beats chance, but it loves short pages: a 255-word page beats Storm's 9,831 words for "weather-controlling mutant from Kenya".
      </SectionOpener>
      <QuestionCard
        section="search"
        num="3A"
        question="Can a Bag-of-Words search find the right Marvel page from a short description?"
        answer="Rarely first: the right page comes first for 1 of 11 queries and in the top five for 6. Short pages win most misses."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#search-did p"]} terms={TERMS} after={[SEARCH, LIVE]}>
            We turned every page and every query into a Bag of Words: a count of each word, with the order thrown away. We wrote 12 queries, 11 with a target page, ranked all 303 pages by cosine similarity to each, and looked where the target came: once with every word, once with stopwords removed, spaCy's list of 306 words.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            Even one first place beats chance (p = 0.036 against the 1 in 303 of a random ranking). Removing stopwords lifts the hits to 2 first and 10 in the top five, so stopwords cost real hits. Page length costs most of the rest: without stopwords, 7 of the 9 misses still lose to a page at most a third as long as the target, because cosine divides by the length of the count vector.
          </Notice>
        }
        figure={
          <>
            <Part part="stats" />
            <div className="w5-two">
              <Panel title="Try the search (stopwords removed)">
                <Part part="box" />
                <p className="w5-caption">The eight pages with the highest cosine for the query; (target) marks the page we meant.</p>
              </Panel>
              <Panel title="The 12 queries">
                <div className="w5-table-wrap">
                  <table className="w5-table">
                    <thead>
                      <tr>
                        <th>Query</th>
                        <th>Target</th>
                        <th>Raw rank</th>
                        <th>No stopwords</th>
                        <th>Raw top hit</th>
                      </tr>
                    </thead>
                    <Part part="rows" />
                  </table>
                </div>
                <Part part="detail" />
                <p className="w5-caption">Click a query to see the words it shares with the winning page and with its target.</p>
              </Panel>
            </div>
          </>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              A word is a run of letters and digits in any alphabet, lowercased, and a hyphen splits words, so Spider-Man counts as spider and man. The 303 pages and their 28,062 different words form a document-term matrix that is 97.2% empty. The most common word, the, makes up 6.1% of all 740,340 words: a handful of words dominate every page, as Zipf's law says.
            </p>
            <p>
              The brief's own example, "Norse god of thunder", has no target: the snapshot holds no page for Thor, so it stays out of the hit rates.
            </p>
            <p>
              Pages with equal cosine rank in node order, in the script and in the search box. A random ranking puts the target first with probability 1 in 303 and in the top five with 5 in 303; a binomial test gives each hit count its p-value.
            </p>
            <p>
              With raw counts, 8 of the 10 misses are won by a page shorter than the median page of 1,258 words.
            </p>
            <p>
              A miss is labelled from the data, for each model: a short-page win when the winning page has at most a third of the target's words, a missing word when the target shares no content word with the query, and otherwise a win by a page that is not short. The search box runs the stopword-free model on the same vocabulary as the table.
            </p>
            <p id="search-limit">
              We chose the 12 queries and their targets ourselves, so the hit rate says how the search does on our questions, and the single first-place hit, Moon Knight, carries the raw headline.
            </p>
          </Drawer>
          <Drawer label="What we read in the pages" bodyId="search-checked">
            <p>
              Redneck's page wins "weather-controlling mutant from Kenya" while sharing one word with the query besides stopwords, mutant, in its first sentence:
            </p>
            <Part part="passage" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
