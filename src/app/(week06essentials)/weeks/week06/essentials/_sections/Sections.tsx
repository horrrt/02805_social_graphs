import type { ReactNode } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { QuestionCard } from "@/components/post/QuestionCard";
import { SectionOpener } from "@/components/post/SectionOpener";
import { Essential } from "@/features/week06/Essentials";

// One section per group of essentials: its question, what we did, the baseline
// it is compared to, the explorable and a Method drawer. Every number is in
// analysis/week06_essentials.json; tests/week06-essentials.test.mjs pins them.

type Props = {
  id: "weights" | "cosine" | "contrast" | "topics" | "contexts" | "pmi" | "vectors" | "glove";
  num: string;
  title: string;
  lead: string;
  essentials: string;
  question: string;
  answer: string;
  did: ReactNode;
  compared: ReactNode;
  plot: string;
  note: string;
  method: ReactNode;
};

function Essay({ id, num, title, lead, essentials, question, answer, did, compared, plot, note, method }: Props) {
  return (
    <PostSection id={id} owner="Gyula">
      <SectionOpener num={num} title={title}>{lead}</SectionOpener>
      <QuestionCard
        section={id}
        num={num}
        question={question}
        answer={answer}
        layout="below"
        did={
          <>
            <p className="w6e-uses">{`Uses: ${essentials}`}</p>
            <p className="sub">{did}</p>
          </>
        }
        surprise={<Notice icon="⚖️" headline="Compared to what">{compared}</Notice>}
        figure={
          <Plot title={plot} note={note}>
            <Essential part={id} />
          </Plot>
        }
      >
        <Drawers variant="foot">
          <Drawer label="Method">{method}</Drawer>
        </Drawers>
      </QuestionCard>
    </PostSection>
  );
}

