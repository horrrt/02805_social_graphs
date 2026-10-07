import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { GlossTerm } from "./GlossTerm";

// Section 3: who staffs whom.
export function Who() {
  return (
    <section className="step" id="who">
      <header className="w4-opener">
        <span aria-hidden="true" className="w4-opener-num">3</span>
        <div>
          <h2>Who staffs whom</h2>
          <p>
            One certified H-1B filing in five names a client company as the worksite. Against a random baseline clients group only weakly, yet a client that changes vendor stays inside its group far more often than chance.
          </p>
        </div>
      </header>
      <div className="card w4-card">
        <div className="w4-two">
          <div>
            <p className="sub">
              Counted once per link, the
              {" "}
              <GlossTerm id="w4-term-who-louvain" word="Louvain">
                A method that finds groups in a network by moving nodes between groups until the links inside groups are as dense as they can get. It starts from a random order, so two runs can differ.
              </GlossTerm>
              {" "}
              groups beat
              {" "}
              <GlossTerm id="w4-term-who-rewired" word="rewired networks">
                Random copies of the network in which every firm and client keeps its number of partners, but the partners are dealt out again at random.
              </GlossTerm>
              {" "}
              on
              {" "}
              <GlossTerm id="w4-term-who-modularity" word="modularity">
                How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
              </GlossTerm>
              {" "}
              (0.57 against 0.53) and match each client's main vendor (
              <GlossTerm id="w4-term-who-ami" word="AMI">
                Adjusted mutual information: how closely two ways of grouping the same clients agree, corrected for the agreement random labels would reach by chance.
              </GlossTerm>
              {" "}
              0.11) a little better than its industry (0.07).
            </p>
          </div>
          <div>
            <div className="w4-anatomy w4-anatomy--pair">
              <h3>Words in this section</h3>
              <dl>
                <div>
                  <dt>Vendor</dt>
                  <dd>
                    An outsourcing firm that files the H-1B and places the worker at another company, its client. Elsewhere the page also calls it a placing firm.
                  </dd>
                </div>
                <div>
                  <dt>Main vendor</dt>
                  <dd>The vendor that files most of a client's placements in a year.</dd>
                </div>
                <div>
                  <dt>Switch</dt>
                  <dd>
                    A year in which a client's main vendor changes, counted for clients with five or more filings in both years.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <div className="rx-fig-row">
          <figure className="w4-figure">
            <figcaption>
              <b>Weak groups, beyond chance</b>
              <span>
                Modularity against rewired networks that keep each firm's and client's number of partners; AMI with each client's main vendor and its industry.
              </span>
            </figcaption>
            <div className="w4-figure-body" data-strip="who-modularity"></div>
          </figure>
          <figure className="w4-figure">
            <figcaption>
              <b>One client, many vendors</b>
              <span>
                The client's largest staffing firms by filings in the year; link width is filings placed there. Pick a year or type any client.
              </span>
            </figcaption>
            <div className="w4-figure-body" data-strip="who-ego"></div>
          </figure>
        </div>
        <Drawers variant="foot">
          <Drawer label="Background">
            <p>
              Here the network links an outsourcing firm to each client company where it places workers, and a link weighs the filings between them.
            </p>
          </Drawer>
          <Drawer label="Method">
            <p>
              Louvain runs on the largest connected piece: 21,759 firms and clients, 41,212 links. The rewired networks keep every firm's and client's number of partners. The three questions below ask whether the groups behave like markets.
            </p>
          </Drawer>
        </Drawers>
      </div>
      <div className="card w4-card" id="who-q1">
        <header className="w4-q">
          <span className="w4-num">Start</span>
          <div>
            <h2>How many workers sit at a client?</h2>
            <p className="w4-answer">In 2025, 104,732 of the 537,796 certified filings (19.5%) mark a client site.</p>
          </div>
        </header>
        <p className="sub">
          A filing is a request to employ someone, not a hire. Every year from 2022 on, USCIS denied placing firms about twice the share of first-time petitions it denied direct employers.
        </p>
        <div className="rx-fig-row">
          <figure className="w4-figure">
            <figcaption>
              <b>The lottery funnel</b>
              <span>
                The March 2023 draw: registrations spent per approved petition, and the share of drawn tickets that became a petition, by kind of employer.
              </span>
            </figcaption>
            <div className="w4-vis-stack">
              <div className="w4-figure-body" data-strip="who-q1-funnel-registrations"></div>
              <div className="w4-figure-body" data-strip="who-q1-funnel-petitions"></div>
            </div>
          </figure>
          <figure className="w4-figure">
            <figcaption>
              <b>A filing, a client, a denial</b>
              <span>
                The orange bar is the share involving a client company; the dot is placing firms' USCIS denial rate, the dashed line direct employers'.
              </span>
            </figcaption>
            <div className="w4-vis-stack">
              <div className="w4-figure-body" data-strip="who-q1-split"></div>
              <div className="w4-figure-body" data-strip="who-q1-denial"></div>
            </div>
          </figure>
        </div>
        <Drawers variant="foot">
          <Drawer label="Method">
            <p>
              The worksites file lists every client a filing names; we leave out the 16% of client entries that name no company, such as "Home Address", and the 1,881 where a firm names itself. Counted that way, 101,763 filings (18.9%) name a client company: the worker is employed by one company and works at another, down from 21.9% in 2022.
            </p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              USCIS denied 2.7% of placing firms' first-time petitions against 1.2% for direct employers in 2022, and 3.4% against 2.0% from October 2025 to June 2026. The lottery shows the same split one step earlier. Each new H-1B worker starts as a registration that USCIS draws at random, and USCIS gave Bloomberg News every registration from the March 2023 draw after a FOIA lawsuit. Every petition that followed names its filing, so we can follow a ticket to its client. Direct employers sent 5.1 registrations per approved petition, placing firms 9.1, and firms with fewer than 20 filings 12.2; those small firms sent 53% of the 758,967 registrations. Most of the gap is drawn tickets nobody used. When USCIS drew a direct employer's registration, a petition followed 76% of the time; a placing firm's, 50%; a small firm's, 35%. That step carries 74% of the gap between placing and direct firms, and the draw itself 24%. Much of it comes from workers registered by several employers: 54% of registrations named one, and when USCIS drew one, a petition followed 23% of the time, against 81% for a worker registered once. 18,307 of the petitions lead to a client company. Citigroup received the most, 342 through 38 firms.
            </p>
          </Drawer>
        </Drawers>
      </div>
      {/* A · Does a client stay in its group? ------------------- */}
      <div className="card w4-card" id="who-switch">
        <header className="w4-q">
          <span className="w4-num">3A</span>
          <div>
            <h2>When a client changes its main vendor, does it stay in its group?</h2>
            <p className="w4-answer">Yes, nearly eight times as often as for a random vendor.</p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <p className="sub">A client's main vendor is the firm that files most placements there in a year.</p>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                Pooled over the three pairs of years, 26.5% of switches stay in the group against 3.2% ± 0.5% for random vendors (
                <GlossTerm id="w4-term-who-switch-z" word="z">How many standard deviations the real value sits from the random baseline’s mean.</GlossTerm>
                {" "}
                = 47).
              </span>
            </div>
            <Drawers variant="foot">
              <Drawer label="Background">
                <p>A switch is a year in which that firm changes.</p>
              </Drawer>
              <Drawer label="Method">
                <p>
                  We followed the clients with five or more filings in two consecutive years and found 1,261 switches of main vendor between 2022 and 2025. For each, we asked whether the new vendor sat in the client's Louvain group of the earlier year.
                </p>
                <p>
                  The baseline draws a new vendor at random, a large firm as often as its filings make it likely. The chart's grey bars are the baseline's mean over 1,000 draws.
                </p>
              </Drawer>
              <Drawer label="More numbers">
                <p>
                  One switch in four stays inside the client's group. Much of that is familiarity: 62% of new main vendors already placed someone at the client the year before.
                </p>
                <p>
                  A stricter baseline that draws only among the firms already at the client narrows the gap to 26.8% against 20.8% ± 0.7% (z = 9), a lift of 1.29 rather than 8.3.
                </p>
              </Drawer>
            </Drawers>
          </div>
          <div className="plot">
            <h3>Switches that stay inside the client's group</h3>
            <p className="axis-note">
              Share of switches whose new main vendor is in the client's group of the earlier year, for each pair of years. Grey bars are the baseline; whiskers span one standard deviation.
            </p>
            <div className="chart-host short" id="chart-who-switch"></div>
          </div>
        </div>
      </div>
      {/* B · Movers when weights are ignored ---------------------- */}
      <div className="card w4-card" id="who-movers">
        <header className="w4-q">
          <span className="w4-num">3B</span>
          <div>
            <h2>Which clients change group when filing counts are ignored?</h2>
            <p className="w4-answer">Two in three, but much of that is Louvain's own noise.</p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <p className="sub">
              We ran Louvain with links weighted by filings and with every link counting one, and called a client a mover when its group changed.
            </p>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                64.4% of clients move between the weighted and unweighted
                {" "}
                <GlossTerm id="w4-term-who-movers-partition" word="partitions">One split of every firm and client into groups, as a single Louvain run gives it.</GlossTerm>
                . Two runs of the same kind move fewer: a median 33.3% between two weighted seeds and 53.1% between two unweighted ones.
              </span>
            </div>
            <Drawers variant="foot">
              <Drawer label="Method">
                <p>
                  Two runs of the same kind with different
                  {" "}
                  <GlossTerm id="w4-term-who-movers-seeds" word="seeds">The random starting point of a Louvain run. Different seeds can give different groups.</GlossTerm>
                  {" "}
                  set the noise floor.
                </p>
                <p>
                  We matched each weighted group to the unweighted group it overlaps most, and called a client a mover when its matched group changed. All three bars use the same matching of groups.
                </p>
              </Drawer>
              <Drawer label="More numbers">
                <p>
                  The medians come from ten pairs of seeds each (ranges 26.8% to 39.3% and 49.4% to 55.9%). We expected the movers to be clients with several vendors, since only their filing counts can pull them one way or another. They are, but barely: 31.8% of movers have two or more vendors, against 26.8% of all clients. The largest movers are the largest clients: Citigroup sits with Tata Consultancy Services when filings count and with EY when they do not; Bank of America moves from Infosys' group to IBM's.
                </p>
              </Drawer>
              <Drawer label="Table: 15 largest movers">
                <table className="ego">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th style={{"textAlign":"right"}}>Filings</th>
                      <th style={{"textAlign":"right"}}>Vendors</th>
                      <th>Group, weighted</th>
                      <th>Group, unweighted</th>
                    </tr>
                  </thead>
                  <tbody id="who-movers-table"></tbody>
                </table>
                <p className="fineprint">A group is named after its largest firm.</p>
              </Drawer>
            </Drawers>
          </div>
          <div className="plot">
            <h3>Share of clients that change group</h3>
            <p className="axis-note">
              The first two bars compare two seeds of the same kind; the third compares the weighted partition with the unweighted one.
            </p>
            <div className="chart-host short" id="chart-who-movers"></div>
          </div>
        </div>
      </div>
      {/* C · Split loyalties ------------------------------------- */}
      <div className="card w4-card" id="who-overlap">
        <header className="w4-q">
          <span className="w4-num">3C</span>
          <div>
            <h2>Which clients sit in two groups at once?</h2>
            <p className="w4-answer">
              1,823 clients get a fifth or more of their filings from a second group, fewer than in rewired networks.
            </p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <p className="sub">
              A Louvain partition gives each client one group, but a client with several vendors can draw on firms from different groups.
            </p>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                The rewired networks give 2,154 ± 20 split clients (z = −16): real clients draw on fewer groups than chance.
              </span>
            </div>
            <Drawers variant="foot">
              <Drawer label="Background" />
              <Drawer label="Method">
                <p>
                  We counted clients whose second group supplies at least 20% of their filings, and did the same on 100 rewired networks in which every firm keeps its number of clients and every client keeps its filing counts, only attached to different firms. Louvain builds the groups from these filing counts, so it already tends to put a client with its heaviest vendors; and rewired networks split into different groups from the real one. Read the count as the groups following clients' main suppliers, not as a separate measure of loyalty.
                </p>
              </Drawer>
              <Drawer label="More numbers">
                <p>
                  The largest split clients are banks, insurers and manufacturers. USAA gets 44% of its filings from HCL's group and 26% from Tata Consultancy Services'; Stellantis 46% from L&amp;T Technology Services' group and 34% from Tata Consultancy Services'.
                </p>
              </Drawer>
              <Drawer label="Table: 15 largest split clients">
                <table className="ego">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th style={{"textAlign":"right"}}>Filings</th>
                      <th>First group</th>
                      <th>Second group</th>
                      <th>Main vendor</th>
                    </tr>
                  </thead>
                  <tbody id="who-overlap-table"></tbody>
                </table>
              </Drawer>
            </Drawers>
          </div>
          <div className="plot">
            <h3>Clients split between two groups</h3>
            <p className="axis-note">
              The count for the real network against the mean of 100 rewired networks; the whisker spans one standard deviation.
            </p>
            <div className="chart-host short" id="chart-who-overlap"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
