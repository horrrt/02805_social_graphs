// A chart host with instant tooltips, as tips.js hoverTips() leaves it. The
// host gains the kit-tip-host class and its own TipBox; every mark a kit
// chart draws inside it carries data-tip and aria-label instead of a <title>;
// the mark under the pointer gets kit-hot, and a mark that was hot keeps an
// empty class, as classList.remove leaves it.
//
// Where the tip div sits follows main's history (KB07). hoverTips appends it
// to the host when it runs, so a chart drawn later lands after it ("first").
// A redraw that empties the host takes it out ("none"), and the next hover
// puts it back as the host's last child ("last"). Pass tip="none" for a host
// whose first draw empties it, and change `redraws` on every later redraw that
// replaces the host's content: the content is drawn anew and the tip leaves.
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import TipBox, { type Tip } from "./TipBox";
import { useOwnedRef } from "@/lib/useOwnedRef";

type Marks = { hot: Element | null; cooled: WeakSet<Element> };

const TipMarks = createContext<Marks | null>(null);

// classList.add: the class appended once to what the element had.
const withClass = (base: string | undefined, extra: string) => {
  const now = base ? base.split(" ").filter(Boolean) : [];
  return (now.includes(extra) ? now : [...now, extra]).join(" ");
};

/**
 * One chart mark with a tooltip: <Tipped tag="circle" tip="…" cx={…} … />.
 * Outside a HoverTipHost the tip is the mark's first child, a <title>, as
 * week04-strip.js titled() appends it; inside one it is data-tip and
 * aria-label. A mark without a tip is drawn plain.
 */
export function Tipped({ tag, tip, children, ...attrs }: { tag: string; tip?: string | null; children?: ReactNode } & Record<string, unknown>) {
  const marks = useContext(TipMarks);
  const ref = useRef<Element | null>(null);
  if (!tip) return createElement(tag, attrs, children);
  if (!marks) return createElement(tag, attrs, createElement("title", null, tip), children);
  const el = ref.current;
  const base = typeof attrs.className === "string" ? attrs.className : undefined;
  const className = el && marks.hot === el ? withClass(base, "kit-hot") : el && marks.cooled.has(el) ? (base ?? "") : base;
  return createElement(tag, { ...attrs, ref, "data-tip": tip, "aria-label": tip, className }, children);
}

type Spot = "first" | "last" | "none";

type HostProps = {
  as?: string;
  className?: string;
  tip?: "first" | "none";
  redraws?: string | number;
  children?: ReactNode;
} & Record<string, unknown>;

/**
 * <HoverTipHost id="chart-fame-scatter" className="w5-plot"><StripChart … /></HoverTipHost>:
 * the host element (a div unless `as` says otherwise) with its other props as given.
 */
export default function HoverTipHost({ as = "div", className, tip: initial = "first", redraws, children, ...attrs }: HostProps) {
  const host = useRef<HTMLElement | null>(null);
  const own = useOwnedRef();
  // Marked as React's at the commit, so a page's legacy hover-tip sweep skips it.
  const ref = useCallback(
    (el: HTMLElement | null) => {
      own(el);
      host.current = el;
    },
    [own],
  );
  const [spot, setSpot] = useState<Spot>(initial);
  const [drawn, setDrawn] = useState(redraws);
  if (!Object.is(drawn, redraws)) {
    setDrawn(redraws);
    setSpot("none");
  }
  const [hot, setHot] = useState<{ el: Element; lines: string[] } | null>(null);
  // What the handlers read: the mark hot after the last event, as tips.js's `hot`.
  const hotNow = useRef<{ el: Element; lines: string[] } | null>(null);
  const heat = (next: { el: Element; lines: string[] } | null) => {
    hotNow.current = next;
    setHot(next);
  };
  const [tip, setTip] = useState<Tip | null>(null);
  const [cooled] = useState(() => new WeakSet<Element>());
  const marks = useMemo<Marks>(() => ({ hot: hot?.el ?? null, cooled }), [hot, cooled]);

  const show = (lines: string[], x: number, y: number) => {
    setSpot((s) => (s === "none" ? "last" : s));
    setTip({ lines, x, y });
  };
  const cool = () => {
    if (hotNow.current) cooled.add(hotNow.current.el);
    heat(null);
    setTip((t) => (t ? null : t));
  };
  const onPointerOver = (e: PointerEvent) => {
    const el = (e.target as Element).closest?.("[data-tip]");
    if (!el || !host.current?.contains(el)) return;
    const lines = (el.getAttribute("data-tip") ?? "").split("\n");
    if (el !== hotNow.current?.el) {
      if (hotNow.current) cooled.add(hotNow.current.el);
      heat({ el, lines });
    }
    show(lines, e.clientX, e.clientY);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (hotNow.current) show(hotNow.current.lines, e.clientX, e.clientY);
  };
  const onPointerOut = (e: PointerEvent) => {
    if (hotNow.current && !hotNow.current.el.contains(e.relatedTarget as Node | null)) cool();
  };

  const box = <TipBox key="tip" host={host} tip={tip} />;
  const content = (
    <TipMarks.Provider key={`draw ${String(drawn)}`} value={marks}>
      {children}
    </TipMarks.Provider>
  );
  // className where the server markup has it: before id and role.
  const { "aria-label": label, ...rest } = attrs;
  return createElement(
    as,
    { "aria-label": label, className: withClass(className, "kit-tip-host"), ...rest, ref, onPointerOver, onPointerMove, onPointerOut, onPointerLeave: cool },
    [spot === "first" ? box : null, content, spot === "last" ? box : null],
  );
}
