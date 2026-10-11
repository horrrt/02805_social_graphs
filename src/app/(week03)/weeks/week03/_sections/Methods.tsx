// Methods, and what this cannot tell you.
export function Methods() {
  return (
    <>
      {/* methods ------------------------------------------------------ */}
      <section className="step" id="methods">
        <div className="card">
          <div className="step-head">
            <span className="num">✓</span>
            <h2>Methods, and what this cannot tell you</h2>
          </div>
          <details className="qa" id="methods-drawer">
            <summary>
              <span className="qa-cue">Sources, methods and limits</span>
            </summary>
            <div className="qa-body">
              <div className="grid2">
                <div>
                  <p className="sub">
                    <b>Migration.</b>
                    {" "}
                    UN DESA International Migrant Stock,
                    revision 2024. An arc origin → destination carries the
                    people born in the origin who live in the destination.
                    Subtract two years and you get a change in where people
                    live, not a count of who moved.
                  </p>
                  <p className="sub">
                    <b>Betweenness.</b>
                    {" "}
                    Weighted and directed, distance = 1 /
                    people, so a heavy corridor is a short step. Run it
                    unweighted and the top brokers come out as Australia,
                    Norway and Denmark, which ranks statistics offices: a
                    register names hundreds of tiny origins, a survey buckets
                    them into "other".
                  </p>
                  <p className="sub">
                    <b>Flights.</b>
                    {" "}
                    OpenFlights routes, aggregated from airport
                    pairs to country pairs and counted as distinct routes. One
                    undated snapshot, last refreshed around 2014, so it sits
                    still while the year slider moves. A route existing says
                    nothing about seats or passengers, and
                    {" "}
                    <code>week03_passengers.py</code>
                    {" "}
                    measures what that
                    costs: against US BTS passenger counts for 2019, route
                    count ranks countries at Spearman 0.87 and misses volume
                    by up to a factor of 14.5 (see the fineprint below).
                    Degree and betweenness
                    use the same formulas, distance = 1 / routes, so the
                    scatter compares one quantity across two networks.
                  </p>
                  <p className="sub">
                    <b>Forced displacement.</b>
                    {" "}
                    UNHCR Refugee Data Finder,
                    end-2024: refugees plus asylum seekers on the same
                    origin → destination pairs. It answers question 5's
                    second half. The two counts do not nest perfectly (DESA
                    estimates in the middle of 2024, UNHCR counts at the end
                    of it), so on 281 fast-moving corridors, Sudan's most of
                    all, the refugee count exceeds the stock and we cap it
                    there. That makes a crisis corridor read low, never high.
                    A further 2,811 UNHCR pairs, 1.7 million people with
                    Eritrea to Germany among them, have no DESA stock row to
                    attach to and are not on this page at all. Internal
                    displacement is in the source and left out too: these are
                    border crossings.
                  </p>
                  <p className="sub">
                    <b>Roles.</b>
                    {" "}
                    Guimerà and Amaral's cartography
                    (
                    <i>Nature</i>
                    {" "}
                    433, 2005) in
                    {" "}
                    <code>analysis/week03_cartography.py</code>
                    , on the same
                    graph section 8 partitions: undirected, weighted by
                    people both ways, corridors under 10,000 people dropped.
                    Two coordinates per country, both computed on strength
                    rather than on a count of partners, because a corridor
                    here runs from a dozen people to four million. Louvain is
                    stochastic, so each year is partitioned 100 times, every
                    run votes for a role, and a country carries the role most
                    runs gave it. The coordinates printed beside a role are
                    averaged over the runs that produced that role and not
                    over all of them: pooled, four countries came out with a
                    participation coefficient on the wrong side of their own
                    name. The thresholds are Guimerà and Amaral's own and are
                    not tuned to this network, which is much denser than the
                    ones they were set on, so peripheral stays the largest
                    group. Tuning them to balance our own chart would be
                    seven arbitrary numbers, which is what this replaced.
                  </p>
                  <p className="sub">
                    <b>What the roles replaced.</b>
                    {" "}
                    Six labels of our own,
                    from a cascade of rank tests, three of which compared a
                    2020 migration ranking against the undated flight
                    snapshot. When we labelled them, 30 of the 228
                    countries then in the data carried one, the
                    section could only ever show a single year, and 141 of
                    228 came out "mixed". Better flight data would have fixed
                    it and there is none: ICAO sells a dated global
                    country-pair table, Sabre licenses one, Eurostat
                    publishes a free dated one that only Europe reports into,
                    and OpenSky is free, dated and CC BY but its coverage
                    follows the ADS-B receivers, which sit in Europe and
                    North America. Each trades a vintage problem for a
                    coverage problem, so the roles now use no flight data at
                    all.
                  </p>
                  <p className="sub">
                    <b>Heavy tails.</b>
                    {" "}
                    The Clauset, Shalizi and Newman
                    procedure in
                    {" "}
                    <code>analysis/week03_tails.py</code>
                    :
                    maximum likelihood for the exponent, the lower bound by
                    minimising the KS distance, 500 synthetic datasets for
                    the goodness-of-fit p, and Vuong likelihood-ratio tests
                    against lognormal and exponential on the same tail. Both
                    rivals are fitted with the continuous approximation, and
                    so is the power law inside the comparison, because a
                    ratio between a probability and a probability density
                    means nothing. Full output in
                    {" "}
                    <code>analysis/week03_tails.json</code>
                    .
                  </p>
                  <p className="sub">
                    <b>Why these four numbers changed.</b>
                    {" "}
                    The fitting used
                    to be our own code and is now the
                    {" "}
                    <code>powerlaw</code>
                    {" "}
                    package, which is the reference implementation of that
                    procedure, and the swap found a bug we had been
                    publishing. Our KS distance walked the sorted tail one
                    observation at a time, so a degree value appearing ten
                    times produced ten steps in the empirical curve against
                    one flat stretch of the model, and that gap counted as
                    distance. Degree sequences are nothing but ties: 230
                    countries share 86 distinct in-degrees. The exponent was
                    never wrong, and corridor weights, which barely tie, were
                    right to the digit. But the inflated distance moved the
                    x
                    <sub>min</sub>
                    {" "}
                    that minimises it, so all three degree
                    tails had been fitted above the wrong cut. Destinations
                    per origin is the one that changes its mind: it used to
                    read p = 0.88, a power law surviving comfortably, and it
                    reads 0.03.
                  </p>
                  <p className="sub">
                    <b>Which countries, and how many.</b>
                    {" "}
                    Nine different
                    counts appear on this page and all of them are right,
                    so here they are in one place.
                    {" "}
                    <b>238</b>
                    {" "}
                    countries and
                    territories are in the payload, the union of the
                    migration and flight networks.
                    {" "}
                    <b>232</b>
                    {" "}
                    have
                    migration figures and sit on at least one corridor.
                    {" "}
                    <b>208</b>
                    {" "}
                    have a flight route.
                    {" "}
                    <b>214</b>
                    {" "}
                    have any
                    World Bank indicator and
                    {" "}
                    <b>199</b>
                    {" "}
                    have income per
                    head, which is why the wealth charts say 175 once
                    a population of 200,000 or more is also
                    required.
                    {" "}
                    <b>208</b>
                    {" "}
                    survive the 10,000-person floor in
                    the community graph and so carry a role in section 5,
                    where
                    {" "}
                    <b>196</b>
                    {" "}
                    did in 1990.
                    {" "}
                    <b>185</b>
                    {" "}
                    report to the Oxford
                    tracker, and
                    {" "}
                    <b>87</b>
                    {" "}
                    have both a flight route to the
                    United States and passengers on it.
                  </p>
                  <p className="sub">
                    <b>The countries without a price.</b>
                    {" "}
                    Of the 39 with no
                    income per head, the list is not random: Syria, South
                    Sudan, Yemen, Eritrea, North Korea and Cuba, alongside
                    two dozen small territories. Those are war zones,
                    sanctioned states and dependencies, and the war zones
                    are among the largest refugee origins on the page.
                    Every income-based result here therefore excludes them:
                    the gravity model, the wealth scatter and the income
                    tiers all drop corridors touching a country the World
                    Bank does not price, which is 7.3% of the world's
                    migrants. It biases those results toward the parts of
                    the world that are calm enough to be measured.
                  </p>
                  <p className="sub">
                    <b>Reporting coverage.</b>
                    {" "}
                    DESA's table is ragged. The
                    United States names 59 origins in every year of the
                    table; Denmark rises from 167 in 1990 to 192 by 2024,
                    because one runs a survey with an "other" bucket and
                    the other keeps a population register that adds
                    countries as they appear. Every partner count on this
                    page inherits that gap.
                  </p>
                </div>
                <div>
                  <p className="sub">
                    <b>Monthly applications.</b>
                    {" "}
                    Eurostat migr_asyappctzm,
                    first-time asylum applicants of all ages and both sexes,
                    by citizenship and reporting country, monthly since
                    2013. Reuse with attribution. Eurostat ships aggregate
                    rows inside both dimensions (EU27 sits beside its own
                    members, TOTAL beside every citizenship), and summing
                    over them counts most of Europe twice, so both are
                    dropped. Applications are not arrivals, temporary
                    protection is a different route and is not counted,
                    and Eurostat suppresses small cells. The origins shown
                    here clear a 3,000-application floor, and pooled across
                    34 reporting countries a month that clears that floor
                    always has at least one reporting country behind it, so
                    no cell in this grid is actually a hole; the code keeps
                    a month with no figure as null rather than zero in case
                    a thinner origin ever needs it, but on this floor that
                    case has not come up.
                  </p>
                  <p className="sub">
                    <b>Border closures.</b>
                    {" "}
                    Oxford Covid-19 Government
                    Response Tracker, CC BY 4.0, indicator C8: policy toward
                    foreign travellers on a 0 to 4 scale, one value per
                    country per day, national rows only. Level 4 is a ban on
                    all regions or a total closure. It is policy on paper
                    rather than traffic, the panel is 185 countries and the
                    number reporting moves from day to day, and the tracker
                    stops at the end of 2022.
                  </p>
                  <p className="sub">
                    <b>The map.</b>
                    {" "}
                    Natural Earth 1:110m admin-0 boundaries,
                    public domain.
                    {" "}
                    <code>scripts/migration/build_world_outline.py</code>
                    {" "}
                    keeps
                    the ISO code and the name, rounds coordinates to two
                    decimals and gets the file to 169 KB. Borders are here so
                    you can see where a corridor lands, and claim nothing about
                    any dispute.
                  </p>
                  <p className="sub">
                    <b>Render variants.</b>
                    {" "}
                    Six renderers and eleven style
                    dimensions over one dataset. Only the drawing changes: a
                    variant overrides the visuals it improves and inherits the
                    rest. The libraries sit in the repository, so the page
                    fetches no third-party JavaScript. Section 8 is the one
                    exception to the renderer choice: its four extra views
                    are ECharts whichever renderer you picked, and the megabyte
                    that costs is fetched when you open the section and not
                    before.
                  </p>
                  <p className="sub">
                    <b>The basemap.</b>
                    {" "}
                    NASA Blue Marble, public domain,
                    offered in every renderer. On the 2D canvas we resample it
                    through the orthographic projection at two thirds of the
                    drawn size and scale it up, which keeps a drag smooth at no
                    visible cost.
                  </p>
                  <p className="sub">
                    <b>Statistics.</b>
                    {" "}
                    Every interval on this page is
                    computed rather than assumed. Correlations carry a
                    Fisher interval; the weighted median of distance
                    carries a percentile interval over 400 resamples of the
                    corridors, resampled by corridor because a corridor is
                    the thing that was observed. The null model runs 100
                    shuffles, so the finest p it can express is one in a
                    hundred and a z above about 2.5 is a floor rather than
                    a measurement. Eleven invariants across the five data
                    files run in
                    {" "}
                    <code>tests/week03-data.test.mjs</code>
                    :
                    totals agreeing between the two migration files, no
                    aggregate codes leaking into a country list, and the
                    forced-displacement cap still covering the number of
                    corridors this page says it does.
                  </p>
                  <p className="sub">
                    <b>Rebuilding this.</b>
                    {" "}
                    <code>scripts/rebuild_week03.py</code>
                    {" "}
                    downloads the
                    sources and recreates every file the page loads;
                    {" "}
                    <code>--check</code>
                    {" "}
                    lists what is committed and what made
                    it. The raw inputs stay out of the repository. A
                    {" "}
                    <a href="../../styleguide/">style guide</a>
                    {" "}
                    draws every
                    component under every skin.
                  </p>
                  <p className="sub">
                    <b>AI use.</b>
                    {" "}
                    We built the harvest, the analysis and this
                    page with Claude. Every number on the page comes out of a
                    script in
                    {" "}
                    <code>analysis/</code>
                    :
                    {" "}
                    <code>week03_corridor_control.py</code>
                    {" "}
                    for the networks,
                    then
                    {" "}
                    <code>_tails</code>
                    ,
                    {" "}
                    <code>_gravity</code>
                    ,
                    {" "}
                    <code>_communities</code>
                    ,
                    {" "}
                    <code>_country_networks</code>
                    ,
                    {" "}
                    <code>_asylum</code>
                    {" "}
                    and
                    {" "}
                    <code>_closures</code>
                    .
                    The prose is typed by hand:
                    {" "}
                    <code>tests/week03-prose.test.mjs</code>
                    {" "}
                    pins the
                    figures most likely to drift against the analysis
                    output, so a rebuild that changes one of those gets
                    caught before a reader does. It does not cover every
                    number on the page.
                  </p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
