import { PostSection } from "@/components/post/PostSection";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";
import { StoryNav, type ChapterLink } from "@/features/week06/StoryNav";
import { ESSENTIALS } from "@/scripts/week06-essentials.js";
import { Contexts, Contrast, Cosine, Glove, Pmi, Topics, Vectors, Weights } from "./_sections/Sections";

// Interactive data story for the Week 6 essentials: count → TF-IDF → context →
// semantic space. Analytical claims stay pin-checked by tests/week06-essentials.test.mjs.

const SECTIONS = [
  ["weights", "1", "Weights"], ["cosine", "2", "Cosine"], ["contrast", "3", "Scattertext"], ["topics", "4", "Topics"],
  ["contexts", "5", "Contexts"], ["pmi", "6", "PMI"], ["vectors", "7", "Word2Vec"], ["glove", "8", "GloVe"],
] as const;

const TITLE = Object.fromEntries(SECTIONS.map(([id, num, label]) => [id, `${num} · ${label}`]));

const CHAPTERS: ChapterLink[] = [
  { id: "act1", num: "01", label: "The question" },
  { id: "weights", num: "02", label: "Words lie" },
  { id: "contrast", num: "03", label: "Structure" },
  { id: "contexts", num: "04", label: "Context" },
  { id: "vectors", num: "05", label: "Meaning" },
  { id: "closing", num: "06", label: "Coda" },
];

const TAKEAWAYS = [
  ["weights", "IDF zeroes the words on every page, Marvel's own included (character, comics and marvel weigh 0), but few stopwords: 151 of NLTK's 198 keep weight."],
  ["cosine", "Similarity means nothing until words are weighted: the median pair of pages scores 0.754 on raw counts and 0.0096 on TF-IDF."],
  ["contrast", "Between women's and men's pages, only her, she, his and he lean further than the strongest word in any shuffle of the labels."],
  ["topics", "At eight topics, only four of eight keep at least half their top ten words when the seed changes; a topic's label is a reading, not a finding."],
  ["pmi", "Counting finds grammar, association finds meaning: the is almost every word's top neighbour, with a PMI of at most 0.70."],
  ["vectors", "303 pages give stable Marvel neighbours: retrained from another seed, skip-gram keeps 71% of each top ten, and symbiote's are venom, brock, toxin and eddie."],
  ["glove", "A static vector holds its corpus's sense: vision is Wanda's husband on these pages and a concept in GloVe, and 11 of 26 words share no neighbour even among words both models know."],
] as const;

const ARC = [
  { step: "Count", tip: "Frequency rewards grammar" },
  { step: "TF-IDF", tip: "Weighting finds the page" },
  { step: "Context", tip: "Company ≠ meaning yet" },
  { step: "PMI", tip: "Association keeps the signal" },
  { step: "Embedding", tip: "Meaning is local to the corpus" },
] as const;

