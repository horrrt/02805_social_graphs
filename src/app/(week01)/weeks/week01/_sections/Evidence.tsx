import { DegreeChart, DegreeScale, DegreeTable, Sketch } from "@/features/week01/chart/Distribution";
import { PacksGuess } from "@/features/week01/packs/Guess";
import { CardIndex } from "@/features/week01/packs/Index";

// "Curious? Go deeper.": the figures, the evidence and the methods. The degree
// chart, its table, the sketch, the packs prediction and the card index are
// islands (src/features/week01/).
export function Evidence() {
  return (
    <section className="section evidence" id="evidence">
      <h2 id="closing-title">Curious? Go deeper.</h2>
      <p className="fine">
        Charts, data and methods for anyone who wants to check the details.
      </p>
      <details className="evidence-menu">
        <summary>Explore the explanations &amp; evidence</summary>
        <details className="evidence-item">
          <summary>See the link counts on linear and log scales</summary>
          <figure>
            <img alt="Four scatter plots of degree frequency P(k) against k + 1: in-degree on linear and log–log axes, out-degree on linear and log–log axes. In-degree has a long tail reaching 106; out-degree stops at 28." height="1336" src="figures/degree_distributions.png" width="1954" />
            <figcaption>
              All 303 articles. The horizontal quantity is degree + 1 so
              zero-degree articles stay visible on log axes. On linear axes,
              the long in-degree tail flattens against zero; log–log axes
              spread it over about two decades, so the few hubs are
              visible. Visual straightness alone does not establish a power
              law.
            </figcaption>
          </figure>
        </details>
        <details className="evidence-item">
          <summary>Who gets mentioned most—and how did we check?</summary>
          <section aria-labelledby="degree-evidence-title" className="section post" id="degree-evidence">
            <p className="eyebrow">THE POST · WEEK 1 · NETWORKS</p>
            <h2 id="degree-evidence-title">
              Who gets linked, and who does the linking?
            </h2>
            <details>
              <summary>In-degree against out-degree</summary>
              <figure>
                <img alt="Scatter plot of in-degree against out-degree for all 303 articles with an in = out reference line. Spider-Man, Hulk, Wolverine, Doctor Strange, She-Hulk, Deadpool and Quasar sit above the line; Betsy Braddock, Cloak and Dagger, Adam Warlock, U.S. Agent and Noh-Varr sit far to the right, below it." height="1316" loading="lazy" src="figures/in_vs_out.png" width="1953" />
                <figcaption>
                  In- and out-degree are positively correlated across all 303
                  articles (Spearman 0.70), but the leaders differ: the most
                  linked-to articles are not the ones that link out most.
                </figcaption>
              </figure>
            </details>
            <h3>Why those are different people</h3>
            <p>
              Incoming links count references from other articles; outgoing
              links count references in the article itself. Familiarity and
              article length could help explain the different rankings, but
              this snapshot does not measure editors’ decisions or establish
              those causes.
            </p>
            <p>
              Spider-Man receives 106 links and links out to 9; Betsy Braddock
              links out to 28 and receives 7. Five articles tie for tenth
              place in outgoing links; counting all of them, Deadpool, Doctor
              Strange, She-Hulk and Wolverine appear in both top-ten lists.
              Across all 303 articles, in- and out-degree correlate (Spearman
              0.70, Pearson 0.50, both p &lt; 0.001), despite the different
              leaders.
            </p>
            <details>
              <summary>
                Does the snapshot still match Wikipedia? (we checked)
              </summary>
              <p>
                The snapshot was frozen on 26 August 2026, and the edges were
                harvested from the raw wiki-source, where an internal link
                appears as
                {" "}
                <code>[[Page name]]</code>
                . So we re-derived a corner of it
                ourselves: fetch the wiki-source through the API, extract the
                {" "}
                <code>[[…]]</code>
                {" "}
                targets, keep the ones that resolve to a
                roster article, and compare with the frozen edge list.
              </p>
              <div className="table-scroll">
                <table>
                  <caption className="fine">
                    Out-links re-derived live from Wikipedia versus the frozen
                    snapshot.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Article</th>
                      <th scope="col">Live</th>
                      <th scope="col">Snapshot</th>
                      <th scope="col">Agree</th>
                      <th scope="col">Only live</th>
                      <th scope="col">Only snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Betsy Braddock</th>
                      <td>28</td>
                      <td>28</td>
                      <td>28</td>
                      <td>0</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <th scope="row">Radian (Morituri)</th>
                      <td>6</td>
                      <td>6</td>
                      <td>6</td>
                      <td>0</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <th scope="row">Baymax</th>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Exact agreement on all three, including the two interesting
                edge cases: the roster's biggest out-linker, and an isolate
                whose zero is a real zero rather than a loading mistake. Three
                articles out of 303 is a spot check, not a validation of the
                whole snapshot — but it does confirm we understand how the
                edges were built. One practical note for anyone repeating
                this: Wikipedia answers
                {" "}
                <code>403</code>
                {" "}
                unless the request
                carries a
                {" "}
                <code>User-Agent</code>
                {" "}
                header naming your client.
              </p>
            </details>
          </section>
        </details>
        <details className="evidence-item">
          <summary>What does the whole network look like?</summary>
          <section className="section" id="map">
            <div className="section-head">
              <h2>The whole roster, drawn</h2>
              <span className="tag">303 ARTICLES · 19 PIECES · UNDIRECTED</span>
            </div>
            <p>
              Ignore link direction and the roster is not one network but
              nineteen. A giant component of 277 articles holds 91.4% of the
              roster. Then there is one nine-article island, and 17 articles
              with no link in either direction.
            </p>
            <figure>
              <img alt="Force-directed drawing of the 303 articles. A single dense blue hairball fills the left two-thirds, with Spider-Man, Hulk, Wolverine, Doctor Strange, Deadpool and She-Hulk labelled as its darkest, largest nodes. To the right, separated, sit an orange nine-node island labelled Strikeforce: Morituri and a grid of 17 green dots labelled the 17 isolates." height="1198" src="figures/map.png" width="1961" />
              <figcaption>
                Node size follows total links; shade follows incoming links;
                position comes from a force-directed layout, so distance on the page is a drawing
                artefact and not a measured quantity. The two groups on the
                right are drawn apart because they genuinely are apart: no
                link joins them to the giant component.
              </figcaption>
            </figure>
            <h3>The islands outside the giant component</h3>
            <p>
              The nine-article island is a single series,
              {" "}
              <em>Strikeforce: Morituri</em>
              {" "}
              (Marvel, 1986–1989). Its
              characters cite each other
              22 times and never once cite anyone else in the roster — and
              nobody else cites them. That is the shape a self-contained
              corner of a canon makes in a link network: not a weak connection
              to the centre, but no connection at all.
            </p>
            <p>
              The 17 isolates are a different phenomenon. Baymax, Super
              Rabbit, Miracleman, Yo-Yo Rodriguez and thirteen more sit on the
              roster because a category page says they are Marvel superheroes,
              yet no article in the category links to them and they link to
              nobody. They are the reason we added every node before any edge;
              load the edge list alone and 17 of the 303 characters silently
              disappear.
            </p>
            <details>
              <summary>The island, drawn on its own</summary>
              <figure>
                <img alt="Directed drawing of the nine Strikeforce: Morituri characters: Radian, Blackthorn, Scaredycat, Shear, Snapdragon, Toxyn, Vyking, Backhand and Scatterbrain. Radian is the hub: it links out to Blackthorn, Scaredycat, Shear, Snapdragon, Toxyn and Vyking, and is linked from Blackthorn, Scaredycat, Shear and Snapdragon. Scaredycat, Scatterbrain and Toxyn link to each other in both directions. Snapdragon also links to Blackthorn one way and to Vyking in both directions. Backhand hangs off Vyking and Shear. Twenty-two arrows in total, none leaving the group." height="1290" loading="lazy" src="figures/island.png" width="1950" />
                <figcaption>
                  Nine characters, 22 arcs among themselves, zero to the other
                  294. Radian is the island's own hub.
                </figcaption>
              </figure>
            </details>
            <p className="fine">
              Components are computed on the undirected graph, so “island”
              means unreachable in either direction. Following arrows only,
              the roster splits further: 66 strongly connected components, the
              largest holding 229 articles.
            </p>
          </section>
        </details>
        <details className="evidence-item">
          <summary>How uneven are the links? Explore the charts</summary>
          <section className="section">
            <div className="section-head">
              <h2>How the draw changes what you see</h2>
              <label>
                Axis view
                <DegreeScale />
              </label>
            </div>
            <p>
              Most articles receive very few links. One gets 106. The rare
              cards are the ones tucked away in the tail of our collection,
              not the celebrities.
            </p>
            <DegreeChart />
            <div className="chart-key">
              <span>
                <i className="swatch"></i>
                Share of all 303 articles
              </span>
              <span>
                <i className="swatch alt"></i>
                Your weighted draws (shown once
                you have drawn 20 cards)
              </span>
            </div>
            <p className="fine">
              Both series use percentages, but they answer different
              questions: how common is a degree among articles, versus how
              often did your weighted draws find it? Log view uses degree + 1
              so the 58 zero-incoming articles remain visible. Empty bins are
              omitted.
            </p>
            <details>
              <summary>Read the distribution as a table</summary>
              <DegreeTable />
            </details>
            <details>
              <summary>Sketch your own distribution</summary>
              <p className="fine">
                Drag across the sketch to set a rough shape, or enter counts
                for seven degree bins. Your sketch is an unscored thought
                experiment.
              </p>
              <Sketch />
            </details>
          </section>
        </details>
        <details className="evidence-item">
          <summary>Why does collecting everyone take so long?</summary>
          <div>
            <p style={{"marginTop":"24px"}}>
              The expected wait is about 9,721 individual draws. Each
              minimum-rate card has a 1 / 2,087 chance per draw. Isolates
              matter, but they are not the whole bottleneck: 41 other articles
              share their drop rate.
            </p>
            <p>
              Requiring the 17 isolates adds about 694 draws to the expected
              wait compared with collecting only non-isolates under the same
              probabilities. That is about 7.1% of the full expected wait.
            </p>
          </div>
        </details>
        <details className="evidence-item">
          <summary>Try estimating the number of packs</summary>
          <PacksGuess />
        </details>
        <details className="evidence-item">
          <summary>Browse all 303 cards</summary>
          <CardIndex />
        </details>
        <details className="evidence-item">
          <summary>Explore: can Baymax get home?</summary>
          <a className="button quiet" href="../../play/">Bonus: can Baymax get home? ↗</a>
        </details>
        <details className="evidence-item">
          <summary>What can this dataset tell us?</summary>
          <div className="closing-grid">
            <div>
              <h3>What the data means</h3>
              <p>
                303 article entries and 1,784 directed links from the course’s
                frozen 26 August 2026 snapshot. A link means one article links
                to another within this roster. It does not measure friendship,
                hero strength, popularity or the whole Marvel universe.
              </p>
              <a download href="../../assets/data/arcade_graph.json">Download the snapshot and metrics (JSON)</a>
            </div>
            <div>
              <h3>Limits of the experiment</h3>
              <p>
                The drop rule is designed for learning. It does not model
                purchases or a real trading-card product. A long-tailed plot
                alone does not establish a power law. Collection progress is
                saved in this browser and may be lost when storage is cleared.
              </p>
            </div>
          </div>
        </details>
        <details id="methods">
          <summary>Technical methods &amp; code</summary>
          <p>
            The directed roster gives in-degree and out-degree. Five
            independent draws per pack allow duplicates. The unequal
            coupon-collector expectation is calculated by integrating the
            probability that at least one card is still missing, checked
            against 20,000 independent exponential-race simulations. Expected
            whole packs lie between 1,944.19 and 1,944.99; approximately 1,945
            is a rounded presentation, not an exact value. See
            analysis/week01_packs.py and the downloadable
            {" "}
            <a href="../../assets/data/week01_packs.json">week01_packs.json</a>
            .
          </p>
          <p>
            Before building on the snapshot we recomputed the figures the
            course briefs quote for it, and every one comes out the same at
            the precision the briefs print: 303 characters, 1,784 links,
            1,434 linked pairs (350 of them both ways), an average degree of
            9.5, 17 isolates, one island of 9, Spider-Man's 106 incoming
            links, Betsy Braddock's 28 outgoing, and in the largest
            component an average distance of 2.67 and a diameter of 6. See
            analysis/course_reference.py.
          </p>
          <p>
            <a href="https://github.com/horrrt/02805_social_graphs/tree/main/analysis">Analysis and source code on GitHub</a>
            . All experiments run locally in your browser; the frozen data is
            never edited.
          </p>
        </details>
      </details>
      <h3>AI use and authorship</h3>
      <p>
        Built with AI assistance for interface design, programming,
        explanation drafts and test construction. Metrics come from the
        provided snapshot and reproducible analysis; the games and
        metaphors are authored presentation choices. Tests check the
        browser's collection model against exact enumeration and the
        page's numbers against the analysis output.
      </p>
    </section>
  );
}
