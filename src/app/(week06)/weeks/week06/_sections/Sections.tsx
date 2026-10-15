import type { ReactNode } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";
import { Gloss } from "@/components/post/Gloss";
import { Essential } from "@/features/week06/Essentials";
import { Tex } from "@/lib/Tex";
import { CosineFormula, IdfInline, IdfWorked, PmiFormula, PpmiFormula, TfIdfFormula } from "./Formulas";

// One section per group of essentials. The opener is the section's only
// heading; the card under it holds what we did, the baseline it is compared
// to, the explorable and a Method drawer. Every number is in
// analysis/week06_essentials.json; tests/week06-essentials.test.mjs pins them.
// A section that defines a measure shows it as a display formula under the
// paragraph of what we did (formula); the first use of each new term
// in the prose is a glossary term (Term), opened by the page's TermLayer.

type Props = {
  id: "weights" | "cosine" | "contrast" | "topics" | "contexts" | "pmi" | "vectors" | "glove";
  num: string;
  title: ReactNode;
  lead: ReactNode;
  did: ReactNode;
  formula?: ReactNode;
  compared: ReactNode;
  plot: string;
  note: ReactNode;
  method: ReactNode;
};

function Essay({ id, num, title, lead, did, formula, compared, plot, note, method }: Props) {
  return (
    <PostSection id={id} owner="Gyula">
      <SectionOpener num={num} title={title}>{lead}</SectionOpener>
      <div className="card w4-card w5-card">
        <div className="w4-two">
          <div id={`${id}-did`}>
            <p className="sub">{did}</p>
            {formula ? <div className="w6e-formula">{formula}</div> : null}
          </div>
          <div id={`${id}-surprise`}>
            <Notice icon="⚖️" headline="Compared to what">{compared}</Notice>
          </div>
        </div>
        <div className="w5-fig" id={`${id}-figure`}>
          <Plot title={plot} note={note}>
            <Essential part={id} />
          </Plot>
        </div>
        <Drawers variant="foot">
          <Drawer label="Method">{method}</Drawer>
        </Drawers>
      </div>
    </PostSection>
  );
}

export function Weights() {
  return (
    <Essay
      id="weights"
      num="1"
      title="IDF finds Marvel's own stopwords"
      lead={
        <>
          The most frequent words on a page say the least about it, and
          {" "}
          <Gloss id="w6-term-tf-idf" word="TF-IDF" />
          {" "}
          spots them using only the 303 pages themselves.
        </>
      }
      did={
        <>
          A word&apos;s
          {" "}
          <Gloss id="w6-term-tf" word="TF" />
          {" "}
          on a page is its count divided by the page&apos;s length. Its
          {" "}
          <Gloss id="w6-term-df" word="DF" />
          {" "}
          is how many of the 303 pages use it, and its
          {" "}
          <Gloss id="w6-term-idf" word="IDF" />
          {" "}
          is
          {" "}
          <IdfInline />
          . TF-IDF multiplies the two.
          {" "}
          <em>He</em>
          {" "}
          is on 291 pages, so its IDF is 0.04, while
          {" "}
          <em>she</em>
          {" "}
          is on 191, so
          {" "}
          <IdfWorked df={191} value="0.46" />
          . Put together, they make a
          {" "}
          <Gloss id="w6-term-document-term-matrix" word="document-term matrix" />
          {" "}
          with one row per page and one column per word, where each cell holds a word&apos;s TF-IDF on that page.
        </>
      }
      formula={<TfIdfFormula />}
      compared={
        <>
          A hand-written
          {" "}
          <Gloss id="w6-term-stopword" word="stopword" />
          {" "}
          list, NLTK&apos;s English list of 198 words. Only 38 words get an IDF under 0.1, and 23 of them are NLTK stopwords. Of NLTK&apos;s other 175, 24 never appear on these pages and 151 keep real weight. IDF also catches words no English list has.
          {" "}
          <em>Character</em>
          ,
          {" "}
          <em>comics</em>
          {" "}
          and
          {" "}
          <em>marvel</em>
          {" "}
          are on all 303 pages, and they weigh exactly 0.
        </>
      }
      plot="A page's words by raw count and by TF-IDF"
      note="Twelve words each way for any of the 303 pages."
      method={<p>A word is a run of letters, lowercased, with one inner apostrophe kept. The pages hold 727,261 words, 27,033 of them different.</p>}
    />
  );
}

