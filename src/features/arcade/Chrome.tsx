"use client";
// The arcade chrome that cabinet.js setupChrome() painted on main: the header
// (#arcade-chrome) swaps its server links for the LEGENDS wordmark, the site
// links and the LOGBOOK button once hydrated, and the #logbook dialog lists
// the first guesses saved in this browser. The dialog also owns body.unlocked
// and re-reads the log when another tab writes it.
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

// ---- the header -----------------------------------------------------------------

function HeaderHost() {
  return (
    <header className="chrome" id="arcade-chrome">
      <a className="arcade-wordmark" href="../../">LOG–LOG ARCADE</a>
      <a href="#post">The post</a>
    </header>
  );
}

function HeaderView() {
  const hydrated = useHydrated();
  const { state, p } = useProgress();
  // cabinet.js read the log at setupChrome(); here once hydrated, and again on every storage event.
  useEffect(() => {
    loadLog();
    const controller = new AbortController();
    window.addEventListener("storage", () => loadLog(), { signal: controller.signal });
    return () => controller.abort();
  }, []);
  if (!hydrated) return <HeaderHost />;
  return (
    <header className="chrome" id="arcade-chrome">
      <a className="arcade-wordmark" href={url("")}>
        LOG–LOG <b>LEGENDS</b>
      </a>
      <nav aria-label="Site navigation">
        <a href={url("#weeks")}>Posts</a>
        <a href={url("#network")}>The data</a>
        <button className="quiet" data-progress id="open-logbook" onClick={openLogbook}>
          {`LOGBOOK ${state.loaded ? p.weeks : 0}/${p.total}`}
        </button>
      </nav>
    </header>
  );
}

export const ArcadeChrome = island("arcade/chrome/Header", HeaderView, HeaderHost, { roots: ["#arcade-chrome"] });

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
