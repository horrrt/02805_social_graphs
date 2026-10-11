import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Evidence } from "./Evidence";
import { TopicJobs } from "./TopicJobs";
import { TopicOutsourcing } from "./TopicOutsourcing";
import { TopicPaperwork } from "./TopicPaperwork";
import { TopicWhere } from "./TopicWhere";
import { TopicYears } from "./TopicYears";

// The deep dive: the catalogue of questions and the five topics behind it.
export function Cut() {
  return (
    <section className="step" data-depth="deep" id="cut">
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
        <Drawers variant="inline">
          <Drawer label="Which ones">
            <span>
              Which cities hire the most? and Is it one national job market or several regional ones? in section 1, Which jobs are hired together? in section 2, How many workers sit at a client? in section 3.
            </span>
          </Drawer>
        </Drawers>
      </div>
      <TopicWhere />
      <TopicJobs />
      <TopicOutsourcing />
      <TopicPaperwork />
      <TopicYears />
      <Evidence />
    </section>
  );
}
