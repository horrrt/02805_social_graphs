"use client";
// Cold Read, round 1 (Clue Shop). A Marvel page is hidden; the player flips
// face-down word cards that show only a count on the page and a count of
// pages, and names the page from a shortlist ranked by cosine similarity.
// Rules live in rules.ts; this file renders them.
import { useEffect, useMemo, useState } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import {
  type Card, type ClueShopData, idf, LIVES, pagesWithAll, points, type Round, shortlist, shuffled, tfidf,
} from "./rules";

const DATA = "play/cold-read/data/clue_shop.json";
const BEST = "cold-read:best";

type Phase = "intro" | "play" | "reveal" | "over";
type Outcome = { won: boolean; gained: number };

const fmt = (x: number, d = 3) => x.toFixed(d);

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
    <div className="cr-intro">
      <p className="cr-lede">
        A Marvel character page is hidden. You get eight face-down clue cards cut from it. Each card shows two numbers before you flip it: how
        often its word appears on the hidden page, and on how many of the 303 pages it appears.
      </p>
      <ol className="cr-rules">
        <li>Flip a card to see its word. The suspect list re-ranks every page by how closely it matches the words you have flipped.</li>
        <li>Name the page from the list. Every card still face down is worth 100 points.</li>
        <li>A wrong name costs one of your {LIVES} lives. Lose them all and the run ends.</li>
      </ol>
    </div>
  );
}

function Placeholder() {
  return (
    <section className="cr-table" id="clue-shop" aria-label="Clue Shop">
      <Intro />
      <p className="cr-note">Shuffling the decks…</p>
    </section>
  );
}

function Face({ card, data, round, open, onFlip, disabled }: { card: Card; data: ClueShopData; round: Round; open: boolean; onFlip: () => void; disabled: boolean }) {
  const df = data.words[card.w].df;
  const share = df / data.N;
  return (
    <button
      type="button"
      className="cr-card"
      data-open={open}
      onClick={onFlip}
      disabled={disabled || open}
      aria-label={open ? `${card.w}: ${card.n} times here, on ${df} of ${data.N} pages` : `Face-down card: ${card.n} times here, on ${df} of ${data.N} pages`}
    >
      <span className="cr-word" data-long={open && card.w.length > 9}>
        {open ? card.w : "?"}
      </span>
      <span className="cr-stat">
        <b>×{card.n}</b> here
      </span>
      <span className="cr-stat">
        on <b>{df}</b> of {data.N} pages
      </span>
      <span className="cr-spread" aria-hidden="true">
        <span style={{ width: `${Math.max(2, share * 100)}%` }} />
      </span>
      {open ? <span className="cr-weight">tf×idf {fmt(tfidf(data, round, card), 4)}</span> : null}
    </button>
  );
}

