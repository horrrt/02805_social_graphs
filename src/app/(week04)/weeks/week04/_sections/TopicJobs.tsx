import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { GlossTerm } from "./GlossTerm";

// Deep dive topic: jobs and skills.
export function TopicJobs() {
  return (
    <details className="rx-topic" id="topic-jobs" name="w4-topic">
      <summary>Jobs and skills</summary>
      <div className="rx-topic-bar">
        <a className="rx-back" href="#cut">← Deep dive</a>
        <div>
          <h2 className="rx-topic-title">Jobs and skills</h2>
          <p className="rx-topic-holds">Occupations, linked by the companies that hire for both.</p>
        </div>
        <span className="rx-topic-count"></span>
      </div>
      <nav aria-label="Boxes in this topic" className="rx-toc">
        <a className="rx-toc-item" href="#jobs-bridges">Which jobs belong to two clusters?</a>
        {" "}
        <a className="rx-toc-item" href="#jobs-groups">Do the clusters follow official job groups?</a>
        {" "}
        <a className="rx-toc-item" href="#cut-skills" data-target="cut-skills-direct">Do occupations the same companies hire together also need similar skills?</a>
        {" "}
        <a className="rx-toc-item" href="#cut-skills" data-target="cut-skills-cluster">Does that agreement hold for whole hiring clusters, not just direct ties?</a>
        {" "}
        <a className="rx-toc-item" href="#cut-skills" data-target="cut-skills-radar">How do two occupations' day-to-day skills actually compare?</a>
        {" "}
        <a className="rx-toc-item" href="#cut-pagerank" data-target="cut-pagerank-explore">Change the damping factor: does the ranking move?</a>
        {" "}
        <a className="rx-toc-item" href="#cut-pagerank" data-target="cut-pagerank-iteration">Stepped one round at a time, how fast does the ranking settle?</a>
      </nav>
      <details className="rx-panel" name="w4-panel-jobs" data-box="jobs-bridges">
        <summary>Which jobs belong to two clusters?</summary>
        <div className="card jobs-card w4-card" id="jobs-bridges">
          <header className="w4-q">
            <span className="w4-num">1</span>
            <div>
              <h2>Which jobs belong to two clusters?</h2>
              <p className="w4-answer">
                None clearly: only
                {" "}
                <span data-jobs="bridges-pass">…</span>
                {" "}
                of
                {" "}
                <span data-jobs="bridges-tested">…</span>
                {" "}
                pass, fewer than the
                {" "}
                <span data-jobs="bridges-chance">…</span>
                {" "}
                chance alone passes.
              </p>
            </div>
          </header>
          <p className="sub">
            A ringed node would mark an occupation with more employer ties to a second cluster than any
            {" "}
            <GlossTerm id="w4-term-jobs-bridges-rewired" word="rewired network">
              A random copy of the network that keeps each company's number of occupations and each occupation's number of companies. It shows what chance alone produces.
            </GlossTerm>
            {" "}
            gives it; click a node to inspect it.
          </p>
          <figure className="w4-figure">
            <figcaption>
              <b>Occupations passing each rule</b>
              <span>
                Dot: the real network's count. Dashed mark: the mean over 100 rewired networks with the same cluster labels.
              </span>
            </figcaption>
            <div className="w4-figure-body" id="chart-job-bridge-rule"></div>
          </figure>
          <div className="jobs-grid jobs-network-grid">
            <div className="plot">
              <h3>Occupation network</h3>
              <div className="w4-figure-body" id="chart-job-network"></div>
            </div>
            <aside className="panel jobs-inspector" id="jobs-node-inspector">
              <h2>Bridge jobs</h2>
              <p>Ringed occupations pass the second-cluster test.</p>
              <div className="jobs-bridge-list" id="jobs-bridge-list"></div>
            </aside>
          </div>
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>
                Colours are
                {" "}
                <GlossTerm id="w4-term-jobs-bridges-louvain" word="Louvain">
                  A standard method that splits a network into groups whose members link more to each other than to the rest.
                </GlossTerm>
                {" "}
                clusters in the full co-hiring network, named after their largest occupation.
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-jobs" data-box="jobs-groups">
        <summary>Do the clusters follow official job groups?</summary>
        <div className="card jobs-card w4-card" id="jobs-groups">
          <header className="w4-q">
            <span className="w4-num">2</span>
            <div>
              <h2>Do the clusters follow official job groups?</h2>
              <p className="w4-answer">
                Only in part:
                {" "}
                <GlossTerm id="w4-term-jobs-groups-nmi" word="NMI">
                  Normalized mutual information: a score for how alike two groupings are, 1 when they match exactly and 0 when they are unrelated.
                </GlossTerm>
                {" "}
                <strong data-jobs="nmi">…</strong>
                {" "}
                against
                {" "}
                <strong data-jobs="shuffled">…</strong>
                {" "}
                for shuffled labels.
              </p>
            </div>
          </header>
          <p className="sub">
            We compare the official groups with the clusters found from hiring
            patterns.
          </p>
          <div className="jobs-grid jobs-groups-grid">
            <div className="plot">
              <h3>What each hiring cluster holds, by official group</h3>
              <p className="axis-note">
                Every occupation in the four largest clusters, 406 in all,
                split by its official major group: the three largest named,
                the rest grey.
              </p>
              <div className="w4-figure-body" id="chart-job-groups"></div>
            </div>
            <div className="plot">
              <h3>How closely the clusters match the official groups</h3>
              <p className="axis-note">
                Orange: the hiring clusters. Ring: Infomap's clusters. Grey: the official labels shuffled 100 times over the same clusters, up to their highest score.
              </p>
              <div className="w4-figure-body" id="chart-job-nmi"></div>
            </div>
          </div>
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span>
              <b>What to notice</b>
              {" "}
              The software cluster also holds engineers, accountants
              and managers: companies hire across the official groups.
            </span>
          </div>
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>
                The government groups occupations by their first two
                {" "}
                <GlossTerm id="w4-term-jobs-soc" word="SOC">
                  The Standard Occupational Classification, the federal list of occupation codes. Its first two digits name a major group, such as 15 for computer and mathematical occupations.
                </GlossTerm>
                {" "}
                digits.
              </p>
              <p>Normalised mutual information runs from 0 (unrelated) to 1 (the same groups).</p>
            </Drawer>
            <Drawer label="Method">
              <p className="sub">
                We keep certified H-1B filings and identify companies by tax number, as in the other sections. A link counts the companies that filed for both occupations. Filings still on 2010 codes (
                <span data-jobs="legacy">…</span>
                ) move to their 2018 successors through O*NET's 2010-to-2019 crosswalk. Louvain runs 100 times on the full projection and the best modularity run is kept; the runs agree at a median NMI of
                {" "}
                <span data-jobs="runs-nmi">…</span>
                . The null rewires the company × occupation network
                {" "}
                <span data-jobs="null-runs">…</span>
                {" "}
                times, keeping each company's number of occupations and each occupation's number of companies, and projects it again; real and rewired networks are scored on their largest connected piece (z =
                {" "}
                <span data-jobs="null-z">…</span>
                ). An occupation's second cluster is the one its employer ties exceed most over the expectation modularity uses (its strength times the cluster's, over twice the total weight). A ratio above 1, our first rule, marks
                {" "}
                <span data-jobs="lift1">…</span>
                {" "}
                occupations, but the rewired networks mark
                {" "}
                <span data-jobs="lift1-chance">…</span>
                {" "}
                on average with the same cluster labels. So an occupation now counts only when its ratio beats its own ratio in every rewired network. The disparity filter at α =
                {" "}
                <span data-jobs="bb-alpha">…</span>
                , as in the place section, keeps
                {" "}
                <span data-jobs="bb-links">…</span>
                {" "}
                of
                {" "}
                <span data-jobs="bb-total">…</span>
                {" "}
                links and
                {" "}
                <span data-jobs="bb-occ">…</span>
                {" "}
                occupations. Louvain on that backbone finds
                {" "}
                <span data-jobs="bb-clusters">…</span>
                {" "}
                clusters, which match the full network's at NMI
                {" "}
                <span data-jobs="bb-nmi">…</span>
                , against
                {" "}
                <span data-jobs="bb-base">…</span>
                {" "}
                between two runs on the full network: the clusters only partly survive the filter. NMI and AMI leave out occupations alone in a cluster and are compared with 100 shuffles of the major-group labels. The same method on 2024 gives clusters that match 2025 at NMI
                {" "}
                <span data-jobs="years">…</span>
                {" "}
                on the
                {" "}
                <span data-jobs="shared">…</span>
                {" "}
                occupations both years share. Infomap, the random-walk method, finds
                {" "}
                <span data-jobs="infomap">…</span>
                {" "}
                clusters of two or more occupations; they agree with Louvain's at NMI
                {" "}
                <span data-jobs="infomap-louvain">…</span>
                {" "}
                and match the official groups at
                {" "}
                <span data-jobs="infomap-soc">…</span>
                .
              </p>
              <p className="sub">
                The shuffled bars keep the clusters fixed and scramble only the official labels. AMI, a version of NMI adjusted for chance agreement, is
                {" "}
                <strong data-jobs="ami">…</strong>
                . Both scores cover the
                {" "}
                <span data-jobs="scored">…</span>
                {" "}
                occupations in clusters of two or more.
              </p>
            </Drawer>
            <Drawer label="More numbers">
              <p>The other two clusters of two or more hold two occupations each.</p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="qa cut rx-panel" data-box="cut-skills" id="cut-skills" name="w4-panel-jobs">
        <summary>
          <span className="qa-cue">Skills behind the jobs, from O*NET</span>
        </summary>
        <div className="qa-body cut-body" id="skills-body">
          <p aria-live="polite" className="status-line" id="skills-status">Loading the O*NET comparison…</p>
        </div>
      </details>
      <details className="qa cut rx-panel" data-box="cut-pagerank" id="cut-pagerank" name="w4-panel-jobs">
        <summary>
          <span className="qa-cue">PageRank on the jobs network, step by step</span>
        </summary>
        <div className="qa-body cut-body" id="pagerank-body">
          <p aria-live="polite" className="status-line" id="pagerank-status">Loading the PageRank explorable…</p>
        </div>
      </details>
    </details>
  );
}
