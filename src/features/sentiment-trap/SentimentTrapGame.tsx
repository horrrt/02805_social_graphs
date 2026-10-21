// Sentiment Trap, a Week 7 game for section 4 (sentiment as a measurement).
// Each challenge shows a sentence and three instruments' real readings of it:
// a word-score sum, a TF-IDF classifier and a contextual model. The player can
// inspect what each one used, then picks what should make them distrust the
// score. The challenges are in challenges.ts, the numbers in the data file
// analysis/week07_sentiment_trap.py writes; the data comes in as a prop so
// tests can play a game without a page.
import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import { BestBox, ScoreBox, SkipLevel, Stat, useBest } from "@/features/cold-read/LevelParts";
import { FINISH, type Level } from "@/features/cold-read/levels";
import { Rules } from "@/features/cold-read/StartPanel";
import { CHALLENGES, type Challenge, POINTS, reflection } from "./challenges";
import { count, type Label, type Reading, type SentimentTrapData, type Sentence, score3, signed } from "./data";

const BEST = "sentiment-trap:best";

type Phase = "intro" | "play" | "final";
type Lens = "words" | "weights" | "context";

const LENSES: [Lens, string][] = [
  ["words", "Word scores"],
  ["weights", "Learned weights"],
  ["context", "Confidence"],
];

export function Intro() {
  return (
    <Rules
      rules={[
        ["Read the sentence", "and the three instruments’ scores for it."],
        ["Inspect", "what each one used: word scores, learned weights, confidence. It’s optional."],
        ["Pick", "what should make you distrust the score. +100 for a good catch."],
      ]}
    />
  );
}

/** A label with a glyph, so the colour is never the only cue. */
function Badge({ label }: { label: Label }) {
  const glyph = label === "POSITIVE" ? "▲" : label === "NEGATIVE" ? "▼" : "●";
  return (
    <span className="st-badge" data-label={label}>
      <span aria-hidden="true">{glyph}</span> {label}
    </span>
  );
}

/** A 0..1 meter. */
function Meter({ value, label, tone }: { value: number; label: string; tone: Label }) {
  return (
    <span className="st-meter" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={value} aria-label={label} data-label={tone}>
      <span style={{ width: `${Math.round(value * 100)}%` }} />
    </span>
  );
}

const BookIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="st-icon">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);
const WeightsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="st-icon">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const LensIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="st-icon">
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="m15.5 15.5 6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const ICONS: Record<Lens, () => ReactNode> = { words: BookIcon, weights: WeightsIcon, context: LensIcon };

