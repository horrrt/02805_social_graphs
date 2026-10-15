import { ClosureGuess, ClosureResults, ClosureSelect } from "@/features/week02/transit/Closure";
import { RideTicket } from "@/features/week02/transit/Ride";

// "Will your journey survive?": the closure select, the journey ticket, the
// scored prediction and the comparison panel, all islands
// (src/features/week02/transit/) sharing the closure state.
export function TryIt() {
  return (
    <div className="w12-step" id="try-it">
      <header className="w12-opener w12-opener-pick">
        <span aria-hidden="true" className="w12-opener-num">1</span>
        <div>
          <h2 id="try-title">Will your journey survive?</h2>
        </div>
        <label>
          Close a station
          <ClosureSelect />
        </label>
      </header>
      <section aria-labelledby="try-title" className="section interaction-panel">
        <p className="try-help">
          Of the 303 articles, 277 form one connected group: each can reach
          every other through links. We test removals inside this group,
          following links in either direction. “Cut off” means losing the route
          to the largest group left after a removal. Pick a journey below, then
          close a station to see what changes.
        </p>
        <RideTicket />
        <ClosureGuess />
        <ClosureResults />
      </section>
    </div>
  );
}
