import { MiniStrip } from "log-log-legends-kit";

// The Week 5 findings strip's minis, as src/scripts/week05-frame.js FINDINGS
// builds them from public/weeks/week05/data/*.json.
export const EnemyLinks = () => (
  <div className="w4-mini">
    <MiniStrip spec={{ domain: [0.2, 0.7], real: 0.54, realLabel: "54%", base: [0.4196, 0.028], baseLabel: "shuffled 42%", aria: "Share of enemy links that join two communities, against shuffled labels" }} />
    <small>Enemy links that join two communities · z = 4.3</small>
  </div>
);

export const CopyingPairs = () => (
  <div className="w4-mini">
    <MiniStrip spec={{ domain: [0, 1], real: 0.9091, realLabel: "20 of 22", ref: 0.0313, refLabel: "all pairs 3.1%", aria: "Share of copying pairs that link to each other, against all pairs" }} />
    <small>Copying pairs that already link · dashed: all pairs of pages</small>
  </div>
);

export const LengthAndFame = () => (
  <div className="w4-mini">
    <MiniStrip spec={{ domain: [-0.2, 1], real: 0.77, realLabel: "0.77", base: [0, 0.057], baseLabel: "shuffled 0.00", aria: "Correlation of log length with log in-degree, against shuffled in-degree" }} />
    <small>Pearson r of log length and log in-degree · band: in-degree shuffled</small>
  </div>
);
