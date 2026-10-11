import { ClosureGuess, ClosureResults, ClosureSelect } from "@/features/week02/transit/Closure";
import { RideTicket } from "@/features/week02/transit/Ride";

// "Will your journey survive?": the closure select, the journey ticket, the
// scored prediction and the comparison panel, all islands
// (src/features/week02/transit/) sharing the closure state.
export function TryIt() {
  return (
    <section className="section interaction-panel" id="try-it">
      <div className="section-head">
        <h2>Will your journey survive?</h2>
        <label>
          Close a station
          <ClosureSelect />
        </label>
      </div>
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
  );
}
