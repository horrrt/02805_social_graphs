// 6: roles inside the communities.
export function Typology() {
  return (
    <>
      {/* 6 ----------------------------------------------------------- */}
      <section className="step" id="typology">
        <div className="card">
          <div className="step-head">
            <span className="num">5</span>
            <h2>Roles inside the communities</h2>
            <span className="year-tag" id="typology-tag"></span>
          </div>
          <p className="sub">
            <b>
              42 countries changed the part they play between 1990 and
              2024.
            </b>
            {" "}
            Venezuela moved from peripheral to provincial hub:
            large inside one community, barely present in the others.
            Colombia moved from ultra-peripheral to peripheral, keeping
            most of its corridors inside one community but gaining a few
            outside it. The chart below gives every country two
            coordinates, and the year slider moves them.
          </p>
          <p className="sub">
            Section 8 splits the world into communities once, with a single
            seed. Roles are steadier than that one partition: each year is
            repartitioned 100 times and a country's z and P are averaged
            over the runs that agreed on its role, from Guimerà and Amaral
            (
            <i>Nature</i>
            {" "}
            433, 2005):
            {" "}
            <b>z</b>
            , how
            large a country is among the other members of its own community,
            and
            {" "}
            <b>P</b>
            , how evenly its corridors are spread across all of
            them. A country with P near zero keeps everyone inside one
            community; near one, it is split evenly between them. The seven
            names and the cut-offs between them are theirs, drawn on the
            chart rather than applied out of sight.
          </p>
          <canvas aria-label="Chart: roles of countries inside their communities" className="chart" height="620" id="cartography" role="img" width="1100"></canvas>
          <div aria-label="How many countries carry each role" className="type-strip" id="typology-strip"></div>
          <div className="grid5" id="typology-cards"></div>
          <aside aria-label="Countries in this role" className="type-drawer" id="type-drawer" hidden></aside>
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span id="typology-note"></span>
          </div>
          <details className="qa" id="typology-method">
            <summary>
              <span className="qa-cue">How steady the roles are, and what they replaced</span>
            </summary>
            <div className="qa-body">
              <p className="sub">
                This replaces six labels of our own that compared a 2020
                migration ranking against a flight snapshot last refreshed around
                2014. When we labelled them, 30 of the 228 countries then in the
                data carried a label that mixed the two
                vintages, and because the flight side cannot move, the section
                could only ever show one year. Nothing here touches the flight
                network, so the slider moves it.
              </p>
              <div className="notice">
                <span className="ico">🧪</span>
                {" "}
                <span>
                  <b>
                    Louvain is random, and one run would have animated its own
                    seed.
                  </b>
                  {" "}
                  Two seeds at 2020 disagree about 28 of 207 roles, which is the
                  same size as the change from one five-year snapshot to the
                  next. So every year is partitioned 100 times, each run votes,
                  and a country carries the role most runs gave it together with
                  the share that agreed. The coordinates are far steadier than
                  the names: the United States sits at z 5.20 with a standard
                  deviation of 0.08 across the 100 runs, and the wobble is
                  concentrated where a country sits on a threshold. Those are
                  drawn as hollow rings, and they are the ones not to quote.
                </span>
              </div>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
