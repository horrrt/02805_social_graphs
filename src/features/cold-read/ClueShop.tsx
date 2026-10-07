"use client";
// The island for Clue Shop: loads the data, then renders ClueShopGame
// (ClueShopGame.tsx), which holds the game and takes the data as a prop so tests
// can render it without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { Intro, ClueShopGame } from "./ClueShopGame";
import type { ClueShopData } from "./rules";

const DATA = "play/cold-read/data/clue_shop.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <section className="cr-table" id="clue-shop" aria-label="Clue Shop">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">{note ?? "Shuffling the decks…"}</p>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<ClueShopData>(hydrated ? asset(DATA) : null);
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("cold-read decks failed", state.error);
  }, [state.status, state.error]);
  if (state.status === "error") return <Placeholder note="The decks did not load. Reload the page to try again." />;
  // The practice menu's hard mode arrives as ?hard=1; read only once hydrated, as the server has no URL.
  const hard = new URLSearchParams(window.location.search).get("hard") === "1";
  return state.data ? <ClueShopGame data={state.data} hard={hard} /> : <Placeholder note="Shuffling the decks…" />;
}

export const ClueShop = island("cold-read/ClueShop", View, Placeholder, { roots: ["#clue-shop"] });
