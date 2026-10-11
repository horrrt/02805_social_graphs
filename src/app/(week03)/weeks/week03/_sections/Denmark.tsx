import { DkPicker } from "@/features/week03/denmark/DkPicker";
import { Chart } from "@/features/week03/frame/Chart";
import { EgoTable, Notice, Slot } from "@/features/week03/frame/Slot";
// 8: Denmark's corridors.
export function Denmark() {
  return (
    <>
      {/* 8 ----------------------------------------------------------- */}
      <section className="step" id="denmark">
        <div className="card">
          <div className="step-head">
            <span className="num">7</span>
            <h2>
              Let's analyse
              {" "}
              <Slot view="dk-name" as="span" className="dk-name" initial="Denmark" />
            </h2>
            <span className="year-tag">(2020 only · the null-model year)</span>
            {" "}
            <DkPicker />
          </div>
          <p className="sub">
            Denmark is where this starts because it is where we are, but the
            dropdown takes any of the 238 countries and territories in the
            table, and it follows whatever you have selected elsewhere on
            the page. Six of them have no migration figures in the
            selected year and say so instead of drawing.
          </p>
          <Slot view="dk-head" as="div" id="dk-head" className="dk-head" />
          <div className="grid2">
            <div className="plot">
              <h3>
                A.
                {" "}
                <Slot view="dk-name" as="span" className="dk-name" initial="Denmark" />
                , in and out
              </h3>
              <p className="axis-note">Migrant stock, 2020</p>
              <div className="grid2" style={{"gap":"10px"}}>
                <EgoTable id="dk-in" lead="Into" />
                <EgoTable id="dk-out" lead="Out of" />
              </div>
            </div>
            <div className="plot">
              <h3>
                B.
                {" "}
                <Slot view="dk-name" as="span" className="dk-name" initial="Denmark" />
                {" "}
                through time
              </h3>
              <p className="axis-note">Incoming and outgoing people, 1990–2024</p>
              <div className="legend">
                <span>
                  <i style={{"background":"#f2820c"}}></i>
                  {" "}
                  Incoming
                </span>
                {" "}
                <span>
                  <i style={{"background":"#6b4fbb"}}></i>
                  {" "}
                  Outgoing
                </span>
              </div>
              <Chart id="dk-time" width="440" height="330" label="Chart: Denmark through time" />
            </div>
          </div>
          <div className="grid2" style={{"marginTop":"18px"}}>
            <div className="plot">
              <h3>C. Bridge rank, 1990–2024</h3>
              <p className="axis-note">
                Where
                {" "}
                <Slot view="dk-name" as="span" className="dk-name" initial="Denmark" />
                {" "}
                sits in the world's
                betweenness ranking, year by year · 1 = top bridge
              </p>
              <Chart id="dk-rank" width="440" height="330" label="Chart: Denmark's bridge rank, 1990–2024" />
            </div>
            <div className="plot">
              <h3>D. Nearest neighbours</h3>
              <p className="axis-note">
                2020 · the four closest countries on the ground · origins,
                z-score, flight partners · click a bar
              </p>
              <Chart id="dk-nordic" width="440" height="420" label="Chart: Denmark's nearest neighbours" />
            </div>
          </div>
          <Notice id="dk-verdict" view="dk-verdict" />
        </div>
      </section>
    </>
  );
}
