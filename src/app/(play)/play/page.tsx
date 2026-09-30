import PageScripts from "@/components/PageScripts";

export default function Page() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to the mission</a>
      <header className="signal-head wide">
        <a className="brand" href="../" aria-label="Log-Log Legends home">
          <span className="brand-mark" aria-hidden="true">↗</span>
          <span>
            LOG–LOG
            <br />
            LEGENDS
          </span>
        </a>
        {" "}
        <span className="signal-edition">A PLAYABLE DATA STORY · ISSUE 01</span>
        {" "}
        <a className="text-link" href="#results">Just the findings ↓</a>
      </header>
      <main id="main">
        <section className="signal-opening wide" aria-labelledby="signal-title">
          <div>
            <p className="eyebrow">ONE HERO. NO CONNECTIONS. YOUR MOVE.</p>
            <h1 id="signal-title">
              GIVE BAYMAX
              <br />
              <span>A VOICE.</span>
            </h1>
          </div>
          <div className="signal-premise">
            <p>
              Baymax is in the Marvel roster. But in this snapshot,
              {" "}
              <strong>not a single article links to him.</strong>
            </p>
            <p>You can add a link. The direction is up to you.</p>
            <span className="small-note">~60 seconds · 2 small missions · a real network</span>
          </div>
        </section>
        <section className="signal-lab wide" aria-label="Baymax link experiment">
          <div className="signal-topline">
            <span id="edit-label">REAL SNAPSHOT · NO EDITS</span>
            <ol className="mission-progress" aria-label="Mission progress">
              <li id="progress-found" aria-current="step">
                <span>01</span>
                {" "}
                Be found
              </li>
              <li id="progress-reply">
                <span>02</span>
                {" "}
                Answer back
              </li>
            </ol>
          </div>
          <div className="signal-layout">
            <div className="signal-visual">
              <figure className="signal-map">
                <svg id="signal-map" viewBox="0 0 1000 630" role="img" aria-labelledby="signal-map-title signal-map-desc">
                  <title id="signal-map-title">Baymax has no paths to or from the other articles.</title>
                  <desc id="signal-map-desc">
                    A diagram of the frozen 303-article network. Baymax is isolated. The controls add hypothetical directed links to Spider-Man; the two counts below report reachability through any number of links.
                  </desc>
                  <text x="160" y="300" textAnchor="middle" fill="#f4f5ef">BAYMAX · 0 LINKS</text>
                  <text x="660" y="300" textAnchor="middle" fill="#b2b7ad">277 ARTICLES IN THE MAIN GROUP</text>
                </svg>
                <figcaption className="signal-key">
                  <span>
                    <i className="key-to"></i>
                    Can reach Baymax
                  </span>
                  <span>
                    <i className="key-from"></i>
                    Baymax can reach
                  </span>
                  <span>
                    <i className="key-both"></i>
                    Both ways
                  </span>
                  <span>
                    <i className="key-none"></i>
                    Neither
                  </span>
                </figcaption>
              </figure>
              <div className="reach-counts" aria-label="Reachability results">
                <div>
                  <span>ARTICLES THAT CAN REACH BAYMAX</span>
                  <strong id="reach-to">0</strong>
                </div>
                <div>
                  <span>ARTICLES BAYMAX CAN REACH</span>
                  <strong id="reach-from">0</strong>
                </div>
              </div>
              <p className="reach-definition">
                Following one or more arrows. Other articles only. A path is a possible sequence of clicks, not measured readership.
              </p>
            </div>
            <div className="mission-panel">
              <p className="eyebrow" id="mission-label">MISSION 01 / BE FOUND</p>
              <h2 id="mission-title">
                PUT HIM
                <br />
                ON THE MAP.
              </h2>
              <p id="mission-copy">
                Help a reader elsewhere in the network find Baymax. You have one imagined link. Which page should it go on?
              </p>
              <div className="edit-choices" id="first-choices" role="group" aria-label="Choose one hypothetical link">
                <button type="button" data-edit="out" aria-pressed="false" disabled>
                  <span>WRITE ON BAYMAX’S PAGE</span>
                  <b>Baymax → Spider-Man</b>
                </button>
                {" "}
                <button type="button" data-edit="in" aria-pressed="false" disabled>
                  <span>WRITE ON SPIDER-MAN’S PAGE</span>
                  <b>Spider-Man → Baymax</b>
                </button>
              </div>
              <div className="mission-feedback" id="mission-feedback" role="status" aria-live="polite">
                <span className="feedback-kicker">THE CATCH</span>
                <p>A link is a one-way door. Writing about someone doesn’t make them link back.</p>
              </div>
              <button className="button" id="next-mission" type="button" hidden>
                Now let him answer
                {" "}
                <span aria-hidden="true">↗</span>
              </button>
              {" "}
              <button className="button" id="add-return" type="button" hidden>
                Add the return link
                {" "}
                <span aria-hidden="true">↔</span>
              </button>
              {" "}
              <a className="button" id="mission-finish" href="#results" hidden>
                See what you changed
                {" "}
                <span aria-hidden="true">↓</span>
              </a>
              <div id="replay-controls" hidden>
                <p className="small-note">REPLAY THE DIFFERENCE</p>
                <div className="signal-replay" role="group" aria-label="Compare imagined link states">
                  <button type="button" data-replay="snapshot">No links</button>
                  <button type="button" data-replay="out">Out only</button>
                  <button type="button" data-replay="in">In only</button>
                  <button type="button" data-replay="both" aria-pressed="true">Both</button>
                </div>
              </div>
              <button className="text-button" id="restart-mission" type="button" hidden>Start over ↺</button>
              <p className="signal-load" id="signal-load" role="status">Loading the frozen network…</p>
              <p className="simulation-note">
                A what-if experiment on the 26 August 2026 snapshot. These edits are imagined; the original 303 articles and 1,784 links stay intact.
              </p>
            </div>
          </div>
        </section>
        <section className="signal-results section-space" id="results" aria-labelledby="results-title">
          <div className="wide">
            <p className="eyebrow">THE FINDINGS / NO WORKING REQUIRED</p>
            <h2 id="results-title">
              A LINK IS SMALL.
              <br />
              <span>ITS DIRECTION ISN’T.</span>
            </h2>
            <div className="signal-findings">
              <article>
                <span className="finding-index">01 / ONE IMAGINED LINK IN</span>
                <strong>274</strong>
                <h3>articles could find Baymax.</h3>
                <p>
                  Add Spider-Man → Baymax and 274 other articles gain a path to him. Baymax still has no way out.
                </p>
              </article>
              <article>
                <span className="finding-index">02 / REVERSE THE SAME LINK</span>
                <strong>231</strong>
                <h3>articles Baymax could reach.</h3>
                <p>
                  Point it from Baymax → Spider-Man instead. He gains 231 destinations, but nobody gains a path to him.
                </p>
              </article>
              <article>
                <span className="finding-index">03 / KEEP BOTH DIRECTIONS</span>
                <strong>229</strong>
                <h3>articles with a route both ways.</h3>
                <p>
                  Two imagined links create a round trip between Baymax and 229 other articles. Being reachable and reaching out are different.
                </p>
              </article>
            </div>
            <div className="signal-conclusion">
              <h3>Being listed isn’t the same as being connected.</h3>
              <p>
                Baymax is one of
                {" "}
                <strong>17 isolates</strong>
                {" "}
                in the real snapshot. The experiment shows how direction changes inclusion—and why a single “number of connections” misses part of the story.
              </p>
            </div>
            <a className="button button-dark" href="../weeks/week01/#post">
              Who gets the spotlight in the real graph?
              {" "}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
        <section className="paper signal-evidence section-space">
          <div className="wide">
            <p className="eyebrow">FOR THE CURIOUS</p>
            <details>
              <summary>
                What is real, and what did we change?
                {" "}
                <span aria-hidden="true">+</span>
              </summary>
              <div className="evidence-body">
                <p>
                  The source is the course’s frozen 26 August 2026 Wikipedia snapshot: 303 character articles and 1,784 directed links. Baymax has zero incoming and outgoing links within that roster. The experiment adds only Baymax → Spider-Man, Spider-Man → Baymax, or both, to an in-memory copy of that graph.
                </p>
                <p>
                  Each count includes distinct other articles reachable by following arrows for any number of steps. An article with many possible paths is counted once. The round-trip count includes only articles reachable in both directions. These are counterfactual graph results, not predictions of readership, friendship, or future Wikipedia edits.
                </p>
                <p>
                  The map keeps the same positions between states. Existing connections are muted; the bright, dashed arrows are the imagined additions. Moving a dot does not change the data.
                </p>
              </div>
            </details>
            <details>
              <summary>
                How were the results checked?
                {" "}
                <span aria-hidden="true">+</span>
              </summary>
              <div className="evidence-body">
                <p>
                  The browser follows the directed links and counts the reachable articles. A separate NetworkX calculation in the presentation exporter checks every state: no edit, outgoing only, incoming only, and both. Baymax is excluded from all reachability counts.
                </p>
                <p>
                  <a href="../assets/data/marvel_story.json" download>Download the frozen graph and scenario checks ↓</a>
                  {" "}
                  ·
                  {" "}
                  <a href="../weeks/week01/#methods">Source files, notebooks and snapshot checks ↗</a>
                </p>
              </div>
            </details>
            <details>
              <summary>
                Where did the playable-story idea come from?
                {" "}
                <span aria-hidden="true">+</span>
              </summary>
              <div className="evidence-body">
                <p>
                  <a href="https://oddvar112.github.io/Social-Graphs-and-Interactions/weeks/week1/game/">Web-Crawler by Capes &amp; Edges</a>
                  {" "}
                  showed how a mission can make directed paths tangible. This experiment asks a different question: how does adding a link change who can reach an isolated character? The imagined edits, reachability analysis and presentation here are our own.
                </p>
              </div>
            </details>
            <a className="text-link" href="../">← Back to Log-Log Legends</a>
          </div>
        </section>
      </main>
      <footer className="site-foot">
        <div className="wide">
          <span>LOG–LOG LEGENDS</span>
          <span>ONE LINK. A DIFFERENT CONVERSATION.</span>
          <a href="https://github.com/horrrt/02805_social_graphs">DTU 02805 · 2026 ↗</a>
        </div>
      </footer>
      <noscript>
        <p className="noscript-note">
          The three verified findings above work without JavaScript. Turn JavaScript on to try the imagined edits.
        </p>
      </noscript>
      <PageScripts page="play" />
    </>
  );
}
