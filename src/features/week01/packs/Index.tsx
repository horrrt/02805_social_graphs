"use client";
// "Browse all 303 cards": the card index packs.js drew on main. A search box
// and a filter narrow the roster, 24 cards at a time; every card shows how
// many the reader holds. Typing or filtering starts again from 24.
import { useState } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { useStore } from "@/lib/useStore";
import { Card } from "./Card";
import { usePacks } from "./model";
import { packs } from "./store.js";

const countsOf = (s: { counts: Record<string, number> }) => s.counts;

function Markup({
  search,
  filter,
  onSearch,
  onFilter,
  onMore,
  moreDisabled,
  count = "",
  grid = null,
}: {
  search?: string;
  filter?: string;
  onSearch?: (v: string) => void;
  onFilter?: (v: string) => void;
  onMore?: () => void;
  moreDisabled?: boolean;
  count?: string;
  grid?: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>Your card index</h2>
        <label>
          Find an article
          <input key={onSearch ? "live" : "server"} id="collection-search" placeholder="Try Baymax…" type="search" value={search} onChange={onSearch ? (e) => onSearch(e.target.value) : undefined} />
        </label>
      </div>
      <div className="control-row">
        <label>
          Show
          <select key={onFilter ? "live" : "server"} id="collection-filter" value={filter} onChange={onFilter ? (e) => onFilter(e.target.value) : undefined}>
            <option value="all">All 303 cards</option>
            <option value="owned">Collected</option>
            <option value="missing">Missing</option>
            <option value="rare">58 minimum-rate cards</option>
          </select>
        </label>
        <button className="quiet" id="more-cards" disabled={moreDisabled} onClick={onMore}>Show more cards</button>
      </div>
      <p className="fine" id="collection-count" role="status">
        {count}
      </p>
      <div className="collection-grid" id="collection-grid">
        {grid}
      </div>
      <p className="fine">
        Card art is typographic. Every name, degree and source link
        comes from the roster.
      </p>
    </section>
  );
}

function IndexView() {
  const hydrated = useHydrated();
  const model = usePacks();
  const counts = useStore(packs, countsOf);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(24);
  useIslandReady(model !== null);
  if (!hydrated) return <Markup />;
  const controls = {
    search,
    filter,
    onSearch: (v: string) => {
      setSearch(v);
      setLimit(24);
    },
    onFilter: (v: string) => {
      setFilter(v);
      setLimit(24);
    },
  };
  if (!model) return <Markup {...controls} />;
  const { data, weightById, minWeight } = model;
  const term = search.toLowerCase();
  const shown = data.nodes.filter(
    (n) =>
      n.name.toLowerCase().includes(term) &&
      (filter === "all" ||
        (filter === "owned" && counts[n.id]) ||
        (filter === "missing" && !counts[n.id]) ||
        (filter === "rare" && weightById.get(n.id) === minWeight)),
  );
  const grid = shown.length ? (
    shown.slice(0, limit).map((n) => <Card key={n.id} node={n} index={data.nodes.indexOf(n)} count={counts[n.id] || 0} />)
  ) : (
    <p className="empty">No cards match this view.</p>
  );
  return (
    <Markup
      {...controls}
      onMore={() => setLimit((l) => l + 24)}
      moreDisabled={limit >= shown.length}
      count={`Showing ${Math.min(limit, shown.length)} of ${shown.length} cards. ${filter === "all" ? "The index includes cards you have not drawn." : ""}`}
      grid={grid}
    />
  );
}

const IndexHost = () => <Markup />;

export const CardIndex = island("week01/packs/Index", IndexView, IndexHost, { roots: ["#collection-grid", "#collection-search", "#collection-filter", "#more-cards", "#collection-count"] });
