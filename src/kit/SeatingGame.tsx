// A dinner for a network, two ways. "One table": seat k guests beside a host
// so the table holds more links than chance would give it, L_in − (Σk)²/4m
// (a table's share of modularity, times m); each chair shows what its guest
// added, an undo takes the last one away, and the reveal sets your table
// against a greedy host, a random host and the best table a local search
// finds. "The whole room": lay a few place cards, label propagation seats
// everyone else from them, and the reveal scores the room's modularity Q
// against Louvain, greedy merging and a random seating, and rings the guests
// Louvain would seat elsewhere. Lists beside the map hold every choice, so the
// game runs from the keyboard. Rules in game-core.js; frame from GameShell.
// Style: .kit-seating in post.css.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import GameShell, { focusWithin, useGameRun, type GameSettings } from "./GameShell";
import NetworkView from "./NetworkView";
import {
  bestTable, candidates, disagreements, greedyModularity, greedyTable, louvainSeating, mulberry32, nmi, partitionQ, pick, randomPartition, randomTable,
  seatDelta, seatFromCards, tableScore,
} from "./game-core.js";
import { degrees, forceLayout } from "./graph-core.js";

type Edge = [number, number];
const CARD_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];
const fmt = (v: number, d = 2) => (Number.isFinite(v) ? v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–");
const signed = (v: number) => `${v >= 0 ? "+" : "−"}${fmt(Math.abs(v))}`;

/**
 * <SeatingGame n={34} edges={karate} names={names} reference={{ label: "the club's split", partition }} />.
 * `preset` ({ mode, host, seats } or { mode: "room", cards }) opens it mid-run.
 */
export default function SeatingGame({
  n,
  edges,
  names,
  positions,
  reference,
  sizes = [3, 5, 9],
  cardCounts = [2, 3, 4],
  hosts,
  seed = 1,
  preset,
  title = "Seating plan",
  dailyToggle = true,
}: {
  n: number;
  edges: Edge[];
  names?: string[];
  positions?: [number, number][];
  reference?: { label: string; partition: number[] };
  sizes?: number[];
  cardCounts?: number[];
  hosts?: number[];
  seed?: number;
  preset?: { mode: "table"; host: number; size?: number; seats?: number[] } | { mode: "room"; cards?: Record<number, number>; count?: number };
  title?: string;
  dailyToggle?: boolean;
}) {
  const name = (v: number) => names?.[v] ?? `guest ${v}`;
  const at = useMemo(() => positions ?? (forceLayout(n, edges, { rng: mulberry32(n + 5), iterations: 200 }) as [number, number][]), [positions, n, edges]);
  const k = useMemo(() => degrees(n, edges), [n, edges]);
  const pool = hosts ?? Array.from({ length: n }, (_, v) => v).filter((v) => k[v] > 0);
  const hostFor = (sd: number) => pick(pool, mulberry32(sd)) ?? 0;

  const defaults: GameSettings = {
    mode: preset?.mode ?? "table",
    size: String(preset?.mode === "table" ? preset.size ?? sizes[1] ?? sizes[0] : sizes[1] ?? sizes[0]),
    cards: String(preset?.mode === "room" ? preset.count ?? cardCounts[cardCounts.length - 1] : cardCounts[cardCounts.length - 1]),
  };
  const [seats, setSeats] = useState<number[]>(() => (preset?.mode === "table" ? [preset.host, ...(preset.seats ?? [])] : [hostFor(seed)]));
  const [cards, setCards] = useState<Record<number, number>>(() => (preset?.mode === "room" ? preset.cards ?? {} : {}));
  const [card, setCard] = useState(0);
  const run = useGameRun({
    game: "seating",
    defaults,
    better: "higher",
    seed,
    autostart: Boolean(preset),
    onStart: (_s, sd) => {
      setSeats([hostFor(sd)]);
      setCards({});
      setCard(0);
    },
  });
  const mode = run.settings.mode;
  const size = Math.min(Number(run.settings.size), Math.max(0, n - 1));
  const count = Math.min(Number(run.settings.cards), CARD_NAMES.length);
  const host = seats[0];

  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    focusWithin(root.current, list.current?.querySelector<HTMLButtonElement>("button") ?? null);
  }, [seats.length]);

  // ---- one table
  const score = tableScore(n, edges, seats);
  const added = seats.map((v, i) => (i === 0 ? 0 : seatDelta(n, edges, seats.slice(0, i), v)));
  const next = n ? candidates(n, edges, seats) : [];
  const seat = (v: number) => {
    if (seats.includes(v) || seats.length > size || run.phase !== "playing") return;
    const s = [...seats, v];
    setSeats(s);
    if (s.length === size + 1) run.finish(+tableScore(n, edges, s).toFixed(6));
  };

  // ---- the whole room
  const seating = useMemo(() => (mode === "room" && run.phase === "reveal" ? (seatFromCards(n, edges, cards, mulberry32(run.seed)) as number[]) : null), [mode, run.phase, run.seed, n, edges, cards]);
  const placeCard = (v: number) => {
    if (run.phase !== "playing") return;
    setCards((c) => {
      const out = { ...c };
      if (out[v] === card) delete out[v];
      else if (Object.keys(out).length < count || out[v] !== undefined) out[v] = card;
      return out;
    });
  };
  const placed = Object.keys(cards).length;
  const seatRoom = () => run.finish(+partitionQ(edges, seatFromCards(n, edges, cards, mulberry32(run.seed))).toFixed(6));

  // ---- the reveal's rivals
  const rivals = useMemo(() => {
    if (run.phase !== "reveal" || n === 0) return null;
    const lv = louvainSeating(n, edges, mulberry32(run.seed)) as number[];
    if (mode === "table") {
      const tables = {
        greedy: greedyTable(n, edges, host, size) as number[],
        random: randomTable(n, edges, host, size, mulberry32(run.seed + 1)) as number[],
        best: bestTable(n, edges, host, size) as number[],
      };
      return { lv, tables, rooms: null };
    }
    const rooms = {
      louvain: lv,
      greedy: greedyModularity(n, edges) as number[],
      random: randomPartition(n, Math.max(1, count), mulberry32(run.seed + 1)) as number[],
    };
    return { lv, tables: null, rooms };
  }, [run.phase, run.seed, n, edges, mode, host, size, count]);

  // Colours: a table's guests in group 0; in the room, each node takes its card's colour, unreached guests none.
  const groupOf = (v: number): number | null => {
    if (mode === "table") return seats.includes(v) ? 0 : null;
    if (!seating) return cards[v] ?? null;
    const carded = Object.entries(cards).find(([u]) => seating[Number(u)] === seating[v]);
    return carded ? carded[1] : null;
  };
  const off = new Set(seating && rivals ? (disagreements(seating, rivals.lv) as number[]) : []);
  const spec = {
    ratio: 0.62,
    radius: 6,
    nodes: Array.from({ length: n }, (_, v) => ({
      id: v,
      x: 0.06 + (at[v]?.[0] ?? 0.5) * 0.88,
      y: 0.04 + (at[v]?.[1] ?? 0.5) * 0.54,
      label: name(v),
      group: groupOf(v),
      state: mode === "table" && v === host ? ("picked" as const) : off.has(v) ? ("ring" as const) : undefined,
    })),
    links: edges.map(([a, b]) => ({ source: a, target: b })),
    // The legend lists the cards up to the last one laid, so a card nobody used stays out of it.
    groups: mode === "table" ? ["at the table"] : CARD_NAMES.slice(0, Math.max(0, ...Object.values(cards).map((c) => c + 1))).map((c) => `card ${c}`),
    legend: mode === "room" && placed > 0,
    aria:
      mode === "table"
        ? `${n} guests; ${seats.length} at ${name(host)}'s table, scoring ${fmt(score)} links above chance`
        : `${n} guests; ${placed} place cards laid${seating ? `; rings mark ${off.size} guests Louvain seats elsewhere` : ""}`,
  };
  const groupKey = Array.from({ length: n }, (_, v) => groupOf(v) ?? "-").join(",");

  const segments = [
    { key: "mode", label: "Game", options: [{ value: "table", label: "One table", sub: "fill the seats round a host" }, { value: "room", label: "The whole room", sub: "lay place cards, the rest follow" }] },
    mode === "table"
      ? { key: "size", label: "Seats", options: sizes.map((s) => ({ value: String(s), label: `${s} seats`, sub: s > n - 1 ? `cut to ${Math.max(0, n - 1)}` : undefined })) }
      : { key: "cards", label: "Place cards", options: cardCounts.map((c) => ({ value: String(c), label: `${c} cards` })) },
  ];

  const tableRows = rivals?.tables
    ? [
        ["You", seats],
        ["Greedy host", rivals.tables.greedy],
        ["Random host", rivals.tables.random],
        ["Best found", rivals.tables.best],
      ].map(([label, t]) => ({ label: label as string, seats: t as number[], score: tableScore(n, edges, t as number[]) }))
    : [];
  const roomRows = rivals?.rooms && seating
    ? [
        ["You", seating],
        ["Louvain", rivals.rooms.louvain],
        ["Greedy merging", rivals.rooms.greedy],
        ["Random seating", rivals.rooms.random],
      ].map(([label, p]) => ({ label: label as string, part: p as number[], q: partitionQ(edges, p as number[]), tables: new Set(p as number[]).size }))
    : [];
  const withHost = rivals ? seats.slice(1).filter((v) => rivals.lv[v] === rivals.lv[host]).length : 0;

  return (
    <div className="kit-seating" ref={root}>
      <GameShell
        run={run}
        title={title}
        dailyToggle={dailyToggle}
        intro={<p>A community is a table where the guests share more links than chance would give them. You are the host.</p>}
        segments={segments}
        canStart={n > 0 && (mode === "room" || size > 0)}
        startNote={n === 0 ? "The room is empty: nobody to seat." : mode === "table" && Number(run.settings.size) > n - 1 ? `Only ${n - 1} guests besides the host: the table is cut to ${n - 1}.` : undefined}
        startLabel="Open the doors"
        hud={
          mode === "table"
            ? [
                { label: "Table score", value: fmt(score), sub: "links above chance" },
                { label: "Seated", value: `${seats.length - 1} of ${size}` },
                { label: "Host", value: name(host) },
              ]
            : [
                { label: "Cards laid", value: `${placed} of ${count}` },
                { label: "Card in hand", value: CARD_NAMES[card] },
              ]
        }
        fmtScore={(v) => (mode === "table" ? `${fmt(v)} above chance` : `Q = ${fmt(v, 3)}`)}
        reveal={
          <div className="kit-seating-reveal">
            {mode === "table" ? (
              <>
                <table className="kit-game-table">
                  <thead>
                    <tr>
                      <th scope="col">Host</th>
                      <th scope="col">Table</th>
                      <th scope="col" className="num">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r) => (
                      <tr key={r.label} className={r.label === "You" ? "kit-target" : undefined}>
                        <th scope="row">{r.label}</th>
                        <td>{r.seats.slice(1).map(name).join(", ") || "nobody"}</td>
                        <td className="num">{fmt(r.score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="kit-game-verdict">
                  Louvain puts {withHost} of your {seats.length - 1} guests in {name(host)}&apos;s community.
                </p>
              </>
            ) : (
              <>
                <table className="kit-game-table">
                  <thead>
                    <tr>
                      <th scope="col">Seating</th>
                      <th scope="col" className="num">
                        Tables
                      </th>
                      <th scope="col" className="num">
                        Q
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomRows.map((r) => (
                      <tr key={r.label} className={r.label === "You" ? "kit-target" : undefined}>
                        <th scope="row">{r.label}</th>
                        <td className="num">{r.tables}</td>
                        <td className="num">{fmt(r.q, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {seating && rivals ? (
                  <p className="kit-game-verdict">
                    Your room agrees with Louvain&apos;s at NMI {fmt(nmi(seating, rivals.lv), 2)}
                    {reference ? ` and with ${reference.label} at ${fmt(nmi(seating, reference.partition), 2)}` : ""}. Rings mark the {off.size} guests Louvain seats
                    elsewhere.
                  </p>
                ) : null}
              </>
            )}
            <NetworkView key={`reveal-${groupKey}`} spec={spec} />
          </div>
        }
      >
        <div className="kit-seating-play">
          <div className="kit-seating-map">
            <NetworkView key={groupKey} spec={spec} onNodeClick={(id) => (mode === "table" ? next.includes(Number(id)) && seat(Number(id)) : placeCard(Number(id)))} />
          </div>
          <div className="kit-seating-side">
            {mode === "table" ? (
              <>
                <h5>At the table</h5>
                <ol className="kit-seating-seats">
                  {seats.map((v, i) => (
                    <li key={v}>
                      {name(v)}
                      <span className="kit-num">{i === 0 ? "host" : signed(added[i])}</span>
                    </li>
                  ))}
                </ol>
                <h5 id={listId}>Linked to the table</h5>
                <ul ref={list} className="kit-game-list" aria-labelledby={listId}>
                  {next.map((v) => (
                    <li key={v}>
                      <button type="button" onClick={() => seat(v)}>
                        {name(v)}
                        <small>
                          {" "}
                          {k[v]} {k[v] === 1 ? "link" : "links"}
                        </small>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="kit-game-tools">
                  <button type="button" className="kit-btn" disabled={seats.length < 2} onClick={() => setSeats(seats.slice(0, -1))}>
                    Undo the last chair
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="kit-game-seg">
                  <span className="kit-game-seg-label">Card in hand</span>
                  <div role="group" aria-label="Card in hand">
                    {CARD_NAMES.slice(0, count).map((c, i) => (
                      <button key={c} type="button" className={`kit-card kit-card-${i}`} aria-pressed={card === i} onClick={() => setCard(i)}>
                        <b>{c}</b>
                      </button>
                    ))}
                  </div>
                </div>
                <h5 id={listId}>Lay or lift a card</h5>
                <ul ref={list} className="kit-game-list" aria-labelledby={listId}>
                  {Array.from({ length: n }, (_, v) => v)
                    .sort((a, b) => k[b] - k[a] || a - b)
                    .map((v) => (
                      <li key={v}>
                        <button type="button" aria-pressed={cards[v] !== undefined} onClick={() => placeCard(v)} disabled={cards[v] === undefined && placed >= count}>
                          {name(v)}
                          <small> {cards[v] !== undefined ? `card ${CARD_NAMES[cards[v]]}` : `${k[v]} links`}</small>
                        </button>
                      </li>
                    ))}
                </ul>
                <div className="kit-game-tools">
                  <button type="button" className="kit-game-start" onClick={seatRoom}>
                    Seat everyone
                  </button>
                </div>
                <p className="kit-note">Guests no card reaches through their friends sit at a table of their own.</p>
              </>
            )}
          </div>
        </div>
      </GameShell>
    </div>
  );
}
