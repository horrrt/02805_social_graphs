// Failures Week 5's network views keep for the page, as main kept its rejected
// promises. network.json's, as loadNetwork() kept it: a map that asks after
// the failure gets it at once, and the file is requested once (useNetworkData
// in MarvelMap.tsx).
import { createStore } from "../../../scripts/runtime/store.js";

export const network = createStore({ error: undefined });

// d3 failing to load, kept for the page as graph.js loadD3() kept its rejected
// promise, so no view drawn later asks for it again (NetworkView.tsx).
export const d3Store = createStore({ failed: false });
