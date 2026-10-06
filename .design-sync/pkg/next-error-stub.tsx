// Stands in for next/error in the Claude Design bundle. The kit imports
// src/lib/island.tsx only for report(); island() and its catchError
// boundary are never called there, so a pass-through keeps Next out.
import type { ComponentType, ReactNode } from "react";

export type ErrorInfo = { error: Error; reset: () => void; unstable_retry: () => void };

export function catchError<P>(_fallback: (props: P, info: ErrorInfo) => ReactNode) {
  return function Boundary({ children }: P & { children?: ReactNode }) {
    return <>{children}</>;
  } as unknown as ComponentType<P & { children?: ReactNode }>;
}
