import { Notice } from "@/components/post/Notice";
import { StoryBeat } from "@/features/week06/StoryBeat";

// Story beats for the Week 6 essentials page. Visible copy is short; the
// exact analytical claims the tests pin live in the reveal + evidence drawers.
// Every number comes from analysis/week06_essentials.json.

export function Weights() {
  return (
    <StoryBeat
      id="weights"
      chapter="Chapter 01 · Words lie"
      idea="Frequency looks like meaning. It isn't."
      question="Which words make a page?"
      prompt="Pick a page. Flip Raw count → TF-IDF. Watch the ranking change."
      essentials="term frequency (TF), document frequency (DF), inverse document frequency (IDF), TF-IDF"
      reveal={
        <>
          <p className="w6s-punch">
            Not its most frequent ones. On Storm&apos;s page &quot;the&quot; appears 583 times and weighs nothing; &quot;storm&quot; appears 198 times and tops her TF-IDF list.
          </p>
          <p className="w6s-aside">
            A word&apos;s TF on a page is its count over the page&apos;s length; its DF is how many of the 303 pages use it; its IDF is ln(303 / DF). TF-IDF multiplies the two. He is on 291 pages, so its IDF is 0.04; she is on 191, so ln(303 / 191) = 0.46. The Week 6 post shows what that gap does once names are removed.
          </p>
        </>
      }
      evidence={
        <Notice icon="⚖️" headline="Compared to what">
          A hand-written stopword list. Only 38 words get an IDF under 0.1, and 23 of them are NLTK stopwords; 151 of NLTK&apos;s 198 stopwords keep real weight. IDF also catches words no English list has: character, comics and marvel are on all 303 pages and weigh exactly 0.
        </Notice>
      }
      method={<p>Words are runs of letters with one inner apostrophe kept, lowercased: the course&apos;s token rule, the same as the Week 6 post. 727,261 words, 27,033 different ones.</p>}
    />
  );
}

export function Cosine() {
  return (
    <StoryBeat
      id="cosine"
      idea="Under raw counts, every page looks alike."
      question="Which pages are close?"
      prompt="Pick two pages. Flip Raw → TF-IDF. See which word suddenly carries the cosine."
      essentials="cosine similarity"
      reveal={
        <>
          <p className="w6s-punch">
            Under raw counts, nearly all of them: the median pair of pages has a cosine of 0.754. Under TF-IDF the median is 0.0096, and a high cosine starts to mean a shared name or story.
          </p>
          <p className="w6s-aside">
            Cosine is the dot product of two vectors over the product of their lengths. Written word by word, it is a sum with one term per word, so we can show which words carry it. Storm and the Human Torch have a raw-count cosine of 0.845, of which the word the gives 0.396. Under TF-IDF it is 0.297, and the word storm gives 0.234: Johnny Storm&apos;s surname. The explorable covers 24 pages a reader will know, 276 pairs.
          </p>
        </>
      }
      evidence={
        <Notice icon="⚖️" headline="Compared to what">
          All 45,753 pairs of pages. Under raw counts the 99th percentile is 0.876, only 0.122 above the median; under TF-IDF it is 0.109, eleven times the median. Copying a page three times triples its raw-count vector and leaves every cosine where it was.
        </Notice>
      }
      method={<p>Tripling a page triples its raw counts but not its TF-IDF vector, because TF divides by the page&apos;s length. The analysis checks every one of the 552 ordered pairs under both weightings: no cosine moves by more than 10⁻¹⁵.</p>}
    />
  );
}

