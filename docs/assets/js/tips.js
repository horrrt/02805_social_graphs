// Chart tooltips that show at once, in the page's style, instead of the
// browser's slow native ones. Style: .kit-tip in post.css (the maps' tooltip).
//
//   tipBox(host)     a tooltip inside host: show(lines, clientX, clientY), hide()
//   hoverTips(host)  every SVG mark in host with a <title> shows it as a tooltip
//                    and is highlighted while the pointer is on it; charts drawn
//                    into host later, or redrawn at a new width, are picked up

/** A tooltip positioned inside host. The first line is bold. */
export function tipBox(host) {
  host.classList.add("kit-tip-host");
  const tip = document.createElement("div");
  tip.className = "kit-tip";
  tip.hidden = true;
  host.append(tip);
  return {
    show(lines, x, y) {
      // A chart that redraws by emptying host takes the tooltip with it.
      if (!tip.isConnected) host.append(tip);
      tip.replaceChildren(...lines.map((t, i) => Object.assign(document.createElement(i ? "span" : "b"), { textContent: t })));
      const box = host.getBoundingClientRect();
      tip.hidden = false;
      const w = tip.offsetWidth;
      tip.style.left = `${Math.max(0, Math.min(x - box.left + 14, box.width - w))}px`;
      tip.style.top = `${y - box.top + 14}px`;
    },
    hide() {
      tip.hidden = true;
    },
  };
}

/** Turn the <title> of every SVG mark in host into a tooltip and a highlight. */
export function hoverTips(host) {
  const box = tipBox(host);
  let hot = null;
  const convert = () => {
    for (const t of host.querySelectorAll("svg title")) {
      const el = t.parentElement;
      el.dataset.tip = t.textContent;
      el.setAttribute("aria-label", t.textContent);
      t.remove();
    }
  };
  convert();
  new MutationObserver(convert).observe(host, { childList: true, subtree: true });
  const cool = () => {
    hot?.classList.remove("kit-hot");
    hot = null;
    box.hide();
  };
  host.addEventListener("pointerover", (e) => {
    const el = e.target.closest?.("[data-tip]");
    if (!el || !host.contains(el)) return;
    if (el !== hot) {
      hot?.classList.remove("kit-hot");
      hot = el;
      el.classList.add("kit-hot");
    }
    box.show(el.dataset.tip.split("\n"), e.clientX, e.clientY);
  });
  host.addEventListener("pointermove", (e) => {
    if (hot) box.show(hot.dataset.tip.split("\n"), e.clientX, e.clientY);
  });
  host.addEventListener("pointerout", (e) => {
    if (hot && !hot.contains(e.relatedTarget)) cool();
  });
  host.addEventListener("pointerleave", cool);
}
