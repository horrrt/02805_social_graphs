// What every Week 1 island derives from the two data files, as packs.js
// computed it once both had loaded: each card's weight, the minimum weight the
// 58 rarest cards share, and the per-draw odds under both rules.
import { useMemo } from "react";
import { useArcade, type Graph } from "@/features/arcade/data";

export type Packs = {
  packSize: number;
  totalWeight: number;
  cards: { id: string; weight: number; probability: number }[];
  histogram: { degree: number; count: number }[];
  collector: { expectedPacksRounded: number; minimumRateCards: number };
};

export type Model = {
  data: Graph;
  packs: Packs;
  N: number;
  maxDegree: number;
  weightById: Map<string, number>;
  minWeight: number;
  weightedOdds: number[];
  uniformOdds: number[];
};

/** The model once both files are in; null before, and when either failed. */
export function usePacks(): Model | null {
  const { graph, extra } = useArcade<Packs>("week01_packs.json");
  return useMemo(() => {
    if (!graph || !extra) return null;
    return {
      data: graph,
      packs: extra,
      N: graph.nodes.length,
      maxDegree: Math.max(...extra.histogram.map((row) => row.degree)),
      weightById: new Map(extra.cards.map((c) => [c.id, c.weight])),
      minWeight: Math.min(...extra.cards.map((c) => c.weight)),
      weightedOdds: extra.cards.map((c) => c.probability),
      uniformOdds: graph.nodes.map(() => 1 / graph.nodes.length),
    };
  }, [graph, extra]);
}
