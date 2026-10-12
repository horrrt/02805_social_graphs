import { useState } from "react";
import { AxisMap } from "log-log-legends-kit";
import { mapAxes, mapHighlight, mapPoints } from "@/features/kit-page/toy";

// The kit page's axis map: 40 toy points between four named ends, three of
// them highlighted (src/features/kit-page/toy.ts).
export const FourEnds = () => {
  const [, setPicked] = useState("");
  return <AxisMap points={mapPoints} axes={mapAxes} highlight={mapHighlight} find="" onPick={setPicked} height={340} />;
};
