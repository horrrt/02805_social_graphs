// Two vectors from the origin on shared 2D axes, the angle θ between them as
// an arc, and the cosine and angle as readouts: the picture behind cosine
// similarity. An optional slider scales B; its arrow grows, the cosine stays.
// The axes are fixed to the longest B the slider allows, so a longer B reads
// as longer. Drawn after hydration at its parent's width. Style: .kit-vec in
// post.css.
import { useId, useRef } from "react";
import { useFittedWidth } from "@/lib/useSize";
import { Arrow, useSvgBase, type Tokens } from "./svgBits";
import { useTextMeasure, type TypeScale } from "@/lib/useTypeScale";

export type Vec = [number, number];

const SCALE_MIN = 0.25;
const SCALE_MAX = 3;
const HEIGHT = 280;
const PAD = 28;
// Room either side for a label beside an arrow's tip.
const PADX = 72;

/** cos θ of two vectors; null when either has no length. */
export function cosine(a: Vec, b: Vec): number | null {
  const na = Math.hypot(a[0], a[1]);
  const nb = Math.hypot(b[0], b[1]);
  if (na === 0 || nb === 0) return null;
  return Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (na * nb)));
}

function Plot({ a, b, labels, reach, scale, tokens }: { a: Vec; b: Vec; labels: { a: string; b: string }; reach: Vec[]; scale: TypeScale; tokens: Tokens }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, 520);
  const measure = useTextMeasure();
  const xs = [0, ...reach.map((v) => v[0])];
  const ys = [0, ...reach.map((v) => v[1])];
  const [x0, x1] = [Math.min(...xs), Math.max(...xs, 1e-9)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys, 1e-9)];
  // One unit is as long across as up, or the angle on screen would lie.
  const unit = Math.min((width - 2 * PADX) / (x1 - x0 || 1), (HEIGHT - 2 * PAD) / (y1 - y0 || 1));
  const ox = PADX + (width - 2 * PADX - unit * (x1 - x0)) / 2 - unit * x0;
  const oy = HEIGHT - PAD - (HEIGHT - 2 * PAD - unit * (y1 - y0)) / 2 + unit * y0;
  const px = (v: Vec): Vec => [ox + v[0] * unit, oy - v[1] * unit];
  const t = tokens;
  const [ax, ay] = px(a);
  const [bx, by] = px(b);
  const cos = cosine(a, b);
  // The arc from A's direction to B's, the short way round, in screen angles.
  let arc = null;
  if (cos !== null) {
    const r = 34;
    const ta = Math.atan2(-a[1], a[0]);
    let tb = Math.atan2(-b[1], b[0]);
    if (tb - ta > Math.PI) tb -= 2 * Math.PI;
    if (ta - tb > Math.PI) tb += 2 * Math.PI;
    const sweep = tb > ta ? 1 : 0;
    const p1 = [ox + r * Math.cos(ta), oy + r * Math.sin(ta)];
    const p2 = [ox + r * Math.cos(tb), oy + r * Math.sin(tb)];
    const mid = (ta + tb) / 2;
    arc = (
      <g>
        <path d={`M ${p1[0]} ${p1[1]} A ${r} ${r} 0 0 ${sweep} ${p2[0]} ${p2[1]}`} fill="none" stroke={t["--w4-accent"]} strokeWidth={1.5} />
        <text x={ox + (r + 12) * Math.cos(mid)} y={oy + (r + 12) * Math.sin(mid)} fontSize={scale.fs("small")} fill={t["--w4-accent"]} fontStyle="italic" textAnchor="middle" dominantBaseline="middle">
          θ
        </text>
      </g>
    );
  }
  // A label beside its arrow's tip, outward, kept inside the chart.
  const end = (x: number, y: number, v: Vec, text: string) => {
    const w = measure ? measure(text, "small", 700) : 0;
    const want = v[0] >= 0 ? x + 8 : x - 8 - w;
    return { x: Math.max(2, Math.min(width - 2 - w, want)), anchor: "start" as const, y: y + (v[1] >= 0 ? -6 : 14) };
  };
  const la = end(ax, ay, a, labels.a);
  const lb = end(bx, by, b, labels.b);
  const aria = `Vectors ${labels.a} (${a.join(", ")}) and ${labels.b} (${b.map((v) => +v.toFixed(2)).join(", ")}) from the origin${cos === null ? "" : `, cosine ${cos.toFixed(3)}`}`;
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} role="img" aria-label={aria}>
      <line x1={PAD / 2} y1={oy} x2={width - PAD / 2} y2={oy} stroke={t["--ink-mute"]} strokeWidth={1} />
      <line x1={ox} y1={PAD / 2} x2={ox} y2={HEIGHT - PAD / 2} stroke={t["--ink-mute"]} strokeWidth={1} />
      {arc}
      <Arrow x1={ox} y1={oy} x2={ax} y2={ay} colour={t["--access"]} />
      <Arrow x1={ox} y1={oy} x2={bx} y2={by} colour={t["--people"]} />
      <circle cx={ox} cy={oy} r={3} fill={t["--ink"]} />
      <text x={la.x} y={la.y} fontSize={scale.fs("small")} fontWeight={700} fill={t["--access"]} textAnchor={la.anchor}>
        {labels.a}
      </text>
      <text x={lb.x} y={lb.y} fontSize={scale.fs("small")} fontWeight={700} fill={t["--people"]} textAnchor={lb.anchor}>
        {labels.b}
      </text>
    </svg>
  );
}

/** <VectorAngle a={[4, 1]} b={[1, 3]} labels={{ a: "D1", b: "D2" }} scaleB={k} onScaleB={setK} /> */
export default function VectorAngle({
  a,
  b,
  labels,
  scaleB = 1,
  onScaleB,
}: {
  a: Vec;
  b: Vec;
  labels: { a: string; b: string };
  scaleB?: number;
  onScaleB?: (k: number) => void;
}) {
  const base = useSvgBase();
  const id = useId();
  const bs: Vec = [b[0] * scaleB, b[1] * scaleB];
  const longest = onScaleB ? SCALE_MAX : scaleB;
  const reach: Vec[] = [a, [b[0] * longest, b[1] * longest]];
  const cos = cosine(a, bs);
  const angle = cos === null ? null : (Math.acos(cos) * 180) / Math.PI;
  return (
    <div className="kit-vec">
      {onScaleB ? (
        <div className="kit-controls">
          <label htmlFor={id}>Scale {labels.b}</label>
          <input id={id} type="range" min={SCALE_MIN} max={SCALE_MAX} step={0.25} value={String(scaleB)} onChange={(e) => onScaleB(Number(e.target.value))} />
          <output htmlFor={id}>{scaleB.toFixed(2)}×</output>
        </div>
      ) : null}
      <div className="kit-plot">{base ? <Plot a={a} b={bs} labels={labels} reach={reach} {...base} /> : null}</div>
      <dl className="kit-readouts">
        <div>
          <dt>cosine</dt>
          <dd>{cos === null ? "n/a" : cos.toFixed(3)}</dd>
        </div>
        <div>
          <dt>angle</dt>
          <dd>{angle === null ? "n/a" : `${angle.toFixed(1)}°`}</dd>
        </div>
        <div>
          <dt>length of {labels.b}</dt>
          <dd>{Math.hypot(bs[0], bs[1]).toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}
