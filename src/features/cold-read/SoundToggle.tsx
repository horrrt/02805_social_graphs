"use client";
// The speaker button beside "Full screen": sound is on until the reader turns
// it off, and the choice is kept in this browser (sound.ts).
import { useEffect } from "react";
import { island } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { useStore } from "@/lib/useStore";
import { loadSound, setSound, soundStore } from "./sound";

function Placeholder() {
  return <span id="cr-sound" />;
}

function View() {
  const hydrated = useHydrated();
  const on = useStore(soundStore, (s: { on: boolean }) => s.on);
  useEffect(loadSound, []);
  if (!hydrated) return <Placeholder />;
  const label = on ? "Mute sound" : "Turn sound on";
  return (
    <span id="cr-sound">
      <button type="button" className="cr-full cr-sound" onClick={() => setSound(!on)} aria-pressed={!on} aria-label={label} title={label}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
          {on ? (
            <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>
    </span>
  );
}

export const SoundToggle = island("cold-read/SoundToggle", View, Placeholder, { roots: ["#cr-sound"] });
