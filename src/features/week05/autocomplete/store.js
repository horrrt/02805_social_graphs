// Section 4's visitor quiz, as week05-autocomplete.js kept it in its module on
// main: the fake shown (index), the group the select shows (selection, the
// select's raw value), the guesses locked so far (fake id -> community_index,
// fixed once revealed) and the scoreboard's note. Memory only: a reload clears
// it, and nothing is stored or sent.
import { createStore } from "../../../scripts/runtime/store.js";
import { PICK_FIRST, fakeAt } from "../../../scripts/week05-autocomplete.js";

export const quiz = createStore({ index: 0, selection: "", locked: new Map(), note: null });

/** show(i): the fake at i, wrapping, with its locked guess or no pick, and no note. */
export function show(data, i) {
  const { index, fake } = fakeAt(data, i);
  const { locked } = quiz.getState();
  quiz.setState({ index, selection: locked.has(fake.id) ? String(locked.get(fake.id)) : "", note: null });
}

/** The select's change. */
export function pick(selection) {
  quiz.setState({ selection });
}

/**
 * The Lock button: locks the picked group for the fake shown and reveals it
 * ("locked"), or leaves the note asking for a pick ("empty"). A fake already
 * locked does nothing (null).
 */
export function lock(data) {
  const { index, selection, locked } = quiz.getState();
  const fake = data.fakes[index];
  if (locked.has(fake.id)) return null;
  if (selection === "") {
    quiz.setState({ note: PICK_FIRST });
    return "empty";
  }
  quiz.setState({ locked: new Map(locked).set(fake.id, Number(selection)) });
  show(data, index);
  return "locked";
}
