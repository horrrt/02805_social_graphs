// Word-vector arithmetic in three steps, for the analogy "c − a + b ≈ d"
// (king − man + woman ≈ queen with a = man, b = woman, c = king, d = queen):
// step 0 places the four words; step 1 draws the offset a→b and the same
// offset from c; step 2 marks where c + (b − a) lands and its nearest real
// word d. The expression above the plot is built from the labels and shows
// "?" for d until step 2. Drawn after hydration at its parent's width.
// Style: .kit-analogy in post.css.
import { useRef } from "react";
import { useFittedWidth } from "@/lib/useSize";
import { useTextMeasure, type TypeScale } from "@/lib/useTypeScale";
import { Arrow, useSvgBase, type Tokens } from "./svgBits";

export type Word = { label: string; x: number; y: number };
export type AnalogyPoints = { a: Word; b: Word; c: Word; d: Word };

const HEIGHT = 260;
const PAD = 36;

function Plot({ points, step, scale, tokens }: { points: AnalogyPoints; step: 0 | 1 | 2; scale: TypeScale; tokens: Tokens }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, 480);
  const measure = useTextMeasure();
  // The x of a label of `text` left-aligned at `want`, kept inside the chart.
  const inside = (want: number, text: string, role: string) => Math.max(2, Math.min(width - 2 - (measure ? measure(text, role, 600) : 0), want));
  const { a, b, c, d } = points;
  const r = { label: `${c.label} − ${a.label} + ${b.label}`, x: c.x + b.x - a.x, y: c.y + b.y - a.y };
  const all = [a, b, c, d, r];
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  // Labels sit right of their dot, so the right margin is wider.
  const sx = (x: number) => PAD + ((x - x0) / (x1 - x0 || 1)) * (width - PAD - 90);
  const sy = (y: number) => HEIGHT - PAD - ((y - y0) / (y1 - y0 || 1)) * (HEIGHT - 2 * PAD);
  const t = tokens;
  const small = scale.fs("small");
  const dot = (p: Word, colour: string, key: string, bold = false) => (
    <g key={key}>
      <circle cx={sx(p.x)} cy={sy(p.y)} r={5} fill={colour} />
      <text x={inside(sx(p.x) + 9, p.label, "small")} y={sy(p.y) + 4} fontSize={small} fontWeight={bold ? 700 : 600} fill={colour}>
        {p.label}
      </text>
    </g>
  );
  const shift = { x: sx(r.x) - sx(c.x), y: sy(r.y) - sy(c.y) };
  const aria =
    step === 0
      ? `Four words in a toy 2D space: ${a.label}, ${b.label}, ${c.label}, ${d.label}`
      : step === 1
        ? `The offset from ${a.label} to ${b.label}, drawn again from ${c.label}`
        : `${r.label} lands nearest ${d.label}`;
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} role="img" aria-label={aria}>
      <line x1={PAD / 2} y1={HEIGHT - PAD / 2} x2={width - PAD / 2} y2={HEIGHT - PAD / 2} stroke={t["--line"]} strokeWidth={1} />
      <line x1={PAD / 2} y1={PAD / 2} x2={PAD / 2} y2={HEIGHT - PAD / 2} stroke={t["--line"]} strokeWidth={1} />
      {step >= 1 ? (
        <g>
          <Arrow x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)} colour={t["--w4-accent"]} width={2} />
          <Arrow x1={sx(c.x)} y1={sy(c.y)} x2={sx(c.x) + shift.x} y2={sy(c.y) + shift.y} colour={t["--w4-accent"]} width={2} dash="5 4" />
        </g>
      ) : null}
      {step === 2 ? (
        <g>
          <line x1={sx(r.x)} y1={sy(r.y)} x2={sx(d.x)} y2={sy(d.y)} stroke={t["--ink-mute"]} strokeWidth={1.2} strokeDasharray="2 3" />
          <circle cx={sx(r.x)} cy={sy(r.y)} r={8} fill="none" stroke={t["--people"]} strokeWidth={2} />
          <circle cx={sx(d.x)} cy={sy(d.y)} r={10} fill="none" stroke={t["--people"]} strokeWidth={1.5} />
          <text x={inside(sx(r.x) - 12, r.label, "caption")} y={sy(r.y) + 24} fontSize={scale.fs("caption")} fill={t["--ink-mute-text"]}>
            {r.label}
          </text>
        </g>
      ) : null}
      {dot(a, t["--access"], "a")}
      {dot(b, t["--access"], "b")}
      {dot(c, t["--ink"], "c")}
      {dot(d, step === 2 ? t["--people"] : t["--ink"], "d", step === 2)}
    </svg>
  );
}

/** <AnalogyPlot points={{ a: man, b: woman, c: king, d: queen }} step={2} /> */
export default function AnalogyPlot({ points, step }: { points: AnalogyPoints; step: 0 | 1 | 2 }) {
  const base = useSvgBase();
  const { a, b, c, d } = points;
  return (
    <figure className="kit-analogy">
      <p className="kit-analogy-expr">
        <b>{c.label}</b> − <b>{a.label}</b> + <b>{b.label}</b> ≈ <b className={step === 2 ? "kit-analogy-hit" : undefined}>{step === 2 ? d.label : "?"}</b>
      </p>
      <div className="kit-plot">{base ? <Plot points={points} step={step} {...base} /> : null}</div>
    </figure>
  );
}
