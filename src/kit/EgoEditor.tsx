// One node's neighbourhood, built by hand: the focal node in the middle and a
// ring of candidates around it. A click (or Enter) on a candidate attaches it
// to the focal node or detaches it; a click on the dashed line between two
// attached neighbours links them, and again unlinks them. The focal node's
// local clustering C = 2T / k(k − 1) is written out with the numbers, from
// graph-core's localClustering, with a table of every node's k and C. Presets
// make a star, a clique or a random neighbourhood (seeded, so a seed repeats
// its sequence). Drawn after hydration at its parent's width. Style: .kit-ego
// in post.css.
import { useRef, useState, type KeyboardEvent } from "react";
import { useFittedWidth } from "@/lib/useSize";
import type { TypeScale } from "@/lib/useTypeScale";
import { localClustering, mulberry32 } from "./graph-core";
import Readouts from "./Readouts";
import { useSvgBase, type Tokens } from "./svgBits";

export type Ego = { attached: number[]; links: [number, number][] };

const HEIGHT = 300;
const fmt = (v: number) => v.toFixed(3);
const pairKey = (i: number, j: number) => (i < j ? `${i}|${j}` : `${j}|${i}`);
const press = (run: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    run();
  }
};

type State = { attached: boolean[]; links: Set<string> };

function stateOf(n: number, ego?: Ego): State {
  const attached = Array.from({ length: n }, (_, i) => ego?.attached.includes(i) ?? false);
  const links = new Set((ego?.links ?? []).filter(([i, j]) => i !== j && attached[i] && attached[j]).map(([i, j]) => pairKey(i, j)));
  return { attached, links };
}

const egoOf = (s: State): Ego => ({
  attached: s.attached.flatMap((a, i) => (a ? [i] : [])),
  links: [...s.links].map((k) => k.split("|").map(Number) as [number, number]),
});

