// The findings under the hero: a heading with the key to the mini charts, then
// one FindingRow per section as children. The page keeps the div.shell around it.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

type Props = {
  id: string;
  label: string;
  caps: ReactNode;
  real: ReactNode;
  band?: ReactNode;
  children: ReactNode;
};

export function FindingsStrip({ id, label, caps, real, band = "random baseline, mean ± 1 sd", children }: Props) {
  return el(
    "section",
    { "aria-label": label, className: "w4-findings", id },
    <div className="w4-findings-head">
      <p className="w4-caps">{caps}</p>
      <div className="w4-key">
        <span>
          <i className="w4-key-real"></i>
          {real}
        </span>
        <span>
          <i className="w4-key-band"></i>
          {band}
        </span>
      </div>
    </div>,
    children,
  );
}
