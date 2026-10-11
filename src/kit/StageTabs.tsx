// A numbered strip of stages, one tab each, and the picked stage's card
// under it: its title and a record of labelled fields, and any body. Tabs
// follow the ARIA tabs pattern with a roving tabindex: ← and → move between
// stages (wrapping), Home and End jump to the ends, and the focused tab is
// the shown one. The strip wraps onto more rows instead of scrolling. With
// `selected` and `onSelect` the parent holds the choice. Style: .kit-stages in
// post.css.
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type Stage = { key: string; title: ReactNode; fields?: Record<string, ReactNode>; body?: ReactNode };

/** <StageTabs stages={[{ key: "counts", title: "Counts", fields: { Representation: "frequency table" } }]} label="From counts to LLMs" /> */
export default function StageTabs({
  stages,
  initial = 0,
  selected,
  onSelect,
  label,
}: {
  stages: Stage[];
  initial?: number;
  selected?: number;
  onSelect?: (i: number) => void;
  label: string;
}) {
  const id = useId();
  const [own, setOwn] = useState(initial);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (stages.length === 0) return <p className="kit-empty">No stages to show.</p>;
  const raw = selected ?? own;
  const at = Math.max(0, Math.min(stages.length - 1, Number.isInteger(raw) ? raw : 0));
  const pick = (i: number) => {
    setOwn(i);
    onSelect?.(i);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = stages.length - 1;
    const to = e.key === "ArrowRight" ? (at === last ? 0 : at + 1) : e.key === "ArrowLeft" ? (at === 0 ? last : at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (to === null) return;
    e.preventDefault();
    pick(to);
    tabs.current[to]?.focus();
  };
  const stage = stages[at];
  const fields = Object.entries(stage.fields ?? {});
  return (
    <div className="kit-stages">
      <div className="kit-stages-strip" role="tablist" aria-label={label}>
        {stages.map((s, i) => (
          <button
            key={s.key}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === at}
            aria-controls={`${id}-panel`}
            tabIndex={i === at ? 0 : -1}
            onClick={() => pick(i)}
            onKeyDown={onKeyDown}
          >
            <span className="kit-stages-n">{i + 1}</span>
            <span className="kit-stages-title">{s.title}</span>
          </button>
        ))}
      </div>
      <div className="kit-stages-card" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${at}`} tabIndex={0}>
        <h4>
          {at + 1} · {stage.title}
        </h4>
        {fields.length ? (
          <dl>
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {stage.body ? <div className="kit-stages-body">{stage.body}</div> : null}
      </div>
    </div>
  );
}