/** The sentence with its words; inspecting lights the scored and focus words. */
function SentenceCard({ sentence, focus, lit, clash }: { sentence: Sentence; focus: string[]; lit: boolean; clash: boolean }) {
  const valence = new Map(sentence.words.map((w) => [w.w, w.valence]));
  const parts = sentence.text.split(/([A-Za-z]+(?:'[a-z]+)?)/);
  return (
    <blockquote className="st-sentence" data-clash={clash}>
      <p>
        “
        {parts.map((part, i) => {
          if (i % 2 === 0) return part;
          const w = part.toLowerCase();
          const v = valence.get(w);
          const isFocus = focus.includes(w);
          if (!lit || (v == null && !isFocus)) return <span key={i}>{part}</span>;
          return (
            <mark key={i} className="st-word" data-tone={v == null ? "none" : v > 0 ? "pos" : "neg"} data-focus={isFocus}>
              {part}
              <small>{v == null ? "no score" : signed(v)}</small>
            </mark>
          );
        })}
        ”
      </p>
    </blockquote>
  );
}

function PageCard({ data, lit }: { data: SentimentTrapData; lit: boolean }) {
  const p = data.pages.shown;
  return (
    <blockquote className="st-sentence st-page">
      <p>“{p.opening}”</p>
      <footer>
        First sentence of the Wikipedia page on {p.name}. Every instrument read the whole page, {count(p.words)} words.
        {lit ? ` The word sum adds up every scored word in it: ${signed(p.lexicon.sum)}.` : ""}
      </footer>
    </blockquote>
  );
}

/** The three instruments' readings, each opening its detail when its lens is on. */
function Instruments({ data, reading, words, lenses, focus }: { data: SentimentTrapData; reading: Reading; words?: Sentence["words"]; lenses: Set<Lens>; focus: string[] }) {
  const ins = data.instruments;
  const scored = (words ?? []).filter((w) => w.valence != null || focus.includes(w.w));
  const unseen = (words ?? []).filter((w) => focus.includes(w.w) && w.weight == null);
  const parts = reading.classifier.parts.slice(0, 5);
  const top = Math.max(...parts.map((x) => Math.abs(x.contribution)), 0.01);
  return (
    <div className="st-instruments">
      <article className="st-card" data-open={lenses.has("words")}>
        <header>
          <BookIcon />
          <span>
            <b>Word scores</b>
            <small>Lookup table</small>
          </span>
        </header>
        <div className="st-reading">
          <Badge label={reading.lexicon.label} />
          <span className="st-num">Sum {signed(reading.lexicon.sum)}</span>
        </div>
        {lenses.has("words") ? (
          words ? (
            <ul className="st-detail">
              {scored.map((w, i) => (
                <li key={`${w.w}${i}`}>
                  <span>{w.w}</span>
                  <b>{w.valence == null ? "no score" : signed(w.valence)}</b>
                </li>
              ))}
              <li className="st-total">
                <span>Sum</span>
                <b>{signed(reading.lexicon.sum)}</b>
              </li>
            </ul>
          ) : (
            <p className="st-detail-note">Every scored word on the page, added up.</p>
          )
        ) : null}
        <p className="st-foot">Each word’s score from the {ins.lexicon.source}, added up with no rules for “not” or “but”.</p>
      </article>

      <article className="st-card" data-open={lenses.has("weights")}>
        <header>
          <WeightsIcon />
          <span>
            <b>Learned patterns</b>
            <small>TF-IDF + logistic regression</small>
          </span>
        </header>
        <div className="st-reading">
          <Badge label={reading.classifier.label} />
          <span className="st-num">P(positive) {reading.classifier.p.toFixed(2)}</span>
        </div>
        <Meter value={reading.classifier.p} label="Probability of positive" tone={reading.classifier.label} />
        {lenses.has("weights") ? (
          <ul className="st-detail st-bars">
            {parts.map((x) => (
              <li key={x.w}>
                <span>{x.w}</span>
                <span className="st-bar" data-tone={x.contribution > 0 ? "pos" : "neg"}>
                  <span style={{ width: `${(Math.abs(x.contribution) / top) * 100}%` }} />
                </span>
                <b>{signed(x.contribution, 2)}</b>
              </li>
            ))}
            {unseen.map((w) => (
              <li key={`unseen-${w.w}`} className="st-unseen">
                <span>{w.w}</span>
                <b>never in training</b>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="st-foot">
          Weights learned from {count(ins.classifier.trainSize)} {ins.classifier.train}. Right on {Math.round(ins.classifier.accuracy * 100)}% of{" "}
          {count(ins.classifier.validSize)} held-out review sentences.
        </p>
      </article>

      <article className="st-card" data-open={lenses.has("context")}>
        <header>
          <LensIcon />
          <span>
            <b>Contextual model</b>
            <small>DistilBERT, fine-tuned on movie reviews</small>
          </span>
        </header>
        <div className="st-reading">
          <Badge label={reading.contextual.label} />
          <span className="st-num">Confidence {score3(reading.contextual.score)}</span>
        </div>
        <Meter value={reading.contextual.score} label="Confidence in its own label" tone={reading.contextual.label} />
        {lenses.has("context") ? (
          <p className="st-detail-note">
            Confidence is the model’s probability for its own label, out of two: POSITIVE or NEGATIVE. It says how sure the model is, not whether the
            label fits what you wanted to measure.
          </p>
        ) : null}
        <p className="st-foot">Reads each word in the light of the others. Real output of {ins.contextual.model}.</p>
      </article>
    </div>
  );
}

function Progress({ at, results }: { at: number; results: boolean[] }) {
  return (
    <ol className="st-progress" aria-label="Challenges">
      {CHALLENGES.map((c, i) => (
        <li key={c.id} data-state={i < results.length ? (results[i] ? "right" : "wrong") : i === at ? "now" : "next"}>
          <span className="st-sr">
            {c.title}: {i < results.length ? (results[i] ? "caught" : "missed") : i === at ? "now" : "to come"}
          </span>
        </li>
      ))}
    </ol>
  );
}

// As a campaign level it plays every challenge, then the final screen hands its points to level.onDone.
export function SentimentTrapGame({ data, level }: { data: SentimentTrapData; level?: Level }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [at, setAt] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [lenses, setLenses] = useState<Set<Lens>>(new Set());
  const [reflect, setReflect] = useState<string | null>(null);
  const [reflected, setReflected] = useState(false);
  const { best, record } = useBest(level ? null : BEST);
  const [isNew, setIsNew] = useState(false);
  const action = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const correct = results.filter(Boolean).length;
  const done = results.length === CHALLENGES.length;
  const total = correct * POINTS.correct + (done ? POINTS.bonus : 0) + (reflected && reflect === reflection(data).answer ? POINTS.reflection : 0);

  useEffect(() => {
    if (submitted) action.current?.focus({ preventScroll: true });
  }, [submitted]);
  useEffect(() => {
    if (phase !== "intro") heading.current?.focus({ preventScroll: true });
  }, [phase, at]);
  useEffect(() => {
    if (phase === "final" && record(total)) setIsNew(true);
  }, [phase, total]);

  const start = () => {
    setAt(0);
    setResults([]);
    setChoice(null);
    setSubmitted(false);
    setLenses(new Set());
    setReflect(null);
    setReflected(false);
    setIsNew(false);
    setPhase("play");
  };

  const submit = () => {
    if (!choice || submitted) return;
    setSubmitted(true);
    setResults([...results, choice === CHALLENGES[at].answer]);
  };

  const next = () => {
    if (at + 1 >= CHALLENGES.length) {
      setPhase("final");
      return;
    }
    setAt(at + 1);
    setChoice(null);
    setSubmitted(false);
    setLenses(new Set());
  };

  const toggle = (lens: Lens) =>
    setLenses((before) => {
      const s = new Set(before);
      if (s.has(lens)) s.delete(lens);
      else s.add(lens);
      return s;
    });

  return (
    <section className="cr-table st-table" id="sentiment-trap" aria-label="Sentiment Trap">
      <div className="cr-hud" role="status">
        <ScoreBox points={total} level={level} />
        <Stat label="Challenge">
          {String(phase === "intro" ? 0 : Math.min(at + 1, CHALLENGES.length)).padStart(2, "0")} / {String(CHALLENGES.length).padStart(2, "0")}
        </Stat>
        <Stat label="Caught">
          {correct}/{results.length}
        </Stat>
        <BestBox best={best} level={level} />
        <SkipLevel points={total} level={level} />
      </div>

      {phase === "intro" ? (
        <IntroScreen data={data} onStart={start} />
      ) : phase === "final" ? (
        <Final
          data={data}
          results={results}
          total={total}
          isNew={isNew}
          reflect={reflect}
          reflected={reflected}
          onReflect={setReflect}
          onCheck={() => setReflected(true)}
          again={level ? () => level.onDone(total) : start}
          inCampaign={Boolean(level)}
          headingRef={heading}
        />
      ) : (
        <Round
          data={data}
          challenge={CHALLENGES[at]}
          at={at}
          results={results}
          choice={choice}
          submitted={submitted}
          lenses={lenses}
          onToggle={toggle}
          onChoose={setChoice}
          onSubmit={submit}
          onNext={next}
          buttonRef={action}
          headingRef={heading}
        />
      )}
    </section>
  );
}

function IntroScreen({ data, onStart }: { data: SentimentTrapData; onStart: () => void }) {
  const s = data.sentences.sarcasm;
  return (
    <div className="cr-start st-intro">
      <div className="st-intro-text">
        <p className="st-ask">Can you trust the score?</p>
        <p className="st-intro-lede">
          Three sentiment instruments read the same sentence and hand back a label. Can you spot when the label isn’t measuring what you care about?
          Four sentences, about two minutes.
        </p>
        <Intro />
        <div className="cr-start-row">
          <p className="cr-note">Every score is the real output of the instrument named on its card.</p>
          <div className="cr-start-go">
            <button type="button" className="cr-go" onClick={onStart}>
              Start challenge →
            </button>
          </div>
        </div>
      </div>
      <figure className="st-sample" aria-label="Example: three readings of one sentence">
        <blockquote className="st-bubble">“{s.text}”</blockquote>
        <div className="st-sample-row">
          <SampleCard icon={<BookIcon />} name="Word scores" label={s.lexicon.label} value={signed(s.lexicon.sum)} />
          <SampleCard icon={<WeightsIcon />} name="Classifier" label={s.classifier.label} value={s.classifier.p.toFixed(2)} />
          <SampleCard icon={<LensIcon />} name="Contextual" label={s.contextual.label} value={score3(s.contextual.score)} />
        </div>
        <figcaption className="cr-note">All three call it positive. Do you?</figcaption>
      </figure>
    </div>
  );
}

function SampleCard({ icon, name, label, value }: { icon: ReactNode; name: string; label: Label; value: string }) {
  return (
    <span className="st-mini">
      {icon}
      <b>{name}</b>
      <Badge label={label} />
      <span className="st-num">{value}</span>
    </span>
  );
}

function Round(props: {
  data: SentimentTrapData;
  challenge: Challenge;
  at: number;
  results: boolean[];
  choice: string | null;
  submitted: boolean;
  lenses: Set<Lens>;
  onToggle: (l: Lens) => void;
  onChoose: (id: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  buttonRef: Ref<HTMLButtonElement>;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const { data, challenge: c, at, results, choice, submitted, lenses } = props;
  const sentence = c.source === "page" ? null : data.sentences[c.source];
  const reading: Reading = sentence ?? data.pages.shown;
  const options = c.options(data);
  const right = choice === c.answer;
  const picked = options.find((o) => o.id === choice);
  return (
    <div className="st-round">
      <Progress at={at} results={results} />
      <h2 className="st-title" tabIndex={-1} ref={props.headingRef}>
        Challenge {at + 1} — {c.title}
      </h2>
      <p className="st-lede">{c.lede}</p>
      <div className="st-layout">
        <div className="st-main">
          {sentence ? <SentenceCard sentence={sentence} focus={c.focus} lit={lenses.has("words") || submitted} clash={submitted} /> : <PageCard data={data} lit={lenses.has("words")} />}
          <Instruments data={data} reading={reading} words={sentence?.words} lenses={lenses} focus={c.focus} />
          {submitted ? (
            <div className="cr-debrief st-feedback" data-right={right} role="status">
              <span className="st-verdict">
                <span className="st-mark" aria-hidden="true">
                  {right ? "✓" : "✗"}
                </span>
                <span>
                  <b>{right ? "Good catch" : "Look closer"}</b>
                  {right ? ` +${POINTS.correct}` : ""}
                </span>
              </span>
              {!right && picked?.why ? (
                <p>
                  <b>Your answer:</b> {picked.why}
                </p>
              ) : null}
              {!right ? (
                <p>
                  <b>The catch:</b> {options.find((o) => o.id === c.answer)?.text}
                </p>
              ) : null}
              <h3>Why?</h3>
              <p>{c.explain(data)}</p>
              <p className="st-lesson">{c.lesson}</p>
              <div className="st-actions">
                <button ref={props.buttonRef} type="button" className="cr-go" onClick={props.onNext}>
                  {at + 1 >= CHALLENGES.length ? "See the takeaway →" : "Next challenge →"}
                </button>
              </div>
            </div>
          ) : (
            <form
              className="st-question"
              onSubmit={(e) => {
                e.preventDefault();
                props.onSubmit();
              }}
            >
              <fieldset>
                <legend>{c.question(data)}</legend>
                <div className="st-options">
                  {options.map((o) => (
                    <label key={o.id} className="st-option" data-on={choice === o.id}>
                      <input type="radio" name={`answer-${c.id}`} value={o.id} checked={choice === o.id} onChange={() => props.onChoose(o.id)} />
                      <span>{o.text}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="cr-go" disabled={!choice}>
                Submit answer →
              </button>
            </form>
          )}
        </div>
        <aside className="st-inspect" aria-label="Inspect evidence">
          <b>Inspect evidence</b>
          <p className="cr-note">Optional. Open what each instrument used.</p>
          {LENSES.map(([lens, name]) => {
            const Icon = ICONS[lens];
            return (
              <button key={lens} type="button" className="st-lens" aria-pressed={lenses.has(lens)} onClick={() => props.onToggle(lens)}>
                <Icon />
                {name}
              </button>
            );
          })}
        </aside>
      </div>
    </div>
  );
}

function Final(props: {
  data: SentimentTrapData;
  results: boolean[];
  total: number;
  isNew: boolean;
  reflect: string | null;
  reflected: boolean;
  onReflect: (v: string) => void;
  onCheck: () => void;
  again: () => void;
  inCampaign: boolean;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const { data, results, total, isNew, reflect, reflected } = props;
  const r = reflection(data);
  const right = reflect === r.answer;
  return (
    <div className="st-final">
      <h2 className="st-final-title" tabIndex={-1} ref={props.headingRef}>
        A score is not a measurement
      </h2>
      <ol className="st-takeaways">
        <li>
          <b>Words are not context.</b> A word’s score in a lookup table can’t see negation or sarcasm around it.
        </li>
        <li>
          <b>Confidence is not validity.</b> A confident prediction can still be the wrong instrument for the question you are asking.
        </li>
        <li>
          <b>The domain matters.</b> A model trained on movie reviews may not measure anything meaningful in neutral encyclopedia text.
        </li>
      </ol>
      <p className="st-ask-box">
        <b>Before trusting a sentiment score, ask:</b> what is this instrument actually measuring?
      </p>
      <div className="st-final-row">
        <form
          className="st-question st-reflect"
          onSubmit={(e) => {
            e.preventDefault();
            if (reflect) props.onCheck();
          }}
        >
          <fieldset disabled={reflected}>
            <legend>
              <span className="cr-h">Quick check</span> {r.question}
            </legend>
            <div className="st-options">
              {[
                ["yes", "Yes, it does."],
                ["no", "No."],
              ].map(([id, text]) => (
                <label key={id} className="st-option" data-on={reflect === id}>
                  <input type="radio" name="reflect" value={id} checked={reflect === id} onChange={() => props.onReflect(id)} />
                  <span>{text}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {reflected ? (
            <p className="st-reflect-answer" role="status">
              <b>{right ? `✓ Right, +${POINTS.reflection}.` : "✗ Not quite."}</b> {r.explain}
            </p>
          ) : (
            <button type="submit" className="cr-go" disabled={!reflect}>
              Check
            </button>
          )}
        </form>
        <div className="st-score">
          <span className="cr-h">Your score</span>
          <p className="cr-verdict">
            {total.toLocaleString("en")} <small>points</small>
          </p>
          <p className="cr-note">
            {results.filter(Boolean).length} of {results.length} caught, +{POINTS.bonus} for finishing{isNew ? " · a new best in this browser" : ""}.
          </p>
          <ul className="st-results">
            {CHALLENGES.map((c, i) => (
              <li key={c.id} data-right={results[i]}>
                <span aria-hidden="true">{results[i] ? "✓" : "✗"}</span> {c.title}
                <span className="st-sr">{results[i] ? ": caught" : ": missed"}</span>
              </li>
            ))}
          </ul>
          <div className="st-actions">
            <button type="button" className="cr-go" onClick={props.again}>
              {props.inCampaign ? FINISH : "Play again"}
            </button>
            {props.inCampaign ? null : (
              <a className="cr-ghost" href="../../../#games">
                More games
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
