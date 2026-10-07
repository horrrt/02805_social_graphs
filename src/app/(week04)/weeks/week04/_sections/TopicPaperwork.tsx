import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { TocItem } from "@/features/week04/frame/DeepShell";
import { StripPart } from "@/features/week04/strips/Strips";
import { GlossTerm } from "./GlossTerm";

// Deep dive topic: paperwork, the lottery and green cards.
export function TopicPaperwork() {
  return (
    <details className="rx-topic" id="topic-paperwork" name="w4-topic">
      <summary>Paperwork, the lottery and green cards</summary>
      <div className="rx-topic-bar">
        <a className="rx-back" href="#cut">← Deep dive</a>
        <div>
          <h2 className="rx-topic-title">Paperwork, the lottery and green cards</h2>
          <p className="rx-topic-holds">What happens around a filing: the lawyers, the draw, USCIS and the green card after it.</p>
        </div>
        <span className="rx-topic-count">6 boxes</span>
      </div>
      <nav aria-label="Boxes in this topic" className="rx-toc">
        <TocItem href="#staffing-lawyers">Who files the paperwork?</TocItem>
        {" "}
        <TocItem href="#staffing-lottery">Do the firms that register the same workers staff the same clients?</TocItem>
        {" "}
        <TocItem href="#deeper-lottery">The lottery a year apart, and who receives the winners</TocItem>
        {" "}
        <TocItem href="#deeper-uscis">USCIS denials, year by year</TocItem>
        {" "}
        <TocItem href="#deeper-perm">Who keeps them? Green cards as the strong tie</TocItem>
        {" "}
        <TocItem href="#deeper-countries">Where are they from? A network of countries</TocItem>
      </nav>
      <details className="rx-panel" name="w4-panel-paperwork" data-box="staffing-lawyers">
        <summary>Who files the paperwork?</summary>
        <div className="card w4-card" id="staffing-lawyers">
          <header className="w4-q">
            <span className="w4-num">1</span>
            <div>
              <h2>Who files the paperwork?</h2>
              <p className="w4-answer">Three filings in four name an outside law firm, and five firms file 40% of those.</p>
            </div>
          </header>
          <div className="rx-fig-row">
            <figure className="w4-figure">
              <figcaption>
                <b>Who uses an outside law firm</b>
                <span>
                  Pooled over employers with 20 or more filings, 2025. Orange: outsourcing firms; the dashed line marks direct employers.
                </span>
              </figcaption>
              <StripPart id="staffing-lawyers-outsourcing" />
            </figure>
            <figure className="w4-figure">
              <figcaption>
                <b>The five largest law firms</b>
                <span>Certified H-1B filings each prepared in 2025.</span>
              </figcaption>
              <StripPart id="staffing-lawyers-top5" />
            </figure>
          </div>
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>
                Two law firms share filings when the same employer uses both: for each such employer, the smaller of its filings through either. That network has one giant hub, the case the
                {" "}
                <GlossTerm id="w4-term-staffing-lawyers-disparity" word="disparity filter">
                  A way to thin a network: it keeps a link only when its weight is larger than chance would give, judged against each firm's own total. α sets how strict that test is.
                </GlossTerm>
                {" "}
                was made for. A weight threshold of four shared filings keeps 771 links and spends 26% of them on the five largest firms. The disparity filter at α = 0.2 keeps 697 and spends 19%. It also keeps 115 small firms the threshold drops, such as one law office whose link to BBI Law Group is 3 of its 5 shared filings and 3 of BBI's 342. The threshold keeps the larger connected core, 395 firms against the filter's 351. Another 144 firms stay only because they form a pair linked to nobody else, where neither end can judge the link.
              </p>
              <p>
                <GlossTerm id="w4-term-staffing-lawyers-louvain" word="Louvain">
                  A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get.
                </GlossTerm>
                {" "}
                finds 34 groups at
                {" "}
                <GlossTerm id="w4-term-staffing-lawyers-modularity" word="modularity">
                  How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
                </GlossTerm>
                {" "}
                0.67, against 0.55 for rewired networks that keep each employer's and each law firm's number of partners (z = 12). The groups are barely regional (
                <GlossTerm id="w4-term-staffing-lawyers-nmi" word="NMI">
                  Normalised mutual information: how much two groupings of the same items agree, from 0 (unrelated) to 1 (identical).
                </GlossTerm>
                {" "}
                0.05 with Census regions, though above every shuffle), and the largest gather around shared employers. Google, Apple and Meta share Fragomen, Ogletree Deakins and Berry Appleman &amp; Leiden; Tata Consultancy, LTIMindtree and Salesforce share Usilaw, Goel &amp; Anderson and Chugh; Vialto, once PwC's law firm, serves Doordash and Databricks. The groups move from year to year: 2024 and 2025 agree at NMI 0.30 on the 1,041 law firms in both, against 0.88 between two runs of 2025.
              </p>
            </Drawer>
            <Drawer label="More numbers">
              <p>
                Fragomen alone files 78,531 for 3,129 employers. Outsourcing firms mostly do without: they file 52% of their applications with no outside firm and send 3% to the five largest, while direct employers send those five 48%. Per employer the averages are 2% and 30%, and none of 1,000 shuffles of which employer is which produced a gap that wide.
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-paperwork" data-box="staffing-lottery">
        <summary>Do the firms that register the same workers staff the same clients?</summary>
        <div className="card w4-card" id="staffing-lottery">
          <header className="w4-q">
            <span className="w4-num">2</span>
            <div>
              <h2>Do the firms that register the same workers staff the same clients?</h2>
              <p className="w4-answer">No. Firms that register the same workers are spread across the staffing groups.</p>
            </div>
          </header>
          <p className="sub">
            We took the 2,942 firms in the 2023 staffing network that sent 20 or more registrations to the March 2023 draw, and split them at the median share of workers another employer had also registered (78%).
          </p>
          <div className="rx-fig-row">
            <figure className="w4-figure">
              <figcaption>
                <b>Do high firms cluster?</b>
                <span>Share of high firms in a high firm's group. Dashed: the same with the labels shuffled.</span>
              </figcaption>
              <StripPart id="staffing-lottery-mates" />
            </figure>
            <figure className="w4-figure">
              <figcaption>
                <b>Agreement with the groups</b>
                <span>AMI between the high/low split and the staffing groups; the line spans 100 runs.</span>
              </figcaption>
              <StripPart id="staffing-lottery-ami" />
            </figure>
          </div>
          <Drawers variant="foot">
            <Drawer label="More numbers">
              <p>
                If the high firms clustered, a high firm's Louvain group would be mostly high firms. It is 51.2% high, against 50.0% when the labels are shuffled (p = 0.001 over 1,000 shuffles), and
                {" "}
                <GlossTerm id="w4-term-staffing-lottery-ami" word="AMI">
                  Adjusted mutual information: how closely two ways of grouping the same firms agree. 0 is what chance gives, 1 is a perfect match.
                </GlossTerm>
                {" "}
                with the groups is 0.004 over 100 runs. The March 2022 draw against the 2022 network gives 51.9% against 50.0%. The lottery data is USCIS's, obtained by Bloomberg News.
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-paperwork" data-box="deeper-lottery">
        <summary>The lottery a year apart, and who receives the winners</summary>
        <div className="card w4-card" id="deeper-lottery">
          <header className="w4-q">
            <span className="w4-num">3</span>
            <div>
              <h2>The lottery a year apart, and who receives the winners</h2>
              <p className="w4-answer">One approved petition took 5.2 registrations in 2022 and 8.5 in 2023.</p>
            </div>
          </header>
          <div className="w4-two">
            <div>
              <p className="sub">
                The ratio divides each year's registrations by its approved petitions, using USCIS's lottery files, obtained by Bloomberg News.
              </p>
            </div>
            <div>
              <div className="notice">
                <span className="ico">💡</span>
                <span>
                  <b>What to notice</b>
                  {" "}
                  The two draws this box can split by employer were the most crowded: registrations per selection rose from 2.2 in March 2020 to 4.0 in March 2023, then fell to 2.9 by March 2025 once each worker counted once.
                </span>
              </div>
            </div>
          </div>
          <div className="rx-fig-row">
            <figure className="w4-figure">
              <figcaption>
                <b>Every draw since 2020</b>
                <span>
                  Eligible registrations per selected registration; the figure under each date is the share of registrations for a worker registered more than once.
                </span>
              </figcaption>
              <div className="w4-figure-body" data-more="draws"></div>
            </figure>
            <figure className="w4-figure">
              <figcaption>
                <b>Registrations per approved petition</b>
                <span>Each line joins one kind of employer across the two draws Bloomberg's USCIS files cover.</span>
              </figcaption>
              <div className="w4-figure-body" data-more="lottery"></div>
            </figure>
          </div>
          <Drawers variant="foot">
            <Drawer label="Method">
              <p>From March 2024 USCIS drew by person, not by registration.</p>
              <p>
                The every-draw chart divides eligible by selected registrations from the historical table on USCIS's H-1B Electronic Registration Process page; its selections include later rounds, so its ratio is lower than the one per approved petition.
              </p>
            </Drawer>
            <Drawer label="More numbers">
              <p>
                Between the March 2022 and March 2023 draws,
                {" "}
                <GlossTerm id="w4-term-deeper-lottery-registrations" word="registrations">
                  Entries in the H-1B lottery. Each spring employers register the workers they want to sponsor, and USCIS draws at random from the entries.
                </GlossTerm>
                {" "}
                for a worker whom another employer had also registered rose from 35% to 54% of the total, and the share of drawn registrations that became a petition fell from 74% to 49%. The order held both years: direct employers needed the fewest (4.3, then 5.1), placing firms more (6.3, then 9.1). Of the March 2023 petitions, 20% lead to a client company, 66% of those through placing firms. Citigroup received 342, 94% through placing firms; Microsoft 150, 95%, with LTIMindtree supplying 47%; AT&amp;T 153, with Tech Mahindra supplying 41%. USCIS also denied 2.0% of the placing firms' lottery petitions against 1.1% of direct employers'.
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-paperwork" data-box="deeper-uscis">
        <summary>USCIS denials, year by year</summary>
        <div className="card w4-card" id="deeper-uscis">
          <header className="w4-q">
            <span className="w4-num">4</span>
            <div>
              <h2>USCIS denials, year by year</h2>
              <p className="w4-answer">
                Share of first-time H-1B petitions USCIS denied, for employers with 20 or more certified filings that year.
              </p>
            </div>
          </header>
          <p className="sub">
            From the
            {" "}
            <GlossTerm id="w4-term-deeper-uscis-hub" word="hub">
              USCIS's H-1B Employer Data Hub, which publishes approved and denied petitions per employer.
            </GlossTerm>
            's
            Tableau export; 2026 runs October to June. Placing firms put half or more of their filings at a client.
          </p>
          <table className="ego" data-rx-bars="1:0.04:placing,2:0.04:direct">
            <thead>
              <tr>
                <th>Year</th>
                <th style={{"textAlign":"right"}}>Placing firms</th>
                <th style={{"textAlign":"right"}}>Direct employers</th>
                <th style={{"textAlign":"right"}}>Placing firms counted</th>
                <th style={{"textAlign":"right"}}>Direct employers counted</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2022</td>
                <td style={{"textAlign":"right"}}>2.71%</td>
                <td style={{"textAlign":"right"}}>1.22%</td>
                <td style={{"textAlign":"right"}}>1,057</td>
                <td style={{"textAlign":"right"}}>2,288</td>
              </tr>
              <tr>
                <td>2023</td>
                <td style={{"textAlign":"right"}}>3.57%</td>
                <td style={{"textAlign":"right"}}>1.48%</td>
                <td style={{"textAlign":"right"}}>873</td>
                <td style={{"textAlign":"right"}}>2,080</td>
              </tr>
              <tr>
                <td>2024</td>
                <td style={{"textAlign":"right"}}>2.65%</td>
                <td style={{"textAlign":"right"}}>1.28%</td>
                <td style={{"textAlign":"right"}}>884</td>
                <td style={{"textAlign":"right"}}>2,403</td>
              </tr>
              <tr>
                <td>2025</td>
                <td style={{"textAlign":"right"}}>3.20%</td>
                <td style={{"textAlign":"right"}}>1.56%</td>
                <td style={{"textAlign":"right"}}>933</td>
                <td style={{"textAlign":"right"}}>2,466</td>
              </tr>
              <tr>
                <td>2026, Oct–Jun</td>
                <td style={{"textAlign":"right"}}>3.35%</td>
                <td style={{"textAlign":"right"}}>1.98%</td>
                <td style={{"textAlign":"right"}}>601</td>
                <td style={{"textAlign":"right"}}>1,863</td>
              </tr>
            </tbody>
          </table>
          <div className="notice">
            <span className="ico">💡</span>
            <span>
              <b>What to notice</b>
              {" "}
              Every year USCIS denied placing firms about twice the share it denied direct employers: 3.20% against 1.56% in 2025.
            </span>
          </div>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-paperwork" data-box="deeper-perm">
        <summary>Who keeps them? Green cards as the strong tie</summary>
        <div className="card w4-card" id="deeper-perm">
          <header className="w4-q">
            <span className="w4-num">5</span>
            <div>
              <h2>Who keeps them? Green cards as the strong tie</h2>
              <p className="w4-answer">
                An H-1B filing is a weak tie between employer and worker; a green-card filing (
                <GlossTerm id="w4-term-deeper-perm-perm" word="PERM">
                  The Department of Labor's permanent labor certification, the first step of most green cards through work. The employer sponsors the worker to stay.
                </GlossTerm>
                ) is a strong one.
              </p>
            </div>
          </header>
          <div className="w4-two">
            <div>
              <p className="sub">Only 65% of certified green cards come from an employer we can match to an H-1B filer.</p>
              <div className="notice">
                <span className="ico">💡</span>
                <span>
                  <b>What to notice</b>
                  {" "}
                  Among employers with 20 or more H-1B filings, the median files 13.2 green cards per 100 H-1B filings, yet Oracle files 95 while Amazon, with 22,509 H-1B filings, files almost none.
                </span>
              </div>
              <Drawers variant="foot">
                <Drawer label="Method" />
                <Drawer label="More numbers">
                  <p>
                    In 2025 the median employer with 20 or more H-1B filings filed 13.2 green cards per 100 of them, and the two counts rank employers only loosely alike (
                    <GlossTerm id="w4-term-deeper-perm-spearman" word="Spearman">
                      A rank correlation: 1 means two counts put employers in the same order, 0 means no relation.
                    </GlossTerm>
                    {" "}
                    0.50). As with degree and strength in the course, the exceptions carry the story: Oracle filed 95 green cards per 100 H-1B filings, Uber 64 and Salesforce 45, while Amazon (22,509 H-1B filings), Cognizant (11,085) and Google (8,657) filed almost none. Whether outsourcing firms sponsor fewer is
                    {" "}
                    <a href="#beyond-perm">section 5B</a>
                    . Clients sponsor their own staff too: Wells Fargo receives 1,547 H-1B filings from vendors, files 624 of its own and 167 green cards. Firms with more clients sponsor slightly more green cards, not fewer (Spearman 0.13).
                  </p>
                </Drawer>
              </Drawers>
            </div>
            <figure className="w4-figure">
              <figcaption>
                <b>Green cards per 100 H-1B filings</b>
                <span>
                  The six employers the text names, 2025; not a ranking. Dashed line: the median employer with 20 or more H-1B filings.
                </span>
              </figcaption>
              <div className="w4-figure-body" data-more="perm"></div>
            </figure>
          </div>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-paperwork" data-box="deeper-countries">
        <summary>Where are they from? A network of countries</summary>
        <div className="card w4-card" id="deeper-countries">
          <header className="w4-q">
            <span className="w4-num">6</span>
            <div>
              <h2>Where are they from? A network of countries</h2>
              <p className="w4-answer">Green-card hiring does not sort countries into regional blocs.</p>
            </div>
          </header>
          <div className="w4-two">
            <div>
              <p className="sub">
                We link two countries when the same employers file green cards for citizens of both, then ask whether those links form regional groups. The groups match world regions only weakly (AMI 0.10).
              </p>
            </div>
            <div>
              <div className="notice">
                <span className="ico">💡</span>
                <span>
                  <b>What to notice</b>
                  {" "}
                  Counted once, the country links group a little more than rewired copies (modularity 0.10 against 0.06); weighted by shared green cards they group less (0.26 against 0.40).
                </span>
              </div>
            </div>
          </div>
          <div className="rx-fig-row">
            <figure className="w4-figure">
              <figcaption>
                <b>Citizenship of 2023's green cards</b>
                <span>Share of certified green-card filings in the counted cells.</span>
              </figcaption>
              <div className="w4-figure-body" data-more="countries-top"></div>
            </figure>
            <figure className="w4-figure">
              <figcaption>
                <b>Do countries group?</b>
                <span>Modularity of the country network against rewired copies.</span>
              </figcaption>
              <div className="w4-figure-body" data-more="countries-modularity"></div>
            </figure>
          </div>
          <Drawers variant="foot">
            <Drawer label="Method">
              <p>
                A worker's citizenship is personal, so we read it only in memory and keep counts per country and employer, dropping every count under 10. That drops 96% of the cells and 43% of 2023's certified green-card filings, and no row about a single person is ever saved.
              </p>
            </Drawer>
            <Drawer label="More numbers">
              <p>
                India holds 52% of those filings and China 12%; among lottery registrations, India holds 77% in the March 2022 draw and 81% in March 2023. Link two countries by the green cards their citizens receive at the same employers and 55 countries remain. Louvain splits them into three groups. Counted once each, the links group a little more than rewired copies (modularity 0.10 against 0.06); weighted by shared green cards, they group less (0.26 against 0.40). India and China share one group with Canada, Belarus and Costa Rica, and India keeps 79% of its weight inside it. Among the ten largest sponsors, Google's green cards are the most varied, 4.7
                {" "}
                <GlossTerm id="w4-term-deeper-countries-effective" word="effective countries">
                  The number of equally sized countries that would give the same spread. More means more varied.
                </GlossTerm>
                {" "}
                with India at 30%, against Amazon's 3.0 at 67%. The third group gathers the Philippines, Kenya, Ghana, Zimbabwe, Ethiopia, Cameroon and Jamaica. Wayne Farms, a poultry company, filed 832 green cards in the counted cells, none for Indian citizens.
              </p>
              <p>
                The groups match world regions (AMI 0.10) and Week 3's migration communities (0.10) only weakly: green-card hiring does not sort countries into regional blocs.
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
    </details>
  );
}
