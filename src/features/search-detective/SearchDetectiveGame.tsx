// Semantic Search Detective, the Week 7 game. Each case is a query and four
// cards. The player predicts the best match, then inspects the ranking a
// semantic search would give (hand-set, illustrative scores) next to what a
// keyword search would do, then explores a hand-placed 2D map of the cards.
// The cases and the scoring are in rounds.ts; this file renders them, and
// takes the cases as a prop so tests can play it without a page.
import { type KeyboardEvent, type Ref, useEffect, useRef, useState } from "react";
import { CosineFormula } from "@/features/cold-read/Formulas";
import { BestBox, ScoreBox, SkipLevel, Stat, useBest, useKeys } from "@/features/cold-read/LevelParts";
import { FINISH, type Level } from "@/features/cold-read/levels";
import { Rules } from "@/features/cold-read/StartPanel";
import { byMapDistance, bySimilarity, keywordMisses, keywordTop, maxScore, POINTS, ROUNDS, type Round, scorePick, shared } from "./rounds";

const BEST = "search-detective:best";

type Phase = "intro" | "predict" | "inspect" | "explore" | "done";
type Result = { id: string; pick: string; points: number; grade: "hit" | "near" | "miss"; bonus: number };

const STEPS = [
  ["predict", "Predict"],
  ["inspect", "Inspect"],
  ["explore", "Explore"],
] as const;

const GRADE = { hit: "Case solved", near: "Close", miss: "Wrong suspect" } as const;
const STAMP = { hit: "good", near: "ok", miss: "bad" } as const;

export function Intro() {
  return (
    <Rules
      rules={[
        ["Predict", "which of four documents best answers a search query."],
        ["Inspect", "the ranking a semantic search gives, and what a keyword search would have done."],
        ["Explore", "a 2D map of the documents, and see where it can mislead."],
      ]}
    />
  );
}

/** "A", "A and B", "A, B and C". */
const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

/** One sentence on what a keyword search does with this case, from the shared words. */
export function keywordLine(round: Round) {
  const top = keywordTop(round);
  const n = shared(round.query, top[0]).length;
  if (n === 0) return "Keyword search finds nothing here: no card shares a word with the query.";
  const word = n === 1 ? "word" : "words";
  if (top.length > 1) return `Keyword search cannot separate ${list(top.map((d) => d.title))}: each shares ${n} ${word} with the query.`;
  const hits = shared(round.query, top[0]).map((w) => `“${w}”`);
  return `Keyword search would put ${top[0].title} first, because it shares ${list(hits)} with the query.`;
}

/** Why a bonus was earned: keyword search ranks another card first, or cannot single the answer out. */
export function bonusReason(round: Round) {
  const top = keywordTop(round);
  return top.length > 1 ? "keyword search cannot single this one out" : `keyword search ranks ${top[0].title} first`;
}

