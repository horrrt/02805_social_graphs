import PageScripts from "@/components/PageScripts";

export default function Page() {
  return (
    <>
      <main className="shell" id="main">
        <h1>Components</h1>
        <p className="w5-hint">
          Every component in docs/assets/js/kit.js, drawn with made-up toy numbers so you can see what each looks
          like. None of these numbers is a result. The code for each is in this page's source and in
          docs/assets/js/README.md.
        </p>
        <section className="step" id="demo-figure">
          <h2>figure() with echart()</h2>
          <div data-demo="figure"></div>
        </section>
        <section className="step" id="demo-strip">
          <h2>stripChart(): a result against its baseline</h2>
          <div data-demo="strip"></div>
        </section>
        <section className="step" id="demo-table">
          <h2>table()</h2>
          <div data-demo="table"></div>
        </section>
        <section className="step" id="demo-kwic">
          <h2>concordance()</h2>
          <div data-demo="kwic"></div>
        </section>
        <section className="step" id="demo-passage">
          <h2>passage()</h2>
          <div data-demo="passage"></div>
        </section>
        <section className="step" id="demo-term">
          <h2>termify() and drawer()</h2>
          <div data-demo="term">
            <p>A hapax is a word that occurs exactly once in the corpus.</p>
          </div>
        </section>
        <section className="step" id="demo-network">
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
              <div data-demo="net-hubs"></div>
            </div>
            <div>
              <h3>Links in their community's colour over a faded network</h3>
              <div data-demo="net-links"></div>
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>Community links and named hubs</h3>
              <div data-demo="net-both"></div>
            </div>
            <div>
              <h3>A link's weight: hover a link</h3>
              <div data-demo="net-weight"></div>
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>Two groups you can edit: click a member</h3>
              <div data-demo="net-karate"></div>
            </div>
            <div>
              <h3>Overlapping groups and a node in none</h3>
              <div data-demo="net-overlap"></div>
            </div>
          </div>
          <div className="w4-two">
            <div>
              <h3>Light card: communities with named hubs</h3>
              <div data-demo="net-hubs-light"></div>
            </div>
            <div>
              <h3>Light card: two groups you can edit</h3>
              <div data-demo="net-karate-light"></div>
            </div>
          </div>
        </section>
      </main>
      <footer className="foot">
        <div className="shell">
          <span>
            Toy data for the component gallery ·
            {" "}
            <a href="../../">Log–Log Legends</a>
            {" "}
            · DTU 02805
          </span>
        </div>
      </footer>
      <PageScripts scripts={[{"src":"../../assets/js/pages/kit.js","module":true}]} />
    </>
  );
}
