// Signed contributions, one bar per item from a zero line in the middle:
// negative to the left in --bad, positive to the right in --good, all on one
// scale. Under them a gauge for the total between two named ends: the plain
// sum, or with total.mode "sigmoid" the sum plus a bias through the logistic
// function, read as a probability from 0 to 1. Plain HTML, so it renders on
// the server. Style: .kit-contrib in post.css.
import type { ReactNode } from "react";
import { sigmoid } from "./text-core.js";

export type Contribution = { key: string; label: ReactNode; value: number; valueLabel?: ReactNode };
export type ContributionTotal = { mode: "sum" | "sigmoid"; bias?: number; label?: ReactNode };

const signed = (v: number, digits = 2) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(digits)}`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** <ContributionBars items={[{ key: "good", label: "good", value: 1.25 }]} total={{ mode: "sigmoid", bias: -0.1 }} ends={["negative", "positive"]} /> */
export default function ContributionBars({
  items,
  total = { mode: "sum" },
  ends = ["negative", "positive"],
  max,
  fmt = (v: number) => signed(v),
}: {
  items: Contribution[];
  total?: ContributionTotal;
  ends?: [ReactNode, ReactNode];
  max?: number;
  fmt?: (v: number) => string;
}) {
  const values = items.map((it) => (Number.isFinite(it.value) ? it.value : 0));
  const sum = values.reduce((s, v) => s + v, 0);
  const top = max ?? Math.max(0, ...values.map(Math.abs));
  const half = (v: number) => `${top > 0 ? Math.min(1, Math.abs(v) / top) * 50 : 0}%`;
  const bias = total.mode === "sigmoid" ? total.bias ?? 0 : 0;
  const z = sum + bias;
  const p = sigmoid(z);
  // The gauge: a probability on 0..1, or the sum on a scale half as wide again as it and every bar.
  const reach = Math.max(1e-9, Math.abs(sum), top) * 1.5;
  const at = total.mode === "sigmoid" ? p : clamp01(0.5 + sum / (2 * reach));
  const lean = total.mode === "sigmoid" ? (p > 0.5 ? 1 : p < 0.5 ? 0 : null) : sum > 0 ? 1 : sum < 0 ? 0 : null;
  const readout =
    total.mode === "sigmoid"
      ? `Σ ${fmt(sum)}${Math.abs(bias) >= 0.005 ? ` + bias ${fmt(bias)}` : ""} = z ${fmt(z)} → p ${p.toFixed(3)}`
      : `Σ ${fmt(sum)}`;
  return (
    <div className="kit-contrib">
      {items.length === 0 ? (
        <p className="kit-empty">No contributions.</p>
      ) : (
        <ol aria-label="Contribution of each item">
          {items.map((it, i) => {
            const v = values[i];
            return (
              <li key={it.key}>
                <span className="kit-contrib-label">{it.label}</span>
                <span className="kit-contrib-track" aria-hidden="true">
                  <span className="kit-contrib-zero" />
                  {v !== 0 ? <span className={v > 0 ? "kit-contrib-pos" : "kit-contrib-neg"} style={{ width: half(v) }} /> : null}
                </span>
                <span className="kit-num">{it.valueLabel ?? fmt(v)}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="kit-contrib-total">
        <p className="kit-contrib-readout">
          {total.label ? <b>{total.label} </b> : null}
          <code>{readout}</code>
        </p>
        <div
          className="kit-contrib-gauge"
          role="meter"
          aria-label={total.mode === "sigmoid" ? "Probability" : "Total"}
          aria-valuemin={total.mode === "sigmoid" ? 0 : -reach}
          aria-valuemax={total.mode === "sigmoid" ? 1 : reach}
          aria-valuenow={total.mode === "sigmoid" ? +p.toFixed(3) : +sum.toFixed(3)}
          aria-valuetext={readout}
        >
          <span className="kit-contrib-mid" />
          <span className={`kit-contrib-mark${lean === 1 ? " kit-contrib-pos" : lean === 0 ? " kit-contrib-neg" : ""}`} style={{ left: `${at * 100}%` }} />
        </div>
        <p className="kit-contrib-ends">
          <span>{ends[0]}</span>
          <span>{total.mode === "sigmoid" ? "0.5" : "0"}</span>
          <span>{ends[1]}</span>
        </p>
      </div>
    </div>
  );
}