export function Cosine() {
  return (
    <Essay
      id="cosine"
      num="2"
      title="Similarity only means something once the words are weighted"
      lead="Under raw counts every page looks like every other. Under TF-IDF, most pairs share almost nothing."
      did={
        <>
          <Gloss id="w6-term-cosine-similarity" word="Cosine" />
          {" "}
          divides the dot product of two vectors by the product of their lengths. That gives the cosine of the angle between them, which is 1 when they point the same way and 0 when they share no word. Written out word by word, it&apos;s a sum with one term per word, so we can show which words carry it. Storm and the Human Torch have a raw-count cosine of 0.845, and
          {" "}
          <em>the</em>
          {" "}
          gives 0.396 of it. Under TF-IDF it&apos;s 0.297, and
          {" "}
          <em>storm</em>
          , Johnny Storm&apos;s surname, gives 0.234.
        </>
      }
      formula={<CosineFormula />}
      compared={
        <>
          Every one of the 45,753 pairs of pages. Under raw counts the median pair scores 0.754 and the 99th percentile 0.876. Under TF-IDF the median is 0.0096 and the 99th percentile 0.109, eleven times as high. Copying a page three times triples its raw-count vector and leaves every cosine where it was.
        </>
      }
      plot="Two pages' cosine, word by word"
      note="24 pages a reader will know, which make 276 pairs. Each bar is one word's term in the sum."
      method={
        <p>
          Tripling a page triples its raw counts but not its TF-IDF vector, because TF divides by the page&apos;s length. The analysis checks all 552 ordered pairs under both weightings, and no cosine moves by more than
          {" "}
          <Tex tex="10^{-15}" label="10 to the minus 15" />
          .
        </p>
      }
    />
  );
}

export function Contrast() {
  return (
    <Essay
      id="contrast"
      num="3"
      title="Pronouns split women's pages from men's beyond chance"
      lead={
        <>
          <Gloss id="w6-term-scattertext" word="Scattertext" />
          {" "}
          places every word by how common it is in two groups of pages, and shuffling the groups shows how much of that is chance.
        </>
      }
      did={
        <>
          Wikidata labels 52 pages as women and 145 as men. The women&apos;s pages hold 197,637 words and the men&apos;s 397,709. Scattertext places each of the 3,188 words seen 20 times or more by its frequency rank in each group, and gives it a
          {" "}
          <Gloss id="w6-term-z-score" word="z-score" />
          {" "}
          for how far it leans, in standard deviations. Anything beyond ±1.96 counts as a lean.
        </>
      }
      compared={
        <>
          The same 197 pages with their labels shuffled, 20 times over. On the real labels, 145 words pass
          {" "}
          <Tex tex="z = 1.96" label="z equals 1.96" />
          {" "}
          and the shuffles give 99 to 143, so a count of leaning words says little on its own. The largest z any shuffle produced is 9.2. Only
          {" "}
          <em>her</em>
          {" "}
          (22.4),
          {" "}
          <em>she</em>
          ,
          {" "}
          <em>his</em>
          {" "}
          and
          {" "}
          <em>he</em>
          {" "}
          go further.
        </>
      }
      plot="Every word's frequency rank on women's and men's pages"
      note={
        <>
          One dot per word seen 20 times or more. Large dots lean further than any shuffle of the labels gave.
          {" "}
          <em>Her</em>
          ,
          {" "}
          <em>she</em>
          ,
          {" "}
          <em>his</em>
          {" "}
          and
          {" "}
          <em>he</em>
          {" "}
          sit together in the top-right corner, common in both groups, so their lean shows in the lists below and not in where they sit. Distance from the diagonal hints at a lean, but many less common words sit far from it by chance. The z-score and the dot&apos;s colour decide which words lean.
        </>
      }
      method={<p>Scattertext&apos;s log-odds ratio with an informative Dirichlet prior (Monroe, Colaresi and Quinn 2008). The prior comes from the two groups&apos; pooled counts, scaled to the class size. Gender is from Wikidata P21, and the 106 pages without a woman or man label are left out.</p>}
    />
  );
}

