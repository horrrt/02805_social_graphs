"use client";
// The island for the toolbox: loads public/toolbox/data/toolbox.json, then
// renders ToolboxView (ToolboxView.tsx), which takes the data as a prop so
// tests can render it without a page.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import type { ToolboxData } from "./filters";
import { ToolboxView } from "./ToolboxView";

const DATA = "toolbox/data/toolbox.json";

function Placeholder({ note }: { note?: string }) {
  return (
    <div className="tb" id="toolbox">
      <p className="tb-note">{note ?? "Loading the games, materials, components and libraries…"}</p>
    </div>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<ToolboxData>(hydrated ? asset(DATA) : null);
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("toolbox data failed", state.error);
  }, [state.status, state.error]);
  if (state.status === "error") return <Placeholder note="The toolbox data did not load. Reload the page to try again." />;
  return state.data ? <ToolboxView data={state.data} /> : <Placeholder />;
}

export const Toolbox = island("toolbox/Toolbox", View, Placeholder, { roots: ["#toolbox"] });
