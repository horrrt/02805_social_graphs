import { useState } from "react";
import { SplitBars } from "log-log-legends-kit";
import { splitParts, splitRows } from "@/features/kit-page/toy";

// The kit page's split bars: toy rows split into parts
// (src/features/kit-page/toy.ts); clicking a name picks it.
export const Toy = () => {
  const [picked, setPicked] = useState("");
  return (
    <>
      <SplitBars rows={splitRows} parts={splitParts} onPick={setPicked} />
      <p className="kit-note">{picked ? `Picked ${picked}.` : "Click a name to pick it."}</p>
    </>
  );
};
