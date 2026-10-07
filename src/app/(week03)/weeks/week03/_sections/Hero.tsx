import { Slot } from "@/features/week03/frame/Slot";
import { Stage, YearLine } from "@/features/week03/hero/Hero";
// 1: the hero globe, its controls and the inspector.
export function Hero() {
  return (
    <>
      {/* 1 ------------------------------------------------------------- */}
      <section className="hero" id="globe">
        <div className="shell">
          <div>
            <p className="eyebrow">Week 3 · Who matters, and why · Go nuts</p>
            <h1>
              Corridor
              <br />
              Control
            </h1>
            <p className="lede">Global migration and flight networks</p>
            <p className="body">
              Two networks. One world. Migration is the UN count of where
              people born in one country now live, and the twin is a network
              of international flight routes, aggregated from airports to
              countries.
            </p>
            <p className="caution">
              Thick corridors are not friendship. They are people.
            </p>
            <p className="body" id="question">
              <b>What we asked:</b>
              {" "}
              which countries broker global migration
              and asylum, and is that the same as which countries simply
              have the most people moving through them?
            </p>
            <div className="keys">
              <span className="key people">
                <i></i>
                {" "}
                Migration (people)
              </span>
              {" "}
              <span className="key access">
                <i></i>
                {" "}
                Flights (access)
              </span>
            </div>
            <YearLine />
          </div>
          <Stage />
          <aside className="panel" id="inspector">
            <h2>Selected country</h2>
            <div className="who">
              <Slot view="sel-flag" as="span" id="sel-flag" className="flag" initial="🌍" />
              {" "}
              <span>
                <Slot view="sel-name" as="strong" id="sel-name" initial="Pick a country" />
                <br />
                {" "}
                <Slot view="sel-codes" as="span" id="sel-codes" className="codes" initial="—" />
              </span>
            </div>
            <Slot view="sel-stats" as="dl" id="sel-stats" className="stats" />
            <div className="corridor-list">
              <h3>→ Where they came from</h3>
              <Slot view="sel-in" as="ol" id="sel-in" />
            </div>
            <div className="corridor-list">
              <h3>→ Where they went</h3>
              <Slot view="sel-out" as="ol" id="sel-out" />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
