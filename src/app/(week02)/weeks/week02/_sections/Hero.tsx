// The opening: the question, the story nav and the dataset primer.
export function Hero() {
  return (
    <section className="hero story-hero">
      <div className="hero-copy">
        <p className="eyebrow">Week 2 · Models &amp; null models</p>
        <h1>One hero gone. Who loses their way?</h1>
        <p className="intro">
          Imagine Wikipedia as a transport map: articles are stations, and
          links are routes between them. If one station closes, can the others
          still reach each other? Follow a journey and find out.
        </p>
        <nav aria-label="This post" className="story-nav">
          <a className="active-step" href="#try-it">Try it</a>
          <a href="#post">What happens</a>
          <a href="#evidence">Go deeper</a>
        </nav>
        <p className="story-scope">
          This experiment uses 303 Wikipedia articles about Marvel
          superheroes. A route is a reference between pages. Closing a station
          removes an article and its links from our model; it does not change
          Wikipedia.
        </p>
        <details className="post-primer">
          <summary>The dataset and a few useful terms</summary>
          <p>
            The course snapshot, frozen on 26 August 2026, contains 303
            articles in Wikipedia’s Marvel Comics superheroes category. Links
            record references between these pages, not friendships between
            characters.
          </p>
          <dl>
            <dt>Network</dt>
            <dd>
              The articles and the links between them. We treat links as
              two-way routes in the closure experiment, even though Wikipedia
              links have a direction.
            </dd>
            <dt>Core and component</dt>
            <dd>
              A component is a group connected by paths. The core is the
              largest one: 277 articles. A separate nine-article group and 17
              articles with no links are outside this experiment.
            </dd>
            <dt>Neighbour and degree</dt>
            <dd>
              A neighbour is an article connected by a direct link. Degree is
              the number of these neighbours; it does not count everyone
              reachable through a longer route.
            </dd>
            <dt>Null model</dt>
            <dd>
              A comparison network made under stated rules. Ours keeps each
              article’s neighbour count but rearranges the links, so we can
              ask what the particular wiring changes.
            </dd>
          </dl>
          <a href="https://sunelehmann.com/socialgraphs2026-web/data/">Course dataset and loading instructions ↗</a>
        </details>
      </div>
    </section>
  );
}
