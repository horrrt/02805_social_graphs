import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermProse } from "@/components/post/TermProse";
import { Part } from "@/features/week07/Parts";
import { DATA } from "@/scripts/week07-comention.js";
import { TERMS } from "./terms";

// Section 3: sentence, paragraph and page as the unit, and spaCy's tagger as the instrument.
export function Unit() {
  return (
    <PostSection id="unit" owner="Gyula">
      <SectionOpener num="3" title="Sentence, paragraph or page">
        A wider unit finds more of the links and adds many more pairs that are not links. spaCy&apos;s tagger is more often right, and finds fewer.
      </SectionOpener>
      <QuestionCard
        section="unit"
        num="3A"
        question="Does the unit of text, or spaCy's tagger, change the network?"
        answer="Yes. One page finds 94% of the links, but only 19% of its pairs are links; one sentence finds 61%, with 56% linked. spaCy's tagger finds 40%."
        layout="below"
        did={
          <TermProse as="p" className="sub" roots={["#unit-did p"]} terms={TERMS} after={[DATA]}>
            We built the network three times, tying two characters when one sentence names both, when one paragraph does and when one page does, and a fourth time from the names spaCy&apos;s entity tagger marks in each sentence, passed through the same list of names. Then we read 80 sentences drawn at random and wrote down every character each one names.
          </TermProse>
        }
        surprise={
          <Notice icon="💡" headline="What to notice">
            The tagger misses one-word codenames such as Cyclops, Golem and Speed; the brief warns that superhero names are rare in the news text it learned from. It found 29 of the 57 mentions in the 80 sentences. Our names list found 40, and misses first names and surnames such as Brian and Cage.
          </Notice>
        }
        figure={
          <div className="w5-two">
            <Plot title="Share of the text pairs that are linked" note="Dot: the real pairs. Band: the same network rewired 1,000 times, mean and one standard deviation. Hollow dot: spaCy's tagger, one sentence.">
              <Part part="precision" />
            </Plot>
            <Plot title="Share of the 1,434 linked pairs the text finds" note="A link is found when some unit names both characters. Hollow dot: spaCy's tagger, one sentence.">
              <Part part="recall" />
            </Plot>
          </div>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              A character&apos;s names are its page title without a qualifier such as (character), a person&apos;s name in the qualifier such as Danny Ketch, its Wikidata label, and its Wikidata aliases of two words or more. One-word aliases are too often ordinary words (Her, Frank) unless we kept them by hand, as we did 7, such as Psylocke. We rejected 8 aliases that mostly name someone else, such as Steve Rogers for William Burnside, and blocked 26 phrases, such as Infinity Gauntlet and The Amazing Spider-Man, so the names inside them do not count. A name several pages share goes to the page titled with it, then to the page whose Wikidata label it is, and otherwise to none. We set these rules from the most frequent matches before comparing any network with the links.
            </p>
            <p>
              The tagger is en_core_web_sm, the model the course brief runs. We keep its spans labelled as a person, organisation, place, work or similar, drop a trailing &apos;s and a leading The, and look the span up in the same names. Our parse reproduces the brief&apos;s Spider-Man figures: 445 sentences, 635 PERSON spans, 179 different, and a network of 146 names and 293 ties.
            </p>
            <p id="unit-limit">
              Neither instrument reads he or she. A sentence that calls a page&apos;s own character he cannot tie it to anyone; section 4 reads links lost that way.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              spaCy marks 8,014 different strings as a person across the pages, against the 300 characters our names find. Counting its strings as characters, as an AI-drafted report in the brief does, counts Peter, Peter Parker and Spider-Man three times.
            </p>
          </Drawer>
          <Drawer label="Table">
            <Part part="unitTable" />
          </Drawer>
          <Drawer label="What we read" bodyId="unit-checked">
            <p>
              We read 80 sentences drawn at random from all 33,243 and listed every character each names by any name, not by he or she, and not inside a comic, film or game title. The 80 sentences name 57 characters in all. Of what each instrument found, our names were right 83% of the time and the tagger 91%; our names found 70% of the 57 and the tagger 51%. Our names&apos; wrong matches are mostly titles and shared names: Hulk in the show Hulk and the Agents of S.M.A.S.H., and Storm for Johnny Storm.
            </p>
            <Part part="instrument" />
            <Part part="sentences" />
          </Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}
