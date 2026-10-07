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

/** Every file in `paths` at once: the data in order once all have loaded, else null. */
export function useW4All(paths: string[], label: string, { enabled = true }: { enabled?: boolean } = {}): any[] | null {
  // `paths` never changes length for a mounted component, so the hooks keep their order.
  const states = paths.map((p) => useW4Data(p, label, { enabled }));
  return states.every((s) => s.status === "ready") ? states.map((s) => s.data) : null;
}
