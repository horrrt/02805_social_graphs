import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { DeepPanel, TocItem } from "@/features/week04/frame/DeepShell";
import { JobsNum, JobsPart } from "@/features/week04/jobs/Jobs";
import { PageRank } from "@/features/week04/pagerank/PageRank";
import { Skills } from "@/features/week04/skills/Skills";
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
        <span className="rx-topic-count">7 boxes</span>
      </div>
      <nav aria-label="Boxes in this topic" className="rx-toc">
        <TocItem href="#jobs-bridges">Which jobs belong to two clusters?</TocItem>
        {" "}
        <TocItem href="#jobs-groups">Do the clusters follow official job groups?</TocItem>
        {" "}
        <TocItem href="#cut-skills" target="cut-skills-direct">Do occupations the same companies hire together also need similar skills?</TocItem>
        {" "}
        <TocItem href="#cut-skills" target="cut-skills-cluster">Does that agreement hold for whole hiring clusters, not just direct ties?</TocItem>
        {" "}
        <TocItem href="#cut-skills" target="cut-skills-radar">How do two occupations' day-to-day skills actually compare?</TocItem>
        {" "}
        <TocItem href="#cut-pagerank" target="cut-pagerank-explore">Change the damping factor: does the ranking move?</TocItem>
        {" "}
        <TocItem href="#cut-pagerank" target="cut-pagerank-iteration">Stepped one round at a time, how fast does the ranking settle?</TocItem>
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
                <JobsNum k="bridges-pass" />
                {" "}
                of
                {" "}
                <JobsNum k="bridges-tested" />
                {" "}
                pass, fewer than the
                {" "}
                <JobsNum k="bridges-chance" />
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
            <JobsPart part="bridgeRule" />
          </figure>
          <JobsPart part="grid" />
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
                <JobsNum k="nmi" tag="strong" />
                {" "}
                against
                {" "}
                <JobsNum k="shuffled" tag="strong" />
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
              <JobsPart part="groups" />
            </div>
            <div className="plot">
              <h3>How closely the clusters match the official groups</h3>
              <p className="axis-note">
                Orange: the hiring clusters. Ring: Infomap's clusters. Grey: the official labels shuffled 100 times over the same clusters, up to their highest score.
              </p>
              <JobsPart part="nmi" />
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
                <JobsNum k="legacy" />
                ) move to their 2018 successors through O*NET's 2010-to-2019 crosswalk. Louvain runs 100 times on the full projection and the best modularity run is kept; the runs agree at a median NMI of
                {" "}
                <JobsNum k="runs-nmi" />
                . The null rewires the company × occupation network
                {" "}
                <JobsNum k="null-runs" />
                {" "}
                times, keeping each company's number of occupations and each occupation's number of companies, and projects it again; real and rewired networks are scored on their largest connected piece (z =
                {" "}
                <JobsNum k="null-z" />
                ). An occupation's second cluster is the one its employer ties exceed most over the expectation modularity uses (its strength times the cluster's, over twice the total weight). A ratio above 1, our first rule, marks
                {" "}
                <JobsNum k="lift1" />
                {" "}
                occupations, but the rewired networks mark
                {" "}
                <JobsNum k="lift1-chance" />
                {" "}
                on average with the same cluster labels. So an occupation now counts only when its ratio beats its own ratio in every rewired network. The disparity filter at α =
                {" "}
                <JobsNum k="bb-alpha" />
                , as in the place section, keeps
                {" "}
                <JobsNum k="bb-links" />
                {" "}
                of
                {" "}
                <JobsNum k="bb-total" />
                {" "}
                links and
                {" "}
                <JobsNum k="bb-occ" />
                {" "}
                occupations. Louvain on that backbone finds
                {" "}
                <JobsNum k="bb-clusters" />
                {" "}
                clusters, which match the full network's at NMI
                {" "}
                <JobsNum k="bb-nmi" />
                , against
                {" "}
                <JobsNum k="bb-base" />
                {" "}
                between two runs on the full network: the clusters only partly survive the filter. NMI and AMI leave out occupations alone in a cluster and are compared with 100 shuffles of the major-group labels. The same method on 2024 gives clusters that match 2025 at NMI
                {" "}
                <JobsNum k="years" />
                {" "}
                on the
                {" "}
                <JobsNum k="shared" />
                {" "}
                occupations both years share. Infomap, the random-walk method, finds
                {" "}
                <JobsNum k="infomap" />
                {" "}
                clusters of two or more occupations; they agree with Louvain's at NMI
                {" "}
                <JobsNum k="infomap-louvain" />
                {" "}
                and match the official groups at
                {" "}
                <JobsNum k="infomap-soc" />
                .
              </p>
              <p className="sub">
                The shuffled bars keep the clusters fixed and scramble only the official labels. AMI, a version of NMI adjusted for chance agreement, is
                {" "}
                <JobsNum k="ami" tag="strong" />
                . Both scores cover the
                {" "}
                <JobsNum k="scored" />
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
      <DeepPanel className="qa cut rx-panel" box="cut-skills" id="cut-skills" name="w4-panel-jobs">
        <summary>
          <span className="qa-cue">Skills behind the jobs, from O*NET</span>
        </summary>
        <div className="qa-body cut-body" id="skills-body">
          <Skills />
        </div>
      </DeepPanel>
      <DeepPanel className="qa cut rx-panel" box="cut-pagerank" id="cut-pagerank" name="w4-panel-jobs">
        <summary>
          <span className="qa-cue">PageRank on the jobs network, step by step</span>
        </summary>
        <div className="qa-body cut-body" id="pagerank-body">
          <PageRank />
        </div>
      </DeepPanel>
    </details>
  );
}
