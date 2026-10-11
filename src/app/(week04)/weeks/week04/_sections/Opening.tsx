import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { GlossTerm } from "./GlossTerm";

// Section 0: what an H-1B filing is and how the three networks are built.
export function Opening() {
  return (
    <section className="step" id="opening">
      <header className="w4-opener">
        <span aria-hidden="true" className="w4-opener-num">0</span>
        <div>
          <h2>Opening</h2>
          <p>
            An H-1B filing is an employer’s request to hire a non-US worker in a
            {" "}
            <GlossTerm id="w4-term-opening-specialty" word="specialty occupation">
              A job that needs at least a bachelor’s degree in a specific field, such as engineering or accounting.
            </GlossTerm>
            .
          </p>
        </div>
      </header>
      <div className="card w4-card">
        <div className="w4-two">
          <div>
            <p className="sub">
              It names the job, the worksite, the wage and the company asking
              to employ the worker. The Department of Labor records the filing
              even when the worker never arrives, changes employer or is not hired.
            </p>
            <p className="sub">
              <b>Why start with companies?</b>
              {" "}
              The employer is the thread linking the three networks in this story.
            </p>
            <div className="notice">
              <span className="ico">!</span>
              {" "}
              <span>
                <b>Read the scope carefully</b>
                {" "}
                These are visa-sponsored filings, not all hiring in America.
              </span>
            </div>
            <p className="w4-scope-note">
              Unless stated otherwise, the figures below use
              {" "}
              <GlossTerm id="w4-term-opening-certified" word="certified">The Department of Labor accepted the filing. Only then can the employer take it forward.</GlossTerm>
              {" "}
              H-1B
              filings in 2025. One filing is a request, not a guaranteed job.
            </p>
            <Drawers variant="foot">
              <Drawer label="Background">
                <p>
                  A job title tells us what work is requested; a company tells us which jobs, places, and clients are connected by the same hiring system. The links mean shared filings. They say nothing about friendships between workers or companies.
                </p>
                <p>
                  The filings leave out workers without H-1B sponsorship, employers that never file, rejected or withdrawn applications, and the wider conditions that shape who gets hired.
                </p>
              </Drawer>
            </Drawers>
          </div>
          <div>
            <div className="w4-anatomy">
              <h3>What one filing names</h3>
              <p>Each section builds its network from one of these fields.</p>
              <dl>
                <div>
                  <dt>Employer</dt>
                  <dd>The company asking to hire</dd>
                  <span className="w4-tag access">Links all three networks</span>
                </div>
                <div>
                  <dt>Worksite</dt>
                  <dd>A city, grouped into its metro area</dd>
                  <span className="w4-tag">1 · Where</span>
                </div>
                <div>
                  <dt>Occupation</dt>
                  <dd>The job, as an official occupation code</dd>
                  <span className="w4-tag">2 · Jobs</span>
                </div>
                <div>
                  <dt>Client</dt>
                  <dd>The company the worker is placed at, when it is not the employer</dd>
                  <span className="w4-tag">3 · Staffing</span>
                </div>
                <div>
                  <dt>Wage level</dt>
                  <dd>I (entry) to IV (fully competent)</dd>
                  <span className="w4-tag">5 · Beyond</span>
                </div>
                <div>
                  <dt>Law firm</dt>
                  <dd>Who prepared the filing</dd>
                  <span className="w4-tag">5 · Beyond</span>
                </div>
              </dl>
            </div>
            <div className="w4-howto">
              <h3>How to read the charts</h3>
              <div>
                <i className="w4-sw-real"></i>
                <b>The real network</b>
                <span>What the filings show.</span>
              </div>
              <div>
                <i className="w4-sw-band"></i>
                <b>Random baseline</b>
                <span>Mean and one standard deviation over rewired networks or random draws.</span>
              </div>
              <div>
                <i className="w4-sw-people"></i>
                <b>Placed at a client</b>
                <span>Filings that put the worker at another company.</span>
              </div>
              <div>
                <i className="w4-sw-access"></i>
                <b>Direct employer</b>
                <span>Filings for the employer’s own site.</span>
              </div>
              <div>
                <i className="w4-sw-ref"></i>
                <b>Reference</b>
                <span>The full network, or equal odds.</span>
              </div>
              <div>
                <i className="w4-sw-groups">
                  <b className="g0"></b>
                  <b className="g1"></b>
                  <b className="g2"></b>
                </i>
                <b>Metro groups</b>
                <span>Violet, green and slate mark the three Louvain groups, on maps only.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
