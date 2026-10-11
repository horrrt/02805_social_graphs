import { HeroStat } from "@/components/post/HeroStat";
import { PostHero } from "@/components/post/PostHero";
import { Chart } from "@/features/template/charts";

// Hero: the post's one question, a short answer, the scope caution, two numbers and one figure.
export function Hero() {
  return (
    <PostHero
      id="top"
      eyebrow="Week N · Course topic"
      title="A title that states the question"
      gridClass="w4-hero-grid w5-hero-grid"
      body={
        <>
          <b>The one question the whole post answers, in words a visitor can answer after reading?</b>
          {" "}
          One or two sentences on the data and on what the sections below ask.
        </>
      }
      caution="The scope caution: what a link or a count in this data does not mean."
      stats={
        <>
          <HeroStat value="000,000" label="the first number that sets the scale" />
          <HeroStat value="0,000" label="the second number" />
        </>
      }
    >
      <figure className="w4-hero-stage w5-hero-stage">
        <Chart chart="hero" />
        <figcaption className="w5-hero-caption">
          How to read the figure and the one thing to notice, with the number against its baseline.
          Toy figure: Zachary's karate club stands in for your data.
          {" "}
          <a href="#first">Section 1</a>
          {" "}
          has the detail.
        </figcaption>
      </figure>
    </PostHero>
  );
}
