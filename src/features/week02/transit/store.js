// Marvel Transit's shared state, as transit.js and ride.mjs kept it in their
// closures on main. closure is the select's station; closed is the station
// actually removed (null in normal service); results is the closure whose
// comparison panel shows (null while it is hidden) and restored whether
// "Restore service" replaced its headline. round counts challenge() calls:
// each draws a fresh prediction and resets the ride. The ride keeps its
// journey, the reader's guess and the inspector line; the map its selected and
// hovered line; focus asks the closure select to take focus.
import { createStore } from "../../../scripts/runtime/store.js";

export const transit = createStore({
  closure: "Spider-Man",
  closed: null,
  results: null,
  restored: false,
  round: 0,
  revealed: false,
  journey: 0,
  guess: null,
  rideClosed: false,
  inspector: null,
  line: 1,
  hover: null,
  focus: 0,
});

const RIDE_RESET = { journey: 0, guess: null, rideClosed: false, inspector: null };

/** challenge(): normal service for the selected closure, a fresh prediction and a reset ride. */
export function challenge(closure = transit.getState().closure) {
  transit.setState((s) => ({ closure, closed: null, results: null, restored: false, round: s.round + 1, ...RIDE_RESET }));
}

/** revealSelectedClosure(): close the selected station and show its comparison. */
export function revealClosure() {
  const { closure } = transit.getState();
  transit.setState({ closed: closure, results: closure, restored: false, rideClosed: true, inspector: null });
}

/** "Restore service": the original graph again; the comparison stays with a restored headline. */
export function restoreService() {
  transit.setState({ closed: null, restored: true, rideClosed: false, inspector: null });
}

/** "Try Hulk next" / "Try Spider-Man next": switch the closure, run challenge(), focus the select. */
export function compareStation() {
  const next = transit.getState().closure === "Hulk" ? "Spider-Man" : "Hulk";
  challenge(next);
  transit.setState((s) => ({ focus: s.focus + 1 }));
}

/** A ride answer button: "yes", "no" or "skip". */
export function arrive(answer) {
  transit.setState({ guess: answer === "skip" ? null : answer === "yes" });
  revealClosure();
}

/** The journey select. */
export function pickJourney(journey) {
  transit.setState({ journey, guess: null, inspector: null });
}

/** "Reopen the station": forget the guess and run challenge() again. */
export function reopen() {
  transit.setState({ guess: null });
  challenge();
}

export const inspect = (inspector) => transit.setState({ inspector });
export const markRevealed = () => transit.setState({ revealed: true });
export const selectLine = (line) => transit.setState({ line });
export const hoverLine = (hover) => transit.setState({ hover });
