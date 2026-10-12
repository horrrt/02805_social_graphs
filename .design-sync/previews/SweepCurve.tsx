import { SweepCurve } from "log-log-legends-kit";
import { sweepPoints } from "@/features/kit-page/toy";

const fmt = (v: number) => String(Math.round(v * 10) / 10);

// The kit page's sweep: toy linked-of-ten against the share of names kept
// (src/features/kit-page/toy.ts), with ten random pages as the reference.
export const AllNames = () => (
  <SweepCurve points={sweepPoints} current={100} refLine={{ y: 0.31, label: "ten random pages" }} xLabel="names kept (%)" yLabel="linked of ten" domain={{ x: [0, 100], y: [0, 4.5] }} fmt={fmt} />
);

// The slider moved to 40%.
export const FortyPercent = () => (
  <SweepCurve points={sweepPoints} current={40} refLine={{ y: 0.31, label: "ten random pages" }} xLabel="names kept (%)" yLabel="linked of ten" domain={{ x: [0, 100], y: [0, 4.5] }} fmt={fmt} />
);
