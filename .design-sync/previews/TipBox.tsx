import { useLayoutEffect, useRef, useState } from "react";
import { TipBox } from "log-log-legends-kit";

type Tip = { lines: string[]; x: number; y: number };

// A tooltip lives inside its chart host (class kit-tip-host). Shown here
// pinned near the host's top left, as a hover would place it.
function Host({ lines }: { lines: string[] }) {
  const host = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  useLayoutEffect(() => {
    const box = host.current?.getBoundingClientRect();
    if (box) setTip({ lines, x: box.left + 120, y: box.top + 30 });
  }, [lines]);
  return (
    <div className="kit-tip-host" ref={host} style={{ position: "relative", height: 140, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8 }}>
      <TipBox host={host} tip={tip} />
    </div>
  );
}

const PAGE = ["Thor (Marvel Comics)", "Degree 41 · community Avengers"];
const RESULT = ["Enemy links across communities", "0.62 against a baseline of 0.41 ± 0.03", "1,000 shuffles"];

export const TwoLines = () => <Host lines={PAGE} />;
export const ThreeLines = () => <Host lines={RESULT} />;
