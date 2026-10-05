import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Autocomplete as Part } from "@/features/week05/autocomplete/Autocomplete";
import { AUTOCOMPLETE, TERMS } from "@/scripts/week05-autocomplete.js";

// Section 4: one trigram model per consensus community and a quiz on its fake pages. The autocomplete
// islands (src/features/week05/autocomplete/) fill the quiz, the community map, the modularity strip and
// the copied run; the term in "what we did" waits for autocomplete.json, as on main.
export function Autocomplete() {
  return (
    <PostSection id="autocomplete" owner="Àngela">
      <SectionOpener num="4" title="Community autocomplete">
        Trained on one community's pages, a trigram generator copies: every fake page repeats a run of 8 to 17 words straight from its community's text.
      </SectionOpener>
      <QuestionCard
        section="autocomplete"
        num="4A"
        question="Can someone who has not seen the pages tell which community a fake page came from?"
        answer="We do not know yet: no other group has guessed. What the fakes already show is copying."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#autocomplete-did p"]} terms={TERMS} after={[AUTOCOMPLETE]}>
            Each group of at least 8 pages gets its own trigram model: the probability of the next word given the two before it, P(w3 | w1, w2), counted from the group's pages. We will post the 9 fake pages, one per group with names masked, in the week 5 Teams channel and report the correct guesses out of all guesses, against the 1 in 9 (11%) a random guess gets right.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            In each group's pages, 81% to 86% of two-word contexts have only one next word, against 50% to 63% of one-word contexts. More context means sparser counts, so the model often has no choice: 42% of the words the model drew for the quiz fakes had a single candidate.
          </Notice>
        }
        figure={
          <div className="w5-two">
            <Plot
              title="Guess the community"
              note="A locked guess stays locked. Your score stays in this browser and is not part of our results."
            >
              <Part part="quiz" />
            </Plot>
            <Plot
              title="The eight groups the generators learn from"
              note="Each dot is a page, coloured by its consensus group. Grey pages are outside the giant component: the 9 Strikeforce: Morituri pages and the 17 with no links. A link takes its group's colour when both pages are in it."
            >
              <Part part="map" />
            </Plot>
          </div>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              First the communities. Louvain ran 100 times on the giant component of the link network, the 277 of 303 pages joined to each other by links. The runs disagree: they found 89 different partitions, the most common one in only 4 runs, and 77 runs found 8 groups. Two runs agree with a median normalised mutual information of 0.90. So we kept a consensus: two pages share a group when at least half the runs put them together, which gives 8 groups, the same for all 100 seeds we tried on it. The 9 Strikeforce: Morituri pages link only to each other and form a ninth group; the 17 pages with no links have none.
            </p>
            <p>
              A trigram model is next-token prediction, what a large language model does, with a two-word window and a table of counts in place of a neural network. Each fake page opens with one sentence we wrote by hand ("Aetherion is a character appearing in American comic books published by Marvel Comics.") and continues with 5 sentences the model samples word by word.
            </p>
            <p>
              Before training we replace every character's name, the page title and the real name its description gives, by [name], so a guess cannot rest on spotting a member. The quiz shows these masked fakes.
            </p>
            <p>
              Tokeniser: each page splits into paragraphs at its line breaks and into sentences with spaCy's rule-based sentencizer, which knows that "Dr." does not end a sentence. Heading lines are dropped, and so is every sentence under References, External links, Notes, See also and Further reading. A word is a run of letters in any alphabet, with an apostrophe or hyphen inside it kept, lowercased and with a possessive 's removed; digits and punctuation are dropped.
            </p>
            <p>
              Each sentence is padded with two start markers and one end marker before counting. The model has no smoothing and no backoff: sampling starts from the start markers and only ever reaches two-word contexts that occur in the pages. A sentence that reaches 40 words without ending is thrown away and drawn again, never cut; that happened to 5 sentences. Names are matched as whole words with their capitals, so "Storm" becomes [name] and "storm" stays.
            </p>
            <p id="autocomplete-limit">
              The mask covers only the 303 characters' own names. Other characters, surnames on their own and team names stay, and all 9 masked fakes keep some, such as mephisto, khonshu and krakoa, so a guess can still rest on a name.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              The groups, named after their page with the most link weight: Hulk, 40 pages; Wolverine, 40; Spider-Man, 38; Scarlet Witch, 38; Quasar, 35; Doctor Strange, 34; Iron Fist, 30; Black Widow (Natasha Romanova), 22; Radian (Morituri), 9.
            </p>
            <p>
              The groups shift from run to run, as the median normalised mutual information of 0.90 shows; the consensus keeps the pairs most runs agree on.
            </p>
            <p>Without the mask, 7 of the 9 fakes name a member of their own group.</p>
            <p>
              The links hold these groups together far more tightly than chance. Louvain's modularity averages 0.503 over the 100 runs, against 0.347 ± 0.004 on 100 rewired copies of the network (z = 36.6). The consensus groups score 0.506. The rewiring swaps the ends of two links of equal weight, 50 swaps per link, so every page keeps its number of partners and its total link weight.
            </p>
            <Plot
              title="Modularity of the groups against rewired networks"
              note="Dot: Louvain's modularity on the real network, the mean of 100 runs. Band: the same on 100 rewired networks that keep every page's partners and link weight, mean and one standard deviation either side. Higher means more link weight inside groups than chance."
            >
              <Part part="modularity" />
            </Plot>
          </Drawer>
          <Drawer label="What we read in the pages" bodyId="autocomplete-checked">
            <p>
              For every fake we searched its group's sentences for the longest run of words it repeats verbatim. The runs are 8 to 17 words long, and 8 of the 9 come from a single page. Opening the example gives away one quiz answer.
            </p>
            <Drawer label="Show one fake's copied run beside its source sentence">
              <Part part="run" />
            </Drawer>
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
