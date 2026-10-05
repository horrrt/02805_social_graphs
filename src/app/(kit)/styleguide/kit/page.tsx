import { PostSection } from "@/components/post/PostSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Demo } from "@/features/kit-page/demos";

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
