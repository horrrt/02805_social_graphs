// 7: the edge inspector.
export function Edge() {
  return (
    <>
      {/* 7 ----------------------------------------------------------- */}
      <section className="step" id="edge">
        <div className="card">
          <div className="step-head">
            <span className="num">6</span>
            <h2>Edge inspector</h2>
            <span className="year-tag">(one link at a time)</span>
          </div>
          <div className="edgebar">
            <select aria-label="Origin country" id="edge-origin"></select>
            {" "}
            <span aria-hidden="true">→</span>
            {" "}
            <select aria-label="Destination country" id="edge-dest"></select>
            {" "}
            <span className="chip" id="edge-kind">—</span>
          </div>
          <div className="facts" id="edge-facts"></div>
          <div className="notice" id="edge-note">
            <span className="ico">💡</span>
            {" "}
            <span></span>
          </div>
        </div>
      </section>
    </>
  );
}
