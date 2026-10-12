import { Readouts } from "log-log-legends-kit";
import { modularity } from "@/kit/graph-core";
import { KARATE, KARATE_SPLIT } from "@/features/kit-page/toy-games";

// The readout row under the kit page's network demos, here for Zachary's
// karate club and the split the club really made
// (src/features/kit-page/toy-games.ts); Q is computed from that split.
const q = modularity(KARATE, KARATE_SPLIT) as number;
const mr = KARATE_SPLIT.filter((g) => g === 0).length;
export const KarateClub = () => (
  <Readouts
    items={[
      { label: "Members", value: "34" },
      { label: "Friendships", value: String(KARATE.length) },
      { label: "With Mr Hi", value: String(mr), sub: `${34 - mr} with the Officer` },
      { label: "Modularity Q", value: q.toFixed(3), sub: "of the real split" },
    ]}
  />
);
