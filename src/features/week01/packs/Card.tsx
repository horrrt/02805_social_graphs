// One typographic hero card, as cards.js card() built it on main: the card
// number and component (or ARTICLE in the pack tray), a NEW stamp for a first
// copy, the monogram, the linked name and its link counts, and how many the
// reader holds when the index shows it.
import type { Graph } from "@/features/arcade/data";
import { shortName } from "@/scripts/cabinet.js";

type Node = Graph["nodes"][number];

const metricLabels = { kin: "Incoming links", kout: "Outgoing links" } as const;
const simpleLabels = { kin: "Mentioned by", kout: "Links to" } as const;

export function Card({ node, index = 0, count, fresh = false, simple = false }: { node: Node; index?: number; count?: number; fresh?: boolean; simple?: boolean }) {
  const name = shortName(node) as string;
  const initials = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  return (
    <article className={`hero-card${count === 0 ? " uncollected" : ""}`}>
      <div className="card-id">{`#${String(index + 1).padStart(3, "0")} / ${simple ? "ARTICLE" : node.component.toUpperCase()}`}</div>
      {fresh ? <span className="new-stamp">NEW</span> : null}
      <div className="card-monogram" aria-hidden="true">
        {initials}
      </div>
      <h3>
        <a href={node.url} target="_blank" rel="noopener">
          {name}
        </a>
      </h3>
      {(["kin", "kout"] as const).map((k) => (
        <div key={k} className="stat-pair">
          <span>{simple ? simpleLabels[k] : metricLabels[k]}</span>
          <strong>{node[k]}</strong>
        </div>
      ))}
      {count !== undefined ? <small>{count ? `${count} collected` : "Not collected"}</small> : null}
    </article>
  );
}
