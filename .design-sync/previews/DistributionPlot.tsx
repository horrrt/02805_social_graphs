import { DistributionPlot, type DistView } from "log-log-legends-kit";
import { degreeSets, poissonRef, topNodes } from "@/features/kit-page/toy-distributions";

// The kit page's degree demo: in-degrees of 300 toy nodes against the
// Poisson of the same mean, with the tail named
// (src/features/kit-page/toy-distributions.ts).
const ks = degreeSets.in;
export const Degree = () => (
  <DistributionPlot
    series={[{ key: "in", name: "in-degree of 300 toy nodes", ks }]}
    refs={(v: DistView) => poissonRef(ks, v)}
    top={{ title: "The tail, by name", items: topNodes(ks) }}
    aria="Toy degree distribution against the Poisson of the same mean"
  />
);
