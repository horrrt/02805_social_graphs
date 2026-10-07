"use client";
// The island for Hot and Cold: loads the data, then renders HotColdGame
// (HotColdGame.tsx), which holds the game and takes the data as a prop so tests
// can render it without a page.
import { useEffect, useMemo, useState } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { HotColdGame, Intro } from "./HotColdGame";
import { type HotColdMeta, prepare } from "./vectors";

const META = "play/cold-read/data/hot_cold.json";
const BIN = "play/cold-read/data/hot_cold.bin";

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

/** The vectors: the JSON through the site's loader, the int8 rows through fetch. */
function useVectors(enabled: boolean) {
  const meta = useData<HotColdMeta>(enabled ? asset(META) : null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [failed, setFailed] = useState<unknown>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    fetch(asset(BIN))
      .then((r) => {
        if (!r.ok) throw new Error(`${BIN}: HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((b) => live && setBuffer(b))
      .catch((e: unknown) => live && setFailed(e));
    return () => {
      live = false;
    };
  }, [enabled]);
  const data = useMemo(() => (meta.data && buffer ? prepare(meta.data, buffer) : null), [meta.data, buffer]);
  const error = meta.status === "error" ? meta.error : failed;
  return { data, error };
}

function View() {
  const hydrated = useHydrated();
  const { data, error } = useVectors(hydrated);
  useIslandReady(Boolean(data) || Boolean(error));
  useEffect(() => {
    if (error) console.error("cold-read vectors failed", error);
  }, [error]);
  if (error) return <Placeholder note="The word vectors did not load. Reload the page to try again." />;
  return data ? <HotColdGame data={data} /> : <Placeholder note="Loading 9,000 word vectors…" />;
}

export const HotCold = island("cold-read/HotCold", View, Placeholder, { roots: ["#hot-cold"] });
