"use client";
// The island for Topic Tetris: loads the data, then renders TopicTetrisGame
// (TopicTetrisGame.tsx), which takes the data as a prop so tests can render it
// without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { Intro, TopicTetrisGame } from "./TopicTetrisGame";
import type { TopicTetrisData } from "./rules";

const DATA = "play/topic-tetris/data/topic_tetris.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="cr-table tt-start" id="topic-tetris" aria-label="Topic Tetris">
      <div className="tt-intro">
        <Intro />
      </div>
      <div className="cr-start">
        <p className="cr-note">{note ?? "Stacking the pages…"}</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<TopicTetrisData>(hydrated ? asset(DATA) : null);
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("topic-tetris data failed", state.error);
  }, [state.status, state.error]);
  if (state.status === "error") return <Placeholder note="The pages did not load. Reload the page to try again." />;
  return state.data ? (
    <div id="topic-tetris">
      <TopicTetrisGame data={state.data} />
    </div>
  ) : (
    <Placeholder />
  );
}

export const TopicTetris = island("topic-tetris/TopicTetris", View, Placeholder, { roots: ["#topic-tetris"] });
