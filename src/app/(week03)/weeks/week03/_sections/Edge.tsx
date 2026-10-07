import { EdgeInspector } from "@/features/week03/edge/EdgeInspector";
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
          <EdgeInspector />
        </div>
      </section>
    </>
  );
}
