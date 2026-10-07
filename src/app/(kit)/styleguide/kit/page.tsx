import { PostSection } from "@/components/post/PostSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Demo } from "@/features/kit-page/demos";
import { TextDemo } from "@/features/kit-page/demos-text";
import { DistDemo } from "@/features/kit-page/demos-distributions";

export default function Page() {
  return (
    <>
      <main className="shell" id="main">
        <h1>Components</h1>
        <p className="w5-hint">
          Every component in src/scripts/kit.js, drawn with made-up toy numbers so you can see what each looks
          like. None of these numbers is a result. The code for each is in this page's source and in
          src/scripts/README.md.
        </p>
        <PostSection id="demo-figure">
          <h2>figure() with echart()</h2>
          <Demo demo="figure" />
        </PostSection>
        <PostSection id="demo-strip">
          <h2>stripChart(): a result against its baseline</h2>
          <Demo demo="strip" />
        </PostSection>
        <PostSection id="demo-table">
          <h2>table()</h2>
          <Demo demo="table" />
        </PostSection>
        <PostSection id="demo-kwic">
          <h2>concordance()</h2>
          <Demo demo="kwic" />
        </PostSection>
        <PostSection id="demo-passage">
          <h2>passage()</h2>
          <Demo demo="passage" />
        </PostSection>
        <PostSection id="demo-term">
          <h2>termify() and drawer()</h2>
          <Demo demo="term" />
        </PostSection>
        <PostSection id="demo-explorables">
          <h2>Text explorables</h2>
          <p className="sub">
            Ten pieces for the language weeks, from src/kit with toy words and numbers. Each takes its data as props;
            the controls around them belong to the demo.
          </p>
          <div className="w4-two">
            <div>
              <h3>VectorAngle: cosine is the angle, not the length</h3>
              <Demo demo="vector" />
            </div>
            <div>
              <h3>AnalogyPlot: king − man + woman</h3>
              <Demo demo="analogy" />
            </div>
          </div>
          <h3>SplitBars: what each similarity is made of</h3>
          <Demo demo="split" />
          <div className="w4-two">
            <div>
              <h3>SweepCurve: one number as a dial turns</h3>
              <Demo demo="sweep" />
            </div>
            <div>
              <h3>MixtureBar: a document as a topic mixture</h3>
              <Demo demo="mix" />
            </div>
          </div>
          <h3>TokenWindow: the pairs word2vec trains on</h3>
          <Demo demo="tokens" />
          <h3>CountMatrix: a word is its row</h3>
          <Demo demo="matrix" />
          <h3>RankedBars: a page's most distinctive words</h3>
          <Demo demo="ranked" />
          <h3>AxisMap: items on two meaning axes</h3>
          <Demo demo="axismap" />
          <h3>GuessRanker: describe the target without naming it</h3>
          <Demo demo="guess" />
        </PostSection>
        <PostSection id="demo-network">
          <h2>networkView(): six ways to draw a network</h2>
          <p className="sub">
            Unlike the demos above, these use real data, laid out by analysis/styleguide_graphs.py: Zachary's karate
            club, and the course's 303 Marvel pages coloured by the communities of week 5 section 4. The overlap
            figure is a toy and says so. The first six use the dark surface (theme: "dark"); the last two show the
            light card a post uses.
          </p>
          <div className="w4-two">
            <div>
              <h3>Communities with named hubs</h3>
              <Demo demo="net-hubs" />
            </div>
            <div>
              <h3>Links in their community's colour over a faded network</h3>
              <Demo demo="net-links" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>Community links and named hubs</h3>
              <Demo demo="net-both" />
            </div>
            <div>
              <h3>A link's weight: hover a link</h3>
              <Demo demo="net-weight" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>Two groups you can edit: click a member</h3>
              <Demo demo="net-karate" />
            </div>
            <div>
              <h3>Overlapping groups and a node in none</h3>
              <Demo demo="net-overlap" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>Light card: communities with named hubs</h3>
              <Demo demo="net-hubs-light" />
            </div>
            <div>
              <h3>Light card: two groups you can edit</h3>
              <Demo demo="net-karate-light" />
            </div>
          </div>
        </PostSection>
        {/* ==== Kit batch D: Text ==== */}
        <PostSection id="demo-text">
          <h2>Text: tokens, contributions, search and methods side by side</h2>
          <p className="sub">
            TaggedTokens, ContributionBars, RankedResults and MethodCompare from src/kit, and the new CountMatrix and
            AxisMap options, with toy words and numbers. The methods behind them are in src/kit/text-core.js.
          </p>
          <h3>TaggedTokens: a token pipeline you can edit</h3>
          <TextDemo demo="text-pipeline" />
          <div className="w4-two">
            <div>
              <h3>TaggedTokens: an n-gram window</h3>
              <TextDemo demo="text-ngram" />
            </div>
            <div>
              <h3>TaggedTokens: BIO tags become entity spans</h3>
              <TextDemo demo="text-ner" />
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>ContributionBars: a sentiment lexicon with negation</h3>
              <TextDemo demo="text-lexicon" />
            </div>
            <div>
              <h3>ContributionBars: a logistic classifier&apos;s features</h3>
              <TextDemo demo="text-classifier" />
            </div>
          </div>
          <h3>RankedResults: two engines, one query</h3>
          <TextDemo demo="text-search" />
          <h3>MethodCompare: one sentence, three sentiment methods</h3>
          <TextDemo demo="text-compare" />
          <div className="w4-two">
            <div>
              <h3>CountMatrix: counts, PPMI, TF and TF-IDF</h3>
              <TextDemo demo="text-ppmi" />
            </div>
            <div>
              <h3>AxisMap: two rates on log axes</h3>
              <TextDemo demo="text-logmap" />
            </div>
          </div>
        </PostSection>
        {/* ==== end Kit batch D: Text ==== */}
        {/* ==== Kit: distributions and nulls ==== */}
        <PostSection id="demo-distributions">
          <h2>Distributions and nulls</h2>
          <p className="sub">
            Four pieces for degree distributions and null models, from src/kit with toy numbers drawn by a seeded
            generator. The numbers behind them are in src/kit/dist-core.js.
          </p>
          <h3>DistributionPlot: degrees against the Poisson of the same mean</h3>
          <DistDemo demo="dist-degree" />
          <div className="w4-two">
            <div>
              <h3>DistributionPlot: an ideal Zipf curve against toy word counts</h3>
              <DistDemo demo="dist-zipf" />
            </div>
            <div>
              <h3>DistributionPlot: one run against the spread of forty</h3>
              <DistDemo demo="dist-ba" />
            </div>
          </div>
          <h3>NullHistogram: a shuffle test, one shuffle at a time</h3>
          <DistDemo demo="dist-shuffle" />
          <h3>NullBoard: which measures survive which null model</h3>
          <DistDemo demo="dist-board" />
          <h3>NullBars: links by type against a label shuffle</h3>
          <DistDemo demo="dist-links" />
        </PostSection>
        {/* ==== end Kit: distributions and nulls ==== */}
      </main>
      <SiteFooter>
        <span>
          Toy data for the component gallery ·
          {" "}
          <a href="../../">Log–Log Legends</a>
          {" "}
          · DTU 02805
        </span>
      </SiteFooter>
    </>
  );
}
