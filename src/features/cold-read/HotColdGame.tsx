// Cold Read, round 5 (Hot & Cold). A word from the Marvel pages is hidden;
// every guess scores its cosine similarity to it in GloVe's vector space and
// lands on a radar by rank. Rules live in vectors.ts; this file renders them.
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ScoreBox, SkipLevel } from "./LevelParts";
import { LIMIT, speed, Ticker, timed, useCountdown } from "./pace";
import { hotColdTour } from "./tours";
import { StartButtons, useTour } from "./Tutorial";
import { FINISH, type Level } from "./levels";
import { shuffled } from "./rules";
import {
  atRank, cosinesTo, type Guess, heat, HINT_COST, HINT_RANKS, type HotColdData, MAX_STREAK, points, radarPoint,
  ranks, ringRadius,
} from "./vectors";

const BEST = "cold-read:best5";
const RADAR = 170;
const RINGS = [10, 100, 500, 2000];
const HEAT_LABEL = { found: "Found", burning: "Burning", hot: "Hot", warm: "Warm", cool: "Cool", cold: "Cold" } as const;

type Phase = "intro" | "play" | "found" | "gaveup";

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


export function Intro() {
  return (
    <ol className="cr-steps">
      <li>
        <b>Guess</b> a word. Each guess scores its cosine similarity to the hidden word, from −1 to 1.
      </li>
      <li>
        <b>Read</b> the radar. Your guess lands nearer the centre the higher it ranks among the 9,000 words the game knows.
      </li>
      <li>
        <b>Find</b> it in few guesses and fast: a hint costs {HINT_COST}, and the {LIMIT.vectors}-second clock pays up to ×1.5 for speed. When it runs out,
        the word is given up.
      </li>
    </ol>
  );
}


function Radar({ guesses, size, last, found }: { guesses: Guess[]; size: number; last: string | null; found: boolean }) {
  const near = new Set([...guesses].sort((a, b) => a.rank - b.rank).slice(0, 6).map((g) => g.w));
  const pad = 26;
  const box = 2 * (RADAR + pad);
  return (
    <svg className="cr-radar" viewBox={`${-RADAR - pad} ${-RADAR - pad} ${box} ${box}`} role="img" aria-label="Your guesses by rank: nearer the centre is closer to the hidden word">
      <circle className="cr-ring-out" r={RADAR} />
      {RINGS.map((r) => (
        <g key={r}>
          <circle className="cr-ring" data-heat={heat(r)} r={ringRadius(r, size, RADAR)} />
          <text className="cr-ring-label" x={0} y={-ringRadius(r, size, RADAR) - 4}>
            top {r.toLocaleString("en")}
          </text>
        </g>
      ))}
      {guesses.map((g) => {
        const { x, y } = radarPoint(g.w, g.rank, size, RADAR);
        return (
          <g key={g.w} className="cr-blip" data-heat={heat(g.rank)} data-last={g.w === last} data-hint={Boolean(g.hint)} transform={`translate(${x} ${y})`}>
            <circle r={g.w === last ? 7 : 5} />
            {near.has(g.w) || g.w === last ? (
              <text x={9} y={4}>
                {g.w}
              </text>
            ) : null}
          </g>
        );
      })}
      <circle className="cr-core" data-found={found} r={13} />
      <text className="cr-core-label" y={5}>
        {found ? "★" : "?"}
      </text>
    </svg>
  );
}

