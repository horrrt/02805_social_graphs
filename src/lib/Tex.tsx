// allow-html: KaTeX's rendering of a LaTeX string written in our own code, never user input.
// A formula typeset by KaTeX (vendored, public/assets/vendor/katex-0.19.0/;
// its stylesheet is imported by the page's layout). KaTeX turns LaTeX into
// HTML plus hidden MathML for screen readers. Until the script has loaded,
// and wherever it can't, the LaTeX shows as plain text.
//
// Explanations: tag a part of the LaTeX with \htmlClass{x-name}{...} and pass
// explain={{ name: "what it means" }}. Hovering the part lights it up and
// shows its explanation; the innermost tagged part wins. The explanation
// renders into <body> and stays inside the window, so a part near the edge of
// a clipped panel still shows all of it.
import { type MouseEvent, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useVendor } from "@/lib/useVendor";

type Katex = { renderToString: (tex: string, options: Record<string, unknown>) => string };
type Tip = { text: string; x: number; y: number; box: { left: number; top: number; width: number; height: number } };

const options = (block: boolean) => ({
  displayMode: block,
  output: "htmlAndMathml",
  throwOnError: false,
  // Only our own class tags are trusted, for the explanations.
  trust: (context: { command: string }) => context.command === "\\htmlClass",
  strict: false,
});

/** The box around a part and everything in it. KaTeX draws a fraction's
 * numerator and denominator outside its wrapper's box, so the wrapper alone
 * is too short. */
function bounds(el: Element) {
  let { left, top, right, bottom } = el.getBoundingClientRect();
  for (const child of el.querySelectorAll("*")) {
    const r = child.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return { left, top, bottom, width: right - left, height: bottom - top };
}

export function Tex({ tex, block = false, label, explain }: { tex: string; block?: boolean; label?: string; explain?: Record<string, string> }) {
  const katex = useVendor<Katex>("katex-0.19.0/katex.min.js", "katex");
  const html = useMemo(() => (katex.lib ? katex.lib.renderToString(tex, options(block)) : null), [katex.lib, tex, block]);
  const [tip, setTip] = useState<Tip | null>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  // Centre the explanation under the part, then pull it back inside the window.
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el || !tip) return;
    const gap = 8;
    const w = el.offsetWidth;
    el.style.left = `${Math.min(Math.max(tip.x - w / 2, gap), window.innerWidth - w - gap)}px`;
    el.style.top = `${tip.y}px`;
    // The tip is pinned to the window, so a scroll would leave it behind.
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, { capture: true, passive: true, once: true });
    return () => window.removeEventListener("scroll", hide, { capture: true });
  }, [tip]);
  const Tag = block ? "div" : "span";
  if (!html) return <Tag className="tex tex-pending" aria-label={label}>{tex}</Tag>;
  if (!explain) return <Tag className="tex" aria-label={label} dangerouslySetInnerHTML={{ __html: html }} />;

  const over = (e: MouseEvent<HTMLElement>) => {
    const part = (e.target as Element).closest?.('[class*="x-"]');
    const name = part ? [...part.classList].find((c) => c.startsWith("x-"))?.slice(2) : undefined;
    if (!part || !name || !explain[name]) return setTip(null);
    const box = e.currentTarget.getBoundingClientRect();
    const r = bounds(part);
    setTip({
      text: explain[name],
      x: r.left + r.width / 2,
      y: r.bottom + 8,
      box: { left: r.left - box.left - 2, top: r.top - box.top - 1, width: r.width + 4, height: r.height + 2 },
    });
  };

  return (
    <Tag className="tex tex-explain" aria-label={label} onMouseOver={over} onMouseLeave={() => setTip(null)}>
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {tip ? (
        <>
          {/* Only the part under the pointer lights up, not every part that contains it. */}
          <span className="tex-mark" aria-hidden="true" style={tip.box} />
          {createPortal(
            <span ref={tipRef} className="tex-tip" role="tooltip">
              {tip.text}
            </span>,
            document.body,
          )}
        </>
      ) : null}
    </Tag>
  );
}
