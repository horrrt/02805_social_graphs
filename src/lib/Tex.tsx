// allow-html: KaTeX's rendering of a LaTeX string written in our own code, never user input.
// A formula typeset by KaTeX (vendored, public/assets/vendor/katex-0.19.0/;
// its stylesheet is imported by the page's layout). KaTeX turns LaTeX into
// HTML plus hidden MathML for screen readers. Until the script has loaded,
// and wherever it can't, the LaTeX shows as plain text.
//
// Explanations: tag a part of the LaTeX with \htmlClass{x-name}{...} and pass
// explain={{ name: "what it means" }}. Hovering the part lights it up and
// shows its explanation; the innermost tagged part wins.
import { type MouseEvent, useMemo, useState } from "react";
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

export function Tex({ tex, block = false, label, explain }: { tex: string; block?: boolean; label?: string; explain?: Record<string, string> }) {
  const katex = useVendor<Katex>("katex-0.19.0/katex.min.js", "katex");
  const html = useMemo(() => (katex.lib ? katex.lib.renderToString(tex, options(block)) : null), [katex.lib, tex, block]);
  const [tip, setTip] = useState<Tip | null>(null);
  const Tag = block ? "div" : "span";
  if (!html) return <Tag className="tex tex-pending" aria-label={label}>{tex}</Tag>;
  if (!explain) return <Tag className="tex" aria-label={label} dangerouslySetInnerHTML={{ __html: html }} />;

  const over = (e: MouseEvent<HTMLElement>) => {
    const part = (e.target as Element).closest?.('[class*="x-"]');
    const name = part ? [...part.classList].find((c) => c.startsWith("x-"))?.slice(2) : undefined;
    if (!part || !name || !explain[name]) return setTip(null);
    const box = e.currentTarget.getBoundingClientRect();
    const r = part.getBoundingClientRect();
    setTip({
      text: explain[name],
      x: r.left - box.left + r.width / 2,
      y: r.bottom - box.top + 8,
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
          <span className="tex-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
            {tip.text}
          </span>
        </>
      ) : null}
    </Tag>
  );
}
