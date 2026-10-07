// The friendship paradox as a sampler: pick a person at random, then one of
// their friends, and tally both degrees. Sample one at a time or a thousand
// at once; the two histograms overlay on the kit's DistributionPlot, readouts
// give the two means and how often the friend has at least as many links.
// Seeded (Reset replays the same draws). The sampler is samplePair() in
// growth-core.js, adapted from socialgraphs2026-web (MIT, Sune Lehmann).
// Style: .kit-paradox in post.css.
import { useMemo, useRef, useState } from "react";
import DistributionPlot from "./DistributionPlot";
import Readouts from "./Readouts";
import { mulberry32, toAdj } from "./graph-core";
import { degreeShares, samplePair } from "./growth-core.js";

type Pair = { person: number; friend: number; kPerson: number; kFriend: number };
type Tally = { person: number[]; friend: number[]; last: Pair | null };

const EMPTY: Tally = { person: [], friend: [], last: null };
const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
const fmt = (v: number) => (Number.isFinite(v) ? v.toLocaleString("en-GB", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : "–");

/** <FriendshipParadox n={n} edges={edges} labels={names} /> */
export default function FriendshipParadox({
  n,
  edges,
  labels,
  cap = 30,
  seed = 1,
  height = 260,
}: {
  n: number;
  edges: [number, number][];
  labels?: string[];
  /** The last histogram bin holds every degree at or above it. */
  cap?: number;
  seed?: number;
  height?: number;
}) {
  const adj = useMemo(() => toAdj(n, edges).out as number[][], [n, edges]);
  const linked = useMemo(() => adj.map((_, v) => v).filter((v) => adj[v].length > 0), [adj]);
  const rng = useRef<() => number>(mulberry32(seed));
  const [tally, setTally] = useState<Tally>(EMPTY);

  // Drawn in the event, not in a state updater, so StrictMode never draws twice.
  const draw = (count: number) => {
    const person = tally.person.slice();
    const friend = tally.friend.slice();
    let last = tally.last;
    for (let i = 0; i < count; i++) {
      const s = samplePair(adj, rng.current, linked) as Pair | null;
      if (!s) break;
      person.push(s.kPerson);
      friend.push(s.kFriend);
      last = s;
    }
    setTally({ person, friend, last });
  };
  const reset = () => {
    rng.current = mulberry32(seed);
    setTally(EMPTY);
  };

  const series = useMemo(
    () => [
      { key: "person", name: "random person", points: degreeShares(tally.person, cap) as [number, number][], style: "line" as const, color: "--access" },
      { key: "friend", name: "their friend", points: degreeShares(tally.friend, cap) as [number, number][], style: "line" as const, color: "--gain" },
    ],
    [tally, cap],
  );
  const wins = tally.person.filter((k, i) => tally.friend[i] >= k).length;
  const name = (v: number) => labels?.[v] ?? `node ${v}`;
  const none = linked.length === 0;

  return (
    <div className="kit-paradox">
      <div className="kit-controls">
        <button type="button" className="kit-btn" onClick={() => draw(1)} disabled={none}>
          Sample one person
        </button>
        <button type="button" className="kit-btn" onClick={() => draw(1000)} disabled={none}>
          Sample 1,000
        </button>
        <button type="button" className="kit-btn" onClick={reset} disabled={tally.person.length === 0}>
          Reset tally
        </button>
      </div>
      {none ? <p className="kit-empty">Nobody here has a friend, so there is nothing to sample.</p> : null}
      <p className="kit-note" aria-live="polite">
        {tally.last
          ? `Last draw: ${name(tally.last.person)} (${tally.last.kPerson} ${tally.last.kPerson === 1 ? "friend" : "friends"}), then their friend ${name(tally.last.friend)} (${tally.last.kFriend}).`
          : none
            ? ""
            : "Sample to fill the histograms in."}
      </p>
      <DistributionPlot
        series={series}
        views={[]}
        scale={{ x: "lin", y: "lin" }}
        scaleToggle="none"
        xLabel={`degree k of the sampled node (${cap}+ in the last bin)`}
        yLabel="share of samples"
        height={height}
        aria={`Degrees of ${tally.person.length} random people and of one friend each`}
      />
      <Readouts
        items={[
          { label: "Samples", value: tally.person.length.toLocaleString("en-GB") },
          { label: "Mean degree, person", value: fmt(mean(tally.person)) },
          { label: "Mean degree, friend", value: fmt(mean(tally.friend)) },
          { label: "Friend ≥ person", value: tally.person.length ? `${Math.round((100 * wins) / tally.person.length)}%` : "–" },
        ]}
      />
    </div>
  );
}
