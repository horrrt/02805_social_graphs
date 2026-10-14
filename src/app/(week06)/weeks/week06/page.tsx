import type { ReactNode } from "react";
import { PostSection } from "@/components/post/PostSection";
import { SectionOpener } from "@/components/post/SectionOpener";
import { TermLayer } from "@/components/post/TermLayer";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";
import { Game } from "./_sections/Game";
import { Contexts, Contrast, Cosine, Glove, Pmi, Topics, Vectors, Weights } from "./_sections/Sections";

// The Week 6 post: every term on the brief's Essentials list used once on the
// 303 Marvel pages. Documents first, represented by their words; then words,
// represented by their contexts, as the brief splits the week. The earlier
// post, Marvel Lookalikes, is the alternative at alternative/.

// The takeaways, one per finding, in the order of the sections.
const TAKEAWAYS: [string, ReactNode][] = [
  ["weights", (
    <>
      IDF zeroes every word on all 303 pages, Marvel&apos;s own
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
      included, yet
      {" "}
      <b>
        151 of NLTK&apos;s 198
      </b>
      {" "}
      stopwords keep weight.
    </>
  )],
  ["cosine", (
    <>
      Similarity needs weighting. Under raw counts the 99th-percentile pair of pages sits only
      {" "}
      <b>
        0.122
      </b>
      {" "}
      above the 0.754 median, and under TF-IDF it sits at
      {" "}
      <b>
        eleven times
      </b>
      {" "}
      the 0.0096 median.
    </>
  )],
  ["contrast", (
    <>
      Only
      {" "}
      <b>
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
      split women&apos;s pages from men&apos;s further than any word in a label shuffle.
    </>
  )],
  ["topics", (
    <>
      At five topics,
      {" "}
      <b>
        four of five
      </b>
      {" "}
      keep at least half their top ten words when the seed changes. At eight, only four of eight do, so
      {" "}
      <b>
        a topic&apos;s label is a reading, not a finding.
      </b>
    </>
  )],
  ["pmi", (
    <>
      By count,
      {" "}
      <em>the</em>
      {" "}
      is the top neighbour of
      {" "}
      <b>
        24 of 26
      </b>
      {" "}
      words, but its PMI is at most 0.70, so association finds the telling neighbours.
    </>
  )],
  ["vectors", (
    <>
      303 pages give stable Marvel neighbours. Retrained from another seed, skip-gram keeps
      {" "}
      <b>
        71%
      </b>
      {" "}
      of each top ten, and
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
  )],
  ["glove", (
    <>
      A static vector keeps its corpus&apos;s sense.
      {" "}
      <em>Vision</em>
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
      <b>
        11 of 26
      </b>
      {" "}
      words share no neighbour, even among words both models know.
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
            <p className="eyebrow">Week 6 · The language half</p>
            <h1>Here, storm means Ororo, not the weather</h1>
            <p className="w6e-lede">
              Count the words on Storm&apos;s page and
              {" "}
              <em>the</em>
              {" "}
              comes first, 583 times. Weight each word by how few pages use it and
              {" "}
              <em>storm</em>
              {" "}
              rises to the top. We try eight ways of reading text on the same 303 Marvel pages, and they end with word
              vectors that put
              {" "}
              <em>vision</em>
              {" "}
              beside
              {" "}
              <em>wanda</em>
              {" "}
              here, and beside
              {" "}
              <em>sense</em>
              {" "}
              and
              {" "}
              <em>image</em>
              {" "}
              in everyday English. The
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
          <Game />
          <PostSection id="closing" owner="Gyula">
            <SectionOpener num="✓" title="What the toolkit found">
              Weighting and association do the work. Counting alone turns up grammar, and a corpus decides what its words mean.
            </SectionOpener>
            <div className="card w4-card w6e-closing">
              <h3>Takeaways</h3>
              <ol className="w6e-takeaways">
                {TAKEAWAYS.map(([key, text]) => (
                  <li key={key}>{text}</li>
                ))}
              </ol>
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
          . Every number comes from analysis/week06_essentials.py. An AI coding assistant (Claude) wrote the analysis
          and the page and drafted the text, and tests/week06-essentials.test.mjs checks every quoted number against the
          data files.
        </span>
        {" "}
        <span>
          Week 6 ·
          {" "}
          <a href="../../">Log–Log Legends</a>
          {" "}
          · DTU 02805
        </span>
      </SiteFooter>
      <TermLayer />
    </>
  );
}
