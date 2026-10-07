"use client";
// Section 2's two axis switches. The two heavy-tail charts can be read on
// three scales; the buttons are in the server markup, so they work before the
// data lands, and a press repaints its chart (the chart follows store.axisMode).
import { Fragment } from "react";
import { island } from "@/lib/island";
import { setAxisMode } from "@/scripts/corridor.js";
import { useCorridor } from "../frame/shared";

const MODES = [
  ["loglog", "log–log"],
  ["semilog", "log–linear"],
  ["linear", "linear"],
] as const;

type Props = { chart: "hist" | "ccdf"; label: string };

function AxisModesView({ chart, label }: Props) {
  const mode = useCorridor((s) => s.axisMode[chart]);
  return (
    <div className="axis-modes" data-chart={chart} role="group" aria-label={label}>
      {MODES.map(([value, text], i) => (
        <Fragment key={value}>
          {i ? " " : null}
          <button
            aria-pressed={String(mode === value) as "true" | "false"}
            data-mode={value}
            type="button"
            onClick={() => setAxisMode(chart, value)}
          >
            {text}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

function AxisModesPlaceholder({ chart, label }: Props) {
  return (
    <div className="axis-modes" data-chart={chart} role="group" aria-label={label}>
      {MODES.map(([value, text], i) => (
        <Fragment key={value}>
          {i ? " " : null}
          <button aria-pressed={value === "loglog" ? "true" : "false"} data-mode={value} type="button">
            {text}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

/** <AxisModes chart="hist" label="Axis scale for the degree distribution" /> */
export const AxisModes = island("week03/tails/AxisModes", AxisModesView, AxisModesPlaceholder, { roots: [".axis-modes"] });
