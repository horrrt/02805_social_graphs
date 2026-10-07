import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { GlossTerm } from "./GlossTerm";

// Section 4: the networks without the biggest firms.
export function Footprint() {
  return (
    <section className="step" id="footprint">
      <header className="w4-opener">
        <span aria-hidden="true" className="w4-opener-num">4</span>
        <div>
          <h2>Without the biggest firms</h2>
          <p>
            Take out the largest filers, Amazon above all, and the metro groups start to follow Census regions; the job clusters shift but hold.
          </p>
        </div>
      </header>
      <div className="w4-two w4-intro">
        <div>
          <p className="sub">
            The ten largest filers file 19.1% of the filings in the 40
            metros, and the five largest
            {" "}
            <GlossTerm id="w4-term-footprint-placing" word="placing firms">
              Companies that hire foreign workers and send them to work at client companies, such as outsourcing and IT staffing firms.
            </GlossTerm>
            {" "}
            5.6%.
          </p>
        </div>
        <div>
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span>
              <b>What to notice</b>
              {" "}
              Without the ten largest filers, the metro groups match Census regions at
              {" "}
              <GlossTerm id="w4-term-footprint-ami" word="AMI">
                Adjusted mutual information: how closely two ways of grouping the same items agree. 0 is what chance gives, 1 is a perfect match.
              </GlossTerm>
              {" "}
              0.13, against 0.06 for the full network: the national employers hide the regional pattern.
            </span>
          </div>
        </div>
      </div>
      <div className="rx-fig-row">
        <div className="plot">
          <h3>How much do the groups change?</h3>
          <p className="axis-note">
            NMI between the groups after a removal and the full network's
            groups: 1 means unchanged. Metros on the left, jobs on the
            right.
          </p>
          <div className="chart-host jobs-nmi" id="chart-footprint-nmi"></div>
        </div>
        <div className="plot">
          <h3>Do the metro groups follow Census regions?</h3>
          <p className="axis-note">
            AMI between the metro groups and the four Census regions.
            Orange bars remove named firms, grey bars random firms with the
            same share of filings (mean of 50, whisker one standard
            deviation). The dashed line is the full network.
          </p>
          <div className="chart-host jobs-nmi" id="chart-footprint-region"></div>
        </div>
      </div>
      <Drawers variant="foot">
        <Drawer label="Background">
          <p>
            A company that files everywhere links every pair of metros and jobs, so its footprint could be all the structure there is.
          </p>
          <p>
            The five largest placing firms are Tata Consultancy Services, Cognizant, Infosys, HCL and Compunnel. The ten largest filers are Amazon, Cognizant, Google, Microsoft, EY, Meta, Deloitte, Apple, Tata Consultancy Services and Infosys.
          </p>
        </Drawer>
        <Drawer label="Method">
          <p>
            We removed each set, reran 100
            {" "}
            <GlossTerm id="w4-term-footprint-louvain" word="Louvain">
              A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get.
            </GlossTerm>
            {" "}
            runs on the metro network and on the job network (weighted here by filings, since a count of companies barely moves when ten of 59,196 leave), and compared the groups with the full network's. Removing less data changes the groups too, so each removal sits beside 50 random cuts of companies that remove the same share of filings.
          </p>
        </Drawer>
        <Drawer label="More numbers">
          <p>
            The job clusters hold (
            <GlossTerm id="w4-term-footprint-nmi" word="NMI">
              Normalised mutual information: how much two groupings of the same items agree, from 0 (unrelated) to 1 (identical).
            </GlossTerm>
            {" "}
            0.90 and 0.81) but shift more than random cuts of the same volume do.
          </p>
          <p>
            Removing the five placing firms changes little: the groups stay close to the full network's (NMI 0.92, random cuts 0.85 ± 0.14), and the regional match rises only to 0.09, inside the range of random cuts (0.04 ± 0.05). Without the ten largest filers the clusters also sharpen, modularity rising from 0.27 to 0.30. Every version still beats its own rewired networks by a wide margin (z = 25 or more). Without the ten largest filers the regional match (AMI 0.13, p = 0.013) sits 4.6 standard deviations above random cuts (0.01 ± 0.03). Random cuts leave the job clusters closer to the full network's (0.96 and 0.88, 2.9 and 4.3 standard deviations away), so the biggest firms do shape which jobs cluster together.
          </p>
        </Drawer>
      </Drawers>
      {/* A · Which firm hides the regions? --------------------- */}
      <div className="card w4-card" id="footprint-which">
        <header className="w4-q">
          <span className="w4-num">4A</span>
          <div>
            <h2>Which firm hides the regions?</h2>
            <p className="w4-answer">Amazon.</p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <p className="sub">
              We removed each of the ten largest filers alone, then the top 1, 2, 3 … 20 filers in turn.
            </p>
          </div>
          <div>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                Amazon files 5.1% of the filings in the 40 metros. Without it
                alone, the metro groups match Census regions at AMI 0.14,
                more than the 0.13 without all ten.
              </span>
            </div>
          </div>
        </div>
        <div className="rx-fig-row">
          <div className="plot">
            <h3>The largest filers removed in turn</h3>
            <p className="axis-note">
              Orange: the metro groups’ match with Census regions as the largest filers leave. Grey band: random cuts of the same size. Hover a point for the firm.
            </p>
            <div className="chart-host jobs-nmi" id="chart-footprint-rank"></div>
          </div>
          <div className="plot">
            <h3>One firm out at a time</h3>
            <p className="axis-note">
              Orange: the match with one firm removed. Grey: random cuts of the same size. Dashed line: the full network.
            </p>
            <div className="chart-host jobs-nmi" id="chart-footprint-single"></div>
          </div>
        </div>
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>Each removal sits beside random cuts of companies that remove the same share of filings.</p>
            <p>50 random cuts for a single firm, 20 for each step of the sweep.</p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              Amazon's 0.14 sits 3.5 standard deviations above its random cuts. No other single firm pushes the match up beyond its random cuts: removing EY, Meta, Deloitte or Apple alone tips Louvain into a two-group split that ignores regions (AMI −0.005). Removed in rank order, the largest filers keep the match above random cuts at every step from one to twenty, but not smoothly: it dips to about 0.07 without the top 17 to 19, where several partitions compete, and peaks at 0.20 without the top 20. 2024 tells the same story more strongly. Its full network shows no regional match (AMI −0.005); without its ten largest filers the match is 0.22 (p = 0.001), against −0.01 ± 0.01 for random cuts.
            </p>
          </Drawer>
        </Drawers>
      </div>
    </section>
  );
}
