"use client";
// Section 8's country picker, which is the section's control and the page's
// selection at the same time: choosing here moves the maps, and choosing on a
// map moves here. It shows the country the section last analysed, so a
// selection with no null-year figures leaves it where it was.
import { useMemo, useRef } from "react";
import { island } from "@/lib/island";
import { denmarkView, select, spotlight, spotlightOptions } from "@/scripts/corridor.js";
import { useCorridor, useReady } from "../frame/shared";

function PickerView() {
  const ready = useReady();
  const selected = useCorridor((s) => s.selected);
  const options = useMemo(() => (ready ? spotlightOptions() : null), [ready]);
  const shown = useRef<string | null>(null);
  const now = useMemo(() => (ready && denmarkView() ? spotlight().iso3 : null), [ready, selected]);
  if (now) shown.current = now;
  return (
    <select aria-label="Country to analyse" id="dk-country" value={shown.current ?? ""}
      onChange={(e) => {
        // The picker keeps what the reader chose, even a country section 8
        // cannot analyse.
        shown.current = e.target.value;
        select(e.target.value);
      }}
    >
      {options?.map((o: { iso3: string; name: string }) => (
        <option key={o.iso3} value={o.iso3}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

export const DkPicker = island("week03/denmark/DkPicker", PickerView, () => <select aria-label="Country to analyse" id="dk-country"></select>, {
  roots: ["#dk-country"],
});