export function Contrast() {
  return (
    <StoryBeat
      id="contrast"
      chapter="Chapter 02 · Language reveals structure"
      idea="Same corpus. Only the pronouns split it beyond chance."
      question="What do women's pages say that men's don't?"
      prompt="Tap a chip — or type telepathy. Watch the cyan star jump. Then flip Beyond chance."
      essentials="Scattertext"
      reveal={
        <>
          <p className="w6s-punch">
            Her and she, against his and he, lean further than the strongest word in any random split of the same pages. Other words lean too, such as him, woman and herself, but no further than a random split&apos;s strongest word.
          </p>
          <p className="w6s-aside">
            Wikidata labels 52 pages as women and 145 as men, 197,637 and 397,709 words. Scattertext places each of the 3,188 words seen 20 times or more by its frequency rank in each group and scores it with a log-odds ratio with an informative Dirichlet prior, a z-score for how far it leans.
          </p>
        </>
      }
      evidence={
        <Notice icon="⚖️" headline="Compared to what">
          The same 197 pages with the labels shuffled, 20 times. 145 words pass z = 1.96 for real, and shuffles give 99 to 143, so a count of leaning words says little on its own. The largest z any shuffle produced is 9.2; only her (22.4), she, his and he go further.
        </Notice>
      }
      method={<p>Scattertext&apos;s log-odds ratio with an informative Dirichlet prior (Monroe, Colaresi and Quinn 2008), prior from the two groups&apos; pooled counts, scaled to the class size. Gender from Wikidata P21, as in the Week 6 post; 106 pages without a woman or man label are left out.</p>}
    />
  );
}

export function Topics() {
  return (
    <StoryBeat
      id="topics"
      idea="Themes recur — until you move the seed."
      question="What themes recur across the pages?"
      prompt="Change k. Flip the seed. Solid borders keep half their words."
      essentials="topic model, LDA"
      reveal={
        <>
          <p className="w6s-punch">
            At five topics, three themes come back under both seeds: mutants, symbiotes, and armour and suits keep 9, 7 and 8 of their top ten words. At eight topics only four keep half, and Wikipedia&apos;s media sections (voiced, playable) form topics of their own.
          </p>
          <p className="w6s-aside">
            LDA treats each topic as a distribution over words and each page as a mixture of topics. We fitted it with 5 to 12 topics, twice each with seeds 0 and 1, on 5,824 words: names, stopwords and words under three letters removed, as the brief&apos;s recipe does.
          </p>
        </>
      }
      evidence={
        <Notice icon="⚖️" headline="Compared to what">
          The same model from another seed. Matching each topic to its closest twin, they share 66% of their top ten words at five topics, 41% at eight and 33% at ten. A topic&apos;s label is our reading of a word list, and the list itself is one run&apos;s.
        </Notice>
      }
      method={<p>scikit-learn LatentDirichletAllocation, batch learning, 50 iterations, words on 5 to 151 pages. Topics are matched across seeds by the Hungarian algorithm on top-ten overlap.</p>}
    />
  );
}

export function Contexts() {
  return (
    <StoryBeat
      id="contexts"
      chapter="Chapter 03 · Context matters"
      idea="A word is the company it keeps — mostly grammar."
      question="What company does a word keep?"
      prompt="Flip the window. Rebuild the matrix with chips. Bigger letters = stronger company."
      essentials="distributional hypothesis, word-context matrix"
      reveal={
        <>
          <p className="w6s-punch">
            Raw, mostly grammar. For 24 of 26 words we tried, the most common neighbour is the; the telling neighbours sit lower in the row.
          </p>
          <p className="w6s-aside">
            Each row is a target word, each column a context word, each cell how often the context sits within the window, inside one page. We count windows of 2, 5 and 10 words on either side.
          </p>
        </>
      }
      evidence={
        <Notice icon="⚖️" headline="Compared to what">
          Windows of different size. A narrow window keeps the words right beside a word: mjolnir is hammer&apos;s fourth neighbour within two words and eighth within five, while the stays first at every size. Storm sits next to weather only 4 times within five words, and next to the 249 times.
        </Notice>
      }
      method={<p>The same tokens as section 1, counted with scipy sparse matrices. The matrix is symmetric: a row&apos;s total equals its column&apos;s.</p>}
    />
  );
}

