// Semantic Minefield's icons: one per category, plus the flag and the
// result marks. Plain 24-unit SVG in currentColor, so a chip or a tile
// colours them with its category's colour.
import type { CatId } from "./characters";

/** A gear's outline: `teeth` teeth around a ring, as one path. */
function gear(teeth: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const r = i % 4 < 2 ? outer : inner;
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z`;
}

const FILLED: Partial<Record<CatId, string>> = {
  hero: "M12 2l8 3v6c0 5.1-3.4 9.5-8 11-4.6-1.5-8-5.9-8-11V5l8-3zm0 4.2l-1.4 3.1-3.3.3 2.5 2.2-.8 3.3 3-1.8 3 1.8-.8-3.3 2.5-2.2-3.3-.3L12 6.2z",
  villain:
    "M12 2a8 8 0 0 0-8 8c0 2.6 1.2 4.6 3 5.8V19a1 1 0 0 0 1 1h1v2h2v-2h2v2h2v-2h1a1 1 0 0 0 1-1v-3.2c1.8-1.2 3-3.2 3-5.8a8 8 0 0 0-8-8zM9 9.2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 4.6l-1.2 2.2h2.4L12 13.8z",
  avenger: "M12 2.5L3.5 21.5h3.6l1.7-4.1h6.4l1.7 4.1h3.6L12 2.5zm-2 11.8L12 9l2 5.3h-4z",
  xmen: "M4.5 3h4.2L12 8.4 15.3 3h4.2l-5.2 8.8L20 21h-4.2L12 15 8.2 21H4l5.7-9.2L4.5 3z",
  magic: "M12 1.5l2.4 8.1 8.1 2.4-8.1 2.4-2.4 8.1-2.4-8.1L1.5 12l8.1-2.4L12 1.5z",
  tech: gear(8, 9.5, 7),
  alien:
    "M12 2C7.2 2 4 5.4 4 10c0 5 4.4 9.8 8 12 3.6-2.2 8-7 8-12 0-4.6-3.2-8-8-8zm-5 8.3c1.9-.3 3.6.9 4.1 2.8-1.9.3-3.6-.9-4.1-2.8zm10 0c-.5 1.9-2.2 3.1-4.1 2.8.5-1.9 2.2-3.1 4.1-2.8z",
};

/** The category's icon. */
export function CatIcon({ cat }: { cat: CatId }) {
  if (cat === "mutant")
    return (
      <svg className="sm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M7 2c0 5 10 5 10 10S7 17 7 22M17 2c0 5-10 5-10 10s10 5 10 10M9 5.5h6M9 18.5h6M10.2 12h3.6" />
      </svg>
    );
  if (cat === "ai")
    return (
      <svg className="sm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4M10 10h4v4h-4z" />
      </svg>
    );
  return (
    <svg className="sm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" fillRule="evenodd">
      <path d={FILLED[cat]} />
    </svg>
  );
}

export const FlagIcon = () => (
  <svg className="sm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M5 2h2v20H5zM8 3h11l-3 4.5L19 12H8z" />
  </svg>
);

export const CheckIcon = () => (
  <svg className="sm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const CrossIcon = () => (
  <svg className="sm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const TargetIcon = () => (
  <svg className="sm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>
);
