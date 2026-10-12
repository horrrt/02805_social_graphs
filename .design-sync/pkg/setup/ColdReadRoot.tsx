import type { ReactNode } from "react";

/**
 * The root for Cold Read, the Week 6 game. It swaps the `corridor` class on
 * <body> for `cold-read`, where the game's palette, its rarity, heat and topic
 * colours and its scoreboard type live, and renders its children as they are.
 * Wrap a round (ClueShop, WhoseLine, MixDesk, Tezguino, HotCold) or the whole
 * Campaign in `Frame`, the game's own header and footer, inside it. Rounds
 * load their decks from the live site. Use it once, instead of CorridorRoot.
 */
export default function ColdReadRoot({ children }: { children?: ReactNode }) {
  if (typeof document !== "undefined") {
    document.body.classList.remove("corridor");
    document.body.classList.add("cold-read");
  }
  return <>{children}</>;
}
