// Load a JSON file under public/ after hydration, sharing one request per URL
// with everything else on the page (src/scripts/runtime/data.js). The server
// and the hydration render see "idle", as the server markup has no data. A
// failed load is a state the island renders; with throwOnError it goes to the
// island's boundary instead.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { loadJSON, peekJSON, subscribeJSON } from "@/scripts/runtime/data.js";
import { useThrowToBoundary } from "./island";

export type DataState<T> = { status: "idle" | "loading" | "ready" | "error"; data: T | undefined; error: unknown };

const IDLE: DataState<never> = Object.freeze({ status: "idle", data: undefined, error: undefined });
const idle = () => IDLE;
const quiet = () => () => {};

/** useData(asset("weeks/week05/data/fame.json")) -> { status, data, error }. A null URL or enabled: false stays idle. */
export function useData<T = unknown>(
  url: URL | string | null,
  { enabled = true, throwOnError = false }: { enabled?: boolean; throwOnError?: boolean } = {},
): DataState<T> {
  // Keyed by the href string: asset() returns a new URL object on every render.
  const href = url === null || !enabled ? null : String(url);
  const subscribe = useCallback((fn: () => void) => (href === null ? quiet() : subscribeJSON(href, fn)), [href]);
  const getSnapshot = useCallback(() => (href === null ? IDLE : (peekJSON(href) as DataState<T>)), [href]);
  const state = useSyncExternalStore(subscribe, getSnapshot, idle);

  useEffect(() => {
    // The outcome arrives through subscribeJSON; the rejection is handled here
    // so it never surfaces as an unhandled rejection (spike.md, finding c).
    if (href !== null) loadJSON(href).catch(() => {});
  }, [href]);

  const throwToBoundary = useThrowToBoundary();
  useEffect(() => {
    if (throwOnError && state.status === "error") throwToBoundary(state.error);
  }, [throwOnError, state, throwToBoundary]);

  return state;
}
