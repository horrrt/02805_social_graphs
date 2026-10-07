import { Chart } from "@/features/week03/frame/Chart";
import { Slot } from "@/features/week03/frame/Slot";
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
              <Slot view="between-note" as="p" id="between-note" className="axis-note" />
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
              <Chart id="scatter-between" width="900" height="470" label="Scatter plot: betweenness against origins (in-degree), log–log" />
            </div>
            <aside className="panel">
              <h2>Selected country</h2>
              <div className="who">
                <Slot view="sc-flag" as="span" id="sc-flag" className="flag" initial="🌍" />
                {" "}
                <span>
                  <Slot view="sc-name" as="strong" id="sc-name" initial="Pick a country" />
                  <br />
                  {" "}
                  <Slot view="sc-codes" as="span" id="sc-codes" className="codes" initial="—" />
                </span>
              </div>
              <Slot view="sc-stats" as="dl" id="sc-stats" className="stats" />
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
              <Slot view="prestige-note" as="p" id="prestige-note" className="axis-note" />
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
              <Chart id="prestige" width="900" height="620" label="Chart: countries ranked by people against ranked by PageRank" />
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>What to notice</b>
                  {" "}
                  <Slot view="prestige-movers" as="span" id="prestige-movers" />
                </span>
              </div>
            </div>
            <aside className="panel">
              <h2>Where the PageRank comes from</h2>
              <div className="who">
                <Slot view="pr-flag" as="span" id="pr-flag" className="flag" initial="🌍" />
                {" "}
                <span>
                  <Slot view="pr-name" as="strong" id="pr-name" initial="Pick a country" />
                  <br />
                  {" "}
                  <Slot view="pr-codes" as="span" id="pr-codes" className="codes" initial="—" />
                </span>
              </div>
              <Slot view="pr-stats" as="dl" id="pr-stats" className="stats" />
              <div className="corridor-list">
                <h3>→ The three senders that give it most</h3>
                <Slot view="pr-sources" as="ol" id="pr-sources" />
              </div>
              <Slot view="pr-note" as="p" id="pr-note" className="fineprint" />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
