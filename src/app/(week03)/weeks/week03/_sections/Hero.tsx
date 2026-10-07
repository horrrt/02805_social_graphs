// 1: the hero globe, its controls and the inspector.
export function Hero() {
  return (
    <>
      {/* 1 ------------------------------------------------------------- */}
      <section className="hero" id="globe">
        <div className="shell">
          <div>
            <p className="eyebrow">Week 3 · Who matters, and why · Go nuts</p>
            <h1>
              Corridor
              <br />
              Control
            </h1>
            <p className="lede">Global migration and flight networks</p>
            <p className="body">
              Two networks. One world. Migration is the UN count of where
              people born in one country now live, and the twin is a network
              of international flight routes, aggregated from airports to
              countries.
            </p>
            <p className="caution">
              Thick corridors are not friendship. They are people.
            </p>
            <p className="body" id="question">
              <b>What we asked:</b>
              {" "}
              which countries broker global migration
              and asylum, and is that the same as which countries simply
              have the most people moving through them?
            </p>
            <div className="keys">
              <span className="key people">
                <i></i>
                {" "}
                Migration (people)
              </span>
              {" "}
              <span className="key access">
                <i></i>
                {" "}
                Flights (access)
              </span>
            </div>
            <div className="yearline">
              <input defaultValue="6" aria-label="Year of the migration snapshot" id="year-slider" max="7" min="0" step="1" type="range" />
              <div className="ends">
                <span>1990</span>
                <span>2024</span>
              </div>
              <label htmlFor="year-slider">
                Year · moves the globe, the map, both distributions and the
                panels · showing
                {" "}
                <b id="year-now">2020</b>
              </label>
            </div>
          </div>
          <div className="stage-wrap">
            <canvas aria-label="Globe of the countries and the migration corridors between them" className="stage" height="900" id="globe-canvas" role="img" width="900"></canvas>
            <p className="stage-hint">
              Drag to spin. Click a country to inspect it.
            </p>
          </div>
          <aside className="panel" id="inspector">
            <h2>Selected country</h2>
            <div className="who">
              <span className="flag" id="sel-flag">🌍</span>
              {" "}
              <span>
                <strong id="sel-name">Pick a country</strong>
                <br />
                {" "}
                <span className="codes" id="sel-codes">—</span>
              </span>
            </div>
            <dl className="stats" id="sel-stats"></dl>
            <div className="corridor-list">
              <h3>→ Where they came from</h3>
              <ol id="sel-in"></ol>
            </div>
            <div className="corridor-list">
              <h3>→ Where they went</h3>
              <ol id="sel-out"></ol>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
