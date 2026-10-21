"use client";
// The island for Topic Tetris's stack edition: loads the same data as the
// first edition, then renders StackGame (StackGame.tsx).
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { StackGame } from "./StackGame";
import type { TopicTetrisData } from "./rules";

const DATA = "play/topic-tetris/data/topic_tetris.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="ts-card" id="topic-tetris-stack" aria-label="Topic Tetris">
      <h2>Topic Tetris</h2>
      <p className="ts-note">{note ?? "Stacking the pages…"}</p>
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
    <div id="topic-tetris-stack">
      <StackGame data={state.data} />
    </div>
  ) : (
    <Placeholder />
  );
}

export const Stack = island("topic-tetris/Stack", View, Placeholder, { roots: ["#topic-tetris-stack"] });
