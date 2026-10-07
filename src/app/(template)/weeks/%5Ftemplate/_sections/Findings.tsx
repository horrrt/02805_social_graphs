import { FindingsStrip } from "@/components/post/FindingsStrip";
import { Chart } from "@/features/template/charts";
import { FindingRow } from "@/components/post/FindingRow";

// Findings: one row per section, each with its answer against the baseline.
export function Findings() {
  return (
    <FindingsStrip id="findings" label="Findings" caps="Two sections, two findings" real="the real data">
      <FindingRow num="1" title="First section's title" mini={<Chart chart="1" />} href="#first" link="Section 1 →">
        The first section's answer in one sentence, with its number and its baseline.
      </FindingRow>
      <FindingRow num="2" title="Second section's title" mini={<Chart chart="2" />} href="#second" link="Section 2 →">
        The second section's answer in one sentence, with its number and its baseline.
      </FindingRow>
    </FindingsStrip>
  );
}
