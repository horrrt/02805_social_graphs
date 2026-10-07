// allow-html: KaTeX's rendering of a LaTeX string written in our own code, never user input.
// A formula typeset by KaTeX (vendored, public/assets/vendor/katex-0.19.0/;
// its stylesheet is imported by the page's layout). KaTeX turns LaTeX into
// HTML plus hidden MathML for screen readers. Until the script has loaded,
// and wherever it can't, the LaTeX shows as plain text.
import { useMemo } from "react";
import { useVendor } from "@/lib/useVendor";

type Katex = { renderToString: (tex: string, options: Record<string, unknown>) => string };

export function Tex({ tex, block = false, label }: { tex: string; block?: boolean; label?: string }) {
  const katex = useVendor<Katex>("katex-0.19.0/katex.min.js", "katex");
  const html = useMemo(
    () => (katex.lib ? katex.lib.renderToString(tex, { displayMode: block, output: "htmlAndMathml", throwOnError: false }) : null),
    [katex.lib, tex, block],
  );
  const Tag = block ? "div" : "span";
  if (!html) return <Tag className="tex tex-pending" aria-label={label}>{tex}</Tag>;
  return <Tag className="tex" aria-label={label} dangerouslySetInnerHTML={{ __html: html }} />;
}
