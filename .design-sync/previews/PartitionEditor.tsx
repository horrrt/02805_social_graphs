import { PartitionEditor } from "log-log-legends-kit";
import { modularity } from "@/kit/graph-core";
import { KARATE } from "@/features/kit-page/toy-networks";
import { ZACHARY_SPLIT, karateNodes, karatePresets } from "@/features/kit-page/toy-editors";

// The kit page's partition editor on Zachary's karate club, opened on the
// club's own split, with Louvain's Q as the reference line
// (src/features/kit-page/toy-editors.ts).
const presets = karatePresets();
const louvainQ = modularity(KARATE, presets[1].partition) as number;
export const ZacharySplit = () => (
  <PartitionEditor
    nodes={karateNodes(0.62)}
    edges={KARATE}
    groups={["Group 1", "Group 2", "Group 3", "Group 4"]}
    initial={ZACHARY_SPLIT}
    presets={presets}
    reference={{ y: louvainQ, label: `Louvain ${louvainQ.toFixed(3)}` }}
    aria="Zachary's karate club, 34 members, coloured by the groups you give them"
  />
);
