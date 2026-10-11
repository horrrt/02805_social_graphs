// surface: sizes and paints <canvas> elements React renders
// Canvas 2D drawing for islands. React renders the <canvas>; these hooks size
// its backing store to the device and hand a painter the context. A painter
// that throws reaches the island's boundary.
import { useCallback, useLayoutEffect, useRef, type DependencyList, type RefObject } from "react";
import { useThrowToBoundary } from "./island";

export type CanvasSize = { width: number; height: number };

// corridor.js surface(): canvases are sized in CSS and backed at device
// resolution (capped at 2), so text stays crisp without every painter knowing
// about devicePixelRatio. The height keeps the ratio of the width and height
// attributes.
function surface(canvas: HTMLCanvasElement) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || canvas.width;
  const height = Math.round(width * (canvas.height / canvas.width));
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

/**
 * Paint the canvas with paint(ctx, { width, height }) after every commit that
 * changes one of `triggers`, through corridor.js surface(). The first paint of
 * a frame runs in the layout effect, before the browser shows the commit;
 * later triggers in the same frame paint once more in the next frame.
 */
export function useCanvasPaint(
  ref: RefObject<HTMLCanvasElement | null>,
  paint: (ctx: CanvasRenderingContext2D, size: CanvasSize) => void,
  triggers: DependencyList,
) {
  const latest = useRef(paint);
  useLayoutEffect(() => {
    latest.current = paint;
  });
  const throwToBoundary = useThrowToBoundary();
  const sched = useRef({ frame: 0, dirty: false });

  const request = useCallback(() => {
    const s = sched.current;
    if (s.frame) {
      s.dirty = true;
      return;
    }
    const canvas = ref.current;
    if (canvas) {
      try {
        const { ctx, width, height } = surface(canvas);
        latest.current(ctx, { width, height });
      } catch (error) {
        throwToBoundary(error);
      }
    }
    s.frame = requestAnimationFrame(() => {
      s.frame = 0;
      if (s.dirty) {
        s.dirty = false;
        request();
      }
    });
  }, [ref, throwToBoundary]);

  useLayoutEffect(() => {
    const s = sched.current;
    return () => {
      cancelAnimationFrame(s.frame);
      s.frame = 0;
      s.dirty = false;
    };
  }, []);

  // The triggers are the caller's dependency list, as useEffect's.
  useLayoutEffect(request, triggers);
}

/**
 * cabinet.js canvasStage(): back the canvas at its rendered size (DPR capped
 * at 2) and call paint(ctx, width, height) once on mount and whenever the
 * canvas resizes; nothing is drawn while it has no size. Returns a stable
 * draw() for repaints the island asks for.
 */
export function useCanvasStage(
  ref: RefObject<HTMLCanvasElement | null>,
  paint: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
): () => void {
  const latest = useRef(paint);
  useLayoutEffect(() => {
    latest.current = paint;
  });
  const throwToBoundary = useThrowToBoundary();

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const c = canvas.getContext("2d") as CanvasRenderingContext2D;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      latest.current(c, rect.width, rect.height);
    } catch (error) {
      throwToBoundary(error);
    }
  }, [ref, throwToBoundary]);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [ref, draw]);

  return draw;
}
