import { Chart } from "@/features/week03/frame/Chart";
import { Slot } from "@/features/week03/frame/Slot";
import { AxisModes } from "@/features/week03/tails/AxisModes";
// 2: heavy tails in migration.
export function Tails() {
  return (
    <>
      {/* 2 ----------------------------------------------------------- */}
      <section className="step" id="tails">
        <div className="card">
          <div className="step-head">
            <span className="num">2</span>
            <h2>Heavy tails in migration</h2>
            <Slot view="tails-tag" as="span" id="tails-tag" className="year-tag" initial="(2020 · follows the slider)" />
          </div>
          <p className="sub">
            <b>
              Three of the four tails on this page fail the test for a
              power law.
            </b>
            {" "}
            The fourth, flight partners, is not ruled out on
            its own terms, but the lognormal and exponential still describe
            it better wherever the three can be told apart. The charts
            below show none of that, which is the reason for fitting rather
            than looking.
          </p>
          <div className="grid2">
            <div className="plot">
              <h3>A. Distribution of partners</h3>
              <p className="axis-note">
                How many countries have how many partners. A partner is
                another country on the other end of a link, not a person.
                Partner counts are binned by doubling and each bar is
                countries per partner value, so a wide bin is not tall
                merely for being wide. Click a bar to select the largest
                country in it.
              </p>
              <div className="legend">
                <span>
                  <i style={{"background":"#f2820c"}}></i>
                  {" "}
                  In-degree
                </span>
                {" "}
                <span>
                  <i style={{"background":"#6b4fbb"}}></i>
                  {" "}
                  Out-degree
                </span>
                {" "}
                <span>
                  <i style={{"background":"#1f8fd6"}}></i>
                  {" "}
                  Flight partners
                </span>
              </div>
              <AxisModes chart="hist" label="Axis scale for the degree distribution" />
              <Chart id="hist" width="1100" height="560" label="Chart: distribution of the number of partners per country" />
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>What to notice, in 2020</b>
                  {" "}
                  These numbers are for 2020, the null-model year; the chart
                  itself follows the year slider. The distribution is
                  skewed rather than lopsided at the bottom: the median
                  country has 21 origins and the busiest has 203, so seven
                  countries in ten sit below the mean of 39 without many of
                  them being isolated. Only 22% have fewer than ten
                  partners.
                </span>
              </div>
            </div>
            <div className="plot">
              <h3>B. CCDF of partners</h3>
              <p className="axis-note">
                P(K ≥ k), the share of countries with at least k partners.
                Click a point to select it.
              </p>
              <div className="legend">
                <span>
                  <i style={{"background":"#f2820c"}}></i>
                  {" "}
                  In-degree
                </span>
                {" "}
                <span>
                  <i style={{"background":"#6b4fbb"}}></i>
                  {" "}
                  Out-degree
                </span>
                {" "}
                <span>
                  <i style={{"background":"#1f8fd6"}}></i>
                  {" "}
                  Flight partners
                </span>
              </div>
              <AxisModes chart="ccdf" label="Axis scale for the CCDF" />
              <Chart id="ccdf" width="1100" height="560" label="Chart: CCDF of the number of partners per country" />
              <div className="notice">
                <span className="ico">💡</span>
                {" "}
                <span>
                  <b>What to notice</b>
                  {" "}
                  The CCDF shows the long tail more clearly than the raw
                  histogram, and the flight network's tail is the longest.
                </span>
              </div>
              <details className="qa">
                <summary>
                  <span className="qa-cue">Is it a power law? We fitted it</span>
                </summary>
                <div className="qa-body">
                  <p className="sub">
                    A straight-ish line on log–log axes is not evidence of a
                    power law, and with 232 countries the axis only spans
                    about two decades. So we fitted the tails:
                    maximum likelihood for the exponent, the lower bound
                    chosen by minimising the Kolmogorov–Smirnov distance, a
                    goodness-of-fit test against 500 synthetic datasets
                    drawn from the fitted model, and a likelihood-ratio test
                    against the two distributions that also look straight
                    here. The method is Clauset, Shalizi and Newman (2009);
                    the code is
                    {" "}
                    <code>analysis/week03_tails.py</code>
                    . The fits are for
                    2020, the null-model year, and stay there while the
                    charts above follow the slider.
                  </p>
                  <table className="ego">
                    <tbody>
                    <tr>
                      <th>Tail</th>
                      <th style={{"textAlign":"right"}}>
                        x
                        <sub>min</sub>
                      </th>
                      <th style={{"textAlign":"right"}}>α</th>
                      <th style={{"textAlign":"right"}}>In tail</th>
                      <th style={{"textAlign":"right"}}>Fit p</th>
                      <th>Against the rivals</th>
                    </tr>
                    <tr>
                      <td>Origins per destination</td>
                      <td style={{"textAlign":"right"}}>33</td>
                      <td style={{"textAlign":"right"}}>2.32</td>
                      <td style={{"textAlign":"right"}}>85</td>
                      <td style={{"textAlign":"right"}}>0.00</td>
                      <td>lognormal fits better (p = 0.072)</td>
                    </tr>
                    <tr>
                      <td>People on a corridor</td>
                      <td style={{"textAlign":"right"}}>126,665</td>
                      <td style={{"textAlign":"right"}}>2.05</td>
                      <td style={{"textAlign":"right"}}>393</td>
                      <td style={{"textAlign":"right"}}>0.01</td>
                      <td>lognormal fits better (p = 0.026)</td>
                    </tr>
                    <tr>
                      <td>Destinations per origin</td>
                      <td style={{"textAlign":"right"}}>33</td>
                      <td style={{"textAlign":"right"}}>2.95</td>
                      <td style={{"textAlign":"right"}}>124</td>
                      <td style={{"textAlign":"right"}}>0.03</td>
                      <td>both fit better (p = 0.004, 0.000)</td>
                    </tr>
                    <tr>
                      <td>Flight partners</td>
                      <td style={{"textAlign":"right"}}>27</td>
                      <td style={{"textAlign":"right"}}>2.93</td>
                      <td style={{"textAlign":"right"}}>57</td>
                      <td style={{"textAlign":"right"}}>0.21</td>
                      <td>both fit better (p = 0.082, 0.077)</td>
                    </tr>
                    </tbody>
                  </table>
                  <p className="sub">
                    Fit p is the share of synthetic datasets from the fitted
                    power law that fit it
                    {" "}
                    <em>worse</em>
                    {" "}
                    than the real data
                    does. Below 0.1 the power law is ruled out; above it the
                    power law survives, which is not the same as winning.
                    Three of the four are below it: origins per destination
                    and people on a corridor solidly, destinations per
                    origin more narrowly at 0.03. Flight partners alone
                    survives, at 0.21, and still loses to both rivals.
                    Where a rival can be told apart at all it is one of
                    the two, and on this page's tails that is usually the
                    lognormal.
                  </p>
                  <div className="notice">
                    <span className="ico">💡</span>
                    {" "}
                    <span>
                      <b>
                        So the word on this page is "heavy-tailed", not
                        "scale-free".
                      </b>
                      {" "}
                      Origins per destination fits α = 2.32, well inside
                      the range every scale-free network in a lecture slide
                      has, and it is still ruled out at
                      p = 0.00. That is the trap the log–log toggle above
                      sets: a line can look right and be wrong, and the only
                      way to find out is to fit it.
                    </span>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
