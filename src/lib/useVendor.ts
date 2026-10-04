// Load a vendored library (public/assets/vendor/) after hydration through the
// page's one loader, src/scripts/runtime/vendor.js, and hand back its global.
// The server and the hydration render see "idle".
import { useEffect, useState } from "react";
import { loadVendor } from "@/scripts/runtime/vendor.js";

export type VendorState<L> = { status: "idle" | "loading" | "ready" | "error"; lib: L | undefined; error: unknown };

const IDLE: VendorState<never> = Object.freeze({ status: "idle", lib: undefined, error: undefined });

/** useVendor("echarts-5.5.1.min.js", "echarts") -> { status, lib: window.echarts once loaded, error }. */
export function useVendor<L = any>(file: string, globalName: string, { enabled = true }: { enabled?: boolean } = {}): VendorState<L> {
  const [state, setState] = useState<VendorState<L>>(IDLE);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const lib = () => (globalThis as Record<string, unknown>)[globalName] as L | undefined;
    setState((s) => (s.status === "ready" ? s : { status: "loading", lib: undefined, error: undefined }));
    loadVendor(file).then(
      () => {
        if (live) setState({ status: "ready", lib: lib(), error: undefined });
      },
      (error: unknown) => {
        if (live) setState({ status: "error", lib: undefined, error });
      },
    );
    return () => {
      live = false;
    };
  }, [file, globalName, enabled]);
  return enabled ? state : IDLE;
}
