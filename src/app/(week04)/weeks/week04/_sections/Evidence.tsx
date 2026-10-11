import { GlossTerm } from "./GlossTerm";

// Deep dive: data and methods.
export function Evidence() {
  return (
    <details className="qa cut rx-topic" id="evidence" name="w4-topic">
      <summary>
        <span className="qa-cue">Data and methods</span>
      </summary>
      <div className="rx-topic-bar">
        <a className="rx-back" href="#cut">← Deep dive</a>
        <div>
          <h2 className="rx-topic-title">Data and methods</h2>
          <p className="rx-topic-holds">The public sources, and how we checked every number.</p>
        </div>
        <span className="rx-topic-count"></span>
      </div>
      <div className="qa-body">
        <p className="sub">The numbers on this page come from these public sources.</p>
        <dl className="w4-sources">
          <dt>
            <a href="https://www.dol.gov/agencies/eta/foreign-labor/performance">US Department of Labor, Office of Foreign Labor Certification ↗</a>
          </dt>
          <dd>
            <GlossTerm id="w4-term-evidence-lca" word="LCA">
              Labor Condition Application: the form an employer files with the Department of Labor before it can sponsor an H-1B worker.
            </GlossTerm>
            {" "}
            disclosures and worksites file, public domain
          </dd>
          <dt>
            <a href="https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub">USCIS H-1B Employer Data Hub ↗</a>
          </dt>
          <dd>October 2021 to June 2026</dd>
          <dt>
            <a href="https://github.com/BloombergGraphics/2024-h1b-immigration-data">H-1B lottery registrations ↗</a>
          </dt>
          <dd>
            the March 2021 to March 2023 draws, USCIS data obtained by Bloomberg News under
            {" "}
            <GlossTerm id="w4-term-evidence-foia" word="FOIA">
              The Freedom of Information Act, which lets anyone request records from US federal agencies.
            </GlossTerm>
          </dd>
          <dt>
            <a href="https://www.census.gov/geographies/reference-files/time-series/demo/metro-micro/delineation-files.html">Census CBSA delineations ↗</a>
          </dt>
          <dd>counties to metro areas</dd>
          <dt>
            <a href="https://www.bls.gov/oes/tables.htm">Bureau of Labor Statistics OEWS ↗</a>
          </dt>
          <dd>jobs per metro and occupation, May 2025</dd>
          <dt>
            <a href="https://www.sec.gov/search-filings/edgar-application-programming-interfaces">SEC EDGAR ↗</a>
          </dt>
          <dd>industry codes of listed clients</dd>
          <dt>
            <a href="https://www.wikidata.org/">Wikidata ↗</a>
          </dt>
          <dd>industries of clients the SEC does not list, CC0</dd>
          <dt>
            <a href="https://www.onetcenter.org/database.html">O*NET database ↗</a>
          </dt>
          <dd>
            skill, knowledge and work-activity ratings per occupation, US Department of Labor, CC BY 4.0
          </dd>
        </dl>
      </div>
    </details>
  );
}
