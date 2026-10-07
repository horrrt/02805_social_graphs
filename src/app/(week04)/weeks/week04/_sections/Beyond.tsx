import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { QuestionPart } from "@/features/week04/questions/Questions";
import { StripPart } from "@/features/week04/strips/Strips";
import { GlossTerm } from "./GlossTerm";

// Section 5: beyond the three networks.
export function Beyond() {
  return (
    <section className="step" id="beyond">
      <header className="w4-opener">
        <span aria-hidden="true" className="w4-opener-num">5</span>
        <div>
          <h2>Beyond the three networks</h2>
          <p>
            The section 3 groups barely show in lawyers or green cards; the outsourcing firms stand out in the wage levels they file.
          </p>
        </div>
      </header>
      <div className="card w4-card">
        <div className="w4-two">
          <div>
            <p className="sub">
              The same filings name the law firm that prepared them, and the
              Department of Labor's green-card files name the employers that
              sponsor permanent residence. Three short questions follow the
              section 3 groups into those records.
            </p>
            <ol className="rx-answers">
              <li>
                <span className="w4-num">5A</span>
                <span>
                  <b>Law firms:</b>
                  {" "}
                  barely follow the section 3 groups.
                </span>
              </li>
              <li>
                <span className="w4-num">5B</span>
                <span>
                  <b>Green cards:</b>
                  {" "}
                  outsourcing firms sponsor fewer per H-1B filing, though the intervals overlap.
                </span>
              </li>
              <li>
                <span className="w4-num">5C</span>
                <span>
                  <b>Wage levels:</b>
                  {" "}
                  a placed filing has 3.6 times the odds of level I or II.
                </span>
              </li>
            </ol>
          </div>
          <figure className="w4-figure">
            <figcaption>
              <b>Three small answers</b>
              <span>
                Each real value against its baseline: law firms against rewired networks, green cards against direct employers' interval, wage odds against equal odds.
              </span>
            </figcaption>
            <StripPart id="beyond-summary" />
          </figure>
        </div>
      </div>
      <div className="card w4-card" id="beyond-law">
        <header className="w4-q">
          <span className="w4-num">5A</span>
          <div>
            <h2>Do immigration law firms split companies the way vendors do?</h2>
            <p className="w4-answer">
              Barely. Law firms group the companies along the section 3 lines only slightly more than chance.
            </p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                <GlossTerm id="w4-term-beyond-law-ami" word="AMI">
                  Adjusted mutual information: how closely two ways of grouping the same companies agree. 0 is what chance gives, 1 is a perfect match.
                </GlossTerm>
                {" "}
                0.037 against 0.000 ± 0.002 for
                {" "}
                <GlossTerm id="w4-term-beyond-law-rewired" word="rewired networks">
                  Random copies of the network in which every company and law firm keeps its number of partners, but the partners are dealt out again at random.
                </GlossTerm>
                : real
                (z = 15) and small.
                {" "}
                <GlossTerm id="w4-term-beyond-law-modularity" word="Modularity">
                  How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
                </GlossTerm>
                {" "}
                would mislead here.
              </span>
            </div>
            <Drawers variant="foot">
              <Drawer label="Method">
                <p>
                  75.6% of certified filings name a law firm; after name cleaning there are 4,479. We linked each firm that places workers in section 3's network to its law firms, weighted by filings, ran Louvain, and compared the groups with the section 3 groups for the 4,576 firms in both. Most companies use one law firm: 64% of filings come from such companies, which makes the network a set of stars.
                </p>
              </Drawer>
              <Drawer label="More numbers">
                <p>
                  The law-firm network scores 0.90, below the 0.93 of its rewired copies, because stars split into near-perfect groups whatever the wiring. Fragomen files the most (14,087 filings for 131 of these companies); EY Law files 10,274 for eight. The network of law firms themselves, across every employer, is in
                  {" "}
                  <a href="#staffing-lawyers">Who files the paperwork?</a>
                  {" "}
                  in the deep dive.
                </p>
              </Drawer>
            </Drawers>
          </div>
          <div className="plot">
            <h3>Agreement with the section 3 groups</h3>
            <p className="axis-note">
              AMI between the law-firm groups and the staffing groups, against
              50 rewired law-firm networks in which every company and law firm
              keeps its number of partners.
            </p>
            <QuestionPart part="beyondLaw" />
          </div>
        </div>
      </div>
      <div className="card w4-card" id="beyond-perm">
        <header className="w4-q">
          <span className="w4-num">5B</span>
          <div>
            <h2>Do outsourcing firms sponsor fewer green cards?</h2>
            <p className="w4-answer">Fewer per H-1B filing, but the staffing groups do not differ beyond chance.</p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <p className="sub">
              Here the
              outsourcing firms are the 817 companies that place 20 or more
              filings at client sites.
            </p>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                Outsourcing firms file 0.11 green cards per H-1B filing
                (95% interval 0.08 to 0.15), direct employers 0.18 (0.14 to
                0.21).
              </span>
            </div>
            <Drawers variant="foot">
              <Drawer label="Background">
                <p>
                  A green card through work starts with a
                  {" "}
                  <GlossTerm id="w4-term-beyond-perm" word="PERM">
                    The Department of Labor's permanent labor certification: the employer shows that no qualified US worker is available for the job. Most green cards through work start there.
                  </GlossTerm>
                  {" "}
                  filing.
                </p>
              </Drawer>
              <Drawer label="Method">
                <p>
                  For each company with 20 or more H-1B filings we divided its 2025 PERM filings by its H-1B filings, matching companies by name and tax number.
                </p>
                <p>Pooled over the companies in each bar, with a 95% bootstrap interval for the first two.</p>
              </Drawer>
              <Drawer label="More numbers">
                <p>
                  The gap shrinks to 0.13 against 0.17 when a firm counts as outsourcing only if most of its filings go to clients. Single companies swing these rates more than any group does: counting every case status, filings in the names of Amazon and Google fell from 3,638 and 1,618 in 2024 to 15 and 3 in 2025. Green cards per company and the strongest employer ties are in
                  {" "}
                  <a href="#deeper-perm">the deep dive</a>
                  .
                </p>
                <p>
                  Outsourcing firms file 0.11 green cards per H-1B filing (95% interval 0.08 to 0.15), direct employers 0.18 (0.14 to 0.21). Across the six largest staffing groups the rate runs from 0.03 in Cognizant's group, where Cognizant itself filed almost none, to 0.15, a spread that
                  {" "}
                  <GlossTerm id="w4-term-beyond-perm-shuffled" word="shuffled group labels">
                    We dealt the companies out to the groups again at random, many times, to see how big a spread chance alone produces.
                  </GlossTerm>
                  {" "}
                  match 28% of the time (p = 0.28).
                </p>
              </Drawer>
            </Drawers>
          </div>
          <div className="plot">
            <h3>Green-card filings per H-1B filing</h3>
            <p className="axis-note">
              The six on the right are the largest
              section 3 groups, named after their largest firm.
            </p>
            <QuestionPart part="beyondPerm" />
          </div>
        </div>
      </div>
      <div className="card w4-card" id="beyond-wage">
        <header className="w4-q">
          <span className="w4-num">5C</span>
          <div>
            <h2>Do outsourcing firms file at lower wage levels for the same job?</h2>
            <p className="w4-answer">
              Yes. For the same occupation, a placed filing has 3.6 times the odds of wage level I or II.
            </p>
          </div>
        </header>
        <div className="w4-two">
          <div>
            <p className="sub">
              Every filing states a
              {" "}
              <GlossTerm id="w4-term-beyond-wage-wagelevel" word="prevailing-wage level">
                A level set by the experience and skills the job asks for. Each level carries a wage floor.
              </GlossTerm>
              {" "}
              from I (entry) to IV (fully competent).
            </p>
            <div className="notice">
              <span className="ico">💡</span>
              {" "}
              <span>
                <b>What to notice</b>
                {" "}
                Within the 83 occupations with 20 or more filings of each kind, the
                {" "}
                <GlossTerm id="w4-term-beyond-mh" word="Mantel–Haenszel odds ratio">
                  An odds ratio pooled over those occupations, so each comparison sets placed against direct filings for the same job. 1 means the same odds.
                </GlossTerm>
                {" "}
                is 3.59, and 69 of the 83 point the same way.
              </span>
            </div>
            <Drawers variant="foot">
              <Drawer label="Background">
                <p>92% of filings give one.</p>
                <p>
                  A level describes the job as filed, not the worker, so this shows cheaper job descriptions, not lower pay for the same person.
                </p>
              </Drawer>
              <Drawer label="Method">
                <p>
                  We compared placed and direct filings within each occupation, so software developers are compared with software developers.
                </p>
              </Drawer>
              <Drawer label="More numbers">
                <p>
                  Overall, 79% of
                  {" "}
                  <GlossTerm id="w4-term-beyond-wage-placed" word="placed">
                    A placed filing sends the worker to a client company's site; a direct filing is for the employer's own site.
                  </GlossTerm>
                  {" "}
                  filings sit at level I or II against 58% of direct ones.
                </p>
                <p>
                  A few large firms file most placements, so the interval comes from resampling whole employers: 2.87 to 5.04. It is not one firm's doing: without the 5, 10 or 20 largest placing firms the ratio rises to 3.85, 4.28 and 4.94. Software developers: 87% against 52%. Offered wages follow: placed filings offer a median 1.00 times the prevailing wage in the five largest occupations, direct ones 1.00 to 1.08 times.
                </p>
              </Drawer>
            </Drawers>
          </div>
          <div className="plot">
            <h3>Share of filings at level I or II</h3>
            <p className="axis-note">
              The five occupations with the most filings. Orange bars are filings that place the worker at a client, blue bars filings for the employer's own site.
            </p>
            <QuestionPart part="beyondWage" />
          </div>
        </div>
      </div>
    </section>
  );
}
