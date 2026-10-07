// The opening: the question, the story nav and the dataset primer.
export function Hero() {
  return (
    <section className="hero story-hero">
      <div className="hero-copy">
        <div>
          <p className="eyebrow">Week 1 · Networks</p>
          <h1>Why the same heroes keep turning up.</h1>
          <p className="intro">
            Can you collect a complete set of Marvel article cards? Each pack
            gives you five cards, but some are much easier to draw than
            others. Open a few packs, then compare what happens when every
            card gets the same chance.
          </p>
          <nav aria-label="This post" className="story-nav">
            <a className="active-step" href="#try-it">Try it</a>
            <a href="#post">What happens</a>
            <a href="#evidence">Go deeper</a>
          </nav>
        </div>
        <p className="story-scope">
          We turned 303 Wikipedia articles about Marvel superheroes into
          cards. A link is a reference from one of these pages to another,
          not a sign of friendship or fame. The cards use those reference
          counts; they do not rank the characters’ strength.
        </p>
        <details className="post-primer">
          <summary>The dataset and a few useful terms</summary>
          <p>
            We use the course’s frozen snapshot from 26 August 2026: 303
            articles in Wikipedia’s Marvel Comics superheroes category, with
            1,784 links between them. It is a selected set of pages, not every
            Marvel character or every link on Wikipedia.
          </p>
          <dl>
            <dt>Incoming and outgoing links</dt>
            <dd>
              If Spider-Man’s page links to Hulk’s, that is one outgoing link
              for Spider-Man and one incoming link for Hulk. Hulk need not
              link back. Counting direction, there are 1,784 links;
              ignoring it, they join 1,434 distinct pairs of articles,
              since 350 pairs link both ways. Every link has one sender and
              one receiver, so the average in-degree and the average
              out-degree are equal: 5.89 links per article.
            </dd>
            <dt>Degree</dt>
            <dd>
              A link count. In-degree counts incoming links; out-degree counts
              outgoing links.
            </dd>
            <dt>Isolate</dt>
            <dd>
              An article with no links in either direction within this set.
              There are 17. The 58 cards with no incoming links also include
              articles that link out.
            </dd>
            <dt>Component</dt>
            <dd>
              A group whose articles can reach each other through links. Here,
              the groupings ignore the direction of the links.
            </dd>
          </dl>
          <a href="https://sunelehmann.com/socialgraphs2026-web/data/">Course dataset and loading instructions ↗</a>
        </details>
      </div>
    </section>
  );
}
