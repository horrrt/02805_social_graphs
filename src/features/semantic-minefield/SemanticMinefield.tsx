"use client";
// The island for Semantic Minefield: the characters and rounds are in the
// bundle, so there is nothing to load and the game renders as soon as it
// hydrates. SemanticMinefieldGame.tsx holds the game.
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { Intro, SemanticMinefieldGame } from "./SemanticMinefieldGame";

function Placeholder() {
  return (
    <section className="cr-table sm-table" id="semantic-minefield" aria-label="Semantic Minefield">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">Laying the minefield…</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated ? <SemanticMinefieldGame /> : <Placeholder />;
}

export const SemanticMinefield = island("semantic-minefield/SemanticMinefield", View, Placeholder, { roots: ["#semantic-minefield"] });
