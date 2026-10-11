// Cold Read's sound switch: on by default, the reader's choice kept in this
// browser. Every sound in the game asks soundOn() first.
import { createStore } from "@/scripts/runtime/store.js";

const KEY = "cold-read:sound";

export const soundStore = createStore({ on: true });

/** Reads the kept choice; call it after hydration (it touches localStorage). */
export function loadSound() {
  try {
    if (localStorage.getItem(KEY) === "off") soundStore.setState({ on: false });
  } catch {
    // Storage blocked: sound stays on for this visit.
  }
}

export function setSound(on: boolean) {
  soundStore.setState({ on });
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the choice lasts until the page closes.
  }
}

export const soundOn = (): boolean => soundStore.getState().on;
