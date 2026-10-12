import { Dendrogram } from "log-log-legends-kit";
import { bestCut, levels, modularityTerms } from "@/kit/dendro-core.js";
import { KARATE } from "@/features/kit-page/toy-networks";
import { karateTree } from "@/features/kit-page/toy-editors";

// The kit page's dendrogram: Girvan–Newman's tree of Zachary's karate club
// (src/features/kit-page/toy-editors.ts), with modularity Q of each cut
// beside it.
const fmt = (v: number) => v.toLocaleString("en-GB", { maximumFractionDigits: 3, minimumFractionDigits: 3 });
const { merges, tree } = karateTree();
const term = modularityTerms(KARATE);
const qOf = (clusters: number[]) => clusters.reduce((s, c) => s + term(tree.members[c]), 0);
const points = (levels(tree) as { h: number; clusters: number[] }[]).map((l) => [l.h, qOf(l.clusters)] as [number, number]);
const best = points.reduce((b, p) => (p[1] > b[1] ? p : b), points[0]);
const metric = { label: "modularity Q of the cut", points, best: { y: best[1], label: `best single cut, Q ${fmt(best[1])}` } };
const labels = Array.from({ length: 34 }, (_, i) => String(i));

// Cut at the best height branch by branch, as the kit page opens it.
const bestClusters = bestCut(tree, term).clusters as number[];
export const BestCut = () => (
  <Dendrogram merges={merges} n={34} labels={labels} cut={{ clusters: bestClusters }} metric={metric} yLabel="share of links left" aria="Girvan–Newman's tree of the karate club, at its best cut" />
);
