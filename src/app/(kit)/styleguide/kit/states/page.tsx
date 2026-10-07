import { PostSection } from "@/components/post/PostSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { KitState } from "@/features/kit-page/states";
import { TextState } from "@/features/kit-page/states-text";

export default function Page() {
  return (
    <>
      <main className="shell" id="main">
        <h1>Component edge states</h1>
        <p className="w5-hint">
          The kit's components in the awkward cases a post runs into: long labels, empty rows, values off the axis,
          every optional mark at once and half-width columns. All numbers are toys. npm run kit:states loads this
          page in a browser and fails when a host stays empty, the page logs an error, or a component spills out of
          its column. The normal cases are on the <a href="../">components page</a>.
        </p>
        <PostSection id="state-strip">
          <h2>StripChart</h2>
          <h3>Every optional mark, long labels, values off the axis</h3>
          <KitState state="strip-all" />
          <h3>Ten rows</h3>
          <KitState state="strip-many" />
          <h3>No rows</h3>
          <KitState state="strip-empty" />
          <div className="w4-two">
            <div>
              <h3>Half-width column</h3>
              <KitState state="strip-narrow" />
            </div>
            <div>
              <h3>MiniStrip: a value on the edge of the axis</h3>
              <KitState state="mini-edge" />
            </div>
          </div>
        </PostSection>
        <PostSection id="state-table">
          <h2>Table</h2>
          <h3>No rows</h3>
          <KitState state="table-empty" />
          <h3>Long, missing and negative values</h3>
          <KitState state="table-awkward" />
        </PostSection>
        <PostSection id="state-kwic">
          <h2>Concordance and Passage</h2>
          <h3>No hits</h3>
          <KitState state="kwic-empty" />
          <h3>Long contexts and an empty one</h3>
          <KitState state="kwic-long" />
          <div className="w4-two">
            <div>
              <h3>Passage without its highlight</h3>
              <KitState state="passage-nomatch" />
            </div>
            <div>
              <h3>Passage whose highlight has regex characters</h3>
              <KitState state="passage-regex" />
            </div>
          </div>
        </PostSection>
        <PostSection id="state-figure">
          <h2>Figure and EChart</h2>
          <div className="w4-two">
            <div>
              <h3>No data</h3>
              <KitState state="figure-empty" />
            </div>
            <div>
              <h3>Half-width, long category labels</h3>
              <KitState state="figure-narrow" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>No caption, no table</h3>
              <KitState state="figure-bare" />
            </div>
            <div>
              <h3>Table only, no chart</h3>
              <KitState state="figure-table" />
            </div>
          </div>
        </PostSection>
        <PostSection id="state-explorables">
          <h2>Text explorables</h2>
          <div className="w4-two">
            <div>
              <h3>VectorAngle: a zero vector, so no cosine</h3>
              <KitState state="vector-zero" />
            </div>
            <div>
              <h3>VectorAngle: opposite directions, B at its longest</h3>
              <KitState state="vector-opposite" />
            </div>
          </div>
          <h3>SplitBars: long labels, totals over max, zero and missing parts</h3>
          <KitState state="split-long" />
          <div className="w4-two">
            <div>
              <h3>SplitBars: no rows</h3>
              <KitState state="split-empty" />
            </div>
            <div>
              <h3>TokenWindow: no tokens</h3>
              <KitState state="tokens-empty" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>SweepCurve: one point, marker and reference off the axis</h3>
              <KitState state="sweep-one" />
            </div>
            <div>
              <h3>SweepCurve: no points</h3>
              <KitState state="sweep-empty" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>TokenWindow: centre out of range, window 0, a long token</h3>
              <KitState state="tokens-edge" />
            </div>
            <div>
              <h3>MixtureBar: shares off 1, a tiny and a negative part, no words</h3>
              <KitState state="mix-awkward" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>CountMatrix: eighteen columns in a half-width column</h3>
              <KitState state="matrix-wide" />
            </div>
            <div>
              <h3>CountMatrix: no rows, highlight out of range</h3>
              <KitState state="matrix-empty" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>RankedBars: long, zero, negative and muted rows</h3>
              <KitState state="ranked-awkward" />
            </div>
            <div>
              <h3>RankedBars: no rows</h3>
              <KitState state="ranked-empty" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>AxisMap: one point, a long axis label</h3>
              <KitState state="axismap-one" />
            </div>
            <div>
              <h3>AxisMap: no points</h3>
              <KitState state="axismap-empty" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>AnalogyPlot: every word on one spot</h3>
              <KitState state="analogy-same" />
            </div>
            <div>
              <h3>GuessRanker: a budget of 0</h3>
              <KitState state="guess-spent" />
            </div>
          </div>
        </PostSection>
        <PostSection id="state-term">
          <h2>TermText</h2>
          <h3>Text without its phrase</h3>
          <KitState state="term-missing" />
        </PostSection>
        {/* ==== Kit batch D: Text ==== */}
        <PostSection id="state-text">
          <h2>Text</h2>
          <div className="w4-two">
            <div>
              <h3>TaggedTokens: no tokens, an empty source</h3>
              <TextState state="text-tokens-empty" />
            </div>
            <div>
              <h3>TaggedTokens: fewer tokens than n</h3>
              <TextState state="text-tokens-short" />
            </div>
          </div>
          <h3>TaggedTokens: long and empty tokens, overlapping and overrunning spans</h3>
          <TextState state="text-tokens-awkward" />
          <div className="w4-two">
            <div>
              <h3>ContributionBars: no items, a bias only</h3>
              <TextState state="text-contrib-empty" />
            </div>
            <div>
              <h3>ContributionBars: off the scale, zero, NaN, long labels</h3>
              <TextState state="text-contrib-awkward" />
            </div>
          </div>
          <h3>RankedResults: three columns, an empty one, long snippets, negative scores</h3>
          <TextState state="text-results-awkward" />
          <h3>RankedResults: no engines</h3>
          <TextState state="text-results-none" />
          <h3>MethodCompare: four cards, long titles, an empty body</h3>
          <TextState state="text-compare-four" />
          <h3>MethodCompare: no cards</h3>
          <TextState state="text-compare-none" />
          <div className="w4-two">
            <div>
              <h3>CountMatrix: PPMI of eighteen columns, a zero row highlighted</h3>
              <TextState state="text-matrix-ppmi" />
            </div>
            <div>
              <h3>CountMatrix: TF-IDF with an idf of 0 and an empty row</h3>
              <TextState state="text-matrix-tfidf" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>AxisMap: log axes with zero, negative and far-apart points</h3>
              <TextState state="text-logmap-edge" />
            </div>
            <div></div>
          </div>
        </PostSection>
        {/* ==== end Kit batch D: Text ==== */}
      </main>
      <SiteFooter>
        <span>
          Toy data for the component edge states ·
          {" "}
          <a href="../../../">Log–Log Legends</a>
          {" "}
          · DTU 02805
        </span>
      </SiteFooter>
    </>
  );
}
