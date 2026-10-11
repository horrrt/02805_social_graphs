// The parts a chart island renders beside its canvas: the closed table of the
// numbers a canvas painter drew, and the host a renderer variant draws into
// instead. Imported only by islands.
import { createElement } from "react";
import { registerHost } from "@/scripts/corridor.js";
import { rich } from "../Rich";
import { useCorridor, useReady, VARIANT_HOSTS, type TableSpec } from "./shared";

export function ChartTable({ id, spec }: { id: string; spec: TableSpec }) {
  return (
    <details className="chart-table" id={`${id}-table`}>
      <summary>{`Table${spec.caption ? `: ${spec.caption}` : ""}`}</summary>
      <div className="chart-table-scroll">
        <table>
          <thead>
            <tr>
              {spec.headers.map((h, i) =>
                i ? (
                  <th key={i} scope="col" className="num">
                    {rich(h)}
                  </th>
                ) : (
                  <th key={i} scope="col">
                    {rich(h)}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, i) =>
                  i ? (
                    <td key={i} className="num">
                      {rich(cell)}
                    </td>
                  ) : (
                    <th key={i} scope="row">
                      {rich(cell)}
                    </th>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** The host a renderer variant draws into beside canvas `id`, once the engine has started. */
export function VariantHost({ id }: { id: string }) {
  const ready = useReady();
  const renderer = useCorridor((s) => s.renderer);
  const host = ready ? VARIANT_HOSTS[renderer]?.[id] : undefined;
  if (!host) return null;
  const hostId = `${id}${host.suffix}`;
  return createElement(host.svg ? "svg" : "div", { id: hostId, ref: (el: Element | null) => registerHost(hostId, el) });
}
