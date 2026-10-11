import { ServiceState } from "@/features/week02/transit/Closure";
import { RoutePlanner } from "@/features/week02/transit/Planner";
import { TransitMap } from "@/features/week02/transit/TransitMap";

// "Curious? Go deeper.": the clustering baseline, the shuffle tests, the
// friendship paradox and the methods. The service board's state, the
// interchange map and the route planner are islands
// (src/features/week02/transit/).
export function Evidence() {
  return (
    <section className="section evidence" id="evidence">
      <h2 id="closing-title">Curious? Go deeper.</h2>
      <p className="fine">
        Charts, data and methods for anyone who wants to check the details.
      </p>
      <div className="companion-callout">
        <h3>Missing two more models? Play Screen Test.</h3>
        <p>
          This post covers the degree-preserving shuffle, the
          Erdős–Rényi random graph, the friendship
          paradox and clustering, and compares path length against both
          nulls. Screen Test adds two more candidates, Watts–Strogatz
          and Barabási–Albert, and the degree tail: three
          mechanisms audition against the Marvel network, and only one
          measurement says which properties survive.
        </p>
        <a href="../../prototypes/screen-test/">Play Screen Test ↗</a>
      </div>
      <details className="evidence-menu">
        <summary>Explore the explanations &amp; evidence</summary>
        <details className="evidence-item">
          <summary>
            Another example: do linked articles form clusters?
          </summary>
          <p>
            When two articles both link to a third, do they also link to each
            other?
            {" "}
            <strong>Clustering</strong>
            {" "}
            measures how often these small
            triangles close. We compare the observed network with two ways of
            rearranging its links.
          </p>
          <p>
            Clustering stays high after we hold degrees fixed. Its size alone
            is not the finding; its excess over a suitable baseline is.
          </p>
          <figure className="baseline">
            <figcaption>
              Average clustering · all 303 articles. Each bar is a mean
              clustering value; compare the observed bar's length with the
              two null-model bars below it to see how much of the
              clustering survives once degree or link count alone is held
              fixed.
            </figcaption>
            <div>
              <span>Observed</span>
              <meter aria-label="Observed" max="0.35" min="0" value="0.307">
                0.307
              </meter>
              <strong>0.307</strong>
            </div>
            <div>
              <span>Same degree per article</span>
              <meter aria-label="Same degree per article" max="0.35" min="0" value="0.143">
                0.143
              </meter>
              <strong>0.143</strong>
            </div>
            <div>
              <span>Same total links only</span>
              <meter aria-label="Same total links only" max="0.35" min="0" value="0.032">
                0.032
              </meter>
              <strong>0.032</strong>
            </div>
          </figure>
          <p className="fine">
            Means from 1,000 draws per null. This full-network comparison is
            separate from the connected-core removal test above.
          </p>
          <a href="#nulls">Inspect the full comparison →</a>
        </details>
        <details className="evidence-item">
          <summary>Could the result happen by chance?</summary>
          <figure>
            <img alt="Four histograms of stranded counts across 1,000 degree-preserving rewires, one per removed article, each with a dashed line at the real count. Spider-Man’s real 5 sits at the far right tail; Black Widow’s real 3 lies beyond every rewired value; Hulk’s 0 is the most common rewired outcome; Doctor Strange’s 2 or more appears in 85 of 1,000." height="576" loading="lazy" src="figures/null_comparison.svg" width="792" />
            <figcaption>
              Bars count rewired networks by how many articles the removal
              strands; the dashed line marks the real result.
              {" "}
              <a download href="../../assets/data/week02_null_draws.csv">All 1,000 draws (CSV)</a>
            </figcaption>
          </figure>
          <p>
            As a shuffle test: Spider-Man strands 5 against a shuffle mean of
            1.41, empirical p = 0.010; Black Widow strands 3 against 0.19, p =
            0.001 — no rewired world managed more than 2. Doctor Strange’s 2
            against 0.51 gives p = 0.086, and Hulk’s 0 against 0.58 is the
            most ordinary outcome there is (p = 1.0).
          </p>
          <p>
            Black Widow was chosen after scanning all 277 removals, so her
            p-value describes her rank rather than testing a prior guess.
            The four p-values are one-sided and unadjusted.
          </p>
          <p className="fine">
            A z-score describes distance from the null mean in standard
            deviations; it does not require a normal distribution. These
            small, skewed counts are easier to interpret through their
            histograms and empirical tail probabilities. Normal-tail
            significance should not be inferred from their z-scores.
          </p>
        </details>
        <details className="evidence-item">
          <summary>What else changes when we rearrange the links?</summary>
          <section className="section" id="nulls">
            <div className="section-head">
              <h2>Twelve measurements against two null models</h2>
              <span className="tag">12 QUANTITIES · 2 NULLS · 1,000 DRAWS EACH</span>
            </div>
            <p>
              A null model supplies a baseline. We compare the observed
              network with networks that preserve selected properties and
              randomize the rest.
            </p>
            <p>
              We measured twelve quantities on the full 303-article snapshot
              and on 1,000 draws from each of two null models.
            </p>
            <div className="two-col">
              <div className="note">
                <h3>Null A · the degree-preserving shuffle</h3>
                <p>
                  Take the real network and rewire A–B and C–D into A–D and
                  C–B, 28,680 times over. Every article keeps its exact
                  degree; who links to whom is scrambled. Spider-Man still has
                  106 links and the 17 isolates still have none — degree zero
                  cannot gain a link this way.
                </p>
                <p className="fine">
                  Keeps the node count, edge count and every degree;
                  randomizes the wiring subject to those constraints.
                </p>
              </div>
              <div className="note">
                <h3>Null B · random G(n, m)</h3>
                <p>
                  Throw the wiring away entirely: 303 nodes, 1,434 links,
                  every link between a uniformly random pair. Degrees are
                  redrawn by chance, so the hubs vanish and so do the isolates
                  — with an average degree of 9.5, chance almost never leaves
                  an article unlinked.
                </p>
                <p className="fine">
                  Keeps: n and m. Destroys: the degree sequence too.
                </p>
              </div>
            </div>
            <figure>
              <img alt="Six panels, each with two histograms of 1,000 null draws and a dashed line at the real value. Clustering: the real 0.307 sits far right of both nulls. The friendship paradox: the real 24.22 sits inside the shuffle distribution and far right of the random one. Chance the friend is at least as linked: the real 0.753 sits just left of the shuffle. Islands: the real 19 sits at the top edge of a shuffle distribution concentrated on 18, while the random null gives 1. Distances: the real 2.674 sits just right of the shuffle and left of the random null. Degree assortativity: the real minus 0.098 sits at the right edge of the shuffle distribution, while the random null centres on zero." height="774" loading="lazy" src="figures/null_survivors.svg" width="1260" />
              <figcaption>
                Lavender is the degree-preserving shuffle, salmon is random
                G(n, m), the dashed line is the real network. Read each
                panel by asking one question: is the dashed line inside the
                lavender bars or outside them?
                {" "}
                <a download href="../../assets/data/week02_nullmodels_draws.csv">All 2,000 draws (CSV)</a>
              </figcaption>
            </figure>
            <details>
              <summary>The whole table</summary>
              <div className="table-scroll">
                <table>
                  <caption className="fine">
                    Twelve quantities, each measured on the real network and
                    on 1,000 draws from each null. z is the number of null
                    standard deviations between the real value and the null
                    mean; p is the nearer empirical tail, computed as (1 +
                    draws at least as extreme) / (1 + 1,000), so 0.001 is the
                    floor and means not one draw reached the real value.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Quantity</th>
                      <th scope="col">Real</th>
                      <th scope="col">Shuffle</th>
                      <th scope="col">z</th>
                      <th scope="col">p</th>
                      <th scope="col">G(n, m)</th>
                      <th scope="col">z</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Average clustering C</th>
                      <td>0.307</td>
                      <td>0.143</td>
                      <td>+19.8</td>
                      <td>0.001</td>
                      <td>0.032</td>
                      <td>+93.9</td>
                    </tr>
                    <tr>
                      <th scope="row">Transitivity</th>
                      <td>0.182</td>
                      <td>0.115</td>
                      <td>+15.6</td>
                      <td>0.001</td>
                      <td>0.031</td>
                      <td>+58.4</td>
                    </tr>
                    <tr>
                      <th scope="row">Triangles</th>
                      <td>1,839</td>
                      <td>1,158</td>
                      <td>+15.6</td>
                      <td>0.001</td>
                      <td>142</td>
                      <td>+142.8</td>
                    </tr>
                    <tr>
                      <th scope="row">Islands (connected components)</th>
                      <td>19</td>
                      <td>18.04</td>
                      <td>+5.0</td>
                      <td>0.039</td>
                      <td>1.02</td>
                      <td>+131.6</td>
                    </tr>
                    <tr>
                      <th scope="row">Largest component</th>
                      <td>277</td>
                      <td>285.9</td>
                      <td>−23.3</td>
                      <td>0.001</td>
                      <td>303.0</td>
                      <td>−190.2</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        Average distance in the largest component
                      </th>
                      <td>2.674</td>
                      <td>2.631</td>
                      <td>+2.9</td>
                      <td>0.005</td>
                      <td>2.778</td>
                      <td>−24.0</td>
                    </tr>
                    <tr>
                      <th scope="row">Degree assortativity</th>
                      <td>−0.098</td>
                      <td>−0.120</td>
                      <td>+2.0</td>
                      <td>0.024</td>
                      <td>−0.008</td>
                      <td>−3.5</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        Mean degree at the end of a random link
                      </th>
                      <td>22.08</td>
                      <td>22.08</td>
                      <td>—</td>
                      <td>—</td>
                      <td>10.43</td>
                      <td>+152.3</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        Mean degree of a random character’s random friend
                      </th>
                      <td>24.22</td>
                      <td>24.19</td>
                      <td>+0.1</td>
                      <td>0.469</td>
                      <td>10.44</td>
                      <td>+168.5</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        Chance your random friend is at least as linked
                      </th>
                      <td>0.753</td>
                      <td>0.763</td>
                      <td>−3.5</td>
                      <td>0.001</td>
                      <td>0.635</td>
                      <td>+30.7</td>
                    </tr>
                    <tr>
                      <th scope="row">Characters no friend out-links</th>
                      <td>2</td>
                      <td>1.26</td>
                      <td>+1.3</td>
                      <td>0.205</td>
                      <td>16.68</td>
                      <td>−5.1</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        Biggest hub’s share of all link ends
                      </th>
                      <td>3.70%</td>
                      <td>3.70%</td>
                      <td>—</td>
                      <td>—</td>
                      <td>0.67%</td>
                      <td>+57.7</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="fine">
                Two rows have no z and no p. The mean degree at the end of a
                random link is ⟨k²⟩/⟨k⟩, and the hub’s share is 106 / 2,868:
                both are functions of the degree sequence alone, so the
                degree-preserving shuffle reproduces them to every decimal
                place across all 1,000 draws. The standard deviation is
                exactly zero and a z-score would be a division by it. That is
                not a broken measurement — it is the null telling you the
                quantity carries no information beyond the degrees.
              </p>
            </details>
            <h3>What changes under the shuffle</h3>
            <p>
              Some quantities change little under degree-preserving rewiring.
              Degree assortativity is −0.098 in the data versus a null mean of
              −0.120 (z = +2.0, empirical p = 0.024). The observed network is
              slightly less disassortative than this baseline. The result is
              exploratory: these one-sided p-values are unadjusted across
              twelve quantities.
            </p>
            <p>
              Mean distance is 2.674 in the largest observed component versus
              2.631 under the shuffle (z = +2.9, empirical p = 0.005). The
              difference is small but not zero. Short paths alone do not
              establish unusual wiring; the choice of baseline matters.
            </p>
            <p>
              Part of that gap is the shuffle merging islands into the
              giant. Swaps cannot link the 17 isolates, since a degree-zero
              article stays degree zero, which leaves 286 linked articles
              (303 minus 17). In all 1,000 draws those 286 land in a single
              component: the nine-character Morituri island is absorbed
              every time. In 962 draws the giant is exactly those 286
              nodes; in the other 38, an unrelated two-article pair happens
              to split off elsewhere, leaving a giant of 284. A
              like-for-like check that holds the population fixed instead,
              shuffling only the 277-article core used in Screen Test,
              gives 2.674 against a null mean of 2.601 (z = +5.2, from 400
              shuffles at 10 swaps per link, fewer than the 1,000 draws at
              20 swaps per link used elsewhere on this page).
            </p>
            <p>
              Clustering is 0.307 versus a shuffle mean of 0.143 (sd 0.008);
              no draw reached the observed value. The network has 1,839
              triangles versus 1,158 on average under the shuffle. Links among
              characters from the same teams or eras are one possible
              explanation, not a mechanism established by this test.
            </p>
            <h3>The same number, two nulls, two conclusions</h3>
            <p>
              Clustering is about ten times the G(n, m) mean (0.032), but
              about 2.2 times the degree-preserving mean (0.143). Holding
              degrees fixed reduces the apparent excess without eliminating
              it. The two nulls answer different questions; G(n, m) does not
              control for hubs.
            </p>
            <p>
              The observed 19 components compare with 18.04 under
              degree-preserving rewiring (p = 0.039) and about 1.02 under G(n,
              m) (z = +131.6). The shuffle retains the 17 isolates, and it
              absorbs the nine-character Morituri island into the giant
              component in every one of the 1,000 draws: the largest
              component averages 285.9 nodes versus the observed 277
              (z = −23.3). The draws that reach 19 components (38 of 1,000)
              do so because a different, unrelated pair of articles splits
              off elsewhere, not because the shuffle keeps the Morituri
              island separate. Treat the component-count p-value as
              exploratory: matching the real count of 19 does not mean the
              null reproduces the island structure.
            </p>
            <div className="note">
              <h3>Clustering, with its baseline</h3>
              <p>
                Average clustering is 0.307, compared with 0.143 (sd 0.008) in
                1,000 degree-preserving shuffles. The observed value exceeds
                every draw (empirical p = 0.001 with the add-one correction).
                The degree sequence explains part of the difference from G(n,
                m), but an excess remains after controlling for degrees.
              </p>
            </div>
          </section>
        </details>
        <details className="evidence-item">
          <summary>Why do your neighbours tend to have more links?</summary>
          <section className="section" id="paradox">
            <div className="section-head">
              <h2>Why a random neighbour tends to have more links</h2>
              <span className="tag">THE FRIENDSHIP PARADOX · 286 LINKED ARTICLES</span>
            </div>
            <p>
              Pick a Marvel character with at least one link. On average they
              have 10.0 links. Now pick one of their friends at random: that
              friend has 24.2. Three times out of four (75.3%) the friend is
              at least as linked as the character you started from. Nobody is
              lying; picking a friend is degree-biased sampling, because a hub
              is a friend to many and therefore keeps getting picked.
            </p>
            <p>
              For a uniformly selected linked article followed by one random
              neighbour, the observed mean is 24.22 versus a shuffle mean of
              24.19 (z = +0.1, p = 0.47). This quantity can change with
              rewiring. The edge-sampled mean, ⟨k²⟩/⟨k⟩ = 22.08, is different:
              it depends only on degrees and is exactly preserved.
            </p>
            <p>
              The paradox itself follows from the degree sequence alone:
              scrambling who links to whom leaves the average friend's
              degree at 24.19, almost exactly the observed 24.22. Its
              per-character form tells a different story. The share of
              linked articles whose random friend is at least as linked as
              they are is 75.3% in the real network against a shuffle mean
              of 76.3% (z = −3.5) — below every one of the 1,000 draws.
              By this measure Marvel is slightly less paradoxical than
              degree-preserving rewiring predicts.
            </p>
            <p>
              It does not need hubs to exist, only variance. Under random G(n,
              m), where the biggest article has around 19 links, the paradox
              weakens but refuses to die: 10.44 for a random friend against
              9.47 for a random character. A Poisson distribution still has a
              variance, and a variance is all the paradox asks for.
            </p>
            <h3>The two characters nobody out-links</h3>
            <p>
              The paradox has an edge case worth chasing: is there anyone
              whose friends are never better connected than they are? Across
              all 286 linked articles, exactly two.
            </p>
            <div className="metrics">
              <div className="metric">
                <strong>Spider-Man</strong>
                <span>106 links · no friend has more</span>
              </div>
              <div className="metric">
                <strong>Radian</strong>
                <span>6 links · no friend has more</span>
              </div>
            </div>
            <p style={{"marginTop":"24px"}}>
              Spider-Man is the largest hub, with 106 links. Radian has six
              links on the nine-character Morituri island, where no neighbour
              has more. Both are local degree maxima, despite their very
              different degrees.
            </p>
            <p>
              The shuffle produces 1.26 local maxima on average versus the
              observed two (z = +1.3, p = 0.205). G(n, m) gives 16.7 on
              average. These comparisons do not establish that the observed
              pair is exceptional.
            </p>
          </section>
        </details>
        <details className="evidence-item">
          <summary>Which articles were already separate?</summary>
          <div className="departure-board">
            <h2>MARVEL TRANSIT AUTHORITY / SERVICE BOARD</h2>
            <div className="departure-line">
              <span>MAIN NETWORK</span>
              <strong>277 STATIONS</strong>
              <ServiceState />
            </div>
            <div className="departure-line">
              <span>MORITURI ISLAND</span>
              <strong>9 STATIONS</strong>
              <span>SEPARATE LINE</span>
            </div>
            <div className="departure-line">
              <span>ISOLATED ARTICLES</span>
              <strong>17 STATIONS</strong>
              <span>NO TRACKS</span>
            </div>
          </div>
        </details>
        <details className="evidence-item">
          <summary>Explore the 16-station interchange map</summary>
          <section className="section">
            <div className="section-head">
              <h2>The interchange map</h2>
              <span className="tag">16 HUBS · SCHEMATIC · UNDIRECTED</span>
            </div>
            <p>
              This is a readable overview of the 16 best-connected articles
              (four tie at 27 links for the last two places; we keep the
              first two alphabetically, Emma Frost and Hank Pym). Select a
              line to follow its actual links. The full journey planner
              below includes every article.
            </p>
            <TransitMap />
            <p className="fine">
              Positions are not geography. Line colours are drawing aids, not
              detected communities. The map intentionally omits smaller
              stations; no full-network conclusion is inferred from this
              overview.
            </p>
          </section>
        </details>
        <details className="evidence-item">
          <summary>Plan a route through all 303 articles</summary>
          <section className="section" id="journey">
            <div className="section-head">
              <h2>Where would you like to go?</h2>
              <span className="tag">FULL 303-ARTICLE PLANNER</span>
            </div>
            <RoutePlanner />
          </section>
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
                Only within-roster links are observed. Closing a station means
                deleting an article node, not predicting a real outage. The
                route drawn is one shortest path, not necessarily the only
                one. The benchmark holds degrees fixed but changes other
                structure.
              </p>
            </div>
          </div>
        </details>
        <details id="methods">
          <summary>Technical methods &amp; code</summary>
          <p>
            Closures operate on the simple undirected 277-node, 1,421-edge
            main component. After one closure, 276 nodes remain. All four
            displayed results are recomputed in-browser. The recorded
            benchmark has 1,000 connected degree-preserving rewires per tested
            article; each accepts 20 swaps per edge, with a separate
            50-swaps-per-edge sensitivity run. The 16-hub drawing uses an
            edge-disjoint greedy path decomposition. Route finding includes
            all 303 nodes and explicitly selects directed or undirected
            travel.
          </p>
          <p>
            The twelve-quantity shuffle test is a separate run on a wider
            graph: the whole 303-article snapshot as simple undirected links,
            and deliberately
            {" "}
            <em>not</em>
            {" "}
            conditioned on connectedness, which
            is what lets the number of islands vary under the null. 1,000
            draws per null, 20 successful swaps per link for the
            degree-preserving one and
            {" "}
            <code>gnm_random_graph(303, 1434)</code>
            {" "}
            for the random one. Every
            shuffle draw asserts that the degree sequence is unchanged
            before it is measured. Empirical tails are (1 + draws at least as extreme) / (1
            + draws), one-sided and unadjusted across the twelve quantities,
            so treat any single p near 0.05 as a hint rather than a result. A
            finite swap chain approximates the null ensemble rather than
            sampling it uniformly.
          </p>
          <p>
            The random null matches the course's random Marvel network.
            Across the 1,000 random draws the biggest hub has 19 links on
            average and the average distance is 2.78; the course brief gives
            about 19 and 2.8, drawing each link with p = 0.031 where we fix
            the number of links. See analysis/course_reference.py.
          </p>
          <p>
            <a href="https://github.com/horrrt/02805_social_graphs/tree/main/analysis">Analysis and source code on GitHub</a>
            . All experiments run locally in your browser; the frozen data is
            never edited.
          </p>
        </details>
        <p className="downloads">
          <a download href="../../assets/data/week02_all_removals.csv">All 277 removals (CSV)</a>
          {" "}
          ·
          {" "}
          <a download href="../../assets/data/week02_nullmodels.json">Shuffle-test table (JSON)</a>
        </p>
      </details>
      <details id="ai-disclosure">
        <summary>AI use and authorship</summary>
        <p>
          Built with AI assistance for interface design, programming,
          explanation drafts and test construction. Metrics come from the
          provided snapshot and reproducible analysis; the games and
          metaphors are authored presentation choices. Numerical checks
          compare independent Python and browser implementations.
        </p>
      </details>
    </section>
  );
}
