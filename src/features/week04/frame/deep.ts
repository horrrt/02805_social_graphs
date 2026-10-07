// The deep-dive store (store.js) with its type, for the TypeScript files.
import type { Store } from "@/lib/useStore";
import { deep as store } from "./store.js";

export type DeepState = {
  show: Record<string, string | undefined>;
  method: { panel: string; n: number } | null;
  current: string[];
};

export const deep = store as unknown as Store<DeepState>;
export { setCurrent, showBox, wantMethod } from "./store.js";
