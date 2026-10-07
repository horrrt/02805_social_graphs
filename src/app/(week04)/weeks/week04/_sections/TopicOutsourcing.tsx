import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { Entities } from "@/features/week04/entities/Entities";
import { TocItem } from "@/features/week04/frame/DeepShell";
import { StaffingFigure, StaffingStat, StaffingStatsTable } from "@/features/week04/staffing/Staffing";
import { StripPart } from "@/features/week04/strips/Strips";
import { GlossTerm } from "./GlossTerm";

// Deep dive topic: outsourcing firms and their clients.
export function TopicOutsourcing() {
  return (
    <details className="rx-topic" id="topic-outsourcing" name="w4-topic">
      <summary>Outsourcing firms and their clients</summary>
      <div className="rx-topic-bar">
        <a className="rx-back" href="#cut">← Deep dive</a>
        <div>
          <h2 className="rx-topic-title">Outsourcing firms and their clients</h2>
          <p className="rx-topic-holds">Who places workers where, and how tightly.</p>
        </div>
        <span className="rx-topic-count">7 boxes</span>
      </div>
      <nav aria-label="Boxes in this topic" className="rx-toc">
        <TocItem href="#who-q2">Do clients group by industry or by the firm that staffs them?</TocItem>
        {" "}
        <TocItem href="#who-q3">Who relies on a single vendor?</TocItem>
        {" "}
        <TocItem href="#staffing-figure">The client network, year by year</TocItem>
        {" "}
        <TocItem href="#staffing-community-stats">With filing counts or without?</TocItem>
        {" "}
        <TocItem href="#staffing-ties">Strong ties, weak ties and pay</TocItem>
        {" "}
        <TocItem href="#deeper-strength">Strength against degree: where do the heavy links go?</TocItem>
        {" "}
        <TocItem href="#entity-communities">Every worker and company, grouped by what they do</TocItem>
      </nav>
      <details className="rx-panel" name="w4-panel-outsourcing" data-box="who-q2">
        <summary>Do clients group by industry or by the firm that staffs them?</summary>
        <div className="card w4-card">
          <div className="w4-q-block" id="who-q2">
            <header className="w4-q">
              <span className="w4-num">1</span>
              <div>
                <h2>Do clients group by industry or by the firm that staffs them?</h2>
                <p className="w4-answer">By both, weakly, and slightly more by vendor.</p>
              </div>
            </header>
            <div className="w4-two">
              <div>
                <figure className="w4-figure">
                  <figcaption>
                    <b>Groups against rewired networks</b>
                    <span>
                      <GlossTerm id="w4-term-topic-outsourcing-modularity" word="Modularity">
                        How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
                      </GlossTerm>
                      {" "}
                      of the real firm–client network, real against
                      {" "}
                      <GlossTerm id="w4-term-topic-outsourcing-rewired" word="rewired networks">
                        Random copies of the network in which every firm and client keeps its number of partners, but the partners are dealt out again at random.
                      </GlossTerm>
                      {" "}
                      that keep everyone's number of partners.
                    </span>
                  </figcaption>
                  <StripPart id="who-q2-modularity" />
                </figure>
              </div>
              <div>
                <figure className="w4-figure">
                  <figcaption>
                    <b>Match with vendor and industry</b>
                    <span>
                      <GlossTerm id="w4-term-topic-outsourcing-ami" word="AMI">
                        Adjusted mutual information: how closely two ways of grouping the same clients agree, corrected for the agreement random labels would reach by chance.
                      </GlossTerm>
                      {" "}
                      between the groups and each client's main vendor or industry, 0 = labels dealt at random. Filled: the main vendor; hollow: the industry.
                    </span>
                  </figcaption>
                  <StripPart id="who-q2-ami" />
                </figure>
              </div>
            </div>
            <Drawers variant="foot">
              <Drawer label="More numbers">
                <p>
                  With every firm–client link counted once, Louvain splits the network into about 65 groups, and the split beats rewired networks that keep everyone's number of partners (modularity 0.57 against 0.53). Among the 1,209 clients with a known industry and two or more firms, the groups match the main vendor at an adjusted mutual information (AMI) of 0.11 and the industry at 0.07; both beat shuffled labels.
                </p>
                <p>
                  AMI corrects NMI for chance, which matters here: these clients have 478 main vendors but only 17 industries. Counting filings pulls clients to their main vendor (AMI 0.48 against 0.07), but that split scores below rewired networks with the same filing counts (0.60 against 0.74), and the vendor's head start is built in: the vendor is a node in the same network, and 86% of these clients land in its group.
                </p>
              </Drawer>
            </Drawers>
          </div>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-outsourcing" data-box="who-q3">
        <summary>Who relies on a single vendor?</summary>
        <div className="card w4-card">
          <div className="w4-q-block" id="who-q3">
            <header className="w4-q">
              <span className="w4-num">2</span>
              <div>
                <h2>Who relies on a single vendor?</h2>
                <p className="w4-answer">Small clients.</p>
              </div>
            </header>
            <p className="sub">14,678 of the 18,900 clients use one firm, but they hold 22% of placed filings.</p>
            <div className="rx-fig-row">
              <figure className="w4-figure">
                <figcaption>
                  <b>One firm, many clients, few filings</b>
                  <span>
                    Clients that use a single firm, as a share of all clients and of all placed filings, 2025.
                  </span>
                </figcaption>
                <StripPart id="who-q3-concentration" />
              </figure>
              <figure className="w4-figure">
                <figcaption>
                  <b>How concentrated the big clients are</b>
                  <span>
                    The dot is the median share of a client's filings held by its largest vendor, among clients with 20 or more filings; the dashed line marks 90%.
                  </span>
                </figcaption>
                <StripPart id="who-q3-topshare" />
              </figure>
            </div>
            <Drawers variant="foot">
              <Drawer label="More numbers">
                <p>
                  Of the 629 clients with 20 or more filings, 69 get over 90% from one firm, and the median one gets 37% from its largest.
                </p>
                <p>
                  Citigroup, the largest client, uses 114 firms, and Tata Consultancy Services supplies a quarter. The eight largest firms supply only 27% of what the 20 largest clients receive.
                </p>
              </Drawer>
            </Drawers>
          </div>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-outsourcing" data-box="staffing-figure">
        <summary>The client network, year by year</summary>
        <div className="card w4-card">
          <header className="w4-q">
            <span className="w4-num">3</span>
            <div>
              <h2>The client network, year by year</h2>
            </div>
          </header>
          <StaffingFigure />
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>
                Only three sectors get a colour: finance and insurance, manufacturing and health care. Other known sectors are light grey, and the palest dots are clients with no sector on record.
              </p>
              <p>
                Band width is the number of placed filings from a firm to a client; the grey source gathers every other firm. Each client sits next to the named firm that supplies it most.
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-outsourcing" data-box="staffing-community-stats">
        <summary>With filing counts or without?</summary>
        <div className="card w4-card" id="staffing-community-stats">
          <header className="w4-q">
            <span className="w4-num">4</span>
            <div>
              <h2>With filing counts or without?</h2>
              <p className="w4-answer">
                Filing counts change the grouping: the two partitions share an
                {" "}
                <GlossTerm id="w4-term-staffing-community-stats-nmi" word="NMI">
                  Normalised mutual information: how much two groupings of the same clients agree, from unrelated to identical. Unlike AMI, it is not corrected for chance.
                </GlossTerm>
                {" "}
                of
                {" "}
                <StaffingStat k="cross" />
                , less than two seeds of either kind (
                <StaffingStat k="seeds" />
                {" "}
                weighted,
                {" "}
                <StaffingStat k="seeds-plain" />
                {" "}
                unweighted).
              </p>
            </div>
          </header>
          <div className="w4-two">
            <div>
              <p className="sub">
                Filing counts pull clients toward vendors: AMI with each client's main vendor rises from
                {" "}
                <StaffingStat k="vendor-plain" />
                {" "}
                to
                {" "}
                <StaffingStat k="vendor" />
                {" "}
                when filings count, while AMI with industry stays near
                {" "}
                <StaffingStat k="industry" />
                .
              </p>
              <p className="sub">
                Against rewired networks, without weights the real network wins (
                <StaffingStat k="mod-plain" />
                {" "}
                against
                {" "}
                <StaffingStat k="null-plain" />
                ); with weights it loses (
                <StaffingStat k="mod" />
                {" "}
                against
                {" "}
                <StaffingStat k="null" />
                ).
              </p>
              <StaffingStatsTable />
              <Drawers variant="foot">
                <Drawer label="Method">
                  <p>
                    We ran
                    {" "}
                    <GlossTerm id="w4-term-staffing-community-stats-louvain" word="Louvain">
                      A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get. It starts from a random order, so two runs can differ.
                    </GlossTerm>
                    {" "}
                    on the 2025 firm–client network 100 times each way: with links weighted by filings, and with every link counting one.
                  </p>
                  <p>
                    The
                    {" "}
                    <GlossTerm id="w4-term-staffing-community-stats-null" word="null model">
                      A random version of the network that keeps some of its features, here each node's number of partners, to show what chance alone would give.
                    </GlossTerm>
                    {" "}
                    rewires the network so every firm and client keeps its number of partners.
                  </p>
                  <p>
                    Infomap agrees with Louvain at NMI
                    {" "}
                    <StaffingStat k="im-louvain" />
                    . Finer partitions raise every NMI; AMI corrects for that, so it is the number to compare across methods.
                  </p>
                </Drawer>
                <Drawer label="More numbers">
                  <p>
                    Infomap, which follows a random walk instead of counting links, splits the same network into
                    {" "}
                    <StaffingStat k="im-modules" />
                    {" "}
                    small modules, most of them a firm with its clients. Like weighted Louvain, it follows the vendor far more than the industry (AMI
                    {" "}
                    <StaffingStat k="im-vendor" />
                    {" "}
                    against
                    {" "}
                    <StaffingStat k="im-industry" />
                    ).
                  </p>
                  <p>
                    The null also deals the filing counts back out at random. Rewiring breaks the network into a median of
                    {" "}
                    <StaffingStat k="pieces" />
                    {" "}
                    pieces, each a free community, so we score each rewired network on its largest piece, as we do the real one. The real network also loses when only the filing counts are shuffled on the real links (
                    <StaffingStat k="null-weights" />
                    ). The real counts leave
                    {" "}
                    <StaffingStat k="cross-share" />
                    {" "}
                    of filings on links between groups, against
                    {" "}
                    <StaffingStat k="cross-share-null" />
                    {" "}
                    with shuffled counts: clients that use several firms hold
                    {" "}
                    <StaffingStat k="multi-links" />
                    {" "}
                    of the links but
                    {" "}
                    <StaffingStat k="multi-filings" />
                    {" "}
                    of the filings, and only their links can cross, since a client with one firm sits in that firm's group.
                  </p>
                </Drawer>
              </Drawers>
            </div>
            <div>
              <figure className="w4-figure">
                <figcaption>
                  <b>Modularity with and without filing counts</b>
                  <span>
                    Dots: the real network. Grey: rewired networks, or the real links with their filing counts shuffled.
                  </span>
                </figcaption>
                <StripPart id="staffing-community-modularity" />
              </figure>
            </div>
          </div>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-outsourcing" data-box="staffing-ties">
        <summary>Strong ties, weak ties and pay</summary>
        <div className="card w4-card" id="staffing-ties">
          <header className="w4-q">
            <span className="w4-num">5</span>
            <div>
              <h2>Strong ties, weak ties and pay</h2>
              <p className="w4-answer">Here the pattern runs the other way, faintly.</p>
            </div>
          </header>
          <p className="sub">
            Among friends, the strongest ties sit inside tight groups where your close friends also know each other, and weak ties bridge the groups (Granovetter 1973; Onnela and colleagues confirmed it on millions of phone users in 2007).
          </p>
          <div className="rx-fig-row">
            <figure className="w4-figure">
              <figcaption>
                <b>Heavy links, looser neighbourhoods</b>
                <span>
                  <GlossTerm id="w4-term-staffing-ties-spearman" word="Spearman correlation">
                    A measure of whether two quantities rise together, computed on their ranks rather than their values.
                  </GlossTerm>
                  {" "}
                  between a link's filings and its
                  {" "}
                  <GlossTerm id="w4-term-staffing-ties-overlap" word="overlap">
                    Of the firm's other clients and the client's other firms, the share that are linked to each other. High overlap means a tight neighbourhood.
                  </GlossTerm>
                  , against 100 shuffles of the filing counts over the same links.
                </span>
              </figcaption>
              <StripPart id="staffing-ties-overlap" />
            </figure>
            <figure className="w4-figure">
              <figcaption>
                <b>Wage levels as filed</b>
                <span>
                  Share of each kind of employer's 2025 filings at each
                  {" "}
                  <GlossTerm id="w4-term-staffing-ties-wagelevel" word="prevailing-wage level">
                    A level set by the experience and skills the job asks for, from entry to fully competent. Each level carries a wage floor.
                  </GlossTerm>
                  .
                </span>
              </figcaption>
              <StripPart id="staffing-ties-wage" />
            </figure>
          </div>
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>
                A link's
                {" "}
                <b>overlap</b>
                {" "}
                measures the tightness: of the firm's other clients and the client's other firms, the share that are linked to each other.
              </p>
            </Drawer>
            <Drawer label="More numbers">
              <p>
                Over the 28,104 links where overlap is defined, filings and overlap correlate at Spearman -0.04; with the filing counts shuffled over the same links the correlation is 0.00 ± 0.01 (z = -6.3; 2024 gives z = -3.7). Links with one filing have a mean overlap of 0.065, links with 21 or more 0.034. Heavy links mostly belong to the largest firms, whose many clients rarely share other firms, so part of this is size. It agrees with the result above: the real filing counts put weight on links between groups. Each filing states one of four wage levels, from entry (I) to fully competent (IV). Averaged per client over the filings that reach it, the groups explain 13% of the variance in wage level; averaged per firm over all its filings, 3%. None of 1,000 shuffles of the group labels reached either. A client's filings come from the vendors that also decide its group, so part of the 13% is built in. Outsourcing firms file 66% of their applications at level II and 5% at level IV; direct employers file 35% and 22%. From January to June 2026, level IV rose to 17.7% of all filings from 13.6% a year earlier, and level I fell to 18.0% from 21.8%.
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-outsourcing" data-box="deeper-strength">
        <summary>Strength against degree: where do the heavy links go?</summary>
        <div className="card w4-card" id="deeper-strength">
          <header className="w4-q">
            <span className="w4-num">6</span>
            <div>
              <h2>Strength against degree: where do the heavy links go?</h2>
              <p className="w4-answer">Three of the top five are therapy and rehab clinics.</p>
            </div>
          </header>
          <div className="w4-two">
            <div>
              <p className="sub">
                The course compares a node's degree (how many partners) with its strength (how many filings over all its links), and finds the exceptions tell the story.
              </p>
              <div className="notice">
                <span className="ico">💡</span>
                <span>
                  <b>What to notice</b>
                  {" "}
                  Degree and strength rank firms almost alike (Spearman 0.91) but clients less so (0.75): the heaviest single ties go to therapy and rehab clinics, led by Ultimate Therapy with 133 filings from one firm.
                </span>
              </div>
              <Drawers variant="foot">
                <Drawer label="Background" />
                <Drawer label="More numbers">
                  <p>
                    In the 2025 firm–client network the two rank firms almost alike (Spearman 0.91) and clients less so (0.75). The clients with the most filings from a single firm are Ultimate Therapy, 133 filings from one firm; Sigma Rehab, 95; Post Rehab Services, 61; and Grady Memorial Hospital, 58.
                  </p>
                </Drawer>
              </Drawers>
            </div>
            <figure className="w4-figure">
              <figcaption>
                <b>The heaviest one-to-one ties</b>
                <span>The clients with the most filings from a single firm. Dark bars: health care.</span>
              </figcaption>
              <StripPart id="more:strength" />
            </figure>
          </div>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-outsourcing" data-box="entity-communities">
        <summary>Every worker and company, grouped by what they do</summary>
        <Entities />
      </details>
    </details>
  );
}
