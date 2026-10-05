// network.json's failure, kept for the page as loadNetwork() kept its rejected
// promise: a map that asks after the failure gets it at once, and the file is
// requested once (useNetworkData in MarvelMap.tsx).
import { createStore } from "../../../scripts/runtime/store.js";

export const network = createStore({ error: undefined });