function Plot({ focal, names, s, onNode, onPair, scale, tokens }: { focal: string; names: string[]; s: State; onNode: (i: number) => void; onPair: (i: number, j: number) => void; scale: TypeScale; tokens: Tokens }) {
  const svg = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(svg, 360);
  const t = tokens;
  const n = names.length;
  const cx = width / 2;
  const cy = HEIGHT / 2;
  const R = Math.max(40, Math.min(width, HEIGHT) / 2 - 30);
  const r = n > 12 ? 11 : 15;
  const at = (i: number) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  };
  const on = s.attached.flatMap((a, i) => (a ? [i] : []));
  const pairs: [number, number][] = [];
  for (let x = 0; x < on.length; x++) for (let y = x + 1; y < on.length; y++) pairs.push([on[x], on[y]]);
  const label = scale.fs(n > 12 ? "caption" : "small");
  return (
    <svg ref={svg} viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} role="group" aria-label={`${focal} and ${n} candidate neighbours; ${on.length} attached, ${s.links.size} links among them`}>
      {names.map((name, i) => {
        const [x, y] = at(i);
        return <line key={`s${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={s.attached[i] ? t["--w4-accent"] : t["--ink-mute"]} strokeWidth={s.attached[i] ? 2 : 1} strokeDasharray={s.attached[i] ? undefined : "3 4"} opacity={s.attached[i] ? 1 : 0.6} />;
      })}
      {pairs.map(([i, j]) => {
        const [x1, y1] = at(i);
        const [x2, y2] = at(j);
        const linked = s.links.has(pairKey(i, j));
        return (
          <g
            key={pairKey(i, j)}
            className="kit-ego-pair"
            role="button"
            tabIndex={0}
            aria-pressed={linked}
            aria-label={`${linked ? "Unlink" : "Link"} ${names[i]} and ${names[j]}`}
            onClick={() => onPair(i, j)}
            onKeyDown={press(() => onPair(i, j))}
          >
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={12} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={linked ? t["--access"] : t["--ink-mute"]} strokeWidth={linked ? 2.5 : 1.2} strokeDasharray={linked ? undefined : "4 4"} />
          </g>
        );
      })}
      {names.map((name, i) => {
        const [x, y] = at(i);
        const a = s.attached[i];
        return (
          <g
            key={`n${i}`}
            className="kit-ego-node"
            role="button"
            tabIndex={0}
            aria-pressed={a}
            aria-label={`${name}: ${a ? `attached to ${focal}; detach` : `not attached; attach to ${focal}`}`}
            onClick={() => onNode(i)}
            onKeyDown={press(() => onNode(i))}
          >
            <circle cx={x} cy={y} r={r} fill={t["--card"]} stroke={a ? t["--access"] : t["--ink-mute"]} strokeWidth={a ? 2.5 : 1.5} strokeDasharray={a ? undefined : "3 3"} />
            <text x={x} y={y + label * 0.35} fontSize={label} textAnchor="middle" fill={a ? t["--ink"] : t["--ink-mute-text"]} fontWeight={700}>
              {name}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r + 3} fill={t["--w4-accent"]} />
      <text x={cx} y={cy + label * 0.35} fontSize={label} textAnchor="middle" fill={t["--card"]} fontWeight={700}>
        {focal}
      </text>
    </svg>
  );
}

/** <EgoEditor focal="A" neighbours={["B", "C", "D", "E"]} initial={{ attached: [0, 1, 2], links: [[0, 1]] }} seed={3} /> */
export default function EgoEditor({ focal = "A", neighbours, initial, seed = 1, onChange }: { focal?: string; neighbours: string[]; initial?: Ego; seed?: number; onChange?: (ego: Ego) => void }) {
  const base = useSvgBase();
  const n = neighbours.length;
  const [s, setS] = useState<State>(() => stateOf(n, initial));
  const draws = useRef(0);
  const set = (next: State) => {
    setS(next);
    onChange?.(egoOf(next));
  };
  const onNode = (i: number) => {
    const attached = s.attached.map((a, x) => (x === i ? !a : a));
    // A detached neighbour takes its links with it: only links among neighbours count.
    const links = new Set([...s.links].filter((k) => !k.split("|").map(Number).includes(i) || attached[i]));
    set({ attached, links });
  };
  const onPair = (i: number, j: number) => {
    const links = new Set(s.links);
    if (!links.delete(pairKey(i, j))) links.add(pairKey(i, j));
    set({ attached: s.attached, links });
  };
  const all = Array.from({ length: n }, (_, i) => i);
  const star = () => set(stateOf(n, { attached: all, links: [] }));
  const clique = () => set(stateOf(n, { attached: all, links: all.flatMap((i) => all.filter((j) => j > i).map((j) => [i, j] as [number, number])) }));
  const random = () => {
    draws.current += 1;
    const rng = mulberry32(seed * 1009 + draws.current);
    const attached = all.filter(() => rng() < 0.7);
    const links = attached.flatMap((i) => attached.filter((j) => j > i && rng() < 0.4).map((j) => [i, j] as [number, number]));
    set(stateOf(n, { attached, links }));
  };

  if (n === 0) return <p className="kit-empty">No candidate neighbours for {focal}.</p>;
  const edges: [number, number][] = [...s.attached.flatMap((a, i) => (a ? [[0, i + 1] as [number, number]] : [])), ...[...s.links].map((key) => key.split("|").map((v) => Number(v) + 1) as [number, number])];
  const c = localClustering(n + 1, edges) as number[];
  const deg = new Array(n + 1).fill(0);
  for (const [a, b] of edges) {
    deg[a] += 1;
    deg[b] += 1;
  }
  const k = deg[0];
  const T = s.links.size;
  const pairs = (k * (k - 1)) / 2;
  const mean = c.reduce((x, y) => x + y, 0) / c.length;
  const names = [focal, ...neighbours];
  return (
    <div className="kit-ego">
      <div className="kit-controls">
        <button type="button" onClick={() => set(stateOf(n, initial))}>
          Reset
        </button>
        <button type="button" onClick={random}>
          Random neighbourhood
        </button>
        <button type="button" onClick={clique}>
          Make it a clique
        </button>
        <button type="button" onClick={star}>
          Make it a star
        </button>
      </div>
      <div className="kit-ego-body">
        <div className="kit-plot">{base ? <Plot focal={focal} names={neighbours} s={s} onNode={onNode} onPair={onPair} {...base} /> : null}</div>
        <div className="kit-ego-side">
          <p className="kit-ego-formula" aria-live="polite">
            <span>
              C<sub>{focal}</sub> = 2T / k(k − 1)
            </span>
            {k < 2 ? (
              <span> is undefined for k = {k}; it counts as 0</span>
            ) : (
              <>
                <span>
                  {" "}
                  = 2 × {T} / ({k} × {k - 1})
                </span>
                <span>
                  {" "}
                  = {2 * T} / {k * (k - 1)}
                </span>
                <b> = {fmt(c[0])}</b>
              </>
            )}
          </p>
          <p className="kit-note">The links among {focal}&apos;s neighbours, over the pairs of neighbours that could be linked.</p>
          <table className="kit-ego-table">
            <thead>
              <tr>
                <th scope="col">node</th>
                <th scope="col" className="num">
                  k
                </th>
                <th scope="col" className="num">
                  C
                </th>
              </tr>
            </thead>
            <tbody>
              {names.map((name, i) => (
                <tr key={i} className={i === 0 ? "kit-on" : undefined}>
                  <th scope="row">{name}</th>
                  <td className="num">{deg[i]}</td>
                  <td className="num">{deg[i] < 2 ? "0 (undefined)" : fmt(c[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Readouts
        items={[
          { label: `k, ${focal}'s degree`, value: k },
          { label: "Possible pairs", value: pairs },
          { label: "T, links among them", value: T },
          { label: `C of ${focal}`, value: k < 2 ? "0" : fmt(c[0]) },
          { label: `Mean C, all ${n + 1}`, value: fmt(mean) },
        ]}
      />
    </div>
  );
}