export function Pmi() {
  return (
    <StoryBeat
      id="pmi"
      idea="Association, not frequency, finds the meaning."
      question="Which neighbours actually belong to a word?"
      prompt="Flip Count → PMI → PPMI. Watch the disappear from the top."
      essentials="PMI, PPMI"
      reveal={
        <>
          <p className="w6s-punch">
            The ones that meet it more often than chance. Web&apos;s PPMI neighbours are shooters, slinger, madame and weaver; the, its top neighbour by count, has a PMI of about 0.
          </p>
          <p className="w6s-aside">
            PMI is log[P(w, c) / (P(w) P(c))]. Above 0, the pair meets more often than independence predicts; below, less. PPMI sets the negatives to 0. Plain PMI puts words seen once or twice at the top, so the PPMI list keeps contexts seen five times or more.
          </p>
        </>
      }
      evidence={
        <Notice icon="⚖️" headline="Compared to what">
          Raw counts. The is the most common neighbour of 24 of the 26 words, but its PMI ranges from −0.23 to 0.70, at most twice what independence predicts; web&apos;s top PPMI neighbour, shooters, scores 6.08. For web, 69 of 607 cells have negative PMI and PPMI zeroes them.
        </Notice>
      }
      method={<p>Probabilities from the window-5 word-context matrix of section 5: P(w, c) is a cell over all cells, P(w) a row total over all cells.</p>}
    />
  );
}

export function Vectors() {
  return (
    <StoryBeat
      id="vectors"
      chapter="Chapter 04 · Meaning lives in the corpus"
      idea="303 pages can teach a model what a word means — in Marvel."
      question="Can 303 pages teach a model what a word means?"
      prompt="Pick a word. Flip PPMI → Skip-gram → CBOW. Watch the neighbourhood."
      essentials="static word embedding, skip-gram, CBOW, negative sampling"
      reveal={
        <>
          <p className="w6s-punch">
            What it means in Marvel. Symbiote&apos;s nearest words under skip-gram are venom, brock, toxin and eddie. Storm gets one static vector, and on these pages it is the character, not the weather: cyclops, panther, pryde, ororo.
          </p>
          <p className="w6s-aside">
            Skip-gram predicts the context from the word, CBOW the word from its context. Both train with negative sampling: each real pair is set against 5 random words, drawn more often the more common they are. Both are static: one vector per word, whatever the sentence. PPMI rows are a sparse static embedding of the same kind.
          </p>
        </>
      }
      evidence={
        <Notice icon="⚖️" headline="Compared to what">
          Random words, and another seed. A word&apos;s ten nearest average a cosine of 0.544 under skip-gram, but the ten nearest of random words average 0.517, so the cosine alone proves little. The lists themselves hold: retrained from another seed, skip-gram keeps 71% of each top ten and CBOW 75%.
        </Notice>
      }
      method={<p>gensim 4.4 Word2Vec, 100 dimensions, window 5, words seen 20 times or more (3,746), 5 negatives, 20 epochs, one worker and a fixed hash so runs repeat. One sentence is one page.</p>}
    />
  );
}

export function Glove() {
  return (
    <StoryBeat
      id="glove"
      idea="Same spelling. Different world."
      question="Does a word mean the same in general English?"
      prompt="Pick vision. Flip GloVe ↔ Marvel. Shared neighbours glow."
      essentials="GloVe"
      reveal={
        <>
          <p className="w6s-punch">
            Often not. Vision&apos;s nearest words in GloVe are sense, concept and image; on the Marvel pages they are wiccan, wanda and witch. For storm, web, vision, beast and thing the two top tens share no word, even ranked over the same candidates.
          </p>
          <p className="w6s-aside">
            GloVe fits vectors to a whole corpus&apos;s word co-occurrence counts at once, rather than predicting window by window. We used its 50-dimensional vectors trained on Wikipedia 2014 and Gigaword 5 and compared each word&apos;s ten nearest with skip-gram&apos;s on the 303 pages, both ranked over the 3,645 words the two models know.
          </p>
        </>
      }
      evidence={
        <Notice icon="⚖️" headline="Compared to what">
          A word whose meaning does not depend on the corpus. School shares 6 of 10 neighbours across the two (college, high, student, students, teacher, university); 11 of the 26 words share none. GloVe also differs in method and size (50 dimensions against 100), so the corpus is not the only change.
        </Notice>
      }
      method={<p>glove.6B, 50 dimensions (Pennington, Socher and Manning 2014), loaded with gensim; only the neighbour lists ship with this page. Unrestricted, GloVe&apos;s nearest words for storm are hurricane, storms and winds, none of them in the Marvel vocabulary.</p>}
    />
  );
}
