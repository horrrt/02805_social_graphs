"use client";
// The island for Hot and Cold: loads the vectors, then renders HotColdGame
// (HotColdGame.tsx), which holds the game and takes the data as a prop so tests
// can render it without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { HotColdGame, Intro } from "./HotColdGame";
import { useVectors } from "./useVectors";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="cr-table" id="hot-cold" aria-label="Hot and Cold">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">{note ?? "Loading 9,000 word vectors…"}</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const { data, error } = useVectors(hydrated);
  useIslandReady(Boolean(data) || Boolean(error));
  useEffect(() => {
    if (error) console.error("cold-read vectors failed", error);
  }, [error]);
  if (error) return <Placeholder note="The word vectors did not load. Reload the page to try again." />;
  return data ? <HotColdGame data={data} /> : <Placeholder />;
}

export const HotCold = island("cold-read/HotCold", View, Placeholder, { roots: ["#hot-cold"] });
