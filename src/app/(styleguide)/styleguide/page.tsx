import PageScripts from "@/components/PageScripts";

export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="topbar">
        <div className="shell">
          <a className="brand" href="../">
            LOG–LOG
            {" "}
            <b>LEGENDS</b>
          </a>
          {" "}
          <a className="site-link" href="../#weeks">All posts</a>
          <div className="style-menu">
            <button aria-controls="style-bar" aria-expanded="false" className="style-trigger" id="style-trigger" type="button">
              <span id="style-trigger-label">View</span>
              {" "}
              <span aria-hidden="true">▾</span>
            </button>
            <div aria-label="Page style" className="style-bar" id="style-bar" role="group" hidden>
              <div className="style-group">
                <span className="style-group-label">Renderer</span>
                <div className="style-chips" role="group">
                  <button aria-pressed="true" className="style-chip" type="button">Canvas</button>
                  {" "}
                  <button aria-pressed="false" className="style-chip" type="button">D3</button>
                  {" "}
                  <button aria-pressed="false" className="style-chip" type="button">ECharts</button>
                </div>
                <select className="style-select-proxy" tabIndex={-1} aria-hidden="true">
                  <option>Canvas</option>
                </select>
              </div>
              <div className="style-group">
                <span className="style-group-label">The world</span>
                <div className="style-chips" role="group">
                  <button aria-pressed="true" className="style-chip" type="button">Photographic Earth</button>
                  {" "}
                  <button aria-pressed="false" className="style-chip" type="button">Country outlines</button>
                </div>
              </div>
              <details className="style-more">
                <summary>More options</summary>
                <div className="style-more-grid">
                  <div className="style-field">
                    <label htmlFor="style-skin">Skin</label>
                    {" "}
                    <select data-dimension="skin" id="style-skin">
                      <option value="clean">Clean</option>
                      <option value="editorial">Editorial</option>
                      <option value="terminal">Terminal</option>
                      <option value="poster">Poster</option>
                    </select>
                  </div>
                  <div className="style-field">
                    <label htmlFor="style-palette">Colours</label>
                    {" "}
                    <select data-dimension="palette" id="style-palette">
                      <option value="signal">Signal</option>
                      <option value="ember">Ember</option>
                      <option value="iris">Iris</option>
                      <option value="okabe">Okabe-Ito</option>
                      <option value="slate">Slate</option>
                    </select>
                  </div>
                  <div className="style-field">
                    <label htmlFor="style-tables">Tables</label>
                    {" "}
                    <select data-dimension="tables" id="style-tables">
                      <option value="rules">Rules</option>
                      <option value="zebra">Zebra</option>
                      <option value="cards">Cards</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
              </details>
              <p className="style-note" id="style-note">
                The same three dimensions the post offers. They set
                {" "}
                <code>data-skin</code>
                ,
                {" "}
                <code>data-palette</code>
                {" "}
                and
                {" "}
                <code>data-tables</code>
                {" "}
                on the body, exactly as the post does,
                so the whole guide repaints.
              </p>
            </div>
          </div>
          <nav aria-label="Sections of this guide" className="topnav">
            <a className="here" href="#tokens">Tokens</a>
            {" "}
            <a href="#components">Components</a>
            {" "}
            <a href="#skins">Skins</a>
            {" "}
            <a href="#palettes">Palettes</a>
          </nav>
        </div>
      </div>
      <main id="main">
        <section className="hero sg-hero" id="hero">
          <div className="shell">
            <div>
              <p className="eyebrow">Corridor Control · Style guide</p>
              <h1>
                Every part,
                <br />
                drawn once
              </h1>
              <p className="lede">What the post is made of</p>
              <p className="body">
                This page loads
                {" "}
                <code>corridor.css</code>
                , the same file the
                post loads, and shows each component under each skin, palette
                and table style. Nothing here is a copy of a style: if the guide
                and the post ever disagree, the stylesheet changed and one of
                them did not.
              </p>
              <p className="caution">Orange is always people. Blue is always access.</p>
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
                <input defaultValue="6" aria-label="A range control, as the year slider" max="7" min="0" step="1" type="range" />
                <div className="ends">
                  <span>1990</span>
                  <span>2024</span>
                </div>
                <label>
                  Year (map animation) · showing
                  {" "}
                  <b>2020</b>
                </label>
              </div>
            </div>
            <aside className="panel">
              <h2>Selected country</h2>
              <div className="who">
                <span className="flag">🇩🇰</span>
                {" "}
                <span>
                  <strong>Denmark</strong>
                  <br />
                  {" "}
                  <span className="codes">DNK · 2020</span>
                </span>
              </div>
              <dl className="stats">
                <div>
                  <dt className="explains" data-explain="People living here who were born somewhere else.">Incoming migrants (stock)</dt>
                  <dd>695,816</dd>
                </div>
                <div>
                  <dt>Origins represented</dt>
                  <dd>
                    190
                    {" "}
                    <span className="codes">(#3)</span>
                  </dd>
                </div>
                <div>
                  <dt>Betweenness</dt>
                  <dd>
                    0.01963
                    {" "}
                    <span className="codes">(#32)</span>
                  </dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>
                    <span className="chip">Connector hub</span>
                  </dd>
                </div>
              </dl>
              <div className="corridor-list">
                <h3>→ Top inbound links (corridors)</h3>
                <ol>
                  <li>
                    <span>1. Poland → Denmark</span>
                    <b>42k</b>
                  </li>
                  <li>
                    <span>2. Germany → Denmark</span>
                    <b>37.2k</b>
                  </li>
                </ol>
              </div>
              <p className="fineprint">
                The inspector panel:
                {" "}
                <code>.panel</code>
                ,
                {" "}
                <code>.who</code>
                ,
                {" "}
                <code>dl.stats</code>
                ,
                {" "}
                <code>.corridor-list</code>
                ,
                {" "}
                <code>.fineprint</code>
                .
              </p>
            </aside>
          </div>
        </section>
        <div className="shell">
          <p aria-live="polite" className="status-line">
            <code>.status-line</code>
            {" "}
            · 236 countries · 8,792 migration links · 4,331 flight links
          </p>
          <section className="step" id="tokens">
            <div className="card">
              <div className="step-head">
                <span className="num">1</span>
                <h2>Tokens</h2>
                <span className="year-tag">
                  (custom properties on
                  {" "}
                  <code>.corridor</code>
                  )
                </span>
              </div>
              <p className="sub">
                Twelve values. The two network colours carry meaning and only the
                palette dropdown moves them; a skin may touch the rest and nothing
                else.
              </p>
              <div className="sg-swatches">
                <div className="sg-swatch">
                  <i style={{"background":"var(--people)"}}></i>
                  <code>--people</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--people-soft)"}}></i>
                  <code>--people-soft</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--access)"}}></i>
                  <code>--access</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--access-soft)"}}></i>
                  <code>--access-soft</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--dtu)"}}></i>
                  <code>--dtu</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--deep)"}}></i>
                  <code>--deep</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--ink)"}}></i>
                  <code>--ink</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--ink-soft)"}}></i>
                  <code>--ink-soft</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--ink-mute)"}}></i>
                  <code>--ink-mute</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--ground)"}}></i>
                  <code>--ground</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--card)"}}></i>
                  <code>--card</code>
                </div>
                <div className="sg-swatch">
                  <i style={{"background":"var(--line)"}}></i>
                  <code>--line</code>
                </div>
              </div>
              <div className="grid2" style={{"marginTop":"18px"}}>
                <div>
                  <p className="sg-label">Type ramp · system sans on the clean skin, tabular numerals everywhere</p>
                  <div className="sg-ramp">
                    <span style={{"fontSize":"var(--fs-display)","fontWeight":"800","letterSpacing":"-0.03em"}}>54/800</span>
                    <small>hero headline</small>
                  </div>
                  <div className="sg-ramp">
                    <span style={{"fontSize":"var(--fs-h2)","fontWeight":"700"}}>30/700</span>
                    <small>section heading</small>
                  </div>
                  <div className="sg-ramp">
                    <span style={{"fontSize":"var(--fs-h3)","fontWeight":"800","letterSpacing":"-0.02em"}}>22/800</span>
                    <small>panel title</small>
                  </div>
                  <div className="sg-ramp">
                    <span style={{"fontSize":"var(--fs-body)","color":"var(--ink-soft)"}}>13.5/400</span>
                    <small>body</small>
                  </div>
                  <div className="sg-ramp">
                    <span style={{"fontSize":"var(--fs-small)","color":"var(--ink-soft)"}}>12.5/400</span>
                    <small>notices, status, fineprint</small>
                  </div>
                  <div className="sg-ramp">
                    <span style={{"fontSize":"var(--fs-caption)","fontWeight":"800","letterSpacing":"0.1em","textTransform":"uppercase"}}>11.5/800 caps</span>
                    <small>labels, chips, eyebrows</small>
                  </div>
                  <div className="sg-ramp">
                    <span style={{"fontSize":"var(--fs-caption)","color":"var(--ink-mute)"}}>11.5/400</span>
                    <small>axis ticks and chart notes</small>
                  </div>
                </div>
                <div>
                  <p className="sg-label">
                    Surface ·
                    {" "}
                    <code>--radius</code>
                    {" "}
                    on cards, 10px inside them, 999px on pills, one two-layer shadow
                  </p>
                  <div className="sg-row">
                    <div className="card" style={{"width":"84px","height":"56px","padding":"0"}}></div>
                    <div className="fact" style={{"width":"84px","height":"56px"}}></div>
                    <span className="chip">pill</span>
                  </div>
                  <p className="sg-label" style={{"marginTop":"14px"}}>
                    Rhythm · section gap 26px, card padding 20px 22px, grid gap 18px, shell 1180px with a 24px gutter
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="step" id="components">
            <div className="card">
              <div className="step-head">
                <span className="num">2</span>
                <h2>Components</h2>
                <span className="year-tag">(every class the post uses)</span>
              </div>
              <p className="sub">
                Each is the real markup with the real class. The labels above
                them name the class so you can find it in the stylesheet.
              </p>
              <div className="grid2">
                <div className="sg-stack">
                  <div>
                    <p className="sg-label">
                      <code>.step-head</code>
                      {" "}
                      ·
                      {" "}
                      <code>.num</code>
                      {" "}
                      ·
                      {" "}
                      <code>.year-tag</code>
                    </p>
                    <div className="step-head">
                      <span className="num">3</span>
                      <h2>Popular ≠ bridge</h2>
                      <span className="year-tag">(analysis year: 2020)</span>
                    </div>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.chip</code>
                      {" "}
                      ·
                      {" "}
                      <code>.eg-chip</code>
                      {" "}
                      ·
                      {" "}
                      <code>.eg-all</code>
                    </p>
                    <div className="sg-row">
                      <span className="chip">Destination hub</span>
                      {" "}
                      <button className="eg-chip" type="button">USA</button>
                      {" "}
                      <button className="eg-chip" type="button">SAU</button>
                      {" "}
                      <button className="eg-all" type="button">See all 13 →</button>
                    </div>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.toggle</code>
                      {" "}
                      ·
                      {" "}
                      <code>.axis-modes</code>
                      {" "}
                      ·
                      {" "}
                      <code>select</code>
                    </p>
                    <div className="sg-row">
                      <div className="toggle" role="group">
                        <button aria-pressed="true" type="button">Both</button>
                        {" "}
                        <button aria-pressed="false" type="button">Migration</button>
                        {" "}
                        <button aria-pressed="false" type="button">Flights</button>
                      </div>
                      <div className="axis-modes" role="group">
                        <button aria-pressed="true" data-mode="loglog" type="button">log–log</button>
                        {" "}
                        <button aria-pressed="false" data-mode="loglin" type="button">log–lin</button>
                        {" "}
                        <button aria-pressed="false" data-mode="linear" type="button">linear</button>
                      </div>
                      <select aria-label="A country picker">
                        <option>Denmark</option>
                        <option>Germany</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.qa-controls</code>
                      {" "}
                      ·
                      {" "}
                      <code>.qa-slider</code>
                      {" "}
                      ·
                      {" "}
                      <code>.qa-slider-now</code>
                    </p>
                    <div className="qa-controls">
                      <label htmlFor="sg-qa-year">Year</label>
                      <div className="qa-slider">
                        <input defaultValue="7" aria-label="A year slider" id="sg-qa-year" max="7" min="0" step="1" type="range" />
                        <div className="ends">
                          <span>1990</span>
                          <span>2024</span>
                        </div>
                      </div>
                      <b className="qa-slider-now">2024</b>
                    </div>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.type-strip</code>
                      {" "}
                      ·
                      {" "}
                      <code>.type-slice</code>
                    </p>
                    <div className="type-strip">
                      <span className="type-slice" style={{"width":"6%","background":"#0d6b3a29","color":"#0d6b3a"}}>13</span>
                      {" "}
                      <span className="type-slice" style={{"width":"4%","background":"#9a520529","color":"#9a5205"}}>9</span>
                      {" "}
                      <span className="type-slice" style={{"width":"23%","background":"#46618a29","color":"#46618a"}}>Leaf 53</span>
                      {" "}
                      <span className="type-slice" style={{"width":"67%","background":"#46618a29","color":"#46618a"}}>Mixed 141</span>
                    </div>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.chart-table</code>
                      {" "}
                      ·
                      {" "}
                      <code>.chart-table-scroll</code>
                      {" "}
                      ·
                      {" "}
                      <code>.num</code>
                    </p>
                    <details className="chart-table" open>
                      <summary>Table: what sits under every chart</summary>
                      <div className="chart-table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th scope="col">Partners</th>
                              <th scope="col" className="num">In-degree</th>
                              <th scope="col" className="num">Flight degree</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <th scope="row">1</th>
                              <td className="num">0</td>
                              <td className="num">1</td>
                            </tr>
                            <tr>
                              <th scope="row">2</th>
                              <td className="num">3</td>
                              <td className="num">3</td>
                            </tr>
                            <tr>
                              <th scope="row">3–4</th>
                              <td className="num">12</td>
                              <td className="num">5</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.echart</code>
                      {" "}
                      ·
                      {" "}
                      <code>.tall</code>
                      {" "}
                      ·
                      {" "}
                      <code>.wide</code>
                    </p>
                    <div className="echart wide tall calendar grid closures" style={{"height":"90px","display":"grid","placeItems":"center","border":"1px dashed var(--line)","borderRadius":"10px"}}>
                      <span className="fineprint">
                        Where section 10 mounts an ECharts view.
                        {" "}
                        <code>.tall</code>
                        {" "}
                        is 640px,
                        {" "}
                        <code>.wide</code>
                        {" "}
                        460px; shown short here.
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.notice</code>
                      {" "}
                      ·
                      {" "}
                      <code>.ico</code>
                    </p>
                    <div className="notice">
                      <span className="ico">💡</span>
                      {" "}
                      <span>
                        <b>Denmark, in one line.</b>
                        {" "}
                        It ranks #63 of 236 by foreign-born residents and #32 as a bridge.
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.facts</code>
                      {" "}
                      ·
                      {" "}
                      <code>.fact</code>
                    </p>
                    <div className="facts">
                      <div className="fact">
                        <dt>People</dt>
                        <dd>11,279,561</dd>
                      </div>
                      <div className="fact">
                        <dt>Distance</dt>
                        <dd>1,899 km</dd>
                      </div>
                      <div className="fact">
                        <dt>Routes</dt>
                        <dd>164</dd>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.dk-head</code>
                      {" "}
                      ·
                      {" "}
                      <code>.metric</code>
                      {" "}
                      ·
                      {" "}
                      <code>.explains</code>
                      {" "}
                      ·
                      {" "}
                      <code>.dk-name</code>
                    </p>
                    <div className="step-head">
                      <span className="num">8</span>
                      <h2>
                        Let's analyse
                        {" "}
                        <span className="dk-name">Denmark</span>
                      </h2>
                    </div>
                    <div className="dk-head">
                      <div className="who">
                        <span className="flag">🇩🇰</span>
                        <span>
                          <strong>Denmark</strong>
                          <br />
                          <span className="codes">DNK · 2020</span>
                        </span>
                      </div>
                      <div className="metric explains" data-explain="People living here who were born somewhere else.">
                        <span>Incoming</span>
                        <b>695,816</b>
                      </div>
                      <div className="metric">
                        <span>Betweenness</span>
                        <b>#32</b>
                      </div>
                      <div className="metric">
                        <span>z-score</span>
                        <b>−1.23</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sg-stack">
                  <div>
                    <p className="sg-label">
                      <code>.type</code>
                      {" "}
                      ·
                      {" "}
                      <code>.badge</code>
                      {" "}
                      ·
                      {" "}
                      <code>.eg</code>
                    </p>
                    <article className="type" data-type="human-bridge" style={{"maxWidth":"300px"}}>
                      <div className="badge" style={{"background":"#e7dcfb","color":"#5b3a9e"}}>⇄</div>
                      <h3 style={{"color":"#5b3a9e"}}>Human bridge</h3>
                      <p>Top tenth for betweenness and a z-score of +2 or more.</p>
                      <p className="eg">
                        4 countries
                        <br />
                        Examples:
                        {" "}
                        <button className="eg-chip" type="button">SSD</button>
                        {" "}
                        <button className="eg-chip" type="button">SDN</button>
                      </p>
                      <button className="eg-all" type="button">See all 4 →</button>
                    </article>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.type-drawer</code>
                      {" "}
                      ·
                      {" "}
                      <code>.drawer-head</code>
                      {" "}
                      ·
                      {" "}
                      <code>.drawer-table</code>
                      {" "}
                      ·
                      {" "}
                      <code>.drawer-note</code>
                      {" "}
                      ·
                      {" "}
                      <code>.drawer-close</code>
                    </p>
                    <aside className="type-drawer" style={{"position":"static"}}>
                      <div className="drawer-head">
                        <div>
                          <b>Human bridge</b>
                          {" "}
                          · 4 countries
                        </div>
                        <button className="drawer-close" type="button">Close</button>
                      </div>
                      <table className="drawer-table">
                        <thead>
                          <tr>
                            <th>Country</th>
                            <th>Incoming</th>
                            <th>Origins</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>South Sudan</td>
                            <td>882,000</td>
                            <td>13</td>
                          </tr>
                          <tr>
                            <td>Sudan</td>
                            <td>1,376,000</td>
                            <td>21</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="drawer-note">Ranked by incoming migrants. Click a row to select it.</p>
                    </aside>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.qa</code>
                      {" "}
                      ·
                      {" "}
                      <code>.qa-cue</code>
                      {" "}
                      ·
                      {" "}
                      <code>.qa-body</code>
                      {" "}
                      ·
                      {" "}
                      <code>.qa-item</code>
                      {" "}
                      ·
                      {" "}
                      <code>.qa-answer</code>
                    </p>
                    <details className="qa" open>
                      <summary>
                        <span className="qa-cue">Here you can learn more</span>
                      </summary>
                      <div className="qa-body">
                        <article className="qa-item">
                          <h3>1 · A question</h3>
                          <p className="qa-answer">
                            And its answer, at
                            {" "}
                            <b>13.5px</b>
                            {" "}
                            in a 68ch column.
                          </p>
                        </article>
                      </div>
                    </details>
                  </div>
                  <div>
                    <p className="sg-label">
                      <code>.chart-tip</code>
                      {" "}
                      ·
                      {" "}
                      <code>.legend</code>
                      {" "}
                      ·
                      {" "}
                      <code>.axis-note</code>
                    </p>
                    <div className="sg-row">
                      <div className="chart-tip sg-tip">
                        <b>South Sudan</b>
                        <span>13 origins · #160</span>
                        <span>betweenness #17</span>
                      </div>
                      <div className="legend">
                        <span>
                          <i style={{"background":"var(--people)"}}></i>
                          In-degree
                        </span>
                        <span>
                          <i style={{"background":"var(--ink)"}}></i>
                          Out-degree
                        </span>
                        <span>
                          <i style={{"background":"var(--access)"}}></i>
                          Flight degree
                        </span>
                      </div>
                    </div>
                    <p className="axis-note">Betweenness vs origins · click any point</p>
                  </div>
                </div>
              </div>
              <div className="grid2" style={{"marginTop":"18px"}}>
                <div>
                  <p className="sg-label">
                    <code>.edgebar</code>
                    {" "}
                    · two selects, an arrow, a chip
                  </p>
                  <div className="edgebar">
                    <select aria-label="Origin country">
                      <option>Mexico</option>
                    </select>
                    {" "}
                    <span aria-hidden="true">→</span>
                    {" "}
                    <select aria-label="Destination country">
                      <option>United States</option>
                    </select>
                    {" "}
                    <span className="chip">Both</span>
                  </div>
                </div>
                <div>
                  <p className="sg-label">
                    <code>.map-wrap</code>
                    {" "}
                    ·
                    {" "}
                    <code>.map-tools</code>
                    {" "}
                    · the twin map's frame
                  </p>
                  <div className="map-wrap">
                    <div className="map-tools">
                      <div className="toggle" role="group">
                        <button aria-pressed="false" type="button">Migration</button>
                        {" "}
                        <button aria-pressed="false" type="button">Flights</button>
                        {" "}
                        <button aria-pressed="true" type="button">Both</button>
                      </div>
                    </div>
                    <canvas height="160" width="320"></canvas>
                  </div>
                </div>
              </div>
              <div className="grid-side" style={{"marginTop":"18px"}}>
                <div className="plot">
                  <h3>
                    <code>.grid-side</code>
                    {" "}
                    · a wide plot beside a narrow panel
                  </h3>
                  <p className="axis-note">The layout section 3 uses</p>
                  <canvas className="chart" height="160" width="760"></canvas>
                </div>
                <aside className="panel">
                  <h2>Beside it</h2>
                  <dl className="stats">
                    <div>
                      <dt>k (in)</dt>
                      <dd>190</dd>
                    </div>
                    <div>
                      <dt>Rank</dt>
                      <dd>#32</dd>
                    </div>
                  </dl>
                </aside>
              </div>
              <div className="grid-pair" style={{"marginTop":"18px"}}>
                <div>
                  <div className="plot">
                    <h3>
                      <code>.grid-pair</code>
                      {" "}
                      · two linked visuals side by side
                    </h3>
                    <p className="axis-note">Sections 4 and 5 share a row</p>
                    <canvas className="chart" height="160" width="440"></canvas>
                  </div>
                  <aside className="panel pair-aside">
                    <h2>
                      <code>.pair-aside</code>
                    </h2>
                    <p className="fineprint" style={{"border":"0","padding":"0"}}>Notes under each visual.</p>
                  </aside>
                </div>
                <div>
                  <div className="map-wrap">
                    <canvas height="160" width="440"></canvas>
                  </div>
                  <aside className="panel pair-aside">
                    <h2>Twin notes</h2>
                    <dl className="stats">
                      <div>
                        <dt>Layer</dt>
                        <dd>Both</dd>
                      </div>
                    </dl>
                  </aside>
                </div>
              </div>
              <div className="grid3" style={{"marginTop":"18px"}}>
                <div className="plot">
                  <h3>
                    A.
                    {" "}
                    <code>.plot</code>
                    {" "}
                    with
                    {" "}
                    <code>.chart</code>
                  </h3>
                  <p className="axis-note">A canvas the scripts draw into</p>
                  <canvas className="chart" height="200" width="440"></canvas>
                </div>
                <div className="plot">
                  <h3>
                    B.
                    {" "}
                    <code>table.ego</code>
                  </h3>
                  <p className="axis-note">Migrant stock, 2020</p>
                  <table className="ego">
                    <caption>Top links into Denmark</caption>
                    <tbody>
                    <tr>
                      <th>Origin</th>
                      <th style={{"textAlign":"right"}}>People</th>
                    </tr>
                    <tr>
                      <td>Poland</td>
                      <td>41,988</td>
                    </tr>
                    <tr>
                      <td>Germany</td>
                      <td>37,231</td>
                    </tr>
                    <tr>
                      <td>Syria</td>
                      <td>35,386</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div className="plot">
                  <h3>
                    C.
                    {" "}
                    <code>.stage-wrap</code>
                    {" "}
                    ·
                    {" "}
                    <code>.stage-hint</code>
                  </h3>
                  <p className="axis-note">The globe's frame, empty</p>
                  <div className="stage-wrap">
                    <canvas className="stage" height="200" width="300"></canvas>
                    <p className="stage-hint">Drag to spin. Click a country.</p>
                  </div>
                </div>
              </div>
              <div className="grid5" style={{"marginTop":"18px"}}>
                <div className="sg-swatch">
                  <p className="sg-label">
                    <code>.grid5</code>
                  </p>
                  <i style={{"background":"var(--line-soft)"}}></i>
                </div>
                <div className="sg-swatch">
                  <p className="sg-label">three across</p>
                  <i style={{"background":"var(--line-soft)"}}></i>
                </div>
                <div className="sg-swatch">
                  <p className="sg-label">for the</p>
                  <i style={{"background":"var(--line-soft)"}}></i>
                </div>
                <div className="sg-swatch">
                  <p className="sg-label">role</p>
                  <i style={{"background":"var(--line-soft)"}}></i>
                </div>
                <div className="sg-swatch">
                  <p className="sg-label">cards</p>
                  <i style={{"background":"var(--line-soft)"}}></i>
                </div>
              </div>
            </div>
          </section>
          <section className="step" id="skins">
            <div className="card">
              <div className="step-head">
                <span className="num">3</span>
                <h2>Skins</h2>
                <span className="year-tag">
                  (
                  <code>?skin=</code>
                  )
                </span>
              </div>
              <p className="sub">
                The same specimen under each skin. Each block is its own
                {" "}
                <code>.corridor[data-skin]</code>
                {" "}
                scope, so the stylesheet does the
                work and the guide copies nothing.
              </p>
              <div className="sg-specimens four">
                <div className="corridor sg-scope" data-skin="clean">
                  <p className="sg-name">Clean</p>
                  <div className="card">
                    <div className="step-head">
                      <span className="num">3</span>
                      <h2>Popular ≠ bridge</h2>
                    </div>
                    <p className="sub">South Sudan is 55th on arrivals and 17th on brokerage.</p>
                    <div className="sg-row">
                      <span className="chip">Mixed</span>
                      <b>6.10</b>
                    </div>
                  </div>
                </div>
                <div className="corridor sg-scope" data-skin="editorial">
                  <p className="sg-name">Editorial</p>
                  <div className="card">
                    <div className="step-head">
                      <span className="num">3</span>
                      <h2>Popular ≠ bridge</h2>
                    </div>
                    <p className="sub">South Sudan is 55th on arrivals and 17th on brokerage.</p>
                    <div className="sg-row">
                      <span className="chip">Mixed</span>
                      <b>6.10</b>
                    </div>
                  </div>
                </div>
                <div className="corridor sg-scope" data-skin="terminal">
                  <p className="sg-name">Terminal</p>
                  <div className="card">
                    <div className="step-head">
                      <span className="num">3</span>
                      <h2>Popular ≠ bridge</h2>
                    </div>
                    <p className="sub">South Sudan is 55th on arrivals and 17th on brokerage.</p>
                    <div className="sg-row">
                      <span className="chip">Mixed</span>
                      <b>6.10</b>
                    </div>
                  </div>
                </div>
                <div className="corridor sg-scope" data-skin="poster">
                  <p className="sg-name">Poster</p>
                  <div className="card">
                    <div className="step-head">
                      <span className="num">3</span>
                      <h2>Popular ≠ bridge</h2>
                    </div>
                    <p className="sub">South Sudan is 55th on arrivals and 17th on brokerage.</p>
                    <div className="sg-row">
                      <span className="chip">Mixed</span>
                      <b>6.10</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="step" id="palettes">
            <div className="card">
              <div className="step-head">
                <span className="num">4</span>
                <h2>Palettes</h2>
                <span className="year-tag">
                  (
                  <code>?palette=</code>
                  )
                </span>
              </div>
              <p className="sub">
                Only
                {" "}
                <code>--people</code>
                ,
                {" "}
                <code>--access</code>
                {" "}
                and their soft
                tints move. A chip, a key and the two swatches show it.
              </p>
              <div className="sg-specimens five">
                <div className="corridor sg-scope" data-palette="signal">
                  <p className="sg-name">Signal</p>
                  <div className="sg-row">
                    <i className="sg-swatch" style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--people)"}}></i>
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--access)"}}></i>
                    <span className="chip">chip</span>
                  </div>
                </div>
                <div className="corridor sg-scope" data-palette="ember">
                  <p className="sg-name">Ember</p>
                  <div className="sg-row">
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--people)"}}></i>
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--access)"}}></i>
                    <span className="chip">chip</span>
                  </div>
                </div>
                <div className="corridor sg-scope" data-palette="iris">
                  <p className="sg-name">Iris</p>
                  <div className="sg-row">
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--people)"}}></i>
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--access)"}}></i>
                    <span className="chip">chip</span>
                  </div>
                </div>
                <div className="corridor sg-scope" data-palette="okabe">
                  <p className="sg-name">Okabe-Ito</p>
                  <div className="sg-row">
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--people)"}}></i>
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--access)"}}></i>
                    <span className="chip">chip</span>
                  </div>
                </div>
                <div className="corridor sg-scope" data-palette="slate">
                  <p className="sg-name">Slate</p>
                  <div className="sg-row">
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--people)"}}></i>
                    <i style={{"display":"block","width":"28px","height":"28px","borderRadius":"8px","background":"var(--access)"}}></i>
                    <span className="chip">chip</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="step" id="tables">
            <div className="card">
              <div className="step-head">
                <span className="num">5</span>
                <h2>Tables</h2>
                <span className="year-tag">
                  (
                  <code>?tables=</code>
                  )
                </span>
              </div>
              <p className="sub">The same three rows under each table style. The markup never changes.</p>
              <div className="sg-specimens four">
                <div className="corridor sg-scope" data-tables="rules">
                  <p className="sg-name">Rules</p>
                  <table className="ego">
                    <tbody>
                    <tr>
                      <td>Poland</td>
                      <td>41,988</td>
                    </tr>
                    <tr>
                      <td>Germany</td>
                      <td>37,231</td>
                    </tr>
                    <tr>
                      <td>Syria</td>
                      <td>35,386</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div className="corridor sg-scope" data-tables="zebra">
                  <p className="sg-name">Zebra</p>
                  <table className="ego">
                    <tbody>
                    <tr>
                      <td>Poland</td>
                      <td>41,988</td>
                    </tr>
                    <tr>
                      <td>Germany</td>
                      <td>37,231</td>
                    </tr>
                    <tr>
                      <td>Syria</td>
                      <td>35,386</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div className="corridor sg-scope" data-tables="cards">
                  <p className="sg-name">Cards</p>
                  <table className="ego">
                    <tbody>
                    <tr>
                      <td>Poland</td>
                      <td>41,988</td>
                    </tr>
                    <tr>
                      <td>Germany</td>
                      <td>37,231</td>
                    </tr>
                    <tr>
                      <td>Syria</td>
                      <td>35,386</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div className="corridor sg-scope" data-tables="compact">
                  <p className="sg-name">Compact</p>
                  <table className="ego">
                    <tbody>
                    <tr>
                      <td>Poland</td>
                      <td>41,988</td>
                    </tr>
                    <tr>
                      <td>Germany</td>
                      <td>37,231</td>
                    </tr>
                    <tr>
                      <td>Syria</td>
                      <td>35,386</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
        <footer className="foot">
          <div className="shell">
            <span>
              Style guide for
              {" "}
              <a href="../weeks/week03/">Corridor Control</a>
              . One stylesheet,
              {" "}
              <code>docs/assets/css/corridor.css</code>
              ; a test asserts every class the post uses appears on this page.
            </span>
            {" "}
            <span>Log–Log Legends · DTU 02805</span>
          </div>
        </footer>
      </main>
      <PageScripts scripts={[{"src":"../assets/js/pages/styleguide.js","module":true}]} />
    </>
  );
}
