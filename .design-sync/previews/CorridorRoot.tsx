import { CorridorRoot, StripChart, Table } from "log-log-legends-kit";

// The page root (body.corridor and <main class="shell">) with the site's
// section and card classes: the conventions header's example, rendered.
export const PageRoot = () => (
  <CorridorRoot>
    <section className="step">
      <h2>Do enemies cross community lines?</h2>
      <div className="card">
        <h3>Enemy links against shuffled labels</h3>
        <p className="sub">Enemy links cross communities more often than shuffled labels would make them.</p>
        <StripChart
          rows={[{ label: "Enemy links across communities", real: 0.54, realLabel: "54%", base: [0.42, 0.028], baseLabel: "shuffled labels 42%" }]}
          opts={{ domain: [0, 1], ticks: [0, 0.5, 1], fmt: (v: number) => v.toFixed(1), aria: "Enemy link share against shuffled labels" }}
        />
      </div>
      <Table
        caption="Links by kind"
        columns={[{ key: "kind", label: "Kind" }, { key: "links", label: "Links", num: true }]}
        rows={[{ kind: "Teammate", links: 217 }, { kind: "Enemy", links: 202 }, { kind: "Family", links: 116 }]}
      />
    </section>
  </CorridorRoot>
);
