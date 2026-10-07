"use client";
// The Week 6 essentials page's eight explorables, one island each, each drawn
// from its own file under public/weeks/week06/data/ (analysis/week06_essentials.py).
// A host renders empty on the server and fills once its file has loaded; a
// failed load says so in the host and logs one line, and leaves the other
// sections alone.
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { EChart } from "@/kit";
import { SegmentedControl } from "@/components/post/SegmentedControl";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { FILES, START, fit, lengths, pair, short, three, topicOverlap, two } from "@/scripts/week06-essentials.js";

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
  return <p className="w6-failed">This part needs its data file, which did not load. Reload the page to try again.</p>;
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

/** A ranked list with a bar per row, scaled to the list's largest value. */
function Bars({ title, rows, note }: { title: ReactNode; rows: { key: string; label: ReactNode; value: number; text: string; mark?: boolean }[]; note?: ReactNode }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-12);
  return (
    <div className="w6e-list">
      <h3>{title}</h3>
      {note ? <p className="w6e-note">{note}</p> : null}
      <ol>
        {rows.map((r) => (
          <li key={r.key} className={r.mark ? "w6e-mark" : undefined}>
            <span className="w6e-word">{r.label}</span>
            <span className="w6e-track"><span className="w6e-bar" style={{ width: `${(Math.abs(r.value) / max) * 100}%` }}></span></span>
            <span className="w6e-num">{r.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const Host = (id: string, className = "w6e-app") =>
  function ServerHost() {
    return <div className={className} id={id}></div>;
  };

const wordOptions = (targets: string[]): [string, string][] => targets.map((w) => [w, w]);

// ---- 1. weights ----------------------------------------------------------------------------

function Weights() {
  const { data, failed } = useSection("weights");
  const [page, setPage] = useState(START.page);
  const options = useMemo(() => (data ? (data.pages as Any[]).map((p) => [p.name, short(p.name)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1])) : []), [data]);
  if (failed) return <div className="w6e-app" id="weights-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="weights-app"></div>;
  const p = (data.pages as Any[]).find((x) => x.name === page) ?? data.pages[0];
  const row = ([w, count, df, idf, tfidf]: Any, by: "count" | "tfidf") => ({
    key: w, label: w, value: by === "count" ? count : tfidf, mark: idf < 0.1,
    text: by === "count" ? `${count} · on ${df} pages` : `idf ${idf.toFixed(2)} · ${tfidf.toFixed(4)}`,
  });
  return (
    <div className="w6e-app" id="weights-app">
      <div className="w6e-controls">
        <Picker id="w6e-weights-page" label="Page" value={p.name} options={options} onChange={setPage} />
        <span className="w6e-note">{`${p.size.toLocaleString("en")} words on this page. A grey row is a word with IDF under 0.1.`}</span>
      </div>
      <div className="w6e-cols">
        <Bars title="By raw count" rows={p.count.map((r: Any) => row(r, "count"))} />
        <Bars title="By TF-IDF" rows={p.tfidf.map((r: Any) => row(r, "tfidf"))} note="TF is count over page length; IDF is ln(303 / pages using the word)." />
      </div>
    </div>
  );
}

// ---- 2. cosine -----------------------------------------------------------------------------

function Cosine() {
  const { data, failed } = useSection("cosine");
  const [a, setA] = useState(START.pair[0]);
  const [b, setB] = useState(START.pair[1]);
  const [times, setTimes] = useState("1");
  if (failed) return <div className="w6e-app" id="cosine-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="cosine-app"></div>;
  const options = (data.pages as string[]).map((n) => [n, short(n)] as [string, string]);
  const rec = pair(data, a, b);
  const len = lengths(data, a, Number(times));
  const part = (cos: number, words: [string, number][], name: string) => (
    <Bars
      title={<>{`${name}: cosine ${three(cos)}`}</>}
      note="The words that add most to the cosine; every word adds its own small term, and the terms sum to the cosine."
      rows={words.map(([w, v]) => ({ key: w, label: w, value: v, text: three(v) }))}
    />
  );
  return (
    <div className="w6e-app" id="cosine-app">
      <div className="w6e-controls">
        <Picker id="w6e-cos-a" label="Page" value={a} options={options} onChange={setA} />
        <Picker id="w6e-cos-b" label="and" value={b} options={options} onChange={setB} />
      </div>
      {rec ? (
        <div className="w6e-cols">
          {part(rec.raw, rec.rawWords, "Raw counts")}
          {part(rec.tfidf, rec.tfidfWords, "TF-IDF")}
        </div>
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
  const [find, setFind] = useState("");
  const option = useMemo(() => {
    if (!data) return null;
    const cut = data.null.top_z_max as number;
    const term = (data.terms as Any[]).filter((t) => names === "show" || !t[6]);
    const q = find.trim().toLowerCase();
    const group = (test: (t: Any) => boolean) => term.filter(test).map((t) => ({ value: [t[4], t[3]], name: t[0], z: t[5], f: t[1], m: t[2] }));
    const series = (name: string, d: Any[], size: number, color?: string) => ({ type: "scatter", name, data: d, symbolSize: size, ...(color ? { itemStyle: { color } } : {}) });
    const hit = q ? group((t) => t[0] === q) : [];
    return {
      animation: false,
      grid: { left: 56, right: 16, top: 16, bottom: 72 },
      xAxis: { type: "value", min: 0, max: 1, name: "frequency rank on men's pages (0 rare, 1 common)", nameLocation: "middle", nameGap: 28 },
      yAxis: { type: "value", min: 0, max: 1, name: "on women's pages", nameLocation: "middle", nameGap: 38 },
      tooltip: { formatter: (p: Any) => `${p.data.name}: ${p.data.f} times on women's pages, ${p.data.m} on men's; z ${p.data.z}` },
      legend: { bottom: 0, data: ["no clear lean", "leans, within what shuffled labels give", "beyond every shuffle"] },
      series: [
        series("no clear lean", group((t) => Math.abs(t[5]) <= 1.96), 3, "rgba(120,130,150,0.35)"),
        series("leans, within what shuffled labels give", group((t) => Math.abs(t[5]) > 1.96 && Math.abs(t[5]) <= cut), 5),
        series("beyond every shuffle", group((t) => Math.abs(t[5]) > cut), 10),
        ...(hit.length ? [{ ...series("your word", hit, 14), label: { show: true, formatter: (p: Any) => p.data.name, position: "right" } }] : []),
      ],
    };
  }, [data, names, find]);
  if (failed) return <div className="w6e-app" id="contrast-app"><Failed /></div>;
  if (!data || !option) return <div className="w6e-app" id="contrast-app"></div>;
  const list = (side: "female" | "male") => (data.top[names === "show" ? side : `${side}_no_names`] as [string, number][]).slice(0, 10);
  return (
    <div className="w6e-app" id="contrast-app">
      <div className="w6e-controls">
        <span className="w6e-label" id="w6e-names-label">Character names</span>
        <SegmentedControl className="rx-seg" ariaLabelledBy="w6e-names-label" buttons={[{ value: "hide", label: "hidden" }, { value: "show", label: "shown" }]} value={names} onChange={setNames} />
        <span className="w6e-picker">
          <label htmlFor="w6e-find">Find a word</label>
          <input id="w6e-find" type="search" value={find} onChange={(e) => setFind(e.target.value)} placeholder="e.g. telepathy" />
        </span>
      </div>
      <EChart option={option} height={420} renderer="canvas" />
      <div className="w6e-cols">
        <Bars title="Leans to women's pages" rows={list("female").map(([w, z]) => ({ key: w, label: w, value: z, text: `z ${z}` }))} />
        <Bars title="Leans to men's pages" rows={list("male").map(([w, z]) => ({ key: w, label: w, value: z, text: `z ${z}` }))} />
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
  return (
    <div className="w6e-app" id="topics-app">
      <div className="w6e-controls">
        <span className="w6e-label" id="w6e-k-label">Topics, k</span>
        <SegmentedControl className="rx-seg" ariaLabelledBy="w6e-k-label" buttons={["5", "6", "7", "8", "9", "10", "11", "12"].map((v) => ({ value: v, label: v }))} value={k} onChange={setK} />
        <span className="w6e-label" id="w6e-seed-label">Seed</span>
        <SegmentedControl className="rx-seg" ariaLabelledBy="w6e-seed-label" buttons={[{ value: "0", label: "0" }, { value: "1", label: "1" }]} value={seed} onChange={setSeed} />
      </div>
      <p className="w6e-note" aria-live="polite">{`${data.stability[k].kept} of ${k} topics keep at least half their top ten words when the seed changes; on average they keep ${Math.round(data.stability[k].mean_overlap * 100)}%.`}</p>
      <ol className="w6e-topics">
        {(f.topics as [string, number][][]).map((t, n) => (
          <li key={n} className={overlap[n] >= 0.5 ? "w6e-kept" : undefined}>
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
  if (failed) return <div className="w6e-app" id="contexts-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="contexts-app"></div>;
  const row = data.rows[word][win] as [string, number][];
  const g = data.grid;
  return (
    <div className="w6e-app" id="contexts-app">
      <div className="w6e-controls">
        <Picker id="w6e-ctx-word" label="Word" value={word} options={wordOptions(data.targets)} onChange={setWord} />
        <span className="w6e-label" id="w6e-win-label">Window, words each side</span>
        <SegmentedControl className="rx-seg" ariaLabelledBy="w6e-win-label" buttons={["2", "5", "10"].map((v) => ({ value: v, label: v }))} value={win} onChange={setWin} />
      </div>
      <div className="w6e-cols">
        <Bars title={`The row for "${word}"`} note="Each bar is one cell: how often that word sits within the window." rows={row.map(([w, n]) => ({ key: w, label: w, value: n, text: String(n) }))} />
        <div className="w6e-list">
          <h3>A corner of the matrix, window 5</h3>
          <p className="w6e-note">A row is a target word, a column a context word, a cell their count.</p>
          <table className="w6e-grid">
            <thead><tr><th scope="col"></th>{(g.cols as string[]).map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
            <tbody>
              {(g.rows as string[]).map((r, i) => (
                <tr key={r}><th scope="row">{r}</th>{(g.cells[i] as number[]).map((n, j) => <td key={j} className={n ? undefined : "w6e-zero"}>{n}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- 6. PMI --------------------------------------------------------------------------------

function Pmi() {
  const { data, failed } = useSection("pmi");
  const [word, setWord] = useState(START.pmiWord);
  if (failed) return <div className="w6e-app" id="pmi-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="pmi-app"></div>;
  const r = data.rows[word];
  const rows = (list: [string, number, number][], by: "count" | "pmi") =>
    list.map(([w, n, v]) => ({ key: w, label: w, value: by === "count" ? n : v, text: by === "count" ? `${n} · PMI ${two(v)}` : `${two(v)} · seen ${n}×` }));
  return (
    <div className="w6e-app" id="pmi-app">
      <div className="w6e-controls">
        <Picker id="w6e-pmi-word" label="Word" value={word} options={wordOptions(data.targets)} onChange={setWord} />
        <span className="w6e-note" aria-live="polite">{`${r.negative_cells} of the row's ${r.cells} cells have negative PMI; PPMI sets them to 0.`}</span>
      </div>
      <div className="w6e-cols w6e-three">
        <Bars title="By count" rows={rows(r.count, "count")} />
        <Bars title="By PMI" note="Contexts seen once or twice top the list." rows={rows(r.pmi_any, "pmi")} />
        <Bars title={`By PPMI, seen ${r.min_count}+ times`} rows={rows(r.ppmi, "pmi")} />
      </div>
    </div>
  );
}

// ---- 7. vectors ----------------------------------------------------------------------------

function Vectors() {
  const { data, failed } = useSection("vectors");
  const [word, setWord] = useState(START.vectorWord);
  const [ex, setEx] = useState("0");
  if (failed) return <div className="w6e-app" id="vectors-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="vectors-app"></div>;
  const n = data.near[word];
  const rows = (list: [string, number][]) => list.map(([w, s]) => ({ key: w, label: w, value: s, text: three(s) }));
  const e = data.examples[Number(ex)];
  return (
    <div className="w6e-app" id="vectors-app">
      <div className="w6e-controls">
        <Picker id="w6e-vec-word" label="Word" value={word} options={wordOptions(data.targets)} onChange={setWord} />
      </div>
      <div className="w6e-cols w6e-three">
        <Bars title="PPMI rows" note="Sparse: one column per context word." rows={rows(n.ppmi)} />
        <Bars title="Skip-gram" note="100 numbers, trained to predict the context from the word." rows={rows(n.skipgram)} />
        <Bars title="CBOW" note="100 numbers, trained to predict the word from its context." rows={rows(n.cbow)} />
      </div>
      <div className="w6e-step">
        <div className="w6e-controls">
          <span className="w6e-label" id="w6e-ex-label">One training step with negative sampling</span>
          <SegmentedControl className="rx-seg" ariaLabelledBy="w6e-ex-label" buttons={data.examples.map((x: Any, i: number) => ({ value: String(i), label: x.centre }))} value={ex} onChange={setEx} />
        </div>
        <p className="w6e-window">
          {(e.window as string[]).map((w, i) => <span key={i} className={w === e.centre ? "w6e-centre" : "w6e-ctx"}>{w}</span>)}
        </p>
        <p className="w6e-note">{`From ${short(e.page)}. The model is pushed to score "${e.centre}" high with each word around it and low with 5 words drawn at random, more often the more common they are:`}</p>
        <p className="w6e-window">{(e.negative as string[]).map((w, i) => <span key={i} className="w6e-neg">{w}</span>)}</p>
      </div>
    </div>
  );
}

// ---- 8. GloVe ------------------------------------------------------------------------------

function Glove() {
  const { data, failed } = useSection("glove");
  const [word, setWord] = useState(START.gloveWord);
  if (failed) return <div className="w6e-app" id="glove-app"><Failed /></div>;
  if (!data) return <div className="w6e-app" id="glove-app"></div>;
  const c = data.compare[word];
  const shared = new Set(c.shared as string[]);
  const rows = (list: [string, number][]) => list.map(([w, s]) => ({ key: w, label: w, value: s, text: three(s), mark: shared.has(w) }));
  return (
    <div className="w6e-app" id="glove-app">
      <div className="w6e-controls">
        <Picker id="w6e-glove-word" label="Word" value={word} options={wordOptions(data.targets)} onChange={setWord} />
        <span className="w6e-note" aria-live="polite">{`${shared.size} of 10 nearest words are in both lists.`}</span>
      </div>
      <div className="w6e-cols">
        <Bars title="GloVe, 6 billion words of news and Wikipedia" rows={rows(c.glove)} />
        <Bars title="Skip-gram, the 303 Marvel pages" rows={rows(c.marvel)} />
      </div>
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
  (Object.keys(SPECS) as PartName[]).map((name) => [name, island(`week06/essentials/${name}`, SPECS[name][0], SPECS[name][1], { roots: [`#${name}-app`] })]),
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

export const Essential = island("week06/essentials/Essential", View, Placeholder, {
  roots: (Object.keys(SPECS) as PartName[]).map((name) => `#${name}-app`),
});
