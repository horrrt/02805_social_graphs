// Cold Read, round 3 (Mix Desk). A page appears as its most used words. The
// player spreads 10 chips over the 8 LDA topics to guess the page's mixture,
// then sees the real one and every word coloured by the topic most likely to
// have produced it. Rules live in topics.ts; this file renders them.
import { useEffect, useRef, useState } from "react";
import { FINISH, type Level } from "./levels";
import { shuffled } from "./rules";
import { bestChips, CHIPS, grade, type MixDeskData, PAGES_PER_RUN, score, sizeBucket } from "./topics";

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
    // Private windows may refuse storage; names and best scores are conveniences.
  }
}

export function Intro() {
  return (
    <ol className="cr-steps">
      <li>
        <b>Read</b> the page’s most used words. LDA says each page is a mixture of topics, and each topic is a mixture of words.
      </li>
      <li>
        <b>Mix</b> the page: spread {CHIPS} chips over the 8 topics, more chips where you think more of the page comes from. Click a topic to add a
        chip.
      </li>
      <li>
        <b>Name</b> the topics as you go. The model only gives word lists; the names are yours. {PAGES_PER_RUN} pages make a run.
      </li>
    </ol>
  );
}


export function MixDeskGame({ data, random = Math.random, level }: { data: MixDeskData; random?: () => number; level?: Level }) {
  const run = level?.items ?? PAGES_PER_RUN;
  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const [chips, setChips] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [reads, setReads] = useState<number[]>([]);
  const [best, setBest] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setBest(readStore(BEST, 0));
    setNames(readStore<string[]>(NAMES, []));
  }, []);
  useEffect(() => {
    if (phase === "reveal" || phase === "done") nextBtn.current?.focus();
  }, [phase]);


  const page = order.length ? data.pages[order[at]] : null;
  const placed = chips.reduce((a, b) => a + b, 0);
  const left = CHIPS - placed;
  const revealed = phase === "reveal" || phase === "done";
  const got = page && revealed ? score(chips, page.theta) : 0;
  const ideal = page ? bestChips(page.theta) : [];

  const deal = (n: number) => {
    setAt(n);
    setChips(Array(data.K).fill(0));
    setPhase("mix");
  };

  const start = () => {
    setOrder(shuffled(data.pages.map((_, i) => i), random).slice(0, run));
    setTotal(0);
    setReads([]);
    deal(0);
  };

  const add = (k: number, d: number) => {
    if (phase !== "mix") return;
    if (d > 0 && left === 0) return;
    if (d < 0 && chips[k] === 0) return;
    setChips(chips.map((c, i) => (i === k ? c + d : c)));
  };

  const lock = () => {
    if (!page) return;
    const pts = score(chips, page.theta);
    const sum = total + pts;
    setTotal(sum);
    setReads([...reads, pts]);
    const last = at + 1 >= order.length;
    if (last && sum > best) {
      setBest(sum);
      writeStore(BEST, sum);
    }
    setPhase(last ? "done" : "reveal");
  };

  const rename = (k: number, v: string) => {
    const next = Array.from({ length: data.K }, (_, i) => (i === k ? v : (names[i] ?? "")));
    setNames(next);
    writeStore(NAMES, next);
  };

  const label = (k: number) => names[k]?.trim() || `Topic ${k + 1}`;

  return (
    <section className="cr-table" id="mix-desk" aria-label="Mix Desk">
      <div className="cr-hud" role="status">
        <span className="cr-box cr-score">
          <small>Score</small>
          <b key={total}>{total.toLocaleString("en")}</b>
        </span>
        <span className="cr-box">
          <small>Page</small>
          <b>
            {phase === "intro" ? 0 : at + 1}/{run}
          </b>
        </span>
        <span className="cr-box">
          <small>Last read</small>
          <b>{reads.length ? reads[reads.length - 1] : "–"}</b>
        </span>
        {level ? null : (
          <span className="cr-box">
            <small>Best run</small>
            <b>{best.toLocaleString("en")}</b>
          </span>
        )}
      </div>

      {phase === "intro" || !page ? (
        <div className="cr-start">
          <Intro />
          <button type="button" className="cr-go" onClick={start}>
            Open the first page
          </button>
        </div>
      ) : (
        <>
          <div className="cr-md-page">
            <span className="cr-face" data-size="xl" data-tone={1}>
              <img src={page.img} alt="" referrerPolicy="no-referrer" />
            </span>
            <div className="cr-md-head">
              <span className="cr-h">Page {at + 1} · how is it mixed?</span>
              <span className="cr-verdict">{page.name}</span>
            </div>
            <div className="cr-md-action">
              {revealed ? (
                <>
                  <span className="cr-stamp" data-grade={got >= 700 ? "good" : got >= 500 ? "ok" : "bad"}>
                    {grade(got)} · +{got}
                  </span>
                  <button
                    ref={nextBtn}
                    type="button"
                    className="cr-go"
                    onClick={phase === "done" ? (level ? () => level.onDone(total) : start) : () => deal(at + 1)}
                  >
                    {phase === "done" ? (level ? FINISH : "Play again") : "Next page"}
                  </button>
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
                  <button type="button" className="cr-go" onClick={lock} disabled={left > 0}>
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
                    <span className="cr-topic-true">
                      you {chips[k] * 10}% · page <b>{Math.round(page.theta[k] * 100)}%</b>
                    </span>
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
                A topic is a probability distribution over words: the words on each card are its most likely. A page is a mixture of topics: the
                percentages under the cards, which sum to 100%. The page’s words are now coloured by the topic most likely to have produced each one
                on this page. Hover a topic to pick out its words. Hollow pips show the best {CHIPS}-chip read.
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
