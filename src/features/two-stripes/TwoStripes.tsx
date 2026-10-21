"use client";
// The island for Two Stripes: loads the data, then renders TwoStripesGame
// (TwoStripesGame.tsx), which holds the game and takes the data as a prop so
// tests can render it without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { Intro, TwoStripesGame } from "./TwoStripesGame";
import type { TwoStripesData } from "./rules";

const DATA = "play/week07/data/two_stripes.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="cr-table ts-table" id="two-stripes" aria-label="Two Stripes">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">{note ?? "Drawing the map…"}</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<TwoStripesData>(hydrated ? asset(DATA) : null);
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("two-stripes data failed", state.error);
  }, [state.status, state.error]);
  if (state.status === "error") return <Placeholder note="The map did not load. Reload the page to try again." />;
  return state.data ? <TwoStripesGame data={state.data} /> : <Placeholder />;
}

export const TwoStripes = island("two-stripes/TwoStripes", View, Placeholder, { roots: ["#two-stripes"] });
