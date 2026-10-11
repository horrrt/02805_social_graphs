// The arcade's data files, as cabinet.js load() fetched them on main: one
// request per file under assets/data/, after hydration, shared with every
// island that reads the same file. Each week page loads the snapshot
// (arcade_graph.json) and its own file together, as Promise.all did.
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";

/** main's one error line for a file that would not load. */
export const LOAD_ERROR = "The snapshot could not load. Reload the page to try again.";

export type Graph = {
  nodes: { id: string; name: string; url: string; kin: number; kout: number; degree: number; betweenness: number; clustering: number; community: number; component: string }[];
  links: [string, string][];
};

/** useArcade("week01_packs.json") -> { graph, extra } once both are in, failed when either failed. */
export function useArcade<T = any>(file: string): { graph: Graph | null; extra: T | null; failed: boolean } {
  const hydrated = useHydrated();
  const graph = useData<Graph>(hydrated ? asset("assets/data/arcade_graph.json") : null);
  const extra = useData<T>(hydrated ? asset("assets/data/" + file) : null);
  const ready = graph.status === "ready" && extra.status === "ready";
  return {
    graph: ready ? (graph.data ?? null) : null,
    extra: ready ? (extra.data ?? null) : null,
    failed: graph.status === "error" || extra.status === "error",
  };
}
