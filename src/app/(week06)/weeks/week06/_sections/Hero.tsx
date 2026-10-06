import { HeroStat } from "@/components/post/HeroStat";
import { PostHero } from "@/components/post/PostHero";
import { Part } from "@/features/week06/Parts";

// Hero: the post's question and short answer, the scope caution, two numbers and Storm's contrast.
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
          Mostly a shared name, and names are where Wikipedia puts its links. Take the names out and every
          page leans toward pages about women. We weighted the words of all 303 pages, found each page's
          ten nearest, and looked again without the names.
        </>
      }
      caution="A link is an editor's choice to point to a page, not a friendship in the comics."
      stats={
        <>
          <HeroStat value="44.5%" label="of all word weight sits on names" />
          <HeroStat value="48%" label="of nearest-page slots go to pages about women once names go; they are 17% of pages" />
        </>
      }
    >
      <figure className="w4-hero-stage w5-hero-stage">
        <Part part="hero" />
        <figcaption className="w5-hero-caption">
          Storm's four nearest pages by text. With names, the Human Torch comes first because his surname is
          Storm; the two pages do not link. Without names, four women, matched on her and she.
          {" "}
          <a href="#explore">Section 1</a>
          {" "}
          lets you pick any character.
        </figcaption>
      </figure>
    </PostHero>
  );
}
