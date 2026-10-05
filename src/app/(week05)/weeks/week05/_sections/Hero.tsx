import { HeroStat } from "@/components/post/HeroStat";
import { PostHero } from "@/components/post/PostHero";

// Hero: the post's question, the scope caution, two numbers and the fame scatter (#chart-hero-fame,
// drawn by week05-frame.js).
export function Hero() {
  return (
    <PostHero
      id="top"
      eyebrow="Week 5 · The language half · NLP I · Go nuts"
      title="The Marvel network gets language"
      gridClass="w4-hero-grid w5-hero-grid"
      body={
        <>
          <b>Does a character's place in the link network show in the words of its page?</b>
          {" "}
          We read the 303 Marvel Wikipedia pages as text, with this week's tools: tokens,
          counts, n-grams, concordances and the document-term matrix, and asked seven
          questions where the words meet the links.
        </>
      }
      caution="A link is an editor's choice to point to a page, not a friendship in the comics."
      stats={
        <>
          <HeroStat value="713,617" label="words on 303 pages" />
          <HeroStat value="1,784" label="links between the pages" />
        </>
      }
    >
      <figure className="w4-hero-stage w5-hero-stage">
        <div aria-label="Scatter plot of the 303 pages: words on the page against 1 plus the number of pages linking to it, both on log scales, with the fitted line." className="w5-hero-plot" id="chart-hero-fame" role="img"></div>
        <figcaption className="w5-hero-caption">
          Each dot is a page; both axes are logarithmic. Pages with more incoming links are longer:
          Pearson r = 0.77 on the logs, against 0.00 ± 0.06 when in-degree is shuffled over the pages.
          {" "}
          <a href="#fame">Section 6</a>
          {" "}
          reads the pages furthest from the line.
        </figcaption>
      </figure>
    </PostHero>
  );
}
