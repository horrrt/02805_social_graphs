import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { TocItem } from "@/features/week04/frame/DeepShell";
import { Roles } from "@/features/week04/roles/Roles";
import { StripPart } from "@/features/week04/strips/Strips";
import { Years } from "@/features/week04/years/Years";
import { GlossTerm } from "./GlossTerm";

// Deep dive topic: five years.
export function TopicYears() {
  return (
    <details className="rx-topic" id="topic-years" name="w4-topic">
      <summary>Five years</summary>
      <div className="rx-topic-bar">
        <a className="rx-back" href="#cut">← Deep dive</a>
        <div>
          <h2 className="rx-topic-title">Five years</h2>
          <p className="rx-topic-holds">How the filings shift from 2022 to 2026.</p>
        </div>
        <span className="rx-topic-count">3 boxes</span>
      </div>
      <nav aria-label="Boxes in this topic" className="rx-toc">
        <TocItem href="#cut-years">Five years of filings</TocItem>
        {" "}
        <TocItem href="#cut-roles">Who filed, and for which roles?</TocItem>
        {" "}
        <TocItem href="#who-q4">Does it hold from year to year?</TocItem>
      </nav>
      <details className="qa cut rx-panel" data-box="cut-years" id="cut-years" name="w4-panel-years">
        <summary>
          <span className="qa-cue">Five years of filings, 2022 to 2026</span>
        </summary>
        <div className="qa-body cut-body" id="years-body">
          <Years />
        </div>
      </details>
      <details className="qa cut rx-panel" data-box="cut-roles" id="cut-roles" name="w4-panel-years">
        <summary>
          <span className="qa-cue">Who filed for which roles, 2022 to 2026</span>
        </summary>
        <div className="qa-body cut-body" id="roles-body">
          <p className="w4-box-intro">
            Certified filings, stacked by detailed occupation, SOC major group or employer, across the same five fiscal years as the box above. Switch the split, the scale or the window; 2026 covers October 2025 to June 2026 only.
          </p>
          <Roles />
        </div>
      </details>
      <details className="rx-panel" name="w4-panel-years" data-box="who-q4">
        <summary>Does it hold from year to year?</summary>
        <div className="card w4-card">
          <div className="w4-q-block" id="who-q4">
            <header className="w4-q">
              <span className="w4-num">3</span>
              <div>
                <h2>Does it hold from year to year?</h2>
                <p className="w4-answer">Only in part.</p>
              </div>
            </header>
            <p className="sub">
              Consecutive years agree less than two runs of the same year, so the groups carry over only in part.
            </p>
            <div className="rx-fig-row">
              <figure className="w4-figure">
                <figcaption>
                  <b>Consecutive years against the same year</b>
                  <span>
                    <GlossTerm id="w4-term-topic-years-nmi" word="NMI">
                      Normalised mutual information: how much two groupings of the same clients agree, from 0 (unrelated) to 1 (identical).
                    </GlossTerm>
                    {" "}
                    of the groups on shared clients. Dots: two consecutive years. Dashed: two runs of the same year.
                  </span>
                </figcaption>
                <StripPart id="who-q4-stability" />
              </figure>
              <figure className="w4-figure">
                <figcaption>
                  <b>2026 so far, against a year earlier</b>
                  <span>
                    January–June change in certified and client-company filings, and the share of clients that changed their main vendor.
                  </span>
                </figcaption>
                <div className="w4-vis-stack">
                  <StripPart id="who-q4-shift" />
                  <StripPart id="who-q4-vendor-changed" />
                </div>
              </figure>
            </div>
            <Drawers variant="foot">
              <Drawer label="Background">
                <p>We compared vendor and industry on 2025 only.</p>
              </Drawer>
              <Drawer label="Method">
                <p>
                  We compare each year's client groups with the next year's, on the clients both years share, and with a second run on the same year as the ceiling.
                </p>
              </Drawer>
              <Drawer label="More numbers">
                <p>
                  On the clients present in both years, consecutive years agree at NMI 0.21 to 0.27, about half the 0.48 to 0.50 between two runs of the same year on the same clients.
                </p>
                <p>
                  2026 breaks the pattern at the top. We compare January to June of each year, because October 2025, the month of the federal shutdown, holds 1,306 certified filings against 35,258 a year earlier. From January to June, certified filings fell 5.8% after rising 9.5% the year before, and filings that name a client company fell 16.5% after holding flat (-0.1%). Tata Consultancy Services filed 2,079, down from 5,256. Of the 349 clients it supplied most from January to June 2025, 223 still appear, and 111 of those now get most of their workers from another firm, most often Infosys. Across clients with five or more filings in both years, 47% changed their main vendor, against 44% a year earlier. These are applications, so they show what employers asked for, not why.
                </p>
              </Drawer>
            </Drawers>
          </div>
        </div>
      </details>
    </details>
  );
}
