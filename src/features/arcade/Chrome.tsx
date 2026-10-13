"use client";
// The arcade's controls that cabinet.js setupChrome() painted in its own
// header on main. The header is gone: "The data" and the LOGBOOK button now
// sit in the site's top bar (PostTopbar's tools, #arcade-tools), which
// reads the log once hydrated and again when another tab writes it. "The
// data" opens the home page at its top (#top), where its old #network link
// landed once that section was gone. The #logbook dialog lists the first
// guesses saved in this browser and owns body.unlocked.
import { useEffect, useRef } from "react";
import { island } from "@/lib/island";
import { useBodyClass } from "@/lib/useBody";
import { useHydrated } from "@/lib/useHydrated";
import { useStore } from "@/lib/useStore";
import { download, summarise, url } from "@/scripts/cabinet.js";
import { liveWeeks, weekLabel } from "@/scripts/weeks.js";
import { closeLogbook, exportLog, loadLog, logbook, openLogbook, resetLog } from "./store.js";

type Attempt = { id: string; week: number | null; score: number; guess: number; answer: number };
type State = { attempts: Record<string, Attempt>; loaded: boolean; open: boolean; blocked: boolean; unlocked: boolean };

const all = (s: State) => s;

function useProgress() {
  const state = useStore(logbook, all);
  const weeks = liveWeeks() as { n: number; cabinet: { name: string } }[];
  const p = summarise(
    Object.values(state.attempts),
    weeks.map((w) => w.n),
  ) as { attempts: Attempt[]; rows: { week: number; attempts: Attempt[] }[]; free: Attempt[]; weeks: number; total: number; score: number };
  return { state, weeks, p };
}

// ---- the bar's tools --------------------------------------------------------------

function ToolsHost() {
  return (
    <span className="arcade-tools" id="arcade-tools">
      <a href="../../#top">The data</a>
      <button type="button" data-progress id="open-logbook">{`LOGBOOK 0/${liveWeeks().length}`}</button>
    </span>
  );
}

function ToolsView() {
  const hydrated = useHydrated();
  const { state, p } = useProgress();
  // cabinet.js read the log at setupChrome(); here once hydrated, and again on every storage event.
  useEffect(() => {
    loadLog();
    const controller = new AbortController();
    window.addEventListener("storage", () => loadLog(), { signal: controller.signal });
    return () => controller.abort();
  }, []);
  if (!hydrated) return <ToolsHost />;
  return (
    <span className="arcade-tools" id="arcade-tools">
      <a href={url("#top")}>The data</a>
      <button type="button" data-progress id="open-logbook" onClick={openLogbook}>
        {`LOGBOOK ${state.loaded ? p.weeks : 0}/${p.total}`}
      </button>
    </span>
  );
}

export const ArcadeTools = island("arcade/chrome/Tools", ToolsView, ToolsHost, { roots: ["#arcade-tools"] });

// ---- the logbook dialog -------------------------------------------------------------

function Row({ label, rows }: { label: string; rows: Attempt[] }) {
  return (
    <li>
      <span>{label}</span>
      <strong>{rows.length ? `${Math.round(rows.reduce((s, a) => s + a.score, 0) / rows.length)}/100` : "Not played"}</strong>
      <small>{`${rows.length} first ${rows.length === 1 ? "guess" : "guesses"}`}</small>
    </li>
  );
}

function LogbookView() {
  const hydrated = useHydrated();
  const { state, weeks, p } = useProgress();
  const ref = useRef<HTMLDialogElement>(null);
  useBodyClass("unlocked", state.unlocked);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (state.open && !dialog.open) dialog.showModal();
    else if (!state.open && dialog.open) dialog.close();
  }, [state.open, hydrated]);

  if (!hydrated) return null;
  return (
    <dialog id="logbook" aria-labelledby="logbook-title" ref={ref} onClose={closeLogbook}>
      <div className="dialog-top">
        <h2 id="logbook-title">Your predictions</h2>
        <button id="close-logbook" onClick={closeLogbook}>Close</button>
      </div>
      <p id="score-mean">{p.attempts.length ? `${p.score}/100 across ${p.attempts.length} first guesses` : "Your first guess starts the story."}</p>
      <ol className="score-list" id="score-list">
        {weeks.map((w) => (
          <Row key={w.n} label={`${weekLabel(w.n)} · ${w.cabinet.name}`} rows={p.rows.find((r) => r.week === w.n)?.attempts ?? []} />
        ))}
        <Row label="FREE PLAY" rows={p.free} />
      </ol>
      <p className="fine">
        Scores reward numerical prediction accuracy. This is a game score, not a formal measure of calibration. Only your first guess per challenge counts; practice replays cannot overwrite it.
      </p>
      <p className="fine" id="storage-note">
        {state.blocked ? "This browser blocks storage. Scores last for this visit only." : "Saved only in this browser. No account, public leaderboard or data upload."}
      </p>
      <button className="quiet" id="export-logbook" onClick={() => download("log-log-predictions.json", JSON.stringify(exportLog(), null, 2), "application/json")}>
        Download my log
      </button>
      <button
        className="quiet"
        id="reset-logbook"
        onClick={() => {
          if (confirm("Reset all first guesses saved in this browser?")) {
            resetLog();
            location.reload();
          }
        }}
      >
        Reset my log
      </button>
    </dialog>
  );
}

const LogbookHost = () => null;

export const Logbook = island("arcade/chrome/Logbook", LogbookView, LogbookHost, { roots: ["#logbook"] });
