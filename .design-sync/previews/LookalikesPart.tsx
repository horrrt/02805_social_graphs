import { LookalikesPart, Plot, PostHero } from "log-log-legends-kit";

// The Week 6 post's figures, as /weeks/week06/ lays them out; each loads
// lookalikes.json from the live site.

// The hero's panel: Storm's four nearest pages with names kept and removed.
export const StormContrast = () => (
  <PostHero
    id="top"
    eyebrow="Week 6"
    title="Why do two Marvel pages read alike?"
    gridClass="w4-hero-grid w5-hero-grid"
    body={<>Mostly a shared name, and a shared name usually marks a shared story.</>}
  >
    <figure className="w4-hero-stage w5-hero-stage">
      <LookalikesPart part="hero" />
    </figure>
  </PostHero>
);

// Section 1's explorer, opened on Storm.
export const Explorer = () => <LookalikesPart part="explore" />;

// Section 2's figure: linked pages among the ten nearest, per representation.
export const NamesLadder = () => (
  <Plot title="Linked pages among each page's ten nearest" note="Mean over the 303 pages. Band: 20 matched removals, mean and one standard deviation. Dashed line: ten pages picked at random.">
    <LookalikesPart part="ladder" />
  </Plot>
);

// Section 3's two charts in one row: the lean, and women's lists against men's.
export const LeanAndGap = () => (
  <div className="w5-two">
    <Plot title="Pages about women in everyone's ten nearest" note="Share of all 3,030 ten-nearest slots. Dashed line: their share of the 303 pages.">
      <LookalikesPart part="lean" />
    </Plot>
    <Plot title="Women's lists against men's" note="Points. Band: 1,000 shuffles of the labels, mean and one standard deviation.">
      <LookalikesPart part="gap" />
    </Plot>
  </div>
);

// A drawer's table: the 25 closest unlinked pairs, read by hand.
export const PairsRead = () => <LookalikesPart part="readKept" />;
