import { HeroStat } from "@/components/post/HeroStat";
import { PostHero } from "@/components/post/PostHero";
import { Part } from "@/features/week06/Parts";

// Hero: the post's question, the scope caution, two numbers and section 2's chart.
export function Hero() {
  return (
    <PostHero
      id="top"
      eyebrow="Week 6 · The language half · NLP II · Go nuts"
      title="Why do two Marvel pages read alike?"
      gridClass="w4-hero-grid w5-hero-grid"
      body={
        <>
          <b>When two Marvel pages read alike, is it a shared name, a shared story, or Wikipedia's template?</b>
          {" "}
          We weighted the words of all 303 pages with TF-IDF, found each page's ten nearest pages,
          took the names out and looked again.
        </>
      }
      caution="A link is an editor's choice to point to a page, not a friendship in the comics."
      stats={
        <>
          <HeroStat value="44.5%" label="of TF-IDF weight sits on names" />
          <HeroStat value="48%" label="of nearest-page slots go to pages about women once names go; they are 17% of pages" />
        </>
      }
    >
      <figure className="w4-hero-stage w5-hero-stage">
        <Part part="hero" />
        <figcaption className="w5-hero-caption">
          Each row counts how many of a page's ten nearest pages by text are linked with it, averaged over 303 pages.
          TF-IDF gets 4.01 and names alone 3.96. Without names it gets 1.91; removing as many other words of the same rarity leaves 4.00 ± 0.01.
          {" "}
          <a href="#names">Section 2</a>
          {" "}
          has the detail.
        </figcaption>
      </figure>
    </PostHero>
  );
}