function Debrief({ data, round, deck, flipped }: { data: ClueShopData; round: Round; deck: Card[]; flipped: string[] }) {
  const rows = deck.map((c) => ({ c, tf: c.n / data.pages[round.page].tokens, idf: idf(data, c.w), x: tfidf(data, round, c) })).sort((a, b) => b.x - a.x);
  const top = rows[0];
  const loud = rows.reduce((a, b) => (b.c.n > a.c.n ? b : a));
  const max = top.x || 1;
  return (
    <div className="cr-debrief">
      <h3>What made a card worth flipping</h3>
      <p>
        <b>{loud.c.w}</b> appeared {loud.c.n} times on this page, more than any other card, but it is on {data.words[loud.c.w].df} of {data.N} pages, so
        its idf is ln({data.N}/{data.words[loud.c.w].df}) = {fmt(loud.idf, 2)}. <b>{top.c.w}</b> appeared {top.c.n} times on only{" "}
        {data.words[top.c.w].df} {data.words[top.c.w].df === 1 ? "page" : "pages"}: idf {fmt(top.idf, 2)}. A card is worth flipping when it is
        frequent here and rare elsewhere. That product is TF-IDF:
      </p>
      <p className="cr-formula">
        tf-idf(t, d) = <span>count(t, d) / |d|</span> × <span>ln(N / df(t))</span>
      </p>
      <table className="cr-rows">
        <thead>
          <tr>
            <th scope="col">Word</th>
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
              <th scope="row">{c.w}</th>
              <td>{c.n}</td>
              <td>{data.words[c.w].df}</td>
              <td>{fmt(tf, 4)}</td>
              <td>{fmt(i, 2)}</td>
              <td>
                <span className="cr-bar" style={{ width: `${(x / max) * 100}%` }} />
                {fmt(x, 4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cr-note">
        Bold rows are the cards you flipped. The page has {data.pages[round.page].tokens.toLocaleString("en")} words, so |d| ={" "}
        {data.pages[round.page].tokens.toLocaleString("en")}.
      </p>
    </div>
  );
}

function View() {
  const hydrated = useHydrated();
  const state = useData<ClueShopData>(hydrated ? asset(DATA) : null);
  const data = state.data;
  useIslandReady(state.status === "ready");

  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const [hide, setHide] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [struck, setStruck] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [solved, setSolved] = useState(0);
  const [best, setBest] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [news, setNews] = useState("");

  useEffect(() => setBest(readBest()), []);

  const round = data && order.length ? data.rounds[order[at % order.length]] : null;
  const list = useMemo(() => (data ? shortlist(data, flipped, struck) : []), [data, flipped, struck]);
  const left = data ? pagesWithAll(data, flipped) : 0;

  if (state.status === "error") return <Placeholder />;
  if (!data) return <Placeholder />;

  const deal = (n: number, ord = order, namesHidden = hide) => {
    const r = data.rounds[ord[n % ord.length]];
    setAt(n);
    setDeck(shuffled(namesHidden ? r.off : r.on));
    setFlipped([]);
    setStruck([]);
    setOutcome(null);
    setNews("");
    setPhase("play");
  };

  const start = () => {
    const ord = shuffled(data.rounds.map((_, i) => i));
    setOrder(ord);
    setScore(0);
    setLives(LIVES);
    setSolved(0);
    deal(0, ord);
  };

  const flip = (card: Card) => {
    const before = pagesWithAll(data, flipped);
    const next = [...flipped, card.w];
    const after = pagesWithAll(data, next);
    const df = data.words[card.w].df;
    setFlipped(next);
    setNews(
      df === data.N
        ? `“${card.w}” is on all ${data.N} pages. It ruled nothing out.`
        : `“${card.w}” is on ${df} of ${data.N} pages. Pages using every word so far: ${before} → ${after}.`,
    );
  };

  const finish = (won: boolean, gained: number, livesLeft: number) => {
    const total = score + gained;
    setScore(total);
    setOutcome({ won, gained });
    if (won) setSolved((s) => s + 1);
    if (livesLeft === 0) {
      if (total > best) {
        setBest(total);
        saveBest(total);
      }
      setPhase("over");
    } else setPhase("reveal");
  };

  const accuse = (page: number) => {
    if (!round) return;
    if (page === round.page) {
      finish(true, points(deck.length - flipped.length, hide), lives);
      return;
    }
    const livesLeft = lives - 1;
    setLives(livesLeft);
    setStruck([...struck, page]);
    setNews(`Not ${data.pages[page].name}. ${livesLeft} ${livesLeft === 1 ? "life" : "lives"} left.`);
    if (livesLeft === 0) finish(false, 0, 0);
  };

  const top = list[0]?.cos || 1;
  const playing = phase === "play";

  return (
    <section className="cr-table" id="clue-shop" aria-label="Clue Shop">
      <div className="cr-scoreboard" role="status">
        <span>
          Score <b>{score}</b>
        </span>
        <span>
          Lives <b aria-label={`${lives} of ${LIVES}`}>{"●".repeat(lives) + "○".repeat(LIVES - lives)}</b>
        </span>
        <span>
          Solved <b>{solved}</b>
        </span>
        <span>
          Best <b>{best}</b>
        </span>
        <label className="cr-toggle">
          <input type="checkbox" checked={hide} disabled={playing} onChange={(e) => setHide(e.target.checked)} />
          Hide names <small>(double points)</small>
        </label>
      </div>

      {phase === "intro" ? (
        <>
          <Intro />
          <button type="button" className="cr-go" onClick={start}>
            Deal the first page
          </button>
        </>
      ) : null}

      {phase !== "intro" && round ? (
        <div className="cr-board">
          <div className="cr-hand">
            <h2 className="cr-h">Page {at + 1}: the hidden page’s clue cards</h2>
            <div className="cr-cards">
              {deck.map((c) => (
                <Face key={c.w} card={c} data={data} round={round} open={!playing || flipped.includes(c.w)} onFlip={() => flip(c)} disabled={!playing} />
              ))}
            </div>
            <p className="cr-news" aria-live="polite">
              {news || (playing ? "Pick a card. The two numbers on its back are all you get." : "")}
            </p>
          </div>

          <aside className="cr-suspects" aria-label="Suspects">
            <p className="cr-meter">
              <b>{left}</b> {left === 1 ? "page uses" : "pages use"} every word you flipped
            </p>
            <h2 className="cr-h">Closest pages by cosine similarity</h2>
            {list.length === 0 ? (
              <p className="cr-note">
                {flipped.length === 0 ? "No words yet. Every page is a suspect." : "Every page scores 0: the words you flipped are on all of them."}
              </p>
            ) : (
              <ol className="cr-list">
                {list.map(({ page, cos }) => (
                  <li key={page} data-answer={!playing && page === round.page}>
                    <span className="cr-name">{data.pages[page].name}</span>
                    <span className="cr-cos">
                      <span style={{ width: `${(cos / top) * 100}%` }} />
                    </span>
                    <span className="cr-num">{fmt(cos)}</span>
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
      ) : null}

      {(phase === "reveal" || phase === "over") && round && outcome ? (
        <div className="cr-result">
          <p className="cr-verdict" data-won={outcome.won}>
            {outcome.won
              ? `It was ${data.pages[round.page].name}. +${outcome.gained} points with ${deck.length - flipped.length} ${deck.length - flipped.length === 1 ? "card" : "cards"} unflipped.`
              : `It was ${data.pages[round.page].name}.`}
          </p>
          <Debrief data={data} round={round} deck={deck} flipped={flipped} />
          {phase === "over" ? (
            <div className="cr-over">
              <p>
                Run over: {solved} {solved === 1 ? "page" : "pages"} named, {score} points{score >= best && score > 0 ? ", a new best" : ""}.
              </p>
              <button type="button" className="cr-go" onClick={start}>
                Play again
              </button>
            </div>
          ) : (
            <button type="button" className="cr-go" onClick={() => deal(at + 1)}>
              Next page
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

export const ClueShop = island("cold-read/ClueShop", View, Placeholder, { roots: ["#clue-shop"] });
