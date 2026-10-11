// "The takeaway": the four headline numbers and the link to Week 2.
export function Results() {
  return (
    <section className="section" id="results">
      <p className="eyebrow">THE TAKEAWAY</p>
      <h2>The last few cards take the longest.</h2>
      <div className="metrics metrics-four">
        <div className="metric">
          <strong>≈1,945</strong>
          <span>five-card packs to finish, on average under our rule</span>
        </div>
        <div className="metric">
          <strong>≈382</strong>
          <span>packs if every card had equal odds</span>
        </div>
        <div className="metric">
          <strong>58</strong>
          <span>cards share the lowest chance of appearing</span>
        </div>
        <div className="metric">
          <strong>107×</strong>
          <span>Spider-Man’s drop rate versus Baymax’s</span>
        </div>
      </div>
      <p className="fine">
        The collection time is a consequence of our chosen odds—not evidence
        that Wikipedia links measure fame.
        {" "}
        <a href="#methods">Check the estimate and its limits.</a>
      </p>
      <p className="story-end">
        Next:
        {" "}
        <a href="../week02/">see what happens when an article disappears →</a>
      </p>
    </section>
  );
}
