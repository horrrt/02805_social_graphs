import { FindingMini } from "@/features/week04/frame/Findings";
import { GlossTerm } from "./GlossTerm";

// Five sections, five findings: one mini strip each.
export function Findings() {
  return (
    <section aria-label="Five findings" className="w4-findings" id="findings">
      <div className="w4-findings-head">
        <p className="w4-caps">Five sections, five findings</p>
        <div className="w4-key">
          <span>
            <i className="w4-key-real"></i>
            the real network
          </span>
          <span>
            <i className="w4-key-band"></i>
            random baseline, mean ± 1 sd
          </span>
        </div>
      </div>
      <div className="w4-finding">
        <span className="w4-num">1</span>
        <div>
          <h3>Where the hiring is</h3>
          <p>
            Cities group by who hires there, not by region, and no single link holds the map together.
          </p>
        </div>
        <FindingMini finding="1" />
        <a href="#place">Section 1 →</a>
      </div>
      <div className="w4-finding">
        <span className="w4-num">2</span>
        <div>
          <h3>Which jobs go together</h3>
          <p>Employers reveal bundles of work.</p>
        </div>
        <FindingMini finding="2" />
        <a href="#jobs">Section 2 →</a>
      </div>
      <div className="w4-finding">
        <span className="w4-num">3</span>
        <div>
          <h3>Who staffs whom</h3>
          <p>
            One certified H-1B filing in five names a client company as the worksite. Yet a client that changes
            {" "}
            <GlossTerm id="w4-term-findings-vendor" word="vendor">
              An outsourcing firm that files the H-1B and places the worker at another company, its client. Elsewhere the page also calls it a placing firm.
            </GlossTerm>
            {" "}
            stays inside its group far more often than chance.
          </p>
        </div>
        <FindingMini finding="3" />
        <a href="#who">Section 3 →</a>
      </div>
      <div className="w4-finding">
        <span className="w4-num">4</span>
        <div>
          <h3>Without the biggest firms</h3>
          <p>
            Take out the largest filers, Amazon above all, and the metro groups start to follow Census regions; the job clusters shift but hold.
          </p>
        </div>
        <FindingMini finding="4" />
        <a href="#footprint">Section 4 →</a>
      </div>
      <div className="w4-finding">
        <span className="w4-num">5</span>
        <div>
          <h3>Beyond the three networks</h3>
          <p>
            The section 3 groups barely show in lawyers or green cards; the outsourcing firms stand out in the wage levels they file.
          </p>
        </div>
        <FindingMini finding="5" />
        <a href="#beyond">Section 5 →</a>
      </div>
    </section>
  );
}
