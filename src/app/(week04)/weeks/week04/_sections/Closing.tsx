import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { StripPart } from "@/features/week04/strips/Strips";

// Closing.
export function Closing() {
  return (
    <section className="step" id="closing">
      <header className="w4-opener">
        <span aria-hidden="true" className="w4-opener-num">✓</span>
        <div>
          <h2>Closing</h2>
          <p>The groups in these networks are weak, but they are not noise.</p>
        </div>
      </header>
      <div className="card w4-card">
        <div className="w4-two">
          <div>
            <figure className="w4-figure">
              <figcaption>
                <b>Five weak groups, none of them noise</b>
                <span>
                  One row per section: the real network against its random baseline, on the same scale as the findings above the hero.
                </span>
              </figcaption>
              <StripPart id="closing-recap" />
            </figure>
          </div>
          <div className="w4-surprises">
            <h3>What surprised us</h3>
            <div className="w4-surprise">
              <p className="w4-surprise-before">
                The staffing groups looked weak in our first round, following industry about as much as vendor,
              </p>
              <p className="w4-surprise-after">yet 26.5% of vendor switches stay inside them, against 3.2% for a random vendor.</p>
              <StripPart id="closing-switches" />
            </div>
            <div className="w4-surprise">
              <p className="w4-surprise-before">And the backbone that seemed to snap between α = 0.1 and 0.05</p>
              <p className="w4-surprise-after">never snaps: no single link cuts off more than two metros.</p>
              <StripPart id="closing-backbone" />
            </div>
          </div>
        </div>
        <div className="notice">
          <span className="ico">!</span>
          {" "}
          <span>
            <b>One important limit</b>
            {" "}
            A shared employer link means the same companies file for both occupations or in both places. It does not show that the jobs are done together, that one caused the other, or that the network stands for workers who were hired.
          </span>
        </div>
        <details className="qa" id="closing-ai">
          <summary>
            <span className="qa-cue">AI use and how we checked it</span>
          </summary>
          <div className="qa-body">
            <p className="sub">
              AI coding assistants helped structure the page, wrote analysis and page code, drafted and revised text, and tested the visual presentation. The numbers come from the public sources listed in
              {" "}
              <a href="#evidence">Data and methods</a>
              .
            </p>
            <p className="sub">
              Each analysis step writes the numbers its section quotes to a JSON file the page reads. A schema check tests each file against the fields the page uses, a name-matching check tests the company-name rules against tax numbers, and the site tests fail when the numbers in a card or in this closing drift from the analysis output. We checked generated tables, comparisons, source scope, and the page behaviour against the local data before including a claim.
            </p>
          </div>
        </details>
        <p className="fineprint">
          Sources and the full analysis choices are recorded in
          {" "}
          <a href="#evidence">Data and methods</a>
          .
        </p>
        <Drawers variant="foot">
          <Drawer label="Background">
            <p>
              Cities group by who hires there, not by region. Outsourcing firms bundle jobs differently from direct employers of the same size. And when a client drops its main vendor, the new one comes from the same Louvain group more than eight times as often as a random vendor would, though mostly because clients return to firms they already use. Take out the ten largest filers, most of them national tech and consulting employers, and the metro groups start to follow Census regions; Amazon alone does all of that. Where outsourcing shows most is outside the networks: a filing that places a worker at a client has 3.6 times the odds of a lower wage level for the same occupation. Lawyers and green cards barely follow the staffing groups.
            </p>
          </Drawer>
        </Drawers>
      </div>
    </section>
  );
}
