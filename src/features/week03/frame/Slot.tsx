"use client";
// The page's text slots: the elements corridor.js filled with textContent or
// innerHTML once the data was in and again whenever the year, the selection or
// the map layer moved. Each renders the server's text until the engine has
// started, then what its view says. A view that returns null leaves the slot
// as it was, as the old early returns did.
import { createElement, useMemo, useRef, type ReactNode } from "react";
import { island } from "@/lib/island";
import {
  betweennessNote,
  bridgeView,
  denmarkView,
  inspectorView,
  netNote,
  prestigeNotes,
  prestigeView,
  tailsTag,
  twinView,
  typologyView,
} from "@/scripts/corridor.js";
import { rich } from "../Rich";
import { useCorridor, type CorridorState } from "./shared";

type View = (s: Pick<CorridorState, "layer">) => string | null | undefined;

const VIEWS: Record<string, View> = {
  "sel-flag": () => inspectorView()?.flag,
  "sel-name": () => inspectorView()?.name,
  "sel-codes": () => inspectorView()?.codes,
  "sel-stats": () => inspectorView()?.stats,
  "sel-in": () => inspectorView()?.into,
  "sel-out": () => inspectorView()?.out,
  "tails-tag": () => tailsTag(),
  "between-note": () => betweennessNote(),
  "sc-flag": () => bridgeView()?.flag,
  "sc-name": () => bridgeView()?.name,
  "sc-codes": () => bridgeView()?.codes,
  "sc-stats": () => bridgeView()?.stats,
  "prestige-note": () => prestigeNotes()?.note,
  "prestige-movers": () => prestigeNotes()?.movers,
  "pr-flag": () => prestigeView()?.flag,
  "pr-name": () => prestigeView()?.name,
  "pr-codes": () => prestigeView()?.codes,
  "pr-stats": () => prestigeView()?.stats,
  "pr-sources": () => prestigeView()?.sources,
  "pr-note": () => prestigeView()?.note,
  "null-tag": () => twinView().nullTag,
  "twin-tag": () => twinView().twinTag,
  "z-top": () => twinView().top,
  "z-floor": () => twinView().floor,
  "twin-stats": () => twinView().stats,
  "flight-caveat": () => twinView().caveat,
  "null-method": () => twinView().method,
  // Written while the map shows the net layer, and cleared when it leaves it.
  "net-note": (s) => (s.layer === "net" ? netNote() : ""),
  "typology-tag": () => typologyView()?.tag,
  "typology-strip": () => typologyView()?.strip,
  "typology-note": () => typologyView()?.note,
  "dk-name": () => denmarkView()?.name,
  "dk-head": () => denmarkView()?.head,
  "dk-in": () => denmarkView()?.into,
  "dk-out": () => denmarkView()?.out,
  "dk-verdict": () => denmarkView()?.verdict,
};

type Tag = "span" | "strong" | "p" | "dl" | "ol" | "div" | "table";
type SlotProps = { view: string; as: Tag; id?: string; className?: string; label?: string; initial?: string };

// The view's HTML once the engine has started, else the server's text; a null
// view keeps whatever the slot last showed.
function useView(view: string, initial: ReactNode): ReactNode {
  const deps = useCorridor((s) => [s.status, s.year, s.selected, s.layer] as const);
  const last = useRef<{ html: string | null }>({ html: null });
  return useMemo(() => {
    if (deps[0] !== "ready") return initial;
    const html = VIEWS[view]({ layer: deps[3] });
    if (html !== null && html !== undefined) last.current.html = html;
    return last.current.html === null ? initial : rich(last.current.html);
    // The view reads the engine, which moves with these four.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, initial, ...deps]);
}

function SlotView({ view, as, id, className, label, initial }: SlotProps) {
  const content = useView(view, initial ?? null);
  return createElement(as, { id, className, "aria-label": label }, content);
}

function SlotPlaceholder({ as, id, className, label, initial }: SlotProps) {
  return createElement(as, { id, className, "aria-label": label }, initial ?? null);
}

/** <Slot view="sel-name" as="strong" id="sel-name" initial="Pick a country" /> */
export const Slot = island("week03/frame/Slot", SlotView, SlotPlaceholder, {
  roots: Object.keys(VIEWS)
    .filter((key) => !["dk-name", "dk-in", "dk-out", "dk-verdict"].includes(key))
    .map((key) => `#${key}`)
    .concat([".dk-name"]),
});

// A notice whose last span the engine wrote: Denmark's verdict. The edge
// inspector's renders its own.
type NoticeProps = { id: string; view: string; gap?: boolean };

function NoticeView({ id, view, gap }: NoticeProps) {
  const content = useView(view, null);
  return (
    <div className="notice" id={id}>
      <span className="ico">💡</span>
      {gap ? " " : null}
      <span>{content}</span>
    </div>
  );
}

function NoticePlaceholder({ id, gap }: NoticeProps) {
  return (
    <div className="notice" id={id}>
      <span className="ico">💡</span>
      {gap ? " " : null}
      <span></span>
    </div>
  );
}

export const Notice = island("week03/frame/Notice", NoticeView, NoticePlaceholder, { roots: ["#dk-verdict"] });

// Section 8's two ego tables: the caption the server rendered, then the
// engine's caption and rows.
type EgoProps = { id: "dk-in" | "dk-out"; lead: string };

function EgoCaption({ lead }: { lead: string }) {
  return (
    <caption>
      {lead}
      {" "}
      <span className="dk-name">Denmark</span>
    </caption>
  );
}

function EgoView({ id, lead }: EgoProps) {
  const content = useView(id, <EgoCaption lead={lead} />);
  return (
    <table className="ego" id={id}>
      {content}
    </table>
  );
}

function EgoPlaceholder({ id, lead }: EgoProps) {
  return (
    <table className="ego" id={id}>
      <EgoCaption lead={lead} />
    </table>
  );
}

export const EgoTable = island("week03/frame/EgoTable", EgoView, EgoPlaceholder, { roots: ["#dk-in", "#dk-out"] });
