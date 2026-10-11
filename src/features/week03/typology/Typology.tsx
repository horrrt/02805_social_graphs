"use client";
// Section 6's seven role cards and the drawer that lists one role in full.
// The cards follow the year; an example chip shows its country's numbers on
// hover and selects it on a click, and "See all" opens the drawer, built for
// the year on the slider at that moment. A row of the drawer selects its
// country; the × closes it.
import { useMemo, type MouseEvent, type PointerEvent } from "react";
import { island } from "@/lib/island";
import { hideTip, showTip } from "@/lib/ChartTip";
import { select, typologyChipTip, typologyDrawer, typologyView } from "@/scripts/corridor.js";
import { rich } from "../Rich";
import { corridor, useCorridor, useReady } from "../frame/shared";

const closest = (event: { target: EventTarget | null }, selector: string) =>
  (event.target as Element | null)?.closest?.(selector) as HTMLElement | null;

function CardsView() {
  const ready = useReady();
  const year = useCorridor((s) => s.year);
  const cards = useMemo(() => (ready ? typologyView()?.cards ?? null : null), [ready, year]);
  if (cards === null) return <div className="grid5" id="typology-cards"></div>;
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const chip = closest(event, ".eg-chip");
    if (!chip) {
      hideTip();
      return;
    }
    const html = typologyChipTip(chip.dataset.iso3);
    if (html) showTip(event, html);
  };
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const chip = closest(event, ".eg-chip");
    if (chip) {
      select(chip.dataset.iso3);
      return;
    }
    const all = closest(event, ".eg-all");
    if (all) corridor.setState({ drawer: typologyDrawer(all.dataset.type) });
  };
  return (
    <div className="grid5" id="typology-cards" onPointerMove={onPointerMove} onPointerLeave={() => hideTip()} onClick={onClick}>
      {rich(cards)}
    </div>
  );
}

export const TypeCards = island("week03/typology/TypeCards", CardsView, () => <div className="grid5" id="typology-cards"></div>, {
  roots: ["#typology-cards"],
  affects: ["#type-drawer"],
});

function DrawerView() {
  const html = useCorridor((s) => s.drawer);
  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (closest(event, ".drawer-close")) {
      corridor.setState({ drawer: null });
      return;
    }
    const row = closest(event, "tbody tr");
    if (row?.dataset.iso3) select(row.dataset.iso3);
  };
  return (
    <aside aria-label="Countries in this role" className="type-drawer" id="type-drawer" hidden={!html} onClick={onClick}>
      {rich(html)}
    </aside>
  );
}

export const TypeDrawer = island(
  "week03/typology/TypeDrawer",
  DrawerView,
  () => <aside aria-label="Countries in this role" className="type-drawer" id="type-drawer" hidden></aside>,
  { roots: ["#type-drawer"] },
);
