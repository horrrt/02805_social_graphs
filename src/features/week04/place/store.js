// Section 1's shared state, which week04-place.js kept in startPlace()'s
// closure on main: the metric the city ranking uses, the backbone's α (null:
// the data file's default), the map colouring, the employer whose links the
// arc map shows (null: the first), and the metro selected on every chart
// (null: none; the hero then shows the metro with the most filings).
import { createStore } from "../../../scripts/runtime/store.js";

export const place = createStore({ metric: "positions", alpha: null, regionMode: "communities", employer: null, selected: null });
