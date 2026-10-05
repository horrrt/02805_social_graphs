// surface: listens on document, outside React's tree
// Document listeners for islands. React listens at the root, so a synthetic
// stopPropagation never stops these (spike.md, finding h): an outside-click
// closer asks whether the target lies inside one of its refs instead.
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/** Listen for `type` on document while mounted. The handler may change on every render. */
export function useDocumentEvent<K extends keyof DocumentEventMap>(
  type: K,
  handler: (event: DocumentEventMap[K]) => void,
  options: { capture?: boolean; passive?: boolean; once?: boolean } = {},
) {
  const latest = useRef(handler);
  useLayoutEffect(() => {
    latest.current = handler;
  });
  const { capture = false, passive, once = false } = options;
  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener(type, (event) => latest.current(event), { capture, passive, once, signal: controller.signal });
    return () => controller.abort();
  }, [type, capture, passive, once]);
}

/**
 * Call onClose on a document click whose target lies outside every ref, and on
 * Escape when `escape` is set. Pass an onClose that does nothing while closed.
 */
export function useOutsideClose(
  refs: ReadonlyArray<RefObject<Element | null>>,
  onClose: (event: MouseEvent | KeyboardEvent) => void,
  { escape = false }: { escape?: boolean } = {},
) {
  const latest = useRef({ refs, onClose });
  useLayoutEffect(() => {
    latest.current = { refs, onClose };
  });
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target as Node | null;
        if (latest.current.refs.some((ref) => ref.current?.contains(target))) return;
        latest.current.onClose(event);
      },
      { signal },
    );
    if (escape)
      document.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") latest.current.onClose(event);
        },
        { signal },
      );
    return () => controller.abort();
  }, [escape]);
}
