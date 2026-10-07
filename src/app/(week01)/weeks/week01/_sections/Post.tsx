import { Comparison } from "@/features/week01/odds/Comparison";

// "What we found": the finding, the equal-odds comparison (an island) and the
// exact odds, then what we asked, did and found surprising.
export function Post() {
  return (
    <section aria-labelledby="post-title" className="section post" id="post">
      <p className="eyebrow">What we found</p>
      <h2 id="post-title">58 articles receive no incoming links.</h2>
      <p>
        Within our set of 303 Wikipedia articles, Spider-Man receives
        references from 106 pages, while 58—including Baymax—receive none. We
        give each card one chance per incoming link, plus one extra so every
        card can appear. Spider-Man therefore gets 107 chances for every one
        Baymax gets. That is why collecting the last few cards takes so long.
      </p>
      <p>
        Being mentioned and mentioning others are different things.
        Spider-Man’s page points to nine other articles. Betsy Braddock’s
        points to 28, but only seven point back to her. The direction of a
        link matters.
      </p>
      <section className="learning-comparison" aria-labelledby="odds-title">
        <h3 id="odds-title">What if every card had the same chance?</h3>
        <p>
          Keep the same 303 cards and five draws per pack. Change only the
          odds.
        </p>
        <Comparison />
        <p className="fine">
          Calculated averages across repeated collections, not a prediction
          for your next pack. This comparison starts from an empty collection
          and does not change your saved cards.
        </p>
        <details>
          <summary>How are these averages calculated?</summary>
          <p>
            For a card with draw probability p, the chance of seeing it at
            least once in d independent draws is 1 − (1 − p)
            <sup>d</sup>
            . Add
            that chance over all 303 cards. Equal odds use p = 1/303; our rule
            uses p = (incoming links + 1)/2,087.
          </p>
        </details>
      </section>
      <details className="exact-odds">
        <summary>Spider-Man and Baymax: the exact odds</summary>
        <figure className="beginner-comparison">
          <figcaption>How often can each card appear?</figcaption>
          <div>
            <strong>Spider-Man</strong>
            <span>107 chances out of 2,087 on each draw</span>
          </div>
          <div>
            <strong>Baymax</strong>
            <span>1 chance out of 2,087 on each draw</span>
          </div>
          <p className="fine">
            These are probabilities per draw, not a promise about the next
            pack.
          </p>
        </figure>
      </details>
      <div className="two-col">
        <div>
          <h3>What we asked</h3>
          <p>
            Which articles get linked to, which ones do the linking, and
            who is left out entirely? And how much longer does a
            collection take when a card's odds follow its incoming links
            instead of being equal?
          </p>
          <h3>What we did</h3>
          <p>
            We loaded all 303 roster entries before adding a single edge,
            so the 17 isolates survive. Then we plotted in-degree and
            out-degree on linear and log–log axes, drew the whole roster
            to find what sits outside the giant component, and built a
            five-card pack rule where each draw picks an article with
            weight (incoming links + 1) / 2,087. Finally we asked
            Wikipedia's API to re-derive three articles' out-links and
            checked them against the snapshot.
          </p>
        </div>
        <div>
          <h3>What surprised us</h3>
          <p>
            The articles that link out most are not the ones that get
            linked to most: Betsy Braddock links out to 28 articles but
            only 7 link back to her, while Spider-Man alone is linked by
            106. A second surprise was structural: a nine-character
            island from a single series,
            {" "}
            <a href="https://en.wikipedia.org/wiki/Strikeforce:_Morituri">Strikeforce: Morituri</a>
            {" "}
            (Marvel, 1986–1989), that cites itself 22 times and the rest
            of the roster never.
          </p>
          <p>
            Under our rule the hubs are the easy cards by construction: a
            card's odds grow with its incoming links, so those same 106
            links make Spider-Man common while 58 articles, including all
            17 isolates, share the lowest drop rate. Finishing the set
            takes about 1,945 packs on average, about five times the 382
            packs it would take if every card had equal odds: the rare
            cards set the pace, honestly reflecting a rule we chose, not a
            measure of fame.
          </p>
        </div>
      </div>
    </section>
  );
}
