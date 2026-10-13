"use client";
// What is left of the arcade's chrome on weeks 1 and 2. The data link and the
// LOGBOOK button and dialog are gone; this island only keeps body.unlocked,
// which a reveal or a failed load sets in the arcade store.
import { island } from "@/lib/island";
import { useBodyClass } from "@/lib/useBody";
import { useStore } from "@/lib/useStore";
import { logbook } from "./store.js";

function UnlockView() {
  const unlocked = useStore(logbook, (s: { unlocked: boolean }) => s.unlocked);
  useBodyClass("unlocked", unlocked);
  return null;
}

const UnlockHost = () => null;

export const ArcadeUnlock = island("arcade/chrome/Unlock", UnlockView, UnlockHost, { roots: "none" });
