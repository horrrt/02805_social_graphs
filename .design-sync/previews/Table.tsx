import { Table } from "log-log-legends-kit";

// Week 5 tables from public/weeks/week05/data/: relation labels
// (relations.json) and the consensus communities (communities.json).
export const RelationLabels = () => (
  <Table
    caption="Links by the relation their sentence names"
    columns={[
      { key: "label", label: "Label" },
      { key: "arcs", label: "Links", num: true },
      { key: "share", label: "Share", num: true },
    ]}
    rows={[
      { label: "Teammate", arcs: 217, share: 0.143 },
      { label: "Enemy", arcs: 202, share: 0.134 },
      { label: "Family", arcs: 116, share: 0.077 },
      { label: "Killed", arcs: 84, share: 0.056 },
      { label: "Ally", arcs: 58, share: 0.038 },
      { label: "Unlabelled", arcs: 836, share: 0.553 },
    ]}
  />
);

export const Communities = () => (
  <Table
    caption="The largest consensus communities and their hubs"
    columns={[
      { key: "label", label: "Community" },
      { key: "hubs", label: "Next hubs" },
      { key: "size", label: "Pages", num: true },
    ]}
    rows={[
      { label: "Hulk", hubs: "She-Hulk, Hercules", size: 40 },
      { label: "Wolverine", hubs: "Jean Grey, Phoenix", size: 40 },
      { label: "Spider-Man", hubs: "Venom, Spider-Woman (Gwen Stacy)", size: 38 },
      { label: "Scarlet Witch", hubs: "Human Torch (android), U.S. Agent", size: 38 },
      { label: "Quasar", hubs: "Nova (Richard Rider), Captain Marvel", size: 35 },
    ]}
  />
);

export const Empty = () => (
  <Table caption="A table with no rows yet" columns={[{ key: "word", label: "Word" }, { key: "count", label: "Count", num: true }]} rows={[]} />
);
