// Two Stripes, the Week 7 game for section 2. One Marvel page is lit on a 2D
// map of all 303 and four candidate dots are ringed. Each candidate also shows
// its document vector as a strip. The player picks the page nearest the target
// by cosine in the full space; the map draws only two of the strip's stripes.
// Rules live in rules.ts; this file renders them.
import { useMemo, useState } from "react";
import { Face } from "@/kit/Portrait";
import { CosineFormula } from "@/features/cold-read/Formulas";
import { BestBox, clickButton, Lives, NextButton, ScoreBox, SkipLevel, Stat, StreakBox, useBest, useKeys } from "@/features/cold-read/LevelParts";
import { speed, Ticker, timed, useCountdown, Worth } from "@/features/cold-read/pace";
import { Rules } from "@/features/cold-read/StartPanel";
import { StartButtons, useTour } from "@/features/cold-read/Tutorial";
import type { Level } from "@/features/cold-read/levels";
import {
  answerOf, dealOrder, decodeStrips, LETTERS, LIMIT_S, LIVES, MAP_NAME, MAX_STREAK, nearestDot, pct, points, type Round, shownName, type TwoStripesData,
} from "./rules";
import { twoStripesTour } from "./tour";

const BEST = "two-stripes:best";
type Phase = "intro" | "play" | "reveal" | "over";
type Outcome = { pick: number | null; won: boolean; gained: number; newBest: boolean };
type Played = { round: Round; pick: number | null };

export function Intro() {
  return (
    <Rules
      rules={[
        ["Match", "the lit page's bars to the closest of four. The bars are a page's vector."],
        ["Don't trust", "the map: PCA draws only the first two bars, t-SNE only who sits near whom."],
        ["Hurry:", "faster picks pay more, and a wrong one costs a life."],
      ]}
    />
  );
}

const BAR_W = 10;
const BAR_H = 64;
const GAP_AFTER = 2; // the map's two bars stand apart
const barX = (k: number) => k * BAR_W + (k >= GAP_AFTER ? BAR_W : 0);
const barY = (v: number) => (BAR_H / 2) * (1 - v / 127);

/**
 * A page vector as signed bars, one per principal axis, at their real heights.
 * `over` outlines the lit page's bars on top, so the shapes can be compared.
 */
function Bars({ values, over, lit = false, axes }: { values: number[]; over?: number[]; lit?: boolean; axes: boolean }) {
  const width = barX(values.length);
  const bar = (v: number, k: number) => {
    const y = barY(v);
    return { x: barX(k) + 1, y: Math.min(y, BAR_H / 2), width: BAR_W - 2, height: Math.max(1, Math.abs(y - BAR_H / 2)) };
  };
  return (
    <svg className="ts-bars" data-lit={lit} viewBox={`0 0 ${width} ${BAR_H}`} preserveAspectRatio="none" aria-hidden="true">
      {axes ? <rect className="ts-axes" x={0} y={0} width={barX(GAP_AFTER) - BAR_W / 2} height={BAR_H} /> : null}
      <line className="ts-zero" x1={0} x2={width} y1={BAR_H / 2} y2={BAR_H / 2} />
      {values.map((v, k) => (
        <rect key={k} className="ts-bar" {...bar(v, k)} />
      ))}
      {over?.map((v, k) => <rect key={`o${k}`} className="ts-over" {...bar(v, k)} />)}
    </svg>
  );
}

function MapView({ data, round, answer, pick, revealed }: { data: TwoStripesData; round: Round; answer: number; pick: number | null; revealed: boolean }) {
  const xy = data.maps[round.map];
  const P = (p: number) => [12 + xy[p][0] * 376, 12 + (1 - xy[p][1]) * 376] as const;
  const [tx, ty] = P(round.target);
  const near = round.candidates[answer];
  return (
    <figure className="ts-map">
      <svg viewBox="0 0 400 400" role="img" aria-label={`${MAP_NAME[round.map]} map of the 303 pages with the target and four candidates`}>
        {xy.map((_, p) => {
          const [x, y] = P(p);
          return <circle key={p} className="ts-dot" cx={x} cy={y} r={2.4} />;
        })}
        {revealed ? <line className="ts-true" x1={tx} y1={ty} x2={P(near)[0]} y2={P(near)[1]} /> : null}
        {round.candidates.map((p, c) => {
          const [x, y] = P(p);
          return (
            <g
              key={p}
              className="ts-cand"
              data-answer={revealed && c === answer}
              data-pick={revealed && c === pick}
              onClick={() => clickButton(`ts-pick-${c}`)}
            >
              <circle cx={x} cy={y} r={7} />
              <text x={x + 12} y={y - 11}>
                {LETTERS[c]}
              </text>
            </g>
          );
        })}
        <circle className="ts-target" cx={tx} cy={ty} r={7} />
      </svg>
      <figcaption>
        {round.map === "pca"
          ? `PCA map · its two axes are bars 1 and 2 and hold ${pct(data.variance.two_axes)} of the variance`
          : "t-SNE map · it keeps near pages near, and its two axes are none of the bars"}
      </figcaption>
    </figure>
  );
}