export function Weights() {
  return (
    <Essay
      id="weights"
      num="1"
      title="IDF finds Marvel's own stopwords"
      lead="The most frequent words on a page say least about it; TF-IDF works that out from the 303 pages themselves."
      essentials="term frequency (TF), document frequency (DF), inverse document frequency (IDF), TF-IDF"
      question="Which words make a page?"
      answer={'Not its most frequent ones. On Storm\'s page "the" appears 583 times and weighs nothing; "storm" appears 198 times and tops her TF-IDF list.'}
      did={
        <>
          A word's TF on a page is its count over the page's length; its DF is how many of the 303 pages use it; its IDF is ln(303 / DF). TF-IDF multiplies the two. He is on 291 pages, so its IDF is 0.04; she is on 191, so ln(303 / 191) = 0.46. The Week 6 post shows what that gap does once names are removed.
        </>
      }
      compared={
        <>
          A hand-written stopword list. Only 38 words get an IDF under 0.1, and 23 of them are NLTK stopwords; 151 of NLTK's 198 stopwords keep real weight. IDF also catches words no English list has: character, comics and marvel are on all 303 pages and weigh exactly 0.
        </>
      }
      plot="A page's words by raw count and by TF-IDF"
      note="Twelve words each way for any of the 303 pages. Grey rows have an IDF under 0.1."
      method={<p>Words are runs of letters with one inner apostrophe kept, lowercased: the course's token rule, the same as the Week 6 post. 727,261 words, 27,033 different ones.</p>}
    />
  );
}

export function Cosine() {
  return (
    <Essay
      id="cosine"
      num="2"
      title="Weighting is what makes similarity mean anything"
      lead="Under raw counts every page looks like every other; under TF-IDF most pairs share almost nothing."
      essentials="cosine similarity"
      question="Which pages are close?"
      answer="Under raw counts, nearly all of them: the median pair of pages has a cosine of 0.754. Under TF-IDF the median is 0.0096, and a high cosine starts to mean a shared name or story."
      did={
        <>
          Cosine is the dot product of two vectors over the product of their lengths. Written word by word, it is a sum with one term per word, so we can show which words carry it. Storm and the Human Torch have a raw-count cosine of 0.845, of which the word the gives 0.396. Under TF-IDF it is 0.297, and the word storm gives 0.234: Johnny Storm's surname.
        </>
      }
      compared={
        <>
          All 45,753 pairs of pages. Under raw counts the 99th percentile is 0.876, only 0.122 above the median; under TF-IDF it is 0.109, eleven times the median. Copying a page three times triples its raw-count vector and leaves every cosine where it was.
        </>
      }
      plot="Two pages' cosine, word by word"
      note="24 pages a reader will know, 276 pairs. Each bar is one word's term in the sum."
      method={<p>Tripling a page triples its raw counts but not its TF-IDF vector, because TF divides by the page's length. The analysis checks every one of the 552 ordered pairs under both weightings: no cosine moves by more than 10⁻¹⁵.</p>}
    />
  );
}

export function Contrast() {
  return (
    <Essay
      id="contrast"
      num="3"
      title="Pronouns split women's pages from men's beyond chance"
      lead="Scattertext places every word by how common it is in two groups of pages; shuffling the groups shows how much of that is chance."
      essentials="Scattertext"
      question="What do women's pages say that men's don't?"
      answer="Her and she, against his and he, lean further than the strongest word in any random split of the same pages. Other words lean too, such as him, woman and herself, but no further than a random split's strongest word."
      did={
        <>
          Wikidata labels 52 pages as women and 145 as men, 197,637 and 397,709 words. Scattertext places each of the 3,188 words seen 20 times or more by its frequency rank in each group and scores it with a log-odds ratio with an informative Dirichlet prior, a z-score for how far it leans.
        </>
      }
      compared={
        <>
          The same 197 pages with the labels shuffled, 20 times. 145 words pass z = 1.96 for real, and shuffles give 99 to 143, so a count of leaning words says little on its own. The largest z any shuffle produced is 9.2; only her (22.4), she, his and he go further.
        </>
      }
      plot="Every word's frequency rank on women's and men's pages"
      note="One dot per word seen 20 times or more. Large dots lean further than any shuffle of the labels gave."
      method={<p>Scattertext's log-odds ratio with an informative Dirichlet prior (Monroe, Colaresi and Quinn 2008), prior from the two groups' pooled counts, scaled to the class size. Gender from Wikidata P21, as in the Week 6 post; 106 pages without a woman or man label are left out.</p>}
    />
  );
}

export function Topics() {
  return (
    <Essay
      id="topics"
      num="4"
      title="Topics move when the seed moves"
      lead="LDA finds recurring word groups, but which groups it finds depends on the number of topics and where it starts."
      essentials="topic model, LDA"
      question="What themes recur across the pages?"
      answer="At five topics, three themes come back under both seeds: mutants, symbiotes, and armour and suits keep 9, 7 and 8 of their top ten words. At eight topics only four keep half, and Wikipedia's media sections (voiced, playable) form topics of their own."
      did={
        <>
          LDA treats each topic as a distribution over words and each page as a mixture of topics. We fitted it with 5 to 12 topics, twice each with seeds 0 and 1, on 5,824 words: names, stopwords and words under three letters removed, as the brief's recipe does.
        </>
      }
      compared={
        <>
          The same model from another seed. Matching each topic to its closest twin, they share 66% of their top ten words at five topics, 41% at eight and 33% at ten. A topic's label is our reading of a word list, and the list itself is one run's.
        </>
      }
      plot="The topics of one fit, and one page's mixture"
      note="Top eight words per topic. Seed 1's topics are reordered to match seed 0's; solid rows keep half their words."
      method={<p>scikit-learn LatentDirichletAllocation, batch learning, 50 iterations, words on 5 to 151 pages. Topics are matched across seeds by the Hungarian algorithm on top-ten overlap.</p>}
    />
  );
}

export function Contexts() {
  return (
    <Essay
      id="contexts"
      num="5"
      title="A word's row is mostly the and and"
      lead="The distributional hypothesis says a word is the company it keeps; the word-context matrix writes that company down."
      essentials="distributional hypothesis, word-context matrix"
      question="What company does a word keep?"
      answer="Raw, mostly grammar. For 24 of 26 words we tried, the most common neighbour is the; the telling neighbours sit lower in the row."
      did={
        <>
          Each row is a target word, each column a context word, each cell how often the context sits within the window, inside one page. We count windows of 2, 5 and 10 words on either side.
        </>
      }
      compared={
        <>
          Windows of different size. A narrow window keeps the words right beside a word: mjolnir is hammer's fourth neighbour within two words and eighth within five, while the stays first at every size. Storm sits next to weather only 4 times within five words, and next to the 249 times.
        </>
      }
      plot="One word's row of the word-context matrix"
      note="The fifteen largest cells of the row. The table is a corner of the matrix at window 5."
      method={<p>The same tokens as section 1, counted with scipy sparse matrices. The matrix is symmetric: a row's total equals its column's.</p>}
    />
  );
}

export function Pmi() {
  return (
    <Essay
      id="pmi"
      num="6"
      title="Association, not frequency, finds the meaning"
      lead="PMI asks whether two words meet more often than chance would have them meet; PPMI keeps only the yes."
      essentials="PMI, PPMI"
      question="Which neighbours actually belong to a word?"
      answer="The ones that meet it more often than chance. Web's PPMI neighbours are shooters, slinger, madame and weaver; the, its top neighbour by count, has a PMI of about 0."
      did={
        <>
          PMI is log[P(w, c) / (P(w) P(c))]. Above 0, the pair meets more often than independence predicts; below, less. PPMI sets the negatives to 0. Plain PMI puts words seen once or twice at the top, so the PPMI list keeps contexts seen five times or more.
        </>
      }
      compared={
        <>
          Raw counts. The is the most common neighbour of 24 of the 26 words, but its PMI ranges from −0.23 to 0.70, at most twice what independence predicts; web's top PPMI neighbour, shooters, scores 6.08. For web, 69 of 607 cells have negative PMI and PPMI zeroes them.
        </>
      }
      plot="One word's neighbours by count, PMI and PPMI"
      note="Window 5. Plain PMI favours contexts seen once; the PPMI list needs five sightings."
      method={<p>Probabilities from the window-5 word-context matrix of section 5: P(w, c) is a cell over all cells, P(w) a row total over all cells.</p>}
    />
  );
}

export function Vectors() {
  return (
    <Essay
      id="vectors"
      num="7"
      title="Prediction packs a row into 100 numbers"
      lead="Word2Vec learns a short dense vector per word by predicting words from their neighbours; the neighbours it finds are Marvel's."
      essentials="static word embedding, skip-gram, CBOW, negative sampling"
      question="Can 303 pages teach a model what a word means?"
      answer="What it means in Marvel. Symbiote's nearest words under skip-gram are venom, brock, toxin and eddie. Storm gets one static vector, and on these pages it is the character, not the weather: cyclops, panther, pryde, ororo."
      did={
        <>
          Skip-gram predicts the context from the word, CBOW the word from its context. Both train with negative sampling: each real pair is set against 5 random words, drawn more often the more common they are. Both are static: one vector per word, whatever the sentence. PPMI rows are a sparse static embedding of the same kind.
        </>
      }
      compared={
        <>
          Random words, and another seed. A word's ten nearest average a cosine of 0.544 under skip-gram, but the ten nearest of random words average 0.517, so the cosine alone proves little. The lists themselves hold: retrained from another seed, skip-gram keeps 71% of each top ten and CBOW 75%.
        </>
      }
      plot="Nearest words under PPMI, skip-gram and CBOW"
      note="26 target words seen 20 times or more. Below: one training step, the real context against sampled negatives."
      method={<p>gensim 4.4 Word2Vec, 100 dimensions, window 5, words seen 20 times or more (3,746), 5 negatives, 20 epochs, one worker and a fixed hash so runs repeat. One sentence is one page.</p>}
    />
  );
}

export function Glove() {
  return (
    <Essay
      id="glove"
      num="8"
      title="General English and Marvel English disagree"
      lead="GloVe learns static vectors from six billion words of news and Wikipedia; the same words mean other things there."
      essentials="GloVe"
      question="Does a word mean the same in general English?"
      answer="Often not. Vision's nearest words in GloVe are sense, concept and image; on the Marvel pages they are wiccan, wanda and witch. For storm, web, vision, beast and thing the two top tens share no word, even ranked over the same candidates."
      did={
        <>
          GloVe fits vectors to a whole corpus's word co-occurrence counts at once, rather than predicting window by window. We used its 50-dimensional vectors trained on Wikipedia 2014 and Gigaword 5 and compared each word's ten nearest with skip-gram's on the 303 pages, both ranked over the 3,645 words the two models know.
        </>
      }
      compared={
        <>
          A word whose meaning does not depend on the corpus. School shares 6 of 10 neighbours across the two (college, high, student, students, teacher, university); 11 of the 26 words share none. GloVe also differs in method and size (50 dimensions against 100), so the corpus is not the only change.
        </>
      }
      plot="Nearest words in GloVe and in the Marvel skip-gram"
      note="Ten nearest words by cosine among the 3,645 words both models know. Highlighted words are in both lists."
      method={<p>glove.6B, 50 dimensions (Pennington, Socher and Manning 2014), loaded with gensim; only the neighbour lists ship with this page. Unrestricted, GloVe's nearest words for storm are hurricane, storms and winds, none of them in the Marvel vocabulary.</p>}
    />
  );
}
