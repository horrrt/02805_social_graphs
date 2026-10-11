// One big number in the hero, with what it counts.
import type { ReactNode } from "react";

export function HeroStat({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <p className="w4-stat">
      <b>{value}</b>
      <span>{label}</span>
    </p>
  );
}
