// The debriefs' formulas as MathML, which every current browser typesets
// natively: real fraction bars, no library, nothing to load.
import type { HTMLAttributes, ReactNode } from "react";

// React's types list no MathML elements yet; these are the ones used here.
type MathProps = HTMLAttributes<HTMLElement> & { display?: "block" | "inline"; width?: string };
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      math: MathProps;
      mrow: MathProps;
      mi: MathProps;
      mo: MathProps;
      mn: MathProps;
      mtext: MathProps;
      mfrac: MathProps;
      msub: MathProps;
      mspace: MathProps;
    }
  }
}

const Paren = ({ children }: { children: ReactNode }) => (
  <>
    <mo>(</mo>
    {children}
    <mo>)</mo>
  </>
);

/** tf-idf(t, d) = count(t, d) / |d| × ln(N / df(t)) */
export function TfIdfFormula() {
  return (
    <math display="block" className="cr-math" aria-label="tf-idf of t in d equals count of t in d over the length of d, times the natural log of N over df of t">
      <mrow>
        <mtext>tf-idf</mtext>
        <Paren>
          <mi>t</mi>
          <mo>,</mo>
          <mi>d</mi>
        </Paren>
        <mo>=</mo>
        <mfrac>
          <mrow>
            <mtext>count</mtext>
            <Paren>
              <mi>t</mi>
              <mo>,</mo>
              <mi>d</mi>
            </Paren>
          </mrow>
          <mrow>
            <mo>|</mo>
            <mi>d</mi>
            <mo>|</mo>
          </mrow>
        </mfrac>
        <mo>×</mo>
        <mi>ln</mi>
        <Paren>
          <mfrac>
            <mi>N</mi>
            <mrow>
              <mtext>df</mtext>
              <Paren>
                <mi>t</mi>
              </Paren>
            </mrow>
          </mfrac>
        </Paren>
      </mrow>
    </math>
  );
}

/** idf = ln(N / df) = value, inline in a sentence. */
export function IdfInline({ n, df, value }: { n: number; df: number; value: string }) {
  return (
    <math className="cr-math-inline" aria-label={`idf equals the natural log of ${n} over ${df}, ${value}`}>
      <mtext>idf</mtext>
      <mo>=</mo>
      <mi>ln</mi>
      <mfrac>
        <mn>{n}</mn>
        <mn>{df}</mn>
      </mfrac>
      <mo>=</mo>
      <mn>{value}</mn>
    </math>
  );
}

/** cos(a, b) = a · b / (‖a‖ ‖b‖) */
export function CosineFormula() {
  return (
    <math display="block" className="cr-math" aria-label="cosine of a and b equals a dot b over the norm of a times the norm of b">
      <mrow>
        <mi>cos</mi>
        <Paren>
          <mi>a</mi>
          <mo>,</mo>
          <mi>b</mi>
        </Paren>
        <mo>=</mo>
        <mfrac>
          <mrow>
            <mi>a</mi>
            <mo>·</mo>
            <mi>b</mi>
          </mrow>
          <mrow>
            <mo>‖</mo>
            <mi>a</mi>
            <mo>‖</mo>
            <mspace width="0.2em" />
            <mo>‖</mo>
            <mi>b</mi>
            <mo>‖</mo>
          </mrow>
        </mfrac>
      </mrow>
    </math>
  );
}

/** PPMI(w, c) = max(log₂ P(w, c) / (P(w) P(c)), 0) */
export function PpmiFormula() {
  const P = ({ children }: { children: ReactNode }) => (
    <>
      <mi>P</mi>
      <Paren>{children}</Paren>
    </>
  );
  return (
    <math display="block" className="cr-math" aria-label="PPMI of w and c equals the maximum of log base 2 of P of w and c over P of w times P of c, and zero">
      <mrow>
        <mtext>PPMI</mtext>
        <Paren>
          <mi>w</mi>
          <mo>,</mo>
          <mi>c</mi>
        </Paren>
        <mo>=</mo>
        <mi>max</mi>
        <Paren>
          <msub>
            <mi>log</mi>
            <mn>2</mn>
          </msub>
          <mfrac>
            <mrow>
              <P>
                <mi>w</mi>
                <mo>,</mo>
                <mi>c</mi>
              </P>
            </mrow>
            <mrow>
              <P>
                <mi>w</mi>
              </P>
              <P>
                <mi>c</mi>
              </P>
            </mrow>
          </mfrac>
          <mo>,</mo>
          <mn>0</mn>
        </Paren>
      </mrow>
    </math>
  );
}
