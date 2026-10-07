// Cold Read, round 1 (Clue Shop). A Marvel page is hidden; the player flips
// face-down word cards that show only a count on the page and a count of
// pages, watches the suspect board empty, and names the page from the leads
// ranked by cosine similarity. Rules live in rules.ts; this file renders them.
import { useMemo, useState } from "react";
import { Face } from "./Face";
import { IdfInline, TfIdfFormula } from "./Formulas";
import { BestBox, clickButton, Lives, NextButton, ScoreBox, SkipLevel, Stat, StreakBox, useBest, useKeys } from "./LevelParts";
import { boldness, LIMIT, speed, Ticker, timed, useCountdown, Worth } from "./pace";
import { clueShopTour } from "./tours";
import { StartButtons, useTour } from "./Tutorial";
import type { Level } from "./levels";
import {
  type Card, type ClueShopData, FACES, idf, LIVES, MAX_STREAK, points, rarity, type Round, shortlist, shownName, shuffled, suspects, tfidf,
} from "./rules";
import { Rules } from "./StartPanel";

const BEST = "cold-read:best";

type Phase = "intro" | "play" | "reveal" | "over";
type Outcome = { won: boolean; gained: number; streak: number; left: number; newBest: boolean; bold: number; factor: number; timeUp: boolean };

const fmt = (x: number, d = 3) => x.toFixed(d);


// A suspect's portrait, or initials when no source has one (Face).
function Portrait({ data, page, size }: { data: ClueShopData; page: number; size: "s" | "m" | "l" }) {
  return (
    <span className="cr-face" data-size={size} data-tone={page % 4}>
      <Face name={data.pages[page].name} />
    </span>
  );
}

export function Intro() {
  return (
    <Rules
      rules={[
        ["Flip", "a word card."],
        ["Name", "the hero whose page says it. The fewer cards you flip, the more you score."],
        ["Hurry:", "faster answers pay more, and a wrong name costs a life."],
      ]}
    />
  );
}


function ClueCard({ card, data, round, index, open, revealed, onFlip, disabled }: {
  card: Card; data: ClueShopData; round: Round; index: number; open: boolean; revealed: boolean; onFlip: () => void; disabled: boolean;
}) {
  const df = data.words[card.w].df;
  return (
    <button
      type="button"
      id={`cr-card-${index}`}
      className="cr-card"
      data-open={open}
      onClick={onFlip}
      disabled={disabled || open}
      aria-label={open ? `${card.w}: ${card.n} times here, on ${df} of ${data.N} pages` : `Card ${index + 1}: ${card.n} times here, on ${df} of ${data.N} pages`}
    >
      <span className="cr-flip">
        <span className="cr-side cr-back">
          <span className="cr-big">×{card.n}</span>
          <span className="cr-small">on this page</span>
          <span className="cr-pages">
            on {df} of {data.N} pages
          </span>
          <span className="cr-key" aria-hidden="true">
            {index + 1}
          </span>
        </span>
        <span className="cr-side cr-front">
          <span className="cr-word" data-long={card.w.length > 9}>
            {card.w}
          </span>
          <span className="cr-small">
            ×{card.n} · {df} {df === 1 ? "page" : "pages"}
          </span>
          {/* The weight shows once the page is named: during play the player works the rule out from the two numbers. */}
          {revealed ? <span className="cr-weight">tf×idf {fmt(tfidf(data, round, card), 4)}</span> : null}
        </span>
      </span>
    </button>
  );
}

