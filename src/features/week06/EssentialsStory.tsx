"use client";
// The Week 6 essentials page's eight explorables, one island each, each drawn
// from its own file under public/weeks/week06/data/ (analysis/week06_essentials.py).
// A host renders empty on the server and fills once its file has loaded; a
// failed load says so in the host and logs one line, and leaves the other
// sections alone.
//
// Interaction pattern: toggle or pick → ranking morphs → a short live note
// names what changed. Numbers always come from the JSON files; nothing is invented.
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { EChart } from "@/kit";
import { SegmentedControl } from "@/components/post/SegmentedControl";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { useTokens, useTypeScale } from "@/lib/useTypeScale";
import { asset } from "@/scripts/site.js";
import { FILES, START, fit, lengths, pair, short, three, topicOverlap, two } from "@/scripts/week06-essentials.js";

const CHART_TOKENS = ["--ink", "--ink-soft", "--ink-mute", "--access", "--people", "--w4-accent"] as const;

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Key = keyof typeof FILES;

/** One section's file after hydration; null until loaded. */
function useSection(key: Key) {
  const hydrated = useHydrated();
  const state = useData<Any>(hydrated ? asset(FILES[key]) : null);
  useEffect(() => {
    if (state.status === "error") console.error(`week06 essentials ${key} failed`, state.error);
  }, [state, key]);
  useIslandReady(state.data !== undefined || state.status === "error");
  return { data: state.data ?? null, failed: state.status === "error" };
}

function Failed() {
  return <p className="w6e-failed">This part needs its data file, which did not load. Reload the page to try again.</p>;
}

/** A labelled native select over `options` ([value, label]). */
function Picker({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <span className="w6e-picker">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </span>
  );
}

type RankRow = { key: string; label: ReactNode; value: number; text: string; mark?: boolean; tag?: string };

