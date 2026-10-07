// The toolbox: pick a week or concepts, then browse the games, teaching
// materials, our own components and the chart libraries' examples that fit.
// Takes its data as a prop (Toolbox.tsx loads it), so tests can render it.
// Filters live in filters.ts.
import { type ReactNode, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/post/SegmentedControl";
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

// A picture from the data, or an empty box of the same size so rows line up. Pictures are hotlinked
// from their own sites, so a broken one hides itself.
function Thumb({ src, size = "s" }: { src: string | null | undefined; size?: "s" | "card" }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="tb-thumb" data-size={size}>
      {src && !broken ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : null}
    </span>
  );
}

// The gallery's card: a big picture, with the name and details laid small over it on hover or keyboard
// focus. A card without a picture shows them all the time, so it is never blank.
function Card({ src, title, href, children }: { src: string | null | undefined; title: string; href?: string | null; children?: ReactNode }) {
  const [broken, setBroken] = useState(false);
  const has = Boolean(src) && !broken;
  return (
    <li className="tb-card" data-picture={has}>
      {has ? <img src={src!} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : null}
      <div className="tb-overlay">
        <span className="tb-card-title">{href ? <a href={href}>{title}</a> : title}</span>
        {children}
      </div>
    </li>
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
  const [picture, setPicture] = useState<"game" | "play">("game");
  const [view, setView] = useState<"table" | "gallery">("table");

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
        <div className="tb-row">
          <span className="tb-label">Week</span>
          {/* "All" is pressed only with no concepts chosen; concepts picked by hand press no week. */}
          <SegmentedControl
            className="rx-seg"
            ariaLabel="Week"
            buttons={[{ value: "0", label: "All" }, ...data.weeks.map((w) => ({ value: String(w.n), label: `${w.n} · ${w.title}` }))]}
            value={week ? String(week) : chosen.length ? null : "0"}
            onChange={(v) => pickWeek(Number(v))}
          />
        </div>
        {(["networks", "text", "general"] as const).map((group) => (
          <div key={group} className="tb-row" role="group" aria-label={`${group} concepts`}>
            <span className="tb-label">{group === "networks" ? "Networks" : group === "text" ? "Text" : "General"}</span>
            {data.concepts
              .filter((c) => c.group === group)
              .map((c) => (
                <button key={c.id} type="button" className="tb-chip" aria-pressed={chosen.includes(c.id)} onClick={() => toggle(c.id)}>
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
            <button type="button" className="tb-chip" onClick={() => pickWeek(0)}>
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
        <div className="tb-view">
          <span className="tb-label">View</span>
          <SegmentedControl
            className="rx-seg"
            ariaLabel="View"
            buttons={[{ value: "table", label: "Table" }, { value: "gallery", label: "Gallery" }]}
            value={view}
            onChange={(v) => setView(v as "table" | "gallery")}
          />
        </div>
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
            <span className="tb-label">Picture</span>
            <SegmentedControl
              className="rx-seg"
              ariaLabel="Picture"
              buttons={[{ value: "game", label: "Game" }, { value: "play", label: "Gameplay" }]}
              value={picture}
              onChange={(v) => setPicture(v as "game" | "play")}
            />
            <span className="tb-dim">
              {games.filter(({ g }) => (picture === "game" ? g.img : g.play)).length.toLocaleString("en")} of {games.length.toLocaleString("en")} have one
            </span>
          </div>
          <p className="tb-note">
            Fit: <b>Strong</b> when winning the game requires a chosen concept (★), <b>Likely</b> when its mechanic fits one. Build: S one session, M a
            few, L only a stripped-down version.
          </p>
          {view === "gallery" ? (
            <ul className="tb-gallery" aria-label="Games as pictures">
              {games.slice(0, shown).map(({ g, fit }) => (
                <Card key={`${g.list}-${g.rank}`} src={picture === "game" ? g.img : g.play} title={g.name} href={g.wiki ?? g.link?.url}>
                  <span className="tb-card-meta">
                    {[fit ? FIT_LABEL[fit] : g.star ? "★" : "", `${g.list} #${g.rank}`, `Build ${g.build}`, g.year ? String(g.year) : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="tb-card-text">{g.loop}</span>
                  {g.teach && g.teach !== "Not a fit" ? <span className="tb-card-text">Teaches: {g.teach}</span> : null}
                  <span className="tb-card-links">
                    <Links wiki={g.wiki} link={g.link} />
                  </span>
                </Card>
              ))}
            </ul>
          ) : (
          <table className="tb-table">
            <thead>
              <tr>
                <th>Fit</th>
                <th aria-label="Picture" />
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
                    <Thumb key={picture} src={picture === "game" ? g.img : g.play} />
                  </td>
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
          )}
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
              {view === "gallery" ? (
                <ul className="tb-gallery">
                  {rows.map((m) => (
                    <Card key={m.rank} src={m.img} title={m.name} href={m.url}>
                      <span className="tb-card-meta">{[m.type, m.by, m.free === "Yes" ? "" : m.free].filter(Boolean).join(" · ")}</span>
                      <span className="tb-card-text">{m.why}</span>
                    </Card>
                  ))}
                </ul>
              ) : (
              <table className="tb-table">
                <thead>
                  <tr>
                    <th aria-label="Picture" />
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
                        <Thumb src={m.img} />
                      </td>
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
              )}
            </div>
          ))}
        </section>
      ) : null}

      {tab === "components" ? (
        <section aria-label="Our components">
          {view === "gallery" ? (
            <ul className="tb-gallery">
              {parts.map((p: Component) => (
                <Card
                  key={`${p.kind}-${p.name}-${p.where}`}
                  src={p.img}
                  title={p.name}
                  href={p.seen_at ? (p.seen_at.startsWith("http") ? p.seen_at : sitePath(p.seen_at)) : p.where.startsWith("http") ? p.where : null}
                >
                  <span className="tb-card-meta">{[p.kind, p.week ? `Week ${p.week}` : ""].filter(Boolean).join(" · ")}</span>
                  <span className="tb-card-text">{p.what}</span>
                  <span className="tb-card-text">
                    <code>{p.where}</code>
                  </span>
                </Card>
              ))}
            </ul>
          ) : (
          <table className="tb-table">
            <thead>
              <tr>
                <th aria-label="Picture" />
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
                    <Thumb src={p.img} />
                  </td>
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
          )}
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
                {view === "gallery" ? (
                  <ul className="tb-gallery">
                    {rows.map((e, i) => (
                      <Card key={`${i}-${e.url}`} src={e.img} title={e.title} href={e.url}>
                        {e.cat ? <span className="tb-card-meta">{e.cat}</span> : null}
                        {e.c.length ? <span className="tb-card-text">{e.c.map((c) => labels.get(c) ?? c).join(", ")}</span> : null}
                      </Card>
                    ))}
                  </ul>
                ) : (
                <ul className="tb-examples">
                  {rows.map((e, i) => (
                    <li key={`${i}-${e.url}`}>
                      <a href={e.url}>
                        <Thumb src={e.img} size="card" />
                        <span className="tb-ex-title">{e.title}</span>
                      </a>
                      {e.cat ? <span className="tb-dim">{e.cat}</span> : null}
                      {e.c.length ? <Tags ids={e.c} labels={labels} /> : null}
                    </li>
                  ))}
                </ul>
                )}
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
