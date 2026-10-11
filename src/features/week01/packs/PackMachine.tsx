"use client";
// The pack machine (#pack-machine) that packs.js wired on main. The controls
// (open a pack, the seed box, reset) stay disabled as the server sent them
// until both data files are in and the saved collection is restored. The
// results under them (status, tray, insight and the three counts) follow the
// collection in store.js.
import { useEffect, useRef } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useStore } from "@/lib/useStore";
import { expectedDistinct } from "@/scripts/collection-model.mjs";
import { Card } from "./Card";
import { type Model, usePacks } from "./model";
import { openPack, packs, reseed, reset, restore, typeSeed } from "./store.js";

type Node = { id: string; name: string };
type State = { counts: Record<string, number>; pulls: number; seed: string; tray: null | "reset" | { n: Node; fresh: boolean }[]; status: string; restored: boolean };
const all = (s: State) => s;

// ---- the controls ------------------------------------------------------------------

function Controls({ live = false }: { live?: boolean }) {
  const model = usePacksIfLive(live);
  const state = useStore(packs, all);
  const seedRef = useRef<HTMLInputElement>(null);
  const ready = model !== null && state.restored;
  useIslandReady(ready);

  useEffect(() => {
    if (model) restore(model.data.nodes.map((n) => n.id));
  }, [model]);

  // main listened for the seed box's change (a commit), not every keystroke.
  useEffect(() => {
    const input = seedRef.current;
    if (!live || !input) return;
    const controller = new AbortController();
    input.addEventListener(
      "change",
      () => {
        if (!input.checkValidity()) {
          input.reportValidity();
          return;
        }
        reseed();
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [live]);

  const open = () => {
    if (!model || !seedRef.current?.reportValidity()) return;
    openPack(model.data.nodes, model.weightById, model.packs.packSize, model.packs.totalWeight);
  };

  return (
    <div className="control-row">
      <button id="open-pack" disabled={!ready} onClick={ready ? open : undefined}>Open a pack ↗</button>
      <details className="pack-options">
        <summary>Change or restart the draw</summary>
        <div className="control-row">
          <label>
            Random seed
            <input
              ref={seedRef}
              id="pack-seed"
              max="4294967295"
              min="0"
              step="1"
              type="number"
              value={state.seed}
              onChange={(e) => typeSeed(e.target.value)}
            />
          </label>
          <button
            className="quiet"
            id="reset-packs"
            onClick={
              ready
                ? () => {
                    if (confirm("Clear your collected cards? Your prediction log will stay.")) reset();
                  }
                : undefined
            }
          >
            Reset collection
          </button>
        </div>
        <p className="fine">
          A random seed chooses a repeatable sequence of draws. Changing it
          keeps your collection; Reset collection clears your cards. The
          chance per draw is (incoming links + 1) / 2,087.
        </p>
      </details>
    </div>
  );
}

// Hooks run in the same order in both renders; the placeholder never loads data.
function usePacksIfLive(live: boolean) {
  const model = usePacks();
  return live ? model : null;
}

function ControlsView() {
  return <Controls live />;
}

function ControlsHost() {
  return <Controls />;
}

export const PackControls = island("week01/packs/Controls", ControlsView, ControlsHost, { roots: ["#pack-machine > .control-row"] });

// ---- the results ------------------------------------------------------------------

function ResultsHost() {
  return (
    <>
      <p className="status" id="pack-status" role="status"></p>
      <div className="pack-tray" id="pack-tray">
        <p className="empty">Open a pack to see your next five cards.</p>
      </div>
      <p className="collection-insight" id="collection-insight" aria-live="polite"></p>
      <Metrics unique="0 / 303" pulls="0" rare="0 / 58" />
    </>
  );
}

function Metrics({ unique, pulls, rare }: { unique: string; pulls: string; rare: string }) {
  return (
    <div className="metrics">
      <div className="metric">
        <strong id="unique-count">{unique}</strong>
        <span>different cards collected</span>
      </div>
      <div className="metric">
        <strong id="pull-count">{pulls}</strong>
        <span>cards drawn, including duplicates</span>
      </div>
      <div className="metric">
        <strong id="rare-count">{rare}</strong>
        <span>rarest cards collected</span>
      </div>
    </div>
  );
}

function ResultsView() {
  const model = usePacks();
  const state = useStore(packs, all);
  const ready = model !== null && state.restored;
  useIslandReady(ready);
  if (!model || !ready) return <ResultsHost />;
  const { data, packs: p, N, weightById, minWeight, weightedOdds, uniformOdds } = model;
  const { counts, pulls, tray, status } = state;
  const distinct = Object.keys(counts).length;
  const repeats = pulls - distinct;
  const baseline = pulls
    ? ` On average, ${pulls} draws would find about ${expectedDistinct(uniformOdds, pulls).toFixed(1)} different cards under equal odds, or about ${expectedDistinct(weightedOdds, pulls).toFixed(1)} under our weighted rule.`
    : "";
  const insight = pulls
    ? `Your ${pulls} draws found ${distinct} different ${distinct === 1 ? "card" : "cards"} and ${repeats} ${repeats === 1 ? "repeat" : "repeats"}.${baseline} ${pulls < 20 ? "A few packs can vary a lot. Try more, then compare the two draw rules below." : "This is one collection, not an average. Compare the two draw rules below to see the longer-term effect."}`
    : "Watch how many cards are new and how many repeat. You do not need to finish the collection to see the idea.";
  const rare = data.nodes.filter((n) => weightById.get(n.id) === minWeight && counts[n.id]).length;
  return (
    <>
      <p className="status" id="pack-status" role="status">
        {status}
      </p>
      <div className="pack-tray" id="pack-tray">
        {tray === null ? (
          <p className="empty">Open a pack to see your next five cards.</p>
        ) : tray === "reset" ? (
          <p className="empty">Your next five cards are waiting.</p>
        ) : (
          tray.map(({ n, fresh }, i) => {
            const node = n as Model["data"]["nodes"][number];
            return <Card key={i} node={node} index={data.nodes.indexOf(node)} fresh={fresh} simple />;
          })
        )}
      </div>
      <p className="collection-insight" id="collection-insight" aria-live="polite">
        {insight}
      </p>
      <Metrics unique={`${distinct} / ${N}`} pulls={pulls.toLocaleString()} rare={`${rare} / ${p.collector.minimumRateCards}`} />
    </>
  );
}

export const PackResults = island("week01/packs/Results", ResultsView, ResultsHost, {
  roots: ["#pack-status", "#pack-tray", "#collection-insight", "#pack-machine > .metrics"],
});