export function HotColdGame({ data, random = Math.random, level, clock = Date.now }: {
  data: HotColdData; random?: () => number; level?: Level; clock?: () => number;
}) {
  const [dealt, setDealt] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [hints, setHints] = useState(0);
  const [hintAt, setHintAt] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [found, setFound] = useState(0);
  const [best, setBest] = useState(0);
  const [gained, setGained] = useState(0);
  const [news, setNews] = useState("");
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => setBest(readBest()), []);

  const target = data && order.length ? data.targets[order[at % order.length]] : null;
  const cos = useMemo(() => (data && target !== null ? cosinesTo(data, target) : null), [data, target]);
  const rank = useMemo(() => (cos && target !== null ? ranks(cos, target) : null), [cos, target]);
  const playing = phase === "play";
  const pace = useCountdown(LIMIT.vectors, playing, dealt, () => giveUp(true), clock);

  // Keyboard players land on the input while playing and on "Next word" after.
  useEffect(() => {
    if (playing) input.current?.focus();
    else next.current?.focus();
  }, [playing, at]);


  const deal = (n: number, ord = order) => {
    setAt(n);
    setGuesses([]);
    setHints(0);
    setHintAt(0);
    setNews("");
    setDraft("");
    setDealt((d) => d + 1);
    setTimeUp(false);
    setPhase("play");
    if (ord !== order) setOrder(ord);
  };

  const start = () => {
    setScore(0);
    setStreak(0);
    setFound(0);
    deal(0, shuffled(data.targets.map((_, i) => i), random));
  };
  const tour = useTour(hotColdTour, start);

  const add = (w: string, hint = false): Guess | null => {
    if (!cos || !rank) return null;
    const i = data.index.get(w)!;
    // A word's cosine with itself is 1; the int8 packing would show 0.999.
    const g = { w, cos: rank[i] === 0 ? 1 : cos[i], rank: rank[i], hint };
    setGuesses((gs) => [...gs, g]);
    return g;
  };

  // Finding the word scores the guesses and hints left, times the streak and the speed.
  const win = (count: number) => {
    const f = speed(pace.stop(), LIMIT.vectors);
    const run = streak + 1;
    const got = timed(points(count, hints, run), f);
    const total = score + got;
    setScore(total);
    setStreak(run);
    setFound((f) => f + 1);
    setGained(got);
    if (total > best) {
      setBest(total);
      saveBest(total);
    }
    setPhase("found");
  };

  const guess = (e: FormEvent) => {
    e.preventDefault();
    const w = draft.trim().toLowerCase();
    setDraft("");
    if (!w || target === null) return;
    if (!data.index.has(w)) {
      setNews(`“${w}” is not among the game’s 9,000 Marvel words. Stopwords like “the” are left out: they sit near everything.`);
      return;
    }
    if (guesses.some((g) => g.w === w)) {
      setNews(`You already tried “${w}”.`);
      return;
    }
    const g = add(w);
    if (!g) return;
    if (g.rank === 0) {
      win(guesses.filter((x) => !x.hint).length + 1);
      return;
    }
    setNews(`“${w}”: cosine ${g.cos.toFixed(3)}, ranked #${g.rank.toLocaleString("en")}. ${HEAT_LABEL[heat(g.rank)]}.`);
  };

  // A hint skips ranks whose word the player already guessed, so each one shows something new.
  const nextHint = () => {
    if (!rank) return -1;
    for (let k = hintAt; k < HINT_RANKS.length; k++) if (!guesses.some((g) => g.w === data.vocab[atRank(rank, HINT_RANKS[k])])) return k;
    return -1;
  };

  const hint = () => {
    const k = nextHint();
    if (!rank || k < 0) return;
    const w = data.vocab[atRank(rank, HINT_RANKS[k])];
    setHintAt(k + 1);
    setHints(hints + 1);
    add(w, true);
    setNews(`Hint: “${w}” is the hidden word’s #${HINT_RANKS[k]} neighbour.`);
    input.current?.focus();
  };

  const giveUp = (outOfTime = false) => {
    pace.stop();
    setTimeUp(outOfTime);
    setStreak(0);
    setGained(0);
    setPhase("gaveup");
  };

  const word = target !== null ? data.vocab[target] : "";
  const tried = guesses.filter((g) => !g.hint).length;
  const sorted = [...guesses].sort((a, b) => a.rank - b.rank);
  const last = guesses.at(-1)?.w ?? null;
  const neighbours = rank ? Array.from({ length: 10 }, (_, k) => atRank(rank, k + 1)) : [];
  const done = phase === "found" || phase === "gaveup";
  // While playing, the streak this word will pay if found; after, the one it paid.
  const shownStreak = Math.min(Math.max(playing ? streak + 1 : streak, 1), MAX_STREAK);

  return (
    <section className="cr-table" id="hot-cold" aria-label="Hot and Cold">
      <div className="cr-hud" role="status">
        <ScoreBox points={score} level={level} />
        <Ticker countdown={pace} limitS={LIMIT.vectors} active={playing} />
        <span className="cr-box">
          <small>Streak</small>
          <b data-hot={shownStreak > 1}>×{shownStreak}</b>
        </span>
        <span className="cr-box">
          <small>Guesses</small>
          <b>{tried}</b>
        </span>
        <span className="cr-box">
          <small>Found</small>
          <b>{found}</b>
        </span>
        {level ? null : (
          <span className="cr-box">
            <small>Best</small>
            <b>{best.toLocaleString("en")}</b>
          </span>
        )}
        <SkipLevel points={score} level={level} />
      </div>

      {phase === "intro" ? (
        <div className="cr-start">
          <Intro />
          <StartButtons label="Hide the first word" start={start} tour={tour} round="vectors" />
        </div>
      ) : null}

      {phase !== "intro" && target !== null ? (
        <>
          <div className="cr-hc-clue">
            <span className="cr-h">Word {at + 1}</span>
            <span className="cr-tiles" aria-label={`${word.length} letters`}>
              {[...word].map((ch, i) => (
                <span key={i} data-open={done}>
                  {done ? ch : ""}
                </span>
              ))}
            </span>
            <span className="cr-hc-df">
              on <b>{data.df[target]}</b> of 303 Marvel pages
            </span>
          </div>

          {done ? (
            <div className="cr-result" data-won={phase === "found"}>
              <div className="cr-case">
                <p className="cr-stamp">{phase === "found" ? "Found it" : timeUp ? "Time's up" : "Gave up"}</p>
                <p className="cr-verdict">{word}</p>
                {phase === "found" ? (
                  <p className="cr-sum">
                    <b className="cr-pop">+{gained.toLocaleString("en")}</b>
                  </p>
                ) : (
                  <p className="cr-sum">
                    <span>Streak reset. Your closest guess was {sorted[0] ? `“${sorted[0].w}”, #${sorted[0].rank}` : "none"}.</span>
                  </p>
                )}
                <button ref={next} type="button" className="cr-go" onClick={level && at + 1 >= level.items ? () => level.onDone(score) : () => deal(at + 1)}>
                  {level && at + 1 >= level.items ? FINISH : "Next word"}
                </button>
              </div>
            </div>
          ) : (
            <form className="cr-guess" onSubmit={guess}>
              <input
                ref={input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a word and press Enter"
                aria-label="Your guess"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <button type="submit" className="cr-go">
                Guess
              </button>
              <button type="button" className="cr-ghost" onClick={hint} disabled={nextHint() < 0}>
                Hint −{HINT_COST}
              </button>
              <button type="button" className="cr-ghost" onClick={() => giveUp()}>
                Give up
              </button>
            </form>
          )}
          <p className="cr-news" aria-live="polite">
            {news && !done ? news : !done ? "Start broad: a word about powers, places, people or stories. Then follow the heat." : ""}
          </p>

          <div className="cr-field">
            <div className="cr-board cr-radar-box">
              <Radar guesses={guesses} size={data.vocab.length} last={last} found={phase === "found"} />
            </div>
            <aside className="cr-leads" aria-label="Your guesses">
              <h2 className="cr-h">Your guesses, closest first</h2>
              {sorted.length === 0 ? (
                <p className="cr-empty">No guesses yet.</p>
              ) : (
                <ol className="cr-glist">
                  {sorted.slice(0, 12).map((g) => (
                    <li key={g.w} data-heat={heat(g.rank)} data-last={g.w === last}>
                      <span className="cr-gword">
                        {g.w}
                        {g.hint ? <small> hint</small> : null}
                      </span>
                      <span className="cr-heat">{HEAT_LABEL[heat(g.rank)]}</span>
                      <span className="cr-cos">
                        <span style={{ width: `${Math.max(0, g.cos) * 100}%` }} />
                      </span>
                      <span className="cr-num">{g.cos.toFixed(3)}</span>
                      <span className="cr-num">#{g.rank.toLocaleString("en")}</span>
                    </li>
                  ))}
                </ol>
              )}
              {sorted.length > 12 ? <p className="cr-note">and {sorted.length - 12} colder guesses</p> : null}
            </aside>
          </div>

          {done && cos ? (
            <div className="cr-debrief">
              <h3>The company “{word}” keeps</h3>
              <p>
                GloVe learned one vector per word from which words appear near it across Wikipedia and newswire. Words used in similar contexts point in
                similar directions, so the hidden word’s nearest neighbours are the words that share its company. Cosine compares directions only:
              </p>
              <p className="cr-formula">
                cos(a, b) = <span>a · b</span> / (<span>‖a‖ ‖b‖</span>)
              </p>
              <ol className="cr-neigh">
                {neighbours.map((i, k) => (
                  <li key={i}>
                    <span className="cr-rank">{k + 1}</span>
                    <span className="cr-gword">{data.vocab[i]}</span>
                    <span className="cr-cos">
                      <span style={{ width: `${Math.max(0, cos[i]) * 100}%` }} />
                    </span>
                    <span className="cr-num">{cos[i].toFixed(3)}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
