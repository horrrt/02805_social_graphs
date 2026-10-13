import { Fragment, type ReactNode } from "react";
import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";
import { Contexts, Contrast, Cosine, Glove, Pmi, Topics, Vectors, Weights } from "./_sections/Sections";

// The Week 6 post: every term on the brief's Essentials list used once on the
// 303 Marvel pages. Documents first, represented by their words; then words,
// represented by their contexts, as the brief splits the week. The earlier
// post, Marvel Lookalikes, is the alternative at alternative/.

const SECTIONS = [
  ["weights", "1", "Weights"], ["cosine", "2", "Cosine"], ["contrast", "3", "Scattertext"], ["topics", "4", "Topics"],
  ["contexts", "5", "Contexts"], ["pmi", "6", "PMI"], ["vectors", "7", "Word2Vec"], ["glove", "8", "GloVe"],
] as const;

const TITLE = Object.fromEntries(SECTIONS.map(([id, num, label]) => [id, `${num} · ${label}`]));

// The takeaways, each with the sections it comes from.
const TAKEAWAYS: [string, string[], ReactNode][] = [
  ["weights", ["weights"], (
    <>
      <b>IDF zeroes the words on every page</b>
      , Marvel&apos;s own included (
      <em>character</em>
      ,
      {" "}
      <em>comics</em>
      {" "}
      and
      {" "}
      <em>marvel</em>
      {" "}
      weigh 0), but few stopwords:
      {" "}
      <b>151 of NLTK&apos;s 198</b>
      {" "}
      keep weight.
    </>
  )],
  ["cosine", ["cosine"], (
    <>
      <b>Similarity needs weighting:</b>
      {" "}
      under raw counts the 99th-percentile pair of pages sits only
      {" "}
      <b>0.122</b>
      {" "}
      above the 0.754 median; under TF-IDF it sits at
      {" "}
      <b>eleven times</b>
      {" "}
      the 0.0096 median.
    </>
  )],
  ["contrast", ["contrast"], (
    <>
      Between women&apos;s and men&apos;s pages,
      {" "}
      <b>
        only
        {" "}
        <em>her</em>
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
      </b>
      {" "}
      lean further than the strongest word in any shuffle of the labels.
    </>
  )],
  ["topics", ["topics"], (
    <>
      At five topics
      {" "}
      <b>four of five</b>
      {" "}
      keep at least half their top ten words when the seed changes, at eight only four of eight;
      {" "}
      <b>a topic&apos;s label is a reading, not a finding.</b>
    </>
  )],
  ["pmi", ["contexts", "pmi"], (
    <>
      <b>Counting finds grammar, association finds the telling neighbours:</b>
      {" "}
      <em>the</em>
      {" "}
      is the top neighbour of
      {" "}
      <b>24 of 26</b>
      {" "}
      words, with a PMI of at most 0.70.
    </>
  )],
  ["vectors", ["vectors"], (
    <>
      <b>303 pages give stable Marvel neighbours:</b>
      {" "}
      retrained from another seed, skip-gram keeps
      {" "}
      <b>71%</b>
      {" "}
      of each top ten, and
      {" "}
      <em>symbiote</em>
      &apos;s nearest words are
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
  )],
  ["glove", ["glove"], (
    <>
      <b>A static vector holds its corpus&apos;s sense:</b>
      {" "}
      <em>vision</em>
      {" "}
      sits beside
      {" "}
      <em>wiccan</em>
      ,
      {" "}
      <em>wanda</em>
      {" "}
      and
      {" "}
      <em>witch</em>
      {" "}
      on these pages and beside
      {" "}
      <em>sense</em>
      ,
      {" "}
      <em>concept</em>
      {" "}
      and
      {" "}
      <em>image</em>
      {" "}
      in GloVe, and
      {" "}
      <b>11 of 26</b>
      {" "}
      words share no neighbour even among words both models know.
    </>
  )],
];

export default function Page() {
  return (
    <>
      <SkipLink />
      <PostTopbar root="../../" current="weeks/week06/" />
      <main id="main">
        <section className="hero w4-hero w6e-hero" id="top">
          <div className="shell">
            <p className="eyebrow">Week 6 · The language half · Essentials</p>
            <h1>Seventeen essentials, one Marvel corpus</h1>
            <p className="w6e-lede">
              Every essential term of Week 6&apos;s language half, used once on the course&apos;s 303 Marvel pages, each with
              something to try and a baseline to compare it with. First documents, represented by their words; then words,
              represented by their contexts. The
              {" "}
              <a href="alternative/">alternative Week 6 post</a>
              {" "}
              asks one question with the first half of these tools.
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
              {/* One list per part, so neither runs past the subsection word budget. */}
              {([["Takeaways · Part A, documents", 0, 4], ["Takeaways · Part B, words", 4, TAKEAWAYS.length]] as const).map(([title, from, to]) => (
                <Fragment key={title}>
                  <h3>{title}</h3>
                  <ol className="w6e-takeaways" start={from + 1}>
                    {TAKEAWAYS.slice(from, to).map(([key, ids, text]) => (
                      <li key={key}>
                        {text}
                        {ids.map((id, i) => (
                          <Fragment key={id}>
                            {i ? " · " : " "}
                            <a href={`#${id}`}>{TITLE[id]}</a>
                          </Fragment>
                        ))}
                      </li>
                    ))}
                  </ol>
                </Fragment>
              ))}
              <p className="sub">
                Methods: analysis/week06_essentials.py writes every number on this page. An AI coding assistant (Claude) wrote
                the analysis and the page and drafted the text; a review read each claim against the data files, and
                tests/week06-essentials.test.mjs checks every quoted number against them.
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
          <a href="../../">Log–Log Legends</a>
          {" "}
          · DTU 02805
        </span>
      </SiteFooter>
    </>
  );
}