export function Topics() {
  return (
    <Essay
      id="topics"
      num="4"
      title="Topics move when the seed moves"
      lead={
        <>
          <Gloss id="w6-term-lda" word="LDA" />
          {" "}
          finds recurring word groups, but which groups it finds depends on the number of topics and where it starts.
        </>
      }
      did={
        <>
          A
          {" "}
          <Gloss id="w6-term-topic-model" word="topic model" />
          {" "}
          looks for groups of words that recur together across documents, and LDA is one of them. It treats each topic as a distribution over words and each page as a mixture of topics. We fitted it with 5 to 12 topics, twice each, with seeds 0 and 1, on the 5,824 words left after removing names, stopwords, words under three letters, and words on fewer than 5 or more than 151 pages.
        </>
      }
      compared={
        <>
          The same model, fitted again from another seed, with each topic matched to its closest twin. The twins share 66% of their top ten words at five topics, 41% at eight and 33% at ten. A topic&apos;s label is our reading of a word list, and the list itself comes from one run.
        </>
      }
      plot="The topics of one fit, and one page's mixture"
      note="Top eight words per topic. Seed 1's topics are reordered to match seed 0's."
      method={<p>scikit-learn LatentDirichletAllocation, batch learning, 50 iterations, words on 5 to 151 pages. We matched topics across seeds with the Hungarian algorithm on top-ten overlap.</p>}
    />
  );
}

export function Contexts() {
  return (
    <Essay
      id="contexts"
      num="5"
      title={
        <>
          Counting puts
          {" "}
          <em>the</em>
          {" "}
          first in almost every row
        </>
      }
      lead={
        <>
          The
          {" "}
          <Gloss id="w6-term-distributional-hypothesis" word="distributional hypothesis" />
          {" "}
          says words that occur in similar contexts tend to have related meanings. But counted raw,
          {" "}
          <em>the</em>
          {" "}
          is the most common context of 24 of our 26 words.
        </>
      }
      did={
        <>
          A
          {" "}
          <Gloss id="w6-term-word-context-matrix" word="word-context matrix" />
          {" "}
          has a row for each target word and a column for each context word. A cell counts how often the context word sits within the target&apos;s
          {" "}
          <Gloss id="w6-term-context-window" word="window" />
          {" "}
          on one page. We count windows of 2, 5 and 10 words on either side.
        </>
      }
      compared={
        <>
          Windows of different size. Within two words,
          {" "}
          <em>mjolnir</em>
          {" "}
          is
          {" "}
          <em>hammer</em>
          &apos;s fourth neighbour, and within five it&apos;s the eighth.
          {" "}
          <em>The</em>
          {" "}
          stays first at every size.
          {" "}
          <em>Storm</em>
          {" "}
          sits next to
          {" "}
          <em>weather</em>
          {" "}
          only 4 times within five words, and next to
          {" "}
          <em>the</em>
          {" "}
          249 times. Narrow windows keep the adjacent words, and wide ones add the page&apos;s topic.
        </>
      }
      plot="One word's row of the word-context matrix"
      note="The fifteen largest cells of the row. The table is a corner of the matrix at window 5."
      method={<p>We use the same tokens as section 1 and count them with scipy sparse matrices. The matrix is symmetric, so a row&apos;s total equals its column&apos;s.</p>}
    />
  );
}

export function Pmi() {
  return (
    <Essay
      id="pmi"
      num="6"
      title="Association, not frequency, finds the telling neighbours"
      lead={
        <>
          <Gloss id="w6-term-pmi" word="PMI" />
          {" "}
          asks whether two words meet more often than chance would have them meet, and
          {" "}
          <Gloss id="w6-term-ppmi" word="PPMI" />
          {" "}
          keeps only the pairs where the answer is yes.
        </>
      }
      did={
        <>
          PMI is the natural log of how often a word and a context word meet, divided by how often they would meet if they were independent. A score above 0 means the pair meets more often than independence predicts. Below 0, it meets less often. PPMI sets the negatives to 0.
        </>
      }
      formula={
        <>
          <PmiFormula />
          <PpmiFormula />
        </>
      }
      compared={
        <>
          Raw counts.
          {" "}
          <em>The</em>
          {" "}
          is the most common neighbour of 24 of the 26 words, but its PMI ranges from −0.23 to 0.70, at most twice what independence predicts.
          {" "}
          <em>Web</em>
          &apos;s top PPMI neighbour,
          {" "}
          <em>shooters</em>
          , scores 6.08.
        </>
      }
      plot="One word's neighbours by count, and by PMI or PPMI"
      note="Window 5. Plain PMI favours contexts seen once, and the PPMI list needs five sightings."
      method={
        <p>
          The probabilities come from section 5&apos;s window-5 word-context matrix.
          {" "}
          <Tex tex="P(w, c)" label="P of w and c" />
          {" "}
          is a cell over all cells, and
          {" "}
          <Tex tex="P(w)" label="P of w" />
          {" "}
          is a row total over all cells.
        </p>
      }
    />
  );
}

