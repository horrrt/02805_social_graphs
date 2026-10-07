// A row of labelled numbers under an explorable: the label small and
// uppercase, the value large, an optional note under it. Plain HTML, so it
// renders on the server. Style: .kit-readouts in post.css (shared with
// VectorAngle's readouts), .kit-readout-sub for the note.
import type { ReactNode } from "react";

export type ReadoutItem = { label: ReactNode; value: ReactNode; sub?: ReactNode };

/** <Readouts items={[{ label: "Nodes", value: 43 }, { label: "Biggest hub", value: "k = 17", sub: "node 3" }]} /> */
export default function Readouts({ items, live = false, label }: { items: ReadoutItem[]; live?: boolean; label?: string }) {
  if (items.length === 0) return null;
  return (
    <dl className="kit-readouts" aria-live={live ? "polite" : undefined} aria-label={label}>
      {items.map((item, i) => (
        <div key={i}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.sub !== undefined && item.sub !== null ? <dd className="kit-readout-sub">{item.sub}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
