import { PostTopbar } from "@/components/site/PostTopbar";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <PostTopbar root="./" current="home" />
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
                <a className="home-button" href="weeks/week06/">Read the latest post →</a>
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
                <li className="live">
                  <a href="weeks/week05/">
                    <span>W5</span>
                    NLP I
                    <i aria-hidden="true">→</i>
                  </a>
                </li>
                <li className="live current">
                  <a href="weeks/week06/">
                    <span>W6</span>
                    NLP II
                    <i aria-hidden="true">→</i>
                  </a>
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
                  <a data-week="5" className="week-card" href="weeks/week05/">
                    <span className="week-tag">Week 5 · NLP I</span>
                    <h3>Marvel in Words</h3>
                    <p className="week-q">Does a character's place in the network show in the words of its page?</p>
                    <span className="week-go">Read the post →</span>
                  </a>
                </li>
                <li>
                  <a data-week="6" className="week-card current" href="weeks/week06/">
                    <span className="week-tag">Week 6 · NLP II</span>
                    <h3>Storm, Not Weather</h3>
                    <p className="week-q">What do counts, weights and word vectors give away about 303 Marvel pages?</p>
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
                  <a aria-label="Àngela Buxó on LinkedIn" href="https://www.linkedin.com/in/angelabuxo/">
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
              <p className="home-caps">Course</p>
              <p>
                DTU 02805 Social Graphs and Interactions, autumn 2026.
                {" "}
                <a href="https://sunelehmann.com/socialgraphs2026-web/index.html">Course website ↗</a>
              </p>
            </div>
          </section>
        </div>
        <SiteFooter>
          <span>
            Article names, links and text excerpts from English Wikipedia,
            {" "}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
          </span>
        </SiteFooter>
      </main>
    </>
  );
}
