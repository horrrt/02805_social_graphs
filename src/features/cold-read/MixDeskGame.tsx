// Cold Read, round 3 (Mix Desk). A page appears as its most used words. The
// player spreads 10 chips over the 8 LDA topics to guess the page's mixture,
// then sees the real one and every word coloured by the topic most likely to
// have produced it. Rules live in topics.ts; this file renders them.
import { useEffect, useRef, useState } from "react";
import { BestBox, NextButton, ScoreBox, SkipLevel, Stat, useBest } from "./LevelParts";
import { LIMIT, speed, Ticker, timed, useCountdown, Worth } from "./pace";
import { mixDeskTour } from "./tours";
import { StartButtons, useTour } from "./Tutorial";
import type { Level } from "./levels";
import { shownName, shuffled } from "./rules";
import { bestChips, CHIPS, grade, type MixDeskData, PAGES_PER_RUN, score, sizeBucket } from "./topics";
import { Rules } from "./StartPanel";

const BEST = "cold-read:best3";
const NAMES = "cold-read:topic-names";

type Phase = "intro" | "mix" | "reveal" | "done";

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private windows may refuse storage; the names are a convenience.
  }
}

export function Intro() {
  return (
    <Rules
      rules={[
        ["Read", "the page’s most used words."],
        ["Spread", <>{CHIPS} chips over the topics you think the page is made of.</>],
        ["Lock in", "fast: the closer and quicker, the more points."],
      ]}
    />
  );
}


