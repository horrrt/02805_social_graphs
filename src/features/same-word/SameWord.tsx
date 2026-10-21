"use client";
// The island for Same Word, Different Worlds: the rounds are in rounds.ts, so
// there is nothing to load and the game renders as soon as it hydrates.
// SameWordGame.tsx holds the game.
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { Intro, SameWordGame } from "./SameWordGame";

function Placeholder() {
  return (
    <section className="cr-table sd-table sw-table" id="same-word" aria-label="Same Word, Different Worlds">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">Setting out the sentences…</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated ? <SameWordGame /> : <Placeholder />;
}

export const SameWord = island("same-word/SameWord", View, Placeholder, { roots: ["#same-word"] });