export function Vectors() {
  return (
    <Essay
      id="vectors"
      num="7"
      title="Prediction packs a row into 100 numbers"
      lead={
        <>
          <Gloss id="w6-term-word2vec" word="Word2Vec" />
          {" "}
          learns 100 numbers per word by predicting its neighbours. Retrained from another seed,
          {" "}
          <Gloss id="w6-term-skip-gram" word="skip-gram" />
          {" "}
          keeps 71% of each top ten, and
          {" "}
          <em>symbiote</em>
          &apos;s nearest are
          {" "}
          <em>venom</em>
          ,
          {" "}
          <em>brock</em>
          ,
          {" "}
          <em>toxin</em>
          {" "}
          and
          {" "}
          <em>eddie</em>
          .
        </>
      }
      did={
        <>
          Skip-gram predicts the context from the word, and
          {" "}
          <Gloss id="w6-term-cbow" word="CBOW" />
          {" "}
          predicts the word from its context. From Storm&apos;s opening words, skip-gram makes pairs such as (storm, is) and (storm, a), while CBOW makes one example, (is, a, superhero, appearing, in) → storm. Both train with
          {" "}
          <Gloss id="w6-term-negative-sampling" word="negative sampling" />
          . Each real pair is set against 5 random words, drawn more often the more common they are. Both are also
          {" "}
          <Gloss id="w6-term-static-word-embedding" word="static" />
          , with one vector per word whatever the sentence, so a word with two senses gets one vector for both. On these pages
          {" "}
          <em>storm</em>
          {" "}
          is the character, not the weather, and its nearest words are
          {" "}
          <em>cyclops</em>
          ,
          {" "}
          <em>panther</em>
          ,
          {" "}
          <em>pryde</em>
          {" "}
          and
          {" "}
          <em>ororo</em>
          . PPMI rows are a sparse static embedding of the same kind.
        </>
      }
      compared={
        <>
          Random words, and another seed. A word&apos;s ten nearest average a cosine of 0.544 under skip-gram, but words drawn at random have ten nearest averaging 0.517, so the cosine alone proves little. The lists themselves hold up. Retrained from another seed, skip-gram keeps 71% of each top ten and CBOW 75%.
        </>
      }
      plot="Nearest words under PPMI, and under skip-gram or CBOW"
      note="26 target words seen 20 times or more. Below the lists is one training step, with the real context set against sampled negatives."
      method={<p>gensim 4.4 Word2Vec, 100 dimensions, window 5, words seen 20 times or more (3,746), 5 negatives, 20 epochs, one worker and a fixed hash so runs repeat. Each page counts as one sentence.</p>}
    />
  );
}

export function Glove() {
  return (
    <Essay
      id="glove"
      num="8"
      title="General English and Marvel English disagree"
      lead={
        <>
          <Gloss id="w6-term-glove" word="GloVe" />
          {" "}
          learns static vectors from six billion words of news and Wikipedia, where the same words mean other things.
        </>
      }
      did={
        <>
          GloVe fits vectors to a whole corpus&apos;s word co-occurrence counts at once instead of predicting window by window. We took its 50-dimensional vectors, trained on Wikipedia 2014 and Gigaword 5, and compared each word&apos;s ten nearest with skip-gram&apos;s on the 303 pages, both ranked over the 3,645 words the two models know.
        </>
      }
      compared={
        <>
          A word whose meaning doesn&apos;t depend on the corpus.
          {" "}
          <em>School</em>
          {" "}
          shares 6 of 10 neighbours across the two (
          <em>college</em>
          ,
          {" "}
          <em>high</em>
          ,
          {" "}
          <em>student</em>
          ,
          {" "}
          <em>students</em>
          ,
          {" "}
          <em>teacher</em>
          ,
          {" "}
          <em>university</em>
          ), while 11 of the 26 words share none. GloVe also differs in method and size (50 dimensions against 100), so the corpus isn&apos;t the only change. For scale, two runs of the same skip-gram from different seeds keep 71% of each top ten.
        </>
      }
      plot="Nearest words in GloVe and in the Marvel skip-gram"
      note="Ten nearest words by cosine among the 3,645 words both models know. Highlighted words are in both lists."
      method={
        <p>
          glove.6B, 50 dimensions (Pennington, Socher and Manning 2014), loaded with gensim. Only the neighbour lists ship with this page. Unrestricted, GloVe&apos;s nearest words for
          {" "}
          <em>storm</em>
          {" "}
          are
          {" "}
          <em>hurricane</em>
          ,
          {" "}
          <em>storms</em>
          {" "}
          and
          {" "}
          <em>winds</em>
          , and none of them is in the Marvel vocabulary.
        </p>
      }
    />
  );
}
