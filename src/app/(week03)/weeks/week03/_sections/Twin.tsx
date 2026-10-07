// 4-5: the migration map against its flight twin.
export function Twin() {
  return (
    <>
      {/* 4–5 --------------------------------------------------------- */}
      <section className="step" id="twin">
        <div className="card">
          <div className="step-head">
            <span className="num">4</span>
            <h2 id="null">Compared to what?</h2>
            <span className="year-tag" id="null-tag">(null model)</span>
            {" "}
            <span className="year-tag" id="twin-tag">(analysis year: 2020)</span>
          </div>
          <p className="sub">
            <b>
              10 countries out of 232 broker more than their number of
              partners predicts when the corridor sizes are dealt out at
              random.
            </b>
            {" "}
            That takes both a z of 2 or more against the null
            and excess betweenness above a twentieth of the leader's (the
            United States). Either test alone is looser: 12 countries
            clear z = 2 on its own, but two of them, Guam and Réunion, do
            it on an excess so small it is noise around a near-zero base,
            which is what the second test catches. The rest sit inside
            what a shuffled network produces, which is why the scatter
            carries a null model beside it rather than a ranking. The null
            keeps each country's number of partners fixed but not its
            total corridor weight, so a country with large corridors can
            still score high partly because of their size: 7 of the top
            10 by z sit at or above the 86th percentile of mean corridor
            weight.
          </p>
          <p className="sub">
            The null-model scatter and the twin map share the same country
            selection: click either one and the other follows.
          </p>
          <div className="grid-pair">
            <div>
              <div className="plot">
                <h3>Betweenness z-score vs origins (in-degree), log x</h3>
                <p className="axis-note" id="null-note">
                  The null keeps every country's in- and out-degree and deals
                  the observed corridor weights back out at random. Click any
                  point to select that country.
                </p>
                <canvas aria-label="Scatter plot: betweenness z-score against origins (in-degree), log x" className="chart" height="560" id="scatter-z" role="img" width="900"></canvas>
              </div>
              <aside className="panel pair-aside">
                <h2>Reading it</h2>
                <div className="notice">
                  <span className="ico">💡</span>
                  {" "}
                  <span>
                    <b>What to notice</b>
                    {" "}
                    The z-score says how surprising a country's betweenness is
                    once its number of partners is held fixed and the
                    corridor sizes are dealt out at random. Above +2 is
                    more brokering than that fixed partner count predicts,
                    though a country with large corridors can still land
                    there partly because of their size. Read a zero
                    carefully: half the countries here broker nothing in the
                    real network and nothing in the shuffles either, so their
                    z sits near zero because there is nothing to be surprised
                    by. Nothing on this chart falls below −2.
                  </span>
                </div>
                <div className="corridor-list">
                  <h3>Most surprising bridges</h3>
                  <ol id="z-top"></ol>
                  <p className="fineprint" id="z-floor"></p>
                </div>
              </aside>
            </div>
            <div>
              <div className="map-wrap">
                <div className="map-tools">
                  <div className="toggle" id="map-toggle" role="group">
                    <button aria-pressed="false" data-layer="migration" type="button">
                      Migration
                    </button>
                    {" "}
                    <button aria-pressed="false" data-layer="flights" type="button">
                      Flights
                    </button>
                    {" "}
                    <button aria-pressed="true" data-layer="both" type="button">
                      Both
                    </button>
                    {" "}
                    <button aria-pressed="false" data-layer="net" type="button">
                      Net
                    </button>
                  </div>
                </div>
                <canvas aria-label="Map of the most surprising bridges" height="450" id="map-canvas" role="img" width="900"></canvas>
              </div>
              <aside className="panel pair-aside">
                <h2>Same world. Different networks.</h2>
                <dl className="stats" id="twin-stats"></dl>
                <p className="fineprint" id="net-note"></p>
              </aside>
            </div>
          </div>
          <details className="qa" id="twin-method">
            <summary>
              <span className="qa-cue">Reading the map, and flights as a proxy for people</span>
            </summary>
            <div className="qa-body">
              <p className="fineprint" style={{"border":"0","padding":"0"}}>
                Migration shows where people live. Flights show where you can
                go. Use the toggle to compare them, and click a country to
                select it. The scatter on the left highlights the same one.
                {" "}
                <b>Net</b>
                {" "}
                drops the corridors and colours each country
                instead: green where more people live there than have left
                it, red where more have left than arrived. It is a balance
                of two stocks, not a count of anybody moving this year, and
                it follows the year slider.
              </p>
              <p className="fineprint">
                <b>How good is a route as a proxy for people?</b>
                {" "}
                Measured, for the one country where it can be. US BTS
                publishes passengers on every international segment
                with an American airport at one end, and joining it to
                this same route table for 2019 gives 87
                countries to compare. Route count ranks them well
                (Spearman 0.87, 95% 0.81 to 0.92) and is poor at size:
                among the 58 countries with five routes
                or more, excluding Venezuela, one route carries anywhere from
                25,014 people a year (Nigeria) to
                362,869 (Hong Kong), a factor of
                14.5; the middle half sit between
                60,125 and 186,353.
                Read this network as a ranking of access and never as
                a volume, and treat the bottom of it carefully:
                Venezuela sits lower still, at 14 routes for 8,769
                passengers each, but it is excluded from that factor
                because the snapshot still lists services that had
                stopped flying.
                {" "}
                <code>analysis/week03_passengers.py</code>
                .
              </p>
              <p className="fineprint" id="flight-caveat"></p>
              <p className="fineprint" id="null-method"></p>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
