import PageScripts from "@/components/PageScripts";

export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="topbar">
        <div className="shell">
          <a className="brand" href="./">
            LOG–LOG
            {" "}
            <b>LEGENDS</b>
          </a>
          <nav className="topnav" aria-label="Sections of this page">
            <a className="here" href="#weeks">Posts</a>
            {" "}
            <a href="#about">About</a>
          </nav>
        </div>
      </div>
      <main id="main">
        <section className="hero home-hero" id="top">
          <div className="shell">
            <div className="home-hero-text">
              <h1>Take a network apart, one week at a time</h1>
              <p className="lede">
                Eight course weeks. Four on network structure, four on language.
              </p>
              <p className="body">
                We are three students taking DTU’s Social Graphs and
                Interactions. Each week the course teaches a new way to read a
                network: degree distributions, null models, centrality and
                communities, then natural language processing. We take that
                week’s method, point it at one question about real data, and
                publish the answer as an interactive post. You try the method
                yourself, see what it shows, and open the evidence and our
                code when you want more. No background in network science
                needed.
              </p>
              <div className="home-hero-actions">
                <a className="home-button" href="weeks/week05/">Read the latest post →</a>
              </div>
            </div>
            <aside aria-label="The course so far" className="home-progress">
              <p className="home-caps">The course so far</p>
              <ol className="home-track">
                <li className="live">
                  <a href="weeks/week01/">
                    <span>W1</span>
                    Networks
                    <i aria-hidden="true">→</i>
                  </a>
                </li>
                <li className="live">
                  <a href="weeks/week02/">
                    <span>W2</span>
                    Models &amp; null models
                    <i aria-hidden="true">→</i>
                  </a>
                </li>
                <li className="live">
                  <a href="weeks/week03/">
                    <span>W3</span>
                    Who matters, and why
                    <i aria-hidden="true">→</i>
                  </a>
                </li>
                <li className="live">
                  <a href="weeks/week04/">
                    <span>W4</span>
                    Communities &amp; backbones
                    <i aria-hidden="true">→</i>
                  </a>
                </li>
                <li className="live current">
                  <a href="weeks/week05/">
                    <span>W5</span>
                    The language half · NLP I
                    <i aria-hidden="true">→</i>
                  </a>
                </li>
                <li>
                  <span>W6</span>
                  NLP II
                </li>
                <li>
                  <span>W7</span>
                  NLP III
                </li>
                <li>
                  <span>W8</span>
                  Networks × language
                </li>
              </ol>
            </aside>
          </div>
        </section>
        <div className="shell">
          <section aria-labelledby="weeks-title" className="home-section" id="weeks">
            <div className="home-section-head">
              <h2 id="weeks-title">Weekly posts</h2>
            </div>
            <div className="home-half">
              <ol className="week-grid">
                <li>
                  <a data-week="1" className="week-card" href="weeks/week01/">
                    <span className="week-tag">Week 1 · Networks</span>
                    <h3>Hero Packs</h3>
                    <p className="week-q">Why do you keep drawing the same heroes?</p>
                    <span className="week-go">Read the post →</span>
                  </a>
                </li>
                <li>
                  <a data-week="2" className="week-card" href="weeks/week02/">
                    <span className="week-tag">Week 2 · Models &amp; null models</span>
                    <h3>Transit Authority</h3>
                    <p className="week-q">Which connections can the network live without?</p>
                    <span className="week-go">Read the post →</span>
                  </a>
                </li>
                <li>
                  <a data-week="3" className="week-card" href="weeks/week03/">
                    <span className="week-tag">Week 3 · Who matters, and why</span>
                    <h3>Corridor Control</h3>
                    <p className="week-q">Two networks, one world. Which country is the bridge?</p>
                    <span className="week-go">Read the post →</span>
                  </a>
                </li>
                <li>
                  <a data-week="4" className="week-card" href="weeks/week04/">
                    <span className="week-tag">Week 4 · Communities &amp; backbones</span>
                    <h3>Who Hires</h3>
                    <p className="week-q">Where does America's H-1B hiring happen?</p>
                    <span className="week-go">Read the post →</span>
                  </a>
                </li>
                <li>
                  <a data-week="5" className="week-card current" href="weeks/week05/">
                    <span className="week-tag">Week 5 · The language half · NLP I</span>
                    <h3>Marvel in Words</h3>
                    <p className="week-q">Does a character's place in the network show in the words of its page?</p>
                    <span className="week-go">Read the post →</span>
                  </a>
                </li>
              </ol>
            </div>
          </section>
          <section aria-labelledby="about-title" className="home-section home-about" id="about">
            <div className="home-section-head">
              <h2 id="about-title">About</h2>
            </div>
            <div className="card">
              <p className="home-caps">Made by</p>
              <ul className="members">
                <li>
                  <a aria-label="Gyula Kürthy on LinkedIn" href="https://www.linkedin.com/in/gy01/">
                    <img alt="" height="96" src="assets/images/team/gyula.jpg" width="96" />
                    {" "}
                    Gyula Kürthy
                  </a>
                </li>
                <li>
                  <a aria-label="Àngela Buxó on LinkedIn" href="https://www.linkedin.com/in/%C3%A0ngela-bux%C3%B3-l%C3%B3pez/">
                    <img alt="" height="96" src="assets/images/team/angela.jpg" width="96" />
                    {" "}
                    Àngela Buxó
                  </a>
                </li>
                <li>
                  <a aria-label="Niklas Johansen on LinkedIn" href="https://www.linkedin.com/in/niklas-netterstr%C3%B8m-johansen-332376310/">
                    <img alt="" height="96" src="assets/images/team/niklas.jpg" width="96" />
                    {" "}
                    Niklas Johansen
                  </a>
                </li>
              </ul>
            </div>
          </section>
        </div>
        <footer className="foot">
          <div className="shell">
            <span>
              02805 Social graphs and interactions · Fall 2026 · Article names, links and text excerpts from English
              Wikipedia,
              {" "}
              <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
            </span>
            {" "}
            <a aria-label="Source code on GitHub" className="home-github" href="https://github.com/horrrt/02805_social_graphs">
              <svg aria-hidden="true" height="28" viewBox="0 0 16 16" width="28">
                <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
            </a>
          </div>
        </footer>
      </main>
      <PageScripts scripts={[]} />
    </>
  );
}
