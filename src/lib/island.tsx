// Every client component on a page is an island made here, so a failure in
// one leaves the rest of the page alone (plan.json architecture 4). The
// island sits in a catchError boundary whose fallback renders the island's
// server markup (its Placeholder) and logs the error once. Render errors and
// effect errors reach the boundary; hooks that run async work or library code
// catch it and rethrow through useThrowToBoundary. An error thrown while React
// hydrates would make it client-render the whole page instead (spike.md,
// finding f), so the render fault point fires only once hydrated.
import { catchError, type ErrorInfo } from "next/error";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { faultPoint, registerIsland } from "@/scripts/runtime/islands.js";
import { islandOptions, type IslandOptions } from "./islandOptions";
import { useHydrated } from "./useHydrated";

const IslandContext = createContext<string | null>(null);

/** The one line a failed island logs: console.error("a page script failed", name, error). */
export function report(name: string, error: unknown) {
  console.error("a page script failed", name, error);
}

/** A function that rethrows an error from an effect or a callback into the island's boundary. */
export function useThrowToBoundary(): (error: unknown) => void {
  const [, setState] = useState(0);
  return useCallback(
    (error: unknown) =>
      setState(() => {
        throw error;
      }),
    [],
  );
}

/** Mark the island ready (performance mark "island:ready:<name>") once `ready` is true. */
export function useIslandReady(ready = true) {
  const name = useContext(IslandContext);
  const marked = useRef(false);
  useEffect(() => {
    if (!ready || !name || marked.current) return;
    marked.current = true;
    performance.mark(`island:ready:${name}`);
  }, [ready, name]);
}

// Errors already reported, so StrictMode's second effect run logs nothing.
const reported = new WeakSet<object>();

function Fallback<P extends object>({ name, Placeholder, props, error }: { name: string; Placeholder: ComponentType<P>; props: P; error: unknown }) {
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    if (error !== null && typeof error === "object") {
      if (reported.has(error)) return;
      reported.add(error);
    }
    report(name, error);
  }, [name, error]);
  return <Placeholder {...props} />;
}

function Inner<P extends object>({ name, Component, props }: { name: string; Component: ComponentType<P>; props: P }) {
  const hydrated = useHydrated();
  if (hydrated) faultPoint(name, "render");
  useEffect(() => {
    faultPoint(name, "effect");
    performance.mark(`island:mounted:${name}`);
  }, [name]);
  return (
    <IslandContext.Provider value={name}>
      <Component {...props} />
    </IslandContext.Provider>
  );
}

/**
 * island("week05/fame/HeroFame", HeroFame, HeroFamePlaceholder, { roots: ["#chart-hero-fame"] })
 * -> the component a page renders. Placeholder renders exactly the server
 * markup at the island's spot. Islands take no children.
 */
export function island<P extends object>(
  name: string,
  Component: ComponentType<P>,
  Placeholder: ComponentType<P>,
  options: IslandOptions,
): ComponentType<P> {
  registerIsland(name, islandOptions(name, options));
  const Boundary = catchError((props: P, { error }: ErrorInfo) => <Fallback name={name} Placeholder={Placeholder} props={props} error={error} />);
  function Island(props: P): ReactNode {
    return (
      <Boundary {...props}>
        <Inner name={name} Component={Component} props={props} />
      </Boundary>
    );
  }
  Island.displayName = `island(${name})`;
  return Island;
}
