import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { TocItem } from "@/features/week04/frame/DeepShell";
import { Methods } from "@/features/week04/methods/Methods";
import { PlacePart } from "@/features/week04/place/Place";
import { StripPart } from "@/features/week04/strips/Strips";
import { GlossTerm } from "./GlossTerm";

// Deep dive topic: where the hiring is.
export function TopicWhere() {
  return (
    <details className="rx-topic" id="topic-where" name="w4-topic">
      <summary>Where the hiring is</summary>
      <div className="rx-topic-bar">
        <a className="rx-back" href="#cut">← Deep dive</a>
        <div>
          <h2 className="rx-topic-title">Where the hiring is</h2>
          <p className="rx-topic-holds">Section 1's metros, linked by the employers they share.</p>
        </div>
        <span className="rx-topic-count">7 boxes</span>
      </div>
      <nav aria-label="Boxes in this topic" className="rx-toc">
        <div className="rx-toc-col">
          <p className="rx-toc-head">Questions</p>
          <TocItem href="#place-backbone">Once the small links go, what's left of the map?</TocItem>
          {" "}
          <TocItem href="#place-longhaul">Do the same employers tie distant cities together?</TocItem>
          {" "}
          <TocItem href="#deeper-density">Where is the hiring densest? Filings per 1,000 jobs</TocItem>
        </div>
        <div className="rx-toc-col">
          <p className="rx-toc-head">The course's community methods, tried on the 40 metros</p>
          <TocItem href="#w4m-panel-gn">Does cutting the busiest links split the country?</TocItem>
          {" "}
          <TocItem href="#w4m-panel-mod">Are the three metro groups more than chance?</TocItem>
          {" "}
          <TocItem href="#w4m-panel-louvain">Where do the three metro groups come from?</TocItem>
          {" "}
          <TocItem href="#w4m-panel-overlap">Which metros belong to more than one group?</TocItem>
        </div>
      </nav>
      <details className="rx-panel" name="w4-panel-where" data-box="place-backbone">
        <summary>Once the small links go, what's left of the map?</summary>
        <div className="card w4-card" id="place-backbone">
          <header className="w4-q">
            <span className="w4-num">1</span>
            <div>
              <h2>Once the small links go, what's left of the map?</h2>
              <p className="w4-answer">Keep only links heavy for one of their metros and the map comes apart.</p>
            </div>
          </header>
          <p className="sub">
            The control sets the
            {" "}
            <GlossTerm id="w4-term-place-backbone-disparity" word="disparity-filter">
              A filter that keeps a link only when it carries an unusually large share of either metro’s total weight.
            </GlossTerm>
            {" "}
            α from Week 4.
          </p>
          <div className="rx-seg-row">
            <span className="rx-seg-label" id="place-alpha-label">Backbone α</span>
            <PlacePart part="alpha" />
          </div>
          <div className="plot">
            <h3>Backbone at this α</h3>
            <p className="axis-note">
              Each line is a link the filter keeps at the α set above, thicker
              when more filings share it.
            </p>
            <PlacePart part="backbone" />
          </div>
          <div className="plot" style={{"marginTop":"18px"}}>
            <h3>Giant component vs α</h3>
            <p className="axis-note">
              How many metros stay in the largest connected piece as the filter
              tightens. The dashed line marks where it snaps.
            </p>
            <PlacePart part="gc" />
          </div>
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span>
              <b>What to notice</b>
              {" "}
              <PlacePart part="snap" />
            </span>
          </div>
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>With every link the map is one blob. Cities are linked when they share an employer.</p>
              <p>
                Metros in grey have fallen out of the largest connected piece. Colours are section 1's three metro groups. Click a metro to select it.
              </p>
            </Drawer>
            <Drawer label="Method">
              <p className="sub">
                Two metros are linked when a company files in both; the weight adds up, over those companies, the smaller of its two filing counts. One weight threshold would keep the links among the big hubs and cut a mid-size metro's strongest tie, which is light next to New York and Dallas. The disparity filter keeps a link when it carries an unusually large share of either endpoint's weight at level α, the method the course used for the philosophers backbone.
              </p>
              <PlacePart part="alphaTable" />
              <p>
                <PlacePart part="choice" />
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-where" data-box="place-longhaul">
        <summary>Do the same employers tie distant cities together?</summary>
        <div className="card w4-card" id="place-longhaul">
          <header className="w4-q">
            <span className="w4-num">2</span>
            <div>
              <h2>Do the same employers tie distant cities together?</h2>
              <p className="w4-answer">Mostly not: a single company rarely carries a long link.</p>
            </div>
          </header>
          <p className="sub">
            The shortlist is the five firms that
            {" "}
            <GlossTerm id="w4-term-place-longhaul-place" word="place">The firm files for the worker, then sends them to work at a client company’s site.</GlossTerm>
            {" "}
            the most filings at
            client sites.
          </p>
          <div className="longhaul-stack">
            <div className="plot">
              <h3>Distance vs weight</h3>
              <p className="axis-note">
                Each point is a link in the backbone at α = 0.2, the default
                above; size grows with its weight.
              </p>
              <PlacePart part="longhaul" />
            </div>
            <div className="plot">
              <h3>One employer’s map</h3>
              <p className="axis-note">
                The backbone links (α = 0.2) this company leads: of all the
                companies filing in both cities, it adds the most to the
                link's weight.
              </p>
              <div className="select-row">
                <label htmlFor="place-employer">Employer</label>
                {" "}
                <PlacePart part="employer" />
              </div>
              <PlacePart part="arcs" />
            </div>
          </div>
          <div className="notice">
            <span className="ico">💡</span>
            {" "}
            <span>
              <b>What to notice</b>
              {" "}
              Of the 83 backbone links longer than 1,500 km, the shortlist
              leads 22 (27%); it leads 47 of the 97 shorter ones (48%).
            </span>
          </div>
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>
                The shortlist holds the five largest placing firms: Tata Consultancy Services, Cognizant, Infosys, HCL and Compunnel. The staffing section follows them to their clients.
              </p>
            </Drawer>
            <Drawer label="Method">
              <p>
                In the distance chart, a label names a company on its heaviest link over 1,500 km, for the five heaviest; hover any point for its own. The legend separates links led by the shortlist from links led by any other company; click a point to select a city.
              </p>
              <p>
                In the employer map, the list holds the six companies that lead the most links. Click a city to select it.
              </p>
            </Drawer>
            <Drawer label="More numbers">
              <p>
                Big direct employers lead the long links, Amazon above all. Distant metros are tied by many companies filing in both.
              </p>
              <p>
                Amazon leads the most long links (30), then Cognizant (17), EY (8) and Deloitte (7). The leading company carries a median 14% of a long link's weight, and only one long link, San Jose to Fayetteville (Walmart), has a company with half of it.
              </p>
            </Drawer>
          </Drawers>
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-where" data-box="deeper-density">
        <summary>Where is the hiring densest? Filings per 1,000 jobs</summary>
        <div className="card w4-card" id="deeper-density">
          <header className="w4-q">
            <span className="w4-num">3</span>
            <div>
              <h2>Where is the hiring densest? Filings per 1,000 jobs</h2>
              <p className="w4-answer">San Jose, at 42.9 filings per 1,000 jobs, against New York's 6.9.</p>
            </div>
          </header>
          <div className="w4-two">
            <div>
              <p className="sub">Section 1 counts filings.</p>
              <div className="notice">
                <span className="ico">💡</span>
                <span>
                  <b>What to notice</b>
                  {" "}
                  Nationally there are 4.5 filings per 1,000 jobs; San Jose files 42.9, nearly ten times that, while New York, the largest filer, sits at 6.9.
                </span>
              </div>
              <Drawers variant="foot">
                <Drawer label="Method">
                  <p>
                    Divide each metro's 2025 filings by its jobs in the Bureau of Labor Statistics' May 2025 employment survey (OEWS) and the map shifts: nationally it is 4.5 filings per 1,000 jobs.
                  </p>
                  <p>A filing is a request, not a hire, so a rate can run high.</p>
                </Drawer>
                <Drawer label="More numbers">
                  <p>
                    Among the 203 metros with 100,000 jobs or more, count and density rank alike (
                    <GlossTerm id="w4-term-deeper-density-spearman" word="Spearman">A rank correlation: how closely two orderings agree. Higher means closer.</GlossTerm>
                    {" "}
                    0.90), yet only 5 of the 10 largest by count stay in the top 10 by density: Dallas, San Jose, San Francisco, Seattle and Austin. For software developers alone the national rate is 139 filings per 1,000 jobs, and Fayetteville, Arkansas, the metro around Bentonville, reaches 896, 6.4 times the national share. New York files the most, 65,935; Trenton files 17.2 and Seattle 16.8 per 1,000 jobs.
                  </p>
                </Drawer>
              </Drawers>
            </div>
            <figure className="w4-figure">
              <figcaption>
                <b>Filings per 1,000 jobs</b>
                <span>
                  The ten densest metros with 100,000 jobs or more, and New York (outlined), which files the most. Dashed: the national rate.
                </span>
              </figcaption>
              <StripPart id="more:density" />
            </figure>
          </div>
        </div>
      </details>
      <details className="qa cut rx-panel" data-box="cut-methods" id="cut-methods" name="w4-panel-where">
        <summary>
          <span className="qa-cue">The course's four community methods, step by step on the 40 metros</span>
        </summary>
        <div className="qa-body cut-body" id="methods-body">
          <p className="w4-box-intro">
            The course's week 4 community methods, run on section 1's 40 metros. Each tab steps through one method, so you can watch where its groups come from and set them against
            {" "}
            <GlossTerm id="w4-term-cut-methods-louvain" word="Louvain's">
              A method that finds groups by moving each metro to the neighbouring group that raises modularity most, then merging the groups and repeating.
            </GlossTerm>
            .
          </p>
          <Methods />
        </div>
      </details>
    </details>
  );
}
