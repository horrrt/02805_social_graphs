import { useState } from "react";
import { SegmentedControl } from "log-log-legends-kit";

// The site's one-of-many pickers: Week 3's axis scale (.axis-modes, with a
// space between buttons), Week 4's fiscal years (.staffing-years) and a
// Week 4 metric toggle. Click a button to press it.
export const AxisScale = () => {
  const [mode, setMode] = useState("loglog");
  return (
    <SegmentedControl
      className="axis-modes"
      ariaLabel="Axis scale for the degree distribution"
      separator=" "
      value={mode}
      onChange={setMode}
      buttons={[
        { value: "loglog", label: "log–log", dataAttr: { name: "mode", value: "loglog" } },
        { value: "loglin", label: "log–lin", dataAttr: { name: "mode", value: "loglin" } },
        { value: "linear", label: "linear", dataAttr: { name: "mode", value: "linear" } },
      ]}
    />
  );
};

export const FiscalYears = () => {
  const [year, setYear] = useState("2025");
  return (
    <SegmentedControl
      className="staffing-years"
      ariaLabel="Fiscal year, October to September"
      value={year}
      onChange={setYear}
      buttons={["2022", "2023", "2024", "2025"].map((y) => ({ value: y, label: y, dataAttr: { name: "year", value: y } })).concat([
        { value: "2026", label: "2026 · Oct–Jun", dataAttr: { name: "year", value: "2026" } },
      ])}
    />
  );
};

export const TwoOptions = () => {
  const [metric, setMetric] = useState("positions");
  return (
    <SegmentedControl
      className="axis-modes"
      ariaLabel="Rank cities by"
      separator=" "
      value={metric}
      onChange={setMetric}
      buttons={[
        { value: "positions", label: "Positions", dataAttr: { name: "place-metric", value: "positions" } },
        { value: "employers", label: "Employers", dataAttr: { name: "place-metric", value: "employers" } },
      ]}
    />
  );
};
