import { HeroStat } from "log-log-legends-kit";
import type { ReactNode } from "react";

// The stats sit in the dark hero (section.hero.w4-hero), whose tokens colour them:
// the wrapper is the hero's own markup, as PostHero renders it.
const Hero = ({ children }: { children: ReactNode }) => (
  <section className="hero w4-hero">
    <div className="shell">
      <div className="w4-hero-text">
        <div className="w4-hero-stats">{children}</div>
      </div>
    </div>
  </section>
);

// Week 5's pair of numbers.
export const Pair = () => (
  <Hero>
    <HeroStat value="713,617" label="words on 303 pages" />
    <HeroStat value="1,784" label="links between the pages" />
  </Hero>
);

// Week 4's pair, with a longer label that wraps.
export const LongLabel = () => (
  <Hero>
    <HeroStat value="537,796" label="certified H-1B filings, 2025" />
    <HeroStat value="40" label="metro areas with the most filings, 84.5% of the year’s total" />
  </Hero>
);
