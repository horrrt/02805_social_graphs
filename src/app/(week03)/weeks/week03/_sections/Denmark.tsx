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
              <span className="dk-name">Denmark</span>
            </h2>
            <span className="year-tag">(2020 only · the null-model year)</span>
            {" "}
            <select aria-label="Country to analyse" id="dk-country"></select>
          </div>
          <p className="sub">
            Denmark is where this starts because it is where we are, but the
            dropdown takes any of the 238 countries and territories in the
            table, and it follows whatever you have selected elsewhere on
            the page. Six of them have no migration figures in the
            selected year and say so instead of drawing.
          </p>
          <div className="dk-head" id="dk-head"></div>
          <div className="grid2">
            <div className="plot">
              <h3>
                A.
                {" "}
                <span className="dk-name">Denmark</span>
                , in and out
              </h3>
              <p className="axis-note">Migrant stock, 2020</p>
              <div className="grid2" style={{"gap":"10px"}}>
                <table className="ego" id="dk-in">
                  <caption>
                    Into
                    {" "}
                    <span className="dk-name">Denmark</span>
                  </caption>
                </table>
                <table className="ego" id="dk-out">
                  <caption>
                    Out of
                    {" "}
                    <span className="dk-name">Denmark</span>
                  </caption>
                </table>
              </div>
            </div>
            <div className="plot">
              <h3>
                B.
                {" "}
                <span className="dk-name">Denmark</span>
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
              <canvas aria-label="Chart: Denmark through time" className="chart" height="330" id="dk-time" role="img" width="440"></canvas>
            </div>
          </div>
          <div className="grid2" style={{"marginTop":"18px"}}>
            <div className="plot">
              <h3>C. Bridge rank, 1990–2024</h3>
              <p className="axis-note">
                Where
                {" "}
                <span className="dk-name">Denmark</span>
                {" "}
                sits in the world's
                betweenness ranking, year by year · 1 = top bridge
              </p>
              <canvas aria-label="Chart: Denmark's bridge rank, 1990–2024" className="chart" height="330" id="dk-rank" role="img" width="440"></canvas>
            </div>
            <div className="plot">
              <h3>D. Nearest neighbours</h3>
              <p className="axis-note">
                2020 · the four closest countries on the ground · origins,
                z-score, flight partners · click a bar
              </p>
              <canvas aria-label="Chart: Denmark's nearest neighbours" className="chart" height="420" id="dk-nordic" role="img" width="440"></canvas>
            </div>
          </div>
          <div className="notice" id="dk-verdict">
            <span className="ico">💡</span>
            <span></span>
          </div>
        </div>
      </section>
    </>
  );
}
