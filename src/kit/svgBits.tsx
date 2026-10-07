// Small pieces the kit's hand-drawn SVG charts share (VectorAngle, SweepCurve,
// AnalogyPlot): the type scale and colour tokens read once hydrated, a token
// or plain colour resolved for a mark or a style, and an arrow drawn as a line
// with its own head, so no <marker> id has to be unique on the page.
import { useHydrated } from "@/lib/useHydrated";
import { useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";

export type Tokens = Record<string, string>;

/** The tokens every kit SVG chart reads. */
export const SVG_TOKENS = ["--ink", "--ink-soft", "--ink-mute", "--ink-mute-text", "--line", "--line-soft", "--card", "--access", "--people", "--w4-accent", "--w4-grid"];

/** The type scale and tokens, or null before hydration (the server renders nothing). */
export function useSvgBase(extra: readonly string[] = []): { scale: TypeScale; tokens: Tokens } | null {
  const hydrated = useHydrated();
  const scale = useTypeScale();
  const tokens = useTokens([...SVG_TOKENS, ...extra]);
  return hydrated && scale && tokens ? { scale, tokens } : null;
}

/** A colour for an SVG attribute: "--name" read from the tokens, anything else as given. */
export const markColour = (c: string, tokens: Tokens) => (c.startsWith("--") ? tokens[c] ?? "" : c);

/** A colour for a style: "--name" as var(--name), anything else as given. */
export const cssColour = (c: string) => (c.startsWith("--") ? `var(${c})` : c);

/** A line from (x1, y1) to (x2, y2) ending in a filled head; nothing when the two ends meet. */
export function Arrow({ x1, y1, x2, y2, colour, width = 2.5, dash }: { x1: number; y1: number; x2: number; y2: number; colour: string; width?: number; dash?: string }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const head = Math.min(11, len * 0.6);
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const half = head * 0.45;
  const points = `${x2},${y2} ${bx - uy * half},${by + ux * half} ${bx + uy * half},${by - ux * half}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={colour} strokeWidth={width} strokeDasharray={dash} />
      <polygon points={points} fill={colour} />
    </g>
  );
}
