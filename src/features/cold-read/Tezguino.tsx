"use client";
// The island for Tezgüino: loads the data, then renders TezguinoGame
// (TezguinoGame.tsx), which holds the game and takes the data as a prop so
// tests can render it without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import type { TezguinoData } from "./contexts";
import { Intro, TezguinoGame } from "./TezguinoGame";

const DATA = "play/cold-read/data/tezguino.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="cr-table" id="tezguino" aria-label="Tezgüino">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">{note ?? "Counting who stands next to whom…"}</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<TezguinoData>(hydrated ? asset(DATA) : null);
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("cold-read contexts failed", state.error);
  }, [state.status, state.error]);
  if (state.status === "error") return <Placeholder note="The context counts did not load. Reload the page to try again." />;
  return state.data ? <TezguinoGame data={state.data} /> : <Placeholder />;
}

export const Tezguino = island("cold-read/Tezguino", View, Placeholder, { roots: ["#tezguino"] });