export function MixDeskGame({ data, random = Math.random, level, clock = Date.now }: {
  data: MixDeskData; random?: () => number; level?: Level; clock?: () => number;
}) {
  const run = level?.items ?? PAGES_PER_RUN;
  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const [chips, setChips] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [reads, setReads] = useState<number[]>([]);
  // Practice keeps its own best (normal and hard apart); a campaign level keeps none.
  const { best, record } = useBest(level ? null : BEST);
  const [names, setNames] = useState<string[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => setNames(readStore<string[]>(NAMES, [])), []);
  useEffect(() => {
    if (phase === "reveal" || phase === "done") nextBtn.current?.focus();
  }, [phase]);


  const page = order.length ? data.pages[order[at]] : null;
  const placed = chips.reduce((a, b) => a + b, 0);
  const left = CHIPS - placed;
  const revealed = phase === "reveal" || phase === "done";
  // The last read: how close the mix was (graded), and the points it earned after speed.
  const [read, setRead] = useState({ accuracy: 0, points: 0, factor: 1, timeUp: false });
  const [dealt, setDealt] = useState(0);
  const got = read.accuracy;
  const ideal = page ? bestChips(page.theta) : [];

  const deal = (n: number) => {
    setAt(n);
    setChips(Array(data.K).fill(0));
    setDealt((d) => d + 1);
    setPhase("mix");
  };

  const start = () => {
    setOrder(shuffled(data.pages.map((_, i) => i), random).slice(0, run));
    setTotal(0);
    setReads([]);
    deal(0);
  };
  const tour = useTour(mixDeskTour, start);

  const add = (k: number, d: number) => {
    if (phase !== "mix") return;
    // From the latest chips, so quick clicks each count and never pass ten.
    setChips((now) => {
      const placed = now.reduce((a, b) => a + b, 0);
      if ((d > 0 && placed >= CHIPS) || (d < 0 && now[k] === 0)) return now;
      return now.map((c, i) => (i === k ? c + d : c));
    });
  };

  // The mix scores its closeness times the speed. At the buzzer it locks as it stands, and chips never placed count as misses.
  const lock = (timeUp = false) => {
    if (!page) return;
    const placedNow = chips.reduce((a, b) => a + b, 0);
    const accuracy = Math.round(score(chips, page.theta) * (placedNow / CHIPS));
    const factor = speed(pace.stop(), LIMIT.mix);
    const pts = timed(accuracy, factor);
    setRead({ accuracy, points: pts, factor, timeUp });
    const sum = total + pts;
    setTotal(sum);
    setReads([...reads, pts]);
    const last = at + 1 >= order.length;
    if (last) record(sum);
    setPhase(last ? "done" : "reveal");
  };

  const pace = useCountdown(LIMIT.mix, phase === "mix", dealt, () => lock(true), clock);

  const rename = (k: number, v: string) => {
    const next = Array.from({ length: data.K }, (_, i) => (i === k ? v : (names[i] ?? "")));
    setNames(next);
    writeStore(NAMES, next);
  };

  const label = (k: number) => names[k]?.trim() || `Topic ${k + 1}`;

  return (
    <section className="cr-table" id="mix-desk" aria-label="Mix Desk">
      <div className="cr-hud" role="status">
        <ScoreBox points={total} level={level} />
        <Ticker countdown={pace} limitS={LIMIT.mix} active={phase === "mix"} />
        <Worth points={timed(1000, speed(pace.elapsed, LIMIT.mix))} active={phase === "mix"} />
        <Stat label="Page">
          {phase === "intro" ? 0 : at + 1}/{run}
        </Stat>
        <Stat label="Last read">{reads.length ? reads[reads.length - 1] : "–"}</Stat>
        <BestBox best={best} level={level} label="Best run" />
        <SkipLevel points={total} level={level} />
      </div>

      {phase === "intro" || !page ? (
        <div className="cr-start">
          <Intro />
          <StartButtons label="Start" start={start} tour={tour} round="mix" />
        </div>
      ) : (
        <>
          <div className="cr-md-page">
            <span className="cr-face" data-size="xl" data-tone={1}>
              <img src={page.img} alt="" referrerPolicy="no-referrer" />
            </span>
            <div className="cr-md-head">
              <span className="cr-h">Page {at + 1} · how is it mixed?</span>
              <span className="cr-verdict">{shownName(data, order[at])}</span>
            </div>
            <div className="cr-md-action">
              {revealed ? (
                <>
                  <span className="cr-stamp" data-grade={got >= 700 ? "good" : got >= 500 ? "ok" : "bad"}>
                    {read.timeUp ? "Time's up · " : ""}
                    {grade(got)} · +{read.points}
                  </span>
                  <NextButton
                    buttonRef={nextBtn}
                    level={level}
                    score={total}
                    over={phase === "done"}
                    nextLabel="Next page"
                    onNext={() => deal(at + 1)}
                    onAgain={start}
                  />
                </>
              ) : (
                <>
                  <span className="cr-chips-left" aria-live="polite">
                    {Array.from({ length: CHIPS }, (_, i) => (
                      <span key={i} data-on={i < left} />
                    ))}
                    <small>
                      {left} {left === 1 ? "chip" : "chips"} left
                    </small>
                  </span>
                  <button type="button" className="cr-go" onClick={() => lock()} disabled={left > 0}>
                    Lock in the mix
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="cr-bag" aria-label="The page's most used words">
            {page.words.map(([w, n, k]) => (
              <span
                key={w}
                className="cr-bag-word"
                data-size={sizeBucket(n, page.words[0][1])}
                data-topic={revealed ? k : undefined}
                data-dim={revealed && hover !== null && hover !== k}
                title={`${n} uses`}
              >
                {w}
              </span>
            ))}
          </div>

          <div className="cr-desk">
            {data.topics.map((t, k) => (
              <div
                key={k}
                className="cr-topic"
                data-topic={k}
                data-has={chips[k] > 0}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
              >
                <input
                  className="cr-topic-name"
                  value={names[k] ?? ""}
                  placeholder={`Topic ${k + 1}`}
                  onChange={(e) => rename(k, e.target.value)}
                  aria-label={`Your name for topic ${k + 1}`}
                  maxLength={24}
                />
                <button type="button" className="cr-topic-body" onClick={() => add(k, 1)} disabled={phase !== "mix" || left === 0} aria-label={`Add a chip to ${label(k)}`}>
                  <span className="cr-topic-words">{t.words.slice(0, 6).map(([w]) => w).join(" · ")}</span>
                  <span className="cr-pips" aria-hidden="true">
                    {Array.from({ length: CHIPS }, (_, i) => (
                      <span key={i} data-on={i < chips[k]} data-true={revealed && i < ideal[k]} />
                    ))}
                  </span>
                </button>
                <span className="cr-topic-foot">
                  {revealed ? (
                    <Off mine={chips[k]} best={ideal[k]} />
                  ) : (
                    <>
                      <button type="button" className="cr-minus" onClick={() => add(k, -1)} disabled={chips[k] === 0} aria-label={`Take a chip from ${label(k)}`}>
                        −
                      </button>
                      <b>{chips[k]}</b>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          {revealed ? (
            <div className="cr-debrief">
              <h3>Two kinds of mixture</h3>
              <p>
                A topic is a probability distribution over words: the words on each card are its most likely. A page is a mixture of topics, here in
                tenths: the hollow pips show the page’s own {CHIPS}-chip mix, and under each card how far your chips were off. The page’s words are now coloured by the topic most likely to have produced each one
                on this page. Hover a topic to pick out its words.
              </p>
              <p>
                The model chose none of the names on the cards. It found 8 word lists because we asked for 8, from pages with the names taken out,
                starting from random seed 0. Change any of those and the topics change too: the preprocessing is part of the model.
              </p>
              {phase === "done" ? (
                <p className="cr-run">
                  Run over: {reads.join(" + ")} = <b>{total.toLocaleString("en")}</b> points.
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

/** Under a revealed topic: how many chips you were off from the page's own mix. */
function Off({ mine, best }: { mine: number; best: number }) {
  const d = mine - best;
  if (mine === 0 && best === 0) return null;
  const text = d === 0 ? "Spot on" : d > 0 ? `${d} too many` : `${-d} too few`;
  return (
    <span className="cr-topic-true" data-off={d !== 0}>
      {text}
    </span>
  );
}