function Board({ data, alive, struck, answer }: { data: ClueShopData; alive: Set<number> | null; struck: number[]; answer: number | null }) {
  const live = (p: number) => (alive === null || alive.has(p)) && !struck.includes(p);
  const left = data.pages.reduce((n, _, p) => n + (live(p) ? 1 : 0), 0);
  const faces = left <= FACES;
  return (
    <div className="cr-board">
      <p className="cr-count">
        <b key={left}>{left}</b>
        <span>{left === 1 ? "suspect left" : "suspects left"}</span>
      </p>
      {faces ? (
        <ul className="cr-faces" aria-label="Remaining suspects">
          {data.pages.map((p, i) =>
            live(i) ? (
              <li key={i} data-answer={answer === i}>
                <Portrait data={data} page={i} size="s" />
                <span>{shownName(data, i)}</span>
              </li>
            ) : null,
          )}
        </ul>
      ) : (
        <div className="cr-dots" aria-hidden="true">
          {data.pages.map((_, i) => (
            <span key={i} data-live={live(i)} />
          ))}
        </div>
      )}
      <p className="cr-note">
        {faces ? "Every page that uses all the words you flipped." : `Each dot is one of the ${data.N} pages. Faces appear at ${FACES} suspects or fewer.`}
      </p>
    </div>
  );
}

