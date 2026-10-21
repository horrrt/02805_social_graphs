"use client";
// The island for Sentiment Trap: loads the instruments' readings, then renders
// SentimentTrapGame (SentimentTrapGame.tsx), which takes the data as a prop so
// tests can render it without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import type { SentimentTrapData } from "./data";
import { Intro, SentimentTrapGame } from "./SentimentTrapGame";

const DATA = "play/week07/data/sentiment_trap.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="cr-table st-table" id="sentiment-trap" aria-label="Sentiment Trap">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">{note ?? "Reading the scores…"}</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<SentimentTrapData>(hydrated ? asset(DATA) : null);
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("sentiment-trap data failed", state.error);
  }, [state.status, state.error]);
  if (state.status === "error") return <Placeholder note="The scores did not load. Reload the page to try again." />;
  return state.data ? <SentimentTrapGame data={state.data} /> : <Placeholder />;
}

export const SentimentTrap = island("sentiment-trap/SentimentTrap", View, Placeholder, { roots: ["#sentiment-trap"] });
