"""Copies of three pages that draw fully in a hidden browser tab, for capturing
canvas boards: python review/week04-redesign/generator/capture/make_capture.py

A hidden tab runs no animation frames and delivers no resize observations, so
fitted() charts would stay at their fallback width. Each copy gets a <base> so
its relative paths still resolve, and a classic script, before anything else,
that runs both through timers."""
import shutil
from pathlib import Path

POLYFILL = """<script>
window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
window.ResizeObserver = class {
  constructor(cb) { this.cb = cb; }
  observe(el) { setTimeout(() => this.cb([{ target: el, contentRect: el.getBoundingClientRect() }], this), 60); }
  unobserve() {}
  disconnect() {}
};
</script>"""
PAGES = {
    "week05": ("out/weeks/week05/index.html", "/weeks/week05/"),
    "template": ("out/weeks/_template/index.html", "/weeks/_template/"),
    "kit": ("out/styleguide/kit/index.html", "/styleguide/"),
}
out = Path("public/_snap")
out.mkdir(exist_ok=True)
shutil.copy(Path(__file__).with_name("capture.js"), out / "capture.js")
for name, (src, base) in PAGES.items():
    html = Path(src).read_text()
    html = html.replace("<head>", f'<head>\n    <base href="{base}" />\n    {POLYFILL}', 1)
    # The styleguide loads its data relative to location.href, which the copy moves.
    html = html.replace('new URL("data/graphs.json?v=1", location.href)', 'new URL("data/graphs.json?v=1", document.baseURI)')
    (out / f"{name}.html").write_text(html)
    print("wrote", out / f"{name}.html")
