// One part of a Week 5 section that draws from the section's one file, as
// sections 2, 5, 6 and 7 do: the file after hydration, built into the part by
// `build`, with main's one line ("week05 <name> failed") if it fails. The
// island is ready once the part is built. Pass a `build` defined at module
// scope, so the part is built once per load.
import { useEffect, useMemo } from "react";
import { useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";

/** useSectionPart<Data, TableSpec>(FAME, "fame", outliers) -> { hydrated, part }, part null until built. */
export function useSectionPart<D, T>(path: string, name: string, build: (data: D) => unknown) {
  const hydrated = useHydrated();
  const state = useData<D>(hydrated ? asset(path) : null);
  useEffect(() => {
    if (state.status === "error") console.error(`week05 ${name} failed`, state.error);
  }, [state, name]);
  const part = useMemo(() => (state.data ? (build(state.data) as T) : null), [state.data, build]);
  useIslandReady(part !== null);
  return { hydrated, part };
}