// As a campaign level it plays the first `level.items` cases, and the final screen hands its points to level.onDone.
export function SearchDetectiveGame({ rounds: all = ROUNDS, level }: { rounds?: Round[]; level?: Level }) {
  const rounds = level ? all.slice(0, level.items) : all;
  const [phase, setPhase] = useState<Phase>("intro");
  const [at, setAt] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState<string>("query");
  const { best, record } = useBest(level ? null : BEST);
  const [isNew, setIsNew] = useState(false);
  const action = useRef<HTMLButtonElement>(null);
  const table = useRef<HTMLElement>(null);

  const round = rounds[at];
  const total = results.reduce((sum, r) => sum + r.points, 0);
  const result = results[at];

  useEffect(() => {
    if (phase === "inspect" || phase === "explore" || phase === "done") action.current?.focus({ preventScroll: true });
    // A new case puts focus on its first card, so the keyboard carries on from there.
    if (phase === "predict") table.current?.querySelector<HTMLInputElement>(".sd-doc input")?.focus({ preventScroll: true });
    if (phase !== "intro") table.current?.scrollIntoView?.({ block: "nearest" });
  }, [phase, at]);

  const start = () => {
    setAt(0);
    setPick(null);
    setResults([]);
    setIsNew(false);
    setPhase("predict");
  };

  const submit = () => {
    if (!pick) return;
    const s = scorePick(round, pick);
    setResults([...results, { id: round.id, pick, ...s }]);
    setPhase("inspect");
  };

  const explore = () => {
    setSelected(bySimilarity(round)[0].key);
    setPhase("explore");
  };

  const next = () => {
    if (at + 1 >= rounds.length) {
      setIsNew(record(total));
      setPhase("done");
      return;
    }
    setAt(at + 1);
    setPick(null);
    setPhase("predict");
  };

  // 1 to 4 pick a card while predicting.
  useKeys(Object.fromEntries((round?.docs ?? []).map((d, i) => [String(i + 1), () => setPick(d.key)])), phase === "predict");

  return (
    <section className="cr-table sd-table" id="search-detective" aria-label="Semantic Search Detective" ref={table}>
      <div className="cr-hud" role="status">
        <ScoreBox points={total} level={level} />
        <Stat label="Case">
          {phase === "intro" ? 0 : Math.min(at + 1, rounds.length)}/{rounds.length}
        </Stat>
        <Stat label="Last case">{results.length ? `+${results.at(-1)!.points}` : "–"}</Stat>
        <BestBox best={best} level={level} />
        <SkipLevel points={total} level={level} />
      </div>

      {phase === "intro" ? (
        <div className="cr-start">
          <p className="sd-lede">
            You are a search detective. For each query, pick the document that answers it best, even when it uses none of the query’s words. {rounds.length} cases,
            about {Math.max(1, Math.round((rounds.length * 2) / 3))} minutes.
          </p>
          <Intro />
          <div className="cr-start-row">
            <p className="cr-note">
              {POINTS.hit} points for the best match, {POINTS.near} for the runner-up, and a {POINTS.bonus}-point bonus when the best match is one that
              keyword search cannot put first.
            </p>
            <div className="cr-start-go">
              <button type="button" className="cr-go" onClick={start}>
                Start
              </button>
            </div>
          </div>
        </div>
      ) : phase === "done" ? (
        <Final rounds={rounds} results={results} total={total} isNew={isNew} again={level ? () => level.onDone(total) : start} inCampaign={Boolean(level)} buttonRef={action} />
      ) : (
        <div className="sd-case">
          <Progress rounds={rounds} at={at} phase={phase} results={results} />
          <div className="sd-query">
            <span className="cr-h">
              Case {at + 1} · {round.kind}
            </span>
            <p className="sd-query-text">
              <span aria-hidden="true" className="sd-glass" />
              <q>{round.query}</q>
            </p>
          </div>

          {phase === "predict" ? (
            <fieldset className="sd-pick">
              <legend>Which document is the most relevant?</legend>
              <div className="sd-docs">
                {round.docs.map((d, i) => (
                  <label key={d.key} className="sd-doc" data-on={pick === d.key}>
                    <input type="radio" name={`case-${round.id}`} value={d.key} checked={pick === d.key} onChange={() => setPick(d.key)} />
                    <kbd className="cr-key-inline" aria-hidden="true">
                      {i + 1}
                    </kbd>
                    <span>
                      <b>{d.title}</b>
                      <small>{d.text}</small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="sd-actions">
                <button type="button" className="cr-go" onClick={submit} disabled={!pick}>
                  Submit answer
                </button>
              </div>
            </fieldset>
          ) : phase === "inspect" ? (
            <Inspect round={round} result={result} onNext={explore} buttonRef={action} />
          ) : (
            <Explore
              round={round}
              pick={result.pick}
              selected={selected}
              onSelect={setSelected}
              first={at === 0}
              last={at + 1 >= rounds.length}
              onNext={next}
              buttonRef={action}
            />
          )}
        </div>
      )}
    </section>
  );
}

/** The case bar: one segment per case, then the three steps of this one. */
function Progress({ rounds, at, phase, results }: { rounds: Round[]; at: number; phase: Phase; results: Result[] }) {
  return (
    <div className="sd-progress">
      <ol className="sd-cases" aria-label={`Case ${at + 1} of ${rounds.length}`}>
        {rounds.map((r, i) => (
          <li key={r.id} data-state={i < at || (i === at && results[i]) ? results[i]?.grade : i === at ? "now" : "todo"} />
        ))}
      </ol>
      <ol className="sd-steps" aria-label="Steps">
        {STEPS.map(([id, label], i) => (
          <li key={id} aria-current={phase === id ? "step" : undefined}>
            <span>{i + 1}</span> {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Inspect({ round, result, onNext, buttonRef }: { round: Round; result: Result; onNext: () => void; buttonRef: Ref<HTMLButtonElement> }) {
  const ranked = bySimilarity(round);
  const top = ranked[0];
  return (
    <div className="sd-inspect">
      <div className="sd-verdict">
        <span className="cr-stamp" data-grade={STAMP[result.grade]}>
          {GRADE[result.grade]} · +{result.points}
        </span>
        {result.bonus ? <span className="sd-bonus">+{result.bonus} bonus: {bonusReason(round)}</span> : null}
      </div>
      <div className="sd-ranking">
        <h3>Semantic search ranking</h3>
        <ol className="sd-bars">
          {ranked.map((d, i) => (
            <li key={d.key} data-top={i === 0} data-accepted={round.accept.includes(d.key)}>
              <span className="sd-rank">{i + 1}</span>
              <span className="sd-bar-title">
                {d.title}
                {d.key === result.pick ? <em>your pick</em> : null}
              </span>
              <span className="sd-bar" aria-hidden="true">
                <span style={{ width: `${Math.round(d.cos * 100)}%` }} />
              </span>
              <span className="sd-cos">{d.cos.toFixed(2)}</span>
              <span className="sd-shared">{shared(round.query, d).length ? shared(round.query, d).map((w) => `“${w}”`).join(" ") : "no shared words"}</span>
            </li>
          ))}
        </ol>
        <p className="cr-note">
          Cosine similarity to the query. These scores are illustrative, set by hand for this lesson; no embedding model computed them. The last column
          lists the query words each document shares exactly.
        </p>
      </div>
      <div className="cr-debrief sd-why">
        <h3>Why {top.title} comes first</h3>
        <p>{round.why}</p>
        <p>
          <b>{keywordLine(round)}</b>
          {keywordMisses(round) ? " Semantic search compares meaning, so it does not need the same words." : " Here the words and the meaning agree."}
        </p>
      </div>
      <div className="sd-actions">
        <button ref={buttonRef} type="button" className="cr-go" onClick={onNext}>
          Explore the map →
        </button>
      </div>
    </div>
  );
}

// The map's frame in SVG units; text inside is drawn at about 1:1 on a wide screen.
const W = 560;
const H = 380;
const PAD = 34;
const sx = (x: number) => PAD + (x / 100) * (W - 2 * PAD);
const sy = (y: number) => H - PAD - (y / 100) * (H - 2 * PAD);

function Explore({ round, pick, selected, onSelect, first, last, onNext, buttonRef }: {
  round: Round; pick: string; selected: string; onSelect: (key: string) => void; first: boolean; last: boolean; onNext: () => void; buttonRef: Ref<HTMLButtonElement>;
}) {
  const ranked = bySimilarity(round);
  const top = ranked[0];
  const nearest = byMapDistance(round)[0];
  const doc = round.docs.find((d) => d.key === selected);
  const points = [{ key: "query", title: "Your query", at: round.queryAt }, ...round.docs];
  const press = (key: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(key);
    }
  };
  return (
    <div className="sd-explore">
      <figure className="sd-map">
        <figcaption>
          <span className="cr-h">Document map, 2D picture</span>
          <span className="sd-legend">
            <span data-kind="query">Query</span>
            <span data-kind="top">Top result</span>
            <span data-kind="doc">Other document</span>
          </span>
        </figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Documents placed on a 2D map. Select a point to read its document.">
          <rect className="sd-map-frame" x={PAD / 2} y={PAD / 2} width={W - PAD} height={H - PAD} rx={10} />
          {points.map((p) => {
            const kind = p.key === "query" ? "query" : p.key === top.key ? "top" : "doc";
            const x = sx(p.at[0]);
            const y = sy(p.at[1]);
            return (
              <g
                key={p.key}
                className="sd-point"
                data-kind={kind}
                data-on={selected === p.key}
                data-pick={p.key === pick}
                role="button"
                tabIndex={0}
                aria-pressed={selected === p.key}
                aria-label={p.title}
                onClick={() => onSelect(p.key)}
                onKeyDown={press(p.key)}
              >
                <circle className="sd-hit" cx={x} cy={y} r={18} />
                {kind === "query" ? <rect className="sd-dot" x={x - 8} y={y - 8} width={16} height={16} transform={`rotate(45 ${x} ${y})`} /> : <circle className="sd-dot" cx={x} cy={y} r={8} />}
                {/* Labels on the right half point left, so they stay inside the frame. */}
                <text x={p.at[0] > 60 ? x - 22 : x + 22} y={y + 5} textAnchor={p.at[0] > 60 ? "end" : "start"}>
                  {p.title}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="cr-note">Hand-placed for this lesson. The two directions have no meaning of their own; only the points’ arrangement is drawn.</p>
      </figure>

      <div className="sd-side">
        <div className="sd-detail" aria-live="polite">
          {doc ? (
            <>
              <span className="cr-h">Selected document</span>
              <h3>{doc.title}</h3>
              <p>{doc.text}</p>
              <dl>
                <dt>Cosine with the query</dt>
                <dd>
                  {doc.cos.toFixed(2)} <small>(rank {ranked.indexOf(doc) + 1} of {ranked.length})</small>
                </dd>
                <dt>Distance on this map</dt>
                <dd>
                  rank {byMapDistance(round).indexOf(doc) + 1} of {ranked.length}
                </dd>
              </dl>
            </>
          ) : (
            <>
              <span className="cr-h">Your query</span>
              <h3>
                <q>{round.query}</q>
              </h3>
              <p>A query is embedded the same way as a document, so the two can be compared. Select a document to see how it scores.</p>
            </>
          )}
        </div>

        <div className="sd-compare" data-agree={nearest.key === top.key}>
          <p>
            Nearest on the map: <b>{nearest.title}</b>
            <br />
            Highest cosine: <b>{top.title}</b>
          </p>
          <p>{round.map}</p>
        </div>

        <details className="sd-how" open={first}>
          <summary>How semantic search works</summary>
          <ol>
            <li>Each document becomes a vector, a long list of numbers: its embedding. The query becomes one too.</li>
            <li>
              The search compares the query’s vector with every document’s using cosine similarity, which measures the angle between them:
              <span className="cr-formula">
                <CosineFormula />
              </span>
            </li>
            <li>Documents are ranked by that score, so a match need not share a single word with the query.</li>
          </ol>
          <p className="sd-warn">
            <b>The map is only a picture.</b> Embeddings have hundreds of dimensions; any 2D projection must distort some distances. Rank with the cosine
            in the original space, never with distances on the map, and do not read a cluster on the map as proof that documents are related.
          </p>
        </details>

        <div className="sd-actions">
          <button ref={buttonRef} type="button" className="cr-go" onClick={onNext}>
            {last ? "See the results" : "Next case →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Final({ rounds, results, total, isNew, again, inCampaign, buttonRef }: {
  rounds: Round[]; results: Result[]; total: number; isNew: boolean; again: () => void; inCampaign: boolean; buttonRef: Ref<HTMLButtonElement>;
}) {
  const max = maxScore(rounds);
  const solved = results.filter((r) => r.grade === "hit").length;
  return (
    <div className="sd-final">
      <span className="cr-h">Case file closed</span>
      <p className="cr-verdict">
        {total.toLocaleString("en")} <small>of {max.toLocaleString("en")} points</small>
      </p>
      <p className="sd-final-sub">
        {solved} of {rounds.length} cases solved{isNew ? " · a new best in this browser" : ""}.
      </p>
      <ol className="sd-final-list">
        {rounds.map((r, i) => {
          const res = results[i];
          const picked = r.docs.find((d) => d.key === res?.pick);
          return (
            <li key={r.id} data-grade={res?.grade}>
              <q>{r.query}</q>
              <span>
                {res?.grade === "hit" ? "✓" : res?.grade === "near" ? "≈" : "✗"} {picked?.title}
                {res?.grade !== "hit" ? ` (best: ${bySimilarity(r)[0].title})` : ""}
              </span>
              <b>+{res?.points ?? 0}</b>
            </li>
          );
        })}
      </ol>
      <div className="cr-debrief sd-takeaway">
        <h3>What semantic search can and cannot promise</h3>
        <p>
          <b>It can</b> find a document that answers a query in different words, because it compares meanings captured in vectors, not the words
          themselves.
        </p>
        <p>
          <b>It cannot</b> guarantee the result you meant. A high cosine means “similar to this query”, not “true” or “what you wanted”: an
          ambiguous query like “Black Widow” scores two meanings almost equally, and the vectors only know what their training text taught them.
        </p>
        <p>
          <b>And a 2D map is a sketch</b> of those vectors. Use it to look around; rank and pick neighbours with cosine in the full space.
        </p>
      </div>
      <div className="sd-actions">
        <button ref={buttonRef} type="button" className="cr-go" onClick={again}>
          {inCampaign ? FINISH : "Play again"}
        </button>
      </div>
    </div>
  );
}
