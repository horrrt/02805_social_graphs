"use client";
// "Full screen": puts the whole Cold Read page into the browser's full screen
// (the Fullscreen API) and back. Hidden where the browser doesn't allow it.
import { useEffect, useState } from "react";
import { island } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";

function Placeholder() {
  return <span id="cr-fullscreen" />;
}

function View() {
  const hydrated = useHydrated();
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!hydrated || !document.fullscreenEnabled) return <Placeholder />;
  const toggle = () => {
    const done = on ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    done.catch((e: unknown) => console.error("full screen refused", e));
  };
  return (
    <span id="cr-fullscreen">
      <button type="button" className="cr-full" onClick={toggle} aria-pressed={on}>
        {on ? "Exit full screen" : "Full screen"}
      </button>
    </span>
  );
}

export const Fullscreen = island("cold-read/Fullscreen", View, Placeholder, { roots: ["#cr-fullscreen"] });
