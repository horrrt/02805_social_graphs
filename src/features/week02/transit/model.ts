// What every Week 2 island reads from the two data files, as transit.js set
// it up once both had loaded: the roster by id, the schematic's stations, and
// each article's short name.
import { useMemo } from "react";
import { useArcade, type Graph } from "@/features/arcade/data";
import { shortName } from "@/scripts/cabinet.js";

export type Closure = {
  id: string;
  label: string;
  degree: number;
  null: { mean: number; histogram: { value: number; count: number }[] };
};

export type Transit = {
  stations: { id: string; name: string; degree: number; x: number; y: number }[];
  lines: { id: number; stations: string[] }[];
  closures: Closure[];
  coreNodes: number;
};

export type Model = {
  data: Graph;
  transit: Transit;
  byId: Map<string, Graph["nodes"][number]>;
  name: (id: string) => string;
};

/** The model once both files are in; null before, and when either failed. */
export function useTransit(): Model | null {
  const { graph, extra } = useArcade<Transit>("week02_transit.json");
  return useMemo(() => {
    if (!graph || !extra) return null;
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    return { data: graph, transit: extra, byId, name: (id: string) => shortName(byId.get(id)) as string };
  }, [graph, extra]);
}
