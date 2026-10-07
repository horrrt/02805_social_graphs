import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";
import { ESSENTIALS } from "@/scripts/week06-essentials.js";
import { Contexts, Contrast, Cosine, Glove, Pmi, Topics, Vectors, Weights } from "./_sections/Sections";

// The Week 6 essentials page: every term on the brief's Essentials list used
// once on the 303 Marvel pages. Documents first, represented by their words;
// then words, represented by their contexts, as the brief splits the week.

const SECTIONS = [
  ["weights", "1", "Weights"], ["cosine", "2", "Cosine"], ["contrast", "3", "Scattertext"], ["topics", "4", "Topics"],
  ["contexts", "5", "Contexts"], ["pmi", "6", "PMI"], ["vectors", "7", "Word2Vec"], ["glove", "8", "GloVe"],
] as const;

const TITLE = Object.fromEntries(SECTIONS.map(([id, num, label]) => [id, `${num} · ${label}`]));

const TAKEAWAYS = [
  ["weights", "IDF zeroes the words on every page, Marvel's own included (character, comics and marvel weigh 0), but few stopwords: 151 of NLTK's 198 keep weight."],
  ["cosine", "Similarity means nothing until words are weighted: the median pair of pages scores 0.754 on raw counts and 0.0096 on TF-IDF."],
  ["contrast", "Between women's and men's pages, only her, she, his and he lean further than the strongest word in any shuffle of the labels."],
  ["topics", "At eight topics, only four of eight keep at least half their top ten words when the seed changes; a topic's label is a reading, not a finding."],
  ["pmi", "Counting finds grammar, association finds meaning: the is almost every word's top neighbour, with a PMI of at most 0.70."],
  ["vectors", "303 pages give stable Marvel neighbours: retrained from another seed, skip-gram keeps 71% of each top ten, and symbiote's are venom, brock, toxin and eddie."],
  ["glove", "A static vector holds its corpus's sense: vision is Wanda's husband on these pages and a concept in GloVe, and 11 of 26 words share no neighbour even among words both models know."],
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
      <main id="main">
        <section className="hero w4-hero w6e-hero" id="top">
          <div className="shell">
            <p className="eyebrow">Week 6 · The language half · Essentials</p>
            <h1>Seventeen essentials, one Marvel corpus</h1>
            <p className="w6e-lede">
              Every term on the brief&apos;s Essentials list, used once on the course&apos;s 303 Marvel pages, each with something
              to try and a baseline to compare it with. First documents, represented by their words; then words,
              represented by their contexts. The
              {" "}
              <a href="../">Week 6 post</a>
              {" "}
              asks one question with the first half of these tools. The same page is also told as a
              {" "}
              <a href="story/">scrolling data story</a>
              .
            </p>
          </div>
        </section>
        <div className="shell">
          <p className="w6e-part" id="documents">Part A · Documents, one row per page</p>
          <Weights />
          <Cosine />
          <Contrast />
          <Topics />
          <p className="w6e-part" id="words">Part B · Words, one row per word</p>
          <Contexts />
          <Pmi />
          <Vectors />
          <Glove />
          <PostSection id="closing" owner="Gyula">
            <SectionOpener num="✓" title="What the toolkit found">
              Weighting and association do the work; counting alone finds grammar, and a corpus decides what its words mean.
            </SectionOpener>
            <div className="card w4-card w6e-closing">
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
