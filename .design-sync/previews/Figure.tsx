import { EChart, Figure } from "log-log-legends-kit";

// Week 5 relation labels (public/weeks/week05/data/relations.json): the
// chart, its caption, and the numbers behind it in a closed drawer.
const rows = [
  { label: "Teammate", links: 217 },
  { label: "Enemy", links: 202 },
  { label: "Family", links: 116 },
  { label: "Killed", links: 84 },
  { label: "Ally", links: 58 },
];
const option = {
  xAxis: { type: "category", data: rows.map((r) => r.label), name: "label" },
  yAxis: { type: "value", name: "links" },
  series: [{ type: "bar", data: rows.map((r) => r.links), label: { show: true, position: "top" } }],
};
const data = { columns: [{ key: "label", label: "Label" }, { key: "links", label: "Links", num: true }], rows };

export const ChartCaptionAndData = () => (
  <Figure
    chart={<EChart option={option} height={260} />}
    caption="677 of the 1,513 links with a sentence name a relation; teammates and enemies lead."
    data={data}
  />
);

export const ChartOnly = () => <Figure chart={<EChart option={option} height={220} />} />;

export const TableOnly = () => (
  <Figure caption="Links by the relation their sentence names." data={data} label="Table: links by label" />
);
