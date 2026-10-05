// The shared Marvel map's network.json failure, kept for the page as main's
// loadNetwork() kept its rejected promise: a map that asks after the failure
// gets it at once, and network.json is requested once (useNetworkData in
// MarvelMap.tsx).
import { createStore } from "../../../scripts/runtime/store.js";

export const network = createStore({ error: undefined });
