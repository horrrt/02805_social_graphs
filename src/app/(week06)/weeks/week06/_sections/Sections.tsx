import type { ReactNode } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Notice } from "@/components/post/Notice";
import { Plot } from "@/components/post/Plot";
import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";
import { Essential } from "@/features/week06/Essentials";

// One section per group of essentials. The opener is the section's only
// heading; the card under it holds what we did, the baseline it is compared
// to, the explorable and a Method drawer. Every number is in
// analysis/week06_essentials.json; tests/week06-essentials.test.mjs pins them.

type Props = {
  id: "weights" | "cosine" | "contrast" | "topics" | "contexts" | "pmi" | "vectors" | "glove";
  num: string;
  title: ReactNode;
  lead: ReactNode;
  essentials: string;
  did: ReactNode;
  compared: ReactNode;
  plot: string;
  note: ReactNode;
  method: ReactNode;
};

function Essay({ id, num, title, lead, essentials, did, compared, plot, note, method }: Props) {
  return (
    <PostSection id={id} owner="Gyula">
      <SectionOpener num={num} title={title}>{lead}</SectionOpener>
      <div className="card w4-card w5-card">
        <div className="w4-two">
          <div id={`${id}-did`}>
            <div className="w6e-uses">{`Uses: ${essentials}`}</div>
            <p className="sub">{did}</p>
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
      lead="The most frequent words on a page say least about it; TF-IDF works that out from the 303 pages themselves."
      essentials="term frequency (TF), document frequency (DF), inverse document frequency (IDF), TF-IDF"
      did={
        <>
          A word&apos;s TF on a page is its count over the page&apos;s length; its DF is how many of the 303 pages use it; its IDF is ln(303 / DF). TF-IDF multiplies the two.
          {" "}
          <em>He</em>
          {" "}
          is on 291 pages, so its IDF is 0.04;
          {" "}
          <em>she</em>
          {" "}
          is on 191, so ln(303 / 191) = 0.46. The alternative Week 6 post shows what that gap does once names are removed. Together these make a document-term matrix: one row per page, one column per word, each cell a word&apos;s TF-IDF on that page.
        </>
      }
      compared={
        <>
          A hand-written stopword list (NLTK&apos;s English list, 198 words). Only 38 words get an IDF under 0.1, and 23 of them are NLTK stopwords; of NLTK&apos;s other 175, 24 never appear on these pages and 151 keep real weight. IDF also catches words no English list has:
          {" "}
          <em>character</em>
          ,
          {" "}
          <em>comics</em>
          {" "}
          and
          {" "}
          <em>marvel</em>
          {" "}
          are on all 303 pages and weigh exactly 0.
        </>
      }
      plot="A page's words by raw count and by TF-IDF"
      note="Twelve words each way for any of the 303 pages."
      method={<p>Words are runs of letters with one inner apostrophe kept, lowercased: the course&apos;s token rule, the same as the alternative Week 6 post. 727,261 words, 27,033 different ones.</p>}
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
      did={
        <>
          Cosine is the dot product of two vectors over the product of their lengths: the cosine of the angle between them, 1 when they point the same way, 0 when they share no word. Written word by word, it is a sum with one term per word, so we can show which words carry it. Storm and the Human Torch have a raw-count cosine of 0.845, of which
          {" "}
          <em>the</em>
          {" "}
          gives 0.396. Under TF-IDF it is 0.297, and
          {" "}
          <em>storm</em>
          {" "}
          gives 0.234: Johnny Storm&apos;s surname.
        </>
      }
      compared={
        <>
          All 45,753 pairs of pages. Under raw counts the median pair scores 0.754 and the 99th percentile 0.876; under TF-IDF the median is 0.0096 and the 99th percentile 0.109, eleven times as high. Copying a page three times triples its raw-count vector and leaves every cosine where it was.
        </>
      }
      plot="Two pages' cosine, word by word"
      note="24 pages a reader will know, 276 pairs. Each bar is one word's term in the sum."
      method={<p>Tripling a page triples its raw counts but not its TF-IDF vector, because TF divides by the page&apos;s length. The analysis checks every one of the 552 ordered pairs under both weightings: no cosine moves by more than 10⁻¹⁵.</p>}
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
      did={
        <>
          Wikidata labels 52 pages as women and 145 as men, 197,637 and 397,709 words. Scattertext places each of the 3,188 words seen 20 times or more by its frequency rank in each group and gives it a z-score: how far it leans, in standard deviations; beyond ±1.96 counts as a lean.
        </>
      }
      compared={
        <>
          The same 197 pages with the labels shuffled, 20 times. 145 words pass z = 1.96 for real, and shuffles give 99 to 143, so a count of leaning words says little on its own. The largest z any shuffle produced is 9.2; only
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
          sit together in the top-right corner: common in both groups, so their lean shows in the lists below, not in their position. Distance from the diagonal hints at a lean, but many less common words sit far from it by chance; the z-score and dot colour decide which words lean.
        </>
      }
      method={<p>Scattertext&apos;s log-odds ratio with an informative Dirichlet prior (Monroe, Colaresi and Quinn 2008), prior from the two groups&apos; pooled counts, scaled to the class size. Gender from Wikidata P21, as in the alternative Week 6 post; 106 pages without a woman or man label are left out.</p>}
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
      did={
        <>
          A topic model looks for groups of words that recur together across documents; LDA is one such model. LDA treats each topic as a distribution over words and each page as a mixture of topics. We fitted it with 5 to 12 topics, twice each, with seeds 0 and 1, on 5,824 words: names, stopwords, words under three letters, and words on fewer than 5 or more than 151 pages removed.
        </>
      }
      compared={
        <>
          The same model from another seed. Matching each topic to its closest twin, they share 66% of their top ten words at five topics, 41% at eight and 33% at ten. A topic&apos;s label is our reading of a word list, and the list itself is one run&apos;s.
        </>
      }
      plot="The topics of one fit, and one page's mixture"
      note="Top eight words per topic. Seed 1's topics are reordered to match seed 0's."
      method={<p>scikit-learn LatentDirichletAllocation, batch learning, 50 iterations, words on 5 to 151 pages. Topics are matched across seeds by the Hungarian algorithm on top-ten overlap.</p>}
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
          Words that occur in similar contexts tend to have related meanings, but counted raw,
          {" "}
          <em>the</em>
          {" "}
          is the most common context of 24 of our 26 words.
        </>
      }
      essentials="distributional hypothesis, word-context matrix"
      did={
        <>
          Each row is a target word, each column a context word, each cell how often the context sits within the window, inside one page. We count windows of 2, 5 and 10 words on either side.
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
          &apos;s fourth neighbour; within five, its eighth;
          {" "}
          <em>the</em>
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
          249 times. Narrow windows keep the adjacent words; wide windows add the page&apos;s topic.
        </>
      }
      plot="One word's row of the word-context matrix"
      note="The fifteen largest cells of the row. The table is a corner of the matrix at window 5."
      method={<p>The same tokens as section 1, counted with scipy sparse matrices. The matrix is symmetric: a row&apos;s total equals its column&apos;s.</p>}
    />
  );
}

