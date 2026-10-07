import { GlossTerm } from "./GlossTerm";

// Hero: the text, the metro map, the inspector.
export function Hero() {
  return (
    <section className="hero w4-hero" id="top">
      <div className="shell">
        <p className="eyebrow">Week 4 · Communities &amp; backbones · Go nuts</p>
        <h1>Who hires America's foreign workers?</h1>
        <div className="w4-hero-grid">
          <div className="w4-hero-text">
            <p className="body">
              <a href="#place" style={{"color":"#ffb768"}}>Where the hiring is</a>
              ,
              which occupations travel together, which firms staff the seats,
              what changes without the biggest firms, and what the filings show
              beyond the networks, all from the same Department of Labor
              disclosures. Years are US
              {" "}
              <GlossTerm id="w4-term-top-fiscal-year" word="fiscal years">
                The US government's year runs October to September: 2025 runs from October 2024 to September 2025.
              </GlossTerm>
              .
            </p>
            <p className="caution">
              A shared employer is not a shared labour market.
            </p>
            <div className="rx-legend">
              <p className="rx-legend-title">On the map: three Louvain groups</p>
              <ul>
                <li>
                  <i className="w4-dot g0"></i>
                  <b>New York–Dallas</b>
                  <span>seven large hubs</span>
                </li>
                <li>
                  <i className="w4-dot g1"></i>
                  <b>San Jose–San Francisco</b>
                  <span>eight tech hubs</span>
                </li>
                <li>
                  <i className="w4-dot g2"></i>
                  <b>Detroit–Phoenix</b>
                  <span>the other 25</span>
                </li>
                <li>
                  <i className="rx-leg-line"></i>
                  <b>Links</b>
                  <span>kept by the disparity filter at α = 0.2</span>
                </li>
              </ul>
            </div>
            <div className="w4-hero-stats">
              <p className="w4-stat">
                <b>537,796</b>
                <span>certified H-1B filings, 2025</span>
              </p>
              <p className="w4-stat">
                <b>40</b>
                <span>metro areas with the most filings, 84.5% of the year’s total</span>
              </p>
            </div>
          </div>
          <figure className="w4-hero-stage">
            <div aria-label="Map of the 40 metro areas with the most certified H-1B filings in 2025, sized by filings and coloured by Louvain group, with the links the disparity filter keeps at alpha 0.2. Click a metro to inspect it." className="w4-hero-map" id="chart-hero-map" role="img"></div>
            <figcaption className="w4-hint">Click any metro to inspect it.</figcaption>
          </figure>
          <aside aria-label="Selected metro" aria-live="polite" className="w4-inspector" id="hero-inspector">
            <p className="w4-caps">Selected metro</p>
            <div className="w4-inspector-name">
              <b id="hero-sel-name">New York</b>
              <span id="hero-sel-codes">NY · 2025</span>
            </div>
            <span className="w4-chip">
              <i id="hero-sel-dot"></i>
              <span id="hero-sel-group">New York–Dallas group</span>
            </span>
            <dl id="hero-sel-stats"></dl>
            <div className="w4-links">
              <p className="w4-caps">Strongest links</p>
              <ol id="hero-sel-links"></ol>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
