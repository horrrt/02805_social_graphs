import { HeroStat } from "@/components/post/HeroStat";
import { PostHero } from "@/components/post/PostHero";
import { Part } from "@/features/week07/Parts";

// Hero: the post's question and short answer, the scope caution, two numbers and three real sentences.
export function Hero() {
  return (
    <PostHero
      id="top"
      eyebrow="Week 7 · From meaning to measurement"
      title="Can the text rebuild the Marvel network?"
      gridClass="w4-hero-grid w5-hero-grid"
      body={
        <>
          <b>When a Marvel page names two characters in one sentence, are the two characters&apos; pages linked?</b>
          {" "}
          More often than chance: 56% of the pairs a sentence names are linked, against 15% in the same network rewired at random, and the more sentences name a pair, the likelier the link. But the sentences find only 61% of the links, and the strongest ties they add are mostly book titles and wrong names. We found the 303 characters&apos; names in all 33,243 sentences and compared the pairs with the links.
        </>
      }
      caution="A sentence that names two characters records that a page mentions both, not that they met. A link is an editor's choice to point to a page."
      stats={
        <>
          <HeroStat value="56%" label="of the pairs named in one sentence are linked; 15% in the rewired network" />
          <HeroStat value="61%" label="of the 1,434 linked pairs have a sentence that names both" />
        </>
      }
    >
      <figure className="w4-hero-stage w5-hero-stage">
        <Part part="hero" />
        <figcaption className="w5-hero-caption">
          Three sentences from the pages, with the two names marked. The first pair is the one the pages name together most often, and their pages link. The other two do not link: one shares a story, and in one the Human Torch is the android of the 1940s, whose bare name our matcher gives to Johnny Storm.
          {" "}
          <a href="#explore">Section 1</a>
          {" "}
          lets you pick any character.
        </figcaption>
      </figure>
    </PostHero>
  );
}
