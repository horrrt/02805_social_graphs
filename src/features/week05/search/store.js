// Section 3's search box and query table, as week05-search.js kept them in
// boot()'s closure on main: the query picked from the table or a chip (null
// until the reader picks one: the section shows firstPick()), the search box's
// raw text once the reader has typed (null: the picked query), and the query
// last run with its target (null: the picked query and its target). A pick
// fills the box and runs the picked query, as pick() did. Memory only.
import { createStore } from "../../../scripts/runtime/store.js";

export const search = createStore({ picked: null, text: null, ran: null });

/** A row's or a chip's click. */
export function pick(id) {
  search.setState({ picked: id, text: null, ran: null });
}

/** The search box's change: the raw string. */
export function type(text) {
  search.setState({ text });
}

/** Enter in the box or the Rank pages button: rank `query`, marking `target`. */
export function run(query, target) {
  search.setState({ ran: { query, target } });
}
