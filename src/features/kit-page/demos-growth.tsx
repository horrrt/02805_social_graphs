"use client";
// The growth batch's demos on the kit page: a replay in arrival order, the
// nonlinear-attachment lab, the components as small multiples and the
// friendship paradox, on toy BA graphs and toy debut years from
// toy-growth.ts. One island per [data-demo] host, wrapped by DemoGrowth as
// demos.tsx wraps its own.
import { useState, type ReactNode } from "react";
import { ComponentGallery, FriendshipParadox, GrowthLab, GrowthReplay } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { GALLERY_N, galleryEdges, galleryNames, labRefShare, labReference, paradoxNets, replayCard, replayModes, type ParadoxNet } from "./toy-growth";

function useShown() {
  const hydrated = useHydrated();
  useIslandReady(hydrated);
  return hydrated;
}

function ReplayView() {
  const shown = useShown();
  return <div data-demo="gr-replay">{shown ? <GrowthReplay modes={replayModes} card={replayCard} seed={3} /> : null}</div>;
}

function LabView() {
  const shown = useShown();
  return <div data-demo="gr-lab">{shown ? <GrowthLab reference={labReference} refShare={labRefShare} sizes={[100, 300, 1000]} sweepNs={[300, 1000]} seed={2} /> : null}</div>;
}

function GalleryView() {
  const shown = useShown();
  return <div data-demo="gr-gallery">{shown ? <ComponentGallery n={GALLERY_N} edges={galleryEdges} labels={galleryNames} max={11} /> : null}</div>;
}

function ParadoxView() {
  const shown = useShown();
  const [net, setNet] = useState<ParadoxNet>("scale-free");
  return (
    <div data-demo="gr-paradox">
      {shown ? (
        <>
          <div className="kit-controls">
            <span className="w5-chips" role="group" aria-label="Network">
              {(Object.keys(paradoxNets) as ParadoxNet[]).map((k) => (
                <button key={k} type="button" aria-pressed={k === net} onClick={() => setNet(k)}>
                  {k}
                </button>
              ))}
            </span>
            <span className="kit-note">{paradoxNets[net].note}</span>
          </div>
          <FriendshipParadox key={net} n={300} edges={paradoxNets[net].edges} seed={4} />
        </>
      ) : null}
    </div>
  );
}

const Empty = (demo: string) =>
  function Host() {
    return <div data-demo={demo}></div>;
  };

const at = (demo: string) => ({ roots: [`[data-demo="${demo}"]`] });

// One island per demo, so a fault in one leaves the others alone.
const DEMOS = {
  "gr-replay": island("kit/demos/GrReplayDemo", ReplayView, Empty("gr-replay"), at("gr-replay")),
  "gr-lab": island("kit/demos/GrLabDemo", LabView, Empty("gr-lab"), at("gr-lab")),
  "gr-gallery": island("kit/demos/GrGalleryDemo", GalleryView, Empty("gr-gallery"), at("gr-gallery")),
  "gr-paradox": island("kit/demos/GrParadoxDemo", ParadoxView, Empty("gr-paradox"), at("gr-paradox")),
};

export type GrowthDemoName = keyof typeof DEMOS;

function View({ demo }: { demo: GrowthDemoName }): ReactNode {
  const Shown = DEMOS[demo];
  return <Shown />;
}

function Placeholder({ demo }: { demo: GrowthDemoName }) {
  return <div data-demo={demo}></div>;
}

/** <DemoGrowth demo="gr-replay" />: one host of the growth batch on the kit page. */
export const DemoGrowth = island("kit/demos/DemoGrowth", View, Placeholder, {
  roots: (Object.keys(DEMOS) as GrowthDemoName[]).map((demo) => `[data-demo="${demo}"]`),
});
