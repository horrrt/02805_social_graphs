// The page's series colours, in order, as kit.js palette() reads them: pass
// the values useTokens(PALETTE) read from <body>. Pure, so a component can
// call it in render once the tokens are read.

/** The tokens behind the series colours, in order. */
export const PALETTE = ["--access", "--people", "--ink-soft", "--ink-mute", "--dtu"];

/** palette(useTokens(PALETTE)) -> the five colours; null before the tokens are read. */
export function palette(tokens: Record<string, string> | null): string[] | null {
  return tokens ? PALETTE.map((name) => tokens[name] ?? "") : null;
}
