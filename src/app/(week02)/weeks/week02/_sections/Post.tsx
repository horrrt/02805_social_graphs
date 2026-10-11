// "What we found": the removal results and their figure.
export function Post() {
  return (
    <section aria-labelledby="post-title" className="section post" id="post">
      <p className="eyebrow">What we found</p>
      <h2 id="post-title">
        A busy station is not always a vital connection.
      </h2>
      <div className="story-copy">
        <p>
          In the connected group of 277 Wikipedia articles, removing
          Spider-Man and its links cuts five other articles off from the
          largest group left. Removing Hulk cuts off none—even though Hulk has
          65 neighbours. What matters is whether other routes remain, not just
          how many links a station has.
        </p>
        <p>
          We also made 1,000 alternative maps. Each article kept the same
          number of neighbours, but we changed who connected to whom. Only
          nine of those maps lost at least five articles when Spider-Man was
          removed. Its particular connections matter.
        </p>
        <h3>What surprised us</h3>
        <p>
          Black Widow has 25 links, far fewer than Hulk's 65, yet removing
          Black Widow strands 3 articles while removing Hulk strands none.
          Link count alone does not predict which station is a bridge.
        </p>
      </div>
      <figure>
        <img alt="Horizontal bar chart of other articles stranded after one removal: Spider-Man 5, Hulk 0, Black Widow 3, Doctor Strange 2." height="346" src="figures/removal_results.svg" width="720" />
        <figcaption>
          After removing one article, 276 remain. Each bar counts those that
          can no longer reach the largest remaining group. Longer bars mean
          more articles cut off.
        </figcaption>
      </figure>
    </section>
  );
}