function Debrief({ data, round, pick }: { data: TwoStripesData; round: Round; pick: number | null }) {
  const dot = nearestDot(data, round);
  const answer = answerOf(round);
  return (
    <div className="cr-debrief">
      <h3>The map against the full space</h3>
      <p>
        The dot closest to {shownName(data, round.target)} on the {MAP_NAME[round.map]} map was {LETTERS[dot]}, the{" "}
        {ordinal(round.rank[dot])} nearest page by cosine.
        {dot === answer ? " This time the drawing kept the neighbour." : " The drawing moved the true neighbour away."} Across all 303 pages, the dot
        touching a page is its nearest page for {pct(data.solver[round.map].dot_is_nearest)} of them on this map.
      </p>
      <div className="cr-formula">
        <CosineFormula />
      </div>
      <table className="cr-rows">
        <thead>
          <tr>
            <th scope="col">Candidate</th>
            <th scope="col">Cosine</th>
            <th scope="col">Rank of 302</th>
            <th scope="col">On the map</th>
          </tr>
        </thead>
        <tbody>
          {round.candidates.map((p, c) => (
            <tr key={p} data-flipped={c === pick}>
              <th scope="row">
                {LETTERS[c]} · {shownName(data, p)}
              </th>
              <td>{round.cos[c].toFixed(3)}</td>
              <td>{round.rank[c]}</td>
              <td>{c === dot ? "closest dot" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cr-note">
        Bold is your pick. Cosine is computed on all {data.dims} dimensions of {data.model.replace("sentence-transformers/", "")}. The bars show the first{" "}
        {data.stripes} principal axes after centring, {pct(data.variance.shown)} of the variance.
      </p>
    </div>
  );
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

function RunSummary({ data, played }: { data: TwoStripesData; played: Played[] }) {
  const dotRight = played.filter((x) => nearestDot(data, x.round) === answerOf(x.round)).length;
  const right = played.filter((x) => x.pick === answerOf(x.round)).length;
  return (
    <div className="cr-debrief ts-summary">
      <h3>Your run</h3>
      <p>
        You found the nearest page in {right} of {played.length} rounds. Tapping the closest dot would have found it in {dotRight}.
      </p>
      <p className="cr-note">
        Over every page: on PCA the closest dot is the nearest page for {pct(data.solver.pca.dot_is_nearest)} of pages, on t-SNE for{" "}
        {pct(data.solver.tsne.dot_is_nearest)}. t-SNE keeps more of each page's neighbourhood, but both are drawings of the same{" "}
        {data.dims} numbers per page.
      </p>
    </div>
  );
}

export function TwoStripesGame({ data, random = Math.random, level, clock = Date.now }: {
  data: TwoStripesData; random?: () => number; level?: Level; clock?: () => number;
}) {
  const strips = useMemo(() => decodeStrips(data), [data]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [found, setFound] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [played, setPlayed] = useState<Played[]>([]);
  const [dealt, setDealt] = useState(0);
  const { best, record } = useBest(level ? null : BEST);

  const round = order.length ? data.rounds[order[at % order.length]] : null;
  const answer = round ? answerOf(round) : -1;
  const playing = phase === "play";

  const deal = (n: number) => {
    setAt(n);
    setOutcome(null);
    setDealt((d) => d + 1);
    setPhase("play");
  };
  const start = () => {
    setOrder(dealOrder(data, random));
    setScore(0);
    setLives(LIVES);
    setStreak(0);
    setFound(0);
    setPlayed([]);
    deal(0);
  };
  const tour = useTour(twoStripesTour, start);

  // A pick (or the buzzer, pick null) ends the round.
  const finish = (pick: number | null) => {
    if (!round) return;
    const factor = speed(pace.stop(), LIMIT_S);
    const won = pick === answer;
    const run = won ? streak + 1 : 0;
    const gained = won ? timed(points(run), factor) : 0;
    const total = score + gained;
    const left = won ? lives : lives - 1;
    setScore(total);
    setStreak(run);
    setLives(left);
    if (won) setFound((f) => f + 1);
    setPlayed((p) => [...p, { round, pick }]);
    setOutcome({ pick, won, gained, newBest: record(total) });
    setPhase(left === 0 ? "over" : "reveal");
  };
  const pace = useCountdown(LIMIT_S, playing, dealt, () => finish(null), clock, tour.running);
  const worth = timed(points(streak + 1), speed(pace.elapsed, LIMIT_S));

  useKeys(Object.fromEntries(LETTERS.flatMap((l, c) => [[l.toLowerCase(), () => clickButton(`ts-pick-${c}`)], [String(c + 1), () => clickButton(`ts-pick-${c}`)]])), playing);

  const revealed = phase === "reveal" || phase === "over";
  const last = at + 1 >= (level?.items ?? Infinity);

  return (
    <section className="cr-table ts-table" id="two-stripes" aria-label="Two Stripes">
      <div className="cr-hud" role="status">
        <ScoreBox points={score} level={level} />
        <Ticker countdown={pace} limitS={LIMIT_S} active={playing} />
        <Worth points={worth} active={playing} />
        <StreakBox streak={Math.min(Math.max(streak, 1), MAX_STREAK)} />
        <Lives lives={lives} max={LIVES} onRetry={start} />
        <Stat label="Found">{found}</Stat>
        <BestBox best={best} level={level} />
        <SkipLevel points={score} level={level} />
      </div>

      {phase === "intro" ? (
        <div className="cr-start">
          <Intro />
          <StartButtons label="Start" start={start} tour={tour} round="two-stripes" />
        </div>
      ) : null}

      {phase !== "intro" && round ? (
        <>
          <div className="cr-hand-head">
            <p className="cr-challenge">
              Which page is closest to <b>{shownName(data, round.target)}</b> in all {data.dims} dimensions?
            </p>
          </div>
          <div className="ts-field">
            <MapView data={data} round={round} answer={answer} pick={outcome?.pick ?? null} revealed={revealed} />
            <div className="ts-strips">
              <div className="ts-row ts-target-row">
                <span className="cr-face ts-face" data-size="s">
                  <Face name={data.pages[round.target].name} />
                </span>
                <span className="ts-label">
                  <b>{shownName(data, round.target)}</b>
                  <small>the lit page</small>
                </span>
                <Bars values={strips[round.target]} lit axes={round.map === "pca"} />
              </div>
              <p className="ts-axis-note" aria-hidden="true">
                {round.map === "pca" ? (
                  <>
                    <span>map</span> the PCA map draws only the two shaded bars ·{" "}
                  </>
                ) : (
                  "t-SNE draws its own two numbers, from all 384 · "
                )}
                <i /> the lit page, outlined on each candidate
              </p>
              {round.candidates.map((p, c) => (
                <button
                  key={p}
                  type="button"
                  id={`ts-pick-${c}`}
                  className="ts-row ts-pick"
                  data-answer={revealed && c === answer}
                  data-pick={revealed && c === outcome?.pick}
                  disabled={!playing}
                  onClick={() => finish(c)}
                  aria-label={revealed ? `${LETTERS[c]}: ${shownName(data, p)}, cosine ${round.cos[c].toFixed(3)}, rank ${round.rank[c]}` : `Candidate ${LETTERS[c]}`}
                >
                  <span className="ts-letter" aria-hidden="true">
                    {LETTERS[c]}
                  </span>
                  <span className="ts-label">
                    {revealed ? (
                      <>
                        <b>{shownName(data, p)}</b>
                        <small>
                          cos {round.cos[c].toFixed(3)} · rank {round.rank[c]}
                        </small>
                      </>
                    ) : (
                      <>
                        <b>Page {LETTERS[c]}</b>
                        <small>hidden until you pick</small>
                      </>
                    )}
                  </span>
                  <Bars values={strips[p]} over={strips[round.target]} axes={round.map === "pca"} />
                </button>
              ))}
            </div>
          </div>
          <p className="cr-news" aria-live="polite">
            {playing ? "Tap the bars or a ringed dot, or press A to D." : ""}
          </p>

          {revealed && outcome ? (
            <div className="cr-result" data-won={outcome.won}>
              <span className="cr-face" data-size="l">
                <Face name={data.pages[round.candidates[answer]].name} />
              </span>
              <div className="cr-case">
                <p className="cr-stamp">{outcome.won ? "Twin found" : outcome.pick === null ? "Time's up" : "Not the twin"}</p>
                <p className="cr-verdict">{shownName(data, round.candidates[answer])}</p>
                {outcome.won ? (
                  <p className="cr-sum">
                    <b className="cr-pop">+{outcome.gained.toLocaleString("en")}</b>
                  </p>
                ) : null}
                {phase === "over" ? (
                  <div className="cr-over">
                    <p>
                      Run over: {found} {found === 1 ? "twin" : "twins"} found, {score.toLocaleString("en")} points{outcome.newBest ? ", a new best" : ""}.
                    </p>
                    <NextButton level={level} score={score} over nextLabel="Next page" onNext={() => deal(at + 1)} onAgain={start} />
                  </div>
                ) : (
                  <NextButton level={level} score={score} last={last} nextLabel="Next page" onNext={() => deal(at + 1)} />
                )}
              </div>
            </div>
          ) : null}

          {revealed && outcome ? <Debrief data={data} round={round} pick={outcome.pick} /> : null}
          {phase === "over" ? <RunSummary data={data} played={played} /> : null}
        </>
      ) : null}
    </section>
  );
}
