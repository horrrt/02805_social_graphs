import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { PlaceOpenerStrip } from "@/features/week04/frame/Findings";
import { PlacePart } from "@/features/week04/place/Place";
import { QuestionPart } from "@/features/week04/questions/Questions";
import { GlossTerm } from "./GlossTerm";

// Section 1: where the hiring is, the metro network and its backbone.
export function Place() {
  return (
    <section className="step" id="place">
      <header className="w4-opener">
        <span aria-hidden="true" className="w4-opener-num">1</span>
        <div>
          <h2>Where the hiring is</h2>
          <p>Cities group by who hires there, and no single link holds the map together.</p>
        </div>
      </header>
      <div className="w4-two w4-intro">
        <div>
          <p className="sub">
            The cities are the 40 metro areas with the most filings, 84.5% of
            the year's total.
            {" "}
            <GlossTerm id="w4-term-place-louvain" word="Louvain">
              A method that finds groups by moving each node into the neighbouring group that raises modularity most, then merging the groups and repeating until no move helps. It starts from a random order, so two runs can differ.
            </GlossTerm>
            {" "}
            splits them into three groups, and the split is weak
            but real:
            {" "}
            <GlossTerm id="w4-term-place-modularity" word="modularity">
              How much more of the link weight falls inside the groups than a random network with the same number of links per node would put there. Higher means sharper groups.
            </GlossTerm>
            {" "}
            0.049 against 0.013 for
            {" "}
            <GlossTerm id="w4-term-place-rewired" word="rewired networks">
              A random copy of the network in which every node keeps its number of partners, but the partners are dealt out again at random.
            </GlossTerm>
            {" "}
            (
            <GlossTerm id="w4-term-place-z" word="z">
              How many standard deviations the real value sits from the random baseline’s mean. Beyond about 2 either way is rare by chance.
            </GlossTerm>
            {" "}
            = 29).
          </p>
          <div className="w4-example">
            <svg aria-hidden="true" height="150" viewBox="0 0 250 150" width="250">
              <line className="w4-ex-edge" strokeWidth="2.4" x1="125" x2="52" y1="34" y2="112"></line>
              <line className="w4-ex-edge" strokeWidth="1.4" x1="125" x2="198" y1="34" y2="112"></line>
              <path className="w4-ex-link" d="M52 112 Q125 150 198 112" strokeDasharray="5 4" strokeWidth="2.2"></path>
              <rect className="w4-ex-company" height="26" rx="6" width="50" x="100" y="16"></rect>
              <text className="w4-ex-on-ink" x="125" y="33">Company</text>
              <circle className="w4-ex-node" cx="52" cy="112" r="13"></circle>
              <circle className="w4-ex-node" cx="198" cy="112" r="13"></circle>
              <text className="w4-ex-letter" x="52" y="116">A</text>
              <text className="w4-ex-letter" x="198" y="116">B</text>
              <text className="w4-ex-count" textAnchor="end" x="70" y="66">12 filings</text>
              <text className="w4-ex-count" textAnchor="start" x="180" y="66">5 filings</text>
              <text className="w4-ex-gain" x="125" y="146">link A–B gains 5</text>
            </svg>
            <p>
              <b>How two metros get linked</b>
              An example, not data. A company that files in both metros adds the smaller of its two filing counts to their link.
            </p>
          </div>
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>
                Louvain splits the 40 metros into seven large hubs led by New York and Dallas, eight tech hubs led by San Jose and San Francisco, and the other 25. The rewired networks keep each company's number of metros. The two questions below ask what the groups follow and where the network comes apart.
              </p>
            </Drawer>
            <Drawer label="Method">
              <p>
                Two metros are linked when the same company files in both; the link weighs, summed over those companies, the smaller of the company's two filing counts.
              </p>
            </Drawer>
          </Drawers>
        </div>
        <figure className="w4-figure">
          <figcaption>
            <b>Weak but real</b>
            <span>The groups against rewired networks in which each company keeps its number of metros.</span>
          </figcaption>
          <PlaceOpenerStrip />
        </figure>
      </div>
      <div className="draft-banner" id="place-draft-banner" hidden>
        <b>Scaffold.</b>
        {" "}
        Charts run on placeholder geography while the real numbers are
        readied.
      </div>
      {/* Start · Which cities hire the most? Is it one market? ------- */}
      <div className="card w4-card" id="place-start">
        <header className="w4-q">
          <span className="w4-num">Start</span>
          <div>
            <p className="rx-kicker">The opening questions, side by side, before 1A</p>
          </div>
        </header>
        <div className="rx-start-grid">
          <div id="place-rank">
            <header className="w4-q">
              <div>
                <h2>Which cities hire the most?</h2>
                <p className="w4-answer">San Jose asks for the most positions; New York has the most employers.</p>
              </div>
            </header>
            <p className="sub">
              Toggle the metric; click a bar or a bubble to inspect one city.
            </p>
            <PlacePart part="metric" />
            <div className="plot">
              <h3>Top cities</h3>
              <p className="axis-note">
                Ranked by the active metric. Click a bar to select that city
                everywhere on this page.
              </p>
              <PlacePart part="rank" />
            </div>
          </div>
          <div id="place-regions">
            <header className="w4-q">
              <div>
                <h2>Is it one national job market or several regional ones?</h2>
                <p className="w4-answer">Not regional markets: the two hub groups cross regions.</p>
              </div>
            </header>
            <PlacePart part="groups" />
          </div>
        </div>
        <div className="rx-start-notices">
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span>
              <b>What to notice</b>
              {" "}
              San Jose's 48,692 filings request 124,265 positions, and Google files one in ten of them.
              New York files more (65,935) from three times as many employers (12,711).
            </span>
          </div>
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span>
              <b>What to notice</b>
              {" "}
              The split is real but weak: modularity 0.049 against 0.013 for rewired networks; Louvain finds it in 65 of 100 runs.
            </span>
          </div>
        </div>
        <Drawers variant="foot">
          <Drawer label="Background">
            <p className="sub">A position is a seat an employer asks to fill, not a worker who arrived.</p>
            <p className="sub">
              Louvain splits the large hubs into two groups, which cross regions, and leaves the smaller metros as a third.
            </p>
            <p className="sub">
              The map shows the partition Louvain finds most often, and every number below is computed on it. The null rewires the company × metro network so each company and each metro keeps its number of partners, deals the filing counts back out at random, and projects it again:
            </p>
            <PlacePart part="nullStats" />
            <p className="sub">
              One group holds New York, Dallas, Atlanta, Chicago, Houston, Philadelphia and Charlotte. The other holds San Jose, San Francisco, Seattle, Los Angeles, San Diego, Austin, Boston and Washington. The 25 smaller metros form the third. Modularity is 0.049 against 0.013 for rewired networks that keep each company's number of metros (z = 29).
            </p>
            <p className="sub">
              Louvain finds the split shown in 65 of 100 runs; the other 35 find one other split, into two groups. 2024 gives that two-group split in all 100 runs, so it matches the split shown here at
              {" "}
              <GlossTerm id="w4-term-place-start-nmi" word="NMI">
                Normalized mutual information: how alike two groupings are, from 0 for unrelated to 1 for the same.
              </GlossTerm>
              {" "}
              0.64, against 1.00 between two 2025 runs.
            </p>
            <p className="sub">
              NMI with Census regions is 0.14 and with divisions 0.21. Infomap, which follows a random walk between metros instead of counting links, finds no split at all: one module holds all 40.
            </p>
          </Drawer>
          <Drawer label="Method">
            <p>A filing counts once in each metro it names, with at most the positions it requests.</p>
          </Drawer>
          <Drawer label="More numbers">
            <p>
              Census regions and divisions match it no better than shuffled labels (
              <GlossTerm id="w4-term-place-start-p" word="p">
                The share of shuffled labellings that match at least as well as the real one. A small value means the match is unlikely to be chance.
              </GlossTerm>
              {" "}
              = 0.10 and 0.11).
            </p>
            <p>
              In Seattle one company, Amazon, files 31%. Positions reward a few firms asking for many seats; employer counts reward a broad market.
            </p>
            <p>
              San Jose averages 2.6 positions per filing, New York 1.5. New York's largest filer, EY, has under 4%.
            </p>
          </Drawer>
          <Drawer label="Maps: groups and Census regions">
            <p className="sub">Toggle Louvain communities against Census regions on the same map.</p>
            <PlacePart part="region" />
            <PlacePart part="legend" />
            <div className="plot" style={{"marginTop":"18px"}}>
              <h3>On the map</h3>
              <p className="axis-note">
                The 48 contiguous states; none of the 40 metros lies outside
                them. Bubbles are sized by requested positions; colour and
                opacity follow the active metric. Each metro sits at its
                first-named city. Click a bubble to select it.
              </p>
              <PlacePart part="cityMap" />
            </div>
            <div className="plot">
              <h3>Same cities, two labelings</h3>
              <p className="axis-note">
                The same map, coloured by the active labelling. Communities are
                named after their two largest metros. Click a city to select
                it.
              </p>
              <PlacePart part="regionMap" />
            </div>
          </Drawer>
        </Drawers>
      </div>
      {/* A · Who hires, not where --------------------------------- */}
      <div className="card w4-card" id="place-who">
        <header className="w4-q">
          <span className="w4-num">1A</span>
          <div>
            <h2>Do cities group by who hires there instead of by region?</h2>
            <p className="w4-answer">By who hires.</p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <p className="sub">
              The groups follow how much of a city's hiring runs through consulting and IT-services firms.
            </p>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                The IT-services share matches the groups at AMI 0.17 (p = 0.002)
                and the
                {" "}
                <GlossTerm id="w4-term-place-who-placed" word="placed share">
                  The share of a metro’s filings that put the worker at a client company instead of the employer’s own site.
                </GlossTerm>
                {" "}
                at 0.12 (p = 0.012); Census regions and divisions do no better than chance.
              </span>
            </div>
            <Drawers variant="foot">
              <Drawer label="Method">
                <p>
                  We gave each metro four labels: its Census region, its Census division, the third it falls in by the share of its filings that place a worker at a client, and the third it falls in by the share filed by professional and technical services firms (NAICS 54, the sector of IT consultancies). Thirds, because 35 of the 40 metros have that sector as their largest, so "largest sector" says almost nothing. AMI corrects for the number of labels, so four regions and three thirds compare fairly.
                </p>
                <p>
                  AMI for each labelling of the 40 metros; the p-value is the share of 1,000 shuffles of that labelling that match at least as well.
                </p>
              </Drawer>
              <Drawer label="More numbers">
                <p>The match is modest: most of what makes two metros alike stays unexplained.</p>
                <p>
                  Seven of the eight tech-hub metros sit in the lowest third by placed share: there, companies mostly hire for themselves. In the New York–Dallas group the median metro places 27% of its filings at a client and files 60% through IT-services firms.
                </p>
                <p>
                  Census regions reach 0.06 (p = 0.11) and divisions 0.06 (p = 0.08), no better than chance.
                </p>
              </Drawer>
            </Drawers>
          </div>
          <div className="plot">
            <h3>How well each labelling matches the Louvain groups</h3>
            <p className="axis-note">
              Each bar is the
              {" "}
              <GlossTerm id="w4-term-place-who-ami" word="AMI">
                Adjusted mutual information: how alike two groupings are, corrected for chance. 0 means no better than labels dealt at random, 1 means the same grouping.
              </GlossTerm>
              {" "}
              between
              the Louvain groups and one labelling.
              Orange bars describe who hires, grey bars where the city is.
            </p>
            <QuestionPart part="whereWho" />
          </div>
        </div>
      </div>
      {/* B · Where the backbone breaks ------------------------------- */}
      <div className="card w4-card" id="place-break">
        <header className="w4-q">
          <span className="w4-num">1B</span>
          <div>
            <h2>Where does the backbone break, and whose links hold it?</h2>
            <p className="w4-answer">Nowhere in one place: metros drop off one or two at a time.</p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <p className="sub">
              We removed the links one by one, least significant
              first by
              {" "}
              <GlossTerm id="w4-term-place-alpha" word="α">
                The disparity filter's threshold. The filter keeps a link only when its weight is larger than chance would give, judged against each metro's own total, and α is the chance it allows. A lower α keeps fewer links. The links that survive form the backbone.
              </GlossTerm>
              , and watched the largest piece after each removal.
            </p>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                Of the 16 links whose removal cuts a metro loose, the five largest
                {" "}
                <GlossTerm id="w4-term-place-break-placing" word="placing firms">Companies that file for workers and then place them at a client company’s site.</GlossTerm>
                {" "}
                lead 5 (31%), no more than their share of the whole
                {" "}
                <GlossTerm id="w4-term-place-break-backbone" word="backbone">
                  The links the disparity filter keeps because they carry more weight than chance would give.
                </GlossTerm>
                {" "}
                (38%, p = 0.37).
              </span>
            </div>
            <Drawers variant="foot">
              <Drawer label="Background">
                <p>
                  Every pair of the 40 metros shares some employer, so the full network is one hairball of 780 links.
                </p>
              </Drawer>
              <Drawer label="Method">
                <p>
                  The disparity filter keeps a link when it carries an unusually large share of either metro's total weight; α is the test's threshold, and a smaller α keeps fewer links.
                </p>
                <p>
                  Each step is one or more links removed. The shaded band is the range from α = 0.1 to 0.05 where the five-value sweep saw the drop.
                </p>
              </Drawer>
              <Drawer label="More numbers">
                <p>
                  The big outsourcing firms hold no more of the links that cut metros loose than of any others.
                </p>
                <p>
                  The other eleven are led by Amazon (three), Intel, Deloitte, Capital One, JPMorgan Chase, Citigroup, FedEx, Fidelity Investments and the University of Maryland.
                </p>
                <p>
                  The first metro falls off at α = 0.136. Tried at five values, the largest piece of the map fell from 32 metros at α = 0.1 to 18 at α = 0.05, which looks like one snap. The fall from 32 to 18 is 14 separate links, each peeling one metro away.
                </p>
                <p>
                  The five placing firms lead 69 of the 180 links in the whole backbone at α = 0.2 (38%), so their 5 of the 16 links that cut a metro loose is no more than their share (p = 0.37).
                </p>
                <p>
                  No single removal cuts off more than two metros: Dallas–Durham at α = 0.041 takes Durham and Raleigh with it, and New York–Seattle at 0.023 splits the last five metros three and two.
                </p>
              </Drawer>
              <Drawer label="Table: 14 links that peel metros off">
                <QuestionPart part="whereBreakLinks" />
              </Drawer>
            </Drawers>
          </div>
          <div className="plot">
            <h3>Metros in the largest piece as the filter tightens</h3>
            <p className="axis-note">
              Read right to left: as α
              falls, links go and metros drop out of the largest connected
              piece.
            </p>
            <QuestionPart part="whereBreak" />
          </div>
        </div>
      </div>
    </section>
  );
}
