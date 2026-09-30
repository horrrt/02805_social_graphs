import PageScripts from "@/components/PageScripts";

export default function Page() {
  return (
    <>
      <div className="sheet">
        <header className="masthead">
          <p className="lbl crumbs">
            <a href="../../">Log–Log Legends</a>
            {" "}
            /
            {" "}
            <a href="../../weeks/week02/">Week 2: Marvel Transit Authority</a>
          </p>
          <p className="lbl">02805 Social graphs &amp; interactions · Week 2 · Models &amp; null models</p>
          <h1>
            Screen
            <br />
            Test
          </h1>
          <p className="deck">
            Three famous models audition for the part of the Marvel network. Each one nails a scene and fluffs the rest. Then we stop asking which model looks right and start asking what chance could have produced.
          </p>
          <div className="billing">
            <span className="lbl">Log–Log Legends</span>
            {" "}
            <span className="lbl">Àngela · Gyula · Niklas</span>
            {" "}
            <span className="lbl" id="snap">Snapshot</span>
          </div>
        </header>
        <section className="act">
          <div className="rail">
            <div className="no">00</div>
            <p className="lbl tag">The part</p>
          </div>
          <div className="act-body">
            <h2>One network, cast decades ago</h2>
            <p>
              The role is the connected core of the Marvel Wikipedia snapshot: every article that can reach every other by following links in either direction. These are the numbers a candidate has to reproduce.
            </p>
            <dl className="vitals" id="vitals"></dl>
            <p>
              Network science began by asking whether a simple mechanism could manufacture a structure like this. Three attempts follow, in the order the field made them, each fixing what the last one missed.
            </p>
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">01</div>
            <p className="lbl tag">The auditions</p>
          </div>
          <div className="act-body">
            <h2>Three candidates, three scenes</h2>
            <p>
              Every candidate is built to the same size as Marvel and handed the same three scenes to play:
              {" "}
              <em className="key">short paths</em>
              ,
              {" "}
              <em className="key">clustering</em>
              , and
              {" "}
              <em className="key">hubs</em>
              . Pick one and watch it try.
            </p>
            <div className="cast" id="cast"></div>
            <div className="reel">
              <figure>
                <canvas id="cv-marvel"></canvas>
                <figcaption id="cap-marvel">Marvel</figcaption>
              </figure>
              <figure>
                <canvas id="cv-cand"></canvas>
                <figcaption id="cap-cand">Candidate</figcaption>
              </figure>
            </div>
            <div className="tw">
              <table id="score">
                <caption>Screen test scorecard · a scene passes inside the tolerance named in its column</caption>
                <thead>
                  <tr>
                    <th>Network</th>
                    <th>Mechanism</th>
                    <th>Short paths ±20%</th>
                    <th>Clustering ±25%</th>
                    <th>Hubs ±40%</th>
                  </tr>
                </thead>
                <tbody id="score-body"></tbody>
              </table>
            </div>
            <p className="lbl" id="score-note">One seed per model, one run · not an average over many draws.</p>
            <div className="finding" id="verdict-01"></div>
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">02</div>
            <p className="lbl tag">The tail</p>
          </div>
          <div className="act-body">
            <h2>Where the candidates give themselves away</h2>
            <p>
              The share of articles with at least
              {" "}
              <em className="key">k</em>
              {" "}
              links, on log axes, with no binning. A heavy tail runs straight and far. A coin-flip tail falls off a cliff. This is a visual read, not a fitted power law: no distribution was fit to these tails.
            </p>
            <figure>
              <canvas id="cv-ccdf" style={{"aspectRatio":"1/0.5"}}></canvas>
              <figcaption>P(K ≥ k) against k · both axes logarithmic · click a name to hide it</figcaption>
            </figure>
            <div className="controls" id="ccdf-keys"></div>
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">03</div>
            <p className="lbl tag">The turn</p>
          </div>
          <div className="act-body">
            <h2>Stop casting. Start testing.</h2>
            <p>
              No model wins, so the question changes. Instead of building a network that looks like Marvel, keep Marvel's own degrees exactly and scramble only
              {" "}
              <em className="key">who is wired to whom</em>
              . Swap the ends of two links at a time, over and over. Everyone keeps their link count. The neighbourhoods dissolve.
            </p>
            <div className="rig">
              <figure>
                <canvas id="cv-rig" style={{"aspectRatio":"1/0.62"}}></canvas>
                <figcaption id="cap-rig">Live rig · clustering recomputed as the links swap</figcaption>
              </figure>
              <div>
                <div className="gauge">
                  <p className="small">Clustering now</p>
                  <p className="big" id="rig-c">—</p>
                  <p className="small" id="rig-swaps">0 swaps</p>
                </div>
                <div className="controls" style={{"marginTop":"10px"}}>
                  <button className="go" id="rig-run" type="button">Run the shuffle</button>
                  {" "}
                  <button className="go ghost" id="rig-reset" type="button">Restore Marvel</button>
                </div>
                <p className="lbl" style={{"marginTop":"12px"}} id="rig-note">Every article keeps its exact number of links.</p>
              </div>
            </div>
            <p>
              One shuffle proves nothing, so we ran many and kept the score. Marvel's real value sits against the whole distribution of what scrambling produces.
            </p>
            <figure>
              <canvas id="cv-hist" style={{"aspectRatio":"1/0.42"}}></canvas>
              <figcaption id="cap-hist">Distribution of average clustering across shuffles</figcaption>
            </figure>
            <div className="controls">
              <span className="lbl">Report</span>
              <div className="toggle" id="stats-toggle">
                <button type="button" data-mode="full" aria-pressed="true">Full table</button>
                {" "}
                <button type="button" data-mode="plain" aria-pressed="false">Headline only</button>
              </div>
            </div>
            <div id="stats-full">
              <div className="tw">
                <table>
                  <caption>Marvel against the degree-preserving null</caption>
                  <thead>
                    <tr>
                      <th>Measurement</th>
                      <th>Marvel</th>
                      <th>Null mean</th>
                      <th>Null SD</th>
                      <th>z</th>
                      <th>p</th>
                    </tr>
                  </thead>
                  <tbody id="null-body"></tbody>
                </table>
              </div>
              <p className="lbl" style={{"marginTop":"8px"}} id="null-note"></p>
            </div>
            <div id="stats-plain" hidden></div>
            <div className="finding" id="verdict-03"></div>
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">04</div>
            <p className="lbl tag">The negative</p>
          </div>
          <div className="act-body">
            <h2>The result that went against us</h2>
            <p>
              Draw a character at random, then one of their neighbours at random. The neighbour usually has more links, because popular articles sit in many neighbour lists. That is the friendship paradox, and it is real here. Pull the handle a few times and watch it appear.
            </p>
            <div className="draw">
              <div className="who" id="who-a">
                <p className="nm">—</p>
                <p className="k">Press draw</p>
              </div>
              <div className="arrow">→</div>
              <div className="who" id="who-b">
                <p className="nm">—</p>
                <p className="k">their random neighbour</p>
              </div>
            </div>
            <div className="controls">
              <button className="go" id="draw-one" type="button">Draw a pair</button>
              {" "}
              <button className="go ghost" id="draw-many" type="button">Draw 200</button>
              {" "}
              <button className="go ghost" id="draw-reset" type="button">Clear</button>
              {" "}
              <span className="lbl" id="draw-tally">0 draws</span>
            </div>
            <p className="lbl" style={{"maxWidth":"68ch","lineHeight":"1.7"}}>
              The handle measures single draws: one character, one of their neighbours. The 87.4% quoted below is the other common form, comparing each article with the
              {" "}
              <em>average</em>
              {" "}
              of all its neighbours. Both are the friendship paradox, and they are not the same number: the neighbour-average form below matches what the shuffle predicts, but the single-draw form here is slightly weaker than the shuffle predicts.
            </p>
            <div className="finding warn" id="verdict-04"></div>
          </div>
        </section>
        <section className="act">
          <div className="rail">
            <div className="no">05</div>
            <p className="lbl tag">Receipts</p>
          </div>
          <div className="act-body">
            <h2>How every number here was made</h2>
            <div className="card">
              <h3>Population</h3>
              <p id="rec-pop"></p>
              <h3>Candidates</h3>
              <p id="rec-models"></p>
              <h3>Null model</h3>
              <p id="rec-null"></p>
              <h3>Control</h3>
              <p id="rec-control"></p>
              <h3>What this page does not claim</h3>
              <p>
                Tolerances on the scorecard are our choice and are printed in the column headings; the raw values sit beside every verdict so you can apply your own. The live rig is a feel for the mechanism and is not the source of any statistic. Nothing here says why the links exist, only what chance alone would and would not produce.
              </p>
            </div>
          </div>
        </section>
        <footer>
          <p id="foot"></p>
          <p className="lbl foot-links">
            <a href="../../weeks/week02/">← Back to the Week 2 post</a>
            {" "}
            ·
            {" "}
            <a href="../../">Log–Log Legends</a>
          </p>
        </footer>
      </div>
      <PageScripts page="screen-test" />
    </>
  );
}
