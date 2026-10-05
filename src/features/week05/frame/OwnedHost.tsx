// shim: W5-1
// A chart host div marked as React's (useOwnedRef), with its attributes in the
// server's order: aria-label, class, id, role. The hero renders it as is
// before hydration and as HoverTipHost's element (`as`) after, so the hover-tip
// compat sweep never touches #chart-hero-fame. HoverTipHost puts its own ref on
// its element; React passes that ref here as a prop, and this sets it too.
//
// HoverTipHost's pointer handlers read the hot mark from the render before
// the event, so a pointermove that follows a pointerover before React renders
// shows the previous mark's lines: moving straight from one hero dot to the
// next leaves the first dot's name in the tip, where tips.js shows the second.
// Each handler runs inside flushSync here, so the next event sees its state,
// as tips.js's synchronous DOM writes do.
// Until HoverTipHost does both itself (requests/W5-1.md).
import { useCallback, type Ref, type RefObject } from "react";
import { flushSync } from "react-dom";
import { useOwnedRef } from "@/lib/useOwnedRef";

type Props = {
  ref?: Ref<HTMLDivElement>;
  "aria-label"?: string;
  className?: string;
  id?: string;
  role?: string;
} & Record<string, unknown>;

export function OwnedHost({ ref, "aria-label": label, className, id, role, ...rest }: Props) {
  const own = useOwnedRef();
  const both = useCallback(
    (el: HTMLDivElement | null) => {
      own(el);
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as RefObject<HTMLDivElement | null>).current = el;
    },
    [own, ref],
  );
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest))
    props[key] = /^onPointer/.test(key) && typeof value === "function" ? (e: unknown) => flushSync(() => value(e)) : value;
  return <div aria-label={label} className={className} id={id} role={role} {...props} ref={both} />;
}
