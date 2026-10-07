// The toolbox: pick a week or concepts, then browse the games, teaching
// materials, our own components and the chart libraries' examples that fit.
// Takes its data as a prop (Toolbox.tsx loads it), so tests can render it.
// Filters live in filters.ts.
import { useMemo, useState } from "react";
import {
  type Component, filterComponents, filterGames, filterLibraries, filterMaterials, type Fit, type Library, sitePath, type ToolboxData,
} from "./filters";

type Tab = "games" | "materials" | "components" | "libraries";
const PAGE = 100;
const FIT_LABEL = { strong: "Strong", likely: "Likely" } as const;

function Links({ wiki, link }: { wiki: string | null; link: { label: string; url: string } | null }) {
  return (
    <>
      {wiki ? <a href={wiki}>Wikipedia</a> : null}
      {wiki && link ? " · " : null}
      {link ? <a href={link.url}>{link.label}</a> : null}
    </>
  );
}

function Tags({ ids, labels }: { ids: string[]; labels: Map<string, string> }) {
  return <span className="tb-tags">{ids.map((c) => labels.get(c) ?? c).join(", ")}</span>;
}

export function ToolboxView({ data }: { data: ToolboxData }) {
  const [week, setWeek] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("games");
  const [query, setQuery] = useState("");
  const [list, setList] = useState("");
  const [builds, setBuilds] = useState<string[]>([]);
  const [starOnly, setStarOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<string[]>([]);

  const labels = useMemo(() => new Map(data.concepts.map((c) => [c.id, c.label])), [data]);
  const lists = useMemo(() => [...new Set(data.games.map((g) => g.list))], [data]);
  const games = useMemo(() => filterGames(data.games, { concepts: chosen, query, list, builds, starOnly }), [data, chosen, query, list, builds, starOnly]);
  const topics = useMemo(() => filterMaterials(data, chosen, query, week), [data, chosen, query, week]);
  const parts = useMemo(() => filterComponents(data.components, chosen, query), [data, chosen, query]);
  const networkIds = useMemo(() => data.concepts.filter((c) => c.group === "networks").map((c) => c.id), [data]);
  const libs = useMemo(() => filterLibraries(data.libraries, chosen, query, networkIds), [data, chosen, query, networkIds]);

  const pickWeek = (n: number) => {
    setWeek(n);
    setChosen(n ? (data.weeks.find((w) => w.n === n)?.c ?? []) : []);
    setShown(PAGE);
  };
  const toggle = (id: string) => {
    setWeek(0);
    setChosen(chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id]);
    setShown(PAGE);
  };
  const toggleBuild = (b: string) => setBuilds(builds.includes(b) ? builds.filter((x) => x !== b) : [...builds, b]);

  const counts: Record<Tab, number> = {
    games: games.length,
    materials: topics.reduce((n, t) => n + t.rows.length, 0),
    components: parts.length,
    libraries: libs.reduce((n, l) => n + l.hits.length, 0),
  };
  const tabs: [Tab, string][] = [["games", "Games"], ["materials", "Materials"], ["components", "Our components"], ["libraries", "Libraries"]];

  return (
    <div className="tb" id="toolbox">
      <section className="tb-controls" aria-label="Filters">
        <div className="tb-row" role="group" aria-label="Week">
          <span className="tb-label">Week</span>
          <button type="button" aria-pressed={week === 0 && chosen.length === 0} onClick={() => pickWeek(0)}>
            All
          </button>
          {data.weeks.map((w) => (
            <button key={w.n} type="button" aria-pressed={week === w.n} onClick={() => pickWeek(w.n)} title={w.title}>
              {w.n} · {w.title}
            </button>
          ))}
        </div>
        {(["networks", "text", "general"] as const).map((group) => (
          <div key={group} className="tb-row" role="group" aria-label={`${group} concepts`}>
            <span className="tb-label">{group === "networks" ? "Networks" : group === "text" ? "Text" : "General"}</span>
            {data.concepts
              .filter((c) => c.group === group)
              .map((c) => (
                <button key={c.id} type="button" aria-pressed={chosen.includes(c.id)} onClick={() => toggle(c.id)}>
                  {c.label}
                </button>
              ))}
          </div>
        ))}
        <div className="tb-row">
          <label className="tb-search">
            <span className="tb-label">Search</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="a game, a material, an example…" />
          </label>
          {chosen.length ? (
            <button type="button" onClick={() => pickWeek(0)}>
              Clear concepts
            </button>
          ) : null}
        </div>
      </section>

      <div className="tb-tabs" role="tablist" aria-label="What to show">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label} <span className="tb-count">{counts[id].toLocaleString("en")}</span>
          </button>
        ))}
      </div>

      {tab === "games" ? (
        <section aria-label="Games">
          <div className="tb-row">
            <label>
              <span className="tb-label">List</span>
              <select value={list} onChange={(e) => setList(e.target.value)}>
                <option value="">All lists</option>
                {lists.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <span className="tb-label">Build</span>
            {["S", "M", "L"].map((b) => (
              <label key={b} className="tb-check">
                <input type="checkbox" checked={builds.includes(b)} onChange={() => toggleBuild(b)} /> {b}
              </label>
            ))}
            <label className="tb-check">
              <input type="checkbox" checked={starOnly} onChange={(e) => setStarOnly(e.target.checked)} /> Only ★ (winning needs the concept)
            </label>
          </div>
          <p className="tb-note">
            Fit: <b>Strong</b> when winning the game requires a chosen concept (★), <b>Likely</b> when its mechanic fits one. Build: S one session, M a
            few, L only a stripped-down version.
          </p>
          <table className="tb-table">
            <thead>
              <tr>
                <th>Fit</th>
                <th>Game</th>
                <th>List</th>
                <th>Build</th>
                <th>Core loop</th>
                <th>Could teach</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {games.slice(0, shown).map(({ g, fit }: { g: ToolboxData["games"][number]; fit: Fit }) => (
                <tr key={`${g.list}-${g.rank}`}>
                  <td>{fit ? FIT_LABEL[fit] : g.star ? "★" : ""}</td>
                  <td>
                    <b>{g.name}</b>
                    {g.year ? <span className="tb-dim"> {g.year}</span> : null}
                  </td>
                  <td>
                    {g.list} #{g.rank}
                  </td>
                  <td>{g.build}</td>
                  <td>{g.loop}</td>
                  <td>
                    {g.teach}
                    {g.c.length ? (
                      <>
                        <br />
                        <Tags ids={g.c} labels={labels} />
                      </>
                    ) : null}
                  </td>
                  <td>
                    <Links wiki={g.wiki} link={g.link} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {games.length > shown ? (
            <button type="button" className="tb-more" onClick={() => setShown(shown + PAGE)}>
              Show {Math.min(PAGE, games.length - shown)} more of {games.length - shown}
            </button>
          ) : null}
        </section>
      ) : null}

      {tab === "materials" ? (
        <section aria-label="Materials">
          {topics.map(({ topic, rows }) => (
            <div key={topic.slug} className="tb-group">
              <h2>
                Week {topic.week} · {topic.title}
              </h2>
              <p className="tb-note">{topic.note}</p>
              <table className="tb-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Type</th>
                    <th>By</th>
                    <th>Why it’s essential</th>
                    <th>Free</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.rank}>
                      <td>
                        <a href={m.url}>{m.name}</a>
                      </td>
                      <td>{m.type}</td>
                      <td>{m.by}</td>
                      <td>{m.why}</td>
                      <td>{m.free}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ) : null}

      {tab === "components" ? (
        <section aria-label="Our components">
          <table className="tb-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th>What it shows or does</th>
                <th>Week</th>
                <th>Concepts</th>
                <th>Where</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p: Component) => (
                <tr key={`${p.kind}-${p.name}-${p.where}`}>
                  <td>
                    <b>{p.name}</b>
                  </td>
                  <td>{p.kind}</td>
                  <td>{p.what}</td>
                  <td>{p.week ?? ""}</td>
                  <td>
                    <Tags ids={p.concepts} labels={labels} />
                  </td>
                  <td>
                    {p.seen_at ? <a href={p.seen_at.startsWith("http") ? p.seen_at : sitePath(p.seen_at)}>{p.seen_at}</a> : null}
                    {p.seen_at ? <br /> : null}
                    {p.where.startsWith("http") ? <a href={p.where}>{p.where}</a> : <code>{p.where}</code>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "libraries" ? (
        <section aria-label="Libraries">
          <p className="tb-note">
            Concepts on examples are suggestions from words in their titles. With concepts chosen, matching examples come first; any network
            concept also brings up network drawings.
          </p>
          {libs.map(({ lib, hits, rest }: { lib: Library; hits: Library["examples"]; rest: Library["examples"] }) => {
            const all = open.includes(lib.slug);
            const rows = all ? [...hits, ...rest] : hits.slice(0, 24);
            const hidden = all ? 0 : hits.length - rows.length + rest.length;
            return (
              <div key={lib.slug} className="tb-group">
                <h2>
                  {lib.name} {lib.version_in_repo ? <span className="tb-dim">in the repo, {lib.version_in_repo}</span> : null}
                </h2>
                <p className="tb-note">
                  {lib.what_for} <a href={lib.site}>Site</a> · <a href={lib.gallery}>Gallery</a>
                  {lib.note ? ` · ${lib.note}` : ""}
                </p>
                <ul className="tb-examples">
                  {rows.map((e, i) => (
                    <li key={`${i}-${e.url}`}>
                      <a href={e.url}>{e.title}</a>
                      {e.cat ? <span className="tb-dim"> · {e.cat}</span> : null}
                      {e.c.length ? <Tags ids={e.c} labels={labels} /> : null}
                    </li>
                  ))}
                </ul>
                {hidden > 0 ? (
                  <button type="button" className="tb-more" onClick={() => setOpen([...open, lib.slug])}>
                    Show all {hits.length + rest.length} examples
                  </button>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
