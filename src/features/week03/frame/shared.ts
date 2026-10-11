// What every week 3 island shares: the store's shape, a reader for it, and the
// hook that runs a painter after a commit. Imported only by islands.
import { useLayoutEffect, type DependencyList } from "react";
import { useThrowToBoundary } from "@/lib/island";
import { useStore, type Store } from "@/lib/useStore";
import { corridor as store } from "../store.js";

export type Style = Record<"variant" | "palette" | "arcs" | "links" | "thickness" | "focus" | "basemap" | "earth" | "dots" | "skin" | "tables", string>;
export type TableSpec = { caption: string; headers: string[]; rows: string[][] };

export type CorridorState = {
  status: "loading" | "ready" | "error";
  message: string | null;
  yearIndex: number | null;
  year: number | null;
  selected: string | null;
  hover: string | null;
  layer: string;
  axisMode: { hist: string; ccdf: string };
  style: Style | null;
  renderer: string;
  paint: number;
  restyles: number;
  tables: Record<string, TableSpec>;
  drawer: string | null;
  edge: { origin: string; dest: string } | null;
};

export const corridor = store as unknown as Store<CorridorState>;

const shallow = (a: unknown, b: unknown) => {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((v, i) => Object.is(v, b[i]));
};

/** useCorridor((s) => s.year) -> the selection; arrays compare item by item. */
export function useCorridor<T>(selector: (s: CorridorState) => T): T {
  return useStore(corridor, selector, shallow);
}

/** True once the data is in and the renderer is installed. */
export function useReady(): boolean {
  return useCorridor((s) => s.status === "ready");
}

/**
 * Run a painter after every commit that changes one of `deps`, once ready.
 * A layout effect, so a host a renderer takes over never shows empty for a frame.
 */
export function usePaint(ready: boolean, paint: () => void, deps: DependencyList) {
  const throwToBoundary = useThrowToBoundary();
  useLayoutEffect(() => {
    if (!ready) return;
    try {
      paint();
    } catch (error) {
      throwToBoundary(error);
    }
    // The caller's dependency list, as useEffect's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ...deps]);
}

// The elements each renderer draws into beside a canvas: the canvas stays in
// the page and the renderer hides it on its first draw (see variants/*.js).
const CHARTS = ["hist", "ccdf", "scatter-between", "scatter-z", "dk-time", "dk-rank", "dk-nordic"];
export const VARIANT_HOSTS: Record<string, Record<string, { suffix: string; svg?: boolean }>> = {
  d3: Object.fromEntries(CHARTS.map((id) => [id, { suffix: "-d3", svg: true }])),
  echarts: Object.fromEntries(CHARTS.map((id) => [id, { suffix: "-ec" }])),
  deck: { "map-canvas": { suffix: "-deck" } },
};
