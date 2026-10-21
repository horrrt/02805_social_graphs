"use client";
// The island for Semantic Search Detective: the cases are in rounds.ts, so
// there is nothing to load and the game renders as soon as it hydrates.
// SearchDetectiveGame.tsx holds the game.
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { Intro, SearchDetectiveGame } from "./SearchDetectiveGame";

function Placeholder() {
  return (
    <section className="cr-table sd-table" id="search-detective" aria-label="Semantic Search Detective">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">Opening the case files…</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated ? <SearchDetectiveGame /> : <Placeholder />;
}

export const SearchDetective = island("search-detective/SearchDetective", View, Placeholder, { roots: ["#search-detective"] });
