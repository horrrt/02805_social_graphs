// Week 4's data files, loaded after hydration through the page's one cache
// (useData). A failed load logs one line naming the part that needed it, as
// each of main's page scripts logged its own.
import { useEffect } from "react";
import { useData, type DataState } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";

export const W4 = {
  place: "assets/data/week04_place.json",
  usa: "assets/data/usa.json",
  data: (name: string) => `weeks/week04/data/${name}.json`,
};

/** useW4Data<Place>(W4.place, "place") -> { status, data, error }; null stays idle. */
export function useW4Data<T = any>(path: string | null, label: string, { enabled = true }: { enabled?: boolean } = {}): DataState<T> {
  const hydrated = useHydrated();
  const state = useData<T>(hydrated && path && enabled ? asset(path) : null);
  useEffect(() => {
    if (state.status === "error") console.error(label, state.error);
  }, [state, label]);
  return state;
}

export type W4All = { status: "loading" | "ready" | "error"; data: any[] | null };

/** Every file in `paths` at once: { status, data }, the data in order once all
 * have loaded. The status is "error" as soon as any file fails, so a part can
 * say so instead of staying empty. */
export function useW4All(paths: string[], label: string, { enabled = true }: { enabled?: boolean } = {}): W4All {
  // `paths` never changes length for a mounted component, so the hooks keep their order.
  const states = paths.map((p) => useW4Data(p, label, { enabled }));
  if (states.some((s) => s.status === "error")) return { status: "error", data: null };
  if (states.every((s) => s.status === "ready")) return { status: "ready", data: states.map((s) => s.data) };
  return { status: "loading", data: null };
}
