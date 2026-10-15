import { EdgeInspector } from "@/features/week03/edge/EdgeInspector";
// 7: the edge inspector.
export function Edge() {
  return (
    <>
      {/* 7 ----------------------------------------------------------- */}
      <section className="step" id="edge">
        <header className="w4-opener">
          <span aria-hidden="true" className="w4-opener-num">6</span>
          <div>
            <h2>Edge inspector</h2>
            <p className="w3-scope">(one link at a time)</p>
          </div>
        </header>
        <div className="card w4-card">
          <EdgeInspector />
        </div>
      </section>
    </>
  );
}
