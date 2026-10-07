// 3: popular is not bridge, big is not prestigious.
export function Bridge() {
  return (
    <>
      {/* 3 ----------------------------------------------------------- */}
      <section className="step" id="bridge">
        <div className="card">
          <div className="step-head">
            <span className="num">3</span>
            <h2>Popular ≠ bridge. Big ≠ prestigious.</h2>
            <span className="year-tag">(2020 only · the null-model year)</span>
          </div>
          <div className="grid-side">
            <div className="plot">
              <h3>Betweenness vs origins (in-degree), log–log</h3>
              <p className="axis-note">
                One point per country. Migration graph is directed and
                weighted; distance along a corridor is 1 / people, so a heavy
                corridor is a short step. Click any point to select that
                country; every chart and panel on the page follows.
              </p>
              <p className="axis-note">
                A "path" here is a chain of migrant-stock corridors, A to B
                to C, not a route anyone travels. Betweenness counts how
                often a country sits on the strongest such chains linking
                other countries: a structural position in the stock
                network, not a measure of people passing through.
              </p>
              <p className="axis-note" id="between-note"></p>
              <div className="legend">
                <span>
                  <i style={{"background":"#f2820c"}}></i>
                  {" "}
                  Migration
                </span>
                {" "}
                <span>
                  <i style={{"background":"#1f8fd6"}}></i>
                  {" "}
                  Flights
                </span>
              </div>
              <canvas aria-label="Scatter plot: betweenness against origins (in-degree), log–log" className="chart" height="470" id="scatter-between" role="img" width="900"></canvas>
            </div>
            <aside className="panel">
              <h2>Selected country</h2>
              <div className="who">
                <span className="flag" id="sc-flag">🌍</span>
                {" "}
                <span>
                  <strong id="sc-name">Pick a country</strong>
                  <br />
                  {" "}
                  <span className="codes" id="sc-codes">—</span>
                </span>
              </div>
              <dl className="stats" id="sc-stats"></dl>
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>What to notice</b>
                  {" "}
                  A high degree does not have to mean high betweenness.
                  Popular ≠ bridge.
                </span>
              </div>
            </aside>
          </div>
          <div className="grid-side" style={{"marginTop":"22px"}}>
            <div className="plot">
              <h3>Big ≠ prestigious: rank by people, rank by PageRank</h3>
              <p className="axis-note">
                PageRank on the weighted migration graph, damping factor
                α = 0.85: a country's score is mostly what its senders hand
                it, and only a small constant share comes from anywhere at
                random.
              </p>
              <p className="axis-note" id="prestige-note"></p>
              <div className="legend">
                <span>
                  <i style={{"background":"#f2820c"}}></i>
                  {" "}
                  Rises on PageRank
                </span>
                {" "}
                <span>
                  <i style={{"background":"#1f8fd6"}}></i>
                  {" "}
                  Falls on PageRank
                </span>
              </div>
              <canvas aria-label="Chart: countries ranked by people against ranked by PageRank" className="chart" height="620" id="prestige" role="img" width="900"></canvas>
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>What to notice</b>
                  {" "}
                  <span id="prestige-movers"></span>
                </span>
              </div>
            </div>
            <aside className="panel">
              <h2>Where the PageRank comes from</h2>
              <div className="who">
                <span className="flag" id="pr-flag">🌍</span>
                {" "}
                <span>
                  <strong id="pr-name">Pick a country</strong>
                  <br />
                  {" "}
                  <span className="codes" id="pr-codes">—</span>
                </span>
              </div>
              <dl className="stats" id="pr-stats"></dl>
              <div className="corridor-list">
                <h3>→ The three senders that give it most</h3>
                <ol id="pr-sources"></ol>
              </div>
              <p className="fineprint" id="pr-note"></p>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
