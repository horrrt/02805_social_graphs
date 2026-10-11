// The pack machine's collection, as packs.js kept it in its closure on main:
// how many of each card the reader holds, the draws so far, the seed box's raw
// text, what the tray shows (the server's empty line, the last pack, or the
// reset line) and the status line. The random sequence lives beside the store,
// since a generator is not state React compares. Saved in this browser under
// main's key; restore() reads it once both data files are in.
import { createStore } from "../../../scripts/runtime/store.js";
import { rng } from "../../../scripts/arcade-core.mjs";

const KEY = "loglog-packs-20260826";

export const packs = createStore({ counts: {}, pulls: 0, seed: "7", tray: null, status: "", restored: false });

let random = rng(7);

const isSeed = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;

/** Read the saved collection, keeping only cards the roster knows. */
export function restore(knownIds) {
  if (packs.getState().restored) return;
  const known = new Set(knownIds);
  const counts = {};
  let seed = packs.getState().seed;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.counts)
      for (const [id, v] of Object.entries(saved.counts))
        if (known.has(id) && Number.isSafeInteger(v) && v > 0) counts[id] = v;
    if (isSeed(saved?.randomState)) random = rng(saved.randomState);
    if (isSeed(saved?.seed)) seed = String(saved.seed);
  } catch {}
  const pulls = Object.values(counts).reduce((a, b) => a + b, 0);
  packs.setState({ counts, pulls, seed, restored: true });
}

// false when storage refused the write.
function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ counts: state.counts, randomState: random.state(), seed: Number(state.seed) }));
    return true;
  } catch {
    return false;
  }
}

const UNAVAILABLE = " Storage is unavailable; collection lasts for this visit.";

/** Open a pack: packSize weighted draws over the roster in order. */
export function openPack(nodes, weightById, packSize, totalWeight) {
  const state = packs.getState();
  const counts = { ...state.counts };
  let pulls = state.pulls;
  const draws = [];
  for (let i = 0; i < packSize; i++) {
    let ticket = random() * totalWeight;
    let n = nodes.at(-1);
    for (const item of nodes) {
      ticket -= weightById.get(item.id);
      if (ticket < 0) {
        n = item;
        break;
      }
    }
    const fresh = !counts[n.id];
    counts[n.id] = (counts[n.id] || 0) + 1;
    pulls++;
    draws.push({ n, fresh });
  }
  let status = `Pack ${Math.floor(pulls / packSize)}: ${draws.filter((d) => d.fresh).length} new cards. ${draws.map((d) => d.n.name).join(", ")}.`;
  if (!save({ counts, seed: state.seed })) status += UNAVAILABLE;
  packs.setState({ counts, pulls, tray: draws, status });
}

/** The seed box's raw text. */
export function typeSeed(seed) {
  packs.setState({ seed });
}

/** A committed, valid seed: a new random sequence, keeping the collection. */
export function reseed() {
  const state = packs.getState();
  random = rng(Number(state.seed));
  save(state);
  packs.setState({ status: `New random sequence, seed ${state.seed}. Your collection is kept.` });
}

/** Reset collection: clear the cards and restart the sequence from the seed. */
export function reset() {
  const state = packs.getState();
  random = rng(Number(state.seed));
  save({ counts: {}, seed: state.seed });
  packs.setState({ counts: {}, pulls: 0, tray: "reset", status: "Collection reset." });
}
