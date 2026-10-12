import { RankedBars } from "log-log-legends-kit";
import { rankedBase, rankedNames } from "@/features/kit-page/toy";

// The kit page's distinctive-words list for a toy page
// (src/features/kit-page/toy.ts), names kept.
export const NamesKept = () => (
  <RankedBars title="Most distinctive words on a toy page" colHeads={["On page", "Pages with it"]} rows={rankedBase.map((r) => ({ ...r, muted: false }))} />
);

// The same list with the names greyed out.
export const NamesGreyed = () => (
  <RankedBars title="Most distinctive words on a toy page" colHeads={["On page", "Pages with it"]} rows={rankedBase.map((r) => ({ ...r, muted: rankedNames.has(r.key) }))} />
);
