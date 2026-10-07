// The marks of one drawn network view, as graph.js networkView() builds them
// from networkLayout()'s rows: the same elements, classes and attributes.
// Nodes and lines are memoised, so lighting a node re-renders only the marks
// whose class changes.
//
// pointerenter and pointerleave come from pointerover and pointerout here:
// React builds its onPointerEnter from the out event of the element the
// pointer left, and a redraw removes that element without one, so the first
// mark under a still pointer after a redraw would get no enter, where main's
// native listener gets one.
import { memo, type KeyboardEvent, type PointerEvent, type MouseEvent, type FocusEvent } from "react";
import { Tipped } from "../HoverTipHost";
import type { HubRow, LineRow, NetId, NodeRow } from "./layout";

/** What a node does: move (movable), and light, describe and pin (explore). */
export type NodeEvents = {
  move?: (mark: NodeRow) => void;
  enter?: (id: NetId, e: PointerEvent) => void;
  hover?: (id: NetId, e: PointerEvent) => void;
  leave?: () => void;
  pin?: (id: NetId, e: MouseEvent) => void;
  click?: (id: NetId) => void;
};

export type HubEvents = {
  show: (hub: HubRow, pin: boolean, el: Element) => void;
  leave: () => void;
};

const pressed = (e: KeyboardEvent) => e.key === "Enter" || e.key === " ";

// An over or out event that crosses the element's own edge: enter or leave.
const crosses = (e: PointerEvent) => !(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget));

/** A line, with its title (data-tip inside a HoverTipHost); under weights, the wider hover line after it. */
export const LineMark = memo(function LineMark({ row, hi, onHit }: { row: LineRow; hi: boolean; onHit?: (key: string) => void }) {
  return (
    <>
      <Tipped tag="line" tip={row.title} {...row.at} className={hi ? `${row.cls} gv-hi` : row.cls} strokeWidth={row.width} />
      {row.hit !== null ? (
        <line {...row.at} className="gv-hit" onPointerOver={onHit ? (e) => crosses(e) && onHit(row.link.key) : undefined}>
          <title>{row.hit}</title>
        </line>
      ) : null}
    </>
  );
});

/** A node: its disc or two halves, its inside label, badge and title. */
export const NodeMark = memo(function NodeMark({
  mark,
  cls,
  fs,
  events,
}: {
  mark: NodeRow;
  cls: string | undefined;
  fs: (role: string) => number;
  events: NodeEvents;
}) {
  const { move, enter, hover, leave, pin, click } = events;
  const movable = mark.movable !== null && move;
  // A node the page listens to (onNodeClick) and cannot move is a button too.
  const pickable = !movable && click;
  const onClick = (e: MouseEvent) => {
    if (movable) move(mark);
    pin?.(mark.id, e);
    click?.(mark.id);
  };
  const onKeyDown = movable
    ? (e: KeyboardEvent) => {
        if (pressed(e)) {
          e.preventDefault();
          move(mark);
          click?.(mark.id);
        }
      }
    : pickable
      ? (e: KeyboardEvent) => {
          if (pressed(e)) {
            e.preventDefault();
            click(mark.id);
          }
        }
      : undefined;
  return (
    <g
      data-id={mark.id}
      className={cls}
      data-movable={movable ? "" : undefined}
      data-pick={pickable ? "" : undefined}
      tabIndex={movable || pickable ? 0 : undefined}
      role={movable || pickable ? "button" : undefined}
      aria-label={movable ? (mark.movable ?? undefined) : pickable ? (mark.name ?? String(mark.id)) : undefined}
      onClick={movable || pin || click ? onClick : undefined}
      onKeyDown={onKeyDown}
      onPointerOver={enter ? (e) => crosses(e) && enter(mark.id, e) : undefined}
      onPointerMove={hover ? (e) => hover(mark.id, e) : undefined}
      onPointerOut={leave ? (e) => crosses(e) && leave() : undefined}
    >
      {mark.shapes.map((s, i) =>
        "d" in s ? <path key={i} d={s.d} className={s.cls} /> : <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className={s.cls} style={s.fill ? { fill: s.fill } : undefined} />,
      )}
      {mark.label ? (
        <text x={mark.label.x} y={mark.label.y} fontSize={fs(mark.label.role)} textAnchor="middle" className={mark.label.cls}>
          {mark.label.text}
        </text>
      ) : null}
      {mark.badge ? (
        <g className="gv-badge">
          <circle cx={mark.badge.cx} cy={mark.badge.cy} r={mark.badge.r} />
          <text x={mark.badge.x} y={mark.badge.y} fontSize={fs("caption") - 1.5} textAnchor="middle">
            {mark.badge.text}
          </text>
        </g>
      ) : null}
      {mark.title !== null ? <title>{mark.title}</title> : null}
    </g>
  );
});

/** A hub's ring, leader line and name pill; under explore a button that lights its group. */
export function HubMark({ hub, hi, fs, events }: { hub: HubRow; hi: boolean; fs: (role: string) => number; events: HubEvents | null }) {
  const show = (pin: boolean) => (e: MouseEvent | FocusEvent) => events?.show(hub, pin, e.currentTarget);
  return (
    <g
      className={hi ? "gv-hub gv-hi" : "gv-hub"}
      data-hub={hub.id}
      tabIndex={events ? 0 : undefined}
      role={events ? "button" : undefined}
      aria-label={events ? hub.aria : undefined}
      onClick={events ? show(true) : undefined}
      onKeyDown={
        events
          ? (e) => {
              if (pressed(e)) {
                e.preventDefault();
                events.show(hub, true, e.currentTarget);
              }
            }
          : undefined
      }
      onFocus={events ? show(false) : undefined}
      onBlur={events ? () => events.leave() : undefined}
    >
      <circle cx={hub.ring.cx} cy={hub.ring.cy} r={hub.ring.r} className={hub.ring.cls} />
      {hub.leader ? <line {...hub.leader} className="gv-link gv-leader" /> : null}
      <rect {...hub.pill} className="gv-pill" />
      <text x={hub.name.x} y={hub.name.y} fontSize={fs("small")} className="gv-name">
        {hub.name.text}
      </text>
    </g>
  );
}