export function Pmi() {
  return (
    <Essay
      id="pmi"
      num="6"
      title="Association, not frequency, finds the telling neighbours"
      lead="PMI asks whether two words meet more often than chance would have them meet; PPMI keeps only the yes."
      essentials="PMI, PPMI"
      did={
        <>
          PMI is ln[P(w, c) / (P(w) P(c))], the natural log. Above 0, the pair meets more often than independence predicts; below, less. PPMI sets the negatives to 0.
        </>
      }
      compared={
        <>
          Raw counts.
          {" "}
          <em>The</em>
          {" "}
          is the most common neighbour of 24 of the 26 words, but its PMI ranges from −0.23 to 0.70, at most twice what independence predicts;
          {" "}
          <em>web</em>
          &apos;s top PPMI neighbour,
          {" "}
          <em>shooters</em>
          , scores 6.08.
        </>
      }
      plot="One word's neighbours by count, and by PMI or PPMI"
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
      lead={
        <>
          Word2Vec learns 100 numbers per word by predicting its neighbours; retrained from another seed, skip-gram keeps 71% of each top ten, and
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
      essentials="static word embedding, skip-gram, CBOW, negative sampling"
      did={
        <>
          Skip-gram predicts the context from the word, CBOW the word from its context: from Storm&apos;s opening words, skip-gram makes pairs such as (storm, is) and (storm, a), while CBOW makes one example, (is, a, superhero, appearing, in) → storm. Both train with negative sampling: each real pair is set against 5 random words, drawn more often the more common they are. Both are static: one vector per word, whatever the sentence, so a word with two senses gets one vector for both; on these pages
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
          Random words, and another seed. A word&apos;s ten nearest average a cosine of 0.544 under skip-gram, but words drawn at random have ten nearest averaging 0.517, so the cosine alone proves little. The lists themselves hold: retrained from another seed, skip-gram keeps 71% of each top ten and CBOW 75%.
        </>
      }
      plot="Nearest words under PPMI, and under skip-gram or CBOW"
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
      did={
        <>
          GloVe fits vectors to a whole corpus&apos;s word co-occurrence counts at once, rather than predicting window by window. We used its 50-dimensional vectors trained on Wikipedia 2014 and Gigaword 5 and compared each word&apos;s ten nearest with skip-gram&apos;s on the 303 pages, both ranked over the 3,645 words the two models know.
        </>
      }
      compared={
        <>
          A word whose meaning does not depend on the corpus.
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
          ); 11 of the 26 words share none. GloVe also differs in method and size (50 dimensions against 100), so the corpus is not the only change. For scale, two runs of the same skip-gram from different seeds keep 71% of each top ten.
        </>
      }
      plot="Nearest words in GloVe and in the Marvel skip-gram"
      note="Ten nearest words by cosine among the 3,645 words both models know. Highlighted words are in both lists."
      method={
        <p>
          glove.6B, 50 dimensions (Pennington, Socher and Manning 2014), loaded with gensim; only the neighbour lists ship with this page. Unrestricted, GloVe&apos;s nearest words for
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
          , none of them in the Marvel vocabulary.
        </p>
      }
    />
  );
}