/** Animated ranked bars: rows reorder and resize when the mode/data changes. */
function MorphBars({ title, rows, note, accent }: { title: ReactNode; rows: RankRow[]; note?: ReactNode; accent?: "violet" | "orange" | "cyan" | "rose" }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-12);
  return (
    <div className={`w6e-list w6e-morph${accent ? ` w6e-accent-${accent}` : ""}`}>
      {title ? <h3>{title}</h3> : null}
      {note ? <p className="w6e-note">{note}</p> : null}
      <ol>
        {rows.map((r, i) => (
          <li key={r.key} className={r.mark ? "w6e-mark" : undefined} style={{ ["--rank" as string]: i }}>
            <span className="w6e-rank">{i + 1}</span>
            <span className="w6e-word">{r.label}</span>
            <span className="w6e-track"><span className="w6e-bar" style={{ width: `${(Math.abs(r.value) / max) * 100}%` }}></span></span>
            <span className="w6e-num">{r.text}</span>
            {r.tag ? <span className="w6e-tag">{r.tag}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Side-by-side before/after with appear / disappear annotations. */
function DiffBars({
  leftTitle, rightTitle, left, right, leftNote, rightNote,
}: {
  leftTitle: ReactNode; rightTitle: ReactNode;
  left: RankRow[]; right: RankRow[];
  leftNote?: ReactNode; rightNote?: ReactNode;
}) {
  const leftKeys = new Set(left.map((r) => r.key));
  const rightKeys = new Set(right.map((r) => r.key));
  const L = left.map((r) => ({ ...r, tag: rightKeys.has(r.key) ? undefined : "drops out" }));
  const R = right.map((r) => ({ ...r, tag: leftKeys.has(r.key) ? undefined : "appears" }));
  return (
    <div className="w6e-cols w6e-diff">
      <MorphBars title={leftTitle} rows={L} note={leftNote} accent="orange" />
      <MorphBars title={rightTitle} rows={R} note={rightNote} accent="violet" />
    </div>
  );
}

const Host = (id: string, className = "w6e-app") =>
  function ServerHost() {
    return <div className={className} id={id}></div>;
  };

const wordOptions = (targets: string[]): [string, string][] => targets.map((w) => [w, w]);

const GRAMMAR = new Set(["the", "and", "of", "a", "in", "to", "with", "is", "as", "for", "on", "by", "at", "from", "an", "or", "that", "was"]);

const CONTRAST_CHIPS = ["her", "she", "his", "he", "telepathy", "himself", "female", "symbiote", "hair", "woman"];

/** Variable-size word chips — bigger = stronger signal. */
function WordCloud({
  items, onPick, active,
}: {
  items: { word: string; weight: number; tip?: string }[];
  onPick?: (word: string) => void;
  active?: string;
}) {
  const max = Math.max(...items.map((i) => i.weight), 1e-12);
  return (
    <div className="w6e-cloud" role={onPick ? "listbox" : undefined} aria-label="Words by strength">
      {items.map((i) => {
        const t = 0.35 + 0.65 * (i.weight / max);
        return (
          <button
            key={i.word}
            type="button"
            role={onPick ? "option" : undefined}
            aria-selected={active === i.word}
            className={`w6e-chip${active === i.word ? " is-active" : ""}${GRAMMAR.has(i.word) ? " is-grammar" : ""}`}
            style={{ transform: `scale(${0.75 + t * 0.7})`, opacity: 0.55 + t * 0.45 }}
            title={i.tip}
            onClick={onPick ? () => onPick(i.word) : undefined}
            disabled={!onPick}
          >
            {i.word}
          </button>
        );
      })}
    </div>
  );
}

// ---- 1. weights ----------------------------------------------------------------------------

function Weights() {
  const { data, failed } = useSection("weights");
  const [page, setPage] = useState(START.page);
  const [mode, setMode] = useState<"count" | "tfidf">("count");
  const options = useMemo(() => (data ? (data.pages as Any[]).map((p) => [p.name, short(p.name)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1])) : []), [data]);
  if (failed) return <div className="w6e-app" id="weights-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="weights-app"></div>;
  const p = (data.pages as Any[]).find((x) => x.name === page) ?? data.pages[0];
  const row = ([w, count, df, idf, tfidf]: Any, by: "count" | "tfidf"): RankRow => ({
    key: w, label: w, value: by === "count" ? count : tfidf, mark: idf < 0.1,
    text: by === "count" ? `${count} · on ${df} pages` : `idf ${idf.toFixed(2)} · ${tfidf.toFixed(4)}`,
  });
  const countRows = p.count.map((r: Any) => row(r, "count"));
  const tfidfRows = p.tfidf.map((r: Any) => row(r, "tfidf"));
  const active = mode === "count" ? countRows : tfidfRows;
  const topCount = new Set(countRows.map((r: RankRow) => r.key));
  const topTfidf = new Set(tfidfRows.map((r: RankRow) => r.key));
  const shared = [...topCount].filter((k) => topTfidf.has(k)).length;
  return (
    <div className="w6e-app" id="weights-app">
      <div className="w6e-controls w6e-controls-hero">
        <Picker id="w6e-weights-page" label="Page" value={p.name} options={options} onChange={setPage} />
        <span className="w6e-label" id="w6e-weight-mode">Weighting</span>
        <SegmentedControl
          className="rx-seg w6e-mode"
          ariaLabelledBy="w6e-weight-mode"
          buttons={[{ value: "count", label: "Raw count" }, { value: "tfidf", label: "TF-IDF" }]}
          value={mode}
          onChange={(v) => setMode(v as "count" | "tfidf")}
        />
      </div>
      <p className="w6e-live" aria-live="polite">
        {mode === "count"
          ? `${p.size.toLocaleString("en")} words on this page. Top ranks are grammar — grey means IDF under 0.1.`
          : `Same page. Only ${shared} of 12 words stay in the top twelve. Grey still marks IDF under 0.1.`}
      </p>
      <MorphBars
        title={mode === "count" ? "What frequency rewards" : "What TF-IDF rewards"}
        rows={active}
        accent={mode === "count" ? "orange" : "violet"}
      />
      <details className="w6e-compare-fold">
        <summary>Compare both side by side</summary>
        <DiffBars
          leftTitle="By raw count"
          rightTitle="By TF-IDF"
          left={countRows}
          right={tfidfRows}
          rightNote="TF is count over page length; IDF is ln(303 / pages using the word)."
        />
      </details>
    </div>
  );
}

// ---- 2. cosine -----------------------------------------------------------------------------

function Cosine() {
  const { data, failed } = useSection("cosine");
  const [a, setA] = useState(START.pair[0]);
  const [b, setB] = useState(START.pair[1]);
  const [mode, setMode] = useState<"raw" | "tfidf">("raw");
  const [times, setTimes] = useState("1");
  if (failed) return <div className="w6e-app" id="cosine-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="cosine-app"></div>;
  const options = (data.pages as string[]).map((n) => [n, short(n)] as [string, string]);
  const rec = pair(data, a, b);
  const len = lengths(data, a, Number(times));
  const words = rec ? (mode === "raw" ? rec.rawWords : rec.tfidfWords) as [string, number][] : [];
  const cos = rec ? (mode === "raw" ? rec.raw : rec.tfidf) : 0;
  const med = data.all_pairs;
  return (
    <div className="w6e-app" id="cosine-app">
      <div className="w6e-controls w6e-controls-hero">
        <Picker id="w6e-cos-a" label="Page" value={a} options={options} onChange={setA} />
        <Picker id="w6e-cos-b" label="and" value={b} options={options} onChange={setB} />
        <span className="w6e-label" id="w6e-cos-mode">Similarity from</span>
        <SegmentedControl
          className="rx-seg w6e-mode"
          ariaLabelledBy="w6e-cos-mode"
          buttons={[{ value: "raw", label: "Raw counts" }, { value: "tfidf", label: "TF-IDF" }]}
          value={mode}
          onChange={(v) => setMode(v as "raw" | "tfidf")}
        />
      </div>
      {rec ? (
        <>
          <div className="w6e-statline">
            <div className="w6e-stat">
              <span className="w6e-stat-label">This pair</span>
              <span className="w6e-stat-value">{three(cos)}</span>
            </div>
            <div className="w6e-stat">
              <span className="w6e-stat-label">Corpus median</span>
              <span className="w6e-stat-value">{mode === "raw" ? three(med.raw.median) : med.tfidf.median}</span>
            </div>
            <div className="w6e-stat w6e-stat-wide">
              <span className="w6e-stat-label">What carries the cosine</span>
              <span className="w6e-stat-value w6e-stat-words">{words[0]?.[0] ?? "—"}</span>
            </div>
          </div>
          <MorphBars
            title={`${mode === "raw" ? "Raw counts" : "TF-IDF"}: cosine ${three(cos)}`}
            note="Each bar is one word's term in the sum that equals the cosine."
            rows={words.map(([w, v]) => ({ key: w, label: w, value: v, text: three(v) }))}
            accent={mode === "raw" ? "orange" : "violet"}
          />
          {mode === "raw" && words[0]?.[0] === "the" ? (
            <p className="w6e-callout">The word <em>the</em> alone gives {three(words[0][1])} of this cosine.</p>
          ) : null}
          {mode === "tfidf" && words[0] ? (
            <p className="w6e-callout">Now <em>{words[0][0]}</em> carries {three(words[0][1])} — a name or a story word, not grammar.</p>
          ) : null}
        </>
      ) : <p className="w6e-note">Pick two different pages.</p>}
      <div className="w6e-controls">
        <span className="w6e-label" id="w6e-times-label">{`Write ${short(a)}'s page out`}</span>
        <SegmentedControl
          className="rx-seg"
          ariaLabelledBy="w6e-times-label"
          buttons={[{ value: "1", label: "once" }, { value: "3", label: "3 times" }]}
          value={times}
          onChange={setTimes}
        />
      </div>
      <p className="w6e-note" aria-live="polite">
        {rec
          ? `Raw-count vector length ${len.raw.toFixed(0)}, TF-IDF length ${len.tfidf.toFixed(4)}. The cosine stays ${three(rec.raw)} under raw counts and ${three(rec.tfidf)} under TF-IDF: cosine compares direction, and copying a page only stretches its vector.`
          : ""}
      </p>
    </div>
  );
}

// ---- 3. contrast (Scattertext) -------------------------------------------------------------

function Contrast() {
  const { data, failed } = useSection("contrast");
  const [names, setNames] = useState("hide");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState("telepathy");
  const [focus, setFocus] = useState<"all" | "beyond" | "lean">("all");
  const [open, setOpen] = useState(false);
  const tokens = useTokens(CHART_TOKENS);
  const scale = useTypeScale();

  const catalog = useMemo(() => {
    if (!data) return [] as Any[];
    return (data.terms as Any[]).filter((t) => names === "show" || !t[6]);
  }, [data, names]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONTRAST_CHIPS.map((w) => catalog.find((t) => t[0] === w)).filter(Boolean).slice(0, 8) as Any[];
    const starts = catalog.filter((t) => t[0].startsWith(q));
    const mid = catalog.filter((t) => !t[0].startsWith(q) && t[0].includes(q));
    return [...starts, ...mid].slice(0, 8);
  }, [catalog, query]);

  const hitTerm = useMemo(() => {
    const q = (picked || query).trim().toLowerCase();
    if (!q) return null;
    return catalog.find((t) => t[0] === q) ?? null;
  }, [catalog, picked, query]);

  const option = useMemo(() => {
    if (!data || !tokens || !scale) return null;
    const cut = data.null.top_z_max as number;
    const term = catalog;
    const mute = tokens["--ink-mute"];
    const soft = tokens["--ink-soft"];
    const ink = tokens["--ink"];
    const cyan = tokens["--access"];
    const orange = tokens["--people"];
    const violet = tokens["--w4-accent"];
    const caption = scale.fs("caption");
    const small = scale.fs("small");
    const group = (test: (t: Any) => boolean) => term.filter(test).map((t) => ({ value: [t[4], t[3]], name: t[0], z: t[5], f: t[1], m: t[2] }));
    const series = (name: string, d: Any[], size: number, color?: string) => ({ type: "scatter", name, data: d, symbolSize: size, ...(color ? { itemStyle: { color } } : {}) });
    const hit = hitTerm ? group((t) => t[0] === hitTerm[0]) : [];
    const beyond = group((t) => Math.abs(t[5]) > cut);
    const lean = group((t) => Math.abs(t[5]) > 1.96 && Math.abs(t[5]) <= cut);
    const none = group((t) => Math.abs(t[5]) <= 1.96);
    const showBeyond = focus !== "lean";
    const showLean = focus !== "beyond";
    const showNone = focus === "all";
    return {
      animationDurationUpdate: 400,
      backgroundColor: "transparent",
      grid: { left: 56, right: 28, top: 28, bottom: 72 },
      xAxis: {
        type: "value", min: 0, max: 1,
        name: "frequency rank on men's pages →",
        nameLocation: "middle", nameGap: 28,
        nameTextStyle: { color: soft, fontSize: caption },
        axisLabel: { color: mute },
        splitLine: { lineStyle: { color: "rgba(120,140,180,0.12)" } },
        axisLine: { lineStyle: { color: "rgba(120,140,180,0.25)" } },
      },
      yAxis: {
        type: "value", min: 0, max: 1,
        name: "on women's pages →",
        nameLocation: "middle", nameGap: 40,
        nameTextStyle: { color: soft, fontSize: caption },
        axisLabel: { color: mute },
        splitLine: { lineStyle: { color: "rgba(120,140,180,0.12)" } },
        axisLine: { lineStyle: { color: "rgba(120,140,180,0.25)" } },
      },
      tooltip: {
        backgroundColor: "rgba(12,16,32,0.92)",
        borderColor: "rgba(160,120,255,0.35)",
        textStyle: { color: ink },
        formatter: (p: Any) => `${p.data.name}: ${p.data.f}× women's pages, ${p.data.m}× men's; z ${p.data.z}`,
      },
      legend: { bottom: 0, textStyle: { color: soft }, data: ["no clear lean", "leans, |z| over 1.96", "beyond every shuffle"] },
      series: [
        ...(showNone ? [series("no clear lean", none, 3, "rgba(120,130,150,0.28)")] : []),
        ...(showLean ? [series("leans, |z| over 1.96", lean, 6, orange)] : []),
        ...(showBeyond ? [series("beyond every shuffle", beyond, 12, violet)] : []),
        ...(hit.length ? [{
          ...series("your word", hit, 22, cyan),
          label: { show: true, formatter: (p: Any) => p.data.name, position: "top", color: cyan, fontWeight: 700, fontSize: small },
          itemStyle: { color: cyan, shadowBlur: 18, shadowColor: "rgba(92,225,255,0.85)" },
          z: 10,
        }] : []),
      ],
    };
  }, [data, catalog, hitTerm, focus, tokens, scale]);

  if (failed) return <div className="w6e-app" id="contrast-app"><Failed /></div>;
  if (!data || !option) return <div className="w6e-app" id="contrast-app"></div>;

  const cut = data.null.top_z_max as number;
  const list = (side: "female" | "male") => (data.top[names === "show" ? side : `${side}_no_names`] as [string, number][]).slice(0, 10);

  const pickWord = (w: string) => {
    setPicked(w);
    setQuery(w);
    setOpen(false);
  };

  const leanSide = hitTerm
    ? hitTerm[5] > cut ? "beyond every shuffle → women"
      : hitTerm[5] < -cut ? "beyond every shuffle → men"
        : hitTerm[5] > 1.96 ? "leans women"
          : hitTerm[5] < -1.96 ? "leans men"
            : "no clear lean"
    : null;

  return (
    <div className="w6e-app" id="contrast-app">
      <div className="w6e-controls w6e-controls-hero">
        <span className="w6e-label" id="w6e-focus-label">Show</span>
        <SegmentedControl
          className="rx-seg w6e-mode"
          ariaLabelledBy="w6e-focus-label"
          buttons={[
            { value: "all", label: "All words" },
            { value: "lean", label: "Leaning" },
            { value: "beyond", label: "Beyond chance" },
          ]}
          value={focus}
          onChange={(v) => setFocus(v as "all" | "beyond" | "lean")}
        />
        <span className="w6e-label" id="w6e-names-label">Character names</span>
        <SegmentedControl
          className="rx-seg w6e-mode"
          ariaLabelledBy="w6e-names-label"
          buttons={[{ value: "hide", label: "Hidden" }, { value: "show", label: "Shown" }]}
          value={names}
          onChange={setNames}
        />
      </div>

      <div className="w6e-finder">
        <div className="w6e-finder-search">
          <label htmlFor="w6e-find">Find a word</label>
          <div className="w6e-finder-field">
            <input
              id="w6e-find"
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              placeholder="Type telepathy, hair, himself…"
              onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) setPicked(""); }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && suggestions[0]) { e.preventDefault(); pickWord(suggestions[0][0]); }
                if (e.key === "Escape") setOpen(false);
              }}
            />
            {open && suggestions.length > 0 ? (
              <ul className="w6e-finder-menu" role="listbox">
                {suggestions.map((t) => (
                  <li key={t[0]}>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickWord(t[0])}>
                      <span className="w6e-finder-word">{t[0]}</span>
                      <span className="w6e-finder-z">{`z ${Number(t[5]).toFixed(2)}`}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="w6e-finder-chips" aria-label="Try these words">
          {CONTRAST_CHIPS.map((w) => (
            <button
              key={w}
              type="button"
              className={`w6e-chip-pill${picked === w ? " is-active" : ""}`}
              onClick={() => pickWord(w)}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="w6e-finder-card" aria-live="polite">
          {hitTerm ? (
            <>
              <p className="w6e-finder-hit">
                <span className="w6e-finder-big">{hitTerm[0]}</span>
                <span className={`w6e-finder-badge z-${hitTerm[5] > 0 ? "women" : "men"}`}>{leanSide}</span>
              </p>
              <p className="w6e-finder-meta">
                z = {Number(hitTerm[5]).toFixed(2)} · {hitTerm[1].toLocaleString("en")}× on women&apos;s pages · {hitTerm[2].toLocaleString("en")}× on men&apos;s
                {Math.abs(hitTerm[5]) > cut ? " · stronger than every shuffle" : Math.abs(hitTerm[5]) > 1.96 ? " · leans, but a shuffle can match this" : " · within chance"}
              </p>
            </>
          ) : query.trim() ? (
            <p className="w6e-finder-meta">No match in the plotted vocabulary{names === "hide" ? " (try showing names, or pick a chip)" : ""}.</p>
          ) : (
            <p className="w6e-finder-meta">Pick a chip or type — the cyan star jumps to that word on the plot.</p>
          )}
        </div>
      </div>

      <p className="w6e-live">
        Large violet dots lean further than any shuffle of the labels. Only four words do: her, she, his, he.
      </p>
      <EChart option={option} height={440} renderer="canvas" />
      <div className="w6e-cols">
        <MorphBars title="Leans to women's pages" rows={list("female").map(([w, z]) => ({ key: w, label: w, value: z, text: `z ${z}` }))} accent="rose" />
        <MorphBars title="Leans to men's pages" rows={list("male").map(([w, z]) => ({ key: w, label: w, value: z, text: `z ${z}` }))} accent="cyan" />
      </div>
    </div>
  );
}

// ---- 4. topics -----------------------------------------------------------------------------

function Topics() {
  const { data, failed } = useSection("topics");
  const [k, setK] = useState(String(START.k));
  const [seed, setSeed] = useState("0");
  const [page, setPage] = useState(START.topicPage);
  if (failed) return <div className="w6e-app" id="topics-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="topics-app"></div>;
  const f = fit(data, Number(k), Number(seed));
  const overlap = topicOverlap(data, Number(k));
  const i = (data.names as string[]).indexOf(page);
  const mix = f.mix[i] as number[];
  const options = (data.names as string[]).map((n) => [n, short(n)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1]));
  const kept = data.stability[k].kept;
  return (
    <div className="w6e-app" id="topics-app">
      <div className="w6e-controls w6e-controls-hero">
        <span className="w6e-label" id="w6e-k-label">Topics, k</span>
        <SegmentedControl className="rx-seg w6e-mode" ariaLabelledBy="w6e-k-label" buttons={["5", "6", "7", "8", "9", "10", "11", "12"].map((v) => ({ value: v, label: v }))} value={k} onChange={setK} />
        <span className="w6e-label" id="w6e-seed-label">Seed</span>
        <SegmentedControl className="rx-seg" ariaLabelledBy="w6e-seed-label" buttons={[{ value: "0", label: "0" }, { value: "1", label: "1" }]} value={seed} onChange={setSeed} />
      </div>
      <div className="w6e-statline">
        <div className="w6e-stat">
          <span className="w6e-stat-label">Stable topics</span>
          <span className="w6e-stat-value">{`${kept} / ${k}`}</span>
        </div>
        <div className="w6e-stat">
          <span className="w6e-stat-label">Mean top-10 overlap</span>
          <span className="w6e-stat-value">{`${Math.round(data.stability[k].mean_overlap * 100)}%`}</span>
        </div>
      </div>
      <p className="w6e-live" aria-live="polite">
        {`${kept} of ${k} topics keep at least half their top ten words when the seed changes. Solid borders = stable.`}
      </p>
      <ol className="w6e-topics">
        {(f.topics as [string, number][][]).map((t, n) => (
          <li key={`${k}-${seed}-${n}`} className={overlap[n] >= 0.5 ? "w6e-kept" : undefined}>
            <span className="w6e-tnum">{`Topic ${n + 1}`}</span>
            <span className="w6e-twords">{t.slice(0, 8).map(([w]) => w).join(", ")}</span>
            <span className="w6e-tshare">{`${Math.round(mix[n] * 100)}% of ${short(page)}`}</span>
          </li>
        ))}
      </ol>
      <div className="w6e-controls">
        <Picker id="w6e-topic-page" label="Mixture of" value={page} options={options} onChange={setPage} />
        <span className="w6e-note">Solid rows keep half their words under the other seed.</span>
      </div>
    </div>
  );
}

// ---- 5. contexts ---------------------------------------------------------------------------

function Contexts() {
  const { data, failed } = useSection("contexts");
  const [word, setWord] = useState(START.word);
  const [win, setWin] = useState(START.window);
  const [rowsSel, setRowsSel] = useState<string[]>(() => ["storm", "web", "hammer", "symbiote", "vampire", "magic"]);
  const [hideGrammar, setHideGrammar] = useState(false);
  const [pin, setPin] = useState<{ row: string; col: string; n: number } | null>(null);
  const [view, setView] = useState<"bars" | "cloud">("cloud");

  if (failed) return <div className="w6e-app" id="contexts-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="contexts-app"></div>;

  const row = data.rows[word][win] as [string, number][];
  const top = row[0]?.[0];
  const maps = Object.fromEntries(
    rowsSel.map((r) => [r, Object.fromEntries(data.rows[r]?.[win] ?? []) as Record<string, number>]),
  );

  const colScore = new Map<string, number>();
  for (const r of rowsSel) {
    for (const [c, n] of Object.entries(maps[r] ?? {})) {
      if (hideGrammar && GRAMMAR.has(c)) continue;
      colScore.set(c, (colScore.get(c) ?? 0) + n);
    }
  }
  const cols = [...colScore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c]) => c);
  const maxCell = Math.max(1, ...rowsSel.flatMap((r) => cols.map((c) => maps[r]?.[c] ?? 0)));

  const toggleRow = (w: string) => {
    setRowsSel((prev) => {
      if (prev.includes(w)) return prev.length <= 2 ? prev : prev.filter((x) => x !== w);
      return prev.length >= 8 ? [...prev.slice(1), w] : [...prev, w];
    });
    setWord(w);
  };

  return (
    <div className="w6e-app" id="contexts-app">
      <div className="w6e-controls w6e-controls-hero">
        <Picker id="w6e-ctx-word" label="Focus word" value={word} options={wordOptions(data.targets)} onChange={(w) => { setWord(w); setRowsSel((prev) => (prev.includes(w) ? prev : [...prev.slice(0, 7), w])); }} />
        <span className="w6e-label" id="w6e-win-label">Window ±</span>
        <SegmentedControl className="rx-seg w6e-mode" ariaLabelledBy="w6e-win-label" buttons={["2", "5", "10"].map((v) => ({ value: v, label: v }))} value={win} onChange={setWin} />
        <span className="w6e-label" id="w6e-ctx-view">Neighbours as</span>
        <SegmentedControl
          className="rx-seg w6e-mode"
          ariaLabelledBy="w6e-ctx-view"
          buttons={[{ value: "cloud", label: "Cloud" }, { value: "bars", label: "Bars" }]}
          value={view}
          onChange={(v) => setView(v as "bars" | "cloud")}
        />
      </div>
      <p className="w6e-live" aria-live="polite">
        {top === "the"
          ? `Still grammar: "${word}" sits next to "the" more than anything else in a ±${win}-word window.`
          : `Top neighbour of "${word}" at window ${win}: ${top}.`}
        {" "}
        Click chips to rebuild the matrix. Change the window — cells move.
      </p>

      <div className="w6e-cols w6e-ctx-play">
        <div>
          {view === "cloud" ? (
            <div className="w6e-list">
              <h3>{`Company of "${word}"`}</h3>
              <p className="w6e-note">Bigger type = more co-occurrences in the window. Grey chips are grammar.</p>
              <WordCloud
                items={row.map(([w, n]) => ({ word: w, weight: n, tip: `${n} times within ±${win}` }))}
                active={pin?.col}
                onPick={(w) => {
                  const n = row.find(([x]) => x === w)?.[1] ?? 0;
                  setPin({ row: word, col: w, n });
                }}
              />
            </div>
          ) : (
            <MorphBars
              title={`Company of "${word}"`}
              note="Each bar is one cell: how often that word sits within the window."
              rows={row.map(([w, n]) => ({ key: w, label: w, value: n, text: String(n), mark: GRAMMAR.has(w) }))}
              accent="cyan"
            />
          )}
        </div>

        <div className="w6e-list w6e-matrix-play">
          <div className="w6e-matrix-head">
            <h3>Playable word–context matrix</h3>
            <button type="button" className={`w6e-chip-pill${hideGrammar ? " is-active" : ""}`} onClick={() => setHideGrammar((v) => !v)}>
              {hideGrammar ? "Grammar hidden" : "Hide grammar cols"}
            </button>
          </div>
          <p className="w6e-note">
            A row is a target word, a column a neighbour from its top list at window {win}. Tap a row chip · click a glowing cell.
            {pin ? ` Pinned: ${pin.row} × ${pin.col} = ${pin.n}.` : ""}
          </p>
          <p className="w6e-label">Matrix rows — tap to add or remove</p>
          <div className="w6e-finder-chips w6e-matrix-rows" aria-label="Matrix rows">
            {(data.targets as string[]).map((w) => (
              <button
                key={w}
                type="button"
                className={`w6e-chip-pill${rowsSel.includes(w) ? " is-active" : ""}${w === word ? " is-focus" : ""}`}
                onClick={() => toggleRow(w)}
              >
                {w}
              </button>
            ))}
          </div>
          <div className="w6e-grid-wrap">
            <table className="w6e-grid w6e-heat">
              <thead>
                <tr>
                  <th scope="col"></th>
                  {cols.map((c) => <th key={c} scope="col" className={GRAMMAR.has(c) ? "w6e-zero" : undefined}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {rowsSel.map((r) => (
                  <tr key={r} className={r === word ? "w6e-row-active" : undefined}>
                    <th scope="row">
                      <button type="button" className="w6e-row-btn" onClick={() => setWord(r)}>{r}</button>
                    </th>
                    {cols.map((c) => {
                      const n = maps[r]?.[c] ?? 0;
                      const t = n / maxCell;
                      const on = pin?.row === r && pin?.col === c;
                      return (
                        <td key={c} className={n ? undefined : "w6e-zero"}>
                          <button
                            type="button"
                            className={`w6e-heat-cell${on ? " is-on" : ""}`}
                            style={{
                              background: n ? `rgba(92, 225, 255, ${0.08 + t * 0.55})` : "transparent",
                              boxShadow: n ? `inset 0 0 0 1px rgba(92,225,255,${0.15 + t * 0.45})` : undefined,
                              transform: n ? `scale(${0.85 + t * 0.35})` : undefined,
                              fontWeight: t > 0.55 ? 700 : 500,
                              color: n ? `rgba(220, 245, 255, ${0.55 + t * 0.45})` : undefined,
                            }}
                            disabled={!n}
                            title={n ? `${r} × ${c} = ${n}` : `${c} not in ${r}'s top neighbours at ±${win}`}
                            onClick={() => n && setPin({ row: r, col: c, n })}
                          >
                            {n || "·"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="w6e-note">
            Empty · means that neighbour did not make this word&apos;s top list at this window — try another window or turn grammar back on. The fixed corner from the brief is still under Evidence.
          </p>
          <details className="w6e-compare-fold">
            <summary>Fixed corner from the brief (window 5)</summary>
            <table className="w6e-grid">
              <thead><tr><th scope="col"></th>{(data.grid.cols as string[]).map((c: string) => <th key={c} scope="col">{c}</th>)}</tr></thead>
              <tbody>
                {(data.grid.rows as string[]).map((r: string, i: number) => (
                  <tr key={r} className={r === word ? "w6e-row-active" : undefined}>
                    <th scope="row">{r}</th>
                    {(data.grid.cells[i] as number[]).map((n, j) => <td key={j} className={n ? undefined : "w6e-zero"}>{n}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </div>
    </div>
  );
}

// ---- 6. PMI --------------------------------------------------------------------------------

function Pmi() {
  const { data, failed } = useSection("pmi");
  const [word, setWord] = useState(START.pmiWord);
  const [mode, setMode] = useState<"count" | "pmi" | "ppmi">("count");
  if (failed) return <div className="w6e-app" id="pmi-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="pmi-app"></div>;
  const r = data.rows[word];
  const rows = (list: [string, number, number][], by: "count" | "pmi"): RankRow[] =>
    list.map(([w, n, v]) => ({ key: w, label: w, value: by === "count" ? n : v, text: by === "count" ? `${n} · PMI ${two(v)}` : `${two(v)} · seen ${n}×` }));
  const active =
    mode === "count" ? rows(r.count, "count")
      : mode === "pmi" ? rows(r.pmi_any, "pmi")
        : rows(r.ppmi, "pmi");
  const titles = { count: "By count", pmi: "By PMI", ppmi: `By PPMI, seen ${r.min_count}+ times` };
  const cloudItems = active.map((row) => ({ word: String(row.key), weight: Math.abs(row.value), tip: row.text }));
  return (
    <div className="w6e-app" id="pmi-app">
      <div className="w6e-controls w6e-controls-hero">
        <Picker id="w6e-pmi-word" label="Word" value={word} options={wordOptions(data.targets)} onChange={setWord} />
        <span className="w6e-label" id="w6e-pmi-mode">Rank by</span>
        <SegmentedControl
          className="rx-seg w6e-mode"
          ariaLabelledBy="w6e-pmi-mode"
          buttons={[
            { value: "count", label: "Count" },
            { value: "pmi", label: "PMI" },
            { value: "ppmi", label: "PPMI" },
          ]}
          value={mode}
          onChange={(v) => setMode(v as "count" | "pmi" | "ppmi")}
        />
      </div>
      <p className="w6e-live" aria-live="polite">
        {mode === "count"
          ? `${r.negative_cells} of the row's ${r.cells} cells have negative PMI; PPMI sets them to 0.`
          : mode === "pmi"
            ? `Rare contexts rise: the top five are seen at most ${Math.max(...r.pmi_any.slice(0, 5).map(([, n]: Any) => n))}×.`
            : `Association, not frequency: "${active[0]?.key}" scores highest once chance is removed.`}
        {" "}
        Flip the mode — the cloud reshapes.
      </p>
      <div className="w6e-list">
        <h3>{titles[mode]}</h3>
        <WordCloud items={cloudItems} />
      </div>
      <MorphBars title="Same ranking, as bars" rows={active} accent={mode === "count" ? "orange" : mode === "pmi" ? "cyan" : "violet"} />
      <details className="w6e-compare-fold">
        <summary>See count, PMI and PPMI together</summary>
        <div className="w6e-cols w6e-three">
          <MorphBars title="By count" rows={rows(r.count, "count")} accent="orange" />
          <MorphBars title="By PMI" note={`Rare contexts rise: the top five are seen at most ${Math.max(...r.pmi_any.slice(0, 5).map(([, n]: Any) => n))}×.`} rows={rows(r.pmi_any, "pmi")} accent="cyan" />
          <MorphBars title={`By PPMI, seen ${r.min_count}+ times`} rows={rows(r.ppmi, "pmi")} accent="violet" />
        </div>
      </details>
    </div>
  );
}

// ---- 7. vectors ----------------------------------------------------------------------------

function Vectors() {
  const { data, failed } = useSection("vectors");
  const [word, setWord] = useState(START.vectorWord);
  const [mode, setMode] = useState<"ppmi" | "skipgram" | "cbow">("skipgram");
  const [ex, setEx] = useState("0");
  if (failed) return <div className="w6e-app" id="vectors-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="vectors-app"></div>;
  const n = data.near[word];
  const rows = (list: [string, number][]): RankRow[] => list.map(([w, s]) => ({ key: w, label: w, value: s, text: three(s) }));
  const e = data.examples[Number(ex)];
  const titles = { ppmi: "PPMI rows", skipgram: "Skip-gram", cbow: "CBOW" };
  const notes = {
    ppmi: "Sparse: one column per context word.",
    skipgram: "100 numbers, trained to predict the context from the word.",
    cbow: "100 numbers, trained to predict the word from its context.",
  };
  return (
    <div className="w6e-app" id="vectors-app">
      <div className="w6e-controls w6e-controls-hero">
        <Picker id="w6e-vec-word" label="Word" value={word} options={wordOptions(data.targets)} onChange={setWord} />
        <span className="w6e-label" id="w6e-vec-mode">Neighbourhood from</span>
        <SegmentedControl
          className="rx-seg w6e-mode"
          ariaLabelledBy="w6e-vec-mode"
          buttons={[
            { value: "ppmi", label: "PPMI" },
            { value: "skipgram", label: "Skip-gram" },
            { value: "cbow", label: "CBOW" },
          ]}
          value={mode}
          onChange={(v) => setMode(v as "ppmi" | "skipgram" | "cbow")}
        />
      </div>
      <p className="w6e-live" aria-live="polite">
        Nearest to <em>{word}</em>: {(n[mode] as [string, number][]).slice(0, 4).map(([w]) => w).join(", ")}.
      </p>
      <MorphBars title={titles[mode]} note={notes[mode]} rows={rows(n[mode])} accent={mode === "ppmi" ? "orange" : mode === "skipgram" ? "violet" : "cyan"} />
      <details className="w6e-compare-fold">
        <summary>Compare PPMI, skip-gram and CBOW</summary>
        <div className="w6e-cols w6e-three">
          <MorphBars title="PPMI rows" note={notes.ppmi} rows={rows(n.ppmi)} accent="orange" />
          <MorphBars title="Skip-gram" note={notes.skipgram} rows={rows(n.skipgram)} accent="violet" />
          <MorphBars title="CBOW" note={notes.cbow} rows={rows(n.cbow)} accent="cyan" />
        </div>
      </details>
      <div className="w6e-step">
        <div className="w6e-controls">
          <span className="w6e-label" id="w6e-ex-label">One training step with negative sampling</span>
          <SegmentedControl className="rx-seg" ariaLabelledBy="w6e-ex-label" buttons={data.examples.map((x: Any, i: number) => ({ value: String(i), label: x.centre }))} value={ex} onChange={setEx} />
        </div>
        <p className="w6e-window">
          {(e.window as string[]).map((w, i) => <span key={i} className={w === e.centre ? "w6e-centre" : "w6e-ctx"}>{w}</span>)}
        </p>
        <p className="w6e-note">{`From ${short(e.page)}. Each real pair, such as (${e.centre}, ${e.positive[0]}), is scored up; for that pair the model also scores down 5 words drawn at random, more often the more common they are:`}</p>
        <p className="w6e-window">{(e.negative as string[]).map((w, i) => <span key={i} className="w6e-neg">{w}</span>)}</p>
      </div>
    </div>
  );
}

// ---- 8. GloVe ------------------------------------------------------------------------------

function Glove() {
  const { data, failed } = useSection("glove");
  const [word, setWord] = useState(START.gloveWord);
  const [mode, setMode] = useState<"glove" | "marvel" | "both">("both");
  if (failed) return <div className="w6e-app" id="glove-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="glove-app"></div>;
  const c = data.compare[word];
  const shared = new Set(c.shared as string[]);
  const rows = (list: [string, number][]): RankRow[] => list.map(([w, s]) => ({ key: w, label: w, value: s, text: three(s), mark: shared.has(w), tag: shared.has(w) ? "shared" : undefined }));
  return (
    <div className="w6e-app" id="glove-app">
      <div className="w6e-controls w6e-controls-hero">
        <Picker id="w6e-glove-word" label="Word" value={word} options={wordOptions(data.targets)} onChange={setWord} />
        <span className="w6e-label" id="w6e-glove-mode">Corpus</span>
        <SegmentedControl
          className="rx-seg w6e-mode"
          ariaLabelledBy="w6e-glove-mode"
          buttons={[
            { value: "glove", label: "GloVe (news)" },
            { value: "marvel", label: "Marvel" },
            { value: "both", label: "Both" },
          ]}
          value={mode}
          onChange={(v) => setMode(v as "glove" | "marvel" | "both")}
        />
      </div>
      <p className="w6e-live" aria-live="polite">
        {shared.size === 0
          ? `Zero shared neighbours for "${word}" — same spelling, different world.`
          : `${shared.size} of 10 nearest words are in both lists.`}
      </p>
      {mode === "both" ? (
        <div className="w6e-cols">
          <MorphBars title="GloVe · 6B words of news & Wikipedia" rows={rows(c.glove)} accent="orange" />
          <MorphBars title="Skip-gram · 303 Marvel pages" rows={rows(c.marvel)} accent="violet" />
        </div>
      ) : (
        <MorphBars
          title={mode === "glove" ? "GloVe · 6B words of news & Wikipedia" : "Skip-gram · 303 Marvel pages"}
          rows={rows(mode === "glove" ? c.glove : c.marvel)}
          accent={mode === "glove" ? "orange" : "violet"}
        />
      )}
    </div>
  );
}

// ---- registry ------------------------------------------------------------------------------

const SPECS = {
  weights: [Weights, Host("weights-app")],
  cosine: [Cosine, Host("cosine-app")],
  contrast: [Contrast, Host("contrast-app")],
  topics: [Topics, Host("topics-app")],
  contexts: [Contexts, Host("contexts-app")],
  pmi: [Pmi, Host("pmi-app")],
  vectors: [Vectors, Host("vectors-app")],
  glove: [Glove, Host("glove-app")],
} as const;

type PartName = keyof typeof SPECS;

const PARTS = Object.fromEntries(
  (Object.keys(SPECS) as PartName[]).map((name) => [name, island(`week06/essentials-story/${name}`, SPECS[name][0], SPECS[name][1], { roots: [`#${name}-app`] })]),
) as Record<PartName, ComponentType>;

type Props = { part: PartName };

function View({ part }: Props) {
  const Part = PARTS[part];
  return <Part />;
}

function Placeholder({ part }: Props) {
  const Server = SPECS[part][1];
  return <Server />;
}

export const Essential = island("week06/essentials-story/Essential", View, Placeholder, {
  roots: (Object.keys(SPECS) as PartName[]).map((name) => `#${name}-app`),
});
