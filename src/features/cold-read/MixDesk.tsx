"use client";
// The island for Mix Desk: loads the data, then renders MixDeskGame
// (MixDeskGame.tsx), which holds the game and takes the data as a prop so tests
// can render it without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { Intro, MixDeskGame } from "./MixDeskGame";
import type { MixDeskData } from "./topics";

const DATA = "play/cold-read/data/mix_desk.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="cr-table" id="mix-desk" aria-label="Mix Desk">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">{note ?? "Fitting eight topics…"}</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<MixDeskData>(hydrated ? asset(DATA) : null);
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("cold-read topics failed", state.error);
  }, [state.status, state.error]);
  if (state.status === "error") return <Placeholder note="The topic model did not load. Reload the page to try again." />;
  return state.data ? <MixDeskGame data={state.data} /> : <Placeholder note="Fitting eight topics…" />;
}

export const MixDesk = island("cold-read/MixDesk", View, Placeholder, { roots: ["#mix-desk"] });