function Debrief({ data, round, deck, flipped }: { data: ClueShopData; round: Round; deck: Card[]; flipped: string[] }) {
  const rows = deck.map((c) => ({ c, tf: c.n / data.pages[round.page].tokens, idf: idf(data, c.w), x: tfidf(data, round, c) })).sort((a, b) => b.x - a.x);
  const top = rows[0];
  const loud = rows.reduce((a, b) => (b.c.n > a.c.n ? b : a));
  const max = top.x || 1;
  return (
    <div className="cr-debrief">
      <h3>Why the best card was best</h3>
      <p>
        <b>{loud.c.w}</b> appeared {loud.c.n} times, more than any other card, but it is on {data.words[loud.c.w].df} of {data.N} pages:{" "}
        <IdfInline n={data.N} df={data.words[loud.c.w].df} value={fmt(loud.idf, 2)} />. <b>{top.c.w}</b> appeared {top.c.n} times on{" "}
        {data.words[top.c.w].df} {data.words[top.c.w].df === 1 ? "page" : "pages"}: <IdfInline n={data.N} df={data.words[top.c.w].df} value={fmt(top.idf, 2)} />.
        Frequent here and rare elsewhere is TF-IDF.
      </p>
      <div className="cr-formula">
        <TfIdfFormula />
      </div>
      <table className="cr-rows">
        <thead>
          <tr>
            <th scope="col">Card</th>
            <th scope="col">Here</th>
            <th scope="col">Pages</th>
            <th scope="col">tf</th>
            <th scope="col">idf</th>
            <th scope="col">tf × idf</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ c, tf, idf: i, x }) => (
            <tr key={c.w} data-flipped={flipped.includes(c.w)}>
              <th scope="row">
                <span className="cr-chip" data-rarity={rarity(data.words[c.w].df)} />
                {c.w}
              </th>
              <td>{c.n}</td>
              <td>{data.words[c.w].df}</td>
              <td>{fmt(tf, 4)}</td>
              <td>{fmt(i, 2)}</td>
              <td>
                <span className="cr-bar" style={{ width: `${(x / max) * 60}%` }} />
                {fmt(x, 4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cr-note">
        Bold rows are the cards you flipped. |d| = {data.pages[round.page].tokens.toLocaleString("en")} words on this page.
      </p>
    </div>
  );
}

export function ClueShopGame({ data, random = Math.random, level, hard = false, clock = Date.now }: {
  data: ClueShopData; random?: () => number; level?: Level; hard?: boolean; clock?: () => number;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [struck, setStruck] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missed, setMissed] = useState(false);
  // Practice keeps its own best (normal and hard apart); a campaign level keeps none.
  const { best, record } = useBest(level ? null : hard ? `${BEST}:hard` : BEST);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [news, setNews] = useState("");
  const [dealt, setDealt] = useState(0);

  const round = data && order.length ? data.rounds[order[at % order.length]] : null;
  const leads = useMemo(() => (data ? shortlist(data, flipped, struck) : []), [data, flipped, struck]);
  const alive = useMemo(() => (data ? suspects(data, flipped) : null), [data, flipped]);
  const playing = phase === "play";

  // Keys 1 to 8 flip the matching card by pressing its button.
  useKeys(Object.fromEntries(Array.from({ length: 8 }, (_, i) => [String(i + 1), () => clickButton(`cr-card-${i}`)])), playing);


  const deal = (n: number, ord = order, hardDeck = hard) => {
    const r = data.rounds[ord[n % ord.length]];
    setAt(n);
    setDeck(shuffled(hardDeck ? r.hard : r.normal, random));
    setFlipped([]);
    setStruck([]);
    setMissed(false);
    setOutcome(null);
    setNews("");
    setDealt((d) => d + 1);
    setPhase("play");
  };

  const start = () => {
    const ord = shuffled(data.rounds.map((_, i) => i), random);
    setOrder(ord);
    setScore(0);
    setLives(LIVES);
    setSolved(0);
    setStreak(0);
    deal(0, ord);
  };
  const tour = useTour(clueShopTour, start);

  const flip = (card: Card) => {
    const before = suspects(data, flipped)?.size ?? data.N;
    const next = [...flipped, card.w];
    const after = suspects(data, next)?.size ?? data.N;
    const df = data.words[card.w].df;
    setFlipped(next);
    setNews(
      df === data.N
        ? `“${card.w}” is on all ${data.N} pages. Nobody left the board.`
        : before === after
          ? `“${card.w}” is on ${df} pages, and every suspect left uses it. Nobody left, but the leads re-ranked.`
          : `“${card.w}” is on ${df} of ${data.N} pages. ${before - after} suspects left the board.`,
    );
  };

  // Points for a named page: the cards left face down and the streak, plus the bold-read bonus, times the speed.
  const finish = (won: boolean, livesLeft: number, bold = 0, timeUp = false) => {
    const factor = speed(pace.stop(), LIMIT.clue);
    const run = won ? (missed ? 1 : streak + 1) : 0;
    const left = deck.length - flipped.length;
    const gained = won ? timed(points(left, hard, run) + bold, factor) : 0;
    const total = score + gained;
    const newBest = record(total);
    setScore(total);
    setStreak(run);
    setOutcome({ won, gained, streak: Math.min(run, MAX_STREAK), left, newBest, bold, factor, timeUp });
    if (won) setSolved((s) => s + 1);
    setPhase(livesLeft === 0 ? "over" : "reveal");
  };

  const accuse = (page: number) => {
    if (!round) return;
    if (page === round.page) {
      // Bold: suspects still standing when named, and whether it wasn't the top lead.
      const standing = Math.max(1, (alive?.size ?? data.N) - struck.filter((p) => alive === null || alive.has(p)).length);
      finish(true, lives, boldness(standing, leads[0]?.page !== page));
      return;
    }
    const livesLeft = lives - 1;
    setLives(livesLeft);
    setStruck([...struck, page]);
    setMissed(true);
    setStreak(0);
    setNews(`Not ${shownName(data, page)}. Streak lost, ${livesLeft} ${livesLeft === 1 ? "life" : "lives"} left.`);
    if (livesLeft === 0) finish(false, 0);
  };

  // The clock runs out: the page is lost, as a wrong name would lose it.
  const timeUp = () => {
    const livesLeft = lives - 1;
    setLives(livesLeft);
    setMissed(true);
    setStreak(0);
    finish(false, livesLeft, 0, true);
  };
  const pace = useCountdown(LIMIT.clue, playing, dealt, timeUp, clock, tour.running);
  const now = speed(pace.elapsed, LIMIT.clue);

  const topCos = leads[0]?.cos || 1;
  const answer = !playing && round ? round.page : null;
  const nextStreak = (missed ? 0 : streak) + 1;
  const shownStreak = Math.min(Math.max(streak, 1), MAX_STREAK);
  // What naming the top lead right now would earn, bold-read bonus and speed included.
  const standing = Math.max(1, (alive?.size ?? data.N) - struck.filter((p) => alive === null || alive.has(p)).length);
  const worthNow = timed(points(deck.length - flipped.length, hard, nextStreak) + boldness(standing, false), now);

  return (
    <section className="cr-table" id="clue-shop" aria-label="Clue Shop">
      <div className="cr-hud" role="status">
        <ScoreBox points={score} level={level} />
        <Ticker countdown={pace} limitS={LIMIT.clue} active={playing} />
        <Worth points={worthNow} active={playing} />
        <StreakBox streak={shownStreak} />
        <Lives lives={lives} max={LIVES} onRetry={start} />
        <Stat label="Named">{solved}</Stat>
        <BestBox best={best} level={level} />
        {/* Hard mode is picked before play: in the practice menu or on the campaign's start screen. */}
        {hard ? <span className="cr-hard-on">Hard mode · ×2</span> : null}
        <SkipLevel points={score} level={level} />
      </div>

      {phase === "intro" ? (
        <div className="cr-start">
          <Intro />
          <StartButtons label="Start" start={start} tour={tour} round="clue" />
        </div>
      ) : null}

      {phase !== "intro" && round ? (
        <>
          <div className="cr-hand-head">
            <p className="cr-challenge">Which Marvel page are these words from? Flip as few as you dare.</p>
          </div>
          <div className="cr-hand">
            {deck.map((c, i) => (
              <ClueCard key={c.w} card={c} data={data} round={round} index={i} open={!playing || flipped.includes(c.w)} revealed={!playing} onFlip={() => flip(c)} disabled={!playing} />
            ))}
          </div>
          <p className="cr-news" aria-live="polite">
            {news || (playing ? "Pick a card, or press 1 to 8." : "")}
          </p>

          {(phase === "reveal" || phase === "over") && outcome ? (
            <div className="cr-result" data-won={outcome.won}>
              <Portrait data={data} page={round.page} size="l" />
              <div className="cr-case">
                <p className="cr-stamp">{outcome.won ? "Case closed" : outcome.timeUp ? "Time's up" : "Case lost"}</p>
                <p className="cr-verdict">{shownName(data, round.page)}</p>
                {outcome.won ? (
                  <p className="cr-sum">
                    <b className="cr-pop">+{outcome.gained.toLocaleString("en")}</b>
                  </p>
                ) : null}
                {phase === "over" ? (
                  <div className="cr-over">
                    <p>
                      Run over: {solved} {solved === 1 ? "page" : "pages"} named, {score.toLocaleString("en")} points
                      {outcome.newBest ? ", a new best" : ""}.
                    </p>
                    <NextButton level={level} score={score} over nextLabel="Next page" onNext={() => deal(at + 1)} onAgain={start} />
                  </div>
                ) : (
                  <NextButton
                    level={level}
                    score={score}
                    last={at + 1 >= (level?.items ?? Infinity)}
                    nextLabel="Next page"
                    onNext={() => deal(at + 1)}
                  />
                )}
              </div>
            </div>
          ) : null}

          <div className="cr-field">
            <Board data={data} alive={alive} struck={struck} answer={answer} />
            <aside className="cr-leads" aria-label="Leads">
              <h2 className="cr-h">Top leads · cosine similarity</h2>
              {leads.length === 0 ? (
                <p className="cr-empty">
                  {flipped.length === 0 ? "No clues yet. Every page ties at 0." : "Every page still ties at 0: these words are on all of them."}
                </p>
              ) : (
                <ol className="cr-list">
                  {leads.map(({ page, cos }, i) => (
                    <li key={page} data-answer={answer === page}>
                      <span className="cr-rank">{i + 1}</span>
                      <Portrait data={data} page={page} size="m" />
                      <span className="cr-lead-text">
                        <span className="cr-name">{shownName(data, page)}</span>
                        <span className="cr-cos">
                          <span style={{ width: `${(cos / topCos) * 100}%` }} />
                        </span>
                        <span className="cr-num">cos {fmt(cos)}</span>
                      </span>
                      {playing ? (
                        <button type="button" onClick={() => accuse(page)}>
                          Name it
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </aside>
          </div>

          {(phase === "reveal" || phase === "over") && outcome ? <Debrief data={data} round={round} deck={deck} flipped={flipped} /> : null}
        </>
      ) : null}
    </section>
  );
}
