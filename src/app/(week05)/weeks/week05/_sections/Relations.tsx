import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Relations as Part } from "@/features/week05/relations/Relations";
import { RELATIONS, TERMS } from "@/scripts/week05-relations.js";

// Section 1: links labelled by the sentence that names them, against shuffled labels. The relations
// islands (src/features/week05/relations/) draw the crossing strip, the map with its switch, the label
// chips and the checked sentences; the term in "what we did" waits for relations.json, as on main.
export function Relations() {
  return (
    <PostSection id="relations" owner="Gyula">
      <SectionOpener num="1" title="Turn links into relationships">
        Links written in fight words reach across the network's communities, and links written in family words stay inside them.
      </SectionOpener>
      <QuestionCard
        section="relations"
        num="1A"
        question="Do enemies sit in different communities from allies and family?"
        answer="Mostly yes, as a tendency: about half of the word list's labels are right."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#relations-did p"]} terms={TERMS} after={[RELATIONS]}>
            We labelled each link from page A to page B by the sentence on A's page that names B, using a small word list that gives each sentence one of five labels: killed, family, enemy, ally, teammate. Then we counted how often each label's links join two communities, against the labels shuffled.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            54% of enemy links join two communities, against 42% when the labels are shuffled (z = 4.3). Family links cross only 23% of the time (z = −4.6). Allies cross 31%, still within chance; teammate and killed links look like shuffled ones.
          </Notice>
        }
        figure={
          <div className="w5-two">
            <Plot
              title="Links that join two communities, by label"
              note="Dot: the share of that label's links that join two communities, over 100 Louvain runs. Band: the same share with the labels shuffled, mean ± one standard deviation."
            >
              <Part part="crossing" />
            </Plot>
            <Plot
              title="Where the fight and family links run"
              note="Each dot is a page, coloured by its community in section 4's consensus; grey pages have none. Dark lines join the pairs whose linking sentence uses the chosen kind of word."
            >
              <Part part="map" />
            </Plot>
          </div>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              A link from A to B means A's Wikipedia page links to B's. For each of the 1,784 links we took the first sentence on A's page that names B, and found one for 1,513 (85%). Most of the rest come from infoboxes and navigation boxes, which our copy of the text has lost; 33 point at one of 7 alternate versions, such as the film Jean Grey, whose name belongs to the main character.
            </p>
            <p>
              A small word list labels each sentence: killed, family, enemy, ally or teammate. It matches lower-case words only, so a name such as Doctor Nemesis supplies no label. 836 of the sentences (55%) match no word at all.
            </p>
            <p>
              The communities come from 100 Louvain runs on the link network. For each label we counted how often its links join two different communities, averaged over the runs, and compared it with 1,000 shuffles of the labels over the 677 labelled links.
            </p>
            <p>
              Each page splits into paragraphs at its line breaks and into sentences with spaCy's rule-based sentencizer. Sentences under References, External links, Notes, See also and Further reading are dropped. A character is found by its page title without the disambiguation ("Storm (Marvel Comics)" is "Storm") and by the real name its description gives in brackets ("Emil Blonsky" for the Abomination), as a whole word. A name several pages go by belongs to the main page: "Spider-Man" is the main Spider-Man, not the Mangaverse one.
            </p>
            <p>
              A sentence that matches several labels takes the first of killed, family, enemy, ally, teammate. Negation is not handled. Louvain runs on the weighted, undirected link network with seeds 2805 to 2904. The runs disagree with each other, so the test uses how often each link crosses over all 100 runs, for the real labels and the shuffled ones alike.
            </p>
            <p id="relations-limit">
              The word list reads the sentence, not the pair: a long sentence that names B often tells of a third character. "Phyla then goes with Nova and Star-Lord to lead a final battle against Annihilus" makes Star-Lord her enemy.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              A stricter shuffle only swaps labels between links that leave the same page, so a page written in hostile words throughout cannot carry the result. Enemies still cross more than it predicts (46%, z = 3.6) and family less (33%, z = −3.7). A pair of characters who link both ways counts twice above; counting each pair once gives z = 3.6 for enemies and −4.0 for family.
            </p>
            <p>
              The labelled links: 217 teammate, 202 enemy, 116 family, 84 killed and 58 ally. 113 sentences match more than one label.
            </p>
          </Drawer>
          <Drawer label="What we read in the pages" bodyId="relations-checked">
            <p>
              We read 60 sentences, 12 per label, drawn at random: 32 of the labels describe how A and B relate. Ally labels hold up best (9 of 12), enemy and killed worst (5 of 12 each), family in between (6 of 12).
            </p>
            <p>
              ✓ means the label describes how A and B relate; ✗ says what the sentence is about instead.
            </p>
            <Part part="lines" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