export default function Page() {
  return (
    <>
      <SkipLink />
      <PostTopbar
        root="../../../"
        brandSpace
        siteLink
        navLabel="Sections of this page"
        links={[
          ...SECTIONS.map(([id, num, label]) => ({ href: `#${id}`, label: num, name: `${num}: ${label}` })),
          { href: "#closing", label: "Closing" },
        ]}
      />
      <main id="main" className="w6-story">
        <StoryNav chapters={CHAPTERS} />

        {/* ACT 1 — THE QUESTION */}
        <section className="w6s-hero" id="act1">
          <div className="w6s-hero-glow" aria-hidden="true" />
          <div className="shell w6s-hero-inner">
            <p className="w6s-eyebrow">Week 6 · Essentials · Go Nuts</p>
            <p className="w6s-hero-stat">
              <span>303</span>
              <span>pages</span>
            </p>
            <h1>
              What does a word
              <br />
              <em>actually</em>
              {" "}
              tell us?
            </h1>
            <p className="w6s-hero-lede">
              Seventeen essentials on one Marvel corpus. Scroll to watch meaning transform:
              {" "}
              <strong>count → weight → context → semantic space</strong>
              .
              {" "}
              The
              {" "}
              <a href="../">Week 6 post</a>
              {" "}
              asks one question with the first half of these tools.
            </p>
            <div className="w6s-hero-cta">
              <a className="w6s-btn" href="#weights">Start exploring</a>
              <span className="w6s-hero-hint">Toggle Raw ↔ TF-IDF on Storm&apos;s page</span>
            </div>
            <ol className="w6s-arc" aria-label="Story arc">
              {ARC.map((a, i) => (
                <li key={a.step}>
                  <span className="w6s-arc-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="w6s-arc-step">{a.step}</span>
                  <span className="w6s-arc-tip">{a.tip}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="shell w6s-body">
          <p className="w6e-part" id="documents">Part A · Documents, one row per page</p>

          {/* CHAPTER: Words lie — weights + cosine */}
          <Weights />
          <Cosine />

          {/* CHAPTER: Language reveals structure — contrast + topics */}
          <Contrast />
          <Topics />

          <p className="w6e-part" id="words">Part B · Words, one row per word</p>

          {/* CHAPTER: Context matters — contexts + pmi */}
          <Contexts />
          <Pmi />

          {/* CHAPTER: Meaning — vectors + glove */}
          <Vectors />
          <Glove />

          {/* CODA */}
          <PostSection id="closing" owner="Gyula">
            <article className="w6s-coda">
              <p className="w6s-chapter-tag">Coda</p>
              <h2 className="w6s-idea">Meaning lives in context.</h2>
              <p className="w6s-coda-lead">
                Weighting and association do the work; counting alone finds grammar, and a corpus decides what its words mean.
              </p>

              <ol className="w6s-pipeline" aria-label="From counts to meaning">
                <li>
                  <span>Count</span>
                  <small>Grammar wins</small>
                </li>
                <li aria-hidden="true" className="w6s-pipe">→</li>
                <li>
                  <span>TF-IDF</span>
                  <small>Pages diverge</small>
                </li>
                <li aria-hidden="true" className="w6s-pipe">→</li>
                <li>
                  <span>Context</span>
                  <small>Company kept</small>
                </li>
                <li aria-hidden="true" className="w6s-pipe">→</li>
                <li>
                  <span>PMI</span>
                  <small>Chance removed</small>
                </li>
                <li aria-hidden="true" className="w6s-pipe">→</li>
                <li>
                  <span>Space</span>
                  <small>Corpus sense</small>
                </li>
              </ol>

              <div className="w6s-coda-panel">
                <h3>Takeaways</h3>
                <ol className="w6e-takeaways">
                  {TAKEAWAYS.map(([id, text]) => (
                    <li key={id}>
                      {text}
                      {" "}
                      <a href={`#${id}`}>{TITLE[id]}</a>
                    </li>
                  ))}
                </ol>
                <h3>All seventeen essentials</h3>
                <ul className="w6e-checklist">
                  {ESSENTIALS.map(([term, id]) => (
                    <li key={term}>
                      <span>{term}</span>
                      {" "}
                      <a href={`#${id}`}>{TITLE[id]}</a>
                    </li>
                  ))}
                </ul>
                <p className="sub">
                  Methods: analysis/week06_essentials.py writes every number on this page; tests/week06-essentials.test.mjs
                  checks the page against it. Word2Vec and GloVe are this week&apos;s course methods. An AI coding assistant
                  (Claude) wrote the analysis and the page and drafted the text; a review read each claim against the data
                  files, and tests/week06-essentials.test.mjs checks every quoted number against them.
                </p>
              </div>
            </article>
          </PostSection>
        </div>
      </main>
      <SiteFooter>
        <span>
          Page text from English Wikipedia,
          {" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
          , through the 02805 course snapshot of 26 August 2026. Sex or gender from
          {" "}
          <a href="https://www.wikidata.org/wiki/Property:P21">Wikidata</a>
          ,
          {" "}
          <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>
          . GloVe vectors by Pennington, Socher and Manning,
          {" "}
          <a href="https://opendatacommons.org/licenses/pddl/1-0/">PDDL 1.0</a>
          .
        </span>
        {" "}
        <span>
          Week 6 essentials ·
          {" "}
          <a href="../../../">Log–Log Legends</a>
          {" "}
          · DTU 02805
        </span>
      </SiteFooter>
    </>
  );
}
