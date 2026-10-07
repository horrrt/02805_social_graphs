// The start screen every Cold Read round and the campaign share: a short
// numbered list of rules, then one row with an option on the left (the
// tutorial switch, or the campaign's difficulty) and the way in on the right.
import type { ReactNode } from "react";

/** The rules: each a bold lead word and a short line. Details belong to the tutorial. */
export function Rules({ rules }: { rules: [lead: string, rest: ReactNode][] }) {
  return (
    <ol className="cr-rules">
      {rules.map(([lead, rest]) => (
        <li key={lead}>
          <b>{lead}</b> {rest}
        </li>
      ))}
    </ol>
  );
}

/** The start row: `option` on the left, the start button (and anything beside it) on the right. */
export function StartRow({ option, children }: { option: ReactNode; children: ReactNode }) {
  return (
    <div className="cr-start-row">
      {option}
      <div className="cr-start-go">{children}</div>
    </div>
  );
}
