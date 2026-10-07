// surface: draws trusted SVG markup from the site's own public/ data into a shadow root
// A drawing that comes as markup with its own stylesheet, such as the Cold Read
// game-over cards. React renders the host <span>; the markup and its <style> go
// into the host's shadow root, so the drawing's class names and keyframes stay
// inside it and never meet the page's CSS. A remount reuses the shadow root.
import { useEffect, useRef } from "react";

/** <ShadowArt css={…} html={…} />: html is trusted markup from public/, never user input. */
export function ShadowArt({ css, html, className }: { css: string; html: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${css}</style>${html}`;
  }, [css, html]);
  return <span ref={ref} className={className} aria-hidden="true" />;
}
