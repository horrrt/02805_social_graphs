import { CardShell } from "@/features/mockups/CardShell";
import { EmptyShortlist, Favourite, ReviewInit, Status, Summary, Tools, Viewer } from "@/features/mockups/Review";

export default function Page() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to mockups</a>
      <header className="site-head">
        <div className="wide head-row">
          <a className="brand" href="../" aria-label="Log-Log Legends home">
            <span className="brand-mark" aria-hidden="true">↗</span>
            <span>
              LOG–LOG
              <br />
              LEGENDS
            </span>
          </a>
          <nav aria-label="Main navigation">
            <a href="../weeks/week02/">Back to Week 2</a>
            <a href="../#weeks">All weeks</a>
          </nav>
        </div>
      </header>
      <main id="main" className="wide">
        <section className="review-intro" aria-labelledby="review-title">
          <p className="eyebrow">THE DESIGN REVIEW · 48 VISUAL CONCEPTS</p>
          <h1 id="review-title">Which story draws you in?</h1>
          <p className="lede">
            One dataset. 48 ways to present it. Open a page, look around, and save the ideas you’d like to take further.
          </p>
          <p className="concept-note">
            46 static page designs plus 3 exact data visualizations. The new Data stories use verified data; their interactions are proposals. Older generated mockups may contain illustrative marks and labels needing correction.
          </p>
          <div className="starting-points">
            <span>Start with the data</span>
            <a href="?collection=data-stories">3 new data stories · 47–49</a>
            <a href="?collection=disney">Modern Disney · 3 concepts</a>
            <a href="?collection=netflix">Netflix · 4 concepts</a>
            <a href="?collection=marvel">Marvel · 1 concept</a>
          </div>
        </section>
        <Tools />
        <Summary />
        <Status />
        <section className="mockup-grid" aria-label="Design and data visualization gallery">
          <CardShell n={1}>
            <div className="card-topline">
              <span className="mockup-number">01</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/01-control-room.webp" data-open-mockup="1" aria-label="Open full-page mockup 1: The Network Control Room">
              <img src="thumbs/01-control-room.webp" width="360" height="960" loading="eager" decoding="async" alt="Full-page preview of mockup 1: The Network Control Room" />
            </a>
            <h2>
              <a href="images/01-control-room.webp" data-open-mockup="1">The Network Control Room</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/01-control-room.webp" data-open-mockup="1" aria-label="View mockup 1">View full page</a>
              <Favourite n={1} />
            </div>
          </CardShell>
          <CardShell n={2}>
            <div className="card-topline">
              <span className="mockup-number">02</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/02-missing-panel.webp" data-open-mockup="2" aria-label="Open full-page mockup 2: The Missing Panel">
              <img src="thumbs/02-missing-panel.webp" width="360" height="960" loading="eager" decoding="async" alt="Full-page preview of mockup 2: The Missing Panel" />
            </a>
            <h2>
              <a href="images/02-missing-panel.webp" data-open-mockup="2">The Missing Panel</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/02-missing-panel.webp" data-open-mockup="2" aria-label="View mockup 2">View full page</a>
              <Favourite n={2} />
            </div>
          </CardShell>
          <CardShell n={3}>
            <div className="card-topline">
              <span className="mockup-number">03</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/03-case-file.webp" data-open-mockup="3" aria-label="Open full-page mockup 3: The Case File">
              <img src="thumbs/03-case-file.webp" width="360" height="960" loading="eager" decoding="async" alt="Full-page preview of mockup 3: The Case File" />
            </a>
            <h2>
              <a href="images/03-case-file.webp" data-open-mockup="3">The Case File</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/03-case-file.webp" data-open-mockup="3" aria-label="View mockup 3">View full page</a>
              <Favourite n={3} />
            </div>
          </CardShell>
          <CardShell n={4}>
            <div className="card-topline">
              <span className="mockup-number">04</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/04-parallel-universes.webp" data-open-mockup="4" aria-label="Open full-page mockup 4: Parallel Universes — The Full Story">
              <img src="thumbs/04-parallel-universes.webp" width="360" height="960" loading="eager" decoding="async" alt="Full-page preview of mockup 4: Parallel Universes — The Full Story" />
            </a>
            <h2>
              <a href="images/04-parallel-universes.webp" data-open-mockup="4">Parallel Universes — The Full Story</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/04-parallel-universes.webp" data-open-mockup="4" aria-label="View mockup 4">View full page</a>
              <Favourite n={4} />
            </div>
          </CardShell>
          <CardShell n={5}>
            <div className="card-topline">
              <span className="mockup-number">05</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/05-metro.webp" data-open-mockup="5" aria-label="Open full-page mockup 5: The Metro Map">
              <img src="thumbs/05-metro.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 5: The Metro Map" />
            </a>
            <h2>
              <a href="images/05-metro.webp" data-open-mockup="5">The Metro Map</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/05-metro.webp" data-open-mockup="5" aria-label="View mockup 5">View full page</a>
              <Favourite n={5} />
            </div>
          </CardShell>
          <CardShell n={6}>
            <div className="card-topline">
              <span className="mockup-number">06</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/06-museum.webp" data-open-mockup="6" aria-label="Open full-page mockup 6: The Museum of Missing Links">
              <img src="thumbs/06-museum.webp" width="360" height="950" loading="lazy" decoding="async" alt="Full-page preview of mockup 6: The Museum of Missing Links" />
            </a>
            <h2>
              <a href="images/06-museum.webp" data-open-mockup="6">The Museum of Missing Links</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/06-museum.webp" data-open-mockup="6" aria-label="View mockup 6">View full page</a>
              <Favourite n={6} />
            </div>
          </CardShell>
          <CardShell n={7}>
            <div className="card-topline">
              <span className="mockup-number">07</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/07-newspaper.webp" data-open-mockup="7" aria-label="Open full-page mockup 7: The Network Newspaper">
              <img src="thumbs/07-newspaper.webp" width="360" height="900" loading="lazy" decoding="async" alt="Full-page preview of mockup 7: The Network Newspaper" />
            </a>
            <h2>
              <a href="images/07-newspaper.webp" data-open-mockup="7">The Network Newspaper</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/07-newspaper.webp" data-open-mockup="7" aria-label="View mockup 7">View full page</a>
              <Favourite n={7} />
            </div>
          </CardShell>
          <CardShell n={8}>
            <div className="card-topline">
              <span className="mockup-number">08</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/08-festival.webp" data-open-mockup="8" aria-label="Open full-page mockup 8: The Festival of Connections">
              <img src="thumbs/08-festival.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 8: The Festival of Connections" />
            </a>
            <h2>
              <a href="images/08-festival.webp" data-open-mockup="8">The Festival of Connections</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/08-festival.webp" data-open-mockup="8" aria-label="View mockup 8">View full page</a>
              <Favourite n={8} />
            </div>
          </CardShell>
          <CardShell n={9}>
            <div className="card-topline">
              <span className="mockup-number">09</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/09-story-scroll.webp" data-open-mockup="9" aria-label="Open full-page mockup 9: Follow the Thread">
              <img src="thumbs/09-story-scroll.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 9: Follow the Thread" />
            </a>
            <h2>
              <a href="images/09-story-scroll.webp" data-open-mockup="9">Follow the Thread</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/09-story-scroll.webp" data-open-mockup="9" aria-label="View mockup 9">View full page</a>
              <Favourite n={9} />
            </div>
          </CardShell>
          <CardShell n={10}>
            <div className="card-topline">
              <span className="mockup-number">10</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/10-observatory.webp" data-open-mockup="10" aria-label="Open full-page mockup 10: The Network Observatory">
              <img src="thumbs/10-observatory.webp" width="360" height="972" loading="lazy" decoding="async" alt="Full-page preview of mockup 10: The Network Observatory" />
            </a>
            <h2>
              <a href="images/10-observatory.webp" data-open-mockup="10">The Network Observatory</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/10-observatory.webp" data-open-mockup="10" aria-label="View mockup 10">View full page</a>
              <Favourite n={10} />
            </div>
          </CardShell>
          <CardShell n={11}>
            <div className="card-topline">
              <span className="mockup-number">11</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/11-notebook.webp" data-open-mockup="11" aria-label="Open full-page mockup 11: The Open Field Notebook">
              <img src="thumbs/11-notebook.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 11: The Open Field Notebook" />
            </a>
            <h2>
              <a href="images/11-notebook.webp" data-open-mockup="11">The Open Field Notebook</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/11-notebook.webp" data-open-mockup="11" aria-label="View mockup 11">View full page</a>
              <Favourite n={11} />
            </div>
          </CardShell>
          <CardShell n={12}>
            <div className="card-topline">
              <span className="mockup-number">12</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/12-switchboard.webp" data-open-mockup="12" aria-label="Open full-page mockup 12: The Connection Switchboard">
              <img src="thumbs/12-switchboard.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 12: The Connection Switchboard" />
            </a>
            <h2>
              <a href="images/12-switchboard.webp" data-open-mockup="12">The Connection Switchboard</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/12-switchboard.webp" data-open-mockup="12" aria-label="View mockup 12">View full page</a>
              <Favourite n={12} />
            </div>
          </CardShell>
          <CardShell n={13}>
            <div className="card-topline">
              <span className="mockup-number">13</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/13-cutpaper.webp" data-open-mockup="13" aria-label="Open full-page mockup 13: The Cut-Paper Atlas">
              <img src="thumbs/13-cutpaper.webp" width="360" height="959" loading="lazy" decoding="async" alt="Full-page preview of mockup 13: The Cut-Paper Atlas" />
            </a>
            <h2>
              <a href="images/13-cutpaper.webp" data-open-mockup="13">The Cut-Paper Atlas</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/13-cutpaper.webp" data-open-mockup="13" aria-label="View mockup 13">View full page</a>
              <Favourite n={13} />
            </div>
          </CardShell>
          <CardShell n={14}>
            <div className="card-topline">
              <span className="mockup-number">14</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/14-arcade.webp" data-open-mockup="14" aria-label="Open full-page mockup 14: The Prediction Arcade">
              <img src="thumbs/14-arcade.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 14: The Prediction Arcade" />
            </a>
            <h2>
              <a href="images/14-arcade.webp" data-open-mockup="14">The Prediction Arcade</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/14-arcade.webp" data-open-mockup="14" aria-label="View mockup 14">View full page</a>
              <Favourite n={14} />
            </div>
          </CardShell>
          <CardShell n={15}>
            <div className="card-topline">
              <span className="mockup-number">15</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/15-documentary.webp" data-open-mockup="15" aria-label="Open full-page mockup 15: The Network Documentary">
              <img src="thumbs/15-documentary.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 15: The Network Documentary" />
            </a>
            <h2>
              <a href="images/15-documentary.webp" data-open-mockup="15">The Network Documentary</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/15-documentary.webp" data-open-mockup="15" aria-label="View mockup 15">View full page</a>
              <Favourite n={15} />
            </div>
          </CardShell>
          <CardShell n={16}>
            <div className="card-topline">
              <span className="mockup-number">16</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/16-playground.webp" data-open-mockup="16" aria-label="Open full-page mockup 16: The Connection Playground">
              <img src="thumbs/16-playground.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 16: The Connection Playground" />
            </a>
            <h2>
              <a href="images/16-playground.webp" data-open-mockup="16">The Connection Playground</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/16-playground.webp" data-open-mockup="16" aria-label="View mockup 16">View full page</a>
              <Favourite n={16} />
            </div>
          </CardShell>
          <CardShell n={17}>
            <div className="card-topline">
              <span className="mockup-number">17</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/17-blueprint.webp" data-open-mockup="17" aria-label="Open full-page mockup 17: A Blueprint for Connection">
              <img src="thumbs/17-blueprint.webp" width="360" height="919" loading="lazy" decoding="async" alt="Full-page preview of mockup 17: A Blueprint for Connection" />
            </a>
            <h2>
              <a href="images/17-blueprint.webp" data-open-mockup="17">A Blueprint for Connection</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/17-blueprint.webp" data-open-mockup="17" aria-label="View mockup 17">View full page</a>
              <Favourite n={17} />
            </div>
          </CardShell>
          <CardShell n={18}>
            <div className="card-topline">
              <span className="mockup-number">18</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/18-cardtable.webp" data-open-mockup="18" aria-label="Open full-page mockup 18: The Article Card Table">
              <img src="thumbs/18-cardtable.webp" width="360" height="955" loading="lazy" decoding="async" alt="Full-page preview of mockup 18: The Article Card Table" />
            </a>
            <h2>
              <a href="images/18-cardtable.webp" data-open-mockup="18">The Article Card Table</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/18-cardtable.webp" data-open-mockup="18" aria-label="View mockup 18">View full page</a>
              <Favourite n={18} />
            </div>
          </CardShell>
          <CardShell n={19}>
            <div className="card-topline">
              <span className="mockup-number">19</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/19-outcome-atlas.webp" data-open-mockup="19" aria-label="Open full-page mockup 19: The Atlas of Four Outcomes">
              <img src="thumbs/19-outcome-atlas.webp" width="360" height="900" loading="lazy" decoding="async" alt="Full-page preview of mockup 19: The Atlas of Four Outcomes" />
            </a>
            <h2>
              <a href="images/19-outcome-atlas.webp" data-open-mockup="19">The Atlas of Four Outcomes</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/19-outcome-atlas.webp" data-open-mockup="19" aria-label="View mockup 19">View full page</a>
              <Favourite n={19} />
            </div>
          </CardShell>
          <CardShell n={20}>
            <div className="card-topline">
              <span className="mockup-number">20</span>
              <span className="mockup-origin">Original direction</span>
            </div>
            <a className="preview-link" href="images/20-big-finding.webp" data-open-mockup="20" aria-label="Open full-page mockup 20: The Big Finding">
              <img src="thumbs/20-big-finding.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 20: The Big Finding" />
            </a>
            <h2>
              <a href="images/20-big-finding.webp" data-open-mockup="20">The Big Finding</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/20-big-finding.webp" data-open-mockup="20" aria-label="View mockup 20">View full page</a>
              <Favourite n={20} />
            </div>
          </CardShell>
          <CardShell n={22}>
            <div className="card-topline">
              <span className="mockup-number">22</span>
              <span className="mockup-origin">Stripe</span>
            </div>
            <a className="preview-link" href="images/22-stripe.webp" data-open-mockup="22" aria-label="Open full-page mockup 22: The Hidden Infrastructure">
              <img src="thumbs/22-stripe.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 22: The Hidden Infrastructure" />
            </a>
            <h2>
              <a href="images/22-stripe.webp" data-open-mockup="22">The Hidden Infrastructure</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/22-stripe.webp" data-open-mockup="22" aria-label="View mockup 22">View full page</a>
              <Favourite n={22} />
            </div>
          </CardShell>
          <CardShell n={23}>
            <div className="card-topline">
              <span className="mockup-number">23</span>
              <span className="mockup-origin">Wait But Why</span>
            </div>
            <a className="preview-link" href="images/23-wbw.webp" data-open-mockup="23" aria-label="Open full-page mockup 23: Wait, Where Did Everyone Go?">
              <img src="thumbs/23-wbw.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 23: Wait, Where Did Everyone Go?" />
            </a>
            <h2>
              <a href="images/23-wbw.webp" data-open-mockup="23">Wait, Where Did Everyone Go?</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/23-wbw.webp" data-open-mockup="23" aria-label="View mockup 23">View full page</a>
              <Favourite n={23} />
            </div>
          </CardShell>
          <CardShell n={24}>
            <div className="card-topline">
              <span className="mockup-number">24</span>
              <span className="mockup-origin">Our World in Data</span>
            </div>
            <a className="preview-link" href="images/24-owid.webp" data-open-mockup="24" aria-label="Open full-page mockup 24: Our Network in Data">
              <img src="thumbs/24-owid.webp" width="360" height="892" loading="lazy" decoding="async" alt="Full-page preview of mockup 24: Our Network in Data" />
            </a>
            <h2>
              <a href="images/24-owid.webp" data-open-mockup="24">Our Network in Data</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/24-owid.webp" data-open-mockup="24" aria-label="View mockup 24">View full page</a>
              <Favourite n={24} />
            </div>
          </CardShell>
          <CardShell n={25}>
            <div className="card-topline">
              <span className="mockup-number">25</span>
              <span className="mockup-origin">McKinsey</span>
            </div>
            <a className="preview-link" href="images/25-mckinsey.webp" data-open-mockup="25" aria-label="Open full-page mockup 25: The Network Resilience Brief">
              <img src="thumbs/25-mckinsey.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 25: The Network Resilience Brief" />
            </a>
            <h2>
              <a href="images/25-mckinsey.webp" data-open-mockup="25">The Network Resilience Brief</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/25-mckinsey.webp" data-open-mockup="25" aria-label="View mockup 25">View full page</a>
              <Favourite n={25} />
            </div>
          </CardShell>
          <CardShell n={26}>
            <div className="card-topline">
              <span className="mockup-number">26</span>
              <span className="mockup-origin">BCG</span>
            </div>
            <a className="preview-link" href="images/26-bcg.webp" data-open-mockup="26" aria-label="Open full-page mockup 26: Structure Shapes Outcomes">
              <img src="thumbs/26-bcg.webp" width="360" height="945" loading="lazy" decoding="async" alt="Full-page preview of mockup 26: Structure Shapes Outcomes" />
            </a>
            <h2>
              <a href="images/26-bcg.webp" data-open-mockup="26">Structure Shapes Outcomes</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/26-bcg.webp" data-open-mockup="26" aria-label="View mockup 26">View full page</a>
              <Favourite n={26} />
            </div>
          </CardShell>
          <CardShell n={27}>
            <div className="card-topline">
              <span className="mockup-number">27</span>
              <span className="mockup-origin">Bain &amp; Company</span>
            </div>
            <a className="preview-link" href="images/27-bain.webp" data-open-mockup="27" aria-label="Open full-page mockup 27: The Result, Clearly">
              <img src="thumbs/27-bain.webp" width="360" height="880" loading="lazy" decoding="async" alt="Full-page preview of mockup 27: The Result, Clearly" />
            </a>
            <h2>
              <a href="images/27-bain.webp" data-open-mockup="27">The Result, Clearly</a>
            </h2>
            <div className="card-actions">
              <a className="review-button" href="images/27-bain.webp" data-open-mockup="27" aria-label="View mockup 27">View full page</a>
              <Favourite n={27} />
            </div>
          </CardShell>
          <CardShell n={28}>
            <div className="card-topline">
              <span className="mockup-number">28</span>
              <span className="mockup-origin">UX principles</span>
            </div>
            <a className="preview-link" href="images/28-guided-experiment.webp" data-open-mockup="28" aria-label="Open full-page mockup 28: One Decision at a Time">
              <img src="thumbs/28-guided-experiment.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 28: One Decision at a Time" />
            </a>
            <h2>
              <a href="images/28-guided-experiment.webp" data-open-mockup="28">One Decision at a Time</a>
            </h2>
            <p className="ux-focus">Visible state, immediate feedback and a clear way to undo.</p>
            <div className="card-actions">
              <a className="review-button" href="images/28-guided-experiment.webp" data-open-mockup="28" aria-label="View mockup 28">View full page</a>
              <Favourite n={28} />
            </div>
            <details className="ux-rationale">
              <summary>UX rationale &amp; review notes</summary>
              <p>
                Keep the selected article and result beside the controls, with a visible Restore article action. Put secondary methods behind labeled disclosures. This applies visibility of system status, user control and progressive disclosure.
              </p>
              <p className="ux-sources">
                Principle sources:
                {" "}
                <a href="https://www.nngroup.com/articles/ten-usability-heuristics/" target="_blank" rel="noopener">Nielsen Norman Group: usability heuristics</a>
                {" "}
                ·
                {" "}
                <a href="https://www.nngroup.com/articles/progressive-disclosure/" target="_blank" rel="noopener">Nielsen Norman Group: progressive disclosure</a>
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Rebuild the generated bars from the data; their lengths are not exact numeric ratios.
              </p>
            </details>
          </CardShell>
          <CardShell n={29}>
            <div className="card-topline">
              <span className="mockup-number">29</span>
              <span className="mockup-origin">UX principles</span>
            </div>
            <a className="preview-link" href="images/29-clear-comparison.webp" data-open-mockup="29" aria-label="Open full-page mockup 29: See the Difference">
              <img src="thumbs/29-clear-comparison.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 29: See the Difference" />
            </a>
            <h2>
              <a href="images/29-clear-comparison.webp" data-open-mockup="29">See the Difference</a>
            </h2>
            <p className="ux-focus">Compare results side by side without remembering hidden screens.</p>
            <div className="card-actions">
              <a className="review-button" href="images/29-clear-comparison.webp" data-open-mockup="29" aria-label="View mockup 29">View full page</a>
              <Favourite n={29} />
            </div>
            <details className="ux-rationale">
              <summary>UX rationale &amp; review notes</summary>
              <p>
                Keep real and shuffled results side by side with shared labels and a visible article selection. A four-row results table supports comparison without recalling another screen. This applies recognition over recall, consistency and clear grouping.
              </p>
              <p className="ux-sources">
                Principle sources:
                {" "}
                <a href="https://www.nngroup.com/articles/ten-usability-heuristics/" target="_blank" rel="noopener">Nielsen Norman Group: usability heuristics</a>
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Remove the unsupported “Typically 1–2” caption. Qualify “most links” as “among these four examples”.
              </p>
            </details>
          </CardShell>
          <CardShell n={30}>
            <div className="card-topline">
              <span className="mockup-number">30</span>
              <span className="mockup-origin">UX principles</span>
            </div>
            <a className="preview-link" href="images/30-flexible-reading.webp" data-open-mockup="30" aria-label="Open full-page mockup 30: Read It Your Way">
              <img src="thumbs/30-flexible-reading.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 30: Read It Your Way" />
            </a>
            <h2>
              <a href="images/30-flexible-reading.webp" data-open-mockup="30">Read It Your Way</a>
            </h2>
            <p className="ux-focus">Clear reading routes, meaningful labels and color-independent cues.</p>
            <div className="card-actions">
              <a className="review-button" href="images/30-flexible-reading.webp" data-open-mockup="30" aria-label="View mockup 30">View full page</a>
              <Favourite n={30} />
            </div>
            <details className="ux-rationale">
              <summary>UX rationale &amp; review notes</summary>
              <p>
                Offer direct routes to findings, the experiment and evidence. Pair node colors with shapes and labels, expose an article-list alternative and use roomy controls. This applies flexible navigation, color-independent meaning and easier target selection.
              </p>
              <p className="ux-sources">
                Principle sources:
                {" "}
                <a href="https://www.nngroup.com/articles/ten-usability-heuristics/" target="_blank" rel="noopener">Nielsen Norman Group: usability heuristics</a>
                {" "}
                ·
                {" "}
                <a href="https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html" target="_blank" rel="noopener">W3C: use of color</a>
                {" "}
                ·
                {" "}
                <a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html" target="_blank" rel="noopener">W3C: target size</a>
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Rebuild the bars from data. Replace “unusually well connected” with “an unusually large removal effect under this comparison”.
              </p>
            </details>
          </CardShell>
          <CardShell n={31}>
            <div className="card-topline">
              <span className="mockup-number">31</span>
              <span className="mockup-origin">xkcd</span>
            </div>
            <a className="preview-link" href="images/31-xkcd.webp" data-open-mockup="31" aria-label="Open full-page mockup 31: A Small Graph Problem">
              <img src="thumbs/31-xkcd.webp" width="360" height="959" loading="lazy" decoding="async" alt="Full-page preview of mockup 31: A Small Graph Problem" />
            </a>
            <h2>
              <a href="images/31-xkcd.webp" data-open-mockup="31">A Small Graph Problem</a>
            </h2>
            <p className="ux-focus">A deadpan comic turns a graph problem into a small visual surprise.</p>
            <div className="card-actions">
              <a className="review-button" href="images/31-xkcd.webp" data-open-mockup="31" aria-label="View mockup 31">View full page</a>
              <Favourite n={31} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                A short setup and punchline introduce the five stranded articles. Sparse sketch artwork keeps attention on the labeled experiment, immediate result and undo action.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Collapse the methods by default. Use “Same link counts, different wiring” for the shuffled comparison.
              </p>
            </details>
          </CardShell>
          <CardShell n={32}>
            <div className="card-topline">
              <span className="mockup-number">32</span>
              <span className="mockup-origin">Mr Bean</span>
            </div>
            <a className="preview-link" href="images/32-mr-bean.webp" data-open-mockup="32" aria-label="Open full-page mockup 32: Bean Breaks the Network">
              <img src="thumbs/32-mr-bean.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 32: Bean Breaks the Network" />
            </a>
            <h2>
              <a href="images/32-mr-bean.webp" data-open-mockup="32">Bean Breaks the Network</a>
            </h2>
            <p className="ux-focus">A nearly wordless mistake explains the experiment through physical comedy.</p>
            <p className="ux-review-note">
              Image correction needed: ignore “275.6 together” and the invented names of the stranded articles.
            </p>
            <div className="card-actions">
              <a className="review-button" href="images/32-mr-bean.webp" data-open-mockup="32" aria-label="View mockup 32">View full page</a>
              <Favourite n={32} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                A sequence of expressions and actions explains removal and consequence before any detailed reading. Explicit scientific labels and a visible reset make the interaction understandable.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Remove the invented names on the five stranded article nodes. Delete “Typically 275.6 together”; the comparison should retain the verified 1.4 average stranded result.
              </p>
            </details>
          </CardShell>
          <CardShell n={33}>
            <div className="card-topline">
              <span className="mockup-number">33</span>
              <span className="mockup-origin">Monty Python</span>
            </div>
            <a className="preview-link" href="images/33-monty-python.webp" data-open-mockup="33" aria-label="Open full-page mockup 33: The Department of Silly Links">
              <img src="thumbs/33-monty-python.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 33: The Department of Silly Links" />
            </a>
            <h2>
              <a href="images/33-monty-python.webp" data-open-mockup="33">The Department of Silly Links</a>
            </h2>
            <p className="ux-focus">
              An absurd paper-cut bureaucracy turns one missing article into a comic chain of consequences.
            </p>
            <div className="card-actions">
              <a className="review-button" href="images/33-monty-python.webp" data-open-mockup="33" aria-label="View mockup 33">View full page</a>
              <Favourite n={33} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                The collage supplies the opening joke; a clean white experiment area keeps the action, result and reset clear. A straight numerical comparison closes the story.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Render the graph from the verified data; the illustration shows four red nodes next to the “5 stranded” label. State that the shuffle trials are connected networks.
              </p>
            </details>
          </CardShell>
          <CardShell n={34}>
            <div className="card-topline">
              <span className="mockup-number">34</span>
              <span className="mockup-origin">Wallace &amp; Gromit</span>
            </div>
            <a className="preview-link" href="images/34-wallace-and-gromit.webp" data-open-mockup="34" aria-label="Open full-page mockup 34: The Link-O-Matic">
              <img src="thumbs/34-wallace-and-gromit.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 34: The Link-O-Matic" />
            </a>
            <h2>
              <a href="images/34-wallace-and-gromit.webp" data-open-mockup="34">The Link-O-Matic</a>
            </h2>
            <p className="ux-focus">An elaborate invention makes one missing link the punchline.</p>
            <div className="card-actions">
              <a className="review-button" href="images/34-wallace-and-gromit.webp" data-open-mockup="34" aria-label="View mockup 34">View full page</a>
              <Favourite n={34} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                Tactile invention scenes frame the graph as something visitors can investigate. Conventional text controls remain clear beside the playful machinery and a compact evidence summary.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                State that the shuffled networks remain connected. Keep any claim that an article “matters” specific to fragmentation in this Wikipedia-link experiment.
              </p>
            </details>
          </CardShell>
          <CardShell n={35}>
            <div className="card-topline">
              <span className="mockup-number">35</span>
              <span className="mockup-origin">Ricky Gervais</span>
            </div>
            <a className="preview-link" href="images/35-ricky-gervais.webp" data-open-mockup="35" aria-label="Open full-page mockup 35: The Network Roast">
              <img src="thumbs/35-ricky-gervais.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 35: The Network Roast" />
            </a>
            <h2>
              <a href="images/35-ricky-gervais.webp" data-open-mockup="35">The Network Roast</a>
            </h2>
            <p className="ux-focus">A fictional stand-up narrator supplies the setup, reveal and callback.</p>
            <div className="card-actions">
              <a className="review-button" href="images/35-ricky-gervais.webp" data-open-mockup="35" aria-label="View mockup 35">View full page</a>
              <Favourite n={35} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                The theatrical opening draws attention to the result, followed by a quieter experiment and evidence reveal. The portrait is part of an unofficial visual concept; no dialogue or endorsement is attributed to Ricky Gervais.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Render the graph from the verified data; the illustration shows four red nodes next to the “5 stranded” label. State that the shuffle trials are connected networks.
              </p>
            </details>
          </CardShell>
          <CardShell n={36}>
            <div className="card-topline">
              <span className="mockup-number">36</span>
              <span className="mockup-origin">The LEGO Movie</span>
            </div>
            <a className="preview-link" href="images/36-lego-movie.webp" data-open-mockup="36" aria-label="Open full-page mockup 36: Everything Is Connected">
              <img src="thumbs/36-lego-movie.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 36: Everything Is Connected" />
            </a>
            <h2>
              <a href="images/36-lego-movie.webp" data-open-mockup="36">Everything Is Connected</a>
            </h2>
            <p className="ux-focus">A cheerful construction scene makes a broken connection easy to understand.</p>
            <div className="card-actions">
              <a className="review-button" href="images/36-lego-movie.webp" data-open-mockup="36" aria-label="View mockup 36">View full page</a>
              <Favourite n={36} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                Building and unbuilding a physical model creates a clear setup and consequence. The experiment follows the same idea with visible controls, a direct result and an easy restore action.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Replace “same structure” with “the same original degree for each article”. Explain that original links are undirected neighbours and the shuffled networks remain connected.
              </p>
            </details>
          </CardShell>
          <CardShell n={37}>
            <div className="card-topline">
              <span className="mockup-number">37</span>
              <span className="mockup-origin">The Muppets</span>
            </div>
            <a className="preview-link" href="images/37-muppets.webp" data-open-mockup="37" aria-label="Open full-page mockup 37: The Great Graph Show">
              <img src="thumbs/37-muppets.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 37: The Great Graph Show" />
            </a>
            <h2>
              <a href="images/37-muppets.webp" data-open-mockup="37">The Great Graph Show</a>
            </h2>
            <p className="ux-focus">An affectionate puppet-show mishap turns the experiment into a short performance.</p>
            <div className="card-actions">
              <a className="review-button" href="images/37-muppets.webp" data-open-mockup="37" aria-label="View mockup 37">View full page</a>
              <Favourite n={37} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                A playful stage scene introduces the surprise, then the curtain gives way to a calm experiment area. Large controls, explicit results and optional evidence keep the science easy to follow.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Use the numerical 1.4 average in the shuffle comparison rather than five faded dots, which do not represent that average. State that the shuffled networks remain connected.
              </p>
            </details>
          </CardShell>
          <CardShell n={38}>
            <div className="card-topline">
              <span className="mockup-number">38</span>
              <span className="mockup-origin">Wes Anderson</span>
            </div>
            <a className="preview-link" href="images/38-wes-anderson.webp" data-open-mockup="38" aria-label="Open full-page mockup 38: The Grand Link Hotel">
              <img src="thumbs/38-wes-anderson.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 38: The Grand Link Hotel" />
            </a>
            <h2>
              <a href="images/38-wes-anderson.webp" data-open-mockup="38">The Grand Link Hotel</a>
            </h2>
            <p className="ux-focus">A meticulously staged hotel comedy turns the missing article into a visual mystery.</p>
            <div className="card-actions">
              <a className="review-button" href="images/38-wes-anderson.webp" data-open-mockup="38" aria-label="View mockup 38">View full page</a>
              <Favourite n={38} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                Symmetry and deadpan miniature scenes create a distinctive opening, while a clear finding and conventional experiment controls guide the reader. The final scene returns to the restore action and closes the story.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Clarify that 277 articles are the connected core used for the experiment, and that the shuffle trials remain connected.
              </p>
            </details>
          </CardShell>
          <CardShell n={39}>
            <div className="card-topline">
              <span className="mockup-number">39</span>
              <span className="mockup-origin">Modern Disney</span>
            </div>
            <a className="preview-link" href="images/39-disney-thread.webp" data-open-mockup="39" aria-label="Open full-page mockup 39: The Thread That Holds Us">
              <img src="thumbs/39-disney-thread.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 39: The Thread That Holds Us" />
            </a>
            <h2>
              <a href="images/39-disney-thread.webp" data-open-mockup="39">The Thread That Holds Us</a>
            </h2>
            <p className="ux-focus">A luminous thread leads a small character—and the reader—from discovery to consequence.</p>
            <div className="card-actions">
              <a className="review-button" href="images/39-disney-thread.webp" data-open-mockup="39" aria-label="View mockup 39">View full page</a>
              <Favourite n={39} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                A guided scroll follows one luminous connection through three story beats. A clearly labeled removal and restore action turns the reveal into an understandable experiment.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Use the verified network for the final interactive graph. State that the shuffled networks stay connected and preserve each article’s original degree.
              </p>
            </details>
          </CardShell>
          <CardShell n={40}>
            <div className="card-topline">
              <span className="mockup-number">40</span>
              <span className="mockup-origin">Modern Disney</span>
            </div>
            <a className="preview-link" href="images/40-disney-lantern.webp" data-open-mockup="40" aria-label="Open full-page mockup 40: The Lantern Crossing">
              <img src="thumbs/40-disney-lantern.webp" width="360" height="864" loading="lazy" decoding="async" alt="Full-page preview of mockup 40: The Lantern Crossing" />
            </a>
            <h2>
              <a href="images/40-disney-lantern.webp" data-open-mockup="40">The Lantern Crossing</a>
            </h2>
            <p className="ux-focus">A warm island journey makes losing a route feel immediate and understandable.</p>
            <div className="card-actions">
              <a className="review-button" href="images/40-disney-lantern.webp" data-open-mockup="40" aria-label="View mockup 40">View full page</a>
              <Favourite n={40} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                A voyage uses three spacious chapters and a direct reveal. Readable result labels sit beside the visual consequence, while optional evidence stays closed until requested.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Replace “same connection pattern” with “the same original degree for each article”. Render the final graph from verified data rather than the illustrative island scene.
              </p>
            </details>
          </CardShell>
          <CardShell n={41}>
            <div className="card-topline">
              <span className="mockup-number">41</span>
              <span className="mockup-origin">Modern Disney</span>
            </div>
            <a className="preview-link" href="images/41-disney-doors.webp" data-open-mockup="41" aria-label="Open full-page mockup 41: The House of Hidden Connections">
              <img src="thumbs/41-disney-doors.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 41: The House of Hidden Connections" />
            </a>
            <h2>
              <a href="images/41-disney-doors.webp" data-open-mockup="41">The House of Hidden Connections</a>
            </h2>
            <p className="ux-focus">An enchanted house makes the reader curious about what changes behind one missing door.</p>
            <div className="card-actions">
              <a className="review-button" href="images/41-disney-doors.webp" data-open-mockup="41" aria-label="View mockup 41">View full page</a>
              <Favourite n={41} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                A set of four labeled doors offers a clear choice. The revealed outcome and the return action stay in the same place, while the lower page explains the comparison in plain language.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Correct the small “Real network” heading and describe the comparison as degree-preserving, connected shuffles. Render the final graph from verified data.
              </p>
            </details>
          </CardShell>
          <CardShell n={42}>
            <div className="card-topline">
              <span className="mockup-number">42</span>
              <span className="mockup-origin">Netflix</span>
            </div>
            <a className="preview-link" href="images/42-netflix-cut.webp" data-open-mockup="42" aria-label="Open full-page mockup 42: Choose the Cut">
              <img src="thumbs/42-netflix-cut.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 42: Choose the Cut" />
            </a>
            <h2>
              <a href="images/42-netflix-cut.webp" data-open-mockup="42">Choose the Cut</a>
            </h2>
            <p className="ux-focus">A film-like decision point gives visitors a reason to act before revealing the evidence.</p>
            <div className="card-actions">
              <a className="review-button" href="images/42-netflix-cut.webp" data-open-mockup="42" aria-label="View mockup 42">View full page</a>
              <Favourite n={42} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                Four equal choices communicate the experiment clearly. The selected path exposes the result immediately, with an obvious rewind action and a stable comparison below.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Explicitly state that shuffled networks remain connected, and distinguish preserved degrees from preserved links. Draw the interactive network from verified data.
              </p>
            </details>
          </CardShell>
          <CardShell n={43}>
            <div className="card-topline">
              <span className="mockup-number">43</span>
              <span className="mockup-origin">Netflix</span>
            </div>
            <a className="preview-link" href="images/43-netflix-missing.webp" data-open-mockup="43" aria-label="Open full-page mockup 43: The Missing Article">
              <img src="thumbs/43-netflix-missing.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 43: The Missing Article" />
            </a>
            <h2>
              <a href="images/43-netflix-missing.webp" data-open-mockup="43">The Missing Article</a>
            </h2>
            <p className="ux-focus">A documentary opening turns the removal experiment into a mystery worth following.</p>
            <div className="card-actions">
              <a className="review-button" href="images/43-netflix-missing.webp" data-open-mockup="43" aria-label="View mockup 43">View full page</a>
              <Favourite n={43} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                A single documentary-style action leads into a three-chapter story. The result appears early; evidence unfolds below without making visitors browse an unrelated content library.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Keep 1.4 as a numerical average rather than faded article dots. Add the frozen-data date in the evidence details and render the final network from verified data.
              </p>
            </details>
          </CardShell>
          <CardShell n={44}>
            <div className="card-topline">
              <span className="mockup-number">44</span>
              <span className="mockup-origin">Netflix</span>
            </div>
            <a className="preview-link" href="images/44-netflix-episodes.webp" data-open-mockup="44" aria-label="Open full-page mockup 44: Anatomy of a Blackout">
              <img src="thumbs/44-netflix-episodes.webp" width="360" height="876" loading="lazy" decoding="async" alt="Full-page preview of mockup 44: Anatomy of a Blackout" />
            </a>
            <h2>
              <a href="images/44-netflix-episodes.webp" data-open-mockup="44">Anatomy of a Blackout</a>
            </h2>
            <p className="ux-focus">A short series of chapters turns the analysis into a narrative people can finish.</p>
            <div className="card-actions">
              <a className="review-button" href="images/44-netflix-episodes.webp" data-open-mockup="44" aria-label="View mockup 44">View full page</a>
              <Favourite n={44} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                Three clear chapters provide orientation and a sense of progress. Each chapter contains one message, and the experiment remains accessible without playing a video.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                The illustration shows four stranded dots beside a label of five; draw the final graph from verified data. Keep 1.4 as a numerical average and state that shuffles are connected before removal.
              </p>
            </details>
          </CardShell>
          <CardShell n={45}>
            <div className="card-topline">
              <span className="mockup-number">45</span>
              <span className="mockup-origin">Netflix</span>
            </div>
            <a className="preview-link" href="images/45-netflix-worlds.webp" data-open-mockup="45" aria-label="Open full-page mockup 45: Two Worlds, One Test">
              <img src="thumbs/45-netflix-worlds.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 45: Two Worlds, One Test" />
            </a>
            <h2>
              <a href="images/45-netflix-worlds.webp" data-open-mockup="45">Two Worlds, One Test</a>
            </h2>
            <p className="ux-focus">A visual comparison makes the real-versus-shuffled question the central hook.</p>
            <p className="ux-review-note">
              Image correction needed: shuffled networks can fragment after removal; “remains connected” is not the result.
            </p>
            <div className="card-actions">
              <a className="review-button" href="images/45-netflix-worlds.webp" data-open-mockup="45" aria-label="View mockup 45">View full page</a>
              <Favourite n={45} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                A large labeled comparison can be understood at a glance. The same action applies to both worlds, making the controlled comparison easier to follow.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Replace “same connections” with “same degrees”. Shuffles are connected before removal, but can fragment afterwards; replace the “remains connected” outcome with the measured comparison.
              </p>
            </details>
          </CardShell>
          <CardShell n={46}>
            <div className="card-topline">
              <span className="mockup-number">46</span>
              <span className="mockup-origin">Marvel</span>
            </div>
            <a className="preview-link" href="images/46-marvel-stark.webp" data-open-mockup="46" aria-label="Open full-page mockup 46: The Stark Briefing">
              <img src="thumbs/46-marvel-stark.webp" width="360" height="960" loading="lazy" decoding="async" alt="Full-page preview of mockup 46: The Stark Briefing" />
            </a>
            <h2>
              <a href="images/46-marvel-stark.webp" data-open-mockup="46">The Stark Briefing</a>
            </h2>
            <p className="ux-focus">
              A polished mission briefing makes the experiment feel important without burying the finding.
            </p>
            <div className="card-actions">
              <a className="review-button" href="images/46-marvel-stark.webp" data-open-mockup="46" aria-label="View mockup 46">View full page</a>
              <Favourite n={46} />
            </div>
            <details className="ux-rationale">
              <summary>Story &amp; interaction</summary>
              <p>
                The mission, action and outcome are presented in a stable sequence. Technical decoration stays around the edges so labels, controls and the actual evidence remain readable.
              </p>
              <p className="ux-review-note">
                <strong>Before implementation:</strong>
                {" "}
                Define stranded as outside the largest remaining group, rather than necessarily isolated from one another. State that shuffled networks are connected before removal and add the data snapshot date.
              </p>
            </details>
          </CardShell>
          <CardShell n={47} className="mockup-card data-story-card">
            <div className="card-topline">
              <span className="mockup-number">47</span>
              <span className="mockup-origin">Data story · verified data</span>
            </div>
            <div className="data-story-content">
              <a className="preview-link" href="data-figures/removal-census.png" data-open-mockup="47" aria-label="Open visualization 47: The Fragility Census">
                <img src="thumbs/47-removal-census.webp" width="720" height="540" loading="lazy" decoding="async" alt="277 removal tests: 264 circles represent connected outcomes and 13 squares represent fragmentation. Ranked stranded counts: Spider-Man 5, Black Widow 3, Doctor Strange 2; ten other removals strand one article each." />
              </a>
              <div className="data-story-copy">
                <h2>
                  <a href="data-figures/removal-census.png" data-open-mockup="47">The Fragility Census</a>
                </h2>
                <p className="ux-focus">264 of 277 removals leave the remaining articles connected. Explore the 13 exceptions.</p>
                <p className="ux-review-note">Exact static visualization · snapshot 26 Aug 2026 · interactions proposed</p>
                <div className="card-actions">
                  <a className="review-button" href="data-figures/removal-census.png" data-open-mockup="47" aria-label="View visualization 47">View visualization</a>
                  <Favourite n={47} />
                </div>
                <details className="ux-rationale">
                  <summary>Interaction &amp; UX</summary>
                  <p>
                    <strong>Proposed interaction:</strong>
                    {" "}
                    Filter the census to its 13 exceptions, select an article and reveal its outcome beside the selection. A clear reset and a searchable list provide alternative routes.
                  </p>
                  <p>
                    The overview comes first. Circles and squares distinguish outcomes without relying on colour. The selected article and its result stay together; methods remain optional.
                  </p>
                  <p className="ux-review-note">
                    This is an exact static figure. The filter and selection are proposed interactions. Use a searchable list and visible keyboard focus rather than 277 tiny tab stops.
                  </p>
                  <p className="ux-sources">
                    <a href="../assets/data/week02_all_removals.csv" target="_blank" rel="noopener">Source data · week02_all_removals.csv</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.nngroup.com/articles/ten-usability-heuristics/" target="_blank" rel="noopener">NN/G: usability heuristics</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.nngroup.com/articles/progressive-disclosure/" target="_blank" rel="noopener">NN/G: progressive disclosure</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html" target="_blank" rel="noopener">W3C: use of colour</a>
                  </p>
                </details>
                <details className="ux-rationale">
                  <summary>Read the data</summary>
                  <p>
                    Each mark is one removal from the same 277-article connected core. After removal, 276 articles remain: 264 tests leave them connected, and 13 split them into groups.
                  </p>
                  <table>
                    <caption>All 13 fragmenting removals</caption>
                    <thead>
                      <tr>
                        <th scope="col">Article removed</th>
                        <th scope="col">Stranded</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Spider-Man</th>
                        <td>5</td>
                      </tr>
                      <tr>
                        <th scope="row">Black Widow (Natasha Romanova)</th>
                        <td>3</td>
                      </tr>
                      <tr>
                        <th scope="row">Doctor Strange</th>
                        <td>2</td>
                      </tr>
                      <tr>
                        <th scope="row">Deadpool</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Moon Knight</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Deathlok</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Shang-Chi</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">War Machine</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Genis-Vell</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Guardsman (character)</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Nightmask</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Turbo (comics)</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Rockman (character)</th>
                        <td>1</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="ux-review-note">
                    Stranded means outside the largest remaining group. These are Wikipedia article links, not friendships.
                  </p>
                  <p>
                    <a href="../assets/data/week02_all_removals.csv">Open source data</a>
                  </p>
                </details>
              </div>
            </div>
          </CardShell>
          <CardShell n={48} className="mockup-card data-story-card">
            <div className="card-topline">
              <span className="mockup-number">48</span>
              <span className="mockup-origin">Data story · verified data</span>
            </div>
            <div className="data-story-content">
              <a className="preview-link" href="data-figures/black-widow-islands.png" data-open-mockup="48" aria-label="Open visualization 48: Follow the Fracture">
                <img src="thumbs/48-black-widow-islands.webp" width="720" height="480" loading="lazy" decoding="async" alt="Before: Black Widow connects the collapsed 273-article main group to Blue Eagle and Rockman; Rockman connects to The Witness. After Black Widow is removed, Blue Eagle is alone and Rockman still links to The Witness. Three articles are outside the 273-article main group." />
              </a>
              <div className="data-story-copy">
                <h2>
                  <a href="data-figures/black-widow-islands.png" data-open-mockup="48">Follow the Fracture</a>
                </h2>
                <p className="ux-focus">
                  Black Widow’s removal strands three articles in two groups. Stranded does not necessarily mean alone.
                </p>
                <p className="ux-review-note">Exact static visualization · snapshot 26 Aug 2026 · interactions proposed</p>
                <div className="card-actions">
                  <a className="review-button" href="data-figures/black-widow-islands.png" data-open-mockup="48" aria-label="View visualization 48">View visualization</a>
                  <Favourite n={48} />
                </div>
                <details className="ux-rationale">
                  <summary>Interaction &amp; UX</summary>
                  <p>
                    <strong>Proposed interaction:</strong>
                    {" "}
                    Switch between Before and After while positions stay fixed. Restore the article to undo the removal, or step through the two stranded groups.
                  </p>
                  <p>
                    A reversible action and stable positions make the consequence easy to follow. Direct labels, outlined groups and a text alternative carry the meaning. Motion is optional.
                  </p>
                  <p className="ux-review-note">
                    This is an exact topology schematic with the main group and its 23 links collapsed. Shapes are not proportional to group size. Before/After and Restore are proposed controls; reduced-motion mode should change states instantly.
                  </p>
                  <p className="ux-sources">
                    <a href="../assets/data/week02_resilience.json" target="_blank" rel="noopener">Source data · week02_resilience.json</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.nngroup.com/articles/ten-usability-heuristics/" target="_blank" rel="noopener">NN/G: usability heuristics</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.nngroup.com/articles/progressive-disclosure/" target="_blank" rel="noopener">NN/G: progressive disclosure</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html" target="_blank" rel="noopener">W3C: use of colour</a>
                  </p>
                </details>
                <details className="ux-rationale">
                  <summary>Read the data</summary>
                  <p>
                    Before removal all 277 articles are connected. After removing Black Widow, the remaining 276 articles form these groups:
                  </p>
                  <table>
                    <caption>Groups after Black Widow is removed</caption>
                    <thead>
                      <tr>
                        <th scope="col">Group</th>
                        <th scope="col">Articles</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Largest remaining group</th>
                        <td>273</td>
                      </tr>
                      <tr>
                        <th scope="row">Blue Eagle</th>
                        <td>1</td>
                      </tr>
                      <tr>
                        <th scope="row">Rockman and The Witness</th>
                        <td>2</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="ux-review-note">
                    Stranded means outside the largest remaining group. These are Wikipedia article links, not friendships.
                  </p>
                  <p>
                    <a href="../assets/data/week02_resilience.json">Open source data</a>
                  </p>
                </details>
              </div>
            </div>
          </CardShell>
          <CardShell n={49} className="mockup-card data-story-card">
            <div className="card-topline">
              <span className="mockup-number">49</span>
              <span className="mockup-origin">Data story · verified data</span>
            </div>
            <div className="data-story-content">
              <a className="preview-link" href="data-figures/shuffled-worlds.png" data-open-mockup="49" aria-label="Open visualization 49: A Thousand Possible Worlds">
                <img src="thumbs/49-shuffled-worlds.webp" width="720" height="480" loading="lazy" decoding="async" alt="Histogram of 1,000 degree-preserving shuffles: 0 stranded in 235 trials, 1 in 350, 2 in 248, 3 in 114, 4 in 44 and 5 in 9. The observed result is 5. Mean shuffled stranding is 1.409." />
              </a>
              <div className="data-story-copy">
                <h2>
                  <a href="data-figures/shuffled-worlds.png" data-open-mockup="49">A Thousand Possible Worlds</a>
                </h2>
                <p className="ux-focus">
                  Only 9 of 1,000 shuffled trials strand at least five articles after Spider-Man is removed.
                </p>
                <p className="ux-review-note">Exact static visualization · snapshot 26 Aug 2026 · interactions proposed</p>
                <div className="card-actions">
                  <a className="review-button" href="data-figures/shuffled-worlds.png" data-open-mockup="49" aria-label="View visualization 49">View visualization</a>
                  <Favourite n={49} />
                </div>
                <details className="ux-rationale">
                  <summary>Interaction &amp; UX</summary>
                  <p>
                    <strong>Proposed interaction:</strong>
                    {" "}
                    Optionally predict whether five is common or rare, then reveal its position in the distribution. Offer Skip to result and a table of every outcome.
                  </p>
                  <p>
                    One optional choice leads to immediate explanatory feedback. A zero baseline, direct counts, a visible denominator and a hatched tail keep the comparison clear.
                  </p>
                  <p className="ux-review-note">
                    This is an exact static histogram. Prediction and reveal are proposed interactions. Shuffles are connected before removal; the 9/1,000 count is descriptive and exploratory, not proof of causation or a calibrated significance claim.
                  </p>
                  <p className="ux-sources">
                    <a href="../assets/data/week02_null_draws.csv" target="_blank" rel="noopener">Source data · week02_null_draws.csv</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.nngroup.com/articles/ten-usability-heuristics/" target="_blank" rel="noopener">NN/G: usability heuristics</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.nngroup.com/articles/progressive-disclosure/" target="_blank" rel="noopener">NN/G: progressive disclosure</a>
                    {" "}
                    ·
                    {" "}
                    <a href="https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html" target="_blank" rel="noopener">W3C: use of colour</a>
                  </p>
                </details>
                <details className="ux-rationale">
                  <summary>Read the data</summary>
                  <p>
                    Each trial starts with a connected, degree-preserving shuffle. Spider-Man is then removed. The observed network strands five articles; the shuffled mean is 1.409.
                  </p>
                  <table>
                    <caption>All 1,000 recorded shuffled outcomes</caption>
                    <thead>
                      <tr>
                        <th scope="col">Articles stranded</th>
                        <th scope="col">Trials</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">0</th>
                        <td>235</td>
                      </tr>
                      <tr>
                        <th scope="row">1</th>
                        <td>350</td>
                      </tr>
                      <tr>
                        <th scope="row">2</th>
                        <td>248</td>
                      </tr>
                      <tr>
                        <th scope="row">3</th>
                        <td>114</td>
                      </tr>
                      <tr>
                        <th scope="row">4</th>
                        <td>44</td>
                      </tr>
                      <tr>
                        <th scope="row">5</th>
                        <td>9</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="ux-review-note">
                    Stranded means outside the largest remaining group. These are Wikipedia article links, not friendships.
                  </p>
                  <p>
                    <a href="../assets/data/week02_null_draws.csv">Open source data</a>
                  </p>
                </details>
              </div>
            </div>
          </CardShell>
        </section>
        <EmptyShortlist />
        <footer className="review-foot">
          <p>
            Compare the hook, the story, the clarity of the findings and the usefulness of the interaction.
          </p>
          <a href="../weeks/week02/">Return to the current story →</a>
        </footer>
      </main>
      <Viewer />
      <ReviewInit />
      <noscript>
        <p className="wide">
          All 49 concept images and the data-story text alternatives are available above. Enable JavaScript to filter designs, save favourites and use the page viewer.
        </p>
      </noscript>
      <script type="application/json" id="mockup-data" dangerouslySetInnerHTML={{ __html: "[{\"number\": 1, \"name\": \"The Network Control Room\", \"image\": \"images/01-control-room.webp\", \"thumbnail\": \"thumbs/01-control-room.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 2, \"name\": \"The Missing Panel\", \"image\": \"images/02-missing-panel.webp\", \"thumbnail\": \"thumbs/02-missing-panel.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 3, \"name\": \"The Case File\", \"image\": \"images/03-case-file.webp\", \"thumbnail\": \"thumbs/03-case-file.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 4, \"name\": \"Parallel Universes — The Full Story\", \"image\": \"images/04-parallel-universes.webp\", \"thumbnail\": \"thumbs/04-parallel-universes.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 5, \"name\": \"The Metro Map\", \"image\": \"images/05-metro.webp\", \"thumbnail\": \"thumbs/05-metro.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 6, \"name\": \"The Museum of Missing Links\", \"image\": \"images/06-museum.webp\", \"thumbnail\": \"thumbs/06-museum.webp\", \"width\": 772, \"height\": 2038, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 7, \"name\": \"The Network Newspaper\", \"image\": \"images/07-newspaper.webp\", \"thumbnail\": \"thumbs/07-newspaper.webp\", \"width\": 793, \"height\": 1983, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 8, \"name\": \"The Festival of Connections\", \"image\": \"images/08-festival.webp\", \"thumbnail\": \"thumbs/08-festival.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 9, \"name\": \"Follow the Thread\", \"image\": \"images/09-story-scroll.webp\", \"thumbnail\": \"thumbs/09-story-scroll.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 10, \"name\": \"The Network Observatory\", \"image\": \"images/10-observatory.webp\", \"thumbnail\": \"thumbs/10-observatory.webp\", \"width\": 763, \"height\": 2061, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 11, \"name\": \"The Open Field Notebook\", \"image\": \"images/11-notebook.webp\", \"thumbnail\": \"thumbs/11-notebook.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 12, \"name\": \"The Connection Switchboard\", \"image\": \"images/12-switchboard.webp\", \"thumbnail\": \"thumbs/12-switchboard.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 13, \"name\": \"The Cut-Paper Atlas\", \"image\": \"images/13-cutpaper.webp\", \"thumbnail\": \"thumbs/13-cutpaper.webp\", \"width\": 768, \"height\": 2046, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 14, \"name\": \"The Prediction Arcade\", \"image\": \"images/14-arcade.webp\", \"thumbnail\": \"thumbs/14-arcade.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 15, \"name\": \"The Network Documentary\", \"image\": \"images/15-documentary.webp\", \"thumbnail\": \"thumbs/15-documentary.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 16, \"name\": \"The Connection Playground\", \"image\": \"images/16-playground.webp\", \"thumbnail\": \"thumbs/16-playground.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 17, \"name\": \"A Blueprint for Connection\", \"image\": \"images/17-blueprint.webp\", \"thumbnail\": \"thumbs/17-blueprint.webp\", \"width\": 785, \"height\": 2004, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 18, \"name\": \"The Article Card Table\", \"image\": \"images/18-cardtable.webp\", \"thumbnail\": \"thumbs/18-cardtable.webp\", \"width\": 770, \"height\": 2043, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 19, \"name\": \"The Atlas of Four Outcomes\", \"image\": \"images/19-outcome-atlas.webp\", \"thumbnail\": \"thumbs/19-outcome-atlas.webp\", \"width\": 793, \"height\": 1983, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 20, \"name\": \"The Big Finding\", \"image\": \"images/20-big-finding.webp\", \"thumbnail\": \"thumbs/20-big-finding.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"original\"}, {\"number\": 22, \"name\": \"The Hidden Infrastructure\", \"image\": \"images/22-stripe.webp\", \"thumbnail\": \"thumbs/22-stripe.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Stripe\", \"referenceUrl\": \"https://stripe.com/\", \"collection\": \"reference\"}, {\"number\": 23, \"name\": \"Wait, Where Did Everyone Go?\", \"image\": \"images/23-wbw.webp\", \"thumbnail\": \"thumbs/23-wbw.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Wait But Why\", \"referenceUrl\": \"https://waitbutwhy.com/2020/09/universe.html\", \"collection\": \"reference\"}, {\"number\": 24, \"name\": \"Our Network in Data\", \"image\": \"images/24-owid.webp\", \"thumbnail\": \"thumbs/24-owid.webp\", \"width\": 797, \"height\": 1974, \"inspiration\": \"Our World in Data\", \"referenceUrl\": \"https://ourworldindata.org/\", \"collection\": \"reference\"}, {\"number\": 25, \"name\": \"The Network Resilience Brief\", \"image\": \"images/25-mckinsey.webp\", \"thumbnail\": \"thumbs/25-mckinsey.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"McKinsey\", \"referenceUrl\": \"https://pages.mckinsey.com/GEI-report\", \"collection\": \"reference\"}, {\"number\": 26, \"name\": \"Structure Shapes Outcomes\", \"image\": \"images/26-bcg.webp\", \"thumbnail\": \"thumbs/26-bcg.webp\", \"width\": 774, \"height\": 2032, \"inspiration\": \"BCG\", \"referenceUrl\": \"https://www.bcg.com/\", \"collection\": \"reference\"}, {\"number\": 27, \"name\": \"The Result, Clearly\", \"image\": \"images/27-bain.webp\", \"thumbnail\": \"thumbs/27-bain.webp\", \"width\": 802, \"height\": 1960, \"inspiration\": \"Bain & Company\", \"referenceUrl\": \"https://view.ceros.com/bain/m-and-a-report-2024-2-3-1/p/1\", \"collection\": \"reference\"}, {\"number\": 28, \"name\": \"One Decision at a Time\", \"width\": 768, \"height\": 2048, \"uxSummary\": \"Keep the selected article and result beside the controls, with a visible Restore article action. Put secondary methods behind labeled disclosures. This applies visibility of system status, user control and progressive disclosure.\", \"uxSources\": [{\"title\": \"Nielsen Norman Group: usability heuristics\", \"url\": \"https://www.nngroup.com/articles/ten-usability-heuristics/\"}, {\"title\": \"Nielsen Norman Group: progressive disclosure\", \"url\": \"https://www.nngroup.com/articles/progressive-disclosure/\"}], \"reviewNote\": \"Rebuild the generated bars from the data; their lengths are not exact numeric ratios.\", \"image\": \"images/28-guided-experiment.webp\", \"thumbnail\": \"thumbs/28-guided-experiment.webp\", \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"ux\"}, {\"number\": 29, \"name\": \"See the Difference\", \"width\": 768, \"height\": 2048, \"uxSummary\": \"Keep real and shuffled results side by side with shared labels and a visible article selection. A four-row results table supports comparison without recalling another screen. This applies recognition over recall, consistency and clear grouping.\", \"uxSources\": [{\"title\": \"Nielsen Norman Group: usability heuristics\", \"url\": \"https://www.nngroup.com/articles/ten-usability-heuristics/\"}], \"reviewNote\": \"Remove the unsupported “Typically 1–2” caption. Qualify “most links” as “among these four examples”.\", \"image\": \"images/29-clear-comparison.webp\", \"thumbnail\": \"thumbs/29-clear-comparison.webp\", \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"ux\"}, {\"number\": 30, \"name\": \"Read It Your Way\", \"width\": 768, \"height\": 2048, \"uxSummary\": \"Offer direct routes to findings, the experiment and evidence. Pair node colors with shapes and labels, expose an article-list alternative and use roomy controls. This applies flexible navigation, color-independent meaning and easier target selection.\", \"uxSources\": [{\"title\": \"Nielsen Norman Group: usability heuristics\", \"url\": \"https://www.nngroup.com/articles/ten-usability-heuristics/\"}, {\"title\": \"W3C: use of color\", \"url\": \"https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html\"}, {\"title\": \"W3C: target size\", \"url\": \"https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html\"}], \"reviewNote\": \"Rebuild the bars from data. Replace “unusually well connected” with “an unusually large removal effect under this comparison”.\", \"image\": \"images/30-flexible-reading.webp\", \"thumbnail\": \"thumbs/30-flexible-reading.webp\", \"inspiration\": \"\", \"referenceUrl\": \"\", \"collection\": \"ux\"}, {\"number\": 31, \"name\": \"A Small Graph Problem\", \"image\": \"images/31-xkcd.webp\", \"thumbnail\": \"thumbs/31-xkcd.webp\", \"width\": 768, \"height\": 2046, \"inspiration\": \"xkcd\", \"referenceUrl\": \"\", \"collection\": \"comedy\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"A short setup and punchline introduce the five stranded articles. Sparse sketch artwork keeps attention on the labeled experiment, immediate result and undo action.\", \"reviewNote\": \"Collapse the methods by default. Use “Same link counts, different wiring” for the shuffled comparison.\"}, {\"number\": 32, \"name\": \"Bean Breaks the Network\", \"image\": \"images/32-mr-bean.webp\", \"thumbnail\": \"thumbs/32-mr-bean.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Mr Bean\", \"referenceUrl\": \"\", \"collection\": \"comedy\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"A sequence of expressions and actions explains removal and consequence before any detailed reading. Explicit scientific labels and a visible reset make the interaction understandable.\", \"reviewNote\": \"Remove the invented names on the five stranded article nodes. Delete “Typically 275.6 together”; the comparison should retain the verified 1.4 average stranded result.\", \"correctionNotice\": \"Image correction needed: ignore “275.6 together” and the invented names of the stranded articles.\"}, {\"number\": 33, \"name\": \"The Department of Silly Links\", \"image\": \"images/33-monty-python.webp\", \"thumbnail\": \"thumbs/33-monty-python.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Monty Python\", \"referenceUrl\": \"\", \"collection\": \"comedy\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"The collage supplies the opening joke; a clean white experiment area keeps the action, result and reset clear. A straight numerical comparison closes the story.\", \"reviewNote\": \"Render the graph from the verified data; the illustration shows four red nodes next to the “5 stranded” label. State that the shuffle trials are connected networks.\"}, {\"number\": 34, \"name\": \"The Link-O-Matic\", \"image\": \"images/34-wallace-and-gromit.webp\", \"thumbnail\": \"thumbs/34-wallace-and-gromit.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Wallace & Gromit\", \"referenceUrl\": \"\", \"collection\": \"comedy\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"Tactile invention scenes frame the graph as something visitors can investigate. Conventional text controls remain clear beside the playful machinery and a compact evidence summary.\", \"reviewNote\": \"State that the shuffled networks remain connected. Keep any claim that an article “matters” specific to fragmentation in this Wikipedia-link experiment.\"}, {\"number\": 35, \"name\": \"The Network Roast\", \"image\": \"images/35-ricky-gervais.webp\", \"thumbnail\": \"thumbs/35-ricky-gervais.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Ricky Gervais\", \"referenceUrl\": \"\", \"collection\": \"comedy\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"The theatrical opening draws attention to the result, followed by a quieter experiment and evidence reveal. The portrait is part of an unofficial visual concept; no dialogue or endorsement is attributed to Ricky Gervais.\", \"reviewNote\": \"Render the graph from the verified data; the illustration shows four red nodes next to the “5 stranded” label. State that the shuffle trials are connected networks.\"}, {\"number\": 36, \"name\": \"Everything Is Connected\", \"image\": \"images/36-lego-movie.webp\", \"thumbnail\": \"thumbs/36-lego-movie.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"The LEGO Movie\", \"referenceUrl\": \"\", \"collection\": \"comedy\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"Building and unbuilding a physical model creates a clear setup and consequence. The experiment follows the same idea with visible controls, a direct result and an easy restore action.\", \"reviewNote\": \"Replace “same structure” with “the same original degree for each article”. Explain that original links are undirected neighbours and the shuffled networks remain connected.\"}, {\"number\": 37, \"name\": \"The Great Graph Show\", \"image\": \"images/37-muppets.webp\", \"thumbnail\": \"thumbs/37-muppets.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"The Muppets\", \"referenceUrl\": \"\", \"collection\": \"comedy\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"A playful stage scene introduces the surprise, then the curtain gives way to a calm experiment area. Large controls, explicit results and optional evidence keep the science easy to follow.\", \"reviewNote\": \"Use the numerical 1.4 average in the shuffle comparison rather than five faded dots, which do not represent that average. State that the shuffled networks remain connected.\"}, {\"number\": 38, \"name\": \"The Grand Link Hotel\", \"image\": \"images/38-wes-anderson.webp\", \"thumbnail\": \"thumbs/38-wes-anderson.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Wes Anderson\", \"referenceUrl\": \"\", \"collection\": \"comedy\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"Symmetry and deadpan miniature scenes create a distinctive opening, while a clear finding and conventional experiment controls guide the reader. The final scene returns to the restore action and closes the story.\", \"reviewNote\": \"Clarify that 277 articles are the connected core used for the experiment, and that the shuffle trials remain connected.\"}, {\"number\": 39, \"name\": \"The Thread That Holds Us\", \"image\": \"images/39-disney-thread.webp\", \"thumbnail\": \"thumbs/39-disney-thread.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Modern Disney\", \"referenceUrl\": \"\", \"collection\": \"disney\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"A guided scroll follows one luminous connection through three story beats. A clearly labeled removal and restore action turns the reveal into an understandable experiment.\", \"reviewNote\": \"Use the verified network for the final interactive graph. State that the shuffled networks stay connected and preserve each article’s original degree.\"}, {\"number\": 40, \"name\": \"The Lantern Crossing\", \"image\": \"images/40-disney-lantern.webp\", \"thumbnail\": \"thumbs/40-disney-lantern.webp\", \"width\": 809, \"height\": 1942, \"inspiration\": \"Modern Disney\", \"referenceUrl\": \"\", \"collection\": \"disney\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"A voyage uses three spacious chapters and a direct reveal. Readable result labels sit beside the visual consequence, while optional evidence stays closed until requested.\", \"reviewNote\": \"Replace “same connection pattern” with “the same original degree for each article”. Render the final graph from verified data rather than the illustrative island scene.\"}, {\"number\": 41, \"name\": \"The House of Hidden Connections\", \"image\": \"images/41-disney-doors.webp\", \"thumbnail\": \"thumbs/41-disney-doors.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Modern Disney\", \"referenceUrl\": \"\", \"collection\": \"disney\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"A set of four labeled doors offers a clear choice. The revealed outcome and the return action stay in the same place, while the lower page explains the comparison in plain language.\", \"reviewNote\": \"Correct the small “Real network” heading and describe the comparison as degree-preserving, connected shuffles. Render the final graph from verified data.\"}, {\"number\": 42, \"name\": \"Choose the Cut\", \"image\": \"images/42-netflix-cut.webp\", \"thumbnail\": \"thumbs/42-netflix-cut.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Netflix\", \"referenceUrl\": \"\", \"collection\": \"netflix\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"Four equal choices communicate the experiment clearly. The selected path exposes the result immediately, with an obvious rewind action and a stable comparison below.\", \"reviewNote\": \"Explicitly state that shuffled networks remain connected, and distinguish preserved degrees from preserved links. Draw the interactive network from verified data.\"}, {\"number\": 43, \"name\": \"The Missing Article\", \"image\": \"images/43-netflix-missing.webp\", \"thumbnail\": \"thumbs/43-netflix-missing.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Netflix\", \"referenceUrl\": \"\", \"collection\": \"netflix\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"A single documentary-style action leads into a three-chapter story. The result appears early; evidence unfolds below without making visitors browse an unrelated content library.\", \"reviewNote\": \"Keep 1.4 as a numerical average rather than faded article dots. Add the frozen-data date in the evidence details and render the final network from verified data.\"}, {\"number\": 44, \"name\": \"Anatomy of a Blackout\", \"image\": \"images/44-netflix-episodes.webp\", \"thumbnail\": \"thumbs/44-netflix-episodes.webp\", \"width\": 804, \"height\": 1957, \"inspiration\": \"Netflix\", \"referenceUrl\": \"\", \"collection\": \"netflix\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"Three clear chapters provide orientation and a sense of progress. Each chapter contains one message, and the experiment remains accessible without playing a video.\", \"reviewNote\": \"The illustration shows four stranded dots beside a label of five; draw the final graph from verified data. Keep 1.4 as a numerical average and state that shuffles are connected before removal.\"}, {\"number\": 45, \"name\": \"Two Worlds, One Test\", \"image\": \"images/45-netflix-worlds.webp\", \"thumbnail\": \"thumbs/45-netflix-worlds.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Netflix\", \"referenceUrl\": \"\", \"collection\": \"netflix\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"A large labeled comparison can be understood at a glance. The same action applies to both worlds, making the controlled comparison easier to follow.\", \"reviewNote\": \"Replace “same connections” with “same degrees”. Shuffles are connected before removal, but can fragment afterwards; replace the “remains connected” outcome with the measured comparison.\", \"correctionNotice\": \"Image correction needed: shuffled networks can fragment after removal; “remains connected” is not the result.\"}, {\"number\": 46, \"name\": \"The Stark Briefing\", \"image\": \"images/46-marvel-stark.webp\", \"thumbnail\": \"thumbs/46-marvel-stark.webp\", \"width\": 768, \"height\": 2048, \"inspiration\": \"Marvel\", \"referenceUrl\": \"\", \"collection\": \"marvel\", \"rationaleLabel\": \"Story & interaction\", \"uxSummary\": \"The mission, action and outcome are presented in a stable sequence. Technical decoration stays around the edges so labels, controls and the actual evidence remain readable.\", \"reviewNote\": \"Define stranded as outside the largest remaining group, rather than necessarily isolated from one another. State that shuffled networks are connected before removal and add the data snapshot date.\"}, {\"number\": 47, \"name\": \"The Fragility Census\", \"kind\": \"data-visualization\", \"collection\": \"data-stories\", \"inspiration\": \"\", \"referenceUrl\": \"\", \"image\": \"data-figures/removal-census.png\", \"thumbnail\": \"thumbs/47-removal-census.webp\", \"width\": 1800, \"height\": 1350, \"alt\": \"277 removal tests: 264 circles represent connected outcomes and 13 squares represent fragmentation. Ranked stranded counts: Spider-Man 5, Black Widow 3, Doctor Strange 2; ten other removals strand one article each.\", \"rationaleLabel\": \"Learning, interaction & UX\", \"uxSummary\": \"264 of 277 removals leave the remaining articles connected. Explore the 13 exceptions. Proposed interaction: Filter the census to its 13 exceptions, select an article and reveal its outcome beside the selection. A clear reset and a searchable list provide alternative routes. UX: The overview comes first. Circles and squares distinguish outcomes without relying on colour. The selected article and its result stay together; methods remain optional.\", \"reviewNote\": \"This is an exact static figure. The filter and selection are proposed interactions. Use a searchable list and visible keyboard focus rather than 277 tiny tab stops.\", \"uxSources\": [{\"title\": \"Source data · week02_all_removals.csv\", \"url\": \"../assets/data/week02_all_removals.csv\"}, {\"title\": \"NN/G: usability heuristics\", \"url\": \"https://www.nngroup.com/articles/ten-usability-heuristics/\"}, {\"title\": \"NN/G: progressive disclosure\", \"url\": \"https://www.nngroup.com/articles/progressive-disclosure/\"}, {\"title\": \"W3C: use of colour\", \"url\": \"https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html\"}]}, {\"number\": 48, \"name\": \"Follow the Fracture\", \"kind\": \"data-visualization\", \"collection\": \"data-stories\", \"inspiration\": \"\", \"referenceUrl\": \"\", \"image\": \"data-figures/black-widow-islands.png\", \"thumbnail\": \"thumbs/48-black-widow-islands.webp\", \"width\": 1800, \"height\": 1200, \"alt\": \"Before: Black Widow connects the collapsed 273-article main group to Blue Eagle and Rockman; Rockman connects to The Witness. After Black Widow is removed, Blue Eagle is alone and Rockman still links to The Witness. Three articles are outside the 273-article main group.\", \"rationaleLabel\": \"Learning, interaction & UX\", \"uxSummary\": \"Black Widow’s removal strands three articles in two groups. Stranded does not necessarily mean alone. Proposed interaction: Switch between Before and After while positions stay fixed. Restore the article to undo the removal, or step through the two stranded groups. UX: A reversible action and stable positions make the consequence easy to follow. Direct labels, outlined groups and a text alternative carry the meaning. Motion is optional.\", \"reviewNote\": \"This is an exact topology schematic with the main group and its 23 links collapsed. Shapes are not proportional to group size. Before/After and Restore are proposed controls; reduced-motion mode should change states instantly.\", \"uxSources\": [{\"title\": \"Source data · week02_resilience.json\", \"url\": \"../assets/data/week02_resilience.json\"}, {\"title\": \"NN/G: usability heuristics\", \"url\": \"https://www.nngroup.com/articles/ten-usability-heuristics/\"}, {\"title\": \"NN/G: progressive disclosure\", \"url\": \"https://www.nngroup.com/articles/progressive-disclosure/\"}, {\"title\": \"W3C: use of colour\", \"url\": \"https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html\"}]}, {\"number\": 49, \"name\": \"A Thousand Possible Worlds\", \"kind\": \"data-visualization\", \"collection\": \"data-stories\", \"inspiration\": \"\", \"referenceUrl\": \"\", \"image\": \"data-figures/shuffled-worlds.png\", \"thumbnail\": \"thumbs/49-shuffled-worlds.webp\", \"width\": 1800, \"height\": 1200, \"alt\": \"Histogram of 1,000 degree-preserving shuffles: 0 stranded in 235 trials, 1 in 350, 2 in 248, 3 in 114, 4 in 44 and 5 in 9. The observed result is 5. Mean shuffled stranding is 1.409.\", \"rationaleLabel\": \"Learning, interaction & UX\", \"uxSummary\": \"Only 9 of 1,000 shuffled trials strand at least five articles after Spider-Man is removed. Proposed interaction: Optionally predict whether five is common or rare, then reveal its position in the distribution. Offer Skip to result and a table of every outcome. UX: One optional choice leads to immediate explanatory feedback. A zero baseline, direct counts, a visible denominator and a hatched tail keep the comparison clear.\", \"reviewNote\": \"This is an exact static histogram. Prediction and reveal are proposed interactions. Shuffles are connected before removal; the 9/1,000 count is descriptive and exploratory, not proof of causation or a calibrated significance claim.\", \"uxSources\": [{\"title\": \"Source data · week02_null_draws.csv\", \"url\": \"../assets/data/week02_null_draws.csv\"}, {\"title\": \"NN/G: usability heuristics\", \"url\": \"https://www.nngroup.com/articles/ten-usability-heuristics/\"}, {\"title\": \"NN/G: progressive disclosure\", \"url\": \"https://www.nngroup.com/articles/progressive-disclosure/\"}, {\"title\": \"W3C: use of colour\", \"url\": \"https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html\"}]}]" }} />
    </>
  );
}
