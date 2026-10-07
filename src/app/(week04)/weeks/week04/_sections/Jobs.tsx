import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { GlossTerm } from "./GlossTerm";

// Section 2: which jobs go together.
export function Jobs() {
  return (
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
              <GlossTerm id="w4-term-jobs-modularity" word="modularity">
                A score for how much more a network links inside its clusters than chance would. Higher means cleaner clusters.
              </GlossTerm>
              {" "}
              <span data-jobs="null-real">…</span>
              {" "}
              against
              {" "}
              <span data-jobs="null-null">…</span>
              {" "}
              for
              {" "}
              <GlossTerm id="w4-term-jobs-rewired" word="rewired networks">
                Random copies of the network in which every company keeps its number of occupations. They show how much clustering chance alone produces.
              </GlossTerm>
              .
            </p>
            <Drawers variant="foot">
              <Drawer label="Background">
                <p>
                  Software developers sit in almost every company's mix, so most links run through them. The two questions below test the clusters from two sides: do outsourcing firms and direct employers bundle jobs the same way, and does any job belong to two bundles at once?
                </p>
              </Drawer>
            </Drawers>
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
              Software Developers sit in 9 of the 12 pairs because almost every sponsoring company hires them.
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
              <GlossTerm id="w4-term-jobs-split-louvain" word="Louvain">
                A standard method that splits a network into groups whose members link more to each other than to the rest.
              </GlossTerm>
              {" "}
              clusters.
              {" "}
              <GlossTerm id="w4-term-jobs-split-nmi" word="NMI">
                Normalized mutual information: a score for how alike two groupings are, 1 when they match exactly and 0 when they are unrelated.
              </GlossTerm>
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
                The two clusterings agree at NMI 0.43. Random groups
                matched on size agree at 0.57 ± 0.04 (z = −3.3).
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
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              We split the companies in two: the 817 firms that place 20 or more filings at client sites (21% of all filings) and the 58,379 others. Alone, that number means little: splitting companies into a small and a large group changes the clusters even if nobody behaves differently. So the baseline draws 20 random groups that match the outsourcing firms in both respects: the same number of companies of each size, from the one-filing firms to the giants. NMI is measured on the 211 occupations that sit in a cluster of two or more on both sides.
            </p>
            <p>
              The random groups have the same number of companies and the same share of filings as the outsourcing firms. Whiskers span one standard deviation over 20 random splits. Only the blue baseline matches the outsourcing firms on both number and size of companies, so it is the fair comparison.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              The half-matched baselines show why the match matters: random groups with only the same number of companies hold 1.3% of filings and agree at 0.42 ± 0.10, which would have hidden the difference. At the top the two mixes look alike: software developers are 28% of the outsourcing firms' filings and 33% of the direct employers'. Below that they part: "computer occupations, all other" is 22% of the outsourcing firms' filings and 5% of the direct employers', and direct employers file for 259 occupations the outsourcing firms never touch.
            </p>
          </Drawer>
        </Drawers>
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
                Each dot is a job; dashed lines mark equal rates.
              </span>
            </figcaption>
            <div className="w4-figure-body" id="chart-jobs-linkcom-scatter"></div>
          </figure>
        </div>
        <Drawers variant="foot">
          <Drawer label="Background">
            <p>A Louvain partition puts every job in exactly one cluster.</p>
          </Drawer>
          <Drawer label="Method">
            <p>
              The cut is chosen where partition density D, the average of how close each community is to a complete one, peaks. On the 25,431 links between 471 occupations it peaks at D = 0.58 with one community holding 84% of the links; 114 communities have three links or more, counting it.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              The top is small occupations such as communications equipment operators and electrical power-line installers (5 communities over 11 links each). None of the 3 occupations that section 2's first test flagged as bridges appear in it.
            </p>
            <p>
              A job's number of communities mostly counts its links (Spearman 0.85), so the table ranks by communities per link, as the course suggests.
            </p>
          </Drawer>
          <Drawer label="Table: 15 jobs in the most communities">
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
          </Drawer>
        </Drawers>
      </div>
    </section>
  );
}
