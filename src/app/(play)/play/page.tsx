import { Lab } from "@/features/play/Lab";

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
        <Lab />
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
    </>
  );
}
