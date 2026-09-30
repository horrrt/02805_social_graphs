import PageScripts from "@/components/PageScripts";

export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="topbar">
        <div className="shell">
          <a className="brand" href="../../">
            LOG–LOG
            {" "}
            <b>LEGENDS</b>
          </a>
          {" "}
          <a className="site-link" href="../../#weeks">All posts</a>
          <nav className="topnav" aria-label="Sections of this post">
            <a href="#opening">Opening</a>
            {" "}
            <a className="here" href="#place">Where</a>
            {" "}
            <a href="#jobs">Jobs</a>
            {" "}
            <a href="#who">Staffing</a>
            {" "}
            <a href="#footprint">Giants out</a>
            {" "}
            <a href="#beyond">Beyond</a>
            {" "}
            <a href="#cut">Deep dive</a>
          </nav>
        </div>
      </div>
      <main id="main">
        {/* Hero: the text, the metro map, the inspector ------------------ */}
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
                  <span className="w4-term">
                    <button aria-describedby="w4-term-top-fiscal-year" type="button">fiscal years</button>
                    <span className="w4-pop" id="w4-term-top-fiscal-year" role="tooltip">
                      The US government's year runs October to September: 2025 runs from October 2024 to September 2025.
                    </span>
                  </span>
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
        {/* The section rail: the numbers down the left margin ---------- */}
        <nav aria-label="Contents of this post" className="w4-rail">
          <ol>
            <li data-target="opening">
              <a aria-label="Opening" href="#opening">
                <span aria-hidden="true" className="w4-rail-label">Opening</span>
              </a>
            </li>
            <li data-target="place">
              <a aria-label="Where the hiring is" href="#place">
                <span aria-hidden="true" className="w4-rail-label">Where the hiring is</span>
              </a>
              <ol>
                <li data-target="place-who">
                  <a aria-label="Do cities group by who hires there instead of by region?" href="#place-who">
                    <span aria-hidden="true" className="w4-rail-label">Do cities group by who hires there instead of by region?</span>
                  </a>
                </li>
                <li data-target="place-break">
                  <a aria-label="Where does the backbone break, and whose links hold it?" href="#place-break">
                    <span aria-hidden="true" className="w4-rail-label">Where does the backbone break, and whose links hold it?</span>
                  </a>
                </li>
              </ol>
            </li>
            <li data-target="jobs">
              <a aria-label="Which jobs go together" href="#jobs">
                <span aria-hidden="true" className="w4-rail-label">Which jobs go together</span>
              </a>
              <ol>
                <li data-target="jobs-split">
                  <a aria-label="Do outsourcing firms bundle jobs differently from direct employers?" href="#jobs-split">
                    <span aria-hidden="true" className="w4-rail-label">Do outsourcing firms bundle jobs differently from direct employers?</span>
                  </a>
                </li>
                <li data-target="jobs-linkcom">
                  <a aria-label="Does any job belong to two clusters at once?" href="#jobs-linkcom">
                    <span aria-hidden="true" className="w4-rail-label">Does any job belong to two clusters at once?</span>
                  </a>
                </li>
              </ol>
            </li>
            <li data-target="who">
              <a aria-label="Who staffs whom" href="#who">
                <span aria-hidden="true" className="w4-rail-label">Who staffs whom</span>
              </a>
              <ol>
                <li data-target="who-switch">
                  <a aria-label="When a client changes its main vendor, does it stay in its group?" href="#who-switch">
                    <span aria-hidden="true" className="w4-rail-label">When a client changes its main vendor, does it stay in its group?</span>
                  </a>
                </li>
                <li data-target="who-movers">
                  <a aria-label="Which clients change group when filing counts are ignored?" href="#who-movers">
                    <span aria-hidden="true" className="w4-rail-label">Which clients change group when filing counts are ignored?</span>
                  </a>
                </li>
                <li data-target="who-overlap">
                  <a aria-label="Which clients sit in two groups at once?" href="#who-overlap">
                    <span aria-hidden="true" className="w4-rail-label">Which clients sit in two groups at once?</span>
                  </a>
                </li>
              </ol>
            </li>
            <li data-target="footprint">
              <a aria-label="Without the biggest firms" href="#footprint">
                <span aria-hidden="true" className="w4-rail-label">Without the biggest firms</span>
              </a>
              <ol>
                <li data-target="footprint-which">
                  <a aria-label="Which firm hides the regions?" href="#footprint-which">
                    <span aria-hidden="true" className="w4-rail-label">Which firm hides the regions?</span>
                  </a>
                </li>
              </ol>
            </li>
            <li data-target="beyond">
              <a aria-label="Beyond the three networks" href="#beyond">
                <span aria-hidden="true" className="w4-rail-label">Beyond the three networks</span>
              </a>
              <ol>
                <li data-target="beyond-law">
                  <a aria-label="Do immigration law firms split companies the way vendors do?" href="#beyond-law">
                    <span aria-hidden="true" className="w4-rail-label">Do immigration law firms split companies the way vendors do?</span>
                  </a>
                </li>
                <li data-target="beyond-perm">
                  <a aria-label="Do outsourcing firms sponsor fewer green cards?" href="#beyond-perm">
                    <span aria-hidden="true" className="w4-rail-label">Do outsourcing firms sponsor fewer green cards?</span>
                  </a>
                </li>
                <li data-target="beyond-wage">
                  <a aria-label="Do outsourcing firms file at lower wage levels for the same job?" href="#beyond-wage">
                    <span aria-hidden="true" className="w4-rail-label">Do outsourcing firms file at lower wage levels for the same job?</span>
                  </a>
                </li>
              </ol>
            </li>
            <li data-target="closing">
              <a aria-label="Closing" href="#closing">
                <span aria-hidden="true" className="w4-rail-label">Closing</span>
              </a>
            </li>
            <li data-target="cut">
              <a aria-label="Deep dive" href="#cut">
                <span aria-hidden="true" className="w4-rail-label">Deep dive</span>
              </a>
              <ol>
                <li data-target="topic-where">
                  <a aria-label="Where the hiring is" href="#topic-where">
                    <span aria-hidden="true" className="w4-rail-label">Where the hiring is</span>
                  </a>
                </li>
                <li data-target="topic-jobs">
                  <a aria-label="Jobs and skills" href="#topic-jobs">
                    <span aria-hidden="true" className="w4-rail-label">Jobs and skills</span>
                  </a>
                </li>
                <li data-target="topic-outsourcing">
                  <a aria-label="Outsourcing firms and their clients" href="#topic-outsourcing">
                    <span aria-hidden="true" className="w4-rail-label">Outsourcing firms and their clients</span>
                  </a>
                </li>
                <li data-target="topic-paperwork">
                  <a aria-label="Paperwork, the lottery and green cards" href="#topic-paperwork">
                    <span aria-hidden="true" className="w4-rail-label">Paperwork, the lottery and green cards</span>
                  </a>
                </li>
                <li data-target="topic-years">
                  <a aria-label="Five years" href="#topic-years">
                    <span aria-hidden="true" className="w4-rail-label">Five years</span>
                  </a>
                </li>
                <li data-target="evidence">
                  <a aria-label="Data and methods" href="#evidence">
                    <span aria-hidden="true" className="w4-rail-label">Data and methods</span>
                  </a>
                </li>
              </ol>
            </li>
          </ol>
        </nav>
        {/* Five sections, five findings ------------------------------------ */}
        <div className="shell">
          <section aria-label="Five findings" className="w4-findings" id="findings">
            <div className="w4-findings-head">
              <p className="w4-caps">Five sections, five findings</p>
              <div className="w4-key">
                <span>
                  <i className="w4-key-real"></i>
                  the real network
                </span>
                <span>
                  <i className="w4-key-band"></i>
                  random baseline, mean ± 1 sd
                </span>
              </div>
            </div>
            <div className="w4-finding">
              <span className="w4-num">1</span>
              <div>
                <h3>Where the hiring is</h3>
                <p>
                  Cities group by who hires there, not by region, and no single link holds the map together.
                </p>
              </div>
              <div className="w4-mini" data-finding="1"></div>
              <a href="#place">Section 1 →</a>
            </div>
            <div className="w4-finding">
              <span className="w4-num">2</span>
              <div>
                <h3>Which jobs go together</h3>
                <p>Employers reveal bundles of work.</p>
              </div>
              <div className="w4-mini" data-finding="2"></div>
              <a href="#jobs">Section 2 →</a>
            </div>
            <div className="w4-finding">
              <span className="w4-num">3</span>
              <div>
                <h3>Who staffs whom</h3>
                <p>
                  One certified H-1B filing in five names a client company as the worksite. Yet a client that changes
                  {" "}
                  <span className="w4-term">
                    <button aria-describedby="w4-term-findings-vendor" type="button">vendor</button>
                    <span className="w4-pop" id="w4-term-findings-vendor" role="tooltip">
                      An outsourcing firm that files the H-1B and places the worker at another company, its client. Elsewhere the page also calls it a placing firm.
                    </span>
                  </span>
                  {" "}
                  stays inside its group far more often than chance.
                </p>
              </div>
              <div className="w4-mini" data-finding="3"></div>
              <a href="#who">Section 3 →</a>
            </div>
            <div className="w4-finding">
              <span className="w4-num">4</span>
              <div>
                <h3>Without the biggest firms</h3>
                <p>
                  Take out the largest filers, Amazon above all, and the metro groups start to follow Census regions; the job clusters shift but hold.
                </p>
              </div>
              <div className="w4-mini" data-finding="4"></div>
              <a href="#footprint">Section 4 →</a>
            </div>
            <div className="w4-finding">
              <span className="w4-num">5</span>
              <div>
                <h3>Beyond the three networks</h3>
                <p>
                  The section 3 groups barely show in lawyers or green cards; the outsourcing firms stand out in the wage levels they file.
                </p>
              </div>
              <div className="w4-mini" data-finding="5"></div>
              <a href="#beyond">Section 5 →</a>
            </div>
          </section>
        </div>
        <div className="shell">
          <p aria-live="polite" className="status-line" id="place-status">
            Loading place data…
          </p>
          {/* Opening ----------------------------------------------------- */}
          <section className="step" id="opening">
            <header className="w4-opener">
              <span aria-hidden="true" className="w4-opener-num">0</span>
              <div>
                <h2>Opening</h2>
                <p>
                  An H-1B filing is an employer’s request to hire a non-US worker in a
                  {" "}
                  <span className="w4-term">
                    <button aria-describedby="w4-term-opening-specialty" type="button">specialty occupation</button>
                    <span className="w4-pop" id="w4-term-opening-specialty" role="tooltip">
                      A job that needs at least a bachelor’s degree in a specific field, such as engineering or accounting.
                    </span>
                  </span>
                  .
                </p>
              </div>
            </header>
            <div className="card w4-card">
              <div className="w4-two">
                <div>
                  <p className="sub">
                    It names the job, the worksite, the wage and the company asking
                    to employ the worker. The Department of Labor records the filing
                    even when the worker never arrives, changes employer or is not hired.
                  </p>
                  <p className="sub">
                    <b>Why start with companies?</b>
                    {" "}
                    The employer is the thread linking the three networks in this story.
                  </p>
                  <div className="notice">
                    <span className="ico">!</span>
                    {" "}
                    <span>
                      <b>Read the scope carefully</b>
                      {" "}
                      These are visa-sponsored filings, not all hiring in America.
                    </span>
                  </div>
                  <p className="w4-scope-note">
                    Unless stated otherwise, the figures below use
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-opening-certified" type="button">certified</button>
                      <span className="w4-pop" id="w4-term-opening-certified" role="tooltip">The Department of Labor accepted the filing. Only then can the employer take it forward.</span>
                    </span>
                    {" "}
                    H-1B
                    filings in 2025. One filing is a request, not a guaranteed job.
                  </p>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          A job title tells us what work is requested; a company tells us which jobs, places, and clients are connected by the same hiring system. The links mean shared filings. They say nothing about friendships between workers or companies.
                        </p>
                        <p>
                          The filings leave out workers without H-1B sponsorship, employers that never file, rejected or withdrawn applications, and the wider conditions that shape who gets hired.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
                <div>
                  <div className="w4-anatomy">
                    <h3>What one filing names</h3>
                    <p>Each section builds its network from one of these fields.</p>
                    <dl>
                      <div>
                        <dt>Employer</dt>
                        <dd>The company asking to hire</dd>
                        <span className="w4-tag access">Links all three networks</span>
                      </div>
                      <div>
                        <dt>Worksite</dt>
                        <dd>A city, grouped into its metro area</dd>
                        <span className="w4-tag">1 · Where</span>
                      </div>
                      <div>
                        <dt>Occupation</dt>
                        <dd>The job, as an official occupation code</dd>
                        <span className="w4-tag">2 · Jobs</span>
                      </div>
                      <div>
                        <dt>Client</dt>
                        <dd>The company the worker is placed at, when it is not the employer</dd>
                        <span className="w4-tag">3 · Staffing</span>
                      </div>
                      <div>
                        <dt>Wage level</dt>
                        <dd>I (entry) to IV (fully competent)</dd>
                        <span className="w4-tag">5 · Beyond</span>
                      </div>
                      <div>
                        <dt>Law firm</dt>
                        <dd>Who prepared the filing</dd>
                        <span className="w4-tag">5 · Beyond</span>
                      </div>
                    </dl>
                  </div>
                  <div className="w4-howto">
                    <h3>How to read the charts</h3>
                    <div>
                      <i className="w4-sw-real"></i>
                      <b>The real network</b>
                      <span>What the filings show.</span>
                    </div>
                    <div>
                      <i className="w4-sw-band"></i>
                      <b>Random baseline</b>
                      <span>Mean and one standard deviation over rewired networks or random draws.</span>
                    </div>
                    <div>
                      <i className="w4-sw-people"></i>
                      <b>Placed at a client</b>
                      <span>Filings that put the worker at another company.</span>
                    </div>
                    <div>
                      <i className="w4-sw-access"></i>
                      <b>Direct employer</b>
                      <span>Filings for the employer’s own site.</span>
                    </div>
                    <div>
                      <i className="w4-sw-ref"></i>
                      <b>Reference</b>
                      <span>The full network, or equal odds.</span>
                    </div>
                    <div>
                      <i className="w4-sw-groups">
                        <b className="g0"></b>
                        <b className="g1"></b>
                        <b className="g2"></b>
                      </i>
                      <b>Metro groups</b>
                      <span>Violet, green and slate mark the three Louvain groups, on maps only.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* ============================================================ */}
          {" "}
          {/* Where the hiring is · companies × cities (Track C methods)   */}
          {" "}
          {/* ============================================================ */}
          <section className="step" id="place">
            <header className="w4-opener">
              <span aria-hidden="true" className="w4-opener-num">1</span>
              <div>
                <h2>Where the hiring is</h2>
                <p>Cities group by who hires there, and no single link holds the map together.</p>
              </div>
            </header>
            <div className="w4-two w4-intro">
              <div>
                <p className="sub">
                  The cities are the 40 metro areas with the most filings, 84.5% of
                  the year's total.
                  {" "}
                  <span className="w4-term">
                    <button aria-describedby="w4-term-place-louvain" type="button">Louvain</button>
                    <span className="w4-pop" id="w4-term-place-louvain" role="tooltip">
                      A method that finds groups by moving each node into the neighbouring group that raises modularity most, then merging the groups and repeating until no move helps. It starts from a random order, so two runs can differ.
                    </span>
                  </span>
                  {" "}
                  splits them into three groups, and the split is weak
                  but real:
                  {" "}
                  <span className="w4-term">
                    <button aria-describedby="w4-term-place-modularity" type="button">modularity</button>
                    <span className="w4-pop" id="w4-term-place-modularity" role="tooltip">
                      How much more of the link weight falls inside the groups than a random network with the same number of links per node would put there. Higher means sharper groups.
                    </span>
                  </span>
                  {" "}
                  0.049 against 0.013 for
                  {" "}
                  <span className="w4-term">
                    <button aria-describedby="w4-term-place-rewired" type="button">rewired networks</button>
                    <span className="w4-pop" id="w4-term-place-rewired" role="tooltip">
                      A random copy of the network in which every node keeps its number of partners, but the partners are dealt out again at random.
                    </span>
                  </span>
                  {" "}
                  (
                  <span className="w4-term">
                    <button aria-describedby="w4-term-place-z" type="button">z</button>
                    <span className="w4-pop" id="w4-term-place-z" role="tooltip">
                      How many standard deviations the real value sits from the random baseline’s mean. Beyond about 2 either way is rare by chance.
                    </span>
                  </span>
                  {" "}
                  = 29).
                </p>
                <div className="w4-example">
                  <svg aria-hidden="true" height="150" viewBox="0 0 250 150" width="250">
                    <line className="w4-ex-edge" strokeWidth="2.4" x1="125" x2="52" y1="34" y2="112"></line>
                    <line className="w4-ex-edge" strokeWidth="1.4" x1="125" x2="198" y1="34" y2="112"></line>
                    <path className="w4-ex-link" d="M52 112 Q125 150 198 112" strokeDasharray="5 4" strokeWidth="2.2"></path>
                    <rect className="w4-ex-company" height="26" rx="6" width="50" x="100" y="16"></rect>
                    <text className="w4-ex-on-ink" x="125" y="33">Company</text>
                    <circle className="w4-ex-node" cx="52" cy="112" r="13"></circle>
                    <circle className="w4-ex-node" cx="198" cy="112" r="13"></circle>
                    <text className="w4-ex-letter" x="52" y="116">A</text>
                    <text className="w4-ex-letter" x="198" y="116">B</text>
                    <text className="w4-ex-count" textAnchor="end" x="70" y="66">12 filings</text>
                    <text className="w4-ex-count" textAnchor="start" x="180" y="66">5 filings</text>
                    <text className="w4-ex-gain" x="125" y="146">link A–B gains 5</text>
                  </svg>
                  <p>
                    <b>How two metros get linked</b>
                    An example, not data. A company that files in both metros adds the smaller of its two filing counts to their link.
                  </p>
                </div>
                <div className="rx-drawers rx-foot">
                  <details className="rx-drawer">
                    <summary>Background</summary>
                    <div className="rx-drawer-body">
                      <p>
                        Louvain splits the 40 metros into seven large hubs led by New York and Dallas, eight tech hubs led by San Jose and San Francisco, and the other 25. The rewired networks keep each company's number of metros. The two questions below ask what the groups follow and where the network comes apart.
                      </p>
                    </div>
                  </details>
                  <details className="rx-drawer">
                    <summary>Method</summary>
                    <div className="rx-drawer-body">
                      <p>
                        Two metros are linked when the same company files in both; the link weighs, summed over those companies, the smaller of the company's two filing counts.
                      </p>
                    </div>
                  </details>
                </div>
              </div>
              <figure className="w4-figure">
                <figcaption>
                  <b>Weak but real</b>
                  <span>The groups against rewired networks in which each company keeps its number of metros.</span>
                </figcaption>
                <div className="w4-figure-body" data-strip="place-modularity"></div>
              </figure>
            </div>
            <div className="draft-banner" id="place-draft-banner" hidden>
              <b>Scaffold.</b>
              {" "}
              Charts run on placeholder geography while the real numbers are
              readied.
            </div>
            {/* Start · Which cities hire the most? Is it one market? ------- */}
            <div className="card w4-card" id="place-start">
              <header className="w4-q">
                <span className="w4-num">Start</span>
                <div>
                  <p className="rx-kicker">The opening questions, side by side, before 1A</p>
                </div>
              </header>
              <div className="rx-start-grid">
                <div id="place-rank">
                  <header className="w4-q">
                    <div>
                      <h2>Which cities hire the most?</h2>
                      <p className="w4-answer">San Jose asks for the most positions; New York has the most employers.</p>
                    </div>
                  </header>
                  <p className="sub">
                    Toggle the metric; click a bar or a bubble to inspect one city.
                  </p>
                  <div className="axis-modes" role="group" aria-label="Rank cities by">
                    <button aria-pressed="true" data-place-metric="positions" type="button">
                      Positions
                    </button>
                    {" "}
                    <button aria-pressed="false" data-place-metric="employers" type="button">
                      Employers
                    </button>
                  </div>
                  <div className="plot">
                    <h3>Top cities</h3>
                    <p className="axis-note">
                      Ranked by the active metric. Click a bar to select that city
                      everywhere on this page.
                    </p>
                    <div className="chart-host tall" id="chart-rank"></div>
                  </div>
                </div>
                <div id="place-regions">
                  <header className="w4-q">
                    <div>
                      <h2>Is it one national job market or several regional ones?</h2>
                      <p className="w4-answer">Not regional markets: the two hub groups cross regions.</p>
                    </div>
                  </header>
                  <div className="rx-groups" id="place-groups">
                    <div className="rx-group" data-community="1">
                      <div className="rx-group-head">
                        <i style={{"background":"var(--w4-group-1)"}}></i>
                        <b>Eight tech hubs</b>
                        <span>led by San Jose and San Francisco</span>
                      </div>
                      <p></p>
                    </div>
                    <div className="rx-group" data-community="0">
                      <div className="rx-group-head">
                        <i style={{"background":"var(--w4-group-0)"}}></i>
                        <b>Seven large hubs</b>
                        <span>led by New York and Dallas</span>
                      </div>
                      <p></p>
                    </div>
                    <div className="rx-group" data-community="2">
                      <div className="rx-group-head">
                        <i style={{"background":"var(--w4-group-2)"}}></i>
                        <b>The other 25</b>
                        <span>from Detroit and Phoenix down</span>
                      </div>
                      <p></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rx-start-notices">
                <div className="notice">
                  <span className="ico">💡</span>
                  {" "}
                  <span>
                    <b>What to notice</b>
                    {" "}
                    San Jose's 48,692 filings request 124,265 positions, and Google files one in ten of them.
                    New York files more (65,935) from three times as many employers (12,711).
                  </span>
                </div>
                <div className="notice">
                  <span className="ico">💡</span>
                  {" "}
                  <span>
                    <b>What to notice</b>
                    {" "}
                    The split is real but weak: modularity 0.049 against 0.013 for rewired networks; Louvain finds it in 65 of 100 runs.
                  </span>
                </div>
              </div>
              <div className="rx-drawers rx-foot">
                <details className="rx-drawer">
                  <summary>Background</summary>
                  <div className="rx-drawer-body">
                    <p className="sub">A position is a seat an employer asks to fill, not a worker who arrived.</p>
                    <p className="sub">
                      Louvain splits the large hubs into two groups, which cross regions, and leaves the smaller metros as a third.
                    </p>
                    <p className="sub">
                      The map shows the partition Louvain finds most often, and every number below is computed on it. The null rewires the company × metro network so each company and each metro keeps its number of partners, deals the filing counts back out at random, and projects it again:
                    </p>
                    <table className="ego">
                      <tbody id="place-null-stats"></tbody>
                    </table>
                    <p className="sub">
                      One group holds New York, Dallas, Atlanta, Chicago, Houston, Philadelphia and Charlotte. The other holds San Jose, San Francisco, Seattle, Los Angeles, San Diego, Austin, Boston and Washington. The 25 smaller metros form the third. Modularity is 0.049 against 0.013 for rewired networks that keep each company's number of metros (z = 29).
                    </p>
                    <p className="sub">
                      Louvain finds the split shown in 65 of 100 runs; the other 35 find one other split, into two groups. 2024 gives that two-group split in all 100 runs, so it matches the split shown here at
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-place-start-nmi" type="button">NMI</button>
                        <span className="w4-pop" id="w4-term-place-start-nmi" role="tooltip">
                          Normalized mutual information: how alike two groupings are, from 0 for unrelated to 1 for the same.
                        </span>
                      </span>
                      {" "}
                      0.64, against 1.00 between two 2025 runs.
                    </p>
                    <p className="sub">
                      NMI with Census regions is 0.14 and with divisions 0.21. Infomap, which follows a random walk between metros instead of counting links, finds no split at all: one module holds all 40.
                    </p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>Method</summary>
                  <div className="rx-drawer-body">
                    <p>A filing counts once in each metro it names, with at most the positions it requests.</p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>More numbers</summary>
                  <div className="rx-drawer-body">
                    <p>
                      Census regions and divisions match it no better than shuffled labels (
                      <span className="w4-term">
                        <button aria-describedby="w4-term-place-start-p" type="button">p</button>
                        <span className="w4-pop" id="w4-term-place-start-p" role="tooltip">
                          The share of shuffled labellings that match at least as well as the real one. A small value means the match is unlikely to be chance.
                        </span>
                      </span>
                      {" "}
                      = 0.10 and 0.11).
                    </p>
                    <p>
                      In Seattle one company, Amazon, files 31%. Positions reward a few firms asking for many seats; employer counts reward a broad market.
                    </p>
                    <p>
                      San Jose averages 2.6 positions per filing, New York 1.5. New York's largest filer, EY, has under 4%.
                    </p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>Maps: groups and Census regions</summary>
                  <div className="rx-drawer-body">
                    <p className="sub">Toggle Louvain communities against Census regions on the same map.</p>
                    <div className="axis-modes" role="group" aria-label="Colour cities by">
                      <button aria-pressed="true" data-place-region="communities" type="button">
                        Communities
                      </button>
                      {" "}
                      <button aria-pressed="false" data-place-region="census" type="button">
                        Census regions
                      </button>
                    </div>
                    <div className="region-legend" id="place-region-legend"></div>
                    <div className="plot" style={{"marginTop":"18px"}}>
                      <h3>On the map</h3>
                      <p className="axis-note">
                        The 48 contiguous states; none of the 40 metros lies outside
                        them. Bubbles are sized by requested positions; colour and
                        opacity follow the active metric. Each metro sits at its
                        first-named city. Click a bubble to select it.
                      </p>
                      <div className="chart-host map" id="chart-citymap"></div>
                    </div>
                    <div className="plot">
                      <h3>Same cities, two labelings</h3>
                      <p className="axis-note">
                        The same map, coloured by the active labelling. Communities are
                        named after their two largest metros. Click a city to select
                        it.
                      </p>
                      <div className="chart-host map" id="chart-regions"></div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
            {/* A · Who hires, not where --------------------------------- */}
            <div className="card w4-card" id="place-who">
              <header className="w4-q">
                <span className="w4-num">1A</span>
                <div>
                  <h2>Do cities group by who hires there instead of by region?</h2>
                  <p className="w4-answer">By who hires.</p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">
                    The groups follow how much of a city's hiring runs through consulting and IT-services firms.
                  </p>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      The IT-services share matches the groups at AMI 0.17 (p = 0.002)
                      and the
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-place-who-placed" type="button">placed share</button>
                        <span className="w4-pop" id="w4-term-place-who-placed" role="tooltip">
                          The share of a metro’s filings that put the worker at a client company instead of the employer’s own site.
                        </span>
                      </span>
                      {" "}
                      at 0.12 (p = 0.012); Census regions and divisions do no better than chance.
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          We gave each metro four labels: its Census region, its Census division, the third it falls in by the share of its filings that place a worker at a client, and the third it falls in by the share filed by professional and technical services firms (NAICS 54, the sector of IT consultancies). Thirds, because 35 of the 40 metros have that sector as their largest, so "largest sector" says almost nothing. AMI corrects for the number of labels, so four regions and three thirds compare fairly.
                        </p>
                        <p>
                          AMI for each labelling of the 40 metros; the p-value is the share of 1,000 shuffles of that labelling that match at least as well.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>The match is modest: most of what makes two metros alike stays unexplained.</p>
                        <p>
                          Seven of the eight tech-hub metros sit in the lowest third by placed share: there, companies mostly hire for themselves. In the New York–Dallas group the median metro places 27% of its filings at a client and files 60% through IT-services firms.
                        </p>
                        <p>
                          Census regions reach 0.06 (p = 0.11) and divisions 0.06 (p = 0.08), no better than chance.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="plot">
                  <h3>How well each labelling matches the Louvain groups</h3>
                  <p className="axis-note">
                    Each bar is the
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-place-who-ami" type="button">AMI</button>
                      <span className="w4-pop" id="w4-term-place-who-ami" role="tooltip">
                        Adjusted mutual information: how alike two groupings are, corrected for chance. 0 means no better than labels dealt at random, 1 means the same grouping.
                      </span>
                    </span>
                    {" "}
                    between
                    the Louvain groups and one labelling.
                    Orange bars describe who hires, grey bars where the city is.
                  </p>
                  <div className="chart-host short" id="chart-where-who"></div>
                </div>
              </div>
            </div>
            {/* B · Where the backbone breaks ------------------------------- */}
            <div className="card w4-card" id="place-break">
              <header className="w4-q">
                <span className="w4-num">1B</span>
                <div>
                  <h2>Where does the backbone break, and whose links hold it?</h2>
                  <p className="w4-answer">Nowhere in one place: metros drop off one or two at a time.</p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">
                    We removed the links one by one, least significant
                    first by
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-place-alpha" type="button">α</button>
                      <span className="w4-pop" id="w4-term-place-alpha" role="tooltip">
                        The disparity filter's threshold. The filter keeps a link only when its weight is larger than chance would give, judged against each metro's own total, and α is the chance it allows. A lower α keeps fewer links. The links that survive form the backbone.
                      </span>
                    </span>
                    , and watched the largest piece after each removal.
                  </p>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      Of the 16 links whose removal cuts a metro loose, the five largest
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-place-break-placing" type="button">placing firms</button>
                        <span className="w4-pop" id="w4-term-place-break-placing" role="tooltip">Companies that file for workers and then place them at a client company’s site.</span>
                      </span>
                      {" "}
                      lead 5 (31%), no more than their share of the whole
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-place-break-backbone" type="button">backbone</button>
                        <span className="w4-pop" id="w4-term-place-break-backbone" role="tooltip">
                          The links the disparity filter keeps because they carry more weight than chance would give.
                        </span>
                      </span>
                      {" "}
                      (38%, p = 0.37).
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Every pair of the 40 metros shares some employer, so the full network is one hairball of 780 links.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          The disparity filter keeps a link when it carries an unusually large share of either metro's total weight; α is the test's threshold, and a smaller α keeps fewer links.
                        </p>
                        <p>
                          Each step is one or more links removed. The shaded band is the range from α = 0.1 to 0.05 where the five-value sweep saw the drop.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          The big outsourcing firms hold no more of the links that cut metros loose than of any others.
                        </p>
                        <p>
                          The other eleven are led by Amazon (three), Intel, Deloitte, Capital One, JPMorgan Chase, Citigroup, FedEx, Fidelity Investments and the University of Maryland.
                        </p>
                        <p>
                          The first metro falls off at α = 0.136. Tried at five values, the largest piece of the map fell from 32 metros at α = 0.1 to 18 at α = 0.05, which looks like one snap. The fall from 32 to 18 is 14 separate links, each peeling one metro away.
                        </p>
                        <p>
                          The five placing firms lead 69 of the 180 links in the whole backbone at α = 0.2 (38%), so their 5 of the 16 links that cut a metro loose is no more than their share (p = 0.37).
                        </p>
                        <p>
                          No single removal cuts off more than two metros: Dallas–Durham at α = 0.041 takes Durham and Raleigh with it, and New York–Seattle at 0.023 splits the last five metros three and two.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Table: 14 links that peel metros off</summary>
                      <div className="rx-drawer-body">
                        <table className="ego">
                          <thead>
                            <tr>
                              <th>Link</th>
                              <th style={{"textAlign":"right"}}>α</th>
                              <th style={{"textAlign":"right"}}>Weight</th>
                              <th>Leading company</th>
                              <th style={{"textAlign":"right"}}>Its share</th>
                            </tr>
                          </thead>
                          <tbody id="where-break-links"></tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="plot">
                  <h3>Metros in the largest piece as the filter tightens</h3>
                  <p className="axis-note">
                    Read right to left: as α
                    falls, links go and metros drop out of the largest connected
                    piece.
                  </p>
                  <div className="chart-host short" id="chart-where-break"></div>
                </div>
              </div>
            </div>
          </section>
          {/* Jobs · Track B ---------------------------------------------- */}
          <section className="step" id="jobs">
            <header className="w4-opener">
              <span aria-hidden="true" className="w4-opener-num">2</span>
              <div>
                <h2>Which jobs go together</h2>
                <p>Employers reveal bundles of work.</p>
              </div>
            </header>
            <div className="card w4-card">
              <div className="w4-two">
                <div>
                  <p className="sub">
                    Two occupations are linked when the same companies file for both.
                    The clusters across all
                    {" "}
                    <span data-jobs="occupations">…</span>
                    {" "}
                    occupations are real:
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-jobs-modularity" type="button">modularity</button>
                      <span className="w4-pop" id="w4-term-jobs-modularity" role="tooltip">
                        A score for how much more a network links inside its clusters than chance would. Higher means cleaner clusters.
                      </span>
                    </span>
                    {" "}
                    <span data-jobs="null-real">…</span>
                    {" "}
                    against
                    {" "}
                    <span data-jobs="null-null">…</span>
                    {" "}
                    for
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-jobs-rewired" type="button">rewired networks</button>
                      <span className="w4-pop" id="w4-term-jobs-rewired" role="tooltip">
                        Random copies of the network in which every company keeps its number of occupations. They show how much clustering chance alone produces.
                      </span>
                    </span>
                    .
                  </p>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Software developers sit in almost every company's mix, so most links run through them. The two questions below test the clusters from two sides: do outsourcing firms and direct employers bundle jobs the same way, and does any job belong to two bundles at once?
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
                <figure className="w4-figure">
                  <figcaption>
                    <b>Real, not noise</b>
                    <span>
                      Occupation clusters against rewired networks in which every company keeps its number of occupations.
                    </span>
                  </figcaption>
                  <div className="w4-figure-body" data-strip="jobs-modularity"></div>
                </figure>
              </div>
            </div>
            <p aria-live="polite" className="status-line" id="jobs-status">Loading job data…</p>
            <div className="card jobs-card w4-card" id="jobs-together">
              <header className="w4-q">
                <span className="w4-num">Start</span>
                <div>
                  <h2>Which jobs are hired together?</h2>
                  <p className="w4-answer">
                    Software Developers sit in 8 of the 12 pairs because almost every sponsoring company hires them.
                  </p>
                </div>
              </header>
              <p className="sub">
                Each bar is one pair of jobs that the same companies hire for. Its length counts the companies that filed for both; the dark bars are pairs with Software Developers.
              </p>
              <div className="plot">
                <h3>The 12 most common job pairs</h3>
                <div className="w4-figure-body" id="chart-job-pairs"></div>
              </div>
            </div>
            <div className="card w4-card" id="jobs-split">
              <header className="w4-q">
                <span className="w4-num">2A</span>
                <div>
                  <h2>Do outsourcing firms bundle jobs differently from direct employers?</h2>
                  <p className="w4-answer">Yes. Their job clusters differ more than those of random groups matched on size.</p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">
                    Each group gets its own occupation network and its own
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-jobs-split-louvain" type="button">Louvain</button>
                      <span className="w4-pop" id="w4-term-jobs-split-louvain" role="tooltip">
                        A standard method that splits a network into groups whose members link more to each other than to the rest.
                      </span>
                    </span>
                    {" "}
                    clusters.
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-jobs-split-nmi" type="button">NMI</button>
                      <span className="w4-pop" id="w4-term-jobs-split-nmi" role="tooltip">
                        Normalized mutual information: a score for how alike two groupings are, 1 when they match exactly and 0 when they are unrelated.
                      </span>
                    </span>
                    {" "}
                    says how alike the two clusterings are.
                  </p>
                </div>
                <div>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      The two clusterings agree at NMI 0.42. Random groups
                      matched on size agree at 0.61 ± 0.04 (z = −4.2).
                    </span>
                  </div>
                </div>
              </div>
              <div className="rx-fig-row">
                <div className="plot">
                  <h3>Do outsourcers cluster jobs like random firms would?</h3>
                  <p className="axis-note">
                    Bars show how alike the two groups' job clusters are. Whiskers
                    span one standard deviation.
                  </p>
                  <div className="w4-figure-body" id="chart-jobs-split-nmi"></div>
                </div>
                <div className="plot">
                  <h3>The largest occupations in each group</h3>
                  <p className="axis-note">
                    Share of each group's filings, for the eight occupations with
                    the most filings overall.
                  </p>
                  <div className="chart-host" id="chart-jobs-split-mix"></div>
                </div>
              </div>
              <div className="rx-drawers rx-foot">
                <details className="rx-drawer">
                  <summary>Method</summary>
                  <div className="rx-drawer-body">
                    <p>
                      We split the companies in two: the 817 firms that place 20 or more filings at client sites (21% of all filings) and the 58,379 others. Alone, that number means little: splitting companies into a small and a large group changes the clusters even if nobody behaves differently. So the baseline draws 20 random groups that match the outsourcing firms in both respects: the same number of companies of each size, from the one-filing firms to the giants. NMI is measured on the 217 occupations that sit in a cluster of two or more on both sides.
                    </p>
                    <p>
                      The random groups have the same number of companies and the same share of filings as the outsourcing firms. Whiskers span one standard deviation over 20 random splits. Only the blue baseline matches the outsourcing firms on both number and size of companies, so it is the fair comparison.
                    </p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>More numbers</summary>
                  <div className="rx-drawer-body">
                    <p>
                      The half-matched baselines show why the match matters: random groups with only the same number of companies hold 1.3% of filings and agree at 0.43 ± 0.09, which would have hidden the difference. At the top the two mixes look alike: software developers are 28% of the outsourcing firms' filings and 33% of the direct employers'. Below that they part: "computer occupations, all other" is 22% of the outsourcing firms' filings and 5% of the direct employers', and direct employers file for 276 occupations the outsourcing firms never touch.
                    </p>
                  </div>
                </details>
              </div>
            </div>
            <div className="card w4-card" id="jobs-linkcom">
              <header className="w4-q">
                <span className="w4-num">2B</span>
                <div>
                  <h2>Does any job belong to two clusters at once?</h2>
                  <p className="w4-answer">
                    Not clearly. On a network this dense, link communities pour almost everything into one cluster.
                  </p>
                </div>
              </header>
              <p className="sub">
                Link
                communities (Ahn, Bagrow and Lehmann, 2010) group the links
                instead, so a job belongs to every community its links are in.
              </p>
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>What to notice</b>
                  {" "}
                  Two methods give two different lists of small
                  occupations, so we cannot name a job that clearly sits in two
                  clusters.
                </span>
              </div>
              <div className="w4-two">
                <figure className="w4-figure">
                  <figcaption>
                    <b>Where the links go</b>
                    <span>Link communities pour almost every link into one community.</span>
                  </figcaption>
                  <div className="w4-figure-body" id="chart-jobs-linkcom-share"></div>
                </figure>
                <figure className="w4-figure">
                  <figcaption>
                    <b>The 15 jobs with the most communities per link</b>
                    <span>
                      Each dot is a job; dashed lines mark equal rates. Rings: the three jobs section 2's first test flagged as bridges.
                    </span>
                  </figcaption>
                  <div className="w4-figure-body" id="chart-jobs-linkcom-scatter"></div>
                </figure>
              </div>
              <div className="rx-drawers rx-foot">
                <details className="rx-drawer">
                  <summary>Background</summary>
                  <div className="rx-drawer-body">
                    <p>A Louvain partition puts every job in exactly one cluster.</p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>Method</summary>
                  <div className="rx-drawer-body">
                    <p>
                      The cut is chosen where partition density D, the average of how close each community is to a complete one, peaks. On the 28,096 links between 494 occupations it peaks at D = 0.57 with one community holding 85% of the links; 117 communities have three links or more, counting it.
                    </p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>More numbers</summary>
                  <div className="rx-drawer-body">
                    <p>
                      The top is small occupations such as communications equipment operators and electrical power-line installers (5 communities over 11 links each). Only 3 of the 6 occupations that section 2's first test flagged as bridges appear in it: credit counselors, licensed practical and licensed vocational nurses, and physical therapist aides.
                    </p>
                    <p>
                      A job's number of communities mostly counts its links (Spearman 0.84), so the table ranks by communities per link, as the course suggests.
                    </p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>Table: 15 jobs in the most communities</summary>
                  <div className="rx-drawer-body">
                    <table className="ego">
                      <thead>
                        <tr>
                          <th>Occupation</th>
                          <th style={{"textAlign":"right"}}>Links</th>
                          <th style={{"textAlign":"right"}}>Communities</th>
                          <th style={{"textAlign":"right"}}>Per link</th>
                        </tr>
                      </thead>
                      <tbody id="jobs-linkcom-table"></tbody>
                    </table>
                  </div>
                </details>
              </div>
            </div>
          </section>
          {/* Staffing · Track A ------------------------------------------ */}
          <section className="step" id="who">
            <header className="w4-opener">
              <span aria-hidden="true" className="w4-opener-num">3</span>
              <div>
                <h2>Who staffs whom</h2>
                <p>
                  One certified H-1B filing in five names a client company as the worksite. Against a random baseline clients group only weakly, yet a client that changes vendor stays inside its group far more often than chance.
                </p>
              </div>
            </header>
            <div className="card w4-card">
              <div className="w4-two">
                <div>
                  <p className="sub">
                    Counted once per link, the
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-who-louvain" type="button">Louvain</button>
                      <span className="w4-pop" id="w4-term-who-louvain" role="tooltip">
                        A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get. It starts from a random order, so two runs can differ.
                      </span>
                    </span>
                    {" "}
                    groups beat
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-who-rewired" type="button">rewired networks</button>
                      <span className="w4-pop" id="w4-term-who-rewired" role="tooltip">
                        Random copies of the network in which every firm and client keeps its number of partners, but the partners are dealt out again at random.
                      </span>
                    </span>
                    {" "}
                    on
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-who-modularity" type="button">modularity</button>
                      <span className="w4-pop" id="w4-term-who-modularity" role="tooltip">
                        How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
                      </span>
                    </span>
                    {" "}
                    (0.57 against 0.53) and match each client's main vendor (
                    <span className="w4-term">
                      <button aria-describedby="w4-term-who-ami" type="button">AMI</button>
                      <span className="w4-pop" id="w4-term-who-ami" role="tooltip">
                        Adjusted mutual information: how closely two ways of grouping the same clients agree, corrected for the agreement random labels would reach by chance.
                      </span>
                    </span>
                    {" "}
                    0.11) a little better than its industry (0.07).
                  </p>
                </div>
                <div>
                  <div className="w4-anatomy w4-anatomy--pair">
                    <h3>Words in this section</h3>
                    <dl>
                      <div>
                        <dt>Vendor</dt>
                        <dd>
                          An outsourcing firm that files the H-1B and places the worker at another company, its client. Elsewhere the page also calls it a placing firm.
                        </dd>
                      </div>
                      <div>
                        <dt>Main vendor</dt>
                        <dd>The vendor that files most of a client's placements in a year.</dd>
                      </div>
                      <div>
                        <dt>Switch</dt>
                        <dd>
                          A year in which a client's main vendor changes, counted for clients with five or more filings in both years.
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="rx-fig-row">
                <figure className="w4-figure">
                  <figcaption>
                    <b>Weak groups, beyond chance</b>
                    <span>
                      Modularity against rewired networks that keep each firm's and client's number of partners; AMI with each client's main vendor and its industry.
                    </span>
                  </figcaption>
                  <div className="w4-figure-body" data-strip="who-modularity"></div>
                </figure>
                <figure className="w4-figure">
                  <figcaption>
                    <b>One client, many vendors</b>
                    <span>
                      The client's largest staffing firms by filings in the year; link width is filings placed there. Pick a year or type any client.
                    </span>
                  </figcaption>
                  <div className="w4-figure-body" data-strip="who-ego"></div>
                </figure>
              </div>
              <div className="rx-drawers rx-foot">
                <details className="rx-drawer">
                  <summary>Background</summary>
                  <div className="rx-drawer-body">
                    <p>
                      Here the network links an outsourcing firm to each client company where it places workers, and a link weighs the filings between them.
                    </p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>Method</summary>
                  <div className="rx-drawer-body">
                    <p>
                      Louvain runs on the largest connected piece: 21,759 firms and clients, 41,212 links. The rewired networks keep every firm's and client's number of partners. The three questions below ask whether the groups behave like markets.
                    </p>
                  </div>
                </details>
              </div>
            </div>
            <div className="card w4-card" id="who-q1">
              <header className="w4-q">
                <span className="w4-num">Start</span>
                <div>
                  <h2>How many workers sit at a client?</h2>
                  <p className="w4-answer">In 2025, 104,732 of the 537,796 certified filings (19.5%) mark a client site.</p>
                </div>
              </header>
              <p className="sub">
                A filing is a request to employ someone, not a hire. Every year from 2022 on, USCIS denied placing firms about twice the share of first-time petitions it denied direct employers.
              </p>
              <div className="rx-fig-row">
                <figure className="w4-figure">
                  <figcaption>
                    <b>The lottery funnel</b>
                    <span>
                      The March 2023 draw: registrations spent per approved petition, and the share of drawn tickets that became a petition, by kind of employer.
                    </span>
                  </figcaption>
                  <div className="w4-vis-stack">
                    <div className="w4-figure-body" data-strip="who-q1-funnel-registrations"></div>
                    <div className="w4-figure-body" data-strip="who-q1-funnel-petitions"></div>
                  </div>
                </figure>
                <figure className="w4-figure">
                  <figcaption>
                    <b>A filing, a client, a denial</b>
                    <span>
                      The orange bar is the share involving a client company; the dot is placing firms' USCIS denial rate, the dashed line direct employers'.
                    </span>
                  </figcaption>
                  <div className="w4-vis-stack">
                    <div className="w4-figure-body" data-strip="who-q1-split"></div>
                    <div className="w4-figure-body" data-strip="who-q1-denial"></div>
                  </div>
                </figure>
              </div>
              <div className="rx-drawers rx-foot">
                <details className="rx-drawer">
                  <summary>Method</summary>
                  <div className="rx-drawer-body">
                    <p>
                      The worksites file lists every client a filing names; we leave out the 16% of client entries that name no company, such as "Home Address", and the 1,881 where a firm names itself. Counted that way, 101,763 filings (18.9%) name a client company: the worker is employed by one company and works at another, down from 21.9% in 2022.
                    </p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>More numbers</summary>
                  <div className="rx-drawer-body">
                    <p>
                      USCIS denied 2.7% of placing firms' first-time petitions against 1.2% for direct employers in 2022, and 3.4% against 2.0% from October 2025 to June 2026. The lottery shows the same split one step earlier. Each new H-1B worker starts as a registration that USCIS draws at random, and USCIS gave Bloomberg News every registration from the March 2023 draw after a FOIA lawsuit. Every petition that followed names its filing, so we can follow a ticket to its client. Direct employers sent 5.1 registrations per approved petition, placing firms 9.1, and firms with fewer than 20 filings 12.2; those small firms sent 53% of the 758,967 registrations. Most of the gap is drawn tickets nobody used. When USCIS drew a direct employer's registration, a petition followed 76% of the time; a placing firm's, 50%; a small firm's, 35%. That step carries 74% of the gap between placing and direct firms, and the draw itself 24%. Much of it comes from workers registered by several employers: 54% of registrations named one, and when USCIS drew one, a petition followed 23% of the time, against 81% for a worker registered once. 18,307 of the petitions lead to a client company. Citigroup received the most, 342 through 38 firms.
                    </p>
                  </div>
                </details>
              </div>
            </div>
            {/* A · Does a client stay in its group? ------------------- */}
            <div className="card w4-card" id="who-switch">
              <header className="w4-q">
                <span className="w4-num">3A</span>
                <div>
                  <h2>When a client changes its main vendor, does it stay in its group?</h2>
                  <p className="w4-answer">Yes, nearly eight times as often as for a random vendor.</p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">A client's main vendor is the firm that files most placements there in a year.</p>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      Pooled over the three pairs of years, 26.5% of switches stay in the group against 3.2% ± 0.5% for random vendors (
                      <span className="w4-term">
                        <button aria-describedby="w4-term-who-switch-z" type="button">z</button>
                        <span className="w4-pop" id="w4-term-who-switch-z" role="tooltip">How many standard deviations the real value sits from the random baseline’s mean.</span>
                      </span>
                      {" "}
                      = 47).
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>A switch is a year in which that firm changes.</p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          We followed the clients with five or more filings in two consecutive years and found 1,261 switches of main vendor between 2022 and 2025. For each, we asked whether the new vendor sat in the client's Louvain group of the earlier year.
                        </p>
                        <p>
                          The baseline draws a new vendor at random, a large firm as often as its filings make it likely. The chart's grey bars are the baseline's mean over 1,000 draws.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          One switch in four stays inside the client's group. Much of that is familiarity: 62% of new main vendors already placed someone at the client the year before.
                        </p>
                        <p>
                          A stricter baseline that draws only among the firms already at the client narrows the gap to 26.8% against 20.8% ± 0.7% (z = 9), a lift of 1.29 rather than 8.3.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="plot">
                  <h3>Switches that stay inside the client's group</h3>
                  <p className="axis-note">
                    Share of switches whose new main vendor is in the client's group of the earlier year, for each pair of years. Grey bars are the baseline; whiskers span one standard deviation.
                  </p>
                  <div className="chart-host short" id="chart-who-switch"></div>
                </div>
              </div>
            </div>
            {/* B · Movers when weights are ignored ---------------------- */}
            <div className="card w4-card" id="who-movers">
              <header className="w4-q">
                <span className="w4-num">3B</span>
                <div>
                  <h2>Which clients change group when filing counts are ignored?</h2>
                  <p className="w4-answer">Two in three, but much of that is Louvain's own noise.</p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">
                    We ran Louvain with links weighted by filings and with every link counting one, and called a client a mover when its group changed.
                  </p>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      64.4% of clients move between the weighted and unweighted
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-who-movers-partition" type="button">partitions</button>
                        <span className="w4-pop" id="w4-term-who-movers-partition" role="tooltip">One split of every firm and client into groups, as a single Louvain run gives it.</span>
                      </span>
                      . Two runs of the same kind move fewer: a median 33.3% between two weighted seeds and 53.1% between two unweighted ones.
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Two runs of the same kind with different
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-who-movers-seeds" type="button">seeds</button>
                            <span className="w4-pop" id="w4-term-who-movers-seeds" role="tooltip">The random starting point of a Louvain run. Different seeds can give different groups.</span>
                          </span>
                          {" "}
                          set the noise floor.
                        </p>
                        <p>
                          We matched each weighted group to the unweighted group it overlaps most, and called a client a mover when its matched group changed. All three bars use the same matching of groups.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          The medians come from ten pairs of seeds each (ranges 26.8% to 39.3% and 49.4% to 55.9%). We expected the movers to be clients with several vendors, since only their filing counts can pull them one way or another. They are, but barely: 31.8% of movers have two or more vendors, against 26.8% of all clients. The largest movers are the largest clients: Citigroup sits with Tata Consultancy Services when filings count and with EY when they do not; Bank of America moves from Infosys' group to IBM's.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Table: 15 largest movers</summary>
                      <div className="rx-drawer-body">
                        <table className="ego">
                          <thead>
                            <tr>
                              <th>Client</th>
                              <th style={{"textAlign":"right"}}>Filings</th>
                              <th style={{"textAlign":"right"}}>Vendors</th>
                              <th>Group, weighted</th>
                              <th>Group, unweighted</th>
                            </tr>
                          </thead>
                          <tbody id="who-movers-table"></tbody>
                        </table>
                        <p className="fineprint">A group is named after its largest firm.</p>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="plot">
                  <h3>Share of clients that change group</h3>
                  <p className="axis-note">
                    The first two bars compare two seeds of the same kind; the third compares the weighted partition with the unweighted one.
                  </p>
                  <div className="chart-host short" id="chart-who-movers"></div>
                </div>
              </div>
            </div>
            {/* C · Split loyalties ------------------------------------- */}
            <div className="card w4-card" id="who-overlap">
              <header className="w4-q">
                <span className="w4-num">3C</span>
                <div>
                  <h2>Which clients sit in two groups at once?</h2>
                  <p className="w4-answer">
                    1,823 clients get a fifth or more of their filings from a second group, fewer than in rewired networks.
                  </p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">
                    A Louvain partition gives each client one group, but a client with several vendors can draw on firms from different groups.
                  </p>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      The rewired networks give 2,154 ± 20 split clients (z = −16): real clients draw on fewer groups than chance.
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body"></div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          We counted clients whose second group supplies at least 20% of their filings, and did the same on 100 rewired networks in which every firm keeps its number of clients and every client keeps its filing counts, only attached to different firms. Louvain builds the groups from these filing counts, so it already tends to put a client with its heaviest vendors; and rewired networks split into different groups from the real one. Read the count as the groups following clients' main suppliers, not as a separate measure of loyalty.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          The largest split clients are banks, insurers and manufacturers. USAA gets 44% of its filings from HCL's group and 26% from Tata Consultancy Services'; Stellantis 46% from L&amp;T Technology Services' group and 34% from Tata Consultancy Services'.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Table: 15 largest split clients</summary>
                      <div className="rx-drawer-body">
                        <table className="ego">
                          <thead>
                            <tr>
                              <th>Client</th>
                              <th style={{"textAlign":"right"}}>Filings</th>
                              <th>First group</th>
                              <th>Second group</th>
                              <th>Main vendor</th>
                            </tr>
                          </thead>
                          <tbody id="who-overlap-table"></tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="plot">
                  <h3>Clients split between two groups</h3>
                  <p className="axis-note">
                    The count for the real network against the mean of 100 rewired networks; the whisker spans one standard deviation.
                  </p>
                  <div className="chart-host short" id="chart-who-overlap"></div>
                </div>
              </div>
            </div>
          </section>
          {/* Closing ----------------------------------------------------- */}
          {" "}
          {/* Without the biggest firms ------------------------------------ */}
          <section className="step" id="footprint">
            <header className="w4-opener">
              <span aria-hidden="true" className="w4-opener-num">4</span>
              <div>
                <h2>Without the biggest firms</h2>
                <p>
                  Take out the largest filers, Amazon above all, and the metro groups start to follow Census regions; the job clusters shift but hold.
                </p>
              </div>
            </header>
            <div className="w4-two w4-intro">
              <div>
                <p className="sub">
                  The ten largest filers file 19.1% of the filings in the 40
                  metros, and the five largest
                  {" "}
                  <span className="w4-term">
                    <button aria-describedby="w4-term-footprint-placing" type="button">placing firms</button>
                    <span className="w4-pop" id="w4-term-footprint-placing" role="tooltip">
                      Companies that hire foreign workers and send them to work at client companies, such as outsourcing and IT staffing firms.
                    </span>
                  </span>
                  {" "}
                  5.6%.
                </p>
              </div>
              <div>
                <div className="notice">
                  <span className="ico">💡</span>
                  {" "}
                  <span>
                    <b>What to notice</b>
                    {" "}
                    Without the ten largest filers, the metro groups match Census regions at
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-footprint-ami" type="button">AMI</button>
                      <span className="w4-pop" id="w4-term-footprint-ami" role="tooltip">
                        Adjusted mutual information: how closely two ways of grouping the same items agree. 0 is what chance gives, 1 is a perfect match.
                      </span>
                    </span>
                    {" "}
                    0.13, against 0.06 for the full network: the national employers hide the regional pattern.
                  </span>
                </div>
              </div>
            </div>
            <div className="rx-fig-row">
              <div className="plot">
                <h3>How much do the groups change?</h3>
                <p className="axis-note">
                  NMI between the groups after a removal and the full network's
                  groups: 1 means unchanged. Metros on the left, jobs on the
                  right.
                </p>
                <div className="chart-host jobs-nmi" id="chart-footprint-nmi"></div>
              </div>
              <div className="plot">
                <h3>Do the metro groups follow Census regions?</h3>
                <p className="axis-note">
                  AMI between the metro groups and the four Census regions.
                  Orange bars remove named firms, grey bars random firms with the
                  same share of filings (mean of 50, whisker one standard
                  deviation). The dashed line is the full network.
                </p>
                <div className="chart-host jobs-nmi" id="chart-footprint-region"></div>
              </div>
            </div>
            <div className="rx-drawers rx-foot">
              <details className="rx-drawer">
                <summary>Background</summary>
                <div className="rx-drawer-body">
                  <p>
                    A company that files everywhere links every pair of metros and jobs, so its footprint could be all the structure there is.
                  </p>
                  <p>
                    The five largest placing firms are Tata Consultancy Services, Cognizant, Infosys, HCL and Compunnel. The ten largest filers are Amazon, Cognizant, Google, Microsoft, EY, Meta, Deloitte, Apple, Tata Consultancy Services and Infosys.
                  </p>
                </div>
              </details>
              <details className="rx-drawer">
                <summary>Method</summary>
                <div className="rx-drawer-body">
                  <p>
                    We removed each set, reran 100
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-footprint-louvain" type="button">Louvain</button>
                      <span className="w4-pop" id="w4-term-footprint-louvain" role="tooltip">
                        A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get.
                      </span>
                    </span>
                    {" "}
                    runs on the metro network and on the job network (weighted here by filings, since a count of companies barely moves when ten of 59,196 leave), and compared the groups with the full network's. Removing less data changes the groups too, so each removal sits beside 50 random cuts of companies that remove the same share of filings.
                  </p>
                </div>
              </details>
              <details className="rx-drawer">
                <summary>More numbers</summary>
                <div className="rx-drawer-body">
                  <p>
                    The job clusters hold (
                    <span className="w4-term">
                      <button aria-describedby="w4-term-footprint-nmi" type="button">NMI</button>
                      <span className="w4-pop" id="w4-term-footprint-nmi" role="tooltip">
                        Normalised mutual information: how much two groupings of the same items agree, from 0 (unrelated) to 1 (identical).
                      </span>
                    </span>
                    {" "}
                    0.90 and 0.81) but shift more than random cuts of the same volume do.
                  </p>
                  <p>
                    Removing the five placing firms changes little: the groups stay close to the full network's (NMI 0.92, random cuts 0.85 ± 0.14), and the regional match rises only to 0.09, inside the range of random cuts (0.04 ± 0.05). Without the ten largest filers the clusters also sharpen, modularity rising from 0.28 to 0.32. Every version still beats its own rewired networks by a wide margin (z = 25 or more). Without the ten largest filers the regional match (AMI 0.13, p = 0.013) sits 4.6 standard deviations above random cuts (0.01 ± 0.03). Random cuts leave the job clusters closer to the full network's (0.96 and 0.88, 3.1 and 3.9 standard deviations away), so the biggest firms do shape which jobs cluster together.
                  </p>
                </div>
              </details>
            </div>
            {/* A · Which firm hides the regions? --------------------- */}
            <div className="card w4-card" id="footprint-which">
              <header className="w4-q">
                <span className="w4-num">4A</span>
                <div>
                  <h2>Which firm hides the regions?</h2>
                  <p className="w4-answer">Amazon.</p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">
                    We removed each of the ten largest filers alone, then the top 1, 2, 3 … 20 filers in turn.
                  </p>
                </div>
                <div>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      Amazon files 5.1% of the filings in the 40 metros. Without it
                      alone, the metro groups match Census regions at AMI 0.14,
                      more than the 0.13 without all ten.
                    </span>
                  </div>
                </div>
              </div>
              <div className="rx-fig-row">
                <div className="plot">
                  <h3>The largest filers removed in turn</h3>
                  <p className="axis-note">
                    Orange: the metro groups’ match with Census regions as the largest filers leave. Grey band: random cuts of the same size. Hover a point for the firm.
                  </p>
                  <div className="chart-host jobs-nmi" id="chart-footprint-rank"></div>
                </div>
                <div className="plot">
                  <h3>One firm out at a time</h3>
                  <p className="axis-note">
                    Orange: the match with one firm removed. Grey: random cuts of the same size. Dashed line: the full network.
                  </p>
                  <div className="chart-host jobs-nmi" id="chart-footprint-single"></div>
                </div>
              </div>
              <div className="rx-drawers rx-foot">
                <details className="rx-drawer">
                  <summary>Method</summary>
                  <div className="rx-drawer-body">
                    <p>Each removal sits beside random cuts of companies that remove the same share of filings.</p>
                    <p>50 random cuts for a single firm, 20 for each step of the sweep.</p>
                  </div>
                </details>
                <details className="rx-drawer">
                  <summary>More numbers</summary>
                  <div className="rx-drawer-body">
                    <p>
                      Amazon's 0.14 sits 3.5 standard deviations above its random cuts. No other single firm pushes the match up beyond its random cuts: removing EY, Meta, Deloitte or Apple alone tips Louvain into a two-group split that ignores regions (AMI −0.005). Removed in rank order, the largest filers keep the match above random cuts at every step from one to twenty, but not smoothly: it dips to about 0.07 without the top 17 to 19, where several partitions compete, and peaks at 0.20 without the top 20. 2024 tells the same story more strongly. Its full network shows no regional match (AMI −0.005); without its ten largest filers the match is 0.22 (p = 0.001), against −0.01 ± 0.01 for random cuts.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </section>
          {/* Beyond the three networks ------------------------------------ */}
          <section className="step" id="beyond">
            <header className="w4-opener">
              <span aria-hidden="true" className="w4-opener-num">5</span>
              <div>
                <h2>Beyond the three networks</h2>
                <p>
                  The section 3 groups barely show in lawyers or green cards; the outsourcing firms stand out in the wage levels they file.
                </p>
              </div>
            </header>
            <div className="card w4-card">
              <div className="w4-two">
                <div>
                  <p className="sub">
                    The same filings name the law firm that prepared them, and the
                    Department of Labor's green-card files name the employers that
                    sponsor permanent residence. Three short questions follow the
                    section 3 groups into those records.
                  </p>
                  <ol className="rx-answers">
                    <li>
                      <span className="w4-num">5A</span>
                      <span>
                        <b>Law firms:</b>
                        {" "}
                        barely follow the section 3 groups.
                      </span>
                    </li>
                    <li>
                      <span className="w4-num">5B</span>
                      <span>
                        <b>Green cards:</b>
                        {" "}
                        outsourcing firms sponsor fewer per H-1B filing, though the intervals overlap.
                      </span>
                    </li>
                    <li>
                      <span className="w4-num">5C</span>
                      <span>
                        <b>Wage levels:</b>
                        {" "}
                        a placed filing has 3.6 times the odds of level I or II.
                      </span>
                    </li>
                  </ol>
                </div>
                <figure className="w4-figure">
                  <figcaption>
                    <b>Three small answers</b>
                    <span>
                      Each real value against its baseline: law firms against rewired networks, green cards against direct employers' interval, wage odds against equal odds.
                    </span>
                  </figcaption>
                  <div className="w4-figure-body" data-strip="beyond-summary"></div>
                </figure>
              </div>
            </div>
            <div className="card w4-card" id="beyond-law">
              <header className="w4-q">
                <span className="w4-num">5A</span>
                <div>
                  <h2>Do immigration law firms split companies the way vendors do?</h2>
                  <p className="w4-answer">
                    Barely. Law firms group the companies along the section 3 lines only slightly more than chance.
                  </p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-beyond-law-ami" type="button">AMI</button>
                        <span className="w4-pop" id="w4-term-beyond-law-ami" role="tooltip">
                          Adjusted mutual information: how closely two ways of grouping the same companies agree. 0 is what chance gives, 1 is a perfect match.
                        </span>
                      </span>
                      {" "}
                      0.037 against 0.000 ± 0.002 for
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-beyond-law-rewired" type="button">rewired networks</button>
                        <span className="w4-pop" id="w4-term-beyond-law-rewired" role="tooltip">
                          Random copies of the network in which every company and law firm keeps its number of partners, but the partners are dealt out again at random.
                        </span>
                      </span>
                      : real
                      (z = 15) and small.
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-beyond-law-modularity" type="button">Modularity</button>
                        <span className="w4-pop" id="w4-term-beyond-law-modularity" role="tooltip">
                          How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
                        </span>
                      </span>
                      {" "}
                      would mislead here.
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          75.6% of certified filings name a law firm; after name cleaning there are 4,479. We linked each firm that places workers in section 3's network to its law firms, weighted by filings, ran Louvain, and compared the groups with the section 3 groups for the 4,576 firms in both. Most companies use one law firm: 64% of filings come from such companies, which makes the network a set of stars.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          The law-firm network scores 0.90, below the 0.93 of its rewired copies, because stars split into near-perfect groups whatever the wiring. Fragomen files the most (14,087 filings for 131 of these companies); EY Law files 10,274 for eight. The network of law firms themselves, across every employer, is in
                          {" "}
                          <a href="#staffing-lawyers">Who files the paperwork?</a>
                          {" "}
                          in the deep dive.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="plot">
                  <h3>Agreement with the section 3 groups</h3>
                  <p className="axis-note">
                    AMI between the law-firm groups and the staffing groups, against
                    50 rewired law-firm networks in which every company and law firm
                    keeps its number of partners.
                  </p>
                  <div className="chart-host short" id="chart-beyond-law"></div>
                </div>
              </div>
            </div>
            <div className="card w4-card" id="beyond-perm">
              <header className="w4-q">
                <span className="w4-num">5B</span>
                <div>
                  <h2>Do outsourcing firms sponsor fewer green cards?</h2>
                  <p className="w4-answer">Fewer per H-1B filing, but the staffing groups do not differ beyond chance.</p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">
                    Here the
                    outsourcing firms are the 817 companies that place 20 or more
                    filings at client sites.
                  </p>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      Outsourcing firms file 0.11 green cards per H-1B filing
                      (95% interval 0.08 to 0.15), direct employers 0.18 (0.14 to
                      0.21).
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          A green card through work starts with a
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-beyond-perm" type="button">PERM</button>
                            <span className="w4-pop" id="w4-term-beyond-perm" role="tooltip">
                              The Department of Labor's permanent labor certification: the employer shows that no qualified US worker is available for the job. Most green cards through work start there.
                            </span>
                          </span>
                          {" "}
                          filing.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          For each company with 20 or more H-1B filings we divided its 2025 PERM filings by its H-1B filings, matching companies by name and tax number.
                        </p>
                        <p>Pooled over the companies in each bar, with a 95% bootstrap interval for the first two.</p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          The gap shrinks to 0.13 against 0.17 when a firm counts as outsourcing only if most of its filings go to clients. Single companies swing these rates more than any group does: counting every case status, filings in the names of Amazon and Google fell from 3,638 and 1,618 in 2024 to 15 and 3 in 2025. Green cards per company and the strongest employer ties are in
                          {" "}
                          <a href="#deeper-perm">the deep dive</a>
                          .
                        </p>
                        <p>
                          Outsourcing firms file 0.11 green cards per H-1B filing (95% interval 0.08 to 0.15), direct employers 0.18 (0.14 to 0.21). Across the six largest staffing groups the rate runs from 0.03 in Cognizant's group, where Cognizant itself filed almost none, to 0.15, a spread that
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-beyond-perm-shuffled" type="button">shuffled group labels</button>
                            <span className="w4-pop" id="w4-term-beyond-perm-shuffled" role="tooltip">
                              We dealt the companies out to the groups again at random, many times, to see how big a spread chance alone produces.
                            </span>
                          </span>
                          {" "}
                          match 28% of the time (p = 0.28).
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="plot">
                  <h3>Green-card filings per H-1B filing</h3>
                  <p className="axis-note">
                    The six on the right are the largest
                    section 3 groups, named after their largest firm.
                  </p>
                  <div className="chart-host short" id="chart-beyond-perm"></div>
                </div>
              </div>
            </div>
            <div className="card w4-card" id="beyond-wage">
              <header className="w4-q">
                <span className="w4-num">5C</span>
                <div>
                  <h2>Do outsourcing firms file at lower wage levels for the same job?</h2>
                  <p className="w4-answer">
                    Yes. For the same occupation, a placed filing has 3.6 times the odds of wage level I or II.
                  </p>
                </div>
              </header>
              <div className="w4-two">
                <div>
                  <p className="sub">
                    Every filing states a
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-beyond-wage-wagelevel" type="button">prevailing-wage level</button>
                      <span className="w4-pop" id="w4-term-beyond-wage-wagelevel" role="tooltip">
                        A level set by the experience and skills the job asks for. Each level carries a wage floor.
                      </span>
                    </span>
                    {" "}
                    from I (entry) to IV (fully competent).
                  </p>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      Within the 83 occupations with 20 or more filings of each kind, the
                      {" "}
                      <span className="w4-term">
                        <button aria-describedby="w4-term-beyond-mh" type="button">Mantel–Haenszel odds ratio</button>
                        <span className="w4-pop" id="w4-term-beyond-mh" role="tooltip">
                          An odds ratio pooled over those occupations, so each comparison sets placed against direct filings for the same job. 1 means the same odds.
                        </span>
                      </span>
                      {" "}
                      is 3.59, and 69 of the 83 point the same way.
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>92% of filings give one.</p>
                        <p>
                          A level describes the job as filed, not the worker, so this shows cheaper job descriptions, not lower pay for the same person.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          We compared placed and direct filings within each occupation, so software developers are compared with software developers.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Overall, 79% of
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-beyond-wage-placed" type="button">placed</button>
                            <span className="w4-pop" id="w4-term-beyond-wage-placed" role="tooltip">
                              A placed filing sends the worker to a client company's site; a direct filing is for the employer's own site.
                            </span>
                          </span>
                          {" "}
                          filings sit at level I or II against 58% of direct ones.
                        </p>
                        <p>
                          A few large firms file most placements, so the interval comes from resampling whole employers: 2.87 to 5.04. It is not one firm's doing: without the 5, 10 or 20 largest placing firms the ratio rises to 3.85, 4.28 and 4.94. Software developers: 87% against 52%. Offered wages follow: placed filings offer a median 1.00 times the prevailing wage in the five largest occupations, direct ones 1.00 to 1.08 times.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="plot">
                  <h3>Share of filings at level I or II</h3>
                  <p className="axis-note">
                    The five occupations with the most filings. Orange bars are filings that place the worker at a client, blue bars filings for the employer's own site.
                  </p>
                  <div className="chart-host short" id="chart-beyond-wage"></div>
                </div>
              </div>
            </div>
          </section>
          <section className="step" id="closing">
            <header className="w4-opener">
              <span aria-hidden="true" className="w4-opener-num">✓</span>
              <div>
                <h2>Closing</h2>
                <p>The groups in these networks are weak, but they are not noise.</p>
              </div>
            </header>
            <div className="card w4-card">
              <div className="w4-two">
                <div>
                  <figure className="w4-figure">
                    <figcaption>
                      <b>Five weak groups, none of them noise</b>
                      <span>
                        One row per section: the real network against its random baseline, on the same scale as the findings above the hero.
                      </span>
                    </figcaption>
                    <div className="w4-figure-body" data-strip="closing-recap"></div>
                  </figure>
                </div>
                <div className="w4-surprises">
                  <h3>What surprised us</h3>
                  <div className="w4-surprise">
                    <p className="w4-surprise-before">
                      The staffing groups looked weak in our first round, following industry about as much as vendor,
                    </p>
                    <p className="w4-surprise-after">yet 26.5% of vendor switches stay inside them, against 3.2% for a random vendor.</p>
                    <div className="w4-figure-body" data-strip="closing-switches"></div>
                  </div>
                  <div className="w4-surprise">
                    <p className="w4-surprise-before">And the backbone that seemed to snap between α = 0.1 and 0.05</p>
                    <p className="w4-surprise-after">never snaps: no single link cuts off more than two metros.</p>
                    <div className="w4-figure-body" data-strip="closing-backbone"></div>
                  </div>
                </div>
              </div>
              <div className="notice">
                <span className="ico">!</span>
                {" "}
                <span>
                  <b>One important limit</b>
                  {" "}
                  A shared employer link means the same companies file for both occupations or in both places. It does not show that the jobs are done together, that one caused the other, or that the network stands for workers who were hired.
                </span>
              </div>
              <details className="qa" id="closing-ai">
                <summary>
                  <span className="qa-cue">AI use and how we checked it</span>
                </summary>
                <div className="qa-body">
                  <p className="sub">
                    AI coding assistants helped structure the page, wrote analysis and page code, drafted and revised text, and tested the visual presentation. The numbers come from the public sources listed in
                    {" "}
                    <a href="#evidence">Data and methods</a>
                    .
                  </p>
                  <p className="sub">
                    Each analysis step writes the numbers its section quotes to a JSON file the page reads. A schema check tests each file against the fields the page uses, a name-matching check tests the company-name rules against tax numbers, and the site tests fail when the numbers in a card or in this closing drift from the analysis output. We checked generated tables, comparisons, source scope, and the page behaviour against the local data before including a claim.
                  </p>
                </div>
              </details>
              <p className="fineprint">
                Sources and the full analysis choices are recorded in
                {" "}
                <a href="#evidence">Data and methods</a>
                .
              </p>
              <div className="rx-drawers rx-foot">
                <details className="rx-drawer">
                  <summary>Background</summary>
                  <div className="rx-drawer-body">
                    <p>
                      Cities group by who hires there, not by region. Outsourcing firms bundle jobs differently from direct employers of the same size. And when a client drops its main vendor, the new one comes from the same Louvain group more than eight times as often as a random vendor would, though mostly because clients return to firms they already use. Take out the ten largest filers, most of them national tech and consulting employers, and the metro groups start to follow Census regions; Amazon alone does all of that. Where outsourcing shows most is outside the networks: a filing that places a worker at a client has 3.6 times the odds of a lower wage level for the same occupation. Lawyers and green cards barely follow the staffing groups.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </section>
          {/* Deep dive · the first round of questions ------------------ */}
          <section className="step" id="cut">
            <header className="w4-opener">
              <span aria-hidden="true" className="w4-opener-num">+</span>
              <div>
                <h2>Deep dive</h2>
                <p>Earlier questions, more networks, and the data behind every number.</p>
              </div>
            </header>
            <div className="rx-catalogue" id="cut-catalogue">
              <p className="sub rx-cut-intro" id="cut-intro">
                Each answer still holds; the questions above replaced them because they test the communities against something that could have come out the other way. Pick any question to open it.
              </p>
              <div className="rx-tgrid">
                <div className="rx-tcard">
                  <a className="rx-tcard-head" href="#topic-where">
                    <span>
                      <b>Where the hiring is</b>
                      <em>Section 1's metros, linked by the employers they share.</em>
                    </span>
                  </a>
                  <ul>
                    <li>
                      <a href="#place-backbone">
                        <span>Once the small links go, what's left of the map?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#place-longhaul">
                        <span>Do the same employers tie distant cities together?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#deeper-density">
                        <span>Where is the hiring densest? Filings per 1,000 jobs</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li className="rx-uses-li">
                      <a href="#cut-methods">
                        <span>The course's community methods, tried on the 40 metros</span>
                        <i aria-hidden="true">→</i>
                      </a>
                      <ul className="rx-uses">
                        <li>
                          <a href="#w4m-panel-gn">
                            <span>Does cutting the busiest links split the country?</span>
                          </a>
                        </li>
                        <li>
                          <a href="#w4m-panel-mod">
                            <span>Are the three metro groups more than chance?</span>
                          </a>
                        </li>
                        <li>
                          <a href="#w4m-panel-louvain">
                            <span>Where do the three metro groups come from?</span>
                          </a>
                        </li>
                        <li>
                          <a href="#w4m-panel-overlap">
                            <span>Which metros belong to more than one group?</span>
                          </a>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
                <div className="rx-tcard">
                  <a className="rx-tcard-head" href="#topic-jobs">
                    <span>
                      <b>Jobs and skills</b>
                      <em>Occupations, linked by the companies that hire for both.</em>
                    </span>
                  </a>
                  <ul>
                    <li>
                      <a href="#jobs-bridges">
                        <span>Which jobs belong to two clusters?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#jobs-groups">
                        <span>Do the clusters follow official job groups?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#cut-skills" data-target="cut-skills-direct">
                        <span>Do occupations the same companies hire together also need similar skills?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#cut-skills" data-target="cut-skills-cluster">
                        <span>Does that agreement hold for whole hiring clusters, not just direct ties?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#cut-skills" data-target="cut-skills-radar">
                        <span>How do two occupations' day-to-day skills actually compare?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#cut-pagerank" data-target="cut-pagerank-explore">
                        <span>Change the damping factor: does the ranking move?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#cut-pagerank" data-target="cut-pagerank-iteration">
                        <span>Stepped one round at a time, how fast does the ranking settle?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="rx-tcard">
                  <a className="rx-tcard-head" href="#topic-outsourcing">
                    <span>
                      <b>Outsourcing firms and their clients</b>
                      <em>Who places workers where, and how tightly.</em>
                    </span>
                  </a>
                  <ul>
                    <li>
                      <a href="#who-q2">
                        <span>Do clients group by industry or by the firm that staffs them?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#who-q3">
                        <span>Who relies on a single vendor?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#staffing-figure">
                        <span>The client network, year by year</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#staffing-community-stats">
                        <span>With filing counts or without?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#staffing-ties">
                        <span>Strong ties, weak ties and pay</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#deeper-strength">
                        <span>Strength against degree: where do the heavy links go?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#entity-communities">
                        <span>Every worker and company, grouped by what they do</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="rx-tcard">
                  <a className="rx-tcard-head" href="#topic-paperwork">
                    <span>
                      <b>Paperwork, the lottery and green cards</b>
                      <em>What happens around a filing: the lawyers, the draw, USCIS and the green card after it.</em>
                    </span>
                  </a>
                  <ul>
                    <li>
                      <a href="#staffing-lawyers">
                        <span>Who files the paperwork?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#staffing-lottery">
                        <span>Do the firms that register the same workers staff the same clients?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#deeper-lottery">
                        <span>The lottery a year apart, and who receives the winners</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#deeper-uscis">
                        <span>USCIS denials, year by year</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#deeper-perm">
                        <span>Who keeps them? Green cards as the strong tie</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#deeper-countries">
                        <span>Where are they from? A network of countries</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="rx-tcard">
                  <a className="rx-tcard-head" href="#topic-years">
                    <span>
                      <b>Five years</b>
                      <em>How the filings shift from 2022 to 2026.</em>
                    </span>
                  </a>
                  <ul>
                    <li>
                      <a href="#cut-years">
                        <span>Five years of filings</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#cut-roles">
                        <span>Who filed, and for which roles?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#who-q4">
                        <span>Does it hold from year to year?</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="rx-tcard rx-tcard-data">
                  <a className="rx-tcard-head" href="#evidence">
                    <span>
                      <b>Data and methods</b>
                      <em>The public sources, and how we checked every number.</em>
                    </span>
                  </a>
                  <ul>
                    <li>
                      <a href="#evidence">
                        <span>Sources and the page footer</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                    <li>
                      <a href="#closing-ai">
                        <span>AI use and how we checked it, in the closing</span>
                        <i aria-hidden="true">→</i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="rx-moved">Earlier questions now open sections 1 to 3.</p>
              <div className="rx-drawers rx-inline">
                <details className="rx-drawer">
                  <summary>Which ones</summary>
                  <div className="rx-drawer-body">
                    <span>
                      Which cities hire the most? and Is it one national job market or several regional ones? in section 1, Which jobs are hired together? in section 2, How many workers sit at a client? in section 3.
                    </span>
                  </div>
                </details>
              </div>
            </div>
            <details className="rx-topic" id="topic-where" name="w4-topic">
              <summary>Where the hiring is</summary>
              <div className="rx-topic-bar">
                <a className="rx-back" href="#cut">← Deep dive</a>
                <div>
                  <h2 className="rx-topic-title">Where the hiring is</h2>
                  <p className="rx-topic-holds">Section 1's metros, linked by the employers they share.</p>
                </div>
                <span className="rx-topic-count"></span>
              </div>
              <nav aria-label="Boxes in this topic" className="rx-toc">
                <div className="rx-toc-col">
                  <p className="rx-toc-head">Questions</p>
                  <a className="rx-toc-item" href="#place-backbone">Once the small links go, what's left of the map?</a>
                  {" "}
                  <a className="rx-toc-item" href="#place-longhaul">Do the same employers tie distant cities together?</a>
                  {" "}
                  <a className="rx-toc-item" href="#deeper-density">Where is the hiring densest? Filings per 1,000 jobs</a>
                </div>
                <div className="rx-toc-col">
                  <p className="rx-toc-head">The course's community methods, tried on the 40 metros</p>
                  <a className="rx-toc-item" href="#w4m-panel-gn">Does cutting the busiest links split the country?</a>
                  {" "}
                  <a className="rx-toc-item" href="#w4m-panel-mod">Are the three metro groups more than chance?</a>
                  {" "}
                  <a className="rx-toc-item" href="#w4m-panel-louvain">Where do the three metro groups come from?</a>
                  {" "}
                  <a className="rx-toc-item" href="#w4m-panel-overlap">Which metros belong to more than one group?</a>
                </div>
              </nav>
              <details className="rx-panel" name="w4-panel-where" data-box="place-backbone">
                <summary>Once the small links go, what's left of the map?</summary>
                <div className="card w4-card" id="place-backbone">
                  <header className="w4-q">
                    <span className="w4-num">1</span>
                    <div>
                      <h2>Once the small links go, what's left of the map?</h2>
                      <p className="w4-answer">Keep only links heavy for one of their metros and the map comes apart.</p>
                    </div>
                  </header>
                  <p className="sub">
                    The control sets the
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-place-backbone-disparity" type="button">disparity-filter</button>
                      <span className="w4-pop" id="w4-term-place-backbone-disparity" role="tooltip">
                        A filter that keeps a link only when it carries an unusually large share of either metro’s total weight.
                      </span>
                    </span>
                    {" "}
                    α from Week 4.
                  </p>
                  <div className="rx-seg-row">
                    <span className="rx-seg-label" id="place-alpha-label">Backbone α</span>
                    <div aria-labelledby="place-alpha-label" className="rx-seg" id="place-alpha" role="group"></div>
                  </div>
                  <div className="plot">
                    <h3>Backbone at this α</h3>
                    <p className="axis-note">
                      Each line is a link the filter keeps at the α set above, thicker
                      when more filings share it.
                    </p>
                    <div className="chart-host map" id="chart-backbone"></div>
                  </div>
                  <div className="plot" style={{"marginTop":"18px"}}>
                    <h3>Giant component vs α</h3>
                    <p className="axis-note">
                      How many metros stay in the largest connected piece as the filter
                      tightens. The dashed line marks where it snaps.
                    </p>
                    <div className="w4-figure-body" id="chart-gc"></div>
                  </div>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      <span id="place-snap-note">
                        Watch where the giant component snaps as you step α
                        down with the control above.
                      </span>
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>With every link the map is one blob. Cities are linked when they share an employer.</p>
                        <p>
                          Metros in grey have fallen out of the largest connected piece. Colours are section 1's three metro groups. Click a metro to select it.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p className="sub">
                          Two metros are linked when a company files in both; the weight adds up, over those companies, the smaller of its two filing counts. One weight threshold would keep the links among the big hubs and cut a mid-size metro's strongest tie, which is light next to New York and Dallas. The disparity filter keeps a link when it carries an unusually large share of either endpoint's weight at level α, the method the course used for the philosophers backbone.
                        </p>
                        <table className="ego">
                          <thead>
                            <tr>
                              <th>α</th>
                              <th style={{"textAlign":"right"}}>Edges kept</th>
                              <th style={{"textAlign":"right"}}>Giant component</th>
                            </tr>
                          </thead>
                          <tbody id="place-alpha-table"></tbody>
                        </table>
                        <p>
                          <span id="place-alpha-choice"></span>
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-where" data-box="place-longhaul">
                <summary>Do the same employers tie distant cities together?</summary>
                <div className="card w4-card" id="place-longhaul">
                  <header className="w4-q">
                    <span className="w4-num">2</span>
                    <div>
                      <h2>Do the same employers tie distant cities together?</h2>
                      <p className="w4-answer">Mostly not: a single company rarely carries a long link.</p>
                    </div>
                  </header>
                  <p className="sub">
                    The shortlist is the five firms that
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-place-longhaul-place" type="button">place</button>
                      <span className="w4-pop" id="w4-term-place-longhaul-place" role="tooltip">The firm files for the worker, then sends them to work at a client company’s site.</span>
                    </span>
                    {" "}
                    the most filings at
                    client sites.
                  </p>
                  <div className="longhaul-stack">
                    <div className="plot">
                      <h3>Distance vs weight</h3>
                      <p className="axis-note">
                        Each point is a link in the backbone at α = 0.2, the default
                        above; size grows with its weight.
                      </p>
                      <div className="chart-host" id="chart-longhaul"></div>
                    </div>
                    <div className="plot">
                      <h3>One employer’s map</h3>
                      <p className="axis-note">
                        The backbone links (α = 0.2) this company leads: of all the
                        companies filing in both cities, it adds the most to the
                        link's weight.
                      </p>
                      <div className="select-row">
                        <label htmlFor="place-employer">Employer</label>
                        {" "}
                        <select id="place-employer"></select>
                      </div>
                      <div className="chart-host map" id="chart-arcs"></div>
                    </div>
                  </div>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      Of the 83 backbone links longer than 1,500 km, the shortlist
                      leads 22 (27%); it leads 47 of the 97 shorter ones (48%).
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          The shortlist holds the five largest placing firms: Tata Consultancy Services, Cognizant, Infosys, HCL and Compunnel. The staffing section follows them to their clients.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          In the distance chart, a label names a company on its heaviest link over 1,500 km, for the five heaviest; hover any point for its own. The legend separates links led by the shortlist from links led by any other company; click a point to select a city.
                        </p>
                        <p>
                          In the employer map, the list holds the six companies that lead the most links. Click a city to select it.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Big direct employers lead the long links, Amazon above all. Distant metros are tied by many companies filing in both.
                        </p>
                        <p>
                          Amazon leads the most long links (30), then Cognizant (17), EY (8) and Deloitte (7). The leading company carries a median 14% of a long link's weight, and only one long link, San Jose to Fayetteville (Walmart), has a company with half of it.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-where" data-box="deeper-density">
                <summary>Where is the hiring densest? Filings per 1,000 jobs</summary>
                <div className="card w4-card" id="deeper-density">
                  <header className="w4-q">
                    <span className="w4-num">3</span>
                    <div>
                      <h2>Where is the hiring densest? Filings per 1,000 jobs</h2>
                      <p className="w4-answer">San Jose, at 42.9 filings per 1,000 jobs, against New York's 6.9.</p>
                    </div>
                  </header>
                  <div className="w4-two">
                    <div>
                      <p className="sub">Section 1 counts filings.</p>
                      <div className="notice">
                        <span className="ico">💡</span>
                        <span>
                          <b>What to notice</b>
                          {" "}
                          Nationally there are 4.5 filings per 1,000 jobs; San Jose files 42.9, nearly ten times that, while New York, the largest filer, sits at 6.9.
                        </span>
                      </div>
                      <div className="rx-drawers rx-foot">
                        <details className="rx-drawer">
                          <summary>Method</summary>
                          <div className="rx-drawer-body">
                            <p>
                              Divide each metro's 2025 filings by its jobs in the Bureau of Labor Statistics' May 2025 employment survey (OEWS) and the map shifts: nationally it is 4.5 filings per 1,000 jobs.
                            </p>
                            <p>A filing is a request, not a hire, so a rate can run high.</p>
                          </div>
                        </details>
                        <details className="rx-drawer">
                          <summary>More numbers</summary>
                          <div className="rx-drawer-body">
                            <p>
                              Among the 203 metros with 100,000 jobs or more, count and density rank alike (
                              <span className="w4-term">
                                <button aria-describedby="w4-term-deeper-density-spearman" type="button">Spearman</button>
                                <span className="w4-pop" id="w4-term-deeper-density-spearman" role="tooltip">A rank correlation: how closely two orderings agree. Higher means closer.</span>
                              </span>
                              {" "}
                              0.90), yet only 5 of the 10 largest by count stay in the top 10 by density: Dallas, San Jose, San Francisco, Seattle and Austin. For software developers alone the national rate is 139 filings per 1,000 jobs, and Fayetteville, Arkansas, the metro around Bentonville, reaches 896, 6.4 times the national share. New York files the most, 65,935; Trenton files 17.2 and Seattle 16.8 per 1,000 jobs.
                            </p>
                          </div>
                        </details>
                      </div>
                    </div>
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Filings per 1,000 jobs</b>
                        <span>
                          The ten densest metros with 100,000 jobs or more, and New York (outlined), which files the most. Dashed: the national rate.
                        </span>
                      </figcaption>
                      <div className="w4-figure-body" data-more="density"></div>
                    </figure>
                  </div>
                </div>
              </details>
              <details className="qa cut rx-panel" data-box="cut-methods" id="cut-methods" name="w4-panel-where">
                <summary>
                  <span className="qa-cue">The course's four community methods, step by step on the 40 metros</span>
                </summary>
                <div className="qa-body cut-body" id="methods-body">
                  <p className="w4-box-intro">
                    The course's week 4 community methods, run on section 1's 40 metros. Each tab steps through one method, so you can watch where its groups come from and set them against
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-cut-methods-louvain" type="button">Louvain's</button>
                      <span className="w4-pop" id="w4-term-cut-methods-louvain" role="tooltip">
                        A method that finds groups by moving each metro to the neighbouring group that raises modularity most, then merging the groups and repeating.
                      </span>
                    </span>
                    .
                  </p>
                  <p aria-live="polite" className="status-line" id="methods-status">Loading the community explorables…</p>
                  <div className="w4m" id="w4m-root" hidden>
                    <div className="w4m-tabs">
                      <button aria-pressed="true" className="w4m-tab" data-panel="gn" id="w4m-tab-gn" type="button">Girvan–Newman</button>
                      {" "}
                      <button aria-pressed="false" className="w4m-tab" data-panel="mod" id="w4m-tab-mod" type="button">Modularity</button>
                      {" "}
                      <button aria-pressed="false" className="w4m-tab" data-panel="louvain" id="w4m-tab-louvain" type="button">Louvain</button>
                      {" "}
                      <button aria-pressed="false" className="w4m-tab" data-panel="overlap" id="w4m-tab-overlap" type="button">Overlap</button>
                    </div>
                    <section aria-labelledby="w4m-tab-gn" className="w4m-panel" data-panel="gn" id="w4m-panel-gn">
                      <p className="w4m-eyebrow">Explore · after the course's week 4</p>
                      <h3 className="w4m-title" id="w4m-gn-title">Girvan–Newman, one cut at a time</h3>
                      <p className="w4m-lead" id="w4m-gn-lead"></p>
                      <div className="w4m-controls" role="group" aria-label="Girvan–Newman controls">
                        <button className="w4m-btn primary" data-act="step" type="button">Step</button>
                        {" "}
                        <button className="w4m-btn" data-act="split" type="button">Next split</button>
                        {" "}
                        <button className="w4m-btn" data-act="back" type="button">Back</button>
                        {" "}
                        <button className="w4m-btn" data-act="reset" type="button">Reset</button>
                      </div>
                      <div className="w4m-grid">
                        <div className="w4m-map" id="w4m-gn-map"></div>
                        <div aria-live="polite" className="w4m-side">
                          <div className="w4m-stats">
                            <div className="w4m-stat">
                              <b id="w4m-gn-step"></b>
                              <span>links removed</span>
                            </div>
                            <div className="w4m-stat">
                              <b id="w4m-gn-comps"></b>
                              <span>
                                pieces, largest first:
                                {" "}
                                <span id="w4m-gn-sizes"></span>
                              </span>
                            </div>
                          </div>
                          <div className="w4m-rows">
                            <div className="w4m-row">
                              <span>Next to go</span>
                              <b id="w4m-gn-next"></b>
                            </div>
                            <div className="w4m-row">
                              <span>Its edge betweenness</span>
                              <b id="w4m-gn-bet"></b>
                            </div>
                            <div className="w4m-row">
                              <span>Modularity of these pieces</span>
                              <b id="w4m-gn-q"></b>
                            </div>
                          </div>
                          <p className="w4m-note">
                            Thick line: the next link to go, the one carrying the most shortest paths. Dashed: links already cut. Hollow dots: metros cut off on their own.
                          </p>
                        </div>
                      </div>
                      <figure className="w4m-figure">
                        <figcaption>
                          <span className="w4m-fig-title">Modularity after each split</span>
                          {" "}
                          <span className="w4m-fig-caption" id="w4m-gn-caption"></span>
                        </figcaption>
                        <svg className="w4m-chart" id="w4m-gn-chart" role="img"></svg>
                      </figure>
                      <div className="rx-drawers rx-foot">
                        <details className="rx-drawer">
                          <summary>Background</summary>
                          <div className="rx-drawer-body">
                            <p>
                              <span id="w4m-gn-hubs"></span>
                              {" "}
                              link to every other metro, so each split strands a single metro, starting with
                              {" "}
                              <span id="w4m-gn-first"></span>
                              .
                            </p>
                          </div>
                        </details>
                      </div>
                    </section>
                    <section aria-labelledby="w4m-tab-mod" className="w4m-panel" data-panel="mod" id="w4m-panel-mod" hidden>
                      <p className="w4m-eyebrow">Explore · after the course's week 4</p>
                      <h3 className="w4m-title">Move a metro, watch modularity</h3>
                      <p className="w4m-lead" id="w4m-mod-lead"></p>
                      <div className="w4m-controls" role="group" aria-label="Modularity controls">
                        <button className="w4m-btn primary" data-act="reset" type="button">Louvain's groups</button>
                        {" "}
                        <button className="w4m-btn" data-act="shuffle" type="button">Shuffle the labels</button>
                        {" "}
                        <button className="w4m-btn" data-act="one" type="button">Everyone in one group</button>
                      </div>
                      <div className="w4m-grid">
                        <div className="w4m-map" id="w4m-mod-map"></div>
                        <div aria-live="polite" className="w4m-side">
                          <div className="w4m-stats">
                            <div className="w4m-stat">
                              <b id="w4m-mod-q"></b>
                              <span id="w4m-mod-q-label">modularity of your three groups</span>
                            </div>
                          </div>
                          <svg className="w4m-strip" id="w4m-mod-strip" role="img"></svg>
                          <div className="w4m-rows">
                            <div className="w4m-row">
                              <span>Metros per group</span>
                              <b id="w4m-mod-sizes"></b>
                            </div>
                            <div className="w4m-row">
                              <span>Last move</span>
                              <b id="w4m-mod-last">none yet</b>
                            </div>
                          </div>
                          <p className="w4m-note">
                            Grey band: rewired networks in which each company keeps its number of metros, Louvain's best on each, mean and one standard deviation.
                          </p>
                        </div>
                      </div>
                    </section>
                    <section aria-labelledby="w4m-tab-louvain" className="w4m-panel" data-panel="louvain" id="w4m-panel-louvain" hidden>
                      <p className="w4m-eyebrow">Explore · after the course's week 4</p>
                      <h3 className="w4m-title">Louvain, move by move</h3>
                      <p className="w4m-lead" id="w4m-louvain-lead"></p>
                      <div className="w4m-controls" role="group" aria-label="Louvain controls">
                        <button className="w4m-btn primary" data-act="step" type="button">Step</button>
                        {" "}
                        <button className="w4m-btn" data-act="level" type="button">Finish this level</button>
                        {" "}
                        <button className="w4m-btn" data-act="back" type="button">Back</button>
                        {" "}
                        <button className="w4m-btn" data-act="reset" type="button">Reset</button>
                      </div>
                      <div className="w4m-grid">
                        <div className="w4m-map" id="w4m-louvain-map"></div>
                        <div aria-live="polite" className="w4m-side">
                          <div className="w4m-stats">
                            <div className="w4m-stat">
                              <b id="w4m-louvain-q"></b>
                              <span>modularity after this move</span>
                            </div>
                            <div className="w4m-stat">
                              <b id="w4m-louvain-n"></b>
                              <span>communities</span>
                            </div>
                          </div>
                          <div className="w4m-rows">
                            <div className="w4m-row">
                              <span>Move</span>
                              <b id="w4m-louvain-step"></b>
                            </div>
                            <div className="w4m-row">
                              <span>Level</span>
                              <b id="w4m-louvain-level"></b>
                            </div>
                            <div className="w4m-row">
                              <span>Moved</span>
                              <b id="w4m-louvain-moved"></b>
                            </div>
                            <div className="w4m-row">
                              <span>Gain in modularity</span>
                              <b id="w4m-louvain-gain"></b>
                            </div>
                          </div>
                          <p className="w4m-note">
                            Hollow dots are alone in their community. A community of two or more takes the colour of the metro group most of its members end in.
                          </p>
                        </div>
                      </div>
                      <figure className="w4m-figure">
                        <figcaption>
                          <span className="w4m-fig-title">Modularity after each move</span>
                          {" "}
                          <span className="w4m-fig-caption">
                            The dashed line is where Louvain lands on rewired networks. The ring marks the current move.
                          </span>
                        </figcaption>
                        <svg className="w4m-chart" id="w4m-louvain-chart" role="img"></svg>
                      </figure>
                      <div className="rx-drawers rx-foot">
                        <details className="rx-drawer">
                          <summary>Method</summary>
                          <div className="rx-drawer-body">
                            <p>
                              The run uses seed
                              {" "}
                              <span id="w4m-louvain-seed"></span>
                              {" "}
                              and all
                              {" "}
                              <span id="w4m-louvain-links"></span>
                              {" "}
                              weighted links. The moves lift
                              {" "}
                              <span className="w4-term">
                                <button aria-describedby="w4-term-cut-methods-q" type="button">Q</button>
                                <span className="w4-pop" id="w4-term-cut-methods-q" role="tooltip">The usual symbol for modularity.</span>
                              </span>
                              {" "}
                              from
                              {" "}
                              <span id="w4m-louvain-q-from"></span>
                              {" "}
                              to
                              {" "}
                              <span id="w4m-louvain-q-to"></span>
                              ; the second level finds nothing to merge.
                            </p>
                          </div>
                        </details>
                      </div>
                    </section>
                    <section aria-labelledby="w4m-tab-overlap" className="w4m-panel" data-panel="overlap" id="w4m-panel-overlap" hidden>
                      <p className="w4m-eyebrow">Explore · after the course's week 4</p>
                      <h3 className="w4m-title">Overlap: k-cliques and link communities</h3>
                      <p className="w4m-lead" id="w4m-overlap-lead"></p>
                      <div className="w4m-controls" id="w4m-overlap-modes" role="group" aria-label="Overlap controls">
                        <button aria-pressed="true" className="w4m-btn segment" data-mode="link" type="button">Link communities</button>
                        {" "}
                        <button aria-pressed="false" className="w4m-btn segment" data-mode="k3" type="button">k = 3</button>
                        {" "}
                        <button aria-pressed="false" className="w4m-btn segment" data-mode="k4" type="button">k = 4</button>
                        {" "}
                        <button aria-pressed="false" className="w4m-btn segment" data-mode="k5" type="button">k = 5</button>
                        {" "}
                        <button aria-pressed="false" className="w4m-btn segment" data-mode="k6" type="button">k = 6</button>
                        {" "}
                        <button className="w4m-btn primary" data-act="next" type="button">Next community</button>
                      </div>
                      <div className="w4m-grid">
                        <div className="w4m-map" id="w4m-overlap-map"></div>
                        <div aria-live="polite" className="w4m-side">
                          <div className="w4m-stats">
                            <div className="w4m-stat">
                              <b id="w4m-overlap-count"></b>
                              <span>
                                communities ·
                                {" "}
                                <span id="w4m-overlap-title"></span>
                              </span>
                            </div>
                          </div>
                          <p className="w4m-extra" id="w4m-overlap-extra"></p>
                          <div className="w4m-rows">
                            <div className="w4m-row">
                              <span>Showing</span>
                              <b id="w4m-overlap-which"></b>
                            </div>
                          </div>
                          <p className="w4m-names" id="w4m-overlap-names"></p>
                          <p className="w4m-note">
                            Dark links and filled dots: the community shown. Rings: metros that belong to two or more communities at this setting.
                          </p>
                        </div>
                      </div>
                      <div className="rx-drawers rx-foot">
                        <details className="rx-drawer">
                          <summary>Method</summary>
                          <div className="rx-drawer-body">
                            <p>
                              Link communities group the links, and a metro joins every community its links are in.
                              <span id="w4m-overlap-fringe"></span>
                            </p>
                          </div>
                        </details>
                      </div>
                    </section>
                  </div>
                </div>
              </details>
            </details>
            <details className="rx-topic" id="topic-jobs" name="w4-topic">
              <summary>Jobs and skills</summary>
              <div className="rx-topic-bar">
                <a className="rx-back" href="#cut">← Deep dive</a>
                <div>
                  <h2 className="rx-topic-title">Jobs and skills</h2>
                  <p className="rx-topic-holds">Occupations, linked by the companies that hire for both.</p>
                </div>
                <span className="rx-topic-count"></span>
              </div>
              <nav aria-label="Boxes in this topic" className="rx-toc">
                <a className="rx-toc-item" href="#jobs-bridges">Which jobs belong to two clusters?</a>
                {" "}
                <a className="rx-toc-item" href="#jobs-groups">Do the clusters follow official job groups?</a>
                {" "}
                <a className="rx-toc-item" href="#cut-skills" data-target="cut-skills-direct">Do occupations the same companies hire together also need similar skills?</a>
                {" "}
                <a className="rx-toc-item" href="#cut-skills" data-target="cut-skills-cluster">Does that agreement hold for whole hiring clusters, not just direct ties?</a>
                {" "}
                <a className="rx-toc-item" href="#cut-skills" data-target="cut-skills-radar">How do two occupations' day-to-day skills actually compare?</a>
                {" "}
                <a className="rx-toc-item" href="#cut-pagerank" data-target="cut-pagerank-explore">Change the damping factor: does the ranking move?</a>
                {" "}
                <a className="rx-toc-item" href="#cut-pagerank" data-target="cut-pagerank-iteration">Stepped one round at a time, how fast does the ranking settle?</a>
              </nav>
              <details className="rx-panel" name="w4-panel-jobs" data-box="jobs-bridges">
                <summary>Which jobs belong to two clusters?</summary>
                <div className="card jobs-card w4-card" id="jobs-bridges">
                  <header className="w4-q">
                    <span className="w4-num">1</span>
                    <div>
                      <h2>Which jobs belong to two clusters?</h2>
                      <p className="w4-answer">
                        None clearly: only
                        {" "}
                        <span data-jobs="bridges-pass">…</span>
                        {" "}
                        of
                        {" "}
                        <span data-jobs="bridges-tested">…</span>
                        {" "}
                        pass, fewer than the
                        {" "}
                        <span data-jobs="bridges-chance">…</span>
                        {" "}
                        chance alone passes.
                      </p>
                    </div>
                  </header>
                  <p className="sub">
                    A ringed node would mark an occupation with more employer ties to a second cluster than any
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-jobs-bridges-rewired" type="button">rewired network</button>
                      <span className="w4-pop" id="w4-term-jobs-bridges-rewired" role="tooltip">
                        A random copy of the network that keeps each company's number of occupations and each occupation's number of companies. It shows what chance alone produces.
                      </span>
                    </span>
                    {" "}
                    gives it; click a node to inspect it.
                  </p>
                  <figure className="w4-figure">
                    <figcaption>
                      <b>Occupations passing each rule</b>
                      <span>
                        Dot: the real network's count. Dashed mark: the mean over 100 rewired networks with the same cluster labels.
                      </span>
                    </figcaption>
                    <div className="w4-figure-body" id="chart-job-bridge-rule"></div>
                  </figure>
                  <div className="jobs-grid jobs-network-grid">
                    <div className="plot">
                      <h3>Occupation network</h3>
                      <div className="w4-figure-body" id="chart-job-network"></div>
                    </div>
                    <aside className="panel jobs-inspector" id="jobs-node-inspector">
                      <h2>Bridge jobs</h2>
                      <p>Ringed occupations pass the second-cluster test.</p>
                      <div className="jobs-bridge-list" id="jobs-bridge-list"></div>
                    </aside>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Colours are
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-jobs-bridges-louvain" type="button">Louvain</button>
                            <span className="w4-pop" id="w4-term-jobs-bridges-louvain" role="tooltip">
                              A standard method that splits a network into groups whose members link more to each other than to the rest.
                            </span>
                          </span>
                          {" "}
                          clusters in the full co-hiring network, named after their largest occupation.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-jobs" data-box="jobs-groups">
                <summary>Do the clusters follow official job groups?</summary>
                <div className="card jobs-card w4-card" id="jobs-groups">
                  <header className="w4-q">
                    <span className="w4-num">2</span>
                    <div>
                      <h2>Do the clusters follow official job groups?</h2>
                      <p className="w4-answer">
                        Only in part:
                        {" "}
                        <span className="w4-term">
                          <button aria-describedby="w4-term-jobs-groups-nmi" type="button">NMI</button>
                          <span className="w4-pop" id="w4-term-jobs-groups-nmi" role="tooltip">
                            Normalized mutual information: a score for how alike two groupings are, 1 when they match exactly and 0 when they are unrelated.
                          </span>
                        </span>
                        {" "}
                        <strong data-jobs="nmi">…</strong>
                        {" "}
                        against
                        {" "}
                        <strong data-jobs="shuffled">…</strong>
                        {" "}
                        for shuffled labels.
                      </p>
                    </div>
                  </header>
                  <p className="sub">
                    We compare the official groups with the clusters found from hiring
                    patterns.
                  </p>
                  <div className="jobs-grid jobs-groups-grid">
                    <div className="plot">
                      <h3>What each hiring cluster holds, by official group</h3>
                      <p className="axis-note">
                        Every occupation in the four largest clusters, 429 in all,
                        split by its official major group: the three largest named,
                        the rest grey.
                      </p>
                      <div className="w4-figure-body" id="chart-job-groups"></div>
                    </div>
                    <div className="plot">
                      <h3>How closely the clusters match the official groups</h3>
                      <p className="axis-note">
                        Orange: the hiring clusters. Ring: Infomap's clusters. Grey: the official labels shuffled 100 times over the same clusters, up to their highest score.
                      </p>
                      <div className="w4-figure-body" id="chart-job-nmi"></div>
                    </div>
                  </div>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>What to notice</b>
                      {" "}
                      The software cluster also holds engineers, accountants
                      and managers: companies hire across the official groups.
                    </span>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          The government groups occupations by their first two
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-jobs-soc" type="button">SOC</button>
                            <span className="w4-pop" id="w4-term-jobs-soc" role="tooltip">
                              The Standard Occupational Classification, the federal list of occupation codes. Its first two digits name a major group, such as 15 for computer and mathematical occupations.
                            </span>
                          </span>
                          {" "}
                          digits.
                        </p>
                        <p>Normalised mutual information runs from 0 (unrelated) to 1 (the same groups).</p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p className="sub">
                          We keep certified H-1B filings and identify companies by tax number, as in the other sections. A link counts the companies that filed for both occupations. Filings still on 2010 codes (
                          <span data-jobs="legacy">…</span>
                          ) move to their 2018 successors through O*NET's 2010-to-2019 crosswalk. Louvain runs 100 times on the full projection and the best modularity run is kept; the runs agree at a median NMI of
                          {" "}
                          <span data-jobs="runs-nmi">…</span>
                          . The null rewires the company × occupation network
                          {" "}
                          <span data-jobs="null-runs">…</span>
                          {" "}
                          times, keeping each company's number of occupations and each occupation's number of companies, and projects it again; real and rewired networks are scored on their largest connected piece (z =
                          {" "}
                          <span data-jobs="null-z">…</span>
                          ). An occupation's second cluster is the one its employer ties exceed most over the expectation modularity uses (its strength times the cluster's, over twice the total weight). A ratio above 1, our first rule, marks
                          {" "}
                          <span data-jobs="lift1">…</span>
                          {" "}
                          occupations, but the rewired networks mark
                          {" "}
                          <span data-jobs="lift1-chance">…</span>
                          {" "}
                          on average with the same cluster labels. So an occupation now counts only when its ratio beats its own ratio in every rewired network. The disparity filter at α =
                          {" "}
                          <span data-jobs="bb-alpha">…</span>
                          , as in the place section, keeps
                          {" "}
                          <span data-jobs="bb-links">…</span>
                          {" "}
                          of
                          {" "}
                          <span data-jobs="bb-total">…</span>
                          {" "}
                          links and
                          {" "}
                          <span data-jobs="bb-occ">…</span>
                          {" "}
                          occupations. Louvain on that backbone finds
                          {" "}
                          <span data-jobs="bb-clusters">…</span>
                          {" "}
                          clusters, which match the full network's at NMI
                          {" "}
                          <span data-jobs="bb-nmi">…</span>
                          , against
                          {" "}
                          <span data-jobs="bb-base">…</span>
                          {" "}
                          between two runs on the full network: the clusters only partly survive the filter. NMI and AMI leave out occupations alone in a cluster and are compared with 100 shuffles of the major-group labels. The same method on 2024 gives clusters that match 2025 at NMI
                          {" "}
                          <span data-jobs="years">…</span>
                          {" "}
                          on the
                          {" "}
                          <span data-jobs="shared">…</span>
                          {" "}
                          occupations both years share. Infomap, the random-walk method, finds
                          {" "}
                          <span data-jobs="infomap">…</span>
                          {" "}
                          clusters of two or more occupations; they agree with Louvain's at NMI
                          {" "}
                          <span data-jobs="infomap-louvain">…</span>
                          {" "}
                          and match the official groups at
                          {" "}
                          <span data-jobs="infomap-soc">…</span>
                          .
                        </p>
                        <p className="sub">
                          The shuffled bars keep the clusters fixed and scramble only the official labels. AMI, a version of NMI adjusted for chance agreement, is
                          {" "}
                          <strong data-jobs="ami">…</strong>
                          . Both scores cover the
                          {" "}
                          <span data-jobs="scored">…</span>
                          {" "}
                          occupations in clusters of two or more.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>The other two clusters of two or more hold two occupations each.</p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="qa cut rx-panel" data-box="cut-skills" id="cut-skills" name="w4-panel-jobs">
                <summary>
                  <span className="qa-cue">Skills behind the jobs, from O*NET</span>
                </summary>
                <div className="qa-body cut-body" id="skills-body">
                  <p aria-live="polite" className="status-line" id="skills-status">Loading the O*NET comparison…</p>
                </div>
              </details>
              <details className="qa cut rx-panel" data-box="cut-pagerank" id="cut-pagerank" name="w4-panel-jobs">
                <summary>
                  <span className="qa-cue">PageRank on the jobs network, step by step</span>
                </summary>
                <div className="qa-body cut-body" id="pagerank-body">
                  <p aria-live="polite" className="status-line" id="pagerank-status">Loading the PageRank explorable…</p>
                </div>
              </details>
            </details>
            <details className="rx-topic" id="topic-outsourcing" name="w4-topic">
              <summary>Outsourcing firms and their clients</summary>
              <div className="rx-topic-bar">
                <a className="rx-back" href="#cut">← Deep dive</a>
                <div>
                  <h2 className="rx-topic-title">Outsourcing firms and their clients</h2>
                  <p className="rx-topic-holds">Who places workers where, and how tightly.</p>
                </div>
                <span className="rx-topic-count"></span>
              </div>
              <nav aria-label="Boxes in this topic" className="rx-toc">
                <a className="rx-toc-item" href="#who-q2">Do clients group by industry or by the firm that staffs them?</a>
                {" "}
                <a className="rx-toc-item" href="#who-q3">Who relies on a single vendor?</a>
                {" "}
                <a className="rx-toc-item" href="#staffing-figure">The client network, year by year</a>
                {" "}
                <a className="rx-toc-item" href="#staffing-community-stats">With filing counts or without?</a>
                {" "}
                <a className="rx-toc-item" href="#staffing-ties">Strong ties, weak ties and pay</a>
                {" "}
                <a className="rx-toc-item" href="#deeper-strength">Strength against degree: where do the heavy links go?</a>
                {" "}
                <a className="rx-toc-item" href="#entity-communities">Every worker and company, grouped by what they do</a>
              </nav>
              <details className="rx-panel" name="w4-panel-outsourcing" data-box="who-q2">
                <summary>Do clients group by industry or by the firm that staffs them?</summary>
                <div className="card w4-card">
                  <div className="w4-q-block" id="who-q2">
                    <header className="w4-q">
                      <span className="w4-num">1</span>
                      <div>
                        <h2>Do clients group by industry or by the firm that staffs them?</h2>
                        <p className="w4-answer">By both, weakly, and slightly more by vendor.</p>
                      </div>
                    </header>
                    <div className="w4-two">
                      <div>
                        <figure className="w4-figure">
                          <figcaption>
                            <b>Groups against rewired networks</b>
                            <span>
                              <span className="w4-term">
                                <button aria-describedby="w4-term-topic-outsourcing-modularity" type="button">Modularity</button>
                                <span className="w4-pop" id="w4-term-topic-outsourcing-modularity" role="tooltip">
                                  How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
                                </span>
                              </span>
                              {" "}
                              of the real firm–client network, real against
                              {" "}
                              <span className="w4-term">
                                <button aria-describedby="w4-term-topic-outsourcing-rewired" type="button">rewired networks</button>
                                <span className="w4-pop" id="w4-term-topic-outsourcing-rewired" role="tooltip">
                                  Random copies of the network in which every firm and client keeps its number of partners, but the partners are dealt out again at random.
                                </span>
                              </span>
                              {" "}
                              that keep everyone's number of partners.
                            </span>
                          </figcaption>
                          <div className="w4-figure-body" data-strip="who-q2-modularity"></div>
                        </figure>
                      </div>
                      <div>
                        <figure className="w4-figure">
                          <figcaption>
                            <b>Match with vendor and industry</b>
                            <span>
                              <span className="w4-term">
                                <button aria-describedby="w4-term-topic-outsourcing-ami" type="button">AMI</button>
                                <span className="w4-pop" id="w4-term-topic-outsourcing-ami" role="tooltip">
                                  Adjusted mutual information: how closely two ways of grouping the same clients agree, corrected for the agreement random labels would reach by chance.
                                </span>
                              </span>
                              {" "}
                              between the groups and each client's main vendor or industry, 0 = labels dealt at random. Filled: the main vendor; hollow: the industry.
                            </span>
                          </figcaption>
                          <div className="w4-figure-body" data-strip="who-q2-ami"></div>
                        </figure>
                      </div>
                    </div>
                    <div className="rx-drawers rx-foot">
                      <details className="rx-drawer">
                        <summary>More numbers</summary>
                        <div className="rx-drawer-body">
                          <p>
                            With every firm–client link counted once, Louvain splits the network into about 65 groups, and the split beats rewired networks that keep everyone's number of partners (modularity 0.57 against 0.53). Among the 1,209 clients with a known industry and two or more firms, the groups match the main vendor at an adjusted mutual information (AMI) of 0.11 and the industry at 0.07; both beat shuffled labels.
                          </p>
                          <p>
                            AMI corrects NMI for chance, which matters here: these clients have 478 main vendors but only 17 industries. Counting filings pulls clients to their main vendor (AMI 0.48 against 0.07), but that split scores below rewired networks with the same filing counts (0.60 against 0.74), and the vendor's head start is built in: the vendor is a node in the same network, and 86% of these clients land in its group.
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-outsourcing" data-box="who-q3">
                <summary>Who relies on a single vendor?</summary>
                <div className="card w4-card">
                  <div className="w4-q-block" id="who-q3">
                    <header className="w4-q">
                      <span className="w4-num">2</span>
                      <div>
                        <h2>Who relies on a single vendor?</h2>
                        <p className="w4-answer">Small clients.</p>
                      </div>
                    </header>
                    <p className="sub">14,678 of the 18,900 clients use one firm, but they hold 22% of placed filings.</p>
                    <div className="rx-fig-row">
                      <figure className="w4-figure">
                        <figcaption>
                          <b>One firm, many clients, few filings</b>
                          <span>
                            Clients that use a single firm, as a share of all clients and of all placed filings, 2025.
                          </span>
                        </figcaption>
                        <div className="w4-figure-body" data-strip="who-q3-concentration"></div>
                      </figure>
                      <figure className="w4-figure">
                        <figcaption>
                          <b>How concentrated the big clients are</b>
                          <span>
                            The dot is the median share of a client's filings held by its largest vendor, among clients with 20 or more filings; the dashed line marks 90%.
                          </span>
                        </figcaption>
                        <div className="w4-figure-body" data-strip="who-q3-topshare"></div>
                      </figure>
                    </div>
                    <div className="rx-drawers rx-foot">
                      <details className="rx-drawer">
                        <summary>More numbers</summary>
                        <div className="rx-drawer-body">
                          <p>
                            Of the 629 clients with 20 or more filings, 69 get over 90% from one firm, and the median one gets 37% from its largest.
                          </p>
                          <p>
                            Citigroup, the largest client, uses 114 firms, and Tata Consultancy Services supplies a quarter. The eight largest firms supply only 27% of what the 20 largest clients receive.
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-outsourcing" data-box="staffing-figure">
                <summary>The client network, year by year</summary>
                <div className="card w4-card">
                  <header className="w4-q">
                    <span className="w4-num">3</span>
                    <div>
                      <h2>The client network, year by year</h2>
                    </div>
                  </header>
                  <figure className="staffing" id="staffing-figure">
                    <div className="staffing-controls">
                      <div aria-label="Fiscal year, October to September" className="staffing-years" role="group">
                        <button aria-pressed="false" data-year="2022" type="button">2022</button>
                        <button aria-pressed="false" data-year="2023" type="button">2023</button>
                        <button aria-pressed="false" data-year="2024" type="button">2024</button>
                        <button aria-pressed="true" data-year="2025" type="button">2025</button>
                        <button aria-pressed="false" data-year="2026" type="button">
                          2026 · Oct–Jun
                        </button>
                      </div>
                      <label className="staffing-search">
                        Find a client
                        {" "}
                        <input autoComplete="off" list="staffing-names" type="search" />
                        <datalist id="staffing-names"></datalist>
                      </label>
                    </div>
                    <div className="staffing-grid">
                      <div className="staffing-chart">
                        <div aria-label="Scatter plot of client companies: placed H-1B filings against the share supplied by the client's largest vendor. The table below lists the same data." className="chart-host" role="img"></div>
                      </div>
                      <div aria-live="polite" className="staffing-panel">Loading the filings…</div>
                    </div>
                    <figcaption>
                      One dot per client company with 20 or more H-1B filings that placed
                      a worker there in the year: further right, more filings; higher up,
                      more of them from a single outsourcing firm. Click a dot or type a
                      name to see who supplies that client.
                    </figcaption>
                    <div className="rx-table-block">
                      <h4>The 25 largest clients</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Client</th>
                            <th>Sector</th>
                            <th className="num">Filings</th>
                            <th className="num">Vendors</th>
                            <th>Largest vendor</th>
                            <th className="num">Its share</th>
                          </tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </div>
                    <div className="staffing-flows">
                      <h3>Who supplies the largest clients</h3>
                      <div aria-label="Flow chart: the eight outsourcing firms that place the most H-1B filings, plus one source for all other firms, on the left; the twenty clients that receive the most on the right; a band for the filings between each pair." className="chart-host" role="img"></div>
                      <p className="flows-caption">
                        The eight firms that place the most filings, and the 20
                        clients that receive the most, in the year chosen above. Band
                        width is the number of placed filings from a firm to a client;
                        the grey source gathers every other firm. Each client sits next
                        to the named firm that supplies it most. Hover a firm or a
                        client to follow its bands.
                        {" "}
                        <span className="flows-coverage"></span>
                      </p>
                    </div>
                  </figure>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Only three sectors get a colour: finance and insurance, manufacturing and health care. Other known sectors are light grey, and the palest dots are clients with no sector on record.
                        </p>
                        <p>
                          Band width is the number of placed filings from a firm to a client; the grey source gathers every other firm. Each client sits next to the named firm that supplies it most.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-outsourcing" data-box="staffing-community-stats">
                <summary>With filing counts or without?</summary>
                <div className="card w4-card" id="staffing-community-stats">
                  <header className="w4-q">
                    <span className="w4-num">4</span>
                    <div>
                      <h2>With filing counts or without?</h2>
                      <p className="w4-answer">
                        Filing counts change the grouping: the two partitions share an
                        {" "}
                        <span className="w4-term">
                          <button aria-describedby="w4-term-staffing-community-stats-nmi" type="button">NMI</button>
                          <span className="w4-pop" id="w4-term-staffing-community-stats-nmi" role="tooltip">
                            Normalised mutual information: how much two groupings of the same clients agree, from unrelated to identical. Unlike AMI, it is not corrected for chance.
                          </span>
                        </span>
                        {" "}
                        of
                        {" "}
                        <b className="cross">…</b>
                        , less than two seeds of either kind (
                        <b className="seeds">…</b>
                        {" "}
                        weighted,
                        {" "}
                        <b className="seeds-plain">…</b>
                        {" "}
                        unweighted).
                      </p>
                    </div>
                  </header>
                  <div className="w4-two">
                    <div>
                      <p className="sub">
                        Filing counts pull clients toward vendors: AMI with each client's main vendor rises from
                        {" "}
                        <b className="vendor-plain">…</b>
                        {" "}
                        to
                        {" "}
                        <b className="vendor">…</b>
                        {" "}
                        when filings count, while AMI with industry stays near
                        {" "}
                        <b className="industry">…</b>
                        .
                      </p>
                      <p className="sub">
                        Against rewired networks, without weights the real network wins (
                        <b className="mod-plain">…</b>
                        {" "}
                        against
                        {" "}
                        <b className="null-plain">…</b>
                        ); with weights it loses (
                        <b className="mod">…</b>
                        {" "}
                        against
                        {" "}
                        <b className="null">…</b>
                        ).
                      </p>
                      <table className="ego">
                        <thead>
                          <tr>
                            <th></th>
                            <th style={{"textAlign":"right"}}>Weighted</th>
                            <th style={{"textAlign":"right"}}>Unweighted</th>
                          </tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                      <div className="rx-drawers rx-foot">
                        <details className="rx-drawer">
                          <summary>Method</summary>
                          <div className="rx-drawer-body">
                            <p>
                              We ran
                              {" "}
                              <span className="w4-term">
                                <button aria-describedby="w4-term-staffing-community-stats-louvain" type="button">Louvain</button>
                                <span className="w4-pop" id="w4-term-staffing-community-stats-louvain" role="tooltip">
                                  A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get. It starts from a random order, so two runs can differ.
                                </span>
                              </span>
                              {" "}
                              on the 2025 firm–client network 100 times each way: with links weighted by filings, and with every link counting one.
                            </p>
                            <p>
                              The
                              {" "}
                              <span className="w4-term">
                                <button aria-describedby="w4-term-staffing-community-stats-null" type="button">null model</button>
                                <span className="w4-pop" id="w4-term-staffing-community-stats-null" role="tooltip">
                                  A random version of the network that keeps some of its features, here each node's number of partners, to show what chance alone would give.
                                </span>
                              </span>
                              {" "}
                              rewires the network so every firm and client keeps its number of partners.
                            </p>
                            <p>
                              Infomap agrees with Louvain at NMI
                              {" "}
                              <b className="im-louvain">…</b>
                              . Finer partitions raise every NMI; AMI corrects for that, so it is the number to compare across methods.
                            </p>
                          </div>
                        </details>
                        <details className="rx-drawer">
                          <summary>More numbers</summary>
                          <div className="rx-drawer-body">
                            <p>
                              Infomap, which follows a random walk instead of counting links, splits the same network into
                              {" "}
                              <b className="im-modules">…</b>
                              {" "}
                              small modules, most of them a firm with its clients. Like weighted Louvain, it follows the vendor far more than the industry (AMI
                              {" "}
                              <b className="im-vendor">…</b>
                              {" "}
                              against
                              {" "}
                              <b className="im-industry">…</b>
                              ).
                            </p>
                            <p>
                              The null also deals the filing counts back out at random. Rewiring breaks the network into a median of
                              {" "}
                              <b className="pieces">…</b>
                              {" "}
                              pieces, each a free community, so we score each rewired network on its largest piece, as we do the real one. The real network also loses when only the filing counts are shuffled on the real links (
                              <b className="null-weights">…</b>
                              ). The real counts leave
                              {" "}
                              <b className="cross-share">…</b>
                              {" "}
                              of filings on links between groups, against
                              {" "}
                              <b className="cross-share-null">…</b>
                              {" "}
                              with shuffled counts: clients that use several firms hold
                              {" "}
                              <b className="multi-links">…</b>
                              {" "}
                              of the links but
                              {" "}
                              <b className="multi-filings">…</b>
                              {" "}
                              of the filings, and only their links can cross, since a client with one firm sits in that firm's group.
                            </p>
                          </div>
                        </details>
                      </div>
                    </div>
                    <div>
                      <figure className="w4-figure">
                        <figcaption>
                          <b>Modularity with and without filing counts</b>
                          <span>
                            Dots: the real network. Grey: rewired networks, or the real links with their filing counts shuffled.
                          </span>
                        </figcaption>
                        <div className="w4-figure-body" data-strip="staffing-community-modularity"></div>
                      </figure>
                    </div>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-outsourcing" data-box="staffing-ties">
                <summary>Strong ties, weak ties and pay</summary>
                <div className="card w4-card" id="staffing-ties">
                  <header className="w4-q">
                    <span className="w4-num">5</span>
                    <div>
                      <h2>Strong ties, weak ties and pay</h2>
                      <p className="w4-answer">Here the pattern runs the other way, faintly.</p>
                    </div>
                  </header>
                  <p className="sub">
                    Among friends, the strongest ties sit inside tight groups where your close friends also know each other, and weak ties bridge the groups (Granovetter 1973; Onnela and colleagues confirmed it on millions of phone users in 2007).
                  </p>
                  <div className="rx-fig-row">
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Heavy links, looser neighbourhoods</b>
                        <span>
                          <span className="w4-term">
                            <button aria-describedby="w4-term-staffing-ties-spearman" type="button">Spearman correlation</button>
                            <span className="w4-pop" id="w4-term-staffing-ties-spearman" role="tooltip">
                              A measure of whether two quantities rise together, computed on their ranks rather than their values.
                            </span>
                          </span>
                          {" "}
                          between a link's filings and its
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-staffing-ties-overlap" type="button">overlap</button>
                            <span className="w4-pop" id="w4-term-staffing-ties-overlap" role="tooltip">
                              Of the firm's other clients and the client's other firms, the share that are linked to each other. High overlap means a tight neighbourhood.
                            </span>
                          </span>
                          , against 100 shuffles of the filing counts over the same links.
                        </span>
                      </figcaption>
                      <div className="w4-figure-body" data-strip="staffing-ties-overlap"></div>
                    </figure>
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Wage levels as filed</b>
                        <span>
                          Share of each kind of employer's 2025 filings at each
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-staffing-ties-wagelevel" type="button">prevailing-wage level</button>
                            <span className="w4-pop" id="w4-term-staffing-ties-wagelevel" role="tooltip">
                              A level set by the experience and skills the job asks for, from entry to fully competent. Each level carries a wage floor.
                            </span>
                          </span>
                          .
                        </span>
                      </figcaption>
                      <div className="w4-figure-body" data-strip="staffing-ties-wage"></div>
                    </figure>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          A link's
                          {" "}
                          <b>overlap</b>
                          {" "}
                          measures the tightness: of the firm's other clients and the client's other firms, the share that are linked to each other.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Over the 28,104 links where overlap is defined, filings and overlap correlate at Spearman -0.04; with the filing counts shuffled over the same links the correlation is 0.00 ± 0.01 (z = -6.3; 2024 gives z = -3.7). Links with one filing have a mean overlap of 0.065, links with 21 or more 0.034. Heavy links mostly belong to the largest firms, whose many clients rarely share other firms, so part of this is size. It agrees with the result above: the real filing counts put weight on links between groups. Each filing states one of four wage levels, from entry (I) to fully competent (IV). Averaged per client over the filings that reach it, the groups explain 13% of the variance in wage level; averaged per firm over all its filings, 3%. None of 1,000 shuffles of the group labels reached either. A client's filings come from the vendors that also decide its group, so part of the 13% is built in. Outsourcing firms file 66% of their applications at level II and 5% at level IV; direct employers file 35% and 22%. From January to June 2026, level IV rose to 17.7% of all filings from 13.6% a year earlier, and level I fell to 18.0% from 21.8%.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-outsourcing" data-box="deeper-strength">
                <summary>Strength against degree: where do the heavy links go?</summary>
                <div className="card w4-card" id="deeper-strength">
                  <header className="w4-q">
                    <span className="w4-num">6</span>
                    <div>
                      <h2>Strength against degree: where do the heavy links go?</h2>
                      <p className="w4-answer">Three of the top five are therapy and rehab clinics.</p>
                    </div>
                  </header>
                  <div className="w4-two">
                    <div>
                      <p className="sub">
                        The course compares a node's degree (how many partners) with its strength (how many filings over all its links), and finds the exceptions tell the story.
                      </p>
                      <div className="notice">
                        <span className="ico">💡</span>
                        <span>
                          <b>What to notice</b>
                          {" "}
                          Degree and strength rank firms almost alike (Spearman 0.91) but clients less so (0.75): the heaviest single ties go to therapy and rehab clinics, led by Ultimate Therapy with 133 filings from one firm.
                        </span>
                      </div>
                      <div className="rx-drawers rx-foot">
                        <details className="rx-drawer">
                          <summary>Background</summary>
                          <div className="rx-drawer-body"></div>
                        </details>
                        <details className="rx-drawer">
                          <summary>More numbers</summary>
                          <div className="rx-drawer-body">
                            <p>
                              In the 2025 firm–client network the two rank firms almost alike (Spearman 0.91) and clients less so (0.75). The clients with the most filings from a single firm are Ultimate Therapy, 133 filings from one firm; Sigma Rehab, 95; Post Rehab Services, 61; and Grady Memorial Hospital, 58.
                            </p>
                          </div>
                        </details>
                      </div>
                    </div>
                    <figure className="w4-figure">
                      <figcaption>
                        <b>The heaviest one-to-one ties</b>
                        <span>The clients with the most filings from a single firm. Dark bars: health care.</span>
                      </figcaption>
                      <div className="w4-figure-body" data-more="strength"></div>
                    </figure>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-outsourcing" data-box="entity-communities">
                <summary>Every worker and company, grouped by what they do</summary>
                <div className="card w4-card">
                  <header className="w4-q">
                    <span className="w4-num">7</span>
                    <div>
                      <h2>Do workers group by job and pay, or by who files for them?</h2>
                      <p className="w4-answer" data-entities="answer">Loading the filings…</p>
                    </div>
                  </header>
                  <figure className="w4-entities" id="entity-communities">
                    <div className="w4-entities-controls">
                      <div aria-label="What each dot is" className="w4-entities-switch" role="group">
                        <button aria-pressed="true" data-entity="workers" type="button">Workers</button>
                        <button aria-pressed="false" data-entity="companies" type="button">Companies</button>
                        <button aria-pressed="false" data-entity="staffing" type="button">Staffing network</button>
                        <button aria-pressed="false" data-entity="lawfirms" type="button">Law-firm network</button>
                      </div>
                      <div className="w4-entities-net" hidden>
                        <label>
                          Backbone
                          {" "}
                          <select aria-label="Disparity filter cut"></select>
                        </label>
                        <div aria-label="Links the filter drops" className="w4-entities-switch" role="group">
                          <button aria-pressed="true" data-dropped="faint" type="button">Dropped faint</button>
                          <button aria-pressed="false" data-dropped="hidden" type="button">Hidden</button>
                        </div>
                      </div>
                      <label className="w4-entities-colour">
                        Colour by
                        {" "}
                        <select>
                          <option value="community">Community</option>
                          <option value="sector">Sector</option>
                          <option value="level">Wage level</option>
                          <option value="pagerank">PageRank</option>
                        </select>
                      </label>
                    </div>
                    <div className="w4-entities-stage">
                      <button className="w4-entities-reset" type="button">Reset view</button>
                      <div aria-label="Every worker or company in the 2025 filings as a dot, coloured by its community. The table below lists the same groups." className="w4-entities-map" role="img" tabIndex={0}></div>
                    </div>
                    <ul aria-label="Legend: click a group to highlight it" className="w4-entities-legend"></ul>
                    <figcaption data-entities="caption"></figcaption>
                    <div className="w4-entities-facts">
                      <div>
                        <h4 data-entities-text="labels-head">What the groups follow</h4>
                        <p className="axis-note" data-entities-text="labels-note">
                          NMI between the groups and each label, weighted by workers. Hollow dots were never part of the network. Bands: the same label shuffled, the level a label with that many values reaches by chance. Dashed: two Louvain seeds against each other.
                        </p>
                        <div data-entities="labels"></div>
                      </div>
                      <div>
                        <h4>The network against random ones</h4>
                        <p className="axis-note">
                          Dots: the real network. Bands: rewired networks that keep every degree, or shuffled kinds.
                        </p>
                        <div data-entities="strips"></div>
                      </div>
                    </div>
                    <div className="w4-entities-facts">
                      <div>
                        <h4 data-entities-text="ccdf-head">How many links?</h4>
                        <p className="axis-note" data-entities-text="ccdf-note">
                          Share of occupations, metros, levels and sectors with at least a given number of links or workers, log-log.
                        </p>
                        <div data-entities="ccdf"></div>
                      </div>
                      <div className="w4-entities-weeks" data-entities="weeks"></div>
                    </div>
                    <div className="rx-table-block" data-entities="table">
                      <h4>The largest groups</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Group</th>
                            <th className="num">Workers</th>
                            <th className="num">H-1B</th>
                            <th className="num">PERM</th>
                            <th>Main occupation</th>
                            <th>Largest employers</th>
                          </tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </div>
                  </figure>
                </div>
              </details>
            </details>
            <details className="rx-topic" id="topic-paperwork" name="w4-topic">
              <summary>Paperwork, the lottery and green cards</summary>
              <div className="rx-topic-bar">
                <a className="rx-back" href="#cut">← Deep dive</a>
                <div>
                  <h2 className="rx-topic-title">Paperwork, the lottery and green cards</h2>
                  <p className="rx-topic-holds">What happens around a filing: the lawyers, the draw, USCIS and the green card after it.</p>
                </div>
                <span className="rx-topic-count"></span>
              </div>
              <nav aria-label="Boxes in this topic" className="rx-toc">
                <a className="rx-toc-item" href="#staffing-lawyers">Who files the paperwork?</a>
                {" "}
                <a className="rx-toc-item" href="#staffing-lottery">Do the firms that register the same workers staff the same clients?</a>
                {" "}
                <a className="rx-toc-item" href="#deeper-lottery">The lottery a year apart, and who receives the winners</a>
                {" "}
                <a className="rx-toc-item" href="#deeper-uscis">USCIS denials, year by year</a>
                {" "}
                <a className="rx-toc-item" href="#deeper-perm">Who keeps them? Green cards as the strong tie</a>
                {" "}
                <a className="rx-toc-item" href="#deeper-countries">Where are they from? A network of countries</a>
              </nav>
              <details className="rx-panel" name="w4-panel-paperwork" data-box="staffing-lawyers">
                <summary>Who files the paperwork?</summary>
                <div className="card w4-card" id="staffing-lawyers">
                  <header className="w4-q">
                    <span className="w4-num">1</span>
                    <div>
                      <h2>Who files the paperwork?</h2>
                      <p className="w4-answer">Three filings in four name an outside law firm, and five firms file 40% of those.</p>
                    </div>
                  </header>
                  <div className="rx-fig-row">
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Who uses an outside law firm</b>
                        <span>
                          Pooled over employers with 20 or more filings, 2025. Orange: outsourcing firms; the dashed line marks direct employers.
                        </span>
                      </figcaption>
                      <div className="w4-figure-body" data-strip="staffing-lawyers-outsourcing"></div>
                    </figure>
                    <figure className="w4-figure">
                      <figcaption>
                        <b>The five largest law firms</b>
                        <span>Certified H-1B filings each prepared in 2025.</span>
                      </figcaption>
                      <div className="w4-figure-body" data-strip="staffing-lawyers-top5"></div>
                    </figure>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Background</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Two law firms share filings when the same employer uses both: for each such employer, the smaller of its filings through either. That network has one giant hub, the case the
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-staffing-lawyers-disparity" type="button">disparity filter</button>
                            <span className="w4-pop" id="w4-term-staffing-lawyers-disparity" role="tooltip">
                              A way to thin a network: it keeps a link only when its weight is larger than chance would give, judged against each firm's own total. α sets how strict that test is.
                            </span>
                          </span>
                          {" "}
                          was made for. A weight threshold of four shared filings keeps 771 links and spends 26% of them on the five largest firms. The disparity filter at α = 0.2 keeps 697 and spends 19%. It also keeps 115 small firms the threshold drops, such as one law office whose link to BBI Law Group is 3 of its 5 shared filings and 3 of BBI's 342. The threshold keeps the larger connected core, 395 firms against the filter's 351. Another 144 firms stay only because they form a pair linked to nobody else, where neither end can judge the link.
                        </p>
                        <p>
                          <span className="w4-term">
                            <button aria-describedby="w4-term-staffing-lawyers-louvain" type="button">Louvain</button>
                            <span className="w4-pop" id="w4-term-staffing-lawyers-louvain" role="tooltip">
                              A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get.
                            </span>
                          </span>
                          {" "}
                          finds 34 groups at
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-staffing-lawyers-modularity" type="button">modularity</button>
                            <span className="w4-pop" id="w4-term-staffing-lawyers-modularity" role="tooltip">
                              How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
                            </span>
                          </span>
                          {" "}
                          0.67, against 0.55 for rewired networks that keep each employer's and each law firm's number of partners (z = 12). The groups are barely regional (
                          <span className="w4-term">
                            <button aria-describedby="w4-term-staffing-lawyers-nmi" type="button">NMI</button>
                            <span className="w4-pop" id="w4-term-staffing-lawyers-nmi" role="tooltip">
                              Normalised mutual information: how much two groupings of the same items agree, from 0 (unrelated) to 1 (identical).
                            </span>
                          </span>
                          {" "}
                          0.05 with Census regions, though above every shuffle), and the largest gather around shared employers. Google, Apple and Meta share Fragomen, Ogletree Deakins and Berry Appleman &amp; Leiden; Tata Consultancy, LTIMindtree and Salesforce share Usilaw, Goel &amp; Anderson and Chugh; Vialto, once PwC's law firm, serves Doordash and Databricks. The groups move from year to year: 2024 and 2025 agree at NMI 0.30 on the 1,041 law firms in both, against 0.88 between two runs of 2025.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Fragomen alone files 78,531 for 3,129 employers. Outsourcing firms mostly do without: they file 52% of their applications with no outside firm and send 3% to the five largest, while direct employers send those five 48%. Per employer the averages are 2% and 30%, and none of 1,000 shuffles of which employer is which produced a gap that wide.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-paperwork" data-box="staffing-lottery">
                <summary>Do the firms that register the same workers staff the same clients?</summary>
                <div className="card w4-card" id="staffing-lottery">
                  <header className="w4-q">
                    <span className="w4-num">2</span>
                    <div>
                      <h2>Do the firms that register the same workers staff the same clients?</h2>
                      <p className="w4-answer">No. Firms that register the same workers are spread across the staffing groups.</p>
                    </div>
                  </header>
                  <p className="sub">
                    We took the 2,942 firms in the 2023 staffing network that sent 20 or more registrations to the March 2023 draw, and split them at the median share of workers another employer had also registered (78%).
                  </p>
                  <div className="rx-fig-row">
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Do high firms cluster?</b>
                        <span>Share of high firms in a high firm's group. Dashed: the same with the labels shuffled.</span>
                      </figcaption>
                      <div className="w4-figure-body" data-strip="staffing-lottery-mates"></div>
                    </figure>
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Agreement with the groups</b>
                        <span>AMI between the high/low split and the staffing groups; the line spans 100 runs.</span>
                      </figcaption>
                      <div className="w4-figure-body" data-strip="staffing-lottery-ami"></div>
                    </figure>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          If the high firms clustered, a high firm's Louvain group would be mostly high firms. It is 51.2% high, against 50.0% when the labels are shuffled (p = 0.001 over 1,000 shuffles), and
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-staffing-lottery-ami" type="button">AMI</button>
                            <span className="w4-pop" id="w4-term-staffing-lottery-ami" role="tooltip">
                              Adjusted mutual information: how closely two ways of grouping the same firms agree. 0 is what chance gives, 1 is a perfect match.
                            </span>
                          </span>
                          {" "}
                          with the groups is 0.004 over 100 runs. The March 2022 draw against the 2022 network gives 51.9% against 50.0%. The lottery data is USCIS's, obtained by Bloomberg News.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-paperwork" data-box="deeper-lottery">
                <summary>The lottery a year apart, and who receives the winners</summary>
                <div className="card w4-card" id="deeper-lottery">
                  <header className="w4-q">
                    <span className="w4-num">3</span>
                    <div>
                      <h2>The lottery a year apart, and who receives the winners</h2>
                      <p className="w4-answer">One approved petition took 5.2 registrations in 2022 and 8.5 in 2023.</p>
                    </div>
                  </header>
                  <div className="w4-two">
                    <div>
                      <p className="sub">
                        The ratio divides each year's registrations by its approved petitions, using USCIS's lottery files, obtained by Bloomberg News.
                      </p>
                    </div>
                    <div>
                      <div className="notice">
                        <span className="ico">💡</span>
                        <span>
                          <b>What to notice</b>
                          {" "}
                          The two draws this box can split by employer were the most crowded: registrations per selection rose from 2.2 in March 2020 to 4.0 in March 2023, then fell to 2.9 by March 2025 once each worker counted once.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rx-fig-row">
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Every draw since 2020</b>
                        <span>
                          Eligible registrations per selected registration; the figure under each date is the share of registrations for a worker registered more than once.
                        </span>
                      </figcaption>
                      <div className="w4-figure-body" data-more="draws"></div>
                    </figure>
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Registrations per approved petition</b>
                        <span>Each line joins one kind of employer across the two draws Bloomberg's USCIS files cover.</span>
                      </figcaption>
                      <div className="w4-figure-body" data-more="lottery"></div>
                    </figure>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>From March 2024 USCIS drew by person, not by registration.</p>
                        <p>
                          The every-draw chart divides eligible by selected registrations from the historical table on USCIS's H-1B Electronic Registration Process page; its selections include later rounds, so its ratio is lower than the one per approved petition.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          Between the March 2022 and March 2023 draws,
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-deeper-lottery-registrations" type="button">registrations</button>
                            <span className="w4-pop" id="w4-term-deeper-lottery-registrations" role="tooltip">
                              Entries in the H-1B lottery. Each spring employers register the workers they want to sponsor, and USCIS draws at random from the entries.
                            </span>
                          </span>
                          {" "}
                          for a worker whom another employer had also registered rose from 35% to 54% of the total, and the share of drawn registrations that became a petition fell from 74% to 49%. The order held both years: direct employers needed the fewest (4.3, then 5.1), placing firms more (6.3, then 9.1). Of the March 2023 petitions, 20% lead to a client company, 66% of those through placing firms. Citigroup received 342, 94% through placing firms; Microsoft 150, 95%, with LTIMindtree supplying 47%; AT&amp;T 153, with Tech Mahindra supplying 41%. USCIS also denied 2.0% of the placing firms' lottery petitions against 1.1% of direct employers'.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-paperwork" data-box="deeper-uscis">
                <summary>USCIS denials, year by year</summary>
                <div className="card w4-card" id="deeper-uscis">
                  <header className="w4-q">
                    <span className="w4-num">4</span>
                    <div>
                      <h2>USCIS denials, year by year</h2>
                      <p className="w4-answer">
                        Share of first-time H-1B petitions USCIS denied, for employers with 20 or more certified filings that year.
                      </p>
                    </div>
                  </header>
                  <p className="sub">
                    From the
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-deeper-uscis-hub" type="button">hub</button>
                      <span className="w4-pop" id="w4-term-deeper-uscis-hub" role="tooltip">
                        USCIS's H-1B Employer Data Hub, which publishes approved and denied petitions per employer.
                      </span>
                    </span>
                    's
                    Tableau export; 2026 runs October to June. Placing firms put half or more of their filings at a client.
                  </p>
                  <table className="ego" data-rx-bars="1:0.04:placing,2:0.04:direct">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th style={{"textAlign":"right"}}>Placing firms</th>
                        <th style={{"textAlign":"right"}}>Direct employers</th>
                        <th style={{"textAlign":"right"}}>Placing firms counted</th>
                        <th style={{"textAlign":"right"}}>Direct employers counted</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2022</td>
                        <td style={{"textAlign":"right"}}>2.71%</td>
                        <td style={{"textAlign":"right"}}>1.22%</td>
                        <td style={{"textAlign":"right"}}>1,057</td>
                        <td style={{"textAlign":"right"}}>2,288</td>
                      </tr>
                      <tr>
                        <td>2023</td>
                        <td style={{"textAlign":"right"}}>3.57%</td>
                        <td style={{"textAlign":"right"}}>1.48%</td>
                        <td style={{"textAlign":"right"}}>873</td>
                        <td style={{"textAlign":"right"}}>2,080</td>
                      </tr>
                      <tr>
                        <td>2024</td>
                        <td style={{"textAlign":"right"}}>2.65%</td>
                        <td style={{"textAlign":"right"}}>1.28%</td>
                        <td style={{"textAlign":"right"}}>884</td>
                        <td style={{"textAlign":"right"}}>2,403</td>
                      </tr>
                      <tr>
                        <td>2025</td>
                        <td style={{"textAlign":"right"}}>3.20%</td>
                        <td style={{"textAlign":"right"}}>1.56%</td>
                        <td style={{"textAlign":"right"}}>933</td>
                        <td style={{"textAlign":"right"}}>2,466</td>
                      </tr>
                      <tr>
                        <td>2026, Oct–Jun</td>
                        <td style={{"textAlign":"right"}}>3.35%</td>
                        <td style={{"textAlign":"right"}}>1.98%</td>
                        <td style={{"textAlign":"right"}}>601</td>
                        <td style={{"textAlign":"right"}}>1,863</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="notice">
                    <span className="ico">💡</span>
                    <span>
                      <b>What to notice</b>
                      {" "}
                      Every year USCIS denied placing firms about twice the share it denied direct employers: 3.20% against 1.56% in 2025.
                    </span>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-paperwork" data-box="deeper-perm">
                <summary>Who keeps them? Green cards as the strong tie</summary>
                <div className="card w4-card" id="deeper-perm">
                  <header className="w4-q">
                    <span className="w4-num">5</span>
                    <div>
                      <h2>Who keeps them? Green cards as the strong tie</h2>
                      <p className="w4-answer">
                        An H-1B filing is a weak tie between employer and worker; a green-card filing (
                        <span className="w4-term">
                          <button aria-describedby="w4-term-deeper-perm-perm" type="button">PERM</button>
                          <span className="w4-pop" id="w4-term-deeper-perm-perm" role="tooltip">
                            The Department of Labor's permanent labor certification, the first step of most green cards through work. The employer sponsors the worker to stay.
                          </span>
                        </span>
                        ) is a strong one.
                      </p>
                    </div>
                  </header>
                  <div className="w4-two">
                    <div>
                      <p className="sub">Only 65% of certified green cards come from an employer we can match to an H-1B filer.</p>
                      <div className="notice">
                        <span className="ico">💡</span>
                        <span>
                          <b>What to notice</b>
                          {" "}
                          Among employers with 20 or more H-1B filings, the median files 13.2 green cards per 100 H-1B filings, yet Oracle files 95 while Amazon, with 22,509 H-1B filings, files almost none.
                        </span>
                      </div>
                      <div className="rx-drawers rx-foot">
                        <details className="rx-drawer">
                          <summary>Method</summary>
                          <div className="rx-drawer-body"></div>
                        </details>
                        <details className="rx-drawer">
                          <summary>More numbers</summary>
                          <div className="rx-drawer-body">
                            <p>
                              In 2025 the median employer with 20 or more H-1B filings filed 13.2 green cards per 100 of them, and the two counts rank employers only loosely alike (
                              <span className="w4-term">
                                <button aria-describedby="w4-term-deeper-perm-spearman" type="button">Spearman</button>
                                <span className="w4-pop" id="w4-term-deeper-perm-spearman" role="tooltip">
                                  A rank correlation: 1 means two counts put employers in the same order, 0 means no relation.
                                </span>
                              </span>
                              {" "}
                              0.50). As with degree and strength in the course, the exceptions carry the story: Oracle filed 95 green cards per 100 H-1B filings, Uber 64 and Salesforce 45, while Amazon (22,509 H-1B filings), Cognizant (11,085) and Google (8,657) filed almost none. Whether outsourcing firms sponsor fewer is
                              {" "}
                              <a href="#beyond-perm">section 5B</a>
                              . Clients sponsor their own staff too: Wells Fargo receives 1,547 H-1B filings from vendors, files 624 of its own and 167 green cards. Firms with more clients sponsor slightly more green cards, not fewer (Spearman 0.13).
                            </p>
                          </div>
                        </details>
                      </div>
                    </div>
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Green cards per 100 H-1B filings</b>
                        <span>
                          The six employers the text names, 2025; not a ranking. Dashed line: the median employer with 20 or more H-1B filings.
                        </span>
                      </figcaption>
                      <div className="w4-figure-body" data-more="perm"></div>
                    </figure>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-paperwork" data-box="deeper-countries">
                <summary>Where are they from? A network of countries</summary>
                <div className="card w4-card" id="deeper-countries">
                  <header className="w4-q">
                    <span className="w4-num">6</span>
                    <div>
                      <h2>Where are they from? A network of countries</h2>
                      <p className="w4-answer">Green-card hiring does not sort countries into regional blocs.</p>
                    </div>
                  </header>
                  <div className="w4-two">
                    <div>
                      <p className="sub">
                        We link two countries when the same employers file green cards for citizens of both, then ask whether those links form regional groups. The groups match world regions only weakly (AMI 0.10).
                      </p>
                    </div>
                    <div>
                      <div className="notice">
                        <span className="ico">💡</span>
                        <span>
                          <b>What to notice</b>
                          {" "}
                          Counted once, the country links group a little more than rewired copies (modularity 0.10 against 0.06); weighted by shared green cards they group less (0.26 against 0.40).
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rx-fig-row">
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Citizenship of 2023's green cards</b>
                        <span>Share of certified green-card filings in the counted cells.</span>
                      </figcaption>
                      <div className="w4-figure-body" data-more="countries-top"></div>
                    </figure>
                    <figure className="w4-figure">
                      <figcaption>
                        <b>Do countries group?</b>
                        <span>Modularity of the country network against rewired copies.</span>
                      </figcaption>
                      <div className="w4-figure-body" data-more="countries-modularity"></div>
                    </figure>
                  </div>
                  <div className="rx-drawers rx-foot">
                    <details className="rx-drawer">
                      <summary>Method</summary>
                      <div className="rx-drawer-body">
                        <p>
                          A worker's citizenship is personal, so we read it only in memory and keep counts per country and employer, dropping every count under 10. That drops 96% of the cells and 43% of 2023's certified green-card filings, and no row about a single person is ever saved.
                        </p>
                      </div>
                    </details>
                    <details className="rx-drawer">
                      <summary>More numbers</summary>
                      <div className="rx-drawer-body">
                        <p>
                          India holds 52% of those filings and China 12%; among lottery registrations, India holds 77% in the March 2022 draw and 81% in March 2023. Link two countries by the green cards their citizens receive at the same employers and 55 countries remain. Louvain splits them into three groups. Counted once each, the links group a little more than rewired copies (modularity 0.10 against 0.06); weighted by shared green cards, they group less (0.26 against 0.40). India and China share one group with Canada, Belarus and Costa Rica, and India keeps 79% of its weight inside it. Among the ten largest sponsors, Google's green cards are the most varied, 4.7
                          {" "}
                          <span className="w4-term">
                            <button aria-describedby="w4-term-deeper-countries-effective" type="button">effective countries</button>
                            <span className="w4-pop" id="w4-term-deeper-countries-effective" role="tooltip">
                              The number of equally sized countries that would give the same spread. More means more varied.
                            </span>
                          </span>
                          {" "}
                          with India at 30%, against Amazon's 3.0 at 67%. The third group gathers the Philippines, Kenya, Ghana, Zimbabwe, Ethiopia, Cameroon and Jamaica. Wayne Farms, a poultry company, filed 832 green cards in the counted cells, none for Indian citizens.
                        </p>
                        <p>
                          The groups match world regions (AMI 0.10) and Week 3's migration communities (0.10) only weakly: green-card hiring does not sort countries into regional blocs.
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
            </details>
            <details className="rx-topic" id="topic-years" name="w4-topic">
              <summary>Five years</summary>
              <div className="rx-topic-bar">
                <a className="rx-back" href="#cut">← Deep dive</a>
                <div>
                  <h2 className="rx-topic-title">Five years</h2>
                  <p className="rx-topic-holds">How the filings shift from 2022 to 2026.</p>
                </div>
                <span className="rx-topic-count"></span>
              </div>
              <nav aria-label="Boxes in this topic" className="rx-toc">
                <a className="rx-toc-item" href="#cut-years">Five years of filings</a>
                {" "}
                <a className="rx-toc-item" href="#cut-roles">Who filed, and for which roles?</a>
                {" "}
                <a className="rx-toc-item" href="#who-q4">Does it hold from year to year?</a>
              </nav>
              <details className="qa cut rx-panel" data-box="cut-years" id="cut-years" name="w4-panel-years">
                <summary>
                  <span className="qa-cue">Five years of filings, 2022 to 2026</span>
                </summary>
                <div className="qa-body cut-body" id="years-body">
                  <p aria-live="polite" className="status-line" id="years-status">Loading five years of filings…</p>
                </div>
              </details>
              <details className="qa cut rx-panel" data-box="cut-roles" id="cut-roles" name="w4-panel-years">
                <summary>
                  <span className="qa-cue">Who filed for which roles, 2022 to 2026</span>
                </summary>
                <div className="qa-body cut-body" id="roles-body">
                  <p className="w4-box-intro">
                    Certified filings, stacked by detailed occupation, SOC major group or employer, across the same five fiscal years as the box above. Switch the split, the scale or the window; 2026 covers October 2025 to June 2026 only.
                  </p>
                  <div className="card w4-card" id="roles-card">
                    <header className="w4-q">
                      <span className="w4-num">2</span>
                      <div>
                        <h2>Who filed, and for which roles?</h2>
                        <p className="w4-answer" id="roles-answer">Loading…</p>
                      </div>
                    </header>
                    <div className="roles-toolbar" role="group" aria-label="Chart controls">
                      <div className="axis-modes-group">
                        <span className="axis-modes-label" id="roles-split-label">Split by</span>
                        <div aria-labelledby="roles-split-label" className="axis-modes" role="group">
                          <button aria-pressed="true" data-roles-split="occupations" type="button">Roles</button>
                          {" "}
                          <button aria-pressed="false" data-roles-split="groups" type="button">Occupation groups</button>
                          {" "}
                          <button aria-pressed="false" data-roles-split="employer" type="button">Employer</button>
                          {" "}
                          <button aria-pressed="false" data-roles-split="placement" type="button">Placed or direct</button>
                        </div>
                      </div>
                      <div className="axis-modes-group">
                        <span className="axis-modes-label" id="roles-scale-label">Scale</span>
                        <div aria-labelledby="roles-scale-label" className="axis-modes" role="group">
                          <button aria-pressed="true" data-roles-scale="count" type="button">Filings</button>
                          {" "}
                          <button aria-pressed="false" data-roles-scale="percent" type="button">100%</button>
                        </div>
                      </div>
                      <div className="axis-modes-group">
                        <span className="axis-modes-label" id="roles-window-label">Months</span>
                        <div aria-labelledby="roles-window-label" className="axis-modes" role="group">
                          <button aria-pressed="true" data-roles-window="full" type="button">Full year</button>
                          {" "}
                          <button aria-pressed="false" data-roles-window="oct_jun" type="button">Oct to Jun only</button>
                        </div>
                      </div>
                    </div>
                    <p className="axis-note">
                      Each band is one series, largest at the bottom. Hover a band for its numbers; click a legend entry to hide it.
                    </p>
                    <div className="roles-chart-wrap">
                      <div className="chart-host" id="roles-chart"></div>
                      <div className="roles-legend" id="roles-legend"></div>
                    </div>
                    <p className="roles-summary" id="roles-summary" aria-live="polite"></p>
                    <div className="notice" id="roles-notice">
                      <span className="ico">!</span>
                      {" "}
                      <span id="roles-notice-text">Loading…</span>
                    </div>
                    <div className="rx-drawers rx-foot" id="roles-reveals"></div>
                  </div>
                </div>
              </details>
              <details className="rx-panel" name="w4-panel-years" data-box="who-q4">
                <summary>Does it hold from year to year?</summary>
                <div className="card w4-card">
                  <div className="w4-q-block" id="who-q4">
                    <header className="w4-q">
                      <span className="w4-num">3</span>
                      <div>
                        <h2>Does it hold from year to year?</h2>
                        <p className="w4-answer">Only in part.</p>
                      </div>
                    </header>
                    <p className="sub">
                      Consecutive years agree less than two runs of the same year, so the groups carry over only in part.
                    </p>
                    <div className="rx-fig-row">
                      <figure className="w4-figure">
                        <figcaption>
                          <b>Consecutive years against the same year</b>
                          <span>
                            <span className="w4-term">
                              <button aria-describedby="w4-term-topic-years-nmi" type="button">NMI</button>
                              <span className="w4-pop" id="w4-term-topic-years-nmi" role="tooltip">
                                Normalised mutual information: how much two groupings of the same clients agree, from 0 (unrelated) to 1 (identical).
                              </span>
                            </span>
                            {" "}
                            of the groups on shared clients. Dots: two consecutive years. Dashed: two runs of the same year.
                          </span>
                        </figcaption>
                        <div className="w4-figure-body" data-strip="who-q4-stability"></div>
                      </figure>
                      <figure className="w4-figure">
                        <figcaption>
                          <b>2026 so far, against a year earlier</b>
                          <span>
                            January–June change in certified and client-company filings, and the share of clients that changed their main vendor.
                          </span>
                        </figcaption>
                        <div className="w4-vis-stack">
                          <div className="w4-figure-body" data-strip="who-q4-shift"></div>
                          <div className="w4-figure-body" data-strip="who-q4-vendor-changed"></div>
                        </div>
                      </figure>
                    </div>
                    <div className="rx-drawers rx-foot">
                      <details className="rx-drawer">
                        <summary>Background</summary>
                        <div className="rx-drawer-body">
                          <p>We compared vendor and industry on 2025 only.</p>
                        </div>
                      </details>
                      <details className="rx-drawer">
                        <summary>Method</summary>
                        <div className="rx-drawer-body">
                          <p>
                            We compare each year's client groups with the next year's, on the clients both years share, and with a second run on the same year as the ceiling.
                          </p>
                        </div>
                      </details>
                      <details className="rx-drawer">
                        <summary>More numbers</summary>
                        <div className="rx-drawer-body">
                          <p>
                            On the clients present in both years, consecutive years agree at NMI 0.21 to 0.27, about half the 0.48 to 0.50 between two runs of the same year on the same clients.
                          </p>
                          <p>
                            2026 breaks the pattern at the top. We compare January to June of each year, because October 2025, the month of the federal shutdown, holds 1,306 certified filings against 35,258 a year earlier. From January to June, certified filings fell 5.8% after rising 9.5% the year before, and filings that name a client company fell 16.5% after holding flat (-0.1%). Tata Consultancy Services filed 2,079, down from 5,256. Of the 349 clients it supplied most from January to June 2025, 223 still appear, and 111 of those now get most of their workers from another firm, most often Infosys. Across clients with five or more filings in both years, 47% changed their main vendor, against 44% a year earlier. These are applications, so they show what employers asked for, not why.
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </details>
            </details>
            <details className="qa cut rx-topic" id="evidence" name="w4-topic">
              <summary>
                <span className="qa-cue">Data and methods</span>
              </summary>
              <div className="rx-topic-bar">
                <a className="rx-back" href="#cut">← Deep dive</a>
                <div>
                  <h2 className="rx-topic-title">Data and methods</h2>
                  <p className="rx-topic-holds">The public sources, and how we checked every number.</p>
                </div>
                <span className="rx-topic-count"></span>
              </div>
              <div className="qa-body">
                <p className="sub">The numbers on this page come from these public sources.</p>
                <dl className="w4-sources">
                  <dt>
                    <a href="https://www.dol.gov/agencies/eta/foreign-labor/performance">US Department of Labor, Office of Foreign Labor Certification ↗</a>
                  </dt>
                  <dd>
                    <span className="w4-term">
                      <button aria-describedby="w4-term-evidence-lca" type="button">LCA</button>
                      <span className="w4-pop" id="w4-term-evidence-lca" role="tooltip">
                        Labor Condition Application: the form an employer files with the Department of Labor before it can sponsor an H-1B worker.
                      </span>
                    </span>
                    {" "}
                    disclosures and worksites file, public domain
                  </dd>
                  <dt>
                    <a href="https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub">USCIS H-1B Employer Data Hub ↗</a>
                  </dt>
                  <dd>October 2021 to June 2026</dd>
                  <dt>
                    <a href="https://github.com/BloombergGraphics/2024-h1b-immigration-data">H-1B lottery registrations ↗</a>
                  </dt>
                  <dd>
                    the March 2021 to March 2023 draws, USCIS data obtained by Bloomberg News under
                    {" "}
                    <span className="w4-term">
                      <button aria-describedby="w4-term-evidence-foia" type="button">FOIA</button>
                      <span className="w4-pop" id="w4-term-evidence-foia" role="tooltip">
                        The Freedom of Information Act, which lets anyone request records from US federal agencies.
                      </span>
                    </span>
                  </dd>
                  <dt>
                    <a href="https://www.census.gov/geographies/reference-files/time-series/demo/metro-micro/delineation-files.html">Census CBSA delineations ↗</a>
                  </dt>
                  <dd>counties to metro areas</dd>
                  <dt>
                    <a href="https://www.bls.gov/oes/tables.htm">Bureau of Labor Statistics OEWS ↗</a>
                  </dt>
                  <dd>jobs per metro and occupation, May 2025</dd>
                  <dt>
                    <a href="https://www.sec.gov/search-filings/edgar-application-programming-interfaces">SEC EDGAR ↗</a>
                  </dt>
                  <dd>industry codes of listed clients</dd>
                  <dt>
                    <a href="https://www.wikidata.org/">Wikidata ↗</a>
                  </dt>
                  <dd>industries of clients the SEC does not list, CC0</dd>
                  <dt>
                    <a href="https://www.onetcenter.org/database.html">O*NET database ↗</a>
                  </dt>
                  <dd>
                    skill, knowledge and work-activity ratings per occupation, US Department of Labor, CC BY 4.0
                  </dd>
                </dl>
              </div>
            </details>
          </section>
        </div>
        <footer className="foot">
          <div className="shell">
            <span>
              Sources: US DOL OFLC LCA / worksites (public domain) · Census CBSA
              delineations · Week 4 methods: communities, weights, backbones
            </span>
            {" "}
            <span>
              This page includes information from the O*NET® 31.0 Database and, for two
              occupations, the O*NET® 25.0 Database by the U.S. Department of Labor,
              Employment and Training Administration (USDOL/ETA). Used under the
              {" "}
              <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0 license</a>
              .
              Log–Log Legends has modified all or some of this information. USDOL/ETA has
              not approved, endorsed, or tested these modifications.
            </span>
            {" "}
            <span>
              Registrations per lottery draw: USCIS,
              {" "}
              <a href="https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations/h-1b-electronic-registration-process">H-1B Electronic Registration Process</a>
              , Historical Data
              (public domain).
            </span>
            {" "}
            <span>
              Who hires America's foreign workers? ·
              {" "}
              <a href="../../">Log–Log Legends</a>
              {" "}
              · DTU 02805
            </span>
          </div>
        </footer>
      </main>
      {/* One ECharts for both sections; week04-place.js skips its own loader when this is present. */}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      <PageScripts scripts={[{"src":"../../assets/vendor/echarts-5.5.1.min.js","module":false},{"src":"../../assets/js/week04-place.js?v=14","module":true},{"src":"../../assets/js/week04-frame.js?v=7","module":true},{"src":"../../assets/js/week04-years.js?v=9","module":true},{"src":"../../assets/js/week04-roles.js?v=11","module":true},{"src":"../../assets/js/week04-methods.js?v=8","module":true},{"src":"../../assets/js/week04-skills.js?v=11","module":true},{"src":"../../assets/js/week04-skills-radar.js?v=9","module":true},{"src":"../../assets/js/week04-pagerank.js?v=12","module":true},{"src":"../../assets/js/week04-jobs.js?v=10","module":true},{"src":"../../assets/js/week04-staffing.js?v=3","module":true},{"src":"../../assets/js/week04-questions.js?v=12","module":true},{"src":"../../assets/js/week04-cut.js?v=4","module":true},{"src":"../../assets/js/week04-vis-more.js?v=8","module":true},{"src":"../../assets/js/week04-vis-intros.js?v=7","module":true},{"src":"../../assets/js/week04-vis-staffing.js?v=4","module":true},{"src":"../../assets/js/week04-entities.js?v=9","module":true}]} />
    </>
  );
}
