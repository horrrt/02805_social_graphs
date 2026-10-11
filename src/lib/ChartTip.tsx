// allow-html: painter tooltip strings
// The tooltip every corridor chart shares (corridor.js tip(), showTip(),
// hideTip()): one div.chart-tip, appended to <body> on the first show and
// kept, its hidden attribute toggled. Painters build its contents as HTML
// strings from the page's own data. Charts call showTip and hideTip; one
// mounted <ChartTip /> renders the div, however many islands mount one.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createStore } from "@/scripts/runtime/store.js";
import { useStore, type Store } from "./useStore";

export type TipState = { html: string; x: number; y: number; shown: boolean; created: boolean };

export const tipStore: Store<TipState> = createStore({ html: "", x: 0, y: 0, shown: false, created: false });

/** Show the tooltip with this HTML beside the pointer. */
export function showTip(event: { clientX: number; clientY: number }, html: string) {
  tipStore.setState({ html, x: event.clientX, y: event.clientY, shown: true, created: true });
}

/** Hide the tooltip; it stays in <body> for the next show. */
export function hideTip() {
  if (tipStore.getState().created) tipStore.setState({ shown: false });
}

// Which mounted ChartTip renders the div: the first to mount. When the host
// unmounts (its island failed, its panel closed), every mounted ChartTip sees
// the slot free and the first to commit claims it, so the div stays in <body>
// while any ChartTip is mounted.
const hostStore: Store<{ host: object | null }> = createStore({ host: null });
const all = (s: TipState) => s;
const vacant = (s: { host: object | null }) => s.host === null;

export function ChartTip() {
  const [me] = useState(() => ({}));
  const free = useStore(hostStore, vacant);
  useEffect(() => {
    if (!hostStore.getState().host) hostStore.setState({ host: me });
  }, [me, free]);
  useEffect(
    () => () => {
      if (hostStore.getState().host === me) hostStore.setState({ host: null });
    },
    [me],
  );
  const isHost = useStore(hostStore, (s) => s.host === me);
  const { html, x, y, shown, created } = useStore(tipStore, all);
  const ref = useRef<HTMLDivElement>(null);

  // corridor.js showTip(): 14px right of the pointer and above it, kept 8px
  // inside the window's right and top edges.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !shown) return;
    const pad = 14;
    const width = el.offsetWidth;
    const left = Math.min(x + pad, window.innerWidth - width - 8);
    const top = Math.max(y - el.offsetHeight - pad, 8);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [html, x, y, shown, isHost]);

  if (!isHost || !created) return null;
  return createPortal(<div ref={ref} className="chart-tip" hidden={!shown} dangerouslySetInnerHTML={{ __html: html }} />, document.body);
}
