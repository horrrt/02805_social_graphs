// Cold Read, round 1 (Clue Shop). A Marvel page is hidden; the player flips
// face-down word cards that show only a count on the page and a count of
// pages, watches the suspect board empty, and names the page from the leads
// ranked by cosine similarity. Rules live in rules.ts; this file renders them.
import { useEffect, useMemo, useState } from "react";
import { ScoreBox, SkipLevel } from "./LevelParts";
import { clueShopTour } from "./tours";
import { StartButtons, useTour } from "./Tutorial";
import { FINISH, type Level } from "./levels";
import {
  type Card, type ClueShopData, FACES, idf, LIVES, MAX_STREAK, points, rarity, type Round, shortlist, shuffled, suspects, tfidf,
} from "./rules";

const BEST = "cold-read:best";

type Phase = "intro" | "play" | "reveal" | "over";
type Outcome = { won: boolean; gained: number; streak: number; left: number; newBest: boolean };

const fmt = (x: number, d = 3) => x.toFixed(d);
const RARITY_LABEL = { common: "Common", uncommon: "Uncommon", rare: "Rare", legendary: "Legendary" } as const;

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

// "Ghost Rider (Danny Ketch)" -> "GR": the emblem for a page with no lead image.
const initials = (name: string) =>
  name
    .replace(/\s*\(.*\)\s*/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function Portrait({ data, page, size }: { data: ClueShopData; page: number; size: "s" | "m" | "l" }) {
  const p = data.pages[page];
  return (
    <span className="cr-face" data-size={size} data-tone={page % 4}>
      {p.img ? <img src={p.img} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{initials(p.name)}</span>}
    </span>
  );
}

export function Intro() {
  return (
    <ol className="cr-steps">
      <li>
        <b>Flip</b> a clue card. Its back shows how often the word appears on the hidden page, and on how many of the 303 pages.
      </li>
      <li>
        <b>Watch</b> the board. Pages that don’t use every flipped word drop out, and the leads re-rank by cosine similarity.
      </li>
      <li>
        <b>Name</b> the page. Unflipped cards score 100 each, and pages named in a row without a miss multiply the score up to ×{MAX_STREAK}. A wrong
        name costs one of {LIVES} lives.
      </li>
    </ol>
  );
}


function ClueCard({ card, data, round, index, open, revealed, onFlip, disabled }: {
  card: Card; data: ClueShopData; round: Round; index: number; open: boolean; revealed: boolean; onFlip: () => void; disabled: boolean;
}) {
  const df = data.words[card.w].df;
  const tier = rarity(df);
  return (
    <button
      type="button"
      id={`cr-card-${index}`}
      className="cr-card"
      data-open={open}
      data-rarity={tier}
      onClick={onFlip}
      disabled={disabled || open}
      aria-label={open ? `${card.w}: ${card.n} times here, on ${df} of ${data.N} pages` : `Card ${index + 1}, ${RARITY_LABEL[tier]}: ${card.n} times here, on ${df} of ${data.N} pages`}
    >
      <span className="cr-flip">
        <span className="cr-side cr-back">
          <span className="cr-tier">{RARITY_LABEL[tier]}</span>
          <span className="cr-big">×{card.n}</span>
          <span className="cr-small">on this page</span>
          <span className="cr-pages">
            <span className="cr-meter">
              <span style={{ width: `${Math.max(2, (df / data.N) * 100)}%` }} />
            </span>
            on {df} of {data.N} pages
          </span>
          <span className="cr-key" aria-hidden="true">
            {index + 1}
          </span>
        </span>
        <span className="cr-side cr-front">
          <span className="cr-tier">{RARITY_LABEL[tier]}</span>
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
                <span>{p.name}</span>
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
        <b>{loud.c.w}</b> appeared {loud.c.n} times, more than any other card, but it is on {data.words[loud.c.w].df} of {data.N} pages: idf ln(
        {data.N}/{data.words[loud.c.w].df}) = {fmt(loud.idf, 2)}. <b>{top.c.w}</b> appeared {top.c.n} times on {data.words[top.c.w].df}{" "}
        {data.words[top.c.w].df === 1 ? "page" : "pages"}: idf {fmt(top.idf, 2)}. Frequent here and rare elsewhere is TF-IDF.
      </p>
      <p className="cr-formula">
        tf-idf(t, d) = <span>count(t, d) / |d|</span> × <span>ln(N / df(t))</span>
      </p>
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

export function ClueShopGame({ data, random = Math.random, level, hard = false }: {
  data: ClueShopData; random?: () => number; level?: Level; hard?: boolean;
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
  const [best, setBest] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [news, setNews] = useState("");

  useEffect(() => setBest(readBest()), []);

  const round = data && order.length ? data.rounds[order[at % order.length]] : null;
  const leads = useMemo(() => (data ? shortlist(data, flipped, struck) : []), [data, flipped, struck]);
  const alive = useMemo(() => (data ? suspects(data, flipped) : null), [data, flipped]);
  const playing = phase === "play";

  // Keys 1 to 8 flip the matching card by pressing its button.
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !/^[1-8]$/.test(e.key)) return;
      (document.getElementById(`cr-card-${Number(e.key) - 1}`) as HTMLButtonElement | null)?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);


  const deal = (n: number, ord = order, hardDeck = hard) => {
    const r = data.rounds[ord[n % ord.length]];
    setAt(n);
    setDeck(shuffled(hardDeck ? r.hard : r.normal, random));
    setFlipped([]);
    setStruck([]);
    setMissed(false);
    setOutcome(null);
    setNews("");
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

  const finish = (won: boolean, livesLeft: number) => {
    const run = won ? (missed ? 1 : streak + 1) : 0;
    const left = deck.length - flipped.length;
    const gained = won ? points(left, hard, run) : 0;
    const total = score + gained;
    const newBest = total > best;
    setScore(total);
    setStreak(run);
    setOutcome({ won, gained, streak: Math.min(run, MAX_STREAK), left, newBest });
    if (won) setSolved((s) => s + 1);
    if (newBest) {
      setBest(total);
      saveBest(total);
    }
    setPhase(livesLeft === 0 ? "over" : "reveal");
  };

  const accuse = (page: number) => {
    if (!round) return;
    if (page === round.page) {
      finish(true, lives);
      return;
    }
    const livesLeft = lives - 1;
    setLives(livesLeft);
    setStruck([...struck, page]);
    setMissed(true);
    setStreak(0);
    setNews(`Not ${data.pages[page].name}. Streak lost, ${livesLeft} ${livesLeft === 1 ? "life" : "lives"} left.`);
    if (livesLeft === 0) finish(false, 0);
  };

  const topCos = leads[0]?.cos || 1;
  const answer = !playing && round ? round.page : null;
  const nextStreak = (missed ? 0 : streak) + 1;
  const shownStreak = Math.min(Math.max(streak, 1), MAX_STREAK);

  return (
    <section className="cr-table" id="clue-shop" aria-label="Clue Shop">
      <div className="cr-hud" role="status">
        <ScoreBox points={score} level={level} />
        <span className="cr-box">
          <small>Streak</small>
          <b data-hot={streak > 1}>×{shownStreak}</b>
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
          <small>Named</small>
          <b>{solved}</b>
        </span>
        {level ? null : (
          <span className="cr-box">
            <small>Best</small>
            <b>{best.toLocaleString("en")}</b>
          </span>
        )}
        {/* Hard mode is picked before play: in the practice menu or on the campaign's start screen. */}
        {hard ? <span className="cr-hard-on">Hard mode · ×2</span> : null}
        <SkipLevel points={score} level={level} />
      </div>

      {phase === "intro" ? (
        <div className="cr-start">
          <Intro />
          <StartButtons label="Deal the first page" start={start} tour={tour} round="clue" />
        </div>
      ) : null}

      {phase !== "intro" && round ? (
        <>
          <div className="cr-hand-head">
            {playing ? (
              <span className="cr-worth">
                Name it now for <b>{points(deck.length - flipped.length, hard, nextStreak).toLocaleString("en")}</b>
              </span>
            ) : null}
          </div>
          <div className="cr-hand">
            {deck.map((c, i) => (
              <ClueCard key={c.w} card={c} data={data} round={round} index={i} open={!playing || flipped.includes(c.w)} revealed={!playing} onFlip={() => flip(c)} disabled={!playing} />
            ))}
          </div>
          <p className="cr-news" aria-live="polite">
            {news || (playing ? "Pick a card, or press 1 to 8. The rarer the card, the more suspects it clears." : "")}
          </p>

          {(phase === "reveal" || phase === "over") && outcome ? (
            <div className="cr-result" data-won={outcome.won}>
              <Portrait data={data} page={round.page} size="l" />
              <div className="cr-case">
                <p className="cr-stamp">{outcome.won ? "Case closed" : "Case lost"}</p>
                <p className="cr-verdict">{data.pages[round.page].name}</p>
                {outcome.won ? (
                  <p className="cr-sum">
                    <b className="cr-pop">+{outcome.gained.toLocaleString("en")}</b>
                    <span>
                      (100 + {outcome.left} unflipped × 100){hard ? " × 2 hard mode" : ""} × {outcome.streak} streak
                    </span>
                  </p>
                ) : null}
                {data.pages[round.page].file ? (
                  <p className="cr-credit">
                    Image: <a href={`https://en.wikipedia.org/wiki/File:${encodeURIComponent(data.pages[round.page].file!)}`}>Wikipedia file page</a>
                  </p>
                ) : null}
                {phase === "over" ? (
                  <div className="cr-over">
                    <p>
                      Run over: {solved} {solved === 1 ? "page" : "pages"} named, {score.toLocaleString("en")} points
                      {outcome.newBest ? ", a new best" : ""}.
                    </p>
                    <button type="button" className="cr-go" onClick={level ? () => level.onDone(score) : start}>
                      {level ? FINISH : "Play again"}
                    </button>
                  </div>
                ) : (
                  <button type="button" className="cr-go" onClick={level && at + 1 >= level.items ? () => level.onDone(score) : () => deal(at + 1)}>
                    {level && at + 1 >= level.items ? FINISH : "Next page"}
                  </button>
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
                        <span className="cr-name">{data.pages[page].name}</span>
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
