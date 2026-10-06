import { FindingRow, FindingsStrip } from "log-log-legends-kit";

// Week 4's strip under the hero: the key, then one row per section.
export const Week4 = () => (
  <FindingsStrip id="findings" label="Five findings" caps="Five sections, five findings" real="the real network">
    <FindingRow num="1" title="Where the hiring is" finding="1" href="#place" link="Section 1 →">
      Cities group by who hires there, not by region, and no single link holds the map together.
    </FindingRow>
    <FindingRow num="2" title="Which jobs go together" finding="2" href="#jobs" link="Section 2 →">
      Employers reveal bundles of work.
    </FindingRow>
    <FindingRow num="3" title="Who staffs whom" finding="3" href="#who" link="Section 3 →">
      One certified H-1B filing in five names a client company as the worksite. Yet a client that changes vendor stays inside its group far more often than chance.
    </FindingRow>
    <FindingRow num="4" title="Without the biggest firms" finding="4" href="#footprint" link="Section 4 →">
      Take out the largest filers, Amazon above all, and the metro groups start to follow Census regions; the job clusters shift but hold.
    </FindingRow>
    <FindingRow num="5" title="Beyond the three networks" finding="5" href="#beyond" link="Section 5 →">
      The section 3 groups barely show in lawyers or green cards; the outsourcing firms stand out in the wage levels they file.
    </FindingRow>
  </FindingsStrip>
);

// The post template's strip: two rows and its own "real" key.
export const Template = () => (
  <FindingsStrip id="findings" label="Findings" caps="Two sections, two findings" real="the real data">
    <FindingRow num="1" title="First section's title" finding="1" href="#first" link="Section 1 →">
      The first section's answer in one sentence, with its number and its baseline.
    </FindingRow>
    <FindingRow num="2" title="Second section's title" finding="2" href="#second" link="Section 2 →">
      The second section's answer in one sentence, with its number and its baseline.
    </FindingRow>
  </FindingsStrip>
);
