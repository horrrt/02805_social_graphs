"use client";
// The island for Whose Line: loads the data, then renders WhoseLineGame
// (WhoseLineGame.tsx), which holds the game and takes the data as a prop so tests
// can render it without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { Intro, WhoseLineGame } from "./WhoseLineGame";
import type { WhoseLineData } from "./groups";

const DATA = "play/cold-read/data/whose_line.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="cr-table" id="whose-line" aria-label="Whose Line">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">{note ?? "Counting words in eight communities…"}</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<WhoseLineData>(hydrated ? asset(DATA) : null);
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("cold-read communities failed", state.error);
  }, [state.status, state.error]);
  if (state.status === "error") return <Placeholder note="The word counts did not load. Reload the page to try again." />;
  return state.data ? <WhoseLineGame data={state.data} /> : <Placeholder note="Counting words in eight communities…" />;
}

export const WhoseLine = island("cold-read/WhoseLine", View, Placeholder, { roots: ["#whose-line"] });
