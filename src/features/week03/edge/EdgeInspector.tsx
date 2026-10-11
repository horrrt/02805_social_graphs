"use client";
// Section 7: two country pickers, the kind of link between them, its facts and
// a one-line verdict, for the year on the slider. The pickers fill once the
// data is in and open on Spain to Colombia.
import { useMemo } from "react";
import { island } from "@/lib/island";
import { edgeOptions, edgeView } from "@/scripts/corridor.js";
import { rich } from "../Rich";
import { corridor, useCorridor, useReady } from "../frame/shared";

function EdgeView() {
  const ready = useReady();
  const year = useCorridor((s) => s.year);
  const picked = useCorridor((s) => s.edge);
  const choices = useMemo(() => (ready ? edgeOptions() : null), [ready]);
  const edge = picked ?? (choices ? { origin: choices.origin, dest: choices.dest } : null);
  const view = useMemo(() => (edge ? edgeView(edge.origin, edge.dest) : null), [edge?.origin, edge?.dest, year]);
  const options = choices?.options.map((o: { iso3: string; name: string }) => (
    <option key={o.iso3} value={o.iso3}>
      {o.name}
    </option>
  ));
  const pick = (key: "origin" | "dest", value: string) => {
    if (edge) corridor.setState({ edge: { ...edge, [key]: value } });
  };
  return (
    <>
      <div className="edgebar">
        <select aria-label="Origin country" id="edge-origin" value={edge?.origin ?? ""} onChange={(e) => pick("origin", e.target.value)}>
          {options}
        </select>
        {" "}
        <span aria-hidden="true">→</span>
        {" "}
        <select aria-label="Destination country" id="edge-dest" value={edge?.dest ?? ""} onChange={(e) => pick("dest", e.target.value)}>
          {options}
        </select>
        {" "}
        <span className="chip" id="edge-kind">{view?.kind ?? "—"}</span>
      </div>
      <div className="facts" id="edge-facts">{rich(view?.facts)}</div>
      <div className="notice" id="edge-note">
        <span className="ico">💡</span>
        {" "}
        <span>{rich(view?.verdict)}</span>
      </div>
    </>
  );
}

function EdgePlaceholder() {
  return (
    <>
      <div className="edgebar">
        <select aria-label="Origin country" id="edge-origin"></select>
        {" "}
        <span aria-hidden="true">→</span>
        {" "}
        <select aria-label="Destination country" id="edge-dest"></select>
        {" "}
        <span className="chip" id="edge-kind">—</span>
      </div>
      <div className="facts" id="edge-facts"></div>
      <div className="notice" id="edge-note">
        <span className="ico">💡</span>
        {" "}
        <span></span>
      </div>
    </>
  );
}

export const EdgeInspector = island("week03/edge/EdgeInspector", EdgeView, EdgePlaceholder, {
  roots: [".edgebar", "#edge-facts", "#edge-note"],
});
