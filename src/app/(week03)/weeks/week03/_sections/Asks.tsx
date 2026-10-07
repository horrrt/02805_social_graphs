import { AreaModes, AreaNote, GraphControls, OriginPicker, VAnswer, VChart, ViewsStatus } from "@/features/week03/views/Views";
import { QAnswer, QChart, RingControls, RingScope } from "@/features/week03/questions/Questions";
// 9: everything that goes deeper than the main path.
export function Asks() {
  return (
    <>
      {/* everything that goes deeper than the main path ---------------- */}
      <section className="step" data-depth="deep" id="asks">
        <div className="card">
          <div className="step-head">
            <span className="num">8</span>
            <h2>More ways to look at this</h2>
          </div>
          <h2 id="questions-head">Six questions, answered from the same two files</h2>
          <details className="qa" id="questions">
            <summary>
              <span className="qa-cue">The six questions</span>
            </summary>
            <div className="qa-body">
              <article className="qa-item">
                <h3>1 · Which corridors actually carry the world?</h3>
                <RingControls />
                <RingScope />
                <QChart id="q-ring" width="760" height="660" label="Chart: which corridors carry the world's migrants" />
                <QAnswer chart="q-ring" />
              </article>
              <article className="qa-item">
                <h3>
                  2 · Where do migrants live, and where were they born?
                </h3>
                <QChart id="q-hosts" width="760" height="470" label="Chart: where migrants live and where they were born" />
                <QAnswer chart="q-hosts" />
              </article>
              <article className="qa-item">
                <h3>3 · Do migrants move far?</h3>
                <QChart id="q-distance" width="760" height="420" label="Chart: how far migrants move" />
                <QAnswer chart="q-distance" />
              </article>
              <article className="qa-item">
                <h3>4 · Does wealth pull people, and how far?</h3>
                <QChart id="q-wealth" width="760" height="430" label="Chart: whether wealth pulls people, and how far" />
                <QAnswer chart="q-wealth" />
              </article>
              <article className="qa-item">
                <h3>
                  5 · Is this the highly skilled, or everybody, and was it
                  a choice?
                </h3>
                <QChart id="q-income" width="760" height="253" label="Chart: whether migration is of the highly skilled or of everybody" />
                <QAnswer chart="q-income" />
              </article>
              <article className="qa-item">
                <h3>6 · Who moves?</h3>
                <QChart id="q-sex" width="760" height="470" label="Chart: who moves, by sex" />
                <QAnswer chart="q-sex" />
              </article>
              <div className="notice">
                <span className="ico">📄</span>
                {" "}
                <span>
                  Three of these questions run out of data before they run out
                  of interest: education, age and family status. All three
                  have sources, and none of them are in this build. They are
                  written up, with their licences and their traps, in the
                  {" "}
                  <a href="https://github.com/horrrt/02805_social_graphs/blob/main/project/MIGRATION_DATA_CATALOGUE.md">data catalogue</a>
                  {" "}
                  (90 sources) and the
                  {" "}
                  <a href="https://github.com/horrrt/02805_social_graphs/blob/main/project/MIGRATION_QUESTIONS.md">twenty questions</a>
                  {" "}
                  that came out of it.
                </span>
              </div>
            </div>
          </details>
        </div>
        <div className="card" id="gravity">
          <h2>What is left after gravity</h2>
          <p className="sub">
            <b>
              Size and distance predict some of the world's migration, and
              the corridors they miss are the interesting ones.
            </b>
            {" "}
            Russia to
            Ukraine carries 158 times what the model expects. The list of
            corridors like it is the finding here, not the fit.
          </p>
          <h3>The corridors gravity cannot explain</h3>
          <p className="sub">
            The fit is not the finding. The residual is. These carry the
            most people relative to what size and distance predict, among
            corridors of at least 50,000 people.
          </p>
          <table className="ego">
            <tbody>
            <tr>
              <th>Corridor</th>
              <th style={{"textAlign":"right"}}>People</th>
              <th style={{"textAlign":"right"}}>Gravity says</th>
              <th style={{"textAlign":"right"}}>Ratio</th>
            </tr>
            <tr>
              <td>Russia → Ukraine</td>
              <td style={{"textAlign":"right"}}>3,375,095</td>
              <td style={{"textAlign":"right"}}>21,311</td>
              <td style={{"textAlign":"right"}}>
                <b>×158</b>
              </td>
            </tr>
            <tr>
              <td>United Kingdom → New Zealand</td>
              <td style={{"textAlign":"right"}}>254,524</td>
              <td style={{"textAlign":"right"}}>2,697</td>
              <td style={{"textAlign":"right"}}>
                <b>×94</b>
              </td>
            </tr>
            <tr>
              <td>United Kingdom → Australia</td>
              <td style={{"textAlign":"right"}}>1,107,102</td>
              <td style={{"textAlign":"right"}}>13,082</td>
              <td style={{"textAlign":"right"}}>
                <b>×85</b>
              </td>
            </tr>
            <tr>
              <td>Sudan → Chad</td>
              <td style={{"textAlign":"right"}}>1,071,034</td>
              <td style={{"textAlign":"right"}}>15,121</td>
              <td style={{"textAlign":"right"}}>
                <b>×71</b>
              </td>
            </tr>
            <tr>
              <td>Russia → Tajikistan</td>
              <td style={{"textAlign":"right"}}>235,636</td>
              <td style={{"textAlign":"right"}}>3,427</td>
              <td style={{"textAlign":"right"}}>
                <b>×69</b>
              </td>
            </tr>
            <tr>
              <td>Palestine → Libya</td>
              <td style={{"textAlign":"right"}}>322,909</td>
              <td style={{"textAlign":"right"}}>5,987</td>
              <td style={{"textAlign":"right"}}>
                <b>×54</b>
              </td>
            </tr>
            <tr>
              <td>Russia → Belarus</td>
              <td style={{"textAlign":"right"}}>664,610</td>
              <td style={{"textAlign":"right"}}>12,715</td>
              <td style={{"textAlign":"right"}}>
                <b>×52</b>
              </td>
            </tr>
            <tr>
              <td>Russia → Uzbekistan</td>
              <td style={{"textAlign":"right"}}>865,767</td>
              <td style={{"textAlign":"right"}}>17,190</td>
              <td style={{"textAlign":"right"}}>
                <b>×50</b>
              </td>
            </tr>
            <tr>
              <td>Suriname → Kingdom of the Netherlands</td>
              <td style={{"textAlign":"right"}}>177,165</td>
              <td style={{"textAlign":"right"}}>3,746</td>
              <td style={{"textAlign":"right"}}>
                <b>×47</b>
              </td>
            </tr>
            <tr>
              <td>Venezuela → Peru</td>
              <td style={{"textAlign":"right"}}>1,596,667</td>
              <td style={{"textAlign":"right"}}>36,830</td>
              <td style={{"textAlign":"right"}}>
                <b>×43</b>
              </td>
            </tr>
            <tr>
              <td>Ukraine → Russia</td>
              <td style={{"textAlign":"right"}}>2,872,612</td>
              <td style={{"textAlign":"right"}}>82,559</td>
              <td style={{"textAlign":"right"}}>
                <b>×35</b>
              </td>
            </tr>
            <tr>
              <td>New Zealand → Australia</td>
              <td style={{"textAlign":"right"}}>588,088</td>
              <td style={{"textAlign":"right"}}>17,116</td>
              <td style={{"textAlign":"right"}}>
                <b>×34</b>
              </td>
            </tr>
            </tbody>
          </table>
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span>
              <b>Read the list and the categories name themselves.</b>
              {" "}
              Five of the top twelve involve Russia and the Soviet
              successor states: Russia to and from Ukraine, and Russia to
              Tajikistan, Belarus and Uzbekistan. Three are the old
              British settler network: the
              United Kingdom to New Zealand and Australia, and New Zealand
              to Australia, which today is a free-movement zone. One is a
              former colonial tie, Suriname to the Kingdom of the
              Netherlands. Two are wars, Sudan to Chad and Venezuela to
              Peru. Palestine to Libya does not sort
              into any of these categories on this evidence alone. None of
              these is in the model, and every one of them beats the model
              by a factor of thirty or more.
            </span>
          </div>
          <details className="qa" id="gravity-method">
            <summary>
              <span className="qa-cue">How the model is fitted, and the full table</span>
            </summary>
            <div className="qa-body">
              <p className="sub">
                Question 4 showed two things separately: rich countries hold more
                foreign-born people, and the people in them came from further
                away. Two charts is not a model, so neither one holds the other
                fixed. Gravity does. It is the standard baseline in the
                migration literature and it is almost embarrassingly good:
                people on a corridor rise with the size of both ends and fall
                with the distance between them.
              </p>
              <p className="sub">
                Fitted here by Poisson pseudo-maximum-likelihood on all
                8,487 corridors with population and
                income at both ends, in
                {" "}
                <code>analysis/week03_gravity.py</code>
                . That is the same
                8,238 non-zero corridors question 5 uses, needing income at
                both ends and nothing else, plus 249 more: pairs that held
                people in an earlier snapshot, show zero for 2024, and still
                have the population and income data gravity needs. PPML keeps
                those zeros deliberately (see below). Counts rather than
                log counts, because logging drops every corridor carrying
                nobody and biases the rest. Each distance and population
                coefficient is an elasticity: a one per cent rise in the term
                moves the corridor by that many per cent. The under-1,000 km
                term is a yes/no shift, not an elasticity: it moves the
                corridor by a fixed share when the two centres are that close.
                Intervals are the heteroskedasticity-robust
                sandwich the method calls for, which statsmodels fits directly
                and scikit-learn could not report at all.
              </p>
              <table className="ego">
                <tbody>
                <tr>
                  <th>Term</th>
                  <th style={{"textAlign":"right"}}>Elasticity</th>
                  <th style={{"textAlign":"right"}}>95% interval</th>
                </tr>
                <tr>
                  <td>Distance between the two</td>
                  <td style={{"textAlign":"right"}}>
                    <b>−1.20</b>
                  </td>
                  <td style={{"textAlign":"right"}}>−1.44 to −0.95</td>
                </tr>
                <tr>
                  <td>Destination income per head</td>
                  <td style={{"textAlign":"right"}}>
                    <b>+0.82</b>
                  </td>
                  <td style={{"textAlign":"right"}}>+0.66 to +0.98</td>
                </tr>
                <tr>
                  <td>Destination population</td>
                  <td style={{"textAlign":"right"}}>+0.68</td>
                  <td style={{"textAlign":"right"}}>+0.60 to +0.76</td>
                </tr>
                <tr>
                  <td>Origin population</td>
                  <td style={{"textAlign":"right"}}>+0.50</td>
                  <td style={{"textAlign":"right"}}>+0.42 to +0.58</td>
                </tr>
                <tr>
                  <td>Origin income per head</td>
                  <td style={{"textAlign":"right"}}>−0.27</td>
                  <td style={{"textAlign":"right"}}>−0.35 to −0.18</td>
                </tr>
                <tr>
                  <td>Under 1,000 km apart</td>
                  <td style={{"textAlign":"right"}}>−0.30</td>
                  <td style={{"textAlign":"right"}}>−0.79 to +0.20</td>
                </tr>
                </tbody>
              </table>
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>
                    Doubling the distance roughly halves the corridor, and
                    that is the single strongest term here.
                  </b>
                  {" "}
                  Destination income comes next: with size and distance held
                  fixed, a country twice as rich holds about 1.8 times as many
                  people from any given origin. Origin income runs the other
                  way (poorer origins send more), which is the selection the
                  income bars in question 5 could only show as a marginal. The
                  last row is a failed proxy, kept rather than deleted: this
                  repo has coordinates and no border table, so "share a border"
                  had to be approximated by "centres within 1,000 km", and with
                  distance already in the model it measures nothing. Its
                  interval crosses zero and dropping it moves distance from
                  −1.20 to −1.11 and leaves everything else where it was.
                </span>
              </div>
              <p className="fineprint">
                The fit drops every corridor touching a country the World
                Bank does not price: Syria, South Sudan, Yemen, Eritrea, North
                Korea and Cuba among others. Those are war zones and sanctioned
                states, which is to say several of the origins whose corridors
                would have had the largest residuals. The model is fitted on the
                part of the world calm enough to be measured, and the missing
                part is 7.3% of the world's migrants.
              </p>
              <p className="fineprint">
                Every term is measured in the same year as the outcome, so
                nothing here identifies a cause: a corridor thirty times over
                its prediction is a corridor worth explaining, not an
                explanation. The fit reaches R² 0.45 across the range of the
                data and 0.17 on the raw counts, where a handful of enormous
                corridors dominate.
              </p>
              <p className="fineprint">
                The bottom of the residual list, where gravity expects a crowd
                and DESA reports five people, is a map of which statistics
                offices file small origins under "other", not of where nobody
                went.
              </p>
            </div>
          </details>
        </div>
        <div className="card" id="communities">
          <h2>Does the world split into groups?</h2>
          <p className="sub">
            <b>
              68.7% of the world's migrants move inside one of nine
              groups.
            </b>
            {" "}
            Shuffle the network keeping every country's partner
            count and Louvain still returns almost the same modularity, so
            the amount of grouping says nothing on its own. Which countries
            land together does, and even that is a matter of degree: run
            Louvain from 100 more starting points and it agrees with the
            partition below on the group count more often than not, but
            rarely on the exact groups.
          </p>
          <table className="ego">
            <tbody>
            <tr>
              <th>Group</th>
              <th style={{"textAlign":"right"}}>Countries</th>
              <th>Largest members</th>
            </tr>
            <tr>
              <td>Latin America, Iberia and the western Mediterranean</td>
              <td style={{"textAlign":"right"}}>37</td>
              <td style={{"textAlign":"left"}}>France, Spain, Venezuela, Colombia, Morocco</td>
            </tr>
            <tr>
              <td>Germany, Russia and the post-Soviet belt</td>
              <td style={{"textAlign":"right"}}>35</td>
              <td style={{"textAlign":"left"}}>Germany, Russia, Ukraine, Italy, Poland</td>
            </tr>
            <tr>
              <td>North America and the Pacific rim</td>
              <td style={{"textAlign":"right"}}>35</td>
              <td style={{"textAlign":"left"}}>United States, Mexico, People's Republic of China, Canada, Philippines</td>
            </tr>
            <tr>
              <td>The former British settler network</td>
              <td style={{"textAlign":"right"}}>24</td>
              <td style={{"textAlign":"left"}}>United Kingdom, Australia, South Africa, New Zealand, Zimbabwe</td>
            </tr>
            <tr>
              <td>South Asia and the Gulf</td>
              <td style={{"textAlign":"right"}}>24</td>
              <td style={{"textAlign":"left"}}>India, Saudi Arabia, Bangladesh, Pakistan, United Arab Emirates</td>
            </tr>
            <tr>
              <td>The Horn and central Africa</td>
              <td style={{"textAlign":"right"}}>18</td>
              <td style={{"textAlign":"left"}}>Sudan, South Sudan, Democratic Republic of the Congo, Uganda, Ethiopia</td>
            </tr>
            <tr>
              <td>West Africa, and ECOWAS free movement</td>
              <td style={{"textAlign":"right"}}>17</td>
              <td style={{"textAlign":"left"}}>Ivory Coast, Nigeria, Burkina Faso, Mali, Ghana</td>
            </tr>
            <tr>
              <td>Turkey, the Levant and the Netherlands</td>
              <td style={{"textAlign":"right"}}>16</td>
              <td style={{"textAlign":"left"}}>Turkey, Syria, Jordan, Palestine, Kingdom of the Netherlands</td>
            </tr>
            <tr>
              <td>Afghanistan and Iran</td>
              <td style={{"textAlign":"right"}}>2</td>
              <td>Afghanistan, Iran</td>
            </tr>
            </tbody>
          </table>
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span>
              <b>
                68.7% of the world's 282 million migrants live inside
                one of the nine groups rather than between them
              </b>
              ,
              counting every corridor in 2024, including the small ones
              the 10,000-person threshold left out of the graph. The
              groups are free movement zones, old empires and shared
              languages: ECOWAS is one, the Anglosphere settler network is
              one, the Gulf labour system and the South Asia that staffs it
              are one, and Afghanistan with Iran is a two-country group
              held together by forty years of displacement. Turkey, Syria,
              Jordan and Palestine sit with the Netherlands rather than
              with the rest of the Mediterranean group, which the members
              above state plainly rather than explain away.
            </span>
          </div>
          <details className="qa" id="communities-method">
            <summary>
              <span className="qa-cue">How the groups were found, and refugees against migrants</span>
            </summary>
            <div className="qa-body">
              <p className="sub">
                A course on social graphs asks this in week three and this post
                had not. Louvain on the undirected network, weighted by people
                moving in both directions and cut at corridors of 10,000 or
                more, in
                {" "}
                <code>analysis/week03_communities.py</code>
                . It returns
                nine groups over 208 countries, and they name
                themselves.
              </p>
              <div className="notice">
                <span className="ico">🧪</span>
                {" "}
                <span>
                  <b>And the amount of grouping is not a finding.</b>
                  {" "}
                  Modularity is 0.535. Rewire the network
                  100 times keeping every country's number
                  of partners, deal the corridor weights back out at random,
                  and Louvain still returns 0.521 on average.
                  12 of the
                  100 shuffles score at or above the real
                  network, which is z = +1.1: no evidence either way. Louvain finds communities in noise, so
                  the number on its own was never going to say much. This one
                  seeded run is one draw from Louvain's own randomness too: 100
                  more seeds give nine groups 56 times out of 100 and this exact
                  partition 0 times, with a mean NMI of 0.92 against it (as low
                  as 0.79 on the least similar run). The partition above is
                  published as the seeded run, not the most common one, because
                  no single partition dominates the 100 seeds either.
                </span>
              </div>
              <h3>Migrants and refugees are not the same network</h3>
              <p className="sub">
                The same countries, two different graphs: UN DESA's stock
                against UNHCR's refugee counts, both 2024, from
                {" "}
                <code>analysis/week03_country_networks.py</code>
                . This was
                computed for the project weeks ago and had never reached the
                page.
              </p>
              <table className="ego">
                <tbody>
                <tr>
                  <th>Measure</th>
                  <th style={{"textAlign":"right"}}>Migrants</th>
                  <th style={{"textAlign":"right"}}>Refugees</th>
                </tr>
                <tr>
                  <td>Countries</td>
                  <td style={{"textAlign":"right"}}>232</td>
                  <td style={{"textAlign":"right"}}>204</td>
                </tr>
                <tr>
                  <td>Corridors</td>
                  <td style={{"textAlign":"right"}}>9,035</td>
                  <td style={{"textAlign":"right"}}>4,792</td>
                </tr>
                <tr>
                  <td>People</td>
                  <td style={{"textAlign":"right"}}>282m</td>
                  <td style={{"textAlign":"right"}}>31m</td>
                </tr>
                <tr>
                  <td>Reciprocity</td>
                  <td style={{"textAlign":"right"}}>0.41 (null 0.26 ± 0.004, z = +36.2)</td>
                  <td style={{"textAlign":"right"}}>0.11 (null 0.07 ± 0.003, z = +10.9)</td>
                </tr>
                <tr>
                  <td>Clustering</td>
                  <td style={{"textAlign":"right"}}>0.71 (null 0.67 ± 0.002, z = +17.2)</td>
                  <td style={{"textAlign":"right"}}>0.60 (null 0.61 ± 0.004, z = −4.1)</td>
                </tr>
                <tr>
                  <td>Degree assortativity</td>
                  <td style={{"textAlign":"right"}}>−0.26 (null −0.33 ± 0.003, z = +22.0)</td>
                  <td style={{"textAlign":"right"}}>−0.34 (null −0.31 ± 0.004, z = −8.7)</td>
                </tr>
                <tr>
                  <td>Average distance</td>
                  <td style={{"textAlign":"right"}}>1.75 (null 1.73 ± 0.001, z = +8.1)</td>
                  <td style={{"textAlign":"right"}}>1.87 (null 1.84 ± 0.009, z = +3.2)</td>
                </tr>
                <tr>
                  <td>Diameter</td>
                  <td style={{"textAlign":"right"}}>3 (null 3, no spread)</td>
                  <td style={{"textAlign":"right"}}>4 (null 3.94 ± 0.237, z = +0.3)</td>
                </tr>
                <tr>
                  <td>Largest clique</td>
                  <td style={{"textAlign":"right"}}>43 (null 27.31 ± 1.172, z = +13.4)</td>
                  <td style={{"textAlign":"right"}}>20 (null 21.10 ± 0.985, z = −1.1)</td>
                </tr>
                </tbody>
              </table>
              <p className="sub">
                Clustering, assortativity, average distance, diameter and the
                largest clique are all computed on the undirected, unweighted
                core: whether two countries share any corridor, not how many
                people or how many corridors. The null is 100 degree-preserving
                double-edge-swap shuffles of that same core, from
                {" "}
                <code>analysis/week03_country_networks.py</code>
                ; z is (real −
                null mean) / null standard deviation. Reciprocity needs the
                direction, so it uses the directed network and 100 directed
                shuffles that keep every country's number of origins and of
                destinations, from
                {" "}
                <code>analysis/week03_reciprocity.py</code>
                . The migrant network's
                diameter never moved across 100 shuffles, so it has no z to
                report.
              </p>
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>
                    Of the fifteen biggest destinations in each network,
                    only four appear in both: Germany, France, Jordan, Turkey.
                  </b>
                  {" "}
                  Comparing 0.41 against 0.11 the way the table does is unfair
                  to the smaller network, because reciprocity rises with
                  density on its own: in a directed graph wired at random, the
                  share of arcs whose reverse also exists is just the density.
                  Against that baseline migration is reciprocal
                  {" "}
                  <strong>2.4×</strong>
                  {" "}
                  more than chance, and displacement
                  {" "}
                  <strong>0.9×</strong>
                  . The table's shuffles set a different
                  bar, because they keep every country's number of origins and
                  destinations. For migration that raises chance reciprocity
                  from 0.17 to 0.26, since countries that take people from many
                  origins tend to send people to many. For displacement it
                  lowers chance reciprocity from 0.12 to 0.07, since the
                  countries hosting refugees from the most origins send
                  refugees to few. Both networks clear their bar, migration by
                  0.14 and displacement by 0.03. People who move for work come
                  and go. People who flee go back down the same edge far less
                  often, though more often than their countries' partner
                  counts alone would produce. The eleven destinations that are refugee-only are
                  Chad, Uganda, Bangladesh, Kenya, Lebanon and their
                  neighbours, and not one of them appears in the migration
                  top fifteen.
                </span>
              </div>
              <details className="qa" id="cliques">
                <summary>The two largest cliques, by name</summary>
                <p className="sub">
                  <b>Migrants (43 countries):</b>
                  {" "}
                  Argentina, Australia,
                  Austria, Belgium, Bolivia, Brazil, Bulgaria, Canada, Chile,
                  Colombia, Costa Rica, Croatia, Cyprus, Denmark, Estonia,
                  Finland, France, Germany, Greece, Hungary, Iceland, Israel,
                  Italy, Kingdom of the Netherlands, Latvia, Lithuania,
                  Luxembourg, Mexico, Norway, People's Republic of China,
                  Peru, Poland, Portugal, Romania, Russia, Slovakia, Slovenia,
                  South Africa, Spain, Switzerland, United Kingdom, United
                  States, Venezuela: every pair among them shares at least one
                  migration corridor in either direction.
                </p>
                <p className="sub">
                  <b>Refugees (20 countries):</b>
                  {" "}
                  Brazil, Canada, Egypt,
                  Eritrea, Ethiopia, Germany, Iraq, Italy, Ivory Coast, Kingdom
                  of the Netherlands, Lebanon, Morocco, Norway, Somalia,
                  Sudan, Sweden, Syria, United Kingdom, United States, Yemen: a
                  mix of asylum countries and the origins that send them
                  refugees, each pair connected by a corridor.
                </p>
              </details>
              <table className="ego">
                <tbody>
                <tr>
                  <th style={{"textAlign":"right"}}>#</th>
                  <th>Where migrants live</th>
                  <th style={{"textAlign":"left"}}>Where refugees are</th>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>1</td>
                  <td>United States</td>
                  <td style={{"textAlign":"left"}}>Iran</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>2</td>
                  <td style={{"fontWeight":"700"}}>Germany</td>
                  <td style={{"textAlign":"left"}}>Turkey</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>3</td>
                  <td>Saudi Arabia</td>
                  <td style={{"textAlign":"left","fontWeight":"700"}}>Germany</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>4</td>
                  <td>Canada</td>
                  <td style={{"textAlign":"left"}}>Uganda</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>5</td>
                  <td>United Kingdom</td>
                  <td style={{"textAlign":"left"}}>Pakistan</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>6</td>
                  <td>Spain</td>
                  <td style={{"textAlign":"left"}}>Chad</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>7</td>
                  <td>France</td>
                  <td style={{"textAlign":"left"}}>Poland</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>8</td>
                  <td>Australia</td>
                  <td style={{"textAlign":"left"}}>Ethiopia</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>9</td>
                  <td>United Arab Emirates</td>
                  <td style={{"textAlign":"left"}}>Bangladesh</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>10</td>
                  <td>Russia</td>
                  <td style={{"textAlign":"left"}}>Sudan</td>
                </tr>
                </tbody>
              </table>
              <p className="fineprint">
                Ranked by people. Of the top ten in each, only Germany
                appears in both. The migrant list is the rich world; the
                refugee list is the countries next door to a war, and eight of
                its ten sit below the unweighted average GDP per head of the
                199 countries with World Bank figures, $22,441.
              </p>
              <h3>Why this page weights its betweenness</h3>
              <p className="sub">
                The methods note says that betweenness on the raw matrix ranks
                statistics offices rather than countries. Here is the evidence,
                from the same script:
                {" "}
                <b>unweighted, undirected betweenness</b>
                {" "}
                on the 2024 network, the same measure and the same year, with a
                rising floor on how big a corridor has to be to count. The
                bottom row switches to the measure the rest of this page
                actually uses: weighted, directed, 2020.
              </p>
              <table className="ego">
                <tbody>
                <tr>
                  <th style={{"textAlign":"right"}}>Corridor floor</th>
                  <th style={{"textAlign":"right"}}>Corridors left</th>
                  <th style={{"textAlign":"left"}}>Top brokers</th>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>0</td>
                  <td style={{"textAlign":"right"}}>9,035</td>
                  <td style={{"textAlign":"left"}}>Australia, Norway, United States, Denmark, Greece</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>1,000</td>
                  <td style={{"textAlign":"right"}}>3,767</td>
                  <td style={{"textAlign":"left"}}>Australia, Canada, France, United States, Italy</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>10,000</td>
                  <td style={{"textAlign":"right"}}>1,780</td>
                  <td style={{"textAlign":"left"}}>Canada, France, United States, Australia, Italy</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>50,000</td>
                  <td style={{"textAlign":"right"}}>769</td>
                  <td style={{"textAlign":"left"}}>France, United States, United Kingdom, Spain, Russia</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>100,000</td>
                  <td style={{"textAlign":"right"}}>503</td>
                  <td style={{"textAlign":"left"}}>United States, France, Germany, United Kingdom, Russia</td>
                </tr>
                <tr>
                  <td style={{"textAlign":"right"}}>weighted, directed, 2020</td>
                  <td style={{"textAlign":"right"}}>9,031</td>
                  <td style={{"textAlign":"left"}}>United States, United Kingdom, Germany, France, Spain</td>
                </tr>
                </tbody>
              </table>
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>
                    At a floor of zero the top brokers are Australia, Norway
                    and Denmark. Raise it a little and Norway and Denmark vanish;
                    Australia holds on two floors longer, dropping out only at
                    50,000.
                  </b>
                  {" "}
                  None of the three is a hub for anybody. They are register
                  countries: a population register names every origin however
                  small, so they collect hundreds of one-person corridors that
                  a survey-based country files under "other". Those corridors
                  are real rows in the table and they are what put those three
                  on top. By a floor of 100,000 the unweighted list is the
                  United States, France, Germany, the United Kingdom and
                  Russia; the weighted, directed measure this page actually
                  uses agrees on four of those five without needing a floor at
                  all. The measure did not change across the first five rows;
                  what changed is whether a corridor of four people counts as a
                  path.
                </span>
              </div>
            </div>
          </details>
        </div>
        <div className="card" id="surprise">
          <h3>What surprised us</h3>
          <p className="sub">
            Betweenness on the raw, unweighted matrix does not rank
            countries at all: it ranks statistics offices. Australia,
            Norway and Denmark top it at a corridor floor of zero because
            their population registers name every origin however small, so
            hundreds of one-person corridors count as paths that a
            survey-based country would never report. Raise the floor and
            two of the three, Norway and Denmark, vanish immediately;
            Australia holds on two floors longer. Big ≠ prestigious carried the same lesson a
            different way: a country's PageRank tracks who sends it people
            far more closely than it tracks how many people it holds in
            total, so size and structural importance are not the same
            question.
          </p>
        </div>
        <div className="card" id="more">
          <h2>
            Four extra views, two of them from files the rest of the
            page does not load
          </h2>
          <details className="qa" id="views">
            <summary>
              <span className="qa-cue">The four extra views</span>
            </summary>
            <div className="qa-body">
              <ViewsStatus />
              <article className="qa-item">
                <h3>1 · The network with the geography taken away</h3>
                <GraphControls />
                <p className="axis-note">
                  Both sliders change this chart only. Drag to pan, scroll to
                  zoom, drag a country out of the pile, click one to select
                  it.
                </p>
                <VChart id="v-graph" className="echart tall" />
                <VAnswer view="v-graph" />
              </article>
              <article className="qa-item">
                <h3>2 · Who grew, 1990 to 2024</h3>
                <div className="qa-controls">
                  <AreaModes />
                </div>
                <AreaNote />
                <VChart id="v-area" className="echart wide" />
                <VAnswer view="v-area" />
              </article>
              <div className="notice">
                <span className="ico">🕰️</span>
                {" "}
                <span>
                  <b>The next two have a date on them.</b>
                  {" "}
                  The rest of the
                  page is eight five-year snapshots and cannot see a month, a
                  war or a border closing. These two can, and they are two
                  different sources counting two different things: asylum
                  applications in Europe, and border closures worldwide.
                </span>
              </div>
              <article className="qa-item">
                <h3>3 · A war, month by month</h3>
                <div className="qa-controls">
                  <label htmlFor="v-asylum-origin">People from</label>
                  {" "}
                  <OriginPicker />
                </div>
                <p className="axis-note">
                  First-time asylum applications in 34 European countries,
                  from Eurostat. One row is a year, one cell a month.
                  Temporary protection is a different legal route and is not
                  counted here, so most Ukrainians after February 2022 are
                  missing. Two entries in the picker are not countries:
                  Eurostat counts stateless applicants and applicants of
                  unknown citizenship in their own rows, and they are kept
                  because leaving them out would drop real people.
                </p>
                <VChart id="v-asylum" className="echart grid" />
                <VAnswer view="v-asylum" />
              </article>
              <article className="qa-item">
                <h3>4 · The day the borders shut</h3>
                <p className="axis-note">
                  One cell is one day, and the darker it is, the more
                  countries were closed to arrivals from everywhere. Oxford
                  tracker, top level of travel restriction.
                </p>
                <VChart id="v-closures" className="echart closures" />
                <VAnswer view="v-closures" />
              </article>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
