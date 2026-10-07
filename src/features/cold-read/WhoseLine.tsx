"use client";
// Cold Read, round 2 (Whose Line). Two communities of the Marvel network face
// off. A word appears; the player says which community's pages use it more,
// whether both use it alike, or whether one page alone makes it look
// distinctive. The word then lands on a Scattertext-style plot. Rules live in
// groups.ts; this file renders them.
import { useEffect, useMemo, useRef, useState } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { shuffled } from "./rules";
import { type Answer, CARDS, deal, gain, INSPECT_COST, judge, LIVES, MAX_STREAK, ratio, type Term, type Verdict, type WhoseLineData } from "./groups";

const DATA = "play/cold-read/data/whose_line.json";
const BEST = "cold-read:best2";
const SIZE = 400;
const PAD = { l: 52, b: 44, t: 14, r: 14 };

type Phase = "intro" | "card" | "answered" | "summary" | "over";
type Played = { term: Term; kind: Answer; said: Answer; verdict: Verdict; inspected: boolean; got: number };

function readBest() {
  try {
    return Number(localStorage.getItem(BEST)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number) {
  try {
    localStorage.setItem(BEST, String(score));
  } catch {
    // Private windows may refuse storage; the best score is a convenience.
  }
}

function Intro() {
  return (
    <ol className="cr-steps">
      <li>
        <b>Read</b> the word. Two communities of the Marvel network face off, found from the links alone in Week 5.
      </li>
      <li>
        <b>Call</b> it: used more by the left group, the right group, both alike, or a fluke that one page alone inflates. Arrow keys work, and F is
        fluke.
      </li>
      <li>
        <b>Inspect</b> the pages behind a word for {INSPECT_COST} points before you call it. A wrong call costs one of {LIVES} lives; calling a
        fluke’s corner is half right and costs none.
      </li>
    </ol>
  );
}

function Placeholder() {
  return (
    <section className="cr-table" id="whose-line" aria-label="Whose Line">
      <div className="cr-start">
        <Intro />
        <p className="cr-note">Counting words in eight communities…</p>
      </div>
    </section>
  );
}

// "Phoenix (Guardians of the Galaxy)" -> "Phoenix": a caption under a portrait.
const short = (name: string) => name.replace(/\s*\(.*\)\s*/g, "");

function Team({ data, g, side }: { data: WhoseLineData; g: number; side: "a" | "b" }) {
  const group = data.groups[g];
  return (
    <div className="cr-team" data-side={side}>
      <span className="cr-team-name">
        Team <b>{short(group.label)}</b>
      </span>
      <ul className="cr-team-faces">
        {group.hubs.map((h) => (
          <li key={h.name}>
            <span className="cr-face" data-size="xl" data-tone={side === "a" ? 1 : 0}>
              {h.img ? <img src={h.img} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{h.name[0]}</span>}
            </span>
            <span>{short(h.name)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const log = (v: number) => Math.log10(v);

function Plot({ data, pair, played, current }: { data: WhoseLineData; pair: WhoseLineData["pairs"][number]; played: Played[]; current: Term | null }) {
  const lo = 0.1;
  const hi = useMemo(() => Math.max(100, ...pair.cloud.flat()), [pair]);
  const span = log(hi) - log(lo);
  const w = SIZE - PAD.l - PAD.r;
  const h = SIZE - PAD.t - PAD.b;
  const sx = (v: number) => PAD.l + ((log(Math.max(v, lo)) - log(lo)) / span) * w;
  const sy = (v: number) => PAD.t + h - ((log(Math.max(v, lo)) - log(lo)) / span) * h;
  const ticks = [0.1, 1, 10, 100, 1000].filter((v) => v <= hi);
  const A = short(data.groups[pair.a].label);
  const B = short(data.groups[pair.b].label);
  return (
    <svg className="cr-plot" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Uses per 10,000 words: ${A}'s pages across, ${B}'s pages up`}>
      <polygon className="cr-zone" data-side="a" points={`${sx(lo)},${sy(lo)} ${sx(hi)},${sy(lo)} ${sx(hi)},${sy(hi)}`} />
      <polygon className="cr-zone" data-side="b" points={`${sx(lo)},${sy(lo)} ${sx(lo)},${sy(hi)} ${sx(hi)},${sy(hi)}`} />
      {ticks.map((v) => (
        <g key={v}>
          <line className="cr-grid" x1={sx(v)} x2={sx(v)} y1={sy(lo)} y2={sy(hi)} />
          <line className="cr-grid" x1={sx(lo)} x2={sx(hi)} y1={sy(v)} y2={sy(v)} />
          <text className="cr-tick" x={sx(v)} y={SIZE - PAD.b + 16}>
            {v}
          </text>
          <text className="cr-tick" data-axis="y" x={PAD.l - 8} y={sy(v) + 4}>
            {v}
          </text>
        </g>
      ))}
      <line className="cr-diag" x1={sx(lo)} y1={sy(lo)} x2={sx(hi)} y2={sy(hi)} />
      <text className="cr-axis" x={PAD.l + w / 2} y={SIZE - 6}>
        {A}’s pages, uses per 10,000 words →
      </text>
      <text className="cr-axis" transform={`translate(14 ${PAD.t + h / 2}) rotate(-90)`}>
        {B}’s pages →
      </text>
      <text className="cr-zone-label" data-side="a" x={sx(hi) - 8} y={sy(lo) - 10}>
        more {A}
      </text>
      <text className="cr-zone-label" data-side="b" x={sx(lo) + 8} y={sy(hi) + 18}>
        more {B}
      </text>
      {pair.cloud.map(([x, y], i) => (
        <circle key={i} className="cr-cloud" cx={sx(x)} cy={sy(y)} r={2} />
      ))}
      {played.map((p) => (
        <g key={p.term.w} className="cr-term" data-verdict={p.verdict} data-fluke={p.kind === "fluke"} transform={`translate(${sx(p.term.x)} ${sy(p.term.y)})`}>
          <circle r={5.5} />
          <text x={8} y={4}>
            {p.term.w}
          </text>
        </g>
      ))}
      {current ? <circle className="cr-pulse" cx={sx(current.x)} cy={sy(current.y)} r={9} /> : null}
    </svg>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<WhoseLineData>(hydrated ? asset(DATA) : null);
  const data = state.data;
  useIslandReady(state.status === "ready" || state.status === "error");
  useEffect(() => {
    if (state.status === "error") console.error("cold-read communities failed", state.error);
  }, [state.status, state.error]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<number[]>([]);
  const [match, setMatch] = useState(0);
  const [hand, setHand] = useState<{ term: Term; kind: Answer }[]>([]);
  const [at, setAt] = useState(0);
  const [played, setPlayed] = useState<Played[]>([]);
  const [inspected, setInspected] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [right, setRight] = useState(0);
  const [best, setBest] = useState(0);
  const nextBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => setBest(readBest()), []);
  useEffect(() => {
    if (phase === "answered" || phase === "summary" || phase === "over") nextBtn.current?.focus();
  }, [phase, at]);

  const pair = data && order.length ? data.pairs[order[match % order.length]] : null;
  const card = hand[at] ?? null;

  // Arrow keys and F answer the open card.
  useEffect(() => {
    if (phase !== "card") return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowLeft: "cr-say-a", ArrowRight: "cr-say-b", ArrowDown: "cr-say-both", f: "cr-say-fluke", F: "cr-say-fluke" };
      const id = map[e.key];
      if (!id || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      (document.getElementById(id) as HTMLButtonElement | null)?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (state.status === "error")
    return (
      <section className="cr-table" id="whose-line" aria-label="Whose Line">
        <div className="cr-start">
          <Intro />
          <p className="cr-note">The word counts did not load. Reload the page to try again.</p>
        </div>
      </section>
    );
  if (!data) return <Placeholder />;

  const startMatch = (n: number, ord = order) => {
    setMatch(n);
    setHand(deal(data.pairs[ord[n % ord.length]]));
    setAt(0);
    setPlayed([]);
    setInspected(false);
    setPhase("card");
  };

  const start = () => {
    const ord = shuffled(data.pairs.map((_, i) => i));
    setOrder(ord);
    setScore(0);
    setLives(LIVES);
    setStreak(0);
    setRight(0);
    startMatch(0, ord);
  };

  const say = (said: Answer) => {
    if (!card) return;
    const verdict = judge(card.kind, said, card.term);
    const ok = verdict === "right";
    const run = ok ? streak + 1 : 0;
    const got = ok ? gain(run, inspected) : 0;
    const total = score + got;
    const livesLeft = verdict === "wrong" ? lives - 1 : lives;
    setStreak(run);
    setScore(total);
    setLives(livesLeft);
    if (ok) setRight((r) => r + 1);
    setPlayed([...played, { term: card.term, kind: card.kind, said, verdict, inspected, got }]);
    if (total > best) {
      setBest(total);
      saveBest(total);
    }
    setPhase(livesLeft === 0 ? "over" : "answered");
  };

  const next = () => {
    setInspected(false);
    if (at + 1 >= hand.length) setPhase("summary");
    else {
      setAt(at + 1);
      setPhase("card");
    }
  };

  if (phase === "intro" || !pair)
    return (
      <section className="cr-table" id="whose-line" aria-label="Whose Line">
        <Hud score={score} streak={streak} lives={lives} right={right} best={best} playing={false} />
        <div className="cr-start">
          <Intro />
          <button type="button" className="cr-go" onClick={start}>
            Start the first match
          </button>
        </div>
      </section>
    );

  const A = short(data.groups[pair.a].label);
  const B = short(data.groups[pair.b].label);
  const last = played.at(-1);
  const label = { a: `More in ${A}’s pages`, b: `More in ${B}’s pages`, both: "Both alike", fluke: "One-page fluke" } as const;

  const explain = (p: Played) => {
    const r = ratio(p.term);
    const lean = r >= 1 ? A : B;
    const times = r >= 1 ? r : 1 / r;
    const rates = `${p.term.x.toFixed(1)} uses per 10,000 words in ${A}’s pages, ${p.term.y.toFixed(1)} in ${B}’s`;
    if (p.kind === "both") return `${rates}: within ${times.toFixed(1)}× of each other, so it sits near the diagonal.`;
    if (p.kind === "fluke")
      return `It sits in ${lean}’s corner because ${lean}’s pages do use it ${times.toFixed(1)}× more: ${rates}. But ${Math.round(p.term.share * 100)}% of those uses are on one page, ${p.term.top}. The plot counts uses, not pages, so one loud page can put a word in a whole community’s corner.`;
    return `${rates}: ${times.toFixed(1)}× more in ${lean}’s, spread over ${r >= 1 ? p.term.pa : p.term.pb} pages.`;
  };

  return (
    <section className="cr-table" id="whose-line" aria-label="Whose Line">
      <Hud score={score} streak={streak} lives={lives} right={right} best={best} playing={phase === "card"} />

      <div className="cr-match">
        <Team data={data} g={pair.a} side="a" />
        <span className="cr-vs">
          Match {match + 1}
          <b>vs</b>
        </span>
        <Team data={data} g={pair.b} side="b" />
      </div>

      <div className="cr-field cr-wl">
        <div className="cr-wl-left">
          {phase === "card" || phase === "answered" ? (
            <div className="cr-term-card" data-state={phase}>
              <span className="cr-h">
                Word {at + 1} of {CARDS}
              </span>
              <span className="cr-term-word">{card?.term.w}</span>
              <span className="cr-note">
                Used {((card?.term.ua ?? 0) + (card?.term.ub ?? 0)).toLocaleString("en")} times across the two groups.
              </span>
              {phase === "card" && card ? (
                <>
                  {inspected ? (
                    <p className="cr-inspect">
                      On {card.term.pa} of {data.groups[pair.a].size} {A} pages and {card.term.pb} of {data.groups[pair.b].size} {B} pages. The page
                      that uses it most, <b>{card.term.top}</b>, holds {Math.round(card.term.share * 100)}% of its leading group’s uses.
                    </p>
                  ) : (
                    <button type="button" className="cr-ghost cr-inspect-btn" onClick={() => setInspected(true)}>
                      Inspect the pages −{INSPECT_COST}
                    </button>
                  )}
                  <div className="cr-calls">
                    <button id="cr-say-a" type="button" className="cr-call" data-side="a" onClick={() => say("a")}>
                      ← {A}
                    </button>
                    <button id="cr-say-both" type="button" className="cr-call" data-side="both" onClick={() => say("both")}>
                      ↓ Both alike
                    </button>
                    <button id="cr-say-b" type="button" className="cr-call" data-side="b" onClick={() => say("b")}>
                      {B} →
                    </button>
                    <button id="cr-say-fluke" type="button" className="cr-call" data-side="fluke" onClick={() => say("fluke")}>
                      F · One-page fluke
                    </button>
                  </div>
                </>
              ) : null}
              {phase === "answered" && last ? (
                <div className="cr-verdict-box" data-verdict={last.verdict}>
                  <p className="cr-stamp">
                    {last.verdict === "right" ? `Right · +${last.got}` : last.verdict === "half" ? "Half right · no life lost" : "Wrong · −1 life"}
                  </p>
                  <p className="cr-answer">{label[last.kind]}</p>
                  <p>{explain(last)}</p>
                  <button ref={nextBtn} type="button" className="cr-go" onClick={next}>
                    {at + 1 >= hand.length ? "See the match" : "Next word"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {phase === "summary" || phase === "over" ? (
            <div className="cr-term-card">
              <p className="cr-stamp">{phase === "over" ? "Run over" : "Match over"}</p>
              <p className="cr-verdict">
                {played.filter((p) => p.verdict === "right").length} of {played.length} right
              </p>
              {phase === "over" ? (
                <p>
                  {right} calls right in this run, {score.toLocaleString("en")} points.
                </p>
              ) : null}
              <button ref={nextBtn} type="button" className="cr-go" onClick={phase === "over" ? start : () => startMatch(match + 1)}>
                {phase === "over" ? "Play again" : "Next match"}
              </button>
            </div>
          ) : null}
        </div>
        <div className="cr-board">
          <Plot data={data} pair={pair} played={played} current={phase === "answered" && last ? last.term : null} />
          <p className="cr-note">
            Each grey dot is one of the 300 words these pages use most. Words on the diagonal are used at the same rate by both groups. A purple
            ring marks a fluke: placed by its totals, carried by one page.
          </p>
        </div>
      </div>

      {phase === "summary" || phase === "over" ? (
        <div className="cr-debrief">
          <h3>What the plot can and can’t tell you</h3>
          <p>
            Each word sits at its rate in one group against its rate in the other, uses per 10,000 words so that a larger group doesn’t win by size. Both
            axes are logarithmic, so a word used 10 times more by one group sits the same distance from the diagonal whether it is rare or common. That
            is Scattertext’s comparison.
          </p>
          <p>
            It answers which words one community uses more. It can’t say why, or whether a word speaks for the community or for one loud page: that
            takes going back to the pages, which is what Inspect does. Names and stopwords are left out here, as the brief suggests.
          </p>
          <ul className="cr-played">
            {played.map((p) => (
              <li key={p.term.w} data-verdict={p.verdict}>
                <b>{p.term.w}</b> <span>{label[p.kind]}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Hud({ score, streak, lives, right, best, playing }: { score: number; streak: number; lives: number; right: number; best: number; playing: boolean }) {
  const shown = Math.min(Math.max(playing ? streak + 1 : streak, 1), MAX_STREAK);
  return (
    <div className="cr-hud" role="status">
      <span className="cr-box cr-score">
        <small>Score</small>
        <b key={score}>{score.toLocaleString("en")}</b>
      </span>
      <span className="cr-box">
        <small>Streak</small>
        <b data-hot={shown > 1}>×{shown}</b>
      </span>
      <span className="cr-box">
        <small>Lives</small>
        <span className="cr-lives" aria-label={`${lives} of ${LIVES}`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <span key={i} data-on={i < lives} />
          ))}
        </span>
      </span>
      <span className="cr-box">
        <small>Right</small>
        <b>{right}</b>
      </span>
      <span className="cr-box">
        <small>Best</small>
        <b>{best.toLocaleString("en")}</b>
      </span>
    </div>
  );
}

export const WhoseLine = island("cold-read/WhoseLine", View, Placeholder, { roots: ["#whose-line"] });
